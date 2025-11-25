"""
Scoring logic for the voice analysis module.

Produces:
- confidence_score (1–5)
- hesitation_score (1–5)
- overall_fluency_score (1–5)

Scores are based on simple normalization and weighted combinations
of lower-level metrics: speech rate, pauses, fillers, and prosody.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

from .config import SCORING_CONFIG
from .utils import clamp


@dataclass
class IntermediateScores:
    """Intermediate normalized scores in [0, 1]."""

    speech_rate: float
    energy_variation: float
    pitch_variation: float
    pause_ratio: float
    long_pauses: float
    fillers_per_100_words: float


@dataclass
class FinalScores:
    """Final scores in the 1–5 range."""

    confidence_score: float
    hesitation_score: float
    overall_fluency_score: float


def _normalize_speech_rate(wpm: float) -> float:
    cfg = SCORING_CONFIG
    # Ideal around target_wpm, penalize too slow/too fast
    min_wpm = cfg.min_wpm
    max_wpm = cfg.max_wpm
    target = cfg.target_wpm
    if wpm <= 0:
        return 0.0

    # Map [min_wpm, target] -> [0, 1], [target, max_wpm] -> [1, 0.7]
    if wpm <= target:
        return clamp((wpm - min_wpm) / max(target - min_wpm, 1e-9), 0.0, 1.0)
    else:
        # Slight decay past target
        excess = clamp((wpm - target) / max(max_wpm - target, 1e-9), 0.0, 1.0)
        return clamp(1.0 - 0.3 * excess, 0.0, 1.0)


def _normalize_pause_ratio(pause_ratio: float) -> float:
    # 0 pause ratio => 1.0, too high => 0.0
    cfg = SCORING_CONFIG
    return clamp(1.0 - (pause_ratio / max(cfg.max_pause_ratio, 1e-9)), 0.0, 1.0)


def _normalize_long_pauses(long_pause_count: int) -> float:
    cfg = SCORING_CONFIG
    if long_pause_count <= 0:
        return 1.0
    ratio = long_pause_count / max(cfg.max_long_pauses, 1)
    return clamp(1.0 - ratio, 0.0, 1.0)


def _normalize_fillers(fillers_per_100_words: float) -> float:
    cfg = SCORING_CONFIG
    return clamp(
        1.0 - (fillers_per_100_words / max(cfg.max_fillers_per_100_words, 1e-9)),
        0.0,
        1.0,
    )


def _normalize_variation(value: float, reference: float = 0.0) -> float:
    """
    Normalize variation (e.g. pitch/energy std) into [0, 1].
    There is no strong reference, so we use a simple squashing function.

    More variation up to a point is good; after that, saturates.
    """

    if value <= 0:
        return 0.1  # very flat delivery
    scaled = value / max(reference or value, 1e-6)
    # Use 1 - exp(-scaled) for a soft saturation curve, normalized.
    import math

    return clamp(1.0 - math.exp(-scaled), 0.0, 1.0)


def compute_intermediate_scores(
    *,
    words_per_minute: float,
    total_pause_seconds: float,
    total_duration_seconds: float,
    long_pause_count: int,
    fillers_per_100_words: float,
    rms_std: float,
    pitch_std_hz: float,
) -> IntermediateScores:
    """Compute intermediate normalized scores in [0, 1]."""

    if total_duration_seconds <= 0:
        pause_ratio = 0.0
    else:
        pause_ratio = total_pause_seconds / total_duration_seconds

    return IntermediateScores(
        speech_rate=_normalize_speech_rate(words_per_minute),
        energy_variation=_normalize_variation(rms_std),
        pitch_variation=_normalize_variation(pitch_std_hz),
        pause_ratio=_normalize_pause_ratio(pause_ratio),
        long_pauses=_normalize_long_pauses(long_pause_count),
        fillers_per_100_words=_normalize_fillers(fillers_per_100_words),
    )


def _weighted_sum(weights: Dict[str, float], scores: Dict[str, float]) -> float:
    total_w = sum(weights.values()) or 1.0
    return sum(weights[k] * scores.get(k, 0.0) for k in weights) / total_w


def compute_final_scores(intermediate: IntermediateScores) -> FinalScores:
    """
    Compute the final 1–5 scores from intermediate metrics.
    """

    cfg = SCORING_CONFIG

    # Confidence is driven by speech rate and prosodic variation
    confidence_norm = _weighted_sum(
        cfg.confidence_weights,
        {
            "speech_rate": intermediate.speech_rate,
            "energy_variation": intermediate.energy_variation,
            "pitch_variation": intermediate.pitch_variation,
        },
    )

    # Hesitation: more pauses/fillers -> lower score
    hesitation_norm = _weighted_sum(
        cfg.hesitation_weights,
        {
            "pause_ratio": intermediate.pause_ratio,
            "long_pauses": intermediate.long_pauses,
            "fillers_per_100_words": intermediate.fillers_per_100_words,
        },
    )

    # Combine into overall fluency
    fluency_norm = _weighted_sum(
        cfg.fluency_weights,
        {
            "confidence": confidence_norm,
            "hesitation": hesitation_norm,
        },
    )

    def to_scaled(score_norm: float) -> float:
        # Map [0,1] -> [1,5]
        return float(clamp(1.0 + 4.0 * score_norm, 1.0, 5.0))

    return FinalScores(
        confidence_score=to_scaled(confidence_norm),
        hesitation_score=to_scaled(hesitation_norm),
        overall_fluency_score=to_scaled(fluency_norm),
    )


