import http.server
import socketserver
import os

PORT = 8080

class SIBIMHandler(http.server.SimpleHTTPRequestHandler):
    
    def translate_path(self, path):
        # Convertir rutas limpias a archivos reales
        path = path.split('?')[0].split('#')[0]
        
        # Mapeo de rutas
        routes = {
            '/': '/public/index.html',
            '/login': '/src/pages/auth/login.html',
            '/auth/login': '/src/pages/auth/login.html',
            '/dashboard': '/src/pages/dashboard/app.html',
            '/app': '/src/pages/dashboard/app.html',
            '/admin': '/src/pages/dashboard/app.html',
        }
        
        if path in routes:
            file_path = routes[path]
            if os.path.exists('.' + file_path):
                return '.' + file_path
        
        # Para archivos estáticos
        static_prefixes = ['/public/', '/src/', '/assets/', '/config/']
        for prefix in static_prefixes:
            if path.startswith(prefix):
                return '.' + path
        
        # Si no existe, intentar servir como archivo estático
        if os.path.exists('.' + path):
            return '.' + path
        
        # Si no existe, servir index.html (SPA)
        return './public/index.html'
    
    def end_headers(self):
        # Headers para CORS y cache
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        http.server.SimpleHTTPRequestHandler.end_headers(self)

print(f'🚀 Servidor SIBIM iniciado en http://localhost:{PORT}')
print(f'📂 Directorio: {os.getcwd()}')
print()
print('🌐 Rutas disponibles:')
print('  • http://localhost:8080/           (Home)')
print('  • http://localhost:8080/login      (Login)')
print('  • http://localhost:8080/dashboard  (Dashboard)')
print('  • http://localhost:8080/public/    (Landing directa)')
print()
print('📊 Presiona Ctrl+C para detener')

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("", PORT), SIBIMHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\\n👋 Servidor detenido')
