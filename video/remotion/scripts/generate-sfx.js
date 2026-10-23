const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ffmpegBin = path.join(__dirname, '../node_modules/@remotion/compositor-darwin-arm64/ffmpeg');
const dylibPath = path.join(__dirname, '../node_modules/@remotion/compositor-darwin-arm64');
const sfxDir = path.join(__dirname, '../public/sfx');

if (!fs.existsSync(sfxDir)) {
  fs.mkdirSync(sfxDir, { recursive: true });
}

function writeWav(filename, sampleRate, samples) {
  const byteLength = samples.length * 2;
  const buffer = Buffer.alloc(44 + byteLength);

  // RIFF identifier
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + byteLength, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // audio format (1 = PCM)
  buffer.writeUInt16LE(1, 22); // num channels (1 = Mono)
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(byteLength, 40);

  for (let i = 0; i < samples.length; i++) {
    // Clamp to 16-bit signed integer
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.floor(s < 0 ? s * 32768 : s * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filename, buffer);
}

const SAMPLE_RATE = 44100;

// 1. Listening Pulse (Soft, warm C5 + E5 harmonic chime)
function genListeningPulse() {
  const duration = 0.35;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 9) * Math.sin(Math.min(1, t / 0.02) * Math.PI / 2);
    const s = 0.5 * Math.sin(2 * Math.PI * 523.25 * t) + 0.3 * Math.sin(2 * Math.PI * 659.25 * t);
    samples[i] = s * env * 0.25; // Gentle volume
  }
  return samples;
}

// 2. Memory Saved (Warm ascending major third chime: A4 -> C#5 -> E5)
function genMemorySaved() {
  const duration = 0.55;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;
    // Note 1: A4 (440Hz)
    if (t < 0.35) {
      const e1 = Math.exp(-t * 10);
      s += 0.4 * Math.sin(2 * Math.PI * 440 * t) * e1;
    }
    // Note 2: C#5 (554.37Hz) at 0.08s
    if (t >= 0.08) {
      const t2 = t - 0.08;
      const e2 = Math.exp(-t2 * 8);
      s += 0.4 * Math.sin(2 * Math.PI * 554.37 * t2) * e2;
    }
    // Note 3: E5 (659.25Hz) at 0.16s
    if (t >= 0.16) {
      const t3 = t - 0.16;
      const e3 = Math.exp(-t3 * 7);
      s += 0.5 * Math.sin(2 * Math.PI * 659.25 * t3) * e3;
    }
    samples[i] = s * 0.22;
  }
  return samples;
}

// 3. Interruption Chime (Single calm acoustic tone)
function genInterruptionChime() {
  const duration = 0.45;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 8) * Math.sin(Math.min(1, t / 0.015) * Math.PI / 2);
    const s = Math.sin(2 * Math.PI * 392.00 * t) + 0.25 * Math.sin(2 * Math.PI * 784.00 * t);
    samples[i] = s * env * 0.22;
  }
  return samples;
}

// 4. Thread Reconnect (Gentle harmonic glissando / shimmer)
function genThreadReconnect() {
  const duration = 0.50;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 330 + 160 * (t / duration);
    const env = Math.exp(-t * 6) * Math.sin(Math.min(1, t / 0.03) * Math.PI / 2);
    const s = Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t);
    samples[i] = s * env * 0.20;
  }
  return samples;
}

// 5. Subtle Whoosh (Filtered soft noise sweep)
function genSubtleWhoosh() {
  const duration = 0.40;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);
  let lastNoise = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.sin(Math.PI * (t / duration));
    const white = (Math.random() * 2 - 1);
    // Simple 1-pole low-pass filter
    lastNoise = lastNoise * 0.85 + white * 0.15;
    samples[i] = lastNoise * env * 0.18;
  }
  return samples;
}

const SFX_LIST = [
  { name: 'sfx-listening-pulse', fn: genListeningPulse },
  { name: 'sfx-memory-saved', fn: genMemorySaved },
  { name: 'sfx-interruption-chime', fn: genInterruptionChime },
  { name: 'sfx-thread-reconnect', fn: genThreadReconnect },
  { name: 'sfx-subtle-whoosh', fn: genSubtleWhoosh },
];

console.log('Generating subtle sound effects...');
for (const sfx of SFX_LIST) {
  const wavPath = path.join('/tmp', `${sfx.name}.wav`);
  const mp3Path = path.join(sfxDir, `${sfx.name}.mp3`);
  const samples = sfx.fn();
  writeWav(wavPath, SAMPLE_RATE, samples);

  const ffmpegCmd = `DYLD_LIBRARY_PATH="${dylibPath}" "${ffmpegBin}" -y -i "${wavPath}" -codec:a libmp3lame -b:a 192k "${mp3Path}"`;
  execSync(ffmpegCmd);

  if (fs.existsSync(wavPath)) {
    fs.unlinkSync(wavPath);
  }
  console.log(`Generated ${sfx.name}.mp3`);
}
console.log('All subtle sound cues generated in public/sfx/');
