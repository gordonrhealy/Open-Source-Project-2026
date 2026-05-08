@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM =============================================================
REM Finova Universal Starter for Windows
REM Starts backend and frontend automatically.
REM =============================================================

cd /d "%~dp0"

echo.
echo =============================================================
echo  FINOVA - Universal Windows Start
echo =============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not added to PATH.
  echo Install Node.js LTS from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm is not installed or not added to PATH.
  echo Reinstall Node.js LTS and make sure npm is selected.
  pause
  exit /b 1
)

if not exist "backend" (
  echo [ERROR] backend folder was not found. Keep this BAT file in the project root.
  pause
  exit /b 1
)

if not exist "frontend" (
  echo [ERROR] frontend folder was not found. Keep this BAT file in the project root.
  pause
  exit /b 1
)

if not exist "backend\.env" (
  if exist "backend\.env.example" (
    echo Creating backend\.env from backend\.env.example ...
    copy "backend\.env.example" "backend\.env" >nul
  ) else (
    echo [WARNING] backend\.env and backend\.env.example were not found.
  )
)

echo Checking MongoDB service...
sc query MongoDB >nul 2>nul
if not errorlevel 1 (
  for /f "tokens=3" %%A in ('sc query MongoDB ^| findstr /I "STATE"') do set MONGO_STATE=%%A
  if /I not "!MONGO_STATE!"=="RUNNING" (
    echo MongoDB service exists but is not running. Trying to start it...
    net start MongoDB >nul 2>nul
  )
) else (
  echo [INFO] MongoDB Windows service was not detected.
  echo        Use MongoDB Atlas in backend\.env or install/start MongoDB locally.
)

echo.
echo Installing backend dependencies if needed...
cd /d "%~dp0backend"
if not exist "node_modules" (
  call npm install
  if errorlevel 1 (
    echo [ERROR] Backend dependency installation failed.
    pause
    exit /b 1
  )
) else (
  echo Backend node_modules already exists. Skipping npm install.
)

echo.
echo Installing frontend dependencies if needed...
cd /d "%~dp0frontend"
if not exist "node_modules" (
  call npm install
  if errorlevel 1 (
    echo [ERROR] Frontend dependency installation failed.
    pause
    exit /b 1
  )
) else (
  echo Frontend node_modules already exists. Skipping npm install.
)

cd /d "%~dp0"

echo.
echo Starting Finova backend and frontend...
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.

start "Finova Backend" cmd /k "cd /d "%~dp0backend" && npm start"
start "Finova Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 0.0.0.0"

timeout /t 3 >nul
start "" "http://localhost:5173"

echo Finova is starting in two separate terminal windows.
echo Close those windows or press Ctrl+C inside them to stop the app.
echo.
pause
