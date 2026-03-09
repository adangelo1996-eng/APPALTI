from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings


settings = get_settings()

if not settings.database_url:
    raise RuntimeError("DATABASE_URL is not configured")

if settings.database_url.startswith("postgresql://"):
    async_url = settings.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    async_url = settings.database_url

engine = create_async_engine(async_url, future=True, echo=False)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

