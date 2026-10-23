import React from 'react';
import { useCurrentFrame } from 'remotion';
import { COLOR_PALETTE } from '../data/narration';

interface AudioWaveProps {
  active?: boolean;
  barCount?: number;
  height?: number;
  color?: string;
}

export const AudioWave: React.FC<AudioWaveProps> = ({
  active = true,
  barCount = 24,
  height = 40,
  color = COLOR_PALETTE.continuityThread,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        height,
      }}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const offset = i * 0.35;
        const wave = active
          ? Math.abs(Math.sin(frame * 0.18 + offset) * Math.cos(frame * 0.08 + offset * 0.5))
          : 0.15;
        const barHeight = Math.max(6, wave * height);

        return (
          <div
            key={i}
            style={{
              width: '4px',
              height: barHeight,
              borderRadius: '2px',
              backgroundColor: color,
              boxShadow: active ? `0 0 8px ${color}88` : 'none',
              transition: 'height 0.05s ease',
            }}
          />
        );
      })}
    </div>
  );
};
