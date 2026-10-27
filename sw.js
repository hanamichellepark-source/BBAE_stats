/* Insight Wave: 오프라인에서도 열리게. 새 버전은 사용자가 "업데이트"를 누를 때 적용 */
const V = 'iw-2610271404';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' }))))); });
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.endsWith('/cloud.json')) return;   // 설정 파일은 항상 서버에서
  // 같은 버전 안에서는 캐시 우선 → 새 버전은 서비스워커 교체로만 바뀜 (중간에 화면이 섞이지 않게)
  e.respondWith(caches.open(V).then(c => c.match(e.request, { ignoreSearch: true }).then(m => m || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }))).catch(() => caches.match('./index.html')));
});
