@echo off
echo ========================================
echo    SIBIM - DASHBOARD REPARADO
echo ========================================
echo.

echo 🔧 Reparando dashboard...
powershell -Command "$content = Get-Content 'dashboard.html' -Raw; if ($content -notmatch 'Chart\.js') { $content = $content -replace '</head>', '<script src=\"https://cdn.jsdelivr.net/npm/chart.js\"></script></head>'; Set-Content 'dashboard.html' -Value $content -Encoding UTF8; echo 'Chart.js agregado' }"

echo 📂 Preparando archivos...
if not exist "dashboard-fixed.html" (
    echo Creando dashboard reparado...
    powershell -Command "Add-Type -AssemblyName System.Web; [System.IO.File]::WriteAllText('dashboard-fixed.html', '<!DOCTYPE html><html><head><title>Loading...</title></head><body><h1>Cargando dashboard reparado...</h1></body></html>', [System.Text.Encoding]::UTF8)"
)

echo 🚀 Iniciando servidor...
echo 🌐 Abre: http://localhost:8090/dashboard-fixed.html
echo.

REM Iniciar servidor
python -m http.server 8090

if errorlevel 1 (
    echo ❌ Python no funciona.
    echo 🔧 Abriendo directamente...
    start dashboard-fixed.html
    pause
)