@echo off
echo Stopping GL8FX...
taskkill /FI "WINDOWTITLE eq GL8FX API*" /T /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq GL8FX Web*" /T /F > nul 2>&1
echo Done.
