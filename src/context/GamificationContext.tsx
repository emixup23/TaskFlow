import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Task, Achievement, Quest, UserGamification, LeaderboardUser, XpEvent } from '../types';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';

// Web Audio API synth sound effect for satisfying gamification audio
function playGamificationSound(type: 'xp' | 'levelup' | 'achievement') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'xp') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'levelup') {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.25);
      });
    } else if (type === 'achievement') {
      const now = ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.1, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.3);
      });
    }
  } catch {
    // Audio contexts might be blocked before first user gesture
  }
}

const LEVEL_THRESHOLDS = [
  { level: 1, minXp: 0, title: 'Code Rookie', icon: '🥉' },
  { level: 2, minXp: 200, title: 'Sprint Contributor', icon: '🥈' },
  { level: 3, minXp: 500, title: 'Agile Specialist', icon: '🥇' },
  { level: 4, minXp: 1000, title: 'Task Champion', icon: '⚡' },
  { level: 5, minXp: 1700, title: 'Workflow Wizard', icon: '🔮' },
  { level: 6, minXp: 2600, title: 'Sprint Commander', icon: '🛡️' },
  { level: 7, minXp: 3800, title: 'Velocity Grandmaster', icon: '👑' },
  { level: 8, minXp: 5500, title: 'Legendary Producer', icon: '🌟' }
];

export function getLevelInfo(xp: number) {
  let currentLevel = LEVEL_THRESHOLDS[0];
  let nextLevel = LEVEL_THRESHOLDS[1];

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i].minXp) {
      currentLevel = LEVEL_THRESHOLDS[i];
      nextLevel = LEVEL_THRESHOLDS[i + 1] || {
        level: currentLevel.level + 1,
        minXp: currentLevel.minXp + 2000,
        title: 'Mythic Achiever',
        icon: '🌌'
      };
    } else {
      break;
    }
  }

  const xpInCurrentLevel = xp - currentLevel.minXp;
  const xpNeededForNext = nextLevel.minXp - currentLevel.minXp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNext) * 100)));

  return {
    level: currentLevel.level,
    levelTitle: currentLevel.title,
    levelIcon: currentLevel.icon,
    currentXp: xp,
    xpInCurrentLevel,
    xpNeededForNext,
    progressPercent,
    nextLevel
  };
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-blood',
    title: 'First Blood',
    description: 'Complete your first task in TaskFlow',
    icon: '🎯',
    category: 'completion',
    xpReward: 100,
    unlocked: true,
    unlockedAt: '2026-08-20',
    progress: 1,
    maxProgress: 1
  },
  {
    id: 'checklist-crusher',
    title: 'Checklist Crusher',
    description: 'Check off 5 subtasks',
    icon: '⚡',
    category: 'checklist',
    xpReward: 120,
    unlocked: true,
    unlockedAt: '2026-08-22',
    progress: 5,
    maxProgress: 5
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete a task before its scheduled deadline',
    icon: '🚀',
    category: 'speed',
    xpReward: 150,
    unlocked: true,
    unlockedAt: '2026-08-24',
    progress: 3,
    maxProgress: 3
  },
  {
    id: 'streak-master',
    title: 'Streak Flame',
    description: 'Maintain a 3-day active contribution streak',
    icon: '🔥',
    category: 'streak',
    xpReward: 200,
    unlocked: true,
    unlockedAt: '2026-08-26',
    progress: 3,
    maxProgress: 3
  },
  {
    id: 'bug-hunter',
    title: 'Bug Exterminator',
    description: 'Resolve 3 tasks tagged with bug or fix',
    icon: '🐞',
    category: 'completion',
    xpReward: 180,
    unlocked: false,
    progress: 2,
    maxProgress: 3
  },
  {
    id: 'collaboration-pro',
    title: 'Team Pillar',
    description: 'Collaborate on 3 multi-assignee tasks',
    icon: '🤝',
    category: 'collaboration',
    xpReward: 160,
    unlocked: false,
    progress: 2,
    maxProgress: 3
  },
  {
    id: 'scribe-master',
    title: 'Active Scribe',
    description: 'Post 5 comments or status updates',
    icon: '💬',
    category: 'mastery',
    xpReward: 100,
    unlocked: false,
    progress: 3,
    maxProgress: 5
  },
  {
    id: 'task-titan',
    title: 'Task Titan',
    description: 'Ship 15 total completed tasks',
    icon: '🏆',
    category: 'mastery',
    xpReward: 350,
    unlocked: false,
    progress: 9,
    maxProgress: 15
  },
  {
    id: 'heavy-attachment',
    title: 'Documentation Ace',
    description: 'Attach 4 assets or specifications to tasks',
    icon: '📎',
    category: 'mastery',
    xpReward: 140,
    unlocked: false,
    progress: 2,
    maxProgress: 4
  }
];

const DEFAULT_QUESTS: Quest[] = [
  {
    id: 'quest-daily-complete',
    title: 'Sprint Action',
    description: 'Complete at least 1 task today',
    xpReward: 60,
    progress: 0,
    maxProgress: 1,
    completed: false,
    type: 'daily'
  },
  {
    id: 'quest-daily-subtask',
    title: 'Step by Step',
    description: 'Check off 2 checklist subtasks',
    xpReward: 40,
    progress: 1,
    maxProgress: 2,
    completed: false,
    type: 'daily'
  },
  {
    id: 'quest-daily-comment',
    title: 'Team Sync',
    description: 'Post a comment or discussion update',
    xpReward: 30,
    progress: 0,
    maxProgress: 1,
    completed: false,
    type: 'daily'
  },
  {
    id: 'quest-weekly-deliver',
    title: 'Weekly Velocity',
    description: 'Ship 4 tasks to Done status this week',
    xpReward: 220,
    progress: 2,
    maxProgress: 4,
    completed: false,
    type: 'weekly'
  }
];

// Initial seeded gamification database for all users
const INITIAL_USER_GAMIFICATION: Record<string, UserGamification> = {
  'user-admin-1': {
    userId: 'user-admin-1',
    xp: 2680,
    level: 6,
    levelTitle: 'Sprint Commander',
    currentStreak: 6,
    bestStreak: 12,
    lastActiveDate: new Date().toISOString().split('T')[0],
    tasksCompleted: 19,
    subtasksCompleted: 34,
    commentsCount: 22,
    attachmentsCount: 8,
    achievements: DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a, unlocked: ['first-blood', 'checklist-crusher', 'speed-demon', 'streak-master', 'bug-hunter'].includes(a.id) }))
  },
  'user-admin-2': {
    userId: 'user-admin-2',
    xp: 1950,
    level: 5,
    levelTitle: 'Workflow Wizard',
    currentStreak: 4,
    bestStreak: 9,
    lastActiveDate: new Date().toISOString().split('T')[0],
    tasksCompleted: 14,
    subtasksCompleted: 26,
    commentsCount: 15,
    attachmentsCount: 6,
    achievements: DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a, unlocked: ['first-blood', 'checklist-crusher', 'speed-demon', 'streak-master'].includes(a.id) }))
  },
  'user-basic-1': {
    userId: 'user-basic-1',
    xp: 1320,
    level: 4,
    levelTitle: 'Task Champion',
    currentStreak: 5,
    bestStreak: 8,
    lastActiveDate: new Date().toISOString().split('T')[0],
    tasksCompleted: 11,
    subtasksCompleted: 21,
    commentsCount: 12,
    attachmentsCount: 4,
    achievements: DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a, unlocked: ['first-blood', 'checklist-crusher', 'streak-master'].includes(a.id) }))
  },
  'user-basic-2': {
    userId: 'user-basic-2',
    xp: 1180,
    level: 4,
    levelTitle: 'Task Champion',
    currentStreak: 3,
    bestStreak: 7,
    lastActiveDate: new Date().toISOString().split('T')[0],
    tasksCompleted: 10,
    subtasksCompleted: 18,
    commentsCount: 14,
    attachmentsCount: 5,
    achievements: DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a, unlocked: ['first-blood', 'checklist-crusher', 'speed-demon'].includes(a.id) }))
  },
  'user-basic-3': {
    userId: 'user-basic-3',
    xp: 890,
    level: 3,
    levelTitle: 'Agile Specialist',
    currentStreak: 2,
    bestStreak: 5,
    lastActiveDate: new Date().toISOString().split('T')[0],
    tasksCompleted: 8,
    subtasksCompleted: 15,
    commentsCount: 9,
    attachmentsCount: 7,
    achievements: DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a, unlocked: ['first-blood', 'checklist-crusher'].includes(a.id) }))
  },
  'user-basic-4': {
    userId: 'user-basic-4',
    xp: 780,
    level: 3,
    levelTitle: 'Agile Specialist',
    currentStreak: 3,
    bestStreak: 6,
    lastActiveDate: new Date().toISOString().split('T')[0],
    tasksCompleted: 7,
    subtasksCompleted: 14,
    commentsCount: 8,
    attachmentsCount: 3,
    achievements: DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a, unlocked: ['first-blood', 'streak-master'].includes(a.id) }))
  }
};

interface GamificationContextType {
  userGamification: UserGamification;
  leaderboard: LeaderboardUser[];
  quests: Quest[];
  recentXpEvents: XpEvent[];
  levelInfo: ReturnType<typeof getLevelInfo>;
  awardXP: (amount: number, reason: string) => void;
  claimQuestReward: (questId: string) => void;
  awardTaskCompleted: (task: Task) => void;
  awardSubtaskCompleted: () => void;
  awardCommentPosted: () => void;
  awardAttachmentUploaded: () => void;
  awardTaskCreated: () => void;
  isRewardModalOpen: boolean;
  setIsRewardModalOpen: (open: boolean) => void;
  activeLevelUp: { level: number; title: string; icon: string } | null;
  dismissLevelUp: () => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users } = useAuth();
  const [allUserData, setAllUserData] = useState<Record<string, UserGamification>>(() => {
    const saved = localStorage.getItem('taskflow_gamification_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to seeded
      }
    }
    return INITIAL_USER_GAMIFICATION;
  });

  const [quests, setQuests] = useState<Quest[]>(() => {
    const saved = localStorage.getItem('taskflow_quests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return DEFAULT_QUESTS;
  });

  const [recentXpEvents, setRecentXpEvents] = useState<XpEvent[]>([]);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [activeLevelUp, setActiveLevelUp] = useState<{ level: number; title: string; icon: string } | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('taskflow_gamification_data', JSON.stringify(allUserData));
  }, [allUserData]);

  useEffect(() => {
    localStorage.setItem('taskflow_quests', JSON.stringify(quests));
  }, [quests]);

  const currentUserId = currentUser?.id || 'user-admin-1';
  const currentUserStats: UserGamification = allUserData[currentUserId] || {
    userId: currentUserId,
    xp: 250,
    level: 2,
    levelTitle: 'Sprint Contributor',
    currentStreak: 1,
    bestStreak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    tasksCompleted: 2,
    subtasksCompleted: 4,
    commentsCount: 2,
    attachmentsCount: 1,
    achievements: DEFAULT_ACHIEVEMENTS
  };

  const levelInfo = getLevelInfo(currentUserStats.xp);

  const awardXP = useCallback(
    (amount: number, reason: string) => {
      if (!currentUserId) return;

      const event: XpEvent = {
        id: `xp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        amount,
        reason,
        timestamp: Date.now()
      };

      setRecentXpEvents((prev) => [event, ...prev.slice(0, 4)]);
      playGamificationSound('xp');

      // Auto remove floating xp event after 3 seconds
      setTimeout(() => {
        setRecentXpEvents((prev) => prev.filter((e) => e.id !== event.id));
      }, 3000);

      setAllUserData((prev) => {
        const current = prev[currentUserId] || {
          userId: currentUserId,
          xp: 0,
          level: 1,
          levelTitle: 'Code Rookie',
          currentStreak: 1,
          bestStreak: 1,
          lastActiveDate: new Date().toISOString().split('T')[0],
          tasksCompleted: 0,
          subtasksCompleted: 0,
          commentsCount: 0,
          attachmentsCount: 0,
          achievements: DEFAULT_ACHIEVEMENTS
        };

        const oldLevelInfo = getLevelInfo(current.xp);
        const newXp = current.xp + amount;
        const newLevelInfo = getLevelInfo(newXp);

        // Level Up Trigger!
        if (newLevelInfo.level > oldLevelInfo.level) {
          playGamificationSound('levelup');
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.5 }
          });
          setActiveLevelUp({
            level: newLevelInfo.level,
            title: newLevelInfo.levelTitle,
            icon: newLevelInfo.levelIcon
          });
        }

        return {
          ...prev,
          [currentUserId]: {
            ...current,
            xp: newXp,
            level: newLevelInfo.level,
            levelTitle: newLevelInfo.levelTitle
          }
        };
      });
    },
    [currentUserId]
  );

  const awardTaskCompleted = useCallback(
    (task: Task) => {
      let earnedXp = 50; // Base completion XP
      let bonusNotes: string[] = [];

      if (task.priority === 'urgent') {
        earnedXp += 30;
        bonusNotes.push('Urgent Priority +30');
      } else if (task.priority === 'high') {
        earnedXp += 15;
        bonusNotes.push('High Priority +15');
      }

      if (task.dueDate) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (task.dueDate >= todayStr) {
          earnedXp += 20;
          bonusNotes.push('On-Time Delivery +20');
        }
      }

      const reason = bonusNotes.length > 0
        ? `Task Completed! (${bonusNotes.join(', ')})`
        : 'Task Completed!';

      awardXP(earnedXp, reason);

      // Increment stats and check quests/achievements
      setAllUserData((prev) => {
        const current = prev[currentUserId] || currentUserStats;
        const newCompleted = current.tasksCompleted + 1;

        // Check achievements progress
        const updatedAchievements = (current.achievements || DEFAULT_ACHIEVEMENTS).map((ach) => {
          if (ach.id === 'first-blood' && !ach.unlocked) {
            playGamificationSound('achievement');
            return { ...ach, unlocked: true, unlockedAt: new Date().toISOString().split('T')[0], progress: 1 };
          }
          if (ach.id === 'task-titan') {
            const nextProgress = Math.min(ach.maxProgress, ach.progress + 1);
            const isNowUnlocked = nextProgress >= ach.maxProgress;
            if (isNowUnlocked && !ach.unlocked) playGamificationSound('achievement');
            return { ...ach, progress: nextProgress, unlocked: ach.unlocked || isNowUnlocked };
          }
          if (ach.id === 'bug-hunter' && task.tags?.some((t) => t.toLowerCase().includes('bug') || t.toLowerCase().includes('fix'))) {
            const nextProgress = Math.min(ach.maxProgress, ach.progress + 1);
            const isNowUnlocked = nextProgress >= ach.maxProgress;
            if (isNowUnlocked && !ach.unlocked) playGamificationSound('achievement');
            return { ...ach, progress: nextProgress, unlocked: ach.unlocked || isNowUnlocked };
          }
          return ach;
        });

        return {
          ...prev,
          [currentUserId]: {
            ...current,
            tasksCompleted: newCompleted,
            achievements: updatedAchievements
          }
        };
      });

      // Update quests progress
      setQuests((prev) =>
        prev.map((q) => {
          if (q.id === 'quest-daily-complete' || q.id === 'quest-weekly-deliver') {
            const nextP = Math.min(q.maxProgress, q.progress + 1);
            return {
              ...q,
              progress: nextP,
              completed: nextP >= q.maxProgress
            };
          }
          return q;
        })
      );
    },
    [awardXP, currentUserId, currentUserStats]
  );

  const awardSubtaskCompleted = useCallback(() => {
    awardXP(15, 'Checklist Item Checked (+15 XP)');
    setAllUserData((prev) => {
      const current = prev[currentUserId] || currentUserStats;
      return {
        ...prev,
        [currentUserId]: {
          ...current,
          subtasksCompleted: current.subtasksCompleted + 1
        }
      };
    });

    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === 'quest-daily-subtask') {
          const nextP = Math.min(q.maxProgress, q.progress + 1);
          return { ...q, progress: nextP, completed: nextP >= q.maxProgress };
        }
        return q;
      })
    );
  }, [awardXP, currentUserId, currentUserStats]);

  const awardCommentPosted = useCallback(() => {
    awardXP(10, 'Discussion & Update Posted (+10 XP)');
    setAllUserData((prev) => {
      const current = prev[currentUserId] || currentUserStats;
      return {
        ...prev,
        [currentUserId]: {
          ...current,
          commentsCount: current.commentsCount + 1
        }
      };
    });

    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === 'quest-daily-comment') {
          return { ...q, progress: 1, completed: true };
        }
        return q;
      })
    );
  }, [awardXP, currentUserId, currentUserStats]);

  const awardAttachmentUploaded = useCallback(() => {
    awardXP(15, 'Documentation & File Attached (+15 XP)');
    setAllUserData((prev) => {
      const current = prev[currentUserId] || currentUserStats;
      return {
        ...prev,
        [currentUserId]: {
          ...current,
          attachmentsCount: current.attachmentsCount + 1
        }
      };
    });
  }, [awardXP, currentUserId, currentUserStats]);

  const awardTaskCreated = useCallback(() => {
    awardXP(20, 'Task Created & Structured (+20 XP)');
  }, [awardXP]);

  const claimQuestReward = useCallback(
    (questId: string) => {
      const quest = quests.find((q) => q.id === questId);
      if (!quest || !quest.completed) return;

      awardXP(quest.xpReward, `Quest Completed: ${quest.title}!`);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      // Mark claimed by resetting or completing
      setQuests((prev) =>
        prev.map((q) =>
          q.id === questId
            ? { ...q, progress: 0, completed: false }
            : q
        )
      );
    },
    [awardXP, quests]
  );

  const dismissLevelUp = () => {
    setActiveLevelUp(null);
  };

  // Compile full team leaderboard
  const leaderboard: LeaderboardUser[] = users
    .map((user) => {
      const gData = allUserData[user.id] || {
        userId: user.id,
        xp: 300,
        level: 2,
        levelTitle: 'Sprint Contributor',
        currentStreak: 1,
        bestStreak: 1,
        tasksCompleted: 3,
        subtasksCompleted: 6,
        commentsCount: 2,
        attachmentsCount: 1,
        achievements: DEFAULT_ACHIEVEMENTS
      };

      const unlockedBadges = gData.achievements?.filter((a) => a.unlocked).length || 0;

      return {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        title: user.title,
        department: user.department,
        xp: gData.xp,
        level: gData.level,
        levelTitle: gData.levelTitle,
        streak: gData.currentStreak,
        completedTasks: gData.tasksCompleted,
        badgeCount: unlockedBadges,
        rank: 0
      };
    })
    .sort((a, b) => b.xp - a.xp)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));

  return (
    <GamificationContext.Provider
      value={{
        userGamification: currentUserStats,
        leaderboard,
        quests,
        recentXpEvents,
        levelInfo,
        awardXP,
        claimQuestReward,
        awardTaskCompleted,
        awardSubtaskCompleted,
        awardCommentPosted,
        awardAttachmentUploaded,
        awardTaskCreated,
        isRewardModalOpen,
        setIsRewardModalOpen,
        activeLevelUp,
        dismissLevelUp
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = (): GamificationContextType => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
