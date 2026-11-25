param(
  [Parameter(Mandatory = $true)][string]$Bucket,
  [Parameter(Mandatory = $true)][string]$DistributionId
)

$ErrorActionPreference = "Stop"

if (-not $env:VITE_API_URL -or $env:VITE_API_URL -match "localhost") {
  throw "Define VITE_API_URL con la URL HTTPS pública del backend antes de publicar."
}
if (-not $env:VITE_SOCKET_URL -or $env:VITE_SOCKET_URL -match "localhost") {
  throw "Define VITE_SOCKET_URL con la URL HTTPS pública del balanceador antes de publicar."
}
if (-not $env:VITE_GOOGLE_CLIENT_ID) {
  throw "Define VITE_GOOGLE_CLIENT_ID registrado para el dominio HTTPS de producción."
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$chatRoot = Join-Path $repoRoot "frontends\mf-chat"

Push-Location $chatRoot
try {
  npm ci
  if ($LASTEXITCODE -ne 0) { throw "npm ci falló." }
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "La compilación de mf-chat falló." }

  aws s3 sync dist "s3://$Bucket" --delete
  if ($LASTEXITCODE -ne 0) { throw "No se pudo sincronizar el sitio con S3." }

  aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/index.html" "/remoteEntry.js" "/assets/*"
  if ($LASTEXITCODE -ne 0) { throw "No se pudo invalidar la caché de CloudFront." }
} finally {
  Pop-Location
}

Write-Host "mf-chat publicado en el bucket $Bucket. La invalidación de CloudFront está en curso."
