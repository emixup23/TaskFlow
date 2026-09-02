import React, { useState, useRef } from 'react';
import {
  X,
  Video,
  Calendar,
  Clock,
  Users,
  FileText,
  Paperclip,
  Plus,
  Trash2,
  MapPin,
  Briefcase,
  CheckCircle2,
  Square,
  AlertCircle,
  Upload,
  File,
  Music,
  FileSpreadsheet,
  FileCode,
  Download,
  ExternalLink,
  Edit2,
  Check,
  Play,
  Share2,
  Activity,
  History,
  MessageSquare,
  Sparkles,
  Tag,
  CheckSquare
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { Meeting, MeetingStatus, MeetingTopic, MeetingMember, MeetingAttachment, MeetingLog } from '../types';
import { UserAvatar } from './UserAvatar';
import { formatMeetingDateTime, formatDateTimeDDMMYYYYHHMM } from '../utils/dateUtils';

export const MeetingDetailModal: React.FC = () => {
  const {
    selectedMeeting,
    setSelectedMeeting,
    updateMeeting,
    deleteMeeting,
    addMeetingLog,
    toggleMeetingTopic,
    projects,
    addToast
  } = useTasks();
  const { currentUser, users, isAdmin } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'agenda' | 'notes' | 'members' | 'attachments' | 'logs'>('agenda');

  // Local Editable state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDuration, setNewTopicDuration] = useState('15');
  const [isUploading, setIsUploading] = useState(false);

  // New Log Entry State
  const [newLogDetails, setNewLogDetails] = useState('');
  const [newLogAction, setNewLogAction] = useState<string>('decision');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Sync state when meeting changes
  React.useEffect(() => {
    if (selectedMeeting) {
      setTitle(selectedMeeting.title);
      setDescription(selectedMeeting.description || '');
      setNotes(selectedMeeting.notes || '');
    }
  }, [selectedMeeting?.id]);

  if (!selectedMeeting) return null;

  const meeting = selectedMeeting;
  const project = projects.find((p) => p.id === meeting.projectId);
  const membersList: MeetingMember[] = (meeting.members && meeting.members.length > 0)
    ? meeting.members
    : (meeting.memberIds || []).map((id) => {
        const u = users.find((x) => x.id === id);
        return {
          userId: id,
          userName: u?.name || 'User',
          userAvatar: u?.avatar,
          role: id === meeting.createdBy ? ('organizer' as const) : ('required' as const)
        };
      });

  const isOrganizer = membersList.some(
    (m) => m.userId === currentUser?.id && m.role === 'organizer'
  );
  const canManage = isAdmin || isOrganizer || meeting.createdBy === currentUser?.id;

  const handleClose = () => {
    setSelectedMeeting(null);
  };

  const handleStatusChange = async (newStatus: MeetingStatus) => {
    await updateMeeting(meeting.id, { status: newStatus });
  };

  const handleSaveTitle = async () => {
    if (!title.trim()) return;
    await updateMeeting(meeting.id, {
      title: title.trim(),
      description: description.trim() || undefined
    });
    setIsEditingTitle(false);
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await updateMeeting(meeting.id, { notes: notes.trim() || '' });
      addToast('success', 'Meeting notes updated successfully');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Topics Handlers
  const handleToggleTopic = async (topicId: string) => {
    try {
      await toggleMeetingTopic(meeting.id, topicId);
    } catch {
      const updatedTopics = (meeting.topics || []).map((t) =>
        t.id === topicId ? { ...t, completed: !t.completed } : t
      );
      await updateMeeting(meeting.id, { topics: updatedTopics });
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    const newTopic: MeetingTopic = {
      id: `top-${Date.now()}`,
      title: newTopicTitle.trim(),
      durationMinutes: parseInt(newTopicDuration, 10) || 15,
      presenterId: currentUser?.id,
      completed: false
    };

    const updatedTopics = [...(meeting.topics || []), newTopic];
    await updateMeeting(meeting.id, { topics: updatedTopics });
    setNewTopicTitle('');
    setNewTopicDuration('15');
  };

  const handleDeleteTopic = async (topicId: string) => {
    const updatedTopics = (meeting.topics || []).filter((t) => t.id !== topicId);
    await updateMeeting(meeting.id, { topics: updatedTopics });
  };

  // Activity Log Handler
  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogDetails.trim() || isSubmittingLog) return;

    setIsSubmittingLog(true);
    try {
      await addMeetingLog(meeting.id, {
        details: newLogDetails.trim(),
        action: newLogAction
      });
      setNewLogDetails('');
      addToast('success', 'Activity entry recorded in meeting log');
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to record meeting log');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Members Handlers
  const handleToggleMember = async (user: { id: string; name: string; avatar?: string }) => {
    const exists = membersList.some((m) => m.userId === user.id);
    let updatedMembers: MeetingMember[];

    if (exists) {
      if (membersList.length <= 1) {
        addToast('error', 'Meeting must have at least one attendee.');
        return;
      }
      updatedMembers = membersList.filter((m) => m.userId !== user.id);
    } else {
      updatedMembers = [
        ...membersList,
        {
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          role: 'required'
        }
      ];
    }
    await updateMeeting(meeting.id, {
      members: updatedMembers,
      memberIds: updatedMembers.map((m) => m.userId)
    });
  };

  const handleToggleMemberRole = async (userId: string) => {
    const updatedMembers = membersList.map((m) => {
      if (m.userId === userId) {
        const nextRole: MeetingMember['role'] =
          m.role === 'organizer' ? 'required' : m.role === 'required' ? 'optional' : 'organizer';
        return { ...m, role: nextRole };
      }
      return m;
    });
    await updateMeeting(meeting.id, {
      members: updatedMembers,
      memberIds: updatedMembers.map((m) => m.userId)
    });
  };

  // File Attachments
  const allowedExtensions = ['.pdf', '.txt', '.csv', '.docx', '.mp3'];
  const allowedMimeTypes = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav'
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments: MeetingAttachment[] = [...(meeting.attachments || [])];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!allowedExtensions.includes(ext) && !allowedMimeTypes.includes(file.type)) {
        addToast('error', `Unsupported file "${file.name}". Supported: PDF, TXT, CSV, DOCX, MP3.`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        addToast('error', `File "${file.name}" exceeds 10MB limit.`);
        continue;
      }

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          url: dataUrl,
          size: file.size,
          type: file.type || ext,
          uploadedBy: currentUser?.id || 'User',
          uploadedByName: currentUser?.name || 'User',
          uploadedAt: new Date().toISOString(),
          extension: (ext.replace('.', '') || 'txt') as any
        });
      } catch (err) {
        addToast('error', `Failed to read file ${file.name}`);
      }
    }

    await updateMeeting(meeting.id, { attachments: newAttachments });
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    const updatedAttachments = (meeting.attachments || []).filter((a) => a.id !== attachmentId);
    await updateMeeting(meeting.id, { attachments: updatedAttachments });
    addToast('info', 'Attachment deleted');
  };

  const handleDeleteMeeting = async () => {
    if (window.confirm(`Are you sure you want to delete meeting "${meeting.title}"?`)) {
      await deleteMeeting(meeting.id);
      handleClose();
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <File className="w-5 h-5 text-rose-400" />;
    if (ext === 'mp3' || ext === 'wav') return <Music className="w-5 h-5 text-amber-400" />;
    if (ext === 'csv') return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (ext === 'docx' || ext === 'doc') return <FileText className="w-5 h-5 text-blue-400" />;
    return <FileCode className="w-5 h-5 text-neutral-400" />;
  };

  const totalTopics = meeting.topics?.length || 0;
  const completedTopics = meeting.topics?.filter((t) => t.completed).length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-[#141414] border border-[#262626] rounded-xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626] bg-[#181818] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded bg-violet-950/80 border border-violet-800 text-violet-400 shrink-0">
              <Video className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="px-2 py-1 bg-[#121212] border border-[#333333] rounded text-sm text-white font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleSaveTitle}
                    className="p-1 bg-violet-600 hover:bg-violet-500 text-white rounded cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white truncate">{meeting.title}</h2>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(true)}
                      className="p-1 text-neutral-400 hover:text-white rounded cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                <span className="font-mono text-neutral-300">{formatMeetingDateTime(meeting.date, meeting.startTime, meeting.endTime)}</span>
                <span>•</span>
                <span className="font-mono">({meeting.durationMinutes}m)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Meeting Status Selector */}
            <select
              value={meeting.status}
              disabled={!canManage}
              onChange={(e) => handleStatusChange(e.target.value as MeetingStatus)}
              className="px-2.5 py-1.5 bg-[#1f1f1f] border border-[#333333] rounded-lg text-xs font-semibold text-white focus:ring-1 focus:ring-violet-500 cursor-pointer disabled:cursor-not-allowed"
            >
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {canManage && (
              <button
                type="button"
                onClick={handleDeleteMeeting}
                title="Delete Meeting"
                className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-[#262626] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Meeting Quick Bar: Video Link / Location / Project */}
        <div className="px-6 py-2.5 bg-[#121212] border-b border-[#222222] flex items-center justify-between gap-4 text-xs flex-wrap shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            {project && (
              <div className="flex items-center gap-1.5 text-neutral-300">
                <Briefcase className="w-3.5 h-3.5 text-violet-400" />
                <span className="font-medium">{project.name}</span>
              </div>
            )}

            {meeting.location && (
              <div className="flex items-center gap-1.5 text-neutral-300">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                <span>{meeting.location}</span>
              </div>
            )}
          </div>

          {meeting.location && meeting.location.startsWith('http') && (
            <a
              href={meeting.location}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded font-bold text-xs transition-colors shadow-xs"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Join Video Call</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-[#262626] bg-[#141414] gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'agenda'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Agenda & Topics</span>
            {totalTopics > 0 && (
              <span className="text-[10px] bg-[#222222] text-neutral-300 px-1.5 py-0.2 rounded font-medium ml-1">
                {completedTopics}/{totalTopics}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'notes'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Edit2 className="w-4 h-4" />
            <span>Meeting Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'members'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Attendees</span>
            <span className="text-[10px] bg-[#222222] text-neutral-300 px-1.5 py-0.2 rounded font-medium ml-1">
              {membersList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attachments')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'attachments'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Paperclip className="w-4 h-4" />
            <span>Files ({meeting.attachments?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Activity & Logs</span>
            <span className="text-[10px] bg-[#222222] text-neutral-300 px-1.5 py-0.2 rounded font-medium ml-1">
              {meeting.logs?.length || 0}
            </span>
          </button>
        </div>

        {/* Tab Content Surface */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-[#121212]">
          {/* TAB 1: AGENDA & TOPICS */}
          {activeTab === 'agenda' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Structured Meeting Agenda</h3>
                  <p className="text-xs text-neutral-400">
                    Track topic discussion points and check off items as they conclude.
                  </p>
                </div>
                <span className="text-xs font-mono text-violet-400 bg-violet-950/60 border border-violet-800/60 px-2.5 py-1 rounded">
                  {completedTopics} of {totalTopics} Completed
                </span>
              </div>

              {/* Topics List */}
              {meeting.topics && meeting.topics.length > 0 ? (
                <div className="space-y-2">
                  {meeting.topics.map((topic, idx) => (
                    <div
                      key={topic.id}
                      className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-all ${
                        topic.completed
                          ? 'bg-[#181818]/60 border-[#262626] opacity-75'
                          : 'bg-[#181818] border-[#333333]'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleTopic(topic.id)}
                          className="mt-0.5 text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                        >
                          {topic.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Square className="w-5 h-5 text-neutral-500 hover:text-violet-400" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold ${
                              topic.completed ? 'line-through text-neutral-500' : 'text-white'
                            }`}
                          >
                            {topic.title}
                          </p>
                          {topic.notes && (
                            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{topic.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {topic.durationMinutes && (
                          <span className="text-xs font-mono text-neutral-400 bg-[#202020] px-2 py-0.5 rounded border border-[#2d2d2d]">
                            {topic.durationMinutes}m
                          </span>
                        )}
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTopic(topic.id)}
                            className="p-1 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-neutral-500 bg-[#161616] rounded border border-[#262626]">
                  No agenda topics created for this meeting yet.
                </div>
              )}

              {/* Add Topic Form */}
              {canManage && (
                <form onSubmit={handleAddTopic} className="p-3 bg-[#181818] border border-[#2a2a2a] rounded-lg flex gap-2">
                  <input
                    type="text"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    placeholder="Add an agenda topic (e.g. Discuss deployment rollout)..."
                    className="flex-1 px-3 py-1.5 bg-[#121212] border border-[#333333] rounded text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500"
                  />
                  <div className="flex items-center gap-1 bg-[#121212] border border-[#333333] rounded px-2">
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={newTopicDuration}
                      onChange={(e) => setNewTopicDuration(e.target.value)}
                      className="w-10 bg-transparent text-xs text-white text-center focus:outline-none font-mono"
                    />
                    <span className="text-[10px] text-neutral-500">m</span>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Add Topic
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: NOTES & MINUTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Meeting Minutes & Notes</h3>
                  <p className="text-xs text-neutral-400">
                    Live collaborative minutes, summary points, key decisions, and action items.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSavingNotes}
                  onClick={handleSaveNotes}
                  className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-xs rounded transition-colors cursor-pointer"
                >
                  {isSavingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>

              <textarea
                rows={12}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type comprehensive notes, action items, assignees, and key decisions here..."
                className="w-full p-4 bg-[#181818] border border-[#2a2a2a] rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-violet-500 leading-relaxed font-sans resize-y"
              />
            </div>
          )}

          {/* TAB 3: ATTENDEES / MEMBERS */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Attendees & Roles</h3>
                  <p className="text-xs text-neutral-400">
                    Manage meeting participants, organizers, and required vs optional members.
                  </p>
                </div>
              </div>

              {/* Members List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {membersList.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-3 bg-[#181818] border border-[#2a2a2a] rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {member.userAvatar ? (
                        <img
                          src={member.userAvatar}
                          alt={member.userName}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-violet-950 text-violet-300 font-bold flex items-center justify-center text-xs shrink-0">
                          {member.userName.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{member.userName}</p>
                        <p className="text-[10px] text-neutral-400 capitalize">{member.role}</p>
                      </div>
                    </div>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleToggleMemberRole(member.userId)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                          member.role === 'organizer'
                            ? 'bg-violet-600 text-white'
                            : member.role === 'required'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                        title="Toggle role: Organizer / Required / Optional"
                      >
                        {member.role}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add/Remove Team Members Picker */}
              {canManage && (
                <div className="pt-4 border-t border-[#262626] space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Add Team Members to Sync
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {users.map((u) => {
                      const isSelected = membersList.some((m) => m.userId === u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleToggleMember(u)}
                          className={`flex items-center justify-between p-2 rounded text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-violet-950/60 border border-violet-800 text-violet-200'
                              : 'bg-[#161616] border border-[#2d2d2d] text-neutral-400 hover:bg-[#202020]'
                          }`}
                        >
                          <span className="truncate">{u.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FILE ATTACHMENTS */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Attached Files & Audio Recordings</h3>
                  <p className="text-xs text-neutral-400">
                    Pre-reads, minutes documents, spreadsheets, and meeting audio recordings (PDF, TXT, CSV, DOCX, MP3).
                  </p>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.txt,.csv,.docx,.doc,.mp3,.wav"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-xs rounded transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
                  </button>
                </div>
              </div>

              {/* Files List */}
              {meeting.attachments && meeting.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {meeting.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 bg-[#181818] border border-[#2a2a2a] rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {getFileIcon(att.name)}
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{att.name}</p>
                          <p className="text-[10px] text-neutral-400">
                            {(att.size / 1024).toFixed(1)} KB • Uploaded by {att.uploadedBy}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <a
                          href={att.url}
                          download={att.name}
                          className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-[#262626] transition-colors"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-400 rounded hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-neutral-500 bg-[#161616] rounded border border-[#262626]">
                  No files attached to this meeting yet. Upload PDFs, agenda docs, CSVs, or audio recordings.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ACTIVITY & LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-violet-400" />
                    <span>Meeting Activity & Decision Logs</span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Audit trail of agenda completion, attendee modifications, notes revisions, and team decisions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-neutral-400 bg-[#1c1c1c] border border-[#2c2c2c] px-2.5 py-1 rounded">
                    {meeting.logs?.length || 0} Log Entries
                  </span>
                </div>
              </div>

              {/* Add Custom Log / Decision / Takeaway Form */}
              <form
                onSubmit={handleAddLog}
                className="p-4 bg-[#181818] border border-[#282828] rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-violet-400" />
                    <span>Record Decision or Meeting Takeaway</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewLogAction('decision')}
                      className={`text-[11px] px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        newLogAction === 'decision'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold'
                          : 'bg-[#222222] text-neutral-400 hover:text-neutral-200 border border-transparent'
                      }`}
                    >
                      Decision
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewLogAction('action_item')}
                      className={`text-[11px] px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        newLogAction === 'action_item'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800 font-semibold'
                          : 'bg-[#222222] text-neutral-400 hover:text-neutral-200 border border-transparent'
                      }`}
                    >
                      Action Item
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewLogAction('note')}
                      className={`text-[11px] px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        newLogAction === 'note'
                          ? 'bg-violet-950 text-violet-300 border border-violet-800 font-semibold'
                          : 'bg-[#222222] text-neutral-400 hover:text-neutral-200 border border-transparent'
                      }`}
                    >
                      Key Note
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLogDetails}
                    onChange={(e) => setNewLogDetails(e.target.value)}
                    placeholder={
                      newLogAction === 'decision'
                        ? 'e.g. Approved mobile app navigation redesign for sprint 24...'
                        : newLogAction === 'action_item'
                        ? 'e.g. Sarah to draft API contract with backend team by Thursday...'
                        : 'e.g. Noted blocker regarding cloud storage quotas...'
                    }
                    className="flex-1 px-3 py-2 bg-[#121212] border border-[#333333] rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    disabled={!newLogDetails.trim() || isSubmittingLog}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-xs rounded transition-colors shrink-0 cursor-pointer"
                  >
                    {isSubmittingLog ? 'Saving...' : 'Add Entry'}
                  </button>
                </div>
              </form>

              {/* Logs Timeline List */}
              {meeting.logs && meeting.logs.length > 0 ? (
                <div className="space-y-3 relative before:absolute before:top-3 before:bottom-3 before:left-4 before:w-0.5 before:bg-[#262626]">
                  {meeting.logs.map((log) => {
                    const isDecision = log.action === 'decision';
                    const isActionItem = log.action === 'action_item';
                    const isTopicCompleted = log.action === 'topic_completed';
                    const isStatusChanged = log.action === 'status_changed';
                    const isCreated = log.action === 'created';
                    const isAttachment = log.action.includes('attachment');
                    const isNotes = log.action === 'notes_updated';
                    const isMember = log.action.includes('member');

                    let badgeColor = 'bg-violet-950/60 text-violet-300 border-violet-800/60';
                    let badgeLabel = log.action.replace(/_/g, ' ').toUpperCase();

                    if (isDecision) {
                      badgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
                      badgeLabel = 'DECISION';
                    } else if (isActionItem) {
                      badgeColor = 'bg-amber-950/80 text-amber-300 border-amber-800/80';
                      badgeLabel = 'ACTION ITEM';
                    } else if (isTopicCompleted) {
                      badgeColor = 'bg-teal-950/80 text-teal-300 border-teal-800/80';
                      badgeLabel = 'AGENDA COMPLETED';
                    } else if (isStatusChanged) {
                      badgeColor = 'bg-blue-950/80 text-blue-300 border-blue-800/80';
                      badgeLabel = 'STATUS CHANGE';
                    } else if (isCreated) {
                      badgeColor = 'bg-purple-950/80 text-purple-300 border-purple-800/80';
                      badgeLabel = 'CREATED';
                    } else if (isAttachment) {
                      badgeColor = 'bg-sky-950/80 text-sky-300 border-sky-800/80';
                      badgeLabel = 'ATTACHMENT';
                    } else if (isNotes) {
                      badgeColor = 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80';
                      badgeLabel = 'NOTES UPDATED';
                    } else if (isMember) {
                      badgeColor = 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80';
                      badgeLabel = 'ATTENDEES';
                    }

                    const formattedTime = formatDateTimeDDMMYYYYHHMM(log.timestamp);

                    return (
                      <div
                        key={log.id}
                        className="relative pl-10 flex items-start gap-3 text-xs"
                      >
                        {/* Timeline Node Dot */}
                        <div className="absolute left-2.5 top-2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#1e1e1e] border-2 border-violet-500 shrink-0 z-10" />

                        <div className="flex-1 p-3 bg-[#181818] border border-[#262626] rounded-lg space-y-1.5 hover:border-[#363636] transition-colors">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {log.userAvatar ? (
                                <img
                                  src={log.userAvatar}
                                  alt={log.userName || 'User'}
                                  className="w-5 h-5 rounded-full object-cover border border-[#333333]"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-violet-950 border border-violet-800 flex items-center justify-center text-[9px] font-bold text-violet-300">
                                  {(log.userName || 'U').substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="font-semibold text-white">
                                {log.userName || 'Team Member'}
                              </span>

                              <span
                                className={`text-[10px] px-2 py-0.5 rounded border font-mono font-bold ${badgeColor}`}
                              >
                                {badgeLabel}
                              </span>
                            </div>

                            <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-neutral-500" />
                              <span>{formattedTime}</span>
                            </span>
                          </div>

                          <p className="text-neutral-200 leading-relaxed pl-7">
                            {log.details}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-neutral-500 bg-[#161616] rounded border border-[#262626]">
                  No activity logged yet for this meeting.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
