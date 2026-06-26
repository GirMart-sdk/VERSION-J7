@echo off
setlocal

echo.
echo =================================================
echo      ACTUALIZANDO PROYECTO DESDE GITHUB
echo =================================================
echo.

echo [1/2] Verificando el estado de Git...
git status

echo.
echo [2/2] Descargando los ultimos cambios desde el repositorio...
echo.

:: El comando 'git pull' descarga y fusiona los cambios.
:: 'origin' es el nombre por defecto del repositorio remoto (GitHub).
:: 'main' es el nombre de la rama principal. Puede ser 'master' en proyectos mas antiguos.
:: El flag --allow-unrelated-histories soluciona el error "fatal: refusing to merge unrelated histories"
:: que ocurre la primera vez que se intenta unir un repositorio local y remoto que no comparten un historial inicial.
git pull origin main --allow-unrelated-histories

echo.
echo =================================================
echo      Actualizacion completada.
echo =================================================
echo.

endlocal
pause