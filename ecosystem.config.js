const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = {
  apps: [
    {
            name: "winner-store", // <-- ¡Aquí está el nombre correcto!
            script: "./backend/server.js",
      cwd: "./",
      instances: 1, // Para una sola instancia, 'fork' es más simple que 'cluster'
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        // --- CONFIGURACIÓN DE CORREO PARA REPORTES ---
        SMTP_HOST: "smtp.gmail.com",
        SMTP_PORT: 465,
        SMTP_USER: "tu.correo@gmail.com",
        SMTP_PASS: "tu-contraseña-de-aplicacion", // ¡Usa una "Contraseña de Aplicación" de Google!
      },
      cron_restart: "0 0 * * *",
      exp_backoff_restart_delay: 1000, // Si falla, espera cada vez más para no saturar
      max_restarts: 10,                 // Límite de reintentos antes de marcar error
      listen_timeout: 5000,             // Tiempo de espera para que el proceso responda
      kill_timeout: 3000,               // Tiempo de espera antes de forzar cierre
    },
    {
      name: "winner-store-backup-task",
      script: "./scripts/database-backup.js", // Ejecutamos el script de Node directamente
      cwd: __dirname,
      cron_restart: "0 3 * * *", // Se ejecuta todos los días a las 3:00 AM
      autorestart: false, // No reiniciar al terminar, esperar al siguiente cron
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
