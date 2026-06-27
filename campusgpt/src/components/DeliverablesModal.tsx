import React, { useState } from 'react';
import { FileCode, Download, Copy, Check, X, Terminal, Database, BookOpen } from 'lucide-react';

interface Props {
  onClose: () => void;
  darkMode: boolean;
}

export const DeliverablesModal: React.FC<Props> = ({ onClose, darkMode }) => {
  const [activeTab, setActiveTab] = useState<'app.py' | 'requirements.txt' | 'README.md' | 'database.sql'>('app.py');
  const [copied, setCopied] = useState(false);

  const filesContent = {
    'app.py': `"""
CampusGPT - College Assistant Chatbot Backend (Python Flask version)
Suitable for Internship Portfolio & Academic Submissions.
"""

import os
import sqlite3
from flask import Flask, request, jsonify, render_template, session
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "campusgpt_secure_session_key_2026")
DB_FILE = "database.db"

SYSTEM_INSTRUCTION = """You are CampusGPT, an intelligent College Assistant Chatbot designed to help college students with academic guidance, CS subjects, placement prep, timetable scheduling, and interview tips.
Tone: Supportive, structured, clear, and encouraging. Use clean Markdown formatting."""

# Initialize Google GenAI Client
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'student',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            response TEXT NOT NULL,
            category TEXT DEFAULT 'General FAQ',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    # Seed default admin
    cursor.execute("INSERT OR IGNORE INTO users (id, username, email, password, role) VALUES (1, 'admin', 'admin@campusgpt.edu', 'admin123', 'admin')")
    cursor.execute("INSERT OR IGNORE INTO users (id, username, email, password, role) VALUES (2, 'student', 'alex@campusgpt.edu', 'password123', 'student')")
    conn.commit()
    conn.close()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("emailOrUsername", "").strip().lower()
    password = data.get("password")
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE (email = ? OR username = ?) AND password = ?", (email, email, password)).fetchone()
    conn.close()
    if user:
        session["user_id"] = user["id"]
        session["username"] = user["username"]
        session["role"] = user["role"]
        return jsonify({"success": True, "user": dict(user)})
    return jsonify({"error": "Invalid login credentials"}), 401

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password")
    try:
        conn = get_db_connection()
        conn.execute("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'student')", (username, email, password))
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        conn.close()
        return jsonify({"success": True, "user": dict(user)})
    except Exception as e:
        return jsonify({"error": "Username or Email already exists"}), 400

@app.route("/api/chat", methods=["POST"])
def chat():
    if not client:
        return jsonify({"error": "GEMINI_API_KEY is not configured on server."}), 500
    data = request.json
    user_id = data.get("userId")
    message = data.get("message")
    category = data.get("category", "General FAQ")
    
    # Generate Gemini content
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=message,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.7
        )
    )
    reply_text = response.text
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO chats (user_id, message, response, category) VALUES (?, ?, ?, ?)", (user_id, message, reply_text, category))
    conn.commit()
    conn.close()
    return jsonify({"response": reply_text})

if __name__ == "__main__":
    init_db()
    print("🎓 CampusGPT Flask Server running on http://localhost:5000")
    app.run(debug=True, port=5000)`,

    'requirements.txt': `flask==3.0.2
google-genai>=0.1.0
python-dotenv==1.0.1
gunicorn==21.2.0`,

    'database.sql': `-- CampusGPT SQLite Database Schema

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    category TEXT DEFAULT 'General FAQ',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Default Seeds
INSERT OR IGNORE INTO users (id, username, email, password, role) VALUES (1, 'admin', 'admin@campusgpt.edu', 'admin123', 'admin');
INSERT OR IGNORE INTO users (id, username, email, password, role) VALUES (2, 'student', 'alex@campusgpt.edu', 'password123', 'student');`,

    'README.md': `# 🎓 CampusGPT - AI College Assistant Chatbot

## 🚀 Setup & Run Locally (Flask version)

1. **Create virtual env**:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   \`\`\`

2. **Install dependencies**:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. **Set Gemini API Key** in \`.env\`:
   \`\`\`env
   GEMINI_API_KEY="your_api_key"
   \`\`\`

4. **Run Flask Server**:
   \`\`\`bash
   python app.py
   \`\`\`
   Visit \`http://localhost:5000\``
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(filesContent[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([filesContent[activeTab]], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border ${
        darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl text-white shadow-md">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Python Flask Project Deliverables</h2>
              <p className="text-xs text-slate-400">Complete backend source files generated for your internship portfolio</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-500/10 text-slate-400 hover:text-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex gap-1 px-6 pt-3 border-b overflow-x-auto ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-100/50'}`}>
          <button
            onClick={() => setActiveTab('app.py')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition ${
              activeTab === 'app.py'
                ? darkMode ? 'bg-slate-800 text-purple-400 border-t-2 border-purple-500' : 'bg-white text-purple-700 shadow-xs border-t-2 border-purple-600'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" /> app.py
          </button>
          <button
            onClick={() => setActiveTab('database.sql')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition ${
              activeTab === 'database.sql'
                ? darkMode ? 'bg-slate-800 text-blue-400 border-t-2 border-blue-500' : 'bg-white text-blue-700 shadow-xs border-t-2 border-blue-600'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" /> database.sql
          </button>
          <button
            onClick={() => setActiveTab('requirements.txt')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition ${
              activeTab === 'requirements.txt'
                ? darkMode ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500' : 'bg-white text-emerald-700 shadow-xs border-t-2 border-emerald-600'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" /> requirements.txt
          </button>
          <button
            onClick={() => setActiveTab('README.md')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition ${
              activeTab === 'README.md'
                ? darkMode ? 'bg-slate-800 text-amber-400 border-t-2 border-amber-500' : 'bg-white text-amber-700 shadow-xs border-t-2 border-amber-600'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> README.md
          </button>
        </div>

        {/* Code View */}
        <div className="relative flex-1 p-6 overflow-y-auto font-mono text-xs leading-relaxed bg-slate-950 text-slate-300">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-sans transition border border-slate-700 shadow-md"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-xs font-sans transition shadow-md"
            >
              <Download className="w-3.5 h-3.5" /> Download File
            </button>
          </div>
          <pre className="pt-8 pb-4 whitespace-pre-wrap selection:bg-purple-600 selection:text-white">
            {filesContent[activeTab]}
          </pre>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-6 py-4 border-t text-xs ${darkMode ? 'border-slate-800 text-slate-400 bg-slate-900' : 'border-slate-200 text-slate-500 bg-slate-50'}`}>
          <span>💡 All 4 required deliverables are also saved physically inside the <code>/flask_deliverable</code> directory.</span>
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-medium transition">
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
