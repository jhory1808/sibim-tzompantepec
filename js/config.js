const CONFIG = {
    // URL del Web App de Google Apps Script
    scriptUrl: 'https://script.google.com/macros/s/AKfycbwK7hGQ5mkugfeat4-rHWKNA8hLIMOQAHDTsCy7QyD05c2XwpVdoz33PtZ9hJcBCw7B/exec',

    // ID de la hoja de cálculo de Google
    spreadsheetId: '1XUqjJQI3dtZmwm7TYlwcHbbYBd81jszK',

    // Metadatos de la aplicación
    appName: 'SIBIM TZOMPANTEPEC',
    version: '1.3.0',
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
    error: (msg, err) => {
        console.error(`[SIBIM ERROR]: ${msg}`, err);
        if (err && (JSON.stringify(err).includes('getSheetByName') || (err.message && err.message.includes('getSheetByName')))) {
            alert("DIAGNÓSTICO CLOUD: El servidor indica que no encuentra una pestaña en tu Google Sheet. Por favor, asegúrate de que tu Spreadsheet tenga las pestañas: 'Inventario', 'Departamentos', 'Usuarios', 'Movimientos', 'Actualizaciones' y 'Configuración' con esos nombres exactos.");
        }
    }
};
