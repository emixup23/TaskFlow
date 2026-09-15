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
  Image as ImageIcon,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CalendarCheck2,
  Coins
} from 'lucide-react';
import { User, UserRole, UserPrivileges, Task } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { useGamification } from '../context/GamificationContext';
import { useKudos } from '../context/KudosContext';
import { useChat } from '../context/ChatContext';
import { UserAvatar } from './UserAvatar';
import {
  SVG_AVATAR_STYLES,
  getSvgAvatarDataUrl,
  generateAvatarSvgMarkup
} from '../utils/avatarUtils';
import {
  SYSTEM_ROLE_TEMPLATES,
  getRoleTemplate,
  getRoleIconComponent
} from '../utils/roleUtils';

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
  const { currentUser, users, isAdmin, updateUserProfile, switchUser, changePassword } = useAuth();
  const {
    selectedProfileUser,
    closeUserProfile,
    isProfileEditMode,
    setIsProfileEditMode,
    tasks,
    statuses,
    setSelectedTaskId,
    setViewMode,
    navigateToGraph,
    addToast
  } = useTasks();
  const { getUserGamification } = useGamification();
  const { getWallet } = useKudos();
  const { startDirectChat } = useChat();

  // Gamification stats for the selected user
  const userStats = selectedProfileUser ? getUserGamification(selectedProfileUser.id) : null;
  const userWallet = selectedProfileUser ? getWallet(selectedProfileUser.id) : null;
  const achievements = userStats?.achievements || [];

  // Tab selection: 'overview' | 'tasks' | 'gamification' | 'edit' | 'security'
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'gamification' | 'edit' | 'security'>('overview');

  // Password state
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

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

  const doneStatusIds = statuses.filter((s) => s.isDone).map((s) => s.id);
  const isTaskDone = (t: Task) =>
    doneStatusIds.includes(t.statusId) ||
    Boolean((t as any).completed) ||
    t.statusId === 'status-solved' ||
    t.statusId === 'status-closed';

  const completedTasks = assignedTasks.filter(isTaskDone);
  const activeTasks = assignedTasks.filter((t) => !isTaskDone(t));
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
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeUserProfile();
      }}
    >
      <div
        id="user-profile-modal"
        className="relative bg-[#121212] w-full max-w-3xl rounded-2xl sm:rounded-xl shadow-2xl border border-[#262626] flex flex-col max-h-[95vh] sm:max-h-[92vh] text-slate-100 animate-in zoom-in-95 duration-150 overflow-hidden"
      >
        {/* =========================================================================
            Profile Cover Header & Hero Banner
            ========================================================================= */}
        <div className="relative bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-purple-900/50 border-b border-[#262626] p-4 sm:p-6 pt-4 sm:pt-7 shrink-0">
          {/* Subtle geometric pattern overlay */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            id="user-profile-btn-close"
            onClick={closeUserProfile}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 text-neutral-400 hover:text-white rounded-lg bg-black/50 hover:bg-black/80 border border-white/10 transition-colors cursor-pointer z-10"
            title="Close Profile"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="relative z-1 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            {/* Avatar & Main Info */}
            <div className="flex items-start sm:items-end gap-3 sm:gap-4 pr-10 sm:pr-0">
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
                  className="w-16 h-16 sm:w-24 sm:h-24 ring-2 sm:ring-4 ring-[#121212] shadow-xl"
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
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-blue-300" />
                    <span className="text-[9px] sm:text-[10px]">Change</span>
                  </button>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight truncate max-w-full">
                    {activeTab === 'edit' ? editName || 'User Name' : selectedProfileUser.name}
                  </h2>
                  
                  {isSelf && (
                    <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      You
                    </span>
                  )}

                  {(() => {
                    const currentRoleId = activeTab === 'edit' ? editRole : selectedProfileUser.role;
                    const roleTemplate = getRoleTemplate(currentRoleId);
                    const RoleIcon = getRoleIconComponent(roleTemplate.icon);
                    return (
                      <span
                        className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow-xs"
                        style={{
                          backgroundColor: `${roleTemplate.color}25`,
                          color: roleTemplate.color,
                          borderColor: `${roleTemplate.color}60`,
                          borderWidth: 1
                        }}
                      >
                        <RoleIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {roleTemplate.name}
                      </span>
                    );
                  })()}
                </div>

                <p className="text-xs sm:text-sm text-neutral-300 mt-0.5 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-blue-300 font-medium">
                    {activeTab === 'edit' ? editTitle || 'Title' : selectedProfileUser.title || 'Team Member'}
                  </span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-neutral-400">
                    {activeTab === 'edit' ? editDepartment : selectedProfileUser.department || 'General'}
                  </span>
                </p>

                <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-neutral-400 mt-1 sm:mt-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-500 shrink-0" />
                    <span className="truncate max-w-[140px] sm:max-w-[200px]">{selectedProfileUser.email}</span>
                  </span>
                  {selectedProfileUser.phone && (
                    <span className="hidden sm:flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>{selectedProfileUser.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto pt-1 sm:pt-0">
              {canEdit && activeTab !== 'edit' && (
                <button
                  type="button"
                  id="user-profile-btn-edit-mode"
                  onClick={() => setActiveTab('edit')}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#1e1e1e] hover:bg-[#282828] text-neutral-200 hover:text-white border border-[#333333] text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isSelf ? 'Edit Profile & Avatar' : 'Edit Profile'}</span>
                </button>
              )}

              {!isSelf && isAdmin && (
                <button
                  type="button"
                  id="user-profile-btn-switch-user"
                  onClick={async () => {
                    await switchUser(selectedProfileUser.id);
                    addToast('info', `Switched active session to ${selectedProfileUser.name}`);
                  }}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                  title="Switch to this account (Admin only)"
                >
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span>Switch User</span>
                </button>
              )}

              <button
                type="button"
                id="user-profile-btn-view-daily"
                onClick={() => {
                  setViewMode('daily');
                  closeUserProfile();
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                title="Open Daily Tasks Day Planner"
              >
                <CalendarCheck2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Daily Tasks</span>
              </button>
            </div>
          </div>

          {/* Navigation Sub-tabs with smooth horizontal scrolling on mobile */}
          <div className="flex items-center gap-1.5 mt-3.5 sm:mt-6 border-t border-white/10 pt-2.5 sm:pt-3 pb-1 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              type="button"
              id="user-profile-tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${
                activeTab === 'overview'
                  ? 'bg-white/20 text-white font-semibold shadow-xs'
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
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${
                activeTab === 'tasks'
                  ? 'bg-white/20 text-white font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Tasks</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] bg-blue-500/30 text-blue-300 font-bold">
                {assignedTasks.length}
              </span>
            </button>

            <button
              type="button"
              id="user-profile-tab-gamification"
              onClick={() => setActiveTab('gamification')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${
                activeTab === 'gamification'
                  ? 'bg-white/20 text-white font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>XP & Badges</span>
            </button>

            <button
              type="button"
              id="user-profile-tab-edit"
              onClick={() => setActiveTab('edit')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${
                activeTab === 'edit'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Avatar & Bio</span>
            </button>

            <button
              type="button"
              id="user-profile-tab-security"
              onClick={() => setActiveTab('security')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${
                activeTab === 'security'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Security</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            Tab Content Area
            ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* =====================================================================
              TAB 1: OVERVIEW
              ===================================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
              
              {/* Quick KPI Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3 bg-[#181818] rounded-xl border border-[#262626]">
                  <div className="text-[10px] sm:text-[11px] text-neutral-400 font-medium">Assigned Tasks</div>
                  <div className="text-lg sm:text-xl font-bold text-white mt-0.5 sm:mt-1">{assignedTasks.length}</div>
                  <div className="text-[9px] sm:text-[10px] text-neutral-500 mt-0.5 truncate">{activeTasks.length} active in sprint</div>
                </div>

                <div className="p-2.5 sm:p-3 bg-[#181818] rounded-xl border border-[#262626]">
                  <div className="text-[10px] sm:text-[11px] text-neutral-400 font-medium">Completion Rate</div>
                  <div className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5 sm:mt-1">{completionRate}%</div>
                  <div className="text-[9px] sm:text-[10px] text-neutral-500 mt-0.5 truncate">{completedTasks.length} tasks resolved</div>
                </div>

                <div className="p-2.5 sm:p-3 bg-[#181818] rounded-xl border border-[#262626]">
                  <div className="text-[10px] sm:text-[11px] text-neutral-400 font-medium">Gamification Level</div>
                  <div className="text-lg sm:text-xl font-bold text-amber-400 mt-0.5 sm:mt-1 flex items-center gap-1.5">
                    <span>Lvl {userStats?.level || 1}</span>
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-neutral-500 mt-0.5 truncate">{userStats?.xp || 0} Total XP</div>
                </div>

                <div className="p-2.5 sm:p-3 bg-[#181818] rounded-xl border border-[#262626]">
                  <div className="text-[10px] sm:text-[11px] text-neutral-400 font-medium">Kudos Balance</div>
                  <div className="text-lg sm:text-xl font-bold text-amber-300 mt-0.5 sm:mt-1 flex items-center gap-1.5">
                    <span>{userWallet?.balance ?? 100}</span>
                    <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-neutral-500 mt-0.5 truncate">{userWallet?.earnedTotal ?? 100} earned total</div>
                </div>

                <div className="p-2.5 sm:p-3 bg-[#181818] rounded-xl border border-[#262626] col-span-2 sm:col-span-1">
                  <div className="text-[10px] sm:text-[11px] text-neutral-400 font-medium">Current Streak</div>
                  <div className="text-lg sm:text-xl font-bold text-orange-400 mt-0.5 sm:mt-1 flex items-center gap-1.5">
                    <span>{userStats?.currentStreak || 0} Days</span>
                    <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-neutral-500 mt-0.5">Active sprint streak</div>
                </div>
              </div>

              {/* Bio / About Section */}
              <div className="p-3.5 sm:p-4 bg-[#181818] rounded-xl border border-[#262626]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>About & Bio</span>
                </h3>
                {selectedProfileUser.bio ? (
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {selectedProfileUser.bio}
                  </p>
                ) : (
                  <p className="text-xs text-neutral-500 italic">
                    No bio added yet.{canEdit && ' Click "Edit Profile" to add an introduction.'}
                  </p>
                )}
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Contact & Organization Card */}
                <div className="p-3.5 sm:p-4 bg-[#181818] rounded-xl border border-[#262626] space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-blue-400" />
                    <span>Organization & Contact</span>
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-[#242424] gap-1 sm:gap-2">
                      <span className="text-neutral-400 text-[11px] sm:text-xs">Email Address</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-200 font-mono text-[11px] truncate max-w-[200px]">
                          {selectedProfileUser.email}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyEmail}
                          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#252525] transition-colors cursor-pointer"
                          title="Copy email"
                        >
                          {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-[#242424] gap-1 sm:gap-2">
                      <span className="text-neutral-400 text-[11px] sm:text-xs">Department</span>
                      <span className="text-neutral-200 font-medium">
                        {selectedProfileUser.department || 'Engineering'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-[#242424] gap-1 sm:gap-2">
                      <span className="text-neutral-400 text-[11px] sm:text-xs">Role Template</span>
                      {(() => {
                        const template = getRoleTemplate(selectedProfileUser.role);
                        return (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 border w-fit"
                            style={{
                              backgroundColor: `${template.color}20`,
                              color: template.color,
                              borderColor: `${template.color}40`
                            }}
                          >
                            <span>{template.name}</span>
                            <span className="text-[9px] opacity-75">[{template.badge}]</span>
                          </span>
                        );
                      })()}
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-neutral-400 text-[11px] sm:text-xs">Account Status</span>
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
                <div className="p-3.5 sm:p-4 bg-[#181818] rounded-xl border border-[#262626] flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2 mb-2 sm:mb-3">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      <span>Workspace Deep-Links</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mb-3 sm:mb-4 leading-relaxed">
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
                      className="w-full px-3 py-2 rounded-lg bg-[#141414] hover:bg-[#222] border border-[#2c2c2c] text-xs font-medium text-neutral-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer group active:scale-98"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span className="text-left">Inspect in Relationship Graph</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
                    </button>

                    <button
                      type="button"
                      id="profile-btn-send-message"
                      onClick={async () => {
                        if (selectedProfileUser.id !== currentUser?.id) {
                          try {
                            await startDirectChat(selectedProfileUser.id);
                          } catch (err) {
                            console.error('Failed to open direct message:', err);
                          }
                        }
                        closeUserProfile();
                        setViewMode('chat');
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-[#141414] hover:bg-[#222] border border-[#2c2c2c] text-xs font-medium text-neutral-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer group active:scale-98"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="text-left">
                          {selectedProfileUser.id === currentUser?.id
                            ? 'Open Team Chat'
                            : `Direct Message ${selectedProfileUser.name.split(' ')[0]}`}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Privileges Matrix preview */}
              {selectedProfileUser.privileges && (
                <div className="p-3.5 sm:p-4 bg-[#181818] rounded-xl border border-[#262626]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>Active RBAC Privileges</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2 text-xs">
                    {Object.entries(selectedProfileUser.privileges).map(([key, enabled]) => (
                      <div
                        key={key}
                        className={`p-2 rounded-lg flex items-center gap-2 border ${
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
            <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-150">
              {/* Task filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setTaskFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-colors cursor-pointer ${
                      taskFilter === 'all'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-[#1a1a1a] text-neutral-400 hover:text-white'
                    }`}
                  >
                    All ({assignedTasks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('active')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-colors cursor-pointer ${
                      taskFilter === 'active'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-[#1a1a1a] text-neutral-400 hover:text-white'
                    }`}
                  >
                    In Progress ({activeTasks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('completed')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-colors cursor-pointer ${
                      taskFilter === 'completed'
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-[#1a1a1a] text-neutral-400 hover:text-white'
                    }`}
                  >
                    Completed ({completedTasks.length})
                  </button>
                </div>

                <div className="text-[11px] sm:text-xs text-neutral-400">
                  <span className="font-semibold text-emerald-400">{completionRate}%</span> resolved
                </div>
              </div>

              {/* Task List */}
              {displayTasks.length === 0 ? (
                <div className="p-6 sm:p-8 text-center bg-[#181818] rounded-xl border border-[#262626] space-y-2">
                  <ListTodo className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-sm font-semibold text-neutral-300">No tasks found</p>
                  <p className="text-xs text-neutral-500">
                    No {taskFilter !== 'all' ? taskFilter : ''} tasks assigned to {selectedProfileUser.name}.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {displayTasks.map((task) => {
                    const isDone = isTaskDone(task);

                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          closeUserProfile();
                          setSelectedTaskId(task.id);
                        }}
                        className="p-2.5 sm:p-3 bg-[#181818] hover:bg-[#1f1f1f] rounded-xl border border-[#262626] hover:border-[#383838] transition-all cursor-pointer flex items-center justify-between gap-2.5 sm:gap-3 group active:scale-99"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
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
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 text-[10px] text-neutral-400 flex-wrap">
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

                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          <span
                            className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase ${
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
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
              {/* Level Progress Banner */}
              <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-900/20 rounded-xl border border-amber-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                        Level {userStats?.level || 1} • {userStats?.levelTitle || 'Champion'}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-amber-300/80">
                        {userStats?.xp || 0} Total Experience Points Earned
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[11px] sm:text-xs font-bold w-fit">
                    <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 animate-pulse" />
                    <span>{userStats?.currentStreak || 0} Day Streak</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-400 mb-1">
                    <span>Level Progress</span>
                    <span>{(userStats?.xp || 0) % 500} / 500 XP to next level</span>
                  </div>
                  <div className="w-full h-2 sm:h-2.5 bg-black/60 rounded-full overflow-hidden border border-amber-500/20">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className={`p-3 sm:p-3.5 rounded-xl border flex items-start gap-2.5 sm:gap-3 transition-all ${
                        ach.unlocked
                          ? 'bg-[#181818] border-amber-500/40 text-white'
                          : 'bg-[#141414] border-[#242424] text-neutral-500 opacity-60'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          ach.unlocked
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-neutral-800 text-neutral-600'
                        }`}
                      >
                        <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-neutral-200">{ach.title}</h4>
                          {ach.unlocked && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800">
                                +{ach.xpReward} XP
                              </span>
                              <span className="text-[9px] font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800 flex items-center gap-0.5">
                                <Coins className="w-2.5 h-2.5 text-amber-400" />
                                +{ach.kudosReward || Math.round(ach.xpReward / 2)} Kudos
                              </span>
                            </div>
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
          {activeTab === 'edit' && (
            canEdit ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
              
              {/* =================================================================
                  AVATAR CUSTOMIZER SUITE
                  ================================================================= */}
              <div className="p-3.5 sm:p-5 bg-[#181818] rounded-xl border border-[#2a2a2a] space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between border-b border-[#282828] pb-3 gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                      <span>Customize Profile Avatar</span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-neutral-400 truncate">
                      Vector tech presets, DiceBear, photo upload, or URL
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <UserAvatar
                      user={{ name: editName, avatar: editAvatar }}
                      size="lg"
                      className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-blue-500 shadow-md"
                    />
                  </div>
                </div>

                {/* Avatar Source Selector Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#121212] p-1 rounded-lg border border-[#262626]">
                  <button
                    type="button"
                    id="avatar-tab-svg-presets"
                    onClick={() => setAvatarTab('svg-presets')}
                    className={`py-1.5 px-2 rounded-md text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
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
                    className={`py-1.5 px-2 rounded-md text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                      avatarTab === 'dicebear'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Characters
                  </button>

                  <button
                    type="button"
                    id="avatar-tab-upload"
                    onClick={() => setAvatarTab('upload')}
                    className={`py-1.5 px-2 rounded-md text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
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
                    className={`py-1.5 px-2 rounded-md text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
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
                  <div className="space-y-2.5 sm:space-y-3">
                    <p className="text-[11px] sm:text-xs text-neutral-400">
                      Pick a custom generative SVG vector icon designed for modern tech profiles:
                    </p>

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
                      {SVG_AVATAR_STYLES.map((style) => {
                        const previewUrl = getSvgAvatarDataUrl(editName || 'User', style.id);
                        const isSelected = editAvatar === previewUrl;

                        return (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => handleSelectSvgStyle(style.id)}
                            className={`p-2 rounded-lg border flex flex-col items-center gap-1.5 transition-all cursor-pointer group ${
                              isSelected
                                ? 'bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/40 text-white'
                                : 'bg-[#121212] border-[#262626] hover:border-[#444] text-neutral-300'
                            }`}
                          >
                            <img
                              src={previewUrl}
                              alt={style.name}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="text-center w-full min-w-0">
                              <p className="text-[10px] sm:text-[11px] font-semibold truncate">{style.name}</p>
                              <span className="text-[8px] sm:text-[9px] text-neutral-500 uppercase">{style.category}</span>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
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
                          className="w-full bg-[#121212] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-blue-500"
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
                            className="flex-1 bg-[#121212] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-blue-500"
                            placeholder="Type seed..."
                          />
                          <button
                            type="button"
                            onClick={handleRandomizeDicebear}
                            className="p-1.5 sm:p-2 rounded-lg bg-[#252525] hover:bg-[#333] text-neutral-300 hover:text-white border border-[#383838] transition-colors cursor-pointer"
                            title="Randomize Character"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Preview Strip */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 sm:gap-2 pt-2 border-t border-[#262626]">
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
                      className="border-2 border-dashed border-[#383838] hover:border-blue-500 rounded-xl p-4 sm:p-6 text-center cursor-pointer bg-[#121212] hover:bg-[#161616] transition-all group"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <p className="text-xs font-semibold text-white">
                        Click to select an image from your computer
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-neutral-400 mt-1">
                        PNG, JPG, SVG, or WebP (Max 2 MB)
                      </p>
                    </div>
                  </div>
                )}

                {/* Sub-panel 4: Custom Image URL */}
                {avatarTab === 'url' && (
                  <div className="space-y-2.5 sm:space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Direct Image URL
                      </label>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <input
                          type="url"
                          value={customImageUrl}
                          onChange={(e) => {
                            setCustomImageUrl(e.target.value);
                            setEditAvatar(e.target.value);
                          }}
                          placeholder="https://example.com/avatar.jpg"
                          className="flex-1 bg-[#121212] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setEditAvatar(customImageUrl)}
                          className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* =================================================================
                  PROFILE INFORMATION FIELDS
                  ================================================================= */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                <div className="p-3.5 sm:p-4 bg-[#181818] rounded-xl border border-amber-500/30 space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Administrative Access Controls
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Assigned Role Template
                      </label>
                      <select
                        value={editRole === 'basic' ? 'member' : editRole}
                        onChange={(e) => {
                          const newRoleId = e.target.value;
                          setEditRole(newRoleId as UserRole);
                          const template = getRoleTemplate(newRoleId);
                          if (template?.defaultPrivileges) {
                            setEditPrivileges({ ...template.defaultPrivileges });
                          }
                        }}
                        className="w-full bg-[#121212] border border-amber-500/50 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 font-semibold cursor-pointer"
                      >
                        {SYSTEM_ROLE_TEMPLATES.map((tpl) => (
                          <option key={tpl.id} value={tpl.id}>
                            {tpl.name} ({tpl.badge})
                          </option>
                        ))}
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
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5 pt-3 sm:pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  id="profile-btn-cancel-edit"
                  onClick={() => {
                    setIsProfileEditMode(false);
                    setActiveTab('overview');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg bg-[#1e1e1e] hover:bg-[#282828] text-neutral-300 hover:text-white border border-[#333] text-xs font-semibold transition-colors cursor-pointer text-center active:scale-98"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  id="profile-btn-save-changes"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer active:scale-98"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile & Avatar'}</span>
                </button>
              </div>
            </form>
            ) : (
              <div className="p-4 sm:p-6 bg-[#161616] border border-[#262626] rounded-xl text-center space-y-4 max-w-md mx-auto animate-in fade-in duration-150">
                <UserAvatar user={{ name: selectedProfileUser?.name || 'User', avatar: selectedProfileUser?.avatar }} size="xl" className="w-16 h-16 sm:w-20 sm:h-20 mx-auto ring-2 ring-neutral-700" />
                <div>
                  <h4 className="text-base font-bold text-white">{selectedProfileUser?.name}</h4>
                  <p className="text-xs text-neutral-400 font-mono">{selectedProfileUser?.email}</p>
                </div>
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-300 leading-relaxed">
                  Avatar customization and account settings for this profile can only be modified by <span className="font-semibold text-white">{selectedProfileUser?.name}</span> or an Administrator.
                </div>
              </div>
            )
          )}

          {/* =====================================================================
              TAB 5: SECURITY & PASSWORD CHANGE
              ===================================================================== */}
          {activeTab === 'security' && (
            <div className="max-w-xl mx-auto space-y-4 sm:space-y-5">
              <div className="p-3.5 sm:p-4 bg-[#161616] border border-[#262626] rounded-xl flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 shrink-0">
                  <img src="/shiled.svg" alt="Security" className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">Account Security &amp; Credentials</h3>
                  <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 leading-relaxed">
                    Passwords are salted and securely hashed using bcrypt. Enter your current password and a new password to update your login credentials.
                  </p>
                </div>
              </div>

              {isSelf ? (
                <>
                  {passError && (
                    <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>{passError}</div>
                    </div>
                  )}

                  {passSuccess && (
                    <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>{passSuccess}</div>
                    </div>
                  )}

                  <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setPassError(null);
                  setPassSuccess(null);

                  if (!currentPasswordInput) {
                    setPassError('Please enter your current password.');
                    return;
                  }
                  if (newPasswordInput.length < 6) {
                    setPassError('New password must be at least 6 characters long.');
                    return;
                  }
                  if (newPasswordInput !== confirmPasswordInput) {
                    setPassError('New password and confirmation do not match.');
                    return;
                  }

                  try {
                    setIsChangingPass(true);
                    await changePassword(currentPasswordInput, newPasswordInput);
                    setPassSuccess('Password updated successfully! Your account credentials have been changed.');
                    setCurrentPasswordInput('');
                    setNewPasswordInput('');
                    setConfirmPasswordInput('');
                    addToast('success', 'Your account password was successfully updated.');
                  } catch (err: any) {
                    setPassError(err.message || 'Failed to update password.');
                  } finally {
                    setIsChangingPass(false);
                  }
                }}
                className="space-y-3.5 sm:space-y-4 bg-[#141414] border border-[#262626] rounded-xl p-3.5 sm:p-5"
              >
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="profile-input-current-pass"
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 bg-[#0d0d0d] border border-[#333] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer p-1"
                    >
                      {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-1">Default demo accounts password is: <span className="font-mono text-neutral-400">password123</span></p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="profile-input-new-pass"
                      type={showNewPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 bg-[#0d0d0d] border border-[#333] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer p-1"
                    >
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="profile-input-confirm-pass"
                      type="password"
                      required
                      minLength={6}
                      placeholder="Re-enter new password"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#0d0d0d] border border-[#333] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:justify-end">
                  <button
                    id="profile-btn-update-password"
                    type="submit"
                    disabled={isChangingPass}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isChangingPass ? 'Updating Password...' : 'Save New Password'}</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="p-4 sm:p-6 bg-[#141414] border border-[#262626] rounded-xl text-center space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto text-emerald-400">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Protected Security Settings</h4>
              <p className="text-[11px] sm:text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                Password update controls for <strong className="text-white">{selectedProfileUser?.name}</strong> are private to the account holder. Log in as this user to change credentials.
              </p>
            </div>
          )}
        </div>
      )}

        </div>
      </div>
    </div>
  );
};
