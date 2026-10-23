import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLOR_PALETTE } from '../data/narration';

interface Point {
  x: number;
  y: number;
}

interface ContinuityThreadProps {
  points?: Point[];
  progress?: number; // 0 to 1
  pulse?: boolean;
  color?: string;
  strokeWidth?: number;
}

export const ContinuityThread: React.FC<ContinuityThreadProps> = ({
  points = [
    { x: 100, y: 540 },
    { x: 500, y: 480 },
    { x: 960, y: 560 },
    { x: 1420, y: 490 },
    { x: 1820, y: 540 },
  ],
  progress = 1,
  pulse = true,
  color = COLOR_PALETTE.continuityThread,
  strokeWidth = 4,
}) => {
  const frame = useCurrentFrame();

  if (points.length < 2) return null;

  // Build smooth bezier curve SVG path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const mx = (p0.x + p1.x) / 2;
    pathD += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  // Neon pulse oscillation
  const pulseOpacity = pulse ? 0.75 + Math.sin(frame * 0.1) * 0.25 : 1;
  const pulseWidth = pulse ? strokeWidth + Math.sin(frame * 0.1) * 1 : strokeWidth;

  // Approximate total length for dasharray calculation
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    totalLength += Math.sqrt(dx * dx + dy * dy) * 1.2;
  }

  const dashOffset = interpolate(progress, [0, 1], [totalLength, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <defs>
        <filter id="threadGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background Outer Soft Neon Glow */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={pulseWidth * 3}
        strokeOpacity={pulseOpacity * 0.2}
        strokeDasharray={totalLength}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />

      {/* Middle Neon Aura */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={pulseWidth * 1.8}
        strokeOpacity={pulseOpacity * 0.5}
        strokeDasharray={totalLength}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        filter="url(#threadGlowFilter)"
      />

      {/* Core Crisp Fiber */}
      <path
        d={pathD}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={pulseWidth * 0.6}
        strokeOpacity={pulseOpacity}
        strokeDasharray={totalLength}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
    </svg>
  );
};
