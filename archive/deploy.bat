@echo off
echo =========================================
echo    DESPLIEGUE SIBIM - PRODUCCIÓN
echo =========================================
echo.

REM Verificar estructura
if not exist "public\index.html" (
    echo ? ERROR: No se encuentra public\index.html
    pause
    exit /b 1
)

if not exist "src\pages\dashboard\app.html" (
    echo ? ERROR: No se encuentra el dashboard
    pause
    exit /b 1
)

echo ? Estructura verificada correctamente
echo.

REM Opciones de despliegue
echo Seleccione plataforma de despliegue:
echo 1. Netlify
echo 2. Vercel
echo 3. GitHub Pages
echo 4. Servidor propio (FTP)
echo.
set /p choice="Opción [1-4]: "

if "%choice%"=="1" (
    echo.
    echo ?? Desplegando en Netlify...
    echo.
    if exist "config\netlify.toml" (
        netlify deploy --prod
    ) else (
        echo ??  Config Netlify no encontrada
        netlify init
    )
) else if "%choice%"=="2" (
    echo.
    echo ?? Desplegando en Vercel...
    vercel --prod
) else if "%choice%"=="3" (
    echo.
    echo ?? Desplegando en GitHub Pages...
    echo.
    echo 1. Subir a GitHub:
    echo    git add .
    echo    git commit -m "Deploy SIBIM"
    echo    git push origin main
    echo.
    echo 2. Configurar GitHub Pages en:
    echo    https://github.com/[usuario]/[repo]/settings/pages
    echo    Branch: main, Folder: / (root)
) else if "%choice%"=="4" (
    echo.
    echo ??  Despliegue FTP manual requerido
    echo.
    echo Carpeta a subir: %CD%
    echo.
    echo Archivos principales:
    echo   - public/
    echo   - src/
    echo   - assets/
    echo   - config/
    echo   - .htaccess
    echo   - index.html
) else (
    echo ? Opción no válida
)

echo.
echo ? Proceso completado
pause
