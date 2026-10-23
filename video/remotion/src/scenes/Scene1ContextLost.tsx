import React from 'react';
import { Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { COLOR_PALETTE, SCENES } from '../data/narration';
import { AUDIO_CONFIG } from '../data/audioConfig';
import { StickDeveloper } from '../components/StickDeveloper';
import { ThoughtBubble } from '../components/ThoughtBubble';
import { ContinuityThread } from '../components/ContinuityThread';
import { SceneTitle } from '../components/SceneTitle';
import { AnimatedCaption } from '../components/AnimatedCaption';
import { ProgressTimeline } from '../components/ProgressTimeline';

export const Scene1ContextLost: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES[0];

  // Interruption occurs at frame 170
  const isInterrupted = frame >= 170;

  // Shatter progress from 0 to 1 between frame 170 and 240
  const shatterProgress = interpolate(frame, [170, 240], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Interruption alert banner fade in
  const alertOpacity = interpolate(frame, [170, 185], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Developer mood transitions
  let devMood: 'coding' | 'shocked' | 'thinking' | 'away' = 'coding';
  if (frame >= 170 && frame < 270) {
    devMood = 'shocked';
  } else if (frame >= 270 && frame < 360) {
    devMood = 'thinking';
  } else if (frame >= 360) {
    devMood = 'away';
  }

  // Developer fade out when walking away
  const devOpacity = interpolate(frame, [340, 370], [1, 0.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Kinetic caption text based on frame milestone
  let kineticText = 'Deep in flow: 3 terminal tabs, delicate mental map...';
  if (frame >= 170 && frame < 280) {
    kineticText = 'Sudden interruption: cognitive context breaks!';
  } else if (frame >= 280) {
    kineticText = '20 minutes later... train of thought is gone.';
  }

  // Continuity thread emerges as thoughts scatter
  const threadProgress = interpolate(frame, [170, 230], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const threadOpacity = interpolate(frame, [170, 190, 340, 400], [0, 0.9, 0.9, 0.3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const thoughtItems = [
    {
      id: 'currency-val',
      label: 'Multi-Currency Validation',
      subtext: 'ISO-4217 & exchange rate hooks',
      color: COLOR_PALETTE.continuityThread,
      xOffset: -80,
      yOffset: -60,
    },
    {
      id: 'payment-edge',
      label: 'src/payment.ts edge cases',
      subtext: 'zero-decimal currency handling',
      color: COLOR_PALETTE.memorySaved,
      xOffset: 120,
      yOffset: -80,
    },
    {
      id: 'uncommitted',
      label: '3 uncommitted files in Git',
      subtext: 'payment.ts, audit.ts, types.ts',
      color: COLOR_PALETTE.inference,
      xOffset: -40,
      yOffset: -140,
    },
    {
      id: 'audit-log',
      label: 'Audit Trail Schema v2',
      subtext: 'idempotency keys + HMAC',
      color: COLOR_PALETTE.unknown,
      xOffset: 140,
      yOffset: -10,
    },
  ];

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
      {/* Background Tech Grid */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(91, 140, 255, 0.05) 0%, transparent 70%), linear-gradient(rgba(31, 41, 66, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(31, 41, 66, 0.15) 1px, transparent 1px)`,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header */}
      <SceneTitle
        sceneNumber={1}
        title={scene.title}
        subtitle={scene.subtitle}
        accentColor={COLOR_PALETTE.continuityThread}
      />

      {/* Continuity Thread appears as thoughts scatter */}
      {isInterrupted && (
        <div style={{ opacity: threadOpacity }}>
          <ContinuityThread
            progress={threadProgress}
            points={[
              { x: 400, y: 350 },
              { x: 650, y: 400 },
              { x: 920, y: 320 },
              { x: 1200, y: 420 },
              { x: 1500, y: 360 },
            ]}
          />
        </div>
      )}

      {/* Center Stage: Developer & Mental Map */}
      <div
        style={{
          position: 'absolute',
          left: '48%',
          top: '52%',
          transform: 'translate(-50%, -50%)',
          width: '900px',
          height: '500px',
        }}
      >
        {/* Thought Bubble / Mental Map */}
        <ThoughtBubble
          items={thoughtItems}
          centerX={450}
          centerY={200}
          shatterProgress={shatterProgress}
          scale={1.1}
        />

        {/* Developer Stick Figure */}
        <StickDeveloper mood={devMood} x={360} y={190} scale={1.25} opacity={devOpacity} />

        {/* Interruption Notification Popup */}
        {isInterrupted && (
          <div
            style={{
              position: 'absolute',
              right: '60px',
              top: '120px',
              backgroundColor: 'rgba(255, 92, 122, 0.15)',
              border: `2px solid ${COLOR_PALETTE.staleAlert}`,
              borderRadius: '16px',
              padding: '20px 28px',
              boxShadow: '0 16px 40px rgba(255, 92, 122, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              opacity: alertOpacity,
              transform: `translateY(${interpolate(frame, [170, 185], [20, 0])}px)`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: COLOR_PALETTE.staleAlert,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '24px',
                fontWeight: 800,
              }}
            >
              !
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  color: COLOR_PALETTE.staleAlert,
                  fontSize: '16px',
                  fontWeight: 800,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: '0.4px',
                }}
              >
                UNPLANNED INTERRUPTION
              </div>
              <div
                style={{
                  color: COLOR_PALETTE.textPrimary,
                  fontSize: '13px',
                  fontFamily: 'monospace',
                }}
              >
                &ldquo;Quick question on Slack... meeting starting now!&rdquo;
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Short Kinetic Caption */}
      <AnimatedCaption
        kineticText={kineticText}
        debugText={scene.narrationText}
        accentColor={isInterrupted ? COLOR_PALETTE.staleAlert : COLOR_PALETTE.continuityThread}
      />

      {/* Progress Bar */}
      <ProgressTimeline currentSceneId={1} />

      {/* Audio Layer: Narration + Subtle SFX */}
      {AUDIO_CONFIG.enableNarration && (
        <Sequence from={20}>
          <Audio src={staticFile(AUDIO_CONFIG.narrationTracks.scene1)} volume={AUDIO_CONFIG.narrationVolume} />
        </Sequence>
      )}
      {AUDIO_CONFIG.enableSfx && (
        <Sequence from={170}>
          <Audio src={staticFile(AUDIO_CONFIG.sfxTracks.interruptionChime)} volume={AUDIO_CONFIG.sfxVolume} />
        </Sequence>
      )}
    </div>
  );
};
