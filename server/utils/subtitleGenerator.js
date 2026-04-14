const fs = require('fs');
const path = require('path');

const FONT_PATH = path.join(__dirname, '..', 'fonts', 'DejaVuSans.ttf');

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

  const clipWords = words.filter(w => w.end > sectionStart && w.start < clipEnd);
  if (clipWords.length === 0) return null;

  const relWords = clipWords.map(w => ({
    text: w.text.replace(/[{}]/g, '').trim(),
    start: Math.max(0, w.start - clipStart),
    end: Math.max(0, w.end - clipStart),
  }));

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

  const isBold = style === 'bold';
  const fontSize = isBold ? 96 : 72;
  const outline = isBold ? 8 : 5;
  const shadow = 4;
  const marginV = isBold ? 180 : 150;
  const primary = '&H00FFFFFF';
  const secondary = isBold ? '&H00AAFF' : '&H00CCCCCC';
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
      filters.push(`ass=${assPath}`);
    } else if (hook) {
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

module.exports = {
  secondsToAssTime,
  generateAssSubtitle,
  buildVideoFilter
};
