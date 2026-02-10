const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

// URL de tu aplicación desplegada
const APP_URL = 'https://sibimtzomp.netlify.app';

let mainWindow;

function createWindow() {
    // Crear la ventana principal
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        icon: path.join(__dirname, '../assets/images/logo_municipio.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false
        },
        // Estilo de ventana moderno
        frame: true,
        titleBarStyle: 'default',
        backgroundColor: '#0a192f',
        show: false // No mostrar hasta que esté lista
    });

    // Cargar la aplicación web desde LOCAL para ver cambios
    // mainWindow.loadURL(APP_URL);
    mainWindow.loadFile(path.join(__dirname, '../home.html'));

    // Mostrar cuando esté lista (evita pantalla blanca)
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    // Abrir links externos en el navegador por defecto
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https://') || url.startsWith('http://')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    // Menú personalizado
    const menuTemplate = [
        {
            label: 'SIBIM',
            submenu: [
                {
                    label: 'Recargar',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => mainWindow.reload()
                },
                {
                    label: 'Forzar Recarga',
                    accelerator: 'CmdOrCtrl+Shift+R',
                    click: () => mainWindow.webContents.reloadIgnoringCache()
                },
                { type: 'separator' },
                {
                    label: 'Pantalla Completa',
                    accelerator: 'F11',
                    click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen())
                },
                { type: 'separator' },
                {
                    label: 'Salir',
                    accelerator: 'Alt+F4',
                    click: () => app.quit()
                }
            ]
        },
        {
            label: 'Navegación',
            submenu: [
                {
                    label: 'Dashboard',
                    click: () => mainWindow.loadURL(APP_URL + '/index.html')
                },
                {
                    label: 'Inventario',
                    click: () => mainWindow.loadURL(APP_URL + '/pages/inventory.html')
                },
                {
                    label: 'Usuarios',
                    click: () => mainWindow.loadURL(APP_URL + '/pages/users.html')
                },
                {
                    label: 'Escáner QR',
                    click: () => mainWindow.loadURL(APP_URL + '/pages/scanner.html')
                }
            ]
        },
        {
            label: 'Ayuda',
            submenu: [
                {
                    label: 'Acerca de',
                    click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'SIBIM Tzompantepec',
                            message: 'Sistema de Inventario de Bienes v2.1.0',
                            detail: 'Desarrollado por Depto. de Sistemas C2\nH. Ayuntamiento de Tzompantepec\n© 2024-2027'
                        });
                    }
                },
                {
                    label: 'Herramientas de Desarrollo',
                    accelerator: 'F12',
                    click: () => mainWindow.webContents.toggleDevTools()
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    // Limpiar al cerrar
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Cuando Electron esté listo
app.whenReady().then(() => {
    createWindow();

    // En macOS, recrear ventana al hacer clic en el dock
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Cerrar la app cuando se cierren todas las ventanas (excepto en macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Manejar errores de certificado SSL (útil en desarrollo)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    // En producción, siempre verificar certificados
    callback(false);
});

console.log('SIBIM Tzompantepec - Aplicación de Escritorio iniciada');
