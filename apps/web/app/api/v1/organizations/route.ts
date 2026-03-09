import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getTokenUser } from "@lib/auth/verify-token";
import { handleApiError, jsonError } from "@lib/api-helpers";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const tokenUser = getTokenUser(request);
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Dati non validi: nome organizzazione obbligatorio.", 400);
    }

    const org = await prisma.organization.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug ?? undefined,
      },
    });

    await prisma.membership.create({
      data: {
        userId: tokenUser.id,
        organizationId: org.id,
        role: "admin",
      },
    });

    return NextResponse.json(
      { id: org.id, name: org.name, slug: org.slug },
      { status: 201 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
