import React from 'react';
import { Composition } from 'remotion';
import { ThreadKeeperFilm } from './ThreadKeeperFilm';
import { TOTAL_FRAMES, VIDEO_FPS, VIDEO_WIDTH, VIDEO_HEIGHT } from './data/narration';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ThreadKeeperHackathonDemo"
        component={ThreadKeeperFilm}
        durationInFrames={TOTAL_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{}}
      />
    </>
  );
};
