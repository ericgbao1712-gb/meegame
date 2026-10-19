# MeeGame

Source của meegame.shop — trang gom link game web, kèm 3 game tự làm. Bản chạy ở meegame.shop đã tắt ngày 18/10/2026; repo này có đủ mọi thứ để dựng lại ở chỗ khác.

| Thư mục | Nội dung |
|---|---|
| `web/` | Trang tĩnh: `index.html` (trang chủ), `admin.html` (phòng biên tập), `games-seed.js`, `categories.js`, `titles-en.js`, `config.js` |
| `web/quanlau/` | Game **Lẩu Ơi!** (đường dẫn `/quanlau/`) |
| `web/xoailac/` | Game **Xoài Lắc Ơi!** v2.6.24 (đường dẫn `/xoailac/`). Source gốc: github.com/ericgbao1712-gb/xoailac |
| `web/quanlyidol/` | Game **Quản lý Idol** (K-pop management, đường dẫn `/quanlyidol/`) |
| `tools/xoailac/` | Kiểm thử và mô phỏng của Xoài Lắc (`node test_core.mjs`) |
| `app/` | API Python (`meegame_api.py`, SQLite, không cần pip) |
| `covers-sync/` | Job tải và cắt ảnh bìa game (cron 5 phút/lần) |
| `compose.yml`, `web.conf` | Docker Compose + cấu hình nginx của bản cũ |
| `sao-luu.sh` | Sao lưu SQLite hằng đêm |

Cả 3 game là trang tĩnh thuần (HTML + JS module), **không cần build**, không cần máy chủ riêng. Tiến trình người chơi lưu trong `localStorage` của trình duyệt.

## Cách 1: chỉ trang tĩnh (dễ nhất)

Đưa nguyên thư mục `web/` lên bất kỳ chỗ nào phục vụ file tĩnh: GitHub Pages, Cloudflare Pages, Netlify, Vercel, hoặc nginx / Apache trên máy chủ riêng.

1. Sửa `web/config.js`: để `window.MEEGAME_API = '';`. Trang chủ sẽ dùng danh sách game dự phòng trong `games-seed.js` và ẩn số lượt chơi. Phòng biên tập (`admin.html`) và ô "Hôm nay muốn chơi gì?" bằng AI không chạy khi không có API.
2. Sửa domain cũ trong `web/index.html` (tìm `meegame.shop`: thẻ canonical / og:image).
3. Thư mục `web/covers/` không có trong repo (ảnh bìa do covers-sync tạo ra). Không có API thì trang chủ tự lấy ảnh chụp màn hình của từng game (dịch vụ mshots của WordPress).

Chỉ cần một game thì chép riêng thư mục đó (vd `web/xoailac/`) lên là chạy.

Chạy thử trên máy:

```bash
python3 -m http.server 8000 --directory web
```

rồi mở http://localhost:8000/ (game: /xoailac/, /quanlau/, /quanlyidol/).

## Cách 2: đầy đủ (trang + API + ảnh bìa) bằng Docker

Bản cũ chạy trên VPS sau Cloudflare → Traefik (Coolify) → 2 container `meegame-web` (nginx) và `meegame-api` (Python). `compose.yml` giả định có sẵn mạng Docker `coolify` và Traefik với certresolver `letsencrypt`; ở chỗ mới thì sửa phần `networks` và `labels` cho hợp reverse proxy đang dùng (hoặc thêm `ports:` để mở thẳng 8080 / 8787).

1. Chép repo vào `/srv/meegame` (đường dẫn này được ghi cứng trong `compose.yml`, `covers-sync/run.sh`, `sao-luu.sh`; đổi chỗ thì sửa các file đó).
2. Tạo thư mục dữ liệu cho SQLite: `mkdir -p /var/lib/meegame && chown 10002:10002 /var/lib/meegame`.
3. Tạo file bí mật `/etc/meegame/env` (chmod 600, **không đưa lên git**):
   ```
   JEV_API_KEY=
   ```
   Để trống thì tắt AI; trang tự tìm bằng từ khoá.
4. Sửa domain trong `compose.yml` (`Host(...)`, `MEEGAME_ORIGINS`), `web/config.js` (`MEEGAME_API`), `covers-sync/sync.py` (`BASE`) và `web/index.html`.
5. Chạy: `docker compose -f /srv/meegame/compose.yml up -d`
6. Nhập danh sách game và tạo tài khoản biên tập:
   ```bash
   docker exec meegame-api python3 /app/meegame_api.py import-seed /app/games-seed.js
   docker exec -it meegame-api python3 /app/meegame_api.py add-admin email@cua-ban.com
   ```
7. Ảnh bìa: `docker build -t meegame-covers:1 covers-sync/`, rồi thêm vào crontab của root:
   ```
   */5 * * * * /srv/meegame/covers-sync/run.sh
   15 3 * * * /srv/meegame/sao-luu.sh
   ```

Lệnh của API (ghi ở đầu file `app/meegame_api.py`): `serve`, `add-admin EMAIL`, `remove-admin EMAIL`, `import-seed FILE`. Biến môi trường: `MEEGAME_DB`, `MEEGAME_HOST`, `MEEGAME_PORT`, `MEEGAME_ORIGINS`, `MEEGAME_TRUSTED_PROXIES`, `MEEGAME_REAL_IP_HEADER`, `JEV_API_KEY`.

## Lưu ý khi cập nhật game

- Xoài Lắc: CDN hay giữ CSS và ảnh rất lâu. Sửa `style.css` thì tăng `CSS_VER` trong `web/xoailac/src/main.js`; sửa ảnh trong `assets/` thì tăng `ASSET_VER` trong `web/xoailac/src/art/assets.js`.
- Dữ liệu cũ của meegame.shop (game do biên tập thêm, lượt chơi, tài khoản biên tập) nằm trong file SQLite trên máy chủ cũ và **không** có trong repo.

Khoá bí mật (`JEV_API_KEY`, mật khẩu biên tập…) không bao giờ nằm trong repo.
