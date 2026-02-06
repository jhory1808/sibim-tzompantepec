@echo off
echo ========================================
echo    SIBIM - Sistema de Inventario Municipal
echo    Servidor de Desarrollo
echo ========================================
echo.

REM Cambiar al directorio del proyecto
cd /d "%~dp0"

echo 📂 Directorio: %CD%
echo.

echo 🌐 Seleccione opción de servidor:
echo 1. Python (recomendado)
echo 2. PHP
echo 3. Node.js (live-server)
echo 4. Ver estructura de archivos
echo.
set /p choice="Opción [1-4]: "

if "%choice%"=="1" (
    echo.
    echo 🐍 Iniciando servidor Python...
    echo 🔗 URL: http://localhost:8080
    echo 📍 Rutas:
    echo    • http://localhost:8080/          (Home)
    echo    • http://localhost:8080/login     (Login)
    echo    • http://localhost:8080/dashboard (Dashboard)
    echo.
    echo Presiona Ctrl+C para detener
    echo.
    python server.py
) else if "%choice%"=="2" (
    echo.
    echo 🐘 Iniciando servidor PHP...
    php -S localhost:8080 router.php
) else if "%choice%"=="3" (
    echo.
    echo ⚡ Iniciando live-server...
    npx live-server --port=8080 --open=/
) else if "%choice%"=="4" (
    echo.
    echo 📁 ESTRUCTURA DE ARCHIVOS:
    echo.
    tree /f | more
    echo.
    pause
) else (
    echo Opción no válida
    pause
)
