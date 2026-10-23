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

export const Scene3ParkThis: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES[2];

  // Voice utterance indicator (frames 20 to 95)
  const isSpeaking = frame >= 25 && frame < 90;
  const speechBadgeOpacity = interpolate(frame, [18, 30, 90, 105], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // UNIFIED LIGHT TRANSITION: 8-frame crossfade from real-motion video into hero screenshot
  // Video is active frames 0 -> 122; Screenshot active frames 114 -> end
  const videoOpacity = interpolate(frame, [114, 122], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const screenshotOpacity = interpolate(frame, [114, 122], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle, elegant camera push on the success screenshot (only 3.5% scale)
  const screenshotScale = interpolate(frame, [122, 660], [1.0, 1.035], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const screenshotTranslateY = interpolate(frame, [122, 660], [0, -10], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Continuity thread traveling into AgentCore Memory
  const threadProgress = interpolate(frame, [70, 220], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Short Kinetic Caption
  let kineticText = '"Alexa, park this."';
  if (frame >= 120 && frame < 360) {
    kineticText = 'Git state inspected • Checkpoint captured';
  } else if (frame >= 360) {
    kineticText = 'Persisted in AWS Bedrock AgentCore Memory';
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
          sceneNumber={3}
          title={scene.title}
          subtitle="One phrase parks your train of thought"
          accentColor={COLOR_PALETTE.continuityThread}
        />
      </div>

      {/* Continuity Thread traveling across behind window */}
      <ContinuityThread
        progress={threadProgress}
        color={COLOR_PALETTE.continuityThread}
        points={[
          { x: 100, y: 380 },
          { x: 450, y: 260 },
          { x: 960, y: 400 },
          { x: 1450, y: 300 },
          { x: 1820, y: 460 },
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
          opacity: speechBadgeOpacity,
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
            ALEXA+ AMBIENT VOICE
          </span>
          <span
            style={{
              color: COLOR_PALETTE.textPrimary,
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            &ldquo;Alexa, park this.&rdquo;
          </span>
        </div>
        <AudioWave active={isSpeaking} barCount={12} height={20} />
      </div>

      {/* ========================================================= */}
      {/* UNIFIED CONTAINER: Video motion -> Success Screenshot     */}
      {/* Both occupy the EXACT SAME position, size & radius        */}
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
          border: `1.5px solid ${COLOR_PALETTE.memorySaved}`,
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.7), 0 0 40px rgba(64, 224, 181, 0.15)',
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
            ThreadKeeper — Visual Continuity Console • Checkpoint Persisted
          </div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: COLOR_PALETTE.memorySaved,
              backgroundColor: 'rgba(64, 224, 181, 0.12)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(64, 224, 181, 0.25)',
            }}
          >
            AGENTCORE MEMORY
          </div>
        </div>

        {/* Window Stage: Matched Crossfade between Video & Screenshot */}
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
                src={staticFile(DEMO_CONFIG.parkDemoPath)}
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

          {/* Layer 2: Real Light-Theme Hero Screenshot (Intelligently Focused on Checkpoint Card) */}
          {screenshotOpacity > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: screenshotOpacity,
                transform: `translateY(${screenshotTranslateY}px) scale(${screenshotScale})`,
                transformOrigin: 'center 35%',
                zIndex: 22,
              }}
            >
              <Img
                src={staticFile('demo/stills/park-success-light.png')}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 32%',
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
      <ProgressTimeline currentSceneId={3} />

      {/* Audio Layer: Narration + Subtle SFX */}
      {AUDIO_CONFIG.enableNarration && (
        <Sequence from={15}>
          <Audio src={staticFile(AUDIO_CONFIG.narrationTracks.scene3)} volume={AUDIO_CONFIG.narrationVolume} />
        </Sequence>
      )}
      {AUDIO_CONFIG.enableSfx && (
        <>
          <Sequence from={25}>
            <Audio src={staticFile(AUDIO_CONFIG.sfxTracks.listeningPulse)} volume={AUDIO_CONFIG.sfxVolume} />
          </Sequence>
          <Sequence from={120}>
            <Audio src={staticFile(AUDIO_CONFIG.sfxTracks.memorySaved)} volume={AUDIO_CONFIG.sfxVolume} />
          </Sequence>
        </>
      )}
    </div>
  );
};
