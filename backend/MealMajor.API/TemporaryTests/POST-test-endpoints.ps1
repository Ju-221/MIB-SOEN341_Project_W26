## Use to test your endpoints quickly
# Test GET weatherforecast
Invoke-WebRequest -Uri "http://localhost:5168/weatherforecast" -Method Get

# Test GETs from public and private
Invoke-WebRequest -Uri "http://localhost:5168/Test/public" -Method Get
#Invoke-WebRequest -Uri "http://localhost:5168/Test/protected" -Method Get

# Test POST signup
$randomDigits = Get-Random -Minimum 1000 -Maximum 9999
$body = @{
    email = "test$randomDigits@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5168/auth/signup" `
    -Method Post `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body

# Test POST login
$body2 = @{
    email = "test$randomDigits@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5168/auth/login" `
    -Method Post `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body2

# Test GET user-table for consistency
Invoke-WebRequest -Uri "http://localhost:5168/stats/user-table-db" -Method Get

write-host "Tests completed."