import enum
from datetime import datetime, timezone

from sqlalchemy import String, Text, Integer, Float, Enum, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class IssueStatus(str, enum.Enum):
    submitted = "submitted"
    under_review = "under_review"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class IssueSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class PriorityLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Issue(Base):
    __tablename__ = "issues"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    category_id: Mapped[int] = mapped_column(ForeignKey("issue_categories.id"), nullable=False)
    citizen_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    status: Mapped[IssueStatus] = mapped_column(
        Enum(IssueStatus, name="issue_status"), default=IssueStatus.submitted, nullable=False
    )

    # --- Citizen input ---
    citizen_severity: Mapped[IssueSeverity] = mapped_column(
        Enum(IssueSeverity, name="issue_severity"), nullable=False
    )

    # --- Location ---
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # --- Smart Priority System ---
    priority: Mapped[PriorityLevel] = mapped_column(
        Enum(PriorityLevel, name="priority_level"), nullable=False
    )
    priority_score: Mapped[int] = mapped_column(Integer, nullable=False)
    priority_is_overridden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    priority_overridden_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    priority_override_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    status_history: Mapped[list["IssueStatusHistory"]] = relationship(
        "IssueStatusHistory",
        order_by="IssueStatusHistory.created_at",
        cascade="all, delete-orphan",
    )
