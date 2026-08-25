from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile, status

from app.models.issue import Issue
from app.models.issue_history import IssueStatusHistory
from app.models.category import IssueCategory
from app.models.image import IssueImage
from app.schemas.issue import IssueCreateRequest
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
