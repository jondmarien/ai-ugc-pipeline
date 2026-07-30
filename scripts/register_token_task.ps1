$action = New-ScheduledTaskAction -Execute "bun" `
  -Argument "scripts/refresh_token.ts" -WorkingDirectory "J:\projects\personal-projects\ai-ugc-pipeline"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddDays(1) `
  -RepetitionInterval (New-TimeSpan -Days 58)
Register-ScheduledTask -TaskName "ai-ugc-ig-token-refresh" -Action $action -Trigger $trigger `
  -Description "Check the Meta Page token is still alive every 58 days (Meta gives no refresh_token for Page tokens; a dead token needs a manual `bun run publish:auth meta`)."
Write-Host "Registered. Verify with: Get-ScheduledTask -TaskName ai-ugc-ig-token-refresh"
