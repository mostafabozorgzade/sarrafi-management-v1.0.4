import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN") return safeJson({ error: "دسترسی ندارید" }, { status: 403 });

  const { id } = await params;

  const users = await prisma.user.findMany({
    where: { tenantId: id },
    select: { id: true, mobile: true, firstName: true, lastName: true, role: true, isActive: true, lastLogin: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return safeJson(users);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN") return safeJson({ error: "دسترسی ندارید" }, { status: 403 });

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) return safeJson({ error: "صرافی یافت نشد" }, { status: 404 });

  try {
    const body = await request.json();
    const { mobile, firstName, lastName, password, role } = body;

    if (!mobile || !firstName || !lastName || !password) {
      return safeJson({ error: "فیلدهای الزامی را پر کنید" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { mobile } });
    if (existingUser) return safeJson({ error: "کاربری با این شماره موبایل وجود دارد" }, { status: 400 });

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        tenantId: id,
        mobile,
        firstName,
        lastName,
        password: hashedPassword,
        role: role || "CASHIER",
      },
      select: { id: true, mobile: true, firstName: true, lastName: true, role: true, isActive: true },
    });

    return safeJson(newUser);
  } catch (err) {
    console.error("Tenant user creation error:", err);
    const message = err instanceof Error ? err.message : "خطا در ایجاد کاربر";
    return safeJson({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN") return safeJson({ error: "دسترسی ندارید" }, { status: 403 });

  const { id } = await params;

  try {
    const body = await request.json();
    const { userId, tenantId } = body;

    if (!userId || !tenantId) return safeJson({ error: "userId و tenantId الزامی است" }, { status: 400 });

    const targetTenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!targetTenant) return safeJson({ error: "صرافی مقصد یافت نشد" }, { status: 404 });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { tenantId },
      select: { id: true, mobile: true, firstName: true, lastName: true, role: true, tenantId: true },
    });

    return safeJson(updatedUser);
  } catch (err) {
    console.error("Tenant user move error:", err);
    const message = err instanceof Error ? err.message : "خطا در انتقال کاربر";
    return safeJson({ error: message }, { status: 500 });
  }
}
