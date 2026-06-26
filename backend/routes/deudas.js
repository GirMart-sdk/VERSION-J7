// routes/deudas.js

const express = require('express');
const router = express.Router();
// eslint-disable-next-line no-unused-vars
const { prisma } = require('../database');
const { requireAuth } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const deudaService = require('../services/deudaService'); // Importamos nuestro nuevo servicio

// Endpoint: GET /api/deudas - Listar todas las deudas pendientes (Ruta simplificada)
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  // La lógica de cálculo ahora está centralizada y optimizada en el servicio.
  const deudasConSaldo = await deudaService.getDeudasConSaldo();
  res.json(deudasConSaldo);
}));

// Endpoint: POST /api/deudas/:id/abono
router.post('/:id/abono', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { monto } = req.body;

  // 1. Delegar toda la lógica de negocio al servicio
  const deudaGuardada = await deudaService.aplicarAbono(id, monto);

  console.log(`TRANSACCIÓN EXITOSA: Abono aplicado a la deuda ${id}.`);

  // 2. Enviar una respuesta de éxito si el servicio se completó
  res.status(200).json({
    message: 'Abono registrado correctamente.',
    nuevoSaldo: deudaGuardada.saldo,
    deuda: deudaGuardada,
  });
}));

module.exports = router;
