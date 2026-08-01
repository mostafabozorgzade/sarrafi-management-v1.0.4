import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-helpers";
import { safeJson } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!user.tenantId) return safeJson({ billingMode: "FREE", subscriptionEnd: null, amountDue: "0" });

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: {
      billingMode: true,
      subscriptionEnd: true,
      amountDue: true,
    },
  });

  if (!tenant) return safeJson({ billingMode: "FREE", subscriptionEnd: null, amountDue: "0" });
  return safeJson(tenant);
}
