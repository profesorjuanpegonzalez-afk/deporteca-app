$ErrorActionPreference = 'Stop'

$pythonExe = Join-Path $PSScriptRoot '..\.venv\Scripts\python.exe'
$ruffExe = Join-Path $PSScriptRoot '..\.venv\Scripts\ruff.exe'

if (-not (Test-Path $pythonExe)) {
    throw "No se encontró Python del entorno virtual en .venv\Scripts\python.exe"
}

& $pythonExe (Join-Path $PSScriptRoot '..\manage.py') check

if (-not (Test-Path $ruffExe)) {
    throw "Ruff no está instalado en .venv. Instálalo con: .venv\Scripts\pip install ruff"
}

& $ruffExe check (Join-Path $PSScriptRoot '..')
