$pids = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue
if ($pids) {
    foreach ($procId in $pids) {
        Write-Output "Killing PID $procId";
        try {
            Stop-Process -Id $procId -Force -ErrorAction Stop;
            Write-Output "Killed $procId";
        } catch {
            Write-Output "Failed to kill $procId";
        }
    }
} else {
    Write-Output "No PIDs to kill";
}
