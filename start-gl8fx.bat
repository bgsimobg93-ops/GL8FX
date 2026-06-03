@echo off
cd /d C:\Users\USER\GL8FX

echo Starting GL8FX...

start "GL8FX API" /min cmd /k "python -m uvicorn api.server:app --host 0.0.0.0 --port 8000"

timeout /t 4 /nobreak > nul

start "GL8FX Web" /min cmd /k "npm run dev"

timeout /t 6 /nobreak > nul

start http://localhost:3000/agents
