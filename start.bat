
@echo off
REM MaterniTrack - Windows starter (PowerShell windows)
REM Runs migrations then opens two PowerShell windows: backend (Django) and frontend (Vite)

pushd "%~dp0"

REM Prefer virtualenv python if present (use absolute paths to avoid cwd issues)
if exist "%~dp0backend\.venv\Scripts\python.exe" (
  set "PYTHON=%~dp0backend\.venv\Scripts\python.exe"
) else if exist "%~dp0backend\venv\Scripts\python.exe" (
  set "PYTHON=%~dp0backend\venv\Scripts\python.exe"
) else (
  set "PYTHON=python"
)

REM Start Django backend: run migrations then runserver (PowerShell window)
start "MaterniTrack - Backend" powershell -NoExit -Command "Set-Location -Path '%~dp0backend'; & '%PYTHON%' manage.py migrate; & '%PYTHON%' manage.py runserver"

REM Start React frontend (PowerShell window)
start "MaterniTrack - Frontend" powershell -NoExit -Command "Set-Location -Path \"%~dp0frontend\"; npm run dev"

echo Started backend and frontend in new PowerShell windows.
popd
exit /b 0
