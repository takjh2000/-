from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..auth import get_current_user, require_admin
from ..config import settings
from ..database import get_db
from ..models import Game, Rental, RentalStatus, User, UserRole

router = APIRouter(prefix="/rentals", tags=["rentals"])


def _to_rental_out(rental: Rental) -> schemas.RentalOut:
    is_overdue = (
        rental.status == RentalStatus.rented
        and rental.due_date is not None
        and date.today() > rental.due_date
    )
    return schemas.RentalOut(
        id=rental.id,
        game_id=rental.game_id,
        game_name=rental.game.name,
        borrower_id=rental.borrower_id,
        borrower_name=rental.borrower.name,
        rental_date=rental.rental_date,
        due_date=rental.due_date,
        return_date=rental.return_date,
        status=rental.status,
        is_overdue=is_overdue,
    )


@router.post("", response_model=schemas.RentalOut)
def create_rental(
    payload: schemas.RentalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    borrower_id = current_user.id
    if payload.borrower_id and payload.borrower_id != current_user.id:
        if current_user.role != UserRole.admin:
            raise HTTPException(status_code=403, detail="다른 사람 명의로 대여할 권한이 없습니다.")
        borrower_id = payload.borrower_id
        if not db.query(User).filter(User.id == borrower_id).first():
            raise HTTPException(status_code=404, detail="대여자를 찾을 수 없습니다.")

    game = db.query(Game).filter(Game.id == payload.game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없습니다.")

    rented_count = (
        db.query(Rental)
        .filter(Rental.game_id == game.id, Rental.status == RentalStatus.rented)
        .count()
    )
    if rented_count >= game.total_quantity:
        raise HTTPException(status_code=400, detail="남은 재고가 없습니다.")

    today = date.today()
    rental = Rental(
        game_id=game.id,
        borrower_id=borrower_id,
        rental_date=today,
        due_date=today + timedelta(days=settings.rental_period_days),
        status=RentalStatus.rented,
    )
    db.add(rental)
    db.commit()
    db.refresh(rental)
    return _to_rental_out(rental)


@router.post("/{rental_id}/return", response_model=schemas.RentalOut)
def return_rental(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="대여 기록을 찾을 수 없습니다.")

    if rental.borrower_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="본인의 대여 건만 반납할 수 있습니다.")

    if rental.status == RentalStatus.returned:
        raise HTTPException(status_code=400, detail="이미 반납된 대여 건입니다.")

    rental.status = RentalStatus.returned
    rental.return_date = date.today()
    db.commit()
    db.refresh(rental)
    return _to_rental_out(rental)


@router.get("/me", response_model=list[schemas.RentalOut])
def my_rentals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rentals = (
        db.query(Rental)
        .filter(Rental.borrower_id == current_user.id)
        .order_by(Rental.rental_date.desc())
        .all()
    )
    return [_to_rental_out(r) for r in rentals]


@router.get("", response_model=list[schemas.RentalOut])
def list_rentals(
    status: str | None = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(Rental)
    if status:
        query = query.filter(Rental.status == status)
    rentals = query.order_by(Rental.rental_date.desc()).all()
    return [_to_rental_out(r) for r in rentals]


@router.get("/overdue", response_model=list[schemas.RentalOut])
def overdue_rentals(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    rentals = (
        db.query(Rental)
        .filter(Rental.status == RentalStatus.rented, Rental.due_date < date.today())
        .order_by(Rental.due_date)
        .all()
    )
    return [_to_rental_out(r) for r in rentals]


@router.get("/overdue-stats", response_model=list[schemas.OverdueStat])
def overdue_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    returned_late = (
        db.query(Rental)
        .filter(Rental.status == RentalStatus.returned, Rental.return_date > Rental.due_date)
        .all()
    )
    stats: dict[int, schemas.OverdueStat] = {}
    for r in returned_late:
        days = (r.return_date - r.due_date).days
        if r.borrower_id not in stats:
            stats[r.borrower_id] = schemas.OverdueStat(
                user_id=r.borrower_id, name=r.borrower.name, total_overdue_days=0, overdue_count=0
            )
        stats[r.borrower_id].total_overdue_days += days
        stats[r.borrower_id].overdue_count += 1

    return sorted(stats.values(), key=lambda s: s.total_overdue_days, reverse=True)


@router.delete("/{rental_id}", status_code=204)
def delete_rental(
    rental_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="대여 기록을 찾을 수 없습니다.")
    db.delete(rental)
    db.commit()
