from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field

from app.models.issue import IssueStatus, IssueSeverity, PriorityLevel


class IssueCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=10)
    category_id: int
    citizen_severity: IssueSeverity
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    address: str | None = None


class PriorityOverrideRequest(BaseModel):
    """Admin-only payload for overriding an issue's displayed priority.
    Citizens have no route that accepts this schema."""

    priority: PriorityLevel
    reason: str = Field(min_length=3, max_length=255)


class IssueImageResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    mime_type: str
    size_bytes: int
    created_at: datetime

    class Config:
        from_attributes = True


class IssueResponse(BaseModel):
    id: int
    title: str
    description: str
    category_id: int
    citizen_id: int
    status: IssueStatus
    citizen_severity: IssueSeverity
    latitude: float
    longitude: float
    address: str | None
    priority: PriorityLevel
    priority_score: int
    priority_is_overridden: bool
    priority_overridden_by: int | None
    priority_override_reason: str | None
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None
    images: list[IssueImageResponse] = []

    class Config:
        from_attributes = True


class IssueStatusHistoryResponse(BaseModel):
    id: int
    previous_status: IssueStatus | None
    new_status: IssueStatus
    remark: str | None
    updated_by: int | None
    created_at: datetime

    class Config:
        from_attributes = True


class IssueDetailResponse(IssueResponse):
    status_history: list[IssueStatusHistoryResponse] = []


# --- Admin dashboard statistics (Phase 7) ---


class StatusCount(BaseModel):
    status: IssueStatus
    count: int


class PriorityCount(BaseModel):
    priority: PriorityLevel
    count: int


class CategoryCount(BaseModel):
    category_id: int
    category_name: str
    count: int


class MonthlyCount(BaseModel):
    month: str  # "YYYY-MM"
    count: int


class DashboardStatsResponse(BaseModel):
    total_issues: int
    status_counts: list[StatusCount]
    priority_counts: list[PriorityCount]
    category_counts: list[CategoryCount]
    monthly_trend: list[MonthlyCount]


# --- Admin issue management (Phase 7, Package 3) ---


class IssueSortOption(str, Enum):
    newest = "newest"
    oldest = "oldest"
    priority_score = "priority_score"


class IssueListItemResponse(BaseModel):
    """Lighter than IssueResponse — a table row doesn't need images or full
    description, but does need the category/citizen names already resolved
    so the frontend never has to join client-side."""

    id: int
    title: str
    category_id: int
    category_name: str
    citizen_id: int
    citizen_name: str
    status: IssueStatus
    priority: PriorityLevel
    priority_score: int
    priority_is_overridden: bool
    address: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IssueListResponse(BaseModel):
    items: list[IssueListItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# --- Admin issue details (Phase 7, Package 4) ---


class IssueAdminDetailResponse(IssueDetailResponse):
    """Everything IssueDetailResponse has, plus the resolved names an admin
    needs without a second lookup. category_name/citizen_name/citizen_email
    are attached to the Issue instance in issue_service before
    serialization — see get_issue_for_admin_detail."""

    category_name: str
    citizen_name: str
    citizen_email: str
