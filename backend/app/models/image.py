from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class IssueImage(Base):
    __tablename__ = "issue_images"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    issue_id: Mapped[int] = mapped_column(ForeignKey("issues.id"), nullable=False)

    # Stored filename (safe, generated server-side, never trusts user input)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)

    # Original filename for reference (displayed to user, but never used for storage/retrieval)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)

    # MIME type, stored for content-type header when serving
    mime_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # File size in bytes, useful for validation/quotas later
    size_bytes: Mapped[int] = mapped_column(nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
