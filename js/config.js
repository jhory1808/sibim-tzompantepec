const CONFIG = {
    // URL del Web App de Google Apps Script
    scriptUrl: 'https://script.google.com/macros/s/AKfycbzXi44Oy0xc-qF6yZA_nHoRd0iJ9_5eXID7MI-Z_Lv0yUO3czOgFX0KtgyHN_bgMXhM/exec',

    // ID de la hoja de cálculo de Google
    spreadsheetId: '1sNOZaDhhkCMRcY2u038tlKHQXS02dSQD3jdTwcQD22Q',

    // Metadatos de la aplicación
    appName: 'SIBIM TZOMPANTEPEC',
    version: '1.3.8',
    lastUpdate: '2026-02-06 16:40',

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
            alert("DIAGNÓSTICO CLOUD: El servidor indica que no encuentra una pestaña en tu Google Sheet. Por favor, asegúrate de que tu Spreadsheet tenga las pestañas: 'Inventario', 'Usuarios', 'Departamentos', 'Movimientos', 'Actualizaciones' y 'Configuracion' (exactamente con esos nombres).");
        }
    },
    warn: (msg, data = '') => CONFIG.settings.debugMode && console.warn(`[SIBIM WARN]: ${msg}`, data)
};
