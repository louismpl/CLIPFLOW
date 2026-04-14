const express = require('express');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

const { getVideoInfo, downloadVideo, downloadAudioOnly, downloadsDir } = require('./services/youtube');
const { getVideoTranscript } = require('./services/transcript');
const { extractAudioVolume } = require('./services/audioAnalyzer');
const { selectClips } = require('./services/segmentSelector');
const { processClip } = require('./utils/videoExporter');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });
ffmpeg.setFfmpegPath(ffmpegPath);

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

// POST /api/analyze
app.post('/api/analyze', async (req, res) => {
  try {
    const { videoUrl, clipDuration = 45, minDuration = 30, userQuery } = req.body;
    if (!videoUrl) return res.status(400).json({ error: 'videoUrl requis' });

    const info = await getVideoInfo(videoUrl);
    const videoDuration = info.duration || 0;
    if (videoDuration <= 0) return res.status(400).json({ error: 'Durée invalide' });

    console.log('[analyze] start:', videoUrl, 'duration:', videoDuration);

    console.log('[analyze] downloading audio only...');
    const dl = await downloadAudioOnly(videoUrl);
    const audioPath = dl.outputPath;

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
    if (transcriptRes) {
      try {
        windows = JSON.parse(transcriptRes.windows || '[]');
      } catch {}
    }

    console.log('[analyze] signals:', { heatmap: heatmapPeaks.length, audio: audioPeaks.length, silence: silenceMoments.length, rhythm: rhythmChanges.length, transcriptWindows: windows.length });

    const clips = selectClips({
      videoDuration,
      clipDuration,
      minDuration,
      heatmapPeaks,
      audioPeaks,
      silenceMoments,
      rhythmChanges,
      windows,
      userQuery
    });

    console.log('[analyze] selected clips:', clips.map(s => ({ start: s.start, end: s.end, score: s.score })));

    res.json({
      duration: videoDuration,
      clips,
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

    const { outputPath: videoPath } = await downloadVideo(videoUrl, 0, duration, ffmpegPath);
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
    const { outputPath: videoPath, info, sectionStart } = await downloadVideo(videoUrl, start, end, ffmpegPath);
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

app.listen(3001, () => console.log('ClipFlow backend running on http://localhost:3001'));
