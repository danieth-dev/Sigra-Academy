@echo off
REM Simple helper to start backend on Windows. Keeps window open on error.
cd /d %~dp0\backend
echo Starting backend in %CD%
pnpm run dev || (
  echo pnpm start failed or pnpm not found. Falling back to node app.mjs
  node app.mjs
)
if %ERRORLEVEL% neq 0 pause
