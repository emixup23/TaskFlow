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
  AlertCircle,
  Upload,
  File,
  Music,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { MeetingMember, MeetingTopic, MeetingAttachment } from '../types';

export const CreateMeetingModal: React.FC = () => {
  const {
    isCreateMeetingModalOpen,
    setIsCreateMeetingModalOpen,
    createMeeting,
    projects,
    addToast
  } = useTasks();
  const { currentUser, users } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('10:45');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [location, setLocation] = useState('');
  const [projectId, setProjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Members selection
  const [selectedMembers, setSelectedMembers] = useState<MeetingMember[]>(() => {
    if (currentUser) {
      return [
        {
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          role: 'organizer'
        }
      ];
    }
    return [];
  });

  // Topics / Agenda items
  const [topics, setTopics] = useState<MeetingTopic[]>([
    {
      id: 'top-1',
      title: 'Project Progress & Standup Updates',
      durationMinutes: 15,
      presenterId: currentUser?.id,
      completed: false
    }
  ]);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDuration, setNewTopicDuration] = useState('15');

  // File Attachments
  const [attachments, setAttachments] = useState<MeetingAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isCreateMeetingModalOpen) return null;

  const handleClose = () => {
    setIsCreateMeetingModalOpen(false);
  };

  const handleToggleUser = (user: { id: string; name: string; avatar?: string }) => {
    const exists = selectedMembers.some((m) => m.userId === user.id);
    if (exists) {
      // If organizer, don't remove if it's the only one
      if (selectedMembers.length <= 1) {
        addToast('error', 'Meeting must have at least one attendee.');
        return;
      }
      setSelectedMembers(selectedMembers.filter((m) => m.userId !== user.id));
    } else {
      setSelectedMembers([
        ...selectedMembers,
        {
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          role: selectedMembers.length === 0 ? 'organizer' : 'required'
        }
      ]);
    }
  };

  const handleToggleMemberRole = (userId: string) => {
    setSelectedMembers(
      selectedMembers.map((m) => {
        if (m.userId === userId) {
          const nextRole: MeetingMember['role'] =
            m.role === 'organizer' ? 'required' : m.role === 'required' ? 'optional' : 'organizer';
          return { ...m, role: nextRole };
        }
        return m;
      })
    );
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    const newTopic: MeetingTopic = {
      id: `top-${Date.now()}`,
      title: newTopicTitle.trim(),
      durationMinutes: parseInt(newTopicDuration, 10) || 15,
      presenterId: currentUser?.id,
      completed: false
    };

    setTopics([...topics, newTopic]);
    setNewTopicTitle('');
    setNewTopicDuration('15');
  };

  const handleRemoveTopic = (id: string) => {
    setTopics(topics.filter((t) => t.id !== id));
  };

  // Supported file attachment types: pdf, txt, csv, docx, mp3
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

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!allowedExtensions.includes(ext) && !allowedMimeTypes.includes(file.type)) {
        addToast(
          'error',
          `Unsupported file type for "${file.name}". Allowed types: PDF, TXT, CSV, DOCX, MP3.`
        );
        continue;
      }

      // Max size: 10MB
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

        const newAttachment: MeetingAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          url: dataUrl,
          size: file.size,
          type: file.type || ext,
          uploadedBy: currentUser?.id || 'User',
          uploadedByName: currentUser?.name || 'User',
          uploadedAt: new Date().toISOString(),
          extension: (ext.replace('.', '') || 'txt') as any
        };

        setAttachments((prev) => [...prev, newAttachment]);
        addToast('success', `Attached ${file.name}`);
      } catch (err) {
        addToast('error', `Failed to read file ${file.name}`);
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('error', 'Meeting title is required.');
      return;
    }
    if (selectedMembers.length === 0) {
      addToast('error', 'Please select at least one attendee.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        startTime,
        endTime: endTime || undefined,
        durationMinutes: Number(durationMinutes) || 45,
        location: location.trim() || undefined,
        projectId: projectId || undefined,
        memberIds: selectedMembers.map((m) => m.userId),
        members: selectedMembers,
        topics,
        notes: notes.trim() || '',
        attachments,
        status: 'scheduled'
      });

      handleClose();
    } catch (err) {
      // Toast already shown in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <File className="w-4 h-4 text-rose-400" />;
    if (ext === 'mp3' || ext === 'wav') return <Music className="w-4 h-4 text-amber-400" />;
    if (ext === 'csv') return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    if (ext === 'docx' || ext === 'doc') return <FileText className="w-4 h-4 text-blue-400" />;
    return <FileCode className="w-4 h-4 text-neutral-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-[#141414] border border-[#262626] rounded-xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626] bg-[#181818]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-violet-950/80 border border-violet-800 text-violet-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Schedule Team Meeting</h2>
              <p className="text-xs text-neutral-400">
                Setup attendees, agenda topics, structured notes, and documents
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Title & Project Association */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                Meeting Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Sprint Planning & Architecture Review"
                className="w-full px-3.5 py-2 bg-[#1c1c1c] border border-[#333333] rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-violet-400" />
                  <span>Associated Project</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1c1c1c] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="">No Project (General Sync)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      📁 {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-violet-400" />
                  <span>Location or Video Link</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. https://meet.google.com/xyz or Room 402"
                  className="w-full px-3 py-2 bg-[#1c1c1c] border border-[#333333] rounded-lg text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Description / Objective
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of what this meeting aims to achieve..."
                className="w-full px-3 py-2 bg-[#1c1c1c] border border-[#333333] rounded-lg text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>
          </div>

          {/* Date, Time & Duration Controls */}
          <div className="p-4 bg-[#181818] border border-[#262626] rounded-lg space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Date & Time Duration</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#121212] border border-[#333333] rounded text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#121212] border border-[#333333] rounded text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#121212] border border-[#333333] rounded text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Duration (Mins)</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#121212] border border-[#333333] rounded text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Members / Attendees Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-violet-400" />
                <span>Attendees & Roles ({selectedMembers.length})</span>
              </label>
              <span className="text-[11px] text-neutral-500">Click attendee badge to cycle role</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-[#181818] rounded-lg border border-[#262626]">
              {users.map((u) => {
                const member = selectedMembers.find((m) => m.userId === u.id);
                const isSelected = Boolean(member);

                return (
                  <div
                    key={u.id}
                    className={`flex items-center justify-between p-2 rounded text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-violet-950/70 border border-violet-800 text-white'
                        : 'bg-[#141414] hover:bg-[#1f1f1f] border border-[#2d2d2d] text-neutral-400'
                    }`}
                    onClick={() => handleToggleUser(u)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-violet-900 text-[10px] font-bold flex items-center justify-center text-white shrink-0">
                          {u.name.substring(0, 1)}
                        </div>
                      )}
                      <span className="truncate font-medium">{u.name}</span>
                    </div>

                    {isSelected && member && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleMemberRole(u.id);
                        }}
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded cursor-pointer ${
                          member.role === 'organizer'
                            ? 'bg-violet-600 text-white'
                            : member.role === 'required'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                        title="Click to toggle Organizer / Required / Optional"
                      >
                        {member.role}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agenda Topics Section */}
          <div className="p-4 bg-[#181818] border border-[#262626] rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Agenda Topics ({topics.length})</span>
              </h3>
              <span className="text-[11px] text-neutral-400">
                Total agenda: {topics.reduce((acc, t) => acc + (t.durationMinutes || 0), 0)} mins
              </span>
            </div>

            {/* Topics List */}
            {topics.length > 0 && (
              <div className="space-y-1.5">
                {topics.map((t, idx) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 p-2 bg-[#121212] border border-[#2a2a2a] rounded text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-[#202020] text-[10px] font-bold text-neutral-400 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-white truncate">{t.title}</span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[11px] font-mono text-neutral-400 bg-[#202020] px-2 py-0.5 rounded">
                        {t.durationMinutes}m
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(t.id)}
                        className="p-1 text-neutral-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Topic Input Form */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                placeholder="New topic title (e.g. Q4 roadmap priorities)..."
                className="flex-1 px-3 py-1.5 bg-[#121212] border border-[#333333] rounded text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTopic(e);
                  }
                }}
              />
              <div className="flex items-center gap-1 bg-[#121212] border border-[#333333] rounded px-2">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={newTopicDuration}
                  onChange={(e) => setNewTopicDuration(e.target.value)}
                  className="w-10 bg-transparent text-xs text-white text-center focus:outline-none font-mono"
                  placeholder="15"
                />
                <span className="text-[10px] text-neutral-500">m</span>
              </div>
              <button
                type="button"
                onClick={handleAddTopic}
                className="px-3 py-1.5 bg-violet-700 hover:bg-violet-600 text-white rounded text-xs font-semibold cursor-pointer transition-colors shrink-0"
              >
                Add Topic
              </button>
            </div>
          </div>

          {/* Notes & Summary */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-violet-400" />
              <span>Initial Meeting Notes / Pre-read</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add agenda details, background context, or pre-meeting briefing..."
              className="w-full px-3 py-2 bg-[#1c1c1c] border border-[#333333] rounded-lg text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500 resize-none font-mono"
            />
          </div>

          {/* File Attachments (pdf/txt/csv/docx/mp3) */}
          <div className="p-4 bg-[#181818] border border-[#262626] rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                <span>Files Attachment ({attachments.length})</span>
              </h3>
              <span className="text-[11px] text-neutral-400">Supported: PDF, TXT, CSV, DOCX, MP3</span>
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 bg-[#121212] border border-[#2a2a2a] rounded text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getFileIcon(att.name)}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{att.name}</p>
                        <p className="text-[10px] text-neutral-500">{(att.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="p-1 text-neutral-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
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
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#3d3d3d] hover:border-violet-500 rounded bg-[#141414] hover:bg-[#1a1a1a] text-xs text-neutral-300 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-violet-400" />
                <span>{isUploading ? 'Uploading file...' : 'Attach documents or audio (PDF, TXT, CSV, DOCX, MP3)'}</span>
              </button>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262626]">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-[#222222] hover:bg-[#2a2a2a] text-neutral-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-lg shadow-violet-950/40 transition-colors cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>{isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
