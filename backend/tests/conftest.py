"""
Shared pytest setup.

Issue.status_history / Issue.images use string-based relationship() targets
(IssueStatusHistory, IssueImage). SQLAlchemy only resolves those when every
mapped class has been imported at least once, so — exactly like
alembic/env.py already does for autogenerate — we import all models here
before any test constructs a mapped instance.
"""
from app.models.user import User  # noqa: F401
from app.models.category import IssueCategory  # noqa: F401
from app.models.issue import Issue  # noqa: F401
from app.models.issue_history import IssueStatusHistory  # noqa: F401
from app.models.image import IssueImage  # noqa: F401
