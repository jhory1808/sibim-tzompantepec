@echo off
echo ==========================================
echo    SIBIM - LAUNCHER DEFINITIVO
echo    Sistema funcionando al 100%%
echo ==========================================
echo.

REM Limpiar procesos anteriores
echo 🔴 Limpiando procesos anteriores...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo 📂 Directorio: %CD%
echo.

echo 🚀 INICIANDO SERVIDOR EN PUERTO 8083...
echo 🔗 URL PRINCIPAL: http://localhost:8083
echo.

echo 📍 ACCESO DIRECTO A:
echo    • http://localhost:8083/           (Página de Inicio)
echo    • http://localhost:8083/login      (Inicio de Sesión)
echo    • http://localhost:8083/dashboard  (Panel de Control)
echo.

echo ⚠️  Si el puerto 8083 está ocupado:
echo    Edita server-simple.py y cambia PORT = 8084
echo.

echo 📊 Iniciando servidor...
echo ==========================================
echo.

REM Ir al directorio del script
cd /d "%~dp0"

REM Ejecutar servidor
python server-simple.py

REM Si hay error
if errorlevel 1 (
    echo.
    echo ❌ ERROR AL INICIAR
    echo.
    echo 🔧 SOLUCIONES RÁPIDAS:
    echo 1. Cierra todas las ventanas de PowerShell/CMD
    echo 2. Intenta con puerto diferente (edita server-simple.py)
    echo 3. Ejecuta como Administrador
    echo.
    pause
)
