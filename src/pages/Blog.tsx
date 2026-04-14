import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, ArrowUpRight } from 'lucide-react';

interface BlogProps {
  onBack: () => void;
}

const ARTICLES = [
  {
    title: "Comment créer des Shorts qui retiennent l'attention",
    excerpt: "Les 3 premières secondes sont cruciales. Découvre les techniques utilisées par les plus grands créateurs pour captiver leur audience dès le début.",
    date: "12 janvier 2026",
    readTime: "5 min",
    category: "Stratégie"
  },
  {
    title: "L'algorithme TikTok en 2026 : ce qui change",
    excerpt: "Analyse complète des dernières évolutions de l'algorithme et comment adapter ta stratégie de contenu pour maximiser ta portée organique.",
    date: "8 janvier 2026",
    readTime: "7 min",
    category: "Actualité"
  },
  {
    title: "Pourquoi l'IA révolutionne le montage vidéo",
    excerpt: "De l'analyse automatique à la génération de sous-titres dynamiques, l'intelligence artificielle transforme la façon dont nous créons du contenu.",
    date: "3 janvier 2026",
    readTime: "4 min",
    category: "Technologie"
  },
  {
    title: "De 0 à 100 000 abonnés : le parcours d'un créateur",
    excerpt: "Interview exclusive avec Marc, créateur tech, qui nous raconte comment il a structuré sa production de contenu pour exploser sur YouTube.",
    date: "28 décembre 2025",
    readTime: "9 min",
    category: "Inspiration"
  }
];

export const Blog: React.FC<BlogProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#030014] text-white font-sans selection:bg-violet-500/30 overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[#030014]" />
        <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-violet-600/10 blur-[180px] rounded-full" />
        <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[150px] rounded-full" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 pt-6 px-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
            <img src="/clipflow-logo.png" alt="ClipFlow" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-extrabold tracking-tight">ClipFlow</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 text-sm font-bold uppercase tracking-widest mb-4">
              Blog
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
              Conseils et{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                stratégies
              </span>
            </h1>
            <p className="text-lg text-white/35 max-w-xl mx-auto">
              Découvre nos articles pour optimiser ta création de contenu et développer ton audience.
            </p>
          </motion.div>

          {/* Featured article */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative mb-8 p-8 md:p-10 rounded-3xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 overflow-hidden group cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 blur-[80px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/20 blur-[60px] rounded-full" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-white/80">À la une</span>
                  <span className="text-xs text-white/40">{ARTICLES[0].date}</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-extrabold mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/80 transition-all">
                  {ARTICLES[0].title}
                </h2>
                <p className="text-white/50 md:text-lg leading-relaxed max-w-2xl">
                  {ARTICLES[0].excerpt}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-violet-500/30 group-hover:border-violet-500/40 transition-all">
                  <ArrowUpRight className="w-6 h-6 text-white group-hover:text-violet-300 transition-colors" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {ARTICLES.slice(1).map((article, idx) => (
              <motion.article
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="group relative p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-violet-500/30 transition-all cursor-pointer h-full flex flex-col"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-2.5 py-1 rounded-md bg-white/5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                      {article.category}
                    </span>
                    <span className="text-xs text-white/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.readTime}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-cyan-400 transition-all">
                    {article.title}
                  </h2>
                  <p className="text-white/40 leading-relaxed text-sm mb-6 flex-1">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-xs text-white/30">{article.date}</span>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                      <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-violet-400 transition-colors" />
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
