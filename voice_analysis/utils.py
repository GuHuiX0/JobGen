"""
Utility helpers for the voice analysis module.

These functions are intentionally lightweight and pure (no I/O side effects)
to keep the core logic testable and reusable.
"""

from __future__ import annotations

from dataclasses import asdict, is_dataclass
from typing import Any, Dict, Iterable, List, Sequence


def safe_mean(values: Sequence[float]) -> float:
    """Return the arithmetic mean of values or 0.0 if the sequence is empty."""

    if not values:
        return 0.0
    return float(sum(values) / len(values))


def safe_std(values: Sequence[float]) -> float:
    """Return the population standard deviation of values or 0.0 if empty."""

    n = len(values)
    if n == 0:
        return 0.0
    mean_val = safe_mean(values)
    return float((sum((v - mean_val) ** 2 for v in values) / n) ** 0.5)


def clamp(value: float, minimum: float, maximum: float) -> float:
    """Clamp a numeric value between minimum and maximum."""

    return max(minimum, min(maximum, value))


def to_jsonable(obj: Any) -> Any:
    """
    Recursively convert dataclasses and other containers into JSON-serializable
    structures (dicts/lists/primitives).
    """

    if is_dataclass(obj):
        return {k: to_jsonable(v) for k, v in asdict(obj).items()}
    if isinstance(obj, dict):
        return {str(k): to_jsonable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [to_jsonable(v) for v in obj]
    return obj


def count_words(tokens: Iterable[str]) -> int:
    """Count tokens that look like words (non-empty after stripping)."""

    return sum(1 for t in tokens if t.strip())


