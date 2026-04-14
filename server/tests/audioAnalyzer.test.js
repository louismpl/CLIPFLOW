const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { extractAudioVolume } = require('../services/audioAnalyzer');

ffmpeg.setFfmpegPath(ffmpegPath);

function createTestWav(durationSec, amplitudeFn) {
  const sampleRate = 44100;
  const numSamples = sampleRate * durationSec;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const val = Math.max(-32768, Math.min(32767, Math.round(amplitudeFn(i / sampleRate))));
    buffer.writeInt16LE(val, 44 + i * 2);
  }

  const tmpFile = path.join('/tmp', `test-audio-${Date.now()}.wav`);
  fs.writeFileSync(tmpFile, buffer);
  return tmpFile;
}

describe('audioAnalyzer', () => {
  test('detects peaks in high-volume audio', async () => {
    // Mostly silent with a short loud burst so mean stays low and threshold captures the burst
    const wavFile = createTestWav(2, (t) => {
      if (t < 1.7) return 5; // near silence
      return Math.sin(t * Math.PI * 2 * 1000) * 32000; // loud
    });

    const result = await extractAudioVolume(wavFile, 0, 2);
    fs.unlinkSync(wavFile);

    expect(result.peaks.length).toBeGreaterThan(0);
    expect(result.peaks.some(p => p >= 1.5)).toBe(true);
    expect(result.rmsValues.length).toBeGreaterThan(0);
  });

  test('detects silence moments', async () => {
    const wavFile = createTestWav(5, (t) => {
      if (t < 2) return Math.sin(t * Math.PI * 2 * 500) * 25000; // loud
      return 5; // silence (>3s)
    });

    const result = await extractAudioVolume(wavFile, 0, 5);
    fs.unlinkSync(wavFile);

    expect(result.silenceMoments.length).toBeGreaterThan(0);
    expect(result.silenceMoments.some(s => s > 2.5 && s < 4)).toBe(true);
  });

  test('detects rhythm changes', async () => {
    const wavFile = createTestWav(3, (t) => {
      if (t < 1.5) return 5;
      return Math.sin(t * Math.PI * 2 * 800) * 25000;
    });

    const result = await extractAudioVolume(wavFile, 0, 3);
    fs.unlinkSync(wavFile);

    expect(result.rhythmChanges.length).toBeGreaterThan(0);
    expect(result.rhythmChanges.some(r => r.type === 'explosion_after_calm')).toBe(true);
  });

  test('returns empty peaks for fully silent audio', async () => {
    const wavFile = createTestWav(1, () => 5);
    const result = await extractAudioVolume(wavFile, 0, 1);
    fs.unlinkSync(wavFile);

    expect(result.peaks.length).toBe(0);
    expect(result.silenceMoments.length).toBe(0);
    expect(result.rmsValues.length).toBeGreaterThan(0);
  });

  test('rejects gracefully for missing file', async () => {
    await expect(extractAudioVolume('/nonexistent/file.wav', 0, 1)).rejects.toThrow();
  });
});
