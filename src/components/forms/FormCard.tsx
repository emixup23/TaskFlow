import React from 'react';
import {
  FileText,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Send,
  Eye,
  Edit3,
  Trash2,
  BellRing,
  Paperclip,
  CheckSquare
} from 'lucide-react';
import { Form, User } from '../../types';
import { UserAvatar } from '../UserAvatar';

interface FormCardProps {
  form: Form;
  users: User[];
  currentUserId?: string;
  isAdmin: boolean;
  onAnswer: (form: Form) => void;
  onViewResponses: (form: Form) => void;
  onEdit: (form: Form) => void;
  onDelete: (form: Form) => void;
  onRemind: (form: Form) => void;
}

export const FormCard: React.FC<FormCardProps> = ({
  form,
  users,
  currentUserId,
  isAdmin,
  onAnswer,
  onViewResponses,
  onEdit,
  onDelete,
  onRemind
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCreator = form.createdBy === currentUserId;
  const canManage = isAdmin || isCreator;
  const isAssigned =
    form.targetAudience === 'all' ||
    (currentUserId && form.assignedUserIds.includes(currentUserId));

  // Find assigned users
  const assignedUsers = form.targetAudience === 'all'
    ? users
    : users.filter((u) => form.assignedUserIds.includes(u.id));

  // Status badge config
  const statusConfig = {
    published: {
      label: 'Published',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    draft: {
      label: 'Draft',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    },
    closed: {
      label: 'Closed',
      bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
    }
  }[form.status] || {
    label: form.status,
    bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
  };

  const isPastDue = form.dueDate ? new Date(form.dueDate).getTime() < Date.now() : false;

  return (
    <div
      id={`form-card-${form.id}`}
      className="group relative flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/90 hover:shadow-lg hover:shadow-black/30"
    >
      <div>
        {/* Top Header: Category, Status & Menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-zinc-800 bg-zinc-800/50 px-2 py-0.5 text-xs font-medium text-zinc-300">
              {form.category || 'General'}
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-medium ${statusConfig.bg}`}
            >
              {statusConfig.label}
            </span>
            {form.hasUserSubmitted && (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 text-xs font-medium text-emerald-300">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                Completed
              </span>
            )}
            {isAssigned && !form.hasUserSubmitted && form.status === 'published' && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-950/40 px-2 py-0.5 text-xs font-medium text-amber-300">
                <AlertCircle className="h-3 w-3 text-amber-400" />
                Action Required
              </span>
            )}
          </div>

          {/* Action dropdown menu */}
          <div className="relative" ref={menuRef}>
            <button
              id={`form-menu-btn-${form.id}`}
              onClick={() => setShowMenu((prev) => !prev)}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              title="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-xl shadow-black/60 backdrop-blur-md">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onAnswer(form);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
                >
                  <Send className="h-3.5 w-3.5 text-indigo-400" />
                  {form.hasUserSubmitted ? 'Edit Response' : 'Answer Form'}
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onViewResponses(form);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
                  >
                    <Eye className="h-3.5 w-3.5 text-emerald-400" />
                    View Results & Answers ({form.responsesCount || 0})
                  </button>
                )}

                {canManage && form.status === 'published' && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onRemind(form);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
                  >
                    <BellRing className="h-3.5 w-3.5 text-amber-400" />
                    Remind Pending Users
                  </button>
                )}

                {canManage && (
                  <>
                    <div className="my-1 border-t border-zinc-800" />
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(form);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-blue-400" />
                      Edit Form & Fields
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(form);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-rose-400 transition-colors hover:bg-rose-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                      Delete Form
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title and description */}
        <div className="mt-3">
          <h3 className="line-clamp-1 text-base font-semibold text-zinc-100 group-hover:text-white">
            {form.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400">
            {form.description || 'No description provided.'}
          </p>
        </div>

        {/* Form Fields Summary Pill List */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1 rounded bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
            <CheckSquare className="h-3 w-3 text-indigo-400" />
            {form.fields.length} {form.fields.length === 1 ? 'field' : 'fields'}
          </span>

          {form.dueDate && (
            <span
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium ${
                isPastDue
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                  : 'bg-zinc-800/80 text-zinc-300'
              }`}
            >
              <Calendar className="h-3 w-3 text-zinc-400" />
              Due {form.dueDate}
            </span>
          )}

          {form.allowMultipleSubmissions && (
            <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
              Multiple entries
            </span>
          )}
        </div>

        {/* Assigned Users Stack */}
        <div className="mt-4 border-t border-zinc-800/60 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Users className="h-3.5 w-3.5 text-zinc-500" />
              <span>
                {form.targetAudience === 'all'
                  ? 'All Team Members'
                  : `${assignedUsers.length} assigned user${assignedUsers.length === 1 ? '' : 's'}`}
              </span>
            </span>

            {/* Avatar Stack */}
            <div className="flex -space-x-1.5 overflow-hidden">
              {assignedUsers.slice(0, 4).map((u) => (
                <div key={u.id} title={u.name} className="ring-2 ring-zinc-900 rounded-full">
                  <UserAvatar user={u} size="xs" />
                </div>
              ))}
              {assignedUsers.length > 4 && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300 ring-2 ring-zinc-900">
                  +{assignedUsers.length - 4}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Submissions Stat & Primary Buttons */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-800/60 pt-3">
        {isAdmin ? (
          <button
            id={`view-responses-${form.id}`}
            onClick={() => onViewResponses(form)}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-indigo-300"
            title="View Form Results & Answers (Admin only)"
          >
            <Eye className="h-3.5 w-3.5 text-indigo-400" />
            <span>
              {form.responsesCount || 0} response{form.responsesCount === 1 ? '' : 's'}
            </span>
            <span className="rounded bg-indigo-950/60 border border-indigo-500/30 px-1 py-0.2 text-[9px] font-semibold text-indigo-300">
              Admin
            </span>
          </button>
        ) : (
          <div
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-500"
            title="Form results & answers are restricted to administrators"
          >
            <CheckSquare className="h-3.5 w-3.5 text-zinc-600" />
            <span>
              {form.responsesCount || 0} response{form.responsesCount === 1 ? '' : 's'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {form.status === 'published' ? (
            <button
              id={`answer-form-${form.id}`}
              onClick={() => onAnswer(form)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-indigo-500 active:scale-95"
            >
              <Send className="h-3 w-3" />
              {form.hasUserSubmitted ? 'Edit Answers' : 'Answer'}
            </button>
          ) : (
            <button
              onClick={() => onEdit(form)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-all hover:bg-zinc-700 active:scale-95"
            >
              <Edit3 className="h-3 w-3 text-zinc-400" />
              Edit Draft
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
