import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLOR_PALETTE } from '../data/narration';

export type DeveloperMood = 'coding' | 'shocked' | 'away' | 'back_in_flow' | 'thinking';

interface StickDeveloperProps {
  mood?: DeveloperMood;
  scale?: number;
  x?: number;
  y?: number;
  opacity?: number;
}

export const StickDeveloper: React.FC<StickDeveloperProps> = ({
  mood = 'coding',
  scale = 1,
  x = 0,
  y = 0,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();

  // Subtle hand-drawn doodle wobble effect (changes every few frames)
  const wobbleSeed = Math.floor(frame / 4);
  const wobbleX = Math.sin(wobbleSeed * 2.7) * 1.5;
  const wobbleY = Math.cos(wobbleSeed * 3.1) * 1.5;
  const wobbleRot = Math.sin(wobbleSeed * 1.9) * 0.8;

  // Typing animation for hands
  const handBounce = Math.sin(frame * 0.6) * 4;

  // Head tilt based on mood
  let headTilt = 0;
  let eyeLeft = 142;
  let eyeRight = 158;
  let eyeY = 82;
  let mouthPath = 'M 142 98 Q 150 102 158 98'; // slight smile
  let armLeft = 'M 140 135 L 120 160 L 165 170';
  let armRight = `M 160 135 L 180 ${160 + handBounce} L 185 170`;

  if (mood === 'shocked') {
    headTilt = -6;
    mouthPath = 'M 145 102 A 5 7 0 1 1 155 102'; // open mouth O
    armLeft = 'M 140 135 L 105 110 L 115 90'; // raised hands in shock
    armRight = 'M 160 135 L 195 110 L 185 90';
  } else if (mood === 'thinking') {
    headTilt = 4;
    mouthPath = 'M 144 98 L 156 97'; // straight line
    armLeft = 'M 140 135 L 120 160 L 165 170';
    armRight = 'M 160 135 L 175 140 L 160 105'; // hand on chin
  } else if (mood === 'back_in_flow') {
    headTilt = Math.sin(frame * 0.15) * 2;
    mouthPath = 'M 140 96 Q 150 106 160 96'; // big confident smile
    armLeft = `M 140 135 L 120 ${160 - handBounce} L 165 170`;
    armRight = `M 160 135 L 180 ${160 + handBounce} L 185 170`;
  } else if (mood === 'away') {
    opacity = 0;
  }

  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(${x + wobbleX}px, ${y + wobbleY}px) scale(${scale}) rotate(${wobbleRot}deg)`,
        opacity,
        transformOrigin: 'center center',
      }}
    >
      <svg
        width="320"
        height="320"
        viewBox="0 0 320 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {/* Glow filter */}
        <defs>
          <filter id="handGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={COLOR_PALETTE.continuityThread} floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Desk Surface */}
        <line
          x1="40"
          y1="230"
          x2="280"
          y2="230"
          stroke={COLOR_PALETTE.cardBorder}
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Desk Legs */}
        <line x1="60" y1="230" x2="50" y2="300" stroke={COLOR_PALETTE.cardBorder} strokeWidth="3" strokeLinecap="round" />
        <line x1="260" y1="230" x2="270" y2="300" stroke={COLOR_PALETTE.cardBorder} strokeWidth="3" strokeLinecap="round" />

        {/* Laptop Base & Screen */}
        <line x1="150" y1="228" x2="225" y2="228" stroke="#AEB6C5" strokeWidth="4" strokeLinecap="round" />
        <line x1="215" y1="228" x2="235" y2="175" stroke="#AEB6C5" strokeWidth="3" strokeLinecap="round" />
        {/* Screen glow */}
        <polygon
          points="215,225 233,178 200,165 175,220"
          fill={COLOR_PALETTE.continuityThread}
          fillOpacity="0.08"
        />

        {/* Chair Backrest */}
        <path d="M 85 240 L 95 140 Q 98 120 115 120" stroke="#1F2942" strokeWidth="5" strokeLinecap="round" />

        {/* Stick Figure Body */}
        <g transform={`rotate(${headTilt} 150 120)`} filter="url(#handGlow)">
          {/* Head */}
          <circle
            cx="150"
            cy="85"
            r="26"
            stroke={COLOR_PALETTE.textPrimary}
            strokeWidth="3.5"
            fill={COLOR_PALETTE.background}
          />

          {/* Eyes */}
          {mood === 'shocked' ? (
            <>
              <circle cx={eyeLeft} cy={eyeY} r="3" fill={COLOR_PALETTE.staleAlert} />
              <circle cx={eyeRight} cy={eyeY} r="3" fill={COLOR_PALETTE.staleAlert} />
            </>
          ) : (
            <>
              <circle cx={eyeLeft} cy={eyeY} r="2.5" fill={COLOR_PALETTE.textPrimary} />
              <circle cx={eyeRight} cy={eyeY} r="2.5" fill={COLOR_PALETTE.textPrimary} />
            </>
          )}

          {/* Mouth */}
          <path
            d={mouthPath}
            stroke={mood === 'shocked' ? COLOR_PALETTE.staleAlert : COLOR_PALETTE.textPrimary}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Torso */}
          <line
            x1="150"
            y1="111"
            x2="135"
            y2="195"
            stroke={COLOR_PALETTE.textPrimary}
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Arms */}
          <path d={armLeft} stroke={COLOR_PALETTE.textPrimary} strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d={armRight} stroke={COLOR_PALETTE.textPrimary} strokeWidth="3" strokeLinecap="round" fill="none" />

          {/* Legs */}
          <path d="M 135 195 L 110 220 L 110 280" stroke={COLOR_PALETTE.textPrimary} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M 135 195 L 145 225 L 150 280" stroke={COLOR_PALETTE.textPrimary} strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
      </svg>
    </div>
  );
};
