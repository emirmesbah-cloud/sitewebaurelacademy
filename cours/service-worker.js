// SHERLOCK R14 — M10 : versioning explicite. Le cours/ legacy n'a PAS de
// pipeline build, donc pas de cache-busting auto via hash. Le SW garde
// l'ancien bundle tant que le CACHE_NAME ne change pas.
//
// ▶ À CHAQUE DEPLOY du dossier cours/, INCRÉMENTE LE NUMÉRO + LA DATE.
//   Format : `aurel-vN-YYYY-MM-DD`. La date dans le nom de cache aide
//   à diagnostiquer en prod (DevTools > Application > Cache Storage)
//   quelle build de SW un user a actuellement.
var DEPLOY_DATE = '2026-05-19';
var CACHE_NAME = 'aurel-v4-' + DEPLOY_DATE;
var urlsToCache = [
  '/',
  '/index.html',
  '/assets/app.css',
  '/assets/app.js',
  '/assets/i18n.js',
  '/assets/favicon.svg'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache).catch(function(){});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.map(function(name) {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  if (event.request.url.indexOf('/api/') !== -1) return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request).then(function(response) {
      if (response.status === 200 && response.type === 'basic') {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});
