from datetime import datetime

from fastapi import APIRouter, Depends, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.issue import IssueSeverity, IssueStatus, PriorityLevel
from app.schemas.issue import (
    IssueCreateRequest,
    IssueResponse,
    IssueDetailResponse,
    PriorityOverrideRequest,
    DashboardStatsResponse,
    IssueListResponse,
    IssueSortOption,
)
from app.services.issue_service import (
    create_issue,
    get_my_issues,
    get_issue_for_citizen,
    get_issue_for_admin,
    override_priority,
    get_dashboard_stats,
    list_issues_for_admin,
)

router = APIRouter(prefix="/api/v1/issues", tags=["issues"])


@router.post("/", response_model=IssueResponse, status_code=201)
def submit_issue(
    title: str = Form(...),
    description: str = Form(...),
    category_id: int = Form(...),
    citizen_severity: IssueSeverity = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: str | None = Form(None),
    images: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = IssueCreateRequest(
        title=title,
        description=description,
        category_id=category_id,
        citizen_severity=citizen_severity,
        latitude=latitude,
        longitude=longitude,
        address=address,
    )
    return create_issue(db, citizen_id=current_user.id, data=data, images=images)


@router.get("/my-issues", response_model=list[IssueResponse])
def list_my_issues(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_my_issues(db, citizen_id=current_user.id)


@router.get("/{issue_id}", response_model=IssueDetailResponse)
def get_issue_detail(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue = get_issue_for_citizen(db, issue_id=issue_id, citizen_id=current_user.id)
    return issue


# --- Admin-only: Smart Priority System (Phase 6) ---
# Deliberately minimal: just enough for an admin to review an issue's
# calculated priority and override it, with the reasoning and identity
# recorded. A full admin dashboard is out of scope for Phase 6.


@router.get("/admin/stats", response_model=DashboardStatsResponse)
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Registered before /admin/{issue_id} — FastAPI matches routes in
    declaration order, and 'stats' would otherwise be swallowed as an
    issue_id path param and fail int validation."""
    return get_dashboard_stats(db)


@router.get("/admin/list", response_model=IssueListResponse)
def list_issues_admin(
    search: str | None = Query(default=None, description="Matches issue ID, title, or description."),
    status: IssueStatus | None = Query(default=None),
    category_id: int | None = Query(default=None),
    priority: PriorityLevel | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    sort: IssueSortOption = Query(default=IssueSortOption.newest),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Registered before /admin/{issue_id} — FastAPI matches routes in
    declaration order, and 'list' would otherwise be swallowed as an
    issue_id path param and fail int validation."""
    return list_issues_for_admin(
        db,
        search=search,
        status_filter=status,
        category_id=category_id,
        priority=priority,
        date_from=date_from,
        date_to=date_to,
        sort=sort,
        page=page,
        page_size=page_size,
    )


@router.get("/admin/{issue_id}", response_model=IssueDetailResponse)
def get_issue_detail_admin(
    issue_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return get_issue_for_admin(db, issue_id=issue_id)


@router.patch("/admin/{issue_id}/priority", response_model=IssueResponse)
def override_issue_priority(
    issue_id: int,
    payload: PriorityOverrideRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Overrides the displayed priority for an issue. The system-calculated
    priority_score is never touched — see issue_service.override_priority."""
    return override_priority(db, issue_id=issue_id, admin_id=admin.id, override=payload)
