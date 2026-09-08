import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.category import IssueCategory
from app.models.issue import Issue, IssueStatus, IssueSeverity, PriorityLevel
from app.models.issue_history import IssueStatusHistory
from app.models.notification import Notification, NotificationType
from app.models.user import User, UserRole
from app.schemas.issue import StatusUpdateRequest
from app.services.issue_service import update_issue_status
from app.services.notification_service import get_unread_count, mark_all_as_read, mark_as_read


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    Base.metadata.drop_all(engine)


def seed_issue(db: Session) -> tuple[User, Issue]:
    citizen = User(name="Citizen", email="citizen@example.com", password_hash="hash", role=UserRole.citizen)
    admin = User(name="Admin", email="admin@example.com", password_hash="hash", role=UserRole.admin)
    category = IssueCategory(name="Roads", category_weight=10, safety_weight=10)
    db.add_all([citizen, admin, category])
    db.flush()
    issue = Issue(
        title="Large pothole",
        description="A large pothole needs repair.",
        category_id=category.id,
        citizen_id=citizen.id,
        citizen_severity=IssueSeverity.high,
        latitude=1.0,
        longitude=2.0,
        priority=PriorityLevel.high,
        priority_score=60,
    )
    db.add(issue)
    db.flush()
    db.add(IssueStatusHistory(issue_id=issue.id, new_status=IssueStatus.submitted, remark="Submitted", updated_by=citizen.id))
    db.commit()
    return admin, issue


def test_successful_status_update_creates_one_notification_for_citizen(db: Session):
    admin, issue = seed_issue(db)
    update_issue_status(
        db,
        issue.id,
        admin.id,
        StatusUpdateRequest(new_status=IssueStatus.in_progress, remark="Crew assigned."),
    )

    notifications = db.query(Notification).all()
    assert len(notifications) == 1
    assert notifications[0].user_id == issue.citizen_id
    assert notifications[0].notification_type == NotificationType.issue_status_updated
    assert "In Progress" in notifications[0].message
    assert "Crew assigned." in notifications[0].message


def test_failed_same_status_update_creates_no_notification(db: Session):
    admin, issue = seed_issue(db)
    with pytest.raises(Exception):
        update_issue_status(
            db,
            issue.id,
            admin.id,
            StatusUpdateRequest(new_status=IssueStatus.submitted, remark="No change."),
        )
    assert db.query(Notification).count() == 0


def test_unread_count_and_read_all_are_scoped_to_user(db: Session):
    admin, issue = seed_issue(db)
    other = User(name="Other", email="other@example.com", password_hash="hash", role=UserRole.citizen)
    db.add(other)
    db.flush()
    db.add_all([
        Notification(user_id=issue.citizen_id, issue_id=issue.id, title="One", message="One", notification_type=NotificationType.issue_status_updated),
        Notification(user_id=issue.citizen_id, issue_id=issue.id, title="Two", message="Two", notification_type=NotificationType.issue_resolved),
        Notification(user_id=other.id, issue_id=issue.id, title="Other", message="Other", notification_type=NotificationType.issue_status_updated),
    ])
    db.commit()

    assert get_unread_count(db, issue.citizen_id) == 2
    mark_all_as_read(db, issue.citizen_id)
    assert get_unread_count(db, issue.citizen_id) == 0
    assert get_unread_count(db, other.id) == 1
    other_notification = db.query(Notification).filter(Notification.user_id == other.id).one()
    mark_as_read(db, other_notification)
    assert other_notification.is_read is True
