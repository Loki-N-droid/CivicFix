from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.issue import Issue
from app.models.notification import Notification


def list_notifications(
    db: Session, user_id: int, page: int, page_size: int
) -> tuple[list[dict], int]:
    query = (
        db.query(Notification, Issue.title.label("issue_title"))
        .outerjoin(Issue, Notification.issue_id == Issue.id)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
    )
    total = query.with_entities(func.count(Notification.id)).scalar() or 0
    rows = query.offset((page - 1) * page_size).limit(page_size).all()
    items = [
        {
            "id": notification.id,
            "issue_id": notification.issue_id,
            "issue_title": issue_title,
            "title": notification.title,
            "message": notification.message,
            "notification_type": notification.notification_type,
            "is_read": notification.is_read,
            "created_at": notification.created_at,
            "read_at": notification.read_at,
        }
        for notification, issue_title in rows
    ]
    return items, total


def get_unread_count(db: Session, user_id: int) -> int:
    return (
        db.query(func.count(Notification.id))
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .scalar()
        or 0
    )


def mark_as_read(db: Session, notification: Notification) -> Notification:
    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notification)
    return notification


def mark_all_as_read(db: Session, user_id: int) -> int:
    now = datetime.now(timezone.utc)
    updated = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .update({Notification.is_read: True, Notification.read_at: now}, synchronize_session=False)
    )
    db.commit()
    return updated
