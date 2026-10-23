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

# Expanded script definitions
NEW_SCENES = [
    {
        "id": 1,
        "name": "Scene 1: Problem Hook",
        "duration_sec": 14.0,
        "start_frame": 20,
        "start_sec": 20 / 30.0,
        "text": "You don't usually forget the file you were working on. You forget the reasoning around it — what you believed, what you tried, what was still uncertain, and what you planned to do next. After an interruption, that context is the expensive part to rebuild."
    },
    {
        "id": 2,
        "name": "Scene 2: ThreadKeeper Reveal",
        "duration_sec": 11.0,
        "start_frame": 12,
        "start_sec": 12 / 30.0,
        "text": "ThreadKeeper is a bookmark for your working memory. Before you step away, it captures the state of the work and the thinking behind it. When you come back, it doesn't just replay a note. It compares what you knew then with what is true now."
    },
    {
        "id": 3,
        "name": "Scene 3: Real Park Hero",
        "duration_sec": 22.0,
        "start_frame": 15,
        "start_sec": 15 / 30.0,
        "text": "Here I'm working on multi-currency payment validation. I say, 'Alexa, park this.' ThreadKeeper inspects the current Git state, captures my goal, assumptions, decisions and next action, then persists the checkpoint in AgentCore Memory. One phrase — and the thread is parked."
    },
    {
        "id": 4,
        "name": "Scene 4: The Interruption Gap",
        "duration_sec": 14.0,
        "start_frame": 20,
        "start_sec": 20 / 30.0,
        "text": "Then the process ends. While I'm away, payment dot T S changes. ThreadKeeper doesn't guess who changed it, or claim the issue was fixed. It simply knows the evidence has moved."
    },
    {
        "id": 5,
        "name": "Scene 5: Real Resume Hero",
        "duration_sec": 25.0,
        "start_frame": 20,
        "start_sec": 20 / 30.0,
        "text": "Later, a fresh process starts. I ask, 'Alexa, where was I?' ThreadKeeper retrieves the previous checkpoint, inspects the current workspace, and reconstructs the gap. The old assumption is now marked Needs Review. What it cannot prove stays Unknown. And the next action is grounded in the changed file."
    },
    {
        "id": 6,
        "name": "Scene 6: Grounded Continuity",
        "duration_sec": 24.0,
        "start_frame": 30,
        "start_sec": 30 / 30.0,
        "text": "That comparison is Continuity Diff: observed facts, derived conclusions, cautious inference, and explicit unknowns. Git remains authoritative. Memory preserves the past. Nova Lite helps interpret the difference without overriding the evidence."
    },
    {
        "id": 7,
        "name": "Scene 7: Architecture Flow",
        "duration_sec": 21.0,
        "start_frame": 20,
        "start_sec": 20 / 30.0,
        "text": "Under the hood, the Alexa-style interface talks to a self-hosted M C P server over Streamable H T T P. Six verified tools feed the ThreadKeeper continuity engine, connecting Git workspace truth, AgentCore Memory, and grounded model reasoning. The product logic is covered by eighty-seven automated tests."
    }
]

print("Synthesizing expanded scenes 1-7 with Danielle...")

for sc in NEW_SCENES:
    sid = sc["id"]
    file_id = f"scene-0{sid}"
    temp_mp3 = f"/tmp/polly_exp_{file_id}.mp3"
    temp_wav = f"/tmp/polly_exp_{file_id}_raw.wav"
    norm_wav = f"/tmp/polly_exp_{file_id}_norm.wav"
    final_mp3 = os.path.join(AUDIO_DIR, f"{file_id}.mp3")

    words = len(sc["text"].split())
    print(f"\n--- Scene {sid} ({words} words) ---")

    cmd = [
        AWS_BIN, "polly", "synthesize-speech",
        "--engine", "generative",
        "--voice-id", "Danielle",
        "--text", sc["text"],
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

    # Silence trimming
    thresh = 300
    start_frame = 0
    end_frame = total_frames - 1

    for f in range(total_frames):
        if abs(samples[f * 2]) > thresh or abs(samples[f * 2 + 1]) > thresh:
            start_frame = max(0, f - int(0.060 * framerate))
            break

    for f in range(total_frames - 1, -1, -1):
        if abs(samples[f * 2]) > thresh or abs(samples[f * 2 + 1]) > thresh:
            end_frame = min(total_frames - 1, f + int(0.080 * framerate))
            break

    trimmed_frames = end_frame - start_frame + 1
    trimmed_samples = samples[start_frame * 2 : (end_frame + 1) * 2]
    audio_sec = trimmed_frames / framerate
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

    end_sec = sc["start_sec"] + audio_sec
    silence_sec = sc["duration_sec"] - end_sec
    status = "OK" if silence_sec >= 0.5 else ("TIGHT" if silence_sec >= 0 else "OVERFLOW")

    print(f"  Duration: {audio_sec:.2f}s ({wpm:.1f} WPM)")
    print(f"  Levels: Peak {norm_peak_dbfs:.1f} dBFS | RMS {norm_rms_dbfs:.1f} dBFS")
    print(f"  Timing: Starts {sc['start_sec']:.2f}s (f{sc['start_frame']}) -> Ends {end_sec:.2f}s | Buffer: +{silence_sec:.2f}s [{status}]")

print("\nSynthesis complete.")
