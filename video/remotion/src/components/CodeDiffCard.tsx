import React from 'react';
import { COLOR_PALETTE } from '../data/narration';

interface DiffLine {
  type: 'add' | 'del' | 'same';
  oldLine?: number;
  newLine?: number;
  content: string;
}

interface CodeDiffCardProps {
  filename: string;
  diffLines: DiffLine[];
  title?: string;
  badge?: string;
  width?: number | string;
}

export const CodeDiffCard: React.FC<CodeDiffCardProps> = ({
  filename,
  diffLines,
  title = 'Git Working Copy Diff',
  badge = 'STALE TRIGGER',
  width = '100%',
}) => {
  return (
    <div
      style={{
        width,
        backgroundColor: '#0A0E1A',
        borderRadius: '12px',
        border: `1px solid ${COLOR_PALETTE.cardBorder}`,
        overflow: 'hidden',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
        fontFamily: '"JetBrains Mono", Menlo, Consolas, monospace',
      }}
    >
      {/* File Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 18px',
          backgroundColor: '#101524',
          borderBottom: `1px solid ${COLOR_PALETTE.cardBorder}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: COLOR_PALETTE.continuityThread, fontSize: '13px' }}>📄</span>
          <span style={{ color: COLOR_PALETTE.textPrimary, fontSize: '13px', fontWeight: 600 }}>
            {filename}
          </span>
        </div>
        {badge && (
          <span
            style={{
              fontSize: '11px',
              color: COLOR_PALETTE.staleAlert,
              backgroundColor: 'rgba(255, 92, 122, 0.12)',
              border: `1px solid rgba(255, 92, 122, 0.35)`,
              borderRadius: '4px',
              padding: '2px 8px',
              fontWeight: 600,
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Diff Table */}
      <div style={{ padding: '8px 0', fontSize: '12px', lineHeight: '1.5' }}>
        {diffLines.map((line, idx) => {
          let lineBg = 'transparent';
          let textColor = COLOR_PALETTE.textSecondary;
          let marker = ' ';

          if (line.type === 'add') {
            lineBg = 'rgba(64, 224, 181, 0.1)';
            textColor = COLOR_PALETTE.memorySaved;
            marker = '+';
          } else if (line.type === 'del') {
            lineBg = 'rgba(255, 92, 122, 0.12)';
            textColor = COLOR_PALETTE.staleAlert;
            marker = '-';
          }

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: lineBg,
                padding: '1px 16px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  color: '#4A5568',
                  userSelect: 'none',
                  textAlign: 'right',
                  paddingRight: '8px',
                }}
              >
                {line.oldLine || ''}
              </div>
              <div
                style={{
                  width: '32px',
                  color: '#4A5568',
                  userSelect: 'none',
                  textAlign: 'right',
                  paddingRight: '12px',
                }}
              >
                {line.newLine || ''}
              </div>
              <div
                style={{
                  width: '16px',
                  fontWeight: 700,
                  color: textColor,
                  userSelect: 'none',
                }}
              >
                {marker}
              </div>
              <div style={{ flex: 1, color: textColor, whiteSpace: 'pre' }}>{line.content}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
