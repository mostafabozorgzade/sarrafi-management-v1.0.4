import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const customerId = searchParams.get("customerId");
  const currencyId = searchParams.get("currencyId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const where: Record<string, unknown> = user.role === "OWNER" ? {} : { tenantId: user.tenantId! };
  if (type && type !== "all") where.type = type;
  if (customerId) where.customerId = customerId;
  if (currencyId) where.currencyId = currencyId;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo + "T23:59:59.999Z");
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      customer: { select: { name: true, phone: true } },
      currency: { select: { code: true, name: true } },
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(transactions);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return NextResponse.json({ error: "tenant required" }, { status: 400 });

  const body = await request.json();
  const { type, customerId, currencyId, amount, rate, description } = body;

  if (!type || !customerId || !currencyId || !amount || !rate) {
    return NextResponse.json({ error: "فیلدهای الزامی را پر کنید" }, { status: 400 });
  }

  const amountNum = Number(amount);
  const rateNum = Number(rate);
  const totalToman = amountNum * rateNum;

  const currencyRate = await prisma.currencyRate.findUnique({
    where: { tenantId_currencyId: { tenantId: user.tenantId, currencyId } },
  });

  let profit = 0;
  if (currencyRate) {
    if (type === "sell") {
      profit = (rateNum - Number(currencyRate.buyRate)) * amountNum;
    } else {
      profit = (Number(currencyRate.sellRate) - rateNum) * amountNum;
    }
  }

  const transaction = await prisma.transaction.create({
    data: {
      tenantId: user.tenantId,
      userId: user.userId,
      customerId,
      currencyId,
      type,
      amount: amountNum,
      rate: rateNum,
      totalToman,
      profit,
      description: description || null,
    },
    include: { customer: { select: { name: true } }, currency: { select: { code: true } } },
  });

  if (type === "buy") {
    await prisma.customer.update({ where: { id: customerId }, data: { totalBuy: { increment: totalToman } } });
    const register = await prisma.cashRegister.findFirst({ where: { tenantId: user.tenantId, type: "toman" } });
    if (register) {
      await prisma.cashEntry.create({ data: { registerId: register.id, type: "out", amount: totalToman, description: `خرید ${transaction.currency.code} - ${transaction.customer.name}` } });
      await prisma.cashRegister.update({ where: { id: register.id }, data: { balance: { decrement: totalToman } } });
    }
  } else {
    await prisma.customer.update({ where: { id: customerId }, data: { totalSell: { increment: totalToman } } });
    const register = await prisma.cashRegister.findFirst({ where: { tenantId: user.tenantId, type: "toman" } });
    if (register) {
      await prisma.cashEntry.create({ data: { registerId: register.id, type: "in", amount: totalToman, description: `فروش ${transaction.currency.code} - ${transaction.customer.name}` } });
      await prisma.cashRegister.update({ where: { id: register.id }, data: { balance: { increment: totalToman } } });
    }
  }

  return NextResponse.json(transaction);
}
