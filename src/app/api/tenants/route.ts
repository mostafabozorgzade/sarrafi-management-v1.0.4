import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN") return safeJson({ error: "دسترسی ندارید" }, { status: 403 });

  const tenants = await prisma.tenant.findMany({
    include: {
      _count: {
        select: {
          users: true,
          orders: true,
          customers: true,
          transactions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return safeJson(tenants);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN") return safeJson({ error: "دسترسی ندارید" }, { status: 403 });

  try {
    const body = await request.json();
    const { name, address, phone, currencies } = body;

    if (!name) {
      return safeJson({ error: "نام صرافی الزامی است" }, { status: 400 });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        address: address || null,
        phone: phone || null,
      },
    });

    if (currencies && Array.isArray(currencies) && currencies.length > 0) {
      for (const curr of currencies) {
        const currency = await prisma.currency.create({
          data: {
            tenantId: tenant.id,
            code: curr.code,
            name: curr.name,
            symbol: curr.symbol,
          },
        });

        await prisma.currencyRate.create({
          data: {
            tenantId: tenant.id,
            currencyId: currency.id,
            buyRate: BigInt(curr.buyRate),
            sellRate: BigInt(curr.sellRate),
            marketRate: BigInt(curr.marketRate || Math.round((curr.buyRate + curr.sellRate) / 2)),
            changedById: user.userId,
          },
        });
      }
    }

    return safeJson(tenant);
  } catch (err) {
    console.error("Tenant creation error:", err);
    const message = err instanceof Error ? err.message : "خطا در ایجاد صرافی";
    return safeJson({ error: message }, { status: 500 });
  }
}
