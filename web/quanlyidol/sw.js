// Idol Agency Tycoon service worker: cho phép cài game như app (Android "Cài đặt"/"Thêm vào màn hình chính")
// và mở được khi mất mạng. Network first: có mạng thì luôn lấy file mới nhất, cache chỉ dùng khi mạng lỗi.
// Save game nằm trong localStorage, service worker không đụng tới.
//
// Scope: trang thật là /quanlyidol (vercel.json đặt trailingSlash:false), nằm NGOÀI thư mục /quanlyidol/ của file này,
// nên đăng ký với scope "/quanlyidol" và vercel.json gửi kèm header "Service-Worker-Allowed: /quanlyidol".
const CACHE = 'quanlyidol-v1';
const HOME = '/quanlyidol';
const CORE = [HOME, 'style.css', 'game.js', 'manifest.json', 'favicon.ico', 'assets/app/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('quanlyidol-') && k !== CACHE).map((k) => caches.delete(k))))
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
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then((hit) => hit || (req.mode === 'navigate' ? caches.match(HOME) : Response.error())))
  );
});
