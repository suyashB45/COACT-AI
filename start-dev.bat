@echo off
echo Starting CoAct.AI Development Environment...
echo.

set PROJECT_ROOT=%~dp0
set PROJECT_ROOT=%PROJECT_ROOT:~0,-1%

:: Prepend local FFmpeg path to execution context
set PATH=C:\Users\suyas\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin;%PATH%

:: Determine Python executable
if exist "%PROJECT_ROOT%\inter-ai-backend\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%PROJECT_ROOT%\inter-ai-backend\.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

:: Start Python backend in a new window
start "CoAct.AI Backend (FastAPI)" cmd /k "cd /d "%PROJECT_ROOT%\inter-ai-backend" && "%PYTHON_EXE%" app.py"

:: Wait a moment for backend to initialize
timeout /t 4 /nobreak >nul

:: Start frontend in a new window
start "CoAct.AI Frontend" cmd /k "cd /d "%PROJECT_ROOT%\inter-ai-frontend" && npm run dev"

echo.
echo Both servers are starting...
echo Backend (FastAPI): http://localhost:8000
echo Frontend (React):  http://localhost:3000
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul

:: Open browser
start http://localhost:3000

echo Done! Close the server windows when finished.
