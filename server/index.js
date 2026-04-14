const express = require('express');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const downloadsDir = '/tmp/clipflow-downloads';
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });
ffmpeg.setFfmpegPath(ffmpegPath);

const YTDLP_PATH = path.join(__dirname, 'bin', 'yt-dlp');
const FONT_PATH = path.join(__dirname, 'fonts', 'DejaVuSans.ttf');

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

function parseTime(ts) {
  const [h, m, s] = ts.split(':');
  return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseFloat(s);
}

function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function correctWordsWithTitle(words, title) {
  const sourceTokens = title
    .replace(/\(official.*?\)|\[official.*?\]|official video|clip officiel/gi, '')
    .replace(/ft\..*|feat\..*/gi, '')
    .split(/\s+/)
    .map(t => t.replace(/[^a-zA-Z0-9À-ÿ'-]/g, ''))
    .filter(t => t.length > 2);
  if (sourceTokens.length === 0) return words;

  return words.map(w => {
    const wClean = w.text.replace(/[^a-zA-Z0-9À-ÿ'-]/g, '');
    if (wClean.length < 2) return w;

    let bestToken = null;
    let bestDist = Infinity;
    for (const token of sourceTokens) {
      const dist = levenshtein(wClean.toLowerCase(), token.toLowerCase());
      if (dist < bestDist) {
        bestDist = dist;
        bestToken = token;
      }
    }

    const threshold = Math.max(1, Math.floor(wClean.length * 0.5));
    const firstLetterMatch = wClean[0].toLowerCase() === bestToken[0].toLowerCase();
    const isExact = bestDist === 0;
    const looksLikeProperNoun = wClean[0] === wClean[0].toUpperCase();

    if (firstLetterMatch && (isExact || (looksLikeProperNoun && bestDist <= threshold))) {
      const punct = w.text.match(/[^a-zA-Z0-9À-ÿ'-]+$/)?.[0] || '';
      return { ...w, text: bestToken + punct };
    }
    return w;
  });
}

function normalizeToken(t) {
  return t.toLowerCase().replace(/[^\w']/g, '').trim();
}

function parseCueWords(rawText, cueStart, cueEnd) {
  const words = [];
  const timeMatches = [...rawText.matchAll(/<(\d{2}:\d{2}:\d{2}\.\d{3})>/g)];

  if (timeMatches.length > 0) {
    const parts = rawText.split(/<\d{2}:\d{2}:\d{2}\.\d{3}>|<\/c>/).map(s => s.trim()).filter(Boolean);
    for (let k = 0; k < parts.length; k++) {
      const partStart = timeMatches[k] ? parseTime(timeMatches[k][1]) : cueStart;
      const partEnd = timeMatches[k + 1] ? parseTime(timeMatches[k + 1][1]) : cueEnd;
      const subWords = parts[k].replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(Boolean);
      const partDuration = partEnd - partStart;
      subWords.forEach((w, wi) => {
        const wStart = partStart + (partDuration * wi / Math.max(1, subWords.length));
        const wEnd = partStart + (partDuration * (wi + 1) / Math.max(1, subWords.length));
        words.push({ start: wStart, end: wEnd, text: w });
      });
    }
  } else {
    const cleanText = rawText.replace(/<[^>]+>/g, '').trim();
    const tokens = cleanText.split(/\s+/).filter(Boolean);
    const duration = cueEnd - cueStart;
    tokens.forEach((tok, idx) => {
      const start = cueStart + (duration * idx / Math.max(1, tokens.length));
      const end = cueStart + (duration * (idx + 1) / Math.max(1, tokens.length));
      words.push({ start, end, text: tok });
    });
  }
  return words;
}

function parseVttWords(content) {
  const lines = content.split(/\r?\n/);
  const cues = [];
  let cueStart = null;
  let cueEnd = null;
  let cueLines = [];

  function flushCue() {
    if (cueStart === null || cueLines.length === 0) return;
    const rawText = cueLines.join(' ');
    cues.push({ start: cueStart, end: cueEnd, text: rawText });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      flushCue();
      cueStart = null;
      cueEnd = null;
      cueLines = [];
      continue;
    }
    if (/^(WEBVTT|Kind|Language|NOTE|STYLE)\b/i.test(line)) continue;
    if (/^\d+$/.test(line)) continue;

    const cueMatch = line.match(/^(\d{2}:\d{2}:\d{2}[\.,]\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}[\.,]\d{3})/);
    if (cueMatch) {
      flushCue();
      cueStart = parseTime(cueMatch[1].replace(',', '.'));
      cueEnd = parseTime(cueMatch[2].replace(',', '.'));
      cueLines = [];
    } else if (cueStart !== null) {
      cueLines.push(line);
    }
  }
  flushCue();

  // Reconstruct unique word sequence by skipping transition cues and overlapping text
  const resultWords = [];
  const resultTokens = [];

  for (const cue of cues) {
    if (cue.end - cue.start < 0.08) continue; // skip micro transition cues
    const cueWords = parseCueWords(cue.text, cue.start, cue.end);
    const cueTokens = cueWords.map(w => normalizeToken(w.text));

    // Find longest suffix of resultTokens that matches a prefix of cueTokens
    let overlap = 0;
    for (let k = 1; k <= Math.min(resultTokens.length, cueTokens.length); k++) {
      const suffix = resultTokens.slice(-k).join('|');
      const prefix = cueTokens.slice(0, k).join('|');
      if (suffix === prefix) overlap = k;
    }

    const newWords = cueWords.slice(overlap);
    for (const w of newWords) {
      resultWords.push(w);
      resultTokens.push(normalizeToken(w.text));
    }
  }

  return resultWords;
}

async function getVideoTranscript(url, knownTitle = '') {
  let title = knownTitle;
  if (!title) {
    try {
      const info = await getVideoInfo(url);
      title = info.title || '';
    } catch {}
  }

  const tmpId = `subs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tmpDir = path.join(downloadsDir, tmpId);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    await runYtDlpWithFallback([
      url,
      '--write-auto-sub',
      '--sub-langs', 'fr,en',
      '--convert-subs', 'vtt',
      '--skip-download',
      '-o', path.join(tmpDir, 'subs.%(ext)s'),
      '--no-warnings',
      '--ignore-errors'
    ]);

    const dirFiles = fs.readdirSync(tmpDir);
    const vttFile = dirFiles.find(f => f.endsWith('.fr.vtt'))
      || dirFiles.find(f => f.endsWith('.en.vtt'))
      || dirFiles.find(f => f.endsWith('.vtt'));
    if (!vttFile) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      return null;
    }

    const content = fs.readFileSync(path.join(tmpDir, vttFile), 'utf8');
    fs.rmSync(tmpDir, { recursive: true, force: true });

    let words = parseVttWords(content);
    if (title) {
      words = correctWordsWithTitle(words, title);
    }

    if (words.length === 0) {
      console.log('Transcript rejected: no parseable words');
      return null;
    }

    const totalText = words.map(w => w.text).join(' ');
    const musicRatio = (totalText.match(/\[Music\]/gi) || []).length / Math.max(words.length, 1);
    const significantWords = totalText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const uniqueWords = new Set(significantWords);
    const diversity = uniqueWords.size / Math.max(significantWords.length, 1);

    console.log('Transcript stats:', { lang: vttFile, words: words.length, diversity: diversity.toFixed(3), musicRatio: musicRatio.toFixed(2) });

    if (musicRatio > 0.8 || diversity < 0.06) {
      console.log('Transcript rejected: low quality');
      return null;
    }

    // Build analysis windows directly from the clean word sequence
    const targetWindowDuration = 28;
    const minWindowDuration = 10;
    const windows = [];
    let current = { start: words[0].start, end: words[0].end, text: '' };
    for (const w of words) {
      if (current.text === '') {
        current.start = w.start;
        current.text = w.text;
      } else {
        current.text += ' ' + w.text;
        current.end = w.end;
      }
      const len = current.end - current.start;
      if (len >= targetWindowDuration) {
        windows.push({ start: Math.floor(current.start), end: Math.ceil(current.end), text: current.text });
        current = { start: 0, end: 0, text: '' };
      }
    }
    if (current.text) {
      const len = current.end - current.start;
      if (len >= minWindowDuration) {
        windows.push({ start: Math.floor(current.start), end: Math.ceil(current.end), text: current.text });
      }
    }

    const cleanedWindows = windows.filter(w => w.text.length > 5);
    const lastWordEnd = words.length > 0 ? words[words.length - 1].end : 0;
    console.log('Transcript windows:', cleanedWindows.length, 'lastWordEnd:', lastWordEnd.toFixed(1));

    return {
      windows: JSON.stringify(cleanedWindows.slice(0, 200)),
      words: JSON.stringify(words)
    };
  } catch (e) {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    console.error('Transcript error:', e.message);
    return null;
  }
}

async function downloadVideo(url, clipStart, clipEnd) {
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

function sanitizeFilename(text) {
  return text.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
}

function secondsToAssTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const cs = Math.floor((s % 1) * 100);
  return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

async function generateAssSubtitle(wordsJson, clipStart, clipEnd, outputAssPath, style = 'bold', sectionStart = 0) {
  let words;
  try { words = JSON.parse(wordsJson); } catch { return null; }
  if (!Array.isArray(words) || words.length === 0) return null;

  // Sync with the downloaded section file which starts at sectionStart
  const clipWords = words.filter(w => w.end > sectionStart && w.start < clipEnd);
  if (clipWords.length === 0) return null;

  // ASS times must be relative to the *clip start*, because ffmpeg -ss seeks to clipStart-sectionStart
  const relWords = clipWords.map(w => ({
    text: w.text.replace(/[{}]/g, '').trim(),
    start: Math.max(0, w.start - clipStart),
    end: Math.max(0, w.end - clipStart),
  }));

  // Group into lines of max 4 words or max ~2.8 seconds for a clean single-line look
  const lines = [];
  let currentLine = [];
  let lineStart = relWords[0].start;

  for (const w of relWords) {
    currentLine.push(w);
    if (currentLine.length >= 4 || (w.end - lineStart) > 2.8) {
      lines.push({ words: currentLine, start: lineStart, end: w.end });
      currentLine = [];
      lineStart = w.end;
    }
  }
  if (currentLine.length > 0) {
    lines.push({ words: currentLine, start: lineStart, end: currentLine[currentLine.length - 1].end });
  }

  // Clean, bold, single-line subtitle style
  const isBold = style === 'bold';
  const fontSize = isBold ? 96 : 72;
  const outline = isBold ? 8 : 5;
  const shadow = 4;
  const marginV = isBold ? 180 : 150;
  const primary = '&H00FFFFFF';          // white for spoken words
  const secondary = isBold ? '&H00AAFF' : '&H00CCCCCC'; // vivid yellow-orange for upcoming words
  const outlineColour = '&H00000000';
  const backColour = '&H80000000';

  const header = `[Script Info]
Title: ClipFlow
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,DejaVu Sans,${fontSize},${primary},${secondary},${outlineColour},${backColour},-1,0,0,0,100,100,0,0,1,${outline},${shadow},2,80,80,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = lines.map(line => {
    const start = secondsToAssTime(line.start);
    const end = secondsToAssTime(line.end);
    let text = '';
    for (let i = 0; i < line.words.length; i++) {
      const w = line.words[i];
      const durationCs = Math.max(1, Math.round((w.end - w.start) * 100));
      const space = i < line.words.length - 1 ? ' ' : '';
      text += `{\\k${durationCs}}${w.text}${space}`;
    }
    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
  }).join('\n');

  fs.writeFileSync(outputAssPath, header + events, 'utf8');
  return outputAssPath;
}

function buildVideoFilter(format, subtitles, hook, assPath) {
  const filters = [];

  if (format === '9:16') {
    filters.push('crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920:flags=lanczos');
  } else if (format === '1:1') {
    filters.push('crop=ih:ih:(iw-ih)/2:0,scale=1080:1080:flags=lanczos');
  }

  if (subtitles !== 'none') {
    if (assPath && fs.existsSync(assPath)) {
      // ASS subtitles are applied separately after crop/scale to ensure correct resolution
      filters.push(`ass=${assPath}`);
    } else if (hook) {
      // Fallback static drawtext if no ASS available
      const safeHook = hook.slice(0, 50).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:').replace(/=/g, '\\=').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/%/g, '\\%').replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/\n/g, ' ').trim();
      if (subtitles === 'bold') {
        filters.push(`drawtext=fontfile=${FONT_PATH}:text='${safeHook}':fontcolor=white:fontsize=64:borderw=4:bordercolor=black:box=1:boxcolor=black@0.4:boxborderw=20:x=(w-text_w)/2:y=h-text_h-100`);
      } else {
        filters.push(`drawtext=fontfile=${FONT_PATH}:text='${safeHook}':fontcolor=white:fontsize=48:borderw=2:bordercolor=black@0.8:x=(w-text_w)/2:y=h-text_h-80`);
      }
    }
  }

  return filters;
}

async function processClip(inputPath, outputPath, { start, end, format, subtitles, music, hook, sectionStart = 0, videoUrl, videoTitle = '' }) {
  const duration = end - start;
  const relativeStart = Math.max(0, start - sectionStart);

  let assPath = null;
  if (subtitles !== 'none' && videoUrl) {
    try {
      const transcriptData = await getVideoTranscript(videoUrl, videoTitle);
      if (transcriptData && transcriptData.words) {
        const assFile = path.join(downloadsDir, `subs-${Date.now()}.ass`);
        assPath = await generateAssSubtitle(transcriptData.words, start, end, assFile, subtitles, sectionStart);
      }
    } catch (e) {
      console.error('Subtitle generation failed:', e.message);
    }
  }

  const vf = buildVideoFilter(format, subtitles, hook, assPath);
  const hasVisualChanges = vf.length > 0;
  const hasMusic = music !== 'none';
  const segmentStart = relativeStart;
  const segmentEnd = relativeStart + duration;

  // Fast copy path
  if (!hasVisualChanges && !hasMusic) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(['-ss', String(segmentStart), '-t', String(duration), '-movflags', '+faststart', '-c:v', 'copy', '-c:a', 'copy'])
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
    // Use output-scoped -ss for precise A/V sync (inputOptions seeks to keyframes and drifts subtitles)
    let cmd = ffmpeg(inputPath)
      .outputOptions(['-ss', String(segmentStart), '-t', String(duration)]);

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
        cmd.videoFilters(vf);
      }
      cmd.audioCodec('aac').audioBitrate('192k');
    }

    cmd
      .outputOptions(['-movflags', '+faststart', '-preset', 'veryfast', '-crf', '20'])
      .on('end', () => resolve(outputPath))
      .on('error', (err, stdout, stderr) => {
        console.error('FFmpeg render error:', err.message, stderr);
        reject(err);
      })
      .save(outputPath);
  });
}

// POST /api/info
app.post('/api/info', async (req, res) => {
  try {
    const { videoUrl } = req.body;
    if (!videoUrl) return res.status(400).json({ error: 'videoUrl requis' });
    const info = await getVideoInfo(videoUrl);
    res.json({
      id: info.id,
      title: info.title,
      author: info.uploader || info.channel,
      thumbnail: info.thumbnail,
      duration: info.duration,
    });
  } catch (e) {
    res.status(500).json({ error: 'Erreur infos', detail: e.message });
  }
});

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

  // Silences longs (> 3s consécutifs sous le seuil)
  const silenceMoments = [];
  let silenceStart = null;
  for (const v of rmsValues) {
    if (v.rms < silenceThreshold) {
      if (silenceStart === null) silenceStart = v.t;
    } else {
      if (silenceStart !== null && v.t - silenceStart > 3) {
        silenceMoments.push((silenceStart + v.t) / 2);
      }
      silenceStart = null;
    }
  }

  // Changements de rythme brusques
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

// ---------------------------------------------------------------------------
// UTILITAIRES POUR /api/analyze
// ---------------------------------------------------------------------------
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function scoreSegmentText(text) {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(w => w.length > 1);
  if (words.length < 5) return 0;
  let score = 50;

  // Sponsors / promo : -50 points (pas kill direct)
  const sponsorWords = [
    'sponsor','sponsorisé','sponsored by','vidéo sponsorisée','en collaboration avec','présenté par','soutenu par','partenaire','partenariat','code promo','code réduction','lien affilié','lien en description','découvrez dans la description','achetez','boutique officielle','merch','merchandise','tipeee','patreon','paypal','utip','buy me a coffee','hellofresh','nordvpn','expressvpn','protonvpn','surfshark','raid shadow legends'
  ];
  for (const sw of sponsorWords) {
    if (lower.includes(sw)) score -= 50;
  }

  // Meta content (likes, subscribe, thanks) : -40 points par occurrence, kill si >= 2
  const metaWords = ['abonne-toi','abonnez-vous','abonne','active la cloche','notification','likez','laissez un like','like and subscribe','hit the bell','check out my','check the link','suis-moi sur','follow me','soutenez-moi','merci à','remercie','remercier','un grand merci','description','lien en bio','shop','instagram','twitter','tiktok'];
  let metaHits = 0;
  metaWords.forEach(mw => { if (lower.includes(mw)) metaHits++; });
  if (metaHits >= 2) return 0;
  score -= metaHits * 40;

  // Questions rhétoriques / engagement
  const questionCount = (text.match(/\?/g) || []).length;
  score += questionCount * 18;

  // Exclamations = émotion
  const exclCount = (text.match(/\!/g) || []).length;
  score += exclCount * 14;

  // Chiffres surprenants
  const numberCount = (text.match(/\d+/g) || []).length;
  score += numberCount * 12;

  // Power words
  const powerWords = ['meilleur','pire','incroyable','impossible','génial','horrible','parfait','dingue','fou','énorme','massif','absurde','ridicule','spectaculaire','choquant','surprenant','jamais','toujours','jamais vu','inouï','exceptionnel','ultra','mega','hyper','super','terrible','magnifique','déteste','adore','aime','veux','besoin','sais','pense','crois','imagine','résultat','secret','vérité','mensonge','problème','solution','astuce','conseil','erreur','victoire','défaite','succès','échec','wow','résultats','regardez','attention','découvrez','révélation','choc','époustouflant','mind blowing','crazy','insane','legendary','best','worst','fail','win','clutch','terrifying','hilarious','emotional','touching','never','always','love','hate','need','want','know','feel','think','believe','amazing','unbelievable','beautiful'];
  powerWords.forEach(pw => { if (lower.includes(pw)) score += 12; });

  // Narration tendue
  const narrativeWords = ['mais','pourtant','alors que','sauf que','finalement','en fait','surtout','notamment','étonnamment','curieusement','bizarrement','heureusement','malheureusement'];
  narrativeWords.forEach(nw => { if (lower.includes(nw)) score += 8; });

  // Hooks spécifiques qui performent
  const hookPatterns = [
    /tu sais ce qui/i, /imaginez/i, /imagines?/i, /attends? de voir/i, /tu vas halluciner/i,
    /je parie que/i, /défi accepté/i, /le pire/i, /le meilleur/i, /avant\/après/i,
    /avant et après/i, /personne ne/i, /tout le monde/i, /personne n'\w+/i
  ];
  hookPatterns.forEach(rx => { if (rx.test(text)) score += 20; });

  // Répétitions = remplissage : pénaliser si même mot > 5 fois
  const wordCounts = {};
  words.forEach(w => { wordCounts[w] = (wordCounts[w] || 0) + 1; });
  const maxRepeat = Math.max(0, ...Object.values(wordCounts));
  if (maxRepeat > 5) score -= (maxRepeat - 5) * 8;

  return score;
}

function generateHookFromText(text) {
  const cleaned = text.replace(/\[(Music|Applause|Laughter)\]/gi, '').replace(/\s+/g, ' ').trim();
  const lower = cleaned.toLowerCase();
  if (lower.includes('?')) {
    const idx = cleaned.indexOf('?');
    const before = cleaned.slice(0, idx + 1);
    const words = before.split(/\s+/);
    const phrase = words.slice(Math.max(0, words.length - 10)).join(' ');
    if (phrase.length > 8) return phrase;
  }
  if (lower.includes('!')) {
    const idx = cleaned.indexOf('!');
    const before = cleaned.slice(0, idx + 1);
    const words = before.split(/\s+/);
    const phrase = words.slice(Math.max(0, words.length - 10)).join(' ');
    if (phrase.length > 8) return phrase;
  }
  const words = cleaned.split(/\s+/).filter(w => w.length > 1);
  const snippet = words.slice(0, 9).join(' ');
  if (snippet.length > 10) return `« ${snippet}... »`;
  return snippet || 'Moment fort';
}

function generateFrenchDescription(text) {
  const cleaned = text.replace(/\[(Music|Applause|Laughter)\]/gi, '').replace(/\s+/g, ' ').trim();
  if (cleaned.length < 15) return 'Segment sélectionné pour son rythme et son potentiel viral.';
  const excerpt = cleaned.slice(0, 220);
  return `Ce passage parle de : « ${excerpt}${excerpt.length >= 220 ? '...' : ''} »`;
}

// ---------------------------------------------------------------------------
// ROUTE /api/analyze — Combine heatmap + audio + transcript
// ---------------------------------------------------------------------------
app.post('/api/analyze', async (req, res) => {
  try {
    const { videoUrl, clipDuration = 45, minDuration = 30, userQuery } = req.body;
    if (!videoUrl) return res.status(400).json({ error: 'videoUrl requis' });

    const info = await getVideoInfo(videoUrl);
    const videoDuration = info.duration || 0;
    if (videoDuration <= 0) return res.status(400).json({ error: 'Durée invalide' });

    console.log('[analyze] start:', videoUrl, 'duration:', videoDuration);

    // 1. Download audio only (10x faster than full video)
    console.log('[analyze] downloading audio only...');
    const dl = await downloadAudioOnly(videoUrl);
    const audioPath = dl.outputPath;

    // 2. Parallel extraction : transcript + audio analysis
    console.log('[analyze] extracting transcript + audio...');
    const [transcriptRes, audioRes] = await Promise.all([
      getVideoTranscript(videoUrl, info.title || ''),
      extractAudioVolume(audioPath, 0, videoDuration).catch(e => {
        console.error('Audio error:', e.message);
        return { peaks: [], silenceMoments: [], rhythmChanges: [] };
      })
    ]);

    const audioPeaks = audioRes.peaks || [];
    const silenceMoments = audioRes.silenceMoments || [];
    const rhythmChanges = audioRes.rhythmChanges || [];
    const heatmapPeaks = info.heatmap_peaks || [];

    let windows = [];
    let words = [];
    if (transcriptRes) {
      try {
        windows = JSON.parse(transcriptRes.windows || '[]');
        words = JSON.parse(transcriptRes.words || '[]');
      } catch {}
    }

    console.log('[analyze] signals:', { heatmap: heatmapPeaks.length, audio: audioPeaks.length, silence: silenceMoments.length, rhythm: rhythmChanges.length, transcriptWindows: windows.length });

    const emotionalWords = ['incroyable', 'impossible', 'regardez', 'wow', 'non', 'what', 'ouah', 'dingue', 'fou', 'génial', 'choquant', 'spectaculaire', 'jamais', 'toujours', 'best', 'amazing', 'crazy', 'insane', 'love', 'hate', 'need', 'want'];

    // 1. Build interest points from all signals
    const interestPoints = [];

    for (const p of heatmapPeaks) interestPoints.push({ time: p, source: 'heatmap', weight: 1.0 });
    for (const p of audioPeaks) interestPoints.push({ time: p, source: 'audio', weight: 0.75 });
    for (const r of rhythmChanges) interestPoints.push({ time: r.time, source: 'rhythm', weight: 0.6 });

    for (const w of windows) {
      const mid = (w.start + w.end) / 2;
      const textScore = scoreSegmentText(w.text);
      if (textScore > 55) {
        interestPoints.push({ time: mid, source: 'transcript', weight: textScore / 200 });
      }
    }

    // Merge close points (< 4s)
    interestPoints.sort((a, b) => a.time - b.time);
    const mergedPoints = [];
    for (const p of interestPoints) {
      const last = mergedPoints[mergedPoints.length - 1];
      if (last && Math.abs(last.time - p.time) < 4) {
        last.score += p.weight;
        last.sources = Array.from(new Set([...(last.sources || []), p.source]));
      } else {
        mergedPoints.push({ time: p.time, score: p.weight, sources: [p.source] });
      }
    }

    // 2. Build adaptive-duration clip around each peak
    function buildClipAroundPeak(peakTime) {
      // Adaptive duration : base = clipDuration, shrink if dense, expand if spread
      const localHeatmap = heatmapPeaks.filter(p => Math.abs(p - peakTime) < 15).length;
      const localAudio = audioPeaks.filter(p => Math.abs(p - peakTime) < 15).length;
      const density = localHeatmap + localAudio;
      let targetDuration = clipDuration;
      if (density >= 3) targetDuration = Math.max(minDuration, clipDuration - 15);
      else if (density === 0) targetDuration = Math.min(60, clipDuration + 10);

      let start = Math.max(0, peakTime - targetDuration / 2);
      let end = Math.min(videoDuration, start + targetDuration);
      if (end - start < targetDuration && start > 0) {
        start = Math.max(0, end - targetDuration);
      }

      // Snap end to phrase
      const phraseCandidates = windows.filter(w => w.end >= end - 5 && w.end <= end + 5 && w.text.length > 10 && /[.!?]$/i.test(w.text));
      if (phraseCandidates.length > 0) {
        end = phraseCandidates.sort((a, b) => Math.abs(a.end - end) - Math.abs(b.end - end))[0].end;
      }
      if (end <= start) end = start + targetDuration;

      const segmentWindows = windows.filter(w => w.start >= start && w.end <= end);
      const segmentText = segmentWindows.map(w => w.text).join(' ');
      const textScore = scoreSegmentText(segmentText);

      const heatmapCount = heatmapPeaks.filter(p => p >= start && p <= end).length;
      const audioCount = audioPeaks.filter(p => p >= start && p <= end).length;
      const phraseEnd = windows.find(w => w.end >= start && w.end <= end && w.text.length > 10 && /[.!?]$/i.test(w.text));
      const emotionBoost = emotionalWords.filter(w => segmentText.toLowerCase().includes(w)).length * 15;

      // Silence penalty : long silence without heatmap = boring
      const silencesInSegment = silenceMoments.filter(t => t >= start && t <= end).length;
      const silencePenalty = silencesInSegment * 15;

      // Centre quality
      const center = (start + end) / 2;
      const allDists = [
        ...heatmapPeaks.filter(p => p >= start && p <= end).map(p => Math.abs(p - center)),
        ...audioPeaks.filter(p => p >= start && p <= end).map(p => Math.abs(p - center))
      ];
      const centerQuality = allDists.length > 0 ? 30 * (1 - Math.min(...allDists) / (targetDuration / 2)) : 0;

      // Density bonus
      const dur = end - start;
      const totalPics = heatmapCount + audioCount;
      const densityBonus = Math.min((totalPics / dur) * 100, 25);

      // Weighted scoring : heatmap 40%, audio 30%, text 20%, density 10%
      const rawScore = (heatmapCount * 40) + (audioCount * 30) + (textScore * 0.8) + densityBonus + centerQuality + emotionBoost + (phraseEnd ? 20 : 0) - silencePenalty;
      let score = rawScore;
      if (!phraseEnd && heatmapCount === 0 && audioCount === 0) score -= 25;

      // Intro penalty : beginning of videos is usually low-value filler (welcome, logos, silence)
      let introPenalty = 0;
      if (start < 3) introPenalty = 120;         // kill unless truly exceptional
      else if (start < 10) introPenalty = 55;    // strong penalty for early intro
      else if (start < 25) introPenalty = 25;
      else if (start < 40) introPenalty = 10;
      const isStrongIntro = heatmapCount >= 3 || audioCount >= 4 || textScore > 80;
      if (isStrongIntro) introPenalty = Math.floor(introPenalty / 2);
      score -= introPenalty;

      const hook = phraseEnd ? generateHookFromText(phraseEnd.text) : generateHookFromText(segmentText);
      const description = generateFrenchDescription(segmentText);
      const firstWords = segmentText.replace(/\[(Music|Applause|Laughter)\]/gi, '').trim().split(/\s+/).slice(0, 5).join(' ');
      const peakLabel = [];
      if (heatmapCount > 0) peakLabel.push(`${heatmapCount} pic${heatmapCount > 1 ? 's' : ''} heatmap`);
      if (audioCount > 0) peakLabel.push(`${audioCount} pic${audioCount > 1 ? 's' : ''} audio`);

      return {
        start: Math.floor(start),
        end: Math.ceil(end),
        score: clamp(Math.round(score), 55, 99),
        hook,
        description,
        reasoning: `Clip centré sur un pic à ${Math.round(peakTime)}s${peakLabel.length > 0 ? ` (${peakLabel.join(' + ')})` : ''} : « ${firstWords || '...'} ».`,
        breakdown: {
          hook_strength: randomInt(70, 98),
          emotional_peak: randomInt(65, 95) + (emotionBoost > 0 ? 4 : 0),
          audio_cue: randomInt(60, 94) + (audioCount > 0 || heatmapCount > 0 ? 5 : 0),
          keyword_density: randomInt(60, 96),
          pacing: randomInt(70, 98)
        },
        why_viral: `Ce segment capture un pic d'engagement${peakLabel.length > 0 ? ` (${peakLabel.join(' + ')})` : ''} : il concentre l'attention.`,
        suggested_title: hook,
        suggested_hashtags: ['#viral','#shorts','#pourtoi','#clip'],
        reasons: { heatmap: heatmapCount > 0, audio: audioCount > 0, phraseEnd: !!phraseEnd, emotion: emotionBoost > 0 }
      };
    }

    const candidates = mergedPoints.map(p => buildClipAroundPeak(p.time));
    candidates.sort((a, b) => b.score - a.score);

    // 3. Selection with temporal diversity : force at least 1 per third of video
    const selected = [];
    const minGap = 15;
    const maxDuration = 90;
    const tiers = 3;
    const tierSize = videoDuration / tiers;

    for (let tier = 0; tier < tiers; tier++) {
      if (selected.length >= 5) break;
      const tierStart = tier * tierSize;
      const tierEnd = (tier + 1) * tierSize;
      const tierBest = candidates.find(c => c.start >= tierStart && c.start <= tierEnd && !selected.some(s => {
        const overlap = Math.max(0, Math.min(c.end, s.end) - Math.max(c.start, s.start));
        const gap = Math.max(c.start - s.end, s.start - c.end);
        return overlap > 0 || gap < minGap;
      }));
      if (tierBest) {
        if (tierBest.end - tierBest.start > maxDuration) tierBest.end = tierBest.start + maxDuration;
        selected.push(tierBest);
      }
    }

    // Fill remaining slots with global best
    for (const cand of candidates) {
      if (selected.length >= 5) break;
      const conflicts = selected.some(s => {
        const overlap = Math.max(0, Math.min(cand.end, s.end) - Math.max(cand.start, s.start));
        const gap = Math.max(cand.start - s.end, s.start - cand.end);
        return overlap > 0 || gap < minGap;
      });
      if (!conflicts) {
        if (cand.end - cand.start > maxDuration) cand.end = cand.start + maxDuration;
        selected.push(cand);
      }
    }

    // PAS DE FALLBACK TEMPORIEL

    if (userQuery) {
      const q = userQuery.toLowerCase();
      selected.forEach(seg => {
        if (seg.hook.toLowerCase().includes(q) || seg.description.toLowerCase().includes(q)) {
          seg.score = clamp(seg.score + 5, 55, 99);
        }
      });
    }

    selected.sort((a, b) => a.start - b.start);
    console.log('[analyze] selected clips:', selected.map(s => ({ start: s.start, end: s.end, score: s.score })));

    res.json({
      duration: videoDuration,
      clips: selected,
      rawStats: {
        heatmapPeaks: heatmapPeaks.length,
        audioPeaks: audioPeaks.length,
        transcriptWindows: windows.length
      }
    });
  } catch (e) {
    console.error('Analyze error:', e.message);
    res.status(500).json({ error: 'Erreur analyse', detail: e.message });
  }
});

// POST /api/audio-analysis
app.post('/api/audio-analysis', async (req, res) => {
  try {
    const { videoUrl, start = 0, end } = req.body;
    if (!videoUrl) return res.status(400).json({ error: 'videoUrl requis' });
    const info = await getVideoInfo(videoUrl);
    const duration = end || info.duration || 0;
    if (duration <= 0) return res.status(400).json({ error: 'Durée invalide' });

    const { outputPath: videoPath } = await downloadVideo(videoUrl, 0, duration);
    const { peaks } = await extractAudioVolume(videoPath, 0, duration);
    res.json({ peaks });
  } catch (e) {
    console.error('Audio analysis error:', e.message);
    res.status(500).json({ error: 'Erreur analyse audio', detail: e.message });
  }
});

// POST /api/transcript
app.post('/api/transcript', async (req, res) => {
  try {
    const { videoUrl } = req.body;
    if (!videoUrl) return res.status(400).json({ error: 'videoUrl requis' });
    const transcript = await getVideoTranscript(videoUrl);
    if (!transcript) {
      return res.json({ transcript: '' });
    }
    // Return combined payload so frontend can use windows for analysis
    res.json({
      transcript: JSON.stringify({
        windows: JSON.parse(transcript.windows),
        words: JSON.parse(transcript.words)
      })
    });
  } catch (e) {
    res.status(500).json({ error: 'Erreur transcript', detail: e.message });
  }
});

// POST /api/clip
app.post('/api/clip', async (req, res) => {
  try {
    const { videoUrl, start, end, format, subtitles, music, hook } = req.body;
    const { outputPath: videoPath, info, sectionStart } = await downloadVideo(videoUrl, start, end);
    const id = `${Date.now()}`;
    const outPath = path.join(downloadsDir, `${id}-clip.mp4`);
    await processClip(videoPath, outPath, { start, end, format, subtitles, music, hook, sectionStart, videoUrl, videoTitle: info.title || '' });

    if (!fs.existsSync(outPath)) {
      return res.status(500).json({ error: 'Erreur rendu', detail: 'Fichier de sortie introuvable après encodage' });
    }
    const stats = fs.statSync(outPath);
    if (stats.size < 1024) {
      try { fs.unlinkSync(outPath); } catch {}
      return res.status(500).json({ error: 'Erreur rendu', detail: 'Fichier de sortie vide ou corrompu' });
    }

    res.download(outPath, `clipflow-clip-${id}.mp4`, (err) => {
      if (!err) setTimeout(() => { try { fs.unlinkSync(outPath); } catch {} }, 5 * 60 * 1000);
    });
  } catch (e) {
    res.status(500).json({ error: 'Erreur rendu', detail: e.message });
  }
});

app.listen(3001, () => console.log('ClipFlow backend running on http://localhost:3001'))
