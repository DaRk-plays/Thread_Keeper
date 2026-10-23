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

# Scene timing metadata (fps = 30)
SCENES = [
    {
        "id": 1,
        "name": "Scene 1: Problem Hook",
        "duration_sec": 14.0,
        "start_frame": 20,
        "start_sec": 20 / 30.0,
        "text": "You don't usually forget the file you were working on. You forget everything around it — what you believed, what you tried, and what you planned to do next."
    },
    {
        "id": 2,
        "name": "Scene 2: ThreadKeeper Reveal",
        "duration_sec": 11.0,
        "start_frame": 15,
        "start_sec": 15 / 30.0,
        "text": "ThreadKeeper is a bookmark for your working memory. Before an interruption, it parks your train of thought. When you return, it tells you what changed — and whether your old assumptions are still safe."
    },
    {
        "id": 3,
        "name": "Scene 3: Real Park Hero",
        "duration_sec": 22.0,
        "start_frame": 15,
        "start_sec": 15 / 30.0,
        "text": "I'm working on multi-currency payment validation. I say, 'Alexa, park this.' ThreadKeeper captures the current Git evidence, my assumptions, decisions, and next step. Then it persists that context in AgentCore Memory."
    },
    {
        "id": 4,
        "name": "Scene 4: The Interruption Gap",
        "duration_sec": 14.0,
        "start_frame": 20,
        "start_sec": 20 / 30.0,
        "text": "Then ThreadKeeper shuts down completely. While I'm away, payment dot T S changes. The hard part isn't remembering the file. It's knowing whether what I believed before is still true."
    },
    {
        "id": 5,
        "name": "Scene 5: Real Resume Hero",
        "duration_sec": 25.0,
        "start_frame": 20,
        "start_sec": 20 / 30.0,
        "text": "Later, a fresh process starts. I ask... 'Alexa, where was I?'"
    },
    {
        "id": 6,
        "name": "Scene 6: Grounded Continuity",
        "duration_sec": 24.0,
        "start_frame": 30,
        "start_sec": 30 / 30.0,
        "text": "This is Continuity Diff. Git tells ThreadKeeper what actually changed. AgentCore remembers what I believed before I left. ThreadKeeper separates what is observed, what can be derived, what is only inferred, and what is still unknown."
    },
    {
        "id": 7,
        "name": "Scene 7: Architecture Flow",
        "duration_sec": 21.0,
        "start_frame": 20,
        "start_sec": 20 / 30.0,
        "text": "Underneath, ThreadKeeper is a self-hosted M C P server over Streamable HTTP. Git remains the source of truth. AgentCore provides persistent memory. And Amazon Nova Lite helps explain the impact — without overruling the evidence."
    },
    {
        "id": 8,
        "name": "Scene 8: The Continuity Standard",
        "duration_sec": 16.0,
        "start_frame": 30,
        "start_sec": 30 / 30.0,
        "text": "Your code already has version control. Your train of thought should too. ThreadKeeper. Never lose your train of thought."
    }
]

print("=" * 70)
print("THREADKEEPER FINAL POLLY GENERATIVE NARRATION SYNTHESIS (Danielle)")
print("=" * 70)

results = []

for sc in SCENES:
    sid = sc["id"]
    file_id = f"scene-0{sid}"
    temp_mp3 = f"/tmp/polly_final_{file_id}.mp3"
    temp_wav = f"/tmp/polly_final_{file_id}_raw.wav"
    norm_wav = f"/tmp/polly_final_{file_id}_norm.wav"
    final_mp3 = os.path.join(AUDIO_DIR, f"{file_id}.mp3")

    print(f"\n--- Synthesizing Scene {sid}: {sc['name']} ---")
    print(f"Text: \"{sc['text']}\"")
    words = len(sc["text"].split())

    # Call AWS Polly Generative
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

    # Convert to 48kHz stereo WAV for clean sample-accurate DSP
    conv_cmd = [
        "afconvert", "-f", "WAVE", "-d", "LEI16@48000", "-c", "2",
        temp_mp3, temp_wav
    ]
    subprocess.run(conv_cmd, check=True)

    with wave.open(temp_wav, "rb") as w:
        framerate = w.getframerate()
        nframes = w.getnframes()
        raw_bytes = w.readframes(nframes)

    samples = array.array("h")
    samples.frombytes(raw_bytes)
    total_frames = nframes

    # Silence trimming: find first and last non-silent frames (threshold: 300 / 32768 approx -40 dBFS)
    thresh = 300
    start_frame = 0
    end_frame = total_frames - 1

    for f in range(total_frames):
        if abs(samples[f * 2]) > thresh or abs(samples[f * 2 + 1]) > thresh:
            start_frame = max(0, f - int(0.080 * framerate)) # 80ms pre-roll
            break

    for f in range(total_frames - 1, -1, -1):
        if abs(samples[f * 2]) > thresh or abs(samples[f * 2 + 1]) > thresh:
            end_frame = min(total_frames - 1, f + int(0.120 * framerate)) # 120ms post-roll
            break

    trimmed_frames = end_frame - start_frame + 1
    trimmed_samples = samples[start_frame * 2 : (end_frame + 1) * 2]
    audio_sec = trimmed_frames / framerate
    wpm = (words / audio_sec) * 60

    # Measure trimmed audio
    raw_peak = max(abs(s) for s in trimmed_samples)
    raw_rms = math.sqrt(sum(s * s for s in trimmed_samples) / len(trimmed_samples))
    raw_peak_dbfs = 20 * math.log10(raw_peak / 32768)
    raw_rms_dbfs = 20 * math.log10(raw_rms / 32768)

    # Target: -19.5 dBFS RMS (between -20 and -18 dBFS) with Peak <= -1.5 dBFS (27500)
    target_rms = 32768 * (10 ** (-19.5 / 20.0))
    gain = target_rms / raw_rms if raw_rms > 0 else 1.0
    max_gain = 27500 / raw_peak if raw_peak > 0 else 1.0
    final_gain = min(gain, max_gain)

    # Apply 25ms fade-in and 35ms fade-out
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

    # Measure normalized levels
    norm_peak = max(abs(s) for s in norm_samples)
    norm_rms = math.sqrt(sum(s * s for s in norm_samples) / len(norm_samples))
    norm_peak_dbfs = 20 * math.log10(norm_peak / 32768)
    norm_rms_dbfs = 20 * math.log10(norm_rms / 32768)

    # Encode to high-quality 48kHz stereo MP3 for Remotion
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

    print(f"  Duration: {audio_sec:.2f}s ({words} words, {wpm:.1f} WPM)")
    print(f"  Levels: Peak {norm_peak_dbfs:.1f} dBFS | RMS {norm_rms_dbfs:.1f} dBFS")
    print(f"  Timing: Starts {sc['start_sec']:.2f}s (f{sc['start_frame']}) -> Ends {end_sec:.2f}s | Buffer: +{silence_sec:.2f}s [{status}]")
    print(f"  Saved to: {final_mp3}")

    results.append({
        "id": sid,
        "name": sc["name"],
        "words": words,
        "duration_sec": audio_sec,
        "wpm": wpm,
        "start_sec": sc["start_sec"],
        "start_frame": sc["start_frame"],
        "end_sec": end_sec,
        "scene_duration": sc["duration_sec"],
        "silence_sec": silence_sec,
        "status": status,
        "peak_dbfs": norm_peak_dbfs,
        "rms_dbfs": norm_rms_dbfs,
        "file": final_mp3
    })

    # Cleanup temp files
    for p in [temp_mp3, temp_wav, norm_wav]:
        if os.path.exists(p):
            os.remove(p)

print("\n" + "=" * 80)
print("FINAL NARRATION TIMING & LOUDNESS AUDIT")
print("=" * 80)
print(f"{'Scene':<5} | {'Scene Dur':<10} | {'Audio Dur':<10} | {'Start':<12} | {'End':<8} | {'Buffer':<10} | {'Peak':<9} | {'RMS':<9} | {'Status'}")
print("-" * 95)
for r in results:
    start_str = f"{r['start_sec']:.2f}s (f{r['start_frame']})"
    print(f"S{r['id']:<4} | {r['scene_duration']:>6.2f}s    | {r['duration_sec']:>6.2f}s    | {start_str:<12} | {r['end_sec']:>5.2f}s  | +{r['silence_sec']:>5.2f}s   | {r['peak_dbfs']:>5.1f} dB | {r['rms_dbfs']:>5.1f} dB | {r['status']}")

print("=" * 80)
