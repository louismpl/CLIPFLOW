import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, MessageSquare, Send, MapPin } from 'lucide-react';

interface ContactProps {
  onBack: () => void;
}

export const Contact: React.FC<ContactProps> = ({ onBack }) => {
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
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 text-sm font-bold uppercase tracking-widest mb-4">
              Contact
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
              Parlons de ton{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                projet
              </span>
            </h1>
            <p className="text-lg text-white/35 max-w-xl mx-auto">
              Une question ? Une suggestion ? Notre équipe te répond sous 24 heures.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Contact info cards */}
            <div className="lg:col-span-2 space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-violet-500/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="font-bold text-lg mb-1">E-mail</h3>
                <p className="text-white/40 text-sm mb-2">Notre équipe te répond rapidement.</p>
                <a href="mailto:hello@clipflow.app" className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 font-semibold hover:opacity-80 transition-opacity">
                  hello@clipflow.app
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="font-bold text-lg mb-1">Siège social</h3>
                <p className="text-white/40 text-sm">Paris, France</p>
                <p className="text-white/40 text-sm">Made with passion en Europe.</p>
              </motion.div>
            </div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-3 relative p-8 md:p-10 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/10 blur-[60px] rounded-full" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full" />
              
              <form className="relative z-10 space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Prénom</label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all"
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Nom</label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all"
                      placeholder="Dupont"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Adresse e-mail</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-violet-400 transition-colors" />
                    <input
                      type="email"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all"
                      placeholder="jean@exemple.fr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Message</label>
                  <div className="relative group">
                    <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-white/30 group-focus-within:text-violet-400 transition-colors" />
                    <textarea
                      rows={5}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all resize-none"
                      placeholder="Comment pouvons-nous t'aider ?"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 rounded-xl font-bold transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Envoyer mon message
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};
