import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Youtube,
  Zap,
  Loader2,
  AlertCircle,
  TrendingUp,
  Clock,
  Play,
  History,
  Sparkles,
  LogOut,
  ChevronRight,
  Film,
  BarChart3,
  Search,
  Rocket,
  Share2,
  X,
  Layers,
} from 'lucide-react';
import { YoutubePlayer } from '../components/YoutubePlayer';
import { ClipActions } from '../components/ClipActions';
import { ExportStudio } from '../components/ExportStudio';
import { AnalysisLoader } from '../components/AnalysisLoader';
import { Clip } from '../services/gemini';
import { getVideoInfo, analyzeVideoUnified } from '../services/api';
import {
  saveAnalysis,
  getRemainingCredits,
  useCredit,
  resetCreditsIfNewMonth,
  getHistory,
} from '../services/storage';
import type { AnalysisRecord } from '../services/storage';
import { logout, getCurrentUser } from '../services/auth';

interface DashboardPageProps {
  pendingAnalysis?: { url: string; query: string } | null;
  onConsumePending?: () => void;
  onLogout: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  pendingAnalysis,
  onConsumePending,
  onLogout,
}) => {
  const currentUser = getCurrentUser() || '';
  const [url, setUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [loaderTitle, setLoaderTitle] = useState('');
  const [analysisDone, setAnalysisDone] = useState(false);
  const [videoData, setVideoData] = useState<{ id: string; title: string; author: string; thumbnail: string } | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [activeStartTime, setActiveStartTime] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState(3);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [exportStudioOpen, setExportStudioOpen] = useState(false);
  const [selectedClipForExport, setSelectedClipForExport] = useState<Clip | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | undefined>(undefined);
  const [clipDuration, setClipDuration] = useState<number>(45);

  const resultsRef = useRef<HTMLDivElement>(null);
  const currentAnalysisIdRef = useRef<string | null>(null);

  useEffect(() => {
    // resetCreditsIfNewMonth(); // désactivé pour les tests
    setRemainingCredits(999); // illimité pour les tests
    setHistory(getHistory().slice(0, 5));
  }, []);

  const extractVideoId = (urlStr: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = urlStr.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  const runAnalysis = useCallback(async (targetUrl: string, targetQuery: string) => {
    const id = extractVideoId(targetUrl);
    if (!id) {
      setError('URL YouTube invalide. Veuillez coller un lien correct.');
      return;
    }

    currentAnalysisIdRef.current = id;
    setError(null);
    setIsLoading(true);
    setVideoData(null);
    setClips([]);

    try {
      // 1. Infos rapides pour afficher la vidéo + loader
      const info = await getVideoInfo(targetUrl);
      const vd = {
        id: info.id,
        title: info.title,
        author: info.author,
        thumbnail: info.thumbnail,
      };
      setVideoData(vd);
      setVideoDuration(info.duration);
      setLoaderTitle(info.title);
      setShowLoader(true);
      setAnalysisDone(false);

      // 2. Analyse combinée (heatmap + audio + transcript) en UNE seule route
      const result = await analyzeVideoUnified(targetUrl, clipDuration, targetQuery || undefined);
      const clips = (result.clips || []) as Clip[];

      setClips(clips);
      setIsLoading(false);
      setAnalysisDone(true);

      const record: AnalysisRecord = {
        id: String(Date.now()),
        videoId: info.id,
        title: info.title,
        author: info.author,
        thumbnail: info.thumbnail,
        clips,
        query: targetQuery || undefined,
        date: new Date().toISOString(),
      };
      saveAnalysis(record);
      setHistory(getHistory().slice(0, 5));
    } catch (err: any) {
      console.error(err);
      const detail = err?.message || String(err);
      setError(detail && detail !== 'undefined' ? detail : "L'analyse a échoué. Veuillez réessayer dans quelques instants.");
      setIsLoading(false);
    }
  }, [clipDuration]);

  // Auto-lance l'analyse pending au montage (placé après runAnalysis pour éviter le hoisting issue)
  const consumedPendingRef = useRef(false);
  useEffect(() => {
    if (pendingAnalysis && !consumedPendingRef.current) {
      consumedPendingRef.current = true;
      setUrl(pendingAnalysis.url);
      setSearchQuery(pendingAnalysis.query);
      onConsumePending?.();
      runAnalysis(pendingAnalysis.url, pendingAnalysis.query);
    }
  }, [pendingAnalysis]);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis(url, searchQuery);
  };

  const onLoaderComplete = () => {
    setShowLoader(false);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  };

  const restoreAnalysis = (record: AnalysisRecord) => {
    setVideoData({
      id: record.videoId,
      title: record.title,
      author: record.author,
      thumbnail: record.thumbnail,
    });
    setClips(record.clips);
    setSearchQuery(record.query || '');
    setUrl(`https://www.youtube.com/watch?v=${record.videoId}`);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white font-sans selection:bg-violet-500/30 overflow-x-hidden">
      {/* Subtle animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[#030014]" />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[180px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[180px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 py-4 px-6 bg-[#030014]/60 backdrop-blur-2xl border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/clipflow-logo.png" alt="ClipFlow" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-extrabold tracking-tight">ClipFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm font-medium text-white/60">
              {currentUser.length > 18 ? `${currentUser.slice(0, 16)}...` : currentUser}
            </span>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="pt-28 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Top stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          >
            <StatCard
              icon={<Sparkles className="w-5 h-5 text-violet-400" />}
              label="Crédits restants"
              value={`${remainingCredits} analyse${remainingCredits > 1 ? 's' : ''}`}
              sub="ce mois"
            />
            <StatCard
              icon={<Film className="w-5 h-5 text-cyan-400" />}
              label="Clips générés"
              value={`${history.reduce((acc, h) => acc + h.clips.length, 0)}`}
              sub="au total"
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5 text-fuchsia-400" />}
              label="Score moyen"
              value="87"
              sub="sur 100"
            />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left col: Analysis input + results */}
            <div className="lg:col-span-8 space-y-8">
              {/* New analysis card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative rounded-3xl border border-white/10 bg-[#0a0a14]/50 backdrop-blur-xl p-6 md:p-8 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="relative z-10">
                  <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Nouvelle analyse</h1>
                  <p className="text-white/40 mb-6">Colle l'URL d'une vidéo YouTube et laisse l'IA trouver les meilleurs clips viraux.</p>

                  <form onSubmit={handleAnalyze} className="space-y-4">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 rounded-2xl blur opacity-15 group-hover:opacity-30 transition duration-1000" />
                      <div className="relative flex flex-col gap-2 bg-[#0a0a14] border border-white/10 rounded-2xl p-2">
                        <div className="flex items-center">
                          <div className="pl-4 text-white/30">
                            <Youtube className="w-6 h-6" />
                          </div>
                          <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Colle l'URL de ta vidéo YouTube..."
                            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-lg placeholder:text-white/20 outline-none"
                          />
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading || !url}
                            className="bg-white text-[#030014] px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-gradient-to-r hover:from-violet-500 hover:to-cyan-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                            {isLoading ? 'Analyse...' : 'Analyser'}
                          </motion.button>
                        </div>
                        <div className="flex items-center border-t border-white/5 pt-2">
                          <div className="pl-4 text-white/30">
                            <Search className="w-5 h-5" />
                          </div>
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Recherche intelligente (optionnel) — ex: moment drôle, punchline..."
                            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-base placeholder:text-white/20 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-white/40">Durée des clips :</span>
                      <div className="flex items-center gap-2">
                        {[20, 30, 45, 60, 90].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => setClipDuration(sec)}
                            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                              clipDuration === sec
                                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-red-400 text-sm"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </motion.div>
                    )}
                  </form>
                </div>
              </motion.div>

              {/* Results */}
              <AnimatePresence>
                {videoData && (
                  <motion.div
                    ref={resultsRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-extrabold tracking-tight">Résultats de l'analyse</h2>
                        <p className="text-white/40 mt-1">{videoData.title}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setVideoData(null); setClips([]); setActiveStartTime(undefined); }}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Nouvelle analyse
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {/* Player */}
                      <div className="space-y-6">
                        <div className="sticky top-28 space-y-6">
                          {(() => {
                            const activeClip = clips.find((c) => c.start === activeStartTime);
                            return (
                              <>
                                <YoutubePlayer
                                  videoId={videoData.id}
                                  startTime={activeStartTime}
                                  endTime={activeClip?.end}
                                  onClipEnd={() => {
                                    if (activeClip) {
                                      const currentIndex = clips.findIndex((c) => c.start === activeStartTime);
                                      const nextIndex = currentIndex + 1;
                                      if (nextIndex < clips.length) {
                                        setActiveStartTime(clips[nextIndex].start);
                                      }
                                    }
                                  }}
                                />
                                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-sm">
                                  <div className="flex items-start justify-between mb-4">
                                    <div>
                                      <h3 className="text-lg font-bold mb-1 leading-tight">{videoData.title}</h3>
                                      <p className="text-white/35 font-medium text-sm">{videoData.author}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1">Style</div>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="font-bold">Bold Dynamic</span>
                                        <Layers className="w-4 h-4 text-violet-400" />
                                      </div>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1">Format</div>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="font-bold">9:16 Vertical</span>
                                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <motion.button
                                      whileHover={{ scale: 1.01 }}
                                      whileTap={{ scale: 0.99 }}
                                      onClick={() => {
                                        setSelectedClipForExport(clips[0] || null);
                                        setExportStudioOpen(true);
                                      }}
                                      className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/15 text-sm"
                                    >
                                      <Rocket className="w-4 h-4" />
                                      Ouvrir le Studio d&apos;export
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm"
                                    >
                                      <Share2 className="w-4 h-4" />
                                      Partager
                                    </motion.button>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Clips list */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-violet-400" />
                            Clips viraux
                          </h3>
                          <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Triés par viralité</span>
                        </div>
                        {clips.map((clip, idx) => (
                          <DashboardClipCard
                            key={idx}
                            clip={clip}
                            idx={idx}
                            videoId={videoData.id}
                            isActive={clip.start === activeStartTime}
                            onPlay={() => setActiveStartTime(clip.start)}
                            onOpenStudio={() => {
                              setSelectedClipForExport(clip);
                              setExportStudioOpen(true);
                            }}
                            formatTime={formatTime}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right col: History */}
            <div className="lg:col-span-4 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="sticky top-28"
              >
                <div className="rounded-2xl border border-white/10 bg-[#0a0a14]/40 backdrop-blur-xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <History className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-bold">Historique récent</h3>
                  </div>

                  {history.length === 0 ? (
                    <div className="text-center py-8 text-white/30 text-sm">
                      Aucune analyse pour l&apos;instant.
                      <br />
                      Lance ta première analyse !
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => restoreAnalysis(item)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition-all text-left group"
                        >
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-16 h-10 object-cover rounded-lg border border-white/10 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-cyan-400 transition-all">
                              {item.title}
                            </p>
                            <p className="text-xs text-white/30 mt-0.5">
                              {new Date(item.date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick tip */}
                <div className="mt-4 rounded-2xl border border-white/5 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Astuce Pro</div>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Utilise la recherche intelligente pour cibler un type de moment spécifique (drôle, émouvant, punchline...).
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {showLoader && <AnalysisLoader videoTitle={loaderTitle} onComplete={onLoaderComplete} isDone={analysisDone} />}

      {exportStudioOpen && selectedClipForExport && videoData && (
        <ExportStudio
          isOpen={exportStudioOpen}
          onClose={() => setExportStudioOpen(false)}
          clip={selectedClipForExport}
          videoId={videoData.id}
        />
      )}
    </div>
  );
};

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0a14]/40 backdrop-blur-xl p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">{icon}</div>
      <div>
        <div className="text-xs text-white/40 font-medium">{label}</div>
        <div className="text-xl font-extrabold">{value} <span className="text-sm font-medium text-white/30">{sub}</span></div>
      </div>
    </div>
  );
}

interface DashboardClipCardProps {
  clip: Clip;
  idx: number;
  videoId: string;
  isActive: boolean;
  onPlay: () => void;
  onOpenStudio: () => void;
  formatTime: (s: number) => string;
  key?: React.Key;
}

function DashboardClipCard({ clip, idx, videoId, isActive, onPlay, onOpenStudio, formatTime }: DashboardClipCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.08 }}
      className={`group relative rounded-2xl border p-4 transition-all ${
        isActive
          ? 'bg-violet-500/10 border-violet-500/40'
          : 'bg-[#0a0a14]/60 border-white/10 hover:border-violet-500/30'
      }`}
    >
      {/* Header: clickable to play */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={onPlay}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border ${
            isActive ? 'bg-violet-500 text-white border-violet-500' : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
          }`}>
            {idx + 1}
          </div>
          <div>
            <h4 className={`font-bold text-base leading-tight transition-all ${
              isActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400' : 'group-hover:text-white'
            }`}>
              {clip.hook}
            </h4>
            <div className="flex items-center gap-3 mt-1 text-xs font-medium text-white/40">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(clip.start)} - {formatTime(clip.end)}
              </span>
              <span className="flex items-center gap-1 text-violet-400/80">
                <TrendingUp className="w-3 h-3" />
                {clip.score}/100
              </span>
            </div>
          </div>
        </div>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isActive ? 'bg-white text-violet-600' : 'bg-white/5 text-white/60 group-hover:bg-white/10 group-hover:text-white'
          }`}
          onClick={onPlay}
        >
          <Play className="w-4 h-4 fill-current" />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-3">
        <Metric label="Hook" value={clip.breakdown.hook_strength} color="from-violet-500 to-fuchsia-500" />
        <Metric label="Émotion" value={clip.breakdown.emotional_peak} color="from-fuchsia-500 to-pink-500" />
        <Metric label="Audio" value={clip.breakdown.audio_cue} color="from-cyan-500 to-blue-500" />
        <Metric label="Mots-clés" value={clip.breakdown.keyword_density} color="from-emerald-500 to-teal-500" />
        <Metric label="Rythme" value={clip.breakdown.pacing} color="from-amber-500 to-orange-500" />
      </div>

      <div className="text-xs text-white/40 line-clamp-2 mb-3">{clip.description}</div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsExpanded(v => !v); }}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors px-1 py-0.5 rounded"
        >
          {isExpanded ? 'Moins de détails' : 'Plus de détails'}
        </button>
        <span className="text-white/10">|</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenStudio(); }}
          className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors px-1 py-0.5 rounded"
        >
          Studio d&apos;export
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-white/5 space-y-2 text-sm">
              <p><span className="text-white/30">Raisonnement IA :</span> <span className="text-white/70">{clip.reasoning}</span></p>
              <p><span className="text-white/30">Pourquoi viral :</span> <span className="text-white/70">{clip.why_viral}</span></p>
              <div className="flex flex-wrap gap-2 pt-1">
                {clip.suggested_hashtags.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-md bg-white/5 text-xs text-white/60 border border-white/5">{tag}</span>
                ))}
              </div>
              <div className="pt-2">
                <ClipActions clip={clip} videoId={videoId} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className="text-[9px] font-bold uppercase tracking-wider text-white/20 mb-1">{label}</div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="text-[10px] font-semibold text-white/50">{value}</div>
    </div>
  );
}
