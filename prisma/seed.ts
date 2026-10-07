import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

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

  // 3. Seed Super Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@messmate.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@messmate.com",
      passwordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      phone: "+8801700000000",
      monthlyRent: 0,
      mealStatus: true,
      address: "Dhaka, Bangladesh",
      occupation: "Mess Manager & Admin",
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // 4. Seed Manager User
  const manager = await prisma.user.upsert({
    where: { email: "manager@messmate.com" },
    update: {},
    create: {
      name: "Mess Manager",
      email: "manager@messmate.com",
      passwordHash,
      role: Role.MANAGER,
      status: UserStatus.ACTIVE,
      phone: "+8801800000001",
      monthlyRent: 5000,
      mealStatus: true,
      address: "Mirpur, Dhaka",
      occupation: "Accountant",
    },
  });
  console.log(`✅ Manager created: ${manager.email}`);

  // 5. Seed General Member User
  const user1 = await prisma.user.upsert({
    where: { email: "user@messmate.com" },
    update: {},
    create: {
      name: "John Member",
      email: "user@messmate.com",
      passwordHash,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      phone: "+8801900000002",
      monthlyRent: 4500,
      mealStatus: true,
      address: "Dhanmondi, Dhaka",
      occupation: "Software Developer",
    },
  });
  console.log(`✅ General Member created: ${user1.email}`);

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
