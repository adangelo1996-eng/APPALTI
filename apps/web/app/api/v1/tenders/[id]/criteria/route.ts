import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getTokenUser, getOrganizationId } from "@lib/auth/verify-token";
import { handleApiError } from "@lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    getTokenUser(request);
    const organizationId = getOrganizationId(request);
    const { id } = await params;

    const criteria = await prisma.tenderCriterion.findMany({
      where: {
        tenderId: id,
        organizationId,
      },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json(
      criteria.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        description: c.description,
        max_score: c.maxScore ? Number(c.maxScore) : null,
        constraints: c.constraints,
        required_documents: c.requiredDocuments,
        keywords: c.keywords,
        analysis_notes: c.analysisNotes,
        needs_review: c.needsReview,
        order_index: c.orderIndex,
      })),
    );
  } catch (err) {
    return handleApiError(err);
  }
}
