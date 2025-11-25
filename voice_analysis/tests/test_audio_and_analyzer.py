import numpy as np
import soundfile as sf
import tempfile
from pathlib import Path

from voice_analysis.analyzer import analyze_voice
from voice_analysis.audio_features import detect_pauses, extract_prosody


def _generate_sine_with_pauses(sr: int = 16000) -> np.ndarray:
    """Generate a simple synthetic signal with two silence regions."""

    t_tone = 1.0
    t_silence = 0.5

    t1 = np.linspace(0, t_tone, int(sr * t_tone), endpoint=False)
    tone = 0.1 * np.sin(2 * np.pi * 220 * t1)
    silence = np.zeros(int(sr * t_silence), dtype=np.float32)

    signal = np.concatenate([tone, silence, tone, silence, tone])
    return signal.astype(np.float32)


def test_pause_detection_on_synthetic_audio():
    sr = 16000
    audio = _generate_sine_with_pauses(sr=sr)
    pauses = detect_pauses(audio, sr)

    assert pauses.total_pause_count >= 1
    assert pauses.total_pause_duration > 0.4  # should detect at least part of silence


def test_prosody_on_sine_wave():
    sr = 16000
    audio = _generate_sine_with_pauses(sr=sr)
    prosody = extract_prosody(audio, sr)

    assert prosody.rms_mean > 0.0
    # Pitch may fail on short synthetic signals, but should not raise
    assert prosody.pitch_mean_hz >= 0.0


def test_analyzer_end_to_end(tmp_path: Path):
    sr = 16000
    audio = _generate_sine_with_pauses(sr=sr)

    # Write a temporary wav file
    audio_path = tmp_path / "test_audio.wav"
    sf.write(str(audio_path), audio, sr)

    transcript = "I am um really excited to talk about this role."

    result = analyze_voice(str(audio_path), transcript=transcript)

    assert "audio" in result
    assert "pauses" in result
    assert "scores" in result
    assert "confidence_score" in result["scores"]
    assert result["audio"]["duration_seconds"] > 0.0


