"""
Phase 6 — Smart Priority System tests.

These are pure unit tests against app/services/priority_service.py. They
build plain (unsaved) IssueCategory instances in memory — no database
connection is needed, since calculate_priority() is a pure function of
(category_weight, safety_weight, citizen_severity).

Run from backend/ with the venv active:
    pytest -v
"""
import inspect

import pytest

from app.models.category import IssueCategory
from app.models.issue import IssueSeverity, PriorityLevel
from app.services.priority_service import calculate_priority, SEVERITY_WEIGHTS


def make_category(category_weight: int, safety_weight: int) -> IssueCategory:
    return IssueCategory(
        name="Test Category",
        description=None,
        is_active=True,
        category_weight=category_weight,
        safety_weight=safety_weight,
    )


# --- 1-4: one real example per priority band, using the actual seeded weights ---


def test_low_priority():
    # "Other": category_weight=8, safety_weight=5, severity=low(10) -> 23 -> Low
    category = make_category(category_weight=8, safety_weight=5)
    level, score = calculate_priority(category, IssueSeverity.low)
    assert score == 23
    assert level == PriorityLevel.low


def test_medium_priority():
    # "Water Leakage": category_weight=15, safety_weight=15, severity=low(10) -> 40 -> Medium
    category = make_category(category_weight=15, safety_weight=15)
    level, score = calculate_priority(category, IssueSeverity.low)
    assert score == 40
    assert level == PriorityLevel.medium


def test_high_priority():
    # "Pothole": category_weight=20, safety_weight=25, severity=low(10) -> 55 -> High
    category = make_category(category_weight=20, safety_weight=25)
    level, score = calculate_priority(category, IssueSeverity.low)
    assert score == 55
    assert level == PriorityLevel.high


def test_critical_priority():
    # "Pothole": category_weight=20, safety_weight=25, severity=high(40) -> 85 -> Critical
    category = make_category(category_weight=20, safety_weight=25)
    level, score = calculate_priority(category, IssueSeverity.high)
    assert score == 85
    assert level == PriorityLevel.critical


# --- 5-6: clamping ---


def test_score_below_zero_is_clamped_to_zero():
    category = make_category(category_weight=-100, safety_weight=-100)
    level, score = calculate_priority(category, IssueSeverity.low)
    assert score == 0
    assert level == PriorityLevel.low


def test_score_above_hundred_is_clamped_to_hundred():
    category = make_category(category_weight=100, safety_weight=100)
    level, score = calculate_priority(category, IssueSeverity.high)
    assert score == 100
    assert level == PriorityLevel.critical


# --- 7: different category weights change the score ---


def test_different_category_weights_change_score():
    low_weight_category = make_category(category_weight=5, safety_weight=5)
    high_weight_category = make_category(category_weight=25, safety_weight=5)

    _, low_score = calculate_priority(low_weight_category, IssueSeverity.medium)
    _, high_score = calculate_priority(high_weight_category, IssueSeverity.medium)

    assert high_score - low_score == 20
    assert high_score > low_score


# --- 8: different citizen severity values change the score ---


@pytest.mark.parametrize(
    "severity, expected_weight",
    [
        (IssueSeverity.low, 10),
        (IssueSeverity.medium, 25),
        (IssueSeverity.high, 40),
    ],
)
def test_severity_weights_are_applied(severity, expected_weight):
    category = make_category(category_weight=0, safety_weight=0)
    _, score = calculate_priority(category, severity)
    assert score == expected_weight
    assert SEVERITY_WEIGHTS[severity] == expected_weight


def test_severity_increases_score_monotonically():
    category = make_category(category_weight=10, safety_weight=10)
    _, low_score = calculate_priority(category, IssueSeverity.low)
    _, medium_score = calculate_priority(category, IssueSeverity.medium)
    _, high_score = calculate_priority(category, IssueSeverity.high)
    assert low_score < medium_score < high_score


# --- 9: safety weight contributes correctly ---


def test_safety_weight_changes_score_independently_of_category_weight():
    low_safety = make_category(category_weight=10, safety_weight=0)
    high_safety = make_category(category_weight=10, safety_weight=20)

    _, low_score = calculate_priority(low_safety, IssueSeverity.medium)
    _, high_score = calculate_priority(high_safety, IssueSeverity.medium)

    assert high_score - low_score == 20


# --- 12-13: duplicate reports / duplicate detection must never factor in ---


def test_calculate_priority_signature_has_no_duplicate_related_parameter():
    """The V1 formula is category_weight + severity_weight + safety_weight
    only. This locks in that no duplicate-count / duplicate-detection
    parameter has been (re-)introduced into the calculation."""
    params = set(inspect.signature(calculate_priority).parameters.keys())
    assert params == {"category", "citizen_severity"}


def test_identical_inputs_always_produce_identical_score():
    """A pure function of (category weights, severity) can't be influenced
    by how many other reports exist for the same issue."""
    category = make_category(category_weight=18, safety_weight=20)
    results = {calculate_priority(category, IssueSeverity.medium) for _ in range(5)}
    assert len(results) == 1
