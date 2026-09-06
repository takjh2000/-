from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import auth, games, rentals, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="보드게임 대여 시스템")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(games.router)
app.include_router(rentals.router)
app.include_router(users.router)


@app.get("/health")
def health():
    return {"status": "ok"}
