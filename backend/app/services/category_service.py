from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.category import IssueCategory
from app.schemas.category import CategoryCreateRequest, CategoryUpdateRequest


def list_categories_for_admin(db: Session) -> list[IssueCategory]:
    return db.query(IssueCategory).order_by(IssueCategory.name).all()


def create_category(db: Session, data: CategoryCreateRequest) -> IssueCategory:
    name = data.name.strip()
    existing = db.query(IssueCategory).filter(IssueCategory.name.ilike(name)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A category with this name already exists.",
        )
    category = IssueCategory(
        name=name,
        description=data.description,
        category_weight=data.category_weight,
        safety_weight=data.safety_weight,
        is_active=True,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(db: Session, category_id: int, data: CategoryUpdateRequest) -> IssueCategory:
    category = db.query(IssueCategory).filter(IssueCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

    updates = data.model_dump(exclude_unset=True)
    if "name" in updates and updates["name"] is not None:
        updates["name"] = updates["name"].strip()
        duplicate = (
            db.query(IssueCategory)
            .filter(IssueCategory.name.ilike(updates["name"]), IssueCategory.id != category_id)
            .first()
        )
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A category with this name already exists.",
            )
    for field, value in updates.items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    return category
