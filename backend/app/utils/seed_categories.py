"""
One-time (but safe to re-run) script to seed the initial issue categories.

Usage (from the backend/ directory, with venv active):
    python -m app.utils.seed_categories

Idempotent — skips any category name that already exists.
"""
from app.db.session import SessionLocal
from app.models.category import IssueCategory

INITIAL_CATEGORIES = [
    ("Pothole", "Damaged or eroded road surface creating a hole."),
    ("Damaged Road", "General road surface damage not classified as a pothole."),
    ("Broken Streetlight", "Non-functional or damaged public streetlight."),
    ("Garbage Overflow", "Overflowing or uncollected public garbage."),
    ("Water Leakage", "Leaking public water pipeline or supply infrastructure."),
    ("Drainage Issue", "Blocked, damaged, or overflowing drainage system."),
    ("Sanitation Issue", "Public sanitation or hygiene-related infrastructure problem."),
    ("Other", "Any civic issue not covered by the categories above."),
]


def seed_categories():
    db = SessionLocal()
    try:
        created = 0
        skipped = 0
        for name, description in INITIAL_CATEGORIES:
            existing = db.query(IssueCategory).filter(IssueCategory.name == name).first()
            if existing:
                skipped += 1
                continue
            db.add(IssueCategory(name=name, description=description))
            created += 1
        db.commit()
        print(f"Categories seeded: {created} created, {skipped} already existed.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_categories()
