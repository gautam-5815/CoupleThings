# Fills in the secrets in .env.local without them passing through a chat,
# a clipboard history or your shell's command history.
#
#   Run it from the project root:  & .\scripts\set-env.ps1
#
# Paste a value at each prompt and press Enter, or press Enter on its own to
# leave that one as it is. Nothing is echoed back and nothing is printed.

$ErrorActionPreference = 'Stop'

$envPath = Join-Path $PSScriptRoot '..\.env.local'
$envPath = [System.IO.Path]::GetFullPath($envPath)

if (-not (Test-Path $envPath)) {
    Write-Host "No .env.local found at $envPath" -ForegroundColor Red
    exit 1
}

function Read-Secret([string]$Prompt) {
    $secure = Read-Host -Prompt $Prompt -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr).Trim() }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

# Catches the commonest mistake: pasting the anon/publishable key, which looks
# almost identical but has no permissions behind it.
function Test-ServiceRole([string]$Key) {
    $parts = $Key.Split('.')
    if ($parts.Count -ne 3) { return $null }   # not a JWT, cannot tell
    $payload = $parts[1].Replace('-', '+').Replace('_', '/')
    switch ($payload.Length % 4) {
        2 { $payload += '==' }
        3 { $payload += '=' }
    }
    try {
        $json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload))
        if ($json -match '"role"\s*:\s*"service_role"') { return $true }
        if ($json -match '"role"\s*:\s*"anon"') { return $false }
        return $null
    } catch { return $null }
}

function Set-Key([string]$Name, [string]$Value) {
    $content = Get-Content $envPath -Raw
    $escaped = [regex]::Escape($Name)
    if ($content -match "(?m)^$escaped=.*$") {
        $content = [regex]::Replace($content, "(?m)^$escaped=.*$", "$Name=$Value")
    } else {
        $content = $content.TrimEnd() + "`n$Name=$Value`n"
    }
    Set-Content -Path $envPath -Value $content -Encoding utf8 -NoNewline
}

Write-Host ""
Write-Host "Writing to $envPath" -ForegroundColor Cyan
Write-Host "Press Enter on its own to leave a value unchanged." -ForegroundColor DarkGray
Write-Host ""

$service = Read-Secret 'Supabase service_role key'
if ($service) {
    $check = Test-ServiceRole $service
    if ($check -eq $false) {
        Write-Host "That is the anon key, not the service_role key. Nothing was written." -ForegroundColor Red
        Write-Host "Project Settings -> API Keys -> service_role (the secret one)." -ForegroundColor Yellow
        exit 1
    }
    if ($check -eq $true) { Write-Host "Looks like a service_role key." -ForegroundColor Green }
    else { Write-Host "Saved (could not inspect its type, which is normal for the newer sb_secret_ format)." -ForegroundColor DarkGray }
    Set-Key 'SUPABASE_SERVICE_ROLE_KEY' $service
}

$openai = Read-Secret 'OpenAI API key (optional, press Enter to skip)'
if ($openai) {
    if (-not $openai.StartsWith('sk-')) {
        Write-Host "That does not look like an OpenAI key. Skipped." -ForegroundColor Yellow
    } else {
        Set-Key 'OPENAI_API_KEY' $openai
        Write-Host "OpenAI key saved." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Done. Restart the dev server so it reads the new values." -ForegroundColor Cyan
Write-Host ""
