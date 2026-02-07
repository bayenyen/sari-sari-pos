$ErrorActionPreference = 'Stop'
try {
    Write-Output 'Starting test sequence...'

    $adminCred = @{ username = 'brayney'; password = 'brayney2005' } | ConvertTo-Json
    $adminResp = Invoke-RestMethod -Uri http://localhost:5000/api/auth/login -Method Post -Body $adminCred -ContentType 'application/json'
    $adminToken = $adminResp.token
    Write-Output 'Admin login successful'

    $users = Invoke-RestMethod -Uri http://localhost:5000/api/users -Headers @{ Authorization = "Bearer $adminToken" }
    Write-Output "Existing users count: $($users.Count)"

    $now = [int](Get-Date -UFormat %s)
    $cashierUser = "cashier_test_$now"
    $customerUser = "cust_test_$now"

    Write-Output "Creating cashier: $cashierUser"
    $cashier = @{ username = $cashierUser; password = 'cash123'; role = 'CASHIER'; fullName = 'Cashier Test'; balance = 0; creditLimit = 1000 } | ConvertTo-Json
    $createdCashier = Invoke-RestMethod -Uri http://localhost:5000/api/users -Method Post -Body $cashier -ContentType 'application/json' -Headers @{ Authorization = "Bearer $adminToken" }
    Write-Output "Created cashier id: $($createdCashier._id)"

    Write-Output "Creating customer: $customerUser"
    $customer = @{ username = $customerUser; password = 'cust123'; role = 'CUSTOMER'; fullName = 'Customer Test'; balance = 0; creditLimit = 500 } | ConvertTo-Json
    $createdCust = Invoke-RestMethod -Uri http://localhost:5000/api/users -Method Post -Body $customer -ContentType 'application/json' -Headers @{ Authorization = "Bearer $adminToken" }
    Write-Output "Created customer id: $($createdCust._id)"

    Write-Output 'Logging in as cashier...'
    $cashierCred = @{ username = $cashierUser; password = 'cash123' } | ConvertTo-Json
    $cashierResp = Invoke-RestMethod -Uri http://localhost:5000/api/auth/login -Method Post -Body $cashierCred -ContentType 'application/json'
    $cashierToken = $cashierResp.token
    Write-Output 'Cashier login successful'

    Write-Output 'Calling adjust-balance as cashier...'
    $adjustBody = @{ customerId = $createdCust._id; amount = 120; note = 'Test debt by cashier' } | ConvertTo-Json
    $adjustResp = Invoke-RestMethod -Uri http://localhost:5000/api/transactions/adjust-balance -Method Post -Body $adjustBody -ContentType 'application/json' -Headers @{ Authorization = "Bearer $cashierToken" }
    Write-Output "Adjust-balance response: $($adjustResp.message)"
    Write-Output "New balance: $($adjustResp.newBalance)"

    Write-Output 'TEST SEQUENCE COMPLETED SUCCESSFULLY'
} catch {
    Write-Output 'ERROR:'
    if ($_.Exception.Response) {
        try {
            $status = $_.Exception.Response.StatusCode.Value__
            Write-Output "HTTP Status: $status"
            $content = $_.Exception.Response.Content.ReadAsStringAsync().Result
            Write-Output "Response content: $content"
        } catch {
            Write-Output $_.Exception.Message
        }
    } else {
        Write-Output $_.Exception.Message
    }
    exit 1
}