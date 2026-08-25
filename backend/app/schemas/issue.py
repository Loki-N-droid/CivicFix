from datetime import datetime

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
