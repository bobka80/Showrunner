# Visual Host one-click launcher
# Starts node visual-host.js if needed, then opens http://127.0.0.1:4177
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Url = 'http://127.0.0.1:4177/'
$Port = 4177

function Test-VisualHost {
  try {
    $req = [System.Net.WebRequest]::Create($Url)
    $req.Timeout = 1500
    $resp = $req.GetResponse()
    $resp.Close()
    return $true
  } catch {
    return $false
  }
}

Set-Location $Root

if (-not (Test-VisualHost)) {
  Write-Host 'Starting Visual Host…'
  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) {
    Write-Host 'ERROR: node.exe not found on PATH. Install Node.js, then try again.'
    exit 1
  }
  Start-Process -FilePath $node.Source -ArgumentList 'visual-host.js' -WorkingDirectory $Root -WindowStyle Minimized
  $ok = $false
  for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 250
    if (Test-VisualHost) { $ok = $true; break }
  }
  if (-not $ok) {
    Write-Host "ERROR: Visual Host did not answer on port $Port."
    exit 1
  }
} else {
  Write-Host 'Visual Host already running.'
}

Write-Host "Opening $Url"
Start-Process $Url
