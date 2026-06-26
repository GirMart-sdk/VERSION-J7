"use strict";

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const { prisma } = require('../database');

/**
 * Obtiene la sesión de caja activa actual.
 */
router.get('/sessions/active', requireAuth, asyncHandler(async (req, res) => {
    const activeSession = await prisma.cashSession.findFirst({
        where: { status: 'open' },
    });
    res.json(activeSession);
}));

/**
 * Obtiene el historial de todas las sesiones de caja.
 */
router.get('/sessions/history', requireAuth, asyncHandler(async (req, res) => {
    const sessions = await prisma.cashSession.findMany({
        orderBy: { openedAt: 'desc' },
    });
    res.json(sessions);
}));

/**
 * Abre una nueva sesión de caja.
 */
router.post('/sessions/open', requireAuth, asyncHandler(async (req, res) => {
    const { baseAmount } = req.body;
    // SOLUCIÓN: El frontend envía el nombre de usuario en la propiedad 'user', no 'username'.
    // Se añade un fallback por seguridad.
    const openedBy = req.user.user || req.user.username || 'Admin';

    const existingOpenSession = await prisma.cashSession.findFirst({
        where: { status: 'open' },
    });

    if (existingOpenSession) {
        return res.status(400).json({ error: 'Ya existe una sesión de caja abierta.' });
    }

    const newSession = await prisma.cashSession.create({
        data: {
            // SOLUCIÓN: Generar un ID único para la sesión.
            id: `CS-${Date.now()}`,
            openedBy,
            openedAt: new Date(),
            initialBalance: baseAmount,
            status: 'open',
        },
    });

    res.status(201).json(newSession);
}));

/**
 * Cierra una sesión de caja existente.
 */
router.post('/sessions/close/:id', requireAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { realBalance, theoreticalSales, theoreticalExpenses } = req.body;

    const closedSession = await prisma.cashSession.update({
        where: { id },
        data: {
            status: 'closed',
            closedAt: new Date(),
            closedBy: req.user.username,
            realBalance,
            theoreticalSales,
            theoreticalExpenses,
            // La diferencia se puede calcular aquí o en el frontend.
            // Por simplicidad, asumimos que el frontend la envía.
            difference: realBalance - (theoreticalSales - theoreticalExpenses),
        },
    });

    res.json(closedSession);
}));

module.exports = router;