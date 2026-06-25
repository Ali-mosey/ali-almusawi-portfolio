@echo off
REM ============================================================
REM  Publish Portfolio
REM  Syncs the InDesign file to the live website.
REM  Edit + Save As .idml in InDesign first, then run this.
REM ============================================================

REM Move to this script's own folder (the project root).
cd /d "%~dp0"

echo.
echo  Publishing portfolio from InDesign...
echo  ----------------------------------------------------------
echo.

call npm.cmd run sync -- "Indesign Folder/Portfolio_filled.idml"

echo.
echo  ----------------------------------------------------------
echo  Done. If it pushed, your live site updates in ~30-60s:
echo  https://ali-almusawi-portfolio.vercel.app
echo.
pause
