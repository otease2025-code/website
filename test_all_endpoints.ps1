# OTES API Testing Script
# Run this once to test all endpoints

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OTES Trauma Management System - API Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:8000"
$testResults = @()

function Test-Endpoint {
    param($Name, $Method, $Url, $Body)
    try {
        if ($Body) {
            $bodyJson = $Body | ConvertTo-Json
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Body $bodyJson -ContentType "application/json" -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -ErrorAction Stop
        }
        Write-Host "[PASS] $Name" -ForegroundColor Green
        return @{Name=$Name; Status="PASS"; Response=$response}
    } catch {
        Write-Host "[FAIL] $Name - $($_.Exception.Message)" -ForegroundColor Red
        return @{Name=$Name; Status="FAIL"; Error=$_.Exception.Message}
    }
}

# 1. Test API Root
Write-Host "`n--- Testing API Root ---" -ForegroundColor Yellow
Test-Endpoint -Name "API Root" -Method "GET" -Url "$baseUrl/"

# 2. Test Therapist Registration
Write-Host "`n--- Testing Authentication ---" -ForegroundColor Yellow
$therapistData = @{
    email = "test.therapist2@otes.com"
    password = "Test1234!"
    role = "THERAPIST"
    name = "Dr. Test Therapist"
    specialization = "Trauma Therapy"
    license_number = "LIC-12345"
}
$regResult = Test-Endpoint -Name "Therapist Registration" -Method "POST" -Url "$baseUrl/api/auth/register" -Body $therapistData

# 3. Test Therapist Login
$loginData = @{email = "test.therapist2@otes.com"; password = "Test1234!"}
$loginResponse = $null
try {
    $loginBody = $loginData | ConvertTo-Json
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "[PASS] Therapist Login" -ForegroundColor Green
    $therapistId = $loginResponse.user.id
    Write-Host "       Therapist ID: $therapistId" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Therapist Login - $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Test Linkage Code Generation
Write-Host "`n--- Testing Therapist Features ---" -ForegroundColor Yellow
$linkageCode = $null
if ($therapistId) {
    try {
        $linkageResponse = Invoke-RestMethod -Uri "$baseUrl/api/therapist/linkage-code?therapist_id=$therapistId" -Method POST -ContentType "application/json"
        Write-Host "[PASS] Generate Linkage Code" -ForegroundColor Green
        $linkageCode = $linkageResponse.code
        Write-Host "       Code: $linkageCode (expires: $($linkageResponse.expires_at))" -ForegroundColor Gray
    } catch {
        Write-Host "[FAIL] Generate Linkage Code - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 5. Test Patient Registration with Linkage Code
Write-Host "`n--- Testing Patient Registration ---" -ForegroundColor Yellow
$patientId = $null
if ($linkageCode) {
    $patientData = @{
        email = "test.patient2@otes.com"
        password = "Test1234!"
        role = "PATIENT"
        name = "Test Patient"
        linkage_code = $linkageCode
    }
    try {
        $patientBody = $patientData | ConvertTo-Json
        $patientReg = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body $patientBody -ContentType "application/json"
        Write-Host "[PASS] Patient Registration with Linkage Code" -ForegroundColor Green
        
        # Login as patient to get ID
        $patientLoginBody = @{email = "test.patient2@otes.com"; password = "Test1234!"} | ConvertTo-Json
        $patientLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $patientLoginBody -ContentType "application/json"
        $patientId = $patientLogin.user.id
        Write-Host "       Patient ID: $patientId" -ForegroundColor Gray
    } catch {
        Write-Host "[FAIL] Patient Registration - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 6. Test Caregiver Registration with Same Linkage Code  
Write-Host "`n--- Testing Caregiver Registration ---" -ForegroundColor Yellow
$caregiverId = $null
if ($linkageCode) {
    $caregiverData = @{
        email = "test.caregiver2@otes.com"
        password = "Test1234!"
        role = "CAREGIVER"
        name = "Test Caregiver"
        linkage_code = $linkageCode
    }
    try {
        $caregiverBody = $caregiverData | ConvertTo-Json
        $caregiverReg = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body $caregiverBody -ContentType "application/json"
        Write-Host "[PASS] Caregiver Registration with Linkage Code" -ForegroundColor Green
        
        # Login as caregiver to get ID
        $caregiverLoginBody = @{email = "test.caregiver2@otes.com"; password = "Test1234!"} | ConvertTo-Json
        $caregiverLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $caregiverLoginBody -ContentType "application/json"
        $caregiverId = $caregiverLogin.user.id
        Write-Host "       Caregiver ID: $caregiverId" -ForegroundColor Gray
    } catch {
        Write-Host "[FAIL] Caregiver Registration - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 7. Test Get Patients List (Therapist)
Write-Host "`n--- Testing Therapist Patient Management ---" -ForegroundColor Yellow
if ($therapistId) {
    try {
        $patients = Invoke-RestMethod -Uri "$baseUrl/api/therapist/patients?therapist_id=$therapistId" -Method GET
        Write-Host "[PASS] Get Patients List" -ForegroundColor Green
        Write-Host "       Found $($patients.Count) patient(s)" -ForegroundColor Gray
    } catch {
        Write-Host "[FAIL] Get Patients List - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 8. Test Task Assignment
Write-Host "`n--- Testing Task Assignment ---" -ForegroundColor Yellow
$taskId = $null
if ($therapistId -and $patientId) {
    $taskData = @{
        title = "Morning ADL Routine"
        description = "Complete morning self-care activities"
        patient_id = $patientId
        day_of_week = "Monday"
        start_time = "08:00"
        end_time = "09:00"
    }
    try {
        $taskBody = $taskData | ConvertTo-Json
        $taskResult = Invoke-RestMethod -Uri "$baseUrl/api/therapist/tasks?therapist_id=$therapistId" -Method POST -Body $taskBody -ContentType "application/json"
        Write-Host "[PASS] Assign Task to Patient" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] Assign Task - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 9. Test Get Patient Tasks
Write-Host "`n--- Testing Patient Features ---" -ForegroundColor Yellow
if ($patientId) {
    try {
        $tasks = Invoke-RestMethod -Uri "$baseUrl/api/patient/tasks?user_id=$patientId" -Method GET
        Write-Host "[PASS] Get Patient Tasks" -ForegroundColor Green
        Write-Host "       Found $($tasks.Count) task(s)" -ForegroundColor Gray
        if ($tasks.Count -gt 0) {
            $taskId = $tasks[0].id
        }
    } catch {
        Write-Host "[FAIL] Get Patient Tasks - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 10. Test Complete Task
if ($taskId) {
    try {
        $completeResult = Invoke-RestMethod -Uri "$baseUrl/api/patient/tasks/$($taskId)?is_completed=true" -Method PUT
        Write-Host "[PASS] Mark Task Complete" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] Mark Task Complete - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 11. Test Mood Submission
if ($patientId) {
    $moodData = @{
        mood_score = 4
        primary_emotion = "Happy"
        secondary_emotion = "Content"
        journal_text = "Feeling good today"
    }
    try {
        $moodBody = $moodData | ConvertTo-Json
        $moodResult = Invoke-RestMethod -Uri "$baseUrl/api/patient/mood?user_id=$patientId" -Method POST -Body $moodBody -ContentType "application/json"
        Write-Host "[PASS] Submit Mood Entry" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] Submit Mood Entry - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 12. Test Get Mood History
if ($patientId) {
    try {
        $moodHistory = Invoke-RestMethod -Uri "$baseUrl/api/patient/mood/history?user_id=$patientId" -Method GET
        Write-Host "[PASS] Get Mood History" -ForegroundColor Green
        Write-Host "       Found $($moodHistory.Count) mood entries" -ForegroundColor Gray
    } catch {
        Write-Host "[FAIL] Get Mood History - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 13. Test Caregiver Dashboard Stats
Write-Host "`n--- Testing Caregiver Features ---" -ForegroundColor Yellow
if ($caregiverId) {
    try {
        $stats = Invoke-RestMethod -Uri "$baseUrl/api/caregiver/dashboard-stats?caregiver_id=$caregiverId" -Method GET
        Write-Host "[PASS] Get Caregiver Dashboard Stats" -ForegroundColor Green
        Write-Host "       Stats: Patients=$($stats.stats[0].value), Completed=$($stats.stats[1].value), Pending=$($stats.stats[2].value)" -ForegroundColor Gray
    } catch {
        Write-Host "[FAIL] Get Caregiver Dashboard Stats - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 14. Test Task Verification
if ($taskId) {
    $verifyData = @{
        task_id = $taskId
        verified = $true
    }
    try {
        $verifyBody = $verifyData | ConvertTo-Json
        $verifyResult = Invoke-RestMethod -Uri "$baseUrl/api/caregiver/verify-task" -Method POST -Body $verifyBody -ContentType "application/json"
        Write-Host "[PASS] Verify Task (Caregiver)" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] Verify Task - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 15. Test Billing
Write-Host "`n--- Testing Billing ---" -ForegroundColor Yellow
if ($therapistId -and $patientId) {
    try {
        $billingResult = Invoke-RestMethod -Uri "$baseUrl/api/therapist/billing/confirm?therapist_id=$therapistId&patient_id=$patientId&amount=150.00" -Method POST -ContentType "application/json"
        Write-Host "[PASS] Confirm Billing" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] Confirm Billing - $($_.Exception.Message)" -ForegroundColor Red
    }
}

if ($patientId) {
    try {
        $billing = Invoke-RestMethod -Uri "$baseUrl/api/patient/billing?user_id=$patientId" -Method GET
        Write-Host "[PASS] Get Patient Billing" -ForegroundColor Green
        Write-Host "       Amount: $($billing.amount), Status: $($billing.status)" -ForegroundColor Gray
    } catch {
        Write-Host "[FAIL] Get Patient Billing - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 16. Test Appointments
Write-Host "`n--- Testing Appointments ---" -ForegroundColor Yellow
if ($therapistId -and $patientId) {
    $apptData = @{
        patient_id = $patientId
        datetime = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss")
        is_recurring = $false
    }
    try {
        $apptBody = $apptData | ConvertTo-Json
        $apptResult = Invoke-RestMethod -Uri "$baseUrl/api/therapist/appointments?therapist_id=$therapistId" -Method POST -Body $apptBody -ContentType "application/json"
        Write-Host "[PASS] Create Appointment" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] Create Appointment - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nTest Users Created:" -ForegroundColor Yellow
Write-Host "  Therapist: test.therapist2@otes.com / Test1234!" -ForegroundColor Gray
Write-Host "  Patient:   test.patient2@otes.com / Test1234!" -ForegroundColor Gray
Write-Host "  Caregiver: test.caregiver2@otes.com / Test1234!" -ForegroundColor Gray
