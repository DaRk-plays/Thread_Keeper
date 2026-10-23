const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AUDITIONS_DIR = path.join(__dirname, '../public/audio/auditions');
fs.mkdirSync(AUDITIONS_DIR, { recursive: true });

const text = "You don't usually forget the file you were working on. You forget everything around it — what you believed, what you tried, and what you planned to do next.";

const voices = [
  { id: 'Kajal', file: 'kajal', label: 'Kajal — English (Indian)' },
  { id: 'Danielle', file: 'danielle', label: 'Danielle — English (US)' },
  { id: 'Brian', file: 'brian', label: 'Brian — English (British)' }
];

const awsBin = process.env.AWS_BIN || 'aws';
const ffmpegBin = path.join(__dirname, '../node_modules/@remotion/compositor-darwin-arm64/ffmpeg');
const dylibPath = path.join(__dirname, '../node_modules/@remotion/compositor-darwin-arm64');

console.log('Audition Text:');
console.log(`"${text}"\n`);

for (const v of voices) {
  const tempMp3 = path.join('/tmp', `polly-raw-${v.file}.mp3`);
  const rawWav = path.join('/tmp', `polly-raw-${v.file}.wav`);
  const finalWav = path.join(AUDITIONS_DIR, `${v.file}.wav`);

  console.log(`Synthesizing ${v.label} (VoiceId: ${v.id})...`);
  const cmd = `"${awsBin}" polly synthesize-speech --engine generative --voice-id ${v.id} --text "${text}" --output-format mp3 --profile threadkeeper --region ap-southeast-2 "${tempMp3}"`;
  execSync(cmd, { stdio: 'inherit' });

  // Convert to 48kHz stereo WAV
  const convertCmd = `DYLD_LIBRARY_PATH="${dylibPath}" "${ffmpegBin}" -y -i "${tempMp3}" -ar 48000 -ac 2 "${rawWav}"`;
  execSync(convertCmd, { stdio: 'pipe' });

  // Read samples and analyze
  const rawBuf = fs.readFileSync(rawWav);
  // Header is 44 bytes, 16-bit LE PCM stereo (4 bytes per frame)
  const header = rawBuf.subarray(0, 44);
  const data = rawBuf.subarray(44);
  const sampleCount = data.length / 2;

  let peak = 0;
  let sumSq = 0;
  for (let i = 0; i < data.length; i += 2) {
    const val = Math.abs(data.readInt16LE(i));
    if (val > peak) peak = val;
    sumSq += val * val;
  }
  const rawRms = Math.sqrt(sumSq / sampleCount);
  const rawPeakDbfs = 20 * Math.log10(peak / 32768);
  const rawRmsDbfs = 20 * Math.log10(rawRms / 32768);
  console.log(`  Raw: Peak ${peak} (${rawPeakDbfs.toFixed(1)} dBFS), RMS ${rawRms.toFixed(1)} (${rawRmsDbfs.toFixed(1)} dBFS)`);

  // Target normalization: Peak around -1.0 dBFS (approx 29000/32768) and RMS ~ -20 dBFS
  // Scale factor based on peak ceiling -1.0 dBFS to avoid any digital clipping
  const targetPeak = 29205; // -1.0 dBFS
  const scale = peak > 0 ? Math.min(targetPeak / peak, 2.5) : 1.0;

  // Apply subtle 50ms fade-in and 50ms fade-out, scale samples
  // At 48000 Hz stereo, 50ms = 2400 frames = 4800 samples
  const fadeFrames = 2400;
  const totalFrames = data.length / 4;
  const outBuf = Buffer.alloc(rawBuf.length);
  header.copy(outBuf, 0, 0, 44);

  let newPeak = 0;
  let newSumSq = 0;

  for (let frame = 0; frame < totalFrames; frame++) {
    let frameGain = scale;
    if (frame < fadeFrames) {
      frameGain *= (frame / fadeFrames);
    } else if (frame > totalFrames - fadeFrames) {
      frameGain *= ((totalFrames - frame) / fadeFrames);
    }

    // Left channel
    const idxL = 44 + frame * 4;
    let sL = Math.round(data.readInt16LE(idxL - 44) * frameGain);
    sL = Math.max(-32768, Math.min(32767, sL));
    outBuf.writeInt16LE(sL, idxL);

    // Right channel
    const idxR = idxL + 2;
    let sR = Math.round(data.readInt16LE(idxR - 44) * frameGain);
    sR = Math.max(-32768, Math.min(32767, sR));
    outBuf.writeInt16LE(sR, idxR);

    const absL = Math.abs(sL);
    const absR = Math.abs(sR);
    if (absL > newPeak) newPeak = absL;
    if (absR > newPeak) newPeak = absR;
    newSumSq += absL * absL + absR * absR;
  }

  fs.writeFileSync(finalWav, outBuf);

  const newRms = Math.sqrt(newSumSq / sampleCount);
  const newPeakDbfs = 20 * Math.log10(newPeak / 32768);
  const newRmsDbfs = 20 * Math.log10(newRms / 32768);
  console.log(`  Normalized: Peak ${newPeak} (${newPeakDbfs.toFixed(1)} dBFS), RMS ${newRms.toFixed(1)} (${newRmsDbfs.toFixed(1)} dBFS)`);
  console.log(`  Saved to: ${finalWav}\n`);

  fs.unlinkSync(tempMp3);
  fs.unlinkSync(rawWav);
}

console.log('All 3 auditions generated successfully.');
