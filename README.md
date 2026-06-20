# BigQuery Release Notes Tracker

A sleek, responsive web application built with **Python Flask** and **Vanilla Web Technologies** (HTML5, CSS3, JavaScript) that parses Google Cloud's official BigQuery release notes feed and lets you share individual updates to Twitter (X) with a single click.

---

## ✨ Features

- **Automated RSS Fetching**: Connects directly to the official Google Cloud BigQuery release notes XML feed.
- **In-Memory Caching**: Caches the feed results for 60 seconds to prevent external rate limiting and speed up navigation.
- **Granular Update Selector**: Intelligently breaks down daily digests into individual, hover-interactive cards (bullet points/paragraphs) for precise reading and selection.
- **Integrated Tweet Composer**: Includes a draft preview, copy-to-clipboard shortcut, and character counter progress ring supporting Twitter's 280-character limit.
- **Modern UI Design**: Dark glassmorphic design featuring mesh background glows, custom scrollbars, and micro-interactive CSS transitions.

---

## 🛠️ Project Structure

```
bq-realeases-notes/
├── app.py                  # Flask server entry point & caching logic
├── requirements.txt        # Python package dependencies
├── templates/
│   └── index.html          # Webapp main HTML structure
└── static/
    ├── app.js              # Client-side feed parsing, state management, & Twitter composer logic
    └── style.css           # Custom glassmorphic styling and animations
```

---

## 🚀 Getting Started

### 📋 Prerequisites

Ensure you have **Python 3** installed on your local machine.

### ⚙️ Installation & Setup

1. **Activate the Virtual Environment**:
   - **PowerShell**:
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   - **Command Prompt (CMD)**:
     ```cmd
     .\.venv\Scripts\activate.bat
     ```
   - **Git Bash / Terminal**:
     ```bash
     source .venv/Scripts/activate
     ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Flask Web Server**:
   ```bash
   python app.py
   ```

4. **Open in Browser**:
   Navigate to [http://127.0.0.1:5000](http://127.0.0.1:5000) in your web browser.

---

## 🌐 Deploying & Version Control

This project is set up with a configured `.gitignore` and is ready for push. 

To push modifications to your repository:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```
