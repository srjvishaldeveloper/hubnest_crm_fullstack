@echo off
set SERVICE_DIR=%~1
echo ========================================================
echo Starting Microservice: %SERVICE_DIR%
echo ========================================================

cd /d "%SERVICE_DIR%"

echo [1/4] Checking Virtual Environment...
if exist ".venv" (
    if not exist ".venv\Scripts\activate.bat" (
        echo        Found corrupted .venv ^(missing activate.bat^). Recreating...
        rmdir /s /q .venv
    )
)

if not exist ".venv" (
    echo        Creating .venv... This may take a few moments...
    python -m venv .venv
) else (
    echo        .venv found and valid.
)

echo [2/4] Activating Virtual Environment...
call .venv\Scripts\activate.bat

echo [3/4] Checking Dependencies...
if exist "requirements.txt" (
    echo        requirements.txt found. Installing packages...
    pip install -r requirements.txt
) else (
    echo        No requirements.txt found. Installing default FastAPI dependencies...
    pip install fastapi uvicorn pydantic
)

echo [4/4] Starting Microservice...
python main.py

echo.
echo Microservice has exited or failed to start.
pause
