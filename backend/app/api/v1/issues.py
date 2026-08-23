from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.issue import IssueCreateRequest, IssueResponse, IssueDetailResponse
from app.services.issue_service import create_issue, get_my_issues, get_issue_for_citizen

router = APIRouter(prefix="/api/v1/issues", tags=["issues"])


@router.post("/", response_model=IssueResponse, status_code=201)
def submit_issue(
    data: IssueCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_issue(db, citizen_id=current_user.id, data=data)


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
