@echo off
rem Serves the deck over http://localhost so YouTube embeds and API calls work,
rem then opens Session 1 in the default browser. Close this window to stop.
cd /d "%~dp0"
start "" "http://localhost:8137/sessions/session-1/presenter.html"
python -m http.server 8137
