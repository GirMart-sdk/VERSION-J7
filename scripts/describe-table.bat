@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title DESCRIBIR TABLA

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
set /p "TABLE_TO_DESCRIBE=Introduce el nombre de la tabla que quieres describir: "

if not defined TABLE_TO_DESCRIBE (
    echo [!] Operación cancelada.
    goto :End
)

echo.
echo [*] Describiendo la estructura de la tabla '%TABLE_TO_DESCRIBE%'...
echo --------------------------------------------------

:: -q (quiet) para suprimir mensajes informativos, \d para describir la tabla.
"%PSQL_PATH%" -h %PG_HOST% -p %PG_PORT% -U %PG_USER% -d %PG_DBNAME% -q -c "\d %TABLE_TO_DESCRIBE%"

if %errorlevel% neq 0 (
    echo. & echo [X] ERROR: El comando psql falló.
    echo [!] Asegúrate de que el nombre de la tabla '%TABLE_TO_DESCRIBE%' es correcto.
    goto :End
)
echo --------------------------------------------------

:End
echo.
pause
endlocal