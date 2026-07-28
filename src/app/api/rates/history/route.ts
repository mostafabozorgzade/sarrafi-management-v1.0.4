import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson([]);

  const { searchParams } = new URL(request.url);
  const currencyId = searchParams.get("currencyId");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const where: Record<string, unknown> = { tenantId: user.tenantId };
  if (currencyId) where.currencyId = currencyId;

  const history = await prisma.rateHistory.findMany({
    where,
    include: {
      currency: { select: { code: true, name: true } },
      changedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 200),
  });

  return safeJson(history);
}
