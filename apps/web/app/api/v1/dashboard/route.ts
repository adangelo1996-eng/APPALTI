import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getTokenUser, getOrganizationId } from "@lib/auth/verify-token";
import { handleApiError } from "@lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    getTokenUser(request);
    const organizationId = getOrganizationId(request);

    const [documentsCount, tendersCount, sectionsCount, recentActivity] =
      await Promise.all([
        prisma.document.count({ where: { organizationId } }),
        prisma.tender.count({ where: { organizationId } }),
        prisma.generatedSection.count({ where: { organizationId } }),
        prisma.activityLog.findMany({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { user: { select: { email: true } } },
        }),
      ]);

    return NextResponse.json({
      documents_count: documentsCount,
      tenders_count: tendersCount,
      sections_count: sectionsCount,
      recent_activity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        target_type: a.targetType,
        user_email: a.user?.email ?? null,
        created_at: a.createdAt.toISOString(),
        metadata: a.metadata,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
