const API = {
    // Helper centralized for Google Apps Script calls
    async gasFetch(action, params = {}) {
        try {
            const queryParams = new URLSearchParams({
                action: action,
                t: Date.now(),
                ...params
            });
            const url = `${CONFIG.scriptUrl}?${queryParams.toString()}`;
            console.log(`[DIAGNÓSTICO] Haz clic aquí para probar el backend: ${url}`);

            // FETCH PURO: Dejamos que el navegador maneje todo. Al ser público, no requiere headers.
            const response = await fetch(url);

            if (response.status === 403 || response.status === 401) {
                console.error("⛔ ACCESO PROHIBIDO (403): El script de Google NO está público.");
                // Intentamos notificar a la UI si es posible, o retornamos un objeto error específico
                return { error: true, message: "PERMISOS_INSUFICIENTES" };
            }

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            if (data && data.error) {
                Logger.error(`Error de GAS en acción ${action}:`, data.message);
                return null;
            }
            return data;
        } catch (error) {
            Logger.error(`Fallo crítico de red en acción ${action}:`, error);
            return null;
        }
    },

    async fetchItems() {
        const CACHE_KEY = 'sibim_inventory_cache';
        const CACHE_TIME_KEY = 'sibim_cache_timestamp';
        const TTL = 300000;

        try {
            const cachedData = localStorage.getItem(CACHE_KEY);
            const lastFetch = localStorage.getItem(CACHE_TIME_KEY);
            const now = Date.now();

            if (cachedData && lastFetch && (now - lastFetch < TTL)) {
                Logger.log('Usando Caché Local...');
                const parsed = JSON.parse(cachedData);
                if (Array.isArray(parsed)) return parsed;
            }

            Logger.log('Sincronizando Inventario con Cloud...');
            const data = await this.gasFetch('getItems');
            const items = data ? (data.items || data) : null;

            if (!Array.isArray(items)) {
                Logger.error('Formato inválido en Inventario');
                return [];
            }

            localStorage.setItem(CACHE_KEY, JSON.stringify(items));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());
            return items;
        } catch (error) {
            const emergencyCache = localStorage.getItem(CACHE_KEY);
            return emergencyCache ? JSON.parse(emergencyCache) : [];
        }
    },

    async addItem(itemData) {
        try {
            const response = await fetch(CONFIG.scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'addItem',
                    data: itemData
                })
            });
            // Al agregar, invalidamos el caché para forzar actualización
            localStorage.removeItem('sibim_cache_timestamp');
            return { success: true };
        } catch (error) {
            Logger.error('Error adding item:', error);
            return { success: false, error };
        }
    },

    async updateItem(data) {
        try {
            const response = await fetch(CONFIG.scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'updateItem',
                    data: data
                })
            });
            localStorage.removeItem('sibim_cache_timestamp');
            return { success: true };
        } catch (error) {
            Logger.error('Error updating item:', error);
            return { success: false, error };
        }
    },

    async getItemById(id) {
        if (!id) return null;
        try {
            // 1. Intentar obtención directa (Rápido si el backend lo soporta bien)
            const data = await this.gasFetch('getItemById', { id: id });
            let item = data ? (data.item || data.items || data) : null;

            // Si el backend retornó un objeto vacío o error, seguimos al fallback
            if (item && (item.id || item.codigo || item.Codigo)) return item;

            // 2. Fallback: Buscar en la lista completa (Más robusto ante variaciones de IDs/Códigos)
            Logger.warn(`Búsqueda directa falló para ID: ${id}. Intentando búsqueda local en inventario...`);
            const allItems = await this.fetchItems();
            item = allItems.find(i => {
                const iId = String(i.id || i.ID || i.codigo || i.Codigo || '').toLowerCase();
                const searchId = String(id).toLowerCase();
                return iId === searchId || iId.includes(searchId);
            });

            return item || null;
        } catch (error) {
            Logger.error('Error fetching item by ID:', error);
            return null;
        }
    },

    async batchRestore(items) {
        try {
            const response = await fetch(CONFIG.scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'batchRestore',
                    data: items
                })
            });
            localStorage.removeItem('sibim_cache_timestamp');
            return { success: true };
        } catch (error) {
            Logger.error('Error in batch restore:', error);
            return { success: false, error };
        }
    },

    async addUser(userData) {
        try {
            // Enviamos POST al Script de Google
            const response = await fetch(CONFIG.scriptUrl, {
                method: 'POST',
                mode: 'no-cors', // Importante para Google Apps Script
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'addUser',
                    data: userData
                })
            });
            return { success: true };
        } catch (error) {
            console.error("Error creating user:", error);
            return { success: false, error };
        }
    },

    async getUsers() {
        try {
            Logger.log('Consultando base de datos de usuarios...');
            const data = await this.gasFetch('getUsers');
            const users = data ? (data.users || data) : [];
            return Array.isArray(users) ? users : [];
        } catch (error) {
            return [];
        }
    },

    async getDepartments() {
        try {
            Logger.log('Consultando Departamentos...');
            const data = await this.gasFetch('getDepartments');
            const depts = data ? (data.departments || data) : null;

            if (!depts || (Array.isArray(depts) && depts.length === 0)) {
                return this.getDepartmentsFallback();
            }
            return depts;
        } catch (error) {
            return this.getDepartmentsFallback();
        }
    },

    async getDepartmentsFallback() {
        try {
            const items = await this.fetchItems();
            const uniqueDepts = [...new Set(items.map(i => i.Departamento || i.departamento || 'Sin Asignar'))];
            return uniqueDepts.map((name, index) => ({
                ID: index + 1,
                'Nombre Departamento': name,
                'Encargado': 'Por asignar',
                'Descripcion': 'Cargado desde Inventario',
                'Articulos Asignados': items.filter(i => (i.Departamento || i.departamento) === name).length,
                'Fecha de Creacion': new Date().toLocaleDateString()
            }));
        } catch (e) {
            return [];
        }
    },

    async getMovements() {
        try {
            const data = await this.gasFetch('getMovements');
            return data ? (data.movements || data) : [];
        } catch (error) {
            return [];
        }
    },

    async getUpdates() {
        try {
            const data = await this.gasFetch('getUpdates');
            return data ? (data.updates || data) : [];
        } catch (error) {
            return [];
        }
    },

    async getSystemConfig() {
        try {
            const data = await this.gasFetch('getConfig');
            return data ? (data.config || data) : [];
        } catch (error) {
            return [];
        }
    },

    async getStats() {
        try {
            const items = await this.fetchItems();
            const movements = await this.getMovements();
            const stats = {
                total: items.length,
                departamentos: new Set(items.map(i => i.Departamento || i.departamento)).size,
                bajas: items.filter(i => {
                    const st = i.Estado || i.estado || '';
                    return st.toLowerCase() === 'baja';
                }).length,
                movimientos: movements.length
            };
            return { items, stats };
        } catch (error) {
            return { items: [], stats: { total: 0, departamentos: 0, bajas: 0, movimientos: 0 } };
        }
    },

    async addDepartment(deptData) {
        try {
            const response = await fetch(CONFIG.scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'addDepartment',
                    data: deptData
                })
            });
            return { success: true };
        } catch (error) {
            console.error("Error creating department:", error);
            return { success: false, error };
        }
    }
};
