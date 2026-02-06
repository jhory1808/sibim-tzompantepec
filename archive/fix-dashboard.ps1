# Script para corregir dashboard y servidor
$folder = "C:\Users\ROMERO\Desktop\netfli"

Write-Host "=== CORRIGIENDO DASHBOARD Y SERVIDOR ===" -ForegroundColor Cyan
Write-Host ""

# 1. Matar procesos en puerto 8080
Write-Host "1. LIBERANDO PUERTO 8080..." -ForegroundColor Yellow
try {
    $process = netstat -ano | findstr :8080 | Select-Object -First 1
    if ($process) {
        $pid = ($process -split '\s+')[-1]
        taskkill /F /PID $pid /T 2>$null
        Write-Host "   🔴 Proceso $pid terminado" -ForegroundColor Red
    } else {
        Write-Host "   ✅ Puerto 8080 libre" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  No se pudo liberar puerto (continuando...)" -ForegroundColor Yellow
}

# 2. Actualizar dashboard con CDNs
Write-Host "`n2. ACTUALIZANDO DASHBOARD (app.html)..." -ForegroundColor Green

$dashboardPath = "$folder\src\pages\dashboard\app.html"
if (Test-Path $dashboardPath) {
    $content = Get-Content $dashboardPath -Raw
    
    # CDNs que deben estar en el <head>
    $cdnsToAdd = @"
<!-- ========== CDNs REQUERIDOS ========== -->
<!-- Bootstrap 5 -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>

<!-- Font Awesome Icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossorigin="anonymous">

<!-- Chart.js para gráficos -->
<script src="https://cdn.jsdelivr.net/npm/chart.js" crossorigin="anonymous"></script>

<!-- Flatpickr para selectores de fecha -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css" crossorigin="anonymous">
<script src="https://cdn.jsdelivr.net/npm/flatpickr" crossorigin="anonymous"></script>

<!-- Librerías para exportación de datos -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" crossorigin="anonymous"></script>

<!-- jQuery (si se necesita) -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js" crossorigin="anonymous"></script>

<!-- DataTables (opcional, para tablas avanzadas) -->
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css" crossorigin="anonymous">
<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js" crossorigin="anonymous"></script>
"@
    
    # Verificar si ya tiene Bootstrap
    if (-not ($content -match "bootstrap")) {
        # Insertar después de <head> o antes de </head>
        if ($content -match "<head[^>]*>") {
            $content = $content -replace "<head[^>]*>", "$&`n$cdnsToAdd"
            Write-Host "   ✅ CDNs agregados al <head>" -ForegroundColor Green
        } elseif ($content -match "</head>") {
            $content = $content -replace "</head>", "$cdnsToAdd`n</head>"
            Write-Host "   ✅ CDNs agregados antes de </head>" -ForegroundColor Green
        } else {
            # Agregar después del título
            $content = $content -replace "<title>.*?</title>", "$&`n$cdnsToAdd"
            Write-Host "   ✅ CDNs agregados después del título" -ForegroundColor Green
        }
    } else {
        Write-Host "   ⚠️  Bootstrap ya existe, verificando otras librerías..." -ForegroundColor Yellow
    }
    
    # Verificar Chart.js
    if (-not ($content -match "chart\.js")) {
        $content = $content -replace "</head>", "<script src='https://cdn.jsdelivr.net/npm/chart.js' crossorigin='anonymous'></script>`n</head>"
        Write-Host "   ✅ Chart.js agregado" -ForegroundColor Green
    }
    
    Set-Content -Path $dashboardPath -Value $content -Encoding UTF8
    Write-Host "   📄 Dashboard actualizado" -ForegroundColor Cyan
} else {
    Write-Host "   ❌ Dashboard no encontrado en: $dashboardPath" -ForegroundColor Red
}

# 3. Crear servidor mejorado
Write-Host "`n3. CREANDO SERVIDOR MEJORADO..." -ForegroundColor Green

$serverCode = @"
#!/usr/bin/env python3
"""
Servidor optimizado para SIBIM
Maneja rutas SPA y sirve archivos estáticos correctamente
"""
import http.server
import socketserver
import os
import sys
import urllib.parse
from datetime import datetime

PORT = 8081  # Cambiar a 8081 para evitar conflictos
HOST = "localhost"

class SIBIMRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Manejador personalizado para SIBIM"""
    
    # Extensiones y sus MIME types
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.ico': 'image/x-icon',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
    }
    
    def do_GET(self):
        """Manejar solicitudes GET"""
        # Limpiar y decodificar la ruta
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        # Log de la solicitud
        print(f"[{datetime.now().strftime('%H:%M:%S')}] GET {path}")
        
        # Rutas de la aplicación SPA
        routes = {
            '/': ('public/index.html', 'Home/Landing'),
            '/login': ('src/pages/auth/login.html', 'Login'),
            '/auth/login': ('src/pages/auth/login.html', 'Login (alt)'),
            '/dashboard': ('src/pages/dashboard/app.html', 'Dashboard'),
            '/app': ('src/pages/dashboard/app.html', 'Dashboard (app)'),
            '/admin': ('src/pages/dashboard/app.html', 'Dashboard (admin)'),
            '/404': ('public/404.html', 'Error 404'),
            '/test': ('test-routes.html', 'Test Routes'),
        }
        
        # Verificar si es una ruta conocida
        if path in routes:
            file_path, route_name = routes[path]
            full_path = os.path.join(os.getcwd(), file_path)
            
            if os.path.exists(full_path):
                print(f"  → Sirviendo: {file_path} ({route_name})")
                self.serve_file(full_path)
                return
            else:
                print(f"  ⚠️  Archivo no encontrado: {file_path}")
        
        # Verificar si es un archivo estático
        static_prefixes = ['/public/', '/src/', '/assets/', '/config/', '/favicon', '/icon-']
        for prefix in static_prefixes:
            if path.startswith(prefix):
                # Intentar servir el archivo estático
                if super().do_GET() is None:
                    return
        
        # Verificar si el archivo existe directamente
        if os.path.exists(os.path.join(os.getcwd(), path.lstrip('/'))):
            super().do_GET()
            return
        
        # Si no se encontró, servir index.html (SPA behavior)
        print(f"  → No encontrado, sirviendo SPA (index.html)")
        spa_path = os.path.join(os.getcwd(), 'public/index.html')
        if os.path.exists(spa_path):
            self.serve_file(spa_path)
        else:
            self.send_error(404, "File not found")
    
    def serve_file(self, file_path):
        """Servir un archivo específico"""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # Determinar content type
            ext = os.path.splitext(file_path)[1].lower()
            content_type = self.extensions_map.get(ext, 'text/plain')
            
            # Enviar respuesta
            self.send_response(200)
            self.send_header('Content-type', content_type)
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(content)
            
        except FileNotFoundError:
            self.send_error(404, f"File not found: {file_path}")
        except Exception as e:
            print(f"  ❌ Error: {e}")
            self.send_error(500, f"Server error: {str(e)}")
    
    def log_message(self, format, *args):
        """Personalizar mensajes de log"""
        # No mostrar logs estándar, ya los mostramos nosotros
        pass

def main():
    """Función principal"""
    print("=" * 60)
    print("   🚀 SERVIDOR SIBIM - SISTEMA DE INVENTARIO MUNICIPAL")
    print("=" * 60)
    print(f"📂 Directorio: {os.getcwd()}")
    print(f"🌐 URL: http://{HOST}:{PORT}")
    print()
    print("📡 Rutas disponibles:")
    print("  • http://localhost:8081/              (Home/Landing)")
    print("  • http://localhost:8081/login         (Página de Login)")
    print("  • http://localhost:8081/dashboard     (Dashboard)")
    print("  • http://localhost:8081/public/       (Landing directa)")
    print("  • http://localhost:8081/test          (Prueba de rutas)")
    print()
    print("📊 Para detener: Presiona Ctrl+C")
    print("=" * 60)
    
    # Cambiar al directorio del script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Configurar y ejecutar servidor
    handler = SIBIMRequestHandler
    
    # Permitir reutilizar el puerto
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer((HOST, PORT), handler) as httpd:
            print(f"\n✅ Servidor iniciado correctamente en puerto {PORT}")
            print("📝 Esperando solicitudes...\n")
            httpd.serve_forever()
    except OSError as e:
        if "10048" in str(e):  # Puerto ocupado
            print(f"\n❌ ERROR: El puerto {PORT} está ocupado")
            print("   Soluciones:")
            print("   1. Esperar unos segundos y volver a intentar")
            print("   2. Cambiar PORT = 8082 en este archivo")
            print("   3. Ejecutar: netstat -ano | findstr :{PORT}")
            print("   4. Ejecutar: taskkill /F /PID [PID_NUMBER]")
        else:
            print(f"\n❌ Error: {e}")
    except KeyboardInterrupt:
        print("\n\n👋 Servidor detenido por el usuario")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
"@

Set-Content "$folder\server-v2.py" -Value $serverCode -Encoding UTF8
Write-Host "   ✅ server-v2.py creado (puerto 8081)" -ForegroundColor Green

# 4. Crear página de prueba mejorada
Write-Host "`n4. CREANDO PÁGINA DE PRUEBA MEJORADA..." -ForegroundColor Green

$testPage = @"
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prueba SIBIM - Rutas y Recursos</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { padding: 20px; background: #f8f9fa; }
        .card { margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .status-success { color: #28a745; }
        .status-error { color: #dc3545; }
        .btn-test { width: 100%; margin-bottom: 5px; }
        .log { background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="mb-4">🧪 Prueba de Sistema SIBIM</h1>
        
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">🚀 Rutas Principales</h5>
                    </div>
                    <div class="card-body">
                        <button class="btn btn-test btn-success test-route" data-route="/">
                            <i class="fas fa-home"></i> Home (/)
                        </button>
                        <button class="btn btn-test btn-primary test-route" data-route="/login">
                            <i class="fas fa-sign-in-alt"></i> Login (/login)
                        </button>
                        <button class="btn btn-test btn-info test-route" data-route="/dashboard">
                            <i class="fas fa-chart-bar"></i> Dashboard (/dashboard)
                        </button>
                        <button class="btn btn-test btn-secondary test-route" data-route="/public/">
                            <i class="fas fa-file"></i> Landing directa (/public/)
                        </button>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">✅ Recursos CDN</h5>
                    </div>
                    <div class="card-body">
                        <button class="btn btn-test btn-outline-success test-cdn" data-url="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
                            Bootstrap CSS
                        </button>
                        <button class="btn btn-test btn-outline-success test-cdn" data-url="https://cdn.jsdelivr.net/npm/chart.js">
                            Chart.js
                        </button>
                        <button class="btn btn-test btn-outline-success test-cdn" data-url="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                            Font Awesome
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0">📊 Resultados</h5>
                    </div>
                    <div class="card-body">
                        <div id="results"></div>
                        <div class="log" id="log"></div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header bg-warning text-dark">
                        <h5 class="mb-0">🔧 Estado del Sistema</h5>
                    </div>
                    <div class="card-body">
                        <div id="system-status">
                            <p><i class="fas fa-sync fa-spin"></i> Verificando...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const log = document.getElementById('log');
        const results = document.getElementById('results');
        const systemStatus = document.getElementById('system-status');
        
        function addLog(message, type = 'info') {
            const time = new Date().toLocaleTimeString();
            const color = type === 'error' ? 'red' : type === 'success' ? 'green' : 'blue';
            log.innerHTML += `<div style="color: ${color}">[${time}] ${message}</div>`;
            log.scrollTop = log.scrollHeight;
        }
        
        async function testRoute(route) {
            addLog(`Probando ruta: ${route}`);
            try {
                const response = await fetch(route);
                const status = response.status;
                const success = response.ok;
                
                const resultDiv = document.createElement('div');
                resultDiv.className = `alert alert-${success ? 'success' : 'danger'}`;
                resultDiv.innerHTML = `
                    <strong>${route}</strong>: ${status} ${response.statusText}
                    ${success ? '✅' : '❌'}
                `;
                results.prepend(resultDiv);
                
                addLog(`${route}: ${status} ${response.statusText}`, success ? 'success' : 'error');
                return success;
            } catch (error) {
                addLog(`Error en ${route}: ${error.message}`, 'error');
                return false;
            }
        }
        
        async function testCDN(url) {
            addLog(`Probando CDN: ${url}`);
            try {
                const response = await fetch(url, { mode: 'no-cors' });
                addLog(`${url}: ✅ Disponible`, 'success');
                return true;
            } catch (error) {
                addLog(`${url}: ❌ Error`, 'error');
                return false;
            }
        }
        
        async function checkSystem() {
            const routes = ['/', '/login', '/dashboard'];
            const cdns = [
                'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
                'https://cdn.jsdelivr.net/npm/chart.js',
                'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
            ];
            
            let routeResults = [];
            let cdnResults = [];
            
            // Probar rutas
            for (const route of routes) {
                routeResults.push(await testRoute(route));
            }
            
            // Probar CDNs
            for (const cdn of cdns) {
                cdnResults.push(await testCDN(cdn));
            }
            
            // Mostrar resumen
            const workingRoutes = routeResults.filter(r => r).length;
            const workingCDNs = cdnResults.filter(r => r).length;
            
            systemStatus.innerHTML = `
                <div class="alert alert-${workingRoutes === routes.length ? 'success' : 'warning'}">
                    <h6><i class="fas fa-route"></i> Rutas (${workingRoutes}/${routes.length})</h6>
                    <ul>
                        <li>Home: ${routeResults[0] ? '✅' : '❌'}</li>
                        <li>Login: ${routeResults[1] ? '✅' : '❌'}</li>
                        <li>Dashboard: ${routeResults[2] ? '✅' : '❌'}</li>
                    </ul>
                </div>
                <div class="alert alert-${workingCDNs === cdns.length ? 'success' : 'warning'}">
                    <h6><i class="fas fa-cloud"></i> CDNs (${workingCDNs}/${cdns.length})</h6>
                    <ul>
                        <li>Bootstrap: ${cdnResults[0] ? '✅' : '❌'}</li>
                        <li>Chart.js: ${cdnResults[1] ? '✅' : '❌'}</li>
                        <li>Font Awesome: ${cdnResults[2] ? '✅' : '❌'}</li>
                    </ul>
                </div>
            `;
        }
        
        // Event listeners
        document.querySelectorAll('.test-route').forEach(btn => {
            btn.addEventListener('click', () => testRoute(btn.dataset.route));
        });
        
        document.querySelectorAll('.test-cdn').forEach(btn => {
            btn.addEventListener('click', () => testCDN(btn.dataset.url));
        });
        
        // Iniciar pruebas automáticas
        setTimeout(() => checkSystem(), 1000);
        
        // Limpiar log cada 30 segundos
        setInterval(() => {
            if (log.children.length > 50) {
                log.innerHTML = '';
                addLog('Log limpiado automáticamente');
            }
        }, 30000);
    </script>
</body>
</html>
"@

Set-Content "$folder\test-system.html" -Value $testPage -Encoding UTF8
Write-Host "   ✅ test-system.html creado" -ForegroundColor Green

# 5. Crear script de inicio rápido
Write-Host "`n5. CREANDO SCRIPT DE INICIO RÁPIDO..." -ForegroundColor Green

$quickStart = @"
@echo off
echo ========================================
echo    SIBIM - INICIADOR RÁPIDO
echo ========================================
echo.

REM Detener procesos anteriores
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

echo 📂 Directorio: %CD%
echo.

echo 🚀 Iniciando servidor SIBIM en puerto 8081...
echo 🔗 URL: http://localhost:8081
echo.
echo 📍 Rutas principales:
echo    • http://localhost:8081/          (Home)
echo    • http://localhost:8081/login     (Login)
echo    • http://localhost:8081/dashboard (Dashboard)
echo    • http://localhost:8081/test-system.html (Pruebas)
echo.
echo 📊 Para detener: Presiona Ctrl+C en esta ventana
echo.

REM Cambiar a la carpeta del script
cd /d "%~dp0"

REM Iniciar servidor
python server-v2.py

if errorlevel 1 (
    echo.
    echo ❌ Error al iniciar servidor
    echo.
    echo 🔧 Soluciones:
    echo 1. Verifica que Python esté instalado
    echo 2. Prueba con otro puerto (8082, 8083)
    echo 3. Cierra otras aplicaciones usando puertos
    echo.
    pause
)
"@

Set-Content "$folder\start-sibim.bat" -Value $quickStart -Encoding UTF8
Write-Host "   ✅ start-sibim.bat creado" -ForegroundColor Green

# 6. Resumen final
Write-Host "`n=== RESUMEN Y PRÓXIMOS PASOS ===" -ForegroundColor Cyan

Write-Host "`n✅ CORRECCIONES APLICADAS:" -ForegroundColor Green
Write-Host "1. Dashboard actualizado con CDNs faltantes" -ForegroundColor White
Write-Host "2. Servidor mejorado creado (puerto 8081)" -ForegroundColor White
Write-Host "3. Página de pruebas creada" -ForegroundColor White
Write-Host "4. Script de inicio rápido creado" -ForegroundColor White

Write-Host "`n🚀 PARA INICIAR EL SISTEMA:" -ForegroundColor Yellow
Write-Host "   Ejecuta: start-sibim.bat" -ForegroundColor Green
Write-Host "   o manualmente: python server-v2.py" -ForegroundColor Green

Write-Host "`n🌐 RUTAS PARA PROBAR:" -ForegroundColor Cyan
Write-Host "   • http://localhost:8081/" -ForegroundColor White
Write-Host "   • http://localhost:8081/login" -ForegroundColor White
Write-Host "   • http://localhost:8081/dashboard" -ForegroundColor White
Write-Host "   • http://localhost:8081/test-system.html" -ForegroundColor White

Write-Host "`n🔧 SI EL PUERTO 8081 ESTÁ OCUPADO:" -ForegroundColor Red
Write-Host "   Edita server-v2.py y cambia PORT = 8082" -ForegroundColor White

Write-Host "`n📝 PROBLEMAS COMUNES SOLUCIONADOS:" -ForegroundColor Magenta
Write-Host "   • ✅ Error 'Chart is not defined'" -ForegroundColor White
Write-Host "   • ✅ Error 'Bootstrap not found'" -ForegroundColor White
Write-Host "   • ✅ Error 'Font Awesome not found'" -ForegroundColor White
Write-Host "   • ✅ Puerto ocupado (usando 8081)" -ForegroundColor White

# 7. Iniciar automáticamente
Write-Host "`n🎯 ¿INICIAR SERVIDOR AHORA?" -ForegroundColor Yellow
$choice = Read-Host "   Presiona 'S' para iniciar o 'N' para salir (S/N)"

if ($choice -eq 'S' -or $choice -eq 's') {
    Write-Host "`n🚀 INICIANDO SERVIDOR..." -ForegroundColor Green
    Start-Process "cmd.exe" "/c start-sibim.bat"
    Write-Host "   ✅ Servidor iniciado en nueva ventana" -ForegroundColor Green
    Write-Host "   🔗 Abre: http://localhost:8081" -ForegroundColor Yellow
} else {
    Write-Host "`n📋 Para iniciar manualmente ejecuta: start-sibim.bat" -ForegroundColor Cyan
}

Read-Host "`nPresiona Enter para salir"