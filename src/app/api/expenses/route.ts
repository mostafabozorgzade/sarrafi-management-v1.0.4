import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson([]);

  const where = { tenantId: user.tenantId };

  const expenses = await prisma.expense.findMany({
    where,
    include: { user: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return safeJson(expenses);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

  const body = await request.json();
  const { category, amount, description } = body;

  if (!category || !amount) {
    return safeJson({ error: "فیلدهای الزامی را پر کنید" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      tenantId: user.tenantId,
      userId: user.userId,
      category,
      amount: Number(amount),
      description: description || null,
    },
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  return safeJson(expense);
}
