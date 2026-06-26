/* ═══════════════════════════════════════════════════════════
   WINNER — backend/services/statsService.js (Lógica de Estadísticas)
   ═══════════════════════════════════════════════════════════ */
"use strict";

const { prisma } = require("../database");

class StatsService {
  /**
   * Obtiene todas las métricas clave para el dashboard principal.
   */
  static async getDashboardStats() {
    // Usamos Promise.all para ejecutar todas las consultas en paralelo para máxima eficiencia.
    const [salesData, expensesData, inventoryValueData, cogsData, topProductsData] = await Promise.all([
      prisma.sale.aggregate({ _sum: { totalAmount: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      // --- CÁLCULO DEL VALOR DEL INVENTARIO ---
      // Consulta que calcula el valor total del inventario basándose en el costo.
      prisma.$queryRaw`SELECT SUM(i.quantity * p."precioCosto") AS value FROM "inventory" i JOIN "products" p ON i."productId" = p.id`,
      // --- CÁLCULO DEL COSTO DE BIENES VENDIDOS (COGS) ---
      // Esto calcula el costo total de los productos que ya se han vendido.
      prisma.$queryRaw`SELECT SUM(si.quantity * p."precioCosto") AS value FROM "SaleItem" si JOIN "products" p ON si."productId" = p.id`,
      this.getTopProducts(5)
    ]);

    const inventoryValue = inventoryValueData[0]?.value || 0;
    const totalSales = salesData._sum.totalAmount || 0;
    const cogs = cogsData[0]?.value || 0;

    return {
      totalSales: totalSales,
      totalExpenses: expensesData._sum.amount || 0,
      inventoryValue: Number(inventoryValue),
      topProducts: topProductsData,
      grossProfit: Number(totalSales) - Number(cogs), // Ganancia Bruta = Ventas Totales - COGS
      cogs: Number(cogs),
    };
  }

  /**
   * Obtiene los productos más vendidos.
   * @param {number} limit - Número de productos a retornar.
   */
  static async getTopProducts(limit = 5) {
    return prisma.saleItem.groupBy({
      by: ["product_name"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });
  }
}

module.exports = StatsService;