import os
import urllib.parse
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 5432
    DATABASE_NAME: str = "texflow_db"
    DATABASE_USER: str = "postgres"
    DATABASE_PASSWORD: str = ""

    @property
    def DATABASE_URL(self) -> str:
        # URL-encode the password to handle special characters like @ safely
        encoded_password = urllib.parse.quote_plus(self.DATABASE_PASSWORD)
        return f"postgresql+psycopg://{self.DATABASE_USER}:{encoded_password}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}?connect_timeout=3"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
