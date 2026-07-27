import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
  });

  if (!customer) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  return NextResponse.json(customer);
}
