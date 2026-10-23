# ThreadKeeper — Official Hackathon Demo Video Foundation

> Built with [Remotion](https://www.remotion.dev/) for the Amazon Build, Ship, Shape Developer Hackathon 2026.

This directory contains the production video codebase for ThreadKeeper's official 3-minute hackathon demo video. It combines high-end YouTube engineering explainer pacing with a dark technical doodle aesthetic, glowing continuity-thread visual language, and real drop-in slots for verified AWS Bedrock and Model Context Protocol executions.

---

## 1. Video Specifications

- **Composition ID**: `ThreadKeeperHackathonDemo`
- **Resolution**: 1920 × 1080 (Full HD, 16:9 widescreen)
- **Frame Rate**: 30 frames per second
- **Total Duration**: 4,620 frames (154 seconds = 2 minutes 34 seconds)
- **Pacing**: Perfectly positioned below the hard 3:00 Amazon hackathon cutoff.

---

## 2. Color Palette & Visual Semantics

| Semantic Purpose | Hex Code | Visual Meaning |
|---|---|---|
| **Deep Obsidian Background** | `#080B12` | Dark technical canvas with subtle coordinate grids |
| **Continuity Thread** | `#5B8CFF` | Neon Blue: Unbroken cognitive thread across interruptions |
| **AgentCore Memory** | `#40E0B5` | Mint: Verified persistent AWS memory and saved checkpoints |
| **Stale Assumption Alert** | `#FF5C7A` | Coral Red: Underlying artifact modified; assumption invalid |
| **Inferred Hypothesis** | `#FFB547` | Amber: Model synthesis clearly flagged as hypothesis |
| **Honest Boundary (Unknown)** | `#8E8BAF` | Violet-Gray: Preserved epistemic void; zero hallucination |
| **Observed Fact** | `#FFFFFF` | White: Proven ground truth anchored by Git hashes |

---

## 3. Scene Breakdown & Timestamps

| Scene | Name | Timestamp | Frame Range | Duration | Key Visual Focus |
|---|---|---|---|---|---|
| **01** | Context Lost | `0:00 - 0:14` | `0 - 420` | 14s (420f) | Stick figure coding, mental map of multi-currency logic pops upon interruption |
| **02** | ThreadKeeper Reveal | `0:14 - 0:25` | `420 - 750` | 11s (330f) | Neon blue thread reknits shattered thoughts; Alexa+ & Bedrock badges emerge |
| **03** | "Alexa, Park This" | `0:25 - 0:50` | `750 - 1500` | 25s (750f) | Voice waveform ripples; MCP `capture_checkpoint` stores state to AgentCore in < 3s |
| **04** | The Interruption & Drift | `0:50 - 1:04` | `1500 - 1920` | 14s (420f) | Clock ticks; desk is empty; `src/payment.ts` changes while away (dirty tree / changed hash); assumptions stale |
| **05** | "Alexa, Where Was I?" | `1:04 - 1:34` | `1920 - 2820` | 30s (900f) | Developer returns; 5-sentence grounded spoken re-entry highlights stale assumption |
| **06** | Continuity Diff | `1:34 - 1:58` | `2820 - 3540` | 24s (720f) | Side-by-side THEN (T0) vs NOW (T1); 4-tier epistemic separation |
| **07** | Under The Hood | `1:58 - 2:18` | `3540 - 4140` | 20s (600f) | Hierarchy flow: Alexa UI -> MCP -> Continuity Engine -> (Git Truth, AgentCore Memory, Nova Lite); 83 tests passing |
| **08** | The Payoff | `2:18 - 2:34` | `4140 - 4620` | 16s (480f) | Back in flow in 15 seconds; Amazon Hackathon 2026 track banner; GitHub CTA |

---

## 4. Reusable Component Library (`src/components/`)

1. **`StickDeveloper`**: Hand-drawn SVG doodle stick figure at desk with subtle wobble and typing animations. Supports moods: `coding`, `shocked`, `away`, `back_in_flow`, `thinking`.
2. **`ThoughtBubble`**: Floating cognitive thought nodes with physics-based particle scatter upon interruption.
3. **`ContinuityThread`**: Glowing multi-layer neon SVG bezier curve with breathing pulse.
4. **`GlowNode`**: Circular semantic milestone with pulsing aura and category accents.
5. **`EpistemicBadge`**: High-contrast badges for `OBSERVED`, `DERIVED`, `INFERRED`, `UNKNOWN`, and `STALE`.
6. **`RealDemoSlot`**: Drop-in container supporting production MP4 recordings or interactive terminal placeholders.
7. **`TerminalSnippet`**: macOS terminal window with typing cursor and colored output lines.
8. **`CodeDiffCard`**: Syntax-highlighted unified Git diff card highlighting `src/payment.ts` modifications.
9. **`ThenNowDiff`**: Split comparison card contrasting checkpoint T0 with resumed working copy T1.
10. **`ArchitectureNode`**: Interactive system topology block with animated packet pulses.
11. **`AnimatedCaption`**: Translucent bottom closed-caption strip with keyword highlighting.
12. **`SceneTitle`**: Clean scene badge and title banner.
13. **`ThreadKeeperLogoText`**: Modern tech logo with connected neural dots.
14. **`AudioWave`**: Oscillating vertical voice waveform visualizer.
15. **`ProgressTimeline`**: Bottom progress indicator showing active scene milestones.

---

## 5. CLI Commands

From inside `video/remotion/`:

```bash
# Typecheck
npm run typecheck

# Start Remotion interactive preview studio
npm run start

# Generate still frame preview
npx remotion still src/index.ts ThreadKeeperHackathonDemo previews/preview-01-00-05.png --frame 150

# Render full video (when production recordings and voiceover are finalized)
npm run build
```

---

## 6. Still Preview Frames

High-resolution 1920x1080 preview frames for all 8 scenes are generated in `previews/`:
- `preview-01-00-05.png` (Scene 1: 00:05, frame 150)
- `preview-02-00-18.png` (Scene 2: 00:18, frame 540)
- `preview-03-00-34.png` (Scene 3: 00:34, frame 1020)
- `preview-04-00-56.png` (Scene 4: 00:56, frame 1680)
- `preview-05-01-12.png` (Scene 5: 01:12, frame 2160)
- `preview-06-01-43.png` (Scene 6: 01:43, frame 3090)
- `preview-07-02-05.png` (Scene 7: 02:05, frame 3750)
- `preview-08-02-26.png` (Scene 8: 02:26, frame 4380)
