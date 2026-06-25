const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Helper para formatear moneda
const formatCurrency = (num) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(num);

// --- 1. CONFIGURACIÓN DEL SERVICIO DE CORREO ---
const mailTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true para puerto 465, false para otros
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Genera un reporte en PDF para una sesión de caja.
 * @param {object} session - Datos de la sesión.
 * @param {object} salesSummary - Resumen de ventas de la sesión.
 * @returns {Promise<string>} - Ruta al archivo PDF generado.
 */
function generatePdfReport(session, salesSummary) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    // Usamos una carpeta temporal del sistema para guardar el PDF
    const filePath = path.join(
      require("os").tmpdir(),
      `reporte-caja-${session.id}.pdf`,
    );
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // --- Contenido del PDF ---
    doc.fontSize(20).text("Reporte de Cierre de Caja", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`ID de Sesión: ${session.id}`);
    doc.text(
      `Fecha de Apertura: ${new Date(session.startTime).toLocaleString("es-CO")}`,
    );
    doc.text(
      `Fecha de Cierre: ${new Date(session.endTime).toLocaleString("es-CO")}`,
    );
    doc.moveDown();

    doc.fontSize(16).text("Resumen del Turno", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).text(`Base Inicial: ${formatCurrency(session.baseAmount)}`);
    doc
      .fontSize(12)
      .text(`Ventas en Efectivo: ${formatCurrency(salesSummary.cash)}`);
    doc
      .fontSize(12)
      .text(`Ventas con Tarjeta: ${formatCurrency(salesSummary.card)}`);
    doc
      .fontSize(12)
      .text(`Otros Métodos: ${formatCurrency(salesSummary.other)}`);
    doc.moveDown();

    const totalInCash = session.baseAmount + salesSummary.cash;
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`Total Teórico en Caja: ${formatCurrency(totalInCash)}`);
    doc.moveDown(2);

    doc
      .fontSize(10)
      .fillColor("grey")
      .text("Reporte generado automáticamente por Winner Store POS.", {
        align: "center",
      });

    doc.end();
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
}

/**
 * Envía el reporte en PDF por correo electrónico.
 * @param {string} pdfPath - Ruta al archivo PDF.
 * @param {object} session - Datos de la sesión.
 */
async function sendEmailWithReport(pdfPath, session) {
  const mailOptions = {
    from: `"Winner Store POS" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL || process.env.SMTP_USER, // Envía al admin o a sí mismo
    subject: `Reporte de Cierre de Caja - Sesión #${session.id}`,
    html: `
      <p>Hola,</p>
      <p>Se ha realizado un nuevo cierre de caja.</p>
      <p>Adjunto encontrarás el reporte detallado de la sesión <strong>#${session.id}</strong>.</p>
      <p>Saludos,<br>Tu Sistema de Punto de Venta.</p>
    `,
    attachments: [
      {
        filename: `Reporte-Caja-${session.id}.pdf`,
        path: pdfPath,
        contentType: "application/pdf",
      },
    ],
  };

  await mailTransport.sendMail(mailOptions);
  fs.unlinkSync(pdfPath); // Borra el archivo PDF después de enviarlo
}

/**
 * Función principal que maneja la solicitud de envío de reporte.
 * @param {object} db - Instancia de la base de datos.
 * @returns {Function} - Middleware de Express.
 */
function createArqueoHandler(db) {
  // eslint-disable-next-line no-unused-vars
  return async (req, res, next) => {
    const { sessionId, downloadOnly } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Falta el ID de la sesión." });
    }

    try {
      // En una implementación real, aquí consultarías la base de datos.
      // Por ahora, simulamos la obtención de datos como antes.
      const { session, salesSummary } = await db.getReportData(sessionId);

      const pdfPath = await generatePdfReport(session, salesSummary);

      if (!downloadOnly) {
        await sendEmailWithReport(pdfPath, session); // sendEmailWithReport ya borra el archivo
        res.json({ success: true, message: "Reporte enviado con éxito." });
      } else {
        // Si solo es descarga, leemos el archivo, lo convertimos a base64 y lo enviamos.
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');
        fs.unlinkSync(pdfPath); // Borramos el archivo temporal
        res.json({ success: true, message: "PDF generado.", pdfBase64 });
      }

    } catch (error) {
      console.error("[ERROR] Enviando reporte de caja:", error);
      res.status(500).json({ error: "No se pudo generar o enviar el reporte." });
    }
  };
}

module.exports = { createArqueoHandler };