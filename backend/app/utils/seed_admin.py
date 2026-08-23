"""
One-time script to create the first admin account.

Usage (from the backend/ directory, with venv active):
    python -m app.utils.seed_admin

Reads admin email/password from environment variables so credentials are
never hardcoded into source code:
    ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME (optional, defaults to "Admin")

Safe to run multiple times — does nothing if an admin with that email
already exists.
"""
import os
import sys

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password


def seed_admin():
    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")
    name = os.getenv("ADMIN_NAME", "Admin")

    if not email or not password:
        print("ERROR: Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables before running this script.")
        sys.exit(1)

    if len(password) < 8:
        print("ERROR: ADMIN_PASSWORD must be at least 8 characters.")
        sys.exit(1)

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"Admin account with email '{email}' already exists (id={existing.id}). No action taken.")
            return

        admin = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.admin,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"Admin account created successfully: id={admin.id}, email={admin.email}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
