@echo off
setlocal

:: ══════════════════════════════════════════════════════════════════════════
:: WINNER STORE — Ejecutor Autónomo para Desarrollo Local
:: ══════════════════════════════════════════════════════════════════════════
:: Este script automatiza el inicio del entorno de desarrollo:
:: 1. Detecta la dirección IP local de la máquina.
:: 2. Crea un archivo 'config.js' para que el frontend sepa a qué IP conectarse.
:: 3. Inicia el servidor backend de Node.js.
:: 4. Abre el panel de administración en el navegador por defecto.
:: ══════════════════════════════════════════════════════════════════════════

title Winner Store - Servidor Local

:: Cambia al directorio raíz del proyecto (un nivel arriba de 'scripts')
cd /d "%~dp0\.."

echo.
echo [WINNER] Buscando direccion IP local...

:: Intenta encontrar la IP local parseando la salida de 'ipconfig'
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| find "IPv4"') do (
    for /f "tokens=*" %%b in ("%%a") do set "LOCAL_IP=%%b"
)

:: Si no se encuentra, usa 'localhost' como fallback seguro
if not defined LOCAL_IP (
    echo [WINNER] No se pudo detectar la IP. Usando 127.0.0.1 como fallback.
    set "LOCAL_IP=127.0.0.1"
)

echo [WINNER] IP Local detectada: %LOCAL_IP%
echo [WINNER] Guardando IP en 'config.js' para el frontend...

:: Crea el archivo de configuración para que el frontend lo lea
:: Esto es crucial para que el archivo 'core.js' sepa a dónde apuntar.
>config.js echo window.SERVER_CONFIG = { NETWORK_IP: "%LOCAL_IP%" };
>config.js echo localStorage.setItem("w_server_ip", "%LOCAL_IP%");

echo [WINNER] Configurando IP de confianza para el backend...
:: Define las IPs de administrador para el backend, incluyendo la local y localhost
set "ADMIN_IPS=127.0.0.1,::1,%LOCAL_IP%"
echo [WINNER] IPs de confianza: %ADMIN_IPS%

echo [WINNER] Archivo 'config.js' actualizado.
echo.
echo [WINNER] Iniciando servidor backend en http://%LOCAL_IP%:3000
echo [WINNER] Presiona CTRL+C para detener el servidor.
echo.

:: Inicia el panel de administración en el navegador
:: Se abre usando la IP local para evitar errores de seguridad del protocolo 'file://'
start "" "http://localhost:3000/admin-panel.html"

:: Inicia el servidor Node.js. El script se mantendrá aquí hasta que se cierre.
node backend/server.js