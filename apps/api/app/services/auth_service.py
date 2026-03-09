from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenUser
from app.db.models.user import User, Membership


async def get_or_create_user(session: AsyncSession, token_user: TokenUser) -> User:
    result = await session.execute(select(User).where(User.id == token_user.id))
    user = result.scalar_one_or_none()
    if user:
        return user

    user = User(id=token_user.id, email=token_user.email)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def get_user_memberships(session: AsyncSession, user_id: str) -> list[Membership]:
    result = await session.execute(select(Membership).where(Membership.user_id == user_id))
    return list(result.scalars().all())

