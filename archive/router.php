<?php
/**
 * Router PHP para SIBIM
 * Maneja rutas limpias para Single Page Application
 */

\ = \['REQUEST_URI'];
\ = '/';

// Remover query string
if (strpos(\, '?') !== false) {
    \ = strstr(\, '?', true);
}

// Definir rutas
\ = [
    '/' => 'public/index.html',
    '/login' => 'src/pages/auth/login.html',
    '/auth/login' => 'src/pages/auth/login.html',
    '/dashboard' => 'src/pages/dashboard/app.html',
    '/app' => 'src/pages/dashboard/app.html',
    '/admin' => 'src/pages/dashboard/app.html',
    '/404' => 'public/404.html',
];

// Verificar si es una ruta definida
if (isset(\[\])) {
    \ = \[\];
    
    if (file_exists(\)) {
        // Servir el archivo HTML
        header('Content-Type: text/html; charset=utf-8');
        readfile(\);
        exit;
    }
}

// Verificar si es un archivo estático
\ = ['/assets/', '/src/', '/public/', '/config/'];
foreach (\ as \config\redirects) {
    if (strpos(\, \config\redirects) === 0) {
        if (file_exists('.' . \)) {
            // Servir archivo estático
            \ = [
                'html' => 'text/html',
                'css' => 'text/css',
                'js' => 'application/javascript',
                'json' => 'application/json',
                'png' => 'image/png',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'gif' => 'image/gif',
                'ico' => 'image/x-icon',
            ];
            
            \ = pathinfo(\, PATHINFO_EXTENSION);
            if (isset(\[\])) {
                header('Content-Type: ' . \[\]);
            }
            
            readfile('.' . \);
            exit;
        }
    }
}

// Redirigir a index.html para SPA
if (file_exists('public/index.html')) {
    header('Content-Type: text/html; charset=utf-8');
    readfile('public/index.html');
    exit;
}

// 404 Not Found
header("HTTP/1.0 404 Not Found");
echo "<h1>404 - Página no encontrada</h1>";
echo "<p>La página que buscas no existe.</p>";
echo "<p><a href='/'>Volver al inicio</a></p>";
?>
