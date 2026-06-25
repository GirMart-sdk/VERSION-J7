@echo off
setlocal
chcp 65001 >nul
title APLICAR MIGRACIÓN DE BASE DE DATOS

:: --- CONFIGURACIÓN DE LA BASE DE DATOS ---
set "PG_HOST=localhost"
set "PG_PORT=5432"
set "PG_USER=postgres"
set "PG_DBNAME=ofi_22"
set "PGPASSWORD=1106w"

:: --- MIGRACIÓN A APLICAR ---
:: 1. DEFINE EL NOMBRE CORRECTO DE TU TABLA DE PRODUCTOS AQUÍ:
set "TABLE_NAME=products"

:: 2. El script construye el comando SQL automáticamente.
set "MIGRATION_NAME=ADD_PRECIO_COSTO_TO_%TABLE_NAME%"
set "MIGRATION_SQL=ALTER TABLE %TABLE_NAME% ADD COLUMN precio_costo DECIMAL(10, 2) NOT NULL DEFAULT 0.00;"

echo [!] Este script aplicará un cambio permanente al esquema de la base de datos '%PG_DBNAME%'.
echo [!] Migración a ejecutar: %MIGRATION_NAME%
echo.
set /p "confirm=¿Estás seguro de que deseas continuar? (S/N): "

if /i not "%confirm%"=="S" (
    echo.
    echo Operación cancelada.
    goto :EOF
)

echo.
echo [*] Ejecutando migración de la base de datos...

:: --- Búsqueda Inteligente de psql.exe ---
where psql >nul 2>nul
if %errorlevel% equ 0 goto :PsqlReady

echo [*] 'psql' no está en el PATH. Buscando en la ruta de instalación por defecto...
for /d %%d in ("%ProgramFiles%\PostgreSQL\*") do (
    if exist "%%d\bin\psql.exe" (
        echo [*] PostgreSQL encontrado en "%%d". Añadiendo temporalmente al PATH.
        set "PATH=%%d\bin;%PATH%"
        goto :PsqlReady
    )
)

echo [X] ERROR FATAL: No se pudo encontrar 'psql.exe'.
goto :End

:PsqlReady

psql -h %PG_HOST% -p %PG_PORT% -U %PG_USER% -d %PG_DBNAME% -c "%MIGRATION_SQL%"

if %errorlevel% neq 0 (
    echo.
    echo [X] ERROR: La migración falló. Revisa el mensaje de error de arriba.
    goto :End
)

echo.
echo [✓] ¡Migración '%MIGRATION_NAME%' aplicada con éxito!

:End
pause
endlocal
