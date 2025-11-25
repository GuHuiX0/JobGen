from gtts import gTTS
import base64
import time

# Text for the simulated interview (with fillers and pauses)
interview_text = (
    "Hello, um, this is a simulated interview answer. "
    "I am, uh, speaking in an artificially generated human voice, so you can, like, test the voice analysis system. "
    "Sometimes I hesitate, or, um, use fillers, just like a real person. So... let me, uh, think about my next point. "
    "Well, you know, answering questions can be, um, stressful, but I will do my best. "
)

tts = gTTS(interview_text, lang='en')
output_path = 'wav_samples/tts_interview.wav'
tts.save(output_path)

# Convert the WAV to base64
with open(output_path, 'rb') as f:
    b64 = base64.b64encode(f.read()).decode()


