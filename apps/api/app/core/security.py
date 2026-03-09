from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import get_settings


security_scheme = HTTPBearer(auto_error=False)


class TokenUser(BaseModel):
    id: str
    email: str


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> TokenUser:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = credentials.credentials
    settings = get_settings()

    try:
        # Per ora usiamo le claim non verificate (token emesso da provider esterno, es. Supabase)
        payload = jwt.get_unverified_claims(token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("sub")
    email = payload.get("email")
    if not user_id or not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    # Controllo scadenza se presente
    exp = payload.get("exp")
    if isinstance(exp, (int, float)):
      now_ts = datetime.now(timezone.utc).timestamp()
      if now_ts > float(exp):
          raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    return TokenUser(id=user_id, email=email)

