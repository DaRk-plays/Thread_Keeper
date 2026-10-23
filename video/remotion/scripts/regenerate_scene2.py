#!/usr/bin/env python3
import os
import shutil
import subprocess
import wave
import array
import math

AUDIO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../public/audio'))
AWS_BIN = shutil.which("aws") or "aws"
FFMPEG_BIN = os.path.abspath(os.path.join(os.path.dirname(__file__), '../node_modules/@remotion/compositor-darwin-arm64/ffmpeg'))
DYLD_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../node_modules/@remotion/compositor-darwin-arm64'))

text = "ThreadKeeper is a bookmark for your working memory. Before an interruption, it parks your train of thought. When you return, it tells you what changed, and what needs review."
temp_mp3 = "/tmp/polly_s2_tight.mp3"
temp_wav = "/tmp/polly_s2_tight_raw.wav"
norm_wav = "/tmp/polly_s2_tight_norm.wav"
final_mp3 = os.path.join(AUDIO_DIR, "scene-02.mp3")

print(f"Synthesizing tightened Scene 2 with Danielle...")
cmd = [
    AWS_BIN, "polly", "synthesize-speech",
    "--engine", "generative",
    "--voice-id", "Danielle",
    "--text", text,
    "--output-format", "mp3",
    "--profile", "threadkeeper",
    "--region", "ap-southeast-2",
    temp_mp3
]
subprocess.run(cmd, check=True)

# Convert to 48kHz stereo WAV
subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16@48000", "-c", "2", temp_mp3, temp_wav], check=True)

with wave.open(temp_wav, "rb") as w:
    framerate = w.getframerate()
    nframes = w.getnframes()
    raw_bytes = w.readframes(nframes)

samples = array.array("h")
samples.frombytes(raw_bytes)
total_frames = nframes

# Trim leading/trailing silence
thresh = 300
start_frame = 0
end_frame = total_frames - 1

for f in range(total_frames):
    if abs(samples[f * 2]) > thresh or abs(samples[f * 2 + 1]) > thresh:
        start_frame = max(0, f - int(0.060 * framerate)) # 60ms pre-roll
        break

for f in range(total_frames - 1, -1, -1):
    if abs(samples[f * 2]) > thresh or abs(samples[f * 2 + 1]) > thresh:
        end_frame = min(total_frames - 1, f + int(0.080 * framerate)) # 80ms post-roll
        break

trimmed_frames = end_frame - start_frame + 1
trimmed_samples = samples[start_frame * 2 : (end_frame + 1) * 2]
audio_sec = trimmed_frames / framerate
words = len(text.split())
wpm = (words / audio_sec) * 60

# Normalization: target -19.5 dBFS RMS, peak <= -1.5 dBFS
raw_peak = max(abs(s) for s in trimmed_samples)
raw_rms = math.sqrt(sum(s * s for s in trimmed_samples) / len(trimmed_samples))
target_rms = 32768 * (10 ** (-19.5 / 20.0))
gain = target_rms / raw_rms if raw_rms > 0 else 1.0
max_gain = 27500 / raw_peak if raw_peak > 0 else 1.0
final_gain = min(gain, max_gain)

fade_in = int(0.025 * framerate)
fade_out = int(0.035 * framerate)

norm_samples = array.array("h")
for f in range(trimmed_frames):
    f_gain = final_gain
    if f < fade_in:
        f_gain *= (f / fade_in)
    elif f > trimmed_frames - fade_out:
        f_gain *= ((trimmed_frames - f) / fade_out)

    s_l = int(round(trimmed_samples[f * 2] * f_gain))
    s_r = int(round(trimmed_samples[f * 2 + 1] * f_gain))
    s_l = max(-32768, min(32767, s_l))
    s_r = max(-32768, min(32767, s_r))
    norm_samples.append(s_l)
    norm_samples.append(s_r)

with wave.open(norm_wav, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(48000)
    w.writeframes(norm_samples.tobytes())

norm_peak = max(abs(s) for s in norm_samples)
norm_rms = math.sqrt(sum(s * s for s in norm_samples) / len(norm_samples))
norm_peak_dbfs = 20 * math.log10(norm_peak / 32768)
norm_rms_dbfs = 20 * math.log10(norm_rms / 32768)

# Encode to MP3
env = os.environ.copy()
env["DYLD_LIBRARY_PATH"] = DYLD_PATH
encode_cmd = [
    FFMPEG_BIN, "-y", "-i", norm_wav,
    "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "48000",
    final_mp3
]
subprocess.run(encode_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env)

print(f"Scene 2 Processed:")
print(f"  Duration: {audio_sec:.2f}s ({words} words, {wpm:.1f} WPM)")
print(f"  Levels: Peak {norm_peak_dbfs:.1f} dBFS | RMS {norm_rms_dbfs:.1f} dBFS")
print(f"  Saved to: {final_mp3}")
