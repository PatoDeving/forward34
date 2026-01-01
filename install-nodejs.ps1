# Script de instalación de Node.js para Forward34
# Ejecutar con: PowerShell -ExecutionPolicy Bypass -File install-nodejs.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Forward34 - Instalador de Node.js" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si Node.js ya está instalado
Write-Host "Verificando si Node.js está instalado..." -ForegroundColor Yellow

$nodeInstalled = $false
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        $nodeInstalled = $true
        Write-Host "✓ Node.js ya está instalado: $nodeVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Node.js no está instalado" -ForegroundColor Red
}

if ($nodeInstalled) {
    Write-Host ""
    Write-Host "¿Deseas reinstalar Node.js? (S/N): " -NoNewline
    $response = Read-Host
    if ($response -ne "S" -and $response -ne "s") {
        Write-Host ""
        Write-Host "Instalación cancelada." -ForegroundColor Yellow
        Write-Host "Ejecuta 'npm install' para instalar las dependencias del proyecto." -ForegroundColor Cyan
        Write-Host ""
        pause
        exit
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Descargando Node.js..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# URL de descarga de Node.js LTS
$nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
$installerPath = "$env:TEMP\nodejs-installer.msi"

try {
    Write-Host "Descargando desde: $nodeUrl" -ForegroundColor Yellow
    Write-Host "Guardando en: $installerPath" -ForegroundColor Yellow
    Write-Host ""

    # Descargar el instalador
    Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath -UseBasicParsing

    Write-Host "✓ Descarga completada!" -ForegroundColor Green
    Write-Host ""

    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Instalando Node.js..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Se abrirá el instalador. Por favor:" -ForegroundColor Yellow
    Write-Host "  1. Acepta los términos" -ForegroundColor White
    Write-Host "  2. Mantén las opciones predeterminadas" -ForegroundColor White
    Write-Host "  3. Haz clic en 'Next' hasta finalizar" -ForegroundColor White
    Write-Host ""

    # Ejecutar el instalador
    Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /qb" -Wait

    Write-Host ""
    Write-Host "✓ Instalación completada!" -ForegroundColor Green

    # Limpiar archivo temporal
    Remove-Item $installerPath -ErrorAction SilentlyContinue

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Verificando instalación..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Refrescar las variables de entorno
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    Write-Host "IMPORTANTE: Cierra y abre una NUEVA ventana de PowerShell/CMD" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Luego ejecuta estos comandos:" -ForegroundColor Cyan
    Write-Host "  cd `"$PWD`"" -ForegroundColor White
    Write-Host "  npm install" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "✗ Error durante la instalación: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instalación manual:" -ForegroundColor Yellow
    Write-Host "  1. Ve a: https://nodejs.org/" -ForegroundColor White
    Write-Host "  2. Descarga la versión LTS" -ForegroundColor White
    Write-Host "  3. Ejecuta el instalador" -ForegroundColor White
    Write-Host ""
}

Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Cyan
pause | Out-Null
