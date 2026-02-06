// sibim-integration.js - VERSIÓN SIMPLIFICADA
console.log('🔄 Cargando SIBIM Integration...');

class SIBIMIntegration {
    constructor() {
        this.api = null;
        this.userData = null;
        this.initialized = false;
        console.log('🚀 SIBIMIntegration creada');
    }
    
    async initialize() {
        console.log('🎯 Inicializando SIBIM...');
        
        try {
            // 1. Obtener usuario
            this.userData = this.getUserData();
            console.log('👤 Usuario:', this.userData);
            
            // 2. Inicializar API
            if (typeof AppsScriptIntegration !== 'undefined') {
                this.api = new AppsScriptIntegration();
                console.log('✅ API inicializada');
            } else {
                throw new Error('AppsScriptIntegration no disponible');
            }
            
            // 3. Probar conexión
            const connection = await this.api.testConnection();
            console.log('🔗 Conexión:', connection);
            
            if (!connection.success) {
                throw new Error(connection.message);
            }
            
            // 4. Agregar panel al dashboard
            this.addToDashboard();
            
            this.initialized = true;
            console.log('✅ SIBIM inicializado exitosamente');
            
            this.showNotification('SIBIM CONECTADO', 'Sistema operativo', 'success');
            
        } catch (error) {
            console.error('❌ Error inicializando SIBIM:', error);
            this.showNotification('ERROR SIBIM', error.message, 'error');
        }
    }
    
    getUserData() {
        try {
            // Intentar desde localStorage
            const data = localStorage.getItem('sibim_user') || 
                        localStorage.getItem('currentUser') ||
                        sessionStorage.getItem('user');
            
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn('⚠️ Error obteniendo usuario:', e);
        }
        
        // Usuario por defecto
        return {
            nombre: 'Usuario SIBIM',
            rol: 'Administrador',
            departamento: 'TI'
        };
    }
    
    addToDashboard() {
        console.log('🎨 Agregando SIBIM al dashboard...');
        
        // Buscar contenedor principal
        const container = document.querySelector('.dashboard-content') || 
                         document.querySelector('main') ||
                         document.querySelector('#content') ||
                         document.body;
        
        if (!container) {
            console.warn('⚠️ No se encontró contenedor para dashboard');
            return;
        }
        
        // Crear panel SIBIM
        const panel = document.createElement('div');
        panel.id = 'sibim-dashboard-panel';
        panel.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            border: 1px solid #e0e0e0;
            font-family: 'Segoe UI', sans-serif;
        `;
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #2196F3; display: flex; align-items: center; gap: 10px;">
                    <span style="background: #2196F3; color: white; padding: 8px 12px; border-radius: 8px;">🏛️</span>
                    Sistema de Inventario Municipal
                </h3>
                <div style="background: #4CAF50; color: white; padding: 6px 15px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                    🔗 CONECTADO
                </div>
            </div>
            
            <div style="margin-bottom: 20px; color: #666; font-size: 14px;">
                <div><strong>Usuario:</strong> ${this.userData.nombre}</div>
                <div><strong>Rol:</strong> ${this.userData.rol}</div>
                <div><strong>Departamento:</strong> ${this.userData.departamento || 'No asignado'}</div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div id="sibim-stat-inventory" style="background: #E3F2FD; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
                    <div style="font-size: 12px; color: #1976D2; margin-bottom: 5px;">ARTÍCULOS</div>
                    <div style="font-size: 24px; font-weight: bold; color: #0D47A1;">...</div>
                </div>
                <div id="sibim-stat-value" style="background: #E8F5E9; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50;">
                    <div style="font-size: 12px; color: #2E7D32; margin-bottom: 5px;">VALOR TOTAL</div>
                    <div style="font-size: 24px; font-weight: bold; color: #1B5E20;">...</div>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="SIBIM.showInventory()" style="
                    background: #2196F3;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    📦 Ver Inventario
                </button>
                <button onclick="SIBIM.addNewItem()" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    ➕ Nuevo Artículo
                </button>
                <button onclick="SIBIM.generateReport()" style="
                    background: #FF9800;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    📊 Generar Reporte
                </button>
            </div>
        `;
        
        // Insertar al inicio
        container.insertBefore(panel, container.firstChild);
        
        // Cargar datos
        this.loadDashboardData();
    }
    
    async loadDashboardData() {
        if (!this.api) return;
        
        try {
            const inventory = await this.api.getInventoryData();
            const totalValue = inventory.reduce((sum, item) => {
                const val = parseFloat(item.valor?.replace(/[^0-9.-]+/g, "") || 0);
                return sum + val;
            }, 0);
            
            // Actualizar UI
            const inventoryEl = document.getElementById('sibim-stat-inventory');
            const valueEl = document.getElementById('sibim-stat-value');
            
            if (inventoryEl) {
                inventoryEl.querySelector('div:nth-child(2)').textContent = inventory.length;
            }
            if (valueEl) {
                valueEl.querySelector('div:nth-child(2)').textContent = `$${totalValue.toLocaleString('es-ES')}`;
            }
            
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
        }
    }
    
    async showInventory() {
        if (!this.api) {
            alert('❌ API no disponible');
            return;
        }
        
        try {
            const inventory = await this.api.getInventoryData();
            
            // Mostrar en alerta simple
            let message = `📦 INVENTARIO SIBIM\n\nTotal: ${inventory.length} artículos\n\n`;
            
            // Agregar primeros 10 artículos
            inventory.slice(0, 10).forEach((item, i) => {
                message += `${i+1}. ${item.nombre || item.Nombre || 'Sin nombre'}\n`;
                message += `   📍 ${item.departamento || item.Departamento || 'Sin depto'}\n`;
                message += `   📊 ${item.estado || item.Estado || 'Sin estado'}\n\n`;
            });
            
            if (inventory.length > 10) {
                message += `... y ${inventory.length - 10} más`;
            }
            
            alert(message);
            
        } catch (error) {
            alert('❌ Error cargando inventario: ' + error.message);
        }
    }
    
    async addNewItem() {
        if (!this.api) {
            alert('❌ API no disponible');
            return;
        }
        
        const nombre = prompt('Nombre del artículo:');
        if (!nombre) return;
        
        const nuevoItem = {
            Codigo: `ART-${Date.now().toString().slice(-6)}`,
            Nombre: nombre,
            Categoria: prompt('Categoría:') || 'Equipo',
            Estado: 'Disponible',
            Departamento: this.userData.departamento || 'TI',
            Valor: prompt('Valor (ej: $100.00):') || '$0.00',
            Responsable: this.userData.nombre,
            'Fecha de Registro': new Date().toLocaleDateString('es-ES')
        };
        
        if (confirm(`¿Crear este artículo?\n\n${JSON.stringify(nuevoItem, null, 2)}`)) {
            try {
                const success = await this.api.addInventoryItem(nuevoItem);
                if (success) {
                    alert('✅ Artículo agregado exitosamente');
                    // Recargar datos
                    await this.loadDashboardData();
                } else {
                    alert('❌ Error al agregar artículo');
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }
    }
    
    async generateReport() {
        if (!this.api) {
            alert('❌ API no disponible');
            return;
        }
        
        try {
            const inventory = await this.api.getInventoryData();
            const totalValue = inventory.reduce((sum, item) => {
                const val = parseFloat(item.valor?.replace(/[^0-9.-]+/g, "") || 0);
                return sum + val;
            }, 0);
            
            // Crear ventana con reporte
            const reportWindow = window.open('', '_blank');
            reportWindow.document.write(`
                <html>
                <head>
                    <title>Reporte SIBIM - ${new Date().toLocaleDateString('es-ES')}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #2196F3; }
                        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
                        .stat-box { background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #2196F3; color: white; padding: 10px; text-align: left; }
                        td { padding: 10px; border-bottom: 1px solid #ddd; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>🏛️ Sistema de Inventario Municipal</h1>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
                        <p><strong>Generado por:</strong> ${this.userData.nombre}</p>
                    </div>
                    
                    <div class="stats">
                        <div class="stat-box">
                            <h3>📦 Total Artículos</h3>
                            <p style="font-size: 24px; font-weight: bold;">${inventory.length}</p>
                        </div>
                        <div class="stat-box">
                            <h3>💰 Valor Total</h3>
                            <p style="font-size: 24px; font-weight: bold;">$${totalValue.toLocaleString('es-ES')}</p>
                        </div>
                        <div class="stat-box">
                            <h3>👤 Responsable</h3>
                            <p style="font-size: 18px;">${this.userData.nombre}</p>
                        </div>
                    </div>
                    
                    <h2>📋 Lista de Artículos (${inventory.length})</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Departamento</th>
                                <th>Estado</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${inventory.map(item => `
                                <tr>
                                    <td>${item.codigo || item.Codigo || ''}</td>
                                    <td>${item.nombre || item.Nombre || ''}</td>
                                    <td>${item.departamento || item.Departamento || ''}</td>
                                    <td>${item.estado || item.Estado || ''}</td>
                                    <td>${item.valor || item.Valor || ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; font-size: 12px; color: #666;">
                        <p>Reporte generado automáticamente por SIBIM v1.0</p>
                    </div>
                </body>
                </html>
            `);
            reportWindow.document.close();
            
            this.showNotification('✅ Reporte generado', 'Se abrió en nueva ventana', 'success');
            
        } catch (error) {
            alert('❌ Error generando reporte: ' + error.message);
        }
    }
    
    showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: 'Segoe UI', sans-serif;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = `<strong>${title}</strong><br><span style="font-size: 14px;">${message}</span>`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Agregar animaciones si no existen
        if (!document.querySelector('#sibim-animations')) {
            const style = document.createElement('style');
            style.id = 'sibim-animations';
            style.textContent = `
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
            `;
            document.head.appendChild(style);
        }
    }
}

// Crear instancia GLOBAL
window.SIBIM = new SIBIMIntegration();
console.log('✅ SIBIM registrada globalmente');

// Inicializar automáticamente cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado, iniciando SIBIM...');
    
    // Pequeño delay para asegurar que todo cargue
    setTimeout(() => {
        if (window.SIBIM && typeof window.SIBIM.initialize === 'function') {
            window.SIBIM.initialize();
        } else {
            console.error('❌ SIBIM no disponible para inicializar');
        }
    }, 1000);
});