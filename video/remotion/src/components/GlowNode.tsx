import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLOR_PALETTE } from '../data/narration';

interface GlowNodeProps {
  label: string;
  sublabel?: string;
  icon?: string;
  color?: string;
  x?: number;
  y?: number;
  size?: number;
  pulse?: boolean;
}

export const GlowNode: React.FC<GlowNodeProps> = ({
  label,
  sublabel,
  icon,
  color = COLOR_PALETTE.continuityThread,
  x = 0,
  y = 0,
  size = 64,
  pulse = true,
}) => {
  const frame = useCurrentFrame();
  const pulseScale = pulse ? 1 + Math.sin(frame * 0.12) * 0.05 : 1;
  const pulseGlow = pulse ? 0.3 + Math.sin(frame * 0.12) * 0.15 : 0.3;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${pulseScale})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        zIndex: 5,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: COLOR_PALETTE.cardBackground,
          border: `2px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 24px ${color}${Math.floor(pulseGlow * 255).toString(16).padStart(2, '0')}, inset 0 0 12px ${color}22`,
          color: COLOR_PALETTE.textPrimary,
          fontSize: size * 0.4,
          fontFamily: 'monospace',
          fontWeight: 700,
        }}
      >
        {icon || '●'}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            color: COLOR_PALETTE.textPrimary,
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
        {sublabel && (
          <div
            style={{
              color: COLOR_PALETTE.textSecondary,
              fontSize: '11px',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
            }}
          >
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
};
