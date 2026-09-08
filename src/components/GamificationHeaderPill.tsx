import React, { useState, useRef, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Zap,
  Award,
  ChevronRight,
  Star,
  Sparkles,
  ExternalLink,
  Target,
  Coins
} from 'lucide-react';
import { useGamification } from '../context/GamificationContext';
import { useKudos } from '../context/KudosContext';
import { useTasks } from '../context/TaskContext';

export const GamificationHeaderPill: React.FC = () => {
  const { userGamification, levelInfo, setIsRewardModalOpen, recentXpEvents } = useGamification();
  const { wallet, setIsKudosModalOpen } = useKudos();
  const { setViewMode } = useTasks();

  const [isOpen, setIsOpen] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unlockedAchievementsCount =
    userGamification.achievements?.filter((a) => a.unlocked).length || 0;
  const totalAchievementsCount = userGamification.achievements?.length || 8;

  const xpRemaining = Math.max(0, levelInfo.xpNeededForNext - levelInfo.xpInCurrentLevel);

  return (
    <div className="relative" ref={pillRef}>
      {/* The Gamification Badge Pill Button */}
      <button
        type="button"
        id="btn-gamification-badge"
        onClick={() => setIsOpen(!isOpen)}
        title={`Level ${levelInfo.level}: ${levelInfo.levelTitle} (${levelInfo.currentXp} XP) - Click for Gamification & Rewards`}
        className={`h-8 px-2 sm:px-2.5 rounded flex items-center gap-1.5 sm:gap-2 border text-xs font-medium transition-all cursor-pointer select-none active:scale-95 group ${
          isOpen
            ? 'bg-amber-500/20 border-amber-500/50 text-white shadow-md shadow-amber-500/10'
            : 'bg-gradient-to-r from-amber-950/30 via-[#1a1a1a] to-[#171717] hover:bg-[#222222] text-neutral-200 hover:text-white border-amber-500/30 hover:border-amber-400/60 shadow-xs'
        }`}
      >
        {/* Level Icon / Avatar */}
        <div className="flex items-center gap-1">
          <span className="text-sm leading-none filter drop-shadow-xs group-hover:scale-110 transition-transform">
            {levelInfo.levelIcon || '🏆'}
          </span>
          <span className="font-extrabold text-amber-400 text-xs tracking-tight">
            Lv.{levelInfo.level}
          </span>
        </div>

        {/* Level Title or XP (visible on medium screens and above) */}
        <div className="hidden md:flex items-center gap-1.5 border-l border-[#333333] pl-1.5 text-[11px]">
          <span className="font-semibold text-neutral-200 truncate max-w-[90px] lg:max-w-[110px]">
            {levelInfo.levelTitle}
          </span>
          <span className="text-[10px] text-amber-400 font-mono bg-amber-950/50 px-1 py-0.2 rounded border border-amber-800/40">
            {levelInfo.currentXp} XP
          </span>
        </div>

        {/* Mini Level Progress Track (visible on sm screens and above) */}
        <div
          className="hidden sm:flex flex-col justify-center w-8 lg:w-10 h-1.5 bg-[#262626] rounded-full overflow-hidden border border-[#383838]"
          title={`${levelInfo.progressPercent}% to Level ${levelInfo.nextLevel.level}`}
        >
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300"
            style={{ width: `${levelInfo.progressPercent}%` }}
          />
        </div>

        {/* Kudos Balance Badge */}
        <div
          className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/70 hover:bg-amber-900/60 px-2 py-0.5 rounded border border-amber-500/50 shrink-0 transition-colors shadow-xs"
          title={`Kudos Balance: ${wallet.balance} / ${wallet.cap} Kudos available`}
        >
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-extrabold text-amber-300">{wallet.balance}</span>
          <span className="text-[9px] text-amber-400/90 font-bold uppercase tracking-wider hidden sm:inline">
            Kudos
          </span>
        </div>

        {/* Streak Flame */}
        {(userGamification.currentStreak || 0) > 0 && (
          <div
            className="flex items-center gap-0.5 text-[10px] font-bold text-orange-400 bg-orange-950/40 px-1 sm:px-1.5 py-0.5 rounded border border-orange-800/30 shrink-0"
            title={`${userGamification.currentStreak} day contribution streak!`}
          >
            <Flame className="w-3 h-3 fill-orange-500 text-orange-400 animate-pulse" />
            <span>{userGamification.currentStreak}d</span>
          </div>
        )}
      </button>

      {/* Interactive Quick Overview Popover */}
      {isOpen && (
        <div
          id="popover-gamification-details"
          className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm bg-[#161616] rounded-xl shadow-2xl border border-amber-500/30 p-3.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-3"
        >
          {/* Header with Title & Level Badge */}
          <div className="flex items-center justify-between border-b border-[#262626] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500/30 to-amber-600/10 border border-amber-500/40 flex items-center justify-center text-lg shadow-sm shadow-amber-500/10">
                {levelInfo.levelIcon || '🏆'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white text-xs tracking-tight">
                    Level {levelInfo.level}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {levelInfo.levelTitle}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400">
                  {levelInfo.currentXp.toLocaleString()} Total XP earned
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsRewardModalOpen(true);
              }}
              title="Open Rewards Modal"
              className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              <span>Rewards</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Level Progress Bar & Next Level Info */}
          <div className="bg-[#1d1d1d] border border-[#2b2b2b] rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-300 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Next: {levelInfo.nextLevel.title}</span>
              </span>
              <span className="font-bold text-amber-400">{levelInfo.progressPercent}%</span>
            </div>

            {/* Progress Track */}
            <div className="w-full h-2 bg-[#121212] rounded-full overflow-hidden border border-[#333333]">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 rounded-full transition-all duration-500"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-neutral-400">
              <span>{levelInfo.xpInCurrentLevel} XP in level</span>
              <span className="text-amber-300/80 font-medium">
                {xpRemaining} XP to Level {levelInfo.nextLevel.level}
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {/* Streak */}
            <div className="bg-[#1a1a1a] border border-[#282828] rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-orange-400 font-bold text-xs">
                <Flame className="w-3.5 h-3.5 fill-orange-500" />
                <span>{userGamification.currentStreak || 0}d</span>
              </div>
              <span className="text-[9px] text-neutral-400 mt-0.5">Streak</span>
            </div>

            {/* Completed Tasks */}
            <div className="bg-[#1a1a1a] border border-[#282828] rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                <Target className="w-3.5 h-3.5" />
                <span>{userGamification.tasksCompleted || 0}</span>
              </div>
              <span className="text-[9px] text-neutral-400 mt-0.5">Tasks</span>
            </div>

            {/* Badges / Achievements */}
            <div className="bg-[#1a1a1a] border border-[#282828] rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-purple-400 font-bold text-xs">
                <Award className="w-3.5 h-3.5" />
                <span>
                  {unlockedAchievementsCount}/{totalAchievementsCount}
                </span>
              </div>
              <span className="text-[9px] text-neutral-400 mt-0.5">Badges</span>
            </div>

            {/* Kudos Balance */}
            <div className="bg-[#1a1a1a] border border-amber-500/30 rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-amber-300 font-bold text-xs">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>{wallet.balance}</span>
              </div>
              <span className="text-[9px] text-amber-400/90 font-bold uppercase mt-0.5">Kudos</span>
            </div>
          </div>

          {/* Recent XP Activity if present */}
          {recentXpEvents && recentXpEvents.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Recent XP Gain
              </span>
              <div className="bg-[#191919] border border-[#262626] rounded-lg p-2 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 truncate text-neutral-300">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">{recentXpEvents[0].reason}</span>
                </div>
                <span className="font-bold text-emerald-400 shrink-0 ml-1.5">
                  +{recentXpEvents[0].amount} XP
                </span>
              </div>
            </div>
          )}

          {/* Kudos Wallet Bar */}
          <div className="bg-gradient-to-r from-amber-950/40 via-[#1c1c1c] to-[#181818] border border-amber-500/30 rounded-lg p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Coins className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-amber-300 text-xs">{wallet.balance} Kudos</span>
                <span className="block text-[10px] text-neutral-400">
                  Cap: {wallet.cap} · +{wallet.earnedTotal} earned
                </span>
              </div>
            </div>
            <button
              type="button"
              id="btn-popover-open-kudos"
              onClick={() => {
                setIsOpen(false);
                setIsKudosModalOpen(true);
              }}
              className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-1 rounded font-semibold transition-colors cursor-pointer"
            >
              Kudos Hub
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#262626]">
            <button
              type="button"
              id="btn-popover-open-rewards"
              onClick={() => {
                setIsOpen(false);
                setIsRewardModalOpen(true);
              }}
              className="py-1.5 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] shadow-sm shadow-amber-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Quests &amp; Badges</span>
            </button>

            <button
              type="button"
              id="btn-popover-view-leaderboard"
              onClick={() => {
                setIsOpen(false);
                setViewMode('rewards');
              }}
              className="py-1.5 px-2.5 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-neutral-200 hover:text-white font-semibold text-[11px] border border-[#333333] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>Leaderboard</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
