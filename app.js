
const APP = document.getElementById('app');
const RAIN = document.getElementById('rain');
const CTX = RAIN.getContext('2d');

const audioFiles = {
  theme_night: './audio/theme_night.wav',
  theme_jungle: './audio/theme_jungle.wav',
  theme_lab: './audio/theme_lab.wav',
  ok: './audio/ok.wav',
  bad: './audio/bad.wav',
  tension: './audio/tension.wav',
  glitch: './audio/glitch.wav'
};
const audioPool = {};
let soundEnabled = false;

function prepareAudio() {
  Object.entries(audioFiles).forEach(([k, v]) => {
    if (!audioPool[k]) {
      const a = new Audio(v);
      a.preload = 'auto';
      a.loop = k.startsWith('theme_');
      a.volume = k.startsWith('theme_') ? 0.55 : 0.95;
      audioPool[k] = a;
    }
  });
}
function currentThemeTrack() {
  return state.theme === 'jungle' ? 'theme_jungle' : state.theme === 'lab' ? 'theme_lab' : 'theme_night';
}
function autoEnableSound() {
  if (state.soundMode === 'off') { soundEnabled = false; save(); return; }
  if (soundEnabled) return;
  soundEnabled = true;
  prepareAudio();
  save();
}
function playFile(name) {
  if (!soundEnabled) return;
  try {
    prepareAudio();
    const a = audioPool[name].cloneNode();
    a.volume = audioPool[name].volume;
    a.play().catch(() => {});
  } catch (e) {}
}
function startThemeMusic() {
  if (!soundEnabled) return;
  try {
    prepareAudio();
    ['theme_night','theme_jungle','theme_lab'].forEach(k => {
      audioPool[k].pause();
      audioPool[k].currentTime = 0;
    });
    const key = currentThemeTrack();
    audioPool[key].currentTime = 0;
    audioPool[key].play().catch(() => {});
  } catch (e) {}
}
function stopThemeMusic() {
  try {
    prepareAudio();
    ['theme_night','theme_jungle','theme_lab'].forEach(k => {
      audioPool[k].pause();
      audioPool[k].currentTime = 0;
    });
  } catch (e) {}
}

const THEMES = {
  "": {
    body:'theme-night',
    title:'GAME ARENA',
    subtitle:'Une plateforme d’escape game immersive pensée pour le terrain, le téléphone et l’ordinateur.'
  },
  night: {
    body:'theme-night',
    title:'GAME ARENA',
    subtitle:'Mission urbaine sous pluie et néons.',
    mission:'Infiltration nocturne. Des indices ont été altérés. Ton équipe doit lire froidement, éviter les fausses pistes et sortir avec le meilleur score.',
    intro:['Transmission instable…','Une infiltration a été confirmée.','Lis vite, mais lis bien.','Mission autorisée.']
  },
  jungle: {
    body:'theme-jungle',
    title:'GAME ARENA',
    subtitle:'Expédition parmi les ruines et glyphes.',
    mission:'Une ancienne voie est de nouveau ouverte. Les bons passages se lisent dans l’ordre, la forme et les détails.',
    intro:['La jungle ne se tait jamais complètement.','Les ruines se lisent par couches.','Expédition ouverte.']
  },
  lab: {
    body:'theme-lab',
    title:'GAME ARENA',
    subtitle:'Protocole d’urgence dans un environnement instable.',
    mission:'Le système se dégrade. Ton équipe doit stabiliser, lire, trier et verrouiller le bon chemin avant la rupture.',
    intro:['L’alarme a déjà commencé.','Les écrans se contredisent.','Protocole activé.']
  }
};

const BANK = {"night": [{"id": "drag_badges", "label": "Drag & Drop", "title": "Classement des badges", "scene": "Quatre badges suspects ont été récupérés. Le protocole demande de les classer dans l’ordre croissant.", "type": "drag_order", "prompt": "Replace les badges dans l’ordre : 03, 07, 11, 14.", "items": ["11", "03", "14", "07"], "correct": ["03", "07", "11", "14"], "visual": "night_scene_dossier.png", "visualNeeded": true, "exp": "Le protocole demandait un ordre croissant strict. Les badges devaient donc être rangés de 03 vers 14.", "fragment": "A", "reward": "badge_key"}, {"id": "inventory_use", "label": "Inventaire", "title": "Dossier scellé", "scene": "Un dossier verrouillé est posé sur la table. Tu as besoin de l’outil correct pour l’ouvrir.", "type": "use_item", "prompt": "Sélectionne le bon objet dans l’inventaire puis valide.", "requiredItem": "badge_key", "visual": "night_scene_console.png", "visualNeeded": true, "exp": "Le badge-clé récupéré juste avant est le seul objet qui permet d’ouvrir ce dossier sécurisé.", "fragment": "B", "reward": "cipher_disk"}, {"id": "spot_hidden", "label": "Fouille", "title": "Fouille de scène", "scene": "Une scène contient quatre zones d’intérêt. Une seule cache un indice utile.", "type": "spot_pick", "prompt": "Choisis la bonne zone à fouiller.", "zones": ["Fenêtre", "Bureau", "Lampe", "Porte"], "answer": "Bureau", "visual": "night_scene_dossier.png", "visualNeeded": true, "exp": "Le bureau est la seule zone logique où l’indice papier pouvait être dissimulé.", "fragment": "C", "reward": "clue_note"}, {"id": "choice_logic", "label": "Logique", "title": "Salle d’interrogatoire fracturée", "scene": "Trois suspects parlent. Un seul dit vrai.", "type": "choice", "prompt": "A : “B ment.” B : “C ment.” C : “A et B mentent.” Qui dit vrai ?", "choices": ["A", "B", "C"], "answer": "C", "visual": null, "visualNeeded": false, "exp": "Si A dit vrai, B ment et C devient vrai aussi : impossible. Si B dit vrai, la logique s’effondre. C seul reste cohérent.", "fragment": "D"}, {"id": "minigame_decoder", "label": "Mini-game", "title": "Décodeur spectral", "scene": "Le dossier révèle un mot brouillé. Tourne chaque roue pour reconstituer le bon mot de passe.", "type": "decoder", "prompt": "Règle les 3 roues sur le mot : KAN.", "wheels": ["A", "A", "A"], "answer": "KAN", "visual": "night_puzzle_codewall.png", "visualNeeded": true, "exp": "Le décodeur devait être réglé sur KAN, fragment central du nom à retrouver.", "fragment": "E", "reward": "kan_segment"}, {"id": "hacking_grid", "label": "Hacking", "title": "Grille de dérivation", "scene": "Une grille doit être activée sans traverser les cellules rouges. Le meilleur chemin relie entrée et sortie en 4 pas.", "type": "choice", "prompt": "Choisis le chemin sûr.", "choices": ["Droite > Bas > Bas > Droite", "Bas > Droite > Droite > Bas", "Droite > Droite > Bas > Bas"], "answer": "Bas > Droite > Droite > Bas", "visual": "night_puzzle_grid.png", "visualNeeded": true, "exp": "Le chemin correct évite la zone rouge et atteint la sortie avec le minimum de mouvements sûrs.", "fragment": "F"}, {"id": "combine_items", "label": "Combinaison", "title": "Station de combinaison", "scene": "Tu possèdes maintenant plusieurs objets. Deux seulement forment un dossier exploitable.", "type": "combine", "prompt": "Combine les deux bons objets.", "combo": ["cipher_disk", "clue_note"], "visual": "night_scene_console.png", "visualNeeded": true, "exp": "Le disque chiffré et la note d’indice étaient conçus pour fonctionner ensemble.", "fragment": "G", "reward": "decoded_file"}, {"id": "boss_phase", "label": "Boss final", "title": "Révélation finale • Dossier classifié", "scene": "Le système final te demande de nommer le vrai traître après toutes les étapes précédentes.", "type": "boss", "prompt": "Choisis le bon profil final.", "choices": ["Agent Voss", "Agent Kane", "Agent Mercer"], "answer": "Agent Kane", "visual": "night_scene_dossier.png", "visualNeeded": true, "exp": "Les fragments, le mot KAN, le dossier décodé et les déductions précédentes pointent tous vers Kane.", "fragment": "H"}], "jungle": [{"id": "drag_totems", "label": "Drag & Drop", "title": "Ordre des totems", "scene": "Les totems doivent être replacés dans l’ordre du rituel.", "type": "drag_order", "prompt": "Classe-les ainsi : Terre, Eau, Feuille, Soleil.", "items": ["Soleil", "Feuille", "Terre", "Eau"], "correct": ["Terre", "Eau", "Feuille", "Soleil"], "visual": "jungle_scene_ruins.png", "visualNeeded": true, "exp": "Le rituel commence par la terre, puis l’eau, puis la croissance et enfin la lumière.", "fragment": "A", "reward": "totem_order"}, {"id": "search_ruins", "label": "Fouille", "title": "Ruines anciennes", "scene": "Une zone des ruines cache l’inscription centrale.", "type": "spot_pick", "prompt": "Choisis la zone à fouiller.", "zones": ["Piliers", "Dalle centrale", "Liane", "Mur nord"], "answer": "Dalle centrale", "visual": "jungle_scene_map.png", "visualNeeded": true, "exp": "La dalle centrale est l’élément rituel logique pour cacher une inscription d’ouverture.", "fragment": "B", "reward": "glyph_piece"}, {"id": "use_totem", "label": "Inventaire", "title": "Socle du sanctuaire", "scene": "Le socle ne s’ouvre qu’avec le bon objet rituel.", "type": "use_item", "prompt": "Utilise le bon objet de l’inventaire.", "requiredItem": "totem_order", "visual": "jungle_puzzle_tablet.png", "visualNeeded": true, "exp": "Le socle exigeait la séquence de totems validée par le rituel précédent.", "fragment": "C", "reward": "ritual_key"}, {"id": "jungle_logic", "label": "Logique", "title": "Parcours des repères", "scene": "Un seul parcours respecte les indices trouvés.", "type": "choice", "prompt": "Quelle route reste cohérente ?", "choices": ["Arche > Eau > Dalle > Clairière", "Clairière > Eau > Arche", "Arche > Dalle > Eau"], "answer": "Arche > Eau > Dalle > Clairière", "visual": null, "visualNeeded": false, "exp": "C’est le seul ordre qui respecte tous les repères mentionnés dans les documents découverts.", "fragment": "D"}, {"id": "glyph_decoder", "label": "Mini-game", "title": "Tablette à glyphes", "scene": "Tourne les 4 glyphes jusqu’à retrouver la combinaison d’ouverture.", "type": "decoder", "prompt": "Règle la tablette sur la combinaison : RUNE.", "wheels": ["A", "A", "A", "A"], "answer": "RUNE", "visual": "jungle_puzzle_glyphs.png", "visualNeeded": true, "exp": "La tablette devait afficher RUNE, mot d’ouverture relevé dans les ruines.", "fragment": "E", "reward": "rune_word"}, {"id": "jungle_combine", "label": "Combinaison", "title": "Assemblage rituel", "scene": "Deux objets doivent être combinés pour créer la clé finale du temple.", "type": "combine", "prompt": "Assemble les bons éléments.", "combo": ["glyph_piece", "ritual_key"], "visual": "jungle_scene_ruins.png", "visualNeeded": true, "exp": "Le fragment de glyphe et la clé rituelle se complètent pour former l’objet final.", "fragment": "F", "reward": "temple_key"}, {"id": "jungle_boss", "label": "Boss final", "title": "Portail du temple", "scene": "Le temple ne reconnaît qu’une seule parole d’ouverture.", "type": "boss", "prompt": "Quel mot ouvre le portail ?", "choices": ["RUNE", "TEMPLE", "TOTEM"], "answer": "RUNE", "visual": "jungle_scene_intro.png", "visualNeeded": true, "exp": "Le mot RUNE a été construit et validé pendant la tablette à glyphes.", "fragment": "G"}], "lab": [{"id": "circuit_drag", "label": "Circuit", "title": "Assemblage de circuit", "scene": "Le circuit doit être réordonné pour rétablir le flux.", "type": "drag_order", "prompt": "Classe les modules ainsi : Source, Filtre, Noyau, Sortie.", "items": ["Noyau", "Sortie", "Source", "Filtre"], "correct": ["Source", "Filtre", "Noyau", "Sortie"], "visual": "lab_scene_circuit.png", "visualNeeded": true, "exp": "L’ordre logique d’un flux est source, filtration, traitement central, puis sortie.", "fragment": "A", "reward": "circuit_map"}, {"id": "lab_search", "label": "Fouille", "title": "Terminal de maintenance", "scene": "Une seule zone du terminal contient le code partiel.", "type": "spot_pick", "prompt": "Choisis la bonne zone.", "zones": ["Coin supérieur", "Bloc ventilation", "Panneau central", "Voyant rouge"], "answer": "Panneau central", "visual": "lab_scene_report.png", "visualNeeded": true, "exp": "Le panneau central est l’emplacement technique attendu pour les données utiles.", "fragment": "B", "reward": "code_slice"}, {"id": "lab_use_item", "label": "Inventaire", "title": "Port de service", "scene": "Le port de service demande l’objet adéquat pour s’ouvrir.", "type": "use_item", "prompt": "Utilise le bon objet.", "requiredItem": "circuit_map", "visual": "lab_puzzle_lock.png", "visualNeeded": true, "exp": "Le plan de circuit contient la séquence de validation exigée par le port.", "fragment": "C", "reward": "service_access"}, {"id": "lab_logic", "label": "Logique", "title": "Contraposée de sécurité", "scene": "Si la chambre A déborde, alors la chambre C coupe le flux. Or le flux n’est pas coupé.", "type": "choice", "prompt": "Que peut-on conclure ?", "choices": ["A a débordé", "A n’a pas débordé", "C est vide"], "answer": "A n’a pas débordé", "visual": null, "visualNeeded": false, "exp": "C’est une contraposée logique : si A entraîne C, et que C n’est pas déclenché, A n’a pas eu lieu.", "fragment": "D"}, {"id": "lab_decoder", "label": "Mini-game", "title": "Verrou à roues", "scene": "Règle les roues du verrou sur SAFE.", "type": "decoder", "prompt": "Régle les 4 roues sur SAFE.", "wheels": ["A", "A", "A", "A"], "answer": "SAFE", "visual": "lab_puzzle_matrix.png", "visualNeeded": true, "exp": "Le verrou final exige le mot SAFE, relevé dans le rapport d’alarme.", "fragment": "E", "reward": "safe_word"}, {"id": "lab_combine", "label": "Combinaison", "title": "Fusion de données", "scene": "Deux éléments doivent être fusionnés pour reconstituer la trame finale.", "type": "combine", "prompt": "Combine les deux bons objets.", "combo": ["code_slice", "service_access"], "visual": "lab_scene_report.png", "visualNeeded": true, "exp": "La tranche de code et l’accès service forment ensemble la clé complète.", "fragment": "F", "reward": "master_code"}, {"id": "lab_boss", "label": "Boss final", "title": "Verrou de confinement", "scene": "Le système de confinement demande le bon code final.", "type": "boss", "prompt": "Quel mot final stabilise le système ?", "choices": ["SAFE", "CORE", "SEAL"], "answer": "SAFE", "visual": "lab_scene_intro.png", "visualNeeded": true, "exp": "Le mot SAFE a été reconstruit pendant le verrou à roues et validé par la logique de sécurité.", "fragment": "G"}]};
const BANK_RULES = {facile: 4, moyen: 6, difficile: 7, extreme: 8};

let state = {
  theme:'',
  totalPlayers:'',
  teamCount:'',
  publicType:'',
  difficulty:'',
  duration:'',
  teams:[],
  activeTeam:0,
  hints:0,
  time:0,
  index:0,
  picked:null,
  attempts:0,
  selectedChallenges:[],
  fragments:[],
  timerActive:false,
  showVisual:true,
  soundMode:'on',
  inventory:[],
  selectedItem:null,
  dragOrder:[],
  decoderValue:[],
  combineSelection:[]
};

function save() {
  localStorage.setItem('fafa_v17', JSON.stringify({...state, soundEnabled}));
}
function load() {
  try {
    const raw = localStorage.getItem('fafa_v17');
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.assign(state, parsed);
      soundEnabled = !!parsed.soundEnabled;
    }
  } catch (e) {}
}
function clearStore() {
  localStorage.removeItem('fafa_v17');
}
function setTheme() {
  document.body.className = THEMES[state.theme || ''].body;
}
function currentTeam() {
  return state.teams[state.activeTeam] || {name:'Équipe', players:[], score:0, progress:0};
}
function currentPlayer() {
  const t = currentTeam();
  if (!t.players.length) return t.name || 'Équipe';
  return t.players[state.index % t.players.length] || t.name;
}
function fmt(t) {
  const m=String(Math.floor(t/60)).padStart(2,'0');
  const s=String(t%60).padStart(2,'0');
  return `${m}:${s}`;
}
function timerColor() {
  if (state.time > 120) return 'green';
  if (state.time > 45) return 'orange';
  return 'red';
}
function syncTimerBadge() {
  const el = document.getElementById('live-timer');
  if (!el) return;
  el.textContent = '⏱ ' + fmt(state.time);
  el.className = 'badge timer timer-live ' + timerColor();
}
function ready() {
  return state.theme && state.totalPlayers && state.teamCount && state.publicType && state.difficulty && state.duration;
}
function challengeCount() {
  return BANK_RULES[state.difficulty] || 4;
}
function autoDistribution() {
  if (!state.totalPlayers || !state.teamCount) return 'à définir';
  const total=Number(state.totalPlayers), teams=Number(state.teamCount);
  const base=Math.floor(total/teams), rest=total%teams;
  return rest===0 ? `${teams} équipes de ${base}` : `${rest} équipes de ${base+1} · ${teams-rest} équipes de ${base}`;
}
function chooseChallenges() {
  const pool = (BANK[state.theme] || []).slice();
  const count = Math.min(challengeCount(), pool.length);
  return pool.slice(0, count);
}
function labelForItem(item){
  const map = {
    badge_key:'Badge-clé', cipher_disk:'Disque chiffré', clue_note:'Note d’indice', kan_segment:'Segment KAN', decoded_file:'Dossier décodé',
    totem_order:'Ordre des totems', glyph_piece:'Fragment de glyphe', ritual_key:'Clé rituelle', rune_word:'Mot rune', temple_key:'Clé du temple',
    circuit_map:'Plan de circuit', code_slice:'Tranche de code', service_access:'Accès service', safe_word:'Mot SAFE', master_code:'Code maître'
  };
  return map[item] || item;
}
function iconForItem(item){
  const map = {
    badge_key:'🔑', cipher_disk:'💾', clue_note:'📝', kan_segment:'🧬', decoded_file:'📁',
    totem_order:'🗿', glyph_piece:'🧩', ritual_key:'🔐', rune_word:'📜', temple_key:'🏺',
    circuit_map:'⚡', code_slice:'🧾', service_access:'🪪', safe_word:'🛡️', master_code:'💠'
  };
  return map[item] || '📦';
}

function renderAdmin() {
  setTheme();
  const theme = THEMES[state.theme || ''];
  APP.innerHTML = `
    <div class="hero">
      <div><img src="./assets/logo.png" class="hero-logo" alt="logo"></div>
      <div>
        <div class="kicker">FAFATRAINING</div>
        <h1>GAME ARENA</h1>
        <div class="subtitle">${theme.subtitle}</div>
        <div class="notice"><strong>Ce que tu prépares ici :</strong><br>une expérience d’escape game numérique pensée comme un vrai jeu d’évasion : équipes, rotation des joueurs, ambiance, pression, indices, pièges et montée en intensité jusqu’au final.</div>
        ${state.theme ? `<div class="notice"><strong>Mission choisie :</strong><br>${THEMES[state.theme].mission}</div>` : ''}
      </div>
      <div class="stats">
        <div class="stat a"><strong>${state.teamCount || '—'}</strong><span>équipes</span></div>
        <div class="stat b"><strong>${state.totalPlayers || '—'}</strong><span>joueurs</span></div>
        <div class="stat c"><strong>${state.difficulty || '—'}</strong><span>difficulté</span></div>
        <div class="stat d"><strong>${state.duration ? Number(state.duration)/60+' min' : '—'}</strong><span>durée</span></div>
      </div>
    </div>

    <section class="panel">
      <h2>Administration de mission</h2>
      <div class="grid4">
        <div><label>Thème</label><select id="theme">
          <option value="">Choisir</option>
          <option value="night" ${state.theme==='night'?'selected':''}>Night Protocol</option>
          <option value="jungle" ${state.theme==='jungle'?'selected':''}>Expédition interdite</option>
          <option value="lab" ${state.theme==='lab'?'selected':''}>Zone 13</option>
        </select></div>
        <div><label>Nombre total de joueurs</label><input id="totalPlayers" type="number" min="2" placeholder="Ex : 22" value="${state.totalPlayers || ''}"></div>
        <div><label>Nombre d’équipes</label><select id="teamCount">
          <option value="">Choisir</option>
          ${[2,3,4,5,6].map(n=>`<option value="${n}" ${String(state.teamCount)===String(n)?'selected':''}>${n} équipes</option>`).join('')}
        </select></div>
        <div><label>Type de public</label><select id="publicType">
          <option value="">Choisir</option>
          <option value="enfants" ${state.publicType==='enfants'?'selected':''}>Enfants</option>
          <option value="ados" ${state.publicType==='ados'?'selected':''}>Ados</option>
          <option value="adultes" ${state.publicType==='adultes'?'selected':''}>Adultes</option>
        </select></div>
      </div>
      <div class="grid3" style="margin-top:14px">
        <div><label>Difficulté</label><select id="difficulty">
          <option value="">Choisir</option>
          <option value="facile" ${state.difficulty==='facile'?'selected':''}>Facile</option>
          <option value="moyen" ${state.difficulty==='moyen'?'selected':''}>Moyen</option>
          <option value="difficile" ${state.difficulty==='difficile'?'selected':''}>Difficile</option>
          <option value="extreme" ${state.difficulty==='extreme'?'selected':''}>Extrême</option>
        </select></div>
        <div><label>Durée</label><select id="duration">
          <option value="">Choisir</option>
          <option value="1800" ${String(state.duration)==='1800'?'selected':''}>30 min</option>
          <option value="2700" ${String(state.duration)==='2700'?'selected':''}>45 min</option>
          <option value="3600" ${String(state.duration)==='3600'?'selected':''}>60 min</option>
          <option value="5400" ${String(state.duration)==='5400'?'selected':''}>90 min</option>
          <option value="7200" ${String(state.duration)==='7200'?'selected':''}>120 min</option>
        </select></div>
        <div><label>Nombre d’épreuves auto</label><input disabled value="${ready() ? challengeCount() + ' épreuves' : 'à définir'}"></div>
      </div>
      <div class="grid2" style="margin-top:14px">
        <div><label>Son</label><select id="soundMode">
          <option value="on" ${state.soundMode==='on'?'selected':''}>Activé automatiquement</option>
          <option value="off" ${state.soundMode==='off'?'selected':''}>Coupé</option>
        </select></div>
        <div><label>Mode image d’indice</label><input disabled value="affichée seulement quand elle sert vraiment"></div>
      </div>
      <div class="summary-grid" style="margin-top:14px">
        <div class="card"><h4>Répartition auto</h4><div>${autoDistribution()}</div></div>
        <div class="card"><h4>Niveau attendu</h4><div>${state.difficulty || 'à définir'}</div></div>
        <div class="card"><h4>Variété disponible</h4><div>${state.theme ? `${(BANK[state.theme]||[]).length} systèmes disponibles` : 'à définir'}</div></div>
        <div class="card"><h4>Musique</h4><div>${state.soundMode==='off' ? 'coupée' : 'activée au lancement'}</div></div>
      </div>
      <div class="btns">
        <button class="btn-main" onclick="generateTeamsFromForm()">GÉNÉRER LES ÉQUIPES</button>
        <button class="btn-alt" onclick="resetAll()">RÉINITIALISER</button>
      </div>
      <div id="teamsEditor"></div>
    </section>`;
}
function readAdminForm() {
  state.theme = document.getElementById('theme').value;
  state.totalPlayers = document.getElementById('totalPlayers').value;
  state.teamCount = document.getElementById('teamCount').value;
  state.publicType = document.getElementById('publicType').value;
  state.difficulty = document.getElementById('difficulty').value;
  state.duration = document.getElementById('duration').value;
  state.soundMode = document.getElementById('soundMode').value;
  save();
}
function generateTeamsFromForm() {
  readAdminForm();
  if (!ready()) {
    alert('Remplis d’abord le thème, le nombre de joueurs, le nombre d’équipes, le public, la difficulté et la durée.');
    return;
  }
  const total = Number(state.totalPlayers), teams = Number(state.teamCount), suggested = Math.ceil(total/teams);
  state.teams = Array.from({length:teams}, (_,i)=>({name:`Équipe ${i+1}`, players:Array.from({length:suggested}, ()=>''), score:0, progress:0}));
  save();
  renderAdmin();
  document.getElementById('teamsEditor').innerHTML = `
    <div class="notice"><strong>Répartition cible :</strong> ${autoDistribution()}</div>
    <div class="team-grid">
      ${state.teams.map((team,i)=>`
        <div class="team-card">
          <h4>Équipe ${i+1}</h4>
          <label>Nom d’équipe</label>
          <input id="teamName_${i}" value="${team.name}">
          <label style="margin-top:8px">Joueurs (un par ligne)</label>
          <textarea id="teamPlayers_${i}" placeholder="Nom 1&#10;Nom 2&#10;Nom 3">${team.players.join('\n')}</textarea>
        </div>`).join('')}
    </div>
    <div class="btns"><button class="btn-main" onclick="launchMission()">LANCER LA MISSION</button></div>`;
}
function launchMission() {
  if (!state.teams.length) { alert('Génère d’abord les équipes.'); return; }
  autoEnableSound();
  state.teams = state.teams.map((team,i)=>({
    name: document.getElementById(`teamName_${i}`)?.value?.trim() || `Équipe ${i+1}`,
    players: (document.getElementById(`teamPlayers_${i}`)?.value || '').split('\n').map(x=>x.trim()).filter(Boolean),
    score:0, progress:0
  }));
  state.hints=0; state.time=Number(state.duration); state.index=0; state.activeTeam=0; state.fragments=[]; state.selectedChallenges=chooseChallenges(); state.timerActive=false; state.picked=null; state.attempts=0; state.showVisual=true; state.inventory=[]; state.selectedItem=null; state.dragOrder=[]; state.decoderValue=[]; state.combineSelection=[];
  save();
  location.hash='#admin-intro';
  renderRoute();
}
function showIntro(isPlayer=false) {
  const theme = THEMES[state.theme];
  playFile('glitch');
  APP.innerHTML = `<section class="cinematic"><div class="cinematic-box"><div class="kicker">OUVERTURE CINÉMATIQUE</div><h1>ACCÈS MISSION</h1><div class="notice"><strong>Brief de mission :</strong><br>${theme.mission}</div><div class="notice"><strong>Important :</strong><br>le chrono part dès que tu entres dans la première épreuve.</div><div id="cineBox"></div><div class="btns"><button class="btn-alt" onclick="location.hash='#admin';renderRoute();">RETOUR ACCUEIL</button><button class="btn-main hidden" id="introBtn" onclick="${isPlayer ? 'goPlayer()' : 'goAdmin()'}">ENTRER DANS LA PREMIÈRE ÉPREUVE</button></div></div></section>`;
  let i=0; const box=document.getElementById('cineBox');
  function step() {
    if (i < theme.intro.length) {
      box.innerHTML += `<div class="cine-line fadein">${theme.intro[i]}</div>`;
      playFile('glitch');
      i++;
      setTimeout(step, 900);
    } else {
      document.getElementById('introBtn').classList.remove('hidden');
    }
  }
  step();
}
function startTicking() {
  if (state.timerActive) return;
  state.timerActive = true;
  save();
  startThemeMusic();
  syncTimerBadge();
  const tick = () => {
    const raw = localStorage.getItem('fafa_v17');
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.assign(state, parsed);
      soundEnabled = !!parsed.soundEnabled;
    }
    if (!state.timerActive) return;
    state.time = Math.max(0, Number(state.time) - 1);
    if (state.time === 45 || state.time === 30 || state.time === 15) playFile('tension');
    save();
    syncTimerBadge();
    if (state.time <= 0) {
      state.timerActive = false;
      save();
      finishMission(true);
      return;
    }
    setTimeout(tick, 1000);
  };
  setTimeout(tick, 1000);
}
function goAdmin() { startTicking(); renderAdminPlay(); }
function goPlayer() { startTicking(); renderPlayer(); }
function stopIfHome(){ stopThemeMusic(); }

function renderInventory() {
  const items = state.inventory.length ? state.inventory : ['vide','vide','vide','vide'];
  return `<section class="panel studio-systems">
    <h3>Inventaire réel</h3>
    <div class="inventory-bar">
      ${items.slice(0,6).map(item=>{
        const isEmpty = item==='vide';
        const selected = state.selectedItem===item && !isEmpty;
        return `<button class="inv-slot ${selected?'selected':''}" onclick="${isEmpty?'':'selectInventoryItem(\''+item+'\')'}">${isEmpty?'—':iconForItem(item)}<span>${isEmpty?'Emplacement vide':labelForItem(item)}</span></button>`;
      }).join('')}
    </div>
    <div class="notice"><strong>Objet sélectionné :</strong> ${state.selectedItem ? labelForItem(state.selectedItem) : 'aucun'}</div>
  </section>`;
}
function selectInventoryItem(item){
  state.selectedItem = state.selectedItem===item ? null : item;
  save();
  location.hash === '#admin-play' ? renderAdminPlay() : renderPlayer();
}
function renderDragOrder(ch){
  const list = state.dragOrder.length ? state.dragOrder : ch.items.slice();
  return `<div class="drag-wrap"><div class="notice"><strong>Drag & drop tactique :</strong> utilise ↑ et ↓ pour replacer les éléments dans le bon ordre.</div><div class="drag-list">
    ${list.map((x,i)=>`<div class="drag-item"><span>${x}</span><div class="drag-actions"><button class="sys-btn" onclick="moveDragItem(${i},-1)">↑</button><button class="sys-btn" onclick="moveDragItem(${i},1)">↓</button></div></div>`).join('')}
  </div></div>`;
}
function moveDragItem(i, delta){
  const ch = state.selectedChallenges[state.index];
  if(!state.dragOrder.length) state.dragOrder = ch.items.slice();
  const j = i + delta;
  if(j < 0 || j >= state.dragOrder.length) return;
  const arr = state.dragOrder.slice();
  [arr[i], arr[j]] = [arr[j], arr[i]];
  state.dragOrder = arr;
  save();
  location.hash === '#admin-play' ? renderAdminPlay() : renderPlayer();
}
function renderSpotPick(ch){
  return `<div class="choice-grid">${ch.zones.map(zone=>`<button class="choice ${state.picked===zone?'selected':''}" onclick="pickText(\'${zone}\', this)">${zone}</button>`).join('')}</div>`;
}
function pickText(value, el){
  document.querySelectorAll('.choice').forEach(x=>x.classList.remove('selected'));
  el.classList.add('selected');
  state.picked = value;
}
function renderUseItem(ch){
  return `${renderInventory()}<div class="notice"><strong>But :</strong> sélectionne le bon objet de l’inventaire puis valide.</div>`;
}
function renderCombine(ch){
  const selected = state.combineSelection || [];
  return `${renderInventory()}<div class="notice"><strong>Combinaison :</strong> choisis deux objets dans l’inventaire.</div><div class="combo-line">${selected.map(labelForItem).join(' + ') || 'Aucune combinaison en cours'}</div><div class="btns"><button class="btn-alt" onclick="captureCombine()">AJOUTER L’OBJET SÉLECTIONNÉ</button><button class="btn-alt" onclick="resetCombine()">RÉINITIALISER LA COMBINAISON</button></div>`;
}
function captureCombine(){
  if(!state.selectedItem) return;
  if(!state.combineSelection) state.combineSelection = [];
  if(state.combineSelection.includes(state.selectedItem)) return;
  if(state.combineSelection.length >= 2) return;
  state.combineSelection.push(state.selectedItem);
  save();
  location.hash === '#admin-play' ? renderAdminPlay() : renderPlayer();
}
function resetCombine(){
  state.combineSelection = [];
  save();
  location.hash === '#admin-play' ? renderAdminPlay() : renderPlayer();
}
function renderDecoder(ch){
  const value = state.decoderValue.length ? state.decoderValue : ch.wheels.slice();
  return `<div class="decoder-wrap"><div class="decoder-row">${value.map((x,i)=>`<div class="decoder-wheel"><div class="decoder-char">${x}</div><div class="drag-actions"><button class="sys-btn" onclick="rotateDecoder(${i},1)">+</button><button class="sys-btn" onclick="rotateDecoder(${i},-1)">-</button></div></div>`).join('')}</div></div>`;
}
function rotateDecoder(i, delta){
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const ch = state.selectedChallenges[state.index];
  if(!state.decoderValue.length) state.decoderValue = ch.wheels.slice();
  let cur = state.decoderValue[i] || 'A';
  let idx = alphabet.indexOf(cur);
  idx = (idx + delta + alphabet.length) % alphabet.length;
  state.decoderValue[i] = alphabet[idx];
  save();
  location.hash === '#admin-play' ? renderAdminPlay() : renderPlayer();
}
function renderChoice(ch){
  return `<div class="choice-grid">${ch.choices.map(choice=>`<button class="choice ${state.picked===choice?'selected':''}" onclick="pickText(\'${choice}\', this)">${choice}</button>`).join('')}</div>`;
}
function visualBlock(c) {
  if(!c.visual || !c.visualNeeded || !state.showVisual) return '';
  return `<div class="visual small"><img src="./assets/${c.visual}" alt="${c.visual}"><div class="challenge-sub">Indice visuel utile pour résoudre cette épreuve</div></div>`;
}
function renderFunctionalModule(c){
  if(c.type==='drag_order') return renderDragOrder(c);
  if(c.type==='spot_pick') return renderSpotPick(c);
  if(c.type==='use_item') return renderUseItem(c);
  if(c.type==='combine') return renderCombine(c);
  if(c.type==='decoder') return renderDecoder(c);
  if(c.type==='choice' || c.type==='boss') return renderChoice(c);
  return '';
}
function renderChallenge(showAdmin) {
  const c = state.selectedChallenges[state.index];
  const main = `
    <section class="game-shell fadein">
      <div class="hud">
        <div class="hud-left">
          <div class="badge points">${currentTeam().name} · ${currentTeam().score} pts</div>
          <div class="badge meta">Épreuve ${state.index+1}/${state.selectedChallenges.length}</div>
          <div class="badge meta">${c.label}</div>
        </div>
        <div class="hud-right"><div id="live-timer" class="badge timer timer-live ${timerColor()}">⏱ ${fmt(state.time)}</div></div>
      </div>
      <div class="turn">🔥 C’EST À : ${currentPlayer()} DE JOUER</div>
      <div class="rules"><strong>Règle :</strong> lis la scène, résous le système proposé, puis utilise une aide seulement si nécessaire.</div>
      <div class="story">${c.scene}</div>
      <div class="help-floating"><button class="help-pill help-aide" onclick="useHint(1)">AIDE</button><button class="help-pill help-bonus" onclick="useHint(2)">BONUS</button><button class="help-pill help-info" onclick="showFree()">INDICE</button></div>
      <h2 class="challenge-title">${c.title}</h2>
      <div class="challenge-sub">Type d’épreuve : ${c.label}</div>
      ${c.visual && c.visualNeeded ? `<div class="visual-toggle"><button class="btn-alt" onclick="toggleVisual()">${state.showVisual ? 'MASQUER L’INDICE VISUEL' : 'AFFICHER L’INDICE VISUEL'}</button></div>` : ''}
      ${visualBlock(c)}
      <div class="story"><strong>Objectif :</strong><br>${c.prompt}</div>
      <div id="freeSlot"></div>
      ${renderFunctionalModule(c)}
      <div id="feedback"></div>
    </section>`;
  APP.innerHTML = `<div class="game-layout">${main}</div><div class="validate-bar"><button class="validate-btn" onclick="validate(${showAdmin})">VALIDER LA RÉPONSE</button></div>`;
  syncTimerBadge();
}
function renderAdminPlay() {
  if (state.index >= state.selectedChallenges.length) { finishMission(false); return; }
  renderChallenge(true);
}
function renderPlayer() {
  if (state.index >= state.selectedChallenges.length) { finishMission(false); return; }
  renderChallenge(false);
}
function toggleVisual() {
  state.showVisual = !state.showVisual;
  save();
  location.hash === '#admin-play' ? renderAdminPlay() : renderPlayer();
}
function showFree() {
  const c=state.selectedChallenges[state.index];
  document.getElementById('freeSlot').innerHTML = `<div class="freeclue"><strong>Indice discret :</strong><br>${c.exp}</div>`;
}
function useHint(level) {
  const c=state.selectedChallenges[state.index];
  state.hints++;
  currentTeam().score = Math.max(0, currentTeam().score - (level===1 ? 40 : 90));
  document.getElementById('feedback').innerHTML = `<div class="feedback help"><strong>${level===1 ? 'Carte aide' : 'Carte bonus'}</strong><br>${c.exp}</div>`;
  save();
}
function isCorrectForChallenge(c){
  if(c.type==='drag_order'){
    const arr = state.dragOrder.length ? state.dragOrder : c.items.slice();
    return JSON.stringify(arr) === JSON.stringify(c.correct);
  }
  if(c.type==='spot_pick' || c.type==='choice' || c.type==='boss'){
    return state.picked === c.answer;
  }
  if(c.type==='use_item'){
    return state.selectedItem === c.requiredItem;
  }
  if(c.type==='combine'){
    const current = (state.combineSelection||[]).slice().sort();
    const target = c.combo.slice().sort();
    return JSON.stringify(current) === JSON.stringify(target);
  }
  if(c.type==='decoder'){
    const current = (state.decoderValue.length ? state.decoderValue : c.wheels).join('');
    return current.toUpperCase() === c.answer.toUpperCase();
  }
  return false;
}
function grantReward(c){
  if(c.reward && !state.inventory.includes(c.reward)) state.inventory.push(c.reward);
}
function validate(showAdmin) {
  const c = state.selectedChallenges[state.index];
  const ok = isCorrectForChallenge(c);
  const shell = document.querySelector('.game-shell');
  if (ok) {
    currentTeam().score += 160;
    currentTeam().progress = Math.max(currentTeam().progress, state.index+1);
    state.fragments.push(c.fragment);
    grantReward(c);
    playFile('ok');
    shell.classList.remove('flash-bad'); shell.classList.add('flash-good');
    document.getElementById('feedback').innerHTML = `<div class="feedback ok"><strong>✅ Bonne réponse.</strong><br><strong>Explication :</strong> ${c.exp}<br><br>${c.reward ? `<strong>Objet gagné :</strong> ${labelForItem(c.reward)}<br><br>` : ''}<strong>Fragment obtenu :</strong> ${c.fragment}</div><div class="btns"><button class="btn-main" onclick="nextChallenge(${showAdmin})">ÉPREUVE SUIVANTE</button></div>`;
  } else {
    state.attempts++;
    playFile('bad');
    shell.classList.remove('flash-good'); shell.classList.add('flash-bad');
    if (state.attempts < 2) {
      currentTeam().score = Math.max(0, currentTeam().score - 40);
      document.getElementById('feedback').innerHTML = `<div class="feedback bad"><strong>❌ Mauvaise piste.</strong><br>Tu peux corriger et tenter une seconde fois avant la sanction finale.<br><br><span class="small">Pénalité : -40 points.</span></div>`;
    } else {
      currentTeam().score = Math.max(0, currentTeam().score - 80);
      document.getElementById('feedback').innerHTML = `<div class="feedback bad"><strong>💥 Défi perdu.</strong><br>${c.exp}</div><div class="btns"><button class="btn-main" onclick="nextChallenge(${showAdmin})">ÉPREUVE SUIVANTE</button></div>`;
    }
  }
  save();
}
function nextChallenge(showAdmin) {
  currentTeam().progress = Math.max(currentTeam().progress, state.index+1);
  state.index++;
  state.activeTeam = (state.activeTeam + 1) % state.teams.length;
  state.attempts = 0;
  state.picked = null;
  state.dragOrder = [];
  state.decoderValue = [];
  state.combineSelection = [];
  state.selectedItem = null;
  save();
  showAdmin ? renderAdminPlay() : renderPlayer();
}
function finishMission(timeout) {
  stopThemeMusic();
  state.timerActive = false;
  save();
  const ranking = [...state.teams].sort((a,b)=>b.score-a.score);
  APP.innerHTML = `
    <section class="panel"><div class="wow-banner"><div class="wow-title">MISSION FERMÉE</div><div class="small">${state.theme==='night'?'Night Protocol':state.theme==='jungle'?'Expédition interdite':'Zone 13'}</div></div></section>
    <section class="final-card">
      <div class="big-score">${ranking[0]?.score || 0} pts</div>
      <p><strong>${ranking[0]?.name || 'Aucune équipe'}</strong> remporte la mission.</p>
      <p>${timeout ? 'Le chrono a forcé la fermeture de la partie.' : 'La mission se termine avec une vraie sensation de fin, un classement clair et une ambiance plus nette.'}</p>
      <div class="notice"><strong>Inventaire final :</strong> ${state.inventory.length ? state.inventory.map(labelForItem).join(' · ') : 'aucun objet conservé'}</div>
      <div class="preview-grid" style="margin-top:14px">${ranking.map((team,idx)=>`<div class="card"><h4>${idx+1}. ${team.name}</h4>Score : ${team.score} pts<br>Progression : ${team.progress}/${state.selectedChallenges.length}<br>Joueurs : ${team.players.filter(Boolean).length}</div>`).join('')}</div>
      <div class="btns"><button class="btn-main" onclick="resetAll()">RETOUR ACCUEIL</button></div>
    </section>`;
}
function resetAll() {
  clearStore();
  soundEnabled = false;
  state = {
    theme:'', totalPlayers:'', teamCount:'', publicType:'', difficulty:'', duration:'',
    teams:[], activeTeam:0, hints:0, time:0, index:0, picked:null, attempts:0,
    selectedChallenges:[], fragments:[], timerActive:false, showVisual:true,
    soundMode:'on', inventory:[], selectedItem:null, dragOrder:[], decoderValue:[], combineSelection:[]
  };
  location.hash = '#admin';
  renderRoute();
}
function renderRoute() {
  load();
  setTheme();
  const r = location.hash || '#admin';
  if (r.startsWith('#team-')) {
    if (!state.selectedChallenges.length) { stopThemeMusic(); renderAdmin(); return; }
    stopThemeMusic();
    showIntro(true);
    return;
  }
  if (r === '#admin-intro') {
    stopThemeMusic();
    showIntro(false);
    return;
  }
  if (r === '#admin-play') {
    if (!state.selectedChallenges.length) { stopThemeMusic(); renderAdmin(); return; }
    renderAdminPlay();
    return;
  }
  stopThemeMusic();
  renderAdmin();
}
function resizeRain() {
  RAIN.width = innerWidth;
  RAIN.height = innerHeight;
}
let drops = [];
function initRain() {
  resizeRain();
  drops = Array.from({length:180}, ()=>({x:Math.random()*RAIN.width, y:Math.random()*RAIN.height, l:10+Math.random()*18, v:6+Math.random()*8}));
}
function drawRain() {
  CTX.clearRect(0,0,RAIN.width,RAIN.height);
  CTX.strokeStyle='rgba(114,204,255,.35)';
  CTX.lineWidth=1;
  CTX.beginPath();
  for (const d of drops) {
    CTX.moveTo(d.x,d.y);
    CTX.lineTo(d.x-4,d.y+d.l);
    d.y += d.v; d.x -= .6;
    if (d.y>RAIN.height || d.x<-20) { d.x=Math.random()*RAIN.width+40; d.y=-20; }
  }
  CTX.stroke();
  requestAnimationFrame(drawRain);
}
window.addEventListener('hashchange', renderRoute);
window.addEventListener('resize', resizeRain);
initRain();
drawRain();
renderRoute();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', ()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
