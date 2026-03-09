import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getTokenUser, getOrganizationId } from "@lib/auth/verify-token";
import { handleApiError, jsonError } from "@lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const tokenUser = getTokenUser(request);
    const organizationId = getOrganizationId(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("document_type") as string | null;

    if (!file) {
      return jsonError("File obbligatorio.", 400);
    }
    if (!documentType) {
      return jsonError("Tipologia documento obbligatoria.", 400);
    }

    const doc = await prisma.document.create({
      data: {
        organizationId,
        uploaderId: tokenUser.id,
        title: file.name,
        filePath: `uploads/${organizationId}/${file.name}`,
        documentType,
        status: "uploaded",
      },
    });

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
