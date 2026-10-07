import {
  PrismaClient,
  Role,
  UserStatus,
  RoomStatus,
  SeatStatus,
  ExpenseCategory,
  PaymentMethod,
  BillStatus,
  ComplaintCategory,
  Priority,
  ComplaintStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Full Mess Month Database Seeding...");

  // 1. Seed System Settings
  await prisma.systemSetting.upsert({
    where: { id: "default" },
    update: {
      messName: "Smart Mess Management",
      currency: "BDT",
      currencySymbol: "৳",
    },
    create: {
      id: "default",
      messName: "Smart Mess Management",
      currency: "BDT",
      currencySymbol: "৳",
      timezone: "Asia/Dhaka",
      dateFormat: "yyyy-MM-dd",
    },
  });
  console.log("✅ System settings configured.");

  // 2. Hash Password (default for all seeded users: 123456)
  const passwordHash = await bcrypt.hash("123456", 10);

  // 3. Create Manager / Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@mealmanager.com" },
    update: { passwordHash },
    create: {
      name: "Meal Manager (Admin)",
      email: "admin@mealmanager.com",
      passwordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      phone: "+8801700000000",
      monthlyRent: 0,
      mealStatus: true,
      address: "Dhaka, Bangladesh",
      occupation: "Meal Manager & Host Owner",
    },
  });
  console.log(`✅ Admin Manager seeded: ${admin.email}`);

  // 4. Create 5 House Members with Fixed Room Rents
  const membersData = [
    { name: "Member 1", email: "member1@mealmanager.com", rent: 5150, phone: "+8801700000001", room: "101", seat: "A" },
    { name: "Member 2", email: "member2@mealmanager.com", rent: 2150, phone: "+8801700000002", room: "101", seat: "B" },
    { name: "Member 3", email: "member3@mealmanager.com", rent: 2150, phone: "+8801700000003", room: "102", seat: "A" },
    { name: "Member 4", email: "member4@mealmanager.com", rent: 4650, phone: "+8801700000004", room: "102", seat: "B" },
    { name: "Member 5", email: "member5@mealmanager.com", rent: 1500, phone: "+8801700000005", room: "103", seat: "A" },
  ];

  const seededMembers = [];
  for (const m of membersData) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {
        monthlyRent: m.rent,
        passwordHash,
      },
      create: {
        name: m.name,
        email: m.email,
        passwordHash,
        role: Role.USER,
        status: UserStatus.ACTIVE,
        phone: m.phone,
        monthlyRent: m.rent,
        mealStatus: true,
        address: "Mess Residence, Dhaka",
        occupation: "Student / Professional",
      },
    });
    seededMembers.push(user);
    console.log(`✅ Seeded ${user.name} (Rent: ৳${user.monthlyRent})`);
  }

  // 5. Seed Rooms & Seats
  console.log("🏢 Seeding Rooms & Seat Allocations...");
  const roomConfigs = [
    { name: "Room 101", floor: 1, capacity: 2 },
    { name: "Room 102", floor: 1, capacity: 2 },
    { name: "Room 103", floor: 1, capacity: 1 },
  ];

  for (const rc of roomConfigs) {
    let room = await prisma.room.findFirst({ where: { name: rc.name } });
    if (!room) {
      room = await prisma.room.create({
        data: {
          name: rc.name,
          floor: rc.floor,
          capacity: rc.capacity,
          status: RoomStatus.FULL,
        },
      });
    }

    // Create Seats for room
    const seatLetters = ["A", "B"];
    for (let i = 0; i < rc.capacity; i++) {
      const seatNo = seatLetters[i];
      let seat = await prisma.seat.findFirst({
        where: { roomId: room.id, seatNumber: seatNo },
      });
      if (!seat) {
        seat = await prisma.seat.create({
          data: {
            roomId: room.id,
            seatNumber: seatNo,
            status: SeatStatus.OCCUPIED,
          },
        });
      }

      // Assign user to seat if matching
      const targetMember = membersData.find((m) => m.room === rc.name.replace("Room ", "") && m.seat === seatNo);
      if (targetMember) {
        const userObj = seededMembers.find((u) => u.email === targetMember.email);
        if (userObj) {
          const existingAssign = await prisma.roomAssignment.findFirst({
            where: { userId: userObj.id, seatId: seat.id },
          });
          if (!existingAssign) {
            await prisma.roomAssignment.create({
              data: {
                userId: userObj.id,
                seatId: seat.id,
                startDate: new Date("2026-10-01"),
                isActive: true,
              },
            });
          }
        }
      }
    }
  }

  // 6. Seed Daily Meals for Full Month (October 2026: 31 days)
  console.log("🍲 Seeding 31 Days of Daily Meals for all 5 Members...");
  const targetYear = 2026;
  const targetMonth = 10; // October
  const monthStr = "2026-10";
  const daysInMonth = 31;

  for (let day = 1; day <= daysInMonth; day++) {
    const padDay = String(day).padStart(2, "0");
    const dateObj = new Date(Date.UTC(targetYear, targetMonth - 1, day));

    for (const member of seededMembers) {
      // Realistic meal count variation (1, 1, 1 = 3 meals or weekends 0.5/1/1)
      const isWeekend = day % 7 === 3 || day % 7 === 4;
      const b = isWeekend ? (day % 2 === 0 ? 1 : 0) : 1;
      const l = 1;
      const d = isWeekend ? 1 : 1;
      const total = b + l + d;

      await prisma.mealRecord.upsert({
        where: {
          userId_date: {
            userId: member.id,
            date: dateObj,
          },
        },
        update: {
          breakfast: b,
          lunch: l,
          dinner: d,
          totalMeals: total,
        },
        create: {
          userId: member.id,
          date: dateObj,
          breakfast: b,
          lunch: l,
          dinner: d,
          totalMeals: total,
          note: "Daily standard meal",
        },
      });
    }
  }
  console.log("✅ 31 Days of Meal Records seeded successfully!");

  // 7. Seed Food Bazaar & Shared Utility Expenses logged by different members
  console.log("🛒 Seeding Food Bazaar & Utility Expenses...");

  const expenseItems = [
    { title: "Weekly Fish & Egg Bazaar", category: ExpenseCategory.FOOD, amount: 2800, dateStr: "2026-10-02", userIdx: 0, desc: "Logged by Member 1" },
    { title: "Chicken & Beef Meat Bazaar", category: ExpenseCategory.FOOD, amount: 3500, dateStr: "2026-10-06", userIdx: 1, desc: "Logged by Member 2" },
    { title: "Rice 50kg Sack & Rice Oil", category: ExpenseCategory.FOOD, amount: 4200, dateStr: "2026-10-10", userIdx: 2, desc: "Logged by Member 3" },
    { title: "Fresh Vegetables & Spices", category: ExpenseCategory.FOOD, amount: 1900, dateStr: "2026-10-15", userIdx: 3, desc: "Logged by Member 4" },
    { title: "Onions, Garlic & Potatoes", category: ExpenseCategory.FOOD, amount: 1600, dateStr: "2026-10-20", userIdx: 4, desc: "Logged by Member 5" },
    { title: "Mid-month Poultry & Fish Bazaar", category: ExpenseCategory.FOOD, amount: 2500, dateStr: "2026-10-25", userIdx: 0, desc: "Logged by Member 1" },
    
    // Utilities
    { title: "Khala (Cook/Maid) Monthly Salary", category: ExpenseCategory.STAFF_SALARY, amount: 2500, dateStr: "2026-10-05", userIdx: 0, desc: "Shared Cook Fee (৳500 / person)" },
    { title: "High Speed Fiber Internet Bill", category: ExpenseCategory.INTERNET, amount: 1200, dateStr: "2026-10-05", userIdx: 0, desc: "Shared WiFi Bill (৳240 / person)" },
    { title: "DESCO Electricity Bill", category: ExpenseCategory.ELECTRICITY, amount: 2500, dateStr: "2026-10-12", userIdx: 0, desc: "Shared Electricity (৳500 / person)" },
    { title: "Gas Cylinder / Cylinder Bill", category: ExpenseCategory.GAS, amount: 1500, dateStr: "2026-10-14", userIdx: 1, desc: "Shared Gas (৳300 / person)" },
    { title: "WASA Water & Waste Utility", category: ExpenseCategory.WATER, amount: 800, dateStr: "2026-10-18", userIdx: 2, desc: "Shared Water (৳160 / person)" },
  ];

  for (const exp of expenseItems) {
    const creator = seededMembers[exp.userIdx] || admin;
    const expDate = new Date(exp.dateStr);

    const existing = await prisma.expense.findFirst({
      where: { title: exp.title, date: expDate },
    });

    if (!existing) {
      await prisma.expense.create({
        data: {
          title: exp.title,
          category: exp.category,
          amount: exp.amount,
          date: expDate,
          description: exp.desc,
          createdBy: creator.id,
        },
      });
    }
  }
  console.log("✅ Bazaar & Utility Expenses seeded.");

  // 8. Calculate Dynamic Meal Rate & Seed Monthly Bills for October 2026
  console.log("📊 Calculating Meal Rate and Generating Monthly Bills...");

  // Total food expense
  const totalFoodExpense = 2800 + 3500 + 4200 + 1900 + 1600 + 2500; // ৳16,500
  
  // Total meals across all 5 members (each ~85 meals -> total ~425 meals)
  const totalMessMeals = 31 * 3 * 5; // 465 meals
  const mealRate = totalFoodExpense / totalMessMeals; // ~৳35.48 per meal

  // Member bazaar deposited mapping
  const memberBazarMap: Record<number, number> = {
    0: 2800 + 2500, // 5300
    1: 3500,        // 3500
    2: 4200,        // 4200
    3: 1900,        // 1900
    4: 1600,        // 1600
  };

  const khalaShare = 500;     // 2500 / 5
  const wifiShare = 240;      // 1200 / 5
  const electricityShare = 500; // 2500 / 5
  const gasShare = 300;       // 1500 / 5
  const waterShare = 160;     // 800 / 5
  const totalUtilityShare = khalaShare + wifiShare + electricityShare + gasShare + waterShare; // ৳1,700 per member

  // Payments made advances
  const memberPaymentMap: Record<number, number> = {
    0: 5000,
    1: 3000,
    2: 2500,
    3: 4000,
    4: 2000,
  };

  for (let idx = 0; idx < seededMembers.length; idx++) {
    const member = seededMembers[idx];
    const memberMeals = 31 * 3; // 93 meals
    const mealCost = memberMeals * mealRate; // ~৳3,300
    const roomRent = member.monthlyRent;
    const bazarDep = memberBazarMap[idx] || 0;
    const paidAmt = memberPaymentMap[idx] || 0;

    const totalBill = roomRent + totalUtilityShare + mealCost;
    const dueAmount = totalBill - bazarDep - paidAmt;
    const status = dueAmount <= 0 ? BillStatus.PAID : dueAmount < totalBill ? BillStatus.PARTIALLY_PAID : BillStatus.UNPAID;

    await prisma.monthlyBill.upsert({
      where: {
        userId_month: {
          userId: member.id,
          month: monthStr,
        },
      },
      update: {
        totalMeals: memberMeals,
        mealRate,
        mealCost,
        roomRent,
        utilityShare: totalUtilityShare,
        khalaShare,
        wifiShare,
        electricityShare,
        gasShare,
        waterShare,
        bazarDeposited: bazarDep,
        totalBill,
        totalPaid: paidAmt,
        dueAmount: Math.max(0, dueAmount),
        status,
      },
      create: {
        userId: member.id,
        month: monthStr,
        totalMeals: memberMeals,
        mealRate,
        mealCost,
        roomRent,
        utilityShare: totalUtilityShare,
        khalaShare,
        wifiShare,
        electricityShare,
        gasShare,
        waterShare,
        bazarDeposited: bazarDep,
        totalBill,
        totalPaid: paidAmt,
        dueAmount: Math.max(0, dueAmount),
        status,
      },
    });

    // Also seed payment records
    if (paidAmt > 0) {
      const existingPay = await prisma.payment.findFirst({
        where: { userId: member.id, month: monthStr },
      });
      if (!existingPay) {
        await prisma.payment.create({
          data: {
            userId: member.id,
            amount: paidAmt,
            date: new Date("2026-10-05"),
            month: monthStr,
            paymentMethod: PaymentMethod.BKASH,
            transactionId: `TRX${Math.floor(100000 + Math.random() * 900000)}`,
            note: "Advance rent & meal deposit",
            recordedBy: admin.id,
          },
        });
      }
    }
  }
  console.log("✅ Monthly Bills & Payment Receipts generated for October 2026.");

  // 9. Seed Notices
  console.log("📢 Seeding Notice Board Announcements...");
  const noticeList = [
    { title: "Monthly Mess Meeting on Friday Evening", description: "All 5 mess members are requested to join the monthly meal rate and utility review meeting in the dining area on Friday at 8:00 PM.", priority: Priority.HIGH },
    { title: "Electricity & Utility Bill Deposit Notice", description: "Please ensure your October utility dues are cleared by the 10th of the month to prevent service interruption.", priority: Priority.MEDIUM },
  ];

  for (const n of noticeList) {
    const existing = await prisma.notice.findFirst({ where: { title: n.title } });
    if (!existing) {
      await prisma.notice.create({
        data: {
          title: n.title,
          description: n.description,
          priority: n.priority,
          createdById: admin.id,
        },
      });
    }
  }

  // 10. Seed Complaints / Tickets Desk
  console.log("🎫 Seeding Service Tickets Desk Complaints...");
  const complaintList = [
    { userIdx: 0, title: "Room 101 Ceiling Fan Speed Control Knob Broken", category: ComplaintCategory.MAINTENANCE, desc: "Regulator knob needs replacement.", priority: Priority.MEDIUM, status: ComplaintStatus.IN_PROGRESS },
    { userIdx: 2, title: "WiFi Signal Weak in Room 102 Back Corner", category: ComplaintCategory.INTERNET, desc: "Router coverage drops during peak night hours.", priority: Priority.LOW, status: ComplaintStatus.PENDING },
  ];

  for (const c of complaintList) {
    const user = seededMembers[c.userIdx];
    const existing = await prisma.complaint.findFirst({ where: { title: c.title } });
    if (!existing && user) {
      await prisma.complaint.create({
        data: {
          userId: user.id,
          title: c.title,
          category: c.category,
          description: c.desc,
          priority: c.priority,
          status: c.status,
        },
      });
    }
  }

  console.log("\n🎉 Full Month (October 2026) Seeding Completed Successfully!");
  console.log("------------------------------------------------------------");
  console.log("🔑 Login Credentials for Testing:");
  console.log("   Admin Manager: admin@mealmanager.com | Pass: 123456");
  console.log("   Member 1: member1@mealmanager.com | Pass: 123456 | Rent: ৳5,150");
  console.log("   Member 2: member2@mealmanager.com | Pass: 123456 | Rent: ৳2,150");
  console.log("   Member 3: member3@mealmanager.com | Pass: 123456 | Rent: ৳2,150");
  console.log("   Member 4: member4@mealmanager.com | Pass: 123456 | Rent: ৳4,650");
  console.log("   Member 5: member5@mealmanager.com | Pass: 123456 | Rent: ৳1,500");
  console.log("------------------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
