# ==============================================================================
# Enterprise Attendance System - Multi-Cycle cURL API Verification Suite (10 Iterations)
# ==============================================================================

$baseUrl = "https://inner-eye-attendance-system.onrender.com"
$iterations = 10

Write-Host "`n==============================================================================" -ForegroundColor Cyan
Write-Host "  LAUNCHING 10-CYCLE cURL STRESS & FUNCTIONAL TEST SUITE" -ForegroundColor Cyan
Write-Host "  Target Host: $baseUrl" -ForegroundColor Cyan
Write-Host "  Iterations per API: $iterations" -ForegroundColor Cyan
Write-Host "==============================================================================`n" -ForegroundColor Cyan

# Structure to hold metrics
$metrics = @{}

function Record-Metric($endpointName, $statusCode, $durationMs, $isSuccess) {
    if (-not $metrics.ContainsKey($endpointName)) {
        $metrics[$endpointName] = @{
            SuccessCount = 0
            FailureCount = 0
            TotalDuration = 0
            MinDuration = 999999
            MaxDuration = 0
            StatusCodes = @{}
        }
    }
    
    $entry = $metrics[$endpointName]
    if ($isSuccess) {
        $entry.SuccessCount++
    } else {
        $entry.FailureCount++
    }
    
    $entry.TotalDuration += $durationMs
    if ($durationMs -lt $entry.MinDuration) { $entry.MinDuration = $durationMs }
    if ($durationMs -gt $entry.MaxDuration) { $entry.MaxDuration = $durationMs }
    
    $codeStr = [string]$statusCode
    if (-not $entry.StatusCodes.ContainsKey($codeStr)) {
        $entry.StatusCodes[$codeStr] = 0
    }
    $entry.StatusCodes[$codeStr]++
}

# Run 10 Iterations
for ($i = 1; $i -le $iterations; $i++) {
    Write-Host ">>> Executing Iteration $i of $iterations..." -ForegroundColor Yellow

    # 1. Health Check
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $httpCode = curl.exe -s -o /dev/null -w "%{http_code}" "$baseUrl/api/health"
    $sw.Stop()
    Record-Metric "1. GET /api/health" $httpCode $sw.ElapsedMilliseconds ($httpCode -eq "200")

    # 2. Employee Login
    $empPayload = '{"usernameOrEmail":"aarav.sharma@company.local","password":"EmployeePass123!"}'
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $empResp = curl.exe -s -w "\n%{http_code}" -X POST "$baseUrl/api/auth/login" `
        -H "Content-Type: application/json" `
        -d $empPayload
    $sw.Stop()
    
    $empLines = $empResp -split "`n"
    $empCode = $empLines[-1].Trim()
    $empBody = ($empLines[0..($empLines.Length-2)]) -join "`n"
    $empJson = $empBody | ConvertFrom-Json -ErrorAction SilentlyContinue
    $empToken = $empJson.data.accessToken
    Record-Metric "2. POST /api/auth/login (Employee)" $empCode $sw.ElapsedMilliseconds ($empCode -eq "200")

    # 3. Employee /auth/me
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $httpCode = curl.exe -s -o /dev/null -w "%{http_code}" "$baseUrl/api/auth/me" `
        -H "Authorization: Bearer $empToken"
    $sw.Stop()
    Record-Metric "3. GET /api/auth/me (Employee)" $httpCode $sw.ElapsedMilliseconds ($httpCode -eq "200")

    # 4. Employee Dashboard
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $httpCode = curl.exe -s -o /dev/null -w "%{http_code}" "$baseUrl/api/me/dashboard" `
        -H "Authorization: Bearer $empToken"
    $sw.Stop()
    Record-Metric "4. GET /api/me/dashboard" $httpCode $sw.ElapsedMilliseconds ($httpCode -eq "200")

    # 5. Employee Attendance History
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $httpCode = curl.exe -s -o /dev/null -w "%{http_code}" "$baseUrl/api/me/attendance" `
        -H "Authorization: Bearer $empToken"
    $sw.Stop()
    Record-Metric "5. GET /api/me/attendance" $httpCode $sw.ElapsedMilliseconds ($httpCode -eq "200")

    # 6. Employee Leave Quotas
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $httpCode = curl.exe -s -o /dev/null -w "%{http_code}" "$baseUrl/api/me/leave" `
        -H "Authorization: Bearer $empToken"
    $sw.Stop()
    Record-Metric "6. GET /api/me/leave" $httpCode $sw.ElapsedMilliseconds ($httpCode -eq "200")

    # 7. Employee Exceptions
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $httpCode = curl.exe -s -o /dev/null -w "%{http_code}" "$baseUrl/api/me/exceptions" `
        -H "Authorization: Bearer $empToken"
    $sw.Stop()
    Record-Metric "7. GET /api/me/exceptions" $httpCode $sw.ElapsedMilliseconds ($httpCode -eq "200")

    # 8. HR Admin Login
    $hrPayload = '{"usernameOrEmail":"hr.admin@company.local","password":"AdminSecurePass123!"}'
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $hrResp = curl.exe -s -w "\n%{http_code}" -X POST "$baseUrl/api/auth/login" `
        -H "Content-Type: application/json" `
        -d $hrPayload
    $sw.Stop()
    
    $hrLines = $hrResp -split "`n"
    $hrCode = $hrLines[-1].Trim()
    $hrBody = ($hrLines[0..($hrLines.Length-2)]) -join "`n"
    $hrJson = $hrBody | ConvertFrom-Json -ErrorAction SilentlyContinue
    $hrToken = $hrJson.data.accessToken
    Record-Metric "8. POST /api/auth/login (HR Admin)" $hrCode $sw.ElapsedMilliseconds ($hrCode -eq "200")

    # 9. HR Dashboard
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $httpCode = curl.exe -s -o /dev/null -w "%{http_code}" "$baseUrl/api/hr/dashboard" `
        -H "Authorization: Bearer $hrToken"
    $sw.Stop()
    Record-Metric "9. GET /api/hr/dashboard" $httpCode $sw.ElapsedMilliseconds ($httpCode -eq "200")

    # 10. HR Employee Directory
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $httpCode = curl.exe -s -o /dev/null -w "%{http_code}" "$baseUrl/api/hr/employees" `
        -H "Authorization: Bearer $hrToken"
    $sw.Stop()
    Record-Metric "10. GET /api/hr/employees" $httpCode $sw.ElapsedMilliseconds ($httpCode -eq "200")

    # 11. HR Organization Attendance
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $httpCode = curl.exe -s -o /dev/null -w "%{http_code}" "$baseUrl/api/hr/attendance" `
        -H "Authorization: Bearer $hrToken"
    $sw.Stop()
    Record-Metric "11. GET /api/hr/attendance" $httpCode $sw.ElapsedMilliseconds ($httpCode -eq "200")

    # 12. HR Leave Approval Queue
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $httpCode = curl.exe -s -o /dev/null -w "%{http_code}" "$baseUrl/api/hr/leave" `
        -H "Authorization: Bearer $hrToken"
    $sw.Stop()
    Record-Metric "12. GET /api/hr/leave" $httpCode $sw.ElapsedMilliseconds ($httpCode -eq "200")

    # 13. HR Exceptions Review Queue
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $httpCode = curl.exe -s -o /dev/null -w "%{http_code}" "$baseUrl/api/hr/exceptions" `
        -H "Authorization: Bearer $hrToken"
    $sw.Stop()
    Record-Metric "13. GET /api/hr/exceptions" $httpCode $sw.ElapsedMilliseconds ($httpCode -eq "200")

    # 14. HR Compliance Audit Logs
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $httpCode = curl.exe -s -o /dev/null -w "%{http_code}" "$baseUrl/api/hr/audit" `
        -H "Authorization: Bearer $hrToken"
    $sw.Stop()
    Record-Metric "14. GET /api/hr/audit" $httpCode $sw.ElapsedMilliseconds ($httpCode -eq "200")

    # 15. HR Redis Cache Flush
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $httpCode = curl.exe -s -o /dev/null -w "%{http_code}" -X POST "$baseUrl/api/hr/cache/clear" `
        -H "Authorization: Bearer $hrToken"
    $sw.Stop()
    Record-Metric "15. POST /api/hr/cache/clear" $httpCode $sw.ElapsedMilliseconds ($httpCode -eq "200")

    # 16. LangGraph Policy RAG Assistant (Groq LLM)
    $aiPayload = '{"question":"What is the policy regarding tardiness beyond 15 minutes?"}'
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $httpCode = curl.exe -s -o /dev/null -w "%{http_code}" -X POST "$baseUrl/api/ai/employee-assistant" `
        -H "Authorization: Bearer $empToken" `
        -H "Content-Type: application/json" `
        -d $aiPayload
    $sw.Stop()
    Record-Metric "16. POST /api/ai/employee-assistant" $httpCode $sw.ElapsedMilliseconds ($httpCode -eq "200")

    Start-Sleep -Milliseconds 150
}

Write-Host "`n==============================================================================" -ForegroundColor Green
Write-Host "  10-CYCLE cURL COMPREHENSIVE TEST RESULTS SUMMARY" -ForegroundColor Green
Write-Host "==============================================================================`n" -ForegroundColor Green

$keys = $metrics.Keys | Sort-Object

$totalCalls = 0
$totalPass = 0
$totalFail = 0

foreach ($k in $keys) {
    $m = $metrics[$k]
    $total = $m.SuccessCount + $m.FailureCount
    $avg = [math]::Round($m.TotalDuration / $total, 1)
    $passRate = [math]::Round(($m.SuccessCount / $total) * 100, 1)
    
    $totalCalls += $total
    $totalPass += $m.SuccessCount
    $totalFail += $m.FailureCount
    
    $statusColor = if ($m.FailureCount -eq 0) { "Green" } else { "Red" }
    Write-Host ("{0,-38} | {1,2}/{2,2} Passed ({3,5}%) | Avg: {4,6}ms (Min: {5,4}ms, Max: {6,4}ms)" -f $k, $m.SuccessCount, $total, $passRate, $avg, $m.MinDuration, $m.MaxDuration) -ForegroundColor $statusColor
}

Write-Host "`n------------------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host ("Total cURL Invocations: {0} | Passed: {1} | Failed: {2} | Success Rate: {3}%" -f $totalCalls, $totalPass, $totalFail, ([math]::Round(($totalPass/$totalCalls)*100, 1))) -ForegroundColor Cyan
Write-Host "------------------------------------------------------------------------------`n" -ForegroundColor Cyan
