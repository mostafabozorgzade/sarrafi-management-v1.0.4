import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, getTenantFilter } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN" && !user.tenantId) return safeJson([]);

  const expenses = await prisma.expense.findMany({
    where: getTenantFilter(user),
    include: { user: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return safeJson(expenses);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { category, amount, description, tenantId: bodyTenantId } = body;

    const tenantId = user.role === "SUPER_ADMIN" ? (bodyTenantId || user.tenantId) : user.tenantId;
    if (!tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

    if (!category || !amount) {
      return safeJson({ error: "فیلدهای الزامی را پر کنید" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        tenantId,
        userId: user.userId,
        category,
        amount: BigInt(Number(amount)),
        description: description || null,
      },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    return safeJson(expense);
  } catch (err) {
    console.error("Expense creation error:", err);
    const message = err instanceof Error ? err.message : "خطا در ایجاد هزینه";
    return safeJson({ error: message }, { status: 500 });
  }
}
