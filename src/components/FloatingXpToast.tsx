import React from 'react';
import { useGamification } from '../context/GamificationContext';
import { Zap, Sparkles } from 'lucide-react';

export const FloatingXpToast: React.FC = () => {
  const { recentXpEvents } = useGamification();

  if (recentXpEvents.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {recentXpEvents.map((evt) => (
        <div
          key={evt.id}
          className="flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-blue-900/90 via-blue-800/90 to-blue-950/90 border border-blue-400/50 shadow-xl shadow-blue-500/20 backdrop-blur-md rounded text-white text-xs font-bold animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <div className="w-6 h-6 rounded bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
            <Zap className="w-3.5 h-3.5 fill-amber-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-amber-300 font-extrabold text-sm tracking-wide">
              +{evt.amount} XP
            </span>
            <span className="text-[11px] text-blue-100 font-medium">{evt.reason}</span>
          </div>
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse ml-1" />
        </div>
      ))}
    </div>
  );
};
