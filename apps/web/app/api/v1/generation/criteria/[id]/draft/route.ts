import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getTokenUser, getOrganizationId } from "@lib/auth/verify-token";
import { handleApiError, jsonError } from "@lib/api-helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const tokenUser = getTokenUser(request);
    const organizationId = getOrganizationId(request);

    const criterion = await prisma.tenderCriterion.findFirst({
      where: { id: params.id, organizationId },
    });

    if (!criterion) {
      return jsonError("Criterio non trovato.", 404);
    }

    const existingSections = await prisma.generatedSection.findMany({
      where: { tenderCriterionId: params.id, organizationId },
      orderBy: { version: "desc" },
      take: 1,
    });

    const nextVersion = existingSections.length > 0 ? existingSections[0].version + 1 : 1;

    const draftText = buildDraftText(criterion);

    const section = await prisma.generatedSection.create({
      data: {
        tenderId: criterion.tenderId,
        tenderCriterionId: params.id,
        organizationId,
        authorId: tokenUser.id,
        version: nextVersion,
        status: "draft",
        generatedText: draftText,
      },
    });

    return NextResponse.json({
      id: section.id,
      tender_id: section.tenderId,
      tender_criterion_id: section.tenderCriterionId,
      version: section.version,
      status: section.status,
      generated_text: section.generatedText,
      weakness_flags: section.weaknessFlags,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

function buildDraftText(criterion: {
  title: string;
  code: string | null;
  description: string | null;
}): string {
  const lines: string[] = [];
  lines.push(`## ${criterion.code ? criterion.code + " - " : ""}${criterion.title}`);
  lines.push("");

  if (criterion.description) {
    lines.push(criterion.description);
    lines.push("");
  }

  lines.push(
    "[Bozza generata automaticamente. Integrare con contenuti specifici dalla knowledge base documentale.]",
  );

  return lines.join("\n");
}
