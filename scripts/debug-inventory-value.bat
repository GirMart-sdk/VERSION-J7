@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title DIAGNÓSTICO DE VALOR DE INVENTARIO

:: --- CONFIGURACIÓN DE LA BASE DE DATOS ---
set "PG_HOST=localhost"
set "PG_PORT=5432"
set "PG_USER=postgres"
set "PG_DBNAME=ofi_22"
set "PGPASSWORD=1106w"

:: --- Búsqueda Inteligente de psql.exe ---
set "PSQL_PATH="
where psql >nul 2>nul
if %errorlevel% equ 0 ( set "PSQL_PATH=psql" ) else (
    for /d %%d in ("%ProgramFiles%\PostgreSQL\*") do (
        if exist "%%d\bin\psql.exe" (
            set "PSQL_PATH=%%d\bin\psql.exe"
            goto :PsqlFound
        )
    )
)
:PsqlFound
if not defined PSQL_PATH (
    echo [X] ERROR FATAL: No se pudo encontrar 'psql.exe'.
    goto :End
)

echo.
echo [*] Ejecutando diagnóstico de valor de inventario...
echo [*] Esta consulta muestra los productos con stock y su costo registrado.
echo --------------------------------------------------------------------------

set "DEBUG_SQL=SELECT p.id, p.name, i.quantity, p.precio_costo, (i.quantity * p.precio_costo) AS subtotal FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.quantity > 0;"

"%PSQL_PATH%" -h %PG_HOST% -p %PG_PORT% -U %PG_USER% -d %PG_DBNAME% -c "%DEBUG_SQL%"

if %errorlevel% neq 0 (
    echo. & echo [X] ERROR: El comando psql falló.
    goto :End
)
echo --------------------------------------------------------------------------

:End
echo.
pause
endlocal