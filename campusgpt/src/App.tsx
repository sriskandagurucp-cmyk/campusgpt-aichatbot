/**
 * CampusGPT - AI-powered College Assistant Chatbot Web Application
 * Main Application Component
 */
import React, { useState, useEffect } from 'react';
import { User, AdminStats } from './types';
import { AuthForms } from './components/AuthForms';
import { ChatInterface } from './components/ChatInterface';
import { AdminPanel } from './components/AdminPanel';
import { DeliverablesModal } from './components/DeliverablesModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('campusgpt_session_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setCurrentView] = useState<'chat' | 'admin'>('chat');
  const [showDeliverables, setShowDeliverables] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('campusgpt_dark_mode');
    return saved ? saved === 'true' : true; // default dark purple/blue theme
  });

  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Sync session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('campusgpt_session_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('campusgpt_session_user');
    }
  }, [currentUser]);

  // Sync dark mode class
  useEffect(() => {
    localStorage.setItem('campusgpt_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('chat');
  };

  // Fetch admin data
  const fetchAdminStats = async () => {
    setAdminLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setAdminStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleOpenAdmin = () => {
    setCurrentView('admin');
    fetchAdminStats();
  };

  const handleDeleteChatAdmin = async (id: number) => {
    if (!confirm("Delete this chat permanently from SQLite?")) return;
    try {
      await fetch(`/api/chats/${id}`, { method: 'DELETE' });
      fetchAdminStats();
    } catch (err) {
      console.error('Delete chat admin error:', err);
    }
  };

  if (!currentUser) {
    return <AuthForms onLoginSuccess={setCurrentUser} darkMode={darkMode} />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-white dark' : 'bg-white text-slate-900'}`}>
      
      {currentView === 'chat' ? (
        <ChatInterface
          user={currentUser}
          onLogout={handleLogout}
          onOpenAdmin={handleOpenAdmin}
          onOpenDeliverables={() => setShowDeliverables(true)}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      ) : (
        <div className="flex flex-col h-screen overflow-hidden">
          <AdminPanel
            stats={adminStats}
            loading={adminLoading}
            onRefresh={fetchAdminStats}
            onDeleteChat={handleDeleteChatAdmin}
            onBackToChat={() => setCurrentView('chat')}
            darkMode={darkMode}
          />
        </div>
      )}

      {showDeliverables && (
        <DeliverablesModal
          onClose={() => setShowDeliverables(false)}
          darkMode={darkMode}
        />
      )}

    </div>
  );
}

