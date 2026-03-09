import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getTokenUser } from "@lib/auth/verify-token";
import { handleApiError } from "@lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const tokenUser = getTokenUser(request);

    const memberships = await prisma.membership.findMany({
      where: { userId: tokenUser.id },
      include: { organization: true },
    });

    const items = memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    return handleApiError(err);
  }
}
