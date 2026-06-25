@echo off
setlocal
chcp 65001 >nul
title LISTAR TABLAS DE LA BASE DE DATOS

:: --- CONFIGURACIÓN DE LA BASE DE DATOS ---
set "PG_HOST=localhost"
set "PG_PORT=5432"
set "PG_USER=postgres"
set "PG_DBNAME=ofi_22"
set "PGPASSWORD=1106w"

echo [*] Conectando a la base de datos '%PG_DBNAME%' para listar tablas...
echo.

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
:: -t (solo tuplas) para una salida limpia, -A (sin alinear) para evitar espacios.
psql -h %PG_HOST% -p %PG_PORT% -U %PG_USER% -d %PG_DBNAME% -t -A -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

if %errorlevel% neq 0 (
    echo. & echo [X] ERROR: El comando psql falló. Revisa el mensaje de error.
    goto :End
)

:End
echo.
pause
endlocal