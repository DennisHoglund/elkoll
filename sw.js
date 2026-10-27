// Höj versionen vid varje deploy så att telefonen hämtar nya filer.
const CACHE = 'elkoll-v11';

const SHELL = [
  './',
  './index.html',
  './styles.css',
  './config.js',
  './util.js',
  './ko.js',
  './team.js',
  './karta.js',
  './foto.js',
  './uppdrag.js',
  './app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// Bibliotek och typsnitt: cache först (låsta versioner ändras inte)
const CDN_HOSTS = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

// Kartrutor i egen cache så att kartan fungerar med dålig täckning
const TILE_CACHE = 'elkoll-tiles';
const TILE_MAX = 1500;
const TILE_HOSTS = ['tile.openstreetmap.org', 'tile.opentopomap.org', 'server.arcgisonline.com'];
const isTile = (host) => TILE_HOSTS.some((h) => host === h || host.endsWith('.' + h));
async function trimTiles() {
  const c = await caches.open(TILE_CACHE);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - TILE_MAX; i++) await c.delete(keys[i]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== TILE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok || res.type === 'opaque') caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      }))
    );
    return;
  }

  if (isTile(url.hostname)) {
    event.respondWith(
      caches.open(TILE_CACHE).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok || res.type === 'opaque') { c.put(req, res.clone()); trimTiles(); }
        return res;
      })))
    );
    return;
  }

  // Allt annat externt (Supabase m.m.) går direkt till nätet
  if (url.origin !== self.location.origin) return;

  // Testrapporten under /rapport/ ska aldrig cachas eller blandas ihop med appen
  if (url.pathname.includes('/rapport/')) return;

  // Sidladdning: nätet först, annars cachad sida (offline)
  if (req.mode === 'navigate') {
    event.respondWith(
      // no-cache: fråga alltid servern (GitHub Pages låter annars webbläsaren cacha i 10 min)
      fetch(req, { cache: 'no-cache' })
        .then((res) => {
          caches.open(CACHE).then((c) => c.put('./index.html', res.clone()));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Egna filer: nätet först så att nya versioner alltid används, cache vid offline
  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
