// menu-system.js - SISTEMA SIMPLIFICADO
console.log("✅ menu-system.js CARGADO!");

class SIBIMMenuSystem {
    constructor() {
        console.log("🚀 MenuSystem creado");
        this.init();
    }
    
    init() {
        console.log("Menú inicializado");
        this.setupMenu();
    }
    
    setupMenu() {
        console.log("Configurando menú...");
    }
    
    navigateTo(page) {
        console.log("📌 Navegando a: " + page);
        alert("Navegando a: " + page);
        
        // Mostrar en pantalla
        const content = document.getElementById('content-area');
        if (content) {
            content.innerHTML = `<h2>${page.toUpperCase()}</h2><p>Contenido de ${page}</p>`;
        }
    }
}

// Hacer disponible globalmente
window.SIBIMMenuSystem = SIBIMMenuSystem;
console.log("✅ SIBIMMenuSystem disponible globalmente");
