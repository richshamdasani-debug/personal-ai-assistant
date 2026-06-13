from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from bot.config import settings

bearer = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> str:
    """
    Verify a JWT issued by Next.js / NextAuth.
    The secret is the NEXTAUTH_SECRET (settings.jwt_secret).
    Returns the user ID extracted from the token payload.
    """
    try:
        payload: dict = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=["HS256"],
            options={"verify_exp": False},  # NextAuth tokens may omit standard exp
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = (
        payload.get("sub")
        or payload.get("id")
        or payload.get("userId")
    )
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing user ID")

    return str(user_id)
