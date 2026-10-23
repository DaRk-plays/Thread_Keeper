const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ffmpegBin = path.join(__dirname, '../node_modules/@remotion/compositor-darwin-arm64/ffmpeg');
const dylibPath = path.join(__dirname, '../node_modules/@remotion/compositor-darwin-arm64');
const audioDir = path.join(__dirname, '../public/audio');

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Exactly the prompt-specified narration scripts
const SCENE_SCRIPTS = [
  {
    id: 1,
    name: 'scene-01',
    text: "You don't usually forget the file you were working on. You forget everything around it — what you believed, what you tried, and what you planned to do next."
  },
  {
    id: 2,
    name: 'scene-02',
    rate: 175,
    text: "ThreadKeeper is a bookmark for your working memory. Before an interruption, it parks your train of thought. When you return, it tells you what changed, and what needs review."
  },
  {
    id: 3,
    name: 'scene-03',
    text: "I'm working on multi-currency payment validation. I say, 'Alexa, park this.' ThreadKeeper captures the current Git evidence, my assumptions, decisions, and next step, then persists that context in AgentCore Memory."
  },
  {
    id: 4,
    name: 'scene-04',
    text: "Then ThreadKeeper shuts down completely. While I'm away, payment.ts changes. The hard part isn't remembering the file. It's knowing whether what I believed before is still true."
  },
  {
    id: 5,
    name: 'scene-05',
    text: "Later, a fresh process starts. I ask, 'Alexa, where was I?'"
  },
  {
    id: 6,
    name: 'scene-06',
    text: "This is Continuity Diff. Git tells ThreadKeeper what actually changed. AgentCore remembers what I believed before I left. ThreadKeeper separates what is observed, what can be derived, what is only inferred, and what is still unknown."
  },
  {
    id: 7,
    name: 'scene-07',
    text: "Underneath, ThreadKeeper is a self-hosted MCP server over Streamable HTTP. Git remains the source of truth. AgentCore provides persistent memory. Amazon Nova Lite helps explain the impact without overruling the evidence."
  },
  {
    id: 8,
    name: 'scene-08',
    text: "Your code already has version control. Your train of thought should too. ThreadKeeper. Never lose your train of thought."
  }
];

console.log('Generating temporary preview narration audio files...');

for (const scene of SCENE_SCRIPTS) {
  const wavPath = path.join('/tmp', `${scene.name}.wav`);
  const mp3Path = path.join(audioDir, `${scene.name}.mp3`);

  console.log(`Processing ${scene.name}... (${scene.text.split(' ').length} words)`);

  // Use macOS system TTS 'Samantha' at natural speaking rate
  const rate = scene.rate || 165;
  const sayCmd = `say -v Samantha -r ${rate} --file-format=WAVE --data-format=LEI16@44100 "${scene.text}" -o "${wavPath}"`;
  execSync(sayCmd);

  // Convert to clean MP3 using bundled ffmpeg
  const ffmpegCmd = `DYLD_LIBRARY_PATH="${dylibPath}" "${ffmpegBin}" -y -i "${wavPath}" -codec:a libmp3lame -b:a 192k "${mp3Path}"`;
  execSync(ffmpegCmd);

  if (fs.existsSync(wavPath)) {
    fs.unlinkSync(wavPath);
  }
}

console.log('All 8 scene narration files generated successfully in public/audio/');
