from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile, status

from app.models.issue import Issue
from app.models.issue_history import IssueStatusHistory
from app.models.category import IssueCategory
from app.models.image import IssueImage
from app.schemas.issue import IssueCreateRequest, PriorityOverrideRequest
from app.services.priority_service import calculate_priority
from app.services.storage_service import storage_service
from app.utils.image_validation import validate_image_file, validate_image_count


def create_issue(
    db: Session,
    citizen_id: int,
    data: IssueCreateRequest,
    images: list[UploadFile] | None = None,
) -> Issue:
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

    images = images or []
    validate_image_count(len(images))

    # Read and validate all files BEFORE writing anything to disk or the DB,
    # so a bad file in the middle of the batch can't leave partial state.
    validated_files: list[tuple[bytes, UploadFile]] = []
    for image in images:
        file_bytes = image.file.read()
        validate_image_file(image, file_bytes)
        validated_files.append((file_bytes, image))

    priority_level, priority_score = calculate_priority(category, data.citizen_severity)

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

    for file_bytes, image in validated_files:
        stored_filename = storage_service.save(file_bytes, image.filename, image.content_type)
        db.add(
            IssueImage(
                issue_id=issue.id,
                filename=stored_filename,
                original_filename=image.filename,
                mime_type=image.content_type,
                size_bytes=len(file_bytes),
            )
        )

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


def get_issue_for_admin(db: Session, issue_id: int) -> Issue:
    """Admin-scoped lookup — unlike get_issue_for_citizen, not restricted to
    a single citizen's own issues, since an admin must be able to review and
    override priority on any issue."""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found.",
        )
    return issue


def override_priority(
    db: Session,
    issue_id: int,
    admin_id: int,
    override: PriorityOverrideRequest,
) -> Issue:
    """Admin-only. Overrides the *displayed* priority on an issue.

    The automatically calculated priority_score is never modified here — it
    stays exactly as it was computed at issue creation, so the original
    system-calculated priority remains available for audit even after an
    override. Only `priority` (the displayed level) and the three override
    bookkeeping fields change.
    """
    issue = get_issue_for_admin(db, issue_id)

    issue.priority = override.priority
    issue.priority_is_overridden = True
    issue.priority_overridden_by = admin_id
    issue.priority_override_reason = override.reason

    db.commit()
    db.refresh(issue)
    return issue
