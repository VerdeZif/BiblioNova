# Configurar contraseñas de usuarios LDAP
# Ejecutar después de iniciar el contenedor del caso práctico.

$contenedor = "universidad-ldap-practica"
$baseDN = "ou=people,dc=universidad,dc=test"
$adminDN = "cn=admin,dc=universidad,dc=test"

$usuarios = @(
    "adminbiblioteca",
    "bib001",
    "est001"
)

foreach ($usuario in $usuarios) {
    Write-Host "`nConfigurando contraseña de: $usuario" -ForegroundColor Cyan

    docker exec -it $contenedor ldappasswd `
        -x `
        -H ldap://127.0.0.1:389 `
        -D $adminDN `
        -W `
        -S `
        "uid=$usuario,$baseDN"

    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo configurar la contraseña de $usuario"
    }
}

Write-Host "`nConfiguración de usuarios finalizada." -ForegroundColor Green
