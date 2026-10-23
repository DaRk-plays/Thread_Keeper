import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLOR_PALETTE } from '../data/narration';

interface AnimatedCaptionProps {
  kineticText?: string;
  debugText?: string;
  speaker?: string;
  accentColor?: string;
  showDebugTranscript?: boolean;
}

export const AnimatedCaption: React.FC<AnimatedCaptionProps> = ({
  kineticText,
  debugText,
  speaker = 'THREADKEEPER',
  accentColor = COLOR_PALETTE.continuityThread,
  showDebugTranscript = false,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '36px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      {/* Sleek Kinetic Caption (Standard Output Mode) */}
      {kineticText && (
        <div
          style={{
            backgroundColor: 'rgba(10, 14, 24, 0.88)',
            border: `1.5px solid ${COLOR_PALETTE.cardBorder}`,
            borderRadius: '999px',
            padding: '8px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(91, 140, 255, 0.15)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: accentColor,
              boxShadow: `0 0 10px ${accentColor}`,
              display: 'inline-block',
            }}
          />
          <span
            style={{
              color: COLOR_PALETTE.textPrimary,
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.2px',
            }}
          >
            {kineticText}
          </span>
        </div>
      )}

      {/* Optional Debug Transcript Panel (Only in Debug Mode) */}
      {showDebugTranscript && debugText && (
        <div
          style={{
            backgroundColor: 'rgba(8, 11, 18, 0.95)',
            border: `1px solid ${COLOR_PALETTE.cardBorder}`,
            borderRadius: '12px',
            padding: '12px 20px',
            maxWidth: '900px',
            textAlign: 'center',
            fontSize: '13px',
            color: COLOR_PALETTE.textSecondary,
            lineHeight: '1.4',
          }}
        >
          <span style={{ color: accentColor, fontWeight: 700, marginRight: '8px' }}>
            [{speaker}]
          </span>
          {debugText}
        </div>
      )}
    </div>
  );
};
