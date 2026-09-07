from datetime import datetime

from pydantic import BaseModel, Field


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryAdminResponse(BaseModel):
    """Admin-facing category shape — includes the priority weights and
    inactive categories, neither of which the public GET / exposes."""

    id: int
    name: str
    description: str | None
    is_active: bool
    category_weight: int
    safety_weight: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CategoryCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    category_weight: int = Field(ge=0, le=100)
    safety_weight: int = Field(ge=0, le=100)


class CategoryUpdateRequest(BaseModel):
    """All fields optional — an update may touch just one attribute (e.g.
    only re-weighting a category, or only renaming it, or only toggling
    is_active) without requiring the caller to resend everything else."""

    name: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    category_weight: int | None = Field(default=None, ge=0, le=100)
    safety_weight: int | None = Field(default=None, ge=0, le=100)
    is_active: bool | None = None