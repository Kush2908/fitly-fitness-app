$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$pythonExe = "C:\Users\Lenovo\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if (-not (Test-Path $pythonExe)) {
    Write-Host "Bundled Python was not found." -ForegroundColor Red
    exit 1
}

Start-Process "http://127.0.0.1:8000"
& $pythonExe ".\server.py"
