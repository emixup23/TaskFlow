import React, { useState } from 'react';
import { useGamification } from '../context/GamificationContext';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  Flame,
  Zap,
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  Users,
  Target,
  ArrowUpRight,
  Compass
} from 'lucide-react';
import { AdventurePathTab } from './AdventurePathTab';

export const GamificationView: React.FC = () => {
  const { userGamification, levelInfo, leaderboard, quests, claimQuestReward, awardXP } = useGamification();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'quests' | 'adventure' | 'leaderboard' | 'badges' | 'rules'>('quests');

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0d0d0d] space-y-6">
      {/* Top Banner Hero */}
      <div className="p-6 bg-gradient-to-r from-[#181818] via-[#141414] to-[#121212] border border-[#2a2a2a] rounded relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded bg-gradient-to-tr from-amber-500/30 to-amber-600/10 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-xl shadow-amber-500/20 p-2 overflow-hidden">
              {levelInfo.levelIcon?.startsWith('/') || levelInfo.levelIcon?.endsWith('.svg') || levelInfo.levelIcon?.endsWith('.png') ? (
                <img src={levelInfo.levelIcon} alt="level icon" className="w-12 h-12 object-contain" />
              ) : (
                levelInfo.levelIcon
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Level {levelInfo.level}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {userGamification.xp} Total XP
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {levelInfo.levelTitle}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Keep delivering tasks to climb the team leaderboard and level up your sprint status
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-[#1a1a1a] p-3 rounded border border-[#303030]">
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1 text-amber-400">
                <Flame className="w-4 h-4 fill-amber-400" />
                <span className="text-base font-black">{userGamification.currentStreak}d</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-semibold uppercase">Streak</span>
            </div>
            <div className="w-px h-8 bg-[#2e2e2e]" />
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-base font-black">{userGamification.tasksCompleted}</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-semibold uppercase">Shipped</span>
            </div>
            <div className="w-px h-8 bg-[#2e2e2e]" />
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1 text-blue-400">
                <Award className="w-4 h-4" />
                <span className="text-base font-black">
                  {userGamification.achievements?.filter((a) => a.unlocked).length || 0}
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-semibold uppercase">Badges</span>
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="mt-5 pt-4 border-t border-[#262626]">
          <div className="flex justify-between items-center text-xs font-semibold text-neutral-300 mb-1.5">
            <span>Progress to Level {levelInfo.level + 1} ({levelInfo.nextLevel.title})</span>
            <span className="text-amber-300 font-mono">{levelInfo.xpInCurrentLevel} / {levelInfo.xpNeededForNext} XP ({levelInfo.progressPercent}%)</span>
          </div>
          <div className="w-full h-2.5 bg-[#262626] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#262626] gap-2 pb-1">
        <button
          type="button"
          id="tab-active-quests"
          onClick={() => setActiveTab('quests')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'quests'
              ? 'border-amber-500 text-amber-400 bg-[#161616]'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Active Quests</span>
        </button>

        <button
          type="button"
          id="tab-adventure-path-view"
          onClick={() => setActiveTab('adventure')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'adventure'
              ? 'border-amber-500 text-amber-400 bg-[#161616]'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Compass className="w-4 h-4 text-amber-400" />
          <span>Advanture Path</span>
        </button>

        <button
          type="button"
          id="tab-team-leaderboard"
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'leaderboard'
              ? 'border-amber-500 text-amber-400 bg-[#161616]'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Leaderboard</span>
        </button>

        <button
          type="button"
          id="tab-badges"
          onClick={() => setActiveTab('badges')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'badges'
              ? 'border-amber-500 text-amber-400 bg-[#161616]'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Badges</span>
        </button>

        <button
          type="button"
          id="tab-xp-rules"
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'rules'
              ? 'border-amber-500 text-amber-400 bg-[#161616]'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>XP Rules</span>
        </button>
      </div>

      {/* Advanture Path */}
      {activeTab === 'adventure' && (
        <AdventurePathTab currentUser={currentUser} awardXP={awardXP} />
      )}

      {/* 1. Quests */}
      {activeTab === 'quests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quests.map((quest) => {
            const percent = Math.min(100, Math.round((quest.progress / quest.maxProgress) * 100));

            return (
              <div
                key={quest.id}
                className={`p-4 rounded border transition-all flex flex-col justify-between gap-3 ${
                  quest.completed
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'bg-[#141414] border-[#262626]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded flex items-center justify-center text-base shrink-0 ${
                        quest.completed
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                          : 'bg-[#222222] text-neutral-400'
                      }`}
                    >
                      {quest.completed ? <Sparkles className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{quest.title}</h4>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                            quest.type === 'daily'
                              ? 'bg-blue-950/60 text-blue-300 border border-blue-800'
                              : 'bg-purple-950/60 text-purple-300 border border-purple-800'
                          }`}
                        >
                          {quest.type}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">{quest.description}</p>
                    </div>
                  </div>

                  <span className="text-xs font-black text-amber-300 font-mono bg-[#1f1f1f] px-2 py-1 rounded border border-[#2d2d2d] shrink-0">
                    +{quest.xpReward} XP
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#262626]">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Progress</span>
                    <span className="font-mono">{quest.progress}/{quest.maxProgress} ({percent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-[#222222] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        quest.completed ? 'bg-amber-400' : 'bg-blue-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {quest.completed ? (
                    <button
                      type="button"
                      onClick={() => claimQuestReward(quest.id)}
                      className="w-full mt-2 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black text-xs font-bold rounded shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Claim +{quest.xpReward} XP Reward</span>
                    </button>
                  ) : (
                    <div className="w-full mt-2 py-1.5 text-center text-neutral-500 text-xs font-medium bg-[#1a1a1a] rounded border border-[#262626]">
                      Task in progress
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-3">
          <div className="p-4 bg-[#141414] border border-[#262626] rounded space-y-2">
            {leaderboard.map((user) => {
              const isCurrent = user.id === currentUser?.id;
              const rankIcons = ['🥇', '🥈', '🥉'];
              const rankBadge = rankIcons[user.rank - 1] || `#${user.rank}`;

              return (
                <div
                  key={user.id}
                  className={`p-3.5 rounded border transition-all flex items-center justify-between gap-4 ${
                    isCurrent
                      ? 'bg-blue-950/30 border-blue-500/50 shadow-md'
                      : 'bg-[#181818] border-[#262626] hover:border-[#383838]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-8 h-8 rounded bg-[#222222] flex items-center justify-center font-bold text-base shrink-0">
                      {rankBadge}
                    </div>

                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded object-cover border border-[#333333] shrink-0"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{user.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-400/40 px-1.5 py-0.2 rounded font-semibold uppercase">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-400 truncate mt-0.5">
                        <span className="text-amber-400 font-bold">Lv.{user.level} {user.levelTitle}</span>
                        <span>•</span>
                        <span>{user.title} ({user.department})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-right shrink-0">
                    <div>
                      <span className="text-sm font-bold text-neutral-100 block font-mono">
                        {user.completedTasks}
                      </span>
                      <span className="text-[10px] text-neutral-400 uppercase">Shipped</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#202020] px-2.5 py-1 rounded border border-[#2e2e2e]">
                      <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-amber-300">{user.streak}d Streak</span>
                    </div>

                    <div className="min-w-[80px]">
                      <span className="text-sm font-black text-amber-300 block font-mono">
                        {user.xp} XP
                      </span>
                      <span className="text-[10px] text-neutral-400 uppercase">Total Score</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Badges */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {userGamification.achievements?.map((ach) => {
            const percent = Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100));

            return (
              <div
                key={ach.id}
                className={`p-4 rounded border transition-all flex flex-col justify-between gap-3 ${
                  ach.unlocked
                    ? 'bg-[#161616] border-amber-500/40 shadow-sm'
                    : 'bg-[#121212] border-[#222222] opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 ${
                      ach.unlocked
                        ? 'bg-amber-500/20 border border-amber-400/50 shadow-md shadow-amber-500/10'
                        : 'bg-[#1c1c1c] border border-[#2c2c2c]'
                    }`}
                  >
                    {ach.unlocked ? ach.icon : <Lock className="w-5 h-5 text-neutral-400" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white truncate">{ach.title}</h4>
                      <span className="text-[11px] font-black text-amber-300 font-mono">
                        +{ach.xpReward} XP
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1 leading-snug">
                      {ach.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#262626]">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-neutral-400">
                      {ach.unlocked ? 'Unlocked' : 'In Progress'}
                    </span>
                    <span className="font-mono text-neutral-300">
                      {ach.progress}/{ach.maxProgress}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#262626] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ach.unlocked ? 'bg-amber-400' : 'bg-neutral-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Rules */}
      {activeTab === 'rules' && (
        <div className="p-6 bg-[#141414] border border-[#262626] rounded space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Sprint Velocity & XP Multiplier Rules</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#181818] rounded border border-[#2a2a2a] flex justify-between items-center">
              <span className="text-neutral-300">Standard task shipped to Done</span>
              <span className="font-mono font-bold text-amber-300">+50 XP</span>
            </div>
            <div className="p-3 bg-[#181818] rounded border border-[#2a2a2a] flex justify-between items-center">
              <span className="text-neutral-300">Urgent priority task shipped</span>
              <span className="font-mono font-bold text-amber-300">+80 XP</span>
            </div>
            <div className="p-3 bg-[#181818] rounded border border-[#2a2a2a] flex justify-between items-center">
              <span className="text-neutral-300">Shipped on or before due date</span>
              <span className="font-mono font-bold text-amber-300">+20 XP Bonus</span>
            </div>
            <div className="p-3 bg-[#181818] rounded border border-[#2a2a2a] flex justify-between items-center">
              <span className="text-neutral-300">Check off subtask item</span>
              <span className="font-mono font-bold text-amber-300">+15 XP</span>
            </div>
            <div className="p-3 bg-[#181818] rounded border border-[#2a2a2a] flex justify-between items-center">
              <span className="text-neutral-300">Create & structure task with details</span>
              <span className="font-mono font-bold text-amber-300">+20 XP</span>
            </div>
            <div className="p-3 bg-[#181818] rounded border border-[#2a2a2a] flex justify-between items-center">
              <span className="text-neutral-300">Post updates / comment discussion</span>
              <span className="font-mono font-bold text-amber-300">+10 XP</span>
            </div>
            <div className="p-3 bg-[#181818] rounded border border-[#2a2a2a] flex justify-between items-center">
              <span className="text-neutral-300">Upload documentation & file attachments</span>
              <span className="font-mono font-bold text-amber-300">+15 XP</span>
            </div>
            <div className="p-3 bg-[#181818] rounded border border-[#2a2a2a] flex justify-between items-center">
              <span className="text-neutral-300">Daily contribution streak</span>
              <span className="font-mono font-bold text-amber-300">Up to 1.5x Multiplier</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
