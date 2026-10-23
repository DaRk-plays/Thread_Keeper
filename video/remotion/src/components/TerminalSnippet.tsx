import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLOR_PALETTE } from '../data/narration';

interface TerminalLine {
  prompt?: string;
  command?: string;
  output?: string;
  color?: string;
  delay?: number; // frame delay
  highlight?: boolean;
}

interface TerminalSnippetProps {
  lines: TerminalLine[];
  title?: string;
  width?: number | string;
  height?: number | string;
}

export const TerminalSnippet: React.FC<TerminalSnippetProps> = ({
  lines,
  title = 'bash - threadkeeper',
  width = '100%',
  height = '100%',
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#090D18',
        borderRadius: '12px',
        border: `1px solid ${COLOR_PALETTE.cardBorder}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: '"JetBrains Mono", Menlo, Monaco, Consolas, monospace',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          backgroundColor: '#0E1322',
          borderBottom: `1px solid ${COLOR_PALETTE.cardBorder}`,
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FF5F56' }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#27C93F' }} />
        <span style={{ fontSize: '12px', color: COLOR_PALETTE.textSecondary, marginLeft: '10px' }}>
          {title}
        </span>
      </div>

      {/* Terminal Body */}
      <div
        style={{
          padding: '16px 20px',
          flex: 1,
          overflowY: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          fontSize: '13px',
          lineHeight: '1.6',
        }}
      >
        {lines.map((line, idx) => {
          const lineStart = line.delay || idx * 15;
          const isVisible = frame >= lineStart;
          if (!isVisible) return null;

          return (
            <div key={idx} style={{ opacity: 1, display: 'flex', flexDirection: 'column' }}>
              {line.command && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: COLOR_PALETTE.continuityThread, fontWeight: 700 }}>
                    {line.prompt || '$'}
                  </span>
                  <span style={{ color: COLOR_PALETTE.textPrimary }}>{line.command}</span>
                </div>
              )}
              {line.output && (
                <div
                  style={{
                    color: line.color || COLOR_PALETTE.textSecondary,
                    paddingLeft: line.command ? '16px' : '0',
                    whiteSpace: 'pre-wrap',
                    fontSize: line.highlight ? '14px' : '12px',
                    fontWeight: line.highlight ? 700 : 400,
                    backgroundColor: line.highlight ? 'rgba(91, 140, 255, 0.08)' : 'transparent',
                    padding: line.highlight ? '4px 10px' : '0',
                    borderRadius: line.highlight ? '6px' : '0',
                    borderLeft: line.highlight ? `3px solid ${line.color || COLOR_PALETTE.continuityThread}` : 'none',
                  }}
                >
                  {line.output}
                </div>
              )}
            </div>
          );
        })}

        {/* Blinking cursor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <span style={{ color: COLOR_PALETTE.continuityThread, fontWeight: 700 }}>$</span>
          <span
            style={{
              width: '8px',
              height: '15px',
              backgroundColor: COLOR_PALETTE.continuityThread,
              opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0,
            }}
          />
        </div>
      </div>
    </div>
  );
};
