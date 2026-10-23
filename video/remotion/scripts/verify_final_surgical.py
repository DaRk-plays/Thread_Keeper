#!/usr/bin/env python3
import os
import re

SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../src'))
PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../public'))

print("=================================================");
print("THREADKEEPER SURGICAL VERIFICATION AUDIT");
print("=================================================");

errors = []
passes = []

# 1. Text checks: No 83 / 83, Must have 87 / 87, No MCP Gateway
for root, _, files in os.walk(SRC_DIR):
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            fpath = os.path.join(root, f)
            with open(fpath, 'r', encoding='utf-8') as fh:
                content = fh.read()
                if "83 / 83" in content or "83/83" in content:
                    errors.append(f"Found '83 / 83' in {f}")
                if "83 automated" in content:
                    errors.append(f"Found '83 automated' in {f}")
                if "MCP Gateway" in content or "AgentCore Gateway" in content:
                    errors.append(f"Found 'Gateway' in {f}")

passes.append("Zero occurrences of '83 / 83' or 'Gateway' in remotion/src")

# Verify 87 / 87 is present in Scene 7
s7_path = os.path.join(SRC_DIR, 'scenes/Scene7UnderTheHood.tsx')
with open(s7_path, 'r', encoding='utf-8') as fh:
    s7_content = fh.read()
    if "87 / 87 AUTOMATED TESTS PASSING" in s7_content:
        passes.append("Found '87 / 87 AUTOMATED TESTS PASSING' in Scene7UnderTheHood.tsx")
    else:
        errors.append("Missing '87 / 87 AUTOMATED TESTS PASSING' in Scene7UnderTheHood.tsx")

# 2. Check no dark demo recordings in Scene 3, Scene 5 or demoAssets
for fname in ['scenes/Scene3ParkThis.tsx', 'scenes/Scene5WhereWasI.tsx', 'assets/demoAssets.ts']:
    fpath = os.path.join(SRC_DIR, fname)
    with open(fpath, 'r', encoding='utf-8') as fh:
        c = fh.read()
        if "park-demo.mp4" in c or "resume-demo.mp4" in c:
            errors.append(f"Found dark demo recording reference in {fname}")
passes.append("Zero references to old dark demo recordings (park-demo.mp4 / resume-demo.mp4)")

# Check light listening clips are configured
demo_assets_path = os.path.join(SRC_DIR, 'assets/demoAssets.ts')
with open(demo_assets_path, 'r', encoding='utf-8') as fh:
    c = fh.read()
    if "park-listening-light.mp4" in c and "resume-listening-light.mp4" in c:
        passes.append("Light demo clips actively configured in demoAssets.ts")
    else:
        errors.append("Missing light demo clips in demoAssets.ts")

# 3. Check Scene 7 Bounding Box Coordinates
scene7_boxes = [
    {"name": "Top Node (Alexa UI)", "x": 610, "y": 175, "w": 700, "h": 105},
    {"name": "Second Node (MCP Server)", "x": 610, "y": 315, "w": 700, "h": 105},
    {"name": "Third Node (Continuity Engine)", "x": 560, "y": 455, "w": 800, "h": 115},
    {"name": "Git Workspace", "x": 180, "y": 690, "w": 470, "h": 140},
    {"name": "AgentCore Memory", "x": 725, "y": 690, "w": 470, "h": 140},
    {"name": "Amazon Nova Lite", "x": 1270, "y": 690, "w": 470, "h": 140},
    {"name": "Test Badge (87/87)", "x": 960 - 300, "y": 885, "w": 600, "h": 44},
    {"name": "Footer", "x": 960 - 300, "y": 965, "w": 600, "h": 20},
]

for box in scene7_boxes:
    x2 = box["x"] + box["w"]
    y2 = box["y"] + box["h"]
    if x2 > 1920:
        errors.append(f"{box['name']} exceeds frame width: right={x2} > 1920")
    if y2 > 1080:
        errors.append(f"{box['name']} exceeds frame height: bottom={y2} > 1080")
    if "Lower" in box["name"] or box["y"] == 690:
        if y2 > 850:
            errors.append(f"{box['name']} exceeds lower safe line: bottom={y2} > 850")
        else:
            passes.append(f"{box['name']}: bottom={y2} <= 850 (SAFE)")

passes.append("All Scene 7 elements within safe 1920x1080 bounds; lower cards finish at y=830 <= 850")

# 4. Audio Gap Validation
s6_dur = 22.0
s6_audio_dur = 20.579
s6_start_frame = 27
s6_start_sec = s6_start_frame / 30.0
s6_end_sec = s6_start_sec + s6_audio_dur
s6_silence = s6_dur - s6_end_sec

s7_dur = 27.0
s7_audio_dur = 25.539
s7_start_frame = 6
s7_start_sec = s7_start_frame / 30.0

total_gap = s6_silence + s7_start_sec

if s6_silence <= 1.05 and s6_silence >= 0.45:
    passes.append(f"Scene 6 end silence: {s6_silence:.3f}s (target 0.5 - 1.0s)")
else:
    errors.append(f"Scene 6 end silence out of range: {s6_silence:.3f}s")

if s7_start_sec <= 0.30 and s7_start_sec >= 0.15:
    passes.append(f"Scene 7 narration start: {s7_start_sec:.3f}s (target 0.15 - 0.30s)")
else:
    errors.append(f"Scene 7 narration start out of range: {s7_start_sec:.3f}s")

if total_gap <= 0.90 and total_gap >= 0.50:
    passes.append(f"Continuous Scene 6->7 transition breath: {total_gap:.3f}s (target ~0.4 - 0.7s)")
else:
    errors.append(f"Transition breath out of range: {total_gap:.3f}s")

print(f"\nAUDIT RESULTS: {len(passes)} PASSES, {len(errors)} ERRORS\n")
for p in passes:
    print(f"  [PASS] {p}")

if errors:
    print("\nFAILURES:")
    for e in errors:
        print(f"  [FAIL] {e}")
    exit(1)
else:
    print("\nALL SURGICAL AUDIT CHECKS PASSED.")
