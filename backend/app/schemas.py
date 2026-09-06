from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from .models import UserRole, GameCategory, RentalStatus


# ---- Auth / Users ----

class UserCreate(BaseModel):
    username: str
    password: str
    name: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    name: str
    role: UserRole
    created_at: datetime


class UserRoleUpdate(BaseModel):
    role: UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str


# ---- Games ----

class GameCreate(BaseModel):
    name: str
    category: GameCategory = GameCategory.boardgame
    owner: Optional[str] = None
    total_quantity: int = 1
    notes: Optional[str] = None


class GameUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[GameCategory] = None
    owner: Optional[str] = None
    total_quantity: Optional[int] = None
    notes: Optional[str] = None


class GameOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: GameCategory
    owner: Optional[str]
    total_quantity: int
    notes: Optional[str]
    rented_quantity: int
    remaining_quantity: int


# ---- Rentals ----

class RentalCreate(BaseModel):
    game_id: int
    borrower_id: Optional[int] = None  # admin can rent on behalf of a member


class RentalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    game_id: int
    game_name: str
    borrower_id: int
    borrower_name: str
    rental_date: date
    due_date: date
    return_date: Optional[date]
    status: RentalStatus
    is_overdue: bool


class OverdueStat(BaseModel):
    user_id: int
    name: str
    total_overdue_days: int
    overdue_count: int
