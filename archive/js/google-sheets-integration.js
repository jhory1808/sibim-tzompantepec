// google-sheets-integration.js - Versión mejorada para estructura SIBIM completa
console.log('✅ Google Sheets Integration cargado (versión mejorada)');

class GoogleSheetsIntegration {
    constructor(config = {}) {
        this.config = {
            apiKey: config.apiKey || '',
            spreadsheetId: config.spreadsheetId || '',
            sheets: config.sheets || {
                inventario: { name: 'inventario' },
                usuarios: { name: 'Usuarios' },
                departamentos: { name: 'Departamentos' },
                movimientos: { name: 'Movimientos' },
                actualizaciones: { name: 'Actualizaciones' },
                configuracion: { name: 'Configuracion' }
            },
            cacheDuration: 2 * 60 * 1000, // 2 minutos
            ...config
        };
        
        this.cache = {};
        this.initializeCache();
        
        console.log('🚀 Google Sheets Integration inicializado');
        console.log('📊 Hojas configuradas:', Object.keys(this.config.sheets));
    }
    
    initializeCache() {
        Object.keys(this.config.sheets).forEach(sheetKey => {
            this.cache[sheetKey] = {
                data: null,
                timestamp: null,
                headers: null
            };
        });
    }
    
    // Verificar configuración
    isConfigured() {
        return this.config.apiKey && this.config.spreadsheetId;
    }
    
    // Obtener URL para una hoja específica
    getSheetUrl(sheetName, range = '') {
        const sheetRange = range || `${sheetName}!A:Z`;
        return `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${sheetRange}?key=${this.config.apiKey}`;
    }
    
    // === MÉTODO PRINCIPAL: OBTENER DATOS DEL INVENTARIO ===
    async getInventoryData(forceRefresh = false) {
        return this.getSheetData('inventario', forceRefresh);
    }
    
    // === MÉTODO GENERAL: OBTENER DATOS DE CUALQUIER HOJA ===
    async getSheetData(sheetKey, forceRefresh = false) {
        const sheetConfig = this.config.sheets[sheetKey];
        if (!sheetConfig) {
            console.error(`❌ Hoja no configurada: ${sheetKey}`);
            return [];
        }
        
        const sheetName = sheetConfig.name;
        const cache = this.cache[sheetKey];
        
        // Verificar caché
        if (!forceRefresh && cache.data && cache.timestamp) {
            const cacheAge = Date.now() - cache.timestamp;
            if (cacheAge < this.config.cacheDuration) {
                console.log(`📦 Usando ${sheetKey} en caché (${Math.round(cacheAge/1000)}s)`);
                return cache.data;
            }
        }
        
        // Verificar configuración
        if (!this.isConfigured()) {
            console.warn(`⚠️ Google Sheets no configurado para ${sheetKey}`);
            return this.getSampleData(sheetKey);
        }
        
        try {
            console.log(`🌐 Conectando a hoja: ${sheetName}...`);
            
            const url = this.getSheetUrl(sheetName);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`${sheetName}: Error ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ ${sheetName}: ${data.values ? data.values.length - 1 : 0} registros`);
            
            // Procesar datos
            const processedData = this.processSheetData(sheetKey, data);
            
            // Actualizar caché
            cache.data = processedData;
            cache.timestamp = Date.now();
            cache.headers = data.values ? data.values[0] : [];
            
            return processedData;
            
        } catch (error) {
            console.error(`❌ Error en ${sheetKey}:`, error);
            return this.getSampleData(sheetKey);
        }
    }
    
    // Procesar datos específicos para cada hoja
    processSheetData(sheetKey, sheetData) {
        if (!sheetData.values || sheetData.values.length < 2) {
            console.log(`📭 Hoja ${sheetKey} vacía o con solo encabezados`);
            return [];
        }
        
        const headers = sheetData.values[0];
        const rows = sheetData.values.slice(1);
        
        console.log(`📊 Procesando ${rows.length} registros de ${sheetKey}`);
        
        switch(sheetKey) {
            case 'inventario':
                return this.processInventarioData(headers, rows);
            case 'usuarios':
                return this.processUsuariosData(headers, rows);
            case 'departamentos':
                return this.processDepartamentosData(headers, rows);
            case 'movimientos':
                return this.processMovimientosData(headers, rows);
            case 'actualizaciones':
                return this.processActualizacionesData(headers, rows);
            case 'configuracion':
                return this.processConfiguracionData(headers, rows);
            default:
                return this.processGenericData(headers, rows);
        }
    }
    
    // === PROCESAMIENTO ESPECÍFICO POR HOJA ===
    
    processInventarioData(headers, rows) {
        return rows.map((row, index) => {
            const item = {
                id: `INV-${Date.now()}-${index}`,
                source: 'google-sheets',
                rawData: {}
            };
            
            // Mapear todas las columnas
            headers.forEach((header, colIndex) => {
                const value = row[colIndex] || '';
                const key = this.normalizeKey(header);
                item[key] = value;
                item.rawData[header] = value;
            });
            
            // Campos estandarizados para SIBIM
            item.code = item.codigo || '';
            item.name = item.nombre || '';
            item.brand = item.marca || '';
            item.model = item.modelo || '';
            item.serial = item.numero_de_serie || '';
            item.category = item.categoria || '';
            item.group = item.grupo || '';
            item.responsible = item.responsable || '';
            item.assignedArea = item.area_asignada || '';
            item.status = item.estado || '';
            item.department = item.departamento || '';
            item.value = item.valor || '';
            item.acquisitionDate = item.fecha_adquisicion || '';
            item.company = item.empresa || '';
            item.notes = item.observaciones || '';
            item.registrationDate = item.fecha_de_registro || '';
            item.image = item.imagen || '';
            item.guardDocument = item.documento_resguardo || '';
            item.guardDate = item.fecha_resguardo || '';
            item.guardValidity = item.vigencia_resguardo || '';
            item.qrCode = item.qr_code || '';
            
            return item;
        });
    }
    
    processUsuariosData(headers, rows) {
        return rows.map(row => {
            const user = {};
            headers.forEach((header, colIndex) => {
                const key = this.normalizeKey(header);
                user[key] = row[colIndex] || '';
            });
            
            // Campos estandarizados
            user.fullName = `${user.nombre || ''} ${user.apellido || ''}`.trim();
            user.role = user.rol || '';
            user.status = user.estado || 'Activo';
            user.lastAccess = user.ultimo_acceso || '';
            
            return user;
        });
    }
    
    processDepartamentosData(headers, rows) {
        return rows.map(row => {
            const dept = {};
            headers.forEach((header, colIndex) => {
                const key = this.normalizeKey(header);
                dept[key] = row[colIndex] || '';
            });
            
            // Campos estandarizados
            dept.name = dept.nombre_departamento || '';
            dept.manager = dept.encargado || '';
            dept.managerEmail = dept.email_encargado || '';
            dept.managerPhone = dept.telefono_encargado || '';
            dept.description = dept.descripcion || '';
            dept.assignedItems = parseInt(dept.articulos_asignados) || 0;
            dept.budget = dept.presupuesto_anual || '';
            dept.location = dept.ubicacion || '';
            dept.status = dept.estado || 'Activo';
            
            return dept;
        });
    }
    
    processMovimientosData(headers, rows) {
        return rows.map(row => {
            const movement = {};
            headers.forEach((header, colIndex) => {
                const key = this.normalizeKey(header);
                movement[key] = row[colIndex] || '';
            });
            
            // Campos estandarizados
            movement.action = movement.accion || '';
            movement.type = movement.tipo || '';
            movement.itemId = movement.id_articulo || '';
            movement.itemCode = movement.codigo_articulo || '';
            movement.itemName = movement.nombre_articulo || '';
            movement.fromDepartment = movement.departamento_origen || '';
            movement.toDepartment = movement.departamento_destino || '';
            movement.previousStatus = movement.estado_anterior || '';
            movement.newStatus = movement.estado_nuevo || '';
            
            return movement;
        });
    }
    
    processActualizacionesData(headers, rows) {
        return rows.map(row => {
            const update = {};
            headers.forEach((header, colIndex) => {
                const key = this.normalizeKey(header);
                update[key] = row[colIndex] || '';
            });
            
            // Campos estandarizados
            update.updateType = update.tipo_actualizacion || '';
            update.affectedTable = update.tabla_afectada || '';
            update.recordId = update.id_registro || '';
            update.changedField = update.campo_modificado || '';
            update.oldValue = update.valor_anterior || '';
            update.newValue = update.valor_nuevo || '';
            update.system = update.sistema || 'SIBIM';
            
            return update;
        });
    }
    
    processConfiguracionData(headers, rows) {
        const config = {};
        rows.forEach(row => {
            const key = row[0] || '';
            const value = row[1] || '';
            
            if (key) {
                config[key] = {
                    value: value,
                    description: row[2] || '',
                    type: row[3] || '',
                    module: row[4] || '',
                    lastModified: row[5] || '',
                    modifiedBy: row[6] || ''
                };
            }
        });
        return config;
    }
    
    processGenericData(headers, rows) {
        return rows.map(row => {
            const item = {};
            headers.forEach((header, colIndex) => {
                const key = this.normalizeKey(header);
                item[key] = row[colIndex] || '';
            });
            return item;
        });
    }
    
    // Normalizar nombres de campos
    normalizeKey(key) {
        if (!key) return '';
        
        const normalizations = {
            'número de serie': 'numero_de_serie',
            'área asignada': 'area_asignada',
            'fecha adquisición': 'fecha_adquisicion',
            'fecha de registro': 'fecha_de_registro',
            'documento resguardo': 'documento_resguardo',
            'fecha resguardo': 'fecha_resguardo',
            'vigencia resguardo': 'vigencia_resguardo',
            'qr code': 'qr_code',
            'ip ultimo acceso': 'ip_ultimo_acceso',
            'nombre departamento': 'nombre_departamento',
            'email encargado': 'email_encargado',
            'telefono encargado': 'telefono_encargado',
            'artículos asignados': 'articulos_asignados',
            'fecha de creación': 'fecha_de_creacion',
            'presupuesto anual': 'presupuesto_anual',
            'usuario creación': 'usuario_creacion',
            'última actualización': 'ultima_actualizacion',
            'departamento origen': 'departamento_origen',
            'departamento destino': 'departamento_destino',
            'estado anterior': 'estado_anterior',
            'estado nuevo': 'estado_nuevo',
            'sesion id': 'sesion_id',
            'tipo actualización': 'tipo_actualizacion',
            'tabla afectada': 'tabla_afectada',
            'id registro': 'id_registro',
            'campo modificado': 'campo_modificado',
            'valor anterior': 'valor_anterior',
            'valor nuevo': 'valor_nuevo',
            'autorizado por': 'autorizado_por',
            'última modificación': 'ultima_modificacion',
            'usuario modificación': 'usuario_modificacion'
        };
        
        const lowerKey = key.toString().toLowerCase().trim();
        return normalizations[lowerKey] || lowerKey.replace(/\s+/g, '_');
    }
    
    // === MÉTODOS PARA AGREGAR DATOS ===
    
    async addInventoryItem(itemData) {
        return this.addRow('inventario', itemData);
    }
    
    async addMovement(movementData) {
        return this.addRow('movimientos', {
            Fecha: new Date().toLocaleDateString(),
            Hora: new Date().toLocaleTimeString(),
            ...movimientoData
        });
    }
    
    async addUpdate(updateData) {
        return this.addRow('actualizaciones', {
            Fecha: new Date().toLocaleDateString(),
            Hora: new Date().toLocaleTimeString(),
            Usuario: 'SIBIM System',
            Sistema: 'SIBIM v1.0',
            Version: '1.0',
            IP: 'localhost',
            ...updateData
        });
    }
    
    async addRow(sheetKey, rowData) {
        const sheetConfig = this.config.sheets[sheetKey];
        if (!sheetConfig || !this.isConfigured()) {
            console.error(`❌ No se puede agregar a ${sheetKey}: no configurado`);
            return false;
        }
        
        try {
            // Obtener estructura de la hoja
            const headers = this.cache[sheetKey]?.headers || 
                           sheetConfig.headers || 
                           await this.getSheetHeaders(sheetConfig.name);
            
            // Preparar fila en el orden correcto
            const rowValues = headers.map(header => {
                const key = this.normalizeKey(header);
                // Buscar el valor correspondiente
                for (const [dataKey, value] of Object.entries(rowData)) {
                    if (this.normalizeKey(dataKey) === key) {
                        return value || '';
                    }
                }
                return '';
            });
            
            // URL para append
            const url = this.getSheetUrl(sheetConfig.name) + '&valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS';
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    range: `${sheetConfig.name}!A:Z`,
                    majorDimension: 'ROWS',
                    values: [rowValues]
                })
            });
            
            if (response.ok) {
                console.log(`✅ Fila agregada a ${sheetConfig.name}`);
                // Invalidar caché
                this.cache[sheetKey].data = null;
                return true;
            } else {
                throw new Error(`Error ${response.status}`);
            }
            
        } catch (error) {
            console.error(`❌ Error agregando a ${sheetKey}:`, error);
            return false;
        }
    }
    
    async getSheetHeaders(sheetName) {
        try {
            const url = this.getSheetUrl(sheetName, `${sheetName}!1:1`);
            const response = await fetch(url);
            const data = await response.json();
            return data.values ? data.values[0] : [];
        } catch (error) {
            console.error(`❌ Error obteniendo encabezados de ${sheetName}:`, error);
            return [];
        }
    }
    
    // === MÉTODOS DE CONSULTA AVANZADA ===
    
    async getStatistics() {
        const inventory = await this.getInventoryData();
        const departments = await this.getSheetData('departamentos');
        
        const stats = {
            inventory: {
                total: inventory.length,
                byCategory: {},
                byStatus: {},
                byDepartment: {},
                totalValue: 0
            },
            departments: departments.length,
            recentMovements: 0,
            activeUsers: 0
        };
        
        // Procesar inventario
        inventory.forEach(item => {
            // Por categoría
            stats.inventory.byCategory[item.category] = (stats.inventory.byCategory[item.category] || 0) + 1;
            
            // Por estado
            stats.inventory.byStatus[item.status] = (stats.inventory.byStatus[item.status] || 0) + 1;
            
            // Por departamento
            stats.inventory.byDepartment[item.department] = (stats.inventory.byDepartment[item.department] || 0) + 1;
            
            // Valor total
            const value = parseFloat(item.value?.replace(/[^0-9.-]+/g, "") || 0);
            stats.inventory.totalValue += value;
        });
        
        // Obtener movimientos recientes
        try {
            const movements = await this.getSheetData('movimientos');
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            stats.recentMovements = movements.filter(mov => {
                const movDate = new Date(mov.fecha || mov.Fecha);
                return movDate > oneWeekAgo;
            }).length;
        } catch (e) {
            console.log('⚠️ No se pudieron obtener movimientos:', e.message);
        }
        
        return stats;
    }
    
    async searchInventory(query) {
        const inventory = await this.getInventoryData();
        const searchTerm = query.toLowerCase();
        
        return inventory.filter(item => {
            return (
                (item.code && item.code.toLowerCase().includes(searchTerm)) ||
                (item.name && item.name.toLowerCase().includes(searchTerm)) ||
                (item.serial && item.serial.toLowerCase().includes(searchTerm)) ||
                (item.category && item.category.toLowerCase().includes(searchTerm)) ||
                (item.responsible && item.responsible.toLowerCase().includes(searchTerm))
            );
        });
    }
    
    async getItemsByDepartment(department) {
        const inventory = await this.getInventoryData();
        return inventory.filter(item => 
            item.department && item.department.toLowerCase() === department.toLowerCase()
        );
    }
    
    async getItemsByStatus(status) {
        const inventory = await this.getInventoryData();
        return inventory.filter(item => 
            item.status && item.status.toLowerCase() === status.toLowerCase()
        );
    }
    
    // === DATOS DE EJEMPLO ===
    
    getSampleData(sheetKey) {
        const samples = {
            inventario: [
                {
                    id: 'INV-001',
                    code: 'MON-24-LCD',
                    name: 'Monitor LCD 24"',
                    brand: 'Dell',
                    model: 'P2419H',
                    serial: 'SN123456789',
                    category: 'Equipo de Cómputo',
                    group: 'Tecnología',
                    responsible: 'Juan Pérez',
                    assignedArea: 'Oficina 101',
                    status: 'En Uso',
                    department: 'TI',
                    value: '$250.00',
                    acquisitionDate: '2024-01-15',
                    company: 'Proveedor SA',
                    notes: 'Monitor para desarrollo',
                    source: 'sample'
                }
            ],
            usuarios: [
                {
                    id: 'USR-001',
                    usuario: 'maria.admin',
                    nombre: 'María',
                    apellido: 'Admin',
                    email: 'maria@municipio.com',
                    rol: 'Administrador',
                    departamento: 'TI',
                    estado: 'Activo'
                }
            ]
        };
        
        return samples[sheetKey] || [];
    }
    
    // === PRUEBA DE CONEXIÓN ===
    
    async testConnection() {
        if (!this.isConfigured()) {
            return {
                success: false,
                message: '❌ Configuración incompleta',
                missing: {
                    apiKey: !this.config.apiKey,
                    spreadsheetId: !this.config.spreadsheetId
                }
            };
        }
        
        try {
            const testPromises = Object.keys(this.config.sheets).map(async (sheetKey) => {
                const sheetName = this.config.sheets[sheetKey].name;
                try {
                    const url = this.getSheetUrl(sheetName, `${sheetName}!A1:A2`);
                    const response = await fetch(url);
                    
                    return {
                        sheet: sheetName,
                        accessible: response.ok,
                        status: response.status,
                        error: response.ok ? null : await response.text()
                    };
                } catch (error) {
                    return {
                        sheet: sheetName,
                        accessible: false,
                        error: error.message
                    };
                }
            });
            
            const results = await Promise.all(testPromises);
            const allAccessible = results.every(r => r.accessible);
            
            return {
                success: allAccessible,
                message: allAccessible ? '✅ Todas las hojas accesibles' : '⚠️ Algunas hojas no accesibles',
                sheets: results,
                config: {
                    spreadsheetId: this.config.spreadsheetId,
                    totalSheets: results.length,
                    accessibleSheets: results.filter(r => r.accessible).length
                }
            };
            
        } catch (error) {
            return {
                success: false,
                message: '❌ Error de conexión general',
                error: error.message
            };
        }
    }
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.GoogleSheetsIntegration = GoogleSheetsIntegration;
}

console.log('✅ Google Sheets Integration (versión completa) listo');
