"""
One-time (but safe to re-run) script to seed the initial issue categories.

Usage (from the backend/ directory, with venv active):
    python -m app.utils.seed_categories

Idempotent — skips any category name that already exists.

Phase 6: each category now also carries its category_weight and
safety_weight, used by app/services/priority_service.py to calculate an
issue's priority. These values must stay in sync with the backfill in
alembic/versions/63b20fba9f75_add_category_and_safety_weights.py — that
migration seeds weights for anyone who already has these 8 categories in
their database; this script seeds weights for anyone building fresh.
"""
from app.db.session import SessionLocal
from app.models.category import IssueCategory

# name -> (description, category_weight, safety_weight)
INITIAL_CATEGORIES = [
    ("Pothole", "Damaged or eroded road surface creating a hole.", 20, 25),
    ("Damaged Road", "General road surface damage not classified as a pothole.", 18, 20),
    ("Broken Streetlight", "Non-functional or damaged public streetlight.", 15, 18),
    ("Garbage Overflow", "Overflowing or uncollected public garbage.", 10, 8),
    ("Water Leakage", "Leaking public water pipeline or supply infrastructure.", 15, 15),
    ("Drainage Issue", "Blocked, damaged, or overflowing drainage system.", 18, 20),
    ("Sanitation Issue", "Public sanitation or hygiene-related infrastructure problem.", 12, 12),
    ("Other", "Any civic issue not covered by the categories above.", 8, 5),
]


def seed_categories():
    db = SessionLocal()
    try:
        created = 0
        skipped = 0
        for name, description, category_weight, safety_weight in INITIAL_CATEGORIES:
            existing = db.query(IssueCategory).filter(IssueCategory.name == name).first()
            if existing:
                skipped += 1
                continue
            db.add(
                IssueCategory(
                    name=name,
                    description=description,
                    category_weight=category_weight,
                    safety_weight=safety_weight,
                )
            )
            created += 1
        db.commit()
        print(f"Categories seeded: {created} created, {skipped} already existed.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_categories()
