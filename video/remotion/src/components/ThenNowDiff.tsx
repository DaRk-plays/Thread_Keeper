import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLOR_PALETTE } from '../data/narration';
import { EpistemicBadge } from './EpistemicBadge';

interface ThenNowDiffProps {
  revealProgress?: number; // 0 to 1
  width?: number | string;
}

export const ThenNowDiff: React.FC<ThenNowDiffProps> = ({
  revealProgress = 1,
  width = '100%',
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width,
        display: 'flex',
        alignItems: 'stretch',
        gap: '24px',
        position: 'relative',
      }}
    >
      {/* LEFT: THEN (Checkpoint at T0) */}
      <div
        style={{
          flex: 1,
          backgroundColor: COLOR_PALETTE.cardBackground,
          border: `1.5px solid ${COLOR_PALETTE.cardBorder}`,
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                backgroundColor: 'rgba(91, 140, 255, 0.15)',
                color: COLOR_PALETTE.continuityThread,
                padding: '4px 10px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              THEN (Checkpoint T0)
            </span>
            <span style={{ color: COLOR_PALETTE.textMuted, fontSize: '12px', fontFamily: 'monospace' }}>
              commit: 3f8a9e2
            </span>
          </div>
          <EpistemicBadge tier="OBSERVED" size="sm" label="EVIDENCE ANCHOR" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: COLOR_PALETTE.textMuted, fontSize: '12px', fontFamily: 'monospace' }}>
            GOAL
          </div>
          <div style={{ color: COLOR_PALETTE.textPrimary, fontSize: '14px', fontWeight: 600 }}>
            Implement strict multi-currency validation & audit trail
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#090D18',
            borderRadius: '10px',
            padding: '14px',
            border: `1px solid ${COLOR_PALETTE.cardBorder}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: COLOR_PALETTE.textSecondary, fontSize: '11px', fontFamily: 'monospace' }}>
              ASSUMPTION (ev-art-src-payment-ts)
            </span>
            <span
              style={{
                color: COLOR_PALETTE.memorySaved,
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 600,
              }}
            >
              ● VALID AT T0
            </span>
          </div>
          <div style={{ color: COLOR_PALETTE.textPrimary, fontSize: '13px', lineHeight: '1.4' }}>
            &ldquo;src/payment.ts accepts currencies without whitelist validation&rdquo;
          </div>
        </div>
      </div>

      {/* CENTER: CONTINUITY BRIDGE */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '60px',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '2px',
            height: '100%',
            backgroundColor: COLOR_PALETTE.cardBorder,
            position: 'absolute',
          }}
        />
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: COLOR_PALETTE.cardBackground,
            border: `2px solid ${COLOR_PALETTE.continuityThread}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLOR_PALETTE.continuityThread,
            fontSize: '16px',
            zIndex: 2,
            boxShadow: `0 0 16px ${COLOR_PALETTE.continuityThread}66`,
          }}
        >
          Δ
        </div>
        <div
          style={{
            marginTop: '8px',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: COLOR_PALETTE.textMuted,
            zIndex: 2,
            backgroundColor: COLOR_PALETTE.background,
            padding: '2px 4px',
            borderRadius: '4px',
          }}
        >
          DIFF
        </div>
      </div>

      {/* RIGHT: NOW (Live Resume at T1) */}
      <div
        style={{
          flex: 1,
          backgroundColor: COLOR_PALETTE.cardBackground,
          border: `1.5px solid ${COLOR_PALETTE.staleAlert}88`,
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 20px ${COLOR_PALETTE.staleAlert}22`,
          opacity: revealProgress,
          transform: `translateX(${(1 - revealProgress) * 20}px)`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                backgroundColor: 'rgba(255, 92, 122, 0.15)',
                color: COLOR_PALETTE.staleAlert,
                padding: '4px 10px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              NOW (Resumed T1)
            </span>
            <span style={{ color: COLOR_PALETTE.textMuted, fontSize: '12px', fontFamily: 'monospace' }}>
              working copy changed
            </span>
          </div>
          <EpistemicBadge tier="STALE" size="sm" label="NEEDS REVIEW" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: COLOR_PALETTE.textMuted, fontSize: '12px', fontFamily: 'monospace' }}>
            OBSERVED DELTA
          </div>
          <div style={{ color: COLOR_PALETTE.textPrimary, fontSize: '14px', fontWeight: 600 }}>
            src/payment.ts was modified while away
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#160F17',
            borderRadius: '10px',
            padding: '14px',
            border: `1px solid rgba(255, 92, 122, 0.4)`,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: COLOR_PALETTE.staleAlert, fontSize: '11px', fontFamily: 'monospace' }}>
              ASSUMPTION STATUS: STALE
            </span>
            <span
              style={{
                color: COLOR_PALETTE.staleAlert,
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 700,
              }}
            >
              ⚠ RE-EVALUATION REQUIRED
            </span>
          </div>
          <div style={{ color: COLOR_PALETTE.textPrimary, fontSize: '13px', lineHeight: '1.4' }}>
            &ldquo;Underlying file changed. Re-verify whitelist validation before resuming implementation.&rdquo;
          </div>
        </div>
      </div>
    </div>
  );
};
