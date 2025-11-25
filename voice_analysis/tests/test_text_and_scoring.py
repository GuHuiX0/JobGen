import math

from voice_analysis.scoring import (
    FinalScores,
    IntermediateScores,
    compute_final_scores,
)
from voice_analysis.text_features import compute_speech_rate, detect_fillers


def test_detect_fillers_basic():
    transcript = "I am um really excited to, uh, talk about this role, you know?"
    stats = detect_fillers(transcript, duration_seconds=60.0)

    assert stats.total_fillers >= 2
    assert stats.per_filler_counts["um"] >= 1
    assert stats.per_filler_counts["uh"] >= 1
    assert stats.fillers_per_minute > 0.0


def test_speech_rate_computation():
    transcript = "one two three four five six seven eight nine ten"
    total_duration = 10.0  # seconds
    pause_duration = 2.0
    stats = compute_speech_rate(transcript, total_duration, pause_duration)

    assert stats.total_words == 10
    assert math.isclose(stats.effective_duration_seconds, 8.0, rel_tol=1e-3)
    assert stats.words_per_second > 0.0
    assert stats.words_per_minute > 0.0


def test_final_scores_range():
    interm = IntermediateScores(
        speech_rate=0.8,
        energy_variation=0.6,
        pitch_variation=0.7,
        pause_ratio=0.9,
        long_pauses=0.8,
        fillers_per_100_words=0.7,
    )
    scores: FinalScores = compute_final_scores(interm)

    assert 1.0 <= scores.confidence_score <= 5.0
    assert 1.0 <= scores.hesitation_score <= 5.0
    assert 1.0 <= scores.overall_fluency_score <= 5.0


