import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getTokenUser, getOrganizationId } from "@lib/auth/verify-token";
import { handleApiError } from "@lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    getTokenUser(request);
    const organizationId = getOrganizationId(request);

    const documents = await prisma.document.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        documentType: true,
        status: true,
      },
    });

    return NextResponse.json(
      documents.map((d) => ({
        id: d.id,
        title: d.title,
        document_type: d.documentType,
        status: d.status,
      })),
    );
  } catch (err) {
    return handleApiError(err);
  }
}
