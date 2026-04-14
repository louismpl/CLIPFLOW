const fs = require('fs');
const path = require('path');
const { runYtDlpWithFallback, getVideoInfo, downloadsDir } = require('./youtube');

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

  const resultWords = [];
  const resultTokens = [];

  for (const cue of cues) {
    if (cue.end - cue.start < 0.08) continue;
    const cueWords = parseCueWords(cue.text, cue.start, cue.end);
    const cueTokens = cueWords.map(w => normalizeToken(w.text));

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

module.exports = {
  parseTime,
  levenshtein,
  correctWordsWithTitle,
  normalizeToken,
  parseCueWords,
  parseVttWords,
  getVideoTranscript
};
