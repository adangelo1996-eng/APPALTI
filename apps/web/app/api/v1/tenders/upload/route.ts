import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getTokenUser, getOrganizationId } from "@lib/auth/verify-token";
import { handleApiError, jsonError } from "@lib/api-helpers";
import { extractTextFromPdf, normalizeText } from "@lib/services/pdf-parser";
import { parseTenderCriteria } from "@lib/services/tender-parsing";

export const dynamic = "force-dynamic";

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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let rawText = "";
    let pagesCount = 0;
    let docStatus = "uploaded";

    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      try {
        const result = await extractTextFromPdf(buffer);
        rawText = normalizeText(result.text);
        pagesCount = result.pages;
        docStatus = "ready";
      } catch {
        docStatus = "failed";
      }
    }

    const doc = await prisma.document.create({
      data: {
        organizationId,
        uploaderId: tokenUser.id,
        title: file.name,
        filePath: `uploads/${organizationId}/tenders/${file.name}`,
        documentType: "tender",
        status: docStatus,
        pagesCount: pagesCount || null,
        rawText: rawText || null,
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

    const parsedCriteria = rawText ? parseTenderCriteria(rawText) : [];

    for (const pc of parsedCriteria) {
      await prisma.tenderCriterion.create({
        data: {
          tenderId: tender.id,
          organizationId,
          code: pc.code,
          title: pc.title,
          description: pc.description || null,
          maxScore: pc.maxScore,
          constraints: pc.constraints,
          requiredDocuments: pc.requiredDocuments,
          keywords: pc.keywords,
          analysisNotes: pc.analysisNotes,
          needsReview: pc.needsReview,
          orderIndex: pc.orderIndex,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: tokenUser.id,
        action: "tender.created",
        targetType: "tender",
        targetId: tender.id,
        metadata: {
          title,
          filename: file.name,
          criteriaCount: parsedCriteria.length,
        },
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
