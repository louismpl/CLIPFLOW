import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, FileText, Scale, CreditCard, Shield, UserCheck } from 'lucide-react';

interface ConditionsProps {
  onBack: () => void;
}

const SECTIONS = [
  {
    icon: FileText,
    title: "1. Objet",
    content: "Les présentes conditions d'utilisation régissent l'accès et l'utilisation de la plateforme ClipFlow, qui propose des outils d'analyse vidéo par intelligence artificielle. En créant un compte ou en utilisant nos services, tu acceptes sans réserve ces conditions."
  },
  {
    icon: UserCheck,
    title: "2. Inscription et compte",
    content: "Pour accéder à certaines fonctionnalités, tu dois créer un compte avec une adresse e-mail valide. Tu es responsable de la confidentialité de tes identifiants et de l'activité réalisée depuis ton compte. ClipFlow se réserve le droit de suspendre tout compte en cas d'utilisation frauduleuse."
  },
  {
    icon: Scale,
    title: "3. Propriété intellectuelle",
    content: "Tu restes propriétaire des vidéos que tu analyses via notre plateforme. ClipFlow ne revendique aucun droit sur ton contenu. Toutefois, en utilisant nos services, tu nous accordes une licence limitée permettant de traiter tes vidéos pour fournir l'analyse demandée."
  },
  {
    icon: CreditCard,
    title: "4. Abonnements et paiements",
    content: "Nos offres incluent un plan gratuit et des abonnements payants. Les paiements sont sécurisés et les abonnements se renouvellent automatiquement chaque mois sauf résiliation. Tu peux annuler ton abonnement à tout moment depuis ton espace client."
  },
  {
    icon: Shield,
    title: "5. Limitation de responsabilité",
    content: "ClipFlow fournit des analyses générées par intelligence artificielle à titre indicatif. Nous ne garantissons pas la viralité d'un contenu ni les résultats obtenus sur les plateformes tierces. Notre responsabilité ne saurait être engagée en cas de non-atteinte des objectifs de performance."
  }
];

export const Conditions: React.FC<ConditionsProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#030014] text-white font-sans selection:bg-violet-500/30 overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[#030014]" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[70%] h-[70%] bg-violet-600/10 blur-[180px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[150px] rounded-full" />
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
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 text-sm font-bold uppercase tracking-widest mb-4">
              Légal
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
              Conditions{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                d'utilisation
              </span>
            </h1>
            <p className="text-lg text-white/35">
              Dernière mise à jour : janvier 2026
            </p>
          </motion.div>

          <div className="space-y-6">
            {SECTIONS.map((section, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.08 }}
                className="group relative p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-violet-500/20 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative z-10 flex gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                    <section.icon className="w-6 h-6 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-cyan-400 transition-all">
                      {section.title}
                    </h2>
                    <p className="text-white/55 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 text-center"
          >
            <p className="text-white/60 text-sm">
              Pour toute question concernant nos conditions d'utilisation, contacte-nous à{' '}
              <a href="mailto:legal@clipflow.app" className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 font-semibold hover:opacity-80 transition-opacity">
                legal@clipflow.app
              </a>
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
