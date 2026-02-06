// js/inventory-manager.js
class InventoryManager {
    constructor() {
        this.currentData = [];
        this.currentFilter = '';
        this.currentCategory = '';
        this.sortField = 'name';
        this.sortDirection = 'asc';
    }

    // Cargar inventario desde Google Sheets
    async loadInventory() {
        try {
            console.log('Cargando inventario desde Google Sheets...');
            showLoading('inventory-table');
            
            // Usar la función de tu google-sheets.js
            this.currentData = await googleSheetsAPI.getInventoryFromSheets(false); // false = sin caché para datos frescos
            console.log(`Inventario cargado: ${this.currentData.length} artículos`);
            
            this.renderInventoryTable();
            this.updateInventoryStats();
            
            return this.currentData;
        } catch (error) {
            console.error('Error cargando inventario:', error);
            showError('inventory-table', 'Error cargando inventario. Verifica la conexión.');
            return [];
        }
    }

    // Renderizar la tabla de inventario
    renderInventoryTable() {
        const container = document.getElementById('inventory-table');
        if (!container) return;
        
        // Filtrar datos si hay filtros activos
        let filteredData = this.currentData;
        
        if (this.currentFilter) {
            const filterLower = this.currentFilter.toLowerCase();
            filteredData = filteredData.filter(item => 
                item.name.toLowerCase().includes(filterLower) ||
                item.code.toLowerCase().includes(filterLower) ||
                item.serial.toLowerCase().includes(filterLower)
            );
        }
        
        if (this.currentCategory) {
            filteredData = filteredData.filter(item => 
                item.category === this.currentCategory
            );
        }
        
        // Ordenar datos
        filteredData.sort((a, b) => {
            let aValue = a[this.sortField] || '';
            let bValue = b[this.sortField] || '';
            
            if (this.sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
        
        // Generar HTML de la tabla
        const tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th onclick="inventoryManager.sortTable('code')">Código</th>
                        <th onclick="inventoryManager.sortTable('name')">Nombre</th>
                        <th onclick="inventoryManager.sortTable('category')">Categoría</th>
                        <th onclick="inventoryManager.sortTable('brand')">Marca</th>
                        <th onclick="inventoryManager.sortTable('model')">Modelo</th>
                        <th onclick="inventoryManager.sortTable('serial')">N° Serie</th>
                        <th onclick="inventoryManager.sortTable('responsible')">Responsable</th>
                        <th onclick="inventoryManager.sortTable('status')">Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredData.map(item => `
                        <tr>
                            <td><strong>${item.code || 'N/A'}</strong></td>
                            <td>${item.name || ''}</td>
                            <td><span class="badge badge-category">${item.category || 'Sin categoría'}</span></td>
                            <td>${item.brand || ''}</td>
                            <td>${item.model || ''}</td>
                            <td>${item.serial || ''}</td>
                            <td>${item.responsible || ''}</td>
                            <td><span class="badge badge-${this.getStatusClass(item.status)}">${item.status || 'Desconocido'}</span></td>
                            <td class="action-buttons">
                                <button class="btn-icon btn-view" title="Ver Detalles" onclick="inventoryManager.viewItem('${item.id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-icon btn-edit" title="Editar" onclick="inventoryManager.editItem('${item.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon btn-qr" title="Generar QR" onclick="inventoryManager.generateQR('${item.id}')">
                                    <i class="fas fa-qrcode"></i>
                                </button>
                                <button class="btn-icon btn-delete" title="Eliminar" onclick="inventoryManager.deleteItem('${item.id}', '${item.name}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${filteredData.length === 0 ? '<p class="no-data">No se encontraron artículos con los filtros aplicados.</p>' : ''}
        `;
        
        container.innerHTML = tableHTML;
        this.updateInventorySummary(filteredData.length);
    }

    // Clase CSS según estado
    getStatusClass(status) {
        const statusMap = {
            'Disponible': 'success',
            'En Uso': 'info',
            'Mantenimiento': 'warning',
            'Dañado': 'danger',
            'Baja': 'secondary'
        };
        return statusMap[status] || 'secondary';
    }

    // Actualizar estadísticas
    updateInventoryStats() {
        const totalItems = this.currentData.length;
        const totalValue = this.currentData.reduce((sum, item) => {
            const value = parseFloat(item.value?.replace(/[^0-9.-]+/g, "") || 0);
            return sum + value;
        }, 0);
        
        // Actualizar elementos en la página
        const totalElement = document.getElementById('inventory-total');
        const valueElement = document.getElementById('inventory-value');
        
        if (totalElement) totalElement.textContent = totalItems;
        if (valueElement) valueElement.textContent = totalValue.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Actualizar resumen
    updateInventorySummary(filteredCount) {
        const summaryElement = document.getElementById('inventory-summary');
        if (summaryElement) {
            const total = this.currentData.length;
            summaryElement.innerHTML = `
                <p><strong>Mostrando:</strong> ${filteredCount} de ${total} artículos</p>
                ${filteredCount < total ? `<p><small>Aplicando filtros. <a href="#" onclick="inventoryManager.clearFilters()">Limpiar filtros</a></small></p>` : ''}
            `;
        }
    }

    // Ordenar tabla
    sortTable(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        this.renderInventoryTable();
    }

    // Aplicar filtros
    applyFilters() {
        const searchInput = document.getElementById('search-inventory');
        const categorySelect = document.getElementById('filter-category');
        
        this.currentFilter = searchInput ? searchInput.value : '';
        this.currentCategory = categorySelect ? categorySelect.value : '';
        
        this.renderInventoryTable();
    }

    // Limpiar filtros
    clearFilters() {
        this.currentFilter = '';
        this.currentCategory = '';
        
        const searchInput = document.getElementById('search-inventory');
        const categorySelect = document.getElementById('filter-category');
        
        if (searchInput) searchInput.value = '';
        if (categorySelect) categorySelect.value = '';
        
        this.renderInventoryTable();
    }

    // Cargar categorías para el filtro
    async loadCategories() {
        const categories = [...new Set(this.currentData.map(item => item.category).filter(Boolean))];
        const select = document.getElementById('filter-category');
        
        if (select) {
            select.innerHTML = `
                <option value="">Todas las categorías</option>
                ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            `;
        }
    }

    // VER artículo
    viewItem(itemId) {
        const item = this.currentData.find(i => i.id == itemId);
        if (!item) return;
        
        this.showItemModal(item, 'view');
    }

    // EDITAR artículo
    async editItem(itemId) {
        const item = this.currentData.find(i => i.id == itemId);
        if (!item) return;
        
        this.showItemModal(item, 'edit');
    }

    // NUEVO artículo
    newItem() {
        const emptyItem = {
            id: 'NEW-' + Date.now(),
            code: '',
            name: '',
            brand: '',
            model: '',
            serial: '',
            category: '',
            group: '',
            responsible: '',
            area: '',
            status: 'Disponible',
            department: '',
            value: '$0.00',
            acquisitionDate: '',
            empresa: 'GOBIERNO',
            observations: '',
            fechaRegistro: new Date().toISOString().split('T')[0],
            image: '',
            custodyFile: '',
            custodyDate: '',
            custodyValidity: '12',
            qrCode: ''
        };
        
        this.showItemModal(emptyItem, 'new');
    }

    // Mostrar modal de artículo
    showItemModal(item, mode) {
        const modalTitle = mode === 'view' ? 'Ver Artículo' : 
                          mode === 'edit' ? 'Editar Artículo' : 'Nuevo Artículo';
        
        const isView = mode === 'view';
        
        const modalHTML = `
            <div class="modal-overlay" id="item-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${modalTitle}</h3>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="item-form" onsubmit="return inventoryManager.saveItem(event, '${mode}')">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Código *</label>
                                    <input type="text" name="code" value="${item.code}" 
                                           ${isView ? 'readonly' : 'required'}>
                                </div>
                                
                                <div class="form-group">
                                    <label>Nombre *</label>
                                    <input type="text" name="name" value="${item.name}" 
                                           ${isView ? 'readonly' : 'required'}>
                                </div>
                                
                                <div class="form-group">
                                    <label>Categoría</label>
                                    <input type="text" name="category" value="${item.category}" 
                                           ${isView ? 'readonly' : ''}>
                                </div>
                                
                                <div class="form-group">
                                    <label>Marca</label>
                                    <input type="text" name="brand" value="${item.brand}" 
                                           ${isView ? 'readonly' : ''}>
                                </div>
                                
                                <div class="form-group">
                                    <label>Modelo</label>
                                    <input type="text" name="model" value="${item.model}" 
                                           ${isView ? 'readonly' : ''}>
                                </div>
                                
                                <div class="form-group">
                                    <label>Número de Serie</label>
                                    <input type="text" name="serial" value="${item.serial}" 
                                           ${isView ? 'readonly' : ''}>
                                </div>
                                
                                <div class="form-group">
                                    <label>Responsable</label>
                                    <input type="text" name="responsible" value="${item.responsible}" 
                                           ${isView ? 'readonly' : ''}>
                                </div>
                                
                                <div class="form-group">
                                    <label>Estado</label>
                                    <select name="status" ${isView ? 'disabled' : ''}>
                                        <option value="Disponible" ${item.status === 'Disponible' ? 'selected' : ''}>Disponible</option>
                                        <option value="En Uso" ${item.status === 'En Uso' ? 'selected' : ''}>En Uso</option>
                                        <option value="Mantenimiento" ${item.status === 'Mantenimiento' ? 'selected' : ''}>Mantenimiento</option>
                                        <option value="Dañado" ${item.status === 'Dañado' ? 'selected' : ''}>Dañado</option>
                                        <option value="Baja" ${item.status === 'Baja' ? 'selected' : ''}>Baja</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label>Valor</label>
                                    <input type="text" name="value" value="${item.value}" 
                                           ${isView ? 'readonly' : ''}>
                                </div>
                                
                                <div class="form-group full-width">
                                    <label>Observaciones</label>
                                    <textarea name="observations" rows="3" 
                                              ${isView ? 'readonly' : ''}>${item.observations || ''}</textarea>
                                </div>
                            </div>
                            
                            ${!isView ? `
                                <div class="form-actions">
                                    <button type="button" class="btn btn-secondary" onclick="closeModal()">
                                        Cancelar
                                    </button>
                                    <button type="submit" class="btn btn-primary">
                                        ${mode === 'new' ? 'Guardar Artículo' : 'Actualizar Artículo'}
                                    </button>
                                </div>
                            ` : ''}
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar modal al body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Guardar artículo (nuevo o editar) - MODIFICADA CON GENERACIÓN AUTOMÁTICA DE QR
    async saveItem(event, mode) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        // Convertir FormData a objeto
        const itemData = {};
        formData.forEach((value, key) => {
            itemData[key] = value;
        });
        
        // Si es nuevo, generar ID
        if (mode === 'new') {
            itemData.id = 'ITM-' + Date.now();
            itemData.fechaRegistro = new Date().toISOString().split('T')[0];
        }
        
        try {
            showLoading('item-modal');
            
            // 1. Guardar en Google Sheets
            console.log('Guardando artículo en Google Sheets...');
            const sheetData = googleSheetsAPI.prepareInventoryForSheets(itemData);
            
            const result = await googleSheetsAPI.addRowToSheet(
                GOOGLE_SHEETS_CONFIG.SHEET_NAMES.INVENTORY, 
                sheetData
            );
            
            if (!result.success) {
                throw new Error('Error al guardar en Google Sheets');
            }
            
            console.log('✅ Artículo guardado en Google Sheets');
            
            // 2. GENERAR QR AUTOMÁTICAMENTE (NUEVO)
            console.log('Generando QR automático para artículo...');
            
            // Verificar si el módulo QR existe
            if (window.qrModule && typeof qrModule.autoGenerateQRForArticle === 'function') {
                try {
                    const qrResult = await qrModule.autoGenerateQRForArticle(itemData, mode);
                    
                    if (qrResult && qrResult.success) {
                        console.log('✅ QR generado automáticamente');
                        console.log('URL del artículo:', qrResult.url);
                        
                        // Actualizar el artículo con la información del QR
                        if (qrResult.qrCodeData) {
                            itemData.qrCode = qrResult.qrCodeData;
                            itemData.qrImageUrl = qrResult.imageUrl;
                            
                            // Si tenemos URL, actualizar en Google Sheets
                            if (qrResult.url) {
                                const updateData = {
                                    ...sheetData,
                                    qrCode: qrResult.url || '',
                                    qrImage: qrResult.imageUrl || ''
                                };
                                
                                // Actualizar fila con información del QR
                                await googleSheetsAPI.updateRowInSheet(
                                    GOOGLE_SHEETS_CONFIG.SHEET_NAMES.INVENTORY,
                                    itemData.id,
                                    updateData
                                );
                            }
                        }
                        
                        // Opcional: Mostrar el QR generado inmediatamente
                        setTimeout(() => {
                            if (qrResult.qrData && qrModule.generateQRCode) {
                                qrModule.generateQRCode(qrResult.qrData, 200);
                                
                                // Mostrar notificación con enlace para ver QR
                                const qrNotification = `
                                    <div class="qr-notification">
                                        <p>✅ QR generado exitosamente para ${itemData.name}</p>
                                        <small>Código: ${itemData.code}</small>
                                        <div class="notification-actions">
                                            <button onclick="qrModule.downloadQRCode('${itemData.code}')">Descargar QR</button>
                                            <button onclick="inventoryManager.viewQR('${itemData.id}')">Ver QR</button>
                                        </div>
                                    </div>
                                `;
                                
                                // Insertar notificación en la página
                                const notificationContainer = document.getElementById('qr-notifications') || 
                                    (() => {
                                        const div = document.createElement('div');
                                        div.id = 'qr-notifications';
                                        div.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999;';
                                        document.body.appendChild(div);
                                        return div;
                                    })();
                                    
                                notificationContainer.innerHTML = qrNotification;
                                
                                // Auto-remover después de 10 segundos
                                setTimeout(() => {
                                    const qrNotif = document.querySelector('.qr-notification');
                                    if (qrNotif) qrNotif.remove();
                                }, 10000);
                            }
                        }, 1000);
                        
                    } else {
                        console.warn('⚠️ QR no generado:', qrResult?.error || 'Sin detalles');
                        showNotification('QR no generado automáticamente', 'warning');
                    }
                } catch (qrError) {
                    console.error('Error generando QR:', qrError);
                    // No interrumpir el flujo principal por error en QR
                }
            } else {
                console.log('Módulo QR no disponible para generación automática');
                showNotification('Módulo QR no disponible', 'info');
            }
            
            // 3. Registrar movimiento
            await googleSheetsAPI.logMovementToSheets({
                accion: mode === 'new' ? 'CREACIÓN' : 'ACTUALIZACIÓN',
                tipo: 'INVENTARIO',
                detalles: `${mode === 'new' ? 'Nuevo artículo creado' : 'Artículo actualizado'}${window.qrModule ? ' con QR' : ''}`,
                idArticulo: itemData.id,
                codigoArticulo: itemData.code,
                nombreArticulo: itemData.name,
                usuario: 'Usuario Actual'
            });
            
            // 4. Cerrar modal y recargar
            closeModal();
            await this.loadInventory();
            
            // Mostrar mensaje de éxito final
            showNotification(
                mode === 'new' ? 
                '✅ Artículo creado exitosamente' + (window.qrModule ? ' con código QR' : '') : 
                '✅ Artículo actualizado exitosamente' + (window.qrModule ? ' con nuevo QR' : ''),
                'success'
            );
            
        } catch (error) {
            console.error('Error guardando artículo:', error);
            showNotification('❌ Error: ' + error.message, 'error');
            
            // Mostrar error específico si es de Google Sheets
            if (error.message.includes('Google Sheets')) {
                showNotification('Error de conexión con Google Sheets. Verifica tu conexión a internet.', 'error');
            }
        }
    }

    // Función para ver QR generado
    async viewQR(itemId) {
        const item = this.currentData.find(i => i.id == itemId);
        if (!item) {
            showNotification('Artículo no encontrado', 'error');
            return;
        }
        
        // Navegar a la página de QR
        if (window.menuSystem) {
            menuSystem.navigateTo('qrgenerator');
            
            // Cargar datos del artículo en el generador de QR
            setTimeout(() => {
                const qrContentInput = document.getElementById('qr-content');
                const qrNameInput = document.getElementById('qr-name');
                
                if (qrContentInput) {
                    const qrContent = `SIBIM|${item.code}|${item.name}|${item.serial}|${item.id}`;
                    qrContentInput.value = qrContent;
                }
                
                if (qrNameInput) {
                    qrNameInput.value = `${item.code} - ${item.name}`;
                }
                
                // Si el módulo QR existe, generar inmediatamente
                if (window.qrModule && typeof qrModule.generateQRCode === 'function') {
                    setTimeout(() => {
                        qrModule.generateQRCode(qrContentInput.value, 250);
                    }, 300);
                }
                
                showNotification('Cargado para generación de QR', 'info');
            }, 500);
        }
    }

    // ELIMINAR artículo
    async deleteItem(itemId, itemName) {
        if (!confirm(`¿Estás seguro de eliminar el artículo "${itemName}"? Esta acción no se puede deshacer.`)) {
            return;
        }
        
        try {
            // Nota: Esta implementación agrega una nueva fila con estado "Eliminado"
            // Para eliminar físicamente la fila, necesitarías una función adicional en google-sheets.js
            const item = this.currentData.find(i => i.id == itemId);
            if (item) {
                item.status = 'Baja';
                
                const sheetData = googleSheetsAPI.prepareInventoryForSheets(item);
                await googleSheetsAPI.addRowToSheet(
                    GOOGLE_SHEETS_CONFIG.SHEET_NAMES.INVENTORY, 
                    sheetData
                );
                
                // Registrar movimiento
                await googleSheetsAPI.logMovementToSheets({
                    accion: 'ELIMINACIÓN',
                    tipo: 'INVENTARIO',
                    detalles: `Artículo marcado como baja: ${itemName}`,
                    idArticulo: itemId,
                    codigoArticulo: item.code,
                    nombreArticulo: itemName,
                    usuario: 'Usuario Actual'
                });
                
                // Recargar inventario
                await this.loadInventory();
                
                showNotification('Artículo marcado como baja', 'warning');
            }
        } catch (error) {
            console.error('Error eliminando artículo:', error);
            showNotification('Error eliminando artículo', 'error');
        }
    }

    // Generar QR
    generateQR(itemId) {
        const item = this.currentData.find(i => i.id == itemId);
        if (!item) return;
        
        // Navegar a la página de generación de QR
        if (window.menuSystem) {
            menuSystem.navigateTo('qrgenerator');
            
            // Pasar datos del artículo al generador de QR
            setTimeout(() => {
                const qrInput = document.getElementById('qr-content');
                if (qrInput) {
                    qrInput.value = `SIBIM-${item.code}|${item.name}|${item.serial}`;
                }
            }, 500);
        }
    }
    
    // Función para cargar artículos en el selector rápido de QR
    loadArticlesForQRSelector() {
        const select = document.getElementById('quick-article');
        if (!select || !this.currentData || this.currentData.length === 0) return;
        
        // Agrupar artículos por categoría para mejor organización
        const categories = [...new Set(this.currentData
            .map(item => item.category)
            .filter(Boolean)
            .sort())];
        
        let optionsHTML = '<option value="">Seleccionar artículo...</option>';
        
        // Primero, artículos recientes (últimos 10)
        const recentItems = this.currentData
            .filter(item => item.fechaRegistro)
            .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro))
            .slice(0, 10);
        
        if (recentItems.length > 0) {
            optionsHTML += '<optgroup label="Artículos Recientes">';
            recentItems.forEach(item => {
                optionsHTML += `<option value="${item.id}">${item.code} - ${item.name}</option>`;
            });
            optionsHTML += '</optgroup>';
        }
        
        // Luego, organizar por categoría
        categories.forEach(category => {
            const categoryItems = this.currentData
                .filter(item => item.category === category)
                .slice(0, 20); // Máximo 20 por categoría para no saturar
            
            if (categoryItems.length > 0) {
                optionsHTML += `<optgroup label="${category}">`;
                categoryItems.forEach(item => {
                    optionsHTML += `<option value="${item.id}">${item.code} - ${item.name}</option>`;
                });
                optionsHTML += '</optgroup>';
            }
        });
        
        select.innerHTML = optionsHTML;
    }
}

// Funciones auxiliares
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando...</p></div>';
    }
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="error-message"><p>${message}</p></div>`;
    }
}

function showNotification(message, type = 'info') {
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <p>${message}</p>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Estilos para las notificaciones
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem;
        background: ${type === 'success' ? '#d4edda' : 
                     type === 'error' ? '#f8d7da' : 
                     type === 'warning' ? '#fff3cd' : '#d1ecf1'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : 
                           type === 'error' ? '#f5c6cb' : 
                           type === 'warning' ? '#ffeaa7' : '#bee5eb'};
        border-left: 5px solid ${type === 'success' ? '#28a745' : 
                                type === 'error' ? '#dc3545' : 
                                type === 'warning' ? '#ffc107' : '#17a2b8'};
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 9999;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    // Agregar estilos CSS para la animación si no existen
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            .notification {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }
            
            .notification p {
                margin: 0;
                flex: 1;
            }
            
            .notification button {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: #666;
                padding-left: 1rem;
            }
            
            .qr-notification {
                background: white;
                border-radius: 8px;
                padding: 1rem;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                margin-bottom: 10px;
                border-left: 4px solid #38a3a5;
            }
            
            .qr-notification p {
                margin: 0 0 5px 0;
                font-weight: bold;
            }
            
            .qr-notification small {
                color: #666;
                display: block;
                margin-bottom: 10px;
            }
            
            .notification-actions {
                display: flex;
                gap: 10px;
            }
            
            .notification-actions button {
                padding: 5px 10px;
                border: none;
                border-radius: 4px;
                background: #1a5f7a;
                color: white;
                cursor: pointer;
                font-size: 0.8rem;
            }
            
            .notification-actions button:hover {
                background: #38a3a5;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

function closeModal() {
    const modal = document.getElementById('item-modal');
    if (modal) {
        modal.remove();
    }
}

// Inicializar InventoryManager global
window.inventoryManager = new InventoryManager();

// Función global para abrir nuevo artículo
window.nuevoItem = function() {
    inventoryManager.newItem();
};

// Función global para aplicar filtros
window.applyFilters = function() {
    inventoryManager.applyFilters();
};

// Exportar para usar en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventoryManager;
}