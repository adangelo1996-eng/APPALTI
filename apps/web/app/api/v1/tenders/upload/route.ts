import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getTokenUser, getOrganizationId } from "@lib/auth/verify-token";
import { handleApiError, jsonError } from "@lib/api-helpers";

export async function POST(request: NextRequest) {
  try {
    const tokenUser = getTokenUser(request);
    const organizationId = getOrganizationId(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;

    if (!file) {
      return jsonError("File del bando obbligatorio.", 400);
    }
    if (!title) {
      return jsonError("Titolo del bando obbligatorio.", 400);
    }

    const doc = await prisma.document.create({
      data: {
        organizationId,
        uploaderId: tokenUser.id,
        title: file.name,
        filePath: `uploads/${organizationId}/tenders/${file.name}`,
        documentType: "tender",
        status: "uploaded",
      },
    });

    const tender = await prisma.tender.create({
      data: {
        organizationId,
        creatorId: tokenUser.id,
        title,
        status: "in_progress",
        tenderDocumentId: doc.id,
      },
    });

    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: tokenUser.id,
        action: "tender.created",
        targetType: "tender",
        targetId: tender.id,
        metadata: { title, filename: file.name },
      },
    });

    return NextResponse.json({
      id: tender.id,
      title: tender.title,
      status: tender.status,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
