const UpdatesManager = {
    init() {
        const searchBtn = document.getElementById('search-item-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchItem());
        }
    },

    async searchItem() {
        const id = document.getElementById('inventory-id-search').value;
        if (!id) return alert('Por favor ingrese un ID');

        // Show loading state
        const resultsArea = document.getElementById('search-results');
        resultsArea.innerHTML = '<div class="loader">Buscando...</div>';

        const item = await API.getItemById(id);
        if (item) {
            this.renderEditForm(item);
        } else {
            resultsArea.innerHTML = '<p>No se encontró el artículo.</p>';
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
            const updatedData = {
                id: item.id || item.codigo,
                descripcion: formData.get('descripcion'),
                estado: formData.get('estado'),
                departamento: formData.get('departamento')
            };

            const result = await API.updateItem(updatedData);
            if (result.success) {
                alert('Actualizado con éxito (Sincronización enviada)');
            } else {
                alert('Error al actualizar');
            }
        });
    }
};
