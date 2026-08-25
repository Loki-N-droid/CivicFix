"""
Validation rules for issue image uploads. Kept separate from storage_service
so validation policy (allowed types, size limits) can change independently
of how/where files are actually stored.
"""
from fastapi import UploadFile, HTTPException, status

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB per image
MAX_IMAGES_PER_ISSUE = 5


def validate_image_file(file: UploadFile, file_bytes: bytes) -> None:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{file.content_type}'. Allowed types: JPEG, PNG, WEBP.",
        )

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File '{file.filename}' exceeds the 5 MB size limit.",
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File '{file.filename}' is empty.",
        )


def validate_image_count(count: int) -> None:
    if count > MAX_IMAGES_PER_ISSUE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A maximum of {MAX_IMAGES_PER_ISSUE} images are allowed per issue.",
        )
