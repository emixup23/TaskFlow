import React from 'react';
import { useGamification } from '../context/GamificationContext';
import { Trophy, Sparkles, ArrowRight, ShieldCheck, X } from 'lucide-react';

export const LevelUpModal: React.FC = () => {
  const { activeLevelUp, dismissLevelUp } = useGamification();

  if (!activeLevelUp) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#141414] border-2 border-amber-500/60 rounded p-6 text-center text-white shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Background ambient glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={dismissLevelUp}
          className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-white rounded hover:bg-[#262626] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Level Badge Icon */}
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-b from-amber-500/30 to-amber-600/10 border-2 border-amber-400 rounded-full flex items-center justify-center text-4xl shadow-lg shadow-amber-500/20">
          {activeLevelUp.icon?.startsWith('/') || activeLevelUp.icon?.endsWith('.svg') || activeLevelUp.icon?.endsWith('.png') ? (
            <img src={activeLevelUp.icon} alt="level icon" className="w-12 h-12 object-contain" />
          ) : (
            <span>{activeLevelUp.icon}</span>
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Level Up Achieved!</span>
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight mb-1">
          Level {activeLevelUp.level}
        </h2>
        <p className="text-sm font-semibold text-amber-400 mb-4">
          {activeLevelUp.title}
        </p>

        <p className="text-xs text-neutral-300 mb-6 leading-relaxed px-4">
          Congratulations! Your consistent task completions and sprint execution have advanced your rank in the workspace.
        </p>

        <div className="p-3 bg-[#1c1c1c] border border-[#2a2a2a] rounded mb-6 flex items-center justify-around text-xs">
          <div className="text-center">
            <span className="block text-[10px] text-neutral-400 uppercase font-semibold">XP Multiplier</span>
            <span className="font-bold text-amber-300">1.{activeLevelUp.level}x Active</span>
          </div>
          <div className="w-px h-8 bg-[#2a2a2a]" />
          <div className="text-center">
            <span className="block text-[10px] text-neutral-400 uppercase font-semibold">Rank Status</span>
            <span className="font-bold text-emerald-400">Promoted</span>
          </div>
        </div>

        <button
          type="button"
          onClick={dismissLevelUp}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs rounded transition-all shadow-md shadow-amber-500/25 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Claim Rewards & Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
