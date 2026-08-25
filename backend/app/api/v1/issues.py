from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.issue import IssueSeverity
from app.schemas.issue import IssueCreateRequest, IssueResponse, IssueDetailResponse
from app.services.issue_service import create_issue, get_my_issues, get_issue_for_citizen

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
