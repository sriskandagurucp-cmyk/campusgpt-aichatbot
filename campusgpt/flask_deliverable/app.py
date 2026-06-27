"""
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

@app.route("/api/admin/stats")
def admin_stats():
    conn = get_db_connection()
    total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    total_chats = conn.execute("SELECT COUNT(*) FROM chats").fetchone()[0]
    users = [dict(row) for row in conn.execute("SELECT id, username, email, role, created_at FROM users").fetchall()]
    chats = [dict(row) for row in conn.execute("SELECT * FROM chats ORDER BY id DESC LIMIT 50").fetchall()]
    conn.close()
    return jsonify({"totalUsers": total_users, "totalChats": total_chats, "users": users, "recentChats": chats})

if __name__ == "__main__":
    init_db()
    print("🎓 CampusGPT Flask Server running on http://localhost:5000")
    app.run(debug=True, port=5000)
