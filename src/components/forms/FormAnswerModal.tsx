import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Calendar,
  Clock,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Trash2,
  Eye,
  Check,
  RotateCcw
} from 'lucide-react';
import { Form, FormField, FormResponse, FormAttachedFile, User } from '../../types';
import { UserAvatar } from '../UserAvatar';
import { FileViewerModal, FileViewerItem } from '../FileViewerModal';

interface FormAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form | null;
  existingResponse?: FormResponse | null;
  currentUser: User | null;
  onSubmit: (answers: Record<string, any>) => Promise<void>;
}

export const FormAnswerModal: React.FC<FormAnswerModalProps> = ({
  isOpen,
  onClose,
  form,
  existingResponse,
  currentUser,
  onSubmit
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [activeViewerFile, setActiveViewerFile] = useState<FileViewerItem | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (isOpen && form) {
      if (existingResponse?.answers) {
        setAnswers({ ...existingResponse.answers });
      } else {
        // Initialize default answers
        const initialAnswers: Record<string, any> = {};
        form.fields.forEach((field) => {
          if (field.defaultValue !== undefined) {
            initialAnswers[field.id] = field.defaultValue;
          } else if (field.type === 'checkbox') {
            initialAnswers[field.id] = [];
          } else if (field.type === 'number' && field.min !== undefined) {
            initialAnswers[field.id] = field.min;
          } else {
            initialAnswers[field.id] = '';
          }
        });
        setAnswers(initialAnswers);
      }
      setErrors({});
      setIsSubmittedSuccess(false);
    }
  }, [isOpen, form, existingResponse]);

  if (!isOpen || !form) return null;

  const handleTextChange = (fieldId: string, val: string | number) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: val }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleCheckboxToggle = (fieldId: string, option: string) => {
    setAnswers((prev) => {
      const currentVal = prev[fieldId];
      let currentList: string[] = [];
      if (Array.isArray(currentVal)) {
        currentList = [...currentVal];
      } else if (typeof currentVal === 'string' && currentVal.length > 0) {
        currentList = [currentVal];
      }

      const nextList = currentList.includes(option)
        ? currentList.filter((item) => item !== option)
        : [...currentList, option];

      return { ...prev, [fieldId]: nextList };
    });

    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleFileUpload = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [fieldId]: 'File size must be under 10MB.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const attached: FormAttachedFile = {
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url: '',
        base64Data
      };

      setAnswers((prev) => ({ ...prev, [fieldId]: attached }));
      if (errors[fieldId]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[fieldId];
          return next;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (fieldId: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    if (fileInputRefs.current[fieldId]) {
      fileInputRefs.current[fieldId]!.value = '';
    }
  };

  const previewFile = (attached: FormAttachedFile) => {
    setActiveViewerFile({
      id: `preview-${Date.now()}`,
      name: attached.name,
      size: attached.size,
      type: attached.type,
      dataBase64: attached.base64Data,
      url: attached.url,
      uploadedByName: currentUser?.name || 'Respondent',
      uploadedAt: new Date().toISOString()
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    form.fields.forEach((field) => {
      if (field.required) {
        const val = answers[field.id];
        if (val === undefined || val === null || val === '') {
          newErrors[field.id] = 'This field is required.';
        } else if (field.type === 'checkbox' && (!Array.isArray(val) || val.length === 0)) {
          newErrors[field.id] = 'Please select at least one option.';
        } else if (field.type === 'file' && (!val || (!val.name && !val.base64Data))) {
          newErrors[field.id] = 'Please attach the required file.';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(answers);
      setIsSubmittedSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Error submitting response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 sm:p-5 backdrop-blur-md">
        <div
          id="form-answer-modal"
          className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-start justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                  {form.category || 'General'}
                </span>
                {existingResponse && (
                  <span className="rounded bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 text-xs text-emerald-300">
                    Previous Submission Found
                  </span>
                )}
                {form.dueDate && (
                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                    <Calendar className="h-3 w-3 text-zinc-500" />
                    Due {form.dueDate}
                  </span>
                )}
              </div>
              <h2 className="mt-1.5 text-lg font-bold text-white">{form.title}</h2>
              {form.description && (
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  {form.description}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            {isSubmittedSuccess ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Response Recorded!</h3>
                <p className="mt-1.5 max-w-sm text-xs text-zinc-400">
                  Thank you for submitting your answers to <span className="text-zinc-200 font-medium">"{form.title}"</span>. The form creator has been notified.
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSubmittedSuccess(false)}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Review / Edit Response
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {form.fields.map((field, idx) => {
                  const error = errors[field.id];
                  return (
                    <div
                      key={field.id}
                      id={`field-container-${field.id}`}
                      className={`rounded-xl border p-4 transition-all ${
                        error
                          ? 'border-rose-800/80 bg-rose-950/10'
                          : 'border-zinc-800/70 bg-zinc-900/30'
                      }`}
                    >
                      <label className="block text-xs font-semibold text-zinc-200">
                        {idx + 1}. {field.label}{' '}
                        {field.required && <span className="text-rose-400 font-bold">*</span>}
                      </label>

                      {field.helpText && (
                        <p className="mt-0.5 text-[11px] text-zinc-400">{field.helpText}</p>
                      )}

                      <div className="mt-3">
                        {/* 1. Text Input */}
                        {field.type === 'text' && (
                          <input
                            id={`answer-input-${field.id}`}
                            type="text"
                            value={answers[field.id] || ''}
                            onChange={(e) => handleTextChange(field.id, e.target.value)}
                            placeholder={field.placeholder || 'Your response...'}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        )}

                        {/* 2. Text Area */}
                        {field.type === 'textarea' && (
                          <textarea
                            id={`answer-textarea-${field.id}`}
                            rows={3}
                            value={answers[field.id] || ''}
                            onChange={(e) => handleTextChange(field.id, e.target.value)}
                            placeholder={field.placeholder || 'Type your detailed feedback or notes here...'}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        )}

                        {/* 3. Number */}
                        {field.type === 'number' && (
                          <input
                            id={`answer-number-${field.id}`}
                            type="number"
                            value={answers[field.id] !== undefined ? answers[field.id] : ''}
                            min={field.min}
                            max={field.max}
                            step={field.step || 1}
                            onChange={(e) =>
                              handleTextChange(
                                field.id,
                                e.target.value === '' ? '' : Number(e.target.value)
                              )
                            }
                            placeholder={field.placeholder || '0'}
                            className="w-full sm:w-48 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        )}

                        {/* 4. Date */}
                        {field.type === 'date' && (
                          <input
                            id={`answer-date-${field.id}`}
                            type="date"
                            value={answers[field.id] || ''}
                            onChange={(e) => handleTextChange(field.id, e.target.value)}
                            className="w-full sm:w-56 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        )}

                        {/* 5. Time */}
                        {field.type === 'time' && (
                          <input
                            id={`answer-time-${field.id}`}
                            type="time"
                            value={answers[field.id] || ''}
                            onChange={(e) => handleTextChange(field.id, e.target.value)}
                            className="w-full sm:w-44 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        )}

                        {/* 6. Upload File */}
                        {field.type === 'file' && (
                          <div className="space-y-3">
                            <input
                              type="file"
                              ref={(el) => (fileInputRefs.current[field.id] = el)}
                              onChange={(e) => handleFileUpload(field.id, e)}
                              accept=".pdf,.txt,.csv,.png,.jpg,.jpeg,.json,.md"
                              className="hidden"
                              id={`file-input-${field.id}`}
                            />

                            {answers[field.id]?.name ? (
                              <div className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900 p-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-500/20">
                                    <Paperclip className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-zinc-200 truncate">
                                      {answers[field.id].name}
                                    </p>
                                    <p className="text-[10px] text-zinc-400">
                                      {(answers[field.id].size / 1024).toFixed(1)} KB • {answers[field.id].type || 'Attachment'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => previewFile(answers[field.id])}
                                    className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-200 hover:bg-zinc-700"
                                  >
                                    <Eye className="h-3 w-3 text-indigo-400" />
                                    View
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeFile(field.id)}
                                    className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded"
                                    title="Remove file"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => fileInputRefs.current[field.id]?.click()}
                                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/40 p-5 text-center transition-colors hover:border-zinc-700 hover:bg-zinc-900/80"
                              >
                                <UploadCloud className="h-7 w-7 text-indigo-400 mb-1.5" />
                                <p className="text-xs font-medium text-zinc-200">
                                  Click or drag & drop to attach a file
                                </p>
                                <p className="text-[10px] text-zinc-400 mt-0.5">
                                  Supports PDF, TXT, CSV, PNG, JPG (up to 10MB)
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 7. Single Choice (Radio) */}
                        {field.type === 'radio' && (
                          <div className="space-y-2">
                            {(field.options || []).map((opt, optIdx) => {
                              const optStr = typeof opt === 'object' ? JSON.stringify(opt) : String(opt ?? '');
                              const isChecked = answers[field.id] === optStr;
                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  id={`radio-${field.id}-${optIdx}`}
                                  onClick={() => handleTextChange(field.id, optStr)}
                                  className={`flex w-full items-center justify-between rounded-lg border p-2.5 text-left text-xs font-medium transition-colors ${
                                    isChecked
                                      ? 'border-indigo-500 bg-indigo-950/30 text-indigo-200'
                                      : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                        isChecked
                                          ? 'border-indigo-500 bg-indigo-600'
                                          : 'border-zinc-700 bg-zinc-800'
                                      }`}
                                    >
                                      {isChecked && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                      )}
                                    </div>
                                    <span className="truncate">{optStr}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* 8. Multi Choice (Checkbox) */}
                        {field.type === 'checkbox' && (
                          <div className="space-y-2">
                            {(field.options || []).map((opt, optIdx) => {
                              const optStr = typeof opt === 'object' ? JSON.stringify(opt) : String(opt ?? '');
                              const checkedList: string[] = Array.isArray(answers[field.id])
                                ? answers[field.id]
                                : typeof answers[field.id] === 'string' && answers[field.id]
                                ? [answers[field.id]]
                                : [];
                              const isChecked = checkedList.includes(optStr);
                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  id={`checkbox-${field.id}-${optIdx}`}
                                  onClick={() => handleCheckboxToggle(field.id, optStr)}
                                  className={`flex w-full items-center justify-between rounded-lg border p-2.5 text-left text-xs font-medium transition-colors ${
                                    isChecked
                                      ? 'border-indigo-500 bg-indigo-950/30 text-indigo-200'
                                      : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                        isChecked
                                          ? 'border-indigo-500 bg-indigo-600 text-white'
                                          : 'border-zinc-700 bg-zinc-800'
                                      }`}
                                    >
                                      {isChecked && <Check className="h-3 w-3" />}
                                    </div>
                                    <span className="truncate">{optStr}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* 9. Drop list (Select) */}
                        {field.type === 'select' && (
                          <select
                            id={`answer-select-${field.id}`}
                            value={answers[field.id] || ''}
                            onChange={(e) => handleTextChange(field.id, e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">-- Select an option --</option>
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {error && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    id="submit-answers-btn"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {isSubmitting
                      ? 'Submitting...'
                      : existingResponse
                      ? 'Update Answers'
                      : 'Submit Answers'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* In-app File Viewer Modal for PDF, CSV, TXT, PNG, etc. */}
      <FileViewerModal
        isOpen={Boolean(activeViewerFile)}
        onClose={() => setActiveViewerFile(null)}
        file={activeViewerFile}
      />
    </>
  );
};
