from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.issue import IssueStatus


class IssueStatusHistory(Base):
    __tablename__ = "issue_status_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    issue_id: Mapped[int] = mapped_column(ForeignKey("issues.id"), nullable=False)

    # previous_status is nullable to represent the very first history row
    # (issue creation), where there is no "before" state.
    previous_status: Mapped[IssueStatus | None] = mapped_column(
        Enum(IssueStatus, name="issue_status"), nullable=True
    )
    new_status: Mapped[IssueStatus] = mapped_column(
        Enum(IssueStatus, name="issue_status"), nullable=False
    )

    remark: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Nullable: a future system-generated history row (if any) wouldn't have a user.
    updated_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
