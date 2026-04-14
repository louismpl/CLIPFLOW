import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Sparkles, Shield } from 'lucide-react';
import { login, register } from '../services/auth';

interface AuthDashboardProps {
  onBack: () => void;
  onLoginSuccess?: () => void;
}

export const AuthDashboard: React.FC<AuthDashboardProps> = ({ onBack, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (mode === 'login') {
      const result = login(email, password);
      if (result.success) {
        onLoginSuccess?.();
      } else {
        setError(result.error ?? 'Une erreur est survenue.');
      }
    } else {
      const result = register(email, password);
      if (result.success) {
        onLoginSuccess?.();
      } else {
        setError(result.error ?? 'Une erreur est survenue.');
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white font-sans selection:bg-violet-500/30 overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[#030014]" />
        <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-violet-600/15 blur-[180px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-cyan-600/15 blur-[180px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] bg-fuchsia-500/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-violet-400/30 rounded-full blur-sm animate-bounce" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-cyan-400/20 rounded-full blur-sm animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-fuchsia-400/20 rounded-full blur-sm animate-bounce" style={{ animationDuration: '6s', animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 py-4 px-6 bg-[#030014]/60 backdrop-blur-2xl border-b border-white/5 transition-all">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
            <img src="/clipflow-logo.png" alt="ClipFlow" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">ClipFlow</span>
          </div>
          <div className="w-28" />
        </div>
      </header>

      <main className="pt-40 pb-20 px-6 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Main card with animated border */}
          <div className="relative group">
            {/* Animated gradient border */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-violet-500 via-cyan-500 to-violet-500 rounded-[28px] opacity-40 group-hover:opacity-70 transition-opacity duration-500 blur-[1px] animate-spin" style={{ animationDuration: '8s' }} />
            
            <div className="relative p-8 md:p-10 rounded-[27px] bg-[#030014]/80 border border-white/10 backdrop-blur-2xl overflow-hidden">
              {/* Inner glows */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 via-transparent to-cyan-500/8" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/12 blur-[100px] rounded-full" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/12 blur-[100px] rounded-full" />
              
              <div className="relative z-10">
                {/* Top badge */}
                <div className="flex justify-center mb-6">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-semibold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Accès gratuit inclus</span>
                  </motion.div>
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl md:text-4xl font-extrabold mb-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                    {mode === 'login' ? 'Bon retour' : 'Crée ton compte'}
                  </h1>
                  <p className="text-white/40">
                    {mode === 'login' 
                      ? 'Connecte-toi pour accéder à tes analyses' 
                      : 'Inscris-toi gratuitement et commence à créer'}
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 rounded-2xl bg-white/[0.03] border border-white/5 mb-8">
                  <button
                    onClick={() => { setMode('login'); setError(null); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                      mode === 'login' 
                        ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/25' 
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => { setMode('register'); setError(null); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                      mode === 'register' 
                        ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/25' 
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Inscription
                  </button>
                </div>

                {/* Form */}
                <AnimatePresence mode="wait">
                  <motion.form
                    key={mode}
                    initial={{ opacity: 0, x: mode === 'login' ? -15 : 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: mode === 'login' ? 15 : -15 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="space-y-4"
                    onSubmit={handleSubmit}
                  >
                    {mode === 'register' && (
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-violet-400 transition-colors" />
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Ton prénom"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all"
                        />
                      </div>
                    )}
                    
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-violet-400 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Adresse e-mail"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all"
                      />
                    </div>

                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-violet-400 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mot de passe"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-12 py-4 text-sm placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-red-400 text-sm"
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {mode === 'login' && (
                      <div className="flex justify-end">
                        <button type="button" className="text-xs text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 hover:opacity-80 transition-opacity font-semibold">
                          Mot de passe oublié ?
                        </button>
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.01, boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)' }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={isLoading || !email || !password || (mode === 'register' && !firstName)}
                      className="w-full py-4 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 rounded-xl font-bold transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                    </motion.button>
                  </motion.form>
                </AnimatePresence>

                {/* Divider */}
                <div className="mt-8 mb-6 flex items-center gap-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <span className="text-xs text-white/25 font-medium">Ou continue avec</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                {/* Social buttons */}
                <div className="flex justify-center gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2, borderColor: 'rgba(255,255,255,0.25)' }} 
                    whileTap={{ scale: 0.95 }} 
                    className="group flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Google</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2, borderColor: 'rgba(255,255,255,0.25)' }} 
                    whileTap={{ scale: 0.95 }} 
                    className="group flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#1877F2"/></svg>
                    <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Facebook</span>
                  </motion.button>
                </div>

                {/* Trust indicator */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 flex items-center justify-center gap-2 text-xs text-white/25"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Connexion sécurisée avec chiffrement SSL</span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
