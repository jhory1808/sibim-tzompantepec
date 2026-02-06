const CONFIG = {
    // URL del Web App de Google Apps Script
    scriptUrl: 'https://script.google.com/macros/s/AKfycbwP6D8louKRDyQT4HbXH_dtd6PrD_ch1RstqK21Ciefx0q6u0vjX1kY51CiXE4cBZZf/exec',

    // ID de la hoja de cálculo de Google
    spreadsheetId: '1XUqjJQI3dtZmwm7TYlwcHbbYBd81jszK',

    // Metadatos de la aplicación
    appName: 'SIBIM TZOMPANTEPEC',
    version: '1.2.5', // Versión actual del sistema
    lastUpdate: '2026-02-06',

    // Configuración de Escalabilidad
    settings: {
        maxRowsPerFetch: 5000, // Límite preventivo para evitar lentitud
        cacheExpiration: 300,  // Segundos (5 min) para cache de datos estáticos
        enableGPS: true,       // Preparado para rastreo
        debugMode: false       // Cambiar a true para ver logs detallados
    },

    // Mapeo Dinámico (Preparado para si cambias columnas en el Excel)
    columnMap: {
        codigo: 'A',
        nombre: 'B',
        marca: 'C',
        modelo: 'D',
        serie: 'E',
        departamento: 'F',
        responsable: 'G',
        estado: 'H'
    },

    // Endpoint de Actualizaciones (Simulado)
    updateChannel: 'https://api.github.com/repos/user/sibim-updates/releases/latest'
};

// Logger Global para Mantenimiento
const Logger = {
    log: (msg, data = '') => CONFIG.settings.debugMode && console.log(`[SIBIM LOG]: ${msg}`, data),
    error: (msg, err) => console.error(`[SIBIM ERROR]: ${msg}`, err)
};
