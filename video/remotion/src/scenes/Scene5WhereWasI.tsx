import React from 'react';
import { Audio, Img, Sequence, Video, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { COLOR_PALETTE, SCENES } from '../data/narration';
import { AUDIO_CONFIG } from '../data/audioConfig';
import { SceneTitle } from '../components/SceneTitle';
import { AudioWave } from '../components/AudioWave';
import { ContinuityThread } from '../components/ContinuityThread';
import { AnimatedCaption } from '../components/AnimatedCaption';
import { ProgressTimeline } from '../components/ProgressTimeline';
import { DEMO_CONFIG } from '../assets/demoAssets';

export const Scene5WhereWasI: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES[4];

  // Voice utterance timing (frames 20 to 95)
  const isAsking = frame >= 25 && frame < 90;
  const askOpacity = interpolate(frame, [18, 30, 90, 105], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Reconnecting continuity thread animation
  const threadProgress = interpolate(frame, [50, 180], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // UNIFIED 3-STAGE TRANSITION:
  // 1. Real Light Motion Clip: frames 0 -> 122 (crossfades out 114 -> 122)
  const videoOpacity = interpolate(frame, [114, 122], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 2. Result Screenshot (resume-light.png): frames 114 -> 488 (crossfades in 114->122, out 480->488)
  const still1Opacity = interpolate(frame, [114, 122, 480, 488], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Gentle motion on screenshot 1: 1.5% scale and slight pan
  const still1Scale = interpolate(frame, [122, 480], [1.0, 1.025], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const still1TranslateY = interpolate(frame, [122, 480], [0, -16], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 3. Evidence Screenshot (what-changed-light.png): frames 480 -> 750 (crossfades in 480->488)
  const still2Opacity = interpolate(frame, [480, 488], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Gentle motion on screenshot 2: 1.8% scale and slight pan
  const still2Scale = interpolate(frame, [488, 750], [1.0, 1.02], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const still2TranslateY = interpolate(frame, [488, 750], [0, -12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Short Kinetic Caption
  let kineticText = '"Alexa, where was I?"';
  if (frame >= 120 && frame < 320) {
    kineticText = 'Reconstructing context • payment.ts modified';
  } else if (frame >= 320 && frame < 480) {
    kineticText = 'Old assumption → Marked Needs Review';
  } else if (frame >= 480) {
    kineticText = 'Continuity Diff • Grounded Next Action';
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: COLOR_PALETTE.background,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header */}
      <div style={{ position: 'absolute', top: '40px', left: '60px', zIndex: 30 }}>
        <SceneTitle
          sceneNumber={5}
          title={scene.title}
          subtitle="Fresh process starts • Intent & reasoning restored"
          accentColor={COLOR_PALETTE.continuityThread}
        />
      </div>

      {/* Continuity Thread Reconnecting across background */}
      <ContinuityThread
        progress={threadProgress}
        color={COLOR_PALETTE.continuityThread}
        points={[
          { x: 1820, y: 380 },
          { x: 1400, y: 260 },
          { x: 960, y: 420 },
          { x: 500, y: 320 },
          { x: 100, y: 440 },
        ]}
      />

      {/* Ambient Voice Utterance Floating Pill (Top-Right of Scene) */}
      <div
        style={{
          position: 'absolute',
          top: '40px',
          right: '60px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          border: `1.5px solid ${COLOR_PALETTE.continuityThread}`,
          borderRadius: '24px',
          padding: '10px 20px',
          boxShadow: '0 8px 30px rgba(91, 140, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          opacity: askOpacity,
          backdropFilter: 'blur(10px)',
          zIndex: 35,
        }}
      >
        <span style={{ fontSize: '18px' }}>🎙️</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              fontWeight: 800,
              color: COLOR_PALETTE.continuityThread,
              letterSpacing: '0.8px',
            }}
          >
            ALEXA+ RESUME INTENT
          </span>
          <span
            style={{
              color: COLOR_PALETTE.textPrimary,
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            &ldquo;Alexa, where was I?&rdquo;
          </span>
        </div>
        <AudioWave active={isAsking} barCount={12} height={20} />
      </div>

      {/* ========================================================= */}
      {/* UNIFIED CONTAINER: Video -> Result Still -> Evidence Still */}
      {/* All occupy the EXACT SAME position, size & radius          */}
      {/* ========================================================= */}
      <div
        style={{
          position: 'absolute',
          top: '110px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1560px',
          height: '825px',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#F7F9FC',
          border: `1.5px solid ${COLOR_PALETTE.continuityThread}`,
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.7), 0 0 40px rgba(91, 140, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 20,
        }}
      >
        {/* macOS Style Window Title Bar */}
        <div
          style={{
            height: '36px',
            backgroundColor: '#EDF2F7',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '8px',
            flexShrink: 0,
            zIndex: 25,
          }}
        >
          <div style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#FF5F56' }} />
          <div style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
          <div style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#27C93F' }} />
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#64748B',
              fontWeight: 600,
            }}
          >
            ThreadKeeper — Visual Continuity Console • Context Reconstructed
          </div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: COLOR_PALETTE.continuityThread,
              backgroundColor: 'rgba(91, 140, 255, 0.12)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(91, 140, 255, 0.25)',
            }}
          >
            AWS BEDROCK + AGENTCORE
          </div>
        </div>

        {/* Window Stage: Matched Crossfades */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'calc(100% - 36px)',
            overflow: 'hidden',
          }}
        >
          {/* Layer 1: Real Light-Theme Motion Clip (0 -> 4 sec) */}
          {videoOpacity > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: videoOpacity,
                zIndex: 21,
              }}
            >
              <Video
                src={staticFile(DEMO_CONFIG.resumeDemoPath)}
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 38%',
                }}
              />
            </div>
          )}

          {/* Layer 2: Result Screenshot (resume-light.png) */}
          {still1Opacity > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: still1Opacity,
                transform: `translateY(${still1TranslateY}px) scale(${still1Scale})`,
                transformOrigin: 'center 35%',
                zIndex: 22,
              }}
            >
              <Img
                src={staticFile('demo/stills/resume-light.png')}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 32%',
                }}
              />
            </div>
          )}

          {/* Layer 3: Evidence Screenshot (what-changed-light.png) */}
          {still2Opacity > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: still2Opacity,
                transform: `translateY(${still2TranslateY}px) scale(${still2Scale})`,
                transformOrigin: 'center 35%',
                zIndex: 23,
              }}
            >
              <Img
                src={staticFile('demo/stills/what-changed-light.png')}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 30%',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Short Kinetic Caption */}
      <AnimatedCaption
        kineticText={kineticText}
        debugText={scene.narrationText}
        accentColor={COLOR_PALETTE.continuityThread}
      />

      {/* Progress Bar */}
      <ProgressTimeline currentSceneId={5} />

      {/* Audio Layer: Narration + Subtle SFX */}
      {AUDIO_CONFIG.enableNarration && (
        <Sequence from={15}>
          <Audio src={staticFile(AUDIO_CONFIG.narrationTracks.scene5)} volume={AUDIO_CONFIG.narrationVolume} />
        </Sequence>
      )}
      {AUDIO_CONFIG.enableSfx && (
        <>
          <Sequence from={25}>
            <Audio src={staticFile(AUDIO_CONFIG.sfxTracks.listeningPulse)} volume={AUDIO_CONFIG.sfxVolume} />
          </Sequence>
          <Sequence from={120}>
            <Audio src={staticFile(AUDIO_CONFIG.sfxTracks.threadReconnect)} volume={AUDIO_CONFIG.sfxVolume} />
          </Sequence>
        </>
      )}
    </div>
  );
};
