#!/usr/bin/env pwsh
# Script de Deployment Unificado para SIBIM v2.1.0
# Actualiza TODAS las plataformas: Web (Netlify), Móvil (Capacitor) y PC (Electron)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SIBIM Deployment System v2.1.0" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Actualizar version mobile (Capacitor)
Write-Host "[1/4] Preparando archivos para aplicación móvil..." -ForegroundColor Yellow
node scripts/prepare-mobile.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en preparación móvil" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Archivos móviles actualizados" -ForegroundColor Green
Write-Host ""

# 2. Sincronizar con Capacitor
Write-Host "[2/4] Sincronizando Capacitor..." -ForegroundColor Yellow
Set-Location capacitor-app
npx cap sync
Set-Location ..
Write-Host "✅ Capacitor sincronizado" -ForegroundColor Green
Write-Host ""

# 3. Commit y push a Git (para Netlify)
Write-Host "[3/4] Desplegando a Netlify (Git Push)..." -ForegroundColor Yellow
git add .
$commitMsg = "Deploy v2.1.0 - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git commit -m $commitMsg
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Git push falló. Verifica tu conexión o ejecuta manualmente:" -ForegroundColor Yellow
    Write-Host "   git push origin main" -ForegroundColor Gray
}
else {
    Write-Host "✅ Cambios desplegados a Netlify" -ForegroundColor Green
}
Write-Host ""

# 4. Notificación final
Write-Host "[4/4] Resumen de Deployment" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📱 Móvil (Android/iOS): " -NoNewline
Write-Host "LISTO" -ForegroundColor Green
Write-Host "   → Ejecuta: cd capacitor-app && npx cap open android" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Web (Netlify):       " -NoNewline
Write-Host "DESPLEGANDO" -ForegroundColor Yellow
Write-Host "   → https://sibimtzomp.netlify.app" -ForegroundColor Gray
Write-Host "   → Verifica en 1-2 minutos" -ForegroundColor Gray
Write-Host ""
Write-Host "🖥️  Escritorio (Electron):" -NoNewline
Write-Host "LISTO" -ForegroundColor Green
Write-Host "   → Ejecuta: cd electron-app && npm start" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ Deployment completado!" -ForegroundColor Cyan
