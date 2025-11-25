"""
Lightweight schema-like dataclasses for the analyzer result.

Back-end engineers can later convert or validate these structures
with pydantic or other tools; here we keep them minimal and
JSON-serializable via plain dictionaries.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class VoiceAnalysisResult:
    """
    Top-level container for analyzer output.

    This class is intentionally thin; the external API should expose
    a JSON-serializable dict via ``to_dict()``.
    """

    audio: Dict[str, Any]
    pauses: Dict[str, Any]
    fillers: Dict[str, Any]
    prosody: Dict[str, Any]
    speech_rate: Dict[str, Any]
    scores: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "audio": self.audio,
            "pauses": self.pauses,
            "fillers": self.fillers,
            "prosody": self.prosody,
            "speech_rate": self.speech_rate,
            "scores": self.scores,
        }


