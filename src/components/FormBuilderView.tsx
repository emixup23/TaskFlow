import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  RefreshCw,
  BellRing,
  Inbox,
  X
} from 'lucide-react';
import { Form, FormResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { FormCard } from './forms/FormCard';
import { FormEditorModal } from './forms/FormEditorModal';
import { FormAnswerModal } from './forms/FormAnswerModal';
import { FormResponsesModal } from './forms/FormResponsesModal';
import { ErrorBoundary } from './common/ErrorBoundary';

type FilterTab = 'all' | 'assigned' | 'created' | 'pending';

export const FormBuilderView: React.FC = () => {
  const { currentUser, users, isAdmin } = useAuth();

  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [formToEdit, setFormToEdit] = useState<Form | null>(null);

  const [isAnswerOpen, setIsAnswerOpen] = useState(false);
  const [formToAnswer, setFormToAnswer] = useState<Form | null>(null);
  const [existingUserResponse, setExistingUserResponse] = useState<FormResponse | null>(null);

  const [isResponsesOpen, setIsResponsesOpen] = useState(false);
  const [formForResponses, setFormForResponses] = useState<Form | null>(null);
  const [activeResponses, setActiveResponses] = useState<FormResponse[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);

  // Toast feedback state
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showBanner = (text: string, type: 'success' | 'error' = 'success') => {
    setBannerMessage({ text, type });
    setTimeout(() => setBannerMessage(null), 4000);
  };

  const fetchForms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getForms();
      setForms(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load forms.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [currentUser?.id]);

  // Distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    forms.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set);
  }, [forms]);

  // Filtered forms list
  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      // Tab filter
      const isAssigned =
        f.targetAudience === 'all' ||
        (currentUser && f.assignedUserIds.includes(currentUser.id));
      const isCreator = currentUser && f.createdBy === currentUser.id;

      if (activeTab === 'assigned' && !isAssigned) return false;
      if (activeTab === 'created' && !isCreator) return false;
      if (activeTab === 'pending') {
        if (!isAssigned || f.hasUserSubmitted || f.status !== 'published') return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && f.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && f.status !== selectedStatus) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = f.title.toLowerCase().includes(query);
        const matchDesc = f.description?.toLowerCase().includes(query);
        const matchCat = f.category?.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      return true;
    });
  }, [forms, activeTab, selectedCategory, selectedStatus, searchQuery, currentUser]);

  // Metric stats
  const stats = useMemo(() => {
    const totalPublished = forms.filter((f) => f.status === 'published').length;
    const assignedToMe = forms.filter(
      (f) =>
        f.status === 'published' &&
        (f.targetAudience === 'all' || (currentUser && f.assignedUserIds.includes(currentUser.id)))
    ).length;
    const completedByMe = forms.filter((f) => f.hasUserSubmitted).length;
    const pendingForMe = forms.filter(
      (f) =>
        f.status === 'published' &&
        !f.hasUserSubmitted &&
        (f.targetAudience === 'all' || (currentUser && f.assignedUserIds.includes(currentUser.id)))
    ).length;

    return { totalPublished, assignedToMe, completedByMe, pendingForMe };
  }, [forms, currentUser]);

  // Actions
  const handleOpenCreate = () => {
    setFormToEdit(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (form: Form) => {
    setFormToEdit(form);
    setIsEditorOpen(true);
  };

  const handleSaveForm = async (formData: Partial<Form>) => {
    if (formToEdit) {
      const updated = await api.updateForm(formToEdit.id, formData);
      setForms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      showBanner(`Form "${updated.title}" updated successfully.`);
    } else {
      const created = await api.createForm(formData);
      setForms((prev) => [created, ...prev]);
      showBanner(`Form "${created.title}" created successfully.`);
    }
  };

  const handleDeleteForm = async (form: Form) => {
    if (!confirm(`Are you sure you want to delete form "${form.title}" and all its submissions?`)) {
      return;
    }
    try {
      await api.deleteForm(form.id);
      setForms((prev) => prev.filter((f) => f.id !== form.id));
      showBanner(`Form "${form.title}" deleted.`);
    } catch (err: any) {
      showBanner(err.message || 'Failed to delete form.', 'error');
    }
  };

  const handleOpenAnswer = async (form: Form) => {
    setFormToAnswer(form);
    setExistingUserResponse(null);
    setIsAnswerOpen(true);

    // Fetch user's own existing response if previously submitted
    try {
      if (isAdmin) {
        // Admins can check either endpoint
        try {
          const myResp = await api.getMyFormResponse(form.id);
          if (myResp) {
            setExistingUserResponse(myResp);
            return;
          }
        } catch {
          const resps = await api.getFormResponses(form.id);
          const myResp = resps.find((r) => r.userId === currentUser?.id);
          if (myResp) setExistingUserResponse(myResp);
        }
      } else {
        // Non-admin users fetch strictly their own submission via private endpoint
        const myResp = await api.getMyFormResponse(form.id);
        if (myResp) {
          setExistingUserResponse(myResp);
        }
      }
    } catch {
      // User has not submitted yet or first-time answering
    }
  };

  const handleSubmitResponse = async (answers: Record<string, any>) => {
    if (!formToAnswer) return;
    await api.submitFormResponse(formToAnswer.id, answers);
    showBanner(`Response for "${formToAnswer.title}" submitted successfully.`);
    fetchForms();
  };

  const handleOpenResponses = async (form: Form) => {
    if (!isAdmin) {
      showBanner('Only administrators are authorized to view form results and answers.', 'error');
      return;
    }
    setFormForResponses(form);
    setIsResponsesOpen(true);
    setIsLoadingResponses(true);
    try {
      const data = await api.getFormResponses(form.id);
      setActiveResponses(data);
    } catch (err: any) {
      showBanner(err.message || 'Failed to load responses.', 'error');
    } finally {
      setIsLoadingResponses(false);
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (!formForResponses) return;
    if (!isAdmin) {
      showBanner('Only administrators can delete submissions.', 'error');
      return;
    }
    try {
      await api.deleteFormResponse(formForResponses.id, responseId);
      setActiveResponses((prev) => prev.filter((r) => r.id !== responseId));
      fetchForms();
      showBanner('Submission deleted.');
    } catch (err: any) {
      showBanner(err.message || 'Failed to delete submission.', 'error');
    }
  };

  const handleRemindPendingUsers = async (formId: string) => {
    const result = await api.remindFormPendingUsers(formId);
    showBanner(`Sent reminders to ${result.remindedCount} pending team member(s).`);
  };

  return (
    <div id="forms-view" className="flex flex-1 flex-col h-full overflow-y-auto bg-[#0d0d0d] text-zinc-100">
      {/* View Header */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/40 px-3 sm:px-6 py-3 sm:py-6 backdrop-blur-md">
        <div className="mx-auto max-w-7xl flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400">
                Data Collection & Questionnaires
              </span>
            </div>
            <h1 className="mt-1 sm:mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Form Builder
            </h1>
            <p className="mt-1 text-xs text-zinc-400 hidden sm:block">
              Build custom questionnaires with diverse field types, assign respondents, and track submissions.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Search Toggle */}
            <button
              type="button"
              id="btn-toggle-mobile-search"
              onClick={() => setShowMobileSearch((prev) => !prev)}
              className={`md:hidden flex items-center justify-center w-8 h-8 rounded-lg border transition-colors cursor-pointer relative ${
                showMobileSearch || searchQuery
                  ? 'bg-indigo-950/70 border-indigo-500/60 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Search forms"
              aria-label="Toggle search"
            >
              {showMobileSearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              {!showMobileSearch && searchQuery && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </button>

            {/* Mobile Status & Filter Toggle */}
            <button
              type="button"
              id="btn-toggle-mobile-filters"
              onClick={() => setShowMobileFilters((prev) => !prev)}
              className={`md:hidden flex items-center justify-center w-8 h-8 rounded-lg border transition-colors cursor-pointer relative ${
                showMobileFilters || activeTab !== 'all' || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? 'bg-indigo-950/70 border-indigo-500/60 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Filter by status and category"
              aria-label="Toggle filters"
            >
              {showMobileFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
              {!showMobileFilters && (activeTab !== 'all' || selectedCategory !== 'all' || selectedStatus !== 'all') && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </button>

            <button
              onClick={fetchForms}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 sm:px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
              title="Refresh forms"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              id="create-form-main-btn"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-indigo-600 px-3 sm:px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Create Form</span>
            </button>
          </div>
        </div>

        {/* Banner toast */}
        {bannerMessage && (
          <div
            className={`mt-3 sm:mt-4 mx-auto max-w-7xl flex items-center gap-2 rounded-lg p-3 text-xs font-medium border ${
              bannerMessage.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
                : 'border-rose-500/30 bg-rose-950/40 text-rose-300'
            }`}
          >
            {bannerMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
        )}

        {/* Top Metric Cards - Hidden on Mobile */}
        <div className="mx-auto max-w-7xl mt-4 sm:mt-6 hidden sm:grid sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
            <span className="block text-[11px] font-medium text-zinc-400">Total Active Forms</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{stats.totalPublished}</span>
              <span className="text-[10px] text-zinc-400">forms published</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
            <span className="block text-[11px] font-medium text-zinc-400">Assigned To You</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-400">{stats.assignedToMe}</span>
              {stats.pendingForMe > 0 && (
                <span className="rounded bg-amber-950/50 border border-amber-800/40 px-1.5 py-0.2 text-[10px] font-medium text-amber-300">
                  {stats.pendingForMe} pending
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
            <span className="block text-[11px] font-medium text-zinc-400">You Completed</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400">{stats.completedByMe}</span>
              <span className="text-[10px] text-zinc-400">submitted</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
            <span className="block text-[11px] font-medium text-zinc-400">Your Action Items</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold ${
                  stats.pendingForMe > 0 ? 'text-amber-400' : 'text-zinc-400'
                }`}
              >
                {stats.pendingForMe}
              </span>
              <span className="text-[10px] text-zinc-400">require answers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar - Hidden by default on Mobile, revealed behind icons */}
      <div className={`${showMobileSearch || showMobileFilters ? 'block' : 'hidden'} md:block border-b border-zinc-800/60 bg-zinc-950/20 px-3 sm:px-6 py-2.5 sm:py-3`}>
        <div className="mx-auto max-w-7xl flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Filter Tabs - On mobile only visible if showMobileFilters is true */}
          <div className={`${showMobileFilters ? 'flex' : 'hidden'} md:flex flex-wrap items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1 text-xs`}>
            <button
              onClick={() => setActiveTab('all')}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Forms ({forms.length})
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                activeTab === 'assigned'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Assigned To Me
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'bg-zinc-800 text-amber-300 shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Pending Action</span>
              {stats.pendingForMe > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">
                  {stats.pendingForMe}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('created')}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                activeTab === 'created'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Created By Me
            </button>
          </div>

          {/* Search and Secondary Dropdowns */}
          <div className="flex flex-col sm:flex-row md:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search - On mobile only visible if showMobileSearch is true */}
            <div className={`${showMobileSearch ? 'relative flex-1' : 'hidden'} md:relative md:flex-1 md:min-w-[200px]`}>
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search forms by keyword..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 py-1.5 pl-8 pr-8 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category & Status Dropdowns - On mobile only visible if showMobileFilters is true */}
            <div className={`${showMobileFilters ? 'flex' : 'hidden'} md:flex items-center gap-2 w-full md:w-auto`}>
              {/* Category */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 md:flex-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex-1 md:flex-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
                <option value="closed">Closed</option>
              </select>

              {(activeTab !== 'all' || selectedCategory !== 'all' || selectedStatus !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('all');
                    setSelectedCategory('all');
                    setSelectedStatus('all');
                  }}
                  className="px-2 py-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 rounded border border-zinc-800 bg-zinc-900 shrink-0"
                  title="Reset all filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="mx-auto max-w-7xl w-full flex-1 p-3 sm:p-6">
        {isLoading && forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
            <p className="text-xs text-zinc-400">Loading form questionnaires...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-10 w-10 text-rose-400 mb-2" />
            <h3 className="text-sm font-semibold text-white">Failed to load forms</h3>
            <p className="mt-1 text-xs text-zinc-400">{error}</p>
            <button
              onClick={fetchForms}
              className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800/80 bg-zinc-900/20 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-400 mb-3">
              <Inbox className="h-7 w-7 stroke-1" />
            </div>
            <h3 className="text-base font-semibold text-zinc-200">No forms found</h3>
            <p className="mt-1 max-w-sm text-xs text-zinc-400">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'No questionnaires match your applied filters. Try clearing or expanding your search.'
                : 'Get started by creating your first custom form questionnaire with rich field types.'}
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-5 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              Create First Form
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredForms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
                users={users}
                currentUserId={currentUser?.id}
                isAdmin={Boolean(isAdmin)}
                onAnswer={handleOpenAnswer}
                onViewResponses={handleOpenResponses}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteForm}
                onRemind={handleRemindPendingUsers}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals with Error Boundaries to catch any runtime rendering issues */}
      <ErrorBoundary fallbackTitle="Form Editor Encountered an Issue" onReset={() => setIsEditorOpen(false)}>
        <FormEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          formToEdit={formToEdit}
          users={users}
          onSave={handleSaveForm}
        />
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Form Answering Encountered an Issue" onReset={() => setIsAnswerOpen(false)}>
        <FormAnswerModal
          isOpen={isAnswerOpen}
          onClose={() => setIsAnswerOpen(false)}
          form={formToAnswer}
          existingResponse={existingUserResponse}
          currentUser={currentUser}
          onSubmit={handleSubmitResponse}
        />
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Responses Display Encountered an Issue" onReset={() => setIsResponsesOpen(false)}>
        <FormResponsesModal
          isOpen={isResponsesOpen}
          onClose={() => setIsResponsesOpen(false)}
          form={formForResponses}
          users={users}
          responses={activeResponses}
          isLoading={isLoadingResponses}
          isAdmin={Boolean(isAdmin)}
          onDeleteResponse={handleDeleteResponse}
          onRemindPendingUsers={handleRemindPendingUsers}
        />
      </ErrorBoundary>
    </div>
  );
};
