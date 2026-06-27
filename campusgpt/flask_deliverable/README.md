# 🎓 CampusGPT - AI-powered College Assistant Chatbot

CampusGPT is an intelligent AI chatbot built to help college students with academic information, CS subjects, placement prep, timetable scheduling, and career guidance.

## 🚀 Tech Stack
- **Frontend**: HTML5, CSS3, Modern JavaScript (or React full-stack preview)
- **Backend**: Python Flask
- **AI Integration**: Google Gemini API (`@google/genai` / `google-genai` SDK)
- **Database**: SQLite (`database.db`)

---

## 🛠️ Deployment & Setup Instructions (Local / Render / Vercel)

### Step 1: Create Virtual Environment
Open your terminal inside the project directory:
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Set Gemini API Key
Create a `.env` file in the project root:
```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
```
*(You can get a free API key from [Google AI Studio](https://aistudio.google.com/))*

### Step 4: Initialize Database & Run Server
```bash
python app.py
```
Open your browser at: `http://localhost:5000`

---

## 🌐 Deploying to Render (Free Cloud Hosting)
1. Push this folder to a GitHub repository.
2. Sign up on [Render.com](https://render.com/) and click **New > Web Service**.
3. Connect your GitHub repository.
4. Set Build Command: `pip install -r requirements.txt`
5. Set Start Command: `gunicorn app:app`
6. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: *your API key*

---

## 🔑 Demo Credentials
- **Student Login**: `alex@campusgpt.edu` / `password123`
- **Admin Panel**: `admin@campusgpt.edu` / `admin123` (Username: `admin`)
