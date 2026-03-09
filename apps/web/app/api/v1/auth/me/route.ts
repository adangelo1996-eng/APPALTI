import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getTokenUser } from "@lib/auth/verify-token";
import { handleApiError } from "@lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const tokenUser = getTokenUser(request);

    const user = await prisma.user.upsert({
      where: { id: tokenUser.id },
      update: { email: tokenUser.email },
      create: { id: tokenUser.id, email: tokenUser.email },
    });

    const memberships = await prisma.membership.findMany({
      where: { userId: tokenUser.id },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
      },
      memberships: memberships.map((m) => ({
        organization_id: m.organizationId,
        role: m.role,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
