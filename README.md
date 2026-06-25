HEAD
# Fitly

Fitly is a local full-stack fitness tracking app inspired by products like Google Fit and Cult Fitness.

## What it includes

- React-based multi-screen frontend
- Python backend API served from `server.py`
- SQLite persistence in `fitness.db`
- Account registration and login
- Daily recovery tracking for steps, sleep, water, and calories
- Workout logging and history
- Nutrition logging with macro breakdown
- Goal management, streaks, coach score, and training plans

## Run locally

1. Open a terminal in this folder.
2. Start the server:

```powershell
& 'C:\Users\Lenovo\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' .\server.py
```

3. Open [http://127.0.0.1:8000](http://127.0.0.1:8000)

## Easier launch options

- Double-click `run-fitly.bat`
- Or in PowerShell run:

```powershell
.\run-fitly.ps1
```

- To stop the app, press `Ctrl + C` in the terminal window running the server

## Frontend edits

The browser loads `web/app.compiled.js` so Fitly can start without online CDN transpilation. After editing `web/app.js`, rebuild it with:

```powershell
node .\build-frontend.js
```

## Project structure

- `server.py`: backend API and static file server
- `fitness.db`: SQLite database created on first run
- `web/index.html`: app entry page
- `web/app.js`: React UI logic
- `web/app.compiled.js`: browser-ready React UI
- `web/styles.css`: responsive styling
=======
# fitly-fitness-app
Full-stack fitness tracking application built with React, Node.js, Express, and SQLite.
 9abc96adba66f7b799b608a5a0dc57aaa1fecfa7
