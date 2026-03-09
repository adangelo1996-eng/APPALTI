from fastapi import APIRouter, Depends

from app.api.deps import DbSession, CurrentUser
from app.core.security import TokenUser
from app.services.auth_service import get_or_create_user, get_user_memberships


router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
async def get_me(
    db: DbSession,
    current_user: CurrentUser,
):
    user = await get_or_create_user(db, current_user)
    memberships = await get_user_memberships(db, str(user.id))
    return {
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
        },
        "memberships": [
            {
                "organization_id": str(m.organization_id),
                "role": m.role,
            }
            for m in memberships
        ],
    }

