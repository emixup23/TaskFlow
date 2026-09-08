import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  FileText,
  AlignLeft,
  Hash,
  Calendar,
  Clock,
  UploadCloud,
  CheckCircle2,
  CheckSquare,
  ListFilter,
  Users,
  Search,
  Check,
  AlertCircle,
  Eye,
  Sliders,
  Send,
  Save
} from 'lucide-react';
import { Form, FormField, FormFieldType, User } from '../../types';
import { UserAvatar } from '../UserAvatar';

interface FormEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  formToEdit: Form | null;
  users: User[];
  onSave: (formData: Partial<Form>) => Promise<void>;
}

const FIELD_TYPE_CONFIG: Record<
  FormFieldType,
  { label: string; icon: React.ReactNode; description: string; defaultPlaceholder?: string }
> = {
  text: {
    label: 'Text input',
    icon: <FileText className="h-4 w-4 text-blue-400" />,
    description: 'Single-line short text answer',
    defaultPlaceholder: 'Enter your response...'
  },
  textarea: {
    label: 'Text area',
    icon: <AlignLeft className="h-4 w-4 text-indigo-400" />,
    description: 'Multi-line detailed paragraph',
    defaultPlaceholder: 'Type in full details or feedback...'
  },
  number: {
    label: 'Number',
    icon: <Hash className="h-4 w-4 text-amber-400" />,
    description: 'Numeric quantity, score, or measurement',
    defaultPlaceholder: '0'
  },
  date: {
    label: 'Date',
    icon: <Calendar className="h-4 w-4 text-emerald-400" />,
    description: 'Calendar date picker'
  },
  time: {
    label: 'Time',
    icon: <Clock className="h-4 w-4 text-cyan-400" />,
    description: 'Time clock selector'
  },
  file: {
    label: 'Upload file',
    icon: <UploadCloud className="h-4 w-4 text-purple-400" />,
    description: 'File attachment (PDF, CSV, TXT, images)'
  },
  radio: {
    label: 'Single choice',
    icon: <CheckCircle2 className="h-4 w-4 text-rose-400" />,
    description: 'Radio buttons — choose exactly one'
  },
  checkbox: {
    label: 'Multi choice',
    icon: <CheckSquare className="h-4 w-4 text-teal-400" />,
    description: 'Checkboxes — select multiple options'
  },
  select: {
    label: 'Drop list',
    icon: <ListFilter className="h-4 w-4 text-orange-400" />,
    description: 'Dropdown menu — pick from a list'
  }
};

const DEFAULT_CATEGORIES = ['General', 'Engineering', 'Product & Design', 'QA & Testing', 'IT & Operations', 'HR & Team'];

export const FormEditorModal: React.FC<FormEditorModalProps> = ({
  isOpen,
  onClose,
  formToEdit,
  users,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Form metadata state
  const [title, setTitle] = useState(formToEdit?.title || '');
  const [description, setDescription] = useState(formToEdit?.description || '');
  const [category, setCategory] = useState(formToEdit?.category || 'General');
  const [status, setStatus] = useState<'draft' | 'published'>(formToEdit?.status === 'published' ? 'published' : 'draft');
  const [dueDate, setDueDate] = useState(formToEdit?.dueDate || '');
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(formToEdit?.allowMultipleSubmissions || false);

  // Audience & User assignment state
  const [targetAudience, setTargetAudience] = useState<'all' | 'specific'>(formToEdit?.targetAudience || 'all');
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>(formToEdit?.assignedUserIds || []);
  const [userSearch, setUserSearch] = useState('');

  // Form fields state
  const [fields, setFields] = useState<FormField[]>(
    formToEdit?.fields || [
      {
        id: `field-${Date.now()}-1`,
        type: 'text',
        label: 'Full Name / Title',
        placeholder: 'Enter response...',
        required: true
      },
      {
        id: `field-${Date.now()}-2`,
        type: 'textarea',
        label: 'Detailed Description',
        placeholder: 'Provide complete details...',
        required: false
      }
    ]
  );

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    formToEdit?.fields?.[0]?.id || null
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset or initialize on open
  React.useEffect(() => {
    if (isOpen) {
      if (formToEdit) {
        setTitle(formToEdit.title);
        setDescription(formToEdit.description || '');
        setCategory(formToEdit.category || 'General');
        setStatus(formToEdit.status === 'published' ? 'published' : 'draft');
        setDueDate(formToEdit.dueDate || '');
        setAllowMultipleSubmissions(formToEdit.allowMultipleSubmissions || false);
        setTargetAudience(formToEdit.targetAudience);
        setAssignedUserIds(formToEdit.assignedUserIds || []);
        setFields(formToEdit.fields || []);
        setSelectedFieldId(formToEdit.fields?.[0]?.id || null);
      } else {
        setTitle('');
        setDescription('');
        setCategory('General');
        setStatus('published');
        setDueDate('');
        setAllowMultipleSubmissions(false);
        setTargetAudience('all');
        setAssignedUserIds([]);
        const initialField: FormField = {
          id: `field-${Date.now()}-1`,
          type: 'text',
          label: 'Primary Response',
          placeholder: 'Enter response here...',
          required: true
        };
        setFields([initialField]);
        setSelectedFieldId(initialField.id);
      }
      setValidationError(null);
      setActiveTab('editor');
    }
  }, [isOpen, formToEdit]);

  if (!isOpen) return null;

  const addField = (type: FormFieldType) => {
    const newFieldId = `field-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const config = FIELD_TYPE_CONFIG[type];

    const newField: FormField = {
      id: newFieldId,
      type,
      label: `New ${config.label}`,
      placeholder: config.defaultPlaceholder,
      required: false,
      options: ['radio', 'checkbox', 'select'].includes(type)
        ? ['Option 1', 'Option 2', 'Option 3']
        : undefined,
      min: type === 'number' ? 0 : undefined,
      max: type === 'number' ? 100 : undefined,
      step: type === 'number' ? 1 : undefined,
      allowedExtensions: type === 'file' ? ['pdf', 'txt', 'csv', 'png', 'jpg'] : undefined,
      maxFileSizeKb: type === 'file' ? 1024 : undefined
    };

    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newFieldId);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const deleteField = (id: string) => {
    if (fields.length <= 1) {
      alert('A form must contain at least one field.');
      return;
    }
    const nextFields = fields.filter((f) => f.id !== id);
    setFields(nextFields);
    if (selectedFieldId === id) {
      setSelectedFieldId(nextFields[0]?.id || null);
    }
  };

  const duplicateField = (id: string) => {
    const target = fields.find((f) => f.id === id);
    if (!target) return;

    const copyId = `field-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newField: FormField = {
      ...target,
      id: copyId,
      label: `${target.label} (Copy)`
    };

    const targetIdx = fields.findIndex((f) => f.id === id);
    const updated = [...fields];
    updated.splice(targetIdx + 1, 0, newField);
    setFields(updated);
    setSelectedFieldId(copyId);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === fields.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setFields(updated);
  };

  const toggleUserAssignment = (userId: string) => {
    setAssignedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    setAssignedUserIds(users.map((u) => u.id));
  };

  const handleClearAllUsers = () => {
    setAssignedUserIds([]);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleSubmit = async (targetStatus?: 'draft' | 'published') => {
    if (!title.trim()) {
      setValidationError('Please provide a form title.');
      return;
    }

    if (fields.length === 0) {
      setValidationError('Please add at least one field to the form.');
      return;
    }

    // Validate fields have labels
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label.trim()) {
        setValidationError(`Field #${i + 1} needs a label.`);
        setSelectedFieldId(fields[i].id);
        return;
      }
    }

    if (targetAudience === 'specific' && assignedUserIds.length === 0) {
      setValidationError('You selected "Specific Members". Please select at least one team member to answer the form.');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        category,
        status: targetStatus || status,
        dueDate: dueDate || undefined,
        allowMultipleSubmissions,
        targetAudience,
        assignedUserIds: targetAudience === 'specific' ? assignedUserIds : [],
        fields
      });
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId) || fields[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 sm:p-5 backdrop-blur-md">
      <div
        id="form-editor-modal"
        className="relative flex h-[90vh] max-h-[850px] w-full max-w-5xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {formToEdit ? 'Edit Form Builder' : 'Create New Form'}
              </h2>
              <p className="text-xs text-zinc-400">
                Design custom questionnaires and assign team members to respond
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch: Editor vs Live Preview */}
            <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 text-xs font-medium">
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
                  activeTab === 'editor'
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                Builder
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Eye className="h-3.5 w-3.5 text-emerald-400" />
                Live Preview
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {validationError && (
          <div className="flex items-center gap-2 border-b border-rose-900/50 bg-rose-950/40 px-6 py-2.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Tab Body */}
        {activeTab === 'editor' ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Left Column: Form Details, Assignment & Field List */}
            <div className="w-full md:w-7/12 flex flex-col border-r border-zinc-800/80 overflow-y-auto p-6 space-y-6">
              {/* Basic Details Section */}
              <div className="space-y-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Form General Information
                </h3>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    Form Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="form-title-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Sprint Retrospective & Feedback"
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    Description & Instructions
                  </label>
                  <textarea
                    id="form-desc-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Provide guidelines for respondents..."
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                    >
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowMultipleSubmissions}
                      onChange={(e) => setAllowMultipleSubmissions(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Allow multiple submissions per respondent</span>
                  </label>
                </div>
              </div>

              {/* Assignment Section: Add users to answer the form */}
              <div className="space-y-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Assign Users To Answer
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Who is expected or allowed to submit responses?
                    </p>
                  </div>
                  <Users className="h-4 w-4 text-indigo-400" />
                </div>

                {/* Audience radio selector */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetAudience('all')}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-medium transition-colors ${
                      targetAudience === 'all'
                        ? 'border-indigo-500 bg-indigo-950/30 text-indigo-300'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    All Team Members
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetAudience('specific')}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-medium transition-colors ${
                      targetAudience === 'specific'
                        ? 'border-indigo-500 bg-indigo-950/30 text-indigo-300'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    Specific Members ({assignedUserIds.length})
                  </button>
                </div>

                {/* If specific, show user selector */}
                {targetAudience === 'specific' && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                        <input
                          type="text"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="Search users by name or role..."
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={handleSelectAllUsers}
                          className="text-indigo-400 hover:underline text-[11px]"
                        >
                          Select All
                        </button>
                        <span className="text-zinc-600">•</span>
                        <button
                          type="button"
                          onClick={handleClearAllUsers}
                          className="text-zinc-400 hover:underline text-[11px]"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="max-h-44 overflow-y-auto space-y-1 rounded-lg border border-zinc-800/80 bg-zinc-900/80 p-2">
                      {filteredUsers.length === 0 ? (
                        <p className="py-2 text-center text-xs text-zinc-500">No users found</p>
                      ) : (
                        filteredUsers.map((u) => {
                          const isAssigned = assignedUserIds.includes(u.id);
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => toggleUserAssignment(u.id)}
                              className={`flex w-full items-center justify-between rounded-md p-1.5 text-left text-xs transition-colors ${
                                isAssigned
                                  ? 'bg-indigo-950/40 text-indigo-200 border border-indigo-500/30'
                                  : 'text-zinc-300 hover:bg-zinc-800'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <UserAvatar user={u} size="xs" />
                                <div>
                                  <span className="font-medium text-zinc-200">{u.name}</span>
                                  <span className="ml-2 text-[10px] text-zinc-400">({u.role})</span>
                                </div>
                              </div>
                              <div
                                className={`flex h-4 w-4 items-center justify-center rounded border ${
                                  isAssigned
                                    ? 'border-indigo-500 bg-indigo-600 text-white'
                                    : 'border-zinc-700 bg-zinc-800'
                                }`}
                              >
                                {isAssigned && <Check className="h-3 w-3" />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Fields Re-orderable List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Form Questions & Fields ({fields.length})
                  </h3>
                  <span className="text-[11px] text-zinc-400">
                    Select a field to configure settings on the right
                  </span>
                </div>

                <div className="space-y-2">
                  {fields.map((field, idx) => {
                    const isSelected = selectedField?.id === field.id;
                    const typeConfig = FIELD_TYPE_CONFIG[field.type] || FIELD_TYPE_CONFIG.text;

                    return (
                      <div
                        key={field.id}
                        onClick={() => setSelectedFieldId(field.id)}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-500/80 bg-indigo-950/20 shadow-sm shadow-indigo-950/50 ring-1 ring-indigo-500/40'
                            : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex flex-col gap-0.5 text-zinc-500">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveField(idx, 'up');
                              }}
                              className="hover:text-zinc-200 disabled:opacity-30"
                              title="Move up"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === fields.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveField(idx, 'down');
                              }}
                              className="hover:text-zinc-200 disabled:opacity-30"
                              title="Move down"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 border border-zinc-700/50">
                            {typeConfig.icon}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-zinc-200 truncate">
                                {field.label || 'Untitled Question'}
                              </span>
                              {field.required && (
                                <span className="rounded bg-rose-950/50 border border-rose-800/30 px-1.5 py-0.2 text-[10px] font-medium text-rose-300">
                                  Required
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400">
                              {typeConfig.label}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateField(field.id);
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
                            title="Duplicate field"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteField(field.id);
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded"
                            title="Delete field"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Add Field Toolbar */}
                <div className="mt-4 pt-4 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-zinc-300">
                      Add Field Type to Form:
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(FIELD_TYPE_CONFIG) as FormFieldType[]).map((typeKey) => {
                      const cfg = FIELD_TYPE_CONFIG[typeKey];
                      return (
                        <button
                          key={typeKey}
                          type="button"
                          id={`add-field-btn-${typeKey}`}
                          onClick={() => addField(typeKey)}
                          className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 text-left text-xs font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white active:scale-95"
                        >
                          <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-800">
                            {cfg.icon}
                          </div>
                          <span className="truncate">{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Selected Field Inspector / Properties Editor */}
            <div className="hidden md:flex md:w-5/12 flex-col overflow-y-auto bg-zinc-900/20 p-6">
              {selectedField ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-800">
                        {(FIELD_TYPE_CONFIG[selectedField.type] || FIELD_TYPE_CONFIG.text).icon}
                      </div>
                      <span className="text-xs font-semibold text-zinc-200">
                        Field Configuration
                      </span>
                    </div>
                    <span className="rounded bg-indigo-950/40 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                      {(FIELD_TYPE_CONFIG[selectedField.type] || FIELD_TYPE_CONFIG.text).label}
                    </span>
                  </div>

                  {/* Change field type */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-300">Field Type</label>
                    <select
                      value={selectedField.type}
                      onChange={(e) => {
                        const newType = e.target.value as FormFieldType;
                        updateField(selectedField.id, {
                          type: newType,
                          options: ['radio', 'checkbox', 'select'].includes(newType)
                            ? selectedField.options || ['Option 1', 'Option 2', 'Option 3']
                            : undefined
                        });
                      }}
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                    >
                      {(Object.keys(FIELD_TYPE_CONFIG) as FormFieldType[]).map((typeKey) => (
                        <option key={typeKey} value={typeKey}>
                          {FIELD_TYPE_CONFIG[typeKey].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Field Label */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-300">
                      Question / Label <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={selectedField.label}
                      onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                      placeholder="e.g. Primary functional domain"
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Placeholder */}
                  {['text', 'textarea', 'number'].includes(selectedField.type) && (
                    <div>
                      <label className="block text-xs font-medium text-zinc-300">Placeholder</label>
                      <input
                        type="text"
                        value={selectedField.placeholder || ''}
                        onChange={(e) =>
                          updateField(selectedField.id, { placeholder: e.target.value })
                        }
                        placeholder="Ghost text displayed before answer..."
                        className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Help text */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-300">Help / Subtitle text</label>
                    <input
                      type="text"
                      value={selectedField.helpText || ''}
                      onChange={(e) =>
                        updateField(selectedField.id, { helpText: e.target.value })
                      }
                      placeholder="e.g. Please be as specific as possible"
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Required Switch */}
                  <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <div>
                      <span className="block text-xs font-medium text-zinc-200">Required Field</span>
                      <span className="block text-[11px] text-zinc-400">
                        Respondent cannot submit without answering
                      </span>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={selectedField.required}
                        onChange={(e) =>
                          updateField(selectedField.id, { required: e.target.checked })
                        }
                        className="peer sr-only"
                      />
                      <div className="h-5 w-9 rounded-full bg-zinc-800 peer-checked:bg-indigo-600 peer-focus:outline-none after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  {/* Type Specific: Options for radio, checkbox, select */}
                  {['radio', 'checkbox', 'select'].includes(selectedField.type) && (
                    <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-300">Choice Options</label>
                        <button
                          type="button"
                          onClick={() => {
                            const curOpts = selectedField.options || [];
                            updateField(selectedField.id, {
                              options: [...curOpts, `Option ${curOpts.length + 1}`]
                            });
                          }}
                          className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300"
                        >
                          <Plus className="h-3 w-3" />
                          Add Choice
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {(selectedField.options || []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <span className="text-[11px] text-zinc-500 w-4">{optIdx + 1}.</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...(selectedField.options || [])];
                                newOpts[optIdx] = e.target.value;
                                updateField(selectedField.id, { options: newOpts });
                              }}
                              className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                            />
                            {(selectedField.options || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newOpts = (selectedField.options || []).filter(
                                    (_, i) => i !== optIdx
                                  );
                                  updateField(selectedField.id, { options: newOpts });
                                }}
                                className="text-zinc-500 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Type Specific: Number Bounds */}
                  {selectedField.type === 'number' && (
                    <div className="grid grid-cols-3 gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                      <div>
                        <label className="block text-[11px] text-zinc-400">Min</label>
                        <input
                          type="number"
                          value={selectedField.min ?? ''}
                          onChange={(e) =>
                            updateField(selectedField.id, {
                              min: e.target.value === '' ? undefined : Number(e.target.value)
                            })
                          }
                          className="mt-1 w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400">Max</label>
                        <input
                          type="number"
                          value={selectedField.max ?? ''}
                          onChange={(e) =>
                            updateField(selectedField.id, {
                              max: e.target.value === '' ? undefined : Number(e.target.value)
                            })
                          }
                          className="mt-1 w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400">Step</label>
                        <input
                          type="number"
                          value={selectedField.step ?? 1}
                          onChange={(e) =>
                            updateField(selectedField.id, {
                              step: e.target.value === '' ? 1 : Number(e.target.value)
                            })
                          }
                          className="mt-1 w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
                        />
                      </div>
                    </div>
                  )}

                  {/* Type Specific: File upload settings */}
                  {selectedField.type === 'file' && (
                    <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                      <label className="block text-xs font-medium text-zinc-300">
                        Supported File Formats
                      </label>
                      <p className="text-[11px] text-zinc-400">
                        Permits PDF, TXT, CSV, PNG, JPG attachments up to 10MB
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['pdf', 'csv', 'txt', 'png', 'jpg', 'jpeg'].map((ext) => (
                          <span
                            key={ext}
                            className="rounded bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[10px] font-mono text-zinc-300 uppercase"
                          >
                            .{ext}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-zinc-500">
                  <Sliders className="h-8 w-8 stroke-1 text-zinc-600 mb-2" />
                  <p className="text-xs">Select any field from the list to customize its properties.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Live Preview Mode Tab */
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-xl">
              <div className="border-b border-zinc-800 pb-5">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                    {category}
                  </span>
                  <span className="rounded bg-indigo-950/40 border border-indigo-500/30 px-2 py-0.5 text-xs text-indigo-300">
                    Live Form Preview
                  </span>
                </div>
                <h1 className="mt-2 text-xl font-bold text-white">
                  {title || 'Untitled Form Preview'}
                </h1>
                <p className="mt-1 text-xs text-zinc-400">
                  {description || 'No description entered yet.'}
                </p>
                {dueDate && (
                  <p className="mt-2 text-xs text-amber-400">
                    Due Date: {dueDate}
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-6">
                {fields.map((field, idx) => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-200">
                      {idx + 1}. {field.label}{' '}
                      {field.required && <span className="text-rose-400">*</span>}
                    </label>
                    {field.helpText && (
                      <p className="text-[11px] text-zinc-400">{field.helpText}</p>
                    )}

                    {field.type === 'text' && (
                      <input
                        type="text"
                        disabled
                        placeholder={field.placeholder || 'Enter short text...'}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400 cursor-not-allowed"
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        rows={3}
                        disabled
                        placeholder={field.placeholder || 'Enter details...'}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400 cursor-not-allowed"
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        type="number"
                        disabled
                        placeholder={field.placeholder || '0'}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400 cursor-not-allowed"
                      />
                    )}

                    {field.type === 'date' && (
                      <input
                        type="date"
                        disabled
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400 cursor-not-allowed"
                      />
                    )}

                    {field.type === 'time' && (
                      <input
                        type="time"
                        disabled
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400 cursor-not-allowed"
                      />
                    )}

                    {field.type === 'radio' && (
                      <div className="space-y-1.5 pt-1">
                        {(field.options || ['Choice A', 'Choice B']).map((opt, i) => (
                          <label
                            key={i}
                            className="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-2 text-xs text-zinc-300"
                          >
                            <input type="radio" disabled name={`prev-${field.id}`} className="text-indigo-600" />
                            <span>{typeof opt === 'object' ? JSON.stringify(opt) : String(opt ?? '')}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {field.type === 'checkbox' && (
                      <div className="space-y-1.5 pt-1">
                        {(field.options || ['Option 1', 'Option 2']).map((opt, i) => (
                          <label
                            key={i}
                            className="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-2 text-xs text-zinc-300"
                          >
                            <input type="checkbox" disabled className="rounded text-indigo-600" />
                            <span>{typeof opt === 'object' ? JSON.stringify(opt) : String(opt ?? '')}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {field.type === 'select' && (
                      <select
                        disabled
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400 cursor-not-allowed"
                      >
                        <option>-- Select an option --</option>
                        {(field.options || []).map((opt, i) => (
                          <option key={i}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {field.type === 'file' && (
                      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/30 p-6 text-center">
                        <UploadCloud className="h-8 w-8 text-zinc-500 mb-2" />
                        <span className="text-xs text-zinc-300 font-medium">
                          Upload file (PDF, CSV, TXT, PNG, JPG)
                        </span>
                        <span className="text-[10px] text-zinc-500 mt-1">
                          Preview mode: file upload disabled
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  disabled
                  className="w-full rounded-lg bg-indigo-600/50 py-2.5 text-xs font-semibold text-white/50 cursor-not-allowed"
                >
                  Submit Form (Preview Only)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Footer Actions */}
        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="save-draft-btn"
              disabled={isSubmitting}
              onClick={() => handleSubmit('draft')}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5 text-zinc-400" />
              Save as Draft
            </button>

            <button
              type="button"
              id="publish-form-btn"
              disabled={isSubmitting}
              onClick={() => handleSubmit('published')}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {isSubmitting ? 'Publishing...' : 'Publish & Assign Form'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
