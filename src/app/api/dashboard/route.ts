import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const where = user.role === "OWNER" ? {} : { tenantId: user.tenantId! };

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    todayTransactions,
    todayProfit,
    todayVolume,
    totalProfit,
    totalCustomers,
    pendingOrders,
    inProgressOrders,
    registers,
    rates,
    recentOrders,
    profitByEmployee,
  ] = await Promise.all([
    prisma.transaction.count({ where: { ...where, createdAt: { gte: startOfDay } } }),
    prisma.transaction.aggregate({ where: { ...where, createdAt: { gte: startOfDay } }, _sum: { profit: true } }),
    prisma.transaction.aggregate({ where: { ...where, createdAt: { gte: startOfDay } }, _sum: { totalToman: true } }),
    prisma.transaction.aggregate({ where, _sum: { profit: true } }),
    prisma.customer.count({ where }),
    prisma.order.count({ where: { ...where, status: { in: ["REGISTERED", "TOMAN_RECEIVED", "AWAITING_PKR_TRANSFER"] } } }),
    prisma.order.count({ where: { ...where, status: "IN_PROGRESS" } }),
    prisma.cashRegister.findMany({ where, select: { id: true, name: true, type: true, balance: true } }),
    prisma.currencyRate.findMany({
      where,
      include: { currency: { select: { code: true, name: true } } },
    }),
    prisma.order.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        currency: { select: { code: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.transaction.groupBy({
      by: ["userId"],
      where,
      _sum: { profit: true },
      _count: true,
    }),
  ]);

  const employeeIds = profitByEmployee.map((e) => e.userId);
  const employees = await prisma.user.findMany({
    where: { id: { in: employeeIds } },
    select: { id: true, firstName: true, lastName: true },
  });
  const employeeMap = new Map(employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`]));

  return NextResponse.json({
    stats: {
      todayTransactions,
      todayProfit: todayProfit._sum.profit || 0,
      todayVolume: todayVolume._sum.totalToman || 0,
      totalProfit: totalProfit._sum.profit || 0,
      totalCustomers,
      pendingOrders,
      inProgressOrders,
    },
    registers,
    rates,
    recentOrders,
    profitByEmployee: profitByEmployee.map((e) => ({
      name: employeeMap.get(e.userId) || "ناشناخته",
      profit: e._sum.profit || 0,
      count: e._count,
    })),
  });
}
