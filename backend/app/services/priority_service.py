"""
Smart Priority System — Phase 6 (full implementation).

Approved V1 formula (locked, do not change without a spec update):

    category_weight + citizen_severity_weight + safety_weight = priority_score

    priority_score is clamped to the 0-100 range, then mapped to a level:
        0-25   -> Low
        26-50  -> Medium
        51-75  -> High
        76-100 -> Critical

Where each term comes from:
    - category_weight  -> IssueCategory.category_weight (per-category, DB-backed)
    - safety_weight     -> IssueCategory.safety_weight   (per-category, DB-backed)
    - severity weight  -> SEVERITY_WEIGHTS below, keyed by the citizen's
                          self-reported IssueSeverity

This intentionally does NOT use, and must never use:
    - duplicate report count / duplicate issue detection (V2 only)
    - machine learning / AI-generated priority
    - a citizen-supplied final priority

Citizen severity is only ever an *input* to this calculation — the citizen
never sets `priority` or `priority_score` directly (see IssueCreateRequest,
which has no such fields, and issue_service.create_issue, which always
calls calculate_priority() server-side).

Admins may override the *displayed* priority (see issue_service.override_priority),
but that never touches the score or weights computed here — the original
automatic calculation always remains available on priority_score.
"""
from app.models.category import IssueCategory
from app.models.issue import IssueSeverity, PriorityLevel

# Citizen-reported severity is the one input to this formula that isn't
# backed by a DB table — there are only 3 fixed values, so a simple
# constant map is the appropriate/configurable place for it, per V1 scope.
SEVERITY_WEIGHTS: dict[IssueSeverity, int] = {
    IssueSeverity.low: 10,
    IssueSeverity.medium: 25,
    IssueSeverity.high: 40,
}

PRIORITY_SCORE_MIN = 0
PRIORITY_SCORE_MAX = 100

# Inclusive upper bounds for each level, in ascending order.
PRIORITY_BANDS: list[tuple[int, PriorityLevel]] = [
    (25, PriorityLevel.low),
    (50, PriorityLevel.medium),
    (75, PriorityLevel.high),
    (100, PriorityLevel.critical),
]


def _map_score_to_level(score: int) -> PriorityLevel:
    for upper_bound, level in PRIORITY_BANDS:
        if score <= upper_bound:
            return level
    # Unreachable given clamping above, but keeps this function total.
    return PriorityLevel.critical


def calculate_priority(
    category: IssueCategory, citizen_severity: IssueSeverity
) -> tuple[PriorityLevel, int]:
    """Returns (priority_level, priority_score) for a new issue.

    `category` must be the actual IssueCategory row selected for the issue —
    its category_weight and safety_weight are read directly, so this is
    always driven by real per-category data rather than a flat placeholder.
    """
    raw_score = (
        category.category_weight
        + SEVERITY_WEIGHTS[citizen_severity]
        + category.safety_weight
    )
    score = max(PRIORITY_SCORE_MIN, min(PRIORITY_SCORE_MAX, raw_score))
    level = _map_score_to_level(score)
    return level, score
