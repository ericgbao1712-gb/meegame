// Tiramisu Xe Đẩy service worker: cho phép "Cài đặt ứng dụng" và mở được khi mất mạng.
// Ưu tiên mạng (luôn lấy bản mới nhất khi có mạng), chỉ dùng bản lưu khi mất mạng. Không bao giờ cache /api.
// Tiến trình chơi nằm trong localStorage, file này không đụng tới.
const CACHE = 'tiranho-v1.5.2';
const HOME = '/tiranho';
const CORE = [HOME, '/tiranho/manifest.json', '/tiranho/icon-192.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tiranho-') && k !== CACHE).map((k) => caches.delete(k))))
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
