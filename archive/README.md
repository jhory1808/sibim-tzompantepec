# SIBIM - Sistema Integral de Bienes Municipales

## ??? Descripción
Sistema de gestión de inventario para el Gobierno Municipal de Tzompantepec.

## ?? Instalación y Desarrollo

### Requisitos
- Node.js 14+ (opcional)
- Navegador moderno
- Cuenta Google Sheets (para integración)

### Desarrollo Local
\\\ash
# Clonar repositorio
git clone <url>

# Instalar dependencias (opcional)
npm install

# Iniciar servidor de desarrollo
npm start
# o
python -m http.server 8080
\\\

### Estructura del Proyecto
\\\
SIBIM/
+-- public/              # Archivos públicos
¦   +-- index.html      # Homepage (Landing)
¦   +-- 404.html        # Página de error
+-- src/                # Código fuente
¦   +-- pages/          # Páginas de la aplicación
¦   +-- js/             # JavaScript
¦   +-- css/            # Estilos
+-- assets/             # Recursos estáticos
¦   +-- icons/          # Iconos e imágenes
+-- config/             # Configuraciones
+-- backup/             # Backups originales
\\\

## ?? Credenciales de Prueba
- **Admin**: admin / admin123
- **Usuario**: user / user123

## ?? Despliegue

### Netlify
\\\ash
npm run deploy
# o
netlify deploy --prod
\\\

### Configuración
- URL Base: \/\
- Entrada: \public/index.html\
- Redirecciones: \config/redirects\

## ?? Soporte
- Departamento de Sistemas C2
- Municipalidad de Tzompantepec
- Email: sistemas@tzompantepec.gob.mx

## ?? Licencia
Propiedad del Ayuntamiento de Tzompantepec © 2024
