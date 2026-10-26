// Tiệm TiraMee service worker: cài được như app và mở được khi mất mạng.
// MẠNG TRƯỚC: có mạng thì luôn lấy bản mới nhất (máy chủ gửi no-cache), bản trong cache chỉ dùng khi mất mạng.
// Ván chơi nằm trong localStorage, file này không đụng tới.
const CACHE = 'tiramee-v1';
const HOME = '/tiramee';
const CORE = [HOME, HOME + '/manifest.json', HOME + '/app/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tiramee-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !(url.pathname === HOME || url.pathname.startsWith(HOME + '/'))) return;
  if (url.pathname === HOME + '/version.json') return;              // luôn hỏi máy chủ (kiểm tra bản mới)
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match(HOME) : Response.error())))
  );
});
