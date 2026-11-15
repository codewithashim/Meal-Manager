import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { db } from "@/services/db.service";
import { PermissionService } from "@/services/permission.service";
import { AuditService } from "@/services/audit.service";
import { getMessMonthStr, getMonthRange } from "@/lib/month";
import { expensePayerId } from "@/features/expenses/payer";
import { BillingService } from "@/features/billing/services/billing.service";
import {
  ChangePasswordInput,
  UpdateOwnProfileInput,
  changePasswordSchema,
  profileMonthSchema,
  profileUserIdSchema,
  updateOwnProfileSchema,
} from "@/lib/validations/profile";

interface Actor {
  id: string;
  role: Role;
  permissions?: string[];
}

const BILL_HISTORY_MONTHS = 12;

export class ProfileService {
  // Members can only see themselves; anyone who can read the member directory can see any member.
  public static canView(actor: Actor, targetUserId: string) {
    return actor.id === targetUserId || PermissionService.check(actor.role, "USERS", "READ", actor.permissions);
  }

  public static async getOverview(actor: Actor, targetUserId: string, monthStr: string) {
    const userId = profileUserIdSchema.parse(targetUserId);
    const month = profileMonthSchema.parse(monthStr);

    if (!ProfileService.canView(actor, userId)) {
      throw new Error("Forbidden: You can only view your own profile.");
    }

    const { start, end } = getMonthRange(month);
    // Bills are derived automatically; bring this month's up to date before reading it.
    await BillingService.syncMonths(month);

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        nidNumber: true,
        emergencyContact: true,
        address: true,
        occupation: true,
        joiningDate: true,
        leavingDate: true,
        monthlyRent: true,
        mealStatus: true,
      },
    });
    if (!user) return null;

    const [
      assignment,
      mealRecords,
      messFood,
      messMeals,
      loggedOrPaid,
      payments,
      bill,
      billHistory,
      openBills,
      pendingComplaints,
    ] = await Promise.all([
      db.roomAssignment.findFirst({
        where: { userId, isActive: true },
        include: { seat: { include: { room: true } } },
      }),
      db.mealRecord.findMany({
        where: { userId, date: { gte: start, lte: end } },
        orderBy: { date: "asc" },
      }),
      db.expense.aggregate({
        where: { category: "FOOD", date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      db.mealRecord.aggregate({
        where: { date: { gte: start, lte: end }, user: { role: { not: Role.ADMIN } } },
        _sum: { totalMeals: true },
      }),
      // Older entries have no payer and fall back to whoever logged them, so fetch both and filter by payer below.
      db.expense.findMany({
        where: { date: { gte: start, lte: end }, OR: [{ memberId: userId }, { createdBy: userId }] },
        orderBy: { date: "desc" },
      }),
      db.payment.findMany({
        where: { userId, month },
        orderBy: { date: "desc" },
      }),
      db.monthlyBill.findUnique({ where: { userId_month: { userId, month } } }),
      db.monthlyBill.findMany({
        where: { userId },
        orderBy: { month: "desc" },
        take: BILL_HISTORY_MONTHS,
        select: {
          id: true,
          month: true,
          totalMeals: true,
          totalBill: true,
          totalPaid: true,
          bazarDeposited: true,
          dueAmount: true,
          status: true,
        },
      }),
      db.monthlyBill.findMany({
        where: { userId, dueAmount: { gt: 0 } },
        select: { dueAmount: true },
      }),
      db.complaint.count({ where: { userId, status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    ]);

    const expenses = loggedOrPaid.filter((e) => expensePayerId(e) === userId);

    const meals = mealRecords.reduce(
      (acc, r) => ({
        breakfast: acc.breakfast + r.breakfast,
        lunch: acc.lunch + r.lunch,
        dinner: acc.dinner + r.dinner,
        total: acc.total + r.totalMeals,
      }),
      { breakfast: 0, lunch: 0, dinner: 0, total: 0 }
    );

    // The bill carries the month's rate; members without a bill (e.g. admins) see the same rate computed directly.
    const totalFood = messFood._sum.amount || 0;
    const totalMessMeals = messMeals._sum.totalMeals || 0;
    const mealRate = bill ? bill.mealRate : totalMessMeals > 0 ? totalFood / totalMessMeals : 0;

    const bazaarDeposited = expenses.filter((e) => e.category === "FOOD").reduce((acc, e) => acc + e.amount, 0);
    const totalExpensesLogged = expenses.reduce((acc, e) => acc + e.amount, 0);
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

    const estimatedMealCost = meals.total * mealRate;
    const estimatedShared = 0;
    const estimatedBill = estimatedMealCost + user.monthlyRent + estimatedShared;
    const estimatedBalance = estimatedBill - bazaarDeposited - totalPaid;

    return {
      month,
      user,
      seat: assignment?.seat
        ? {
            roomName: assignment.seat.room.name,
            floor: assignment.seat.room.floor,
            seatNumber: assignment.seat.seatNumber,
            since: assignment.startDate.toISOString(),
          }
        : null,
      meals: {
        ...meals,
        activeDays: mealRecords.filter((r) => r.totalMeals > 0).length,
        records: mealRecords.map((r) => ({
          id: r.id,
          date: r.date.toISOString().slice(0, 10),
          breakfast: r.breakfast,
          lunch: r.lunch,
          dinner: r.dinner,
          totalMeals: r.totalMeals,
          note: r.note,
        })),
      },
      mealRate,
      isMonthClosed: month < getMessMonthStr(),
      expenses: {
        bazaarDeposited,
        totalLogged: totalExpensesLogged,
        items: expenses.map((e) => ({
          id: e.id,
          title: e.title,
          category: e.category,
          amount: e.amount,
          date: e.date.toISOString().slice(0, 10),
          description: e.description,
        })),
      },
      payments: {
        totalPaid,
        items: payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          date: p.date.toISOString().slice(0, 10),
          paymentMethod: p.paymentMethod,
          transactionId: p.transactionId,
          note: p.note,
        })),
      },
      bill: bill ? { ...bill, user: { name: user.name, email: user.email } } : null,
      estimate: {
        mealCost: estimatedMealCost,
        roomRent: user.monthlyRent,
        shared: estimatedShared,
        total: estimatedBill,
        balance: estimatedBalance,
      },
      billHistory,
      totalOutstanding: openBills.reduce((acc, b) => acc + b.dueAmount, 0),
      pendingComplaints,
    };
  }

  public static async updateOwnProfile(actorId: string, data: UpdateOwnProfileInput) {
    const parsed = updateOwnProfileSchema.safeParse(data);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    // Phone is a login identifier, so it must stay unique.
    if (parsed.data.phone) {
      const taken = await db.user.findFirst({
        where: { phone: parsed.data.phone, id: { not: actorId } },
        select: { id: true },
      });
      if (taken) return { error: "That phone number is already used by another member." };
    }

    const updated = await db.user.update({
      where: { id: actorId },
      data: parsed.data,
      select: { id: true, name: true, email: true },
    });

    await AuditService.logActivity({
      actorId,
      action: "UPDATE_PROFILE",
      entity: "User",
      entityId: actorId,
      details: `Updated own profile details (${updated.email})`,
    });

    return { success: true };
  }

  public static async changePassword(actorId: string, data: ChangePasswordInput) {
    const parsed = changePasswordSchema.safeParse(data);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const user = await db.user.findUnique({ where: { id: actorId }, select: { passwordHash: true } });
    if (!user) return { error: "Account not found." };

    const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!matches) return { error: "Current password is incorrect." };

    await db.user.update({
      where: { id: actorId },
      data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
    });

    await AuditService.logActivity({
      actorId,
      action: "CHANGE_PASSWORD",
      entity: "User",
      entityId: actorId,
      details: "Changed own password",
    });

    return { success: true };
  }
}

export type ProfileOverview = NonNullable<Awaited<ReturnType<typeof ProfileService.getOverview>>>;
