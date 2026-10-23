import React from 'react';
import { Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { COLOR_PALETTE, SCENES } from '../data/narration';
import { AUDIO_CONFIG } from '../data/audioConfig';
import { SceneTitle } from '../components/SceneTitle';
import { ProgressTimeline } from '../components/ProgressTimeline';

export const Scene7UnderTheHood: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES[6];

  // Progressive entrance animations (clean, deliberate pacing)
  // 1. Alexa-style UI: frame 0 -> 25
  const opNode1 = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' });
  const scaleNode1 = interpolate(frame, [0, 25], [0.96, 1], { extrapolateRight: 'clamp' });

  // 2. Connector 1 & MCP Server: frame 25 -> 50
  const opConn1 = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: 'clamp' });
  const opNode2 = interpolate(frame, [30, 55], [0, 1], { extrapolateRight: 'clamp' });
  const scaleNode2 = interpolate(frame, [30, 55], [0.96, 1], { extrapolateRight: 'clamp' });

  // 3. Connector 2 & Continuity Engine: frame 55 -> 80
  const opConn2 = interpolate(frame, [55, 75], [0, 1], { extrapolateRight: 'clamp' });
  const opNode3 = interpolate(frame, [60, 85], [0, 1], { extrapolateRight: 'clamp' });
  const scaleNode3 = interpolate(frame, [60, 85], [0.96, 1], { extrapolateRight: 'clamp' });

  // 4. Fan-out bus & Three lower providers: frame 85 -> 115
  const opConn3 = interpolate(frame, [85, 110], [0, 1], { extrapolateRight: 'clamp' });
  const opLower = interpolate(frame, [95, 120], [0, 1], { extrapolateRight: 'clamp' });

  // 5. Test badge (87 / 87): frame 120 -> 150
  const opBadge = interpolate(frame, [120, 150], [0, 1], { extrapolateRight: 'clamp' });
  const scaleBadge = interpolate(frame, [120, 150], [0.95, 1], { extrapolateRight: 'clamp' });

  // 6. Footer: frame 150 -> 180
  const opFooter = interpolate(frame, [150, 180], [0, 1], { extrapolateRight: 'clamp' });

  // Subtle animated data pulse along connectors
  const t = (frame % 60) / 60;
  const pY1 = interpolate(t, [0, 1], [280, 310]);
  const pY2 = interpolate(t, [0, 1], [420, 450]);
  const pGitX = interpolate(t, [0, 1], [960, 415]);
  const pNovaX = interpolate(t, [0, 1], [960, 1505]);

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
      {/* ========================================================= */}
      {/* TITLE REGION: Explicitly bound to x=70–750, y=55–155      */}
      {/* ========================================================= */}
      <div
        style={{
          position: 'absolute',
          left: '70px',
          top: '55px',
          maxWidth: '680px',
          zIndex: 10,
        }}
      >
        <SceneTitle
          sceneNumber={7}
          title="Under The Hood"
          subtitle="Amazon Bedrock + AgentCore Memory + MCP Protocol"
          accentColor={COLOR_PALETTE.memorySaved}
        />
      </div>

      {/* ========================================================= */}
      {/* SVG CONNECTORS: Rendered strictly BEHIND cards at zIndex 1 */}
      {/* ========================================================= */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1920px',
          height: '1080px',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <defs>
          <marker
            id="archArrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill={COLOR_PALETTE.continuityThread} />
          </marker>
          <marker
            id="archArrowMint"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill={COLOR_PALETTE.memorySaved} />
          </marker>
          <marker
            id="archArrowAmber"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill={COLOR_PALETTE.inference} />
          </marker>
        </defs>

        {/* 1. Alexa UI (bottom=280) -> MCP Server (top=315) */}
        <g style={{ opacity: opConn1 }}>
          <line
            x1="960"
            y1="280"
            x2="960"
            y2="310"
            stroke={COLOR_PALETTE.continuityThread}
            strokeWidth="2.5"
            markerEnd="url(#archArrow)"
          />
          <circle cx="960" cy={pY1} r="3.5" fill="#FFFFFF" />
        </g>

        {/* 2. MCP Server (bottom=420) -> Continuity Engine (top=455) */}
        <g style={{ opacity: opConn2 }}>
          <line
            x1="960"
            y1="420"
            x2="960"
            y2="450"
            stroke={COLOR_PALETTE.continuityThread}
            strokeWidth="2.5"
            markerEnd="url(#archArrow)"
          />
          <circle cx="960" cy={pY2} r="3.5" fill="#FFFFFF" />
        </g>

        {/* 3. Continuity Engine (bottom=570) -> Fan-out Bus (y=630) -> Lower Providers (top=690) */}
        <g style={{ opacity: opConn3 }}>
          {/* Vertical Stem */}
          <line
            x1="960"
            y1="570"
            x2="960"
            y2="630"
            stroke={COLOR_PALETTE.continuityThread}
            strokeWidth="2.5"
          />

          {/* Horizontal Bus Line */}
          <line
            x1="415"
            y1="630"
            x2="1505"
            y2="630"
            stroke={COLOR_PALETTE.continuityThread}
            strokeWidth="2"
          />

          {/* Left Drop -> Git Workspace (top=690) */}
          <line
            x1="415"
            y1="630"
            x2="415"
            y2="685"
            stroke={COLOR_PALETTE.continuityThread}
            strokeWidth="2"
            markerEnd="url(#archArrow)"
          />

          {/* Center Drop -> AgentCore Memory (top=690) */}
          <line
            x1="960"
            y1="630"
            x2="960"
            y2="685"
            stroke={COLOR_PALETTE.memorySaved}
            strokeWidth="2.5"
            markerEnd="url(#archArrowMint)"
          />

          {/* Right Drop -> Amazon Nova Lite (top=690) */}
          <line
            x1="1505"
            y1="630"
            x2="1505"
            y2="685"
            stroke={COLOR_PALETTE.inference}
            strokeWidth="2"
            markerEnd="url(#archArrowAmber)"
          />

          {/* Animated Packet Pulses */}
          <circle cx={pGitX} cy="630" r="3.5" fill="#FFFFFF" />
          <circle cx="960" cy={interpolate(t, [0, 1], [570, 685])} r="4" fill={COLOR_PALETTE.memorySaved} />
          <circle cx={pNovaX} cy="630" r="3.5" fill={COLOR_PALETTE.inference} />
        </g>
      </svg>

      {/* ========================================================= */}
      {/* NODE 1: Alexa-Style Conversational UI                     */}
      {/* Target: x: 610, y: 175, width: 700, height: 105          */}
      {/* ========================================================= */}
      <div
        style={{
          position: 'absolute',
          left: '610px',
          top: '175px',
          width: '700px',
          height: '105px',
          boxSizing: 'border-box',
          transform: `scale(${scaleNode1})`,
          transformOrigin: 'center center',
          opacity: opNode1,
          backgroundColor: COLOR_PALETTE.cardBackground,
          border: `1.5px solid ${COLOR_PALETTE.continuityThread}`,
          borderRadius: '14px',
          padding: '16px 24px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(91, 140, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '6px',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '22px' }}>🎙️</span>
            <span style={{ color: COLOR_PALETTE.textPrimary, fontSize: '18px', fontWeight: 700 }}>
              Alexa-Style Conversational UI
            </span>
          </div>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(91, 140, 255, 0.15)',
              color: COLOR_PALETTE.continuityThread,
              border: '1px solid rgba(91, 140, 255, 0.3)',
            }}
          >
            INTERFACE
          </span>
        </div>
        <div style={{ color: COLOR_PALETTE.textSecondary, fontSize: '13px', lineHeight: 1.3 }}>
          Ambient voice interaction &bull; Intent dispatch + visual console
        </div>
      </div>

      {/* ========================================================= */}
      {/* NODE 2: Self-hosted MCP Server                            */}
      {/* Target: x: 610, y: 315, width: 700, height: 105          */}
      {/* ========================================================= */}
      <div
        style={{
          position: 'absolute',
          left: '610px',
          top: '315px',
          width: '700px',
          height: '105px',
          boxSizing: 'border-box',
          transform: `scale(${scaleNode2})`,
          transformOrigin: 'center center',
          opacity: opNode2,
          backgroundColor: COLOR_PALETTE.cardBackground,
          border: `1.5px solid ${COLOR_PALETTE.continuityThread}`,
          borderRadius: '14px',
          padding: '16px 24px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(91, 140, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '6px',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '22px' }}>⚡</span>
            <span style={{ color: COLOR_PALETTE.textPrimary, fontSize: '18px', fontWeight: 700 }}>
              Self-hosted MCP Server
            </span>
          </div>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(91, 140, 255, 0.15)',
              color: COLOR_PALETTE.continuityThread,
              border: '1px solid rgba(91, 140, 255, 0.3)',
            }}
          >
            PROTOCOL
          </span>
        </div>
        <div style={{ color: COLOR_PALETTE.textSecondary, fontSize: '13px', lineHeight: 1.3 }}>
          Streamable HTTP &bull; 6 verified tools
        </div>
      </div>

      {/* ========================================================= */}
      {/* NODE 3: ThreadKeeper Continuity Engine                   */}
      {/* Target: x: 560, y: 455, width: 800, height: 115          */}
      {/* ========================================================= */}
      <div
        style={{
          position: 'absolute',
          left: '560px',
          top: '455px',
          width: '800px',
          height: '115px',
          boxSizing: 'border-box',
          transform: `scale(${scaleNode3})`,
          transformOrigin: 'center center',
          opacity: opNode3,
          backgroundColor: COLOR_PALETTE.cardBackground,
          border: `1.5px solid ${COLOR_PALETTE.continuityThread}`,
          borderRadius: '14px',
          padding: '18px 26px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(91, 140, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '6px',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🧠</span>
            <span style={{ color: COLOR_PALETTE.textPrimary, fontSize: '19px', fontWeight: 700 }}>
              ThreadKeeper Continuity Engine
            </span>
          </div>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(91, 140, 255, 0.15)',
              color: COLOR_PALETTE.continuityThread,
              border: '1px solid rgba(91, 140, 255, 0.3)',
            }}
          >
            CORE ENGINE
          </span>
        </div>
        <div style={{ color: COLOR_PALETTE.textSecondary, fontSize: '14px', lineHeight: 1.3 }}>
          Capture &bull; Continuity Diff &bull; Staleness Detection
        </div>
      </div>

      {/* ========================================================= */}
      {/* LOWER PROVIDER ROW: Top y = 690, height: 140px (ends 830)  */}
      {/* Git: x=180, AgentCore: x=725, Nova: x=1270 (widths=470)   */}
      {/* ========================================================= */}
      {/* Lower Card 1: Git Workspace */}
      <div
        style={{
          position: 'absolute',
          left: '180px',
          top: '690px',
          width: '470px',
          height: '140px',
          boxSizing: 'border-box',
          opacity: opLower,
          backgroundColor: COLOR_PALETTE.cardBackground,
          border: '1.5px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '14px',
          padding: '14px 20px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '5px',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>📂</span>
            <span style={{ color: COLOR_PALETTE.textPrimary, fontSize: '16px', fontWeight: 700 }}>
              Git Workspace
            </span>
          </div>
          <span
            style={{
              fontSize: '9px',
              fontFamily: 'monospace',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
            }}
          >
            SOURCE OF TRUTH
          </span>
        </div>
        <div style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px' }}>
          AUTHORITATIVE TRUTH
        </div>
        <div style={{ color: COLOR_PALETTE.textMuted, fontSize: '11px', lineHeight: 1.3 }}>
          HEAD commit, branch status, untracked modifications &amp; diff-stat
        </div>
      </div>

      {/* Lower Card 2: AgentCore Memory */}
      <div
        style={{
          position: 'absolute',
          left: '725px',
          top: '690px',
          width: '470px',
          height: '140px',
          boxSizing: 'border-box',
          opacity: opLower,
          backgroundColor: COLOR_PALETTE.cardBackground,
          border: `1.5px solid ${COLOR_PALETTE.memorySaved}`,
          borderRadius: '14px',
          padding: '14px 20px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(64, 224, 181, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '5px',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>💾</span>
            <span style={{ color: COLOR_PALETTE.textPrimary, fontSize: '16px', fontWeight: 700 }}>
              AgentCore Memory
            </span>
          </div>
          <span
            style={{
              fontSize: '9px',
              fontFamily: 'monospace',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '6px',
              backgroundColor: 'rgba(64, 224, 181, 0.15)',
              color: COLOR_PALETTE.memorySaved,
              border: '1px solid rgba(64, 224, 181, 0.3)',
            }}
          >
            AWS BEDROCK
          </span>
        </div>
        <div style={{ color: COLOR_PALETTE.memorySaved, fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px' }}>
          PERSISTENT MEMORY
        </div>
        <div style={{ color: COLOR_PALETTE.textMuted, fontSize: '11px', lineHeight: 1.3 }}>
          Durable cloud context that survives process death &amp; terminal exit
        </div>
      </div>

      {/* Lower Card 3: Amazon Nova Lite */}
      <div
        style={{
          position: 'absolute',
          left: '1270px',
          top: '690px',
          width: '470px',
          height: '140px',
          boxSizing: 'border-box',
          opacity: opLower,
          backgroundColor: COLOR_PALETTE.cardBackground,
          border: `1.5px solid ${COLOR_PALETTE.inference}`,
          borderRadius: '14px',
          padding: '14px 20px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(239, 180, 93, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '5px',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>✨</span>
            <span style={{ color: COLOR_PALETTE.textPrimary, fontSize: '16px', fontWeight: 700 }}>
              Amazon Nova Lite
            </span>
          </div>
          <span
            style={{
              fontSize: '9px',
              fontFamily: 'monospace',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 180, 93, 0.15)',
              color: COLOR_PALETTE.inference,
              border: '1px solid rgba(239, 180, 93, 0.3)',
            }}
          >
            MODEL REASONING
          </span>
        </div>
        <div style={{ color: COLOR_PALETTE.inference, fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px' }}>
          GROUNDED INTERPRETATION
        </div>
        <div style={{ color: COLOR_PALETTE.textMuted, fontSize: '11px', lineHeight: 1.3 }}>
          Structured Converse API semantic impact without overruling facts
        </div>
      </div>

      {/* ========================================================= */}
      {/* TEST BADGE: Target y approx 885, centered                 */}
      {/* ========================================================= */}
      <div
        style={{
          position: 'absolute',
          top: '885px',
          left: '50%',
          transform: `translateX(-50%) scale(${scaleBadge})`,
          opacity: opBadge,
          backgroundColor: 'rgba(64, 224, 181, 0.1)',
          border: `1.5px solid ${COLOR_PALETTE.memorySaved}`,
          borderRadius: '12px',
          padding: '10px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(64, 224, 181, 0.2)',
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: '18px' }}>🛡️</span>
        <span
          style={{
            color: COLOR_PALETTE.memorySaved,
            fontSize: '15px',
            fontWeight: 800,
            fontFamily: 'monospace',
            letterSpacing: '0.8px',
          }}
        >
          87 / 87 AUTOMATED TESTS PASSING
        </span>
        <span style={{ color: COLOR_PALETTE.textMuted }}>•</span>
        <span style={{ color: COLOR_PALETTE.textSecondary, fontSize: '12px' }}>
          Zero-mock cloud validation + Deterministic fixture fallback
        </span>
      </div>

      {/* ========================================================= */}
      {/* FOOTER: Target y approx 965, centered                     */}
      {/* ========================================================= */}
      <div
        style={{
          position: 'absolute',
          top: '965px',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: opFooter,
          color: COLOR_PALETTE.textMuted,
          fontSize: '13px',
          letterSpacing: '0.8px',
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          zIndex: 10,
        }}
      >
        Production AWS + MCP Streamable HTTP architecture
      </div>

      {/* Progress Bar at bottom */}
      <ProgressTimeline currentSceneId={7} />

      {/* Audio Layer: Narration starts at frame 6 (0.20s) */}
      {AUDIO_CONFIG.enableNarration && (
        <Sequence from={6}>
          <Audio src={staticFile(AUDIO_CONFIG.narrationTracks.scene7)} volume={AUDIO_CONFIG.narrationVolume} />
        </Sequence>
      )}
    </div>
  );
};
