$ErrorActionPreference = 'Stop'
$TaskName = 'GBU-SDMS-Daily-Backup'

$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $ExistingTask) {
    Write-Host "Task '$TaskName' is not registered. Nothing to do." -ForegroundColor Yellow
    exit 0
}

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Host "Task '$TaskName' removed." -ForegroundColor Green
