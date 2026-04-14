import React from 'react';
import { motion } from 'motion/react';

export const StepLinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="8" y="8" width="32" height="32" rx="10" stroke="currentColor" strokeWidth="2" />
    <motion.path
      d="M18 24H30M30 24L26 20M30 24L26 28"
      stroke="url(#stepLinkGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
    />
    <defs>
      <linearGradient id="stepLinkGrad" x1="18" y1="24" x2="30" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8b5cf6" />
        <stop offset="1" stopColor="#22d3ee" />
      </linearGradient>
    </defs>
  </svg>
);

export const StepAIIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" />
    <motion.g
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      style={{ originX: "24px", originY: "24px" }}
    >
      <circle cx="24" cy="6" r="3" fill="url(#stepAiGrad1)" />
      <circle cx="40" cy="24" r="2" fill="url(#stepAiGrad2)" />
      <circle cx="24" cy="42" r="2" fill="url(#stepAiGrad3)" />
    </motion.g>
    <motion.path
      d="M24 16L27 22H33L28 26L30 32L24 28L18 32L20 26L15 22H21L24 16Z"
      fill="url(#stepAiCenter)"
      animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 2, repeat: Infinity }}
      style={{ originX: "24px", originY: "24px" }}
    />
    <defs>
      <linearGradient id="stepAiGrad1" x1="21" y1="6" x2="27" y2="6" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8b5cf6" />
        <stop offset="1" stopColor="#c084fc" />
      </linearGradient>
      <linearGradient id="stepAiGrad2" x1="38" y1="24" x2="42" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#22d3ee" />
        <stop offset="1" stopColor="#67e8f9" />
      </linearGradient>
      <linearGradient id="stepAiGrad3" x1="22" y1="42" x2="26" y2="42" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a78bfa" />
        <stop offset="1" stopColor="#22d3ee" />
      </linearGradient>
      <linearGradient id="stepAiCenter" x1="15" y1="16" x2="33" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8b5cf6" />
        <stop offset="1" stopColor="#22d3ee" />
      </linearGradient>
    </defs>
  </svg>
);

export const StepRocketIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    {/* Rocket body */}
    <path d="M24 8C24 8 16 18 16 28C16 31 18 34 24 34C30 34 32 31 32 28C32 18 24 8 24 8Z" fill="url(#rocketBodyGrad)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Window */}
    <circle cx="24" cy="21" r="3.5" fill="#030014" stroke="currentColor" strokeWidth="1.5"/>
    {/* Fins */}
    <path d="M16 26L12 32L17 30.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M32 26L36 32L31 30.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Animated flame - plus élégant */}
    <motion.path
      d="M20 34C20 34 22 40 24 40C26 40 28 34 28 34"
      stroke="url(#rocketFlameGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="url(#rocketFlameGrad)"
      animate={{ 
        d: [
          "M20 34C20 34 21.5 40 24 40C26.5 40 28 34 28 34",
          "M20 34C20 34 22.5 42.5 24 42.5C25.5 42.5 28 34 28 34",
          "M20 34C20 34 21.5 40 24 40C26.5 40 28 34 28 34",
        ],
        opacity: [0.9, 0.5, 0.9],
      }}
      transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Particules de fumée */}
    {[0, 1, 2].map((i) => (
      <motion.circle
        key={i}
        cx={21 + i * 1.5}
        cy={40}
        r="1"
        fill="white"
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: [0, 0.4, 0], y: [0, 8, 16], x: [0, (i - 1) * 4, (i - 1) * 6] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
    <defs>
      <linearGradient id="rocketBodyGrad" x1="16" y1="8" x2="32" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8b5cf6" />
        <stop offset="1" stopColor="#3b82f6" />
      </linearGradient>
      <linearGradient id="rocketFlameGrad" x1="20" y1="34" x2="28" y2="42" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f59e0b" />
        <stop offset="1" stopColor="#ef4444" />
      </linearGradient>
    </defs>
  </svg>
);

export const LightningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <motion.path
      d="M27 6L14 26H23L19 42L36 22H25L27 6Z"
      fill="url(#boltGrad)"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ 
        filter: [
          "drop-shadow(0 0 6px #8b5cf6)",
          "drop-shadow(0 0 24px #22d3ee)",
          "drop-shadow(0 0 6px #8b5cf6)",
        ]
      }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <defs>
      <linearGradient id="boltGrad" x1="14" y1="6" x2="36" y2="42" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a78bfa"/>
        <stop offset="1" stopColor="#22d3ee"/>
      </linearGradient>
    </defs>
  </svg>
);

export const ChartRiseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="6" y="6" width="36" height="36" rx="8" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="2"/>
    {[14, 22, 30].map((x, i) => (
      <motion.rect
        key={x}
        x={x}
        y={34}
        width="5"
        rx="2.5"
        fill="url(#chartGrad)"
        animate={{ y: [34, 34 - (i + 1) * 7, 34], height: [4, 4 + (i + 1) * 7, 4] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5, delay: i * 0.2 }}
      />
    ))}
    <motion.path
      d="M12 30L19 23L27 27L38 15"
      stroke="url(#chartGrad)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      transition={{ duration: 1.5 }}
    />
    <defs>
      <linearGradient id="chartGrad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8b5cf6"/>
        <stop offset="1" stopColor="#22d3ee"/>
      </linearGradient>
    </defs>
  </svg>
);

export const SearchPulseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <motion.circle
      cx="21"
      cy="21"
      r="11"
      stroke="currentColor"
      strokeWidth="3"
      fill="none"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2.5, repeat: Infinity }}
    />
    <motion.path
      d="M29 29L40 40"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
    />
    {[0, 1].map((i) => (
      <motion.circle
        key={i}
        cx="21"
        cy="21"
        r={13 + i * 4}
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeOpacity={0.15}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0], scale: [1, 1.15, 1.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
      />
    ))}
  </svg>
);

export const FilmStripIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="4" y="8" width="40" height="32" rx="6" stroke="currentColor" strokeWidth="2.5"/>
    {[8, 16, 24, 32].map((x) => (
      <rect key={x} x={x} y="4" width="4" height="4" rx="1" fill="currentColor"/>
    ))}
    {[8, 16, 24, 32].map((x) => (
      <rect key={`b-${x}`} x={x} y="40" width="4" height="4" rx="1" fill="currentColor"/>
    ))}
    <motion.circle
      cx="24"
      cy="24"
      r="7"
      fill="url(#filmGrad)"
      animate={{ scale: [1, 1.12, 1] }}
      transition={{ duration: 2.5, repeat: Infinity }}
    />
    <defs>
      <linearGradient id="filmGrad" x1="4" y1="8" x2="44" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8b5cf6"/>
        <stop offset="1" stopColor="#3b82f6"/>
      </linearGradient>
    </defs>
  </svg>
);

export const SubtitleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="4" y="10" width="40" height="28" rx="8" stroke="currentColor" strokeWidth="2.5"/>
    <motion.rect
      x="10"
      y="18"
      width="18"
      height="3"
      rx="1.5"
      fill="url(#subGrad)"
      animate={{ width: [18, 24, 18] }}
      transition={{ duration: 2.5, repeat: Infinity }}
    />
    <motion.rect
      x="10"
      y="26"
      width="26"
      height="3"
      rx="1.5"
      fill="url(#subGrad)"
      animate={{ width: [26, 18, 26] }}
      transition={{ duration: 2.8, repeat: Infinity, delay: 0.4 }}
    />
    <defs>
      <linearGradient id="subGrad" x1="4" y1="10" x2="44" y2="38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8b5cf6"/>
        <stop offset="1" stopColor="#3b82f6"/>
      </linearGradient>
    </defs>
  </svg>
);

export const WandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <motion.path
      d="M12 36L36 12"
      stroke="url(#wandGrad)"
      strokeWidth="3"
      strokeLinecap="round"
      animate={{ opacity: [1, 0.5, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <path d="M8 16L13 18L15 24L17 18L23 16L17 14L15 8L13 14L8 16Z" fill="url(#wandGrad)"/>
    <path d="M29 8L33 10L35 14L37 10L41 8L37 6L35 2L33 6L29 8Z" fill="url(#wandGrad)"/>
    <motion.circle
      cx="35"
      cy="12"
      r="2.5"
      fill="white"
      animate={{ opacity: [1, 0.3, 1], scale: [1, 1.6, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <defs>
      <linearGradient id="wandGrad" x1="8" y1="2" x2="41" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#c084fc"/>
        <stop offset="1" stopColor="#22d3ee"/>
      </linearGradient>
    </defs>
  </svg>
);
