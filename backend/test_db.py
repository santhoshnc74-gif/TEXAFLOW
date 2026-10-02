from app.core.config import settings
from sqlalchemy import create_engine
print("URL:", settings.DATABASE_URL)
try:
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print("Connected!")
except Exception as e:
    print("Error:", e)
