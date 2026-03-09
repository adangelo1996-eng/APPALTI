import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getTokenUser, getOrganizationId } from "@lib/auth/verify-token";
import { handleApiError, jsonError } from "@lib/api-helpers";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  text: z.string().min(1),
  status: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    getTokenUser(request);
    const organizationId = getOrganizationId(request);
    const { id } = await params;

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Dati non validi: testo obbligatorio.", 400);
    }

    const existing = await prisma.generatedSection.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return jsonError("Sezione non trovata.", 404);
    }

    const section = await prisma.generatedSection.update({
      where: { id },
      data: {
        generatedText: parsed.data.text,
        status: parsed.data.status ?? existing.status,
        updatedAt: new Date(),
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
