from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenUser, get_current_user
from app.db.session import get_db


CurrentUser = Annotated[TokenUser, Depends(get_current_user)]
DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_organization_id(
    x_organization_id: str | None = Header(default=None, alias="X-Organization-Id"),
) -> str:
    if not x_organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Organization-Id header is required",
        )
    return x_organization_id

