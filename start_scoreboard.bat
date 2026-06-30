@echo off
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo First-time setup -- this only happens once.
    echo Creating virtual environment...

    python -m venv .venv 2>nul
    if errorlevel 1 (
        py -m venv .venv 2>nul
        if errorlevel 1 (
            echo.
            echo Setup failed. Make sure Python 3 is installed:
            echo   https://www.python.org/downloads/
            pause
            exit /b 1
        )
    )

    echo Installing dependencies...
    .venv\Scripts\python.exe -m pip install --quiet -r requirements.txt
    if errorlevel 1 (
        echo.
        echo Dependency installation failed.
        echo Check your internet connection and try again.
        pause
        exit /b 1
    )
    echo Done! Starting Upward Scoreboard...
    echo.
)

.venv\Scripts\python.exe app.py
if errorlevel 1 (
    echo.
    echo The application exited with an error. See above for details.
    pause
)
