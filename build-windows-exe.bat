@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM =============================================================
REM Finova Windows EXE Builder
REM Builds React frontend, copies it into backend/public, then creates
REM release\Finova.exe using pkg.
REM =============================================================

cd /d "%~dp0"

echo.
echo =============================================================
echo  FINOVA - Windows EXE Builder
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
  pause
  exit /b 1
)

if not exist "backend\.env" (
  if exist "backend\.env.example" (
    echo Creating backend\.env from backend\.env.example ...
    copy "backend\.env.example" "backend\.env" >nul
  )
)

echo.
echo [1/5] Installing frontend dependencies...
cd /d "%~dp0frontend"
if not exist "node_modules" call npm install
if errorlevel 1 goto BUILD_ERROR

echo.
echo [2/5] Building frontend production files...
call npm run build
if errorlevel 1 goto BUILD_ERROR

echo.
echo [3/5] Copying frontend build into backend\public...
cd /d "%~dp0"
if exist "backend\public" rmdir /s /q "backend\public"
mkdir "backend\public"
xcopy "frontend\dist\*" "backend\public\" /E /I /Y >nul
if errorlevel 1 goto BUILD_ERROR

echo.
echo [4/5] Installing backend dependencies and pkg...
cd /d "%~dp0backend"
if not exist "node_modules" call npm install
call npm install --save-dev pkg
if errorlevel 1 goto BUILD_ERROR

echo.
echo [5/5] Creating Windows executable...
cd /d "%~dp0"
if not exist "release" mkdir "release"
cd /d "%~dp0backend"
call npx pkg . --targets node18-win-x64 --output "%~dp0release\Finova.exe"
if errorlevel 1 goto BUILD_ERROR

cd /d "%~dp0"
if exist "backend\.env" copy "backend\.env" "release\.env" >nul
(
  echo @echo off
  echo cd /d "%%~dp0"
  echo echo Starting Finova...
  echo echo Open http://localhost:3000 in your browser.
  echo echo MongoDB must be running locally, or release\.env must contain a MongoDB Atlas MONGODB_URI.
  echo echo.
  echo Finova.exe
  echo pause
) > "release\Start-Finova-EXE.bat"

echo.
echo =============================================================
echo  BUILD COMPLETE
echo =============================================================
echo EXE created: release\Finova.exe
echo Launcher:    release\Start-Finova-EXE.bat
echo.
echo To run the EXE version, start MongoDB first, then double-click:
echo release\Start-Finova-EXE.bat
echo.
pause
exit /b 0

:BUILD_ERROR
echo.
echo [ERROR] Build failed. Read the message above.
echo Common fixes:
echo - Run this from the project root folder.
echo - Install Node.js LTS.
echo - Delete node_modules and run the BAT again.
echo - Make sure your internet connection is active for npm install.
echo.
pause
exit /b 1
