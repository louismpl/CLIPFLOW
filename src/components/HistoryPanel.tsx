import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Clock, Trash2, ChevronDown, ChevronUp, History } from 'lucide-react';
import type { AnalysisRecord } from '../services/storage';

interface HistoryPanelProps {
  onRestore: (record: AnalysisRecord) => void;
  onClear?: () => void;
}

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) return 'Aujourd\'hui';
  if (date >= startOfYesterday) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function HistoryPanel({ onRestore, onClear }: HistoryPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [records, setRecords] = useState<AnalysisRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('clipflow_history');
      return raw ? (JSON.parse(raw) as AnalysisRecord[]) : [];
    } catch {
      return [];
    }
  });

  const visibleCount = expanded ? 10 : 5;
  const visible = useMemo(() => records.slice(0, visibleCount), [records, visibleCount]);

  const handleClear = () => {
    try {
      localStorage.removeItem('clipflow_history');
    } catch {
      // ignore
    }
    setRecords([]);
    onClear?.();
  };

  const handleRestore = (record: AnalysisRecord) => {
    onRestore(record);
  };

  const refresh = () => {
    try {
      const raw = localStorage.getItem('clipflow_history');
      setRecords(raw ? (JSON.parse(raw) as AnalysisRecord[]) : []);
    } catch {
      setRecords([]);
    }
  };

  // Refresh on mount and when window regains focus
  React.useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  if (records.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-12 max-w-3xl mx-auto"
    >
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6">
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-bold">Historique des analyses</h3>
            </div>
            <button
              onClick={handleClear}
              className="text-xs font-semibold text-white/40 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Effacer l&apos;historique
            </button>
          </div>

          <div className="space-y-3">
            {visible.map((record) => (
              <button
                key={record.id}
                onClick={() => handleRestore(record)}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/30 hover:bg-white/[0.07] transition-all text-left group"
              >
                <img
                  src={record.thumbnail}
                  alt={record.title}
                  className="w-20 h-14 object-cover rounded-lg bg-white/5 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-cyan-400 transition-all">
                    {record.title}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5 truncate">{record.author}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-white/30 flex-shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {formatRelativeDate(record.date)}
                </div>
              </button>
            ))}
          </div>

          {records.length > 5 && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-xs font-semibold text-white/40 hover:text-white transition-colors flex items-center gap-1"
              >
                {expanded ? (
                  <>
                    Voir moins <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Voir tout ({Math.min(records.length, 10)}) <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
