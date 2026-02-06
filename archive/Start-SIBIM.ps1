# SIBIM - Iniciador Automático
$folder = "C:\Users\ROMERO\Desktop\netfli"
cd $folder

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   SIBIM - SISTEMA DE INVENTARIO MUNICIPAL" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar y preparar archivos
Write-Host "1. 📁 PREPARANDO ARCHIVOS..." -ForegroundColor Green

$files = @{
    "dashboard.html" = "src\pages\dashboard\app.html"
    "login.html" = "src\pages\auth\login.html"
    "index.html" = "public\index.html"
}

foreach ($dest in $files.Keys) {
    $source = $files[$dest]
    if (-not (Test-Path $dest) -and (Test-Path $source)) {
        Copy-Item $source $dest -Force
        Write-Host "   ✅ $dest creado" -ForegroundColor Green
    } elseif (Test-Path $dest) {
        Write-Host "   📄 $dest ya existe" -ForegroundColor Cyan
    } else {
        Write-Host "   ⚠️  $source no encontrado" -ForegroundColor Yellow
    }
}

# 2. Verificar archivos HTML
Write-Host "`n2. 🔍 VERIFICANDO ARCHIVOS HTML..." -ForegroundColor Green

Get-ChildItem *.html | ForEach-Object {
    $size = [math]::Round($_.Length/1KB, 2)
    Write-Host "   📄 $($_.Name) ($size KB)" -ForegroundColor White
}

# 3. Detener servidores anteriores
Write-Host "`n3. 🔴 DETENIENDO SERVIDORES ANTERIORES..." -ForegroundColor Yellow

try {
    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "   ✅ Procesos Python detenidos" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  No hay procesos Python activos" -ForegroundColor Gray
}

# 4. Iniciar navegador automáticamente
Write-Host "`n4. 🌐 INICIANDO NAVEGADOR..." -ForegroundColor Green

$port = 8090
$url = "http://localhost:$port/"

Start-Process "chrome.exe" "http://localhost:$port/"
Start-Process "chrome.exe" "http://localhost:$port/dashboard.html"

Write-Host "   ✅ Navegador iniciado" -ForegroundColor Green

# 5. Iniciar servidor
Write-Host "`n5. 🚀 INICIANDO SERVIDOR WEB..." -ForegroundColor Cyan
Write-Host "   📂 Directorio: $(Get-Location)" -ForegroundColor White
Write-Host "   🌐 URL: $url" -ForegroundColor Yellow
Write-Host "   🎯 Puerto: $port" -ForegroundColor White
Write-Host ""
Write-Host "📍 ARCHIVOS DISPONIBLES:" -ForegroundColor Magenta
Write-Host "   • $url" -ForegroundColor White
Write-Host "   • ${url}index.html" -ForegroundColor White
Write-Host "   • ${url}login.html" -ForegroundColor White
Write-Host "   • ${url}dashboard.html" -ForegroundColor White
Write-Host ""
Write-Host "📊 Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
Write-Host "=========================================" -ForegroundColor Cyan

# 6. Ejecutar servidor
try {
    python -m http.server $port
} catch {
    Write-Host "`n❌ ERROR: Python no está instalado o no funciona" -ForegroundColor Red
    Write-Host "🔧 SOLUCIONES:" -ForegroundColor Yellow
    Write-Host "   1. Instala Python desde python.org" -ForegroundColor White
    Write-Host "   2. O ejecuta este comando alternativo:" -ForegroundColor White
    Write-Host "      powershell -Command ""Start-Process 'http://localhost:8090'""" -ForegroundColor Gray
    
    # Alternativa sin Python
    Write-Host "`n🎯 ABRIENDO ARCHIVOS DIRECTAMENTE..." -ForegroundColor Green
    if (Test-Path "dashboard.html") {
        Start-Process "dashboard.html"
    }
    if (Test-Path "login.html") {
        Start-Process "login.html"
    }
}

Read-Host "`nPresiona Enter para salir"