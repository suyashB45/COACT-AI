@echo off
echo Starting CoAct.AI Development Environment...
echo.

set PROJECT_ROOT=%~dp0
set PROJECT_ROOT=%PROJECT_ROOT:~0,-1%

:: Start Go backend in a new window
start "CoAct.AI Backend (Go)" cmd /k "cd /d "%PROJECT_ROOT%\inter-ai-backend-go" && go run ./cmd/server"

:: Wait a moment for backend to initialize
timeout /t 5 /nobreak >nul

:: Start frontend in a new window
start "CoAct.AI Frontend" cmd /k "cd /d "%PROJECT_ROOT%\inter-ai-frontend" && npm run dev"

echo.
echo Both servers are starting...
echo Backend (Go):  http://localhost:5000
echo Frontend:      http://localhost:3000
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul

:: Open browser
start http://localhost:3000

echo Done! Close this window when finished.
