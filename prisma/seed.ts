import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  maxUses: 1,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const defaultPassword = await bcrypt.hash("123456", 12);

  // Delete existing data
  await prisma.expense.deleteMany();
  await prisma.cashEntry.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.cashRegister.deleteMany();
  await prisma.currencyRate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  console.log("Old data cleared.");

  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "صرافی سرافیکس",
      address: "تهران، خیابان ولیعصر",
      phone: "02112345678",
    },
  });
  console.log("Tenant:", tenant.name);

  // Create super admin (no tenant)
  const superAdmin = await prisma.user.create({
    data: {
      mobile: "09000000000",
      password: defaultPassword,
      firstName: "ادمین",
      lastName: "سیستم",
      role: Role.SUPER_ADMIN,
    },
  });
  console.log("Super Admin:", superAdmin.mobile);

  // Create manager
  const manager = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      mobile: "09121234567",
      password: defaultPassword,
      firstName: "مدیر",
      lastName: "صرافی",
      role: Role.MANAGER,
    },
  });
  console.log("Manager:", manager.mobile);

  // Create employees
  const employees = [
    { mobile: "09121111111", firstName: "سارا", lastName: "احمدی" },
    { mobile: "09122222222", firstName: "امیر", lastName: "حسینی" },
    { mobile: "09123333333", firstName: "نیلوفر", lastName: "رستمی" },
  ];

  for (const emp of employees) {
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        mobile: emp.mobile,
        password: defaultPassword,
        firstName: emp.firstName,
        lastName: emp.lastName,
        role: Role.EMPLOYEE,
      },
    });
    console.log("Employee:", user.mobile);
  }

  console.log("\n--- Seed Complete ---");
  console.log("Password for all: 123456\n");
  console.log("Super Admin:  09000000000");
  console.log("Manager:      09121234567");
  console.log("Employee 1:   09121111111");
  console.log("Employee 2:   09122222222");
  console.log("Employee 3:   09123333333");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
