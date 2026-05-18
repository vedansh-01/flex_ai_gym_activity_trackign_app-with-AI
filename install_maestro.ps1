$ProgressPreference = 'SilentlyContinue'
$maestroDir = "C:\maestro"
$zipPath = "$env:TEMP\maestro.zip"

Write-Host "Downloading Maestro CLI..."
Invoke-WebRequest -Uri "https://github.com/mobile-dev-inc/maestro/releases/download/cli-1.39.13/maestro.zip" -OutFile $zipPath -UseBasicParsing

if (Test-Path $zipPath) {
    $size = (Get-Item $zipPath).Length
    Write-Host "Downloaded: $size bytes"
    
    if ($size -gt 1000000) {
        Write-Host "Extracting to $maestroDir..."
        if (Test-Path $maestroDir) { Remove-Item $maestroDir -Recurse -Force }
        Expand-Archive -Path $zipPath -DestinationPath $maestroDir -Force
        
        # Find the bin directory
        $binDir = Get-ChildItem -Path $maestroDir -Recurse -Filter "maestro.bat" | Select-Object -First 1 -ExpandProperty DirectoryName
        if ($binDir) {
            Write-Host "Maestro bin found at: $binDir"
            # Add to user PATH
            $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
            if ($currentPath -notlike "*$binDir*") {
                [Environment]::SetEnvironmentVariable("Path", "$currentPath;$binDir", "User")
                Write-Host "Added to PATH"
            }
            # Test maestro
            & "$binDir\maestro.bat" --version
        } else {
            Write-Host "Listing extracted contents:"
            Get-ChildItem -Path $maestroDir -Recurse -Depth 2 | Select-Object FullName
        }
    } else {
        Write-Host "ERROR: File too small, download may have failed"
        Get-Content $zipPath -TotalCount 5
    }
} else {
    Write-Host "ERROR: Download failed"
}
