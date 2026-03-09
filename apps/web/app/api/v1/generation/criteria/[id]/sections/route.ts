import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getTokenUser, getOrganizationId } from "@lib/auth/verify-token";
import { handleApiError } from "@lib/api-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    getTokenUser(request);
    const organizationId = getOrganizationId(request);
    const { id } = await params;

    const sections = await prisma.generatedSection.findMany({
      where: { tenderCriterionId: id, organizationId },
      orderBy: { version: "desc" },
    });

    return NextResponse.json(
      sections.map((s) => ({
        id: s.id,
        tender_id: s.tenderId,
        tender_criterion_id: s.tenderCriterionId,
        version: s.version,
        status: s.status,
        generated_text: s.generatedText,
        weakness_flags: s.weaknessFlags,
      })),
    );
  } catch (err) {
    return handleApiError(err);
  }
}
