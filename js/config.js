const CONFIG = {
    // URL del Web App de Google Apps Script
    scriptUrl: 'https://script.google.com/macros/s/AKfycbyEjHqqnu0SLJrgaxmM2pzxwDpL7QivTqGVXgnyas127v5irYQLvA1jKGHDLkKCASytRg/exec',

    // ID de la hoja de cálculo de Google
    spreadsheetId: '1sNOZaDhhkCMRcY2u038tlKHQXS02dSQD3jdTwcQD22Q',

    // Metadatos de la aplicación
    appName: 'SIBIM TZOMPANTEPEC',
    version: '1.5.5',
    lastUpdate: '2026-02-08 18:55',

    // Configuración de Escalabilidad
    settings: {
        maxRowsPerFetch: 5000,
        cacheExpiration: 300,
        enableGPS: true,
        debugMode: true       // Activado para diagnóstico
    },

    // Mapeo Real basado en captura de Inventario (v1.5.4)
    columnMap: {
        id: 'A',
        codigo: 'B',
        nombre: 'C',
        marca: 'D',
        modelo: 'E',
        serie: 'F',      // Numero de Serie
        categoria: 'G',  // Nueva columna detectada
        grupo: 'H',
        departamento: 'I', // Desplazado por inserción de Categoria
        responsable: 'J',
        area: 'K',
        proveedor: 'L',
        valor: 'M',
        fecha_adquisicion: 'N',
        estado: 'O'      // Estimado basado en desplazamiento
    },

    // Endpoint de Actualizaciones (Simulado)
    updateChannel: 'https://api.github.com/repos/user/sibim-updates/releases/latest'
};

// Logger Global para Mantenimiento
const Logger = {
    log: (msg, data = '') => CONFIG.settings.debugMode && console.log(`[SIBIM LOG]: ${msg}`, data),
    error: (msg, err) => {
        console.error(`[SIBIM ERROR]: ${msg}`, err);
        // Alerta solo si es un error fatal de red o permisos
        if (msg.includes('Fallo crítico') || msg.includes('403')) {
            // Silencioso en producción, pero útil para depurar
        }
    },
    warn: (msg, data = '') => CONFIG.settings.debugMode && console.warn(`[SIBIM WARN]: ${msg}`, data)
};
