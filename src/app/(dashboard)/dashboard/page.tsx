import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { DashboardClientView } from "@/features/dashboard/components/DashboardClientView";

export const metadata = {
  title: "Dashboard | Meal Manager System",
  description:
    "Real-time meal management dashboard, live meal rate calculation, seat allocation & operational overview.",
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id || "";
  const role = session?.user?.role || Role.USER;
  const userName = session?.user?.name || "Member";

  // Date strings
  const now = new Date();
  const currentMonthStr = now.toISOString().substring(0, 7); // YYYY-MM
  const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

  const [year, month] = currentMonthStr.split("-").map(Number);
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  const [tYear, tMonth, tDay] = todayStr.split("-").map(Number);
  const startOfToday = new Date(Date.UTC(tYear, tMonth - 1, tDay, 0, 0, 0));
  const endOfToday = new Date(Date.UTC(tYear, tMonth - 1, tDay, 23, 59, 59));

  // Default values for resilience
  let systemSetting = null;
  let userCount = 0;
  let activeMealUsers = 0;
  let roomCount = 0;
  let totalCapacity = 0;
  let occupiedSeats = 0;
  let totalExpenses = 0;
  let totalFoodExpense = 0;
  let totalPayments = 0;
  let messTotalMeals = 0;
  let pendingComplaints = 0;
  let unpaidBills = 0;

  let todayMealsCount = { breakfast: 0, lunch: 0, dinner: 0, total: 0 };
  let recentExpenses: any[] = [];
  let pendingComplaintsList: any[] = [];
  let latestNotices: any[] = [];
  let todayBoarders: any[] = [];

  // User specific metrics
  let userMealStatus = true;
  let myTotalMeals = 0;
  let myCurrentBill: any = null;
  let mySeatInfo: any = null;
  let myPendingComplaints = 0;

  try {
    const [
      settingRes,
      uCountRes,
      activeMealUsersRes,
      rCountRes,
      roomsRes,
      oSeatsRes,
      expFoodRes,
      expTotalRes,
      payTotalRes,
      monthlyMealsRes,
      pComplaintsCountRes,
      unpaidBillsRes,
      todayMealRecordsRes,
      recExpensesRes,
      pComplaintsRes,
      noticesRes,
      // User specific
      myUserRes,
      myRoomAssignmentRes,
      myMonthlyMealsRes,
      myBillRes,
      myComplaintsCountRes,
    ] = await Promise.all([
      db.systemSetting.findUnique({ where: { id: "default" } }).catch(() => null),
      db.user.count().catch(() => 0),
      db.user.count({ where: { mealStatus: true, status: "ACTIVE" } }).catch(() => 0),
      db.room.count().catch(() => 0),
      db.room.findMany({ select: { capacity: true } }).catch(() => []),
      db.seat.count({ where: { status: "OCCUPIED" } }).catch(() => 0),
      db.expense
        .aggregate({
          where: { category: "FOOD", date: { gte: startOfMonth, lte: endOfMonth } },
          _sum: { amount: true },
        })
        .catch(() => ({ _sum: { amount: 0 } })),
      db.expense
        .aggregate({
          where: { date: { gte: startOfMonth, lte: endOfMonth } },
          _sum: { amount: true },
        })
        .catch(() => ({ _sum: { amount: 0 } })),
      db.payment
        .aggregate({
          where: { month: currentMonthStr },
          _sum: { amount: true },
        })
        .catch(() => ({ _sum: { amount: 0 } })),
      db.mealRecord
        .aggregate({
          where: { date: { gte: startOfMonth, lte: endOfMonth } },
          _sum: { totalMeals: true },
        })
        .catch(() => ({ _sum: { totalMeals: 0 } })),
      db.complaint.count({ where: { status: "PENDING" } }).catch(() => 0),
      db.monthlyBill.count({ where: { status: { in: ["UNPAID", "OVERDUE"] } } }).catch(() => 0),
      db.mealRecord
        .findMany({
          where: { date: { gte: startOfToday, lte: endOfToday } },
          include: { user: { select: { name: true, mealStatus: true } } },
        })
        .catch(() => []),
      db.expense
        .findMany({
          orderBy: { date: "desc" },
          take: 5,
        })
        .catch(() => []),
      db.complaint
        .findMany({
          where: { status: "PENDING" },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
        .catch(() => []),
      db.notice
        .findMany({
          orderBy: { createdAt: "desc" },
          take: 3,
        })
        .catch(() => []),
      // User specific
      userId
        ? db.user.findUnique({ where: { id: userId }, select: { mealStatus: true } }).catch(() => null)
        : Promise.resolve(null),
      userId
        ? db.roomAssignment
            .findFirst({
              where: { userId, isActive: true },
              include: { seat: { include: { room: true } } },
            })
            .catch(() => null)
        : Promise.resolve(null),
      userId
        ? db.mealRecord
            .aggregate({
              where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
              _sum: { totalMeals: true },
            })
            .catch(() => ({ _sum: { totalMeals: 0 } }))
        : Promise.resolve({ _sum: { totalMeals: 0 } }),
      userId
        ? db.monthlyBill
            .findUnique({
              where: { userId_month: { userId, month: currentMonthStr } },
            })
            .catch(() => null)
        : Promise.resolve(null),
      userId
        ? db.complaint.count({ where: { userId, status: "PENDING" } }).catch(() => 0)
        : Promise.resolve(0),
    ]);

    systemSetting = settingRes;
    userCount = uCountRes;
    activeMealUsers = activeMealUsersRes;
    roomCount = rCountRes;
    totalCapacity = roomsRes.reduce((acc, r) => acc + r.capacity, 0);
    occupiedSeats = oSeatsRes;
    totalFoodExpense = expFoodRes?._sum?.amount || 0;
    totalExpenses = expTotalRes?._sum?.amount || 0;
    totalPayments = payTotalRes?._sum?.amount || 0;
    messTotalMeals = monthlyMealsRes?._sum?.totalMeals || 0;
    pendingComplaints = pComplaintsCountRes;
    unpaidBills = unpaidBillsRes;

    // Today's meal aggregation
    let bCount = 0;
    let lCount = 0;
    let dCount = 0;
    let totCount = 0;

    todayBoarders = todayMealRecordsRes.map((record: any) => {
      bCount += record.breakfast || 0;
      lCount += record.lunch || 0;
      dCount += record.dinner || 0;
      totCount += record.totalMeals || 0;
      return {
        userName: record.user?.name || "Member",
        mealStatus: record.user?.mealStatus ?? true,
        breakfast: record.breakfast || 0,
        lunch: record.lunch || 0,
        dinner: record.dinner || 0,
        totalMeals: record.totalMeals || 0,
      };
    });

    todayMealsCount = {
      breakfast: bCount,
      lunch: lCount,
      dinner: dCount,
      total: totCount,
    };

    // Format recent expenses
    recentExpenses = recExpensesRes.map((exp: any) => ({
      id: exp.id,
      title: exp.title,
      category: exp.category,
      amount: exp.amount,
      date: new Date(exp.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      createdBy: exp.createdBy,
    }));

    // Format pending complaints
    pendingComplaintsList = pComplaintsRes.map((c: any) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      priority: c.priority,
      status: c.status,
      userName: c.user?.name || "Member",
      createdAt: new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));

    // Format notices
    latestNotices = noticesRes.map((n: any) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      priority: n.priority,
      createdAt: new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));

    // User specific formatting
    if (myUserRes) {
      userMealStatus = myUserRes.mealStatus;
    }
    if (myMonthlyMealsRes?._sum?.totalMeals) {
      myTotalMeals = myMonthlyMealsRes._sum.totalMeals;
    }
    if (myBillRes) {
      myCurrentBill = {
        totalBill: myBillRes.totalBill,
        dueAmount: myBillRes.dueAmount,
        totalPaid: myBillRes.totalPaid,
        status: myBillRes.status,
        month: myBillRes.month,
      };
    }
    if (myRoomAssignmentRes?.seat) {
      mySeatInfo = {
        roomName: myRoomAssignmentRes.seat.room.name,
        floor: myRoomAssignmentRes.seat.room.floor,
        seatNumber: myRoomAssignmentRes.seat.seatNumber,
      };
    }
    myPendingComplaints = myComplaintsCountRes;
  } catch (error) {
    console.error("Dashboard Page Error:", error);
  }

  const estimatedMealRate = messTotalMeals > 0 ? totalFoodExpense / messTotalMeals : 0;
  const netBalance = totalPayments - totalExpenses;
  const myEstimatedCost = myTotalMeals * estimatedMealRate;

  const roomInfoStr = mySeatInfo
    ? `${mySeatInfo.roomName} • Seat ${mySeatInfo.seatNumber}`
    : null;

  const adminKpis = {
    estimatedMealRate,
    totalFoodExpense,
    messTotalMeals,
    todayMealsCount,
    totalExpenses,
    totalPayments,
    netBalance,
    occupiedSeats,
    totalCapacity,
    roomCount,
    activeMealUsers,
    userCount,
    pendingComplaints,
    unpaidBills,
  };

  const userKpis = {
    myTotalMeals,
    myEstimatedCost,
    myCurrentBill,
    mySeatInfo,
    estimatedMealRate,
    myPendingComplaints,
  };

  return (
    <DashboardClientView
      userName={userName}
      userRole={role}
      userId={userId}
      mealStatus={userMealStatus}
      messName={systemSetting?.messName || "Meal Manager Boarding"}
      roomInfo={roomInfoStr}
      adminKpis={adminKpis}
      userKpis={userKpis}
      recentExpenses={recentExpenses}
      pendingComplaints={pendingComplaintsList}
      latestNotices={latestNotices}
      todayBoarders={todayBoarders}
    />
  );
}
