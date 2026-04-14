const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { getVideoTranscript } = require('../services/transcript');
const { generateAssSubtitle, buildVideoFilter } = require('./subtitleGenerator');
const { downloadsDir } = require('../services/youtube');

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

module.exports = {
  processClip
};
