import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const where = user.role === "OWNER" ? {} : { tenantId: user.tenantId! };

  const currencies = await prisma.currency.findMany({
    where,
    orderBy: { code: "asc" },
  });

  return NextResponse.json(currencies);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return NextResponse.json({ error: "tenant required" }, { status: 400 });
  if (user.role !== "OWNER") return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await request.json();
  const { code, name, symbol } = body;

  if (!code || !name) {
    return NextResponse.json({ error: "کد و نام ارز الزامی است" }, { status: 400 });
  }

  const currency = await prisma.currency.create({
    data: { tenantId: user.tenantId, code: code.toUpperCase(), name, symbol: symbol || null },
  });

  return NextResponse.json(currency);
}
