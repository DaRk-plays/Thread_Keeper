import React from 'react';
import { COLOR_PALETTE } from '../data/narration';

interface SceneTitleProps {
  sceneNumber: number;
  title: string;
  subtitle?: string;
  accentColor?: string;
}

export const SceneTitle: React.FC<SceneTitleProps> = ({
  sceneNumber,
  title,
  subtitle,
  accentColor = COLOR_PALETTE.continuityThread,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 700,
            color: accentColor,
            backgroundColor: `${accentColor}18`,
            border: `1px solid ${accentColor}44`,
            borderRadius: '6px',
            padding: '3px 10px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          SCENE 0{sceneNumber}
        </span>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: COLOR_PALETTE.textPrimary,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            margin: 0,
            letterSpacing: '-0.5px',
          }}
        >
          {title}
        </h1>
      </div>
      {subtitle && (
        <p
          style={{
            fontSize: '16px',
            color: COLOR_PALETTE.textSecondary,
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.1px',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};
