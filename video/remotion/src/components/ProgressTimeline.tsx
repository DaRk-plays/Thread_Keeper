import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLOR_PALETTE, SCENES, TOTAL_FRAMES } from '../data/narration';

interface ProgressTimelineProps {
  currentSceneId: number;
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ currentSceneId }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '60px',
        right: '60px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 60,
      }}
    >
      {SCENES.map((scene) => {
        const isActive = scene.id === currentSceneId;
        const isPast = scene.id < currentSceneId;

        let barBg = '#161D2E';
        let barBorder = COLOR_PALETTE.cardBorder;

        if (isActive) {
          barBg = COLOR_PALETTE.continuityThread;
          barBorder = COLOR_PALETTE.continuityThread;
        } else if (isPast) {
          barBg = COLOR_PALETTE.cardBorder;
        }

        return (
          <div
            key={scene.id}
            style={{
              flex: scene.durationInFrames,
              height: '4px',
              backgroundColor: barBg,
              borderRadius: '2px',
              border: isActive ? `1px solid ${barBorder}` : 'none',
              boxShadow: isActive ? `0 0 8px ${COLOR_PALETTE.continuityThread}` : 'none',
              transition: 'background-color 0.2s ease',
            }}
          />
        );
      })}
    </div>
  );
};
