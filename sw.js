const CACHE = 'fafa-github-v12-escape-fix';
const ASSETS = [
  './','./index.html','./styles.css','./app.js','./manifest.json','./sw.js',
  './assets/logo.png','./icons/icon-192.png','./icons/icon-512.png',
  './assets/night_scene_intro.png','./assets/night_scene_console.png','./assets/night_scene_dossier.png',
  './assets/night_puzzle_badges.png','./assets/night_puzzle_codewall.png','./assets/night_puzzle_grid.png',
  './assets/jungle_scene_intro.png','./assets/jungle_scene_ruins.png','./assets/jungle_scene_map.png',
  './assets/jungle_puzzle_tablet.png','./assets/jungle_puzzle_path.png','./assets/jungle_puzzle_glyphs.png',
  './assets/lab_scene_intro.png','./assets/lab_scene_report.png','./assets/lab_scene_circuit.png',
  './assets/lab_puzzle_matrix.png','./assets/lab_puzzle_lock.png','./assets/lab_puzzle_alert.png',
  './audio/theme_night.wav','./audio/theme_jungle.wav','./audio/theme_lab.wav',
  './audio/ok.wav','./audio/bad.wav','./audio/tension.wav','./audio/glitch.wav'
];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));