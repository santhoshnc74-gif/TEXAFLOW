import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user_account import UserAccount
from app.security.security import get_password_hash

def reset_admin_password():
    admin_username = os.getenv("ADMIN_USERNAME")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if not admin_username or not admin_password:
        print("Skipping admin password reset: ADMIN_USERNAME or ADMIN_PASSWORD environment variables are missing.")
        return

    db: Session = SessionLocal()
    try:
        admin = db.query(UserAccount).filter(UserAccount.username == admin_username, UserAccount.role == "ADMIN").first()
        if not admin:
            print(f"Admin account with username '{admin_username}' does not exist.")
            return
        
        print("Resetting admin password from environment variables...")
        admin.password_hash = get_password_hash(admin_password)
        db.commit()
        print(f"Admin password for '{admin_username}' has been successfully reset.")
    except Exception as e:
        print(f"Error resetting password: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin_password()
