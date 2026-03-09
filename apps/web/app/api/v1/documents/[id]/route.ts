import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getTokenUser, getOrganizationId } from "@lib/auth/verify-token";
import { handleApiError, jsonError } from "@lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    getTokenUser(request);
    const organizationId = getOrganizationId(request);
    const { id } = await params;

    const doc = await prisma.document.findFirst({
      where: { id, organizationId },
    });

    if (!doc) {
      return jsonError("Documento non trovato.", 404);
    }

    return NextResponse.json({
      id: doc.id,
      title: doc.title,
      document_type: doc.documentType,
      status: doc.status,
      pages_count: doc.pagesCount,
      language: doc.language,
      raw_text: doc.rawText,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
