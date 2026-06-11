@echo off
echo ========================================================
echo       Starting Hubnest CRM Services and Microservices
echo ========================================================
echo.

echo Starting Node.js Backend...
start "Node.js Backend" cmd /k "cd server && npm install && npm run dev"

echo Starting Next.js Frontend...
start "Next.js Frontend" cmd /k "cd client && npm install && npm run dev"

echo Starting Microservices in crm_microservices...
for /d %%d in (crm_microservices\*) do (
    echo Starting microservice: %%~nxd
    start "Microservice: %%~nxd" cmd /k "call start_service.bat "%%d""
)

echo.
echo All services are launching in separate windows!
echo Please allow a moment for all servers to initialize.
echo.
pause
