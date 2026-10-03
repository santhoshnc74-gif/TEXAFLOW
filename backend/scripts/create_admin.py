import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user_account import UserAccount
from app.security.security import get_password_hash

def create_admin():
    db: Session = SessionLocal()
    try:
        existing_admin = db.query(UserAccount).filter(UserAccount.role == "ADMIN").first()
        if existing_admin:
            print(f"Admin account already exists: {existing_admin.username}")
            return

        admin_username = os.getenv("ADMIN_USERNAME")
        admin_password = os.getenv("ADMIN_PASSWORD")

        if not admin_username or not admin_password:
            print("Skipping admin creation: ADMIN_USERNAME or ADMIN_PASSWORD environment variables are missing.")
            return

        print("Creating admin account...")
        admin = UserAccount(
            username=admin_username,
            password_hash=get_password_hash(admin_password),
            role="ADMIN",
            must_change_password=False
        )
        db.add(admin)
        db.commit()
        print(f"Admin account created successfully! Username: {admin_username}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
