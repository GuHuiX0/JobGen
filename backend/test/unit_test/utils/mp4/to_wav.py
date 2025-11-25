import subprocess

mp4_path = 'generated-video-1763336962912.mp4'
wav_path = '../wav_samples/converted_interview.wav'

subprocess.run([
    'ffmpeg', '-y',  # -y overwrites output if exists
    '-i', mp4_path,
    '-ar', '16000',  # sample rate
    '-ac', '1',      # mono
    wav_path
], check=True)
print(f"Converted to {wav_path}")