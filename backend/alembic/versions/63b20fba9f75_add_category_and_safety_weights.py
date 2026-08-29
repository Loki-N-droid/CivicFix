"""add category_weight and safety_weight to issue_categories

Revision ID: 63b20fba9f75
Revises: b01815d8b57d
Create Date: 2026-08-29 00:00:00.000000

Phase 6 — Smart Priority System.

The Issue table already carries every priority-related column it needs
(priority, priority_score, priority_is_overridden, priority_overridden_by,
priority_override_reason — all added back in Phase 3). What was still
missing, exactly as flagged by the placeholder comments in
app/services/priority_service.py, was a real per-category representation
of "Category Weight" and "Safety Impact Weight". This migration adds that:
two integer columns on issue_categories that priority_service.py now reads
directly instead of using flat placeholder constants.

Existing rows are backfilled by category name so the currently-seeded 8
categories immediately have sane values. Any future category created via
seed_categories.py supplies its own weights at insert time.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '63b20fba9f75'
down_revision: Union[str, Sequence[str], None] = 'b01815d8b57d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# name -> (category_weight, safety_weight)
CATEGORY_WEIGHT_BACKFILL: dict[str, tuple[int, int]] = {
    "Pothole": (20, 25),
    "Damaged Road": (18, 20),
    "Broken Streetlight": (15, 18),
    "Garbage Overflow": (10, 8),
    "Water Leakage": (15, 15),
    "Drainage Issue": (18, 20),
    "Sanitation Issue": (12, 12),
    "Other": (8, 5),
}

# Fallback used only for rows whose name doesn't match the table above
# (e.g. a manually-added category), so the NOT NULL constraint below is safe.
FALLBACK_WEIGHT = 8
FALLBACK_SAFETY_WEIGHT = 5


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'issue_categories',
        sa.Column('category_weight', sa.Integer(), nullable=True),
    )
    op.add_column(
        'issue_categories',
        sa.Column('safety_weight', sa.Integer(), nullable=True),
    )

    issue_categories = sa.table(
        'issue_categories',
        sa.column('name', sa.String),
        sa.column('category_weight', sa.Integer),
        sa.column('safety_weight', sa.Integer),
    )

    connection = op.get_bind()
    for name, (cat_weight, safety_weight) in CATEGORY_WEIGHT_BACKFILL.items():
        connection.execute(
            issue_categories.update()
            .where(issue_categories.c.name == name)
            .values(category_weight=cat_weight, safety_weight=safety_weight)
        )

    # Any row that didn't match a known name (none expected today) still
    # gets a safe, non-null value before we tighten the constraint.
    connection.execute(
        issue_categories.update()
        .where(issue_categories.c.category_weight.is_(None))
        .values(category_weight=FALLBACK_WEIGHT, safety_weight=FALLBACK_SAFETY_WEIGHT)
    )

    op.alter_column('issue_categories', 'category_weight', nullable=False)
    op.alter_column('issue_categories', 'safety_weight', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('issue_categories', 'safety_weight')
    op.drop_column('issue_categories', 'category_weight')
