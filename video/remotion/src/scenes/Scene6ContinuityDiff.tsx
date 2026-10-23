import React from 'react';
import { Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { COLOR_PALETTE, SCENES } from '../data/narration';
import { AUDIO_CONFIG } from '../data/audioConfig';
import { SceneTitle } from '../components/SceneTitle';
import { ThenNowDiff } from '../components/ThenNowDiff';
import { EpistemicBadge } from '../components/EpistemicBadge';
import { ContinuityThread } from '../components/ContinuityThread';
import { AnimatedCaption } from '../components/AnimatedCaption';
import { ProgressTimeline } from '../components/ProgressTimeline';

export const Scene6ContinuityDiff: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES[5];

  // Right card reveal animation
  const rightReveal = interpolate(frame, [30, 70], [0, 1], { extrapolateRight: 'clamp' });

  // Epistemic badges strip stagger
  const badgeOpacity = interpolate(frame, [80, 120], [0, 1], { extrapolateRight: 'clamp' });

  // Continuity Thread bridging THEN and NOW
  const threadProgress = interpolate(frame, [40, 100], [0, 1], { extrapolateRight: 'clamp' });

  // Kinetic caption based on frame
  let kineticText = 'Continuity Diff: Comparing THEN vs NOW';
  if (frame >= 180 && frame < 380) {
    kineticText = 'Observed • Derived • Inferred • Unknown';
  } else if (frame >= 380) {
    kineticText = 'When evidence moves, ThreadKeeper knows what needs review';
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: COLOR_PALETTE.background,
        position: 'relative',
        overflow: 'hidden',
        padding: '50px 80px',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header */}
      <SceneTitle
        sceneNumber={6}
        title={scene.title}
        subtitle={scene.subtitle}
        accentColor={COLOR_PALETTE.staleAlert}
      />

      {/* Continuity Thread Physically Bridging THEN (Left) and NOW (Right) */}
      <ContinuityThread
        progress={threadProgress}
        color={COLOR_PALETTE.continuityThread}
        points={[
          { x: 300, y: 380 },
          { x: 620, y: 320 },
          { x: 960, y: 360 },
          { x: 1300, y: 320 },
          { x: 1620, y: 380 },
        ]}
      />

      {/* Main Center Stage: ThenNowDiff */}
      <div
        style={{
          marginTop: '30px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          zIndex: 10,
        }}
      >
        <ThenNowDiff revealProgress={rightReveal} />

        {/* Epistemic Grounding Classification Strip */}
        <div
          style={{
            backgroundColor: COLOR_PALETTE.cardBackground,
            border: `1px solid ${COLOR_PALETTE.cardBorder}`,
            borderRadius: '14px',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: badgeOpacity,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: COLOR_PALETTE.textPrimary, fontSize: '13px', fontWeight: 700, letterSpacing: '0.4px' }}>
              WHAT WE KNOW VS WHAT WE DON'T
            </span>
            <span style={{ color: COLOR_PALETTE.textSecondary, fontSize: '11px', fontFamily: 'monospace' }}>
              Zero hallucinated fixes. Zero fabricated actors.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <EpistemicBadge tier="OBSERVED" size="sm" subtext="Git Hashes" />
            <EpistemicBadge tier="DERIVED" size="sm" subtext="Diff Syntax" />
            <EpistemicBadge tier="INFERRED" size="sm" subtext="Marked Spec" />
            <EpistemicBadge tier="UNKNOWN" size="sm" subtext="Honest Void" />
            <EpistemicBadge tier="STALE" size="sm" subtext="Needs Review" />
          </div>
        </div>
      </div>

      {/* Short Kinetic Caption */}
      <AnimatedCaption
        kineticText={kineticText}
        debugText={scene.narrationText}
        accentColor={COLOR_PALETTE.staleAlert}
      />

      {/* Progress Bar */}
      <ProgressTimeline currentSceneId={6} />

      {/* Audio Layer: Narration + Subtle SFX */}
      {AUDIO_CONFIG.enableNarration && (
        <Sequence from={27}>
          <Audio src={staticFile(AUDIO_CONFIG.narrationTracks.scene6)} volume={AUDIO_CONFIG.narrationVolume} />
        </Sequence>
      )}
      {AUDIO_CONFIG.enableSfx && (
        <Sequence from={25}>
          <Audio src={staticFile(AUDIO_CONFIG.sfxTracks.subtleWhoosh)} volume={AUDIO_CONFIG.sfxVolume} />
        </Sequence>
      )}
    </div>
  );
};
