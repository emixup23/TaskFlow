import React, { useState } from 'react';
import {
  Video,
  Calendar,
  Clock,
  Users,
  FileText,
  Paperclip,
  Plus,
  Search,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  Play,
  ExternalLink,
  Trash2,
  Edit,
  MoreVertical,
  Layers,
  MapPin,
  ChevronRight,
  ListOrdered,
  Activity
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { Meeting, MeetingStatus } from '../types';
import { UserAvatar } from './UserAvatar';
import { formatMeetingDateTime, formatDateDDMMYYYY } from '../utils/dateUtils';

export const MeetingsView: React.FC = () => {
  const {
    meetings,
    openMeetingDetail,
    setIsCreateMeetingModalOpen,
    deleteMeeting,
    projects,
    addToast
  } = useTasks();
  const { users, currentUser, isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MeetingStatus>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past' | 'today'>('all');
  const [showMobileSearchFilters, setShowMobileSearchFilters] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
//



  // Filtering meetings
  const filteredMeetings = meetings.filter((m) => {
    const meetingDate = m.date || (m.startTime ? m.startTime.split('T')[0] : todayStr);
    // Status filter
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;

    // Time filter
    if (timeFilter === 'today' && meetingDate !== todayStr) return false;
    if (timeFilter === 'upcoming' && (meetingDate < todayStr || m.status === 'completed')) return false;
    if (timeFilter === 'past' && meetingDate >= todayStr && m.status !== 'completed') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchDesc = m.description?.toLowerCase().includes(q);
      const matchTopic = m.topics?.some((t) => t.title.toLowerCase().includes(q));
      const matchMember = (m.members || []).some((mem) => mem.userName.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTopic && !matchMember) return false;
    }

    return true;
  });

  // Calculate statistics
  const totalMeetings = meetings.length;
  const upcomingCount = meetings.filter((m) => m.status === 'scheduled' || m.status === 'in_progress').length;
  const completedCount = meetings.filter((m) => m.status === 'completed').length;
  const totalTopicsCount = meetings.reduce((acc, m) => acc + (m.topics?.length || 0), 0);
  const totalDurationMinutes = meetings.reduce((acc, m) => acc + (m.durationMinutes || 0), 0);

  const getStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            IN PROGRESS
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800">
            <Clock className="w-3 h-3" />
            SCHEDULED
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETED
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-900 text-neutral-400 border border-neutral-700">
            CANCELLED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0d0d0d]">
      {/* Top Header & Actions Bar */}
      <div className="p-2.5 sm:p-6 border-b border-[#262626] bg-[#121212] space-y-2.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-violet-950/60 border border-violet-800/60 text-violet-400">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Meetings</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#222222] border border-[#333333] text-neutral-300 font-mono">
                    {meetings.length}
                  </span>
                </h1>

              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Mobile Search & Filter toggle button */}
            <button
              type="button"
              id="btn-toggle-mobile-search"
              onClick={() => setShowMobileSearchFilters((prev) => !prev)}
              className={`sm:hidden flex items-center justify-center w-8 h-8 rounded border transition-colors cursor-pointer relative ${
                showMobileSearchFilters || searchQuery || statusFilter !== 'all'
                  ? 'bg-violet-950/70 border-violet-500/60 text-violet-300'
                  : 'bg-[#181818] border-[#2d2d2d] text-neutral-400 hover:text-neutral-200'
              }`}
              title="Search and filter meetings"
              aria-label="Toggle search and filter"
            >
              {showMobileSearchFilters ? (
                <X className="w-4 h-4" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {!showMobileSearchFilters && (searchQuery || statusFilter !== 'all') && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-400" />
              )}
            </button>

            <button
              type="button"
              id="btn-schedule-meeting"
              onClick={() => setIsCreateMeetingModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-violet-950/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick KPI Stats Cards - Hidden on Mobile */}
        <div className="hidden sm:grid sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-[#181818] border border-[#262626] rounded">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Total Syncs</span>
            <span className="text-xl font-bold font-mono text-white">{totalMeetings}</span>
          </div>
          <div className="p-3 bg-[#181818] border border-[#262626] rounded">
            <span className="text-[10px] uppercase font-bold text-violet-400 block mb-1">Upcoming & Active</span>
            <span className="text-xl font-bold font-mono text-violet-300">{upcomingCount}</span>
          </div>
          <div className="p-3 bg-[#181818] border border-[#262626] rounded">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Completed</span>
            <span className="text-xl font-bold font-mono text-emerald-300">{completedCount}</span>
          </div>
          <div className="p-3 bg-[#181818] border border-[#262626] rounded">
            <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">Total Agenda Topics</span>
            <span className="text-xl font-bold font-mono text-blue-300">{totalTopicsCount}</span>
          </div>
        </div>

        {/* Search & Filter Controls - Hidden by default on Mobile, revealed behind search icon */}
        <div className={`${showMobileSearchFilters ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pt-1.5 sm:pt-2`}>
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meetings by title, agenda topic, or member..."
              className="w-full pl-9 pr-8 py-1.5 bg-[#181818] border border-[#2d2d2d] rounded text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-violet-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Time Filter */}
            <div className="flex items-center bg-[#181818] border border-[#2d2d2d] rounded p-0.5 text-xs">
              {(['all', 'upcoming', 'today', 'past'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTimeFilter(mode)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition-colors cursor-pointer ${
                    timeFilter === mode
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-[#181818] border border-[#2d2d2d] rounded text-xs text-neutral-300 font-medium cursor-pointer focus:ring-1 focus:ring-violet-500"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Meetings Grid / List Surface */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-6 bg-[#0d0d0d]">
        {filteredMeetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredMeetings.map((meeting) => {
              const project = projects.find((p) => p.id === meeting.projectId);
              const mDate = meeting.date || (meeting.startTime ? meeting.startTime.split('T')[0] : todayStr);
              const isToday = mDate === todayStr;
              const membersList = (meeting.members && meeting.members.length > 0)
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
              const completedTopics = meeting.topics?.filter((t) => t.completed).length || 0;
              const totalTopics = meeting.topics?.length || 0;

              return (
                <div
                  key={meeting.id}
                  id={`meeting-card-${meeting.id}`}
                  onClick={() => openMeetingDetail(meeting)}
                  className="group relative flex flex-col justify-between p-3 sm:p-4 rounded-lg bg-[#141414] hover:bg-[#181818] border border-[#262626] hover:border-violet-500/60 transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md"
                >
                  <div>
                    {/* Top Status & Date Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(meeting.status)}
                        {isToday && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50 uppercase">
                            Today
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                        <Clock className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="font-mono">{meeting.durationMinutes}m</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base font-bold text-white group-hover:text-violet-400 transition-colors mb-1.5">
                      {meeting.title}
                    </h3>
                    {meeting.description && (
                      <p className="text-xs text-neutral-400 line-clamp-2 mb-3 leading-relaxed">
                        {meeting.description}
                      </p>
                    )}

                    {/* Schedule Date & Time Information (dd/mm/yyyy HH:MM) */}
                    <div className="flex items-center gap-3 text-xs text-neutral-300 mb-3.5 bg-[#1a1a1a] p-2 rounded border border-[#2a2a2a]">
                      <div className="flex items-center gap-1.5 font-mono text-neutral-200">
                        <Calendar className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        <span>{formatMeetingDateTime(meeting.date || mDate, meeting.startTime, meeting.endTime)}</span>
                      </div>
                    </div>

                    {/* Location or Video Call Link */}
                    {meeting.location && (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-3 truncate">
                        {meeting.location.startsWith('http') ? (
                          <>
                            <Video className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <a
                              href={meeting.location}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-400 hover:underline truncate"
                            >
                              {meeting.location}
                            </a>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <span className="truncate">{meeting.location}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Topics / Agenda Summary */}
                    {meeting.topics && meeting.topics.length > 0 && (
                      <div className="space-y-1.5 mb-3.5">
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 font-bold uppercase">
                          <span className="flex items-center gap-1">
                            <ListOrdered className="w-3 h-3 text-violet-400" />
                            <span>Agenda Topics</span>
                          </span>
                          <span className="font-mono text-neutral-500">
                            {completedTopics}/{totalTopics} done
                          </span>
                        </div>
                        <div className="space-y-1">
                          {meeting.topics.slice(0, 2).map((topic) => (
                            <div
                              key={topic.id}
                              className="flex items-center gap-2 p-1.5 rounded bg-[#1c1c1c] text-xs border border-[#2b2b2b]"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  topic.completed ? 'bg-emerald-400' : 'bg-violet-400'
                                }`}
                              />
                              <span
                                className={`truncate flex-1 ${
                                  topic.completed ? 'line-through text-neutral-500' : 'text-neutral-200'
                                }`}
                              >
                                {topic.title}
                              </span>
                              {topic.durationMinutes && (
                                <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                                  {topic.durationMinutes}m
                                </span>
                              )}
                            </div>
                          ))}
                          {meeting.topics.length > 2 && (
                            <p className="text-[10px] text-neutral-500 italic pl-1">
                              +{meeting.topics.length - 2} more topic{meeting.topics.length - 2 > 1 ? 's' : ''}...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Members, Attachments & Action button */}
                  <div className="pt-3 border-t border-[#262626] flex items-center justify-between gap-2 mt-2">
                    {/* Attendees Avatar Stack */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {membersList.slice(0, 4).map((member) => (
                          <div
                            key={member.userId}
                            className="ring-1 ring-[#333333] rounded-full shrink-0"
                            title={`${member.userName} (${member.role})`}
                          >
                            {member.userAvatar ? (
                              <img
                                src={member.userAvatar}
                                alt={member.userName}
                                className="w-6 h-6 rounded-full object-cover border border-[#141414]"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-violet-950 border border-[#141414] flex items-center justify-center text-[9px] font-bold text-violet-300">
                                {member.userName.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {membersList.length > 4 && (
                        <span className="text-[10px] text-neutral-500 font-bold">
                          +{membersList.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Right Badges: Files Attachment, Logs & Open button */}
                    <div className="flex items-center gap-2">
                      {meeting.attachments && meeting.attachments.length > 0 && (
                        <span
                          className="flex items-center gap-1 text-[11px] font-mono text-neutral-400 bg-[#202020] px-2 py-0.5 rounded border border-[#333333]"
                          title={`${meeting.attachments.length} attached document(s)`}
                        >
                          <Paperclip className="w-3 h-3 text-violet-400" />
                          <span>{meeting.attachments.length}</span>
                        </span>
                      )}

                      {meeting.logs && meeting.logs.length > 0 && (
                        <span
                          className="flex items-center gap-1 text-[11px] font-mono text-neutral-400 bg-[#202020] px-2 py-0.5 rounded border border-[#333333]"
                          title={`${meeting.logs.length} activity & decision log(s)`}
                        >
                          <Activity className="w-3 h-3 text-emerald-400" />
                          <span>{meeting.logs.length}</span>
                        </span>
                      )}

                      <div className="flex items-center gap-1 text-xs font-semibold text-violet-400 group-hover:text-violet-300">
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-violet-950/60 border border-violet-800/60 text-violet-400 flex items-center justify-center mx-auto">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">No meetings found</h3>
              <p className="text-xs text-neutral-400">
                {searchQuery || statusFilter !== 'all' || timeFilter !== 'all'
                  ? 'No meetings match your selected filters. Try clearing your search or filter tags.'
                  : 'Collaborate efficiently by scheduling team syncs with agenda topics, notes, and file attachments.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateMeetingModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-violet-950/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule First Meeting</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
