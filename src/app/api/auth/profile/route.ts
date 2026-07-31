import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { firstName, lastName, mobile, newPassword } = body;

    if (!firstName || !lastName || !mobile) {
      return safeJson({ error: "نام، نام خانوادگی و شماره موبایل الزامی است" }, { status: 400 });
    }

    if (!/^[0-9]+$/.test(mobile)) {
      return safeJson({ error: "فقط اعداد انگلیسی مجاز است" }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { mobile, id: { not: user.userId } },
      select: { id: true },
    });

    if (existingUser) {
      return safeJson({ error: "این شماره موبایل قبلا ثبت شده است" }, { status: 400 });
    }

    const data: Record<string, unknown> = {
      firstName,
      lastName,
      mobile,
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
