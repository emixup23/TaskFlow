import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Search,
  MessageSquare,
  MessageSquarePlus,
  ArrowRight,
  Shield,
  Briefcase,
  Sparkles,
  User as UserIcon,
  FileCheck,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { getRoleTemplate } from '../utils/roleUtils';
import { User } from '../types';

interface NewDirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewDirectMessageModal: React.FC<NewDirectMessageModalProps> = ({ isOpen, onClose }) => {
  const { channels, startDirectChat, setActiveChannelId } = useChat();
  const { users, currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isStartingDm, setIsStartingDm] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setIsStartingDm(null);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Filter out current user from team list, then apply search
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => u.id !== currentUser?.id)
      .filter((u) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const roleTpl = getRoleTemplate(u.role);
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.title && u.title.toLowerCase().includes(q)) ||
          (u.department && u.department.toLowerCase().includes(q)) ||
          roleTpl.name.toLowerCase().includes(q) ||
          roleTpl.badge.toLowerCase().includes(q)
        );
      });
  }, [users, currentUser, searchQuery]);

  if (!isOpen) return null;

  const handleStartMessage = async (targetUser: User) => {
    setIsStartingDm(targetUser.id);
    try {
      const channel = await startDirectChat(targetUser.id);
      if (channel) {
        setActiveChannelId(channel.id);
      }
      onClose();
    } catch (err) {
      console.error('Failed to initiate direct message:', err);
    } finally {
      setIsStartingDm(null);
    }
  };

  const getRoleIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Shield':
        return <Shield className="w-3 h-3" />;
      case 'Briefcase':
        return <Briefcase className="w-3 h-3" />;
      case 'Sparkles':
        return <Sparkles className="w-3 h-3" />;
      case 'FileCheck':
        return <FileCheck className="w-3 h-3" />;
      case 'Eye':
        return <Eye className="w-3 h-3" />;
      default:
        return <UserIcon className="w-3 h-3" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-new-direct-message"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#141414] border border-[#262626] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between bg-[#171717]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Start Direct Message</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  1-on-1 Chat
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Send a private real-time direct message to any team member
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-new-dm-modal"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-[#222] transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3.5 border-b border-[#222] bg-[#121212]">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              id="input-search-dm-recipients"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, department, or role template..."
              className="w-full bg-[#1c1c1c] border border-[#2c2c2c] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* User Selection List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredUsers.length === 0 ? (
            <div className="py-10 text-center text-neutral-500">
              <MessageSquare className="w-8 h-8 mx-auto text-neutral-600 mb-2 opacity-60" />
              <p className="text-xs font-semibold text-neutral-300">No team members found</p>
              <p className="text-[11px] text-neutral-500 mt-1">
                {searchQuery ? `No matches found for "${searchQuery}"` : 'No other members in the workspace'}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const roleTpl = getRoleTemplate(user.role);
              const existingDm = channels.find(
                (c) =>
                  c.type === 'direct' &&
                  c.memberIds.length === 2 &&
                  c.memberIds.includes(currentUser?.id || '') &&
                  c.memberIds.includes(user.id)
              );
              const isProcessing = isStartingDm === user.id;

              return (
                <div
                  key={user.id}
                  id={`dm-recipient-${user.id}`}
                  onClick={() => !isProcessing && handleStartMessage(user)}
                  className="w-full p-2.5 rounded-lg bg-[#181818] hover:bg-[#202020] border border-[#262626] hover:border-blue-500/40 flex items-center justify-between gap-3 transition-all cursor-pointer group"
                >
                  {/* Left: Avatar & User Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <UserAvatar user={user} size="sm" />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#181818] ${
                          user.status === 'suspended'
                            ? 'bg-rose-500'
                            : user.status === 'inactive'
                            ? 'bg-neutral-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
                          {user.name}
                        </span>
                        {/* Role Template Badge */}
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border shrink-0"
                          style={{
                            backgroundColor: `${roleTpl.color}20`,
                            color: roleTpl.color,
                            borderColor: `${roleTpl.color}40`
                          }}
                        >
                          {getRoleIcon(roleTpl.icon)}
                          <span>{roleTpl.name}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400">
                        <span className="truncate">{user.email}</span>
                        {(user.department || user.title) && (
                          <>
                            <span className="text-neutral-600">•</span>
                            <span className="text-neutral-500 truncate">
                              {user.title || user.department}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Button / Status */}
                  <div className="shrink-0 flex items-center gap-2">
                    {existingDm && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Active Chat
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm group-hover:bg-blue-500 cursor-pointer disabled:opacity-50"
                    >
                      <span>{existingDm ? 'Open Chat' : 'Start DM'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#222] bg-[#121212] flex items-center justify-between text-xs text-neutral-400">
          <span>{filteredUsers.length} team member(s) available</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-[#1e1e1e] hover:bg-[#282828] text-neutral-300 hover:text-white border border-[#333] transition-colors cursor-pointer font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
