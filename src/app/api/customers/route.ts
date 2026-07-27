import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const where = user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId! };

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return NextResponse.json({ error: "tenant required" }, { status: 400 });

  const body = await request.json();
  const { name, phone, pakAccount } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: "نام و شماره تماس الزامی است" }, { status: 400 });
  }

  const customer = await prisma.customer.create({
    data: {
      tenantId: user.tenantId,
      name,
      phone,
      pakAccount: pakAccount || null,
    },
  });

  return NextResponse.json(customer);
}
