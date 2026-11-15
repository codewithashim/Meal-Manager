import { db } from "@/services/db.service";
import { PermissionService } from "@/services/permission.service";
import { AuditService } from "@/services/audit.service";
import { Prisma, Role } from "@prisma/client";
import { RecordPaymentInput, recordPaymentSchema } from "@/lib/validations/billing";
import { getMessMonthStr, getMonthRange } from "@/lib/month";
import { sumBazaarByMember } from "@/features/expenses/payer";

function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export type ServiceResult = {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
};

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// Bill fields that are derived from the month's data. Compared on sync so unchanged bills aren't rewritten.
const DERIVED_FIELDS = [
  "totalMeals",
  "mealRate",
  "mealCost",
  "roomRent",
  "utilityShare",
  "otherCharges",
  "electricityShare",
  "gasShare",
  "waterShare",
  "khalaShare",
  "wifiShare",
  "bazarDeposited",
  "totalBill",
  "totalPaid",
  "dueAmount",
] as const;

type MonthFigures = Awaited<ReturnType<typeof BillingService.loadMonthFigures>>;
export type ComputedBill = Awaited<ReturnType<typeof BillingService.computeMonthBills>>[number];

/**
 * Monthly bills are fully derived: meals, bazaar (credited to whoever paid), utility bills logged as
 * expenses, rent and payments. Nobody generates them by hand; every change re-syncs the affected month.
 */
export class BillingService {
  public static async getMonthlyBills(actorRole: Role, actorPermissions: string[] | undefined, monthStr: string) {
    PermissionService.enforce(actorRole, "BILLS", "READ", actorPermissions);
    if (!MONTH_RE.test(monthStr)) throw new Error("Invalid month.");

    await BillingService.syncMonth(monthStr);

    const bills = await db.monthlyBill.findMany({
      where: { month: monthStr, user: { role: { not: Role.ADMIN } } },
      include: { user: { select: { id: true, name: true, email: true, monthlyRent: true } } },
      orderBy: { user: { name: "asc" } },
    });

    const sum = (pick: (b: (typeof bills)[number]) => number) => bills.reduce((acc, b) => acc + (pick(b) || 0), 0);
    const count = bills.length;
    const perMember = (total: number) => (count > 0 ? total / count : 0);

    const totalMessMeals = sum((b) => b.totalMeals);
    const mealRate = count > 0 ? bills[0].mealRate : 0;
    const totals = {
      electricity: sum((b) => b.electricityShare),
      gas: sum((b) => b.gasShare),
      water: sum((b) => b.waterShare),
      khala: sum((b) => b.khalaShare),
      wifi: sum((b) => b.wifiShare),
      other: sum((b) => b.otherCharges),
    };

    return {
      bills,
      totalBilled: sum((b) => b.totalBill),
      totalCollected: sum((b) => b.totalPaid),
      totalDue: sum((b) => Math.max(0, b.dueAmount)),
      isCurrentMonth: monthStr === getMessMonthStr(),
      lastUpdated: bills.reduce<Date | null>((acc, b) => (!acc || b.updatedAt > acc ? b.updatedAt : acc), null),
      messSummary: {
        activeMembersCount: count,
        totalMessMeals,
        mealRate,
        totalFoodExpense: totalMessMeals * mealRate,
        totalElectricity: totals.electricity,
        totalGas: totals.gas,
        totalWater: totals.water,
        totalKhala: totals.khala,
        totalWifi: totals.wifi,
        totalOther: totals.other,
        totalRent: sum((b) => b.roomRent),
        perMemberElectricity: perMember(totals.electricity),
        perMemberGas: perMember(totals.gas),
        perMemberWater: perMember(totals.water),
        perMemberKhala: perMember(totals.khala),
        perMemberWifi: perMember(totals.wifi),
        perMemberOther: perMember(totals.other),
      },
    };
  }

  // Meal rate, meals, payments and bazaar credit per member for one month.
  public static async loadMonthFigures(month: string) {
    const { start, end } = getMonthRange(month);
    const [foodExpenses, messMealsAgg, userMealsAgg, userPaymentsAgg] = await Promise.all([
      db.expense.findMany({
        where: { category: "FOOD", date: { gte: start, lte: end } },
        select: { amount: true, category: true, createdBy: true, memberId: true, paidFromMessFund: true },
      }),
      db.mealRecord.aggregate({
        where: { date: { gte: start, lte: end }, user: { role: { not: Role.ADMIN } } },
        _sum: { totalMeals: true },
      }),
      db.mealRecord.groupBy({
        by: ["userId"],
        where: { date: { gte: start, lte: end } },
        _sum: { totalMeals: true },
      }),
      db.payment.groupBy({ by: ["userId"], where: { month }, _sum: { amount: true } }),
    ]);

    const totalFoodExpense = foodExpenses.reduce((acc, e) => acc + e.amount, 0);
    const totalMessMeals = messMealsAgg._sum.totalMeals || 0;

    return {
      mealRate: totalMessMeals > 0 ? totalFoodExpense / totalMessMeals : 0,
      meals: new Map(userMealsAgg.map((u) => [u.userId, u._sum.totalMeals || 0])),
      payments: new Map(userPaymentsAgg.map((p) => [p.userId, p._sum.amount || 0])),
      bazaar: sumBazaarByMember(foodExpenses),
    };
  }

  // Utility and running costs logged as expenses for the month, by bill line.
  private static async loggedUtilityTotals(month: string) {
    const { start, end } = getMonthRange(month);
    const grouped = await db.expense.groupBy({
      by: ["category"],
      where: { date: { gte: start, lte: end } },
      _sum: { amount: true },
    });
    const totalFor = (category: string) => grouped.find((g) => g.category === category)?._sum.amount || 0;
    return {
      electricity: totalFor("ELECTRICITY"),
      gas: totalFor("GAS"),
      water: totalFor("WATER"),
      khala: totalFor("STAFF_SALARY"),
      wifi: totalFor("INTERNET"),
      other: totalFor("OTHER") + totalFor("MAINTENANCE") + totalFor("CLEANING"),
    };
  }

  // Who owes a bill for the month: active members who had joined by its end, plus anyone with activity in it
  // (so someone who left mid-month is still billed for what they used).
  private static async billableMembers(month: string, figures: MonthFigures) {
    const { end } = getMonthRange(month);
    const users = await db.user.findMany({
      where: { role: { not: Role.ADMIN } },
      select: { id: true, name: true, email: true, monthlyRent: true, status: true, joiningDate: true },
      orderBy: { name: "asc" },
    });
    return users.filter(
      (u) =>
        (u.status === "ACTIVE" && u.joiningDate <= end) ||
        figures.meals.has(u.id) ||
        figures.payments.has(u.id) ||
        figures.bazaar.has(u.id)
    );
  }

  private static settle(
    userId: string,
    figures: MonthFigures,
    charges: { roomRent: number; utilityShare: number; otherCharges: number }
  ) {
    const totalMeals = figures.meals.get(userId) || 0;
    const mealCost = totalMeals * figures.mealRate;
    const totalBill = mealCost + charges.roomRent + charges.utilityShare + charges.otherCharges;
    const totalPaid = figures.payments.get(userId) || 0;
    const bazarDeposited = figures.bazaar.get(userId) || 0;
    const credit = bazarDeposited + totalPaid;

    let status: "PAID" | "PARTIALLY_PAID" | "UNPAID" = "UNPAID";
    if (credit >= totalBill && totalBill > 0) status = "PAID";
    else if (credit > 0) status = "PARTIALLY_PAID";

    return { totalMeals, mealRate: figures.mealRate, mealCost, bazarDeposited, totalBill, totalPaid, dueAmount: totalBill - credit, status };
  }

  // Every member's bill for the month, computed from current data. Shared costs are split equally.
  public static async computeMonthBills(month: string) {
    const figures = await BillingService.loadMonthFigures(month);
    const [members, utilities] = await Promise.all([
      BillingService.billableMembers(month, figures),
      BillingService.loggedUtilityTotals(month),
    ]);

    const share = (total: number) => total / Math.max(1, members.length);
    const electricityShare = share(utilities.electricity);
    const gasShare = share(utilities.gas);
    const waterShare = share(utilities.water);
    const khalaShare = share(utilities.khala);
    const wifiShare = share(utilities.wifi);
    const otherCharges = share(utilities.other);
    const utilityShare = electricityShare + gasShare + waterShare + khalaShare + wifiShare;

    return members.map((member) => {
      const roomRent = member.monthlyRent || 0;
      return {
        userId: member.id,
        roomRent,
        utilityShare,
        otherCharges,
        electricityShare,
        gasShare,
        waterShare,
        khalaShare,
        wifiShare,
        ...BillingService.settle(member.id, figures, { roomRent, utilityShare, otherCharges }),
      };
    });
  }

  /**
   * Brings the stored bills for a month in line with its data: creates, updates or removes bills as needed.
   * Future months are skipped. Only bills whose figures changed are written.
   */
  public static async syncMonth(month: string): Promise<void> {
    if (!MONTH_RE.test(month) || month > getMessMonthStr()) return;

    const [computed, existing] = await Promise.all([
      BillingService.computeMonthBills(month),
      db.monthlyBill.findMany({ where: { month } }),
    ]);
    const existingByUser = new Map(existing.map((b) => [b.userId, b]));
    const computedUsers = new Set(computed.map((c) => c.userId));

    const changed = (row: ComputedBill) => {
      const bill = existingByUser.get(row.userId);
      if (!bill) return true;
      return bill.status !== row.status || DERIVED_FIELDS.some((f) => Math.abs((bill[f] || 0) - row[f]) > 0.005);
    };

    const writes: Prisma.PrismaPromise<unknown>[] = computed.filter(changed).map(({ userId, ...fields }) =>
      db.monthlyBill.upsert({
        where: { userId_month: { userId, month } },
        update: fields,
        create: { userId, month, ...fields },
      })
    );
    const staleIds = existing.filter((b) => !computedUsers.has(b.userId)).map((b) => b.id);
    if (staleIds.length) writes.push(db.monthlyBill.deleteMany({ where: { id: { in: staleIds } } }));
    if (writes.length === 0) return;

    try {
      await db.$transaction(writes);
    } catch (err) {
      // Two requests syncing a new month at once can race on the unique key; the other one already wrote it.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return;
      throw err;
    }
  }

  // Re-syncs every month touched by a change, logging rather than failing the change itself.
  public static async syncMonths(...months: (string | null | undefined)[]) {
    for (const month of new Set(months.filter((m): m is string => !!m))) {
      await BillingService.syncMonth(month).catch((err) => console.error(`Bill sync failed for ${month}:`, err));
    }
  }

  public static async getPayments(actorRole: Role, actorPermissions?: string[], monthStr?: string) {
    PermissionService.enforce(actorRole, "PAYMENTS", "READ", actorPermissions);

    const payments = await db.payment.findMany({
      where: monthStr && monthStr !== "ALL" ? { month: monthStr } : {},
      include: { user: { select: { name: true, email: true } } },
      orderBy: { date: "desc" },
    });

    return { payments, totalCollected: payments.reduce((acc, p) => acc + p.amount, 0) };
  }

  public static async recordPayment(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    data: RecordPaymentInput
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "PAYMENTS", "CREATE", actorPermissions);

    const parsed = recordPaymentSchema.safeParse(data);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const newPayment = await db.payment.create({
      data: {
        userId: parsed.data.userId,
        amount: parsed.data.amount,
        date: parseDateString(parsed.data.date),
        month: parsed.data.month,
        paymentMethod: parsed.data.paymentMethod,
        transactionId: parsed.data.transactionId || null,
        note: parsed.data.note || null,
        recordedBy: actorId,
      },
    });

    await BillingService.syncMonths(parsed.data.month);

    await AuditService.logActivity({
      actorId,
      action: "RECORD_PAYMENT",
      entity: "Payment",
      entityId: newPayment.id,
      details: `Recorded payment of ৳${newPayment.amount} for month ${newPayment.month}`,
    });

    return { success: true, payment: newPayment };
  }
}
