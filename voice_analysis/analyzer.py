"""
Main entry point for the voice analysis module.

The public function is:

    analyze_voice(audio_path: str,
                  transcript: Optional[str] = None,
                  word_timestamps: Optional[list] = None) -> dict

This function:
- Loads and analyzes the audio (pauses, prosody, metadata)
- Uses transcript to compute filler statistics and speech rate
- Computes high-level fluency scores (confidence, hesitation, overall)
- Returns a JSON-serializable dictionary matching project requirements
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from .audio_features import extract_audio_features
from .schemas import VoiceAnalysisResult
from .scoring import compute_final_scores, compute_intermediate_scores
from .text_features import compute_speech_rate, detect_fillers


def analyze_voice(
    audio_path: str,
    transcript: Optional[str] = None,
    word_timestamps: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Analyze the audio file and optional transcript to extract pauses,
    filler words, prosody, speech rate, and fluency scores.

    Args:
        audio_path: Path to the audio file to analyze.
        transcript: Optional transcript string for filler analysis
            and speech rate computation. If None, text-based metrics
            will be zeroed.
        word_timestamps: Optional list of per-word timestamps. Not
            used in the initial implementation but kept for future
            fine-grained timing logic.

    Returns:
        A JSON-serializable dict with keys:
            - audio: metadata such as duration and sample rate
            - pauses: pause statistics and segments
            - fillers: filler word statistics
            - prosody: RMS and pitch statistics
            - speech_rate: word counts and WPM/WPS
            - scores: confidence/hesitation/fluency scores (1–5)
    """

    # 1) Audio analysis (pauses, prosody, metadata)
    audio_features = extract_audio_features(audio_path)
    meta = audio_features["metadata"]
    pauses = audio_features["pauses"]
    prosody = audio_features["prosody"]

    total_duration = float(meta.get("duration_seconds", 0.0) or 0.0)
    total_pause_seconds = float(pauses.get("total_pause_duration", 0.0) or 0.0)

    # 2) Text-based analysis (fillers, speech rate)
    fillers = detect_fillers(
        transcript=transcript,
        duration_seconds=total_duration,
    )
    speech_rate = compute_speech_rate(
        transcript=transcript,
        total_duration_seconds=total_duration,
        total_pause_seconds=total_pause_seconds,
    )

    # 3) Scoring
    interm = compute_intermediate_scores(
        words_per_minute=speech_rate.words_per_minute,
        total_pause_seconds=total_pause_seconds,
        total_duration_seconds=total_duration,
        long_pause_count=pauses.get("long_pause_count", 0),
        fillers_per_100_words=fillers.fillers_per_100_words,
        rms_std=prosody["rms_std"],
        pitch_std_hz=prosody["pitch_std_hz"],
    )
    final_scores = compute_final_scores(interm)

    result = VoiceAnalysisResult(
        audio=meta,
        pauses=pauses,
        fillers={
            "total_filler_count": fillers.total_fillers,
            "fillers_per_minute": fillers.fillers_per_minute,
            "fillers_per_100_words": fillers.fillers_per_100_words,
            "per_filler_counts": fillers.per_filler_counts,
        },
        prosody=prosody,
        speech_rate={
            "total_word_count": speech_rate.total_words,
            "words_per_second": speech_rate.words_per_second,
            "words_per_minute": speech_rate.words_per_minute,
            "effective_speech_duration": speech_rate.effective_duration_seconds,
        },
        scores={
            "confidence_score": final_scores.confidence_score,
            "hesitation_score": final_scores.hesitation_score,
            "overall_fluency_score": final_scores.overall_fluency_score,
        },
    )

    return result.to_dict()


__all__ = ["analyze_voice"]


if __name__ == "__main__":
    import argparse
    import sys
    import json

    parser = argparse.ArgumentParser(description="Voice analysis CLI")
    parser.add_argument("--audio_path", type=str, required=True, help="Path to the audio file")
    parser.add_argument("--transcript", type=str, default=None, help="Transcript (optional)")

    args = parser.parse_args()

    try:
        result = analyze_voice(audio_path=args.audio_path, transcript=args.transcript)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        sys.stderr.write(f"Error: {e}\n")
        sys.exit(1)
    sys.exit(0)


