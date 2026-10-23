import React from 'react';
import { Series } from 'remotion';
import { SCENES } from './data/narration';
import { Scene1ContextLost } from './scenes/Scene1ContextLost';
import { Scene2ThreadKeeperReveal } from './scenes/Scene2ThreadKeeperReveal';
import { Scene3ParkThis } from './scenes/Scene3ParkThis';
import { Scene4Interruption } from './scenes/Scene4Interruption';
import { Scene5WhereWasI } from './scenes/Scene5WhereWasI';
import { Scene6ContinuityDiff } from './scenes/Scene6ContinuityDiff';
import { Scene7UnderTheHood } from './scenes/Scene7UnderTheHood';
import { Scene8Payoff } from './scenes/Scene8Payoff';

export const ThreadKeeperFilm: React.FC = () => {
  return (
    <Series>
      {/* Scene 1: Context Lost (0:00 - 0:14) */}
      <Series.Sequence durationInFrames={SCENES[0].durationInFrames} name="01-ContextLost">
        <Scene1ContextLost />
      </Series.Sequence>

      {/* Scene 2: ThreadKeeper Reveal (0:14 - 0:25) */}
      <Series.Sequence durationInFrames={SCENES[1].durationInFrames} name="02-ThreadKeeperReveal">
        <Scene2ThreadKeeperReveal />
      </Series.Sequence>

      {/* Scene 3: Alexa, Park This (0:25 - 0:50) */}
      <Series.Sequence durationInFrames={SCENES[2].durationInFrames} name="03-ParkThis">
        <Scene3ParkThis />
      </Series.Sequence>

      {/* Scene 4: The Interruption & The Drift (0:50 - 1:04) */}
      <Series.Sequence durationInFrames={SCENES[3].durationInFrames} name="04-TheDrift">
        <Scene4Interruption />
      </Series.Sequence>

      {/* Scene 5: Alexa, Where Was I? (1:04 - 1:34) */}
      <Series.Sequence durationInFrames={SCENES[4].durationInFrames} name="05-WhereWasI">
        <Scene5WhereWasI />
      </Series.Sequence>

      {/* Scene 6: Continuity Diff (1:34 - 1:58) */}
      <Series.Sequence durationInFrames={SCENES[5].durationInFrames} name="06-ContinuityDiff">
        <Scene6ContinuityDiff />
      </Series.Sequence>

      {/* Scene 7: Under The Hood (1:58 - 2:18) */}
      <Series.Sequence durationInFrames={SCENES[6].durationInFrames} name="07-UnderTheHood">
        <Scene7UnderTheHood />
      </Series.Sequence>

      {/* Scene 8: The Payoff (2:18 - 2:34) */}
      <Series.Sequence durationInFrames={SCENES[7].durationInFrames} name="08-ThePayoff">
        <Scene8Payoff />
      </Series.Sequence>
    </Series>
  );
};
