/**
 * CampusGPT - AI-powered College Assistant Chatbot Backend Server
 * Built with Express, Vite, SQLite (sql.js), and Google Gemini API
 */
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import initSqlJs, { Database } from 'sql.js';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const PORT = 3000;
const DB_PATH = path.join(process.cwd(), 'campusgpt.sqlite');

// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key-for-init',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// System Prompt for CampusGPT
const CAMPUS_GPT_SYSTEM_PROMPT = `You are CampusGPT, an intelligent, encouraging, and expert College Assistant Chatbot designed specifically for college students, Computer Science majors, and internship seekers.
Your core expertise includes:
1. College & Campus Information: Course structures, credit systems, academic timetables, library tips, and campus life FAQs.
2. Computer Science & Programming: Explaining complex topics in Data Structures, Algorithms, Operating Systems, DBMS, Networks, Artificial Intelligence, Web Dev, Python, Java, C++, and SQL.
3. Placement & Career Preparation: Technical interview Q&A, coding problem strategies, resume reviews, behavioral HR questions, and aptitude tips.
4. Study & Exam Guidance: Time management, exam stress tips, effective note-taking, and revision schedules.

Tone & Style:
- Modern, structured ChatGPT-like responses.
- Use clean Markdown formatting (bold headings, bullet points, clean code blocks with syntax highlighting).
- Be supportive, clear, and beginner-friendly suitable for college students.`;

let db: Database;

async function initDB() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Chats Table
  db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      response TEXT NOT NULL,
      category TEXT DEFAULT 'General FAQ',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed default admin and student users if empty
  const userCount = db.exec("SELECT COUNT(*) FROM users")[0].values[0][0] as number;
  if (userCount === 0) {
    db.run("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)", [
      "admin", "admin@campusgpt.edu", "admin123", "admin"
    ]);
    db.run("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)", [
      "student", "alex@campusgpt.edu", "password123", "student"
    ]);
    
    // Seed initial welcome chat
    db.run("INSERT INTO chats (user_id, message, response, category) VALUES (?, ?, ?, ?)", [
      2,
      "What can CampusGPT help me with?",
      "Welcome to **CampusGPT**! 🎓\n\nI am your dedicated AI College Assistant. Here is what I can help you with:\n\n* **💻 CS & Programming:** Debug code, explain Data Structures, Algorithms, DBMS, & OS.\n* **💼 Placement Prep:** Technical interview questions, mock HR queries, and resume tips.\n* **📚 Exam & Timetable:** Study tips, time management, and timetable structuring.\n* **🏛️ General FAQs:** Campus life, project guidance, and career advice.\n\nAsk me anything to get started!",
      "College Info"
    ]);
    saveDB();
  }
}

function saveDB() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to save SQLite DB to disk:', err);
  }
}

async function startServer() {
  await initDB();

  const app = express();
  app.use(express.json());

  // API Route: Register
  app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    try {
      db.run("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'student')", [
        username.trim(), email.trim().toLowerCase(), password
      ]);
      saveDB();
      const stmt = db.prepare("SELECT id, username, email, role, created_at FROM users WHERE email = ?");
      stmt.bind([email.trim().toLowerCase()]);
      stmt.step();
      const user = stmt.getAsObject();
      stmt.free();
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(400).json({ error: 'Username or email already registered.' });
    }
  });

  // API Route: Login
  app.post('/api/auth/login', (req, res) => {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email/Username and password are required.' });
    }
    const stmt = db.prepare("SELECT id, username, email, role, created_at FROM users WHERE (email = ? OR username = ?) AND password = ?");
    stmt.bind([emailOrUsername.trim().toLowerCase(), emailOrUsername.trim(), password]);
    if (stmt.step()) {
      const user = stmt.getAsObject();
      stmt.free();
      res.json({ success: true, user });
    } else {
      stmt.free();
      res.status(401).json({ error: 'Invalid username/email or password.' });
    }
  });

  // API Route: Get Chats for User
  app.get('/api/chats', (req, res) => {
    const userId = req.query.userId;
    const search = req.query.search ? String(req.query.search).toLowerCase() : '';
    
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter is required.' });
    }

    let query = "SELECT * FROM chats WHERE user_id = ?";
    const params: any[] = [Number(userId)];

    if (search) {
      query += " AND (LOWER(message) LIKE ? OR LOWER(response) LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY id ASC";

    const stmt = db.prepare(query);
    stmt.bind(params);
    const chats: any[] = [];
    while (stmt.step()) {
      chats.push(stmt.getAsObject());
    }
    stmt.free();
    res.json({ chats });
  });

  // API Route: Send Chat (Streaming SSE)
  app.post('/api/chat/stream', async (req, res) => {
    const { userId, message, category = 'General FAQ' } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Get past recent conversation history for context
      const stmt = db.prepare("SELECT message, response FROM chats WHERE user_id = ? ORDER BY id DESC LIMIT 5");
      stmt.bind([Number(userId)]);
      const historyRows: any[] = [];
      while (stmt.step()) {
        historyRows.unshift(stmt.getAsObject()); // restore chronological order
      }
      stmt.free();

      let historyContext = '';
      if (historyRows.length > 0) {
        historyContext = 'Recent conversation history:\n' + historyRows.map(h => `User: ${h.message}\nCampusGPT: ${h.response}`).join('\n\n') + '\n\n';
      }

      const fullPrompt = `${historyContext}Current User Query: ${message}`;

      const ai = getAI();
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.5-flash',
        contents: fullPrompt,
        config: {
          systemInstruction: CAMPUS_GPT_SYSTEM_PROMPT,
          temperature: 0.7,
        },
      });

      let fullResponse = '';
      for await (const chunk of responseStream) {
        const text = chunk.text || '';
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }

      // Save to Database
      db.run("INSERT INTO chats (user_id, message, response, category) VALUES (?, ?, ?, ?)", [
        Number(userId), message, fullResponse, category
      ]);
      saveDB();

      const lastId = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
      res.write(`data: ${JSON.stringify({ done: true, id: lastId, timestamp: new Date().toISOString() })}\n\n`);
      res.end();
    } catch (err: any) {
      console.error('Chat AI Error:', err);
      res.write(`data: ${JSON.stringify({ error: err.message || 'AI generation failed.' })}\n\n`);
      res.end();
    }
  });

  // API Route: Clear All Chats for User
  app.delete('/api/chats', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId is required.' });
    db.run("DELETE FROM chats WHERE user_id = ?", [Number(userId)]);
    saveDB();
    res.json({ success: true });
  });

  // API Route: Delete Specific Chat
  app.delete('/api/chats/:id', (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM chats WHERE id = ?", [Number(id)]);
    saveDB();
    res.json({ success: true });
  });

  // API Route: Admin Stats
  app.get('/api/admin/stats', (req, res) => {
    const totalUsers = db.exec("SELECT COUNT(*) FROM users")[0].values[0][0];
    const totalChats = db.exec("SELECT COUNT(*) FROM chats")[0].values[0][0];
    
    // Users list
    const uStmt = db.prepare("SELECT id, username, email, role, created_at FROM users ORDER BY id DESC");
    const users: any[] = [];
    while (uStmt.step()) users.push(uStmt.getAsObject());
    uStmt.free();

    // All chats list for moderation
    const cStmt = db.prepare(`
      SELECT chats.id, chats.message, chats.response, chats.category, chats.timestamp, users.username, users.email 
      FROM chats 
      JOIN users ON chats.user_id = users.id 
      ORDER BY chats.id DESC LIMIT 50
    `);
    const recentChats: any[] = [];
    while (cStmt.step()) recentChats.push(cStmt.getAsObject());
    cStmt.free();

    // Category distribution
    const catStmt = db.prepare("SELECT category, COUNT(*) as count FROM chats GROUP BY category");
    const categoryStats: any[] = [];
    while (catStmt.step()) categoryStats.push(catStmt.getAsObject());
    catStmt.free();

    res.json({
      totalUsers,
      totalChats,
      users,
      recentChats,
      categoryStats
    });
  });

  // API Route: Get Flask Deliverable Code
  app.get('/api/deliverables/python', (req, res) => {
    res.json({
      message: "Python Flask project files generated in /campusgpt directory."
    });
  });

  // Vite Middleware Setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CampusGPT Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
