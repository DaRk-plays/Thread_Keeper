import React from 'react';
import { Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { COLOR_PALETTE, SCENES } from '../data/narration';
import { AUDIO_CONFIG } from '../data/audioConfig';
import { SceneTitle } from '../components/SceneTitle';
import { ThreadKeeperLogoText } from '../components/ThreadKeeperLogoText';
import { ContinuityThread } from '../components/ContinuityThread';
import { AnimatedCaption } from '../components/AnimatedCaption';
import { ProgressTimeline } from '../components/ProgressTimeline';

export const Scene2ThreadKeeperReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES[1];

  // Neon thread drawing animation across the screen
  const threadProgress = interpolate(frame, [0, 90], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Hero card scale & opacity
  const heroOpacity = interpolate(frame, [30, 70], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const heroScale = interpolate(frame, [30, 70], [0.92, 1], {
    extrapolateRight: 'clamp',
  });

  // Pillar cards stagger animation
  const p1Opacity = interpolate(frame, [70, 95], [0, 1], { extrapolateRight: 'clamp' });
  const p2Opacity = interpolate(frame, [95, 120], [0, 1], { extrapolateRight: 'clamp' });
  const p3Opacity = interpolate(frame, [120, 145], [0, 1], { extrapolateRight: 'clamp' });

  // Kinetic caption based on frame
  let kineticText = 'Meet ThreadKeeper: The Alexa+ Continuity Agent';
  if (frame >= 110 && frame < 220) {
    kineticText = 'Never lose your train of thought.';
  } else if (frame >= 220) {
    kineticText = 'Reconstruct intent • Detect drift • Surface stale assumptions';
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: COLOR_PALETTE.background,
        position: 'relative',
        overflow: 'hidden',
        padding: '60px 80px',
        boxSizing: 'border-box',
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(91, 140, 255, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Continuity Thread gathering thought fragments */}
      <ContinuityThread
        progress={threadProgress}
        points={[
          { x: 100, y: 540 },
          { x: 450, y: 440 },
          { x: 960, y: 560 },
          { x: 1470, y: 460 },
          { x: 1820, y: 540 },
        ]}
      />

      {/* Top Header */}
      <SceneTitle
        sceneNumber={2}
        title={scene.title}
        subtitle={scene.subtitle}
        accentColor={COLOR_PALETTE.continuityThread}
      />

      {/* Center Hero Card */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '44%',
          transform: `translate(-50%, -50%) scale(${heroScale})`,
          opacity: heroOpacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '28px',
          zIndex: 10,
        }}
      >
        <ThreadKeeperLogoText
          size="lg"
          subtitle="The Alexa+ Continuity Agent for Modern Software Engineering"
        />

        {/* Badges strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(91, 140, 255, 0.12)',
              border: `1.5px solid ${COLOR_PALETTE.continuityThread}`,
              borderRadius: '8px',
              padding: '6px 16px',
            }}
          >
            <span style={{ fontSize: '13px' }}>🎙️</span>
            <span
              style={{
                color: COLOR_PALETTE.textPrimary,
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              Alexa+ Voice Continuity
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(64, 224, 181, 0.12)',
              border: `1.5px solid ${COLOR_PALETTE.memorySaved}`,
              borderRadius: '8px',
              padding: '6px 16px',
            }}
          >
            <span style={{ fontSize: '13px' }}>🧠</span>
            <span
              style={{
                color: COLOR_PALETTE.textPrimary,
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              AWS Bedrock AgentCore Memory
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 181, 71, 0.12)',
              border: `1.5px solid ${COLOR_PALETTE.inference}`,
              borderRadius: '8px',
              padding: '6px 16px',
            }}
          >
            <span style={{ fontSize: '13px' }}>⚡</span>
            <span
              style={{
                color: COLOR_PALETTE.textPrimary,
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              Streamable HTTP MCP
            </span>
          </div>
        </div>

        {/* 3 Core Value Pillars */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          <div
            style={{
              width: '280px',
              backgroundColor: COLOR_PALETTE.cardBackground,
              border: `1px solid ${COLOR_PALETTE.cardBorder}`,
              borderRadius: '12px',
              padding: '18px 20px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              opacity: p1Opacity,
              transform: `translateY(${(1 - p1Opacity) * 15}px)`,
            }}
          >
            <div style={{ color: COLOR_PALETTE.continuityThread, fontSize: '18px', fontWeight: 800 }}>
              01. Intent Capture
            </div>
            <div style={{ color: COLOR_PALETTE.textSecondary, fontSize: '13px', marginTop: '6px', lineHeight: '1.4' }}>
              One ambient voice command indexes your live Git repo, active goal, and uncommitted diffs.
            </div>
          </div>

          <div
            style={{
              width: '280px',
              backgroundColor: COLOR_PALETTE.cardBackground,
              border: `1px solid ${COLOR_PALETTE.cardBorder}`,
              borderRadius: '12px',
              padding: '18px 20px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              opacity: p2Opacity,
              transform: `translateY(${(1 - p2Opacity) * 15}px)`,
            }}
          >
            <div style={{ color: COLOR_PALETTE.memorySaved, fontSize: '18px', fontWeight: 800 }}>
              02. Cloud Persistence
            </div>
            <div style={{ color: COLOR_PALETTE.textSecondary, fontSize: '13px', marginTop: '6px', lineHeight: '1.4' }}>
              Persists cognitive checkpoints to AWS AgentCore Memory across reboots and agent handoffs.
            </div>
          </div>

          <div
            style={{
              width: '280px',
              backgroundColor: COLOR_PALETTE.cardBackground,
              border: `1.5px solid ${COLOR_PALETTE.cardBorder}`,
              borderRadius: '12px',
              padding: '18px 20px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              opacity: p3Opacity,
              transform: `translateY(${(1 - p3Opacity) * 15}px)`,
            }}
          >
            <div style={{ color: COLOR_PALETTE.staleAlert, fontSize: '18px', fontWeight: 800 }}>
              03. Staleness Detection
            </div>
            <div style={{ color: COLOR_PALETTE.textSecondary, fontSize: '13px', marginTop: '6px', lineHeight: '1.4' }}>
              Continuity Diff detects changed files and flags invalid assumptions before you write one line.
            </div>
          </div>
        </div>
      </div>

      {/* Short Kinetic Caption */}
      <AnimatedCaption
        kineticText={kineticText}
        debugText={scene.narrationText}
        accentColor={COLOR_PALETTE.continuityThread}
      />

      {/* Progress Bar */}
      <ProgressTimeline currentSceneId={2} />

      {/* Audio Layer: Narration + Subtle SFX */}
      {AUDIO_CONFIG.enableNarration && (
        <Sequence from={9}>
          <Audio src={staticFile(AUDIO_CONFIG.narrationTracks.scene2)} volume={AUDIO_CONFIG.narrationVolume} />
        </Sequence>
      )}
      {AUDIO_CONFIG.enableSfx && (
        <Sequence from={15}>
          <Audio src={staticFile(AUDIO_CONFIG.sfxTracks.subtleWhoosh)} volume={AUDIO_CONFIG.sfxVolume} />
        </Sequence>
      )}
    </div>
  );
};
