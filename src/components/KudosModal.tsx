import React, { useState } from 'react';
import {
  Coins,
  X,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Zap,
  Flame,
  Shield,
  Send,
  Sparkles,
  Info,
  Clock,
  CheckCircle2,
  Users,
  Award
} from 'lucide-react';
import { useKudos, KUDOS_CONFIG } from '../context/KudosContext';
import { useAuth } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import { Priority, KudosTransactionType } from '../types';

export const KudosModal: React.FC = () => {
  const {
    wallet,
    isKudosModalOpen,
    setIsKudosModalOpen,
    allWallets,
    sendPeerKudos,
    checkDecay
  } = useKudos();

  const { users, currentUser } = useAuth();
  const { userGamification } = useGamification();

  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'send' | 'leaderboard'>('overview');
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'earned' | 'spent' | 'refunded'>('all');

  // Peer Kudos form state
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [peerAmount, setPeerAmount] = useState<number>(10);
  const [peerNote, setPeerNote] = useState<string>('');
  const [peerStatus, setPeerStatus] = useState<{ success?: string; error?: string } | null>(null);

  if (!isKudosModalOpen) return null;

  const capPercentage = Math.min(100, Math.round((wallet.balance / wallet.cap) * 100));
  const availableRecipients = users.filter((u) => u.id !== currentUser?.id);

  const handleSendKudos = (e: React.FormEvent) => {
    e.preventDefault();
    setPeerStatus(null);

    if (!selectedRecipientId) {
      setPeerStatus({ error: 'Please select a team member.' });
      return;
    }

    const recipient = users.find((u) => u.id === selectedRecipientId);
    if (!recipient) return;

    const result = sendPeerKudos(
      recipient.id,
      recipient.name,
      peerAmount,
      peerNote.trim() || 'Great teamwork!'
    );

    if (result.success) {
      setPeerStatus({
        success: `Successfully sent ${peerAmount} Kudos to ${recipient.name}!`
      });
      setPeerNote('');
    } else {
      setPeerStatus({ error: result.error || 'Failed to send Kudos.' });
    }
  };

  const filteredTransactions = wallet.transactions.filter((tx) => {
    if (ledgerFilter === 'earned') return tx.amount > 0 && tx.type !== 'task_delegated_refund';
    if (ledgerFilter === 'spent') return tx.amount < 0;
    if (ledgerFilter === 'refunded') return tx.type === 'task_delegated_refund';
    return true;
  });

  const getTxBadge = (type: KudosTransactionType, amount: number) => {
    switch (type) {
      case 'task_completed':
        return {
          label: 'Task Earned',
          color: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
          icon: ArrowUpRight
        };
      case 'task_delegated_assign':
        return {
          label: 'Delegation Stake',
          color: 'bg-rose-950/60 text-rose-300 border-rose-800/60',
          icon: ArrowDownLeft
        };
      case 'task_delegated_refund':
        return {
          label: 'Declined Refund',
          color: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
          icon: RotateCcw
        };
      case 'peer_kudos':
        return {
          label: amount > 0 ? 'Peer Appreciation' : 'Kudos Sent',
          color: amount > 0 ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' : 'bg-purple-950/60 text-purple-300 border-purple-800/60',
          icon: Sparkles
        };
      case 'decay_adjustment':
        return {
          label: 'Anti-Hoarding Decay',
          color: 'bg-neutral-800 text-neutral-300 border-neutral-700',
          icon: Shield
        };
      case 'baseline_grant':
        return {
          label: 'Welcome Baseline',
          color: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
          icon: Coins
        };
      default:
        return {
          label: 'Kudos Movement',
          color: 'bg-neutral-800 text-neutral-300 border-neutral-700',
          icon: Coins
        };
    }
  };

  // Compute team leaderboard sorted by current balance
  const leaderboardList = Object.keys(allWallets)
    .map((uId) => {
      const user = users.find((u) => u.id === uId);
      const w = allWallets[uId];
      return {
        id: uId,
        name: user?.name || 'Teammate',
        role: user?.role || 'member',
        avatar: user?.avatar,
        balance: w.balance,
        earnedTotal: w.earnedTotal,
        spentTotal: w.spentTotal
      };
    })
    .sort((a, b) => b.balance - a.balance);

  return (
    <div
      id="modal-kudos-hub"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] bg-[#121212] border border-[#2a2a2a] rounded-xl shadow-2xl flex flex-col text-white overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/40 via-[#181818] to-[#141414] border-b border-[#2b2b2b] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-500/30 to-yellow-500/10 border border-amber-500/40 flex items-center justify-center text-xl shadow-md shadow-amber-500/10 text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Kudos Reward System
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold uppercase">
                  Circulating Economy
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Earn by completing tasks, spend to delegate, and keep circulation healthy
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsKudosModalOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Balance & Cap Banner */}
        <div className="p-4 sm:p-5 bg-[#161616] border-b border-[#262626] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span>Your Current Kudos Balance</span>
              <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-1.5 py-0.2 rounded">
                Non-Negative Enforced
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                {wallet.balance.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-amber-400/80">KUDOS</span>
            </div>

            {/* Cap progress bar */}
            <div className="mt-2 space-y-1 w-full max-w-xs">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span>Wallet Cap</span>
                </span>
                <span className="font-semibold text-neutral-200">
                  {wallet.balance} / {wallet.cap} ({capPercentage}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#222222] rounded-full overflow-hidden border border-[#333333]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    capPercentage > 90
                      ? 'bg-rose-500'
                      : capPercentage > 70
                      ? 'bg-amber-400'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${capPercentage}%` }}
                />
              </div>
              {capPercentage >= 95 && (
                <p className="text-[10px] text-rose-400">
                  Wallet cap nearly reached. Spend Kudos by delegating tasks to teammates!
                </p>
              )}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center shrink-0">
            <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-2 sm:px-3 flex flex-col justify-center">
              <span className="text-sm font-bold text-emerald-400">+{wallet.earnedTotal}</span>
              <span className="text-[10px] text-neutral-400 mt-0.5">Total Earned</span>
            </div>

            <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-2 sm:px-3 flex flex-col justify-center">
              <span className="text-sm font-bold text-rose-400">-{wallet.spentTotal}</span>
              <span className="text-[10px] text-neutral-400 mt-0.5">Total Staked</span>
            </div>

            <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-2 sm:px-3 flex flex-col justify-center">
              <span className="text-sm font-bold text-cyan-400">+{wallet.refundedTotal}</span>
              <span className="text-[10px] text-neutral-400 mt-0.5">Refunded</span>
            </div>

            <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-2 sm:px-3 flex flex-col justify-center">
              <div className="flex items-center justify-center gap-1 text-orange-400 text-sm font-bold">
                <Flame className="w-3.5 h-3.5 fill-orange-500" />
                <span>{(userGamification?.currentStreak || 0) >= 3 ? '1.25x' : '1.0x'}</span>
              </div>
              <span className="text-[10px] text-neutral-400 mt-0.5">Multiplier</span>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 px-4 border-b border-[#262626] bg-[#141414] text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Economy &amp; Rules
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'ledger'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Transaction Ledger ({wallet.transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('send')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'send'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Send Peer Kudos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Kudos Leaderboard
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 max-h-[55vh]">
          {/* TAB 1: ECONOMY & RULES */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs text-neutral-300">
              {/* Core Principles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Rule 1 */}
                <div className="p-3 bg-[#181818] border border-[#2a2a2a] rounded-lg space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <TrendingUp className="w-4 h-4" />
                    <span>Earn by Delivering</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Complete tasks to earn Kudos scaled by difficulty (15–60). Fast delivery and streaks provide up to 1.5x bonus multipliers.
                  </p>
                </div>

                {/* Rule 2 */}
                <div className="p-3 bg-[#181818] border border-[#2a2a2a] rounded-lg space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-400 font-bold">
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Spend to Delegate</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Assigning a task to a teammate costs 20 Kudos. If they decline your delegation, your Kudos is 100% refunded immediately.
                  </p>
                </div>

                {/* Rule 3 */}
                <div className="p-3 bg-[#181818] border border-[#2a2a2a] rounded-lg space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Shield className="w-4 h-4" />
                    <span>Fair Play &amp; Anti-Hoarding</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Everyone starts with 100 baseline Kudos. Balance cannot go negative. A 500 cap and gentle surplus decay keep tokens circulating.
                  </p>
                </div>
              </div>

              {/* Task Difficulty Earn Rates Table */}
              <div className="bg-[#181818] border border-[#2a2a2a] rounded-lg p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Task Difficulty Rewards &amp; Multipliers</span>
                  </h4>
                  <span className="text-[10px] text-neutral-400">Configured System Rates</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 bg-[#141414] border border-[#262626] rounded text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Low Priority</span>
                    <p className="text-base font-extrabold text-white mt-0.5">15 Kudos</p>
                    <span className="text-[10px] text-neutral-500">Quick fixes / Minor</span>
                  </div>
                  <div className="p-2.5 bg-[#141414] border border-[#262626] rounded text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Medium Priority</span>
                    <p className="text-base font-extrabold text-blue-300 mt-0.5">25 Kudos</p>
                    <span className="text-[10px] text-neutral-500">Standard task</span>
                  </div>
                  <div className="p-2.5 bg-[#141414] border border-[#262626] rounded text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">High Priority</span>
                    <p className="text-base font-extrabold text-amber-300 mt-0.5">40 Kudos</p>
                    <span className="text-[10px] text-neutral-500">Core milestone</span>
                  </div>
                  <div className="p-2.5 bg-[#141414] border border-[#262626] rounded text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Urgent Priority</span>
                    <p className="text-base font-extrabold text-rose-300 mt-0.5">60 Kudos</p>
                    <span className="text-[10px] text-neutral-500">Critical blockers</span>
                  </div>
                </div>

                {/* Bonus Modifiers */}
                <div className="p-3 bg-[#151515] border border-[#222222] rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-white">Speed Bonus (1.2x Multiplier)</span>
                      <p className="text-[10px] text-neutral-400">Deliver on or before scheduled due date for a +20% bonus</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-white">Streak Multipliers</span>
                      <p className="text-[10px] text-neutral-400">3–6d: 1.25x (+25%) | 7+d: 1.5x (+50%)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delegation & Refund Lifecycle */}
              <div className="bg-[#181818] border border-[#2a2a2a] rounded-lg p-3.5 space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Delegation &amp; Refund Flow</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 bg-[#141414] rounded border border-[#242424]">
                    <span className="font-semibold text-amber-300 block mb-0.5">1. You Stake 20 Kudos</span>
                    <p className="text-neutral-400 text-[10px]">
                      When creating or assigning a task to a teammate, 20 Kudos is staked from your balance.
                    </p>
                  </div>
                  <div className="p-2 bg-[#141414] rounded border border-[#242424]">
                    <span className="font-semibold text-cyan-300 block mb-0.5">2. Accept or Decline</span>
                    <p className="text-neutral-400 text-[10px]">
                      The assignee gets notified and can accept. If they decline, your 20 Kudos is refunded instantly!
                    </p>
                  </div>
                  <div className="p-2 bg-[#141414] rounded border border-[#242424]">
                    <span className="font-semibold text-emerald-300 block mb-0.5">3. Completion Reward</span>
                    <p className="text-neutral-400 text-[10px]">
                      Upon completing the task, the assignee earns the full Kudos difficulty reward + bonuses.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRANSACTION LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-3">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 text-[11px] pb-1 border-b border-[#242424]">
                <button
                  type="button"
                  onClick={() => setLedgerFilter('all')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${
                    ledgerFilter === 'all'
                      ? 'bg-amber-600/30 text-amber-300 font-semibold border border-amber-500/40'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  All ({wallet.transactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerFilter('earned')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${
                    ledgerFilter === 'earned'
                      ? 'bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/40'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Earned ({wallet.transactions.filter((t) => t.amount > 0 && t.type !== 'task_delegated_refund').length})
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerFilter('spent')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${
                    ledgerFilter === 'spent'
                      ? 'bg-rose-600/30 text-rose-300 font-semibold border border-rose-500/40'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Delegated ({wallet.transactions.filter((t) => t.amount < 0).length})
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerFilter('refunded')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${
                    ledgerFilter === 'refunded'
                      ? 'bg-cyan-600/30 text-cyan-300 font-semibold border border-cyan-500/40'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Refunds ({wallet.transactions.filter((t) => t.type === 'task_delegated_refund').length})
                </button>
              </div>

              {/* Transactions List */}
              <div className="divide-y divide-[#222222]">
                {filteredTransactions.length === 0 ? (
                  <div className="py-8 text-center text-neutral-500 text-xs">
                    No transactions found in this filter
                  </div>
                ) : (
                  filteredTransactions.map((tx) => {
                    const badge = getTxBadge(tx.type, tx.amount);
                    const Icon = badge.icon;
                    const isPositive = tx.amount > 0;

                    return (
                      <div
                        key={tx.id}
                        className="py-2.5 px-1 flex items-center justify-between gap-3 text-xs hover:bg-[#181818] transition-colors rounded"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded flex items-center justify-center shrink-0 border ${badge.color}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-neutral-100 truncate">
                                {tx.description}
                              </span>
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${badge.color}`}
                              >
                                {badge.label}
                              </span>
                            </div>
                            <span className="text-[10px] text-neutral-400">
                              {new Date(tx.timestamp).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? `+${tx.amount}` : tx.amount} Kudos
                          </span>
                          {tx.multiplier && tx.multiplier > 1 && (
                            <span className="block text-[10px] text-amber-400">
                              {tx.multiplier}x Multiplier
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SEND PEER KUDOS */}
          {activeTab === 'send' && (
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-3.5 bg-gradient-to-r from-amber-950/30 to-[#181818] border border-amber-500/30 rounded-lg text-center space-y-1">
                <Sparkles className="w-5 h-5 text-amber-400 mx-auto" />
                <h4 className="font-bold text-white text-xs">Praise a Teammate</h4>
                <p className="text-[11px] text-neutral-400">
                  Send Kudos to celebrate great contributions, helpful code reviews, or awesome sprint teamwork!
                </p>
              </div>

              {peerStatus?.success && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{peerStatus.success}</span>
                </div>
              )}

              {peerStatus?.error && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                  {peerStatus.error}
                </div>
              )}

              <form onSubmit={handleSendKudos} className="space-y-3">
                {/* Select Recipient */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Select Teammate
                  </label>
                  <select
                    value={selectedRecipientId}
                    onChange={(e) => setSelectedRecipientId(e.target.value)}
                    required
                    className="w-full bg-[#1a1a1a] border border-[#333333] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Choose a team member...</option>
                    {availableRecipients.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount buttons */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Kudos Amount to Send
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 20].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setPeerAmount(amt)}
                        className={`py-2 rounded font-bold text-xs border transition-all cursor-pointer ${
                          peerAmount === amt
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm shadow-amber-500/10'
                            : 'bg-[#1a1a1a] border-[#333333] text-neutral-400 hover:text-white'
                        }`}
                      >
                        🪙 {amt} Kudos
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    Available balance: <strong>{wallet.balance} Kudos</strong>
                  </span>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Message / Shoutout
                  </label>
                  <input
                    type="text"
                    value={peerNote}
                    onChange={(e) => setPeerNote(e.target.value)}
                    placeholder="e.g. Thanks for the swift bug fix and great test coverage!"
                    className="w-full bg-[#1a1a1a] border border-[#333333] rounded px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={wallet.balance < peerAmount || !selectedRecipientId}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-amber-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send {peerAmount} Kudos</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Ranked by active circulating Kudos balance</span>
                <span>Baseline: 100 | Cap: 500</span>
              </div>

              <div className="divide-y divide-[#222222]">
                {leaderboardList.map((item, idx) => {
                  const isCurrent = item.id === currentUser?.id;
                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 flex items-center justify-between gap-3 text-xs rounded transition-colors ${
                        isCurrent
                          ? 'bg-amber-950/20 border border-amber-500/30'
                          : 'hover:bg-[#181818]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 text-center font-extrabold text-sm ${
                            idx === 0
                              ? 'text-amber-400'
                              : idx === 1
                              ? 'text-slate-300'
                              : idx === 2
                              ? 'text-amber-600'
                              : 'text-neutral-500'
                          }`}
                        >
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </span>

                        <div className="w-8 h-8 rounded-full bg-[#262626] border border-[#333333] flex items-center justify-center font-bold text-xs text-white">
                          {item.name.charAt(0)}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white">{item.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/30">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-400 capitalize">
                            {item.role}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          {item.balance} Kudos
                        </span>
                        <span className="block text-[10px] text-neutral-500">
                          {item.earnedTotal} Earned · {item.spentTotal} Staked
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#141414] border-t border-[#262626] flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Anti-hoarding: 500 Max Cap · Baseline: 100 Kudos</span>
          </div>
          <button
            type="button"
            onClick={() => checkDecay()}
            title="Run periodic anti-hoarding decay check"
            className="text-neutral-400 hover:text-amber-300 transition-colors underline cursor-pointer"
          >
            Check Decay Status
          </button>
        </div>
      </div>
    </div>
  );
};
