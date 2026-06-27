import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { STARTER_PROMPTS } from '../promptChips';
import {
  MessageSquare, Plus, Send, Mic, MicOff, Volume2, VolumeX, Download, Trash2, Search,
  Sun, Moon, ShieldAlert, LogOut, FileCode, Sparkles, Bot, User as UserIcon, Loader2, Menu, X, ArrowDown
} from 'lucide-react';
import Markdown from 'react-markdown';
import { jsPDF } from 'jspdf';

interface Props {
  user: User;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onOpenDeliverables: () => void;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ChatInterface: React.FC<Props> = ({
  user,
  onLogout,
  onOpenAdmin,
  onOpenDeliverables,
  darkMode,
  setDarkMode
}) => {
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingReply, setStreamingReply] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Fetch past chats
  const fetchChats = async (search = '') => {
    try {
      const res = await fetch(`/api/chats?userId=${user.id}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.chats) {
        setChats(data.chats);
      }
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    }
  };

  useEffect(() => {
    fetchChats(searchQuery);
  }, [searchQuery, user.id]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, streamingReply]);

  // Web Speech API Voice Input
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("⚠️ Voice recognition is not supported in this browser. Try Chrome or Edge!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      setInputMessage(transcript);
    };
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Text-To-Speech Output
  const speakText = (text: string, id: number) => {
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for speech
    const cleanText = text.replace(/[*#`_~[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Download Chat as PDF
  const downloadPDF = () => {
    if (chats.length === 0) {
      alert("No chat history to export!");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(112, 51, 255); // Purple accent
    doc.text(`CampusGPT Academic Chat Report`, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Student: @${user.username} (${user.email})`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

    let y = 45;
    const pageHeight = doc.internal.pageSize.height;

    chats.forEach((c, idx) => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }

      // User Message
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(`[${c.timestamp}] You:`, 14, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const userLines = doc.splitTextToSize(c.message, 180);
      doc.text(userLines, 14, y);
      y += (userLines.length * 5) + 4;

      // AI Response
      if (y > pageHeight - 30) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setTextColor(112, 51, 255);
      doc.text(`CampusGPT (${c.category}):`, 14, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const cleanResp = c.response.replace(/[*#`]/g, '');
      const aiLines = doc.splitTextToSize(cleanResp, 180);
      doc.text(aiLines, 14, y);
      y += (aiLines.length * 5) + 12;
    });

    doc.save(`CampusGPT_History_${user.username}.pdf`);
  };

  // Clear All Chats
  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear your entire chat history?")) return;
    try {
      await fetch(`/api/chats?userId=${user.id}`, { method: 'DELETE' });
      setChats([]);
      setActiveChatId(null);
    } catch (err) {
      console.error('Clear chat error:', err);
    }
  };

  // Send Message (Streaming)
  const handleSendMessage = async (customPrompt?: string, customCategory?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || isGenerating) return;

    if (!customPrompt) setInputMessage('');
    setIsGenerating(true);
    setStreamingReply('');

    // Optimistic user chat append
    const tempUserChat: ChatMessage = {
      id: Date.now(),
      user_id: user.id,
      message: textToSend,
      response: '...',
      category: customCategory || 'General FAQ',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChats(prev => [...prev, tempUserChat]);
    setActiveChatId(tempUserChat.id);

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          message: textToSend,
          category: customCategory || 'General FAQ'
        })
      });

      if (!res.body) throw new Error("No SSE response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let partialReply = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value || new Uint8Array(), { stream: !done });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                partialReply += parsed.text;
                setStreamingReply(partialReply);
              }
              if (parsed.done) {
                // Update full DB chat list
                fetchChats();
              }
              if (parsed.error) {
                alert(`AI Error: ${parsed.error}`);
              }
            } catch (e) {
              // incomplete JSON string chunk
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat stream error:', err);
      alert("Failed to communicate with CampusGPT AI server.");
      fetchChats();
    } finally {
      setIsGenerating(false);
      setStreamingReply('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-800'}`}>
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-xs" />
      )}

      {/* ChatGPT Sidebar (Previous Chats) */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 flex flex-col transition-transform duration-300 border-r ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        
        {/* New Chat & App Title */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                CampusGPT
              </span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 text-slate-400 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => {
              setActiveChatId(null);
              setSidebarOpen(false);
            }}
            className={`w-full py-3 px-4 rounded-xl border flex items-center gap-3 font-semibold text-sm transition shadow-sm cursor-pointer ${
              darkMode ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-purple-300' : 'bg-white hover:bg-slate-100 border-slate-300 text-purple-700'
            }`}
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-lg text-xs border transition focus:outline-hidden focus:ring-1 focus:ring-purple-500 ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'
              }`}
            />
          </div>
        </div>

        {/* Conversation History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Previous Discussions</p>
          {chats.length > 0 ? (
            chats.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveChatId(c.id);
                  setSidebarOpen(false);
                }}
                className={`w-full p-3 rounded-xl text-left text-xs transition flex items-center gap-2.5 group ${
                  activeChatId === c.id
                    ? darkMode ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30 font-medium' : 'bg-purple-100 text-purple-900 font-medium'
                    : darkMode ? 'hover:bg-slate-800/60 text-slate-300' : 'hover:bg-slate-200/60 text-slate-700'
                }`}
              >
                <MessageSquare className={`w-4 h-4 shrink-0 ${activeChatId === c.id ? 'text-purple-400' : 'text-slate-400'}`} />
                <div className="truncate flex-1">
                  <p className="truncate font-sans">{c.message}</p>
                  <span className="text-[9px] text-slate-400">{c.timestamp} ● {c.category}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">No chat history found.</div>
          )}
        </div>

        {/* Sidebar Bottom Utilities */}
        <div className={`p-3 border-t space-y-1.5 text-xs ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={downloadPDF}
            className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 transition ${
              darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Download className="w-4 h-4 text-blue-400" /> Export Chat PDF
          </button>

          <button
            onClick={handleClearAll}
            className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 transition ${
              darkMode ? 'hover:bg-red-950/40 text-red-400' : 'hover:bg-red-50 text-red-600'
            }`}
          >
            <Trash2 className="w-4 h-4" /> Clear All Chats
          </button>
        </div>

      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* Top Navigation Bar */}
        <header className={`h-16 shrink-0 border-b flex items-center justify-between px-4 md:px-8 z-20 ${
          darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'
        } backdrop-blur-md`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-slate-500/10 text-slate-400">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="font-bold text-sm sm:text-base">CampusGPT Assistant</h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-purple-500/10 text-purple-400 rounded-md border border-purple-500/20">
                Gemini 3.5 Flash
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Deliverables Code Modal */}
            <button
              onClick={onOpenDeliverables}
              title="View Python Flask Deliverables"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-purple-300' : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Flask Files</span>
            </button>

            {/* Admin Panel Button */}
            {user.role === 'admin' && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-md"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Panel</span>
              </button>
            )}

            {/* Dark/Light Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl transition border ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-400' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Account / Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700/50">
              <span className="hidden md:inline text-xs font-semibold truncate max-w-[100px]">@{user.username}</span>
              <button
                onClick={onLogout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Chat Messages Feed Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* If empty chat, show Campus Welcome Starter Prompt Chips */}
            {chats.length === 0 && !isGenerating && (
              <div className="py-12 px-4 text-center space-y-8 animate-fade-in">
                <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-purple-600 to-blue-500 rounded-3xl flex items-center justify-center shadow-xl shadow-purple-600/20 text-white text-3xl">
                  🎓
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">How can CampusGPT assist you today?</h2>
                  <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
                    Select a starter topic below or type your college query. I specialize in Computer Science subjects, coding algorithms, interview prep, and academic schedules.
                  </p>
                </div>

                {/* Grid of Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto text-left pt-4">
                  {STARTER_PROMPTS.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip.prompt, chip.category)}
                      className={`p-4 rounded-2xl border transition hover:-translate-y-0.5 flex flex-col justify-between gap-2 cursor-pointer ${
                        darkMode
                          ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-200 shadow-lg shadow-black/20'
                          : 'bg-white hover:bg-purple-50/50 border-slate-200 text-slate-800 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{chip.icon}</span>
                        <span className="font-bold text-xs">{chip.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 font-normal leading-relaxed">{chip.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Render Chat Messages */}
            {chats.map((msg, index) => {
              const isLast = index === chats.length - 1;
              const respToDisplay = (isLast && isGenerating && streamingReply) ? streamingReply : msg.response;

              return (
                <div key={msg.id} className="space-y-4">
                  
                  {/* User Bubble */}
                  <div className="flex justify-end gap-3 items-start">
                    <div className="max-w-[85%] sm:max-w-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl rounded-tr-xs p-4 shadow-md space-y-1">
                      <p className="text-sm font-sans whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      <div className="text-[10px] text-purple-200/80 text-right font-mono">{msg.timestamp}</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                      {user.username[0].toUpperCase()}
                    </div>
                  </div>

                  {/* CampusGPT AI Response Bubble */}
                  <div className="flex justify-start gap-3 items-start">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 shrink-0 flex items-center justify-center text-white shadow-md">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className={`flex-1 max-w-[90%] sm:max-w-3xl rounded-2xl rounded-tl-xs p-5 sm:p-6 border shadow-sm ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50/80 border-slate-200/80 text-slate-800'
                    }`}>
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/40 text-xs">
                        <div className="flex items-center gap-2 font-bold text-purple-400">
                          <span>CampusGPT Assistant</span>
                          <span className="px-1.5 py-0.2 bg-purple-500/10 text-[10px] font-mono rounded">{msg.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400">{msg.timestamp}</span>
                          <button
                            onClick={() => speakText(msg.response, msg.id)}
                            title={speakingId === msg.id ? "Stop reading" : "Read aloud"}
                            className={`p-1 rounded hover:bg-slate-800/50 transition ${speakingId === msg.id ? 'text-purple-400 animate-pulse' : 'text-slate-400'}`}
                          >
                            {speakingId === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Markdown AI Content */}
                      {respToDisplay === '...' ? (
                        <div className="flex items-center gap-2 text-slate-400 py-2">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                          <span className="text-xs font-mono animate-pulse">CampusGPT is analyzing college knowledge base...</span>
                        </div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed font-sans prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-code:text-purple-300">
                          <Markdown>{respToDisplay}</Markdown>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar Footer */}
        <div className={`p-4 sm:p-6 border-t shrink-0 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="max-w-4xl mx-auto space-y-2">
            
            <div className={`relative rounded-2xl border transition focus-within:ring-2 focus-within:ring-purple-500 shadow-lg ${
              darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}>
              <textarea
                rows={1}
                placeholder="Ask CampusGPT academic questions, code debugging, placement interview tips..."
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                }}
                onKeyDown={handleKeyDown}
                className="w-full pl-4 pr-24 py-3.5 bg-transparent resize-none text-sm focus:outline-hidden max-h-[150px]"
              />

              {/* Action Buttons inside Input */}
              <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
                {/* Voice Mic Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  title="Voice Input (Web Speech API)"
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/40'
                      : darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isGenerating}
                  className="p-2.5 bg-gradient-to-tr from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 rounded-xl text-white transition shadow-md shadow-purple-600/30 cursor-pointer"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
              <span>Enter to send, Shift + Enter for new line ● Voice Mic supported</span>
              <span>🎓 CampusGPT Internship Portfolio Project</span>
            </div>

          </div>
        </div>

      </main>

    </div>
  );
};
