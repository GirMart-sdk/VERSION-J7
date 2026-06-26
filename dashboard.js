/* ═══════════════════════════════════════════════════════
   WINNER — dashboard.js (Lógica del Dashboard Principal)
   ═══════════════════════════════════════════════════════ */
"use strict";

/**
 * Actualiza los Indicadores Clave de Rendimiento (KPIs) en el dashboard.
 * @param {Array} salesData - El array de ventas del período.
 */
function updateDashboardKPIs(salesData = []) {
  const kpiTotalRevenue = document.getElementById("kpiTotalRevenue");
  const kpiOrders = document.getElementById("kpiOrders");
  const kpiAvgTicket = document.getElementById("kpiAvgTicket");

  if (!salesData || salesData.length === 0) {
    if (kpiTotalRevenue) kpiTotalRevenue.textContent = "$0";
    if (kpiOrders) kpiOrders.textContent = "0";
    if (kpiAvgTicket) kpiAvgTicket.textContent = "$0";
    return;
  }

  const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalOrders = salesData.length;

  // [FIX] Evitar división por cero que causa NaN.
  // Si no hay órdenes, el ticket promedio es 0.
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  if (kpiTotalRevenue) kpiTotalRevenue.textContent = fmt(totalRevenue);
  if (kpiOrders) kpiOrders.textContent = totalOrders;
  if (kpiAvgTicket) kpiAvgTicket.textContent = fmt(avgTicket);
}

// Hacemos la función global para que pueda ser llamada desde otros scripts (ej: sales-logic.js)
window.updateDashboardKPIs = updateDashboardKPIs;