const Auth = {
    async login(username, password) {
        try {
            const users = await API.getUsers();
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                const sessionUser = {
                    username: user.username,
                    role: user.role || 'User',
                    loginTime: new Date()
                };
                localStorage.setItem('sibim_user', JSON.stringify(sessionUser));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
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
