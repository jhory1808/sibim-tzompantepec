const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const capacitorRoot = path.join(projectRoot, 'capacitor-app');
const wwwRoot = path.join(capacitorRoot, 'www');

// List of folders to copy directly
const foldersToCopy = [
    'assets',
    'css',
    'js',
    'pages'
];

function deleteFolderRecursive(directoryPath) {
    if (fs.existsSync(directoryPath)) {
        fs.readdirSync(directoryPath).forEach((file, index) => {
            const curPath = path.join(directoryPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(directoryPath);
    }
}

function copyRecursiveSync(src, dest) {
    if (fs.existsSync(src)) {
        const stats = fs.statSync(src);
        if (stats.isDirectory()) {
            if (!fs.existsSync(dest)) fs.mkdirSync(dest);
            fs.readdirSync(src).forEach((childItemName) => {
                copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
            });
        } else {
            console.log(`Copying file: ${src} -> ${dest}`);
            fs.copyFileSync(src, dest);
        }
    } else {
        console.warn(`Source not found: ${src}`);
    }
}

function replaceInFile(filePath, searchValue, replaceValue) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        const newContent = content.replace(searchValue, replaceValue);
        if (content !== newContent) {
            console.log(`Patched ${path.basename(filePath)}`);
            fs.writeFileSync(filePath, newContent, 'utf8');
        }
    }
}

console.log('Cleaning capacitor-app/www...');
try {
    deleteFolderRecursive(wwwRoot);
    fs.mkdirSync(wwwRoot, { recursive: true });
} catch (err) {
    console.error('Error cleaning www:', err);
}

console.log('Copying assets...');
foldersToCopy.forEach(folder => {
    copyRecursiveSync(path.join(projectRoot, folder), path.join(wwwRoot, folder));
});

// Copy other root files
['sw.js', 'manifest.json'].forEach(file => {
    copyRecursiveSync(path.join(projectRoot, file), path.join(wwwRoot, file));
});


// Special Handling for HTML files to change Entry Point
console.log('Configuring Entry Points...');

// 1. home.html (Landing) -> becomes index.html (Mobile Entry)
console.log('Copying home.html -> index.html (Landing Page)');
fs.copyFileSync(path.join(projectRoot, 'home.html'), path.join(wwwRoot, 'index.html'));

// 2. index.html (Dashboard) -> becomes dashboard.html
console.log('Copying index.html -> dashboard.html (Dashboard)');
fs.copyFileSync(path.join(projectRoot, 'index.html'), path.join(wwwRoot, 'dashboard.html'));

// 3. login.html -> stays login.html
console.log('Copying login.html');
fs.copyFileSync(path.join(projectRoot, 'login.html'), path.join(wwwRoot, 'login.html'));

// 4. view.html -> stays view.html
if (fs.existsSync(path.join(projectRoot, 'view.html'))) {
    fs.copyFileSync(path.join(projectRoot, 'view.html'), path.join(wwwRoot, 'view.html'));
}

console.log('Patching files for Mobile Navigation...');

// Patch login.html to redirect to dashboard.html instead of index.html
replaceInFile(
    path.join(wwwRoot, 'login.html'),
    "window.location.href = 'index.html'",
    "window.location.href = 'dashboard.html'"
);

// Patch dashboard.html (was index.html) self-references
replaceInFile(
    path.join(wwwRoot, 'dashboard.html'),
    'href="index.html"',
    'href="dashboard.html"'
);

// Patch js/app.js to recognize dashboard.html as protected
// We perform a global replace if possible, or targeted
// Original: if (window.location.pathname.includes('index.html') || window.location.pathname.includes('/pages/'))
replaceInFile(
    path.join(wwwRoot, 'js', 'app.js'),
    "window.location.pathname.includes('index.html')",
    "window.location.pathname.includes('dashboard.html')"
);

// Patch internal links in js/app.js or others if they redirect to index.html
// Searching for unexpected redirections...

// Patch js/auth.js logout to go to index.html (which is now Landing)
// Original: window.location.href = pathPrefix + 'home.html';
// New: window.location.href = pathPrefix + 'index.html';
replaceInFile(
    path.join(wwwRoot, 'js', 'auth.js'),
    "window.location.href = pathPrefix + 'home.html'",
    "window.location.href = pathPrefix + 'index.html'"
);

// Patch dashboard.html: The "Dashboard" nav link
// <a href="index.html" class="nav-item active">
// Handled above by generic replace

console.log('Mobile assets preparation complete.');
