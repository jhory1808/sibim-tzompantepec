const GOOGLE_SHEETS_CONFIG = {
    // ID ÚNICO de tu hoja de cálculo principal
    SPREADSHEET_ID: '1XUqjJQI3dtZmwm7TYlwcHbbYBd81jszK',
    
    // NOMBRES EXACTOS de las PESTAÑAS (TABS) dentro de la hoja
    SHEET_NAMES: {
        INVENTORY: 'Inventario',      // Pestaña 1
        USERS: 'Usuarios',           // Pestaña 2
        DEPARTMENTS: 'Departamentos', // Pestaña 3
        MOVEMENTS: 'Movimientos',     // Pestaña 4
        UPDATES: 'Actualizaciones',   // Pestaña 5
        CONFIG: 'Configuración'       // Pestaña 6 (opcional)
    },
    
    // Configuración de caché
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutos en milisegundos
    cache: {
        data: {},
        lastUpdate: {}
    }
};

// Función para cargar la API de Google Sheets
async function loadGoogleSheetsAPI() {
    if (!window.gapi || !window.gapi.client) {
        console.error('Google API no está cargada');
        throw new Error('Google API no está disponible');
    }
    
    if (!gapi.client.sheets) {
        await gapi.client.load('sheets', 'v4');
    }
}

// Función para procesar datos con mapeo de columnas
async function getSheetDataWithMapping(sheetName, useCache = true) {
    const cacheKey = sheetName.toLowerCase();
    const now = Date.now();
    
    // Verificar caché
    if (useCache && 
        GOOGLE_SHEETS_CONFIG.cache.data[cacheKey] && 
        GOOGLE_SHEETS_CONFIG.cache.lastUpdate[cacheKey] &&
        (now - GOOGLE_SHEETS_CONFIG.cache.lastUpdate[cacheKey]) < GOOGLE_SHEETS_CONFIG.CACHE_DURATION) {
        return GOOGLE_SHEETS_CONFIG.cache.data[cacheKey];
    }
    
    try {
        await loadGoogleSheetsAPI();
        
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
            range: `${sheetName}!A:Z`
        });
        
        const rows = response.result.values || [];
        let data = [];
        
        if (rows.length > 0) {
            const headers = rows[0];
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const item = {};
                headers.forEach((header, index) => {
                    // Usar el nombre de la columna como está en Google Sheets
                    item[header.trim()] = row[index] || '';
                });
                data.push(item);
            }
        }
        
        // Actualizar caché
        GOOGLE_SHEETS_CONFIG.cache.data[cacheKey] = data;
        GOOGLE_SHEETS_CONFIG.cache.lastUpdate[cacheKey] = now;
        
        return data;
    } catch (error) {
        console.error(`Error obteniendo datos de ${sheetName}:`, error);
        throw error;
    }
}

// Función para agregar fila a una hoja
async function addRowToSheet(sheetName, rowData) {
    try {
        await loadGoogleSheetsAPI();
        
        const response = await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
            range: `${sheetName}!A:Z`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [rowData]
            }
        });
        
        // Invalidar caché
        const cacheKey = sheetName.toLowerCase();
        delete GOOGLE_SHEETS_CONFIG.cache.data[cacheKey];
        delete GOOGLE_SHEETS_CONFIG.cache.lastUpdate[cacheKey];
        
        return response;
    } catch (error) {
        console.error(`Error agregando fila a ${sheetName}:`, error);
        throw error;
    }
}

// Función para convertir datos del inventario al formato interno
function mapInventoryData(sheetData) {
    return sheetData.map(item => ({
        id: item.ID || item.id || Date.now(),
        code: item.Código || item.Codigo || item.code || '',
        name: item.Nombre || item.name || '',
        brand: item.Marca || item.brand || '',
        model: item.Modelo || item.model || '',
        serial: item['Número de Serie'] || item.serial || '',
        category: item.Categoría || item.category || '',
        group: item.Grupo || item.group || '',
        responsible: item.Responsable || item.responsible || '',
        area: item['Área Asignada'] || item.area || '',
        status: item.Estado || item.status || '',
        department: item.Departamento || item.department || '',
        value: item.Valor || item.value || '$0.00',
        acquisitionDate: item['Fecha Adquisición'] || item.acquisitionDate || '',
        empresa: item.Empresa || item.empresa || 'GORIERNO',
        observations: item.Observaciones || item.observations || '',
        fechaRegistro: item['Fecha Registro'] || item.fechaRegistro || '',
        image: item.Imagen || item.image || '',
        custodyFile: item['Documento Resguardo'] || item.custodyFile || '',
        custodyDate: item['Fecha Resguardo'] || item.custodyDate || '',
        custodyValidity: item['Vigencia Resguardo'] || item.custodyValidity || '12',
        qrCode: item['QR Code'] || item.qrCode || ''
    }));
}

// Función para convertir datos de usuarios al formato interno
function mapUsersData(sheetData) {
    return sheetData.map(user => ({
        id: user.ID || user.id || Date.now(),
        username: user.Usuario || user.username || '',
        password: user.Contraseña || user.password || '',
        nombre: user.Nombre || user.nombre || '',
        apellido: user.Apellido || user.apellido || '',
        email: user.Email || user.email || '',
        telefono: user.Teléfono || user.telefono || '',
        rol: user.Rol || user.rol || '',
        departamento: user.Departamento || user.departamento || '',
        avatar: user.Avatar || user.avatar || (user.Nombre ? user.Nombre.charAt(0) : 'U'),
        fechaRegistro: user['Fecha Registro'] || user.fechaRegistro || '',
        estado: user.Estado || user.estado || 'activo',
        permisos: user.Permisos || user.permisos || '',
        ultimoAcceso: user['Último Acceso'] || user.ultimoAcceso || '',
        ipUltimoAcceso: user['IP Último Acceso'] || user.ipUltimoAcceso || ''
    }));
}

// Función para obtener departamentos
function mapDepartmentsData(sheetData) {
    return sheetData.map(dept => ({
        id: dept.ID || dept.id || Date.now(),
        codigo: dept.Código || dept.codigo || '',
        nombre: dept.Nombre || dept.nombre || '',
        responsable: dept.Responsable || dept.responsable || '',
        telefono: dept.Teléfono || dept.telefono || '',
        email: dept.Email || dept.email || '',
        edificio: dept.Edificio || dept.edificio || '',
        piso: dept.Piso || dept.piso || '',
        area: dept.Área || dept.area || '',
        estado: dept.Estado || dept.estado || 'activo',
        fechaCreacion: dept['Fecha Creación'] || dept.fechaCreacion || '',
        articulosAsignados: parseInt(dept['Artículos Asignados'] || dept.articulosAsignados || '0'),
        valorTotal: dept['Valor Total'] || dept.valorTotal || '$0.00'
    }));
}

// Actualizar función getInventoryFromSheets
async function getInventoryFromSheets(useCache = true) {
    const sheetData = await getSheetDataWithMapping(GOOGLE_SHEETS_CONFIG.SHEET_NAMES.INVENTORY, useCache);
    return mapInventoryData(sheetData);
}

// Actualizar función getUsersFromSheets
async function getUsersFromSheets(useCache = true) {
    const sheetData = await getSheetDataWithMapping(GOOGLE_SHEETS_CONFIG.SHEET_NAMES.USERS, useCache);
    return mapUsersData(sheetData);
}

// Función para obtener departamentos desde Google Sheets
async function getDepartmentsFromSheets(useCache = true) {
    const sheetData = await getSheetDataWithMapping(GOOGLE_SHEETS_CONFIG.SHEET_NAMES.DEPARTMENTS, useCache);
    return mapDepartmentsData(sheetData);
}

// Función para preparar datos del inventario para Google Sheets
function prepareInventoryForSheets(itemData) {
    return [
        itemData.id || '',
        itemData.code || '',
        itemData.name || '',
        itemData.brand || '',
        itemData.model || '',
        itemData.serial || '',
        itemData.category || '',
        itemData.group || '',
        itemData.responsible || '',
        itemData.area || '',
        itemData.status || '',
        itemData.department || '',
        itemData.value || '$0.00',
        itemData.acquisitionDate || '',
        itemData.empresa || 'GORIERNO',
        itemData.observations || '',
        itemData.fechaRegistro || new Date().toISOString().split('T')[0],
        itemData.image || '',
        itemData.custodyFile || '',
        itemData.custodyDate || '',
        itemData.custodyValidity || '12',
        itemData.qrCode || ''
    ];
}

// Función para preparar datos de usuario para Google Sheets
function prepareUserForSheets(userData) {
    return [
        userData.id || '',
        userData.username || '',
        userData.password || '',
        userData.nombre || '',
        userData.apellido || '',
        userData.email || '',
        userData.telefono || '',
        userData.rol || '',
        userData.departamento || '',
        userData.avatar || '',
        userData.fechaRegistro || new Date().toISOString().split('T')[0],
        userData.estado || 'activo',
        userData.permisos || '',
        userData.ultimoAcceso || '',
        userData.ipUltimoAcceso || ''
    ];
}

// Función para registrar movimiento en Google Sheets
async function logMovementToSheets(movementData) {
    try {
        const rowData = [
            movementData.id || '',
            movementData.fecha || new Date().toISOString().split('T')[0],
            movementData.hora || new Date().toLocaleTimeString('es-MX'),
            movementData.usuario || '',
            movementData.accion || '',
            movementData.tipo || '',
            movementData.detalles || '',
            movementData.idArticulo || '',
            movementData.codigoArticulo || '',
            movementData.nombreArticulo || '',
            movementData.departamentoOrigen || '',
            movementData.departamentoDestino || '',
            movementData.valor || '',
            movementData.estadoAnterior || '',
            movementData.estadoNuevo || '',
            movementData.ipUsuario || '',
            movementData.navegador || navigator.userAgent.substring(0, 50),
            movementData.sesionId || Date.now().toString()
        ];
        
        await addRowToSheet(GOOGLE_SHEETS_CONFIG.SHEET_NAMES.MOVEMENTS, rowData);
        return { success: true };
    } catch (error) {
        console.error('Error registrando movimiento en Google Sheets:', error);
        return { success: false, error: error.message };
    }
}

// Función para registrar actualización en Google Sheets
async function logUpdateToSheets(updateData) {
    try {
        const rowData = [
            updateData.id || '',
            updateData.fecha || new Date().toISOString().split('T')[0],
            updateData.hora || new Date().toLocaleTimeString('es-MX'),
            updateData.usuario || '',
            updateData.tipoActualizacion || '',
            updateData.tablaAfectada || '',
            updateData.idRegistro || '',
            updateData.campoModificado || '',
            updateData.valorAnterior || '',
            updateData.valorNuevo || '',
            updateData.descripcion || '',
            updateData.sistema || 'SIBIM',
            updateData.version || '3.0',
            updateData.ip || '',
            updateData.autorizadoPor || ''
        ];
        
        await addRowToSheet(GOOGLE_SHEETS_CONFIG.SHEET_NAMES.UPDATES, rowData);
        return { success: true };
    } catch (error) {
        console.error('Error registrando actualización en Google Sheets:', error);
        return { success: false, error: error.message };
    }
}

// Función para limpiar caché específica
function clearCache(sheetName = null) {
    if (sheetName) {
        const cacheKey = sheetName.toLowerCase();
        delete GOOGLE_SHEETS_CONFIG.cache.data[cacheKey];
        delete GOOGLE_SHEETS_CONFIG.cache.lastUpdate[cacheKey];
    } else {
        GOOGLE_SHEETS_CONFIG.cache.data = {};
        GOOGLE_SHEETS_CONFIG.cache.lastUpdate = {};
    }
}

// Exportar funciones y configuración
window.GOOGLE_SHEETS_CONFIG = GOOGLE_SHEETS_CONFIG;
window.googleSheetsAPI = {
    getSheetDataWithMapping,
    getInventoryFromSheets,
    getUsersFromSheets,
    getDepartmentsFromSheets,
    addRowToSheet,
    logMovementToSheets,
    logUpdateToSheets,
    prepareInventoryForSheets,
    prepareUserForSheets,
    clearCache
};