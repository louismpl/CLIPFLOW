import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link2, Copy, Download, Check } from 'lucide-react';
import { Clip } from '../services/gemini';

interface ClipActionsProps {
  clip: Clip;
  videoId: string;
  idx?: number;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const ClipActions: React.FC<ClipActionsProps> = ({ clip, videoId, idx }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const handleCopyLink = async () => {
    const link = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(clip.start)}s`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyTitleHashtags = async () => {
    const text = `${clip.suggested_title}\n\n${clip.suggested_hashtags.join(' ')}\n\n${clip.why_viral}`;
    await navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownloadScript = () => {
    const content = [
      `Hook: ${clip.hook}`,
      `Timestamps: ${formatTime(clip.start)} - ${formatTime(clip.end)}`,
      `Description: ${clip.description}`,
      `Why Viral: ${clip.why_viral}`,
      `Hashtags: ${clip.suggested_hashtags.join(' ')}`,
      '',
      'Breakdown:',
      ...Object.entries(clip.breakdown).map(([key, value]) => `  ${key.replace(/_/g, ' ')}: ${value}%`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clipflow-clip-${typeof idx === 'number' ? idx + 1 : '1'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ActionButton
        onClick={handleCopyLink}
        icon={copiedLink ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
        label={copiedLink ? 'Copié !' : 'Copier le lien'}
      />
      <ActionButton
        onClick={handleCopyTitleHashtags}
        icon={copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        label={copiedText ? 'Copié !' : 'Copier le titre + hashtags'}
      />
      <ActionButton
        onClick={handleDownloadScript}
        icon={<Download className="w-3.5 h-3.5" />}
        label="Télécharger le script"
      />
    </div>
  );
};

function ActionButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs font-medium text-white/80"
    >
      {icon}
      {label}
    </motion.button>
  );
}
