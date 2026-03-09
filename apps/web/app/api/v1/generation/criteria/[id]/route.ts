import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getTokenUser, getOrganizationId } from "@lib/auth/verify-token";
import { handleApiError, jsonError } from "@lib/api-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    getTokenUser(request);
    const organizationId = getOrganizationId(request);

    const criterion = await prisma.tenderCriterion.findFirst({
      where: { id: params.id, organizationId },
    });

    if (!criterion) {
      return jsonError("Criterio non trovato.", 404);
    }

    const latestSection = await prisma.generatedSection.findFirst({
      where: { tenderCriterionId: params.id, organizationId },
      orderBy: { version: "desc" },
      include: {
        sources: {
          include: {
            documentChunk: {
              include: { document: { select: { id: true, title: true, documentType: true } } },
            },
          },
        },
      },
    });

    const sources = latestSection?.sources.map((s) => ({
      id: s.documentChunk.id,
      document_id: s.documentChunk.documentId,
      document_title: s.documentChunk.document.title,
      document_type: s.documentChunk.document.documentType,
      content: s.documentChunk.content,
      score: s.relevanceScore ? Number(s.relevanceScore) : 0,
    })) ?? [];

    return NextResponse.json({
      criterion: {
        id: criterion.id,
        code: criterion.code,
        title: criterion.title,
        description: criterion.description,
        max_score: criterion.maxScore ? Number(criterion.maxScore) : null,
        analysis_notes: criterion.analysisNotes,
        needs_review: criterion.needsReview,
      },
      sources,
      section: latestSection
        ? {
            id: latestSection.id,
            tender_id: latestSection.tenderId,
            tender_criterion_id: latestSection.tenderCriterionId,
            version: latestSection.version,
            status: latestSection.status,
            generated_text: latestSection.generatedText,
            weakness_flags: latestSection.weaknessFlags,
          }
        : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
