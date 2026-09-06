from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import schemas
from ..auth import require_admin
from ..database import get_db
from ..models import Game, Rental, RentalStatus, User

router = APIRouter(prefix="/games", tags=["games"])


def _to_game_out(db: Session, game: Game) -> schemas.GameOut:
    rented = (
        db.query(func.count(Rental.id))
        .filter(Rental.game_id == game.id, Rental.status == RentalStatus.rented)
        .scalar()
        or 0
    )
    return schemas.GameOut(
        id=game.id,
        name=game.name,
        category=game.category,
        owner=game.owner,
        total_quantity=game.total_quantity,
        notes=game.notes,
        rented_quantity=rented,
        remaining_quantity=game.total_quantity - rented,
    )


@router.get("", response_model=list[schemas.GameOut])
def list_games(
    category: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Game)
    if category:
        query = query.filter(Game.category == category)
    if search:
        query = query.filter(Game.name.ilike(f"%{search}%"))
    games = query.order_by(Game.name).all()
    return [_to_game_out(db, g) for g in games]


@router.post("", response_model=schemas.GameOut)
def create_game(
    payload: schemas.GameCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    game = Game(**payload.model_dump())
    db.add(game)
    db.commit()
    db.refresh(game)
    return _to_game_out(db, game)


@router.patch("/{game_id}", response_model=schemas.GameOut)
def update_game(
    game_id: int,
    payload: schemas.GameUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없습니다.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(game, field, value)

    db.commit()
    db.refresh(game)
    return _to_game_out(db, game)


@router.delete("/{game_id}", status_code=204)
def delete_game(
    game_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없습니다.")

    active_rentals = (
        db.query(Rental)
        .filter(Rental.game_id == game_id, Rental.status == RentalStatus.rented)
        .count()
    )
    if active_rentals:
        raise HTTPException(status_code=400, detail="대여 중인 게임은 삭제할 수 없습니다.")

    db.delete(game)
    db.commit()
