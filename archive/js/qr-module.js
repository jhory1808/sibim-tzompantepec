// qr-module.js - MÓDULO QR SIMPLIFICADO
console.log("✅ qr-module.js CARGADO!");

class QRModule {
    constructor() {
        console.log("🚀 QRModule creado");
    }
    
    generateQRCode(text, size = 200) {
        console.log("Generando QR para: " + text);
        alert("QR generado para: " + text);
        
        // Simular generación
        return "QR_GENERADO_" + Date.now();
    }
    
    startCameraScanner() {
        console.log("Cámara activada");
        alert("Cámara de QR activada");
    }
}

// Hacer disponible globalmente
window.QRModule = QRModule;
console.log("✅ QRModule disponible globalmente");
