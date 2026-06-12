@echo off
chcp 65001 >nul
title GL8FX

echo.
echo  ================================
echo   GL8FX - Apex Balance Monitor
echo  ================================
echo.
echo  Node.js version:
node -v
echo.

if not exist "node_modules\" (
    echo  Installing packages...
    npm install
)

echo.
echo  ================================
echo   Server: http://localhost:3000
echo   User:   admin
echo   Pass:   gl8fx2024
echo  ================================
echo.

npm run dev
pause
