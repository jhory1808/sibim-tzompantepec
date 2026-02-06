#!/usr/bin/env python3
"""
Servidor ultra simple para SIBIM
SIN problemas de rutas, SIN complicaciones
"""
import http.server
import socketserver
import os

PORT = 8083  # Puerto diferente para evitar conflictos

class UltraSimpleHandler(http.server.SimpleHTTPRequestHandler):
    """Lo más simple posible"""
    
    def do_GET(self):
        # Mapeo DIRECTO sin lógica compleja
        simple_map = {
            '/': 'public/index.html',
            '/login': 'src/pages/auth/login.html',
            '/dashboard': 'src/pages/dashboard/app.html',
        }
        
        # Convertir ruta
        path = self.path.split('?')[0]
        
        if path in simple_map:
            self.path = '/' + simple_map[path]
            print(f"📁 {path} -> {self.path}")
        elif path.startswith(('/assets/', '/src/', '/public/', '/config/', '/favicon', '/icon-')):
            # Rutas de recursos, servirlas directamente
            print(f"📦 Recurso: {path}")
        else:
            # Cualquier otra cosa a index.html
            self.path = '/public/index.html'
            print(f"🔄 {path} -> /public/index.html (SPA)")
        
        # Servir el archivo normalmente
        return super().do_GET()

print(f"""
🚀 SERVIDOR SIBIM ULTRA SIMPLE
📂 Directorio: {os.getcwd()}
🌐 URL: http://localhost:{PORT}

📡 RUTAS DIRECTAS:
  • http://localhost:{PORT}/           (Home)
  • http://localhost:{PORT}/login      (Login)
  • http://localhost:{PORT}/dashboard  (Dashboard)

🔧 Servidor corriendo...
📊 Presiona Ctrl+C para detener
""")

# Cambiar al directorio del script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Permitir reuso de puerto
socketserver.TCPServer.allow_reuse_address = True

try:
    with socketserver.TCPServer(("", PORT), UltraSimpleHandler) as httpd:
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n👋 Servidor detenido")
except OSError as e:
    if "10048" in str(e):
        print(f"\n❌ Puerto {PORT} ocupado. Prueba:")
        print(f"   1. Cambia PORT = 8084 en este archivo")
        print(f"   2. O ejecuta: taskkill /F /IM python.exe")
    else:
        print(f"\n❌ Error: {e}")
