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
  X,
  ChevronRight,
  TrendingUp,
  Compass
} from 'lucide-react';
import { AdventurePathTab } from './AdventurePathTab';

export const RewardsModal: React.FC = () => {
  const {
    isRewardModalOpen,
    setIsRewardModalOpen,
    userGamification,
    levelInfo,
    leaderboard,
    quests,
    claimQuestReward,
    awardXP
  } = useGamification();

  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'quests' | 'adventure' | 'leaderboard' | 'badges' | 'rules'>('quests');

  if (!isRewardModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] bg-[#121212] border border-[#2a2a2a] rounded shadow-2xl flex flex-col text-white overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#181818] to-[#141414] border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-gradient-to-tr from-amber-500/30 to-amber-600/10 border border-amber-500/40 flex items-center justify-center text-xl shadow-md shadow-amber-500/10">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Gamification & Rewards Hub
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold uppercase">
                  XP Season 1
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Track your sprint velocity, rank up your title, and unlock team achievements
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsRewardModalOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-[#262626] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Summary Stats Strip */}
        <div className="p-4 bg-[#161616] border-b border-[#262626] grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Level & Title */}
          <div className="p-2.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded flex items-center gap-2.5">
            <div className="text-2xl">{levelInfo.levelIcon}</div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-amber-400 block leading-tight">
                Level {levelInfo.level}
              </span>
              <span className="text-xs font-semibold text-white truncate block">
                {levelInfo.levelTitle}
              </span>
            </div>
          </div>

          {/* XP Progress */}
          <div className="p-2.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded">
            <div className="flex justify-between text-[10px] font-semibold mb-1">
              <span className="text-neutral-400 uppercase">Total XP</span>
              <span className="text-amber-300 font-mono font-bold">{userGamification.xp} XP</span>
            </div>
            <div className="w-full h-1.5 bg-[#2c2c2c] rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
            <span className="text-[9px] text-neutral-400 block mt-1">
              {levelInfo.xpNeededForNext - levelInfo.xpInCurrentLevel} XP to Level {levelInfo.level + 1}
            </span>
          </div>

          {/* Active Streak */}
          <div className="p-2.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block leading-tight">
                Streak Flame
              </span>
              <span className="text-xs font-bold text-amber-300">
                {userGamification.currentStreak} Days Active
              </span>
            </div>
          </div>

          {/* Shipped Tasks */}
          <div className="p-2.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block leading-tight">
                Shipped Tasks
              </span>
              <span className="text-xs font-bold text-emerald-300">
                {userGamification.tasksCompleted} Tasks Done
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#262626] bg-[#141414] px-4 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('quests')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'quests'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Active Quests ({quests.filter((q) => q.completed).length} ready)</span>
          </button>

          <button
            type="button"
            id="tab-adventure-path"
            onClick={() => setActiveTab('adventure')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'adventure'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Advanture Path</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'leaderboard'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Leaderboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('badges')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'badges'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>
              Badges ({userGamification.achievements?.filter((a) => a.unlocked).length || 0}/
              {userGamification.achievements?.length || 0})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rules'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>XP Rules</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#121212] space-y-4">
          {/* ADVANTURE PATH TAB */}
          {activeTab === 'adventure' && (
            <AdventurePathTab currentUser={currentUser} awardXP={awardXP} />
          )}

          {/* 1. QUESTS TAB */}
          {activeTab === 'quests' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Daily & Weekly Operations
                </span>
                <span className="text-xs text-neutral-400">
                  Resets every sprint cycle
                </span>
              </div>

              {quests.map((quest) => {
                const percent = Math.min(100, Math.round((quest.progress / quest.maxProgress) * 100));

                return (
                  <div
                    key={quest.id}
                    className={`p-3.5 rounded border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      quest.completed
                        ? 'bg-amber-950/20 border-amber-500/50 shadow-xs'
                        : 'bg-[#181818] border-[#262626]'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded flex items-center justify-center text-sm shrink-0 ${
                          quest.completed
                            ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                            : 'bg-[#222222] text-neutral-400'
                        }`}
                      >
                        {quest.completed ? <Sparkles className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate">{quest.title}</h4>
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
                        <p className="text-[11px] text-neutral-400 mt-0.5">{quest.description}</p>

                        {/* Progress bar */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-36 h-1.5 bg-[#262626] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                quest.completed ? 'bg-amber-400' : 'bg-blue-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {quest.progress}/{quest.maxProgress} ({percent}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reward Action */}
                    <div className="flex items-center gap-2.5 sm:self-center shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-black text-amber-300 block font-mono">
                          +{quest.xpReward} XP
                        </span>
                        <span className="text-[9px] text-neutral-400 uppercase">Reward</span>
                      </div>

                      {quest.completed ? (
                        <button
                          type="button"
                          onClick={() => claimQuestReward(quest.id)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black text-xs font-bold rounded shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Claim</span>
                        </button>
                      ) : (
                        <div className="px-3 py-1.5 bg-[#202020] text-neutral-400 text-xs font-semibold rounded border border-[#303030]">
                          In Progress
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. LEADERBOARD TAB */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Workspace Sprint Velocity Rankings
                </span>
                <span className="text-xs text-neutral-400">
                  Updated in real-time
                </span>
              </div>

              <div className="space-y-2">
                {leaderboard.map((user) => {
                  const isCurrent = user.id === currentUser?.id;
                  const rankIcons = ['🥇', '🥈', '🥉'];
                  const rankBadge = rankIcons[user.rank - 1] || `#${user.rank}`;

                  return (
                    <div
                      key={user.id}
                      className={`p-3 rounded border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-blue-950/30 border-blue-500/50 shadow-xs'
                          : 'bg-[#181818] border-[#262626] hover:border-[#383838]'
                      }`}
                    >
                      {/* Left: Rank & User Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded flex items-center justify-center font-bold text-sm shrink-0 bg-[#222222]">
                          {rankBadge}
                        </div>

                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-9 h-9 rounded object-cover border border-[#333333] shrink-0"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">
                              {user.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-400/40 px-1.5 py-0.2 rounded font-semibold uppercase">
                                You
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-neutral-400 truncate">
                            <span className="text-amber-400 font-semibold">Lv.{user.level} {user.levelTitle}</span>
                            <span>•</span>
                            <span>{user.title}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Stats: Completed Tasks, Streak & XP */}
                      <div className="flex items-center gap-4 text-right shrink-0">
                        <div className="hidden sm:block">
                          <span className="text-xs font-bold text-neutral-200 block font-mono">
                            {user.completedTasks}
                          </span>
                          <span className="text-[9px] text-neutral-400 uppercase">Shipped</span>
                        </div>

                        <div className="hidden sm:flex items-center gap-1 bg-[#202020] px-2 py-1 rounded border border-[#2e2e2e]">
                          <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold text-amber-300">{user.streak}d</span>
                        </div>

                        <div className="min-w-[70px]">
                          <span className="text-xs font-black text-amber-300 block font-mono">
                            {user.xp} XP
                          </span>
                          <span className="text-[9px] text-neutral-400 uppercase">Score</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. BADGES & ACHIEVEMENTS TAB */}
          {activeTab === 'badges' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Trophies & Milestones
                </span>
                <span className="text-xs text-amber-300 font-semibold">
                  {userGamification.achievements?.filter((a) => a.unlocked).length || 0} /{' '}
                  {userGamification.achievements?.length || 0} Unlocked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userGamification.achievements?.map((ach) => {
                  const percent = Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100));

                  return (
                    <div
                      key={ach.id}
                      className={`p-3.5 rounded border transition-all flex items-start gap-3 ${
                        ach.unlocked
                          ? 'bg-[#1a1a1a] border-amber-500/40 shadow-xs'
                          : 'bg-[#151515] border-[#242424] opacity-65'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                          ach.unlocked
                            ? 'bg-amber-500/20 border border-amber-400/50 shadow-xs shadow-amber-500/10'
                            : 'bg-[#222222] border border-[#333333]'
                        }`}
                      >
                        {ach.unlocked ? ach.icon : <Lock className="w-4 h-4 text-neutral-400" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate">{ach.title}</h4>
                          <span className="text-[10px] font-black text-amber-300 font-mono">
                            +{ach.xpReward} XP
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                          {ach.description}
                        </p>

                        <div className="flex items-center justify-between mt-2.5 text-[10px]">
                          <div className="w-24 h-1.5 bg-[#262626] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                ach.unlocked ? 'bg-amber-400' : 'bg-neutral-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="font-mono text-neutral-400">
                            {ach.progress}/{ach.maxProgress}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. RULES & MULTIPLIERS TAB */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#181818] border border-[#2a2a2a] rounded space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>How to Earn Experience (XP)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-[#141414] rounded border border-[#262626] flex justify-between">
                    <span className="text-neutral-300">Complete standard task</span>
                    <span className="font-mono font-bold text-amber-300">+50 XP</span>
                  </div>
                  <div className="p-2.5 bg-[#141414] rounded border border-[#262626] flex justify-between">
                    <span className="text-neutral-300">Complete urgent task</span>
                    <span className="font-mono font-bold text-amber-300">+80 XP</span>
                  </div>
                  <div className="p-2.5 bg-[#141414] rounded border border-[#262626] flex justify-between">
                    <span className="text-neutral-300">Ship before scheduled due date</span>
                    <span className="font-mono font-bold text-amber-300">+20 XP Bonus</span>
                  </div>
                  <div className="p-2.5 bg-[#141414] rounded border border-[#262626] flex justify-between">
                    <span className="text-neutral-300">Check off subtask</span>
                    <span className="font-mono font-bold text-amber-300">+15 XP</span>
                  </div>
                  <div className="p-2.5 bg-[#141414] rounded border border-[#262626] flex justify-between">
                    <span className="text-neutral-300">Create & structure task</span>
                    <span className="font-mono font-bold text-amber-300">+20 XP</span>
                  </div>
                  <div className="p-2.5 bg-[#141414] rounded border border-[#262626] flex justify-between">
                    <span className="text-neutral-300">Post comment / discussion</span>
                    <span className="font-mono font-bold text-amber-300">+10 XP</span>
                  </div>
                  <div className="p-2.5 bg-[#141414] rounded border border-[#262626] flex justify-between">
                    <span className="text-neutral-300">Attach specs / documentation</span>
                    <span className="font-mono font-bold text-amber-300">+15 XP</span>
                  </div>
                  <div className="p-2.5 bg-[#141414] rounded border border-[#262626] flex justify-between">
                    <span className="text-neutral-300">Daily active streak bonus</span>
                    <span className="font-mono font-bold text-amber-300">Up to 1.5x Multiplier</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#181818] border-t border-[#262626] flex justify-between items-center text-xs">
          <div className="text-neutral-400">
            Playing as <span className="text-white font-semibold">{currentUser?.name}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsRewardModalOpen(false)}
            className="px-4 py-1.5 bg-[#262626] hover:bg-[#333333] text-white text-xs font-semibold rounded transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
