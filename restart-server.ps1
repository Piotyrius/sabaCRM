# Script to restart the Next.js dev server
Write-Host "Stopping any running Next.js processes..."

# Find and kill node processes running Next.js
Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*next dev*" -or $_.Path -like "*next*"
} | ForEach-Object {
    Write-Host "Stopping process: $($_.Id)"
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# Wait a moment
Start-Sleep -Seconds 2

Write-Host "Starting dev server..."
Start-Process npm -ArgumentList "run","dev" -NoNewWindow

