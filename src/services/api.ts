const API_BASE = '/api';

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 90000) {
  return Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('La requête a pris trop de temps. Assure-toi que le backend est lancé.')), timeoutMs)
    ),
  ]);
}

export async function getVideoInfo(videoUrl: string) {
  const res = await fetchWithTimeout(
    `${API_BASE}/info`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl }),
    },
    30000
  ) as Response;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Erreur de récupération des infos');
  }
  return res.json() as Promise<{ id: string; title: string; author: string; thumbnail: string; duration: number; heatmap_peaks?: number[] }>;
}

export async function getTranscript(videoUrl: string) {
  const res = await fetchWithTimeout(
    `${API_BASE}/transcript`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl }),
    },
    45000
  ) as Response;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Erreur de récupération du transcript');
  }
  return res.json() as Promise<{ transcript: string }>;
}

export async function getAudioAnalysis(videoUrl: string, end: number) {
  const res = await fetchWithTimeout(
    `${API_BASE}/audio-analysis`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl, start: 0, end }),
    },
    120000
  ) as Response;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Erreur analyse audio');
  }
  return res.json() as Promise<{ peaks: number[] }>;
}

export async function renderClip(body: {
  videoUrl: string;
  start: number;
  end: number;
  format: string;
  subtitles: string;
  music: string;
  hook: string;
}) {
  const res = await fetchWithTimeout(
    `${API_BASE}/clip`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    120000
  ) as Response;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Erreur de rendu');
  }
  const blob = await res.blob();
  return new Blob([blob], { type: 'video/mp4' });
}
