@echo off
echo ==========================================
echo  🤖 Robo WebSocket Client - Auto-Restart
echo ==========================================
echo.
echo This window will keep Robo connected to PeteChat
echo If it crashes, it auto-restarts in 3 seconds
echo.
echo Press Ctrl+C to stop
echo.

:loop
echo [%date% %time%] Starting Robo Client...
node "C:\Users\Administrator\.openclaw\workspace\petechat\robo-client-stable.js"

echo.
echo [%date% %time%] Client stopped/crashed. Restarting in 3 seconds...
echo.
timeout /t 3 /nobreak > nul
goto loop
