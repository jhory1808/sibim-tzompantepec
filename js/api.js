const API = {
    async fetchItems() {
        const CACHE_KEY = 'sibim_inventory_cache';
        const CACHE_TIME_KEY = 'sibim_cache_timestamp';
        const TTL = 300000; // 5 minutos de caché

        try {
            const cachedData = localStorage.getItem(CACHE_KEY);
            const lastFetch = localStorage.getItem(CACHE_TIME_KEY);
            const now = Date.now();

            if (cachedData && lastFetch && (now - lastFetch < TTL)) {
                Logger.log('Usando Caché Local (Velocidad SQLite)...');
                const parsed = JSON.parse(cachedData);
                if (Array.isArray(parsed)) return parsed;
            }

            Logger.log('Caché expirado. Sincronizando con Google Cloud...');
            const url = `${CONFIG.scriptUrl}?action=getItems&t=${Date.now()}`;
            const response = await fetch(url);

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const data = await response.json();
            const items = data.items || data;

            if (!Array.isArray(items)) {
                Logger.error('Formato de datos inválido desde GAS:', data);
                return [];
            }

            if (items.length > 0) {
                Logger.log('Muestra del primer registro:', items[0]);
                Logger.log('Columnas detectadas:', Object.keys(items[0]).join(', '));
            }

            localStorage.setItem(CACHE_KEY, JSON.stringify(items));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());

            Logger.log(`${items.length} bienes sincronizados.`);
            return items;
        } catch (error) {
            Logger.error('Error de red/GAS:', error);
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
        try {
            const response = await fetch(`${CONFIG.scriptUrl}?action=getItemById&id=${id}`);
            return await response.json();
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

    async getUsers() {
        try {
            Logger.log('Consultando base de datos de usuarios...');
            // Agregamos un timestamp para evitar que el navegador cachee una respuesta fallida o vieja
            const url = `${CONFIG.scriptUrl}?action=getUsers&t=${Date.now()}`;
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                redirect: 'follow'
            });

            const data = await response.json();
            const users = data.users || data || [];
            if (!Array.isArray(users)) return [];

            if (users.length > 0) {
                Logger.log('Columnas detectadas en Usuarios:', Object.keys(users[0]).join(', '));
            }

            Logger.log(`${users.length} usuarios encontrados.`);
            return users;
        } catch (error) {
            Logger.error('Error al recuperar usuarios (CORS o Red/GAS):', error);
            return [];
        }
    },

    async getStats() {
        try {
            const items = await this.fetchItems();
            const stats = {
                total: items.length,
                departamentos: new Set(items.map(i => i.Departamento || i.departamento)).size,
                bajas: items.filter(i => {
                    const st = i.Estado || i.estado || '';
                    return st.toLowerCase() === 'baja';
                }).length,
                movimientos: Math.floor(items.length * 0.15) // Simulado
            };
            return { items, stats };
        } catch (error) {
            return { items: [], stats: { total: 0, departamentos: 0, bajas: 0, movimientos: 0 } };
        }
    }
};
