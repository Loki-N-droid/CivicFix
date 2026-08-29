from datetime import datetime, timezone

from sqlalchemy import String, Boolean, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class IssueCategory(Base):
    __tablename__ = "issue_categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # --- Smart Priority System (Phase 6) ---
    # How much this category itself contributes to priority (e.g. a pothole
    # is inherently more disruptive than a generic "Other" report).
    category_weight: Mapped[int] = mapped_column(Integer, nullable=False)
    # How much of a safety risk this category represents if left unresolved
    # (e.g. a broken streetlight or open pothole vs. a garbage overflow).
    safety_weight: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
