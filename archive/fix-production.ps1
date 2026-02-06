# Script para corregir problemas de rutas en producción
$folder = "C:\Users\ROMERO\Desktop\netfli"

Write-Host "=== CORRIGIENDO PROBLEMAS DE RUTAS ===" -ForegroundColor Red
Write-Host ""

# 1. Verificar que index.html esté en public/
Write-Host "1. VERIFICANDO PUBLIC/INDEX.HTML..." -ForegroundColor Green

$publicIndex = "$folder\public\index.html"
if (-not (Test-Path $publicIndex)) {
    Write-Host "   ❌ public/index.html NO EXISTE" -ForegroundColor Red
    
    # Buscar landing page
    $landingPages = Get-ChildItem -Path $folder -Filter "*landing*" -Include "*.html" -Recurse
    if ($landingPages) {
        Copy-Item $landingPages[0].FullName $publicIndex -Force
        Write-Host "   ✅ Copiado $($landingPages[0].Name) → public/index.html" -ForegroundColor Green
    } else {
        # Crear landing page básica
        $basicLanding = @"
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SIBIM | Sistema de Inventario Municipal</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #1a365d 0%, #2d6bcc 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .container { 
            padding: 40px; 
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            max-width: 800px;
        }
        .logo { 
            font-size: 4rem; 
            margin-bottom: 20px; 
        }
        .btn { 
            display: inline-block; 
            padding: 15px 30px; 
            background: white; 
            color: #1a365d; 
            text-decoration: none; 
            border-radius: 50px; 
            font-weight: bold; 
            margin: 20px 10px;
            transition: transform 0.3s;
        }
        .btn:hover { 
            transform: translateY(-3px); 
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🏛️</div>
        <h1>SIBIM Tzompantepec</h1>
        <p>Sistema Integral de Bienes Municipales</p>
        <p>Gobierno Municipal de Tzompantepec</p>
        
        <div style="margin: 40px 0;">
            <a href="/login" class="btn">🔐 Acceder al Sistema</a>
            <a href="/dashboard" class="btn">📊 Ir al Dashboard</a>
        </div>
        
        <div style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px;">
            <p><small>© 2024 Ayuntamiento de Tzompantepec - Departamento de Sistemas C2</small></p>
        </div>
    </div>
</body>
</html>
"@
        Set-Content -Path $publicIndex -Value $basicLanding
        Write-Host "   ✅ Landing page básica creada en public/index.html" -ForegroundColor Green
    }
} else {
    Write-Host "   ✅ public/index.html existe ($([math]::Round((Get-Item $publicIndex).Length/1KB, 2)) KB)" -ForegroundColor Green
}

# 2. Verificar estructura completa
Write-Host "`n2. VERIFICANDO ESTRUCTURA COMPLETA..." -ForegroundColor Green

$requiredPaths = @(
    "public\index.html",
    "public\404.html",
    "src\pages\auth\login.html", 
    "src\pages\dashboard\app.html",
    "src\js\app.js",
    "src\css\style.css",
    "assets\icons\icon-192x192.png",
    "assets\icons\icon-512x512.png",
    "config\manifest.json",
    "config\redirects"
)

foreach ($path in $requiredPaths) {
    $fullPath = Join-Path $folder $path
    if (Test-Path $fullPath) {
        Write-Host "   ✅ $path" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $path - NO ENCONTRADO" -ForegroundColor Red
        
        # Intentar encontrar archivo en otra ubicación
        $fileName = Split-Path $path -Leaf
        $found = Get-ChildItem -Path $folder -Filter $fileName -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            # Crear directorio destino
            $destDir = Split-Path $fullPath -Parent
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            
            Copy-Item $found.FullName $fullPath -Force
            Write-Host "     🔄 Copiado desde $($found.FullName.Replace($folder, ''))" -ForegroundColor Yellow
        }
    }
}

# 3. Crear archivo .htaccess para Apache/Netlify
Write-Host "`n3. CONFIGURANDO REDIRECCIONES..." -ForegroundColor Green

$htaccessContent = @"
# SIBIM - Configuración de rutas
RewriteEngine On

# Redirigir raíz a landing page
RewriteRule ^$ /public/index.html [L]

# Rutas limpias (clean URLs)
RewriteRule ^login/?$ /src/pages/auth/login.html [L]
RewriteRule ^auth/login/?$ /src/pages/auth/login.html [L]
RewriteRule ^dashboard/?$ /src/pages/dashboard/app.html [L]
RewriteRule ^app/?$ /src/pages/dashboard/app.html [L]
RewriteRule ^admin/?$ /src/pages/dashboard/app.html [L]

# Assets - servir directamente
RewriteRule ^assets/(.*)$ /assets/$1 [L]
RewriteRule ^src/(.*)$ /src/$1 [L]
RewriteRule ^public/(.*)$ /public/$1 [L]
RewriteRule ^config/(.*)$ /config/$1 [L]

# Para SPA: redirigir todas las demás rutas a index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /public/index.html [L,QSA]

# Headers de caché
<FilesMatch "\.(html|htm)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
</FilesMatch>

<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|json)$">
    Header set Cache-Control "public, max-age=31536000"
</FilesMatch>
"@

Set-Content "$folder\.htaccess" -Value $htaccessContent
Write-Host "   ✅ .htaccess creado/actualizado" -ForegroundColor Green

# 4. Crear netlify.toml para despliegue
Write-Host "`n4. CONFIGURANDO NETLIFY..." -ForegroundColor Green

$netlifyToml = @"
[build]
  publish = "."
  command = "echo 'Build completo'"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/public/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "/src/*"
  [headers.values]
    Cache-Control = "public, max-age=86400"
"@

Set-Content "$folder\netlify.toml" -Value $netlifyToml
Write-Host "   ✅ netlify.toml creado" -ForegroundColor Green

# 5. Actualizar _redirects para Netlify
Write-Host "`n5. ACTUALIZANDO _REDIRECTS..." -ForegroundColor Green

$redirectsContent = @"
# Redirecciones SIBIM
/               /public/index.html    200
/login          /src/pages/auth/login.html    200
/auth/login     /src/pages/auth/login.html    200
/dashboard      /src/pages/dashboard/app.html    200
/app            /src/pages/dashboard/app.html    200
/admin          /src/pages/dashboard/app.html    200

# Assets
/assets/*       /assets/:splat    200
/src/*          /src/:splat       200
/public/*       /public/:splat    200

# SPA - Todas las demás rutas a index.html
/*              /public/index.html    200
"@

Set-Content "$folder\config\redirects" -Value $redirectsContent
Write-Host "   ✅ _redirects actualizado" -ForegroundColor Green

# 6. Crear script de inicio rápido
Write-Host "`n6. CREANDO SCRIPT DE INICIO RÁPIDO..." -ForegroundColor Green

$startScript = @"
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
"@

Set-Content "$folder\start.bat" -Value $startScript
Write-Host "   ✅ start.bat creado" -ForegroundColor Green

# 7. Crear router.php para servidor PHP
Write-Host "`n7. CREANDO ROUTER.PHP..." -ForegroundColor Green

$routerPhp = @"
<?php
/**
 * Router PHP para SIBIM
 * Maneja rutas limpias para Single Page Application
 */

\$request = \$_SERVER['REQUEST_URI'];
\$base_path = '/';

// Remover query string
if (strpos(\$request, '?') !== false) {
    \$request = strstr(\$request, '?', true);
}

// Definir rutas
\$routes = [
    '/' => 'public/index.html',
    '/login' => 'src/pages/auth/login.html',
    '/auth/login' => 'src/pages/auth/login.html',
    '/dashboard' => 'src/pages/dashboard/app.html',
    '/app' => 'src/pages/dashboard/app.html',
    '/admin' => 'src/pages/dashboard/app.html',
    '/404' => 'public/404.html',
];

// Verificar si es una ruta definida
if (isset(\$routes[\$request])) {
    \$file = \$routes[\$request];
    
    if (file_exists(\$file)) {
        // Servir el archivo HTML
        header('Content-Type: text/html; charset=utf-8');
        readfile(\$file);
        exit;
    }
}

// Verificar si es un archivo estático
\$static_paths = ['/assets/', '/src/', '/public/', '/config/'];
foreach (\$static_paths as \$path) {
    if (strpos(\$request, \$path) === 0) {
        if (file_exists('.' . \$request)) {
            // Servir archivo estático
            \$mime_types = [
                'html' => 'text/html',
                'css' => 'text/css',
                'js' => 'application/javascript',
                'json' => 'application/json',
                'png' => 'image/png',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'gif' => 'image/gif',
                'ico' => 'image/x-icon',
            ];
            
            \$ext = pathinfo(\$request, PATHINFO_EXTENSION);
            if (isset(\$mime_types[\$ext])) {
                header('Content-Type: ' . \$mime_types[\$ext]);
            }
            
            readfile('.' . \$request);
            exit;
        }
    }
}

// Redirigir a index.html para SPA
if (file_exists('public/index.html')) {
    header('Content-Type: text/html; charset=utf-8');
    readfile('public/index.html');
    exit;
}

// 404 Not Found
header("HTTP/1.0 404 Not Found");
echo "<h1>404 - Página no encontrada</h1>";
echo "<p>La página que buscas no existe.</p>";
echo "<p><a href='/'>Volver al inicio</a></p>";
?>
"@

Set-Content "$folder\router.php" -Value $routerPhp
Write-Host "   ✅ router.php creado" -ForegroundColor Green

# 8. Resumen final
Write-Host "`n=== VERIFICACIÓN FINAL ===" -ForegroundColor Cyan

Write-Host "`n📋 RUTAS DISPONIBLES:" -ForegroundColor Yellow
Write-Host "  • http://localhost:8080/              (Home/Landing)" -ForegroundColor White
Write-Host "  • http://localhost:8080/login         (Página de Login)" -ForegroundColor White
Write-Host "  • http://localhost:8080/dashboard     (Dashboard)" -ForegroundColor White
Write-Host "  • http://localhost:8080/404           (Página de error)" -ForegroundColor White

Write-Host "`n🚀 COMANDOS PARA INICIAR:" -ForegroundColor Yellow
Write-Host "  1. start.bat                         (Menú de opciones)" -ForegroundColor Gray
Write-Host "  2. python server.py                  (Servidor Python SPA)" -ForegroundColor Gray
Write-Host "  3. php -S localhost:8080 router.php  (Servidor PHP)" -ForegroundColor Gray

Write-Host "`n⚙️  ARCHIVOS DE CONFIGURACIÓN CREADOS:" -ForegroundColor Yellow
Write-Host "  • .htaccess          (Apache)" -ForegroundColor White
Write-Host "  • netlify.toml       (Netlify)" -ForegroundColor White
Write-Host "  • config/redirects   (_redirects)" -ForegroundColor White
Write-Host "  • router.php         (PHP router)" -ForegroundColor White
Write-Host "  • server.py          (Python SPA server)" -ForegroundColor White

Write-Host "`n🔧 PARA DESPLEGAR EN NETLIFY:" -ForegroundColor Green
Write-Host "  netlify deploy --prod" -ForegroundColor Gray

# 9. Crear prueba rápida
Write-Host "`n🧪 CREANDO PRUEBA RÁPIDA..." -ForegroundColor Green

$testHtml = @"
<!DOCTYPE html>
<html>
<head>
    <title>Prueba SIBIM</title>
    <style>
        body { font-family: Arial; padding: 20px; }
        .test-box { padding: 20px; margin: 10px; background: #f5f5f5; border-radius: 10px; }
        .btn { display: inline-block; padding: 10px 20px; margin: 5px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .success { color: green; }
        .error { color: red; }
    </style>
</head>
<body>
    <h1>🧪 Prueba de Rutas SIBIM</h1>
    
    <div class="test-box">
        <h2>Rutas principales:</h2>
        <a class="btn" href="/" target="_blank">🏠 / (Home)</a>
        <a class="btn" href="/login" target="_blank">🔐 /login</a>
        <a class="btn" href="/dashboard" target="_blank">📊 /dashboard</a>
    </div>
    
    <div class="test-box">
        <h2>Archivos estáticos:</h2>
        <a class="btn" href="/public/index.html" target="_blank">/public/index.html</a>
        <a class="btn" href="/src/pages/auth/login.html" target="_blank">/src/pages/auth/login.html</a>
        <a class="btn" href="/src/pages/dashboard/app.html" target="_blank">/src/pages/dashboard/app.html</a>
    </div>
    
    <div class="test-box">
        <h2>Assets:</h2>
        <a class="btn" href="/assets/icons/icon-192x192.png" target="_blank">Icono 192x192</a>
        <a class="btn" href="/config/manifest.json" target="_blank">Manifest JSON</a>
    </div>
    
    <script>
        // Prueba automática de rutas
        const routes = ['/', '/login', '/dashboard', '/public/index.html'];
        let results = {};
        
        async function testRoute(route) {
            try {
                const response = await fetch(route, {method: 'HEAD'});
                return response.ok;
            } catch {
                return false;
            }
        }
        
        async function runTests() {
            const resultsDiv = document.getElementById('results');
            for (const route of routes) {
                const success = await testRoute(route);
                results[route] = success;
                
                const status = success ? '✅' : '❌';
                resultsDiv.innerHTML += `<div>${status} ${route}</div>`;
            }
        }
        
        // Ejecutar pruebas después de cargar
        window.addEventListener('load', runTests);
    </script>
    
    <div class="test-box">
        <h2>Resultados de prueba:</h2>
        <div id="results"></div>
    </div>
</body>
</html>
"@

Set-Content "$folder\test-routes.html" -Value $testHtml
Write-Host "   ✅ test-routes.html creado" -ForegroundColor Green

Write-Host "`n🎯 PRUEBA RÁPIDA DISPONIBLE EN:" -ForegroundColor Cyan
Write-Host "  http://localhost:8080/test-routes.html" -ForegroundColor Yellow

Write-Host ""
Write-Host "=== LISTO PARA PROBAR ===" -ForegroundColor Green -BackgroundColor DarkBlue

Read-Host "`nPresiona Enter para finalizar"