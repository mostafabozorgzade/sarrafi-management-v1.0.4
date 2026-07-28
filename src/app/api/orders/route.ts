import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const orderType = searchParams.get("orderType");

  const where: Record<string, unknown> = user.role === "OWNER" ? { tenantId: user.tenantId } : { tenantId: user.tenantId };
  if (status && status !== "all") where.status = status;
  if (orderType && orderType !== "all") where.orderType = orderType;

  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: { select: { name: true, phone: true } },
      currency: { select: { code: true, name: true } },
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return safeJson(orders);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

  const body = await request.json();
  const {
    customerId, currencyId, orderType, amount, rate, fee,
    recipientName, recipientAccount, recipientMethod,
    destinationCard, destinationSheba, description,
  } = body;

  if (!customerId || !currencyId || !orderType || !amount || !rate) {
    return safeJson({ error: "فیلدهای الزامی را پر کنید" }, { status: 400 });
  }

  const amountNum = Number(amount);
  const rateNum = Number(rate);
  const feeNum = Number(fee || 0);

  let totalToman: number;
  let calculatedPkr: number;

  if (orderType === "IR_TO_PK") {
    totalToman = amountNum;
    calculatedPkr = rateNum > 0 ? Math.round(amountNum / rateNum) : 0;
  } else {
    totalToman = amountNum * rateNum;
    calculatedPkr = amountNum;
  }

  const currencyRate = await prisma.currencyRate.findUnique({
    where: { tenantId_currencyId: { tenantId: user.tenantId, currencyId } },
  });

  const marketRateAtTime = currencyRate ? Number(currencyRate.marketRate) : 0;
  const buyRateAtTime = currencyRate ? Number(currencyRate.buyRate) : 0;
  const sellRateAtTime = currencyRate ? Number(currencyRate.sellRate) : 0;

  let profit = feeNum;
  if (currencyRate) {
    const pkrAmount = orderType === "IR_TO_PK" ? calculatedPkr : amountNum;
    if (orderType === "BUY_PKR" || orderType === "PK_TO_IR") {
      profit += (rateNum - buyRateAtTime) * pkrAmount;
    } else {
      profit += (sellRateAtTime - rateNum) * pkrAmount;
    }
  }

  const order = await prisma.order.create({
    data: {
      tenantId: user.tenantId,
      userId: user.userId,
      customerId,
      currencyId,
      orderType,
      amount: amountNum,
      rate: rateNum,
      totalToman,
      calculatedPkr,
      fee: feeNum,
      profit,
      marketRateAtTime,
      buyRateAtTime,
      sellRateAtTime,
      recipientName: recipientName || null,
      recipientAccount: recipientAccount || null,
      recipientMethod: recipientMethod || null,
      destinationCard: destinationCard || null,
      destinationSheba: destinationSheba || null,
      description: description || null,
      status: "REGISTERED",
    },
    include: {
      customer: { select: { name: true } },
      currency: { select: { code: true, name: true } },
    },
  });

  return safeJson(order);
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

  const body = await request.json();
  const { id, status } = body;

  if (!id || !status) {
    return safeJson({ error: "id و status الزامی است" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return safeJson({ error: "سفارش یافت نشد" }, { status: 404 });

  const updated = await prisma.order.update({
    where: { id },
    data: { status, ...(status === "COMPLETED" ? { completedAt: new Date() } : {}) },
    include: {
      customer: { select: { name: true } },
      currency: { select: { code: true, name: true } },
      user: { select: { firstName: true, lastName: true } },
    },
  });

  if (status === "TOMAN_RECEIVED") {
    const tomanReg = await prisma.cashRegister.findFirst({ where: { tenantId: user.tenantId, type: "toman" } });
    if (tomanReg) {
      await prisma.cashEntry.create({
        data: { registerId: tomanReg.id, type: "in", amount: order.totalToman, description: `دریافت تومان - سفارش ${order.orderType}` },
      });
      await prisma.cashRegister.update({ where: { id: tomanReg.id }, data: { balance: { increment: order.totalToman } } });
    }
  }

  if (status === "PKR_TRANSFERRED") {
    const pkrReg = await prisma.cashRegister.findFirst({ where: { tenantId: user.tenantId, type: "rupee" } });
    if (pkrReg) {
      const pkrAmount = order.calculatedPkr || 0;
      await prisma.cashEntry.create({
        data: { registerId: pkrReg.id, type: "out", amount: pkrAmount, description: `واریز روپیه - سفارش ${order.orderType}` },
      });
      await prisma.cashRegister.update({ where: { id: pkrReg.id }, data: { balance: { decrement: pkrAmount } } });
    }
  }

  if (status === "COMPLETED") {
    await prisma.transaction.create({
      data: {
        tenantId: order.tenantId,
        userId: order.userId,
        customerId: order.customerId,
        orderId: order.id,
        currencyId: order.currencyId,
        type: order.orderType === "BUY_PKR" || order.orderType === "PK_TO_IR" ? "buy" : "sell",
        amount: order.orderType === "IR_TO_PK" ? order.calculatedPkr || 0 : order.amount,
        rate: order.rate,
        totalToman: order.totalToman,
        profit: order.profit || 0,
        description: `تکمیل سفارش ${order.orderType}`,
      },
    });

    if (order.orderType === "IR_TO_PK" || order.orderType === "SELL_PKR") {
      await prisma.customer.update({ where: { id: order.customerId }, data: { totalBuy: { increment: order.totalToman } } });
    } else {
      await prisma.customer.update({ where: { id: order.customerId }, data: { totalSell: { increment: order.totalToman } } });
    }
  }

  return safeJson(updated);
}
