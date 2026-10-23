#!/usr/bin/env python3
import os
import subprocess
import wave
import array
import math

AUDIO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../public/audio'))
FFMPEG_BIN = os.path.abspath(os.path.join(os.path.dirname(__file__), '../node_modules/@remotion/compositor-darwin-arm64/ffmpeg'))
DYLD_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../node_modules/@remotion/compositor-darwin-arm64'))

takes = [
    {
        "id": 1,
        "raw_wav": "/tmp/test_opt_s1_b.wav",
        "norm_wav": "/tmp/s1_norm.wav",
        "out_mp3": os.path.join(AUDIO_DIR, "scene-01.mp3")
    },
    {
        "id": 2,
        "raw_wav": "/tmp/test_opt_s2_b.wav",
        "norm_wav": "/tmp/s2_norm.wav",
        "out_mp3": os.path.join(AUDIO_DIR, "scene-02.mp3")
    }
]

for t in takes:
    with wave.open(t["raw_wav"], "rb") as w:
        framerate = w.getframerate()
        nframes = w.getnframes()
        raw_bytes = w.readframes(nframes)

    samples = array.array("h")
    samples.frombytes(raw_bytes)

    thresh = 300
    start_f = 0
    end_f = nframes - 1
    for f in range(nframes):
        if abs(samples[f * 2]) > thresh or abs(samples[f * 2 + 1]) > thresh:
            start_f = max(0, f - int(0.060 * framerate))
            break
    for f in range(nframes - 1, -1, -1):
        if abs(samples[f * 2]) > thresh or abs(samples[f * 2 + 1]) > thresh:
            end_f = min(nframes - 1, f + int(0.080 * framerate))
            break

    trimmed_frames = end_f - start_f + 1
    trimmed_samples = samples[start_f * 2 : (end_f + 1) * 2]
    audio_sec = trimmed_frames / framerate

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

    with wave.open(t["norm_wav"], "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(48000)
        w.writeframes(norm_samples.tobytes())

    norm_peak = max(abs(s) for s in norm_samples)
    norm_rms = math.sqrt(sum(s * s for s in norm_samples) / len(norm_samples))
    norm_peak_dbfs = 20 * math.log10(norm_peak / 32768)
    norm_rms_dbfs = 20 * math.log10(norm_rms / 32768)

    env = os.environ.copy()
    env["DYLD_LIBRARY_PATH"] = DYLD_PATH
    encode_cmd = [
        FFMPEG_BIN, "-y", "-i", t["norm_wav"],
        "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "48000",
        t["out_mp3"]
    ]
    subprocess.run(encode_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env)

    print(f"Scene {t['id']}: duration = {audio_sec:.2f}s | Peak = {norm_peak_dbfs:.1f} dBFS | RMS = {norm_rms_dbfs:.1f} dBFS -> {t['out_mp3']}")
