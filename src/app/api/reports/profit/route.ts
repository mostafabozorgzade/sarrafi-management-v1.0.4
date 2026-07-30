import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const orderType = searchParams.get("orderType");
  const status = searchParams.get("status");

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const completedStatus = "COMPLETED" as const;

  const whereBase = { tenantId: user.tenantId };

  const dateFilter: Prisma.DateTimeFilter = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to + "T23:59:59.999Z");

  const where: Prisma.OrderWhereInput = {
    ...whereBase,
    ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
    ...(orderType && orderType !== "all" ? { orderType: orderType as Prisma.EnumOrderTypeFilter["equals"] } : {}),
    status: (status && status !== "all" ? status : completedStatus) as Prisma.EnumOrderStatusFilter["equals"],
  };

  const whereAllStatuses: Prisma.OrderWhereInput = {
    ...whereBase,
    ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
    ...(orderType && orderType !== "all" ? { orderType: orderType as Prisma.EnumOrderTypeFilter["equals"] } : {}),
  };

  const todayWhere: Prisma.OrderWhereInput = { ...whereBase, createdAt: { gte: startOfDay }, status: completedStatus };
  const weekWhere: Prisma.OrderWhereInput = { ...whereBase, createdAt: { gte: startOfWeek }, status: completedStatus };
  const monthWhere: Prisma.OrderWhereInput = { ...whereBase, createdAt: { gte: startOfMonth }, status: completedStatus };
  const allTimeWhere: Prisma.OrderWhereInput = { ...whereBase, status: completedStatus };

  const [
    todayStats,
    weekStats,
    monthStats,
    allTimeStats,
    orders,
    profitByType,
    recentCompletedOrders,
    statusCounts,
    topCustomersRaw,
    expenses,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: todayWhere,
      _sum: { buyMarketProfitAmount: true, sellMarketProfitAmount: true, spreadProfitAmount: true, feeAmount: true, transferCost: true, totalProfitAmount: true, totalToman: true, calculatedPkr: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: weekWhere,
      _sum: { buyMarketProfitAmount: true, sellMarketProfitAmount: true, spreadProfitAmount: true, feeAmount: true, transferCost: true, totalProfitAmount: true, totalToman: true, calculatedPkr: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: monthWhere,
      _sum: { buyMarketProfitAmount: true, sellMarketProfitAmount: true, spreadProfitAmount: true, feeAmount: true, transferCost: true, totalProfitAmount: true, totalToman: true, calculatedPkr: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: allTimeWhere,
      _sum: { buyMarketProfitAmount: true, sellMarketProfitAmount: true, spreadProfitAmount: true, feeAmount: true, transferCost: true, totalProfitAmount: true, totalToman: true, calculatedPkr: true },
      _count: true,
    }),
    prisma.order.findMany({
      where,
      select: {
        id: true, orderType: true, status: true, amount: true, totalToman: true,
        calculatedPkr: true, fee: true, transferCost: true,
        buyMarketProfitAmount: true, sellMarketProfitAmount: true, spreadProfitAmount: true, feeAmount: true, totalProfitAmount: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.order.groupBy({
      by: ["orderType"],
      where: allTimeWhere,
      _sum: { buyMarketProfitAmount: true, sellMarketProfitAmount: true, spreadProfitAmount: true, feeAmount: true, transferCost: true, totalProfitAmount: true, totalToman: true, calculatedPkr: true },
      _count: true,
      orderBy: { orderType: "asc" },
    }),
    prisma.order.findMany({
      where: {
        ...whereBase,
        status: completedStatus,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        buyMarketProfitAmount: true,
        sellMarketProfitAmount: true,
        spreadProfitAmount: true,
        feeAmount: true,
        transferCost: true,
        totalProfitAmount: true,
        totalToman: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: whereAllStatuses,
      _count: true,
      orderBy: { status: "asc" },
    }),
    prisma.order.groupBy({
      by: ["customerId"],
      where: {
        ...whereBase,
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
        status: completedStatus,
      },
      _sum: { totalToman: true, totalProfitAmount: true },
      _count: true,
      orderBy: { customerId: "asc" },
      take: 10,
    }),
    prisma.expense.findMany({
      where: {
        ...whereBase,
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      select: { id: true, category: true, amount: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const extractSum = (sum: typeof todayStats._sum) => ({
    buyMarketProfit: sum?.buyMarketProfitAmount || 0,
    sellMarketProfit: sum?.sellMarketProfitAmount || 0,
    spreadProfit: sum?.spreadProfitAmount || 0,
    feeProfit: sum?.feeAmount || 0,
    transferCost: sum?.transferCost || 0,
    totalProfit: sum?.totalProfitAmount || 0,
    totalToman: sum?.totalToman || 0,
    totalPkr: sum?.calculatedPkr || 0,
  });

  const statusMap: Record<string, number> = {};
  for (const s of statusCounts) {
    statusMap[s.status] = (s._count as unknown as { _all?: number })?._all ?? (s._count as number) ?? 0;
  }

  const dailyProfitMap = new Map<string, {
    orderCount: number;
    buyMarketProfit: bigint;
    sellMarketProfit: bigint;
    spreadProfit: bigint;
    feeProfit: bigint;
    transferCost: bigint;
    totalProfit: bigint;
    totalToman: bigint;
  }>();

  for (const o of recentCompletedOrders) {
    const dateKey = o.createdAt.toISOString().split("T")[0];
    const existing = dailyProfitMap.get(dateKey);
    if (existing) {
      existing.orderCount += 1;
      existing.buyMarketProfit = BigInt(existing.buyMarketProfit) + BigInt(o.buyMarketProfitAmount || 0);
      existing.sellMarketProfit = BigInt(existing.sellMarketProfit) + BigInt(o.sellMarketProfitAmount || 0);
      existing.spreadProfit = BigInt(existing.spreadProfit) + BigInt(o.spreadProfitAmount || 0);
      existing.feeProfit = BigInt(existing.feeProfit) + BigInt(o.feeAmount || 0);
      existing.transferCost = BigInt(existing.transferCost) + BigInt(o.transferCost || 0);
      existing.totalProfit = BigInt(existing.totalProfit) + BigInt(o.totalProfitAmount || 0);
      existing.totalToman = BigInt(existing.totalToman) + BigInt(o.totalToman || 0);
    } else {
      dailyProfitMap.set(dateKey, {
        orderCount: 1,
        buyMarketProfit: BigInt(o.buyMarketProfitAmount || 0),
        sellMarketProfit: BigInt(o.sellMarketProfitAmount || 0),
        spreadProfit: BigInt(o.spreadProfitAmount || 0),
        feeProfit: BigInt(o.feeAmount || 0),
        transferCost: BigInt(o.transferCost || 0),
        totalProfit: BigInt(o.totalProfitAmount || 0),
        totalToman: BigInt(o.totalToman || 0),
      });
    }
  }

  const dailyProfit = Array.from(dailyProfitMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const topCustomerIds = topCustomersRaw.map((c) => c.customerId);
  const topCustomerRecords = topCustomerIds.length > 0
    ? await prisma.customer.findMany({
        where: { id: { in: topCustomerIds }, tenantId: user.tenantId },
        select: { id: true, name: true },
      })
    : [];
  const customerNameMap = new Map(topCustomerRecords.map((c) => [c.id, c.name]));

  const topCustomers = topCustomersRaw
    .map((c) => ({
      customerId: c.customerId,
      customerName: customerNameMap.get(c.customerId) || "\u0646\u0627\u0645\u0634\u062e\u0635",
      orderCount: (c._count as unknown as { _all?: number })?._all ?? (c._count as number) ?? 0,
      totalToman: c._sum?.totalToman || 0,
      totalProfit: c._sum?.totalProfitAmount || 0,
    }))
    .sort((a, b) => Number(b.totalToman) - Number(a.totalToman));

  const totalExpenses = expenses
    .filter((e) => !["\u06a9\u0627\u0631\u0645\u0632\u062f", "\u062e\u062f\u0645\u0627\u062a \u0628\u0631\u0646\u0627\u0645\u0647\u0627\u06cc"].includes(e.category))
    .reduce((s, e) => s + Number(e.amount), 0);
  const totalIncome = expenses
    .filter((e) => ["\u06a9\u0627\u0631\u0645\u0632\u062f", "\u062e\u062f\u0645\u0627\u062a \u0628\u0631\u0646\u0627\u0645\u0647\u0627\u06cc"].includes(e.category))
    .reduce((s, e) => s + Number(e.amount), 0);

  return safeJson({
    summary: {
      today: { ...extractSum(todayStats._sum), orderCount: todayStats._count },
      thisWeek: { ...extractSum(weekStats._sum), orderCount: weekStats._count },
      thisMonth: { ...extractSum(monthStats._sum), orderCount: monthStats._count },
      allTime: { ...extractSum(allTimeStats._sum), orderCount: allTimeStats._count },
    },
    statusCounts: {
      IN_PROGRESS: statusMap["IN_PROGRESS"] || 0,
      COMPLETED: statusMap["COMPLETED"] || 0,
      CANCELLED: statusMap["CANCELLED"] || 0,
      total: Object.values(statusMap).reduce((a, b) => a + b, 0),
    },
    profitByType: profitByType.map((p) => ({
      orderType: p.orderType,
      buyMarketProfit: p._sum?.buyMarketProfitAmount || 0,
      sellMarketProfit: p._sum?.sellMarketProfitAmount || 0,
      spreadProfit: p._sum?.spreadProfitAmount || 0,
      feeProfit: p._sum?.feeAmount || 0,
      transferCost: p._sum?.transferCost || 0,
      totalProfit: p._sum?.totalProfitAmount || 0,
      totalToman: p._sum?.totalToman || 0,
      totalPkr: p._sum?.calculatedPkr || 0,
      count: (p._count as unknown as { _all?: number })?._all ?? (p._count as number) ?? 0,
    })),
    dailyProfit: dailyProfit,
    filteredOrders: orders,
    topCustomers: topCustomers,
    expenses: {
      totalExpenses,
      totalIncome,
      netExpense: totalExpenses - totalIncome,
    },
  });
}
