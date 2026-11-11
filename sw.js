/* Insight Wave: 오프라인에서도 열리게. 새 버전은 사용자가 "업데이트"를 누를 때 적용 */
const V = 'iw-2611111300';
const CORE = ['./', './index.html'];   // 홈 화면 아이콘·manifest는 GitHub에 있는 기존 파일 그대로 사용
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

// 잠금 화면 알림 (알림 서버가 보낸 암호화된 문구를 브라우저가 풀어서 전달)
self.addEventListener('push', e => {
  let m = { title: 'Insight Wave', body: '새 소식이 있어요', tag: 'iw' };
  try { if (e.data) m = Object.assign(m, e.data.json()); } catch (x) { }
  e.waitUntil(self.registration.showNotification(m.title, { body: m.body, tag: m.tag, renotify: true, icon: 'icon-192.png', badge: 'icon-192.png', data: { url: './?from=push&tag=' + encodeURIComponent(m.tag || '') + '&b=' + encodeURIComponent(m.body || ''), tag: m.tag, body: m.body } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if (c.url.startsWith(self.registration.scope)) { c.focus(); c.postMessage({ type: 'push-open', tag: e.notification.data && e.notification.data.tag, body: e.notification.data && e.notification.data.body }); return; }
    return self.clients.openWindow(url);
  }));
});
