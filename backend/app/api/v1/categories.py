from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.models.category import IssueCategory
from app.schemas.category import (
    CategoryResponse,
    CategoryAdminResponse,
    CategoryCreateRequest,
    CategoryUpdateRequest,
)
from app.services.category_service import (
    list_categories_for_admin,
    create_category,
    update_category,
)

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])


@router.get("/", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return (
        db.query(IssueCategory)
        .filter(IssueCategory.is_active == True)  # noqa: E712
        .order_by(IssueCategory.name)
        .all()
    )


# --- Admin-only: Category CRUD (Phase 7, Package 6) ---
# Registered under /admin so route ordering never collides with a future
# public /{category_id} path, matching the /issues/admin/... convention.


@router.get("/admin", response_model=list[CategoryAdminResponse])
def list_categories_admin(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return list_categories_for_admin(db)


@router.post("/admin", response_model=CategoryAdminResponse, status_code=201)
def create_category_admin(
    payload: CategoryCreateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return create_category(db, data=payload)


@router.patch("/admin/{category_id}", response_model=CategoryAdminResponse)
def update_category_admin(
    category_id: int,
    payload: CategoryUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return update_category(db, category_id=category_id, data=payload)