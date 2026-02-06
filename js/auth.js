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
            console.log('Usuarios recuperados de la nube:', users);

            if (!users || users.length === 0) {
                console.warn('No se pudieron recuperar usuarios de Google Sheets. Usando solo acceso local.');
                return false;
            }

            // Normalizamos búsqueda para soportar columnas en Inglés o Español
            const user = users.find(u => {
                const uName = u.username || u.Usuario || u.nombre;
                const uPass = u.password || u.Contraseña || u.clave;
                return uName === username && String(uPass) === String(password);
            });

            if (user) {
                const sessionUser = {
                    username: user.username || user.Usuario || username,
                    role: user.role || user.Rol || 'User',
                    loginTime: new Date()
                };
                localStorage.setItem('sibim_user', JSON.stringify(sessionUser));
                return true;
            }
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
    }
};
