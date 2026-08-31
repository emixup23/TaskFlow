import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  Shield,
  CheckCircle2,
  Clock,
  Award,
  Flame,
  Sparkles,
  Edit3,
  Save,
  Camera,
  Upload,
  RefreshCw,
  Link,
  Layers,
  ExternalLink,
  MessageSquare,
  Check,
  Zap,
  ListTodo,
  AlertCircle,
  Copy,
  ChevronRight,
  TrendingUp,
  Sliders,
  Palette,
  Image as ImageIcon
} from 'lucide-react';
import { User, UserRole, UserPrivileges, Task } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { useGamification } from '../context/GamificationContext';
import { UserAvatar } from './UserAvatar';
import {
  SVG_AVATAR_STYLES,
  getSvgAvatarDataUrl,
  generateAvatarSvgMarkup
} from '../utils/avatarUtils';

const DICEBEAR_COLLECTIONS = [
  { id: 'avataaars', name: 'Avataaars', description: 'Illustrated modern avatar cartoons' },
  { id: 'bottts', name: 'Bottts', description: 'Playful vector robot characters' },
  { id: 'adventurer', name: 'Adventurer', description: 'Fantasy rpg style characters' },
  { id: 'lorelei', name: 'Lorelei', description: 'Elegant modern hand-drawn portraits' },
  { id: 'fun-emoji', name: 'Fun Emoji', description: 'Expressive colorful 3D emoji faces' },
  { id: 'personas', name: 'Personas', description: 'Minimalist flat vector portraits' },
  { id: 'pixel-art', name: 'Pixel Art', description: 'Retro 8-bit gaming avatars' }
];

const DEPARTMENT_OPTIONS = [
  'Engineering',
  'Product',
  'Design & UX',
  'QA & Testing',
  'DevOps & Infrastructure',
  'Security',
  'Data Science',
  'Marketing',
  'Operations',
  'Executive'
];

export const UserProfileModal: React.FC = () => {
  const { currentUser, users, isAdmin, updateUserProfile, switchUser } = useAuth();
  const {
    selectedProfileUser,
    closeUserProfile,
    isProfileEditMode,
    setIsProfileEditMode,
    tasks,
    setSelectedTaskId,
    setViewMode,
    navigateToGraph,
    addToast
  } = useTasks();
  const { getUserGamification } = useGamification();

  // Gamification stats for the selected user
  const userStats = selectedProfileUser ? getUserGamification(selectedProfileUser.id) : null;
  const achievements = userStats?.achievements || [];

  // Tab selection: 'overview' | 'tasks' | 'gamification' | 'edit'
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'gamification' | 'edit'>('overview');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('basic');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'suspended'>('active');
  const [editPrivileges, setEditPrivileges] = useState<UserPrivileges>({
    canCreateTask: true,
    canEditAnyTask: false,
    canDeleteTask: false,
    canManageStatuses: false,
    canManageUsers: false,
    canUploadAttachments: true,
    canDeleteAttachments: true,
    canViewAuditLogs: false,
    canExportData: false
  });

  // Avatar customizer sub-tab: 'svg-presets' | 'dicebear' | 'upload' | 'url'
  const [avatarTab, setAvatarTab] = useState<'svg-presets' | 'dicebear' | 'upload' | 'url'>('svg-presets');
  const [dicebearSeed, setDicebearSeed] = useState('');
  const [dicebearCollection, setDicebearCollection] = useState('avataaars');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form state whenever selectedProfileUser changes
  useEffect(() => {
    if (selectedProfileUser) {
      setEditName(selectedProfileUser.name || '');
      setEditTitle(selectedProfileUser.title || '');
      setEditDepartment(selectedProfileUser.department || 'Engineering');
      setEditEmail(selectedProfileUser.email || '');
      setEditPhone(selectedProfileUser.phone || '');
      setEditBio(selectedProfileUser.bio || '');
      setEditAvatar(selectedProfileUser.avatar || '');
      setEditRole(selectedProfileUser.role || 'basic');
      setEditStatus(selectedProfileUser.status || 'active');
      setDicebearSeed(selectedProfileUser.name || 'User');
      setCustomImageUrl(selectedProfileUser.avatar?.startsWith('http') ? selectedProfileUser.avatar : '');

      if (selectedProfileUser.privileges) {
        setEditPrivileges({ ...selectedProfileUser.privileges });
      }

      if (isProfileEditMode) {
        setActiveTab('edit');
      } else {
        setActiveTab('overview');
      }
    }
  }, [selectedProfileUser, isProfileEditMode]);

  if (!selectedProfileUser) return null;

  const isSelf = currentUser?.id === selectedProfileUser.id;
  const canEdit = isSelf || isAdmin;

  // Filter tasks assigned to this user
  const assignedTasks = tasks.filter((t) =>
    (t.assigneeIds && t.assigneeIds.includes(selectedProfileUser.id)) ||
    (t as any).assigneeId === selectedProfileUser.id
  );

  const completedTasks = assignedTasks.filter((t) => t.statusId === 'done' || t.statusId.includes('done') || (t as any).completed);
  const activeTasks = assignedTasks.filter((t) => !completedTasks.includes(t));
  const completionRate = assignedTasks.length > 0 ? Math.round((completedTasks.length / assignedTasks.length) * 100) : 0;

  const displayTasks = taskFilter === 'active' ? activeTasks : taskFilter === 'completed' ? completedTasks : assignedTasks;

  // Handle Save
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editName.trim()) {
      addToast('error', 'User name is required');
      return;
    }

    try {
      setIsSaving(true);
      const updatePayload: Partial<User> = {
        name: editName.trim(),
        title: editTitle.trim() || 'Team Member',
        department: editDepartment.trim() || 'Engineering',
        email: editEmail.trim(),
        phone: editPhone.trim(),
        bio: editBio.trim(),
        avatar: editAvatar.trim() || selectedProfileUser.avatar
      };

      if (isAdmin) {
        updatePayload.role = editRole;
        updatePayload.status = editStatus;
        updatePayload.privileges = editPrivileges;
      }

      await updateUserProfile(selectedProfileUser.id, updatePayload);
      addToast('success', `${isSelf ? 'Your profile' : `${editName}'s profile`} has been updated!`);
      setIsProfileEditMode(false);
      setActiveTab('overview');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Image Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('error', 'Please select a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      addToast('error', 'Image size must be under 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setEditAvatar(dataUrl);
      addToast('success', 'Custom avatar image loaded!');
    };
    reader.readAsDataURL(file);
  };

  // Randomize DiceBear Avatar
  const handleRandomizeDicebear = () => {
    const randomSeed = Math.random().toString(36).substring(2, 8);
    setDicebearSeed(randomSeed);
    const newAvatarUrl = `https://api.dicebear.com/7.x/${dicebearCollection}/svg?seed=${encodeURIComponent(randomSeed)}`;
    setEditAvatar(newAvatarUrl);
  };

  // Select a preset SVG Avatar style
  const handleSelectSvgStyle = (styleId: string) => {
    const svgUrl = getSvgAvatarDataUrl(editName || selectedProfileUser.name, styleId);
    setEditAvatar(svgUrl);
  };

  // Copy email to clipboard
  const handleCopyEmail = () => {
    if (selectedProfileUser.email) {
      navigator.clipboard.writeText(selectedProfileUser.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  return (
    <div
      id="user-profile-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeUserProfile();
      }}
    >
      <div
        id="user-profile-modal"
        className="relative bg-[#121212] w-full max-w-3xl rounded-xl shadow-2xl border border-[#262626] overflow-hidden flex flex-col max-h-[92vh] text-slate-100 animate-in zoom-in-95 duration-150"
      >
        {/* =========================================================================
            Profile Cover Header & Hero Banner
            ========================================================================= */}
        <div className="relative bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-purple-900/50 border-b border-[#262626] p-6 pt-7 overflow-hidden">
          {/* Subtle geometric pattern overlay */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            id="user-profile-btn-close"
            onClick={closeUserProfile}
            className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg bg-black/40 hover:bg-black/70 border border-white/10 transition-colors cursor-pointer z-10"
            title="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-1 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            {/* Avatar & Main Info */}
            <div className="flex items-center sm:items-end gap-4">
              <div className="relative group shrink-0">
                <UserAvatar
                  user={{
                    id: selectedProfileUser.id,
                    name: activeTab === 'edit' ? editName : selectedProfileUser.name,
                    avatar: activeTab === 'edit' ? editAvatar : selectedProfileUser.avatar,
                    status: selectedProfileUser.status
                  }}
                  size="2xl"
                  showStatusIndicator
                  className="w-20 h-20 sm:w-24 sm:h-24 ring-4 ring-[#121212] shadow-xl"
                />

                {/* Quick Avatar Change Camera Button */}
                {canEdit && (
                  <button
                    type="button"
                    id="user-profile-btn-quick-avatar"
                    onClick={() => {
                      setActiveTab('edit');
                      setAvatarTab('svg-presets');
                    }}
                    className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer text-[10px] font-medium"
                    title="Change Avatar"
                  >
                    <Camera className="w-5 h-5 mb-0.5 text-blue-300" />
                    <span>Change</span>
                  </button>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                    {activeTab === 'edit' ? editName || 'User Name' : selectedProfileUser.name}
                  </h2>
                  
                  {isSelf && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      You
                    </span>
                  )}

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedProfileUser.role === 'admin'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-700/50 text-slate-300 border border-slate-600/40'
                    }`}
                  >
                    {selectedProfileUser.role === 'admin' ? 'Administrator' : 'Team Member'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-neutral-300 mt-0.5 flex items-center gap-2">
                  <span className="text-blue-300 font-medium">
                    {activeTab === 'edit' ? editTitle || 'Title' : selectedProfileUser.title || 'Team Member'}
                  </span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-neutral-400">
                    {activeTab === 'edit' ? editDepartment : selectedProfileUser.department || 'General'}
                  </span>
                </p>

                <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-2">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="truncate max-w-[180px]">{selectedProfileUser.email}</span>
                  </span>
                  {selectedProfileUser.phone && (
                    <span className="hidden sm:flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{selectedProfileUser.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {canEdit && activeTab !== 'edit' && (
                <button
                  type="button"
                  id="user-profile-btn-edit-mode"
                  onClick={() => setActiveTab('edit')}
                  className="px-3 py-1.5 rounded-lg bg-[#1e1e1e] hover:bg-[#282828] text-neutral-200 hover:text-white border border-[#333333] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isSelf ? 'Edit My Profile & Avatar' : 'Edit Profile'}</span>
                </button>
              )}

              {!isSelf && (
                <button
                  type="button"
                  id="user-profile-btn-switch-user"
                  onClick={async () => {
                    await switchUser(selectedProfileUser.id);
                    addToast('info', `Switched active session to ${selectedProfileUser.name}`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Switch to this account for testing RBAC"
                >
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span>Switch User</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Sub-tabs */}
          <div className="flex items-center gap-1 mt-6 border-t border-white/10 pt-3 overflow-x-auto no-scrollbar">
            <button
              type="button"
              id="user-profile-tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-white/15 text-white font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              id="user-profile-tab-tasks"
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'tasks'
                  ? 'bg-white/15 text-white font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Assigned Tasks</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/30 text-blue-300 font-bold">
                {assignedTasks.length}
              </span>
            </button>

            <button
              type="button"
              id="user-profile-tab-gamification"
              onClick={() => setActiveTab('gamification')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'gamification'
                  ? 'bg-white/15 text-white font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>XP & Badges</span>
            </button>

            {canEdit && (
              <button
                type="button"
                id="user-profile-tab-edit"
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'edit'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-blue-400 hover:text-blue-300 hover:bg-blue-600/10'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Avatar & Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            Tab Content Area
            ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* =====================================================================
              TAB 1: OVERVIEW
              ===================================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Quick KPI Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#181818] rounded-lg border border-[#262626]">
                  <div className="text-[11px] text-neutral-400 font-medium">Assigned Tasks</div>
                  <div className="text-xl font-bold text-white mt-1">{assignedTasks.length}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{activeTasks.length} active in sprint</div>
                </div>

                <div className="p-3 bg-[#181818] rounded-lg border border-[#262626]">
                  <div className="text-[11px] text-neutral-400 font-medium">Completion Rate</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{completionRate}%</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{completedTasks.length} tasks resolved</div>
                </div>

                <div className="p-3 bg-[#181818] rounded-lg border border-[#262626]">
                  <div className="text-[11px] text-neutral-400 font-medium">Gamification Level</div>
                  <div className="text-xl font-bold text-amber-400 mt-1 flex items-center gap-1.5">
                    <span>Lvl {userStats?.level || 1}</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{userStats?.xp || 0} Total XP</div>
                </div>

                <div className="p-3 bg-[#181818] rounded-lg border border-[#262626]">
                  <div className="text-[11px] text-neutral-400 font-medium">Current Streak</div>
                  <div className="text-xl font-bold text-orange-400 mt-1 flex items-center gap-1.5">
                    <span>{userStats?.currentStreak || 0} Days</span>
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Active sprint streak</div>
                </div>
              </div>

              {/* Bio / About Section */}
              <div className="p-4 bg-[#181818] rounded-lg border border-[#262626]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>About & Bio</span>
                </h3>
                {selectedProfileUser.bio ? (
                  <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {selectedProfileUser.bio}
                  </p>
                ) : (
                  <p className="text-xs text-neutral-500 italic">
                    No bio added yet.{canEdit && ' Click "Edit Profile" to add an introduction.'}
                  </p>
                )}
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact & Organization Card */}
                <div className="p-4 bg-[#181818] rounded-lg border border-[#262626] space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-blue-400" />
                    <span>Organization & Contact</span>
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-[#242424]">
                      <span className="text-neutral-400">Email Address</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-200 font-mono text-[11px]">
                          {selectedProfileUser.email}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyEmail}
                          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#252525] transition-colors"
                          title="Copy email"
                        >
                          {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-[#242424]">
                      <span className="text-neutral-400">Department</span>
                      <span className="text-neutral-200 font-medium">
                        {selectedProfileUser.department || 'Engineering'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-[#242424]">
                      <span className="text-neutral-400">Role & Access</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        selectedProfileUser.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-700/40 text-slate-300'
                      }`}>
                        {selectedProfileUser.role === 'admin' ? 'Administrator' : 'Basic User'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-neutral-400">Account Status</span>
                      <span className={`flex items-center gap-1 text-[11px] font-medium ${
                        selectedProfileUser.status === 'active' || !selectedProfileUser.status
                          ? 'text-emerald-400'
                          : selectedProfileUser.status === 'suspended'
                          ? 'text-rose-400'
                          : 'text-neutral-400'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          selectedProfileUser.status === 'active' || !selectedProfileUser.status
                            ? 'bg-emerald-500'
                            : selectedProfileUser.status === 'suspended'
                            ? 'bg-rose-500'
                            : 'bg-neutral-500'
                        }`} />
                        <span className="capitalize">{selectedProfileUser.status || 'Active'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Navigation / Visual Relationships Card */}
                <div className="p-4 bg-[#181818] rounded-lg border border-[#262626] flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2 mb-3">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      <span>Workspace Deep-Links</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                      Explore this member's collaborations, dependencies, and assigned tasks across the interactive graph and chat.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      id="profile-btn-view-graph"
                      onClick={() => {
                        closeUserProfile();
                        navigateToGraph(selectedProfileUser.id);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-[#141414] hover:bg-[#222] border border-[#2c2c2c] text-xs font-medium text-neutral-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span>Inspect in Relationship Graph</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300" />
                    </button>

                    <button
                      type="button"
                      id="profile-btn-send-message"
                      onClick={() => {
                        closeUserProfile();
                        setViewMode('chat');
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-[#141414] hover:bg-[#222] border border-[#2c2c2c] text-xs font-medium text-neutral-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span>Open Team Chat</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Privileges Matrix preview */}
              {selectedProfileUser.privileges && (
                <div className="p-4 bg-[#181818] rounded-lg border border-[#262626]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>Active RBAC Privileges</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {Object.entries(selectedProfileUser.privileges).map(([key, enabled]) => (
                      <div
                        key={key}
                        className={`p-2 rounded flex items-center gap-2 border ${
                          enabled
                            ? 'bg-emerald-950/20 text-emerald-300 border-emerald-800/40'
                            : 'bg-[#141414] text-neutral-500 border-[#222]'
                        }`}
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${enabled ? 'text-emerald-400' : 'text-neutral-600'}`} />
                        <span className="text-[11px] truncate">
                          {key.replace(/^can/, '').replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =====================================================================
              TAB 2: ASSIGNED TASKS
              ===================================================================== */}
          {activeTab === 'tasks' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Task filters */}
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTaskFilter('all')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      taskFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#1a1a1a] text-neutral-400 hover:text-white'
                    }`}
                  >
                    All ({assignedTasks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('active')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      taskFilter === 'active'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#1a1a1a] text-neutral-400 hover:text-white'
                    }`}
                  >
                    In Progress ({activeTasks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('completed')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      taskFilter === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#1a1a1a] text-neutral-400 hover:text-white'
                    }`}
                  >
                    Completed ({completedTasks.length})
                  </button>
                </div>

                <div className="text-xs text-neutral-400">
                  <span className="font-semibold text-emerald-400">{completionRate}%</span> resolved
                </div>
              </div>

              {/* Task List */}
              {displayTasks.length === 0 ? (
                <div className="p-8 text-center bg-[#181818] rounded-lg border border-[#262626] space-y-2">
                  <ListTodo className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-sm font-semibold text-neutral-300">No tasks found</p>
                  <p className="text-xs text-neutral-500">
                    No {taskFilter !== 'all' ? taskFilter : ''} tasks assigned to {selectedProfileUser.name}.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {displayTasks.map((task) => {
                    const isDone = task.statusId === 'done' || task.statusId.includes('done') || (task as any).completed;

                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          closeUserProfile();
                          setSelectedTaskId(task.id);
                        }}
                        className="p-3 bg-[#181818] hover:bg-[#1f1f1f] rounded-lg border border-[#262626] hover:border-[#383838] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              isDone
                                ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
                                : task.priority === 'urgent'
                                ? 'bg-rose-500 ring-2 ring-rose-500/30'
                                : 'bg-blue-500 ring-2 ring-blue-500/30'
                            }`}
                          />
                          <div className="min-w-0">
                            <h4 className={`text-xs font-semibold truncate group-hover:text-blue-300 transition-colors ${
                              isDone ? 'line-through text-neutral-500' : 'text-white'
                            }`}>
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400">
                              <span className="uppercase font-mono font-bold text-neutral-500">{task.id}</span>
                              {task.dueDate && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-neutral-500" />
                                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                  </span>
                                </>
                              )}
                              {task.subtasks && task.subtasks.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              task.priority === 'urgent'
                                ? 'bg-rose-500/20 text-rose-300'
                                : task.priority === 'high'
                                ? 'bg-orange-500/20 text-orange-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =====================================================================
              TAB 3: GAMIFICATION & BADGES
              ===================================================================== */}
          {activeTab === 'gamification' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Level Progress Banner */}
              <div className="p-4 bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-900/20 rounded-xl border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">
                        Level {userStats?.level || 1} • {userStats?.levelTitle || 'Champion'}
                      </h3>
                      <p className="text-xs text-amber-300/80">
                        {userStats?.xp || 0} Total Experience Points Earned
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs font-bold">
                    <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                    <span>{userStats?.currentStreak || 0} Day Streak</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Level Progress</span>
                    <span>{(userStats?.xp || 0) % 500} / 500 XP to next level</span>
                  </div>
                  <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-amber-500/20">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((((userStats?.xp || 0) % 500) / 500) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Achievements Showcase */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unlocked Badges & Accomplishments</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className={`p-3.5 rounded-lg border flex items-start gap-3 transition-all ${
                        ach.unlocked
                          ? 'bg-[#181818] border-amber-500/40 text-white'
                          : 'bg-[#141414] border-[#242424] text-neutral-500 opacity-60'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          ach.unlocked
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-neutral-800 text-neutral-600'
                        }`}
                      >
                        <Award className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-neutral-200">{ach.title}</h4>
                          {ach.unlocked && (
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800">
                              +{ach.xpReward} XP
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                          {ach.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 4: EDIT PROFILE & AVATAR CUSTOMIZER
              ===================================================================== */}
          {activeTab === 'edit' && canEdit && (
            <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in duration-150">
              
              {/* =================================================================
                  AVATAR CUSTOMIZER SUITE
                  ================================================================= */}
              <div className="p-4 sm:p-5 bg-[#181818] rounded-xl border border-[#2a2a2a] space-y-4">
                <div className="flex items-center justify-between border-b border-[#282828] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Camera className="w-4 h-4 text-blue-400" />
                      <span>Customize Profile Avatar</span>
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Choose from vector tech presets, illustrated styles, image upload, or custom URL
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <UserAvatar
                      user={{ name: editName, avatar: editAvatar }}
                      size="lg"
                      className="w-12 h-12 ring-2 ring-blue-500 shadow-md"
                    />
                  </div>
                </div>

                {/* Avatar Source Selector Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#121212] p-1 rounded-lg border border-[#262626]">
                  <button
                    type="button"
                    id="avatar-tab-svg-presets"
                    onClick={() => setAvatarTab('svg-presets')}
                    className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      avatarTab === 'svg-presets'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Vector Presets
                  </button>

                  <button
                    type="button"
                    id="avatar-tab-dicebear"
                    onClick={() => setAvatarTab('dicebear')}
                    className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      avatarTab === 'dicebear'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Characters (DiceBear)
                  </button>

                  <button
                    type="button"
                    id="avatar-tab-upload"
                    onClick={() => setAvatarTab('upload')}
                    className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      avatarTab === 'upload'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Upload Photo
                  </button>

                  <button
                    type="button"
                    id="avatar-tab-url"
                    onClick={() => setAvatarTab('url')}
                    className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      avatarTab === 'url'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Image URL
                  </button>
                </div>

                {/* Sub-panel 1: Vector Tech & Geometric SVG Presets */}
                {avatarTab === 'svg-presets' && (
                  <div className="space-y-3">
                    <p className="text-xs text-neutral-400">
                      Pick a custom generative SVG vector icon designed for modern tech profiles:
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {SVG_AVATAR_STYLES.map((style) => {
                        const previewUrl = getSvgAvatarDataUrl(editName || 'User', style.id);
                        const isSelected = editAvatar === previewUrl;

                        return (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => handleSelectSvgStyle(style.id)}
                            className={`p-2.5 rounded-lg border flex flex-col items-center gap-2 transition-all cursor-pointer group ${
                              isSelected
                                ? 'bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/40 text-white'
                                : 'bg-[#121212] border-[#262626] hover:border-[#444] text-neutral-300'
                            }`}
                          >
                            <img
                              src={previewUrl}
                              alt={style.name}
                              className="w-12 h-12 rounded-lg object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="text-center w-full min-w-0">
                              <p className="text-[11px] font-semibold truncate">{style.name}</p>
                              <span className="text-[9px] text-neutral-500 uppercase">{style.category}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-panel 2: DiceBear Illustrated Characters */}
                {avatarTab === 'dicebear' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          Character Collection
                        </label>
                        <select
                          value={dicebearCollection}
                          onChange={(e) => {
                            setDicebearCollection(e.target.value);
                            setEditAvatar(`https://api.dicebear.com/7.x/${e.target.value}/svg?seed=${encodeURIComponent(dicebearSeed)}`);
                          }}
                          className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500"
                        >
                          {DICEBEAR_COLLECTIONS.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} — {c.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          Seed String / Character Name
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={dicebearSeed}
                            onChange={(e) => {
                              setDicebearSeed(e.target.value);
                              setEditAvatar(`https://api.dicebear.com/7.x/${dicebearCollection}/svg?seed=${encodeURIComponent(e.target.value)}`);
                            }}
                            className="flex-1 bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500"
                            placeholder="Type seed..."
                          />
                          <button
                            type="button"
                            onClick={handleRandomizeDicebear}
                            className="p-2 rounded-lg bg-[#252525] hover:bg-[#333] text-neutral-300 hover:text-white border border-[#383838] transition-colors cursor-pointer"
                            title="Randomize Character"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Preview Strip */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2 border-t border-[#262626]">
                      {['Alpha', 'Bravo', 'Echo', 'Neon', 'Cyber', 'Spark', 'Quantum', 'Titan'].map((seedVariant) => {
                        const variantUrl = `https://api.dicebear.com/7.x/${dicebearCollection}/svg?seed=${encodeURIComponent(seedVariant)}`;
                        return (
                          <button
                            key={seedVariant}
                            type="button"
                            onClick={() => {
                              setDicebearSeed(seedVariant);
                              setEditAvatar(variantUrl);
                            }}
                            className="p-1 rounded-lg border border-[#282828] hover:border-blue-500 bg-[#121212] transition-colors cursor-pointer group"
                            title={`Seed: ${seedVariant}`}
                          >
                            <img
                              src={variantUrl}
                              alt={seedVariant}
                              className="w-full aspect-square rounded object-cover group-hover:scale-105 transition-transform"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-panel 3: File Upload */}
                {avatarTab === 'upload' && (
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#383838] hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer bg-[#121212] hover:bg-[#161616] transition-all group"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-semibold text-white">
                        Click to select an image from your computer
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        PNG, JPG, SVG, or WebP (Max 2 MB)
                      </p>
                    </div>
                  </div>
                )}

                {/* Sub-panel 4: Custom Image URL */}
                {avatarTab === 'url' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Direct Image URL
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={customImageUrl}
                          onChange={(e) => {
                            setCustomImageUrl(e.target.value);
                            setEditAvatar(e.target.value);
                          }}
                          placeholder="https://example.com/avatar.jpg"
                          className="flex-1 bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setEditAvatar(customImageUrl)}
                          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                        >
                          Apply URL
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* =================================================================
                  PROFILE INFORMATION FIELDS
                  ================================================================= */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Staff Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Department
                  </label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1 (555) 019-2834"
                  />
                </div>
              </div>

              {/* Bio / About */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  About / Bio
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none leading-relaxed"
                  placeholder="Share a brief introduction about your role, focus areas, or interests..."
                />
              </div>

              {/* Admin-only controls: Role, Status & Privileges */}
              {isAdmin && (
                <div className="p-4 bg-[#181818] rounded-xl border border-amber-500/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Administrative Access Controls
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        System Role
                      </label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="basic">Basic User</option>
                        <option value="admin">Administrator (Full Access)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Account Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  id="profile-btn-cancel-edit"
                  onClick={() => {
                    setIsProfileEditMode(false);
                    setActiveTab('overview');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#1e1e1e] hover:bg-[#282828] text-neutral-300 hover:text-white border border-[#333] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  id="profile-btn-save-changes"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile & Avatar'}</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
