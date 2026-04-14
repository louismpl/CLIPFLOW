import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return loadingPromise;
}

export interface RenderLocalVideoOptions {
  file: File;
  start: number;
  end: number;
  format: '9:16' | '16:9' | '1:1';
  subtitles: 'bold' | 'minimal' | 'none';
  music: 'trending' | 'electro' | 'lofi' | 'none';
  hook: string;
}

function buildVideoFilter(format: string, subtitles: string, hook: string) {
  const filters: string[] = [];

  if (format === '9:16') {
    filters.push('crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920:flags=lanczos');
  } else if (format === '1:1') {
    filters.push('crop=ih:ih:(iw-ih)/2:0,scale=1080:1080:flags=lanczos');
  } else {
    filters.push('scale=1920:1080:flags=lanczos,setsar=1:1');
  }

  if (subtitles !== 'none' && hook) {
    // drawtext avec la police DejaVuSans
    const safeHook = hook.replace(/'/g, "'\\''");
    if (subtitles === 'bold') {
      filters.push(
        `drawtext=fontfile=/tmp/DejaVuSans.ttf:text='${safeHook}':fontcolor=white:fontsize=64:borderw=4:bordercolor=black:box=1:boxcolor=black@0.4:boxborderw=20:x=(w-text_w)/2:y=h-text_h-100`
      );
    } else {
      filters.push(
        `drawtext=fontfile=/tmp/DejaVuSans.ttf:text='${safeHook}':fontcolor=white:fontsize=48:borderw=2:bordercolor=black@0.8:x=(w-text_w)/2:y=h-text_h-80`
      );
    }
  }

  return filters.join(',');
}

function getMusicFreq(music: string) {
  if (music === 'electro') return 220;
  if (music === 'lofi') return 330;
  return 440;
}

export async function renderLocalVideo(options: RenderLocalVideoOptions): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const { file, start, end, format, subtitles, music, hook } = options;
  const duration = Math.max(1, end - start);

  // 1. Charger le fichier vidéo et la police
  await ffmpeg.writeFile('input.mp4', await fetchFile(file));
  try { await ffmpeg.createDir('/tmp'); } catch {}
  const fontRes = await fetch('/fonts/DejaVuSans.ttf');
  const fontBlob = await fontRes.blob();
  await ffmpeg.writeFile('/tmp/DejaVuSans.ttf', await fetchFile(fontBlob));

  // 2. Préparer les filtres et commande
  const vf = buildVideoFilter(format, subtitles, hook);
  const hasMusic = music !== 'none';

  if (hasMusic) {
    // Générer la musique de fond
    const freq = getMusicFreq(music);
    await ffmpeg.exec([
      '-f', 'lavfi',
      '-i', `aevalsrc=0.5*sin(2*PI*${freq}*t):s=44100:c=stereo`,
      '-t', String(Math.max(duration, 10)),
      '-c:a', 'libmp3lame',
      '-b:a', '128k',
      'music.mp3',
    ]);

    // Commande principale avec mix audio
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-i', 'music.mp3',
      '-ss', String(start),
      '-t', String(duration),
      '-vf', vf,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-filter_complex',
      '[0:a]volume=0.9[a0];[1:a]volume=0.25[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=3[aout]',
      '-map', '0:v',
      '-map', '[aout]',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
      'output.mp4',
    ]);
  } else {
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-ss', String(start),
      '-t', String(duration),
      '-vf', vf,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
      'output.mp4',
    ]);
  }

  const data = await ffmpeg.readFile('output.mp4');
  const uint8 = data as Uint8Array;
  return new Blob([uint8.buffer], { type: 'video/mp4' });
}
