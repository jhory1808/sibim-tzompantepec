const Auth = {
    async login(username, password) {
        try {
            console.log('Intentando login para:', username);

            // Acceso de Emergencia Local (Llave Maestra)
            if (username === 'admin_local' && password === 'C2_2024_2027') {
                const sessionUser = { username: 'Admin Maestro', role: 'Admin', loginTime: new Date() };
                localStorage.setItem('sibim_user', JSON.stringify(sessionUser));
                return true;
            }

            const users = await API.getUsers();
            console.log('Validando contra:', users.length, 'usuarios de la nube');

            if (!users || users.length === 0) {
                console.warn('No se pudieron recuperar usuarios de Google Sheets. Usando solo acceso local.');
                return false;
            }

            // Normalizamos búsqueda para soportar columnas en Inglés o Español
            const user = users.find(u => {
                // Buscamos exacto en las columnas de tu Excel: 'Usuario' y 'Clave'
                const uName = u.Usuario || u.usuario || u.Users || '';
                const uPass = u.Clave || u.clave || u.Password || '';

                // Usuario: Insensible a mayúsculas/minúsculas
                const nameMatch = String(uName).trim().toLowerCase() === String(username).trim().toLowerCase();
                // Clave: Exacta (pero sin espacios extra)
                const passMatch = String(uPass).trim() === String(password).trim();

                return nameMatch && passMatch;
            });

            if (user) {
                console.log('Login exitoso para:', user.Usuario);
                const sessionUser = {
                    username: user.Usuario || user.Nombre || username,
                    role: user.Rol || user.role || 'User',
                    loginTime: new Date()
                };
                localStorage.setItem('sibim_user', JSON.stringify(sessionUser));
                return true;
            }
            console.warn('Credenciales no encontradas en la nube.');
            return false;
        } catch (error) {
            console.error('Error crítico en el proceso de login:', error);
            return false;
        }
    },

    logout() {
        localStorage.removeItem('sibim_user');
        const pathPrefix = window.location.pathname.includes('/pages/') ? '../' : './';
        window.location.href = pathPrefix + 'home.html';
    },

    // Session Timeout - Auto logout after 10m of inactivity
    initTimeout() {
        let timeout;
        const resetTimeout = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                alert('Sesión expirada por inactividad');
                this.logout();
            }, 10 * 60 * 1000); // 10 minutes
        };
        window.onload = resetTimeout;
        document.onmousemove = resetTimeout;
        document.onkeypress = resetTimeout;
        document.onclick = resetTimeout;
        resetTimeout();
    },

    // Theme Management
    applyTheme(theme) {
        document.body.className = theme ? `theme-${theme}` : '';
        localStorage.setItem('sibim_theme', theme);
    },

    initTheme() {
        const savedTheme = localStorage.getItem('sibim_theme');
        if (savedTheme) this.applyTheme(savedTheme);
    },

    getCurrentUser() {
        const user = localStorage.getItem('sibim_user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        return !!this.getCurrentUser();
    },

    checkAccess() {
        if (!this.isAuthenticated()) {
            const pathPrefix = window.location.pathname.includes('/pages/') ? '../' : './';
            window.location.href = pathPrefix + 'login.html';
        }
    },

    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'Admin';
    },

    getPermissions(role) {
        const roleLower = String(role || '').toLowerCase();

        // 1. Administrador: Acceso total a todos los repositorios (CRUD, usuarios, etc)
        if (roleLower === 'admin' || roleLower === 'administrador') return ['*'];

        // 2. Usuarios: Pueden ver todos los repositorios sin poder eliminar ni agregar, solo visualizar y exportar reportes
        // Incluimos todos los repositorios relevantes
        if (roleLower === 'usuarios' || roleLower === 'usuario') {
            return [
                'index.html',
                'inventory.html',
                'qr-repository.html',
                'labels-repository.html',
                'scanner.html',
                'departments.html',
                'movements.html',
                'reports.html'
            ];
        }

        // 3. Capturistas: Dashboard, Inventario (agregar), QR (buscar/update), Etiquetas (imprimir) y Escáner QR
        if (roleLower === 'capturistas' || roleLower === 'capturista') {
            return [
                'index.html',
                'inventory.html',
                'qr-repository.html',
                'labels-repository.html',
                'scanner.html'
            ];
        }

        return ['index.html']; // Acceso básico por defecto
    },

    isPageAllowed(pageName) {
        const user = this.getCurrentUser();
        if (!user) return false;

        const permissions = this.getPermissions(user.role);
        if (permissions.includes('*')) return true;

        // Limpiamos el nombre de la página (ej: 'pages/reports.html' -> 'reports.html')
        const cleanPage = pageName.split('/').pop().split('?')[0];

        // index.html es permitido para todos usualmente
        if (cleanPage === 'index.html' || cleanPage === '') return true;

        return permissions.includes(cleanPage);
    }
};
