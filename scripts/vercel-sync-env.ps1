# ============================================================
# BISWARA ERP - Synchronisation des variables d'environnement vers Vercel
# ----------------------------------------------------------------------
# S'EXÉCUTE SUR VOTRE MACHINE (l'API Vercel est inaccessible depuis
# l'environnement d'audit : blocage TLS/réseau).
#
# Usage :
#   pwsh -File scripts/vercel-sync-env.ps1 -Token "vcp_XXXX" [-Project biswara-erp] [-EnvFile .env.local]
#
# Lit une variable env : $env:VERCEL_TOKEN (sinon -Token).
# Ne JAMAIS afficher les secrets.
# ============================================================

param(
  [string]$Token = $env:VERCEL_TOKEN,
  [string]$Project = "biswara-erp",
  [string]$EnvFile = ".env.local",
  [string]$Target = "production"
)

if (-not $Token) { Write-Error "Token manquant (argument -Token ou \$env:VERCEL_TOKEN)."; exit 1 }
if (-not (Test-Path $EnvFile)) { Write-Error "Fichier '$EnvFile' introuvable."; exit 1 }

function Invoke-VercelEnv {
  param([string]$key, [string]$value)
  $body = @{
    key = $key
    value = $value
    type = "encrypted"
    target = @($Target)
  } | ConvertTo-Json
  try {
    $r = Invoke-RestMethod -Method POST -Uri "https://api.vercel.com/v10/projects/$Project/env?upsert=true" `
      -Headers @{ Authorization = "Bearer $Token" } -ContentType "application/json" -Body $body -TimeoutSec 30
    Write-Output "OK   $key"
  } catch {
    Write-Warning "FAIL $key : $($_.Exception.Message)"
  }
}

$count = 0
Get-Content $EnvFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#") -or -not $line.Contains("=")) { return }
  $idx = $line.IndexOf("=")
  $key = $line.Substring(0, $idx)
  $value = $line.Substring($idx + 1)
  # Supprime les guillemets éventuels autour de la valeur
  if ($value.Length -ge 2 -and $value.StartsWith('"') -and $value.EndsWith('"')) { $value = $value.Substring(1, $value.Length - 2) }
  Invoke-VercelEnv -key $key -value $value
  $count++
}

Write-Output ""
Write-Output "Terminé : $count variable(s) poussée(s) vers le projet Vercel '$Project' ($Target)."
Write-Output "Vérifiez ensuite : vercel --prod (redéploiement) puis testez le site."
