import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { ShieldAlert, Lock, ArrowLeft, UserCheck } from 'lucide-react';

interface AccessDeniedViewProps {
  requiredRole?: string;
  requiredPrivilege?: string;
  title?: string;
  description?: string;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  requiredRole = 'Administrator',
  requiredPrivilege,
  title = 'Access Restricted',
  description = 'You do not have permission to access this protected area. Administrator privileges or specific role access is required.'
}) => {
  const { currentUser, switchUser, users } = useAuth();
  const { setViewMode } = useTasks();

  const adminUsers = users.filter((u) => u.role === 'admin' && u.status === 'active');

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#0d0d0d] text-slate-100 min-h-full">
      <div className="max-w-md w-full bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-8 text-center shadow-xl space-y-5">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-400 shadow-lg shadow-rose-950/40">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">{description}</p>
        </div>

        {currentUser && (
          <div className="p-3 bg-[#0d0d0d] border border-[#222222] rounded-xl text-xs flex items-center justify-between text-neutral-300">
            <div className="flex items-center gap-2.5">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-[#333333]"
              />
              <div className="text-left">
                <div className="font-bold text-white">{currentUser.name}</div>
                <div className="text-[10px] text-neutral-400">Current Role: {currentUser.role.toUpperCase()}</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-800">
              Restricted
            </span>
          </div>
        )}

        {requiredPrivilege && (
          <div className="text-[11px] text-neutral-400 font-mono bg-[#181818] p-2 rounded border border-[#262626]">
            Missing privilege: <span className="text-amber-400">{requiredPrivilege}</span>
          </div>
        )}

        <div className="space-y-2.5 pt-2">
          <button
            id="access-denied-return-btn"
            type="button"
            onClick={() => setViewMode('kanban')}
            className="w-full py-2 px-4 bg-[#242424] hover:bg-[#2c2c2c] text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Kanban Board</span>
          </button>
        </div>
      </div>
    </div>
  );
};
