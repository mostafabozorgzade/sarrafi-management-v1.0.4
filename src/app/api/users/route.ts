import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, getTenantFilter } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN" && !user.tenantId) return safeJson([]);

  const users = await prisma.user.findMany({
    where: getTenantFilter(user),
    select: { id: true, mobile: true, firstName: true, lastName: true, role: true, isActive: true, lastLogin: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return safeJson(users);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN" && user.role !== "OWNER" && user.role !== "MANAGER") return safeJson({ error: "دسترسی ندارید" }, { status: 403 });

  try {
    const body = await request.json();
    const { mobile, firstName, lastName, role, password, tenantId: bodyTenantId } = body;

    const tenantId = user.role === "SUPER_ADMIN" ? (bodyTenantId || user.tenantId) : user.tenantId;
    if (!tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

    if (!mobile || !firstName || !lastName || !password) {
      return safeJson({ error: "فیلدهای الزامی را پر کنید" }, { status: 400 });
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        tenantId,
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
    console.error("User creation error:", err);
    const message = err instanceof Error ? err.message : "خطا در ایجاد کاربر";
    return safeJson({ error: message }, { status: 500 });
  }
}
