# Busca ofertas nuevas y luego abre el panel para revisarlas
Write-Host "=== Buscando ofertas nuevas... ===" -ForegroundColor Cyan
npm run buscar
Write-Host "=== Abriendo panel... ===" -ForegroundColor Cyan
npm run panel
