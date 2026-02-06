// js/sibim-init.js - Inicialización de SIBIM con tus archivos existentes

async function inicializarSIBIM(userData) {
    console.log('🚀 Inicializando SIBIM para:', userData.nombre);
    
    try {
        // PASO 1: Cargar configuración
        const config = await cargarConfiguracionSIBIM();
        
        // PASO 2: Inicializar APIs según configuración
        await inicializarAPIs(config);
        
        // PASO 3: Cargar datos iniciales según rol
        await cargarDatosIniciales(userData.rol);
        
        // PASO 4: Configurar UI y eventos
        configurarUI();
        
        // PASO 5: Mostrar dashboard principal
        mostrarDashboardPrincipal();
        
        console.log('✅ SIBIM inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando SIBIM:', error);
        mostrarErrorSIBIM(error);
    }
}

async function cargarConfiguracionSIBIM() {
    // Si ya tienes una configuración global, úsala
    if (window.SIBIM_CONFIG) {
        console.log('✅ Usando configuración existente:', window.SIBIM_CONFIG);
        return window.SIBIM_CONFIG;
    }
    
    // Si no, carga la configuración desde tu archivo
    try {
        // Intenta cargar tu archivo de configuración
        const response = await fetch('./config/sibim-config.json');
        if (response.ok) {
            const config = await response.json();
            window.SIBIM_CONFIG = config;
            return config;
        }
    } catch (e) {
        console.log('📝 No se encontró config.json, usando valores por defecto');
    }
    
    // Configuración por defecto (usa tus valores reales)
    const configDefault = {
        api: {
            scriptUrl: "https://script.google.com/macros/s/AKfycbyWjh690W7ZCKQWvuQ-CvAy9nQCm3IxvSg7_pYYzVp3TcYTSLRGNPdymqJKm5_bG8KPnQ/exec",
            apiKey: "AIzaSyB8BTdVtQcHWzK693tFclmJbmJL1-qmTgk"
        },
        hojas: {
            inventario: "inventario",
            usuarios: "Usuarios",
            departamentos: "Departamentos"
        }
    };
    
    window.SIBIM_CONFIG = configDefault;
    return configDefault;
}

async function inicializarAPIs(config) {
    console.log('🔌 Inicializando APIs...');
    
    // Verificar qué APIs tienes disponibles
    if (typeof AppsScriptIntegration !== 'undefined') {
        // Usar tu clase AppsScriptIntegration
        window.sibimAPI = new AppsScriptIntegration(config);
        console.log('✅ AppsScriptIntegration inicializada');
    } else if (typeof GoogleSheetsIntegration !== 'undefined') {
        // Usar GoogleSheetsIntegration
        window.sibimAPI = new GoogleSheetsIntegration(config);
        console.log('✅ GoogleSheetsIntegration inicializada');
    } else {
        // Intentar cargar los scripts
        await cargarScript('./js/apps-script-integration.js');
        if (typeof AppsScriptIntegration !== 'undefined') {
            window.sibimAPI = new AppsScriptIntegration(config);
        } else {
            throw new Error('No se encontraron APIs de SIBIM');
        }
    }
    
    // Probar conexión
    const conexion = await window.sibimAPI.testConnection();
    if (!conexion.success) {
        throw new Error('Error de conexión: ' + conexion.message);
    }
    
    console.log('🔗 Conexión API exitosa');
    return window.sibimAPI;
}

async function cargarDatosIniciales(rol) {
    console.log('📥 Cargando datos para rol:', rol);
    
    // Datos que cargar según el rol
    const cargasNecesarias = {
        'Administrador': ['inventario', 'usuarios', 'departamentos', 'movimientos'],
        'Supervisor': ['inventario', 'departamentos'],
        'Usuario': ['inventario']
    };
    
    const modulosACargar = cargasNecesarias[rol] || ['inventario'];
    
    // Cargar cada módulo
    for (const modulo of modulosACargar) {
        try {
            const datos = await window.sibimAPI.getSheetData(modulo);
            window[`sibim_${modulo}`] = datos;
            console.log(`✅ ${modulo}: ${datos.length} registros`);
        } catch (error) {
            console.warn(`⚠️ Error cargando ${modulo}:`, error.message);
        }
    }
    
    // Guardar estadísticas
    if (window.sibimAPI.getStatistics) {
        window.sibimStats = await window.sibimAPI.getStatistics();
    }
}

function configurarUI() {
    console.log('🎨 Configurando interfaz...');
    
    // Aquí integras SIBIM con tu UI existente
    const dashboardContainer = document.getElementById('dashboard-content') || 
                              document.querySelector('.dashboard-content') ||
                              document.getElementById('content');
    
    if (dashboardContainer) {
        // Agregar el panel SIBIM a tu dashboard
        const panelSIBIM = crearPanelSIBIM();
        dashboardContainer.insertBefore(panelSIBIM, dashboardContainer.firstChild);
    }
    
    // Configurar eventos
    configurarEventosSIBIM();
}

function crearPanelSIBIM() {
    const panel = document.createElement('div');
    panel.className = 'sibim-panel';
    panel.innerHTML = `
        <div class="sibim-header">
            <h3><i class="fas fa-city"></i> Sistema de Inventario Municipal</h3>
            <div class="sibim-status" id="sibim-status">
                <span class="status-dot"></span>
                <span>Conectado</span>
            </div>
        </div>
        
        <div class="sibim-stats" id="sibim-stats">
            <!-- Se llenará con datos dinámicos -->
            <div class="loading">Cargando estadísticas...</div>
        </div>
        
        <div class="sibim-actions" id="sibim-actions">
            <!-- Acciones según permisos -->
        </div>
    `;
    
    return panel;
}

function configurarEventosSIBIM() {
    // Aquí configuras los eventos de tu interfaz SIBIM
    document.addEventListener('click', function(e) {
        if (e.target.closest('.sibim-action-btn')) {
            const action = e.target.closest('.sibim-action-btn').dataset.action;
            ejecutarAccionSIBIM(action);
        }
    });
}

async function mostrarDashboardPrincipal() {
    // Actualizar estadísticas en el panel
    if (window.sibimStats) {
        actualizarPanelEstadisticas();
    }
    
    // Mostrar acciones según permisos
    mostrarAccionesDisponibles();
    
    // Ocultar loader si existe
    const loader = document.getElementById('sibim-loader');
    if (loader) loader.style.display = 'none';
}

// Función para cargar scripts dinámicamente
function cargarScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Función de error
function mostrarErrorSIBIM(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'sibim-error';
    errorDiv.innerHTML = `
        <div class="error-content">
            <h4><i class="fas fa-exclamation-triangle"></i> Error en SIBIM</h4>
            <p>${error.message}</p>
            <button onclick="reintentarSIBIM()" class="btn-retry">
                <i class="fas fa-redo"></i> Reintentar
            </button>
        </div>
    `;
    
    const container = document.getElementById('dashboard-content') || document.body;
    container.appendChild(errorDiv);
}

window.reintentarSIBIM = function() {
    document.querySelector('.sibim-error')?.remove();
    const userData = JSON.parse(sessionStorage.getItem('sibim_user'));
    inicializarSIBIM(userData);
};

// Hacer disponible globalmente
window.inicializarSIBIM = inicializarSIBIM;