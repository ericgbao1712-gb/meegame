// Bánh Tráng Nhà Mee service worker: để Android/Chrome cho "Cài đặt ứng dụng" và mở được khi mất mạng.
// Ưu tiên mạng: có mạng là luôn lấy bản mới nhất (máy chủ gửi no-cache), chỉ dùng bản lưu khi mất mạng.
// Tiến trình chơi nằm trong localStorage, không bị file này đụng tới. Không bao giờ cache /api.
const CACHE = 'banhtrang-v1';
// Trang thật là /banhtrang (không có dấu / cuối, /banhtrang/ bị chuyển hướng) nên scope là "/banhtrang".
const HOME = '/banhtrang';
const CORE = [HOME, '/banhtrang/manifest.json', '/banhtrang/icon-192.png?v=2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('banhtrang-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !(url.pathname === HOME || url.pathname.startsWith(HOME + '/'))) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match(HOME) : Response.error())))
  );
});
