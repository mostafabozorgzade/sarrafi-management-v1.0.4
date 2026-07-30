import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, getTenantFilter } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  const { id } = await params;

  const tenantWhere = user.role === "SUPER_ADMIN" ? {} : (user.tenantId ? { tenantId: user.tenantId } : {});

  const customer = await prisma.customer.findFirst({
    where: { id, deletedAt: null, ...tenantWhere },
    include: {
      transactions: {
        include: { currency: true, user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      orders: {
        include: { currency: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!customer) return safeJson({ error: "یافت نشد" }, { status: 404 });
  return safeJson(customer);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN" && !user.tenantId) return safeJson({ error: "tenant required" }, { status: 400 });
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, phone, address, pakAccount } = body;

    if (!name || !phone) {
      return safeJson({ error: "نام و شماره تماس الزامی است" }, { status: 400 });
    }

    const tenantWhere = user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId };
    const existing = await prisma.customer.findFirst({
      where: { id, deletedAt: null, ...tenantWhere },
    });

    if (!existing) return safeJson({ error: "یافت نشد" }, { status: 404 });

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        phone,
        address: address || null,
        pakAccount: pakAccount || null,
      },
    });

    return safeJson(customer);
  } catch (err) {
    console.error("Customer update error:", err);
    const message = err instanceof Error ? err.message : "خطا در ویرایش مشتری";
    return safeJson({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN" && !user.tenantId) return safeJson({ error: "tenant required" }, { status: 400 });
  const { id } = await params;

  try {
    const tenantWhere = user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId };
    const existing = await prisma.customer.findFirst({
      where: { id, deletedAt: null, ...tenantWhere },
    });

    if (!existing) return safeJson({ error: "یافت نشد" }, { status: 404 });

    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return safeJson({ success: true });
  } catch (err) {
    console.error("Customer soft delete error:", err);
    const message = err instanceof Error ? err.message : "خطا در حذف مشتری";
    return safeJson({ error: message }, { status: 500 });
  }
}
