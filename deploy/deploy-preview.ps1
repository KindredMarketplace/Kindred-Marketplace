# Kindred: deploy a preview of the app to Vercel from this PC.
#
# Run from the app folder (Backend\kindred-marketplace\kindred):
#     powershell -ExecutionPolicy Bypass -File deploy\deploy-preview.ps1
#
# First run: logs you in to Vercel, creates the "kindred-app" project in your
# team, copies the Supabase settings from .env.local into the project's
# encrypted settings, and deploys. Later runs just redeploy.
# Your .env.local file itself is never uploaded (see .vercelignore).
#
# Stripe keys are deliberately NOT copied: memberships stay "open at launch"
# on the preview so nobody can be charged.
#
# Note: the Vercel CLI writes normal progress text to the error stream, which
# Windows PowerShell likes to show in red. Red text alone is not a failure;
# this script checks each step's real exit code instead.

$ErrorActionPreference = 'Continue'
$Vercel  = 'vercel@65.2.0'
$Scope   = 'kindred-marketplace-s-projects'
$Project = 'kindred-app'

function Fail($msg) {
  Write-Host ''
  Write-Host "STOPPED: $msg" -ForegroundColor Yellow
  Write-Host 'Copy everything above this line and send it to Claude.'
  exit 1
}

# Runs a Vercel command quietly; returns its exit code.
function Invoke-VercelQuiet([string]$cmdArgs) {
  cmd /c "npx --yes $Vercel $cmdArgs >nul 2>&1"
  return $LASTEXITCODE
}

if (-not (Test-Path '.env.local')) { Fail 'Run this from the app folder (the one with .env.local in it).' }

# Read .env.local into a table without printing anything.
$envMap = @{}
Get-Content '.env.local' | ForEach-Object {
  if ($_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$') {
    $envMap[$Matches[1]] = $Matches[2].Trim('"').Trim("'")
  }
}

Write-Host '1/5  Checking your Vercel login...'
if ((Invoke-VercelQuiet 'whoami') -ne 0) {
  Write-Host '     Not logged in yet. A browser tab will open; approve it, then come back here.'
  & npx --yes $Vercel login
  if ($LASTEXITCODE -ne 0) { Fail 'Vercel login did not finish.' }
}
Write-Host '     Logged in.'

Write-Host '2/5  Creating the kindred-app project (skipped if it already exists)...'
[void](Invoke-VercelQuiet "project add $Project --scope $Scope")

Write-Host '3/5  Linking this folder to the project...'
& npx --yes $Vercel link --yes --project $Project --scope $Scope
if ($LASTEXITCODE -ne 0) { Fail 'Could not link this folder to the kindred-app project.' }

Write-Host '4/5  Copying settings to Vercel (values are not shown)...'
$vars = [ordered]@{
  'NEXT_PUBLIC_SUPABASE_URL'      = $envMap['NEXT_PUBLIC_SUPABASE_URL']
  'NEXT_PUBLIC_SUPABASE_ANON_KEY' = $envMap['NEXT_PUBLIC_SUPABASE_ANON_KEY']
  'SUPABASE_SERVICE_ROLE_KEY'     = $envMap['SUPABASE_SERVICE_ROLE_KEY']
  'NEXT_PUBLIC_APP_URL'           = 'https://kindred-app-ten.vercel.app'
  'NEXT_PUBLIC_NOINDEX'           = '1'
}
$tmp = [System.IO.Path]::GetTempFileName()
$errLog = [System.IO.Path]::GetTempFileName()
try {
  foreach ($name in $vars.Keys) {
    $value = $vars[$name]
    if (-not $value -or $value -match 'PASTE|YOUR_') { Fail "$name is missing from .env.local." }
    # Exact bytes, no trailing newline, so the value isn't altered. The value
    # goes in through a file, never on the command line or the screen.
    [System.IO.File]::WriteAllText($tmp, $value)
    foreach ($target in @('production', 'preview')) {
      cmd /c "npx --yes $Vercel env add $name --environment $target --force --yes --non-interactive --scope $Scope < `"$tmp`" >nul 2>`"$errLog`""
      if ($LASTEXITCODE -ne 0) {
        Get-Content $errLog | Select-String -NotMatch 'eyJ|sk_|whsec_' | Select-Object -Last 8 | ForEach-Object { Write-Host "     $_" }
        Fail "Could not save $name for $target."
      }
    }
    Write-Host "     set $name"
  }
} finally {
  Remove-Item $tmp, $errLog -ErrorAction SilentlyContinue
}

# Double-check: the names (not values) Vercel now has for production.
$listed = (cmd /c "npx --yes $Vercel env ls --environment production --scope $Scope 2>nul") -join "`n"
foreach ($name in $vars.Keys) {
  if ($listed -notmatch [regex]::Escape($name)) { Fail "Vercel still doesn't list $name for production." }
}
Write-Host '     Vercel confirms all 5 settings are saved.'

Write-Host '5/5  Building and deploying (a few minutes; lots of text is normal)...'
& npx --yes $Vercel deploy --prod --yes --scope $Scope
if ($LASTEXITCODE -ne 0) { Fail 'The deploy did not finish.' }

Write-Host ''
Write-Host 'Done. Open https://kindred-app-ten.vercel.app on your phone.' -ForegroundColor Green
