// Lẩu Ơi! service worker (v1.2): makes the game installable as an app (Android "Cài đặt ứng dụng", desktop Chrome/Edge)
// and lets it open without a connection. Network first: an online player always gets the newest files; the cached
// copy is only used when the network fails. Saves live in localStorage and are never touched here.
const CACHE = 'lauoi-v44';
// Trang thật là /quanlau (vercel.json: trailingSlash:false) nên scope là "/quanlau", không phải "/quanlau/".
const HOME = '/quanlau';
const CORE = [HOME, 'index.html', 'style.css', 'manifest.json', 'src/main.js', 'assets/app/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('lauoi-') && k !== CACHE).map((k) => caches.delete(k))))
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
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
