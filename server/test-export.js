const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

const downloadsDir = '/tmp/clipflow-downloads';
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });
ffmpeg.setFfmpegPath(ffmpegPath);

const YTDLP_PATH = path.join('/Users/louishauguel/Downloads/CLIPFLOW-APP/server', 'bin', 'yt-dlp');
const FONT_PATH = path.join('/Users/louishauguel/Downloads/CLIPFLOW-APP/server', 'fonts', 'DejaVuSans.ttf');

async function runYtDlp(args) {
  const { stdout } = await execFileAsync(YTDLP_PATH, args, { maxBuffer: 1024 * 1024 * 20 });
  return stdout.trim();
}

async function getVideoInfo(url) {
  const json = await runYtDlp([url, '--dump-json', '--no-download']);
  return JSON.parse(json);
}

async function downloadVideo(url, clipStart, clipEnd) {
  const info = await getVideoInfo(url);
  const id = info.id;
  const margin = 5;
  const sectionStart = Math.max(0, Math.floor(clipStart - margin));
  const sectionEnd = Math.ceil(clipEnd + margin);
  const sectionPath = path.join(downloadsDir, `${id}_${sectionStart}_${sectionEnd}.mp4`);
  if (fs.existsSync(sectionPath)) return { outputPath: sectionPath, info };

  await runYtDlp([
    url,
    '-f', 'bestvideo[height<=1080]+bestaudio/bestvideo+bestaudio/best',
    '--download-sections', `*${sectionStart}-${sectionEnd}`,
    '--recode-video', 'mp4',
    '--ffmpeg-location', ffmpegPath,
    '-o', sectionPath,
    '--no-warnings'
  ]);
  return { outputPath: sectionPath, info };
}

function sanitizeDrawtext(text) {
  return text
    .slice(0, 50)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/=/g, '\\=')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/%/g, '\\%')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\n/g, ' ')
    .trim();
}

function buildVideoFilter(format, subtitles, hook) {
  const filters = [];
  if (format === '9:16') {
    filters.push('crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920:flags=lanczos');
  } else if (format === '1:1') {
    filters.push('crop=ih:ih:(iw-ih)/2:0,scale=1080:1080:flags=lanczos');
  }

  if (subtitles !== 'none' && hook) {
    const safeHook = sanitizeDrawtext(hook);
    console.log('DRAWTEXT hook:', safeHook);
    console.log('FONT exists:', fs.existsSync(FONT_PATH));
    if (subtitles === 'bold') {
      filters.push(`drawtext=fontfile=${FONT_PATH}:text='${safeHook}':fontcolor=white:fontsize=64:borderw=4:bordercolor=black:box=1:boxcolor=black@0.4:boxborderw=20:x=(w-text_w)/2:y=h-text_h-100`);
    } else {
      filters.push(`drawtext=fontfile=${FONT_PATH}:text='${safeHook}':fontcolor=white:fontsize=48:borderw=2:bordercolor=black@0.8:x=(w-text_w)/2:y=h-text_h-80`);
    }
  }

  return filters;
}

async function processClip(inputPath, outputPath, { start, end, format, subtitles, music, hook }) {
  const duration = end - start;
  const vf = buildVideoFilter(format, subtitles, hook);
  const hasVisualChanges = vf.length > 0;
  const hasMusic = music !== 'none';

  if (!hasVisualChanges && !hasMusic) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(start)
        .duration(duration)
        .outputOptions(['-c:v', 'copy', '-c:a', 'copy', '-movflags', '+faststart'])
        .on('end', () => resolve(outputPath))
        .on('error', (err, stdout, stderr) => {
          console.error('FFmpeg copy error:', err.message, stderr);
          reject(err);
        })
        .save(outputPath);
    });
  }

  const vfChain = vf.length ? vf.join(',') : 'copy';

  return new Promise((resolve, reject) => {
    let cmd = ffmpeg(inputPath).setStartTime(start).duration(duration);

    if (hasMusic) {
      const freq = music === 'electro' ? 220 : music === 'lofi' ? 330 : 440;
      cmd
        .input(`aevalsrc=0.3*sin(2*PI*${freq}*t):s=48000:c=stereo`)
        .inputFormat('lavfi')
        .complexFilter([
          `[0:v]${vfChain}[vout];`,
          `[0:a:0]volume=0.9[a0];`,
          `[1:a]volume=0.15[a1];`,
          `[a0][a1]amix=inputs=2:duration=first:dropout_transition=3[aout]`
        ].join(''))
        .map('[vout]')
        .map('[aout]')
        .videoCodec('libx264')
        .audioCodec('aac')
        .audioBitrate('192k');
    } else {
      if (hasVisualChanges) {
        console.log('Applying videoFilters:', JSON.stringify(vf));
        cmd.videoFilters(vf);
      }
      cmd.audioCodec('aac').audioBitrate('192k');
    }

    cmd
      .outputOptions(['-preset', 'veryfast', '-crf', '20', '-movflags', '+faststart'])
      .on('end', () => resolve(outputPath))
      .on('error', (err, stdout, stderr) => {
        console.error('FFmpeg render error:', err.message, stderr);
        reject(err);
      })
      .save(outputPath);
  });
}

(async () => {
  try {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const start = 42;
    const end = 67;
    console.log('Downloading...');
    const { outputPath } = await downloadVideo(url, start, end);
    console.log('Downloaded to', outputPath);
    const outPath = path.join(downloadsDir, `test-sub-${Date.now()}.mp4`);
    console.log('Rendering with subtitles to', outPath);
    await processClip(outputPath, outPath, {
      start, end, format: '16:9', subtitles: 'bold', music: 'none',
      hook: "L'instant où tout bascule !"
    });
    const stats = fs.statSync(outPath);
    console.log('Success! Size:', stats.size);
  } catch (e) {
    console.error('FAILED:', e.message);
  }
})();
