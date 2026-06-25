@echo off
setlocal
chcp 65001 >nul
title RESET DE BASE DE DATOS

:: --- CONFIGURACIÓN DE LA BASE DE DATOS ---
:: Asegúrate de que estos valores coincidan con tu archivo .env
set "PG_HOST=localhost"
set "PG_PORT=5432"
set "PG_USER=postgres"
set "PG_DBNAME=ofi_22"
set "PGPASSWORD=1106w"

:: --- TABLAS PRINCIPALES A VACIAR ---
:: Añade aquí las tablas "padre" que quieres limpiar, separadas por comas.
:: CASCADE se encargará de vaciar las tablas "hijo" dependientes.
set "TABLES_TO_TRUNCATE=sales, orders, turnos"

echo [!] Este script vaciará permanentemente datos de la base de datos '%PG_DBNAME%'.
echo [!] Se vaciarán las siguientes tablas y sus dependencias: %TABLES_TO_TRUNCATE%
echo.
set /p "confirm=¿Estás seguro de que deseas continuar? (S/N): "

if /i not "%confirm%"=="S" (
    echo.
    echo Operación cancelada.
    goto :EOF
)

echo.
echo [*] Ejecutando limpieza de la base de datos...

:: --- Búsqueda Inteligente de psql.exe ---
:: 1. Verificar si psql ya está disponible en el PATH del sistema.
where psql >nul 2>nul
if %errorlevel% equ 0 goto :PsqlReady

:: 2. Si no está, buscarlo en la ruta de instalación por defecto.
echo [*] 'psql' no está en el PATH. Buscando en la ruta de instalación por defecto...
for /d %%d in ("%ProgramFiles%\PostgreSQL\*") do (
    if exist "%%d\bin\psql.exe" (
        echo [*] PostgreSQL encontrado en "%%d". Añadiendo temporalmente al PATH.
        set "PATH=%%d\bin;%PATH%"
        goto :PsqlReady
    )
)

echo [X] ERROR FATAL: No se pudo encontrar 'psql.exe'.
echo [!] Por favor, asegúrate de que PostgreSQL esté instalado y su directorio 'bin' esté en el PATH del sistema.
goto :End

:PsqlReady

psql -h %PG_HOST% -p %PG_PORT% -U %PG_USER% -d %PG_DBNAME% -c "TRUNCATE TABLE %TABLES_TO_TRUNCATE% RESTART IDENTITY CASCADE;"

if %errorlevel% neq 0 (
    echo.
    echo [X] ERROR: El comando psql falló. Revisa el mensaje de error de arriba.
    echo [!] Asegúrate de que los nombres en la variable 'TABLES_TO_TRUNCATE' sean correctos y existan en la base de datos.
    goto :End
)

echo.
echo [✓] ¡Limpieza completada con éxito!

:End
pause
endlocal
