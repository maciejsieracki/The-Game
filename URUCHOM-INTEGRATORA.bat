@echo off
title INTEGRATOR KRYZYS-Opus
cd /d "%~dp0gra-robocza"
set "PATH=%PATH%;%APPDATA%\npm;%USERPROFILE%\.local\bin"
where claude >nul 2>nul
if errorlevel 1 (
  echo Nie znaleziono Claude Code - instaluje. Potrwa 1-2 minuty, nic nie klikaj...
  call npm install -g @anthropic-ai/claude-code
)
where claude >nul 2>nul || (echo BLAD: instalacja nie powiodla sie - brak npm lub internetu. Napisz o tym Claude'owi w Cowork. & pause & exit /b 1)
echo.
echo Startuje integratora. Jesli zapyta o zaufanie do folderu lub logowanie - nacisnij Enter i potwierdz w przegladarce.
echo.
claude "Przeczytaj ..\dyspozycje\_handoff\KANAL-KRYZYS-2026-07-05.md. Jestes INTEGRATOREM (KRYZYS-Opus). Wykonaj ZADANIE GLOWNE z wpisu [22:05] MASTER do INTEGRATOR i raportuj kazda faze wpisem w tym kanale, zgodnie z protokolem z gory pliku. Pracuj az do zwolnienia LOCK."
pause
