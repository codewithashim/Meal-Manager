import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database for Mess Billing Engine...");

  // 1. Seed System Settings
  await prisma.systemSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      messName: "Smart Mess Management",
      currency: "BDT",
      currencySymbol: "৳",
      timezone: "Asia/Dhaka",
      dateFormat: "yyyy-MM-dd",
    },
  });
  console.log("✅ System settings initialized.");

  // 2. Hash passwords
  const passwordHash = await bcrypt.hash("123456", 10);

  // 3. Seed Super Admin / Manager User
  const admin = await prisma.user.upsert({
    where: { email: "admin@messmate.com" },
    update: {},
    create: {
      name: "Mess Manager (Admin)",
      email: "admin@messmate.com",
      passwordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      phone: "+8801700000000",
      monthlyRent: 0,
      mealStatus: true,
      address: "Dhaka, Bangladesh",
      occupation: "Mess Manager",
    },
  });
  console.log(`✅ Manager Admin created: ${admin.email}`);

  // 4. Seed 5 House Members with exact fixed room rents
  const membersData = [
    { name: "Member 1", email: "member1@messmate.com", rent: 5150, phone: "+8801700000001" },
    { name: "Member 2", email: "member2@messmate.com", rent: 2150, phone: "+8801700000002" },
    { name: "Member 3", email: "member3@messmate.com", rent: 2150, phone: "+8801700000003" },
    { name: "Member 4", email: "member4@messmate.com", rent: 4650, phone: "+8801700000004" },
    { name: "Member 5", email: "member5@messmate.com", rent: 1500, phone: "+8801700000005" },
  ];

  for (const m of membersData) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {
        monthlyRent: m.rent,
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
        occupation: "Mess Member",
      },
    });
    console.log(`✅ Seeded ${user.name} with Rent ৳${user.monthlyRent}`);
  }

  console.log("🎉 Seeding completed successfully! Total 5 Members + 1 Manager configured.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
