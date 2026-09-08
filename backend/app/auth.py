from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# bcrypt 기본 코스트(12)는 Render 무료 플랜의 제한된 CPU에서 로그인 1회에
# 200ms~1초 이상 걸릴 수 있음. 동호회 규모 서비스에는 과도한 보안 마진이라
# 10으로 낮춰 로그인 응답 속도를 개선한다. (여전히 업계에서 널리 쓰이는
# 안전한 수준 — 예: node bcrypt 기본값도 10)
BCRYPT_ROUNDS = 10


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def needs_rehash(hashed_password: str) -> bool:
    """기존에 더 높은 코스트로 저장된 해시인지 확인한다.

    로그인 성공 시 이 함수가 True를 반환하면 새 코스트로 재해싱해서 저장해,
    다음 로그인부터는 더 빨라지도록 한다(비밀번호 재설정 없이 점진적 전환).
    """
    try:
        rounds = int(hashed_password.split("$")[2])
    except (IndexError, ValueError):
        return False
    return rounds != BCRYPT_ROUNDS


def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보가 유효하지 않습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자(임원)만 접근할 수 있습니다.",
        )
    return current_user
