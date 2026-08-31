import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { X, Hash, Lock, Users, Sparkles, Check } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

const CHANNEL_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1'  // Indigo
];

export const CreateChannelModal: React.FC = () => {
  const { isCreateChannelModalOpen, setIsCreateChannelModalOpen, createChannel } = useChat();
  const { users, currentUser } = useAuth();

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'channel' | 'group_dm'>('channel');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedColor, setSelectedColor] = useState(CHANNEL_COLORS[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [searchMember, setSearchMember] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCreateChannelModalOpen) return null;

  const handleClose = () => {
    setName('');
    setTopic('');
    setDescription('');
    setIsPrivate(false);
    setType('channel');
    setSelectedMemberIds([]);
    setError(null);
    setIsCreateChannelModalOpen(false);
  };

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllMembers = () => {
    if (selectedMemberIds.length === users.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(users.map((u) => u.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a channel or group name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createChannel({
        name: name.trim(),
        topic: topic.trim() || undefined,
        description: description.trim() || undefined,
        type,
        isPrivate,
        color: selectedColor,
        memberIds: selectedMemberIds.length > 0 ? selectedMemberIds : users.map((u) => u.id)
      });
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create channel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchMember.toLowerCase()) ||
      u.title.toLowerCase().includes(searchMember.toLowerCase()) ||
      u.department.toLowerCase().includes(searchMember.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="modal-create-channel"
        className="w-full max-w-lg bg-[#141414] border border-[#262626] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626] bg-[#181818]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-inner"
              style={{ backgroundColor: selectedColor }}
            >
              {type === 'group_dm' ? <Users className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100">
                {type === 'group_dm' ? 'Create Group Chat' : 'Create Channel'}
              </h2>
              <p className="text-xs text-neutral-400">
                {type === 'group_dm'
                  ? 'Coordinate directly with a custom group of team members'
                  : 'Channels are where team members communicate and share tasks'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/50 rounded-lg text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#0d0d0d] border border-[#262626] rounded-lg">
            <button
              type="button"
              onClick={() => {
                setType('channel');
                setIsPrivate(false);
              }}
              className={`py-2 px-3 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                type === 'channel'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              Standard Channel
            </button>
            <button
              type="button"
              onClick={() => {
                setType('group_dm');
                setIsPrivate(true);
              }}
              className={`py-2 px-3 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                type === 'group_dm'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Group DM
            </button>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {type === 'group_dm' ? 'Group Name' : 'Channel Name'} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                {type === 'group_dm' ? <Users className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'group_dm' ? 'e.g. mobile-squad' : 'e.g. release-announcements'}
                className="w-full bg-[#0d0d0d] border border-[#262626] rounded-lg pl-9 pr-3 py-2 text-neutral-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Names are automatically formatted in lowercase.</p>
          </div>

          {/* Topic Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Topic <span className="text-neutral-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Sprint 14 delivery milestones and blockers"
              className="w-full bg-[#0d0d0d] border border-[#262626] rounded-lg px-3 py-2 text-neutral-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Description <span className="text-neutral-500 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel about?"
              className="w-full bg-[#0d0d0d] border border-[#262626] rounded-lg px-3 py-2 text-neutral-100 text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Color Accent Picker */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Color Accent</label>
            <div className="flex items-center gap-2">
              {CHANNEL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                    selectedColor === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#141414]' : 'hover:scale-105 opacity-80'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  {selectedColor === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Switch */}
          {type === 'channel' && (
            <div className="p-3 bg-[#0d0d0d] border border-[#262626] rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${isPrivate ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {isPrivate ? <Lock className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-200">
                    {isPrivate ? 'Make Private Channel' : 'Public Channel'}
                  </span>
                  <p className="text-[11px] text-neutral-400">
                    {isPrivate
                      ? 'Only invited members can view or join this channel.'
                      : 'Anyone on the workspace team can view and join.'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#262626] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}

          {/* Member Selection (Required if private or group DM, optional if public) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Channel Members ({selectedMemberIds.length > 0 ? selectedMemberIds.length : 'All workspace team'})
              </label>
              <button
                type="button"
                onClick={handleSelectAllMembers}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
              >
                {selectedMemberIds.length === users.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="border border-[#262626] rounded-lg bg-[#0d0d0d] overflow-hidden">
              <div className="p-2 border-b border-[#262626]">
                <input
                  type="text"
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  placeholder="Filter team members..."
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="max-h-36 overflow-y-auto divide-y divide-[#1e1e1e] p-1">
                {filteredUsers.map((u) => {
                  const isSelected = selectedMemberIds.includes(u.id);
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleMember(u.id)}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-600/10 text-neutral-100' : 'hover:bg-[#181818] text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar name={u.name} avatar={u.avatar} size="xs" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium truncate">{u.name}</span>
                            {isSelf && <span className="text-[10px] text-blue-400 bg-blue-500/15 px-1 rounded">You</span>}
                          </div>
                          <p className="text-[10px] text-neutral-500 truncate">{u.title}</p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-[#3a3a3a] bg-[#1c1c1c]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white hover:bg-[#222222] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : type === 'group_dm' ? 'Create Group' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
