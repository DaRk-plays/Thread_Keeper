import React from 'react';
import { Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { COLOR_PALETTE, SCENES } from '../data/narration';
import { AUDIO_CONFIG } from '../data/audioConfig';
import { SceneTitle } from '../components/SceneTitle';
import { StickDeveloper } from '../components/StickDeveloper';
import { CodeDiffCard } from '../components/CodeDiffCard';
import { ContinuityThread } from '../components/ContinuityThread';
import { AnimatedCaption } from '../components/AnimatedCaption';
import { ProgressTimeline } from '../components/ProgressTimeline';

export const Scene4Interruption: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES[3];

  // Clock rotation
  const clockAngle = (frame * 6) % 360;

  // Code diff slide-in
  const diffOpacity = interpolate(frame, [40, 75], [0, 1], { extrapolateRight: 'clamp' });
  const diffY = interpolate(frame, [40, 75], [30, 0], { extrapolateRight: 'clamp' });

  // Warning alert pulse
  const alertOpacity = interpolate(frame, [110, 140], [0, 1], { extrapolateRight: 'clamp' });

  // Kinetic caption based on frame
  let kineticText = 'Developer away • Continuity thread paused in standby';
  if (frame >= 180) {
    kineticText = 'src/payment.ts changes while away • Working tree dirty';
  }

  const paymentDiff = [
    { type: 'same' as const, oldLine: 12, newLine: 12, content: 'export async function processPayment(order: Order) {' },
    { type: 'del' as const, oldLine: 13, content: '-   // TODO: validate currency whitelist here' },
    { type: 'del' as const, oldLine: 14, content: '-   const rate = await fetchExchangeRate(order.currency);' },
    { type: 'add' as const, newLine: 13, content: '+   if (!ALLOWED_CURRENCIES.has(order.currency)) {' },
    { type: 'add' as const, newLine: 14, content: '+     throw new UnsupportedCurrencyError(order.currency);' },
    { type: 'add' as const, newLine: 15, content: '+   }' },
    { type: 'same' as const, oldLine: 15, newLine: 16, content: '    return executeGatewayCharge(order);' },
  ];

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
        sceneNumber={4}
        title={scene.title}
        subtitle="src/payment.ts changes while the developer is away"
        accentColor={COLOR_PALETTE.inference}
      />

      {/* Continuity Thread Paused in Standby across scene */}
      <div style={{ opacity: 0.45 }}>
        <ContinuityThread
          pulse={false}
          points={[
            { x: 120, y: 520 },
            { x: 420, y: 480 },
            { x: 800, y: 520 },
            { x: 1200, y: 490 },
            { x: 1750, y: 520 },
          ]}
        />
      </div>

      {/* Main Content Area */}
      <div
        style={{
          display: 'flex',
          gap: '50px',
          marginTop: '30px',
          height: '580px',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        {/* Left: Empty Desk & Ticking Clock */}
        <div
          style={{
            width: '440px',
            height: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Ambient Ticking Clock Card */}
          <div
            style={{
              position: 'absolute',
              top: '50px',
              backgroundColor: COLOR_PALETTE.cardBackground,
              border: `1.5px solid ${COLOR_PALETTE.cardBorder}`,
              borderRadius: '16px',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
            }}
          >
            {/* Minimal SVG Clock */}
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" stroke={COLOR_PALETTE.inference} strokeWidth="2.5" fill="#0C101B" />
              {/* Hour hand */}
              <line x1="20" y1="20" x2="20" y2="10" stroke={COLOR_PALETTE.textPrimary} strokeWidth="2.5" strokeLinecap="round" />
              {/* Minute hand spinning */}
              <line
                x1="20"
                y1="20"
                x2="20"
                y2="7"
                stroke={COLOR_PALETTE.inference}
                strokeWidth="2"
                strokeLinecap="round"
                transform={`rotate(${clockAngle} 20 20)`}
              />
            </svg>

            <div>
              <div style={{ color: COLOR_PALETTE.textPrimary, fontSize: '15px', fontWeight: 700 }}>
                Time Passes While Away...
              </div>
              <div style={{ color: COLOR_PALETTE.textSecondary, fontSize: '12px', fontFamily: 'monospace' }}>
                Dirty working tree • changed hash
              </div>
            </div>
          </div>

          {/* Empty desk (developer away) */}
          <StickDeveloper mood="away" x={60} y={160} scale={1.15} opacity={0.25} />
        </div>

        {/* Right: Git Repository Drift & Code Diff */}
        <div
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '20px',
            opacity: diffOpacity,
            transform: `translateY(${diffY}px)`,
          }}
        >
          <CodeDiffCard
            filename="src/payment.ts"
            diffLines={paymentDiff}
            badge="CHANGED WHILE AWAY (DIRTY TREE)"
          />

          {/* Critical Staleness Insight Card */}
          <div
            style={{
              backgroundColor: 'rgba(255, 181, 71, 0.1)',
              border: `1.5px solid ${COLOR_PALETTE.inference}`,
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              opacity: alertOpacity,
            }}
          >
            <div style={{ fontSize: '24px' }}>⚠️</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ color: COLOR_PALETTE.inference, fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>
                ARTIFACT MODIFIED: STALE ASSUMPTION RISK
              </div>
              <div style={{ color: COLOR_PALETTE.textPrimary, fontSize: '13px', lineHeight: '1.4' }}>
                Your cognitive checkpoint assumed <em>&ldquo;payment.ts has no whitelist&rdquo;</em>.
                Because the underlying file changed while away, that assumption requires re-evaluation.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Short Kinetic Caption */}
      <AnimatedCaption
        kineticText={kineticText}
        debugText={scene.narrationText}
        accentColor={COLOR_PALETTE.inference}
      />

      {/* Progress Bar */}
      <ProgressTimeline currentSceneId={4} />

      {/* Audio Layer: Narration + Subtle SFX */}
      {AUDIO_CONFIG.enableNarration && (
        <Sequence from={20}>
          <Audio src={staticFile(AUDIO_CONFIG.narrationTracks.scene4)} volume={AUDIO_CONFIG.narrationVolume} />
        </Sequence>
      )}
      {AUDIO_CONFIG.enableSfx && (
        <Sequence from={115}>
          <Audio src={staticFile(AUDIO_CONFIG.sfxTracks.interruptionChime)} volume={AUDIO_CONFIG.sfxVolume} />
        </Sequence>
      )}
    </div>
  );
};
