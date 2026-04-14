import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  BrainCircuit,
  Workflow,
  Activity,
  Film,
  Sparkles,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { getAnalysisSteps, simulateAnalysisSteps } from '../services/smartAnalysis';

interface AnalysisLoaderProps {
  videoTitle: string;
  onComplete: () => void;
  isDone?: boolean;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  metadata: <Database className="w-5 h-5" />,
  category: <BrainCircuit className="w-5 h-5" />,
  structure: <Workflow className="w-5 h-5" />,
  emotion: <Activity className="w-5 h-5" />,
  clips: <Film className="w-5 h-5" />,
  finalize: <Sparkles className="w-5 h-5" />,
};

export const AnalysisLoader: React.FC<AnalysisLoaderProps> = ({ videoTitle, onComplete, isDone = false }) => {
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [funFactIndex, setFunFactIndex] = useState(0);
  const [animationFinished, setAnimationFinished] = useState(false);

  const steps = getAnalysisSteps();

  const funFacts = [
    "Les 3 premières secondes d'un clip déterminent 80% de sa rétention.",
    "Un sous-titre dynamique augmente le temps de visionnage de 40%.",
    "Les clips avec un pic émotionnel à 8 secondes performent 2x mieux.",
    "Le format 9:16 génère 3x plus d'engagement que le 16:9 sur mobile.",
    "Les vidéos avec musique trending ont 60% plus de chances d'être recommandées.",
  ];

  useEffect(() => {
    const factInterval = setInterval(() => {
      setFunFactIndex((i) => (i + 1) % funFacts.length);
    }, 3500);
    return () => clearInterval(factInterval);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      for (let i = 0; i < steps.length; i++) {
        if (!isMounted) return;
        const step = steps[i];
        setCurrentStepId(step.id);
        setProgress(Math.round((i / steps.length) * 100));
        await new Promise((r) => setTimeout(r, step.duration));
        if (!isMounted) return;
        setCompletedSteps((prev) => new Set(prev).add(step.id));
      }
      if (!isMounted) return;
      setProgress(100);
      setAnimationFinished(true);
    };

    run();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (animationFinished && isDone) {
      const t = setTimeout(() => onComplete(), 400);
      return () => clearTimeout(t);
    }
  }, [animationFinished, isDone, onComplete]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-[#030014]/90 backdrop-blur-xl"
      />

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[140px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 7, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[140px]"
        />
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0a0a14]/70 backdrop-blur-2xl p-8 md:p-10 shadow-2xl shadow-violet-500/5"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 mb-4"
          >
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="text-xs font-semibold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Analyse IA en cours
            </span>
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
            On analyse <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">{videoTitle}</span>
          </h2>
          <p className="text-sm text-white/40">
            Notre moteur scanne la structure, l'émotion et le potentiel viral de chaque segment.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between text-xs font-medium text-white/30 mb-2">
            <span>Progression</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-10">
          {steps.map((step, idx) => {
            const isCompleted = completedSteps.has(step.id);
            const isActive = currentStepId === step.id;
            const isPending = !isCompleted && !isActive;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-white/[0.03] border-violet-500/30'
                    : isCompleted
                    ? 'bg-white/[0.01] border-white/5'
                    : 'bg-transparent border-transparent opacity-40'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/20'
                      : isCompleted
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-white/5 text-white/30'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : STEP_ICONS[step.id]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${isActive ? 'text-white' : 'text-white/70'}`}>
                      {step.label}
                    </span>
                    {isActive && (
                      <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-xs font-medium text-cyan-400"
                      >
                        En cours...
                      </motion.span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{step.detail}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Fun fact */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2">
            Le saviez-vous ?
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={funFactIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-white/60 leading-relaxed"
            >
              {funFacts[funFactIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
