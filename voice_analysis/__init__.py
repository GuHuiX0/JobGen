"""
Voice analysis package for the AI Interview Coach project.

This package focuses purely on algorithmic voice analysis:
- Audio feature extraction (pauses, prosody, speech rate)
- Text-based features (filler words, speech rate from transcript)
- Scoring and aggregation

No API routing, web servers, or database logic should be added here.
"""

from .analyzer import analyze_voice

__all__ = ["analyze_voice"]


