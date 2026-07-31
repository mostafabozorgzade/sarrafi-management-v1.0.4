import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN") return safeJson({ error: "دسترسی ندارید" }, { status: 403 });

  try {
    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) return safeJson({ error: "شناسه صرافی الزامی است" }, { status: 400 });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return safeJson({ error: "صرافی یافت نشد" }, { status: 404 });

    if (tenant.billingMode !== "PERCENTAGE") {
      return safeJson({ error: "این صرافی از نوع درصدی نیست" }, { status: 400 });
    }

    const now = new Date();
    const lastCalculated = tenant.amountDueLastCalculated || tenant.createdAt;

    const whereClause: Record<string, unknown> = {
      tenantId,
      status: "COMPLETED",
      createdAt: { gt: lastCalculated, lte: now },
    };

    if (tenant.percentageBase === "profit") {
      const result = await prisma.order.aggregate({
        where: whereClause,
        _sum: { totalProfitAmount: true },
      });

      const totalProfit = Number(result._sum.totalProfitAmount || 0);
      const percentageAmount = tenant.percentageRate ? totalProfit * (tenant.percentageRate / 100) : 0;

      const pkResult = await prisma.order.aggregate({
        where: { ...whereClause, orderType: { in: ["IR_TO_PK", "BUY_PKR"] } },
        _sum: { calculatedPkr: true },
      });

      const totalPkr = Number(pkResult._sum.calculatedPkr || 0);
      const fixedAmount = tenant.fixedFeePer1000PKR
        ? (totalPkr / 1000) * Number(tenant.fixedFeePer1000PKR)
        : 0;

      const newAmountDue = BigInt(Math.round(percentageAmount + fixedAmount));
      const totalAmountDue = tenant.amountDue + newAmountDue;

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          amountDue: totalAmountDue,
          amountDueLastCalculated: now,
        },
      });

      return safeJson({
        tenantId,
        period: { from: lastCalculated, to: now },
        breakdown: { totalProfit, percentageRate: tenant.percentageRate, percentageAmount, totalPkr, fixedFeePer1000PKR: tenant.fixedFeePer1000PKR ? Number(tenant.fixedFeePer1000PKR) : null, fixedAmount },
        calculated: Number(newAmountDue),
        totalDue: Number(totalAmountDue),
      });
    } else {
      const result = await prisma.order.aggregate({
        where: whereClause,
        _sum: { totalToman: true },
      });

      const totalToman = Number(result._sum.totalToman || 0);
      const percentageAmount = tenant.percentageRate ? totalToman * (tenant.percentageRate / 100) : 0;

      const pkResult = await prisma.order.aggregate({
        where: { ...whereClause, orderType: { in: ["IR_TO_PK", "BUY_PKR"] } },
        _sum: { calculatedPkr: true },
      });

      const totalPkr = Number(pkResult._sum.calculatedPkr || 0);
      const fixedAmount = tenant.fixedFeePer1000PKR
        ? (totalPkr / 1000) * Number(tenant.fixedFeePer1000PKR)
        : 0;

      const newAmountDue = BigInt(Math.round(percentageAmount + fixedAmount));
      const totalAmountDue = tenant.amountDue + newAmountDue;

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          amountDue: totalAmountDue,
          amountDueLastCalculated: now,
        },
      });

      return safeJson({
        tenantId,
        period: { from: lastCalculated, to: now },
        breakdown: { totalToman, percentageRate: tenant.percentageRate, percentageAmount, totalPkr, fixedFeePer1000PKR: tenant.fixedFeePer1000PKR ? Number(tenant.fixedFeePer1000PKR) : null, fixedAmount },
        calculated: Number(newAmountDue),
        totalDue: Number(totalAmountDue),
      });
    }
  } catch (err) {
    console.error("Billing calculation error:", err);
    const message = err instanceof Error ? err.message : "خطا در محاسبه صورتحساب";
    return safeJson({ error: message }, { status: 500 });
  }
}
