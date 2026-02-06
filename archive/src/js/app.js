// ============================================
// SIBIM - Sistema de Inventario Municipal
// app.js - Archivo principal de JavaScript
// ============================================

// Configuración global de la aplicación
const APP_CONFIG = {
    APP_NAME: 'SIBIM',
    VERSION: '2.0.0',
    DEBUG: false,
    API_ENDPOINT: 'https://script.google.com/macros/s/AKfycbwYOUR_SCRIPT_ID/exec',
    SHEET_ID: 'TU_GOOGLE_SHEETS_ID',
    
    // Credenciales de demostración
    DEMO_USERS: {
        'admin': { 
            password: 'admin123', 
            name: 'Administrador Sistema',
            role: 'admin',
            email: 'admin@municipio.com'
        },
        'usuario': { 
            password: 'user123', 
            name: 'Juan Pérez',
            role: 'user',
            email: 'juan@municipio.com'
        },
        'capturista': { 
            password: 'capt123', 
            name: 'María García',
            role: 'capturista',
            email: 'maria@municipio.com'
        },
        'supervisor': { 
            password: 'sup123', 
            name: 'Carlos López',
            role: 'supervisor',
            email: 'carlos@municipio.com'
        },
        'reportes': { 
            password: 'rep123', 
            name: 'Ana Martínez',
            role: 'reportes',
            email: 'ana@municipio.com'
        }
    }
};

// ============================================
// SISTEMA DE AUTENTICACIÓN
// ============================================

class AuthService {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.token = null;
        this.init();
    }

    init() {
        // Intentar recuperar sesión del localStorage
        this.restoreSession();
    }

    login(username, password, role) {
        console.log('Intentando login:', { username, role });
        
        // Verificar credenciales de demostración
        const user = APP_CONFIG.DEMO_USERS[username];
        
        if (user && user.password === password && user.role === role) {
            this.currentUser = {
                id: Date.now(),
                username: username,
                name: user.name,
                role: user.role,
                email: user.email,
                avatarColor: this.getAvatarColor(user.role),
                loginTime: new Date().toISOString()
            };
            
            this.isAuthenticated = true;
            this.token = this.generateToken();
            
            // Guardar sesión
            this.saveSession();
            
            // Registrar en logs
            this.logActivity('login', `Usuario ${username} inició sesión`);
            
            return {
                success: true,
                user: this.currentUser,
                token: this.token
            };
        }
        
        // Si no coincide con usuarios demo, intentar con Google Sheets
        return this.validateWithGoogleSheets(username, password, role);
    }

    async validateWithGoogleSheets(username, password, role) {
        try {
            const response = await fetch(`${APP_CONFIG.API_ENDPOINT}?action=validateUser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    role: role
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.user) {
                this.currentUser = {
                    ...data.user,
                    avatarColor: this.getAvatarColor(data.user.role)
                };
                this.isAuthenticated = true;
                this.token = data.token;
                this.saveSession();
                
                return {
                    success: true,
                    user: this.currentUser,
                    token: this.token
                };
            }
            
            return {
                success: false,
                message: data.message || 'Credenciales incorrectas'
            };
            
        } catch (error) {
            console.error('Error en validación:', error);
            
            // Fallback a modo demo si hay error de conexión
            if (APP_CONFIG.DEBUG) {
                return {
                    success: false,
                    message: 'Error de conexión. Usa credenciales de demostración.'
                };
            }
            
            return {
                success: false,
                message: 'Error de conexión con el servidor'
            };
        }
    }

    logout() {
        this.logActivity('logout', `Usuario ${this.currentUser?.username} cerró sesión`);
        
        this.currentUser = null;
        this.isAuthenticated = false;
        this.token = null;
        
        // Limpiar localStorage
        localStorage.removeItem('sibim_user');
        localStorage.removeItem('sibim_token');
        localStorage.removeItem('sibim_session');
        
        // Redirigir al login
        window.location.href = 'index.html';
    }

    saveSession() {
        if (this.currentUser) {
            const sessionData = {
                user: this.currentUser,
                token: this.token,
                timestamp: new Date().getTime()
            };
            
            localStorage.setItem('sibim_user', JSON.stringify(this.currentUser));
            localStorage.setItem('sibim_token', this.token);
            localStorage.setItem('sibim_session', JSON.stringify(sessionData));
        }
    }

    restoreSession() {
        try {
            const userData = localStorage.getItem('sibim_user');
            const token = localStorage.getItem('sibim_token');
            const session = localStorage.getItem('sibim_session');
            
            if (userData && token && session) {
                const sessionObj = JSON.parse(session);
                const now = new Date().getTime();
                
                // Verificar si la sesión expiró (24 horas)
                if (now - sessionObj.timestamp < 24 * 60 * 60 * 1000) {
                    this.currentUser = JSON.parse(userData);
                    this.token = token;
                    this.isAuthenticated = true;
                    return true;
                } else {
                    // Sesión expirada
                    this.clearSession();
                }
            }
        } catch (error) {
            console.error('Error restaurando sesión:', error);
            this.clearSession();
        }
        
        return false;
    }

    clearSession() {
        localStorage.removeItem('sibim_user');
        localStorage.removeItem('sibim_token');
        localStorage.removeItem('sibim_session');
    }

    getAvatarColor(role) {
        const colors = {
            'admin': '#dc3545',
            'user': '#28a745',
            'capturista': '#17a2b8',
            'supervisor': '#ffc107',
            'reportes': '#6f42c1'
        };
        return colors[role] || '#1a5f7a';
    }

    generateToken() {
        return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    logActivity(action, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            user: this.currentUser?.username || 'unknown',
            action: action,
            details: details,
            ip: 'local' // En producción obtendrías la IP real
        };
        
        // Guardar en localStorage (en producción enviarías al servidor)
        const logs = JSON.parse(localStorage.getItem('sibim_activity_logs') || '[]');
        logs.push(logEntry);
        
        // Mantener solo los últimos 100 logs
        if (logs.length > 100) {
            logs.shift();
        }
        
        localStorage.setItem('sibim_activity_logs', JSON.stringify(logs));
        
        if (APP_CONFIG.DEBUG) {
            console.log('Activity Log:', logEntry);
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAdmin() {
        return this.currentUser?.role === 'admin';
    }

    hasPermission(permission) {
        const permissions = {
            'admin': ['all'],
            'user': ['read', 'export'],
            'capturista': ['create', 'read', 'update'],
            'supervisor': ['read', 'export', 'approve'],
            'reportes': ['read', 'export']
        };
        
        const userPermissions = permissions[this.currentUser?.role] || [];
        return userPermissions.includes('all') || userPermissions.includes(permission);
    }
}

// ============================================
// SERVICIO DE GOOGLE SHEETS
// ============================================

class GoogleSheetsService {
    constructor() {
        this.scriptUrl = APP_CONFIG.API_ENDPOINT;
        this.sheetId = APP_CONFIG.SHEET_ID;
        this.authToken = null;
    }

    setAuthToken(token) {
        this.authToken = token;
    }

    async callAPI(action, data = {}, method = 'POST') {
        try {
            const url = new URL(this.scriptUrl);
            url.searchParams.append('action', action);
            
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };
            
            if (this.authToken) {
                options.headers['Authorization'] = `Bearer ${this.authToken}`;
            }
            
            if (method === 'POST') {
                options.body = JSON.stringify(data);
            } else {
                // Para GET, agregar parámetros a la URL
                Object.keys(data).forEach(key => {
                    url.searchParams.append(key, data[key]);
                });
            }
            
            const response = await fetch(url.toString(), options);
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            return result;
            
        } catch (error) {
            console.error(`Error en API call (${action}):`, error);
            
            // Retornar datos de demostración si está en modo debug
            if (APP_CONFIG.DEBUG) {
                return this.getDemoData(action);
            }
            
            throw error;
        }
    }

    getDemoData(action) {
        console.log('Usando datos de demostración para:', action);
        
        const demoData = {
            'getInventory': {
                data: [
                    { id: 1, codigo: 'INV-001', nombre: 'Silla de Oficina', categoria: 'Mobiliario', stock: 25, minimo: 10, ubicacion: 'Almacén A', estado: 'activo' },
                    { id: 2, codigo: 'INV-002', nombre: 'Escritorio Ejecutivo', categoria: 'Mobiliario', stock: 15, minimo: 5, ubicacion: 'Almacén A', estado: 'activo' },
                    { id: 3, codigo: 'INV-003', nombre: 'Computadora Dell', categoria: 'Tecnología', stock: 8, minimo: 3, ubicacion: 'Almacén B', estado: 'activo' },
                    { id: 4, codigo: 'INV-004', nombre: 'Impresora HP', categoria: 'Tecnología', stock: 12, minimo: 5, ubicacion: 'Almacén B', estado: 'activo' },
                    { id: 5, codigo: 'INV-005', nombre: 'Toners Varios', categoria: 'Suministros', stock: 45, minimo: 20, ubicacion: 'Almacén C', estado: 'activo' }
                ],
                count: 5
            },
            'getUsers': {
                data: [
                    { id: 1, username: 'admin', nombre: 'Administrador', email: 'admin@municipio.com', rol: 'admin', estado: 'activo' },
                    { id: 2, username: 'jperez', nombre: 'Juan Pérez', email: 'juan@municipio.com', rol: 'user', estado: 'activo' },
                    { id: 3, username: 'mgarcia', nombre: 'María García', email: 'maria@municipio.com', rol: 'capturista', estado: 'activo' }
                ],
                count: 3
            },
            'getMovements': {
                data: [
                    { id: 1, fecha: '2024-01-15', tipo: 'entrada', articulo: 'Silla de Oficina', cantidad: 10, usuario: 'admin', motivo: 'Compra nueva' },
                    { id: 2, fecha: '2024-01-14', tipo: 'salida', articulo: 'Computadora Dell', cantidad: 2, usuario: 'jperez', motivo: 'Asignación departamento' },
                    { id: 3, fecha: '2024-01-13', tipo: 'entrada', articulo: 'Toners Varios', cantidad: 25, usuario: 'mgarcia', motivo: 'Reabastecimiento' }
                ],
                count: 3
            }
        };
        
        return demoData[action] || { data: [], count: 0, message: 'Acción no implementada en demo' };
    }

    // Métodos específicos para cada acción con manejo de errores
    async getInventory(filters = {}) {
        try {
            // Tu código actual de Google Sheets
            return await this.callAPI('getInventory', filters, 'GET');
        } catch (error) {
            console.error("Error Google Sheets:", error);
            
            // Usar datos locales
            const localData = loadLocalStorageData();
            if (localData && localData.inventory.length > 0) {
                console.log("Usando datos locales de respaldo");
                updateDashboardWithLocalData(localData);
                
                return {
                    success: true,
                    data: localData.inventory,
                    count: localData.inventory.length,
                    message: "Usando datos locales (modo offline)"
                };
            } else {
                console.log("Usando datos de demostración");
                return this.getDemoData('getInventory');
            }
        }
    }

    async addInventoryItem(itemData) {
        try {
            // Tu código actual de Google Sheets
            return await this.callAPI('addInventory', itemData);
        } catch (error) {
            console.error("Error Google Sheets:", error);
            
            // Guardar localmente
            const localData = loadLocalStorageData();
            const newItem = {
                id: Date.now(),
                ...itemData,
                fecha_registro: new Date().toISOString()
            };
            
            localData.inventory.push(newItem);
            saveLocalStorageData(localData);
            
            return {
                success: true,
                message: "Artículo guardado localmente (modo offline)",
                id: newItem.id
            };
        }
    }

    async updateInventoryItem(id, itemData) {
        try {
            // Tu código actual de Google Sheets
            return await this.callAPI('updateInventory', { id, ...itemData });
        } catch (error) {
            console.error("Error Google Sheets:", error);
            
            // Actualizar localmente
            const localData = loadLocalStorageData();
            const index = localData.inventory.findIndex(item => item.id == id);
            
            if (index !== -1) {
                localData.inventory[index] = {
                    ...localData.inventory[index],
                    ...itemData,
                    fecha_actualizacion: new Date().toISOString()
                };
                saveLocalStorageData(localData);
                
                return {
                    success: true,
                    message: "Artículo actualizado localmente (modo offline)"
                };
            }
            
            return {
                success: false,
                message: "Artículo no encontrado"
            };
        }
    }

    async deleteInventoryItem(id) {
        try {
            // Tu código actual de Google Sheets
            return await this.callAPI('deleteInventory', { id });
        } catch (error) {
            console.error("Error Google Sheets:", error);
            
            // Eliminar localmente
            const localData = loadLocalStorageData();
            const initialLength = localData.inventory.length;
            localData.inventory = localData.inventory.filter(item => item.id != id);
            
            if (localData.inventory.length < initialLength) {
                saveLocalStorageData(localData);
                return {
                    success: true,
                    message: "Artículo eliminado localmente (modo offline)"
                };
            }
            
            return {
                success: false,
                message: "Artículo no encontrado"
            };
        }
    }

    async getUsers() {
        try {
            // Tu código actual de Google Sheets
            return await this.callAPI('getUsers', {}, 'GET');
        } catch (error) {
            console.error("Error Google Sheets:", error);
            
            // Usar datos de demostración
            console.log("Usando datos de demostración para usuarios");
            return this.getDemoData('getUsers');
        }
    }

    async getMovements(dateRange = {}) {
        try {
            // Tu código actual de Google Sheets
            return await this.callAPI('getMovements', dateRange, 'GET');
        } catch (error) {
            console.error("Error Google Sheets:", error);
            
            // Usar datos de demostración
            console.log("Usando datos de demostración para movimientos");
            return this.getDemoData('getMovements');
        }
    }

    async exportToExcel(data, filename = 'inventario') {
        try {
            // Crear libro de Excel
            const wb = XLSX.utils.book_new();
            
            // Convertir datos a hoja de trabajo
            const ws = XLSX.utils.json_to_sheet(data);
            
            // Agregar hoja al libro
            XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
            
            // Generar archivo y descargar
            XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
            
            return { success: true, filename: `${filename}.xlsx` };
        } catch (error) {
            console.error('Error exportando a Excel:', error);
            throw error;
        }
    }
}

// ============================================
// SISTEMA DE NOTIFICACIONES
// ============================================

class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Crear contenedor si no existe
        if (!document.getElementById('notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notification-container');
        }
    }

    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${icons[type] || 'info-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        notification.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 1rem 1.5rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            border-left: 4px solid ${this.getTypeColor(type)};
            animation: slideInRight 0.3s ease;
            min-width: 300px;
        `;
        
        // Estilos para el contenido
        notification.querySelector('.notification-content').style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.75rem;
        `;
        
        notification.querySelector('i').style.cssText = `
            color: ${this.getTypeColor(type)};
            font-size: 1.2rem;
            flex-shrink: 0;
        `;
        
        notification.querySelector('span').style.cssText = `
            flex-grow: 1;
            font-size: 0.95rem;
            line-height: 1.4;
        `;
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: #6c757d;
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 4px;
            flex-shrink: 0;
        `;
        
        closeBtn.addEventListener('click', () => {
            this.hide(notification);
        });
        
        this.container.appendChild(notification);
        
        // Auto-remove después de la duración
        setTimeout(() => {
            this.hide(notification);
        }, duration);
        
        return notification;
    }

    hide(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    getTypeColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        return colors[type] || '#6c757d';
    }
}

// ============================================
// FUNCIONES DE ALMACENAMIENTO LOCAL
// ============================================

function loadLocalStorageData() {
    try {
        const savedData = localStorage.getItem('sibim_local_data');
        if (savedData) {
            const data = JSON.parse(savedData);
            return {
                inventory: data.inventory || [],
                users: data.users || [],
                movements: data.movements || [],
                lastSync: data.lastSync || null
            };
        }
    } catch (error) {
        console.error("Error cargando datos locales:", error);
    }
    
    // Datos por defecto
    return {
        inventory: [],
        users: [],
        movements: [],
        lastSync: null
    };
}

function saveLocalStorageData(data) {
    try {
        localStorage.setItem('sibim_local_data', JSON.stringify({
            ...data,
            lastSync: new Date().toISOString()
        }));
        return true;
    } catch (error) {
        console.error("Error guardando datos locales:", error);
        return false;
    }
}

function updateDashboardWithLocalData(localData) {
    // Actualizar el dashboard con datos locales
    if (localData.inventory.length > 0) {
        console.log("Actualizando dashboard con", localData.inventory.length, "elementos locales");
        
        // Actualizar estadísticas
        const stats = {
            totalItems: localData.inventory.length,
            lowStock: localData.inventory.filter(item => item.stock <= item.minimo).length,
            pendingOrders: 0, // Podrías calcular esto de localData.movements
            todayMovements: 0 // Podrías calcular esto de localData.movements
        };
        
        updateDashboardStats(stats);
    }
}

function useDemoData() {
    console.log("Usando datos de demostración");
    // Mostrar notificación al usuario
    if (notifications) {
        notifications.show("Usando datos de demostración (modo offline)", "warning");
    }
}

// ============================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ============================================

// Instancias globales
let authService = null;
let googleSheets = null;
let notifications = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('SIBIM - Inicializando aplicación...');
    
    // Inicializar servicios
    authService = new AuthService();
    googleSheets = new GoogleSheetsService();
    notifications = new NotificationSystem();
    
    // Verificar en qué página estamos
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('index.html') || currentPage === '/' || currentPage.endsWith('/')) {
        initLoginPage();
    } else if (currentPage.includes('app.html')) {
        initAppPage();
    } else {
        // Redirigir al login por defecto
        window.location.href = 'index.html';
    }
    
    // Agregar estilos CSS para animaciones
    addNotificationStyles();
    
    console.log('Aplicación inicializada correctamente');
});

// ============================================
// MANEJO DE PÁGINA DE LOGIN
// ============================================

function initLoginPage() {
    console.log('Inicializando página de login');
    
    // Si ya está autenticado, redirigir a la app
    if (authService.restoreSession()) {
        window.location.href = 'app.html';
        return;
    }
    
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const roleSelect = document.getElementById('role');
    
    // Configurar toggle de contraseña
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
    
    // Sugerencias de usuarios demo
    if (usernameInput && roleSelect) {
        usernameInput.addEventListener('input', function() {
            const username = this.value.toLowerCase();
            const user = APP_CONFIG.DEMO_USERS[username];
            
            if (user && roleSelect) {
                roleSelect.value = user.role;
                notifications.show(`Usuario demo detectado. Rol: ${user.role}`, 'info', 3000);
            }
        });
    }
    
    // Manejar envío del formulario
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = usernameInput?.value.trim();
            const password = passwordInput?.value;
            const role = roleSelect?.value;
            
            // Validaciones básicas
            if (!username || !password || !role) {
                notifications.show('Por favor complete todos los campos', 'error');
                return;
            }
            
            // Mostrar carga
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            submitBtn.disabled = true;
            
            try {
                // Intentar login
                const result = authService.login(username, password, role);
                
                if (result.success) {
                    notifications.show(`¡Bienvenido ${result.user.name}!`, 'success');
                    
                    // Configurar token para Google Sheets
                    googleSheets.setAuthToken(result.token);
                    
                    // Redirigir después de 1 segundo
                    setTimeout(() => {
                        window.location.href = 'app.html';
                    }, 1000);
                    
                } else {
                    notifications.show(result.message || 'Error en la autenticación', 'error');
                }
                
            } catch (error) {
                console.error('Error en login:', error);
                notifications.show('Error en el proceso de autenticación', 'error');
                
            } finally {
                // Restaurar botón
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Rellenar con credenciales demo para facilitar pruebas
    if (APP_CONFIG.DEBUG && usernameInput && passwordInput && roleSelect) {
        usernameInput.value = 'admin';
        passwordInput.value = 'admin123';
        roleSelect.value = 'admin';
    }
}

// ============================================
// MANEJO DE PÁGINA PRINCIPAL (APP)
// ============================================

function initAppPage() {
    console.log('Inicializando página principal de la app');
    
    // Verificar autenticación
    if (!authService.isAuthenticated && !authService.restoreSession()) {
        notifications.show('Sesión no válida. Redirigiendo al login...', 'warning');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // Configurar usuario actual en la interfaz
    updateUserInterface();
    
    // Configurar eventos
    setupEventListeners();
    
    // Cargar datos iniciales
    loadInitialData();
    
    // Registrar actividad
    authService.logActivity('app_access', 'Accedió a la aplicación principal');
}

function updateUserInterface() {
    const user = authService.getCurrentUser();
    
    if (!user) return;
    
    // Actualizar información del usuario en el header
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userNameElement) userNameElement.textContent = user.name;
    if (userRoleElement) userRoleElement.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    
    if (userAvatar) {
        // Crear iniciales para el avatar
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        userAvatar.textContent = initials;
        userAvatar.style.backgroundColor = user.avatarColor;
    }
    
    // Actualizar bienvenida en el dashboard
    const welcomeUserElement = document.querySelector('.user-welcome-info h4');
    if (welcomeUserElement) {
        welcomeUserElement.textContent = `¡Bienvenido, ${user.name}!`;
    }
    
    // Mostrar/ocultar elementos según permisos
    applyRoleBasedUI();
}

function applyRoleBasedUI() {
    const user = authService.getCurrentUser();
    
    if (!user) return;
    
    // Ocultar elementos según el rol
    const adminOnlyElements = document.querySelectorAll('[data-role="admin-only"]');
    const userOnlyElements = document.querySelectorAll('[data-role="user-only"]');
    const capturistaOnlyElements = document.querySelectorAll('[data-role="capturista-only"]');
    
    // Mostrar/ocultar según rol
    adminOnlyElements.forEach(el => {
        el.style.display = user.role === 'admin' ? 'block' : 'none';
    });
    
    // Aplicar clases CSS según rol
    document.body.className = '';
    document.body.classList.add(`role-${user.role}`);
}

function setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                authService.logout();
            }
        });
    }
    
    // Cambiar rol
    const changeRoleBtn = document.getElementById('changeRoleBtn');
    if (changeRoleBtn) {
        changeRoleBtn.addEventListener('click', function() {
            showRoleChangeModal();
        });
    }
    
    // Navegación del menú
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const pageId = this.getAttribute('data-page');
            if (pageId) {
                navigateToPage(pageId);
            }
        });
    });
    
    // Botón flotante de acción rápida
    const quickActionBtn = document.getElementById('quickActionBtn');
    if (quickActionBtn) {
        quickActionBtn.addEventListener('click', showQuickActions);
    }
    
    // Botones de reportes
    document.querySelectorAll('[id$="Report"]').forEach(btn => {
        btn.addEventListener('click', function() {
            generateReport(this.id.replace('Report', '').toLowerCase());
        });
    });
}

async function loadInitialData() {
    try {
        // Cargar inventario si estamos en esa página
        if (document.getElementById('inventoryTableBody')) {
            await loadInventoryData();
        }
        
        // Cargar usuarios si estamos en admin
        if (document.getElementById('usersTableBody') && authService.isAdmin()) {
            await loadUsersData();
        }
        
        // Actualizar estadísticas del dashboard
        updateDashboardStats();
        
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        notifications.show('Error cargando datos iniciales', 'error');
    }
}

async function loadInventoryData() {
    try {
        const inventoryBody = document.getElementById('inventoryTableBody');
        if (!inventoryBody) return;
        
        // Mostrar carga
        inventoryBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="loading-spinner"></div>
                    <p>Cargando inventario...</p>
                </td>
            </tr>
        `;
        
        // Obtener datos
        const result = await googleSheets.getInventory();
        
        if (result.data && result.data.length > 0) {
            renderInventoryTable(result.data);
        } else {
            inventoryBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <p>No hay datos de inventario disponibles.</p>
                    </td>
                </tr>
            `;
        }
        
    } catch (error) {
        console.error('Error cargando inventario:', error);
        document.getElementById('inventoryTableBody').innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">
                    <p>Error cargando datos: ${error.message}</p>
                </td>
            </tr>
        `;
    }
}

function renderInventoryTable(data) {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        
        // Determinar estado del stock
        let stockStatus = 'normal';
        let statusClass = 'badge-success';
        
        if (item.stock <= 0) {
            stockStatus = 'agotado';
            statusClass = 'badge-danger';
        } else if (item.stock <= item.minimo) {
            stockStatus = 'bajo';
            statusClass = 'badge-warning';
        } else if (item.stock <= item.minimo * 1.5) {
            stockStatus = 'medio';
            statusClass = 'badge-info';
        }
        
        row.innerHTML = `
            <td><strong>${item.codigo || ''}</strong></td>
            <td>${item.nombre || ''}</td>
            <td>${item.categoria || ''}</td>
            <td>
                ${item.stock || 0}
                ${item.minimo ? `<small class="text-muted">(mín: ${item.minimo})</small>` : ''}
            </td>
            <td>${item.ubicacion || ''}</td>
            <td><span class="badge ${statusClass}">${stockStatus}</span></td>
            <td>
                <div class="table-actions">
                    <button class="action-btn action-view" onclick="viewItem(${item.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${authService.hasPermission('update') ? `
                    <button class="action-btn action-edit" onclick="editItem(${item.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    ` : ''}
                    <button class="action-btn action-qr" onclick="generateQR(${item.id})" title="Generar QR">
                        <i class="fas fa-qrcode"></i>
                    </button>
                    ${authService.hasPermission('delete') ? `
                    <button class="action-btn action-delete" onclick="deleteItem(${item.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

async function loadUsersData() {
    // Similar a loadInventoryData pero para usuarios
    console.log('Cargando datos de usuarios...');
}

function updateDashboardStats() {
    // Actualizar estadísticas en tiempo real
    const stats = {
        totalItems: 1254,
        lowStock: 23,
        pendingOrders: 8,
        todayMovements: 45
    };
    
    // Actualizar elementos del DOM
    document.querySelectorAll('.stat-value').forEach(el => {
        const statType = el.closest('.stat-card')?.querySelector('.stat-label')?.textContent.toLowerCase();
        
        if (statType) {
            if (statType.includes('artículos')) el.textContent = stats.totalItems;
            else if (statType.includes('bajo')) el.textContent = stats.lowStock;
            else if (statType.includes('órdenes')) el.textContent = stats.pendingOrders;
            else if (statType.includes('movimientos')) el.textContent = stats.todayMovements;
        }
    });
}

// ============================================
// FUNCIONES DE NAVEGACIÓN
// ============================================

function navigateToPage(pageId) {
    console.log('Navegando a página:', pageId);
    
    // Verificar permisos para la página
    if (!checkPagePermission(pageId)) {
        notifications.show('No tienes permiso para acceder a esta página', 'error');
        return;
    }
    
    // Ocultar todas las páginas
    document.querySelectorAll('.main-content').forEach(page => {
        page.classList.remove('active');
    });
    
    // Mostrar página solicitada
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Actualizar menú activo
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === pageId) {
                item.classList.add('active');
            }
        });
        
        // Cargar datos específicos de la página
        loadPageData(pageId);
        
        // Registrar actividad
        authService.logActivity('page_navigation', `Navegó a: ${pageId}`);
    }
}

function checkPagePermission(pageId) {
    const user = authService.getCurrentUser();
    
    if (!user) return false;
    
    const pagePermissions = {
        'dashboard': true, // Todos pueden ver el dashboard
        'inventory': ['admin', 'user', 'capturista', 'supervisor'].includes(user.role),
        'users': user.role === 'admin',
        'roles': user.role === 'admin',
        'reports': ['admin', 'supervisor', 'reportes'].includes(user.role),
        'qrgenerator': ['admin', 'user', 'capturista', 'supervisor'].includes(user.role),
        'settings': user.role === 'admin'
    };
    
    return pagePermissions[pageId] || false;
}

function loadPageData(pageId) {
    switch(pageId) {
        case 'inventory':
            loadInventoryData();
            break;
        case 'users':
            if (authService.isAdmin()) {
                loadUsersData();
            }
            break;
        case 'reports':
            // Cargar datos para reportes
            break;
        case 'qrgenerator':
            // Inicializar generador de QR
            break;
    }
}

// ============================================
// FUNCIONES MODALES Y DIÁLOGOS
// ============================================

function showRoleChangeModal() {
    // Implementar modal de cambio de rol
    notifications.show('Funcionalidad en desarrollo', 'info');
}

function showQuickActions() {
    const user = authService.getCurrentUser();
    
    // Crear menú de acciones rápidas
    const quickActions = document.createElement('div');
    quickActions.className = 'quick-actions-menu';
    quickActions.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        padding: 1rem;
        z-index: 1000;
        min-width: 200px;
    `;
    
    const actions = [];
    
    // Agregar acciones según permisos
    if (authService.hasPermission('create')) {
        actions.push({
            icon: 'fa-plus',
            label: 'Nuevo Artículo',
            action: () => {
                document.getElementById('addInventoryBtn')?.click();
                quickActions.remove();
            }
        });
    }
    
    actions.push(
        {
            icon: 'fa-qrcode',
            label: 'Generar QR',
            action: () => {
                navigateToPage('qrgenerator');
                quickActions.remove();
            }
        },
        {
            icon: 'fa-file-export',
            label: 'Exportar Reporte',
            action: () => {
                generateQuickReport();
                quickActions.remove();
            }
        },
        {
            icon: 'fa-bell',
            label: 'Ver Alertas',
            action: () => {
                showAlerts();
                quickActions.remove();
            }
        }
    );
    
    actions.forEach(action => {
        const button = document.createElement('button');
        button.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.75rem;
            width: 100%;
            padding: 0.75rem;
            background: none;
            border: none;
            text-align: left;
            cursor: pointer;
            border-radius: 5px;
            transition: background-color 0.2s;
        `;
        
        button.innerHTML = `
            <i class="fas ${action.icon}" style="color: #1a5f7a;"></i>
            <span>${action.label}</span>
        `;
        
        button.addEventListener('click', action.action);
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#f8f9fa';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'transparent';
        });
        
        quickActions.appendChild(button);
    });
    
    document.body.appendChild(quickActions);
    
    // Cerrar al hacer click fuera
    setTimeout(() => {
        const closeHandler = (e) => {
            if (!quickActions.contains(e.target) && e.target.id !== 'quickActionBtn') {
                quickActions.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        document.addEventListener('click', closeHandler);
    }, 100);
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function addNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(0,0,0,0.1);
            border-radius: 50%;
            border-top-color: #1a5f7a;
            animation: spin 1s ease-in-out infinite;
            margin: 0 auto 1rem auto;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .text-center { text-align: center; }
        .text-danger { color: #dc3545; }
        .text-muted { color: #6c757d; }
    `;
    document.head.appendChild(style);
}

// ============================================
// FUNCIONES GLOBALES EXPORTADAS
// ============================================

// Hacer disponibles en el ámbito global para usar en HTML
window.viewItem = function(id) {
    notifications.show(`Viendo artículo #${id}`, 'info');
    // Implementar lógica de visualización
};

window.editItem = function(id) {
    if (!authService.hasPermission('update')) {
        notifications.show('No tienes permiso para editar artículos', 'error');
        return;
    }
    notifications.show(`Editando artículo #${id}`, 'info');
    // Implementar lógica de edición
};

window.deleteItem = function(id) {
    if (!authService.hasPermission('delete')) {
        notifications.show('No tienes permiso para eliminar artículos', 'error');
        return;
    }
    
    if (confirm('¿Estás seguro de que deseas eliminar este artículo?')) {
        notifications.show(`Eliminando artículo #${id}...`, 'info');
        // Implementar lógica de eliminación
    }
};

window.generateQR = function(id) {
    notifications.show(`Generando QR para artículo #${id}`, 'info');
    navigateToPage('qrgenerator');
    // Implementar generación de QR específico
};

window.generateReport = function(type) {
    if (!authService.hasPermission('export')) {
        notifications.show('No tienes permiso para generar reportes', 'error');
        return;
    }
    
    notifications.show(`Generando reporte de ${type}...`, 'info');
    // Implementar generación de reportes
};

window.generateQuickReport = function() {
    notifications.show('Generando reporte rápido...', 'info');
    // Implementar reporte rápido
};

window.showAlerts = function() {
    // Implementar visualización de alertas
    notifications.show('No hay alertas pendientes', 'info');
};

// ============================================
// FUNCIONES PARA EL LOGIN
// ============================================

window.showLogin = function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.style.display = 'block';
    }
    
    // Ocultar otros elementos si es necesario
    const demoSection = document.querySelector('.demo-credentials');
    if (demoSection) {
        demoSection.style.display = 'none';
    }
};

window.hideLogin = function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.style.display = 'none';
    }
};

// Asegurar que las funciones estén disponibles globalmente
window.authService = authService;
window.googleSheets = googleSheets;
window.notifications = notifications;

// ============================================
// INICIALIZACIÓN DE PWA
// ============================================

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registrado exitosamente:', registration.scope);
            })
            .catch(error => {
                console.log('Error registrando Service Worker:', error);
            });
    });
}

// Detectar si la app está instalada
window.addEventListener('appinstalled', () => {
    console.log('SIBIM fue instalado exitosamente como PWA');
    notifications.show('¡Aplicación instalada exitosamente!', 'success');
});

// Solicitar instalación
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Mostrar botón de instalación
    setTimeout(() => {
        if (confirm('¿Deseas instalar SIBIM en tu dispositivo para un acceso más rápido?')) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('Usuario aceptó la instalación');
                }
                deferredPrompt = null;
            });
        }
    }, 5000);
});

// ============================================
// FUNCIONES FALTANTES
// ============================================

// 1. Función updateDashboardStats
function updateDashboardStats(data) {
    console.log("📊 Actualizando estadísticas del dashboard");
    
    if (!data) {
        console.warn("No hay datos para actualizar el dashboard");
        return;
    }
    
    try {
        // Actualizar contadores
        if (data.totalItems !== undefined) {
            const totalEl = document.getElementById('total-items');
            if (totalEl) totalEl.textContent = data.totalItems;
        }
        
        if (data.activeUsers !== undefined) {
            const usersEl = document.getElementById('active-users');
            if (usersEl) usersEl.textContent = data.activeUsers;
        }
        
        if (data.pendingTasks !== undefined) {
            const tasksEl = document.getElementById('pending-tasks');
            if (tasksEl) tasksEl.textContent = data.pendingTasks;
        }
        
        // Actualizar gráficos si existen
        if (window.updateCharts && typeof window.updateCharts === 'function') {
            window.updateCharts(data);
        }
        
        console.log("✅ Dashboard actualizado correctamente");
    } catch (error) {
        console.error("❌ Error actualizando dashboard:", error);
    }
}

// 2. Función loadLocalStorageData (ya definida arriba)

// 3. Función saveToLocalStorage
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`💾 Guardado en localStorage: ${key}`);
        return true;
    } catch (error) {
        console.error(`❌ Error guardando en localStorage (${key}):`, error);
        return false;
    }
}

// 4. Función para simular datos si Google Sheets falla
function getFallbackData() {
    console.log("🔄 Usando datos de respaldo (fallback)");
    
    return {
        configuracion: {
            sistema: "SIBIM",
            version: "1.0.0",
            empresa: "Municipalidad",
            contacto: "admin@municipalidad.com"
        },
        movimientos: [
            { id: 1, fecha: "2024-01-15", tipo: "Entrada", cantidad: 10, item: "Computadoras" },
            { id: 2, fecha: "2024-01-16", tipo: "Salida", cantidad: 5, item: "Sillas" }
        ],
        actualizaciones: [
            { id: 1, fecha: "2024-01-15", descripcion: "Actualización inicial", usuario: "Admin" }
        ],
        estadisticas: {
            totalItems: 45,
            activeUsers: 8,
            pendingTasks: 3,
            monthlyGrowth: 12
        }
    };
}

// 5. Función mejorada para inicializar sistema
async function initializeSystemWithGoogleSheets() {
    console.log("🚀 Inicializando sistema...");
    
    try {
        // Primero cargar datos locales
        const localData = loadLocalStorageData();
        console.log("📋 Datos locales cargados");
        
        // Intentar conectar con Google Sheets
        let sheetsData = null;
        let sheetsError = null;
        
        try {
            console.log("🔗 Intentando conectar con Google Sheets...");
            // Aquí iría tu código real de Google Sheets
            // Por ahora simulamos que falla
            throw new Error("Simulación de error 401 - No autenticado");
            
        } catch (sheetsErr) {
            sheetsError = sheetsErr;
            console.warn("⚠️  Error con Google Sheets, usando datos de respaldo:", sheetsErr.message);
            sheetsData = getFallbackData();
        }
        
        // Combinar datos
        const systemData = {
            ...sheetsData,
            local: localData,
            usingFallback: !!sheetsError,
            lastSync: new Date().toISOString()
        };
        
        console.log("📊 Datos del sistema preparados:", {
            usandoRespaldo: systemData.usingFallback,
            estadisticas: systemData.estadisticas ? 'Presente' : 'Ausente'
        });
        
        // Actualizar dashboard
        updateDashboardStats(systemData.estadisticas);
        
        // Guardar en localStorage para uso offline
        saveToLocalStorage('systemData', systemData);
        
        // Inicializar UI
        initializeUI(systemData);
        
        console.log("✅ Sistema inicializado correctamente");
        return systemData;
        
    } catch (error) {
        console.error("❌ Error crítico inicializando sistema:", error);
        
        // Último recurso: mostrar datos mínimos
        const fallbackData = getFallbackData();
        updateDashboardStats(fallbackData.estadisticas);
        
        return fallbackData;
    }
}

// 6. Función para inicializar UI
function initializeUI(data) {
    console.log("🎨 Inicializando interfaz de usuario");
    
    // Mostrar mensaje si estamos usando datos de respaldo
    if (data.usingFallback) {
        const alertEl = document.createElement('div');
        alertEl.className = 'offline-alert';
        alertEl.innerHTML = `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px; border-radius: 5px;">
                <strong>⚠️ Modo Offline</strong>
                <p>Usando datos almacenados localmente. Algunas funciones pueden estar limitadas.</p>
            </div>
        `;
        document.body.prepend(alertEl);
    }
    
    // Actualizar información del usuario
    if (data.local && data.local.user) {
        const userEl = document.getElementById('user-name');
        if (userEl) {
            userEl.textContent = data.local.user.name || 'Usuario';
        }
    }
    
    // Actualizar rol
    const roleEl = document.getElementById('user-role');
    if (roleEl) {
        roleEl.textContent = data.configuracion?.rol || 'Administrador';
    }
}

// Hacer funciones disponibles globalmente
window.updateDashboardStats = updateDashboardStats;
window.loadLocalStorageData = loadLocalStorageData;
window.saveToLocalStorage = saveToLocalStorage;
window.initializeSystemWithGoogleSheets = initializeSystemWithGoogleSheets;
window.getFallbackData = getFallbackData;

console.log("✅ Funciones críticas cargadas en app.js");

// ========== SIBIM SYSTEM ========== -->
<script src="./js/menu-system.js"></script>
<script src="./js/qr-module.js"></script>
<script src="./js/inventory-manager.js"></script>

<!-- Inicialización automática -->
<script>
    // No esperar, inicializar inmediatamente
    (function() {
        console.log('🚀 BOOTSTRAP SIBIM...');
        
        function initializeSIBIM() {
            try {
                console.log('🔧 Creando instancias SIBIM...');
                
                // Menu System
                if (typeof SIBIMMenuSystem !== 'undefined') {
                    window.menuSystem = new SIBIMMenuSystem();
                    console.log('✅ Menu System activado');
                } else {
                    console.error('❌ ERROR: SIBIMMenuSystem no disponible');
                    return false;
                }
                
                // QR Module
                if (typeof QRModule !== 'undefined') {
                    window.qrModule = new QRModule();
                    console.log('✅ QR Module activado');
                }
                
                // Inventory Manager
                if (typeof InventoryManager !== 'undefined') {
                    window.inventoryManager = new InventoryManager();
                    console.log('✅ Inventory Manager activado');
                }
                
                console.log('🎉 SIBIM INICIALIZADO CORRECTAMENTE!');
                
                // Mostrar notificación
                showSuccessMessage();
                
                // Hacer disponibles en consola
                console.log('📌 Usa: menuSystem.navigateTo("inventory")');
                console.log('📌 Usa: qrModule.generateQRCode("test")');
                
                return true;
                
            } catch (error) {
                console.error('💥 Error inicializando SIBIM:', error);
                return false;
            }
        }
        
        function showSuccessMessage() {
            const div = document.createElement('div');
            div.innerHTML = `
                <div style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 99999;
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                    border-left: 4px solid #4CAF50;
                ">
                    <strong>✅ SIBIM ACTIVO</strong><br>
                    <small>Sistema de Inventario Municipal</small>
                </div>
            `;
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 4000);
        }
        
        // Intentar inicializar inmediatamente
        let attempts = 0;
        const maxAttempts = 10;
        
        const tryInit = setInterval(() => {
            attempts++;
            
            if (typeof SIBIMMenuSystem !== 'undefined') {
                clearInterval(tryInit);
                const success = initializeSIBIM();
                
                if (!success) {
                    console.warn('⚠️ Reintentando en 500ms...');
                    setTimeout(initializeSIBIM, 500);
                }
            } else if (attempts >= maxAttempts) {
                clearInterval(tryInit);
                console.error('❌ No se pudo cargar SIBIM después de ' + maxAttempts + ' intentos');
                console.log('Verifica que los scripts se estén cargando correctamente');
            } else {
                console.log('⏳ Esperando módulos... (' + attempts + '/' + maxAttempts + ')');
            }
        }, 300);
        
    })();
</script>