from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.category import IssueCategory
from app.schemas.category import CategoryResponse

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])


@router.get("/", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return (
        db.query(IssueCategory)
        .filter(IssueCategory.is_active == True)  # noqa: E712
        .order_by(IssueCategory.name)
        .all()
    )
