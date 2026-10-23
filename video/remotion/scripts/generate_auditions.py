#!/usr/bin/env python3
import os
import shutil
import subprocess
import wave
import array
import math

AUDITIONS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../public/audio/auditions'))
os.makedirs(AUDITIONS_DIR, exist_ok=True)

AWS_BIN = shutil.which("aws") or "aws"
TEXT = "You don't usually forget the file you were working on. You forget everything around it — what you believed, what you tried, and what you planned to do next."

VOICES = [
    {
        "id": "Kajal",
        "name": "Kajal — English (Indian)",
        "file": "kajal.wav",
        "persona": "Natural, clear, warm conversational engineer"
    },
    {
        "id": "Danielle",
        "name": "Danielle — English (US)",
        "file": "danielle.wav",
        "persona": "Modern Silicon Valley tech narrator, confident and articulate"
    },
    {
        "id": "Brian",
        "name": "Brian — English (British)",
        "file": "brian.wav",
        "persona": "Measured, intelligent, understated systems engineer"
    }
]

print(f"Sample Text:\n\"{TEXT}\"\n")
word_count = len(TEXT.split())
print(f"Word Count: {word_count} words\n")

results = []

for v in VOICES:
    voice_id = v["id"]
    temp_mp3 = f"/tmp/polly_{voice_id}.mp3"
    temp_wav = f"/tmp/polly_{voice_id}_raw.wav"
    out_wav = os.path.join(AUDITIONS_DIR, v["file"])

    print(f"--- Synthesizing {v['name']} ({voice_id}) ---")
    cmd = [
        AWS_BIN, "polly", "synthesize-speech",
        "--engine", "generative",
        "--voice-id", voice_id,
        "--text", TEXT,
        "--output-format", "mp3",
        "--profile", "threadkeeper",
        "--region", "ap-southeast-2",
        temp_mp3
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)

    # Convert to 48kHz stereo WAV via macOS afconvert
    conv_cmd = [
        "afconvert", "-f", "WAVE", "-d", "LEI16@48000", "-c", "2",
        temp_mp3, temp_wav
    ]
    subprocess.run(conv_cmd, check=True)

    # Read audio samples
    with wave.open(temp_wav, "rb") as w:
        nchannels = w.getnchannels()
        sampwidth = w.getsampwidth()
        framerate = w.getframerate()
        nframes = w.getnframes()
        raw_bytes = w.readframes(nframes)

    samples = array.array("h")
    samples.frombytes(raw_bytes)
    total_samples = len(samples)
    duration_sec = nframes / framerate
    wpm = (word_count / duration_sec) * 60

    # Calculate raw Peak and RMS
    raw_peak = max(abs(s) for s in samples) if total_samples > 0 else 0
    raw_sum_sq = sum(s * s for s in samples)
    raw_rms = math.sqrt(raw_sum_sq / total_samples) if total_samples > 0 else 0
    raw_peak_dbfs = 20 * math.log10(raw_peak / 32768) if raw_peak > 0 else -99.9
    raw_rms_dbfs = 20 * math.log10(raw_rms / 32768) if raw_rms > 0 else -99.9

    print(f"  Duration: {duration_sec:.2f}s ({wpm:.1f} WPM)")
    print(f"  Raw Level: Peak {raw_peak_dbfs:.1f} dBFS, RMS {raw_rms_dbfs:.1f} dBFS")

    # Target: Normalize RMS to ~ -20.5 dBFS while ensuring peak <= -1.0 dBFS (no digital clipping)
    target_rms = 32768 * (10 ** (-20.5 / 20.0))
    gain = target_rms / raw_rms if raw_rms > 0 else 1.0

    # Check that gain doesn't cause peak to exceed -1.0 dBFS (29205)
    max_gain_by_peak = 29205 / raw_peak if raw_peak > 0 else 1.0
    final_gain = min(gain, max_gain_by_peak)

    # Apply 30ms fade-in and 50ms fade-out (30ms = 1440 frames, 50ms = 2400 frames)
    fade_in_frames = int(0.030 * framerate)
    fade_out_frames = int(0.050 * framerate)

    norm_samples = array.array("h")
    for frame_idx in range(nframes):
        # Calculate fade factor
        f_gain = final_gain
        if frame_idx < fade_in_frames:
            f_gain *= (frame_idx / fade_in_frames)
        elif frame_idx > nframes - fade_out_frames:
            f_gain *= ((nframes - frame_idx) / fade_out_frames)

        # Apply to left and right channels
        s_left = int(round(samples[frame_idx * 2] * f_gain))
        s_right = int(round(samples[frame_idx * 2 + 1] * f_gain))
        s_left = max(-32768, min(32767, s_left))
        s_right = max(-32768, min(32767, s_right))
        norm_samples.append(s_left)
        norm_samples.append(s_right)

    # Save normalized WAV
    with wave.open(out_wav, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(48000)
        w.writeframes(norm_samples.tobytes())

    # Measure normalized levels
    norm_peak = max(abs(s) for s in norm_samples)
    norm_sum_sq = sum(s * s for s in norm_samples)
    norm_rms = math.sqrt(norm_sum_sq / len(norm_samples))
    norm_peak_dbfs = 20 * math.log10(norm_peak / 32768)
    norm_rms_dbfs = 20 * math.log10(norm_rms / 32768)

    print(f"  Normalized: Peak {norm_peak_dbfs:.1f} dBFS, RMS {norm_rms_dbfs:.1f} dBFS")
    print(f"  Output: {out_wav}\n")

    results.append({
        "id": voice_id,
        "name": v["name"],
        "persona": v["persona"],
        "file": v["file"],
        "path": out_wav,
        "duration": duration_sec,
        "wpm": wpm,
        "raw_peak_dbfs": raw_peak_dbfs,
        "raw_rms_dbfs": raw_rms_dbfs,
        "norm_peak_dbfs": norm_peak_dbfs,
        "norm_rms_dbfs": norm_rms_dbfs,
    })

    # Cleanup temp files
    if os.path.exists(temp_mp3):
        os.remove(temp_mp3)
    if os.path.exists(temp_wav):
        os.remove(temp_wav)

print("=" * 60)
print("AUDITIONS COMPLETE SUMMARY:")
for r in results:
    print(f"{r['name']}: {r['duration']:.2f}s ({r['wpm']:.1f} WPM) | Peak: {r['norm_peak_dbfs']:.1f} dBFS | RMS: {r['norm_rms_dbfs']:.1f} dBFS | {r['path']}")
