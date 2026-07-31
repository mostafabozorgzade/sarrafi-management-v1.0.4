import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { firstName, lastName, newPassword } = body;

    if (!firstName || !lastName) {
      return safeJson({ error: "نام و نام خانوادگی الزامی است" }, { status: 400 });
    }

    const data: Record<string, unknown> = {
      firstName,
      lastName,
    };

    if (newPassword) {
      const bcrypt = await import("bcryptjs");
      data.password = await bcrypt.hash(newPassword, 12);
    }

    const updated = await prisma.user.update({
      where: { id: user.userId },
      data,
      select: { id: true, mobile: true, firstName: true, lastName: true, role: true, tenantId: true },
    });

    return safeJson({
      user: {
        ...updated,
        tenantName: null,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    const message = err instanceof Error ? err.message : "خطا در بروزرسانی پروفایل";
    return safeJson({ error: message }, { status: 500 });
  }
}
