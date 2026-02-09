const CONFIG = {
    // URL del Web App de Google Apps Script
    scriptUrl: 'https://script.google.com/macros/s/AKfycbyEjHqqnu0SLJrgaxmM2pzxwDpL7QivTqGVXgnyas127v5irYQLvA1jKGHDLkKCASytRg/exec',

    // ID de la hoja de cálculo de Google
    spreadsheetId: '1sNOZaDhhkCMRcY2u038tlKHQXS02dSQD3jdTwcQD22Q',

    // Metadatos de la aplicación
    appName: 'SIBIM TZOMPANTEPEC',
    version: '1.5.3',
    lastUpdate: '2026-02-08 18:40',

    // Configuración de Escalabilidad
    settings: {
        maxRowsPerFetch: 5000,
        cacheExpiration: 300,
        enableGPS: true,
        debugMode: true       // Activado para diagnóstico
    },

    // Mapeo Real basado en captura de Inventario
    columnMap: {
        id: 'A',
        codigo: 'B',
        nombre: 'C',
        marca: 'D', // Header en hoja dice 'marco', pero asumimos Marca
        modelo: 'E',
        serie: 'F',
        grupo: 'G',
        departamento: 'H',
        responsable: 'I',
        area: 'J',
        proveedor: 'K',
        valor: 'L',
        fecha_adquisicion: 'M',
        estado: 'N'
    },

    // Endpoint de Actualizaciones (Simulado)
    updateChannel: 'https://api.github.com/repos/user/sibim-updates/releases/latest'
};

// Logger Global para Mantenimiento
const Logger = {
    log: (msg, data = '') => CONFIG.settings.debugMode && console.log(`[SIBIM LOG]: ${msg}`, data),
    error: (msg, err) => {
        console.error(`[SIBIM ERROR]: ${msg}`, err);
        if (err && (JSON.stringify(err).includes('getSheetByName') || (err.message && err.message.includes('No se encontró la pestaña')))) {
            alert("✅ ¡CONEXIÓN ESTABLECIDA! Pero faltan hojas en tu Excel.\n\nEl sistema ya conecta, pero no encuentra las pestañas necesarias.\n\nPor favor, crea estas hojas vacías en tu Google Sheet:\n1. Usuarios\n2. Departamentos\n3. Movimientos\n4. Actualizaciones\n5. Configuracion\n\n(Respeta las mayúsculas)");
        }
    },
    warn: (msg, data = '') => CONFIG.settings.debugMode && console.warn(`[SIBIM WARN]: ${msg}`, data)
};
