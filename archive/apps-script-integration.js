// apps-script-integration.js - VERSIÓN CORREGIDA
console.log('🔄 Cargando AppsScriptIntegration...');

// Configuración GLOBAL
const APPS_SCRIPT_CONFIG = {
    scriptUrl: "https://script.google.com/macros/s/AKfycbyWjh690W7ZCKQWvuQ-CvAy9nQCm3IxvSg7_pYYzVp3TcYTSLRGNPdymqJKm5_bG8KPnQ/exec",
    apiKey: "AIzaSyB8BTdVtQcHWzK693tFclmJbmJL1-qmTgk",
    spreadsheetId: "1Xqj3JQ13dtZmm7TVucHbbYd81jszK"
};

// CLASE PRINCIPAL - Versión simplificada y funcional
class AppsScriptIntegration {
    constructor(config = {}) {
        this.config = { ...APPS_SCRIPT_CONFIG, ...config };
        console.log('🚀 AppsScriptIntegration creada');
    }
    
    async testConnection() {
        console.log('🔗 Probando conexión a Apps Script...');
        try {
            const url = this.config.scriptUrl + '?action=test&timestamp=' + Date.now();
            const response = await fetch(url, { mode: 'no-cors' });
            return {
                success: true,
                message: '✅ Conectado a Google Apps Script',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                message: '❌ Error de conexión: ' + error.message,
                error: error
            };
        }
    }
    
    async getInventoryData() {
        console.log('📦 Obteniendo datos de inventario...');
        try {
            const url = this.config.scriptUrl + '?action=getData&sheet=inventario';
            const response = await fetch(url, { mode: 'no-cors' });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Datos recibidos:', data);
                return data.data || data || [];
            }
            return [];
        } catch (error) {
            console.error('❌ Error:', error);
            return [];
        }
    }
    
    async getSheetData(sheetName) {
        console.log(`📄 Obteniendo datos de: ${sheetName}`);
        try {
            const url = this.config.scriptUrl + `?action=getData&sheet=${encodeURIComponent(sheetName)}`;
            const response = await fetch(url, { mode: 'no-cors' });
            
            if (response.ok) {
                const data = await response.json();
                return data.data || data || [];
            }
            return [];
        } catch (error) {
            console.error('❌ Error:', error);
            return [];
        }
    }
    
    async addInventoryItem(itemData) {
        console.log('➕ Agregando artículo:', itemData);
        try {
            const url = this.config.scriptUrl + '?action=addRow&sheet=inventario';
            const response = await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: itemData })
            });
            return response.ok;
        } catch (error) {
            console.error('❌ Error:', error);
            return false;
        }
    }
    
    async getStatistics() {
        const inventory = await this.getInventoryData();
        return {
            inventario: {
                total: inventory.length,
                valor_total: inventory.reduce((sum, item) => {
                    const val = parseFloat(item.valor?.replace(/[^0-9.-]+/g, "") || 0);
                    return sum + val;
                }, 0)
            }
        };
    }
}

// Hacer disponible GLOBALMENTE - ESTO ES CLAVE
window.AppsScriptIntegration = AppsScriptIntegration;
console.log('✅ AppsScriptIntegration registrada globalmente');