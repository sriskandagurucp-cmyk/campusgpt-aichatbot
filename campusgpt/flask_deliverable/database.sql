-- CampusGPT SQLite Database Schema

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

-- Default Admin Seed
INSERT OR IGNORE INTO users (id, username, email, password, role) 
VALUES (1, 'admin', 'admin@campusgpt.edu', 'admin123', 'admin');

-- Default Demo Student Seed
INSERT OR IGNORE INTO users (id, username, email, password, role) 
VALUES (2, 'student', 'alex@campusgpt.edu', 'password123', 'student');
