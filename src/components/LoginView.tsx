import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface LoginViewProps {
  onSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { login, users, switchUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email: email.trim(), password });
      setSuccessMessage('Authentication successful. Welcome back!');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (userEmail: string, userId: string) => {
    setEmail(userEmail);
    setPassword('password123');
    setErrorMessage(null);
    try {
      setIsSubmitting(true);
      // Attempt quick direct switch or login
      await switchUser(userId);
      setSuccessMessage(`Logged in as ${userEmail}`);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#0a0a0a] text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Background Decorative Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            TaskFlow Workspace
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Enterprise RBAC Authentication &amp; Protected Operations
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          {/* Sign In Header Banner */}
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-[#222222]">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <LogIn className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Sign In to Your Workspace</h2>
              <p className="text-[11px] text-neutral-400">Enter your credentials to access protected projects</p>
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-5 p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-input-email"
                  type="email"
                  required
                  placeholder="name@techcorp.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  Password
                </label>
                <span className="text-[11px] text-neutral-400 font-mono">
                  Demo: password123
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer p-0.5"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="auth-btn-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Workspace</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Panel */}
          <div className="mt-6 pt-5 border-t border-[#222222]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick 1-Click Demo Accounts
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                pw: password123
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {users.slice(0, 4).map((user) => (
                <button
                  key={user.id}
                  id={`auth-quick-login-${user.id}`}
                  type="button"
                  onClick={() => handleQuickDemoLogin(user.email, user.id)}
                  className="flex items-center gap-2 p-2 bg-[#0d0d0d] hover:bg-[#1a1a1a] border border-[#222222] hover:border-[#333333] rounded-xl text-left transition-all cursor-pointer group"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-[#333333] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-neutral-200 group-hover:text-blue-400 truncate flex items-center gap-1">
                      <span>{user.name}</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate flex items-center gap-1">
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold uppercase ${
                        user.role === 'admin'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                          : 'bg-blue-950 text-blue-400 border border-blue-800/60'
                      }`}>
                        {user.role}
                      </span>
                      <span className="truncate">{user.department}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-neutral-600 group-hover:text-blue-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Security Features Callout */}
          <div className="mt-5 p-2.5 bg-[#0f0f0f] border border-[#222222] rounded-xl flex items-center justify-between text-[11px] text-neutral-400">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bcrypt Salted Hash &amp; RBAC Token Protection</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
