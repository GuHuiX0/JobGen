"""
Transcript-based feature extraction for the voice analysis module.

Responsibilities:
- Filler word detection and statistics
- Speech rate (words per second / minute) using transcript and timing
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from .config import FILLER_CONFIG
from .utils import count_words, safe_mean


WORD_RE = re.compile(r"\b[\w']+\b", flags=re.UNICODE)


@dataclass
class FillerStats:
    """Statistics for filler words."""

    total_fillers: int
    fillers_per_minute: float
    fillers_per_100_words: float
    per_filler_counts: Dict[str, int]


@dataclass
class SpeechRateStats:
    """Speech rate metrics."""

    total_words: int
    words_per_second: float
    words_per_minute: float
    effective_duration_seconds: float


def tokenize_transcript(transcript: str) -> List[str]:
    """Tokenize transcript into lowercase word tokens."""

    if not transcript:
        return []
    return [m.group(0).lower() for m in WORD_RE.finditer(transcript)]


def detect_fillers(
    transcript: Optional[str],
    duration_seconds: float,
) -> FillerStats:
    """
    Detect and count filler words in the transcript.

    The filler list is configurable via FILLER_CONFIG.
    Matching is performed on tokens; multi-word fillers are supported
    by simple n-gram matching.
    """

    cfg = FILLER_CONFIG
    if not transcript:
        return FillerStats(
            total_fillers=0,
            fillers_per_minute=0.0,
            fillers_per_100_words=0.0,
            per_filler_counts={f: 0 for f in cfg.fillers},
        )

    tokens = tokenize_transcript(transcript)
    total_words = len(tokens)

    per_filler_counts: Dict[str, int] = {f: 0 for f in cfg.fillers}
    total_fillers = 0

    # Precompute filler as list of token lists for multi-word matching
    filler_token_lists: List[Tuple[str, List[str]]] = [
        (f, f.split()) for f in cfg.fillers
    ]

    i = 0
    while i < len(tokens):
        matched_any = False
        for filler_str, filler_tokens in filler_token_lists:
            n = len(filler_tokens)
            if n == 0 or i + n > len(tokens):
                continue
            if tokens[i : i + n] == filler_tokens:
                per_filler_counts[filler_str] += 1
                total_fillers += 1
                i += n
                matched_any = True
                break
        if not matched_any:
            i += 1

    minutes = max(duration_seconds / 60.0, 1e-9)
    fillers_per_minute = total_fillers / minutes
    fillers_per_100_words = (
        (total_fillers / max(total_words, 1)) * 100.0 if total_words > 0 else 0.0
    )

    return FillerStats(
        total_fillers=total_fillers,
        fillers_per_minute=fillers_per_minute,
        fillers_per_100_words=fillers_per_100_words,
        per_filler_counts=per_filler_counts,
    )


def compute_speech_rate(
    transcript: Optional[str],
    total_duration_seconds: float,
    total_pause_seconds: float,
) -> SpeechRateStats:
    """
    Compute speech rate metrics based on transcript and timing.

    Effective speech duration = total_duration - pause_duration.
    """

    if not transcript:
        return SpeechRateStats(
            total_words=0,
            words_per_second=0.0,
            words_per_minute=0.0,
            effective_duration_seconds=max(total_duration_seconds - total_pause_seconds, 0.0),
        )

    tokens = tokenize_transcript(transcript)
    total_words = len(tokens)

    effective_duration = max(total_duration_seconds - total_pause_seconds, 1e-9)
    words_per_second = total_words / effective_duration
    words_per_minute = words_per_second * 60.0

    return SpeechRateStats(
        total_words=total_words,
        words_per_second=words_per_second,
        words_per_minute=words_per_minute,
        effective_duration_seconds=effective_duration,
    )


