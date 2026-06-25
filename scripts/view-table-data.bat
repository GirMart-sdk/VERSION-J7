@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title VER DATOS DE TABLA

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
set /p "TABLE_TO_VIEW=Introduce el nombre de la tabla cuyos datos quieres ver: "

if not defined TABLE_TO_VIEW (
    echo [!] Operación cancelada.
    goto :End
)

echo.
echo [*] Mostrando datos de la tabla '%TABLE_TO_VIEW%'...
echo --------------------------------------------------

"%PSQL_PATH%" -h %PG_HOST% -p %PG_PORT% -U %PG_USER% -d %PG_DBNAME% -c "SELECT * FROM %TABLE_TO_VIEW%;"

if %errorlevel% neq 0 (
    echo. & echo [X] ERROR: El comando psql falló.
    echo [!] Asegúrate de que el nombre de la tabla '%TABLE_TO_VIEW%' es correcto.
    goto :End
)
echo --------------------------------------------------

:End
echo.
pause
endlocal