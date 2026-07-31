import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, getTenantFilter } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN" && !user.tenantId) return safeJson({ history: [], total: 0 });

  const { searchParams } = new URL(request.url);
  const currencyId = searchParams.get("currencyId");
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");

  const where: Record<string, unknown> = { ...getTenantFilter(user) };
  if (currencyId) where.currencyId = currencyId;

  if (pageParam) {
    const page = Math.max(1, parseInt(pageParam, 10));
    const limit = Math.min(100, Math.max(1, parseInt(limitParam || "20", 10)));
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.rateHistory.findMany({
        where,
        include: {
          currency: { select: { code: true, name: true } },
          changedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.rateHistory.count({ where }),
    ]);

    return safeJson({ history, total, page, limit });
  }

  const limit = Math.min(200, parseInt(limitParam || "50", 10));
  const history = await prisma.rateHistory.findMany({
    where,
    include: {
      currency: { select: { code: true, name: true } },
      changedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return safeJson({ history, total: history.length });
}
