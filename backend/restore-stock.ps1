# Script to restore stock for already-cancelled orders
Write-Host "`n=== Stock Restoration Utility ===" -ForegroundColor Green

# Wait for backend to be ready
Write-Host "Waiting for backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    # Login as admin to get token
    Write-Host "Logging in as admin..." -ForegroundColor Cyan
    $loginBody = '{"email":"admin@shopez.com","password":"admin123"}'

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"

    $token = $loginResponse.token
    Write-Host "Login successful!" -ForegroundColor Green

    # Call the restore endpoint
    Write-Host "`nRestoring stock for cancelled orders..." -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }

    $restoreResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/orders/restore-cancelled-stock" -Method POST -Headers $headers

    # Display results
    Write-Host "`n=== Restoration Complete ===" -ForegroundColor Green
    $summary = $restoreResponse.summary
    Write-Host "Orders Processed: $($summary.ordersProcessed)" -ForegroundColor White
    Write-Host "Items Restored: $($summary.itemsRestored)" -ForegroundColor Cyan
    Write-Host "Items Skipped: $($summary.itemsSkipped)" -ForegroundColor Yellow

    Write-Host "`nStock restoration completed successfully!`n" -ForegroundColor Green

} catch {
    Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    Write-Host "Make sure backend is running on http://localhost:5000`n" -ForegroundColor Yellow
}
