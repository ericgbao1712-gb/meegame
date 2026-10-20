@echo off
rem Tải 6 file font vào thư mục fonts\ để game hiển thị đúng font cả khi không có mạng.
rem Windows 10/11: bấm đúp vào file này.
chcp 65001 >nul
cd /d "%~dp0fonts"
curl.exe -fL --retry 2 -o baloo-2-vietnamese-wght-normal.woff2 https://cdn.jsdelivr.net/npm/@fontsource-variable/baloo-2@5.3.0/files/baloo-2-vietnamese-wght-normal.woff2 || goto loi
curl.exe -fL --retry 2 -o baloo-2-latin-ext-wght-normal.woff2 https://cdn.jsdelivr.net/npm/@fontsource-variable/baloo-2@5.3.0/files/baloo-2-latin-ext-wght-normal.woff2 || goto loi
curl.exe -fL --retry 2 -o baloo-2-latin-wght-normal.woff2 https://cdn.jsdelivr.net/npm/@fontsource-variable/baloo-2@5.3.0/files/baloo-2-latin-wght-normal.woff2 || goto loi
curl.exe -fL --retry 2 -o quicksand-vietnamese-wght-normal.woff2 https://cdn.jsdelivr.net/npm/@fontsource-variable/quicksand@5.3.0/files/quicksand-vietnamese-wght-normal.woff2 || goto loi
curl.exe -fL --retry 2 -o quicksand-latin-ext-wght-normal.woff2 https://cdn.jsdelivr.net/npm/@fontsource-variable/quicksand@5.3.0/files/quicksand-latin-ext-wght-normal.woff2 || goto loi
curl.exe -fL --retry 2 -o quicksand-latin-wght-normal.woff2 https://cdn.jsdelivr.net/npm/@fontsource-variable/quicksand@5.3.0/files/quicksand-latin-wght-normal.woff2 || goto loi
echo Xong! Da tai 6 file font vao thu muc fonts\
pause
exit /b 0
:loi
echo Loi: khong tai duoc font. Kiem tra mang roi chay lai.
pause
exit /b 1
