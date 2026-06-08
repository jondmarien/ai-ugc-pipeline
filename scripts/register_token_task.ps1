$action = New-ScheduledTaskAction -Execute "bun" `
  -Argument "scripts/refresh_token.ts" -WorkingDirectory "J:\projects\personal-projects\ai-ugc-pipeline"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddDays(1) `
  -RepetitionInterval (New-TimeSpan -Days 58)
Register-ScheduledTask -TaskName "ai-ugc-ig-token-refresh" -Action $action -Trigger $trigger `
  -Description "Refresh the 60-day IG long-lived token every 58 days."
Write-Host "Registered. Verify with: Get-ScheduledTask -TaskName ai-ugc-ig-token-refresh"
