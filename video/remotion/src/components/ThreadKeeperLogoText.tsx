import React from 'react';
import { COLOR_PALETTE } from '../data/narration';

interface ThreadKeeperLogoTextProps {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  glow?: boolean;
}

export const ThreadKeeperLogoText: React.FC<ThreadKeeperLogoTextProps> = ({
  size = 'md',
  subtitle,
  glow = true,
}) => {
  const fontSizes = {
    sm: { main: '18px', sub: '11px', dot: '8px' },
    md: { main: '28px', sub: '13px', dot: '12px' },
    lg: { main: '44px', sub: '16px', dot: '16px' },
  };

  const current = fontSizes[size];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Connected nodes icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              width: current.dot,
              height: current.dot,
              borderRadius: '50%',
              backgroundColor: COLOR_PALETTE.continuityThread,
              boxShadow: glow ? `0 0 10px ${COLOR_PALETTE.continuityThread}` : 'none',
              display: 'inline-block',
            }}
          />
          <div
            style={{
              width: '14px',
              height: '2px',
              backgroundColor: COLOR_PALETTE.continuityThread,
            }}
          />
          <span
            style={{
              width: current.dot,
              height: current.dot,
              borderRadius: '50%',
              backgroundColor: COLOR_PALETTE.memorySaved,
              boxShadow: glow ? `0 0 10px ${COLOR_PALETTE.memorySaved}` : 'none',
              display: 'inline-block',
            }}
          />
        </div>

        <span
          style={{
            fontSize: current.main,
            fontWeight: 800,
            color: COLOR_PALETTE.textPrimary,
            letterSpacing: '-0.5px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Thread<span style={{ color: COLOR_PALETTE.continuityThread }}>Keeper</span>
        </span>
      </div>

      {subtitle && (
        <span
          style={{
            fontSize: current.sub,
            color: COLOR_PALETTE.textSecondary,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            paddingLeft: '32px',
          }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
};
