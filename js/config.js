const CONFIG = {
    // URL del Web App de Google Apps Script
    scriptUrl: 'https://script.google.com/macros/s/AKfycbzdiaGgjtpCswNaXnm466GlzTmQIYdgkPBUYPRG2HBXVk7vS5-n9xXrUIIX1JXnxHEn/exec',

    // ID de la hoja de cálculo de Google
    spreadsheetId: '1XUqjJQI3dtZmwm7TYlwcHbbYBd81jszK',

    // Metadatos de la aplicación
    appName: 'SIBIM TZOMPANTEPEC',
    version: '1.2.6', // Versión actualizada
    lastUpdate: '2026-02-06',

    // Configuración de Escalabilidad
    settings: {
        maxRowsPerFetch: 5000,
        cacheExpiration: 300,
        enableGPS: true,
        debugMode: true       // Activado para diagnóstico
    },

    // Mapeo Real basado en tus capturas (A, B, C...)
    columnMap: {
        id: 'A',
        codigo: 'B',
        nombre: 'C',
        marca: 'D',
        modelo: 'E',
        serie: 'F', // Numero de Serie
        categoria: 'G',
        grupo: 'H',
        responsable: 'I',
        area: 'J',    // Area Asignada
        estado: 'K',
        departamento: 'L'
    },

    // Endpoint de Actualizaciones (Simulado)
    updateChannel: 'https://api.github.com/repos/user/sibim-updates/releases/latest'
};

// Logger Global para Mantenimiento
const Logger = {
    log: (msg, data = '') => CONFIG.settings.debugMode && console.log(`[SIBIM LOG]: ${msg}`, data),
    error: (msg, err) => console.error(`[SIBIM ERROR]: ${msg}`, err)
};
