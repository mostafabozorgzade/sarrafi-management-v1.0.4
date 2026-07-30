import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson([]);

  const customers = await prisma.customer.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: "desc" },
  });

  return safeJson(customers);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

  try {
    const body = await request.json();
    const { name, phone, pakAccount, address } = body;

    if (!name || !phone) {
      return safeJson({ error: "نام و شماره تماس الزامی است" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId: user.tenantId,
        name,
        phone,
        address: address || null,
        pakAccount: pakAccount || null,
      },
    });

    return safeJson(customer);
  } catch (err) {
    console.error("Customer creation error:", err);
    const message = err instanceof Error ? err.message : "خطا در ایجاد مشتری";
    return safeJson({ error: message }, { status: 500 });
  }
}
