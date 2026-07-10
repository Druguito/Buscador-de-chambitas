# Configura el proyecto por primera vez
Write-Host "=== Job Hunter - Setup ===" -ForegroundColor Cyan

# Crear profile.yaml si no existe
if (-not (Test-Path "profile.yaml")) {
    Copy-Item "profile.example.yaml" "profile.yaml"
    Write-Host "[OK] profile.yaml creado - editalo con lo que buscas" -ForegroundColor Yellow
} else {
    Write-Host "[OK] profile.yaml ya existe" -ForegroundColor Green
}

Write-Host "Instalando dependencias..." -ForegroundColor Cyan
npm install

# El scraping usa tu Edge o Chrome ya instalado, no hace falta descargar nada.
# Si no tuvieras ninguno, descomenta la linea de abajo:
# npx playwright install chromium

Write-Host ""
Write-Host "=== Listo ===" -ForegroundColor Green
Write-Host "Para buscar ofertas:  npm run buscar" -ForegroundColor White
Write-Host "Para abrir el panel:  npm run panel" -ForegroundColor White
