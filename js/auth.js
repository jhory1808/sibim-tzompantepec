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
                    username: (user.Usuario || user.Nombre || username).trim(),
                    role: user.Rol || user.role || 'User',
                    loginTime: new Date()
                };
                localStorage.setItem('sibim_user', JSON.stringify(sessionUser));

                // Registrar log de inicio de sesión
                this.logActivity('LOGIN', `Inicio de sesión exitoso desde ${navigator.userAgent}`);

                return true;
            }
            console.warn('Credenciales no encontradas en la nube.');
            return false;
        } catch (error) {
            console.error('Error crítico en el proceso de login:', error);
            return false;
        }
    },

    async logActivity(action, details = '') {
        try {
            const user = this.getCurrentUser();
            if (!user) return;

            // Usamos el endpoint de actualización existente (si existe) o simulamos una
            // Para propósitos de este sistema, registramos en el trail de auditoría
            await fetch(CONFIG.scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({
                    action: 'registerAudit', // Asumimos que este endpoint maneja logs genéricos
                    data: {
                        fecha: new Date().toISOString(),
                        usuario: user.username,
                        rol: user.role,
                        accion: action,
                        detalles: details,
                        ip: 'Local/PWA'
                    }
                })
            });
        } catch (e) { console.warn('Activity Log failed', e); }
    },

    trackPresence() {
        if (!this.isAuthenticated()) return;

        // Heartbeat cada 3 minutos
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.logActivity('PRESENCE', 'Usuario en línea');
            }
        }, 3 * 60 * 1000);
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
        if (!user) return false;
        const role = String(user.role || '').toLowerCase();
        return role === 'admin' || role === 'administrador';
    },

    getPermissions(role) {
        const roleLower = String(role || '').toLowerCase();

        // 1. Administrador: Acceso total a todos los repositorios (CRUD, usuarios, etc)
        if (roleLower === 'admin' || roleLower === 'administrador') return ['*', 'user-activity.html'];

        // 2. Auditor: Puede ver todo lo relacionado con auditoría, reportes e inventario (Lectura)
        if (roleLower.includes('auditor')) {
            return [
                'index.html',
                'inventory.html',
                'scanner.html',
                'departments.html',
                'movements.html',
                'reports.html',
                'updates.html',
                'transactions.html'
            ];
        }

        // 3. Usuarios: Consulta total del sistema (Solo Lectura)
        if (roleLower.includes('usuario')) {
            return [
                'index.html',
                'inventory.html',
                'scanner.html',
                'departments.html',
                'movements.html',
                'reports.html',
                'management.html',
                'qr-repository.html',
                'labels-repository.html',
                'transactions.html',
                'updates.html'
            ];
        }

        // 4. Capturistas: Operación diaria (Dashboard, Inventario, Etiquetas, Escáner, Movimientos)
        if (roleLower.includes('capturista')) {
            return [
                'index.html',
                'inventory.html',
                'qr-repository.html',
                'labels-repository.html',
                'scanner.html',
                'management.html',
                'movements.html',
                'print-label.html',
                'transactions.html'
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
        let cleanPage = pageName.split('/').pop().split('?')[0];

        // index.html es permitido para todos usualmente. También permitimos '#' para menús/dropdowns.
        if (cleanPage === 'index.html' || cleanPage === '' || cleanPage === 'home.html' || cleanPage === '#') return true;

        // Normalizamos: si no tiene extensión, asumimos .html (común en despliegues como Netlify/Vercel)
        if (cleanPage && !cleanPage.includes('.')) {
            cleanPage += '.html';
        }

        return permissions.includes(cleanPage);
    }
};
