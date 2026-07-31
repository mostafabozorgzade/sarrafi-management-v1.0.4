import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, getTenantFilter } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN" && user.role !== "OWNER" && user.role !== "MANAGER") {
    return safeJson({ error: "دسترسی ندارید" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { firstName, lastName, role, password, isActive } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, tenantId: true },
    });

    if (!targetUser) {
      return safeJson({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && targetUser.tenantId !== user.tenantId) {
      return safeJson({ error: "دسترسی ندارید" }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (role) data.role = role;
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (password) {
      const bcrypt = await import("bcryptjs");
      data.password = await bcrypt.hash(password, 12);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, mobile: true, firstName: true, lastName: true, role: true, isActive: true },
    });

    return safeJson(updated);
  } catch (err) {
    console.error("User update error:", err);
    return safeJson({ error: "خطا در بروزرسانی کاربر" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN" && user.role !== "OWNER" && user.role !== "MANAGER") {
    return safeJson({ error: "دسترسی ندارید" }, { status: 403 });
  }

  const { id } = await params;

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, tenantId: true },
  });

  if (!targetUser) {
    return safeJson({ error: "کاربر یافت نشد" }, { status: 404 });
  }

  if (user.role !== "SUPER_ADMIN" && targetUser.tenantId !== user.tenantId) {
    return safeJson({ error: "دسترسی ندارید" }, { status: 403 });
  }

  await prisma.user.delete({ where: { id } });
  return safeJson({ success: true });
}
