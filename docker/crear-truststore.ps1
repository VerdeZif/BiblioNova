$ErrorActionPreference = "Stop"

$certificado = Join-Path $PSScriptRoot "certs\ca.crt"
$truststore = Join-Path $PSScriptRoot "certs\ldap-truststore.p12"

if (-not (Test-Path $certificado)) {
    throw "No existe ca.crt. Ejecuta primero generar-certificados.ps1"
}

if (Test-Path $truststore) {
    Write-Host "El truststore ya existe. No se reemplazara." -ForegroundColor Yellow
    exit 0
}

Write-Host "Creando truststore LDAP..." -ForegroundColor Cyan

& keytool -importcert `
    -trustcacerts `
    -alias universidad-xyz-ca `
    -file $certificado `
    -keystore $truststore `
    -storetype PKCS12

if ($LASTEXITCODE -ne 0) {
    throw "No se pudo crear el truststore."
}

Write-Host "Truststore creado correctamente." -ForegroundColor Green
