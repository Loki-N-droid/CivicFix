from datetime import datetime, timezone

from sqlalchemy import func, or_, cast, String
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile, status

from app.models.issue import Issue, IssueStatus, PriorityLevel
from app.models.issue_history import IssueStatusHistory
from app.models.category import IssueCategory
from app.models.image import IssueImage
from app.models.user import User
from app.schemas.issue import IssueCreateRequest, PriorityOverrideRequest, IssueSortOption
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


def _last_n_month_keys(n: int) -> list[str]:
    """Returns the last n month keys as 'YYYY-MM' strings, oldest first,
    ending with the current month. Pure date math — no DB access — so the
    trend chart always has a fixed, zero-filled x-axis."""
    now = datetime.now(timezone.utc)
    keys: list[str] = []
    year, month = now.year, now.month
    for _ in range(n):
        keys.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return list(reversed(keys))


def get_dashboard_stats(db: Session) -> dict:
    """Admin-only aggregate stats for the dashboard. Every bucket (status,
    priority, month) is zero-filled for values with no rows, so the frontend
    can render charts without special-casing missing categories."""

    total_issues = db.query(func.count(Issue.id)).scalar() or 0

    status_rows = dict(
        db.query(Issue.status, func.count(Issue.id)).group_by(Issue.status).all()
    )
    status_counts = [
        {"status": s, "count": status_rows.get(s, 0)} for s in IssueStatus
    ]

    priority_rows = dict(
        db.query(Issue.priority, func.count(Issue.id)).group_by(Issue.priority).all()
    )
    priority_counts = [
        {"priority": p, "count": priority_rows.get(p, 0)} for p in PriorityLevel
    ]

    category_rows = (
        db.query(IssueCategory.id, IssueCategory.name, func.count(Issue.id))
        .outerjoin(Issue, Issue.category_id == IssueCategory.id)
        .group_by(IssueCategory.id, IssueCategory.name)
        .order_by(IssueCategory.name)
        .all()
    )
    category_counts = [
        {"category_id": cid, "category_name": name, "count": count}
        for cid, name, count in category_rows
    ]

    # Postgres-specific: to_char formats the timestamp directly in SQL so we
    # group by month without pulling every row's raw created_at into Python.
    month_expr = func.to_char(Issue.created_at, "YYYY-MM")
    monthly_rows = dict(
        db.query(month_expr, func.count(Issue.id)).group_by(month_expr).all()
    )
    monthly_trend = [
        {"month": key, "count": monthly_rows.get(key, 0)}
        for key in _last_n_month_keys(6)
    ]

    return {
        "total_issues": total_issues,
        "status_counts": status_counts,
        "priority_counts": priority_counts,
        "category_counts": category_counts,
        "monthly_trend": monthly_trend,
    }


def list_issues_for_admin(
    db: Session,
    search: str | None = None,
    status_filter: IssueStatus | None = None,
    category_id: int | None = None,
    priority: PriorityLevel | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    sort: IssueSortOption = IssueSortOption.newest,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """Admin-only search/filter/sort/pagination over all issues. Category
    and citizen names are resolved server-side via join so the table row
    never needs a second round trip or client-side lookup.
    """
    query = (
        db.query(
            Issue,
            IssueCategory.name.label("category_name"),
            User.name.label("citizen_name"),
        )
        .join(IssueCategory, Issue.category_id == IssueCategory.id)
        .join(User, Issue.citizen_id == User.id)
    )

    if search:
        term = f"%{search.strip()}%"
        search_filters = [Issue.title.ilike(term), Issue.description.ilike(term)]
        # Allow searching by exact numeric issue ID alongside text search.
        if search.strip().isdigit():
            search_filters.append(Issue.id == int(search.strip()))
        else:
            search_filters.append(cast(Issue.id, String).ilike(term))
        query = query.filter(or_(*search_filters))

    if status_filter is not None:
        query = query.filter(Issue.status == status_filter)

    if category_id is not None:
        query = query.filter(Issue.category_id == category_id)

    if priority is not None:
        query = query.filter(Issue.priority == priority)

    if date_from is not None:
        query = query.filter(Issue.created_at >= date_from)

    if date_to is not None:
        query = query.filter(Issue.created_at <= date_to)

    total = query.count()

    if sort == IssueSortOption.oldest:
        query = query.order_by(Issue.created_at.asc())
    elif sort == IssueSortOption.priority_score:
        query = query.order_by(Issue.priority_score.desc(), Issue.created_at.desc())
    else:
        query = query.order_by(Issue.created_at.desc())

    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    offset = (page - 1) * page_size

    rows = query.offset(offset).limit(page_size).all()

    items = [
        {
            "id": issue.id,
            "title": issue.title,
            "category_id": issue.category_id,
            "category_name": category_name,
            "citizen_id": issue.citizen_id,
            "citizen_name": citizen_name,
            "status": issue.status,
            "priority": issue.priority,
            "priority_score": issue.priority_score,
            "priority_is_overridden": issue.priority_is_overridden,
            "address": issue.address,
            "created_at": issue.created_at,
            "updated_at": issue.updated_at,
        }
        for issue, category_name, citizen_name in rows
    ]

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
