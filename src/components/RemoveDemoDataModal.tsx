import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle2, Shield, X, Loader2 } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';

interface RemoveDemoDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RemoveDemoDataModal: React.FC<RemoveDemoDataModalProps> = ({ isOpen, onClose }) => {
  const { clearDemoData } = useTasks();
  const { currentUser, isAdmin } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!isAdmin) return;
    try {
      setIsDeleting(true);
      const success = await clearDemoData();
      if (success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to remove demo data:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-[#161616] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden p-6 text-neutral-200 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-demo-data-title"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#222] transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-600/50 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Demo Data Removed</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Your workspace has been cleaned. All demo tasks, projects, and logs have been cleared.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Modal Icon & Header */}
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="min-w-0 pr-6">
                <h3 id="remove-demo-data-title" className="text-base font-bold text-white tracking-tight">
                  Remove Demo Data
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Clear pre-seeded sample records for a clean production workspace.
                </p>
              </div>
            </div>

            {/* Scope explanation */}
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-[11px] uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>The following items will be wiped:</span>
              </div>
              <ul className="space-y-1 pl-5 list-disc text-neutral-300 text-[11px] leading-relaxed">
                <li>All sample tasks, checklists, and time tracking logs</li>
                <li>All demo projects and team assignments</li>
                <li>All demo scheduled meetings and agendas</li>
                <li>All mock chat messages and activity audit history</li>
              </ul>

              <div className="pt-2 border-t border-[#222] flex items-center gap-2 text-emerald-400 text-[11px]">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>Admin account ({currentUser?.name}) and column workflows will be preserved.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                id="btn-cancel-remove-demo-data"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-[#222222] hover:bg-[#2a2a2a] text-xs font-semibold text-neutral-300 transition-colors cursor-pointer border border-[#333] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                id="btn-confirm-remove-demo-data"
                onClick={handleConfirm}
                disabled={isDeleting || !isAdmin}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all shadow-md shadow-rose-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Demo Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
