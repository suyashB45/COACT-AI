@echo off
echo Starting CoAct.AI Development Environment...
echo.

set PROJECT_ROOT=%~dp0
set PROJECT_ROOT=%PROJECT_ROOT:~0,-1%

:: Prepend local FFmpeg path to execution context
set PATH=C:\Users\suyas\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin;%PATH%

:: Start Python backend in a new window
start "CoAct.AI Backend (Python)" cmd /k "cd /d "%PROJECT_ROOT%\inter-ai-backend" && python app.py"

:: Wait a moment for backend to initialize
timeout /t 5 /nobreak >nul

:: Start frontend in a new window
start "CoAct.AI Frontend" cmd /k "cd /d "%PROJECT_ROOT%\inter-ai-frontend" && npm run dev"

echo.
echo Both servers are starting...
echo Backend (Python):  http://localhost:8000
echo Frontend:      http://localhost:3000
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul

:: Open browser
start http://localhost:3000

echo Done! Close this window when finished.
