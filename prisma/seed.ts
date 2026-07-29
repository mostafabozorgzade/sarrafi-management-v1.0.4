import "dotenv/config";
import { PrismaClient, Role, OrderStatus, OrderType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

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

  const [ahmad, fatemeh, ali, zahra, reza] = customers;

  const ordersData = [
    {
      id: randomUUID(), tenantId: tenant.id, customerId: ahmad.id, userId: cashier.id, currencyId: pkr.id,
      orderType: OrderType.IR_TO_PK, status: OrderStatus.COMPLETED, amount: BigInt(50000),
      totalToman: BigInt(147500000), fee: BigInt(500000),
      buyMarketProfitAmount: BigInt(150000), sellMarketProfitAmount: BigInt(100000), totalProfitAmount: BigInt(250000),
      recipientName: "احمد محمدی", recipientMethod: "BANK_TRANSFER" as const,
      description: "حواله به حساب بانکی", completedAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      id: randomUUID(), tenantId: tenant.id, customerId: fatemeh.id, userId: cashier.id, currencyId: pkr.id,
      orderType: OrderType.PK_TO_IR, status: OrderStatus.IN_PROGRESS, amount: BigInt(30000),
      totalToman: BigInt(90000000), fee: BigInt(300000),
      buyMarketProfitAmount: BigInt(90000), sellMarketProfitAmount: BigInt(60000), totalProfitAmount: BigInt(150000),
      recipientName: "فاطمه رضایی", recipientMethod: "EASYPAISA" as const,
      description: "حواله از پاکستان به ایران",
    },
    {
      id: randomUUID(), tenantId: tenant.id, customerId: ali.id, userId: manager.id, currencyId: pkr.id,
      orderType: OrderType.BUY_PKR, status: OrderStatus.IN_PROGRESS, amount: BigInt(100000),
      totalToman: BigInt(295000000), fee: BigInt(800000),
      buyMarketProfitAmount: BigInt(250000), sellMarketProfitAmount: BigInt(150000), totalProfitAmount: BigInt(400000),
      recipientName: "علی کریمی", recipientMethod: "CASH" as const,
      description: "خرید روپیه نقدی",
    },
    {
      id: randomUUID(), tenantId: tenant.id, customerId: zahra.id, userId: cashier.id, currencyId: pkr.id,
      orderType: OrderType.SELL_PKR, status: OrderStatus.IN_PROGRESS, amount: BigInt(25000),
      totalToman: BigInt(75000000), fee: BigInt(250000),
      buyMarketProfitAmount: BigInt(50000), sellMarketProfitAmount: BigInt(75000), totalProfitAmount: BigInt(125000),
      recipientName: "زهرا حسینی", recipientMethod: "JAZZCASH" as const,
      description: "فروش روپیه به مشتری",
    },
    {
      id: randomUUID(), tenantId: tenant.id, customerId: reza.id, userId: manager.id, currencyId: pkr.id,
      orderType: OrderType.IR_TO_PK, status: OrderStatus.IN_PROGRESS, amount: BigInt(75000),
      totalToman: BigInt(221250000), fee: BigInt(600000),
      buyMarketProfitAmount: BigInt(180000), sellMarketProfitAmount: BigInt(120000), totalProfitAmount: BigInt(300000),
      recipientName: "رضا عباسی", recipientMethod: "HAWALA" as const,
      description: "حواله هواله به پاکستان",
    },
    {
      id: randomUUID(), tenantId: tenant.id, customerId: ahmad.id, userId: cashier.id, currencyId: pkr.id,
      orderType: OrderType.BUY_PKR, status: OrderStatus.COMPLETED, amount: BigInt(40000),
      totalToman: BigInt(118000000), fee: BigInt(400000),
      buyMarketProfitAmount: BigInt(120000), sellMarketProfitAmount: BigInt(80000), totalProfitAmount: BigInt(200000),
      recipientName: "احمد محمدی", recipientMethod: "BANK_TRANSFER" as const,
      description: "خرید روپیه واریز به حساب", completedAt: new Date(Date.now() - 86400000),
    },
    {
      id: randomUUID(), tenantId: tenant.id, customerId: fatemeh.id, userId: manager.id, currencyId: pkr.id,
      orderType: OrderType.SELL_PKR, status: OrderStatus.IN_PROGRESS, amount: BigInt(20000),
      totalToman: BigInt(60000000), fee: BigInt(200000),
      buyMarketProfitAmount: BigInt(40000), sellMarketProfitAmount: BigInt(60000), totalProfitAmount: BigInt(100000),
      recipientName: "فاطمه رضایی", recipientMethod: "CASH" as const,
      description: "فروش روپیه نقدی",
    },
    {
      id: randomUUID(), tenantId: tenant.id, customerId: ali.id, userId: cashier.id, currencyId: pkr.id,
      orderType: OrderType.IR_TO_PK, status: OrderStatus.CANCELLED, amount: BigInt(15000),
      totalToman: BigInt(44250000), fee: BigInt(150000),
      buyMarketProfitAmount: BigInt(0), sellMarketProfitAmount: BigInt(0), totalProfitAmount: BigInt(0),
      recipientName: "علی کریمی", recipientMethod: "EASYPAISA" as const,
      description: "لغو شده - تغییر درخواست",
    },
    {
      id: randomUUID(), tenantId: tenant.id, customerId: zahra.id, userId: manager.id, currencyId: pkr.id,
      orderType: OrderType.PK_TO_IR, status: OrderStatus.COMPLETED, amount: BigInt(60000),
      totalToman: BigInt(180000000), fee: BigInt(500000),
      buyMarketProfitAmount: BigInt(150000), sellMarketProfitAmount: BigInt(125000), totalProfitAmount: BigInt(275000),
      recipientName: "زهرا حسینی", recipientMethod: "BANK_TRANSFER" as const,
      description: "حواله تکمیل شده", completedAt: new Date(Date.now() - 86400000 * 3),
    },
    {
      id: randomUUID(), tenantId: tenant.id, customerId: reza.id, userId: cashier.id, currencyId: pkr.id,
      orderType: OrderType.BUY_PKR, status: OrderStatus.IN_PROGRESS, amount: BigInt(80000),
      totalToman: BigInt(236000000), fee: BigInt(700000),
      buyMarketProfitAmount: BigInt(200000), sellMarketProfitAmount: BigInt(150000), totalProfitAmount: BigInt(350000),
      recipientName: "رضا عباسی", recipientMethod: "HAWALA" as const,
      description: "خرید روپیه در انتظار تایید",
    },
  ];

  const createdOrders = [];
  for (const order of ordersData) {
    createdOrders.push(await prisma.order.create({ data: order }));
  }
  console.log("Orders:", createdOrders.length);

  const completedOrders = createdOrders.filter((o) => o.status === OrderStatus.COMPLETED);
  const transactionsData = completedOrders.map((order, i) => ({
    id: randomUUID(), tenantId: tenant.id, userId: order.userId, customerId: order.customerId,
    orderId: order.id, type: order.orderType.toString(), currencyId: order.currencyId,
    amount: order.amount, rate: BigInt(2950), totalToman: order.totalToman,
    profit: order.totalProfitAmount || BigInt(0), description: `تراکنش سفارش ${i + 1}`,
  }));

  for (const tx of transactionsData) {
    await prisma.transaction.create({ data: tx });
  }
  console.log("Transactions:", transactionsData.length);

  const ahmadTotalBuy = createdOrders
    .filter((o) => o.customerId === ahmad.id && (o.orderType === OrderType.BUY_PKR))
    .reduce((s, o) => s + Number(o.totalToman), 0);
  const ahmadTotalSell = createdOrders
    .filter((o) => o.customerId === ahmad.id && (o.orderType === OrderType.SELL_PKR))
    .reduce((s, o) => s + Number(o.totalToman), 0);

  await prisma.customer.update({
    where: { id: ahmad.id },
    data: { totalBuy: BigInt(ahmadTotalBuy), totalSell: BigInt(ahmadTotalSell) },
  });

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
