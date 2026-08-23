"""
Smart Priority System — Phase 3 minimal version.

This is a deliberately simple placeholder so Issue creation can calculate a
real priority_score end-to-end. The full configurable rule set (category
weights table, safety impact weighting per category, etc.) is built out
properly in Phase 6. The formula and clamping/mapping logic here already
matches the approved V1 design:

    category_weight + citizen_severity_weight + safety_weight = priority_score
    clamped to 0-100, mapped to Low/Medium/High/Critical.
"""
from app.models.issue import IssueSeverity, PriorityLevel

# Placeholder flat weight until Phase 6 introduces a real per-category table.
CATEGORY_WEIGHT = 30

SEVERITY_WEIGHTS: dict[IssueSeverity, int] = {
    IssueSeverity.low: 10,
    IssueSeverity.medium: 25,
    IssueSeverity.high: 40,
}

# Placeholder flat safety weight until Phase 6 ties this to category/context.
SAFETY_WEIGHT = 15


def calculate_priority(citizen_severity: IssueSeverity) -> tuple[PriorityLevel, int]:
    """Returns (priority_level, priority_score) for a new issue."""
    raw_score = CATEGORY_WEIGHT + SEVERITY_WEIGHTS[citizen_severity] + SAFETY_WEIGHT
    score = max(0, min(100, raw_score))

    if score <= 25:
        level = PriorityLevel.low
    elif score <= 50:
        level = PriorityLevel.medium
    elif score <= 75:
        level = PriorityLevel.high
    else:
        level = PriorityLevel.critical

    return level, score
