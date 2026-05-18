# Automation script to configure Android SDK components and set up the Emulator.
# Optimized for high-performance i7 13th Gen + RTX hardware.

$ErrorActionPreference = "Stop"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "   FLEXAI AUTOMATED ANDROID EMULATOR SETUP   " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1. Verify Android Studio Installation
$sdkPath = "$env:USERPROFILE\AppData\Local\Android\Sdk"
if (-not (Test-Path $sdkPath)) {
    New-Item -ItemType Directory -Force -Path $sdkPath | Out-Null
}

# 2. Configure Environment Variables
Write-Host "[1/4] Configuring Android SDK environment..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkPath, "User")
$env:ANDROID_HOME = $sdkPath

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$sdkPaths = @(
    "$sdkPath\platform-tools",
    "$sdkPath\emulator",
    "$sdkPath\cmdline-tools\latest\bin",
    "$sdkPath\tools\bin"
)

foreach ($path in $sdkPaths) {
    if ($userPath -notlike "*$path*") {
        $userPath = "$userPath;$path"
        Write-Host "  Adding to PATH: $path" -ForegroundColor Gray
    }
}
[Environment]::SetEnvironmentVariable("Path", $userPath, "User")
$env:Path = "$env:Path;" + ($sdkPaths -join ";")
Write-Host "[OK] Environment variables configured successfully!" -ForegroundColor Green

# 3. Setup Command Line Tools & Platform-Tools
Write-Host "[2/4] Verifying Android SDK command-line tools..." -ForegroundColor Yellow

$cmdlineToolsDir = "$sdkPath\cmdline-tools"
if (-not (Test-Path "$cmdlineToolsDir\latest\bin\sdkmanager.bat")) {
    Write-Host "  Downloading Android SDK command-line tools..." -ForegroundColor Gray
    $cmdlineZipUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    $cmdlineZipPath = "$env:TEMP\cmdline-tools.zip"
    
    Start-BitsTransfer -Source $cmdlineZipUrl -Destination $cmdlineZipPath
    
    Write-Host "  Extracting command-line tools..." -ForegroundColor Gray
    Expand-Archive -Path $cmdlineZipPath -DestinationPath "$cmdlineToolsDir\temp" -Force
    
    if (-not (Test-Path "$cmdlineToolsDir\latest")) {
        New-Item -ItemType Directory -Path "$cmdlineToolsDir\latest" -Force | Out-Null
    }
    Move-Item -Path "$cmdlineToolsDir\temp\cmdline-tools\*" -Destination "$cmdlineToolsDir\latest" -Force
    Remove-Item -Path "$cmdlineToolsDir\temp" -Recurse -Force
    Remove-Item -Path $cmdlineZipPath -Force
}
Write-Host "[OK] Command-line tools verified!" -ForegroundColor Green

# 4. Install platform-tools, emulator, and modern system-image via sdkmanager
Write-Host "[3/4] Installing platform-tools, emulator, and Android 34 System Image..." -ForegroundColor Yellow
$sdkManager = "$sdkPath\cmdline-tools\latest\bin\sdkmanager.bat"
$javaPath = "C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"
$env:JAVA_HOME = $javaPath

# Accept licenses silently
Write-Host "  Accepting Android SDK licenses..." -ForegroundColor Gray
cmd.exe /c "echo y | `"$sdkManager`" --licenses"

# Install packages
Write-Host "  Installing platform-tools, emulator, and Android 34 System Image (will download ~200-300MB)..." -ForegroundColor Gray
cmd.exe /c "`"$sdkManager`" `"platform-tools`" `"emulator`" `"system-images;android-34;google_apis;x86_64`""
Write-Host "[OK] SDK packages and modern System Image installed successfully!" -ForegroundColor Green

# 5. Create Android Virtual Device (AVD)
Write-Host "[4/4] Creating Virtual Device (AVD)..." -ForegroundColor Yellow
$avdManager = "$sdkPath\cmdline-tools\latest\bin\avdmanager.bat"
# Create AVD named 'FlexAI_Emulator' using device type 'pixel'
cmd.exe /c "echo no | `"$avdManager`" create avd -n FlexAI_Emulator -k `"system-images;android-34;google_apis;x86_64`" --device `"pixel`" -f"
Write-Host "[OK] Virtual Device 'FlexAI_Emulator' created successfully!" -ForegroundColor Green

# 6. Launch Emulator
Write-Host "🎉 Launching AVD 'FlexAI_Emulator' in hardware accelerated mode..." -ForegroundColor Green
$emulatorPath = "$sdkPath\emulator\emulator.exe"
Start-Process -FilePath $emulatorPath -ArgumentList "-avd FlexAI_Emulator -gpu host -no-snapshot-load" -NoNewWindow
Write-Host "🎉 Android Emulator is booting up! Please wait for the screen to load." -ForegroundColor Cyan
