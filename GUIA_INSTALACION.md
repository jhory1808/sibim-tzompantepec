# Guía de Instalación y Acceso - SIBIM Tzompantepec Mobile

## 1. Generar Ejecutables (APKs)
Actualmente, los archivos ejecutables (`.apk` para Android o `.ipa` para iOS) **no existen** en la carpeta. Debes compilarlos usando software especializado.

### Para Android
1.  **Instala [Android Studio](https://developer.android.com/studio)**.
2.  Abre el programa y selecciona "Open Project".
3.  Navega a: `c:\Users\ROMERO\Desktop\netfli\capacitor-app\android`.
4.  Espera a que termine la sincronización (Gradle Sync).
5.  Ve a **Build > Build Bundle(s) / APK(s) > Build APK**.
6.  El archivo se guardará en `app/build/outputs/apk/debug/app-debug.apk`.
7.  Transfiere ese archivo a tu celular e instálalo.

***Nota:** Si hay errores de Java/Gradle, Android Studio los corregirá automáticamente al instalar el JDK adecuado.*

### Para iOS (iPhone/iPad)
*Requiere un Mac y Xcode obligatorio.*
Si no tienes Mac, usa la **Versión Web (PWA)** (ver abajo).

---

## 2. Acceso Inmediato (Modo Web / PWA)
No necesitas instalar nada para usar la app ahora mismo.

### En tu PC:
*   Abre este enlace: [http://localhost:8100](http://localhost:8100)

### En tu Celular (Misma red WiFi):
1.  Conecta tu celular a la misma red WiFi que esta PC.
2.  Abre Chrome (Android) o Safari (iOS).
3.  Ingresa: `http://<TU_IP_LOCAL>:8100`  *(Reemplaza <TU_IP_LOCAL> con tu dirección IP)*.
4.  **Tip:** En el navegador del celular, selecciona "Agregar a pantalla de inicio" para instalarla como App.

---

## 3. Credenciales de Acceso
Si no tienes usuario de nube configurado:
*   **Usuario:** `admin_local`
*   **Contraseña:** `C2_2024_2027`
