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
        include: {
          currencyRates: {
            select: { buyRate: true, sellRate: true, marketRate: true },
          },
        },
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
    const {
      name, address, phone, isActive,
      billingMode, subscriptionStart, subscriptionEnd,
      percentageBase, percentageRate, fixedFeePer1000PKR,
      amountDue,
    } = body;

    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) return safeJson({ error: "صرافی یافت نشد" }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (billingMode !== undefined) updateData.billingMode = billingMode;
    if (subscriptionStart !== undefined) updateData.subscriptionStart = subscriptionStart ? new Date(subscriptionStart) : null;
    if (subscriptionEnd !== undefined) updateData.subscriptionEnd = subscriptionEnd ? new Date(subscriptionEnd) : null;
    if (percentageBase !== undefined) updateData.percentageBase = percentageBase;
    if (percentageRate !== undefined) updateData.percentageRate = percentageRate;
    if (fixedFeePer1000PKR !== undefined) updateData.fixedFeePer1000PKR = fixedFeePer1000PKR != null ? BigInt(fixedFeePer1000PKR) : null;
    if (amountDue !== undefined) updateData.amountDue = BigInt(amountDue);

    const tenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
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
