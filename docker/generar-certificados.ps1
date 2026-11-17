$ErrorActionPreference = "Stop"

$carpeta = Join-Path $PSScriptRoot "certs"

if (-not (Test-Path $carpeta)) {
    New-Item -ItemType Directory -Path $carpeta -Force | Out-Null
}

# Evitar reemplazar certificados existentes
$archivos = @(
    "ca.key",
    "ca.crt",
    "ldap.key",
    "ldap.crt"
)

foreach ($archivo in $archivos) {
    if (Test-Path (Join-Path $carpeta $archivo)) {
        throw "Ya existe $archivo. No se reemplazaran los certificados."
    }
}

$ruta = (Resolve-Path $carpeta).Path
$volumen = "${ruta}:/certs"

$imagen = "osixia/openldap:1.5.0"

function Ejecutar-OpenSSL {
    & docker run --rm `
        --entrypoint openssl `
        -v $volumen `
        $imagen @args

    if ($LASTEXITCODE -ne 0) {
        throw "Error al ejecutar OpenSSL."
    }
}

Write-Host "`n1. Generando autoridad certificadora..." -ForegroundColor Cyan

Ejecutar-OpenSSL req -x509 -newkey rsa:3072 `
    -sha256 -nodes -days 3650 `
    -keyout /certs/ca.key `
    -out /certs/ca.crt `
    -subj "/CN=Universidad XYZ LDAP Local CA"

Write-Host "`n2. Generando solicitud del certificado LDAP..." -ForegroundColor Cyan

Ejecutar-OpenSSL req -new -newkey rsa:3072 `
    -nodes `
    -keyout /certs/ldap.key `
    -out /certs/ldap.csr `
    -subj "/CN=ldap.universidad.test"

# Extensiones del certificado LDAP
$extension = @(
    "basicConstraints=critical,CA:FALSE"
    "subjectAltName=DNS:ldap.universidad.test,IP:127.0.0.1"
    "keyUsage=critical,digitalSignature,keyEncipherment"
    "extendedKeyUsage=serverAuth"
) -join "`n"

[System.IO.File]::WriteAllText(
    (Join-Path $carpeta "ldap.ext"),
    $extension,
    (New-Object System.Text.UTF8Encoding($false))
)

Write-Host "`n3. Firmando certificado del servidor..." -ForegroundColor Cyan

Ejecutar-OpenSSL x509 -req `
    -in /certs/ldap.csr `
    -CA /certs/ca.crt `
    -CAkey /certs/ca.key `
    -CAcreateserial `
    -out /certs/ldap.crt `
    -days 825 `
    -sha256 `
    -extfile /certs/ldap.ext

Write-Host "`nCertificados generados correctamente." -ForegroundColor Green
Write-Host "Ubicacion: $carpeta"
