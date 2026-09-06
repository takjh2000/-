from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "mysql+pymysql://boardgame:boardgame@localhost:3306/boardgame_rental"
    jwt_secret: str = "change-this-secret-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    rental_period_days: int = 7

    class Config:
        env_file = ".env"


settings = Settings()
