import enum
from datetime import datetime, date

from sqlalchemy import (
    Column,
    Integer,
    String,
    Enum,
    DateTime,
    Date,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


class UserRole(str, enum.Enum):
    member = "member"
    admin = "admin"


class GameCategory(str, enum.Enum):
    boardgame = "boardgame"
    crimescene = "crimescene"


class RentalStatus(str, enum.Enum):
    rented = "rented"
    returned = "returned"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(50), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.member, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    rentals = relationship("Rental", back_populates="borrower")


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True, nullable=False)
    category = Column(Enum(GameCategory), default=GameCategory.boardgame, nullable=False)
    owner = Column(String(50), nullable=True)
    total_quantity = Column(Integer, default=1, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    rentals = relationship("Rental", back_populates="game")


class Rental(Base):
    __tablename__ = "rentals"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    borrower_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rental_date = Column(Date, default=date.today, nullable=False)
    due_date = Column(Date, nullable=False)
    return_date = Column(Date, nullable=True)
    status = Column(Enum(RentalStatus), default=RentalStatus.rented, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    game = relationship("Game", back_populates="rentals")
    borrower = relationship("User", back_populates="rentals")
