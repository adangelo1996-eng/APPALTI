from typing import Callable

from fastapi import Request, Response

from app.core.logging import get_logger


logger = get_logger()


async def logging_middleware(request: Request, call_next: Callable):
    logger.info(f"{request.method} {request.url.path}")
    response: Response = await call_next(request)
    logger.info(f"Completed {request.method} {request.url.path} with status {response.status_code}")
    return response

