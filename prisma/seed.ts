import "dotenv/config";
import { PrismaClient, Role, OrderStatus } from "@prisma/client";
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

  await prisma.expense.deleteMany();
  await prisma.cashEntry.deleteMany();
  await prisma.currencyRate.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.cashRegister.deleteMany();
  await prisma.currency.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  console.log("Old data cleared.");

  const tenant = await prisma.tenant.create({
    data: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "صرافی سرافیکس",
      address: "تهران، خیابان ولیعصر",
      phone: "02112345678",
    },
  });
  console.log("Tenant:", tenant.name);

  const currencies = await Promise.all([
    prisma.currency.create({ data: { tenantId: tenant.id, code: "PKR", name: "روپیه پاکستان", symbol: "Rs" } }),
    prisma.currency.create({ data: { tenantId: tenant.id, code: "IRR", name: "ریال ایران", symbol: "﷼" } }),
    prisma.currency.create({ data: { tenantId: tenant.id, code: "USD", name: "دلار آمریکا", symbol: "$" } }),
    prisma.currency.create({ data: { tenantId: tenant.id, code: "EUR", name: "یورو", symbol: "€" } }),
    prisma.currency.create({ data: { tenantId: tenant.id, code: "AED", name: "درهم امارات", symbol: "د.إ" } }),
  ]);
  console.log("Currencies:", currencies.map((c) => c.code).join(", "));

  const owner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      mobile: "09000000000",
      password: defaultPassword,
      firstName: "مدیر",
      lastName: "اصلی",
      role: Role.OWNER,
    },
  });

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

  const cashier = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      mobile: "09121111111",
      password: defaultPassword,
      firstName: "سارا",
      lastName: "احمدی",
      role: Role.CASHIER,
    },
  });

  const accountant = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      mobile: "09122222222",
      password: defaultPassword,
      firstName: "امیر",
      lastName: "حسینی",
      role: Role.ACCOUNTANT,
    },
  });

  console.log("Users created.");

  const pkr = currencies.find((c) => c.code === "PKR")!;

  await prisma.currencyRate.create({
    data: { tenantId: tenant.id, currencyId: pkr.id, buyRate: 2950, sellRate: 3000, changedById: owner.id },
  });
  console.log("PKR Rate: buy=2950, sell=3000");

  const tomanRegister = await prisma.cashRegister.create({
    data: { tenantId: tenant.id, name: "صندوق تومان", type: "toman", balance: 500000000 },
  });
  const rupeeRegister = await prisma.cashRegister.create({
    data: { tenantId: tenant.id, name: "صندوق روپیه", type: "rupee", balance: 5000000 },
  });
  console.log("Registers: toman=500M, rupee=5M");

  const customers = await Promise.all([
    prisma.customer.create({ data: { tenantId: tenant.id, name: "احمد محمدی", phone: "09191234567", pakAccount: "PK-1001" } }),
    prisma.customer.create({ data: { tenantId: tenant.id, name: "فاطمه رضایی", phone: "09192345678" } }),
    prisma.customer.create({ data: { tenantId: tenant.id, name: "علی کریمی", phone: "09193456789", pakAccount: "PK-1003" } }),
    prisma.customer.create({ data: { tenantId: tenant.id, name: "زهرا حسینی", phone: "09194567890" } }),
    prisma.customer.create({ data: { tenantId: tenant.id, name: "رضا عباسی", phone: "09195678901", pakAccount: "PK-1005" } }),
  ]);
  console.log("Customers:", customers.length);

  console.log("\n--- Seed Complete ---");
  console.log("Password for all: 123456\n");
  console.log("Owner:        09000000000");
  console.log("Manager:      09121234567");
  console.log("Cashier:      09121111111");
  console.log("Accountant:   09122222222");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
