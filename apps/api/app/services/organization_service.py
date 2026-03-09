from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.organization import Organization
from app.db.models.user import Membership
from app.db.models.activity import ActivityLog


async def list_user_organizations(session: AsyncSession, user_id: str) -> list[dict[str, Any]]:
    stmt = (
        select(Organization, Membership.role)
        .join(Membership, Membership.organization_id == Organization.id)
        .where(Membership.user_id == user_id)
        .order_by(Organization.created_at)
    )
    result = await session.execute(stmt)
    rows = result.all()
    return [
        {
            "id": str(org.id),
            "name": org.name,
            "slug": org.slug,
            "role": role,
        }
        for org, role in rows
    ]


async def create_organization(
    session: AsyncSession,
    user_id: str,
    name: str,
    slug: str | None = None,
) -> Organization:
    org = Organization(name=name, slug=slug)
    session.add(org)
    await session.flush()

    membership = Membership(user_id=user_id, organization_id=org.id, role="admin")
    session.add(membership)

    log = ActivityLog(
        organization_id=org.id,
        user_id=user_id,
        action="organization.created",
        target_type="organization",
        target_id=org.id,
        metadata={"name": name},
    )
    session.add(log)

    await session.commit()
    await session.refresh(org)
    return org

