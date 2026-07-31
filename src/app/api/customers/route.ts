import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, getTenantFilter, requireTenantId } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    if (user.role !== "SUPER_ADMIN" && !user.tenantId) return safeJson({ customers: [], total: 0 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const tenantWhere = getTenantFilter(user);

    if (pageParam) {
      const page = Math.max(1, parseInt(pageParam, 10));
      const limit = Math.min(100, Math.max(1, parseInt(limitParam || "10", 10)));
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = { ...tenantWhere, deletedAt: null };
      if (search && search.trim()) {
        const q = search.trim();
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ];
      }

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.customer.count({ where }),
      ]);

      return safeJson({ customers, total, page, limit });
    }

    const where: Record<string, unknown> = { ...tenantWhere, deletedAt: null };
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return safeJson({ customers, total: customers.length });
  } catch (err) {
    console.error("Customers GET error:", err);
    return safeJson({ error: err instanceof Error ? err.message : "خطا در دریافت مشتریان", customers: [], total: 0 }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { name, phone, pakAccount, address, tenantId: bodyTenantId } = body;

    const tenantId = user.role === "SUPER_ADMIN" ? (bodyTenantId || user.tenantId) : user.tenantId;
    if (!tenantId) return safeJson({ error: "tenant required" }, { status: 400 });

    if (!name || !phone) {
      return safeJson({ error: "نام و شماره تماس الزامی است" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name,
        phone,
        address: address || null,
        pakAccount: pakAccount || null,
      },
    });

    return safeJson(customer);
  } catch (err) {
    console.error("Customer creation error:", err);
    const message = err instanceof Error ? err.message : "خطا در ایجاد مشتری";
    return safeJson({ error: message }, { status: 500 });
  }
}
