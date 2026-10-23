import React from 'react';
import { COLOR_PALETTE } from '../data/narration';

export type EpistemicTier = 'OBSERVED' | 'DERIVED' | 'INFERRED' | 'UNKNOWN' | 'STALE';

interface EpistemicBadgeProps {
  tier: EpistemicTier;
  label?: string;
  subtext?: string;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

const TIER_CONFIG: Record<
  EpistemicTier,
  { defaultLabel: string; color: string; border: string; bg: string; description: string }
> = {
  OBSERVED: {
    defaultLabel: 'OBSERVED FACT',
    color: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.4)',
    bg: 'rgba(255, 255, 255, 0.08)',
    description: 'Ground truth anchored in real Git commit / working copy hash',
  },
  DERIVED: {
    defaultLabel: 'DERIVED STATE',
    color: COLOR_PALETTE.memorySaved, // Mint #40E0B5
    border: 'rgba(64, 224, 181, 0.45)',
    bg: 'rgba(64, 224, 181, 0.09)',
    description: 'Computed deterministically from structural file diffs',
  },
  INFERRED: {
    defaultLabel: 'INFERRED HYPOTHESIS',
    color: COLOR_PALETTE.inference, // Amber #FFB547
    border: 'rgba(255, 181, 71, 0.45)',
    bg: 'rgba(255, 181, 71, 0.09)',
    description: 'Synthesized context marked explicitly as unproven assumption',
  },
  UNKNOWN: {
    defaultLabel: 'UNKNOWN / HONEST VOID',
    color: COLOR_PALETTE.unknown, // Violet #8E8BAF
    border: 'rgba(142, 139, 175, 0.45)',
    bg: 'rgba(142, 139, 175, 0.09)',
    description: 'Explicit boundary: never fabricate what cannot be proven',
  },
  STALE: {
    defaultLabel: 'STALE ASSUMPTION',
    color: COLOR_PALETTE.staleAlert, // Coral #FF5C7A
    border: 'rgba(255, 92, 122, 0.55)',
    bg: 'rgba(255, 92, 122, 0.12)',
    description: 'Underlying artifact changed; assumption invalid until reviewed',
  },
};

export const EpistemicBadge: React.FC<EpistemicBadgeProps> = ({
  tier,
  label,
  subtext,
  size = 'md',
  active = true,
}) => {
  const config = TIER_CONFIG[tier];
  const displayLabel = label || config.defaultLabel;

  const fontSizes = {
    sm: { title: '11px', sub: '9px', pad: '4px 8px' },
    md: { title: '13px', sub: '11px', pad: '6px 14px' },
    lg: { title: '15px', sub: '12px', pad: '10px 18px' },
  };

  const currentSize = fontSizes[size];

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        backgroundColor: config.bg,
        border: `1.5px solid ${config.border}`,
        borderRadius: '8px',
        padding: currentSize.pad,
        boxShadow: active ? `0 0 16px ${config.color}26` : 'none',
        backdropFilter: 'blur(6px)',
        opacity: active ? 1 : 0.6,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            width: size === 'sm' ? '6px' : '8px',
            height: size === 'sm' ? '6px' : '8px',
            borderRadius: '50%',
            backgroundColor: config.color,
            boxShadow: `0 0 8px ${config.color}`,
          }}
        />
        <span
          style={{
            color: config.color,
            fontSize: currentSize.title,
            fontWeight: 700,
            letterSpacing: '0.6px',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
          }}
        >
          {displayLabel}
        </span>
      </div>
      {subtext && (
        <span
          style={{
            color: COLOR_PALETTE.textSecondary,
            fontSize: currentSize.sub,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            marginTop: '2px',
            paddingLeft: size === 'sm' ? '14px' : '16px',
          }}
        >
          {subtext}
        </span>
      )}
    </div>
  );
};
