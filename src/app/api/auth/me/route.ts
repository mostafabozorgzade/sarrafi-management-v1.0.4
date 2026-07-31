import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        mobile: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        tenantId: true,
        tenant: { select: { id: true, name: true, isActive: true } },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    if (user.tenant && !user.tenant.isActive) {
      return NextResponse.json({
        user: {
          id: user.id,
          mobile: user.mobile,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenant?.name || null,
          isActive: false,
        },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        mobile: user.mobile,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name || null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
