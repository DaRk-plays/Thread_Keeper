import React from 'react';
import { Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { COLOR_PALETTE, SCENES } from '../data/narration';
import { AUDIO_CONFIG } from '../data/audioConfig';
import { SceneTitle } from '../components/SceneTitle';
import { StickDeveloper } from '../components/StickDeveloper';
import { ThreadKeeperLogoText } from '../components/ThreadKeeperLogoText';
import { ContinuityThread } from '../components/ContinuityThread';
import { AnimatedCaption } from '../components/AnimatedCaption';
import { ProgressTimeline } from '../components/ProgressTimeline';

export const Scene8Payoff: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES[7];

  // Hero card scale & opacity
  const heroOpacity = interpolate(frame, [20, 60], [0, 1], { extrapolateRight: 'clamp' });
  const heroScale = interpolate(frame, [20, 60], [0.94, 1], { extrapolateRight: 'clamp' });

  // Comparison cards entrance
  const cardY = interpolate(frame, [40, 80], [30, 0], { extrapolateRight: 'clamp' });
  const cardOpacity = interpolate(frame, [40, 80], [0, 1], { extrapolateRight: 'clamp' });

  // Continuity thread resolving into ThreadKeeper branding
  const threadProgress = interpolate(frame, [30, 90], [0, 1], { extrapolateRight: 'clamp' });

  // Kinetic caption based on frame
  let kineticText = 'From 20 minutes of archaeology to 15 seconds of flow';
  if (frame >= 220) {
    kineticText = 'ThreadKeeper: Never lose your train of thought.';
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
      {/* Background Tech Starfield / Grid */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `radial-gradient(circle at 50% 40%, rgba(91, 140, 255, 0.12) 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Continuity Thread Resolving into Branding */}
      <ContinuityThread
        progress={threadProgress}
        color={COLOR_PALETTE.continuityThread}
        points={[
          { x: 100, y: 540 },
          { x: 450, y: 460 },
          { x: 800, y: 520 },
          { x: 1200, y: 440 },
          { x: 1550, y: 510 },
        ]}
      />

      {/* Top Header */}
      <SceneTitle
        sceneNumber={8}
        title={scene.title}
        subtitle={scene.subtitle}
        accentColor={COLOR_PALETTE.continuityThread}
      />

      {/* Center Layout: Left Developer in Flow, Right Brand & Comparison */}
      <div
        style={{
          display: 'flex',
          gap: '50px',
          marginTop: '30px',
          height: '560px',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        {/* Left: Stick Developer in flow */}
        <div
          style={{
            width: '420px',
            height: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Confident Flow Banner */}
          <div
            style={{
              position: 'absolute',
              top: '50px',
              backgroundColor: 'rgba(64, 224, 181, 0.12)',
              border: `2px solid ${COLOR_PALETTE.memorySaved}`,
              borderRadius: '20px',
              padding: '14px 24px',
              boxShadow: '0 0 24px rgba(64, 224, 181, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '18px' }}>⚡</span>
            <span
              style={{
                color: COLOR_PALETTE.memorySaved,
                fontSize: '16px',
                fontWeight: 800,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              100% Back in Flow
            </span>
          </div>

          <StickDeveloper mood="back_in_flow" x={50} y={160} scale={1.25} />
        </div>

        {/* Right: The Payoff Comparison & Brand Call to Action */}
        <div
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '24px',
            opacity: heroOpacity,
            transform: `scale(${heroScale})`,
          }}
        >
          {/* Side by side comparison */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              opacity: cardOpacity,
              transform: `translateY(${cardY}px)`,
            }}
          >
            {/* The Old Way */}
            <div
              style={{
                flex: 1,
                backgroundColor: '#111420',
                border: `1px solid ${COLOR_PALETTE.cardBorder}`,
                borderRadius: '14px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ color: COLOR_PALETTE.textMuted, fontSize: '12px', fontFamily: 'monospace' }}>
                WITHOUT THREADKEEPER
              </div>
              <div style={{ color: COLOR_PALETTE.staleAlert, fontSize: '24px', fontWeight: 800 }}>
                20 Minutes
              </div>
              <div style={{ color: COLOR_PALETTE.textSecondary, fontSize: '12px', lineHeight: '1.4' }}>
                Archaeology across terminal history, PR comments, stale mental assumptions, and subtle regressions.
              </div>
            </div>

            {/* With ThreadKeeper */}
            <div
              style={{
                flex: 1,
                backgroundColor: 'rgba(91, 140, 255, 0.08)',
                border: `1.5px solid ${COLOR_PALETTE.continuityThread}`,
                borderRadius: '14px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 8px 30px rgba(91, 140, 255, 0.15)',
              }}
            >
              <div style={{ color: COLOR_PALETTE.continuityThread, fontSize: '12px', fontFamily: 'monospace', fontWeight: 700 }}>
                WITH THREADKEEPER
              </div>
              <div style={{ color: COLOR_PALETTE.memorySaved, fontSize: '24px', fontWeight: 800 }}>
                15 Seconds
              </div>
              <div style={{ color: COLOR_PALETTE.textPrimary, fontSize: '12px', lineHeight: '1.4' }}>
                One spoken question. Instant delta analysis. Stale assumptions flagged. Honest evidence boundary.
              </div>
            </div>
          </div>

          {/* Hero Brand & Hackathon Call to Action */}
          <div
            style={{
              backgroundColor: COLOR_PALETTE.cardBackground,
              border: `1.5px solid ${COLOR_PALETTE.cardBorder}`,
              borderRadius: '16px',
              padding: '24px 30px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            }}
          >
            <ThreadKeeperLogoText
              size="md"
              subtitle="Never lose your train of thought."
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: `1px solid ${COLOR_PALETTE.cardBorder}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(255, 181, 71, 0.15)',
                    color: COLOR_PALETTE.inference,
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '6px',
                  }}
                >
                  AMAZON HACKATHON 2026
                </span>
                <span style={{ color: COLOR_PALETTE.textSecondary, fontSize: '12px' }}>
                  Alexa+ & AWS Bedrock AgentCore Track
                </span>
              </div>

              <div
                style={{
                  color: COLOR_PALETTE.continuityThread,
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              >
                github.com/vedheshas/threadkeeper
              </div>
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
      <ProgressTimeline currentSceneId={8} />

      {/* Audio Layer: Narration + Subtle SFX */}
      {AUDIO_CONFIG.enableNarration && (
        <Sequence from={30}>
          <Audio src={staticFile(AUDIO_CONFIG.narrationTracks.scene8)} volume={AUDIO_CONFIG.narrationVolume} />
        </Sequence>
      )}
      {AUDIO_CONFIG.enableSfx && (
        <Sequence from={20}>
          <Audio src={staticFile(AUDIO_CONFIG.sfxTracks.threadReconnect)} volume={AUDIO_CONFIG.sfxVolume} />
        </Sequence>
      )}
    </div>
  );
};
