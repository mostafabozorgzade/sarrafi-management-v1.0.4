import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN") return safeJson({ error: "دسترسی ندارید" }, { status: 403 });

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          orders: true,
          customers: true,
          transactions: true,
          currencies: true,
          cashRegisters: true,
        },
      },
      users: {
        select: { id: true, mobile: true, firstName: true, lastName: true, role: true, isActive: true, lastLogin: true },
        orderBy: { createdAt: "desc" },
      },
      currencies: {
        orderBy: { code: "asc" },
      },
    },
  });

  if (!tenant) return safeJson({ error: "صرافی یافت نشد" }, { status: 404 });
  return safeJson(tenant);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN") return safeJson({ error: "دسترسی ندارید" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, address, phone, isActive } = body;

    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) return safeJson({ error: "صرافی یافت نشد" }, { status: 404 });

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return safeJson(tenant);
  } catch (err) {
    console.error("Tenant update error:", err);
    const message = err instanceof Error ? err.message : "خطا در بروزرسانی صرافی";
    return safeJson({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN") return safeJson({ error: "دسترسی ندارید" }, { status: 403 });

  try {
    const { id } = await params;
    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) return safeJson({ error: "صرافی یافت نشد" }, { status: 404 });

    await prisma.tenant.delete({ where: { id } });
    return safeJson({ success: true });
  } catch (err) {
    console.error("Tenant delete error:", err);
    const message = err instanceof Error ? err.message : "خطا در حذف صرافی";
    return safeJson({ error: message }, { status: 500 });
  }
}
