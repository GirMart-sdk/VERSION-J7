@echo off
setlocal
chcp 65001 >nul
title ACTUALIZAR COSTOS DE PRODUCTOS

:: --- CONFIGURACIÓN DE LA BASE DE DATOS ---
set "PG_HOST=localhost"
set "PG_PORT=5432"
set "PG_USER=postgres"
set "PG_DBNAME=ofi_22"
set "PGPASSWORD=1106w"

:: --- SCRIPT DE ACTUALIZACIÓN ---
:: 1. DEFINE EL NOMBRE CORRECTO DE TU TABLA DE PRODUCTOS AQUÍ:
set "TABLE_NAME=products"

:: 2. MODIFICA LA CONSULTA SQL PARA ACTUALIZAR LOS COSTOS QUE NECESITES.
::    Usa %TABLE_NAME% para referirte a la tabla.
::    EJEMPLO: Actualizar el costo de UN producto por su ID.
::    set "UPDATE_SQL=UPDATE %TABLE_NAME% SET precio_costo = 99.50 WHERE id = '5';"

:: !! IMPORTANTE !! - DEFINE AQUÍ LA CONSULTA QUE QUIERES EJECUTAR.
set "UPDATE_SQL=UPDATE %TABLE_NAME% SET precio_costo = 125.50 WHERE id = 'mqsnbhaqkk1';"

echo [!] Este script ejecutará una actualización en la base de datos '%PG_DBNAME%'.
echo [!] Consulta a ejecutar:
echo %UPDATE_SQL%
echo.
set /p "confirm=¿Estás seguro de que deseas continuar? (S/N): "

if /i not "%confirm%"=="S" (
    echo.
    echo Operación cancelada.
    goto :EOF
)

echo.
echo [*] Ejecutando actualización de costos...

:: --- Búsqueda Inteligente de psql.exe ---
where psql >nul 2>nul
if %errorlevel% equ 0 goto :PsqlReady

for /d %%d in ("%ProgramFiles%\PostgreSQL\*") do (
    if exist "%%d\bin\psql.exe" (
        set "PATH=%%d\bin;%PATH%"
        goto :PsqlReady
    )
)
echo [X] ERROR FATAL: No se pudo encontrar 'psql.exe'.
goto :End

:PsqlReady
psql -h %PG_HOST% -p %PG_PORT% -U %PG_USER% -d %PG_DBNAME% -c "%UPDATE_SQL%"
if %errorlevel% neq 0 (
    echo. & echo [X] ERROR: La actualización falló. Revisa el mensaje de error.
    goto :End
)
echo. & echo [✓] ¡Actualización completada con éxito!

:End
pause
endlocal