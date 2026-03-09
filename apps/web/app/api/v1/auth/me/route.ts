import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getTokenUser } from "@lib/auth/verify-token";
import { handleApiError } from "@lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const tokenUser = getTokenUser(request);

    let user = await prisma.user.findUnique({
      where: { id: tokenUser.id },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { id: tokenUser.id, email: tokenUser.email },
      });
    }

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
