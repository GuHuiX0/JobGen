Voice Analysis Module
=====================

This directory implements the **algorithmic part** of the Voice Analysis module
for the *AI Interview Coach – Duolingo for Job Interviews* project.

The module focuses exclusively on **signal processing and scoring** – no API
routing, web server, or database code is included here.

Overview
--------

Implemented features:

- **Pause detection**
  - Simple energy-based VAD using RMS energy
  - Total pause count and total/average duration
  - Long pause count (configurable threshold)
  - List of pause segments with start/end/duration (seconds)

- **Filler word detection**
  - Uses a provided transcript string
  - Configurable filler word list in `config.py`
  - Total filler count
  - Fillers per minute
  - Fillers per 100 words
  - Per-filler detailed counts

- **Prosodic features (pitch / energy)**
  - `librosa`-based analysis
  - RMS energy mean / std
  - Pitch mean / std (YIN)

- **Speech rate**
  - Total word count (from transcript)
  - Words per minute (WPM)
  - Words per second (WPS)
  - Effective speech duration = total duration – silence duration

- **Scoring**
  - `confidence_score` (1–5)
  - `hesitation_score` (1–5)
  - `overall_fluency_score` (1–5)
  - Scores are computed via simple normalization + weighted combination of
    pauses, fillers, prosody, and speech rate.

Directory Structure
-------------------

The main files are:

- `analyzer.py` – high-level `analyze_voice` function
- `audio_features.py` – pause detection, prosody, audio metadata
- `text_features.py` – filler analysis and speech rate
- `scoring.py` – intermediate and final score computation
- `config.py` – configurable constants (fillers, thresholds, weights)
- `schemas.py` – thin dataclass wrapper for the returned structure
- `utils.py` – small shared helpers
- `tests/` – pytest-based tests
- `examples/` – optional usage snippets (non-essential)

API
---

The main entry point is the `analyze_voice` function:

```python
from voice_analysis import analyze_voice

result = analyze_voice(
    audio_path="example.wav",
    transcript="I am um really excited to, uh, talk about this role.",
)
```

Function signature:

```python
def analyze_voice(
    audio_path: str,
    transcript: Optional[str] = None,
    word_timestamps: Optional[list] = None,
) -> dict:
    """
    Analyze the audio file and optional transcript to extract pauses,
    filler words, prosody, speech rate, and fluency scores.
    """
```

Returned JSON structure (top level):

```python
{
    "audio": {
        "sample_rate": 16000,
        "duration_seconds": 12.34,
    },
    "pauses": {
        "total_pause_count": 5,
        "total_pause_duration": 3.1,
        "average_pause_duration": 0.62,
        "long_pause_count": 2,
        "long_pause_threshold": 1.0,
        "segments": [
            {"start": 1.2, "end": 1.9, "duration": 0.7},
            ...
        ],
    },
    "fillers": {
        "total_filler_count": 4,
        "fillers_per_minute": 12.5,
        "fillers_per_100_words": 8.0,
        "per_filler_counts": {
            "um": 2,
            "uh": 1,
            "ah": 1,
            ...
        },
    },
    "prosody": {
        "rms_mean": 0.03,
        "rms_std": 0.01,
        "pitch_mean_hz": 180.0,
        "pitch_std_hz": 25.0,
    },
    "speech_rate": {
        "total_word_count": 120,
        "words_per_second": 2.0,
        "words_per_minute": 120.0,
        "effective_speech_duration": 60.0,
    },
    "scores": {
        "confidence_score": 4.2,
        "hesitation_score": 3.6,
        "overall_fluency_score": 3.9,
    },
}
```

This structure is fully JSON-serializable and can be stored or sent via API by
the backend.

Dependencies
------------

The module assumes:

- Python 3.10+
- `librosa`
- `numpy`
- `pytest` (for tests)

These can be added to your project’s `requirements.txt`, e.g.:

```text
librosa>=0.10
numpy>=1.24
pytest>=7.0
```

Running Tests
-------------

From the project root:

```bash
pytest voice_analysis/tests
```

Tests cover:

- Filler word detection and normalization
- Speech rate computation
- Pause detection behavior on synthetic audio
- Scoring logic from intermediate metrics
- End-to-end `analyze_voice` integration on a small generated signal


