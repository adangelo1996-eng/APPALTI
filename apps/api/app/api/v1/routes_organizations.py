from fastapi import APIRouter
from pydantic import BaseModel

from app.api.deps import DbSession, CurrentUser
from app.services.organization_service import list_user_organizations, create_organization


router = APIRouter(prefix="/organizations", tags=["organizations"])


class OrganizationCreateRequest(BaseModel):
    name: str
    slug: str | None = None


@router.get("/my")
async def get_my_organizations(
    db: DbSession,
    current_user: CurrentUser,
):
    orgs = await list_user_organizations(db, current_user.id)
    return {"items": orgs}


@router.post("")
async def create_my_organization(
    payload: OrganizationCreateRequest,
    db: DbSession,
    current_user: CurrentUser,
):
    org = await create_organization(db, current_user.id, payload.name, payload.slug)
    return {
        "id": str(org.id),
        "name": org.name,
        "slug": org.slug,
    }

