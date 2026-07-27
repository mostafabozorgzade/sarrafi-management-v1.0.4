import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const customerId = searchParams.get("customerId");

  const where: Record<string, unknown> = user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId! };
  if (type && type !== "all") where.type = type;
  if (customerId) where.customerId = customerId;

  const transactions = await prisma.transaction.findMany({
    where,
    include: { customer: { select: { name: true, phone: true } }, user: { select: { firstName: true, lastName: true } } },
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
  const { type, customerId, currency, amount, rate, destinationAccount, description } = body;

  if (!type || !customerId || !currency || !amount || !rate) {
    return NextResponse.json({ error: "فیلدهای الزامی را پر کنید" }, { status: 400 });
  }

  const amountNum = Number(amount);
  const rateNum = Number(rate);
  const totalToman = amountNum * rateNum;

  let profit = 0;
  if (type === "sell") {
    const buyRate = await prisma.currencyRate.findUnique({
      where: { tenantId_currency: { tenantId: user.tenantId, currency } },
    });
    if (buyRate) {
      profit = (rateNum - Number(buyRate.buyRate)) * amountNum;
    }
  } else {
    const buyRate = await prisma.currencyRate.findUnique({
      where: { tenantId_currency: { tenantId: user.tenantId, currency } },
    });
    if (buyRate) {
      profit = (Number(buyRate.sellRate) - rateNum) * amountNum;
    }
  }

  const transaction = await prisma.transaction.create({
    data: {
      tenantId: user.tenantId,
      userId: user.userId,
      customerId,
      type,
      currency,
      amount: amountNum,
      rate: rateNum,
      totalToman,
      profit,
      destinationAccount: destinationAccount || null,
      description: description || null,
    },
    include: { customer: { select: { name: true } } },
  });

  if (type === "buy") {
    await prisma.customer.update({
      where: { id: customerId },
      data: { totalBuy: { increment: totalToman } },
    });
    const register = await prisma.cashRegister.findFirst({
      where: { tenantId: user.tenantId, type: "toman" },
    });
    if (register) {
      await prisma.cashEntry.create({
        data: { registerId: register.id, type: "out", amount: totalToman, description: `خرید ${currency} - ${transaction.customer.name}` },
      });
      await prisma.cashRegister.update({
        where: { id: register.id },
        data: { balance: { decrement: totalToman } },
      });
    }
  } else {
    await prisma.customer.update({
      where: { id: customerId },
      data: { totalSell: { increment: totalToman } },
    });
    const register = await prisma.cashRegister.findFirst({
      where: { tenantId: user.tenantId, type: "toman" },
    });
    if (register) {
      await prisma.cashEntry.create({
        data: { registerId: register.id, type: "in", amount: totalToman, description: `فروش ${currency} - ${transaction.customer.name}` },
      });
      await prisma.cashRegister.update({
        where: { id: register.id },
        data: { balance: { increment: totalToman } },
      });
    }
  }

  return NextResponse.json(transaction);
}
