import { db } from "@/services/db.service";
import { PermissionService } from "@/services/permission.service";
import { AuditService } from "@/services/audit.service";
import { Role } from "@prisma/client";
import {
  GenerateBillsInput,
  RecordPaymentInput,
  generateBillsSchema,
  recordPaymentSchema,
} from "@/lib/validations/billing";

function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export type ServiceResult<T = any> = {
  success?: boolean;
  error?: string;
  [key: string]: any;
};

export class BillingService {
  public static async getMonthlyBills(
    actorRole: Role,
    actorPermissions?: string[],
    monthStr?: string
  ) {
    PermissionService.enforce(actorRole, "BILLS", "READ", actorPermissions);

    const bills = await db.monthlyBill.findMany({
      where: {
        ...(monthStr ? { month: monthStr } : {}),
        user: { role: { not: Role.ADMIN } },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            monthlyRent: true,
          },
        },
      },
      orderBy: { generatedAt: "desc" },
    });

    const totalBilled = bills.reduce((acc, b) => acc + b.totalBill, 0);
    const totalCollected = bills.reduce((acc, b) => acc + b.totalPaid, 0);
    const totalDue = bills.reduce((acc, b) => acc + b.dueAmount, 0);

    // Calculate Central Mess Summary statistics for the month
    const activeMembersCount = bills.length;
    const totalMessMeals = bills.reduce((acc, b) => acc + b.totalMeals, 0);
    const mealRate = bills.length > 0 ? bills[0].mealRate : 0;
    const totalFoodExpense = totalMessMeals * mealRate;

    const totalElectricity = bills.reduce((acc, b) => acc + (b.electricityShare || 0), 0);
    const totalGas = bills.reduce((acc, b) => acc + (b.gasShare || 0), 0);
    const totalWater = bills.reduce((acc, b) => acc + (b.waterShare || 0), 0);
    const totalKhala = bills.reduce((acc, b) => acc + (b.khalaShare || 0), 0);
    const totalWifi = bills.reduce((acc, b) => acc + (b.wifiShare || 0), 0);
    const totalOther = bills.reduce((acc, b) => acc + (b.otherCharges || 0), 0);
    const totalRent = bills.reduce((acc, b) => acc + (b.roomRent || 0), 0);

    const messSummary = {
      activeMembersCount,
      totalMessMeals,
      mealRate,
      totalFoodExpense,
      totalElectricity,
      totalGas,
      totalWater,
      totalKhala,
      totalWifi,
      totalOther,
      totalRent,
      perMemberElectricity: activeMembersCount > 0 ? totalElectricity / activeMembersCount : 0,
      perMemberGas: activeMembersCount > 0 ? totalGas / activeMembersCount : 0,
      perMemberWater: activeMembersCount > 0 ? totalWater / activeMembersCount : 0,
      perMemberKhala: activeMembersCount > 0 ? totalKhala / activeMembersCount : 0,
      perMemberWifi: activeMembersCount > 0 ? totalWifi / activeMembersCount : 0,
      perMemberOther: activeMembersCount > 0 ? totalOther / activeMembersCount : 0,
    };

    return { bills, totalBilled, totalCollected, totalDue, messSummary };
  }

  public static async getExpenseSummaryForMonth(
    actorRole: Role,
    actorPermissions?: string[],
    monthStr?: string
  ) {
    PermissionService.enforce(actorRole, "BILLS", "READ", actorPermissions);

    const targetMonth = monthStr || new Date().toISOString().slice(0, 7);
    const [year, mNum] = targetMonth.split("-").map(Number);
    const startDate = new Date(Date.UTC(year, mNum - 1, 1));
    const endDate = new Date(Date.UTC(year, mNum, 0, 23, 59, 59));

    const activeUsersCount = await db.user.count({
      where: { status: "ACTIVE", role: { not: Role.ADMIN } },
    });

    const expensesGrouped = await db.expense.groupBy({
      by: ["category"],
      where: {
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    const categoryMap: Record<string, number> = {};
    expensesGrouped.forEach((item) => {
      categoryMap[item.category] = item._sum.amount || 0;
    });

    const totalFood = categoryMap["FOOD"] || 0;
    const totalElectricity = categoryMap["ELECTRICITY"] || 0;
    const totalGas = categoryMap["GAS"] || 0;
    const totalWater = categoryMap["WATER"] || 0;
    const totalKhala = categoryMap["STAFF_SALARY"] || 0;
    const totalWifi = categoryMap["INTERNET"] || 0;
    const totalOther = (categoryMap["OTHER"] || 0) + (categoryMap["MAINTENANCE"] || 0) + (categoryMap["CLEANING"] || 0);

    const count = Math.max(1, activeUsersCount);

    return {
      activeUsersCount,
      totalFood,
      totalElectricity,
      totalGas,
      totalWater,
      totalKhala,
      totalWifi,
      totalOther,
      perMember: {
        electricity: totalElectricity / count,
        gas: totalGas / count,
        water: totalWater / count,
        khala: totalKhala / count,
        wifi: totalWifi / count,
        other: totalOther / count,
      },
    };
  }

  public static async generateMonthlyBills(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    data: GenerateBillsInput
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "BILLS", "MANAGE", actorPermissions);

    const parsed = generateBillsSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const {
      month,
      utilitySharePerMember,
      otherChargesPerMember,
      electricityBill = 0,
      gasBill = 0,
      waterBill = 0,
      khalaBill = 0,
      wifiBill = 0,
      isTotalMessBills = true,
    } = parsed.data;

    const [year, mNum] = month.split("-").map(Number);
    const startDate = new Date(Date.UTC(year, mNum - 1, 1));
    const endDate = new Date(Date.UTC(year, mNum, 0, 23, 59, 59));

    const foodExpenses = await db.expense.aggregate({
      where: {
        category: "FOOD",
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });
    const totalFoodExpense = foodExpenses._sum.amount || 0;

    const monthMealsAgg = await db.mealRecord.aggregate({
      where: {
        date: { gte: startDate, lte: endDate },
        user: { role: { not: Role.ADMIN } },
      },
      _sum: { totalMeals: true },
    });
    const totalMessMeals = monthMealsAgg._sum.totalMeals || 0;

    const mealRate = totalMessMeals > 0 ? totalFoodExpense / totalMessMeals : 0;

    const users = await db.user.findMany({
      where: { status: "ACTIVE", role: { not: Role.ADMIN } },
      select: { id: true, name: true, monthlyRent: true },
    });

    const activeUsersCount = Math.max(1, users.length);

    // Calculate per member breakdown
    const electricityShare = isTotalMessBills ? electricityBill / activeUsersCount : electricityBill;
    const gasShare = isTotalMessBills ? gasBill / activeUsersCount : gasBill;
    const waterShare = isTotalMessBills ? waterBill / activeUsersCount : waterBill;
    const khalaShare = isTotalMessBills ? khalaBill / activeUsersCount : khalaBill;
    const wifiShare = isTotalMessBills ? wifiBill / activeUsersCount : wifiBill;

    const userMealsAgg = await db.mealRecord.groupBy({
      by: ["userId"],
      where: { date: { gte: startDate, lte: endDate } },
      _sum: { totalMeals: true },
    });
    const userMealsMap = new Map(userMealsAgg.map((u) => [u.userId, u._sum.totalMeals || 0]));

    const userPaymentsAgg = await db.payment.groupBy({
      by: ["userId"],
      where: { month },
      _sum: { amount: true },
    });
    const userPaymentsMap = new Map(userPaymentsAgg.map((p) => [p.userId, p._sum.amount || 0]));

    const userBazarAgg = await db.expense.groupBy({
      by: ["createdBy"],
      where: {
        category: "FOOD",
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });
    const userBazarMap = new Map(userBazarAgg.map((b) => [b.createdBy, b._sum.amount || 0]));

    const billOperations = users.map((user) => {
      const userTotalMeals = userMealsMap.get(user.id) || 0;
      const mealCost = userTotalMeals * mealRate;
      const roomRent = user.monthlyRent || 0;
      
      const totalUtilityShare = electricityShare + gasShare + waterShare + khalaShare + wifiShare + (utilitySharePerMember || 0);
      const otherCharges = otherChargesPerMember || 0;

      const totalBill = mealCost + roomRent + totalUtilityShare + otherCharges;
      const totalPaid = userPaymentsMap.get(user.id) || 0;
      const bazarDeposited = userBazarMap.get(user.id) || 0;
      
      const totalCredit = bazarDeposited + totalPaid;
      const dueAmount = totalBill - totalCredit;

      let status: "PAID" | "PARTIALLY_PAID" | "UNPAID" = "UNPAID";
      if (totalCredit >= totalBill && totalBill > 0) {
        status = "PAID";
      } else if (totalCredit > 0) {
        status = "PARTIALLY_PAID";
      }

      return db.monthlyBill.upsert({
        where: {
          userId_month: {
            userId: user.id,
            month,
          },
        },
        update: {
          totalMeals: userTotalMeals,
          mealRate,
          mealCost,
          roomRent,
          utilityShare: totalUtilityShare,
          otherCharges,
          electricityShare,
          gasShare,
          waterShare,
          khalaShare,
          wifiShare,
          bazarDeposited,
          totalBill,
          totalPaid,
          dueAmount,
          status,
        },
        create: {
          userId: user.id,
          month,
          totalMeals: userTotalMeals,
          mealRate,
          mealCost,
          roomRent,
          utilityShare: totalUtilityShare,
          otherCharges,
          electricityShare,
          gasShare,
          waterShare,
          khalaShare,
          wifiShare,
          bazarDeposited,
          totalBill,
          totalPaid,
          dueAmount,
          status,
        },
      });
    });

    await db.$transaction(billOperations);

    await AuditService.logActivity({
      actorId,
      action: "GENERATE_BILLS",
      entity: "MonthlyBill",
      entityId: month,
      details: `Generated monthly bills for ${users.length} members for ${month}. Meal Rate: ৳${mealRate.toFixed(2)}`,
    });

    return { success: true, count: users.length, mealRate };
  }

  public static async getPayments(
    actorRole: Role,
    actorPermissions?: string[],
    monthStr?: string
  ) {
    PermissionService.enforce(actorRole, "PAYMENTS", "READ", actorPermissions);

    const where: any = {};
    if (monthStr && monthStr !== "ALL") {
      where.month = monthStr;
    }

    const payments = await db.payment.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { date: "desc" },
    });

    const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

    return { payments, totalCollected };
  }

  public static async recordPayment(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    data: RecordPaymentInput
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "PAYMENTS", "CREATE", actorPermissions);

    const parsed = recordPaymentSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const paymentDate = parseDateString(parsed.data.date);

    const newPayment = await db.payment.create({
      data: {
        userId: parsed.data.userId,
        amount: parsed.data.amount,
        date: paymentDate,
        month: parsed.data.month,
        paymentMethod: parsed.data.paymentMethod,
        transactionId: parsed.data.transactionId || null,
        note: parsed.data.note || null,
        recordedBy: actorId,
      },
    });

    const existingBill = await db.monthlyBill.findUnique({
      where: {
        userId_month: {
          userId: parsed.data.userId,
          month: parsed.data.month,
        },
      },
    });

    if (existingBill) {
      const newTotalPaid = existingBill.totalPaid + parsed.data.amount;
      const newDueAmount = Math.max(0, existingBill.totalBill - newTotalPaid);
      let status: "PAID" | "PARTIALLY_PAID" | "UNPAID" = "UNPAID";
      if (newTotalPaid >= existingBill.totalBill && existingBill.totalBill > 0) {
        status = "PAID";
      } else if (newTotalPaid > 0) {
        status = "PARTIALLY_PAID";
      }

      await db.monthlyBill.update({
        where: { id: existingBill.id },
        data: {
          totalPaid: newTotalPaid,
          dueAmount: newDueAmount,
          status,
        },
      });
    }

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
