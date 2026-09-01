from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.image import IssueImage
from app.models.issue import Issue
from app.services.storage_service import storage_service

router = APIRouter(prefix="/api/v1/issue-images", tags=["issue-images"])


@router.get("/{image_id}")
def get_issue_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    image = db.query(IssueImage).filter(IssueImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found.")

    # Authorization: a citizen may only view images belonging to their own
    # issue. Admins can view images on any issue — needed for the admin
    # issue detail page (Phase 7, Package 4).
    issue = db.query(Issue).filter(Issue.id == image.issue_id).first()
    is_owner = issue is not None and issue.citizen_id == current_user.id
    is_admin = current_user.role == UserRole.admin
    if not issue or not (is_owner or is_admin):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found.")

    file_path = storage_service.get_path(image.filename)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image file is missing from storage.",
        )

    return FileResponse(path=file_path, media_type=image.mime_type)
