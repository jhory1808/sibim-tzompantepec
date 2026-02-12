const UpdatesManager = {
    init() {
        const searchBtn = document.getElementById('search-item-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchItem());
        }
    },

    async searchItem() {
        const query = document.getElementById('inventory-id-search').value.trim().toLowerCase();
        if (!query) return UI.showToast('Por favor ingrese un término de búsqueda', 'warning');

        // Show loading state
        const resultsArea = document.getElementById('search-results');
        resultsArea.innerHTML = '<div style="padding:20px; text-align:center;"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>';

        try {
            const items = await API.fetchItems();
            const found = items.find(i => {
                const code = (i.id || i.ID || i.codigo || i.Codigo || '').toString().toLowerCase();
                const name = (i.descripcion || i.nombre || i.Articulo || '').toString().toLowerCase();
                const serial = (i.serie || i.Numero_Serie || '').toString().toLowerCase();
                return code === query || code.includes(query) || name.includes(query) || serial.includes(query);
            });

            if (found) {
                this.renderEditForm(found);
            } else {
                resultsArea.innerHTML = '<p style="color:var(--text-secondary); padding:20px;">No se encontró el artículo que coincida con la búsqueda.</p>';
            }
        } catch (e) {
            resultsArea.innerHTML = '<p style="color:#e74c3c;">Error al conectar con la base de datos.</p>';
        }
    },

    renderEditForm(item) {
        const resultsArea = document.getElementById('search-results');
        resultsArea.innerHTML = `
            <div class="glass neon-border-blue" style="padding: 20px; margin-top: 20px;">
                <h3>Editar Item: ${item.id || item.codigo}</h3>
                <form id="edit-item-form" style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
                    <label>Nombre/Descripción</label>
                    <input type="text" name="descripcion" value="${item.descripcion || ''}" class="glass" style="padding: 8px; color: white;">
                    
                    <label>Estado</label>
                    <select name="estado" class="glass" style="padding: 8px; color: white; background: var(--bg-color);">
                        <option value="Bueno" ${item.estado === 'Bueno' ? 'selected' : ''}>Bueno</option>
                        <option value="Regular" ${item.estado === 'Regular' ? 'selected' : ''}>Regular</option>
                        <option value="Malo" ${item.estado === 'Malo' ? 'selected' : ''}>Malo</option>
                    </select>

                    <label>Departamento</label>
                    <input type="text" name="departamento" value="${item.departamento || ''}" class="glass" style="padding: 8px; color: white;">

                    <button type="submit" class="btn btn-primary" style="margin-top: 10px;">Guardar Cambios</button>
                </form>
            </div>
        `;

        document.getElementById('edit-item-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const currentUser = Auth.getCurrentUser();
            const updatedData = {
                id: item.id || item.codigo || item.Codigo,
                descripcion: formData.get('descripcion'),
                estado: formData.get('estado'),
                departamento: formData.get('departamento'),
                usuario: currentUser ? currentUser.username : 'Desconocido',
                "Codigo QR": `${window.location.host.includes('localhost') ? 'https://sibimtzomp.netlify.app' : window.location.origin}/view.html?id=${item.id || item.codigo || item.Codigo}`,
                "Observaciones": formData.get('descripcion') // Use description as fallbak if no obs field
            };

            const result = await API.updateItem(updatedData);
            if (result.success) {
                UI.showToast('Actualizado con éxito (Sincronización enviada)', 'success');
                localStorage.removeItem('sibim_cache_timestamp'); // Clear cache
            } else {
                UI.showToast('Error al actualizar', 'error');
            }
        });
    }
};
