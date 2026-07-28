import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson([]);

  const { searchParams } = new URL(request.url);
  const report = searchParams.get("type") || "transactions";

  const where = { tenantId: user.tenantId };

  switch (report) {
    case "transactions": {
      const transactions = await prisma.transaction.findMany({
        where,
        include: {
          customer: { select: { name: true } },
          currency: { select: { code: true, name: true } },
          user: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      });
      return safeJson(transactions);
    }

    case "profit": {
      const totalProfit = await prisma.transaction.aggregate({ where, _sum: { profit: true } });
      const monthlyProfit = await prisma.transaction.aggregate({
        where: { ...where, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
        _sum: { profit: true },
      });
      return safeJson({
        totalProfit: totalProfit._sum.profit || 0,
        monthlyProfit: monthlyProfit._sum.profit || 0,
        profitByEmployee: [],
      });
    }

    case "registers": {
      const registers = await prisma.cashRegister.findMany({
        where,
        include: { entries: { orderBy: { createdAt: "desc" }, take: 50 } },
      });
      return safeJson(registers);
    }

    case "customers": {
      const customers = await prisma.customer.findMany({
        where,
        include: { _count: { select: { transactions: true } } },
      });
      return safeJson(customers);
    }

    case "users": {
      const txByUser = await prisma.transaction.groupBy({
        by: ["userId"],
        where,
        _sum: { profit: true, totalToman: true },
        _count: true,
      });
      const userIds = txByUser.map((e) => e.userId);
      const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true, role: true } });
      const userMap = new Map(users.map((u) => [u.id, u]));
      return safeJson(txByUser.map((e) => ({
        ...userMap.get(e.userId),
        totalProfit: e._sum.profit || 0,
        totalVolume: e._sum.totalToman || 0,
        transactionCount: e._count,
      })));
    }

    default:
      return safeJson({ error: "نوع گزارش نامعتبر" }, { status: 400 });
  }
}
