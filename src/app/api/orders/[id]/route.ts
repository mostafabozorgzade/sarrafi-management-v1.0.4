import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      customer: { select: { name: true, phone: true } },
      currency: { select: { code: true, name: true } },
      user: { select: { firstName: true, lastName: true } },
    },
  });

  if (!order) return safeJson({ error: "سفارش یافت نشد" }, { status: 404 });
  return safeJson(order);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

  try {
    const { id } = await params;
    const existing = await prisma.order.findFirst({ where: { id, tenantId: user.tenantId } });
    if (!existing) return safeJson({ error: "سفارش یافت نشد" }, { status: 404 });

    if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
      return safeJson({ error: "سفارش تکمیل شده یا لغو شده قابل ویرایش نیست" }, { status: 400 });
    }

    const body = await request.json();
    const {
      customerId, currencyId, amount, fee, transferCost,
      recipientName, recipientAccount, recipientMethod,
      destinationCard, destinationSheba, description,
    } = body;

    if (!customerId || !currencyId || !amount) {
      return safeJson({ error: "فیلدهای الزامی را پر کنید" }, { status: 400 });
    }

    const orderType = existing.orderType;
    const amountNum = Number(amount);
    const feeNum = Number(fee || 0);
    const transferCostNum = Number(transferCost || 0);

    const currencyRate = await prisma.currencyRate.findUnique({
      where: { tenantId_currencyId: { tenantId: user.tenantId, currencyId } },
    });

    const marketRateAtTime = currencyRate ? Number(currencyRate.marketRate ?? 0) : 0;
    const buyRateAtTime = currencyRate ? Number(currencyRate.buyRate ?? 0) : 0;
    const sellRateAtTime = currencyRate ? Number(currencyRate.sellRate ?? 0) : 0;

    const orderRate = (orderType === "BUY_PKR" || orderType === "PK_TO_IR") ? buyRateAtTime : sellRateAtTime;

    let totalToman: number;
    let calculatedPkr: number;

    if (orderType === "IR_TO_PK" || orderType === "SELL_PKR") {
      totalToman = amountNum;
      calculatedPkr = orderRate > 0 ? Math.round(amountNum / orderRate) : 0;
    } else {
      totalToman = amountNum * orderRate;
      calculatedPkr = amountNum;
    }

    const pkrAmount = (orderType === "IR_TO_PK" || orderType === "SELL_PKR") ? calculatedPkr : amountNum;

    let buyMarketProfit = 0;
    let sellMarketProfit = 0;
    let spreadProfit = 0;

    if (orderType === "BUY_PKR") {
      buyMarketProfit = (marketRateAtTime - buyRateAtTime) * pkrAmount;
      spreadProfit = (sellRateAtTime - buyRateAtTime) * pkrAmount;
    } else if (orderType === "SELL_PKR") {
      sellMarketProfit = (sellRateAtTime - marketRateAtTime) * pkrAmount;
      spreadProfit = (sellRateAtTime - buyRateAtTime) * pkrAmount;
    } else if (orderType === "IR_TO_PK") {
      sellMarketProfit = (sellRateAtTime - marketRateAtTime) * pkrAmount;
      spreadProfit = (sellRateAtTime - buyRateAtTime) * pkrAmount;
    } else if (orderType === "PK_TO_IR") {
      buyMarketProfit = (marketRateAtTime - buyRateAtTime) * pkrAmount;
      spreadProfit = (sellRateAtTime - buyRateAtTime) * pkrAmount;
    }

    const totalProfit = buyMarketProfit + sellMarketProfit + feeNum - transferCostNum;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        customerId,
        currencyId,
        amount: amountNum,
        totalToman,
        calculatedPkr,
        fee: feeNum,
        transferCost: transferCostNum,
        buyMarketProfitAmount: buyMarketProfit,
        sellMarketProfitAmount: sellMarketProfit,
        spreadProfitAmount: spreadProfit,
        feeAmount: feeNum,
        totalProfitAmount: totalProfit,
        marketRateAtTime,
        buyRateAtTime,
        sellRateAtTime,
        recipientName: recipientName || null,
        recipientAccount: recipientAccount || null,
        recipientMethod: recipientMethod || null,
        destinationCard: destinationCard || null,
        destinationSheba: destinationSheba || null,
        description: description || null,
      },
      include: {
        customer: { select: { name: true, phone: true } },
        currency: { select: { code: true, name: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    });

    return safeJson(updated);
  } catch (err) {
    console.error("Order update error:", err);
    const message = err instanceof Error ? err.message : "خطا در بروزرسانی سفارش";
    return safeJson({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

  try {
    const { id } = await params;
    const existing = await prisma.order.findFirst({ where: { id, tenantId: user.tenantId } });
    if (!existing) return safeJson({ error: "سفارش یافت نشد" }, { status: 404 });

    if (existing.status === "COMPLETED") {
      return safeJson({ error: "سفارش تکمیل شده قابل حذف نیست" }, { status: 400 });
    }

    await prisma.order.delete({ where: { id } });
    return safeJson({ success: true });
  } catch (err) {
    console.error("Order delete error:", err);
    const message = err instanceof Error ? err.message : "خطا در حذف سفارش";
    return safeJson({ error: message }, { status: 500 });
  }
}
