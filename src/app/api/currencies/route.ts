import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson([]);

  const currencies = await prisma.currency.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { code: "asc" },
  });

  return safeJson(currencies);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson({ error: "tenant required" }, { status: 400 });
  if (user.role !== "OWNER") return safeJson({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await request.json();
  const { code, name, symbol } = body;

  if (!code || !name) {
    return safeJson({ error: "کد و نام ارز الزامی است" }, { status: 400 });
  }

  const currency = await prisma.currency.create({
    data: { tenantId: user.tenantId, code: code.toUpperCase(), name, symbol: symbol || null },
  });

  return safeJson(currency);
}
