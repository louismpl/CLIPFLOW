import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Rocket,
  RefreshCcw,
  Smartphone,
  Monitor,
  Square,
  Type,
  Music2,
  Film,
} from 'lucide-react';
import { Clip } from '../services/gemini';
import { YoutubePlayer } from './YoutubePlayer';
import { renderClip } from '../services/api';
import { cn } from '../lib/utils';

interface ExportStudioProps {
  isOpen: boolean;
  onClose: () => void;
  clip: Clip;
  videoId: string;
}

type ExportFormat = '9:16' | '16:9' | '1:1';
type SubtitleStyle = 'bold' | 'minimal' | 'none';
type MusicOption = 'trending' | 'electro' | 'lofi' | 'none';

const FORMATS: { id: ExportFormat; label: string; sub: string; icon: React.ReactNode; ratioClass: string; width: string }[] = [
  { id: '9:16', label: '9:16 Vertical', sub: 'Shorts / Reels / TikTok', icon: <Smartphone className="w-5 h-5" />, ratioClass: 'aspect-[9/16]', width: 'w-64 md:w-72' },
  { id: '16:9', label: '16:9 Horizontal', sub: 'YouTube classique', icon: <Monitor className="w-5 h-5" />, ratioClass: 'aspect-video', width: 'w-full max-w-lg' },
  { id: '1:1', label: '1:1 Carré', sub: 'Instagram / Facebook', icon: <Square className="w-5 h-5" />, ratioClass: 'aspect-square', width: 'w-64 md:w-72' },
];

const SUBTITLES: { id: SubtitleStyle; label: string; previewClass: string }[] = [
  { id: 'bold', label: 'Bold Dynamic', previewClass: 'text-lg md:text-xl font-black text-center text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-tight leading-tight px-2' },
  { id: 'minimal', label: 'Minimal Blanc', previewClass: 'text-base md:text-lg font-medium text-center text-white/95 drop-shadow-md px-2' },
  { id: 'none', label: 'Sans sous-titres', previewClass: 'hidden' },
];

const MUSIC: { id: MusicOption; label: string; color: string }[] = [
  { id: 'trending', label: 'Tendance Viral', color: 'from-pink-500 to-rose-500' },
  { id: 'electro', label: 'Électro Punchy', color: 'from-cyan-500 to-blue-500' },
  { id: 'lofi', label: 'Lo-Fi Chill', color: 'from-violet-500 to-purple-500' },
  { id: 'none', label: 'Aucune musique', color: 'from-white/20 to-white/10' },
];

export const ExportStudio: React.FC<ExportStudioProps> = ({ isOpen, onClose, clip, videoId }) => {
  const [step, setStep] = useState<'config' | 'rendering' | 'result'>('config');
  const [format, setFormat] = useState<ExportFormat>('9:16');
  const [subtitles, setSubtitles] = useState<SubtitleStyle>('none');
  const [music, setMusic] = useState<MusicOption>('none');
  const [progress, setProgress] = useState(0);
  const [mp4Url, setMp4Url] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('config');
      setProgress(0);
      setMp4Url(null);
      setRenderError(null);
      setFormat('9:16');
      setSubtitles('none');
      setMusic('none');
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 'rendering') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 120);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleStartRender = async () => {
    setStep('rendering');
    setRenderError(null);
    setProgress(0);
    try {
      const blob = await renderClip({
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        start: clip.start,
        end: clip.end,
        format,
        subtitles,
        music,
        hook: clip.hook,
      });
      if (!blob || blob.size < 1024) {
        throw new Error('Le fichier vidéo généré est vide ou corrompu. Vérifie que le backend est bien lancé.');
      }
      const url = URL.createObjectURL(blob);
      setMp4Url(url);
      setStep('result');
      setProgress(100);
    } catch (err: any) {
      setRenderError(err?.message || 'Une erreur est survenue lors du rendu.');
      setStep('result');
    }
  };

  const handleDownloadMp4 = () => {
    if (!mp4Url) return;
    const a = document.createElement('a');
    a.href = mp4Url;
    a.download = `clipflow_${videoId}_${Math.floor(clip.start)}s-${Math.floor(clip.end)}s.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const selectedFormat = FORMATS.find(f => f.id === format)!;
  const selectedSubtitle = SUBTITLES.find(s => s.id === subtitles)!;
  const selectedMusic = MUSIC.find(m => m.id === music)!;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#030014]/95 backdrop-blur-2xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0a0a14]/80 backdrop-blur-xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 sticky top-0 bg-[#0a0a14]/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {step === 'config' && "Studio d'export"}
                {step === 'rendering' && 'Rendu en cours...'}
                {step === 'result' && '✨ Ton clip est prêt'}
              </h2>
              <p className="text-xs text-white/40">
                {clip.hook} • {formatTime(clip.start)} - {formatTime(clip.end)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {step === 'config' && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {/* Left: Preview */}
                <div className="flex flex-col items-center justify-center">
                  <div className="mb-4 text-sm font-medium text-white/40">Aperçu live</div>
                  <div className={cn("relative overflow-hidden rounded-2xl border-2 border-white/10 bg-black shadow-2xl transition-all duration-500", selectedFormat.width)}>
                    <div className={cn("relative w-full", selectedFormat.ratioClass)}>
                      <YoutubePlayer videoId={videoId} startTime={clip.start} endTime={clip.end} />
                      {/* Subtitles overlay */}
                      {subtitles !== 'none' && (
                        <div className="absolute bottom-4 left-2 right-2 z-10 pointer-events-none">
                          <SimulatedSubtitles styleClass={selectedSubtitle.previewClass} hook={clip.hook} />
                        </div>
                      )}
                      {/* Music indicator */}
                      {music !== 'none' && (
                        <div className="absolute top-3 right-3 z-10">
                          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r text-white text-[10px] font-bold shadow-lg", selectedMusic.color)}>
                            <Music2 className="w-3 h-3" />
                            {selectedMusic.label}
                          </div>
                        </div>
                      )}
                      {/* Format badge */}
                      <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-md bg-black/60 backdrop-blur text-[10px] font-bold text-white/80 border border-white/10">
                        {selectedFormat.label}
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-white/30 text-center max-w-xs">
                    L&apos;aperçu montre le segment sélectionné avec tes paramètres. Le rendu final sera optimisé.
                  </p>
                </div>

                {/* Right: Controls */}
                <div className="space-y-6">
                  {/* Format */}
                  <div>
                    <div className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-violet-400" /> Format d&apos;export
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {FORMATS.map((f) => (
                        <OptionCard
                          key={f.id}
                          selected={format === f.id}
                          onClick={() => setFormat(f.id)}
                          label={f.label}
                          sublabel={f.sub}
                          icon={f.icon}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Subtitles */}
                  <div>
                    <div className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                      <Type className="w-4 h-4 text-cyan-400" /> Style de sous-titres
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {SUBTITLES.map((s) => (
                        <OptionCard
                          key={s.id}
                          selected={subtitles === s.id}
                          onClick={() => setSubtitles(s.id)}
                          label={s.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Music */}
                  <div>
                    <div className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                      <Music2 className="w-4 h-4 text-fuchsia-400" /> Musique de fond
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {MUSIC.map((m) => (
                        <OptionCard
                          key={m.id}
                          selected={music === m.id}
                          onClick={() => setMusic(m.id)}
                          label={m.label}
                        />
                      ))}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleStartRender}
                    className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/15 text-white"
                  >
                    <Rocket className="w-5 h-5" />
                    Lancer le rendu
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 'rendering' && (
              <motion.div
                key="rendering"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="py-12 space-y-8 text-center max-w-xl mx-auto"
              >
                <div className="w-16 h-16 mx-auto rounded-full border-4 border-white/10 border-t-violet-500 animate-spin" />
                <div className="space-y-2">
                  <div className="text-xl font-semibold text-white">Génération du MP4 en cours...</div>
                  <div className="text-sm text-white/40">
                    Téléchargement de la vidéo, découpe, application du format et encodage.
                    <br />
                    Cela peut prendre 10 à 30 secondes selon la durée.
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'result' && (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-8"
              >
                {renderError ? (
                  <div className="text-center py-8">
                    <div className="text-red-400 font-semibold mb-2">Rendu échoué</div>
                    <div className="text-sm text-white/50 mb-6">{renderError}</div>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setStep('config')}
                      className="px-6 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors"
                    >
                      Réessayer
                    </motion.button>
                  </div>
                ) : (
                  <>
                    {/* Final video player */}
                    <div className="flex flex-col items-center">
                      <div className="mb-3 text-sm font-medium text-white/50">Rendu final — MP4 prêt</div>
                      <div className={cn("relative overflow-hidden rounded-2xl border-2 border-violet-500/30 bg-black shadow-2xl shadow-violet-500/10 transition-all", selectedFormat.width)}>
                        <div className={cn("relative w-full", selectedFormat.ratioClass)}>
                          {mp4Url ? (
                            <video
                              src={mp4Url}
                              controls
                              autoPlay
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                              Aperçu indisponible
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleDownloadMp4}
                        disabled={!mp4Url}
                        className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-lg shadow-violet-500/15 disabled:opacity-50"
                      >
                        <Download className="w-5 h-5" />
                        Télécharger le MP4
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setStep('config')}
                        className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors"
                      >
                        <RefreshCcw className="w-5 h-5" />
                        Nouveau rendu
                      </motion.button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// SOUS-COMPOSANTS
// ---------------------------------------------------------------------------

function OptionCard({ selected, onClick, label, sublabel, icon }: { selected: boolean; onClick: () => void; label: string; sublabel?: string; icon?: React.ReactNode; key?: React.Key }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border text-left transition-all flex items-center gap-3",
        selected
          ? "bg-gradient-to-r from-violet-600 to-cyan-600 border-transparent text-white shadow-lg shadow-violet-500/15"
          : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
      )}
    >
      {icon && <div className={cn("", selected ? "text-white" : "text-white/60")}>{icon}</div>}
      <div>
        <div className="font-semibold text-sm">{label}</div>
        {sublabel && <div className="text-xs text-white/60 mt-0.5">{sublabel}</div>}
      </div>
    </button>
  );
}

function ActionCard({ onClick, icon, title, description }: { onClick: () => void; icon: React.ReactNode; title: string; description: string }) {
  return (
    <button
      onClick={onClick}
      className="group p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all text-center"
    >
      <div className="mx-auto w-10 h-10 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center mb-3 text-white/70 group-hover:text-white transition-colors">
        {icon}
      </div>
      <div className="font-bold text-white mb-1 text-sm">{title}</div>
      <div className="text-xs text-white/50">{description}</div>
    </button>
  );
}

function SimulatedSubtitles({ styleClass, hook }: { styleClass: string; hook: string }) {
  const [index, setIndex] = useState(0);

  const phrases = useMemo(() => {
    // Crée des phrases courtes à partir du hook pour simuler des sous-titres
    const base = hook.replace(/[.!?]/g, '|').split('|').map(s => s.trim()).filter(Boolean);
    if (base.length === 0) return [hook];
    if (base.length === 1) {
      const words = base[0].split(' ');
      const mid = Math.ceil(words.length / 2);
      return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
    }
    return base.slice(0, 4);
  }, [hook]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [phrases.length]);

  return (
    <div className="min-h-[3rem] flex items-end justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 1.02 }}
          transition={{ duration: 0.25 }}
          className={cn("px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10", styleClass)}
        >
          {phrases[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
