@echo off
setlocal
cd /d "%~dp0"

set "PYTHON_EXE=C:\Users\Lenovo\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if not exist "%PYTHON_EXE%" (
  echo Bundled Python was not found.
  echo Please run server.py manually with Python installed on your machine.
  pause
  exit /b 1
)

start "" http://127.0.0.1:8000
echo Starting Fitly...
"%PYTHON_EXE%" server.py

endlocal
