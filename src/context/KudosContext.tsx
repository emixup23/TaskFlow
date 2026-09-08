import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Task,
  User,
  Priority,
  KudosTransaction,
  KudosTransactionType,
  KudosWallet
} from '../types';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';

// Audio feedback for Kudos economy
function playKudosSound(type: 'earn' | 'spend' | 'refund' | 'cap') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'earn') {
      // Crisp coin sound: two ascending crystal sine pings
      [880, 1174.66, 1567.98].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.09, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.25);
      });
    } else if (type === 'spend') {
      // Soft spending swoosh / drop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(392, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'refund') {
      // Cheerful refund chime
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.07);
        osc.stop(ctx.currentTime + i * 0.07 + 0.2);
      });
    }
  } catch {
    // Audio contexts might be blocked
  }
}

export const KUDOS_CONFIG = {
  BASELINE_BALANCE: 100, // Everyone starts with 100 Kudos
  WALLET_CAP: 500,       // Max Kudos to prevent hoarding
  DELEGATION_COST_PER_ASSIGNEE: 20, // Kudos spent to assign a task
  DIFFICULTY_EARN_RATES: {
    low: 15,
    medium: 25,
    high: 40,
    urgent: 60
  } as Record<Priority, number>,
  SPEED_BONUS_MULTIPLIER: 1.2, // +20% if completed on or before deadline
  STREAK_MULTIPLIERS: {
    base: 1.0,
    streak3: 1.25, // 3-6 days active streak: 1.25x
    streak7: 1.5   // 7+ days active streak: 1.5x
  },
  INACTIVE_DECAY_DAYS: 7, // Days of inactivity before gentle anti-hoarding decay applies
  INACTIVE_DECAY_PERCENT: 0.05 // 5% decay of balance above baseline
};

// Initial realistic wallets seed
const INITIAL_WALLETS: Record<string, KudosWallet> = {
  'user-admin-1': {
    userId: 'user-admin-1',
    balance: 145,
    cap: KUDOS_CONFIG.WALLET_CAP,
    earnedTotal: 285,
    spentTotal: 160,
    refundedTotal: 20,
    lastDecayDate: '2026-09-01',
    transactions: [
      {
        id: 'tx-seed-1',
        userId: 'user-admin-1',
        amount: 100,
        type: 'baseline_grant',
        description: 'Initial Baseline Kudos Balance',
        timestamp: '2026-08-15T09:00:00Z'
      },
      {
        id: 'tx-seed-2',
        userId: 'user-admin-1',
        amount: 40,
        type: 'task_completed',
        description: 'Completed Task: "Setup RBAC Permissions"',
        timestamp: '2026-08-20T14:30:00Z',
        breakdown: { base: 40, difficultyBonus: 15 }
      },
      {
        id: 'tx-seed-3',
        userId: 'user-admin-1',
        amount: -20,
        type: 'task_delegated_assign',
        description: 'Assigned "Database Index Optimization" to Alex Rivera',
        timestamp: '2026-08-22T11:00:00Z'
      },
      {
        id: 'tx-seed-4',
        userId: 'user-admin-1',
        amount: 20,
        type: 'task_delegated_refund',
        description: 'Refund: Alex Rivera declined delegation (Workload full)',
        timestamp: '2026-08-23T10:15:00Z'
      },
      {
        id: 'tx-seed-5',
        userId: 'user-admin-1',
        amount: 50,
        type: 'task_completed',
        description: 'Completed Task: "API Latency Benchmarking" (Urgent + Speed)',
        timestamp: '2026-08-28T16:00:00Z',
        multiplier: 1.25,
        breakdown: { base: 60, speedBonus: 10, streakBonus: 5 }
      }
    ]
  },
  'user-dev-1': {
    userId: 'user-dev-1',
    balance: 180,
    cap: KUDOS_CONFIG.WALLET_CAP,
    earnedTotal: 220,
    spentTotal: 40,
    refundedTotal: 0,
    transactions: [
      {
        id: 'tx-seed-dev-1',
        userId: 'user-dev-1',
        amount: 100,
        type: 'baseline_grant',
        description: 'Initial Baseline Kudos Balance',
        timestamp: '2026-08-15T09:00:00Z'
      },
      {
        id: 'tx-seed-dev-2',
        userId: 'user-dev-1',
        amount: 60,
        type: 'task_completed',
        description: 'Completed Urgent Bug Fix #402',
        timestamp: '2026-08-25T11:20:00Z',
        breakdown: { base: 60 }
      }
    ]
  },
  'user-lead-1': {
    userId: 'user-lead-1',
    balance: 210,
    cap: KUDOS_CONFIG.WALLET_CAP,
    earnedTotal: 310,
    spentTotal: 100,
    refundedTotal: 0,
    transactions: [
      {
        id: 'tx-seed-lead-1',
        userId: 'user-lead-1',
        amount: 100,
        type: 'baseline_grant',
        description: 'Initial Baseline Kudos Balance',
        timestamp: '2026-08-15T09:00:00Z'
      }
    ]
  }
};

interface KudosRewardCalculation {
  base: number;
  difficultyBonus: number;
  speedBonus: number;
  streakBonus: number;
  total: number;
  multiplier: number;
  capped: boolean;
}

interface KudosContextType {
  wallet: KudosWallet;
  getWallet: (userId: string) => KudosWallet;
  allWallets: Record<string, KudosWallet>;
  isKudosModalOpen: boolean;
  setIsKudosModalOpen: (open: boolean) => void;
  calculateTaskReward: (task: Partial<Task>, userStreak?: number) => KudosRewardCalculation;
  calculateDelegationCost: (assigneeIds: string[], creatorId: string) => number;
  canAffordDelegation: (cost: number, userId?: string) => boolean;
  spendForDelegation: (
    taskId: string,
    taskTitle: string,
    assigneeIds: string[],
    creatorId: string,
    creatorName?: string
  ) => { success: boolean; cost: number; error?: string };
  refundDelegation: (
    taskId: string,
    taskTitle: string,
    assigneeId: string,
    assigneeName: string,
    creatorId: string,
    reason?: string
  ) => void;
  awardTaskCompletion: (
    task: Task,
    completerId: string,
    completerName: string,
    streakDays?: number
  ) => { earned: number; capped: boolean; calculation: KudosRewardCalculation };
  sendPeerKudos: (
    toUserId: string,
    toUserName: string,
    amount: number,
    message: string
  ) => { success: boolean; error?: string };
  checkDecay: () => void;
}

const KudosContext = createContext<KudosContextType | undefined>(undefined);

export const KudosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users } = useAuth();
  const currentUserId = currentUser?.id || 'user-admin-1';

  const [wallets, setWallets] = useState<Record<string, KudosWallet>>(() => {
    const saved = localStorage.getItem('taskflow_kudos_wallets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to initial
      }
    }
    return INITIAL_WALLETS;
  });

  const [isKudosModalOpen, setIsKudosModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('taskflow_kudos_wallets', JSON.stringify(wallets));
  }, [wallets]);

  // Helper to ensure a wallet exists with baseline balance
  const getWallet = useCallback(
    (userId: string): KudosWallet => {
      if (wallets[userId]) {
        return wallets[userId];
      }
      return {
        userId,
        balance: KUDOS_CONFIG.BASELINE_BALANCE,
        cap: KUDOS_CONFIG.WALLET_CAP,
        earnedTotal: KUDOS_CONFIG.BASELINE_BALANCE,
        spentTotal: 0,
        refundedTotal: 0,
        transactions: [
          {
            id: `tx-init-${userId}`,
            userId,
            amount: KUDOS_CONFIG.BASELINE_BALANCE,
            type: 'baseline_grant',
            description: 'Initial Baseline Kudos Balance',
            timestamp: new Date().toISOString()
          }
        ]
      };
    },
    [wallets]
  );

  const currentWallet = getWallet(currentUserId);

  // 1. Calculate Reward for Completing a Task
  const calculateTaskReward = useCallback(
    (task: Partial<Task>, userStreak = 1): KudosRewardCalculation => {
      const priority = task.priority || 'medium';
      const baseEarn = KUDOS_CONFIG.DIFFICULTY_EARN_RATES[priority] || 25;

      let speedBonus = 0;
      let streakMultiplier = KUDOS_CONFIG.STREAK_MULTIPLIERS.base;

      // Speed bonus if due date exists and not overdue
      if (task.dueDate) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (task.dueDate >= todayStr) {
          speedBonus = Math.round(baseEarn * (KUDOS_CONFIG.SPEED_BONUS_MULTIPLIER - 1));
        }
      }

      // Streak multiplier
      if (userStreak >= 7) {
        streakMultiplier = KUDOS_CONFIG.STREAK_MULTIPLIERS.streak7;
      } else if (userStreak >= 3) {
        streakMultiplier = KUDOS_CONFIG.STREAK_MULTIPLIERS.streak3;
      }

      const streakBonus = Math.round((baseEarn + speedBonus) * (streakMultiplier - 1));
      const total = baseEarn + speedBonus + streakBonus;

      return {
        base: baseEarn,
        difficultyBonus: baseEarn - 15,
        speedBonus,
        streakBonus,
        total,
        multiplier: Number((total / baseEarn).toFixed(2)),
        capped: false
      };
    },
    []
  );

  // 2. Calculate Delegation Cost (assigning to others)
  const calculateDelegationCost = useCallback(
    (assigneeIds: string[], creatorId: string): number => {
      if (!assigneeIds || assigneeIds.length === 0) return 0;
      // Only charge for teammates who are not the creator
      const externalAssignees = assigneeIds.filter((id) => id !== creatorId);
      return externalAssignees.length * KUDOS_CONFIG.DELEGATION_COST_PER_ASSIGNEE;
    },
    []
  );

  // 3. Affordability Check (Strict Non-Negative constraint)
  const canAffordDelegation = useCallback(
    (cost: number, userId?: string): boolean => {
      const targetUserId = userId || currentUserId;
      const targetWallet = getWallet(targetUserId);
      return targetWallet.balance >= cost;
    },
    [currentUserId, getWallet]
  );

  // 4. Spend Kudos to Delegate Tasks
  const spendForDelegation = useCallback(
    (
      taskId: string,
      taskTitle: string,
      assigneeIds: string[],
      creatorId: string,
      creatorName?: string
    ): { success: boolean; cost: number; error?: string } => {
      const cost = calculateDelegationCost(assigneeIds, creatorId);
      if (cost === 0) return { success: true, cost: 0 };

      const creatorWallet = getWallet(creatorId);

      // Strict check: Cannot go negative
      if (creatorWallet.balance < cost) {
        return {
          success: false,
          cost,
          error: `Insufficient Kudos balance. You need ${cost} Kudos to delegate this task to ${
            assigneeIds.length
          } member(s), but only have ${creatorWallet.balance} Kudos.`
        };
      }

      const externalCount = assigneeIds.filter((id) => id !== creatorId).length;
      const tx: KudosTransaction = {
        id: `tx-spend-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: creatorId,
        amount: -cost,
        type: 'task_delegated_assign',
        description: `Staked ${cost} Kudos to assign "${taskTitle || 'Task'}" to ${externalCount} teammate(s)`,
        timestamp: new Date().toISOString(),
        taskId,
        taskTitle
      };

      setWallets((prev) => {
        const existing = prev[creatorId] || creatorWallet;
        return {
          ...prev,
          [creatorId]: {
            ...existing,
            balance: Math.max(0, existing.balance - cost), // guarantees non-negative
            spentTotal: existing.spentTotal + cost,
            transactions: [tx, ...existing.transactions]
          }
        };
      });

      playKudosSound('spend');
      return { success: true, cost };
    },
    [calculateDelegationCost, getWallet]
  );

  // 5. Refund Kudos When Assignee Declines Task Delegation
  const refundDelegation = useCallback(
    (
      taskId: string,
      taskTitle: string,
      assigneeId: string,
      assigneeName: string,
      creatorId: string,
      reason?: string
    ) => {
      const refundAmount = KUDOS_CONFIG.DELEGATION_COST_PER_ASSIGNEE;

      const tx: KudosTransaction = {
        id: `tx-refund-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: creatorId,
        amount: refundAmount,
        type: 'task_delegated_refund',
        description: `Refund: ${assigneeName} declined "${taskTitle}"${reason ? ` (${reason})` : ''}`,
        timestamp: new Date().toISOString(),
        taskId,
        taskTitle,
        relatedUserId: assigneeId,
        relatedUserName: assigneeName
      };

      setWallets((prev) => {
        const existing = prev[creatorId] || getWallet(creatorId);
        const newBalance = Math.min(existing.cap, existing.balance + refundAmount);
        return {
          ...prev,
          [creatorId]: {
            ...existing,
            balance: newBalance,
            refundedTotal: existing.refundedTotal + refundAmount,
            transactions: [tx, ...existing.transactions]
          }
        };
      });

      playKudosSound('refund');
    },
    [getWallet]
  );

  // 6. Award Kudos upon Task Completion (Difficulty + Speed + Streak scaling)
  const awardTaskCompletion = useCallback(
    (
      task: Task,
      completerId: string,
      completerName: string,
      streakDays = 1
    ): { earned: number; capped: boolean; calculation: KudosRewardCalculation } => {
      const calculation = calculateTaskReward(task, streakDays);
      const userWallet = getWallet(completerId);

      // Check if reaching or exceeding cap
      const potentialBalance = userWallet.balance + calculation.total;
      const actualNewBalance = Math.min(userWallet.cap, potentialBalance);
      const actualEarned = actualNewBalance - userWallet.balance;
      const wasCapped = potentialBalance > userWallet.cap;

      const tx: KudosTransaction = {
        id: `tx-earn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: completerId,
        amount: actualEarned,
        type: 'task_completed',
        description: `Earned ${actualEarned} Kudos for completing "${task.title}" (${task.priority} priority)`,
        timestamp: new Date().toISOString(),
        taskId: task.id,
        taskTitle: task.title,
        multiplier: calculation.multiplier,
        breakdown: {
          base: calculation.base,
          difficultyBonus: calculation.difficultyBonus,
          speedBonus: calculation.speedBonus,
          streakBonus: calculation.streakBonus
        }
      };

      setWallets((prev) => {
        const existing = prev[completerId] || userWallet;
        return {
          ...prev,
          [completerId]: {
            ...existing,
            balance: actualNewBalance,
            earnedTotal: existing.earnedTotal + actualEarned,
            transactions: [tx, ...existing.transactions]
          }
        };
      });

      playKudosSound(wasCapped ? 'cap' : 'earn');

      if (!wasCapped) {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#f59e0b', '#fbbf24', '#fef08a']
        });
      }

      return { earned: actualEarned, capped: wasCapped, calculation };
    },
    [calculateTaskReward, getWallet]
  );

  // 7. Send Peer Kudos (Peer Appreciation)
  const sendPeerKudos = useCallback(
    (
      toUserId: string,
      toUserName: string,
      amount: number,
      message: string
    ): { success: boolean; error?: string } => {
      if (amount <= 0) return { success: false, error: 'Amount must be greater than 0' };

      const senderWallet = getWallet(currentUserId);
      if (senderWallet.balance < amount) {
        return {
          success: false,
          error: `Insufficient Kudos balance. You have ${senderWallet.balance} Kudos.`
        };
      }

      const senderName = currentUser?.name || 'Teammate';
      const senderTx: KudosTransaction = {
        id: `tx-peer-send-${Date.now()}`,
        userId: currentUserId,
        amount: -amount,
        type: 'peer_kudos',
        description: `Sent ${amount} Kudos to ${toUserName}: "${message}"`,
        timestamp: new Date().toISOString(),
        relatedUserId: toUserId,
        relatedUserName: toUserName
      };

      const recipientWallet = getWallet(toUserId);
      const recipientNewBalance = Math.min(recipientWallet.cap, recipientWallet.balance + amount);
      const recipientTx: KudosTransaction = {
        id: `tx-peer-receive-${Date.now()}`,
        userId: toUserId,
        amount,
        type: 'peer_kudos',
        description: `Received ${amount} Kudos from ${senderName}: "${message}"`,
        timestamp: new Date().toISOString(),
        relatedUserId: currentUserId,
        relatedUserName: senderName
      };

      setWallets((prev) => ({
        ...prev,
        [currentUserId]: {
          ...senderWallet,
          balance: Math.max(0, senderWallet.balance - amount),
          spentTotal: senderWallet.spentTotal + amount,
          transactions: [senderTx, ...senderWallet.transactions]
        },
        [toUserId]: {
          ...recipientWallet,
          balance: recipientNewBalance,
          earnedTotal: recipientWallet.earnedTotal + amount,
          transactions: [recipientTx, ...recipientWallet.transactions]
        }
      }));

      playKudosSound('spend');
      return { success: true };
    },
    [currentUser?.name, currentUserId, getWallet]
  );

  // 8. Anti-Hoarding Decay Check
  const checkDecay = useCallback(() => {
    setWallets((prev) => {
      const updated = { ...prev };
      let anyChanged = false;

      Object.keys(updated).forEach((uId) => {
        const w = updated[uId];
        // If user balance is substantially above baseline and hasn't had recent spending
        if (w.balance > KUDOS_CONFIG.BASELINE_BALANCE) {
          const excess = w.balance - KUDOS_CONFIG.BASELINE_BALANCE;
          const decayAmount = Math.max(1, Math.round(excess * KUDOS_CONFIG.INACTIVE_DECAY_PERCENT));

          if (decayAmount > 0) {
            const tx: KudosTransaction = {
              id: `tx-decay-${Date.now()}-${uId}`,
              userId: uId,
              amount: -decayAmount,
              type: 'decay_adjustment',
              description: `Anti-hoarding decay (${Math.round(
                KUDOS_CONFIG.INACTIVE_DECAY_PERCENT * 100
              )}% of surplus above baseline to keep economy circulating)`,
              timestamp: new Date().toISOString()
            };

            updated[uId] = {
              ...w,
              balance: Math.max(KUDOS_CONFIG.BASELINE_BALANCE, w.balance - decayAmount),
              lastDecayDate: new Date().toISOString().split('T')[0],
              transactions: [tx, ...w.transactions]
            };
            anyChanged = true;
          }
        }
      });

      return anyChanged ? updated : prev;
    });
  }, []);

  return (
    <KudosContext.Provider
      value={{
        wallet: currentWallet,
        getWallet,
        allWallets: wallets,
        isKudosModalOpen,
        setIsKudosModalOpen,
        calculateTaskReward,
        calculateDelegationCost,
        canAffordDelegation,
        spendForDelegation,
        refundDelegation,
        awardTaskCompletion,
        sendPeerKudos,
        checkDecay
      }}
    >
      {children}
    </KudosContext.Provider>
  );
};

export const useKudos = () => {
  const context = useContext(KudosContext);
  if (!context) {
    throw new Error('useKudos must be used within a KudosProvider');
  }
  return context;
};
