import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLOR_PALETTE } from '../data/narration';

interface ArchitectureNodeProps {
  title: string;
  subtitle: string;
  icon: string;
  badge?: string;
  color?: string;
  x: number;
  y: number;
  width?: number;
  active?: boolean;
}

export const ArchitectureNode: React.FC<ArchitectureNodeProps> = ({
  title,
  subtitle,
  icon,
  badge,
  color = COLOR_PALETTE.continuityThread,
  x,
  y,
  width = 240,
  active = true,
}) => {
  const frame = useCurrentFrame();
  const pulse = active ? 0.3 + Math.sin(frame * 0.12) * 0.15 : 0.1;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        transform: 'translate(-50%, -50%)',
        backgroundColor: COLOR_PALETTE.cardBackground,
        border: `1.5px solid ${color}`,
        borderRadius: '14px',
        padding: '16px 20px',
        boxShadow: `0 12px 30px rgba(0, 0, 0, 0.6), 0 0 20px ${color}${Math.floor(pulse * 255).toString(16).padStart(2, '0')}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 5,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{icon}</span>
          <span
            style={{
              color: COLOR_PALETTE.textPrimary,
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {title}
          </span>
        </div>
        {badge && (
          <span
            style={{
              fontSize: '10px',
              color,
              backgroundColor: `${color}18`,
              border: `1px solid ${color}44`,
              borderRadius: '4px',
              padding: '2px 6px',
              fontFamily: 'monospace',
              fontWeight: 600,
            }}
          >
            {badge}
          </span>
        )}
      </div>

      <div
        style={{
          color: COLOR_PALETTE.textSecondary,
          fontSize: '12px',
          fontFamily: 'monospace',
          lineHeight: '1.4',
        }}
      >
        {subtitle}
      </div>
    </div>
  );
};
