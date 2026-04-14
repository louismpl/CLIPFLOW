import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Database, Eye, Lock, Share2, UserCheck } from 'lucide-react';

interface ConfidentialiteProps {
  onBack: () => void;
}

const SECTIONS = [
  {
    icon: Database,
    title: "1. Données collectées",
    content: "Lors de ton inscription, nous collectons ton adresse e-mail, ton prénom et les informations relatives à ton utilisation de la plateforme (nombre de vidéos analysées, préférences d'export, etc.). Nous ne collectons aucune donnée bancaire directement : les paiements sont sécurisés par nos prestataires externes."
  },
  {
    icon: Eye,
    title: "2. Utilisation des données",
    content: "Tes données personnelles nous servent uniquement à fournir et améliorer nos services, à te communiquer des informations importantes et à personnaliser ton expérience. Nous n'utilisons jamais tes vidéos analysées à des fins publicitaires sans ton consentement explicite."
  },
  {
    icon: Lock,
    title: "3. Conservation et sécurité",
    content: "Tes données sont stockées sur des serveurs sécurisés situés en Europe. Nous conservons tes informations aussi longtemps que ton compte est actif, ou le temps nécessaire à la résolution d'éventuels litiges. Tu peux demander la suppression de tes données à tout moment."
  },
  {
    icon: Share2,
    title: "4. Partage avec des tiers",
    content: "ClipFlow ne vend pas tes données personnelles. Nous ne les partageons qu'avec nos sous-traitants techniques (hébergement, paiement) dans la stricte mesure nécessaire au fonctionnement du service, et toujours dans le respect du RGPD."
  },
  {
    icon: UserCheck,
    title: "5. Tes droits",
    content: "Conformément au RGPD, tu disposes d'un droit d'accès, de rectification, de suppression et de portabilité de tes données. Pour exercer ces droits, contacte-nous à l'adresse privacy@clipflow.app."
  }
];

export const Confidentialite: React.FC<ConfidentialiteProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#030014] text-white font-sans selection:bg-violet-500/30 overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[#030014]" />
        <div className="absolute top-[-20%] right-[-20%] w-[70%] h-[70%] bg-cyan-600/10 blur-[180px] rounded-full" />
        <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-violet-600/10 blur-[150px] rounded-full" />
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
            <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 text-sm font-bold uppercase tracking-widest mb-4">
              Légal
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
              Politique de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                confidentialité
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
                className="group relative p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/20 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative z-10 flex gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <section.icon className="w-6 h-6 text-cyan-400" />
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
            className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 text-center"
          >
            <p className="text-white/60 text-sm">
              Pour toute question relative à la protection de tes données, écris-nous à{' '}
              <a href="mailto:privacy@clipflow.app" className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 font-semibold hover:opacity-80 transition-opacity">
                privacy@clipflow.app
              </a>
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
