import React from 'react';
import { useGamification } from '../context/GamificationContext';
import { Flame, Trophy, Sparkles, ChevronRight } from 'lucide-react';

export const GamificationHeaderPill: React.FC = () => {
  const { userGamification, levelInfo, setIsRewardModalOpen } = useGamification();

  return (
    <div
      onClick={() => setIsRewardModalOpen(true)}
      title="Open Level, Quests & Leaderboard"
      className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] hover:border-amber-500/50 rounded cursor-pointer transition-all shadow-xs group select-none"
    >
      {/* Level icon + number */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{levelInfo.levelIcon}</span>
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-black text-amber-400 tracking-tight leading-none uppercase">
            Lv.{levelInfo.level}
          </span>
          <span className="text-[9px] font-medium text-neutral-400 leading-tight truncate max-w-[75px]">
            {levelInfo.levelTitle}
          </span>
        </div>
      </div>

      {/* Mini XP Progress Bar */}
      <div className="flex flex-col gap-0.5 w-16 hidden lg:flex">
        <div className="flex justify-between text-[8px] text-neutral-400 font-mono">
          <span>{levelInfo.xpInCurrentLevel} XP</span>
          <span>{levelInfo.progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-[#2c2c2c] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300"
            style={{ width: `${levelInfo.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Streak Badge */}
      <div className="flex items-center gap-1 pl-1.5 border-l border-[#2e2e2e]">
        <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
        <span className="text-xs font-bold text-amber-300">
          {userGamification.currentStreak}d
        </span>
      </div>

      <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400 transition-colors" />
    </div>
  );
};
