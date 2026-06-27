import React, { useState } from 'react';
import { User } from '../types';
import { GraduationCap, Lock, Mail, User as UserIcon, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

interface Props {
  onLoginSuccess: (user: User) => void;
  darkMode: boolean;
}

export const AuthForms: React.FC<Props> = ({ onLoginSuccess, darkMode }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister
      ? { username, email, password }
      : { emailOrUsername, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoStudent = () => {
    setIsRegister(false);
    setEmailOrUsername('alex@campusgpt.edu');
    setPassword('password123');
  };

  const fillDemoAdmin = () => {
    setIsRegister(false);
    setEmailOrUsername('admin@campusgpt.edu');
    setPassword('admin123');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 md:p-8 bg-gradient-to-br ${
      darkMode ? 'from-slate-950 via-purple-950/20 to-slate-950 text-slate-100' : 'from-slate-100 via-purple-50 to-blue-50 text-slate-800'
    }`}>
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-purple-500/20 bg-slate-900/40 backdrop-blur-xl">
        
        {/* Left Branding Hero (5 cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-purple-700 via-purple-600 to-blue-600 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg">
                <GraduationCap className="w-8 h-8 text-purple-100" />
              </div>
              <span className="text-2xl font-black tracking-tight">CampusGPT</span>
            </div>
            
            <div className="mt-12 space-y-4">
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
                Your Intelligent College AI Partner.
              </h1>
              <p className="text-purple-100/80 text-sm leading-relaxed font-normal">
                Instant academic support, programming guidance, placement prep, and campus FAQs powered by Google Gemini AI.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-8 border-t border-white/15 mt-8">
            <p className="text-xs uppercase tracking-wider font-bold text-purple-200">🚀 Quick Demo Accounts:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillDemoStudent}
                className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl border border-white/20 text-left transition flex flex-col justify-between text-xs"
              >
                <span className="font-bold flex items-center gap-1.5">🎓 Student</span>
                <span className="text-[10px] text-purple-200 truncate mt-0.5">alex@campusgpt.edu</span>
              </button>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="p-2.5 bg-purple-900/40 hover:bg-purple-900/60 active:scale-95 rounded-xl border border-purple-300/30 text-left transition flex flex-col justify-between text-xs"
              >
                <span className="font-bold flex items-center gap-1 text-purple-200"><ShieldCheck className="w-3.5 h-3.5" /> Admin</span>
                <span className="text-[10px] text-purple-300 truncate mt-0.5">admin@campusgpt.edu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Form Container (7 cols) */}
        <div className={`md:col-span-7 p-8 md:p-12 flex flex-col justify-center ${
          darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'
        }`}>
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-2xl font-black tracking-tight">
                {isRegister ? 'Create Student Account' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {isRegister
                  ? 'Register securely to access your campus AI chatbot'
                  : 'Enter your credentials to continue your academic session'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Username</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. alex_rivera"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 focus:ring-purple-500 ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              )}

              {isRegister ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">College Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="student@campusgpt.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 focus:ring-purple-500 ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email or Username</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="alex@campusgpt.edu or alex"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 focus:ring-purple-500 ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 focus:ring-purple-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 hover:from-purple-500 hover:to-blue-500 active:scale-[0.99] rounded-xl text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 mt-6 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <>
                    {isRegister ? 'Complete Registration' : 'Access Chatbot'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-xs">
              <span className="text-slate-400">
                {isRegister ? 'Already have an account?' : "Don't have a college account?"}
              </span>
              {' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="font-bold text-purple-400 hover:text-purple-300 underline transition cursor-pointer ml-1"
              >
                {isRegister ? 'Sign In' : 'Register Here'}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/40 text-center flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Session stored securely with SQLite + React LocalSession</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
