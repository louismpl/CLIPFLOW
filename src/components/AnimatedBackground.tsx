import React from 'react';
import { motion } from 'motion/react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[#030014]" />
      
      {/* Animated aurora orbs - violet/blue theme */}
      <motion.div
        animate={{
          x: [0, 150, 80, 0],
          y: [0, -80, 120, 0],
          scale: [1, 1.4, 0.9, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-violet-600/20 blur-[180px] rounded-full"
      />
      
      <motion.div
        animate={{
          x: [0, -120, 60, 0],
          y: [0, 100, -60, 0],
          scale: [1, 0.8, 1.5, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-blue-600/20 blur-[180px] rounded-full"
      />
      
      <motion.div
        animate={{
          x: [0, 80, -100, 0],
          y: [0, -120, 40, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[30%] right-[20%] w-[40%] h-[40%] bg-fuchsia-500/15 blur-[150px] rounded-full"
      />

      <motion.div
        animate={{
          x: [0, -60, 100, 0],
          y: [0, 80, -40, 0],
          scale: [1, 0.9, 1.3, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[20%] left-[10%] w-[35%] h-[35%] bg-cyan-500/15 blur-[140px] rounded-full"
      />

      {/* Subtle grid */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '120px 120px',
        }}
      />

      {/* Noise texture */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${10 + i * 12}%`,
            top: `${15 + (i % 4) * 20}%`,
            background: i % 2 === 0 ? '#8b5cf6' : '#06b6d4',
            boxShadow: `0 0 6px ${i % 2 === 0 ? '#8b5cf6' : '#06b6d4'}`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 5 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}
    </div>
  );
};
