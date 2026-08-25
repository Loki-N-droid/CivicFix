"""
Storage abstraction for uploaded files.

Business logic (issue_service.py) depends only on the StorageService
interface below — never on filesystem paths, boto3, or any specific
provider directly. This is what lets us swap LocalStorageService for an
S3/Cloudinary-backed implementation in a later version without touching
issue_service.py or the API routes at all.
"""
import uuid
from abc import ABC, abstractmethod
from pathlib import Path

# Root directory where uploaded files live in local development.
# Not committed to git (see .gitignore) — purely a dev-time convenience.
UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads"


class StorageService(ABC):
    @abstractmethod
    def save(self, file_bytes: bytes, original_filename: str, content_type: str) -> str:
        """Saves file bytes, returns the generated storage filename (not a path/URL)."""
        raise NotImplementedError

    @abstractmethod
    def get_path(self, filename: str) -> Path:
        """Returns the local filesystem path for a stored filename. Local impl only."""
        raise NotImplementedError

    @abstractmethod
    def delete(self, filename: str) -> None:
        raise NotImplementedError


class LocalStorageService(StorageService):
    def __init__(self, root: Path = UPLOAD_ROOT):
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)

    def _safe_extension(self, original_filename: str) -> str:
        # Only take the extension; never trust or reuse any other part of
        # the original filename for the actual stored path.
        suffix = Path(original_filename).suffix.lower()
        allowed = {".jpg", ".jpeg", ".png", ".webp"}
        return suffix if suffix in allowed else ""

    def save(self, file_bytes: bytes, original_filename: str, content_type: str) -> str:
        extension = self._safe_extension(original_filename)
        generated_filename = f"{uuid.uuid4().hex}{extension}"
        destination = self.root / generated_filename
        destination.write_bytes(file_bytes)
        return generated_filename

    def get_path(self, filename: str) -> Path:
        # Path.name strips any directory components from the input,
        # so a filename like "../../etc/passwd" can never escape self.root.
        return self.root / Path(filename).name

    def delete(self, filename: str) -> None:
        path = self.get_path(filename)
        if path.exists():
            path.unlink()


# Single shared instance used throughout the app for now.
# Swapping providers later means changing this one line, not any call site.
storage_service: StorageService = LocalStorageService()
