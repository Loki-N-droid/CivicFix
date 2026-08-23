from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.issue import Issue
from app.models.issue_history import IssueStatusHistory
from app.models.category import IssueCategory
from app.schemas.issue import IssueCreateRequest
from app.services.priority_service import calculate_priority


def create_issue(db: Session, citizen_id: int, data: IssueCreateRequest) -> Issue:
    category = (
        db.query(IssueCategory)
        .filter(IssueCategory.id == data.category_id, IssueCategory.is_active == True)  # noqa: E712
        .first()
    )
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected category does not exist or is no longer active.",
        )

    priority_level, priority_score = calculate_priority(data.citizen_severity)

    issue = Issue(
        title=data.title,
        description=data.description,
        category_id=data.category_id,
        citizen_id=citizen_id,
        citizen_severity=data.citizen_severity,
        latitude=data.latitude,
        longitude=data.longitude,
        address=data.address,
        priority=priority_level,
        priority_score=priority_score,
    )
    db.add(issue)
    db.flush()  # assigns issue.id without committing yet

    history = IssueStatusHistory(
        issue_id=issue.id,
        previous_status=None,
        new_status=issue.status,
        remark="Issue submitted by citizen.",
        updated_by=citizen_id,
    )
    db.add(history)

    db.commit()
    db.refresh(issue)
    return issue


def get_issue_for_citizen(db: Session, issue_id: int, citizen_id: int) -> Issue:
    issue = (
        db.query(Issue)
        .filter(Issue.id == issue_id, Issue.citizen_id == citizen_id)
        .first()
    )
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found.",
        )
    return issue


def get_my_issues(db: Session, citizen_id: int) -> list[Issue]:
    return (
        db.query(Issue)
        .filter(Issue.citizen_id == citizen_id)
        .order_by(Issue.created_at.desc())
        .all()
    )
