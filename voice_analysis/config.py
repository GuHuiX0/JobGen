"""
Configuration values and defaults for the voice analysis module.

All values here are intended to be easily adjustable and imported
by other modules. No hard-coded "magic numbers" should appear in
the core logic – use these constants instead.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class PauseConfig:
    """Configuration for pause (silence) detection."""

    # Frame length and hop length in samples for analysis (at 16 kHz)
    frame_length: int = 1024
    hop_length: int = 512

    # Minimum duration (in seconds) for a segment to be considered a pause
    min_pause_duration: float = 0.15

    # Threshold factor for energy-based VAD:
    # pause if frame_energy < energy_threshold_factor * median_energy
    energy_threshold_factor: float = 0.3

    # Duration threshold in seconds to consider a "long pause"
    long_pause_threshold: float = 1.0


@dataclass(frozen=True)
class FillerConfig:
    """Configuration for filler word detection."""

    # Default filler word list (case-insensitive, normalized tokens)
    fillers: List[str] = (
        "um",
        "uh",
        "uhm",
        "erm",
        "er",
        "ah",
        "like",
        "you know",
        "sort of",
        "kind of",
    )


@dataclass(frozen=True)
class ProsodyConfig:
    """Configuration for prosodic feature extraction."""

    # Target sample rate for librosa loading
    sample_rate: int = 16000

    # Frame/hop lengths for RMS and pitch
    frame_length: int = 1024
    hop_length: int = 256

    # Pitch extraction parameters (YIN)
    fmin: float = 80.0
    fmax: float = 400.0


@dataclass(frozen=True)
class ScoringConfig:
    """Configuration for scoring normalization and weights."""

    # Target ranges / reference values
    target_wpm: float = 130.0
    min_wpm: float = 80.0
    max_wpm: float = 180.0

    # Pause-related reference values
    max_long_pauses: int = 8
    max_pause_ratio: float = 0.35

    # Filler-related reference values
    max_fillers_per_100_words: float = 15.0

    # Weights for combining sub-scores into high-level scores
    confidence_weights: Dict[str, float] = None  # type: ignore[assignment]
    hesitation_weights: Dict[str, float] = None  # type: ignore[assignment]
    fluency_weights: Dict[str, float] = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        object.__setattr__(
            self,
            "confidence_weights",
            {
                "speech_rate": 0.5,
                "energy_variation": 0.25,
                "pitch_variation": 0.25,
            },
        )
        object.__setattr__(
            self,
            "hesitation_weights",
            {
                "pause_ratio": 0.4,
                "long_pauses": 0.3,
                "fillers_per_100_words": 0.3,
            },
        )
        object.__setattr__(
            self,
            "fluency_weights",
            {
                "confidence": 0.6,
                "hesitation": 0.4,
            },
        )


# Global config instances
PAUSE_CONFIG = PauseConfig()
FILLER_CONFIG = FillerConfig()
PROSODY_CONFIG = ProsodyConfig()
SCORING_CONFIG = ScoringConfig()


