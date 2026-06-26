"use strict";

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const { prisma } = require('../database');
const ReportService = require('../services/reportService');

/**
 * Endpoint para descargar el reporte de cierre de caja en formato PDF.
 * Al acceder a esta URL, el navegador iniciará la descarga del archivo.
 */
router.get('/download-report/:sessionId', requireAuth, asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    // 1. Obtener los datos necesarios para el reporte desde la base de datos.
    const session = await prisma.cashSession.findUnique({
        where: { id: sessionId },
    });

    if (!session) {
        return res.status(404).json({ error: 'Sesión no encontrada.' });
    }

    // Obtener las ventas y gastos asociados a esta sesión.
    const sales = await prisma.sale.findMany({
        where: {
            createdAt: {
                gte: session.openedAt,
                lte: session.closedAt || new Date(),
            },
        },
    });

    const expenses = await prisma.expense.findMany({
        where: {
            createdAt: {
                gte: session.openedAt,
                lte: session.closedAt || new Date(),
            },
        },
    });

    // 2. Generar el PDF usando el servicio de reportes.
    const pdfBuffer = await ReportService.generateCashClosingPDF(session, sales, expenses);

    // 3. Configurar las cabeceras HTTP para forzar la descarga en el navegador.
    const filename = `cierre-caja-${sessionId}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // 4. Enviar el PDF como respuesta.
    res.send(pdfBuffer);
}));

// Aquí irían las otras rutas relacionadas con el arqueo, como la de enviar por email.
// Por ejemplo: router.post('/send-report', ...);

module.exports = router;

/*
   NOTA PARA EL DESARROLLADOR:
   Para que esta ruta funcione, regístrala en tu archivo principal del servidor (server.js o app.js):
   const arqueoRoutes = require('./routes/arqueo');
   app.use('/api/arqueo', arqueoRoutes);
*/