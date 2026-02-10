const UI = {
    async forceUpdate() {
        if (!confirm("¿Deseas actualizar el sistema? Se recargará la página para asegurar la última versión.")) return;

        console.log("Iniciando actualización forzada...");

        // 1. Desregistrar Service Workers
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                await registration.unregister();
            }
        }

        // 2. Limpiar Caché Storage
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (let cacheName of cacheNames) {
                await caches.delete(cacheName);
            }
        }

        // 3. Limpiar LocalStorage (excepto auth)
        const user = localStorage.getItem('sibim_user');
        const token = localStorage.getItem('sibim_token');
        localStorage.clear();
        if (user) localStorage.setItem('sibim_user', user);
        if (token) localStorage.setItem('sibim_token', token);

        // 4. Recargar ignorando caché del navegador
        window.location.reload(true);
    },

    showToast(message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'times-circle' : 'exclamation-triangle');
        toast.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    hideLoader() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Register Service Worker for Offline capability
    if ('serviceWorker' in navigator) {
        const swPath = window.location.pathname.includes('/pages/') ? '../sw.js' : './sw.js';
        navigator.serviceWorker.register(swPath).catch(err => console.log('SW failed', err));
    }

    // Check authentication if not on home/login
    if (window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('/pages/')) {
        Auth.checkAccess();
        Auth.initTimeout(); // 10m inactivity logout
        Auth.initTheme();   // Load saved theme
        updateUIForUser();
        handleAdminModules();
    }

    // Load Dashboard Data if on index.html
    if (document.getElementById('statsChart')) {
        loadDashboardData().finally(() => UI.hideLoader());
    } else {
        // For other pages that might have the loader
        setTimeout(() => UI.hideLoader(), 800);
    }

    // Auto-search if coming from Scanner
    const urlParams = new URLSearchParams(window.location.search);
    const scanId = urlParams.get('scan');
    if (scanId && document.getElementById('inventory-id-search')) {
        document.getElementById('inventory-id-search').value = scanId;
        setTimeout(() => UpdatesManager.searchItem(), 500);
    }

    // Initialize specific modules
    if (document.getElementById('inventory-id-search')) {
        UpdatesManager.init();
    }
});

function handleAdminModules() {
    if (!Auth.isAdmin()) {
        // Hide Admin-only modules from navigation for standard users
        const adminModules = ['config', 'users']; // modules restricted to admin
        adminModules.forEach(id => {
            const el = document.querySelector(`.nav-item[href*="${id}"]`);
            if (el) el.style.display = 'none';
        });
    }
}

async function loadDashboardData() {
    const { items, stats } = await API.getStats();

    // Update Stats Cards
    const totalCount = stats.total || items.length;
    const deptoCount = stats.departamentos || new Set(items.map(i => i.Departamento || i.departamento)).size;

    document.querySelector('.stat-card:nth-child(1) .value').textContent = totalCount;
    document.querySelector('.stat-card:nth-child(2) .value').textContent = deptoCount;
    document.querySelector('.stat-card:nth-child(3) .value').textContent = stats.movimientos || 0;
    document.querySelector('.stat-card:nth-child(4) .value').textContent = stats.bajas || 0;

    // Build Chart Data from Real Items
    const deptCounts = {};
    items.forEach(item => {
        const dept = item.Departamento || item.departamento || 'Sin Asignar';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    initCharts(Object.keys(deptCounts), Object.values(deptCounts));

    if (items.length === 0) {
        UI.showToast("No se detectaron bienes. Si tienes datos en tu Excel, limpia el caché (Ctrl+F5) o verifica los permisos del Script de Google.", "warning");
    }
}

function updateUIForUser() {
    const user = Auth.getCurrentUser();
    if (user) {
        const userNameElem = document.getElementById('user-name-display');
        if (userNameElem) userNameElem.textContent = user.username;

        const userRoleElem = document.getElementById('user-role-display');
        if (userRoleElem) userRoleElem.textContent = user.role;

        const avatar = document.getElementById('user-avatar');
        if (avatar) avatar.textContent = user.username.charAt(0).toUpperCase();

        const adminTools = document.getElementById('admin-only-tools');
        if (adminTools) {
            adminTools.style.display = Auth.isAdmin() ? 'block' : 'none';
        }
    }
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.toggle('active');
}

// Close dropdown when clicking outside
window.onclick = function (event) {
    if (!event.target.closest('.user-profile-menu')) {
        const dropdowns = document.getElementsByClassName("dropdown-box");
        for (let i = 0; i < dropdowns.length; i++) {
            dropdowns[i].classList.remove('active');
        }
    }
}

function initCharts(labels, data) {
    const ctx = document.getElementById('statsChart');
    if (ctx && typeof Chart !== 'undefined') {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Sin Datos'],
                datasets: [{
                    label: 'Artículos por Departamento',
                    data: data.length ? data : [0],
                    backgroundColor: 'rgba(0, 210, 255, 0.6)',
                    borderColor: '#00d2ff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#8892b0' }
                    },
                    x: {
                        ticks: { color: '#8892b0' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#e6f1ff' } }
                }
            }
        });
    }
}

function logout() {
    Auth.logout();
}
