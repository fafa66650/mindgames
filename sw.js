const CACHE = 'fafa-github-ultimate-v4';
const ASSETS = [
  './','./index.html','./styles.css','./app.js','./manifest.json','./sw.js',
  './assets/logo.png','./icons/icon-192.png','./icons/icon-512.png',
  './assets/night_dossier.png','./assets/night_console.png','./assets/night_corridor.png',
  './assets/jungle_map.png','./assets/jungle_glyphs.png','./assets/jungle_ruins.png',
  './assets/lab_alert.png','./assets/lab_circuit.png','./assets/lab_report.png',
  './assets/night_puzzle_badges.png','./assets/night_puzzle_codewall.png',
  './assets/jungle_puzzle_tablet.png','./assets/jungle_puzzle_path.png',
  './assets/lab_puzzle_matrix.png','./assets/lab_puzzle_lock.png'
];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));