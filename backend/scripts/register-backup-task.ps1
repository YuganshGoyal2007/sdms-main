$ErrorActionPreference = 'Stop'

$TaskName = 'GBU-SDMS-Daily-Backup'
$Description = 'Daily backup of GBU-SDSM database and code (auto-deletes after 14 days)'
$ScriptPath = Join-Path $PSScriptRoot 'backup.js'
$NodePath = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
$WorkingDir = Resolve-Path (Join-Path $PSScriptRoot '..')

if (-not $NodePath) {
    Write-Error "node.exe not found in PATH. Install Node.js first."
    exit 1
}

if (-not (Test-Path $ScriptPath)) {
    Write-Error "backup.js not found at $ScriptPath"
    exit 1
}

$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $IsAdmin) {
    Write-Host "Not running as Administrator. Re-launching with elevation..." -ForegroundColor Yellow
    $Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    Start-Process -FilePath "powershell" -ArgumentList $Arguments -Verb RunAs -Wait
    exit $LASTEXITCODE
}

$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($ExistingTask) {
    Write-Host "Removing existing task '$TaskName'..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

$Action = New-ScheduledTaskAction `
    -Execute $NodePath `
    -Argument "`"$ScriptPath`"" `
    -WorkingDirectory $WorkingDir

$Trigger = New-ScheduledTaskTrigger `
    -Daily `
    -At '02:00'

$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5)

$Principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType S4U `
    -RunLevel Highest

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Principal $Principal `
    -Description $Description | Out-Null

Write-Host "Scheduled task '$TaskName' created successfully." -ForegroundColor Green
Write-Host "  Runs:    Daily at 02:00" -ForegroundColor Cyan
Write-Host "  Script:  $ScriptPath" -ForegroundColor Cyan
Write-Host "  WorkDir: $WorkingDir" -ForegroundColor Cyan
Write-Host "  Backup:  C:\backups\gbu-sdsm" -ForegroundColor Cyan
Write-Host "  Keeps:   14 days (auto-delete)" -ForegroundColor Cyan
Write-Host ""
Write-Host "To test now, run:  npm run backup" -ForegroundColor Yellow
Write-Host "To remove:         npm run backup:unregister" -ForegroundColor Yellow
Write-Host "To view in GUI:    taskschd.msc" -ForegroundColor Yellow
