import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const where = user.role === "OWNER" ? {} : { tenantId: user.tenantId! };

  const users = await prisma.user.findMany({
    where,
    select: { id: true, mobile: true, firstName: true, lastName: true, role: true, isActive: true, lastLogin: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "OWNER" && user.role !== "MANAGER") return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await request.json();
  const { mobile, firstName, lastName, role, password } = body;

  if (!mobile || !firstName || !lastName || !password) {
    return NextResponse.json({ error: "فیلدهای الزامی را پر کنید" }, { status: 400 });
  }

  const bcrypt = await import("bcryptjs");
  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await prisma.user.create({
    data: {
      tenantId: user.tenantId,
      mobile,
      firstName,
      lastName,
      password: hashedPassword,
      role: role || "CASHIER",
    },
    select: { id: true, mobile: true, firstName: true, lastName: true, role: true, isActive: true },
  });

  return NextResponse.json(newUser);
}
