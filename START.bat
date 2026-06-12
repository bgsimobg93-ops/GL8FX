@echo off
title GL8FX - Стартиране
color 0A

echo.
echo  ================================================
echo   GL8FX - Apex Balance Monitor
echo  ================================================
echo.

:: Проверка за Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ГРЕШКА] Node.js не е инсталиран!
    echo.
    echo  Изтеглете от: https://nodejs.org
    echo  Инсталирайте версия 18 или по-нова.
    echo.
    pause
    exit /b 1
)

echo  Node.js: OK
node -v

:: Инсталиране на пакети ако липсват
if not exist "node_modules" (
    echo.
    echo  Инсталиране на пакети (само при първо стартиране)...
    echo  Изчакайте...
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo  [ГРЕШКА] npm install се провали!
        pause
        exit /b 1
    )
)

echo.
echo  ================================================
echo   Стартиране на сървъра...
echo   Отворете браузъра на: http://localhost:3000
echo.
echo   Потребител: admin
echo   Парола:     gl8fx2024
echo.
echo   За спиране натиснете Ctrl + C
echo  ================================================
echo.

npm run dev
pause
