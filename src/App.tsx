import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Youtube,
  ArrowRight,
  TrendingUp,
  Clock,
  Zap,
  CheckCircle2,
  Plus,
  Minus,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { AnimatedBackground } from './components/AnimatedBackground';
import { FeatureCard } from './components/FeatureCard';
import { StepCard } from './components/StepCard';
import {
  StepLinkIcon,
  StepAIIcon,
  StepRocketIcon,
  ChartRiseIcon,
  SearchPulseIcon,
  FilmStripIcon,
  SubtitleIcon,
  WandIcon
} from './components/AnimatedIcons';
import { AuthDashboard, Blog, Contact, Conditions, Confidentialite, DashboardPage } from './pages';
import { cn } from './lib/utils';
import { getCurrentUser, isLoggedIn, logout } from './services/auth';
import { resetCreditsIfNewMonth, getRemainingCredits } from './services/storage';

type Page = 'home' | 'auth' | 'dashboard' | 'blog' | 'contact' | 'conditions' | 'confidentialite';

const PRICING_PLANS = [
  {
    name: "Gratuit",
    price: "0€",
    description: "Parfait pour découvrir",
    features: ["3 vidéos / mois", "Watermark ClipFlow", "Timestamps précis", "Sous-titres basiques"],
    cta: "Commencer",
    popular: false
  },
  {
    name: "Starter",
    price: "9€",
    description: "Pour les créateurs ambitieux",
    features: ["20 vidéos / mois", "Sans watermark", "Export MP4 9:16", "Styles de sous-titres", "Analytics détaillés"],
    cta: "Choisir Starter",
    popular: true
  },
  {
    name: "Pro",
    price: "19€",
    description: "Pour les professionnels",
    features: ["50 vidéos / mois", "Tous les styles", "B-roll automatique", "Voix améliorée", "Planification auto"],
    cta: "Choisir Pro",
    popular: false
  }
];

const FEATURES = [
  {
    icon: <WandIcon className="w-7 h-7" />,
    title: "Analyse par IA",
    description: "Notre intelligence artificielle détecte les hooks, pics émotionnels et moments les plus susceptibles de devenir viraux."
  },
  {
    icon: <FilmStripIcon className="w-7 h-7" />,
    title: "Export MP4 vertical",
    description: "Télécharge tes clips au format 9:16, optimisé pour TikTok, Instagram Reels et YouTube Shorts."
  },
  {
    icon: <ChartRiseIcon className="w-7 h-7" />,
    title: "Scores de viralité",
    description: "Chaque clip reçoit un score de 0 à 100 avec un breakdown complet de ses forces et axes d'amélioration."
  },
  {
    icon: <SubtitleIcon className="w-7 h-7" />,
    title: "Sous-titres dynamiques",
    description: "Ajoute des sous-titres stylés et animés pour capter l'attention dès les premières secondes."
  },
  {
    icon: <SearchPulseIcon className="w-7 h-7" />,
    title: "Recherche intelligente",
    description: "Trouve des moments précis dans tes vidéos grâce à une recherche sémantique en langage naturel."
  },
  {
    icon: <CheckCircle2 className="w-7 h-7" />,
    title: "Export professionnel",
    description: "Obtiens des clips propres et sans watermark avec le plan Starter, dès 9 euros par mois."
  }
];

const STEPS = [
  {
    number: "1",
    icon: <StepLinkIcon className="w-8 h-8" />,
    title: "Colle ton lien",
    description: "Copie l'URL de ta vidéo YouTube et colle-la dans notre analyseur intelligent."
  },
  {
    number: "2",
    icon: <StepAIIcon className="w-8 h-8" />,
    title: "L'IA scanne",
    description: "Notre intelligence artificielle analyse ta vidéo et identifie les 5 meilleurs moments viraux."
  },
  {
    number: "3",
    icon: <StepRocketIcon className="w-8 h-8" />,
    title: "Exporte et publie",
    description: "Télécharge tes clips au format vertical et publie-les directement sur tes réseaux sociaux."
  }
];

const FAQS = [
  {
    question: "Comment fonctionne ClipFlow ?",
    answer: "ClipFlow utilise l'intelligence artificielle de Google pour analyser les métadonnées de tes vidéos YouTube et identifier les moments les plus susceptibles de devenir viraux au format Short. Il te fournit des timestamps, des scores de viralité et des suggestions d'optimisation."
  },
  {
    question: "Puis-je vraiment essayer gratuitement ?",
    answer: "Oui, le plan Gratuit te permet d'analyser jusqu'à 3 vidéos par mois sans carte bancaire. C'est le meilleur moyen de découvrir la puissance de ClipFlow avant de passer à un plan payant."
  },
  {
    question: "Quels formats d'export sont disponibles ?",
    answer: "Avec le plan Starter et Pro, tu peux exporter tes clips au format MP4 vertical 9:16, parfaitement optimisé pour TikTok, Instagram Reels et YouTube Shorts. Le plan Gratuit te donne accès aux timestamps et aux suggestions."
  },
  {
    question: "Puis-je annuler mon abonnement à tout moment ?",
    answer: "Oui, tu peux annuler ton abonnement Starter ou Pro à tout moment sans frais cachés. Tu conserves l'accès aux fonctionnalités payantes jusqu'à la fin de la période en cours."
  }
];

const STATS = [
  { value: "12 000+", label: "créateurs actifs" },
  { value: "4.9M", label: "clips générés" },
  { value: "98%", label: "de satisfaction" },
];

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [currentUser, setCurrentUser] = useState<string | null>(getCurrentUser());
  const [pendingAnalysis, setPendingAnalysis] = useState<{ url: string; query: string } | null>(null);
  const [heroUrl, setHeroUrl] = useState('');
  const [heroQuery, setHeroQuery] = useState('');
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroError, setHeroError] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState(3);

  // Redirection auth -> dashboard
  useEffect(() => {
    if (currentUser && page === 'home') {
      setPage('dashboard');
    }
  }, [currentUser, page]);

  useEffect(() => {
    resetCreditsIfNewMonth();
    setRemainingCredits(getRemainingCredits());
  }, []);

  const extractVideoId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const handleHeroAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn()) {
      setPendingAnalysis({ url: heroUrl, query: heroQuery });
      setPage('auth');
      return;
    }
    // Si connecté, ne devrait pas arriver car on est redirigé vers dashboard
    setPage('dashboard');
  };

  // Render pages
  if (page === 'auth') {
    return (
      <AuthDashboard
        onBack={() => setPage('home')}
        onLoginSuccess={() => {
          setCurrentUser(getCurrentUser());
          setPage('dashboard');
        }}
      />
    );
  }

  if (page === 'dashboard') {
    return (
      <DashboardPage
        pendingAnalysis={pendingAnalysis}
        onConsumePending={() => setPendingAnalysis(null)}
        onLogout={() => {
          logout();
          setCurrentUser(null);
          setPage('home');
        }}
      />
    );
  }

  if (page === 'blog') return <Blog onBack={() => setPage('home')} />;
  if (page === 'contact') return <Contact onBack={() => setPage('home')} />;
  if (page === 'conditions') return <Conditions onBack={() => setPage('home')} />;
  if (page === 'confidentialite') return <Confidentialite onBack={() => setPage('home')} />;

  // LANDING PAGE (home)
  return (
    <div className="min-h-screen bg-[#030014] text-white font-sans selection:bg-violet-500/30 overflow-x-hidden">
      <AnimatedBackground />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed top-0 left-0 right-0 z-50 py-4 px-6 bg-[#030014]/60 backdrop-blur-2xl border-b border-white/5 transition-all"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="w-28" />
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
            <img src="/clipflow-logo.png" alt="ClipFlow" className="w-12 h-12 object-contain" />
            <span className="text-3xl font-extrabold tracking-tight">ClipFlow</span>
          </div>
          {currentUser ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white/80 hidden sm:inline">
                {currentUser.length > 14 ? `${currentUser.slice(0, 12)}...` : currentUser}
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { logout(); setCurrentUser(null); }}
                className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 hover:border-white/25 transition-all shadow-lg shadow-black/20"
              >
                Déconnexion
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPage('auth')}
              className="px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 hover:border-white/25 transition-all shadow-lg shadow-black/20"
            >
              Se connecter
            </motion.button>
          )}
        </div>
      </motion.header>

      {/* Hero Section */}
      <section id="analyse" className="relative pt-44 pb-20 lg:pt-56 lg:pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-sm mb-8 overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 opacity-50" />
              <motion.span
                className="relative flex h-2.5 w-2.5"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-violet-400 to-cyan-400"></span>
              </motion.span>
              <span className="relative text-sm font-semibold text-white/80">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">+4.9M</span> de clips viralités générés par notre IA
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]"
            >
              Transforme tes{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
                vidéos
              </span>{' '}
              en contenus viraux
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="text-lg md:text-xl text-white/35 mb-12 leading-relaxed max-w-xl mx-auto"
            >
              ClipFlow analyse tes vidéos YouTube et te donne les meilleurs extraits prêts à exploser sur les réseaux.
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              onSubmit={handleHeroAnalyze}
              className="max-w-xl mx-auto"
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 rounded-2xl blur opacity-15 group-hover:opacity-30 transition duration-1000" />
                <div className="relative flex flex-col gap-2 bg-[#0a0a14] border border-white/10 rounded-2xl p-2">
                  <div className="flex items-center">
                    <div className="pl-4 text-white/30">
                      <Youtube className="w-6 h-6" />
                    </div>
                    <input
                      type="text"
                      value={heroUrl}
                      onChange={(e) => setHeroUrl(e.target.value)}
                      placeholder="Colle l'URL de ta vidéo YouTube..."
                      className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-lg placeholder:text-white/20 outline-none"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={heroLoading || !heroUrl}
                      className="bg-white text-[#030014] px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-gradient-to-r hover:from-violet-500 hover:to-cyan-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {heroLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                      {heroLoading ? 'Analyse...' : 'Analyser'}
                    </motion.button>
                  </div>
                  <div className="flex items-center border-t border-white/5 pt-2">
                    <div className="pl-4 text-white/30">
                      <Search className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={heroQuery}
                      onChange={(e) => setHeroQuery(e.target.value)}
                      placeholder="Recherche intelligente (optionnel) — ex: moment drôle, punchline..."
                      className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-base placeholder:text-white/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/60">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-400 to-cyan-400" />
                  {remainingCredits} analyse{remainingCredits > 1 ? 's' : ''} gratuite{remainingCredits > 1 ? 's' : ''} restante{remainingCredits > 1 ? 's' : ''} ce mois
                </span>
              </div>

              {heroError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center justify-center gap-2 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4" />
                  {heroError}
                </motion.div>
              )}
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-16"
            >
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                {STATS.map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                      {stat.value}
                    </div>
                    <div className="text-sm text-white/30 font-medium mt-1">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section id="comment-ca-marche" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 text-sm font-bold uppercase tracking-widest">Processus</span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-4 mb-6">
              Trois étapes, zéro complication
            </h2>
            <p className="text-lg text-white/35">
              Transforme tes longues vidéos en clips viraux prêts à publier en moins d'une minute.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8">
            {STEPS.map((step, idx) => (
              <StepCard
                key={idx}
                {...step}
                delay={idx * 0.15}
                isLast={idx === STEPS.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 text-sm font-bold uppercase tracking-widest">Fonctionnalités</span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-4 mb-6">
              Une suite complète pour créer du contenu viral
            </h2>
            <p className="text-lg text-white/35">
              Tous les outils dont tu as besoin, propulsés par l'intelligence artificielle.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} delay={idx * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="tarifs" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 text-sm font-bold uppercase tracking-widest">Tarifs</span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-4 mb-6">
              Un prix adapté à tes besoins
            </h2>
            <p className="text-lg text-white/35">
              Commence gratuitement. Passe à un plan payant quand tu seras prêt à scaler.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-start">
            {PRICING_PLANS.map((plan, idx) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                whileHover={{ y: -8 }}
                className={cn(
                  "relative rounded-3xl border backdrop-blur-sm transition-all",
                  plan.popular
                    ? "bg-gradient-to-b from-violet-500/10 to-cyan-500/5 border-violet-500/40 shadow-2xl shadow-violet-500/10 md:-mt-4 md:mb-4"
                    : "border-white/10 hover:border-violet-500/30",
                  plan.name === "Gratuit" && "bg-violet-950/20",
                  plan.name === "Pro" && "bg-cyan-950/20",
                  plan.name === "Starter" && "bg-white/[0.01]"
                )}
              >
                {plan.popular && (
                  <>
                    <div className="relative z-30 -mt-3 mx-auto w-fit">
                      <div className="px-4 py-1.5 bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-violet-500/30 whitespace-nowrap">
                        Le plus populaire
                      </div>
                    </div>
                    <motion.div
                      className="absolute inset-0 opacity-10 rounded-3xl overflow-hidden pointer-events-none"
                      style={{
                        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
                      }}
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 3 }}
                    />
                  </>
                )}
                <div className={cn("relative z-10 p-8", !plan.popular && "pt-8")}>
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-sm text-white/35 mb-5">{plan.description}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">{plan.price}</span>
                      <span className="text-white/25 text-sm">/mois</span>
                    </div>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm text-white/65">
                        <CheckCircle2 className={cn("w-5 h-5 flex-shrink-0", plan.popular ? "text-violet-400" : "text-white/30")} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPage('auth')}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold transition-all relative z-10",
                      plan.popular
                        ? "bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-lg shadow-violet-500/20"
                        : "bg-white/5 border border-white/10 hover:bg-violet-500/20 hover:border-violet-500/30 hover:text-white text-white/80"
                    )}
                  >
                    {plan.cta}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 lg:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 text-sm font-bold uppercase tracking-widest">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-4 mb-6">
              Questions fréquentes
            </h2>
            <p className="text-lg text-white/35">
              Tout ce que tu dois savoir avant de te lancer.
            </p>
          </motion.div>

          <div className="space-y-0">
            {FAQS.map((faq, idx) => (
              <FAQItem key={idx} {...faq} delay={idx * 0.05} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Prêt à faire{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                exploser
              </span>{' '}
              tes vues ?
            </h2>
            <p className="text-xl text-white/35 mb-10 max-w-xl mx-auto">
              Rejoins plus de 12 000 créateurs qui utilisent ClipFlow chaque jour pour créer des contenus viraux.
            </p>
            <motion.a
              href="#analyse"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#030014] rounded-full font-bold text-lg hover:bg-gradient-to-r hover:from-violet-500 hover:to-cyan-500 hover:text-white transition-all shadow-2xl shadow-white/5"
            >
              <Zap className="w-5 h-5 fill-current" />
              Essayer gratuitement
              <ArrowRight className="w-5 h-5" />
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/clipflow-logo.png" alt="ClipFlow" className="w-10 h-10 object-contain" />
                <span className="text-2xl font-extrabold tracking-tight">ClipFlow</span>
              </div>
              <p className="text-sm text-white/25 leading-relaxed max-w-xs">
                L'IA qui transforme tes vidéos YouTube en Shorts viraux. Simple, rapide, efficace.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Ressources</h4>
              <ul className="space-y-3 text-sm text-white/30">
                <li><button onClick={() => setPage('blog')} className="hover:text-white transition-colors">Blog</button></li>
                <li><button onClick={() => setPage('contact')} className="hover:text-white transition-colors">Contact</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Centre d'aide</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Légal</h4>
              <ul className="space-y-3 text-sm text-white/30">
                <li><button onClick={() => setPage('confidentialite')} className="hover:text-white transition-colors">Confidentialité</button></li>
                <li><button onClick={() => setPage('conditions')} className="hover:text-white transition-colors">Conditions</button></li>
                <li><button onClick={() => setPage('contact')} className="hover:text-white transition-colors">Contact</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-white/15">
              © 2026 ClipFlow. Tous droits réservés.
            </div>
            <div className="flex items-center gap-6 text-sm text-white/25">
              <span>Made in France</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FAQItem({ question, answer, delay = 0 }: { question: string; answer: string; delay?: number; key?: React.Key }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="border-b border-white/10"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg font-semibold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-cyan-400 transition-all pr-8">
          {question}
        </span>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center transition-all ${isOpen ? 'bg-gradient-to-r from-violet-500 to-cyan-500 border-transparent' : 'group-hover:border-violet-500/50'}`}>
          {isOpen ? (
            <Minus className="w-4 h-4 text-white" />
          ) : (
            <Plus className="w-4 h-4 text-white/60 group-hover:text-violet-400 transition-colors" />
          )}
        </div>
      </button>

      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <p className="pb-6 text-white/55 leading-relaxed">
            {answer}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
