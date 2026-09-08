import React, { useState, useEffect } from 'react';
import {
  X,
  Eye,
  Download,
  BellRing,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  Paperclip,
  Trash2,
  FileText,
  CheckSquare,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  Lock
} from 'lucide-react';
import { Form, FormResponse, FormField, FormAttachedFile, User } from '../../types';
import { UserAvatar } from '../UserAvatar';
import { FileViewerModal, FileViewerItem } from '../FileViewerModal';

interface FormResponsesModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form | null;
  users: User[];
  responses: FormResponse[];
  isLoading: boolean;
  isAdmin?: boolean;
  onDeleteResponse: (responseId: string) => Promise<void>;
  onRemindPendingUsers: (formId: string) => Promise<void>;
}

export const FormResponsesModal: React.FC<FormResponsesModalProps> = ({
  isOpen,
  onClose,
  form,
  users,
  responses,
  isLoading,
  isAdmin = true,
  onDeleteResponse,
  onRemindPendingUsers
}) => {
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReminding, setIsReminding] = useState(false);
  const [remindStatus, setRemindStatus] = useState<string | null>(null);
  const [activeViewerFile, setActiveViewerFile] = useState<FileViewerItem | null>(null);

  useEffect(() => {
    if (isOpen && responses.length > 0) {
      setSelectedResponse(responses[0]);
    } else {
      setSelectedResponse(null);
    }
    setRemindStatus(null);
  }, [isOpen, responses]);

  if (!isOpen || !form) return null;

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-100">
            Administrator Access Only
          </h3>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
            Form results and user answers are restricted. Only workspace administrators are authorized to view questionnaire responses.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-xs font-medium text-zinc-200 border border-zinc-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Compute stats
  const totalAssignedUsers = form.targetAudience === 'all'
    ? users.length
    : form.assignedUserIds.length;

  const respondedUserIds = new Set(responses.map((r) => r.userId));
  const pendingCount = Math.max(0, totalAssignedUsers - respondedUserIds.size);
  const completionPercentage = totalAssignedUsers > 0
    ? Math.min(100, Math.round((respondedUserIds.size / totalAssignedUsers) * 100))
    : 0;

  const filteredResponses = responses.filter((r) =>
    r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.userEmail && r.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.userRole && r.userRole.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRemindClick = async () => {
    setIsReminding(true);
    setRemindStatus(null);
    try {
      await onRemindPendingUsers(form.id);
      setRemindStatus(`Reminders sent successfully!`);
      setTimeout(() => setRemindStatus(null), 4000);
    } catch (err: any) {
      setRemindStatus(`Failed to send reminders: ${err.message}`);
    } finally {
      setIsReminding(false);
    }
  };

  const exportToCsv = () => {
    if (responses.length === 0) return;

    const headers = ['Respondent Name', 'Role', 'Email', 'Submitted At', ...form.fields.map((f) => `"${f.label.replace(/"/g, '""')}"`)];
    const rows = responses.map((r) => {
      const fieldCols = form.fields.map((f) => {
        const val = r.answers[f.id];
        if (val === undefined || val === null) return '""';
        if (val && typeof val === 'object' && 'name' in (val as object)) return `"${String((val as any).name).replace(/"/g, '""')}"`;
        if (Array.isArray(val)) return `"${val.join('; ').replace(/"/g, '""')}"`;
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      return [
        `"${r.userName.replace(/"/g, '""')}"`,
        `"${(r.userRole || '').replace(/"/g, '""')}"`,
        `"${(r.userEmail || '').replace(/"/g, '""')}"`,
        `"${r.submittedAt}"`,
        ...fieldCols
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${form.title.toLowerCase().replace(/\s+/g, '-')}-responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const previewAttachment = (attached: FormAttachedFile, resp: FormResponse) => {
    setActiveViewerFile({
      id: `file-${Date.now()}`,
      name: attached.name,
      size: attached.size,
      type: attached.type,
      dataBase64: attached.base64Data,
      url: attached.url,
      uploadedByName: resp.userName,
      uploadedByAvatar: resp.userAvatar,
      uploadedAt: resp.submittedAt
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 sm:p-5 backdrop-blur-md">
        <div
          id="form-responses-modal"
          className="relative flex h-[90vh] max-h-[850px] w-full max-w-5xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden"
        >
          {/* Top Modal Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                  {form.category || 'General'}
                </span>
                <span className="rounded bg-indigo-950/40 border border-indigo-500/30 px-2 py-0.5 text-xs text-indigo-300 font-medium">
                  {responses.length} Submission{responses.length === 1 ? '' : 's'}
                </span>
                <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-xs text-amber-300 font-medium">
                  Admin Access
                </span>
              </div>
              <h2 className="mt-1 text-lg font-bold text-white">
                {form.title} — Responses Explorer
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportToCsv}
                disabled={responses.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5 text-zinc-400" />
                Export CSV
              </button>

              <button
                onClick={onClose}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Metrics & Remind Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 bg-zinc-900/20 px-6 py-3">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>
                  <strong className="text-white">{responses.length}</strong> submitted
                </span>
              </div>

              <span className="text-zinc-700">•</span>

              <div className="flex items-center gap-1.5 text-zinc-300">
                <Users className="h-4 w-4 text-indigo-400" />
                <span>
                  <strong className="text-white">{totalAssignedUsers}</strong> total target
                </span>
              </div>

              <span className="text-zinc-700">•</span>

              <div className="flex items-center gap-2 text-zinc-300">
                <span>Completion:</span>
                <div className="h-2 w-20 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="font-semibold text-emerald-400">{completionPercentage}%</span>
              </div>
            </div>

            {/* Remind Pending Users Action */}
            <div className="flex items-center gap-2">
              {remindStatus && (
                <span className="text-xs text-emerald-400 animate-fade-in">
                  {remindStatus}
                </span>
              )}
              {pendingCount > 0 && (
                <button
                  type="button"
                  id="remind-pending-users-btn"
                  disabled={isReminding}
                  onClick={handleRemindClick}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-600/30 bg-amber-950/40 px-3 py-1 text-xs font-medium text-amber-300 hover:bg-amber-900/50 disabled:opacity-50 transition-colors"
                >
                  <BellRing className="h-3.5 w-3.5 text-amber-400" />
                  {isReminding ? 'Sending...' : `Remind ${pendingCount} Pending User${pendingCount === 1 ? '' : 's'}`}
                </button>
              )}
            </div>
          </div>

          {/* Body: Two columns (List of respondents on Left, Detailed Submission on Right) */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Column: Responses List */}
            <div className="w-full md:w-5/12 flex flex-col border-r border-zinc-800/80 bg-zinc-950">
              {/* Search Bar */}
              <div className="p-3 border-b border-zinc-800/80">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter submissions by respondent..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isLoading ? (
                  <div className="py-10 text-center text-xs text-zinc-500">
                    Loading responses...
                  </div>
                ) : filteredResponses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
                    <FileText className="h-8 w-8 stroke-1 text-zinc-600 mb-2" />
                    <p className="text-xs font-medium text-zinc-400">No submissions found</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Assigned team members have not submitted responses yet.
                    </p>
                  </div>
                ) : (
                  filteredResponses.map((resp) => {
                    const isSelected = selectedResponse?.id === resp.id;
                    const dateFormatted = new Date(resp.submittedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    // Check if response contains an attached file
                    const hasFile = Object.values(resp.answers || {}).some(
                      (val) => Boolean(val && typeof val === 'object' && !Array.isArray(val) && 'name' in (val as object))
                    );

                    return (
                      <div
                        key={resp.id}
                        id={`resp-row-${resp.id}`}
                        onClick={() => setSelectedResponse(resp)}
                        className={`flex items-center justify-between rounded-xl p-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'border border-indigo-500/80 bg-indigo-950/20 shadow-sm'
                            : 'border border-zinc-900 bg-zinc-900/30 hover:border-zinc-800 hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar
                            user={{
                              id: resp.userId,
                              name: resp.userName,
                              avatar: resp.userAvatar || '',
                              email: resp.userEmail || '',
                              role: resp.userRole || 'developer'
                            }}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-zinc-200 truncate">
                                {resp.userName}
                              </span>
                              {hasFile && (
                                <Paperclip className="h-3 w-3 text-purple-400 shrink-0" title="Has file attachment" />
                              )}
                            </div>
                            <span className="block text-[10px] text-zinc-400">
                              {dateFormatted}
                            </span>
                          </div>
                        </div>

                        <ChevronRight className={`h-4 w-4 ${isSelected ? 'text-indigo-400' : 'text-zinc-600'}`} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Selected Response Inspection */}
            <div className="hidden md:flex md:w-7/12 flex-col overflow-y-auto bg-zinc-900/10 p-6">
              {selectedResponse ? (
                <div className="space-y-6">
                  {/* Respondent card header */}
                  <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        user={{
                          id: selectedResponse.userId,
                          name: selectedResponse.userName,
                          avatar: selectedResponse.userAvatar || '',
                          email: selectedResponse.userEmail || '',
                          role: selectedResponse.userRole || 'developer'
                        }}
                        size="md"
                      />
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          {selectedResponse.userName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span>{selectedResponse.userRole}</span>
                          {selectedResponse.userEmail && (
                            <>
                              <span>•</span>
                              <span>{selectedResponse.userEmail}</span>
                            </>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-400">
                          Submitted on {new Date(selectedResponse.submittedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete response submitted by ${selectedResponse.userName}?`)) {
                          onDeleteResponse(selectedResponse.id);
                        }
                      }}
                      className="rounded-lg p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Delete submission"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Answers Display */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Completed Answers
                    </h4>

                    {form.fields.map((field, idx) => {
                      const answerVal = selectedResponse.answers?.[field.id];
                      const isUnanswered =
                        answerVal === undefined ||
                        answerVal === null ||
                        answerVal === '' ||
                        (Array.isArray(answerVal) && answerVal.length === 0);

                      return (
                        <div
                          key={field.id}
                          className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-300">
                              {idx + 1}. {field.label}
                            </span>
                            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                              {field.type}
                            </span>
                          </div>

                          {isUnanswered ? (
                            <p className="text-xs italic text-zinc-600">No response provided</p>
                          ) : field.type === 'file' && Boolean(answerVal && typeof answerVal === 'object' && 'name' in (answerVal as object)) ? (
                            <div className="flex items-center justify-between rounded-lg border border-zinc-700/80 bg-zinc-900 p-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-500/20">
                                  <Paperclip className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-zinc-200 truncate">
                                    {(answerVal as FormAttachedFile).name}
                                  </p>
                                  <p className="text-[10px] text-zinc-400">
                                    {((answerVal as FormAttachedFile).size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => previewAttachment(answerVal as FormAttachedFile, selectedResponse)}
                                className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                              >
                                <Eye className="h-3 w-3" />
                                View File
                              </button>
                            </div>
                          ) : (field.type === 'checkbox' || Array.isArray(answerVal)) ? (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {Array.isArray(answerVal) ? (
                                answerVal.map((item: any, i: number) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 rounded-md border border-teal-500/20 bg-teal-950/30 px-2 py-0.5 text-xs font-medium text-teal-300"
                                  >
                                    <CheckSquare className="h-3 w-3 shrink-0" />
                                    <span>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
                                  </span>
                                ))
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md border border-teal-500/20 bg-teal-950/30 px-2 py-0.5 text-xs font-medium text-teal-300">
                                  <CheckSquare className="h-3 w-3 shrink-0" />
                                  <span>{String(answerVal)}</span>
                                </span>
                              )}
                            </div>
                          ) : field.type === 'radio' ? (
                            <span className="inline-block rounded-md border border-indigo-500/20 bg-indigo-950/30 px-2.5 py-1 text-xs font-medium text-indigo-300">
                              {typeof answerVal === 'object' ? JSON.stringify(answerVal) : String(answerVal)}
                            </span>
                          ) : (
                            <p className="text-xs leading-relaxed text-zinc-100 whitespace-pre-wrap">
                              {typeof answerVal === 'object' ? JSON.stringify(answerVal) : String(answerVal)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-zinc-500">
                  <FileText className="h-10 w-10 stroke-1 text-zinc-600 mb-2" />
                  <p className="text-xs">Select any submission on the left to inspect detailed responses.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* In-app File Viewer Modal */}
      <FileViewerModal
        isOpen={Boolean(activeViewerFile)}
        onClose={() => setActiveViewerFile(null)}
        file={activeViewerFile}
      />
    </>
  );
};
