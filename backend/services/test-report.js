"use strict";
/**
 * Script para probar la generación de un reporte PDF de cierre de caja.
 * Ejecutar con: node backend/services/test-report.js
 */
const fs = require('fs');
const path = require('path');
const ReportService = require('./reportService');

async function testPdfGeneration() {
    console.log('🧪  Iniciando prueba de generación de PDF...');

    // 1. Datos de ejemplo para la sesión
    const mockSession = {
        id: 'TEST-SESSION-123',
        openedBy: 'Admin de Prueba',
        openedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // Hace 8 horas
        closedAt: new Date(),
        initialBalance: 100000,
        theoreticalSales: 550000,
        theoreticalExpenses: 25000,
        realBalance: 620000,
        difference: -5000, // Faltante
    };

    const mockSales = [
        { createdAt: new Date(), customerName: 'Cliente 1', paymentMethod: 'Efectivo', totalAmount: 200000 },
        { createdAt: new Date(), customerName: 'Cliente 2', paymentMethod: 'Tarjeta', totalAmount: 350000 },
    ];

    const mockExpenses = [
        { concept: 'Compra de insumos', method: 'Efectivo', amount: 25000 },
    ];

    try {
        // 2. Llamar al servicio para generar el buffer del PDF
        const pdfBuffer = await ReportService.generateCashClosingPDF(mockSession, mockSales, mockExpenses);

        // 3. Guardar el PDF en un archivo para poder abrirlo
        const outputPath = path.resolve(__dirname, '..', '..', 'test-report.pdf');
        fs.writeFileSync(outputPath, pdfBuffer);

        console.log(`\n✅ ¡ÉXITO! Reporte de prueba generado.`);
        console.log(`   👉 Abre el archivo: ${outputPath}`);

    } catch (error) {
        console.error('\n❌ ERROR al generar el reporte PDF:');
        console.error(`   Motivo: ${error.message}`);
    }
}

testPdfGeneration();