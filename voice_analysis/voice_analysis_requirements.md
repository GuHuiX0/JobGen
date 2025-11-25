# Voice Analysis Module – Development Instructions (for Cursor)

You are now acting as a **Senior Python Voice Analysis Engineer** working on the UNSW COMP9900 project **“AI Interview Coach – Duolingo for Job Interviews.”**

Your task is to implement the **algorithmic part of the Voice Analysis module**, inside the directory:

```
voice_analysis/
```

All **code, comments, docstrings, filenames, README content must be in English.**

You do **NOT** implement API routing, web servers, or DB storage.  
Back-end engineers will handle the integration; your work focuses strictly on:

- Audio feature extraction  
- Filler word detection  
- Pause detection  
- Prosodic features (pitch, energy)  
- Speech rate  
- Scoring module  
- JSON-serializable output  
- Documentation + minimal tests

---

## 1. Features to Implement

### 1.1 Pause Detection (Pauses)
Detect silence segments in the audio using simple energy-based VAD.

Return:

- total pause count  
- total pause duration  
- average pause duration  
- number of “long pauses” (> configurable threshold, e.g. 1.0s)  
- list of pause segments.

---

### 1.2 Filler Words (Um, Uh, Ah)
Assume a transcript string is provided by another service.

Required:

- configurable filler list in `config.py`  
- total filler count  
- fillers per minute  
- fillers per 100 words  
- per-word detailed counts  

---

### 1.3 Prosodic Features (Pitch / Energy)
Using `librosa`:

- RMS energy mean/std  
- Pitch mean/std (`librosa.yin` or `librosa.pyin`)  

---

### 1.4 Speech Rate
Based on transcript:

- total word count  
- words per minute (WPM)  
- words per second (WPS)  
- effective speech duration = total duration – silence duration  

---

### 1.5 Scoring Module
Produce:

- `confidence_score` (1–5)
- `hesitation_score` (1–5)
- `overall_fluency_score` (1–5)

Use simple normalization + weighted combination.

---

## 2. Returned JSON Structure

`analyzer.py` must expose the main function:

```python
def analyze_voice(audio_path: str,
                  transcript: Optional[str] = None,
                  word_timestamps: Optional[list] = None) -> dict:
    \"\"\"
    Analyze the audio file and optional transcript to extract pauses,
    filler words, prosody, speech rate, and fluency scores.
    \"\"\"
```

Include: audio metadata, pauses, filler words, prosody, speech rate, scoring.

---

## 3. Suggested Directory Structure

```
voice_analysis/
    __init__.py
    analyzer.py
    audio_features.py
    text_features.py
    scoring.py
    config.py
    schemas.py
    utils.py
    README.md
    tests/
    examples/
```

---

## 4. Implementation Requirements

- Python 3.10+
- English comments only
- Modular and testable code
- No I/O in core logic
- No hard-coded constants
- Type hints required

---

## 5. Tests

Use pytest; test filler logic, scoring, pause detection, analyzer integration.

---

## 6. Documentation

Include a README explaining usage and example outputs.

---

## 7. Your Task

Implement all modules, tests, README, and examples.
