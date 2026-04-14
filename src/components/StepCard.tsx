import React from 'react';
import { motion } from 'motion/react';

interface StepCardProps {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
  isLast?: boolean;
  key?: React.Key;
}

export const StepCard: React.FC<StepCardProps> = ({ number, icon, title, description, delay = 0, isLast = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      className="relative flex flex-col items-center text-center px-6"
    >
      {/* Connector line */}
      {!isLast && (
        <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-[1px] bg-gradient-to-r from-violet-500/20 to-transparent" />
      )}
      
      <motion.div 
        className="relative mb-6"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 flex items-center justify-center backdrop-blur-sm text-white">
          {icon}
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-white text-sm font-bold flex items-center justify-center border-2 border-[#030014] shadow-lg shadow-violet-500/30">
          {number}
        </div>
      </motion.div>
      
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-white/50 max-w-xs leading-relaxed">{description}</p>
    </motion.div>
  );
};
