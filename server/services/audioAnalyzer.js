const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { downloadsDir } = require('./youtube');

const execFileAsync = promisify(execFile);

async function extractAudioVolume(inputPath, start = 0, end = null) {
  const tmpRaw = path.join(downloadsDir, `audio-${Date.now()}.raw`);
  const durationArg = end !== null ? ['-t', String(end - start)] : [];
  const startArg = start > 0 ? ['-ss', String(start)] : [];

  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .inputOptions(startArg)
      .outputOptions([...durationArg, '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '1', '-f', 's16le'])
      .on('end', resolve)
      .on('error', (err, stdout, stderr) => {
        console.error('Audio extraction error:', err.message, stderr);
        reject(err);
      })
      .save(tmpRaw);
  });

  const buf = fs.readFileSync(tmpRaw);
  try { fs.unlinkSync(tmpRaw); } catch {}

  const samples = new Int16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2);
  const sampleRate = 44100;
  const windowSec = 0.5;
  const windowSize = Math.floor(sampleRate * windowSec);
  const rmsValues = [];

  for (let i = 0; i < samples.length; i += windowSize) {
    const chunk = samples.slice(i, i + windowSize);
    const sum = chunk.reduce((a, s) => a + s * s, 0);
    const rms = Math.sqrt(sum / chunk.length);
    rmsValues.push({ t: start + (i / sampleRate), rms });
  }

  if (rmsValues.length === 0) return { rmsValues: [], peaks: [], silenceMoments: [], rhythmChanges: [] };

  const mean = rmsValues.reduce((a, v) => a + v.rms, 0) / rmsValues.length;
  const variance = rmsValues.reduce((a, v) => a + Math.pow(v.rms - mean, 2), 0) / rmsValues.length;
  const std = Math.sqrt(variance);
  const threshold = mean + 1.2 * std;
  const silenceThreshold = mean * 0.3;

  const peaks = rmsValues.filter(v => v.rms > threshold).map(v => v.t);

  const silenceMoments = [];
  let silenceStart = null;
  for (const v of rmsValues) {
    if (v.rms < silenceThreshold) {
      if (silenceStart === null) silenceStart = v.t;
    } else {
      if (silenceStart !== null && v.t - silenceStart >= 3) {
        silenceMoments.push((silenceStart + v.t) / 2);
      }
      silenceStart = null;
    }
  }
  if (silenceStart !== null && rmsValues.length > 0 && (rmsValues[rmsValues.length - 1].t + windowSec - silenceStart) >= 3) {
    silenceMoments.push((silenceStart + rmsValues[rmsValues.length - 1].t + windowSec) / 2);
  }

  const rhythmChanges = [];
  for (let i = 1; i < rmsValues.length; i++) {
    const prev = rmsValues[i - 1].rms;
    const curr = rmsValues[i].rms;
    if (prev > 1500 && curr < 300) {
      rhythmChanges.push({ time: rmsValues[i].t, type: 'silence_after_noise', score: 25 });
    } else if (prev < 400 && curr > 2000) {
      rhythmChanges.push({ time: rmsValues[i].t, type: 'explosion_after_calm', score: 30 });
    }
  }

  return { rmsValues, peaks, silenceMoments, rhythmChanges };
}

async function detectSceneChanges(inputPath) {
  try {
    const { stderr } = await execFileAsync(ffmpegPath, [
      '-i', inputPath,
      '-filter:v', 'select=gt(scene\\,0.3)',
      '-f', 'null',
      '-'
    ], { maxBuffer: 1024 * 1024 * 10 });
    const scenes = [];
    const regex = /pts_time:([0-9.]+)/g;
    let match;
    while ((match = regex.exec(stderr)) !== null) scenes.push(parseFloat(match[1]));
    return scenes;
  } catch (e) {
    const stderr = e.stderr || '';
    const scenes = [];
    const regex = /pts_time:([0-9.]+)/g;
    let match;
    while ((match = regex.exec(stderr)) !== null) scenes.push(parseFloat(match[1]));
    return scenes;
  }
}

module.exports = {
  extractAudioVolume,
  detectSceneChanges
};
