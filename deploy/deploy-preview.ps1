# Kindred: deploy a preview of the app to Vercel from this PC.
#
# Run from the app folder (Backend\kindred-marketplace\kindred):
#     powershell -ExecutionPolicy Bypass -File deploy\deploy-preview.ps1
#
# First run: logs you in to Vercel, creates the "kindred-app" project in your
# team, copies the Supabase settings from .env.local into the project, and
# deploys. Later runs just redeploy. Your .env.local is never uploaded (see
# .vercelignore); values are sent to Vercel's encrypted settings instead.
#
# Stripe keys are deliberately NOT copied: memberships stay "open at launch"
# on the preview so nobody can be charged.

$ErrorActionPreference = 'Stop'
$Vercel = 'vercel@65.2.0'
$Scope  = 'kindred-marketplace-s-projects'
$Project = 'kindred-app'

if (-not (Test-Path '.env.local')) { throw 'Run this from the app folder (where .env.local is).' }

# Read .env.local into a hashtable without printing anything.
$envMap = @{}
Get-Content '.env.local' | ForEach-Object {
  if ($_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$') {
    $envMap[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
  }
}

Write-Host '1/4  Logging in to Vercel (a browser tab may open)...'
npx --yes $Vercel whoami 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { npx --yes $Vercel login }

Write-Host '2/4  Linking this folder to the kindred-app project...'
npx --yes $Vercel link --yes --project $Project --scope $Scope

Write-Host '3/4  Copying settings to Vercel (values are not shown)...'
$vars = [ordered]@{
  'NEXT_PUBLIC_SUPABASE_URL'      = $envMap['NEXT_PUBLIC_SUPABASE_URL']
  'NEXT_PUBLIC_SUPABASE_ANON_KEY' = $envMap['NEXT_PUBLIC_SUPABASE_ANON_KEY']
  'SUPABASE_SERVICE_ROLE_KEY'     = $envMap['SUPABASE_SERVICE_ROLE_KEY']
  'NEXT_PUBLIC_APP_URL'           = 'https://kindred-app.vercel.app'
  'NEXT_PUBLIC_NOINDEX'           = '1'
}
foreach ($name in $vars.Keys) {
  $value = $vars[$name]
  if (-not $value -or $value -match 'PASTE|YOUR_') { Write-Host "     skipped $name (not set in .env.local)"; continue }
  foreach ($target in @('production', 'preview')) {
    npx --yes $Vercel env rm $name $target --yes --scope $Scope 2>$null | Out-Null
    $value | npx --yes $Vercel env add $name $target --scope $Scope | Out-Null
  }
  Write-Host "     set $name"
}

Write-Host '4/4  Building and deploying (takes a couple of minutes)...'
npx --yes $Vercel deploy --prod --yes --scope $Scope
Write-Host ''
Write-Host 'Done. Open the link above on your phone.'
