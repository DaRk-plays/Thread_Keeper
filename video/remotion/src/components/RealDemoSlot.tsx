import React from 'react';
import { Video, useCurrentFrame } from 'remotion';
import { COLOR_PALETTE } from '../data/narration';

interface RealDemoSlotProps {
  title: string;
  badge?: string;
  videoSrc?: string;
  width?: number | string;
  height?: number | string;
  placeholderComponent?: React.ReactNode;
  aspectRatio?: string;
}

export const RealDemoSlot: React.FC<RealDemoSlotProps> = ({
  title,
  badge = 'VERIFIED MCP & AWS LIVE RUN',
  videoSrc,
  width = '100%',
  height = '100%',
  placeholderComponent,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: COLOR_PALETTE.cardBackground,
        border: `1.5px solid ${COLOR_PALETTE.cardBorder}`,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 20px rgba(91, 140, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Window Title Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          backgroundColor: '#0C101B',
          borderBottom: `1px solid ${COLOR_PALETTE.cardBorder}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FF5F56' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#27C93F' }} />
          <span
            style={{
              marginLeft: '12px',
              color: COLOR_PALETTE.textSecondary,
              fontSize: '13px',
              fontFamily: 'monospace',
              fontWeight: 500,
            }}
          >
            {title}
          </span>
        </div>

        {badge && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(64, 224, 181, 0.12)',
              border: '1px solid rgba(64, 224, 181, 0.4)',
              borderRadius: '6px',
              padding: '3px 10px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: COLOR_PALETTE.memorySaved,
                boxShadow: `0 0 6px ${COLOR_PALETTE.memorySaved}`,
              }}
            />
            <span
              style={{
                color: COLOR_PALETTE.memorySaved,
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 600,
                letterSpacing: '0.4px',
              }}
            >
              {badge}
            </span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          backgroundColor: '#070A11',
        }}
      >
        {videoSrc ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#070A11',
            }}
          >
            <Video
              src={videoSrc}
              muted={true}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
          </div>
        ) : placeholderComponent ? (
          <div style={{ width: '100%', height: '100%' }}>{placeholderComponent}</div>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              color: COLOR_PALETTE.textSecondary,
              fontFamily: 'monospace',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: `2px dashed ${COLOR_PALETTE.continuityThread}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: COLOR_PALETTE.continuityThread,
                fontSize: '20px',
              }}
            >
              ▶
            </div>
            <div>[ REAL SCREEN RECORDING DROP-IN SLOT ]</div>
          </div>
        )}
      </div>
    </div>
  );
};
