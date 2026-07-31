import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, getTenantFilter, requireTenantId } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN" && !user.tenantId) return safeJson([]);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const customerId = searchParams.get("customerId");
  const currencyId = searchParams.get("currencyId");

  const where: Record<string, unknown> = { ...getTenantFilter(user) };
  if (type && type !== "all") where.type = type;
  if (customerId) where.customerId = customerId;
  if (currencyId) where.currencyId = currencyId;

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

  return safeJson(transactions);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { type, customerId, currencyId, amount, rate, description, tenantId: bodyTenantId } = body;

    const tenantId = user.role === "SUPER_ADMIN" ? (bodyTenantId || user.tenantId) : user.tenantId;
    if (!tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

    if (!type || !customerId || !currencyId || !amount || !rate) {
      return safeJson({ error: "فیلدهای الزامی را پر کنید" }, { status: 400 });
    }

    const amountNum = Number(amount);
    const rateNum = Number(rate);
    const totalToman = amountNum * rateNum;

    const currencyRate = await prisma.currencyRate.findUnique({
      where: { tenantId_currencyId: { tenantId, currencyId } },
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
        tenantId,
        userId: user.userId,
        customerId,
        currencyId,
        type,
        amount: BigInt(amountNum),
        rate: BigInt(rateNum),
        totalToman: BigInt(totalToman),
        profit: BigInt(profit),
        description: description || null,
      },
      include: { customer: { select: { name: true } }, currency: { select: { code: true } } },
    });

    if (type === "buy") {
      await prisma.customer.update({ where: { id: customerId }, data: { totalBuy: { increment: BigInt(totalToman) } } });
      const register = await prisma.cashRegister.findFirst({ where: { tenantId, type: "toman" } });
      if (register) {
        await prisma.cashEntry.create({ data: { registerId: register.id, type: "out", amount: BigInt(totalToman), description: `خرید ${transaction.currency.code} - ${transaction.customer.name}` } });
        await prisma.cashRegister.update({ where: { id: register.id }, data: { balance: { decrement: BigInt(totalToman) } } });
      }
    } else {
      await prisma.customer.update({ where: { id: customerId }, data: { totalSell: { increment: BigInt(totalToman) } } });
      const register = await prisma.cashRegister.findFirst({ where: { tenantId, type: "toman" } });
      if (register) {
        await prisma.cashEntry.create({ data: { registerId: register.id, type: "in", amount: BigInt(totalToman), description: `فروش ${transaction.currency.code} - ${transaction.customer.name}` } });
        await prisma.cashRegister.update({ where: { id: register.id }, data: { balance: { increment: BigInt(totalToman) } } });
      }
    }

    return safeJson(transaction);
  } catch (err) {
    console.error("Transaction creation error:", err);
    const message = err instanceof Error ? err.message : "خطا در ایجاد تراکنش";
    return safeJson({ error: message }, { status: 500 });
  }
}
