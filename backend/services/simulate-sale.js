"use strict";
/**
 * Script para simular una venta de tipo "Separado"
 * Verifica la actualización de KPIs de Deuda y Efectivo.
 */
const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const API_URL = 'http://localhost:3000/api';
const API_KEY = process.env.ADMIN_API_KEY || process.env.API_KEY || 'dev-api-key';

// SOLUCIÓN: Configurar axios para que maneje cookies, necesario para la protección CSRF.
const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

async function simulateLayaway() {
    console.log("\n🚀 [SIMULADOR DE VENTA] Iniciando venta de tipo SEPARADO...");

    const saleData = {
        id: "SIM-" + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(), // Campo requerido por el validador
        client: "Cliente de Prueba Neon",
        customer_phone: "573000000000",
        total: 150000,
        method: "Efectivo", // Campo requerido por el validador
        payment_method: "Efectivo", // Ambos campos son necesarios para consistencia
        payment_status: "partial", // Indica que es un separado
        channel: "fisica",
        vendor: "Simulador",
        items: [
            { id: "ZD-02", name: "Zapatillas Deportivas ZD-02", qty: 1, price: 150000, size: "36" }
        ],
        payment_details: {
            isLayaway: true,
            abonoAmount: 50000, // El cliente deja 50k, debe 100k
            shipping_status: "ABONO"
        }
    };

    try {
        // 1. Obtener el token CSRF para autenticar la petición POST
        const csrfRes = await client.get(`${API_URL}/get-csrf`);
        const csrfToken = csrfRes.data.csrfToken;

        // 2. Enviar la venta incluyendo la API Key y el token CSRF
        const res = await client.post(`${API_URL}/sales`, saleData, {
            headers: { 'x-api-key': API_KEY, 'x-csrf-token': csrfToken }
        });
        
        if (res.data.success || res.status === 200) {
            console.log("✅ VENTA REGISTRADA CON ÉXITO");
            console.log("------------------------------------------");
            console.log(`💰 Total Venta:   $150,000`);
            console.log(`💵 Abono (Caja):  $50,000`);
            console.log(`🟠 Deuda Creada:  $100,000`);
            console.log("------------------------------------------");
            console.log("👉 Ahora ve al Dashboard y presiona F5 o navega a otra sección y vuelve.");
        }
    } catch (error) {
        console.error("❌ ERROR AL SIMULAR VENTA:");
        
        const serverMsg = error.response?.data?.error || error.response?.data?.message;
        if (serverMsg) {
            console.error(`   Motivo: ${serverMsg}`);
        } else {
            console.error(`   Detalle técnico: ${error.message}`);
        }

        if (error.message.includes("Stock insuficiente")) {
            console.log("⚠️ Tip: Asegúrate de que el producto P001 tenga stock en el Seed o Inventario.");
        }
    }
}

simulateLayaway();