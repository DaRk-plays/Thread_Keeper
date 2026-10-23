import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLOR_PALETTE } from '../data/narration';

interface ThoughtItem {
  id: string;
  label: string;
  subtext?: string;
  color?: string;
  xOffset: number;
  yOffset: number;
}

interface ThoughtBubbleProps {
  items: ThoughtItem[];
  centerX?: number;
  centerY?: number;
  shatterProgress?: number; // 0 = stable, 1 = exploded/scattered
  scale?: number;
}

export const ThoughtBubble: React.FC<ThoughtBubbleProps> = ({
  items,
  centerX = 300,
  centerY = 200,
  shatterProgress = 0,
  scale = 1,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: 'absolute',
        left: centerX,
        top: centerY,
        transform: `scale(${scale})`,
        pointerEvents: 'none',
      }}
    >
      {/* Floating thought trail dots */}
      {[
        { r: 4, dx: -80, dy: 90, delay: 0 },
        { r: 7, dx: -55, dy: 60, delay: 5 },
        { r: 11, dx: -25, dy: 30, delay: 10 },
      ].map((dot, idx) => {
        const floatY = Math.sin((frame + dot.delay) * 0.1) * 3;
        const dotOpacity = interpolate(shatterProgress, [0, 0.4], [1, 0], {
          extrapolateRight: 'clamp',
        });
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: dot.dx,
              top: dot.dy + floatY,
              width: dot.r * 2,
              height: dot.r * 2,
              borderRadius: '50%',
              backgroundColor: COLOR_PALETTE.cardBackground,
              border: `1.5px solid ${COLOR_PALETTE.cardBorder}`,
              boxShadow: `0 0 10px rgba(91, 140, 255, 0.2)`,
              opacity: dotOpacity,
            }}
          />
        );
      })}

      {/* Thought Nodes */}
      {items.map((item, idx) => {
        // Individual item floating motion
        const floatX = Math.sin((frame + idx * 15) * 0.08) * 4;
        const floatY = Math.cos((frame + idx * 12) * 0.07) * 4;

        // Scatter calculation when shattered
        const angle = (idx / items.length) * Math.PI * 2 + (idx % 2 === 0 ? 0.3 : -0.3);
        const scatterDist = interpolate(shatterProgress, [0, 1], [0, 260 + idx * 40]);
        const scatterX = Math.cos(angle) * scatterDist;
        const scatterY = Math.sin(angle) * scatterDist;
        const scatterRot = interpolate(shatterProgress, [0, 1], [0, (idx % 2 === 0 ? 90 : -90)]);
        const itemOpacity = interpolate(shatterProgress, [0, 0.7, 1], [1, 0.6, 0], {
          extrapolateRight: 'clamp',
        });

        const nodeColor = item.color || COLOR_PALETTE.continuityThread;

        return (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              left: item.xOffset + floatX + scatterX,
              top: item.yOffset + floatY + scatterY,
              transform: `translate(-50%, -50%) rotate(${scatterRot}deg)`,
              opacity: itemOpacity,
              background: 'rgba(17, 22, 37, 0.88)',
              backdropFilter: 'blur(8px)',
              border: `1.5px solid ${nodeColor}`,
              borderRadius: '12px',
              padding: '10px 16px',
              boxShadow: `0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px ${nodeColor}33`,
              whiteSpace: 'nowrap',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              minWidth: '160px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: nodeColor,
                  boxShadow: `0 0 8px ${nodeColor}`,
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  color: COLOR_PALETTE.textPrimary,
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: '0.2px',
                }}
              >
                {item.label}
              </span>
            </div>
            {item.subtext && (
              <span
                style={{
                  color: COLOR_PALETTE.textSecondary,
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  paddingLeft: '16px',
                }}
              >
                {item.subtext}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
