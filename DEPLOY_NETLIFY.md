# 🚀 Guía de Despliegue en Netlify - SIBIM Tzompantepec

## ✅ Paso 1: Preparación (COMPLETADO)
- ✓ Código subido a GitHub: https://github.com/jhory1808/sibim-tzompantepec
- ✓ Archivo `netlify.toml` configurado
- ✓ Archivo `_redirects` creado
- ✓ Configuración de cache y headers de seguridad

## 📋 Paso 2: Conectar con Netlify

### Opción A: Despliegue Automático desde GitHub (RECOMENDADO)

1. **Ir a Netlify**
   - Visita: https://app.netlify.com/
   - Inicia sesión con tu cuenta (o crea una nueva)

2. **Importar desde GitHub**
   - Click en "Add new site" → "Import an existing project"
   - Selecciona "Deploy with GitHub"
   - Autoriza a Netlify para acceder a tus repositorios
   - Busca y selecciona: `jhory1808/sibim-tzompantepec`

3. **Configurar el Build**
   ```
   Build command: (dejar vacío)
   Publish directory: .
   ```
   
4. **Variables de Entorno (Opcional)**
   - No son necesarias para este proyecto
   - El script de Google Apps ya está configurado en el código

5. **Deploy!**
   - Click en "Deploy site"
   - Espera 1-2 minutos mientras Netlify despliega tu sitio

### Opción B: Despliegue Manual (Alternativa)

1. **Ir a Netlify**
   - Visita: https://app.netlify.com/drop

2. **Arrastrar carpeta**
   - Arrastra la carpeta completa del proyecto
   - Netlify subirá y desplegará automáticamente

## 🔧 Paso 3: Configuración Post-Despliegue

### Configurar Dominio Personalizado (Opcional)
1. En el dashboard de Netlify, ve a "Domain settings"
2. Click en "Add custom domain"
3. Sigue las instrucciones para configurar tu dominio

### Configurar HTTPS
- Netlify habilita HTTPS automáticamente
- Espera unos minutos para que se genere el certificado SSL

### Configurar Nombre del Sitio
1. Ve a "Site settings" → "General"
2. Click en "Change site name"
3. Elige un nombre como: `sibim-tzompantepec`
4. Tu URL será: `https://sibim-tzompantepec.netlify.app`

## 📊 Paso 4: Verificación

### Checklist de Verificación:
- [ ] El sitio carga correctamente
- [ ] La página de login funciona
- [ ] Las gráficas del dashboard se muestran
- [ ] Los reportes se generan correctamente
- [ ] Las etiquetas se pueden crear e imprimir
- [ ] El escáner QR funciona
- [ ] La conexión con Google Sheets funciona

### URLs a Probar:
```
https://tu-sitio.netlify.app/
https://tu-sitio.netlify.app/pages/inventory.html
https://tu-sitio.netlify.app/pages/reports.html
https://tu-sitio.netlify.app/pages/movements.html
```

## 🔄 Paso 5: Actualizaciones Futuras

### Despliegue Automático Configurado:
- Cada vez que hagas `git push` a la rama `main`
- Netlify detectará los cambios automáticamente
- Desplegará la nueva versión en 1-2 minutos

### Comando para actualizar:
```bash
git add .
git commit -m "descripción de cambios"
git push origin main
```

## 🎯 Configuración Avanzada (Opcional)

### Build Hooks
1. Ve a "Site settings" → "Build & deploy" → "Build hooks"
2. Crea un webhook para despliegues manuales
3. Úsalo para desplegar sin hacer push a GitHub

### Notificaciones
1. Ve a "Site settings" → "Build & deploy" → "Deploy notifications"
2. Configura notificaciones por email o Slack

### Variables de Entorno
Si necesitas cambiar el URL del Google Apps Script:
1. Ve a "Site settings" → "Environment variables"
2. Agrega: `VITE_SCRIPT_URL` con el nuevo URL
3. Actualiza `js/config.js` para usar esta variable

## 📱 PWA en Netlify

Tu aplicación ya está configurada como PWA:
- ✓ Service Worker configurado
- ✓ Manifest.json presente
- ✓ Iconos configurados
- ✓ Funciona offline

## 🔒 Seguridad

Headers de seguridad ya configurados en `netlify.toml`:
- ✓ X-Frame-Options: DENY
- ✓ X-XSS-Protection
- ✓ X-Content-Type-Options
- ✓ Referrer-Policy
- ✓ Permissions-Policy

## 📈 Monitoreo

### Analytics de Netlify (Opcional - Plan Pago)
- Visitas y páginas vistas
- Rendimiento del sitio
- Errores 404

### Google Analytics (Gratis)
Para agregar Google Analytics:
1. Crea una propiedad en Google Analytics
2. Agrega el código de seguimiento en `index.html`

## 🆘 Solución de Problemas

### El sitio no carga:
- Verifica que `netlify.toml` esté en la raíz
- Revisa los logs de build en Netlify

### Error 404 en rutas:
- Verifica que `_redirects` esté presente
- Asegúrate de que las redirecciones estén configuradas

### Google Sheets no funciona:
- Verifica que el script de Google Apps esté desplegado
- Confirma que los permisos sean "Anyone"
- Revisa la consola del navegador para errores

## 📞 Soporte

- Documentación Netlify: https://docs.netlify.com/
- Comunidad Netlify: https://answers.netlify.com/
- GitHub Issues: https://github.com/jhory1808/sibim-tzompantepec/issues

---

## 🎉 ¡Listo!

Tu aplicación SIBIM Tzompantepec v2.1.0 está lista para desplegarse en Netlify.

**Siguiente paso:** Ve a https://app.netlify.com/ y sigue el Paso 2 de esta guía.

**URL del Repositorio:** https://github.com/jhory1808/sibim-tzompantepec
**Versión:** 2.1.0
**Última actualización:** 2026-02-12
