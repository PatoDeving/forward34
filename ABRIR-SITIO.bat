@echo off
echo ========================================
echo   Forward34 - Sitio Web
echo ========================================
echo.
echo Abriendo el sitio en tu navegador...
echo.

REM Obtener la ruta completa del directorio actual
set "current_dir=%~dp0"

REM Abrir el archivo START-HERE.html en el navegador predeterminado
start "" "%current_dir%START-HERE.html"

echo.
echo OPCIONES DISPONIBLES:
echo.
echo 1. Ver instrucciones: Ya abierto (START-HERE.html)
echo 2. Pagina de inicio:   index.html
echo 3. Empresa:            empresa.html
echo 4. Servicios:          servicios.html
echo 5. Descubrete+:        descubrete.html
echo 6. Contacto:           contacto.html
echo.
echo ========================================
echo.
echo NOTA: Para desarrollo profesional,
echo instala Node.js siguiendo INSTALL-GUIDE.md
echo.
echo Presiona cualquier tecla para abrir mas paginas...
pause > nul

start "" "%current_dir%index.html"

echo.
echo Paginas abiertas en tu navegador!
echo.
echo Presiona cualquier tecla para salir...
pause > nul
