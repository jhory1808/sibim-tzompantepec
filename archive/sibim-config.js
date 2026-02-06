// js/sibim-config.js - Configuración principal de SIBIM
console.log('⚙️ Cargando configuración SIBIM...');

// CONFIGURACIÓN PRINCIPAL DE SIBIM
const SIBIM_CONFIG = {
    // Tu Apps Script API Endpoint
    scriptUrl: "https://script.google.com/macros/s/AKfycbyWjh690W7ZCKQWvuQ-CvAy9nQCm3IxvSg7_pYYzVp3TcYTSLRGNPdymqJKm5_bG8KPnQ/exec",
    
    // Tu API Key para Google Sheets API (opcional, para funcionalidades adicionales)
    apiKey: "AIzaSyB8BTdVtQcHWzK693tFclmJbmJL1-qmTgk",
    
    // Configuración de hojas de Google Sheets
    sheets: {
        inventario: "inventario",
        usuarios: "Usuarios",
        departamentos: "Departamentos",
        movimientos: "Movimientos",
        actualizaciones: "Actualizaciones",
        configuracion: "Configuracion"
    },
    
    // Configuración de la aplicación
    app: {
        name: "Sistema de Inventario Municipal",
        version: "1.0.0",
        fiscalYear: "2024",
        municipality: "Municipio",
        defaultUser: {
            name: "Maria Admin",
            role: "Administrador",
            avatar: "👤"
        }
    },
    
    // Configuración de caché (en milisegundos)
    cache: {
        inventory: 5 * 60 * 1000,      // 5 minutos
        users: 10 * 60 * 1000,         // 10 minutos
        departments: 15 * 60 * 1000,   // 15 minutos
        movements: 2 * 60 * 1000       // 2 minutos
    },
    
    // Configuración de UI
    ui: {
        theme: {
            primary: "#2196F3",
            secondary: "#4CAF50",
            accent: "#FF9800",
            danger: "#f44336",
            warning: "#FFC107",
            success: "#4CAF50"
        },
        language: "es",
        timezone: "America/Mexico_City"
    },
    
    // Configuración de notificaciones
    notifications: {
        enabled: true,
        duration: 5000,
        position: "top-right",
        sounds: false
    },
    
    // Configuración de reportes
    reports: {
        defaultFormat: "pdf",
        autoGenerate: false,
        saveLocation: "downloads"
    }
};

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.SIBIM_CONFIG = SIBIM_CONFIG;
    console.log('✅ Configuración SIBIM cargada:', {
        scriptUrl: SIBIM_CONFIG.scriptUrl,
        sheets: Object.keys(SIBIM_CONFIG.sheets),
        app: SIBIM_CONFIG.app.name
    });
}