import React, { useState, useEffect } from 'react';
import {
  Server,
  Headphones,
  Code2,
  Users,
  CheckCircle2,
  Lock,
  Sparkles,
  ChevronRight,
  Trophy,
  Shield,
  Zap,
  Award,
  RotateCcw,
  Compass,
  ArrowRight,
  Flame,
  Check,
  Eye,
  Maximize2,
  X
} from 'lucide-react';
import { ADVENTURE_PATHS } from '../data/adventurePathsData';
import { AdventurePathDefinition, AdventurePathId, AdventureStage, User } from '../types';
import confetti from 'canvas-confetti';
import { AdventureCardPreviewModal } from './adventure/AdventureCardPreviewModal';
import { STORAGE_KEYS } from '../constants/storageKeys';

interface AdventurePathTabProps {
  currentUser: User | null;
  awardXP: (amount: number, reason: string) => void;
}

interface PathUserProgress {
  activePathId: AdventurePathId;
  completedStages: Record<string, boolean>; // key: stageId -> boolean
  stageProgress: Record<string, number>; // key: stageId -> currentCount
}

export const AdventurePathTab: React.FC<AdventurePathTabProps> = ({
  currentUser,
  awardXP
}) => {
  const currentUserId = currentUser?.id || 'guest';
  const storageKey = `${STORAGE_KEYS.ADVENTURE_PROGRESS_PREFIX}${currentUserId}`;

  // Default suggested path based on user role or department
  const getSuggestedPathId = (): AdventurePathId => {
    if (!currentUser) return 'developer';
    const role = (currentUser.role || '').toLowerCase();
    const dept = (currentUser.department || '').toLowerCase();
    const title = (currentUser.title || '').toLowerCase();

    if (role === 'admin' || dept.includes('infra') || dept.includes('ops') || title.includes('admin') || title.includes('sys')) {
      return 'system_admin';
    }
    if (dept.includes('support') || title.includes('support') || title.includes('customer') || title.includes('success')) {
      return 'customer_support';
    }
    if (dept.includes('hr') || dept.includes('people') || title.includes('hr') || title.includes('recruiter') || title.includes('talent')) {
      return 'hr';
    }
    return 'developer';
  };

  const [selectedPathId, setSelectedPathId] = useState<AdventurePathId>(() => getSuggestedPathId());
  const [previewCardStage, setPreviewCardStage] = useState<AdventureStage | null>(null);

  const [progress, setProgress] = useState<PathUserProgress>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    // Default initial progress: Stage 1 of each path is initialized, some partial progress
    return {
      activePathId: getSuggestedPathId(),
      completedStages: {
        'sysadmin-stage-1': true,
        'dev-stage-1': true
      },
      stageProgress: {
        'sysadmin-stage-1': 2,
        'sysadmin-stage-2': 2,
        'dev-stage-1': 3,
        'dev-stage-2': 2,
        'support-stage-1': 1,
        'hr-stage-1': 1
      }
    };
  });

  const [recentlyClaimedStageId, setRecentlyClaimedStageId] = useState<string | null>(null);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      // ignore
    }
  }, [progress, storageKey]);

  const selectedPath = ADVENTURE_PATHS.find((p) => p.id === selectedPathId) || ADVENTURE_PATHS[0];
  const suggestedPathId = getSuggestedPathId();

  const getPathIcon = (id: AdventurePathId, className: string = 'w-5 h-5') => {
    switch (id) {
      case 'system_admin':
        return <Server className={className} />;
      case 'customer_support':
        return <Headphones className={className} />;
      case 'developer':
        return <Code2 className={className} />;
      case 'hr':
        return <Users className={className} />;
      default:
        return <Compass className={className} />;
    }
  };

  const isStageCompleted = (stageId: string) => Boolean(progress.completedStages[stageId]);

  const getStageCount = (stage: AdventureStage) => {
    if (isStageCompleted(stage.id)) return stage.targetCount;
    return progress.stageProgress[stage.id] || 0;
  };

  const isStageUnlocked = (path: AdventurePathDefinition, stageIndex: number) => {
    if (stageIndex === 0) return true;
    const prevStage = path.stages[stageIndex - 1];
    return isStageCompleted(prevStage.id);
  };

  const handleAdvanceStage = (stage: AdventureStage, path: AdventurePathDefinition) => {
    if (isStageCompleted(stage.id)) return;

    const currentCount = progress.stageProgress[stage.id] || 0;
    const nextCount = currentCount + 1;

    if (nextCount >= stage.targetCount) {
      // Complete Stage!
      setProgress((prev) => ({
        ...prev,
        completedStages: {
          ...prev.completedStages,
          [stage.id]: true
        },
        stageProgress: {
          ...prev.stageProgress,
          [stage.id]: stage.targetCount
        }
      }));

      // Trigger Confetti Celebration
      try {
        confetti({
          particleCount: 85,
          spread: 85,
          origin: { y: 0.65 }
        });
      } catch {
        // ignore
      }

      setRecentlyClaimedStageId(stage.id);
      setTimeout(() => setRecentlyClaimedStageId(null), 3000);

      // Award XP
      awardXP(stage.xpReward, `Advanture Path: ${path.sagaTitle} — ${stage.title}`);
    } else {
      // Advance step
      setProgress((prev) => ({
        ...prev,
        stageProgress: {
          ...prev.stageProgress,
          [stage.id]: nextCount
        }
      }));
      awardXP(25, `Path Milestone Progress: ${stage.title} (+1)`);
    }
  };

  const handleSetActivePath = (pathId: AdventurePathId) => {
    setProgress((prev) => ({
      ...prev,
      activePathId: pathId
    }));
  };

  const handleResetCurrentPath = (path: AdventurePathDefinition) => {
    setProgress((prev) => {
      const nextCompleted = { ...prev.completedStages };
      const nextStageProg = { ...prev.stageProgress };
      path.stages.forEach((s) => {
        delete nextCompleted[s.id];
        delete nextStageProg[s.id];
      });
      return {
        ...prev,
        completedStages: nextCompleted,
        stageProgress: nextStageProg
      };
    });
  };

  // Stats calculation for current path
  const completedStagesCount = selectedPath.stages.filter((s) => isStageCompleted(s.id)).length;
  const totalStagesCount = selectedPath.stages.length;
  const pathProgressPercent = Math.round((completedStagesCount / totalStagesCount) * 100);

  const totalEarnedXpInPath = selectedPath.stages
    .filter((s) => isStageCompleted(s.id))
    .reduce((acc, s) => acc + s.xpReward, 0);

  const totalPossibleXpInPath = selectedPath.stages.reduce((acc, s) => acc + s.xpReward, 0);

  return (
    <div className="space-y-4">
      {/* Intro Banner */}
      <div className="p-4 bg-gradient-to-r from-[#1b1b1b] to-[#161616] border border-[#2b2b2b] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Advanture Path Chronicles
              </h3>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold uppercase">
                Role Progression
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
              Embark on legendary role-specific sagas. Conquer tiered operational rites, unlock historic titles, and claim massive XP bounties.
            </p>
          </div>
        </div>

        {/* Global Path Stats */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 bg-[#121212] px-3 py-1.5 rounded border border-[#262626]">
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold text-neutral-400 block leading-tight">
              Active Embarkation
            </span>
            <span className="text-xs font-bold text-amber-400">
              {ADVENTURE_PATHS.find((p) => p.id === progress.activePathId)?.roleName}
            </span>
          </div>
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400/30" />
        </div>
      </div>

      {/* 4 Path Selector Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Choose Your Adventure Path
          </span>
          <span className="text-[10px] text-neutral-400">
            Click any path to inspect chapters or switch active embarkation
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {ADVENTURE_PATHS.map((path) => {
            const isSelected = path.id === selectedPathId;
            const isActive = path.id === progress.activePathId;
            const isSuggested = path.id === suggestedPathId;
            const completedCount = path.stages.filter((s) => isStageCompleted(s.id)).length;
            const isAllCompleted = completedCount === path.stages.length;

            return (
              <button
                key={path.id}
                type="button"
                onClick={() => setSelectedPathId(path.id)}
                className={`group relative p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? `bg-[#181818] ${path.themeColor.border} ring-1 ring-amber-500/30 shadow-md`
                    : 'bg-[#141414] border-[#262626] hover:bg-[#1a1a1a] hover:border-[#3a3a3a]'
                }`}
              >
                <div>
                  {/* Top indicators */}
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center ${path.themeColor.bg} ${path.themeColor.text}`}
                    >
                      {getPathIcon(path.id, 'w-4 h-4')}
                    </div>

                    <div className="flex items-center gap-1">
                      {isSuggested && (
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-semibold">
                          Your Role
                        </span>
                      )}
                      {isActive && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Role Name & Saga Title */}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    {path.roleName}
                  </span>
                  <h4 className="text-xs font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                    {path.sagaTitle}
                  </h4>
                </div>

                {/* Bottom completion progress */}
                <div className="mt-3 pt-2 border-t border-[#242424]">
                  <div className="flex items-center justify-between text-[10px] mb-1 font-semibold">
                    <span className="text-neutral-400">
                      {isAllCompleted ? 'Mastered' : `Stage ${completedCount} of ${path.stages.length}`}
                    </span>
                    <span className={path.themeColor.text}>
                      {Math.round((completedCount / path.stages.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#262626] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        isAllCompleted
                          ? 'bg-emerald-400'
                          : isSelected
                          ? 'bg-amber-400'
                          : 'bg-neutral-500'
                      }`}
                      style={{ width: `${(completedCount / path.stages.length) * 100}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Path Deep Dive Header */}
      <div
        className={`p-4 rounded-lg border bg-gradient-to-br ${selectedPath.themeColor.gradient} ${selectedPath.themeColor.border} relative overflow-hidden`}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${selectedPath.themeColor.badgeBg} ${selectedPath.themeColor.badgeText} ${selectedPath.themeColor.border}`}
              >
                {selectedPath.roleName}
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                {selectedPath.sagaTitle}
              </span>
            </div>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {selectedPath.sagaTitle}
              {progress.activePathId === selectedPath.id && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-amber-400" />
                  Currently Embarked
                </span>
              )}
            </h3>

            <p className="text-xs text-neutral-300 italic leading-relaxed">
              "{selectedPath.lore}"
            </p>
          </div>

          {/* Action & Stats Pill */}
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            {progress.activePathId !== selectedPath.id ? (
              <button
                type="button"
                onClick={() => handleSetActivePath(selectedPath.id)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Embark on this Path</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-amber-300 font-semibold bg-black/40 px-2.5 py-1 rounded border border-amber-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Active Questline
                </span>
                <button
                  type="button"
                  onClick={() => handleResetCurrentPath(selectedPath)}
                  title="Reset stages in this path for testing"
                  className="p-1 text-neutral-400 hover:text-neutral-200 bg-black/40 border border-neutral-700 rounded text-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="text-xs text-neutral-300 bg-black/30 px-3 py-1.5 rounded border border-white/10 flex items-center gap-3">
              <div>
                <span className="text-[9px] uppercase text-neutral-400 block font-semibold">
                  Path Rewards
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {totalEarnedXpInPath} / {totalPossibleXpInPath} XP
                </span>
              </div>
              <div className="h-6 w-px bg-neutral-700" />
              <div>
                <span className="text-[9px] uppercase text-neutral-400 block font-semibold">
                  Mastery
                </span>
                <span className="font-bold text-white">
                  {completedStagesCount} / {totalStagesCount} Stages
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Path Progress Bar */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-neutral-300 text-[11px]">Saga Completion Velocity</span>
            <span className="text-amber-300 font-mono text-[11px]">{pathProgressPercent}% Completed</span>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
              style={{ width: `${pathProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* SysAdmin Level Gallery Showcase (Visible when inspecting System Administrator) */}
      {selectedPath.id === 'system_admin' && (
        <div className="p-3.5 bg-[#141414] border border-[#282828] rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img src="/shiled.svg" alt="Shield" className="w-4 h-4 object-contain inline-block" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                The 5 Grand Ranks of the Server Keeper
              </h4>
              <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded font-mono">
                Artifact Cards
              </span>
            </div>
            <span className="text-[10px] text-neutral-400">
              Click any card to inspect high-resolution pixel art & lore
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {selectedPath.stages.map((stage, idx) => {
              const completed = isStageCompleted(stage.id);
              const unlocked = isStageUnlocked(selectedPath, idx);

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setPreviewCardStage(stage)}
                  className={`group/card relative rounded-lg border overflow-hidden p-2 text-left transition-all cursor-pointer flex flex-col items-center text-center ${
                    completed
                      ? 'bg-[#181c1a] border-emerald-500/40 hover:border-emerald-400 shadow-md ring-1 ring-emerald-500/20'
                      : unlocked
                      ? 'bg-[#181818] border-sky-500/40 hover:border-sky-400 shadow-md'
                      : 'bg-[#121212] border-[#222] opacity-75 hover:opacity-90'
                  }`}
                >
                  {/* Card Thumbnail */}
                  <div className="relative w-full aspect-[3/4] max-h-36 rounded border border-black/40 overflow-hidden bg-black/60 mb-2 flex items-center justify-center">
                    {stage.imageUrl ? (
                      <img
                        src={stage.imageUrl}
                        alt={stage.title}
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105 ${
                          !unlocked ? 'grayscale contrast-125' : ''
                        }`}
                      />
                    ) : (
                      stage.badgeIcon?.startsWith('/') || stage.badgeIcon?.endsWith('.svg') || stage.badgeIcon?.endsWith('.png') ? (
                        <img src={stage.badgeIcon} alt="badge" className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="text-2xl">{stage.badgeIcon}</span>
                      )
                    )}

                    {/* Status Seal Overlay */}
                    <div className="absolute top-1 right-1">
                      {completed ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : !unlocked ? (
                        <div className="w-5 h-5 rounded-full bg-black/80 text-neutral-400 border border-neutral-700 flex items-center justify-center shadow">
                          <Lock className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-sky-500 text-black flex items-center justify-center font-bold text-[10px] shadow">
                          {stage.stageNumber}
                        </div>
                      )}
                    </div>

                    {/* Hover Inspect badge */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center gap-1 text-[10px] font-bold text-white backdrop-blur-[1px]">
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Inspect</span>
                    </div>
                  </div>

                  {/* Level & Title */}
                  <span className="text-[9px] font-mono font-bold uppercase text-neutral-400">
                    Level {stage.stageNumber}
                  </span>
                  <h5 className="text-[11px] font-bold text-white tracking-tight leading-tight group-hover/card:text-amber-300 transition-colors line-clamp-1">
                    {stage.title}
                  </h5>
                  <span className="text-[9px] font-mono text-amber-400 mt-0.5">
                    +{stage.xpReward} XP
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stages Timeline Journey */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Chapters & Milestones ({selectedPath.stages.length} Total)
          </span>
          <span className="text-[10px] text-neutral-400">
            Complete stages in sequence to claim exclusive titles, character cards, and XP
          </span>
        </div>

        <div className="space-y-3 relative">
          {selectedPath.stages.map((stage, idx) => {
            const completed = isStageCompleted(stage.id);
            const unlocked = isStageUnlocked(selectedPath, idx);
            const currentCount = getStageCount(stage);
            const progressPercent = Math.min(100, Math.round((currentCount / stage.targetCount) * 100));
            const isClaimedJustNow = recentlyClaimedStageId === stage.id;

            return (
              <div
                key={stage.id}
                className={`relative rounded-lg border transition-all overflow-hidden ${
                  completed
                    ? 'bg-[#151716] border-emerald-500/30'
                    : unlocked
                    ? `bg-[#181818] ${selectedPath.themeColor.border} shadow-md`
                    : 'bg-[#121212] border-[#222222] opacity-60'
                }`}
              >
                {/* Visual Accent Strip */}
                <div
                  className={`h-1 w-full ${
                    completed
                      ? 'bg-emerald-500'
                      : unlocked
                      ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                      : 'bg-[#2a2a2a]'
                  }`}
                />

                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Stage Image / Node Badge + Details */}
                  <div className="flex items-start gap-3.5">
                    {/* If stage has an attached character card image, display thumbnail */}
                    {stage.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewCardStage(stage)}
                        title="Click to inspect character card"
                        className="group/thumb relative w-14 h-18 sm:w-16 sm:h-20 shrink-0 rounded-md overflow-hidden border border-neutral-700 hover:border-amber-400 transition-all bg-black cursor-pointer shadow-md"
                      >
                        <img
                          src={stage.imageUrl}
                          alt={stage.title}
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-cover transition-transform group-hover/thumb:scale-105 ${
                            !unlocked ? 'grayscale opacity-60' : ''
                          }`}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                        {completed ? (
                          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        ) : !unlocked ? (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5 text-neutral-400" />
                          </div>
                        ) : (
                          <div className="absolute top-1 left-1 px-1 bg-black/70 rounded text-[8px] font-mono text-amber-300 font-bold">
                            L{stage.stageNumber}
                          </div>
                        )}
                      </button>
                    ) : (
                      /* Standard Node Badge */
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border font-bold text-sm ${
                          completed
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : unlocked
                            ? `${selectedPath.themeColor.bg} ${selectedPath.themeColor.border} ${selectedPath.themeColor.text}`
                            : 'bg-[#1c1c1c] border-[#2c2c2c] text-neutral-500'
                        }`}
                      >
                        {completed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : unlocked ? (
                          <span>{stage.stageNumber}</span>
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-[10px] uppercase font-bold text-neutral-400">
                          Stage {stage.stageNumber} of {selectedPath.stages.length}
                        </span>
                        <h4 className="text-sm font-bold text-white tracking-tight">
                          {stage.title}
                        </h4>
                        <span className="text-[10px] px-2 py-0.2 rounded bg-[#202020] text-neutral-300 border border-[#303030]">
                          {stage.subtitle}
                        </span>
                        {completed && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded font-bold uppercase flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                      </div>

                      {/* Objective */}
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        {stage.objective}
                      </p>

                      {/* Flavor Lore */}
                      <p className="text-[11px] text-neutral-400 italic">
                        "{stage.lore}"
                      </p>

                      {/* Reward Preview & Card Action */}
                      <div className="flex items-center flex-wrap gap-2 pt-1">
                        <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          +{stage.xpReward} XP
                        </span>
                        <span className="text-[10px] font-semibold text-neutral-300 bg-[#222] border border-[#333] px-2 py-0.5 rounded flex items-center gap-1">
                          {stage.badgeIcon?.startsWith('/') || stage.badgeIcon?.endsWith('.svg') || stage.badgeIcon?.endsWith('.png') ? (
                            <img src={stage.badgeIcon} alt="badge" className="w-3.5 h-3.5 object-contain inline-block" />
                          ) : (
                            <span>{stage.badgeIcon}</span>
                          )}
                          <span>Title: {stage.badgeTitle}</span>
                        </span>
                        {stage.imageUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewCardStage(stage)}
                            className="text-[10px] font-semibold text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Card Artwork</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Progress & Action Button */}
                  <div className="flex flex-col sm:items-end gap-2 shrink-0 sm:min-w-[170px] border-t sm:border-t-0 border-[#262626] pt-3 sm:pt-0">
                    <div className="w-full sm:w-36">
                      <div className="flex justify-between text-[10px] font-semibold mb-1">
                        <span className="text-neutral-400">Milestone Target</span>
                        <span className="text-neutral-200 font-mono">
                          {currentCount} / {stage.targetCount}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#252525] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            completed ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    {completed ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded w-full sm:w-auto justify-center">
                        <Award className="w-3.5 h-3.5" />
                        <span>Claimed (+{stage.xpReward} XP)</span>
                      </div>
                    ) : unlocked ? (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStage(stage, selectedPath)}
                        className={`w-full sm:w-auto px-3 py-1.5 rounded text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                          currentCount + 1 >= stage.targetCount
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:brightness-110 ring-1 ring-amber-400/50 animate-pulse'
                            : 'bg-[#282828] hover:bg-[#343434] text-white border border-[#3c3c3c]'
                        }`}
                      >
                        {currentCount + 1 >= stage.targetCount ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Claim Stage Reward</span>
                          </>
                        ) : (
                          <>
                            <span>Advance Step ({currentCount}/{stage.targetCount})</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 bg-[#161616] border border-[#242424] px-3 py-1.5 rounded w-full sm:w-auto justify-center">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked (Complete Stage {stage.stageNumber - 1})</span>
                      </div>
                    )}
                  </div>
                </div>

                {isClaimedJustNow && (
                  <div className="bg-amber-500/20 border-t border-amber-500/40 p-2 text-center text-xs font-bold text-amber-300 animate-in fade-in slide-in-from-top-1">
                    🎉 Milestone Accomplished! +{stage.xpReward} XP & Title "{stage.badgeTitle}" Unlocked!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Artwork Modal Preview */}
      <AdventureCardPreviewModal
        stage={previewCardStage}
        onClose={() => setPreviewCardStage(null)}
      />
    </div>
  );
};
