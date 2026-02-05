## Use to test your endpoints quickly

# Test GET weatherforecast
Invoke-WebRequest -Uri "http://localhost:5168/weatherforecast" -Method Get

# Test GETs from public and private
Invoke-WebRequest -Uri "http://localhost:5168/Test/public" -Method Get

# Test POST signup
$randomDigits = Get-Random -Minimum 1000 -Maximum 9999
$body = @{
    email = "test$randomDigits@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

$signupResponse = Invoke-WebRequest -Uri "http://localhost:5168/auth/signup" `
    -Method Post `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body

# Extract the token from signup response
$signupData = $signupResponse.Content | ConvertFrom-Json
$token = $signupData.token

Write-Host "Token from signup: $token"

# Test POST login
$body2 = @{
    email = "test$randomDigits@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:5168/auth/login" `
    -Method Post `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body2

# Extract token from login response
$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.token

Write-Host "Token from login: $token"

# Test GET user-table for consistency
Invoke-WebRequest -Uri "http://localhost:5168/stats/user-table-db" `
    -Method Get `
    -Headers @{"Authorization"="Bearer $token"}

# Test protected endpoint with the invalid token to test authentication
Invoke-WebRequest -Uri "http://localhost:5168/Test/protected" `
    -Method Get `
    -Headers @{"Authorization"="Bearer empty_or_invalid_token"}



write-host "Tests completed."