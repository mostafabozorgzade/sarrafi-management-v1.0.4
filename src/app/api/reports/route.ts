import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const report = searchParams.get("type") || "transactions";

  const where = user.role === "OWNER" ? {} : { tenantId: user.tenantId! };

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
      return NextResponse.json(transactions);
    }

    case "profit": {
      const totalProfit = await prisma.transaction.aggregate({ where, _sum: { profit: true } });
      const monthlyProfit = await prisma.transaction.aggregate({
        where: { ...where, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
        _sum: { profit: true },
      });
      const profitByEmployee = await prisma.transaction.groupBy({
        by: ["userId"],
        where,
        _sum: { profit: true },
        _count: true,
      });
      const employeeIds = profitByEmployee.map((e) => e.userId);
      const employees = await prisma.user.findMany({ where: { id: { in: employeeIds } }, select: { id: true, firstName: true, lastName: true } });
      const employeeMap = new Map(employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`]));

      return NextResponse.json({
        totalProfit: totalProfit._sum.profit || 0,
        monthlyProfit: monthlyProfit._sum.profit || 0,
        profitByEmployee: profitByEmployee.map((e) => ({ name: employeeMap.get(e.userId) || "ناشناخته", profit: e._sum.profit || 0, count: e._count })),
      });
    }

    case "registers": {
      const registers = await prisma.cashRegister.findMany({
        where,
        include: {
          entries: { orderBy: { createdAt: "desc" }, take: 50 },
        },
      });
      return NextResponse.json(registers);
    }

    case "customers": {
      const customers = await prisma.customer.findMany({
        where,
        include: {
          _count: { select: { transactions: true } },
          transactions: { select: { profit: true, type: true, totalToman: true } },
        },
      });
      const enriched = customers.map((c) => ({
        ...c,
        transactionCount: c._count.transactions,
        totalProfit: c.transactions.reduce((s, t) => s + Number(t.profit), 0),
        _count: undefined,
        transactions: undefined,
      }));
      return NextResponse.json(enriched);
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
      return NextResponse.json(txByUser.map((e) => ({
        ...userMap.get(e.userId),
        totalProfit: e._sum.profit || 0,
        totalVolume: e._sum.totalToman || 0,
        transactionCount: e._count,
      })));
    }

    default:
      return NextResponse.json({ error: "نوع گزارش نامعتبر" }, { status: 400 });
  }
}
