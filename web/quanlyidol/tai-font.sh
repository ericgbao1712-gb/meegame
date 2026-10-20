#!/bin/sh
# Tải 6 file font vào thư mục fonts/ để game hiển thị đúng font cả khi không có mạng.
# Mac/Linux: mở Terminal trong thư mục game rồi chạy:  sh tai-font.sh
set -e
cd "$(dirname "$0")/fonts"
curl -fL --retry 2 -o baloo-2-vietnamese-wght-normal.woff2 https://cdn.jsdelivr.net/npm/@fontsource-variable/baloo-2@5.3.0/files/baloo-2-vietnamese-wght-normal.woff2
curl -fL --retry 2 -o baloo-2-latin-ext-wght-normal.woff2 https://cdn.jsdelivr.net/npm/@fontsource-variable/baloo-2@5.3.0/files/baloo-2-latin-ext-wght-normal.woff2
curl -fL --retry 2 -o baloo-2-latin-wght-normal.woff2 https://cdn.jsdelivr.net/npm/@fontsource-variable/baloo-2@5.3.0/files/baloo-2-latin-wght-normal.woff2
curl -fL --retry 2 -o quicksand-vietnamese-wght-normal.woff2 https://cdn.jsdelivr.net/npm/@fontsource-variable/quicksand@5.3.0/files/quicksand-vietnamese-wght-normal.woff2
curl -fL --retry 2 -o quicksand-latin-ext-wght-normal.woff2 https://cdn.jsdelivr.net/npm/@fontsource-variable/quicksand@5.3.0/files/quicksand-latin-ext-wght-normal.woff2
curl -fL --retry 2 -o quicksand-latin-wght-normal.woff2 https://cdn.jsdelivr.net/npm/@fontsource-variable/quicksand@5.3.0/files/quicksand-latin-wght-normal.woff2
echo "Xong! Đã tải 6 file font vào thư mục fonts/."
