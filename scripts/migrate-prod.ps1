# Applique les migrations Prisma en attente sur la base de production.
#
# L'URL est demandee au moment de l'execution : elle ne passe ni par un
# fichier, ni par l'historique du shell, ni par une variable persistante.
#
#   .\scripts\migrate-prod.ps1
#
# Ou la trouver : Vercel > boutikpro > Settings > Environment Variables,
# variable DATABASE_URL, bouton pour reveler la valeur.

$ErrorActionPreference = 'Stop'

$apiDir = Join-Path $PSScriptRoot '..\apps\api' | Resolve-Path

Write-Host ''
Write-Host 'Collez l''URL de la base de production (elle ne sera pas affichee) :' -ForegroundColor Cyan
$secure = Read-Host -AsSecureString
$url = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))

# Vercel renvoie parfois la valeur prefixee d'un BOM, ce qui casse Prisma.
$url = $url.Trim()
if ($url.Length -gt 0 -and [int]$url[0] -eq 0xFEFF) {
    $url = $url.Substring(1)
    Write-Host 'BOM detecte en tete de l''URL : retire.' -ForegroundColor Yellow
}

if (-not $url.StartsWith('postgres')) {
    Write-Host "L'URL devrait commencer par postgres:// ou postgresql:// — verifiez le copier-coller." -ForegroundColor Red
    exit 1
}

$env:DATABASE_URL = $url
Push-Location $apiDir
try {
    Write-Host ''
    Write-Host '--- Etat avant migration ---' -ForegroundColor Cyan
    npx prisma migrate status

    Write-Host ''
    $rep = Read-Host 'Appliquer les migrations en attente ? (o/N)'
    if ($rep -ne 'o' -and $rep -ne 'O') {
        Write-Host 'Annule. Rien n''a ete modifie.' -ForegroundColor Yellow
        exit 0
    }

    Write-Host ''
    Write-Host '--- Application ---' -ForegroundColor Cyan
    npx prisma migrate deploy

    Write-Host ''
    Write-Host '--- Etat apres migration ---' -ForegroundColor Cyan
    npx prisma migrate status
}
finally {
    Pop-Location
    # Ne pas laisser l'URL dans la session
    Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
}

Write-Host ''
Write-Host 'Comment lire le resultat :' -ForegroundColor Cyan
Write-Host '  "Database schema is up to date!" dans l''etat apres migration = c''est bon.'
Write-Host '  Toute autre sortie : collez-la dans la conversation.'
Write-Host ''
Write-Host 'Les routes /products et /categories ne peuvent pas etre verifiees sans etre' -ForegroundColor DarkGray
Write-Host 'connecte : sans jeton elles renvoient 401 dans les deux cas. C''est "migrate' -ForegroundColor DarkGray
Write-Host 'status" ci-dessus qui fait foi.' -ForegroundColor DarkGray
