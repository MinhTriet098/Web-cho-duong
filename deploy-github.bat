@echo off
chcp 65001 > nul
echo ========================================================
echo   🚀 TỰ ĐỘNG ĐẨY WEB HSK 2 LÊN GITHUB CHO BẠN DƯƠNG
echo ========================================================
echo.

:: Kiem tra git da cai chua
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] May tinh cua ban chua cai Git!
    echo Ban hay tham khao file 'huong-dan-up-len-github.md' de dung Cach 2 (Keo tha truc tiep tren web GitHub nhe).
    pause
    exit /b
)

echo Buoc 1: Nhap link GitHub Repository cua ban
echo (Vi du: https://github.com/ten-cua-ban/hsk2-duong.git)
echo.
set /p REPO_URL=">> Dan link GitHub vao day roi an Enter: "

if "%REPO_URL%"=="" (
    echo [LOI] Ban chua nhap link repository! Vui long chay lai file.
    pause
    exit /b
)

echo.
echo Dang khoi tao git va chuan bi tep...
if not exist .git (
    git init
    git branch -M main
)

:: Dam bao da co user info trong git local
git config user.name >nul 2>&1
if %errorlevel% neq 0 (
    git config user.name "Duong HSK2"
    git config user.email "duong@hsk2.local"
)

git add .gitignore index.html style.css data.js app.js words_hsk2.json README.md huong-dan-up-len-github.md
git commit -m "Cap nhat web hoc tu vung HSK2 cho ban Duong" >nul 2>&1

git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo.
echo Dang day code len GitHub...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [Luu y] Neu gap loi xac thuc hoac quyen truy cap, ban chi can dang nhap GitHub trong trinh duyet khi duoc hoi nhe!
    echo Hoac ban co the dung Cach 2 (Keo tha tren trinh duyet) trong file 'huong-dan-up-len-github.md'.
) else (
    echo.
    echo ========================================================
    echo   ✅ DA DAY LEN GITHUB THANH CONG!
    echo ========================================================
    echo.
    echo Bay gio ban chi can bat GitHub Pages la xong:
    echo 1. Vao repository tren GitHub
    echo 2. Vao 'Settings' -> 'Pages'
    echo 3. O muc 'Branch', chon 'main' va thu muc '/ (root)', roi an 'Save'
    echo 4. Cho 1-2 phut la se co link web de gui ngay cho Duong!
)

echo.
pause
