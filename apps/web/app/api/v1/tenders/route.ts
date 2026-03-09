import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getTokenUser, getOrganizationId } from "@lib/auth/verify-token";
import { handleApiError } from "@lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    getTokenUser(request);
    const organizationId = getOrganizationId(request);

    const tenders = await prisma.tender.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    return NextResponse.json(
      tenders.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
      })),
    );
  } catch (err) {
    return handleApiError(err);
  }
}
