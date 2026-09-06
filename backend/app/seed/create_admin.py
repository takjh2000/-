"""최초 관리자(임원) 계정을 만들거나, 기존 회원을 관리자로 승격하는 스크립트.

일반 부원은 회원가입 후 스스로 임원이 될 수 없으므로, 시스템을 처음 세팅할 때
이 스크립트로 첫 관리자 계정을 만든다. 이후부터는 관리자 화면에서 다른
회원의 권한을 임원으로 바꿀 수 있다.

사용법:
    python -m app.seed.create_admin <아이디> <비밀번호> <이름>
"""
import sys

from ..auth import hash_password
from ..database import SessionLocal, Base, engine
from ..models import User, UserRole


def create_or_promote_admin(username: str, password: str, name: str) -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if user:
            user.role = UserRole.admin
            print(f"기존 사용자 '{username}'을(를) 관리자로 승격했습니다.")
        else:
            user = User(
                username=username,
                password_hash=hash_password(password),
                name=name,
                role=UserRole.admin,
            )
            db.add(user)
            print(f"관리자 계정 '{username}'을(를) 새로 생성했습니다.")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("사용법: python -m app.seed.create_admin <아이디> <비밀번호> <이름>")
        sys.exit(1)
    create_or_promote_admin(sys.argv[1], sys.argv[2], sys.argv[3])
