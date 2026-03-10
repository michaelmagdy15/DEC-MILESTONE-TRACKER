@echo off
setlocal
echo ===================================
echo DEC Desktop Tracker Auto-Update Setup
echo ===================================

:: Ensure running in the correct directory
cd /d "%~dp0"

echo This script will configure your PC to automatically download the
echo latest tracker code on every boot, compile it, and run it invisibly.
echo.

echo Fetching engineers from system...
set PS_SCRIPT="%TEMP%\fetch_eng.ps1"
echo $url = "https://wvzfjhovumhwlrcawcwf.supabase.co/rest/v1/engineers?select=id,name" > %PS_SCRIPT%
echo $headers = @{ >> %PS_SCRIPT%
echo     "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2emZqaG92dW1od2xyY2F3Y3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDM0MjIsImV4cCI6MjA4NzA3OTQyMn0.MbDtyyPPl3d_HQ7-qwYjYOFnSl6aS69GQCHhd6sjG-c" >> %PS_SCRIPT%
echo     "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2emZqaG92dW1od2xyY2F3Y3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDM0MjIsImV4cCI6MjA4NzA3OTQyMn0.MbDtyyPPl3d_HQ7-qwYjYOFnSl6aS69GQCHhd6sjG-c" >> %PS_SCRIPT%
echo } >> %PS_SCRIPT%
echo [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 >> %PS_SCRIPT%
echo try { $response = Invoke-RestMethod -Uri $url -Headers $headers -ErrorAction Stop } catch { exit 1 } >> %PS_SCRIPT%
echo Write-Host "" >> %PS_SCRIPT%
echo Write-Host "=== Select Your Name ===" -ForegroundColor Cyan >> %PS_SCRIPT%
echo for ($i=0; $i -lt $response.Length; $i++) { >> %PS_SCRIPT%
echo     Write-Host " [$($i+1)] $($response[$i].name)" >> %PS_SCRIPT%
echo } >> %PS_SCRIPT%
echo Write-Host "========================" -ForegroundColor Cyan >> %PS_SCRIPT%
echo $choice = Read-Host "Type the number next to your name" >> %PS_SCRIPT%
echo $index = [int]$choice - 1 >> %PS_SCRIPT%
echo if ($index -ge 0 -and $index -lt $response.Length) { >> %PS_SCRIPT%
echo     [System.IO.File]::WriteAllText("$env:TEMP\my_eng_id.txt", $response[$index].id) >> %PS_SCRIPT%
echo } else { >> %PS_SCRIPT%
echo     Write-Host "Invalid Selection." -ForegroundColor Red >> %PS_SCRIPT%
echo     exit 1 >> %PS_SCRIPT%
echo } >> %PS_SCRIPT%

powershell -ExecutionPolicy Bypass -File %PS_SCRIPT%
del %PS_SCRIPT%

if not exist "%TEMP%\my_eng_id.txt" (
    echo Error: Engineer selection failed. Please try again.
    pause
    exit /b 1
)

set /p ENGINEER_ID=<"%TEMP%\my_eng_id.txt"
del "%TEMP%\my_eng_id.txt"
echo.
echo Setup for Engineer ID: %ENGINEER_ID%

set TRACKER_DIR=%APPDATA%\DecTracker
if not exist "%TRACKER_DIR%" mkdir "%TRACKER_DIR%"

echo.
echo Stopping any running instances...
taskkill /f /im tracker.exe >nul 2>&1
taskkill /f /im WindowsSystemHost.exe >nul 2>&1
taskkill /f /im dec_updater.bat >nul 2>&1

echo Generating persistant config.cs...
echo namespace DecTracker { > "%TRACKER_DIR%\config.cs"
echo     public static class Config { >> "%TRACKER_DIR%\config.cs"
echo         public static string ENGINEER_ID = "%ENGINEER_ID%"; >> "%TRACKER_DIR%\config.cs"
echo         public static string SUPABASE_URL = "https://wvzfjhovumhwlrcawcwf.supabase.co"; >> "%TRACKER_DIR%\config.cs"
echo         public static string SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2emZqaG92dW1od2xyY2F3Y3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDM0MjIsImV4cCI6MjA4NzA3OTQyMn0.MbDtyyPPl3d_HQ7-qwYjYOFnSl6aS69GQCHhd6sjG-c"; >> "%TRACKER_DIR%\config.cs"
echo     } >> "%TRACKER_DIR%\config.cs"
echo } >> "%TRACKER_DIR%\config.cs"

echo Creating Updater script (dec_updater.bat)...
echo @echo off > "%TRACKER_DIR%\dec_updater.bat"
echo cd /d "%%~dp0" >> "%TRACKER_DIR%\dec_updater.bat"
echo echo Fetching latest tracker.cs from GitHub... >> "%TRACKER_DIR%\dec_updater.bat"
echo powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/michaelmagdy15/DEC-MILESTONE-TRACKER/main/desktop-tracker/tracker.cs' -OutFile 'tracker.cs'" >> "%TRACKER_DIR%\dec_updater.bat"
echo if not exist "tracker.cs" exit /b 1 >> "%TRACKER_DIR%\dec_updater.bat"
echo :: Find C# Compiler >> "%TRACKER_DIR%\dec_updater.bat"
echo set CSC="C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" >> "%TRACKER_DIR%\dec_updater.bat"
echo if not exist %%CSC%% set CSC="C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe" >> "%TRACKER_DIR%\dec_updater.bat"
echo taskkill /f /im WindowsSystemHost.exe ^>nul 2^>^&1 >> "%TRACKER_DIR%\dec_updater.bat"
echo %%CSC%% /nologo /target:winexe /out:WindowsSystemHost.exe tracker.cs config.cs >> "%TRACKER_DIR%\dec_updater.bat"
echo if exist "WindowsSystemHost.exe" start "" "WindowsSystemHost.exe" >> "%TRACKER_DIR%\dec_updater.bat"

echo Creating invisible bootstrapper (WindowsSystemHost.vbs)...
set STARTUP_VBS="%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\WindowsSystemHost.vbs"
echo Set WshShell = CreateObject("WScript.Shell") > %STARTUP_VBS%
echo WshShell.Run chr(34) ^& "%TRACKER_DIR%\dec_updater.bat" ^& Chr(34), 0 >> %STARTUP_VBS%
echo Set WshShell = Nothing >> %STARTUP_VBS%

:: Clean up old literal EXE bootstrapper if it exists
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\WindowsSystemHost.exe" (
    del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\WindowsSystemHost.exe"
)

echo.
echo Setup Complete! The tracker will now pull from GitHub and start seamlessly on every PC boot.
echo.
echo Executing the first update right now...
start "" %STARTUP_VBS%

pause
endlocal
exit /b 0
