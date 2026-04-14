const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execFileAsync = promisify(execFile);

const downloadsDir = '/tmp/clipflow-downloads';
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

const YTDLP_PATH = path.join(__dirname, '..', 'bin', 'yt-dlp');

async function runYtDlp(args) {
  const fullArgs = [
    '--js-runtimes', 'node',
    '--user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    ...args
  ];
  const { stdout } = await execFileAsync(YTDLP_PATH, fullArgs, { maxBuffer: 1024 * 1024 * 20 });
  return stdout.trim();
}

async function runYtDlpWithFallback(args, extraCookieArgs = []) {
  try {
    return await runYtDlp(args);
  } catch (err) {
    const msg = (err.stderr || err.message || '').toString();
    if (msg.includes("Sign in to confirm you're not a bot")) {
      console.log('[yt-dlp] Bot block detected, trying Chrome cookies fallback...');
      try {
        const cookieArgs = [
          '--cookies-from-browser', 'chrome',
          ...extraCookieArgs,
          ...args
        ];
        const { stdout } = await execFileAsync(YTDLP_PATH, cookieArgs, { maxBuffer: 1024 * 1024 * 20 });
        return stdout.trim();
      } catch (cookieErr) {
        throw cookieErr;
      }
    }
    throw err;
  }
}

function extractHeatmapPeaks(info) {
  const heatmap = info.heatmap;
  if (!Array.isArray(heatmap) || heatmap.length === 0) return [];
  const values = heatmap.map(h => h.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
  const threshold = mean + 1.0 * std;
  return heatmap
    .filter(h => h.value > threshold)
    .map(h => Math.floor(h.start_time + (h.end_time - h.start_time) / 2));
}

async function getVideoInfo(url) {
  const json = await runYtDlpWithFallback([
    url,
    '--dump-json',
    '--no-download',
    '--ignore-no-formats-error'
  ]);
  const info = JSON.parse(json);
  info.heatmap_peaks = extractHeatmapPeaks(info);
  return info;
}

async function downloadVideo(url, clipStart, clipEnd, ffmpegPath) {
  const info = await getVideoInfo(url);
  const id = info.id;

  if (typeof clipStart === 'number' && typeof clipEnd === 'number') {
    const margin = 5;
    const sectionStart = Math.max(0, Math.floor(clipStart - margin));
    const sectionEnd = Math.ceil(clipEnd + margin);
    const sectionPath = path.join(downloadsDir, `${id}_${sectionStart}_${sectionEnd}.mp4`);
    if (fs.existsSync(sectionPath)) return { outputPath: sectionPath, info, sectionStart };

    await runYtDlpWithFallback([
      url,
      '-f', 'bestvideo[height<=1080]+bestaudio/bestvideo+bestaudio/best',
      '--download-sections', `*${sectionStart}-${sectionEnd}`,
      '--recode-video', 'mp4',
      '--ffmpeg-location', ffmpegPath,
      '-o', sectionPath,
      '--no-warnings'
    ]);
    return { outputPath: sectionPath, info, sectionStart };
  }

  const outputPath = path.join(downloadsDir, `${id}.mp4`);
  if (fs.existsSync(outputPath)) return { outputPath, info, sectionStart: 0 };

  await runYtDlpWithFallback([
    url,
    '-f', 'best[ext=mp4]/best',
    '-o', outputPath,
    '--no-warnings'
  ]);
  return { outputPath, info, sectionStart: 0 };
}

async function downloadAudioOnly(url) {
  const info = await getVideoInfo(url);
  const id = info.id;
  const outputPath = path.join(downloadsDir, `${id}.audio.webm`);
  if (fs.existsSync(outputPath)) return { outputPath, info };

  await runYtDlpWithFallback([
    url,
    '-f', 'bestaudio/best',
    '-o', outputPath,
    '--no-warnings'
  ]);
  return { outputPath, info };
}

module.exports = {
  runYtDlp,
  runYtDlpWithFallback,
  extractHeatmapPeaks,
  getVideoInfo,
  downloadVideo,
  downloadAudioOnly,
  downloadsDir,
  YTDLP_PATH
};
