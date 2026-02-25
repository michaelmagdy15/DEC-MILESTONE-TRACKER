$ENGINEER_ID = "518792e4-a01d-48ba-963a-8d02bec88605"
$SUPABASE_URL = "https://wvzfjhovumhwlrcawcwf.supabase.co"
$SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2emZqaG92dW1od2xyY2F3Y3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDM0MjIsImV4cCI6MjA4NzA3OTQyMn0.MbDtyyPPl3d_HQ7-qwYjYOFnSl6aS69GQCHhd6sjG-c"

$headers = @{
    "apikey" = $SUPABASE_KEY
    "Authorization" = "Bearer $SUPABASE_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

$now_iso = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$new_id = [guid]::NewGuid().ToString()

$payload = @{
    "id" = $new_id
    "engineer_id" = $ENGINEER_ID
    "entry_type" = "work"
    "start_time" = $now_iso
    "created_at" = $now_iso
}

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/time_entries" -Method Post -Headers $headers -Body ($payload | ConvertTo-Json)
    Write-Host "Success:`n" ($response | ConvertTo-Json)
} catch {
    Write-Host "Error:`n" $_.Exception.Response.Content.ReadAsStringAsync().Result
    Write-Host "Details:" $_
}
