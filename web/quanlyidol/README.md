# Quản lý Idol (Idol Agency Tycoon)

Game quản lý idle K-pop, tách riêng từ repo `meegame-main/web/quanlyidol/`.
Trang tĩnh thuần: **không cần build, không cần server riêng**, tiến trình lưu trong `localStorage`.

## Cấu trúc

| File | Nội dung |
|---|---|
| `index.html` | Khung trang (rất ngắn), nạp `style.css` và `game.js` |
| `style.css` | Toàn bộ giao diện (trước đây nằm trong thẻ `<style>`) |
| `game.js` | Toàn bộ logic game (trước đây nằm trong thẻ `<script>`) |
| `assets/` | Ảnh nền `bg_*.jpg`, sprite idol `idols_f1..f8 / m1..m8.jpg` (lưới 3×3), icon `ic/*.png` |
| `favicon.ico`, `assets/app/` | Logo: icon tab trình duyệt, icon màn hình chính (Android `icon-*` + `maskable-*`, iPhone `apple-touch-icon.png`) |
| `manifest.json` | Khai báo app cho điện thoại: tên "Idol Tycoon", logo, màu, `start_url`/`scope` = `/quanlyidol` |
| `sw.js` | Service worker: cho phép cài như app và mở khi mất mạng (network first) |
| `capcao.js` | Bản test bắt đầu ở cấp cao (tắt mặc định, xem cuối file) |
| `fonts/fonts.css` | Khai báo font Baloo 2 + Quicksand tự host (có bản tiếng Việt) |
| `tai-font.bat`, `tai-font.sh` | Tải 6 file font `.woff2` vào `fonts/` — **chạy 1 lần** sau khi giải nén |

## Font chữ

Game không dùng Google Fonts. `fonts/fonts.css` tìm font theo thứ tự:
1. CDN jsDelivr → có mạng là dùng được ngay, kể cả khi `fonts/` chưa có file.
2. File trong thư mục `fonts/` → dùng khi không có mạng.

Muốn chạy offline: chạy **một lần** `tai-font.bat` (Windows, bấm đúp) hoặc `sh tai-font.sh` (Mac/Linux) để tải 6 file `.woff2` vào `fonts/`.

## Chạy thử trên máy

`index.html` có `<base href="/quanlyidol/">` (cần cho Vercel vì `vercel.json` đặt `trailingSlash: false`),
nên phải chạy từ thư mục `web/` để game nằm đúng đường dẫn `/quanlyidol/`:

```bash
python3 -m http.server 8000 --directory web
# mở http://localhost:8000/quanlyidol/
```

Không mở thẳng `index.html` bằng double-click (file://): một số trình duyệt chặn localStorage / đường dẫn ảnh.

## Bản đồ `game.js` (để biết sửa ở đâu)

| Dòng (xấp xỉ) | Phần |
|---|---|
| 3–53 | `ROSTER`: 144 idol hư cấu `[id, nghệ danh, nhóm gốc, ảnh, ô, độ hiếm, sở trường]`. Ảnh `f1..m8` = sprite 3×3 trong `assets/` |
| ~59 | `LV`: 6 cấp cơ sở (ký túc xá, số nhóm, tiền thuê, sức chứa concert/tour, giá nâng cấp) |
| ~67–69 | **Hằng số chỉnh nhanh**: `WEEK_MS` (7 phút/tuần), `OFFLINE_MAX`, `MAX_MEMBERS` (11), `STK_PER_DAY` (6), `STK_PER_WHO` (2), `MV_COOLDOWN` (1 tuần) |
| ~119 | `MISSIONS`: 42 nhiệm vụ nối tiếp nhau |
| ~167 | `QLV`: chia nhiệm vụ thành 6 Level `[nhiệm vụ đầu, tên, thưởng hoàn thành Level]` |
| ~179 | `KEY="kpopceo_v1"` — khoá lưu game (đừng đổi, sẽ xoá save người chơi) |
| ~181–210 | `fresh()` (save mới), `load()`, `migrate()`, `MIG` + `migrateIds()` (chuyển save cũ sang id mới) |
| ~498 | `troupeIds()`: đội hình trên sân khấu (nhóm > 7 người xếp 2 hàng) |

## Thay đổi ở bản này

- Toàn bộ idol, nhóm gốc, bài cover, báo/diễn đàn/app fan đổi sang tên **hư cấu**.
- Ký túc xá / số nhóm: 16/2 → 36/4 → 64/6 → 110/9 → **130/12 → 144/16** (2 cấp mới: Tổ hợp giải trí châu Á, Đế chế Hallyu toàn cầu).
- 1 tuần = 7 phút (trước 9). MV chờ 1 tuần (trước 3). Nhóm tối đa 11 người (trước 7).
- Lịch: 6 sticker/ngày (trước 3), mỗi người/nhóm 2 sticker/ngày (trước 1, không trùng loại).
- Nhiệm vụ: 23 → 42, chia 6 Level, hoàn thành Level có thưởng thêm.
- Save cũ vẫn chơi tiếp được: id idol cũ tự đổi sang id mới khi mở game.

## Cài như app trên điện thoại

- Android (Chrome): menu ⋮ → "Cài đặt ứng dụng" / "Thêm vào màn hình chính". iPhone (Safari): Chia sẻ → "Thêm vào MH chính".
- Vì `vercel.json` đặt `trailingSlash: false`, trang thật là `/quanlyidol` (không có `/` cuối). Do đó:
  - `manifest.json` dùng `start_url` và `scope` = `/quanlyidol` (nếu để `./` thì thành `/quanlyidol/`, trang thật nằm ngoài scope).
  - `sw.js` đăng ký với scope `/quanlyidol`; `vercel.json` gửi header `Service-Worker-Allowed: /quanlyidol` cho file này.
- Đổi logo: sửa ảnh trong `assets/app/` (giữ đúng tên và kích thước). Ảnh `maskable-*` phải để phần hình chính trong vòng tròn 80% ở giữa vì Android tự cắt theo khuôn icon.
- Sửa `style.css`/`game.js` không cần đổi gì ở `sw.js` (network first luôn lấy bản mới khi có mạng).

## Lưu ý khi cập nhật

- **Thêm trường mới vào save**: thêm giá trị mặc định trong `migrate()` để người chơi cũ không bị lỗi `undefined`.
- **Chỉ đổi `KEY`** khi muốn xoá sạch save cũ của mọi người chơi (họ sẽ chơi lại từ đầu).
- **Thêm idol**: thêm dòng vào `ROSTER`; `sheet` + `idx` trỏ tới ô trong ảnh `assets/idols_<sheet>.jpg` (lưới 3×3, idx 0–8).
- **Cache**: nếu host có CDN cache lâu, đổi tên nạp file khi phát hành, ví dụ `game.js?v=2`, `style.css?v=2` trong `index.html`.

## Bản test "bắt đầu ở cấp cao" (`capcao.js`)

Dùng để thử nhanh phần giữa/cuối game mà không phải chơi lại từ đầu.
Save tạo ra: Toà nhà riêng (cấp 3), Năm 2 · Tuần 28, 3 tỷ, 30 vé casting, phòng tập + marketing cấp 6,
36 idol (3 UR, 8 SSR, 12 SR, 13 R) đã luyện ~70–90%, 3 nhóm đã debut (1,4M / 320K / 45K fan, có cúp và bài trên BXH),
còn trống 1 slot nhóm để test debut. Nhiệm vụ kế tiếp: World Tour.

- Bật: trong `index.html` bỏ comment dòng `<script src="capcao.js">` (phải nằm **trước** `game.js`).
- Chỉ áp dụng khi game tạo **save mới** (lần đầu chơi, hoặc Cài đặt → Chơi lại). Save cũ không bị đụng tới.
- Đổi thông số trong object `CFG` ở đầu `capcao.js`.
- Cơ chế: `fresh()` trong `game.js` có 1 dòng gọi `window.CAPCAO(s)` nếu hàm này tồn tại; bản thường không nạp `capcao.js` nên chạy y như cũ.
