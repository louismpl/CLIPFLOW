import React from 'react';
import { motion } from 'motion/react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
  key?: React.Key;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-sm overflow-hidden hover:border-violet-500/40 transition-all duration-500"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:from-violet-500/20 group-hover:to-cyan-500/20 transition-all duration-300 text-violet-400">
          {icon}
        </div>
        
        <h3 className="text-xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-cyan-400 transition-all duration-300">
          {title}
        </h3>
        
        <p className="text-white/50 leading-relaxed group-hover:text-white/60 transition-colors">
          {description}
        </p>
      </div>
    </motion.div>
  );
};
