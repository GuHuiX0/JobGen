"""
Audio-based feature extraction for the voice analysis module.

Responsibilities:
- Pause (silence) detection via simple energy-based VAD
- Prosodic features: RMS energy and pitch statistics
- Speech duration metadata
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

import librosa
import numpy as np

from .config import PAUSE_CONFIG, PROSODY_CONFIG
from .utils import clamp, safe_mean, safe_std


@dataclass
class PauseSegment:
    """Represents a detected pause segment in seconds."""

    start: float
    end: float

    @property
    def duration(self) -> float:
        return max(0.0, float(self.end - self.start))


@dataclass
class PauseStats:
    """Aggregated statistics for pause segments."""

    total_pause_count: int
    total_pause_duration: float
    average_pause_duration: float
    long_pause_count: int
    long_pause_threshold: float
    segments: List[PauseSegment]


@dataclass
class ProsodyStats:
    """Prosodic features based on RMS energy and pitch."""

    rms_mean: float
    rms_std: float
    pitch_mean_hz: float
    pitch_std_hz: float


@dataclass
class AudioMetadata:
    """Basic audio metadata."""

    sample_rate: int
    duration_seconds: float


def load_audio_mono(path: str, sample_rate: int) -> Tuple[np.ndarray, int]:
    """
    Load audio file as mono using librosa.

    Returns:
        (audio, sr)
    """

    audio, sr = librosa.load(path, sr=sample_rate, mono=True)
    return audio.astype(np.float32), int(sr)


def detect_pauses(
    audio: np.ndarray,
    sr: int,
) -> PauseStats:
    """
    Detect pauses (silence) using a simple energy-based VAD.

    Strategy:
    - Compute frame-wise RMS energy.
    - Use relative threshold: frame is "silent" if RMS < factor * median RMS.
    - Group consecutive silent frames into pause segments.
    """

    cfg = PAUSE_CONFIG
    frame_length = cfg.frame_length
    hop_length = cfg.hop_length

    if audio.size == 0:
        return PauseStats(
            total_pause_count=0,
            total_pause_duration=0.0,
            average_pause_duration=0.0,
            long_pause_count=0,
            long_pause_threshold=cfg.long_pause_threshold,
            segments=[],
        )

    # Frame-wise RMS energy
    rms = librosa.feature.rms(
        y=audio, frame_length=frame_length, hop_length=hop_length, center=True
    )[0]

    median_energy = float(np.median(rms)) if rms.size > 0 else 0.0
    if median_energy <= 0.0:
        # If everything is near-zero, treat as no speech but one long pause
        total_duration = len(audio) / sr
        if total_duration <= 0.0:
            return PauseStats(
                total_pause_count=0,
                total_pause_duration=0.0,
                average_pause_duration=0.0,
                long_pause_count=0,
                long_pause_threshold=cfg.long_pause_threshold,
                segments=[],
            )
        sole_segment = PauseSegment(start=0.0, end=total_duration)
        return PauseStats(
            total_pause_count=1,
            total_pause_duration=sole_segment.duration,
            average_pause_duration=sole_segment.duration,
            long_pause_count=int(sole_segment.duration >= cfg.long_pause_threshold),
            long_pause_threshold=cfg.long_pause_threshold,
            segments=[sole_segment],
        )

    threshold = cfg.energy_threshold_factor * median_energy
    is_silent = rms < threshold

    segments: List[PauseSegment] = []
    in_pause = False
    start_frame = 0

    for i, silent in enumerate(is_silent):
        if silent and not in_pause:
            in_pause = True
            start_frame = i
        elif not silent and in_pause:
            in_pause = False
            end_frame = i
            start_t = start_frame * hop_length / sr
            end_t = end_frame * hop_length / sr
            seg = PauseSegment(start=start_t, end=end_t)
            if seg.duration >= cfg.min_pause_duration:
                segments.append(seg)

    # Handle trailing pause
    if in_pause:
        end_frame = len(is_silent)
        start_t = start_frame * hop_length / sr
        end_t = end_frame * hop_length / sr
        seg = PauseSegment(start=start_t, end=end_t)
        if seg.duration >= cfg.min_pause_duration:
            segments.append(seg)

    durations = [s.duration for s in segments]
    total_pause_duration = float(sum(durations))
    total_pause_count = len(segments)
    average_pause_duration = safe_mean(durations)
    long_pause_count = sum(
        1 for d in durations if d >= cfg.long_pause_threshold
    )

    return PauseStats(
        total_pause_count=total_pause_count,
        total_pause_duration=total_pause_duration,
        average_pause_duration=average_pause_duration,
        long_pause_count=long_pause_count,
        long_pause_threshold=cfg.long_pause_threshold,
        segments=segments,
    )


def extract_prosody(audio: np.ndarray, sr: int) -> ProsodyStats:
    """
    Extract prosodic features (RMS energy and pitch).

    Pitch is estimated via librosa.yin; unvoiced frames are ignored
    when computing statistics.
    """

    cfg = PROSODY_CONFIG

    if audio.size == 0:
        return ProsodyStats(
            rms_mean=0.0,
            rms_std=0.0,
            pitch_mean_hz=0.0,
            pitch_std_hz=0.0,
        )

    # RMS energy
    rms = librosa.feature.rms(
        y=audio, frame_length=cfg.frame_length, hop_length=cfg.hop_length, center=True
    )[0]

    rms_values = rms.astype(float).tolist()
    rms_mean = safe_mean(rms_values)
    rms_std = safe_std(rms_values)

    # Pitch (YIN)
    try:
        pitch = librosa.yin(
            audio,
            fmin=cfg.fmin,
            fmax=cfg.fmax,
            sr=sr,
            frame_length=cfg.frame_length,
            hop_length=cfg.hop_length,
        )
        pitch_values = pitch.astype(float)
        # Filter out 0 and NaN (unvoiced)
        voiced = pitch_values[np.isfinite(pitch_values) & (pitch_values > 0)]
        pitch_list = voiced.tolist()
    except Exception:
        # If YIN fails (very short/quiet audio), fall back to zeros
        pitch_list = []

    pitch_mean = safe_mean(pitch_list)
    pitch_std = safe_std(pitch_list)

    return ProsodyStats(
        rms_mean=rms_mean,
        rms_std=rms_std,
        pitch_mean_hz=pitch_mean,
        pitch_std_hz=pitch_std,
    )


def extract_audio_features(path: str) -> Dict[str, object]:
    """
    High-level helper that loads the audio file and extracts:
    - metadata
    - pauses
    - prosody
    """

    audio, sr = load_audio_mono(path, sample_rate=PROSODY_CONFIG.sample_rate)
    duration_seconds = float(len(audio) / sr) if sr > 0 else 0.0

    metadata = AudioMetadata(sample_rate=sr, duration_seconds=duration_seconds)
    pauses = detect_pauses(audio, sr)
    prosody = extract_prosody(audio, sr)

    return {
        "metadata": {
            "sample_rate": metadata.sample_rate,
            "duration_seconds": metadata.duration_seconds,
        },
        "pauses": {
            "total_pause_count": pauses.total_pause_count,
            "total_pause_duration": pauses.total_pause_duration,
            "average_pause_duration": pauses.average_pause_duration,
            "long_pause_count": pauses.long_pause_count,
            "long_pause_threshold": pauses.long_pause_threshold,
            "segments": [
                {
                    "start": seg.start,
                    "end": seg.end,
                    "duration": seg.duration,
                }
                for seg in pauses.segments
            ],
        },
        "prosody": {
            "rms_mean": prosody.rms_mean,
            "rms_std": prosody.rms_std,
            "pitch_mean_hz": prosody.pitch_mean_hz,
            "pitch_std_hz": prosody.pitch_std_hz,
        },
    }


