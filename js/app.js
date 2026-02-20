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
    const isRoot = window.location.pathname === '/' || window.location.pathname === '' || window.location.pathname.endsWith('index.html');

    if (isRoot || window.location.pathname.includes('index.html') || window.location.pathname.includes('/pages/')) {
        Auth.checkAccess();
        Auth.initTimeout(); // 10m inactivity logout
        Auth.initTheme();   // Load saved theme
        Auth.trackPresence(); // Start Heartbeat for Online status
        updateUIForUser();
        handleRolePermissions();

        // Show Welcome Greeting and Init Notifications
        const isDashboard = isRoot || window.location.pathname.includes('index.html');

        if (isDashboard) {
            showGreeting();
            initNotifications();
        }
    }

    // Load Dashboard Data if on index.html
    if (document.getElementById('statusChart')) {
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

function handleRolePermissions() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const role = (user.role || '').toLowerCase();

    // Asegurar que la UI se actualice con los datos del usuario inmediatamente
    updateUIForUser();

    // 0. Si es ADMIN, no aplicamos restricciones de ocultamiento ni redirección
    if (role.indexOf('admin') !== -1 || role.indexOf('administrador') !== -1) {
        console.log('[RBAC] Admin detectado, acceso total concedido.');
        return;
    }

    // 1. Visibilidad de Navegación Basal
    const navItems = document.querySelectorAll('.nav-item, .dropdown-item, .fab-item');
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && !Auth.isPageAllowed(href)) {
            item.style.display = 'none';
        }
    });

    // 2. Controladores de Acciones según Rol
    // Si el rol incluye 'usuario' o 'auditor' (Solo lectura TOTAL)
    if (role.indexOf('usuario') !== -1 || role.indexOf('auditor') !== -1) {
        const actionElements = document.querySelectorAll('.btn-delete, .btn-edit, .btn-add, #add-item-btn, .delete-btn, [data-action="admin"], .fa-pencil-alt, .fa-trash-alt, .fa-plus, .fa-user-cog, .btn-save');
        actionElements.forEach(el => {
            const container = el.tagName === 'I' ? el.parentElement : el;
            if (container && (container.tagName === 'BUTTON' || container.tagName === 'A')) {
                // No ocultamos el botón si es para volver o navegación básica
                if (!container.className.includes('btn-outline')) {
                    container.style.display = 'none';
                }
            } else if (el.tagName !== 'I' && !el.className.includes('nav-item')) {
                el.style.display = 'none';
            }
        });
    }

    // Si el rol incluye 'capturista'
    if (role.includes('capturista')) {
        const deleteActions = document.querySelectorAll('.btn-delete, .delete-btn, [data-action="delete"], .fa-trash-alt');
        deleteActions.forEach(el => {
            const container = el.tagName === 'I' ? el.parentElement : el;
            if (container && (container.tagName === 'BUTTON' || container.tagName === 'A')) {
                container.style.display = 'none';
            } else if (el.tagName !== 'I') {
                el.style.display = 'none';
            }
        });

        // Esconder herramientas que el capturista no tiene en sus permisos explícitos
        const adminTools = document.querySelectorAll('[href*="users.html"], [href*="updates.html"], [href*="config.html"], [data-action="admin"], [data-tooltip="Configuración"]');
        adminTools.forEach(el => {
            if (!el.className.includes('nav-item') || !Auth.isPageAllowed(el.getAttribute('href'))) {
                el.style.display = 'none';
            }
        });
    }

    // 3. Elementos restringidos por data-attribute
    const restrictedElements = document.querySelectorAll('[data-role-restricted]');
    restrictedElements.forEach(el => {
        const allowedPages = el.getAttribute('data-role-restricted').split(',');
        const isAllowed = allowedPages.some(page => Auth.isPageAllowed(page));
        if (!isAllowed) el.style.display = 'none';
    });

    // Redirección de seguridad
    const currentPagePath = window.location.pathname;
    const cleanPage = currentPagePath.split('/').pop().split('?')[0];

    // Si estamos en una página que no está permitida (excepto el index y home)
    if (cleanPage && cleanPage !== 'index.html' && cleanPage !== 'home.html' && cleanPage !== '' && !Auth.isPageAllowed(cleanPage)) {
        console.warn(`[RBAC] Acceso denegado a '${cleanPage}' para el rol '${role}'. Redirigiendo...`);
        window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : './index.html';
    } else {
        console.log(`[RBAC] Acceso verificado para '${cleanPage}' (${role})`);
    }
}

async function loadDashboardData() {
    try {
        console.log("[DASHBOARD] Iniciando carga de datos...");
        const result = await API.getStats();
        if (!result) throw new Error("No se obtuvieron datos de la API");

        const { items, stats } = result;
        console.log(`[DASHBOARD] ${items.length} artículos obtenidos.`);

        // Update Stats Cards with ID mapping and remove skeleton
        const updateStat = (id, value) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
                el.classList.remove('skeleton');
            }
        };

        updateStat('stat-total', stats.total || items.length);
        updateStat('stat-depts', stats.departamentos || new Set(items.map(i => i.Departamento || i.departamento)).size);
        updateStat('stat-movements', stats.movimientos || 0);
        updateStat('stat-maint', items.filter(i => (i.Estado || i.estado || '').toUpperCase().includes('MANTENIMIENTO')).length);

        // Build Chart Data from Real Items
        const deptCounts = {};
        const statusCounts = {};

        items.forEach(item => {
            const dept = item.Departamento || item.departamento || 'Sin Asignar';
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;

            const status = (item.Estado || item.estado || 'ACTIVO').toUpperCase();
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        console.log("[DASHBOARD] Inicializando gráficas...");

        // Verificación de existencia de canvas antes de inicializar
        if (document.getElementById('deptChart')) initDeptChart(Object.keys(deptCounts), Object.values(deptCounts));
        if (document.getElementById('statusChart')) initStatusChart(Object.keys(statusCounts), Object.values(statusCounts));
        if (document.getElementById('dispersionChart')) initDispersionChart(items);
        if (document.getElementById('trendChart')) initTrendChart(items);
        if (document.getElementById('radarChart')) {
            const radarLabels = Object.keys(deptCounts).slice(0, 5);
            const radarData = Object.values(deptCounts).slice(0, 5);
            initRadarChart(radarLabels, radarData);
        }
        if (document.getElementById('categoryChart')) initCategoryChart(items);

        if (items.length === 0) {
            UI.showToast("No se detectaron bienes. Verifica la conexión con Google Sheets.", "warning");
        }
    } catch (error) {
        console.error("[DASHBOARD] Error crítico:", error);
        UI.showToast("Error al cargar datos del dashboard", "error");
    }
}

function initDispersionChart(items) {
    const ctx = document.getElementById('dispersionChart');
    if (ctx && typeof Chart !== 'undefined') {
        const scatterData = items.map((item, index) => ({
            x: index,
            y: parseFloat(item.Valor) || Math.random() * 10000,
            label: item.Nombre || item.nombre || 'Sin nombre',
            dept: item.Departamento || 'S/A'
        }));

        new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Valor de Artículos',
                    data: scatterData,
                    backgroundColor: function (context) {
                        const value = context.parsed.y;
                        if (value > 50000) return 'rgba(231, 76, 60, 0.7)';
                        if (value > 20000) return 'rgba(241, 196, 15, 0.7)';
                        if (value > 10000) return 'rgba(52, 152, 219, 0.7)';
                        return 'rgba(46, 204, 113, 0.7)';
                    },
                    borderColor: function (context) {
                        const value = context.parsed.y;
                        if (value > 50000) return '#e74c3c';
                        if (value > 20000) return '#f1c40f';
                        if (value > 10000) return '#3498db';
                        return '#2ecc71';
                    },
                    borderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 10,
                    pointHoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            lineWidth: 1
                        },
                        ticks: {
                            color: '#8892b0',
                            font: { size: 10, weight: '600' }
                        },
                        title: {
                            display: true,
                            text: 'Índice de Artículo',
                            color: '#8892b0',
                            font: { size: 11, weight: '700' }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 210, 255, 0.1)',
                            lineWidth: 1
                        },
                        ticks: {
                            color: '#8892b0',
                            font: { size: 10, weight: '600' },
                            callback: function (value) {
                                return '$' + value.toLocaleString('es-MX');
                            }
                        },
                        title: {
                            display: true,
                            text: 'Valor (MXN)',
                            color: '#8892b0',
                            font: { size: 11, weight: '700' }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#00d2ff',
                        bodyColor: '#fff',
                        borderColor: '#00d2ff',
                        borderWidth: 2,
                        padding: 15,
                        displayColors: false,
                        callbacks: {
                            title: function (context) {
                                const item = context[0].raw;
                                return item.label || 'Artículo';
                            },
                            label: function (context) {
                                const item = context.raw;
                                return [
                                    `Departamento: ${item.dept}`,
                                    `Valor: $${context.parsed.y.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                                ];
                            }
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }
}

function updateUIForUser() {
    const user = Auth.getCurrentUser();
    const userNameElem = document.getElementById('user-name-display');
    const userRoleElem = document.getElementById('user-role-display');
    const avatar = document.getElementById('user-avatar');
    const adminTools = document.getElementById('admin-only-tools');

    if (user) {
        if (userNameElem) userNameElem.textContent = user.username;
        if (userRoleElem) userRoleElem.textContent = user.role;
        if (avatar) avatar.textContent = user.username.charAt(0).toUpperCase();
        if (adminTools) {
            adminTools.style.display = Auth.isAdmin() ? 'block' : 'none';
        }
        const maintenanceTools = document.getElementById('admin-maintenance-tools');
        if (maintenanceTools) {
            maintenanceTools.style.display = Auth.isAdmin() ? 'block' : 'none';
        }
    } else {
        if (userNameElem) userNameElem.textContent = 'Invitado';
        if (userRoleElem) userRoleElem.textContent = 'Sin Sesión';
        if (avatar) avatar.textContent = '?';
        if (adminTools) adminTools.style.display = 'none';
    }
}

function showGreeting() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const now = new Date();
    const hour = now.getHours();
    let greeting = "";

    if (hour >= 6 && hour < 12) greeting = "¡BUENOS DÍAS!";
    else if (hour >= 12 && hour < 19) greeting = "¡BUENAS TARDES!";
    else greeting = "¡BUENAS NOCHES!";

    // Only show if it's the first time in the session
    if (!sessionStorage.getItem('greeting_shown')) {
        setTimeout(() => {
            const name = user.username || user.Nombre || "USUARIO";
            UI.showToast(`${greeting} ${name.toUpperCase()}`, "success");
            sessionStorage.setItem('greeting_shown', 'true');
        }, 1500);
    }
}

async function initNotifications() {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            console.log("Notificaciones activadas por el usuario");
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

function initDeptChart(labels, data) {
    const ctx = document.getElementById('deptChart');
    if (ctx && typeof Chart !== 'undefined') {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['Sin Datos'],
                datasets: [{
                    data: data.length ? data : [1],
                    backgroundColor: [
                        'rgba(0, 210, 255, 0.8)',
                        'rgba(155, 89, 182, 0.8)',
                        'rgba(46, 204, 113, 0.8)',
                        'rgba(241, 196, 15, 0.8)',
                        'rgba(231, 76, 60, 0.8)',
                        'rgba(230, 126, 34, 0.8)',
                        'rgba(26, 188, 156, 0.8)'
                    ],
                    borderColor: [
                        '#00d2ff',
                        '#9b59b6',
                        '#2ecc71',
                        '#f1c40f',
                        '#e74c3c',
                        '#e67e22',
                        '#1abc9c'
                    ],
                    borderWidth: 3,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#e6f1ff',
                            padding: 15,
                            font: { size: 11, weight: '600' },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#00d2ff',
                        bodyColor: '#fff',
                        borderColor: '#00d2ff',
                        borderWidth: 2,
                        padding: 15,
                        displayColors: true,
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }
}

function initStatusChart(labels, data) {
    const ctx = document.getElementById('statusChart');
    if (ctx && typeof Chart !== 'undefined') {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Sin Datos'],
                datasets: [{
                    label: 'Cantidad de Artículos',
                    data: data.length ? data : [0],
                    backgroundColor: function (context) {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return 'rgba(0, 210, 255, 0.6)';

                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, 'rgba(0, 210, 255, 0.3)');
                        gradient.addColorStop(1, 'rgba(0, 210, 255, 0.9)');
                        return gradient;
                    },
                    borderColor: '#00d2ff',
                    borderWidth: 2,
                    borderRadius: 8,
                    barThickness: 40,
                    hoverBackgroundColor: 'rgba(0, 210, 255, 1)',
                    hoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 210, 255, 0.1)',
                            lineWidth: 1
                        },
                        ticks: {
                            color: '#8892b0',
                            font: { size: 11, weight: '600' },
                            padding: 10
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#8892b0',
                            font: { size: 11, weight: '600' }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#00d2ff',
                        bodyColor: '#fff',
                        borderColor: '#00d2ff',
                        borderWidth: 2,
                        padding: 15,
                        displayColors: false,
                        callbacks: {
                            title: function (context) {
                                return `Estado: ${context[0].label}`;
                            },
                            label: function (context) {
                                return `Total: ${context.parsed.y} artículos`;
                            }
                        }
                    }
                },
                animation: {
                    duration: 1800,
                    easing: 'easeInOutCubic'
                }
            }
        });
    }
}

function logout() {
    Auth.logout();
}

// ===== NUEVAS GRÁFICAS FUTURISTAS =====

function initTrendChart(items) {
    const ctx = document.getElementById('trendChart');
    if (ctx && typeof Chart !== 'undefined') {
        // Agrupar por mes (simulado si no hay fechas reales)
        const monthlyData = {};
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        items.forEach((item, index) => {
            const month = months[index % 12];
            monthlyData[month] = (monthlyData[month] || 0) + 1;
        });

        const labels = Object.keys(monthlyData);
        const data = Object.values(monthlyData);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.length ? labels : months.slice(0, 6),
                datasets: [{
                    label: 'Artículos Registrados',
                    data: data.length ? data : [5, 12, 8, 15, 20, 18],
                    borderColor: '#00d2ff',
                    backgroundColor: 'rgba(0, 210, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#00d2ff',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: '#e6f1ff', padding: 15, font: { size: 11 } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#00d2ff',
                        bodyColor: '#fff',
                        borderColor: '#00d2ff',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 210, 255, 0.1)' },
                        ticks: { color: '#8892b0', font: { size: 10 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8892b0', font: { size: 10 } }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }
}

function initRadarChart(labels, data) {
    const ctx = document.getElementById('radarChart');
    if (ctx && typeof Chart !== 'undefined') {
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels.length ? labels : ['Sistemas', 'Mobiliario', 'Equipo', 'Vehículos', 'Inmuebles'],
                datasets: [{
                    label: 'Distribución',
                    data: data.length ? data : [12, 19, 8, 5, 15],
                    backgroundColor: 'rgba(155, 89, 182, 0.2)',
                    borderColor: '#9b59b6',
                    borderWidth: 2,
                    pointBackgroundColor: '#9b59b6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: '#e6f1ff', padding: 15, font: { size: 11 } }
                    }
                },
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(155, 89, 182, 0.2)' },
                        pointLabels: { color: '#8892b0', font: { size: 10 } },
                        ticks: {
                            color: '#8892b0',
                            backdropColor: 'transparent',
                            font: { size: 9 }
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutBounce'
                }
            }
        });
    }
}

function initCategoryChart(items) {
    const ctx = document.getElementById('categoryChart');
    if (ctx && typeof Chart !== 'undefined') {
        // Agrupar por categoría
        const categoryCounts = {};
        items.forEach(item => {
            const cat = item.Categoria || item.categoria || item.Tipo || item.tipo || 'Sin Categoría';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        const sortedCategories = Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const labels = sortedCategories.map(c => c[0]);
        const data = sortedCategories.map(c => c[1]);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Mobiliario', 'Equipo Cómputo', 'Vehículos', 'Herramientas', 'Inmuebles'],
                datasets: [{
                    label: 'Cantidad',
                    data: data.length ? data : [25, 18, 12, 8, 5],
                    backgroundColor: [
                        'rgba(46, 204, 113, 0.8)',
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(155, 89, 182, 0.8)',
                        'rgba(241, 196, 15, 0.8)',
                        'rgba(231, 76, 60, 0.8)'
                    ],
                    borderColor: [
                        '#2ecc71',
                        '#3498db',
                        '#9b59b6',
                        '#f1c40f',
                        '#e74c3c'
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                    barThickness: 30
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#00d2ff',
                        bodyColor: '#fff',
                        borderColor: '#00d2ff',
                        borderWidth: 1,
                        padding: 12
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#8892b0', font: { size: 10 } }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#8892b0', font: { size: 10 } }
                    }
                },
                animation: {
                    duration: 1800,
                    easing: 'easeInOutCubic'
                }
            }
        });
    }
}

// ===== FUNCIONES PARA DEPARTAMENTOS EN DROPDOWN (HAMBURGUESA) =====

/**
 * Carga los departamentos desde el API y los renderiza en los contenedores designados.
 * Se puede llamar desde cualquier página que incluya app.js y api.js
 */
async function loadDepartmentsMenu() {
    console.log("[DEPT-MENU] Iniciando carga de departamentos para el menú...");
    const containers = document.querySelectorAll('.departments-dropdown-list');
    if (containers.length === 0) return;

    try {
        const departments = await API.getDepartments();
        console.log(`[DEPT-MENU] ${departments ? departments.length : 0} departamentos obtenidos.`);

        containers.forEach(container => {
            if (!departments || departments.length === 0) {
                container.innerHTML = '<div class="dropdown-item" style="opacity:0.5;">No hay departamentos cargados</div>';
                return;
            }

            container.innerHTML = departments.map(dept => {
                const name = dept['Nombre Departamento'] || dept.nombre || dept.Nombre || 'Sin nombre';
                // Usamos inventory.html con filtro de departamento
                const basePath = window.location.pathname.includes('/pages/') ? '' : 'pages/';
                return `
                    <a href="${basePath}inventory.html?filter=${encodeURIComponent(name)}" class="dropdown-item">
                        <i class="fas fa-building"></i> ${name}
                    </a>
                `;
            }).join('');
        });
    } catch (error) {
        console.error("Error cargando menú de departamentos:", error);
        containers.forEach(container => {
            container.innerHTML = '<div class="dropdown-item" style="color:#e74c3c;">Error al cargar</div>';
        });
    }
}

// Inicializar carga de departamentos si existen los elementos
document.addEventListener('DOMContentLoaded', () => {
    // Si hay dropdowns de departamentos, cargarlos
    if (document.querySelector('.departments-dropdown-list')) {
        setTimeout(loadDepartmentsMenu, 1000); // Pequeño delay para asegurar que API esté lista
    }

    // Si hay selectores de departamentos para formularios, cargarlos
    if (document.querySelector('.departments-selector-list')) {
        setTimeout(loadDepartmentsSelector, 1200);
    }
});

/**
 * Carga los departamentos para ser seleccionados en campos de texto de formularios.
 */
async function loadDepartmentsSelector() {
    console.log("[DEPT-SELECTOR] Cargando departamentos para selectores de formulario...");
    const containers = document.querySelectorAll('.departments-selector-list');
    if (containers.length === 0) return;

    try {
        const departments = await API.getDepartments();

        containers.forEach(container => {
            const targetId = container.getAttribute('data-target');
            if (!departments || departments.length === 0) {
                container.innerHTML = '<div class="dropdown-item" style="opacity:0.5;">No hay departamentos</div>';
                return;
            }

            container.innerHTML = departments.map(dept => {
                const name = dept['Nombre Departamento'] || dept.nombre || dept.Nombre || 'Sin nombre';
                return `
                    <div class="dropdown-item" onclick="selectDeptValue('${targetId}', '${name}', '${container.parentElement.id}')">
                        <i class="fas fa-building"></i> ${name}
                    </div>
                `;
            }).join('');
        });
    } catch (error) {
        console.error("Error cargando selector de departamentos:", error);
    }
}

/**
 * Inserta el valor seleccionado en el input y cierra el dropdown.
 */
function selectDeptValue(inputId, value, dropdownId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.value = value;
        input.dispatchEvent(new Event('input')); // Notificar cambios
        UI.showToast(`Área seleccionada: ${value}`, 'info');
    }
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) dropdown.classList.remove('active');
}

/**
 * Sincroniza todos los códigos QR de la base de datos con la URL de producción actual.
 */
async function syncAllQRCodes() {
    if (!Auth.isAdmin()) {
        UI.showToast("Solo administradores pueden realizar esta acción", "error");
        return;
    }

    if (!confirm("¿Deseas actualizar TODOS los códigos QR en la base de datos para que apunten a GitHub? Esto puede tardar unos minutos.")) return;

    UI.showToast("Iniciando sincronización masiva...", "info");

    try {
        const items = await API.fetchItems();
        let updatedCount = 0;
        const total = items.length;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const id = item.id || item.codigo || item.ID || item.Codigo;

            if (!id) continue;

            // Aseguramos que la URL termine con / si no la tiene el productionUrl
            const baseUrl = CONFIG.productionUrl.endsWith('/') ? CONFIG.productionUrl.slice(0, -1) : CONFIG.productionUrl;
            const newQRUrl = `${baseUrl}/view.html?id=${id}`;

            // Solo actualizamos si es diferente
            const currentQR = (item['Codigo QR'] || item['codigo qr'] || '').toString();

            if (currentQR !== newQRUrl) {
                await API.updateItem({
                    id: id,
                    "Codigo QR": newQRUrl,
                    "Actualizado": "SI"
                });
                updatedCount++;
            }

            if (i % 5 === 0) {
                console.log(`Progreso: ${i + 1}/${total}`);
            }
        }

        UI.showToast(`Sincronización completada. ${updatedCount} artículos actualizados.`, "success");
        localStorage.removeItem('sibim_cache_timestamp');
    } catch (error) {
        console.error("Error en sincronización masiva:", error);
        UI.showToast("Error durante la sincronización masiva", "error");
    }
}
