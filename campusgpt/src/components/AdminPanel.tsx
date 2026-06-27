import React from 'react';
import { AdminStats } from '../types';
import { Users, MessageSquare, Trash2, ShieldAlert, BarChart3, RefreshCw, Award, ArrowLeft } from 'lucide-react';

interface Props {
  stats: AdminStats | null;
  loading: boolean;
  onRefresh: () => void;
  onDeleteChat: (id: number) => void;
  onBackToChat: () => void;
  darkMode: boolean;
}

export const AdminPanel: React.FC<Props> = ({
  stats,
  loading,
  onRefresh,
  onDeleteChat,
  onBackToChat,
  darkMode
}) => {
  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900/40 via-blue-900/30 to-purple-900/40 p-6 rounded-2xl border border-purple-500/20 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-2xl text-white shadow-lg shadow-purple-500/30">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">CampusGPT Admin Panel</h1>
                <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                  Moderation
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">Manage registered university users, view AI statistics, and moderate campus discussions.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition border ${
                darkMode
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-xs'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
              Refresh Data
            </button>
            <button
              onClick={onBackToChat}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-purple-600/20"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Chat
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`p-6 rounded-2xl border transition hover:scale-[1.02] ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</span>
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black mt-4">{stats?.totalUsers || 0}</p>
            <p className="text-xs text-emerald-400 font-medium mt-1">● Active university accounts</p>
          </div>

          <div className={`p-6 rounded-2xl border transition hover:scale-[1.02] ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Conversations</span>
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black mt-4">{stats?.totalChats || 0}</p>
            <p className="text-xs text-blue-400 font-medium mt-1">● Processed by Gemini AI</p>
          </div>

          <div className={`p-6 rounded-2xl border transition hover:scale-[1.02] ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Top Query Topic</span>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl font-black mt-4 truncate">
              {stats?.categoryStats && stats.categoryStats.length > 0
                ? stats.categoryStats.reduce((prev, curr) => (prev.count > curr.count) ? prev : curr).category
                : 'General FAQ'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Highest frequency category</p>
          </div>

          <div className={`p-6 rounded-2xl border transition hover:scale-[1.02] ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Moderation Status</span>
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl font-black mt-4 text-emerald-400">Protected</p>
            <p className="text-xs text-slate-400 mt-1">Real-time SQLite persistence</p>
          </div>
        </div>

        {/* Two Column Section: Users List & Chat Moderation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Registered Users Table (Left 1 Col) */}
          <div className={`lg:col-span-1 rounded-2xl border flex flex-col overflow-hidden ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`p-5 border-b flex items-center justify-between ${darkMode ? 'border-slate-800' : 'border-slate-100 bg-slate-50/50'}`}>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h2 className="font-bold">Registered Users ({stats?.users?.length || 0})</h2>
              </div>
              <span className="text-xs font-mono text-slate-400">SQLite table</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-slate-800/40">
              {stats?.users && stats.users.length > 0 ? (
                stats.users.map((u) => (
                  <div key={u.id} className="p-4 hover:bg-slate-800/20 transition flex items-center justify-between">
                    <div className="space-y-0.5 truncate pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{u.username}</span>
                        {u.role === 'admin' ? (
                          <span className="px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-300 font-bold rounded">Admin</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] bg-blue-500/10 text-blue-400 font-medium rounded">Student</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      <p className="text-[10px] font-mono text-slate-500">ID #{u.id} ● Joined {u.created_at || 'Recently'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">No registered users found.</div>
              )}
            </div>
          </div>

          {/* Chat Moderation Feed (Right 2 Col) */}
          <div className={`lg:col-span-2 rounded-2xl border flex flex-col overflow-hidden ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`p-5 border-b flex items-center justify-between ${darkMode ? 'border-slate-800' : 'border-slate-100 bg-slate-50/50'}`}>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <h2 className="font-bold">Recent Conversation Logs</h2>
              </div>
              <span className="text-xs text-slate-400">Click delete icon to remove inappropriate chats</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-slate-800/50">
              {stats?.recentChats && stats.recentChats.length > 0 ? (
                stats.recentChats.map((c) => (
                  <div key={c.id} className={`p-5 transition flex flex-col gap-3 ${
                    darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-purple-400">@{c.username}</span>
                        <span className="text-slate-500">({c.email})</span>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono">{c.category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-400">{c.timestamp}</span>
                        <button
                          onClick={() => onDeleteChat(c.id)}
                          title="Delete inappropriate chat"
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 text-xs">
                      <div>
                        <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Student Query:</span>
                        <p className="text-slate-200 leading-relaxed font-sans">{c.message}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-800/50">
                        <span className="font-bold text-purple-400 uppercase text-[10px] block mb-1">CampusGPT AI Reply:</span>
                        <p className="text-slate-300 line-clamp-3 font-sans leading-relaxed">{c.response}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-500 text-sm">No recent conversations to moderate.</div>
              )}
            </div>
          </div>

        </div>

        {/* Category Stats Breakdown */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Query Category Distribution
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {stats?.categoryStats && stats.categoryStats.length > 0 ? (
              stats.categoryStats.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                  <p className="text-2xl font-black text-purple-400">{item.count}</p>
                  <p className="text-xs text-slate-300 font-medium mt-1">{item.category}</p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-4 text-slate-500 text-sm">No statistics available yet. Ask a question!</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
