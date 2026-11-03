// Cache an immutable app shell, never user input or arbitrary runtime requests.
const CACHE = 'hatcheat-v11-sound-on-random-reactions-20261103';
const ASSETS = ['./', './index.html', './app.js', './core.js', './quotes.js', './giving-animation.js', './ink-motion.js', './sound-effects.js', './ui-motion.js', './styles.css', './hatcheat-tokens.css',
  ...['paper-fold','paper-glide','haechi-bite','settle','ink-grind','page-open','card-reveal'].map(name => `./assets/audio/${name}.wav`),
  './manifest.webmanifest', './assets/GowunDodum-Regular.woff2', './assets/haechi-logo.png', './assets/hanji.jpg', './assets/hatcheat-192.png', './assets/hatcheat-512.png',
  './assets/haechi/haechi_wait.png', './assets/haechi/haechi_eat.png', './assets/haechi/haechi_sit.png', './assets/haechi/haechi_sit_hanji.png',
  './assets/haechi/haechi_grind_20.png', './assets/haechi/haechi_grind_40.png', './assets/haechi/haechi_grind_60.png'];
// These user-supplied fonts are local-only. Their absence must not break installation.
const LOCAL_FONTS = ['./assets/fonts/YNAMNEWS-Medium.woff2', './assets/fonts/YNAMNEWS-Bold.woff2'];
const assetUrls = ASSETS.map(path => new URL(path, self.registration.scope).href);
const fontUrls = LOCAL_FONTS.map(path => new URL(path, self.registration.scope).href);
const urls = [...assetUrls, ...fontUrls];
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(assetUrls);
  await Promise.all(fontUrls.map(url => cache.addAll([url]).catch(() => {})));
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) {
    if ((key.startsWith('hatcheat-') || key.startsWith('emotion-incinerator-')) && key !== CACHE) await caches.delete(key);
  }
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !urls.includes(event.request.url)) return;
  event.respondWith((async () => {
    const cached = await (await caches.open(CACHE)).match(event.request.url);
    return cached || fetch(event.request);
  })());
});
