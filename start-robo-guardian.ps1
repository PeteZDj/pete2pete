# Robo Client Auto-Restarter (PowerShell)
# Keeps Robo connected with infinite retry loop

$clientPath = "C:\Users\Administrator\.openclaw\workspace\petechat\robo-client-stable.js"
$restartCount = 0

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🤖 Robo WebSocket Client - Guardian" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

while ($true) {
    $restartCount++
    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] Starting Robo Client (attempt #$restartCount)..." -ForegroundColor Green
    
    try {
        $process = Start-Process -FilePath "node" -ArgumentList $clientPath -PassThru -Wait -WindowStyle Normal
        
        if ($process.ExitCode -eq 0) {
            Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] Client exited normally" -ForegroundColor Yellow
        } else {
            Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] Client crashed with code: $($process.ExitCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] Error: $_" -ForegroundColor Red
    }
    
    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] Restarting in 3 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}
