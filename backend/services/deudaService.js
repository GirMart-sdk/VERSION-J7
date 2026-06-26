// services/deudaService.js

const { prisma } = require('../database'); // Usamos Prisma, como en el resto del proyecto

/**
 * Obtiene todas las deudas (ventas parciales/pendientes) con el saldo calculado
 * directamente en la base de datos para máxima eficiencia.
 */
async function getDeudasConSaldo() {
  // REFACTORIZACIÓN: Se reemplaza la consulta RAW (que causaba el error) por el API de Prisma.
  // Esto es más seguro, portable y respeta el esquema de la base de datos.
  const deudas = await prisma.sale.findMany({
    where: {
      paymentStatus: { in: ['partial', 'pending'] }
    },
    include: {
      salePayments: {
        select: { amount: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Calculamos el saldo en el servidor. Para la cantidad de deudas esperadas, el impacto es mínimo.
  return deudas.map(d => {
    const totalPagado = d.salePayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const saldo = Number(d.totalAmount) - totalPagado;
    // Devolvemos un objeto limpio sin la relación completa para no sobrecargar el frontend.
    // eslint-disable-next-line no-unused-vars
    const { salePayments, ...rest } = d;
    return { ...rest, saldo };
  });
}

/**
 * Aplica un abono a una venta existente (deuda) usando Prisma.
 * Esta función es atómica: o todas las operaciones tienen éxito, o todas se revierten.
 *
 * @param {string} id - El ID de la deuda a modificar.
 * @param {number} monto - El monto del pago a aplicar.
 * @returns {Promise<object>} Una promesa que resuelve con el documento de la deuda guardada.
 * @throws {Error} Lanza un error con un `statusCode` para que el controlador lo interprete.
 */
async function aplicarAbono(id, monto) {
  // 1. Validación de entrada
  if (!monto || typeof monto !== 'number' || monto <= 0) {
    const err = new Error('El monto del abono debe ser un número positivo.');
    err.statusCode = 400; // Bad Request
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    // 2. Lógica de negocio dentro de la transacción de Prisma
    const ventaActual = await tx.sale.findUnique({
      where: { id },
      include: { salePayments: true }, // Incluimos los pagos para calcular el saldo
    });

    if (!ventaActual) {
      const err = new Error('La deuda no fue encontrada.');
      err.statusCode = 404; // Not Found
      throw err;
    }

    // Calculamos el saldo pendiente real
    const totalPagado = ventaActual.salePayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const saldoPendiente = Number(ventaActual.totalAmount) - totalPagado;

    if (monto > saldoPendiente) {
      const err = new Error('El abono no puede ser mayor que el saldo pendiente.');
      err.statusCode = 400; // Bad Request
      throw err;
    }

    // 3. Registrar el nuevo abono en la tabla de pagos (SalePayment)
    await tx.salePayment.create({
      data: {
        saleId: id,
        amount: monto,
        // El método podría venir del frontend, pero "Efectivo" es un default seguro para abonos en tienda.
        method: "Efectivo", // O el método que se reciba del frontend
        notes: "Abono a deuda registrado",
      },
    });

    const nuevoTotalPagado = totalPagado + monto;
    const nuevoEstadoPago = nuevoTotalPagado >= Number(ventaActual.totalAmount) ? "completed" : "partial";

    // 4. Actualizar el estado de la venta si ya se completó el pago
    const ventaGuardada = await tx.sale.update({
      where: { id },
      data: { paymentStatus: nuevoEstadoPago },
    });

    // Devolvemos un objeto compatible con lo que el frontend espera
    return { ...ventaGuardada, saldo: saldoPendiente - monto };
  });
}

module.exports = { 
  aplicarAbono,
  getDeudasConSaldo 
};
