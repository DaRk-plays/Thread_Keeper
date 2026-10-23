// Audio and Sound Design Configuration
export const AUDIO_CONFIG = {
  enableNarration: true,
  enableSfx: true,
  enableMusic: false, // Per prompt: music is optional; disabled unless royalty-safe music is approved

  narrationVolume: 1.0,
  sfxVolume: 0.35, // Subtle, non-distracting sound design cues

  narrationTracks: {
    scene1: 'audio/scene-01.mp3',
    scene2: 'audio/scene-02.mp3',
    scene3: 'audio/scene-03.mp3',
    scene4: 'audio/scene-04.mp3',
    scene5: 'audio/scene-05.mp3',
    scene6: 'audio/scene-06.mp3',
    scene7: 'audio/scene-07.mp3',
    scene8: 'audio/scene-08.mp3',
  },

  sfxTracks: {
    listeningPulse: 'sfx/sfx-listening-pulse.mp3',
    memorySaved: 'sfx/sfx-memory-saved.mp3',
    interruptionChime: 'sfx/sfx-interruption-chime.mp3',
    threadReconnect: 'sfx/sfx-thread-reconnect.mp3',
    subtleWhoosh: 'sfx/sfx-subtle-whoosh.mp3',
  },
};
