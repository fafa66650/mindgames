
const qs=s=>document.querySelector(s), qsa=s=>[...document.querySelectorAll(s)];
let GAMES=[], PACKS={}, PICKS=[], RUN=null, AMBIENCE=null;

const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

async function loadData(){
  GAMES = await fetch('./data/games.json').then(r=>r.json());
  for(const g of GAMES){
    for(const level of ['easy','medium','hard']){
      const key = `${g.key}_${level}`;
      PACKS[key] = await fetch(`./data/${key}.json`).then(r=>r.json());
    }
  }
}
function store(){ return JSON.parse(localStorage.getItem('fafa_stable_modules_v4') || '{"sessions":{}}'); }
function save(v){ localStorage.setItem('fafa_stable_modules_v4', JSON.stringify(v)); }
function gameByKey(k){ return GAMES.find(g=>g.key===k); }

function ageLabel(a){ return a==='kids' ? 'Enfant' : a==='teens' ? 'Ado' : 'Adulte'; }
function scoreBase(){
  const diff = qs('#difficulty')?.value || 'moyen';
  const age = qs('#ageSelect')?.value || 'teens';
  const game = gameByKey(qs('#gameSelect')?.value || GAMES[0].key);
  let base = game.key==='domination_nocturne' ? 1200 : 1180;
  if(diff==='facile') base -= 120;
  if(diff==='difficile') base += 160;
  if(age==='kids') base -= 80;
  if(age==='adults') base += 40;
  return base;
}
function difficultyPack(session){
  if(session.difficulty==='difficile' || session.age==='adults') return 'hard';
  if(session.difficulty==='facile' || session.age==='kids') return 'easy';
  return 'medium';
}
function durationCount(duration){
  if(duration <= 30) return 4;
  if(duration <= 45) return 5;
  if(duration <= 60) return 5;
  if(duration <= 90) return 5;
  return 5;
}
function participantsBreakdown(total, teams){
  if(!total || !teams) return 'À définir';
  const base = Math.floor(total / teams);
  const rest = total % teams;
  if(rest === 0) return `${teams} équipes de ${base}`;
  return `${rest} équipes de ${base+1} · ${teams-rest} équipes de ${base}`;
}

function playTone(type='ok'){
  try{
    const c=new(window.AudioContext||window.webkitAudioContext)();
    const o=c.createOscillator(), g=c.createGain();
    o.connect(g); g.connect(c.destination);
    o.frequency.value = type==='ok' ? 690 : type==='bad' ? 190 : type==='start' ? 520 : 420;
    g.gain.value = 0.03;
    o.start(); o.stop(c.currentTime + .16);
  }catch(e){}
}
function stopAmbience(){
  if(AMBIENCE){
    try{ AMBIENCE.osc.stop(); }catch(e){}
    AMBIENCE = null;
  }
}
function startAmbience(theme){
  stopAmbience();
  try{
    const c = new(window.AudioContext||window.webkitAudioContext)();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = theme==='nocturne' ? 'triangle' : 'sine';
    osc.frequency.value = theme==='nocturne' ? 110 : 180;
    gain.gain.value = 0.01;
    osc.start();
    AMBIENCE = {osc,gain};
  }catch(e){}
}

function renderHome(){
  qs('#app').innerHTML = `
  <div class="hero">
    <div><img src="./assets/logo.jpeg" class="hero-logo" alt="FAFATRAINING"></div>
    <div>
      <div class="kicker">FAFATRAINING GAME ARENA</div>
      <h1>ENTRE DANS LE JEU.</h1>
      <div class="subtitle">Deux univers plus lisibles, plus stylés et plus immersifs. Chaque mode a sa propre histoire, sa propre tension et sa propre manière de défier l’équipe.</div>
    </div>
    <div class="hero-stats">
      <div class="stat green"><strong>2</strong><span>univers stables</span></div>
      <div class="stat blue"><strong>10</strong><span>défis variés</span></div>
      <div class="stat pink"><strong>mood</strong><span>sons & ambiance</span></div>
      <div class="stat gold"><strong>v3</strong><span>base renforcée</span></div>
    </div>
  </div>
  <div class="tabs">
    <button class="tab active" onclick="showAdmin()">Administrateur</button>
    <button class="tab" onclick="showManualEntry()">Jouer</button>
    <button class="tab" onclick="showInfo()">Notes</button>
  </div>
  <div id="main"></div>`;
  showAdmin();
}
function setTab(name){ qsa('.tab').forEach(b=>b.classList.toggle('active', b.textContent.trim()===name)); }

function showAdmin(){
  setTab('Administrateur');
  qs('#main').innerHTML = `
  <section class="panel">
    <h2 class="section-title">Préparer une session</h2>
    <div class="notice">Préparation rangée, claire et utile. Le score de départ s’adapte au jeu, à la difficulté et à l’âge. Le nombre total de participants permet une répartition automatique des équipes.</div>
    <div class="grid4">
      <div><label>Nom de session</label><input id="sessionName" value="Session Arena"></div>
      <div><label>Univers / mode</label><select id="gameSelect" onchange="previewGame();updateScore();updateSessionMeta()">${GAMES.map(g=>`<option value="${g.key}">${g.title}</option>`).join('')}</select></div>
      <div><label>Âge</label><select id="ageSelect" onchange="updateScore();updateSessionMeta()"><option value="kids">Enfant</option><option value="teens" selected>Ado</option><option value="adults">Adulte</option></select></div>
      <div><label>Durée</label><select id="duration" onchange="updateSessionMeta()"><option value="30">30 min</option><option value="45" selected>45 min</option><option value="60">60 min</option><option value="90">90 min</option><option value="120">120 min</option></select></div>
    </div>
    <div class="grid4" style="margin-top:14px">
      <div><label>Difficulté</label><select id="difficulty" onchange="updateScore();updateSessionMeta()"><option value="facile">Accessible</option><option value="moyen" selected>Équilibré</option><option value="difficile">Challenge</option></select></div>
      <div><label>Nombre d’équipes</label><select id="teamCount" onchange="renderTeams();updateSessionMeta()"><option value="2">2 équipes</option><option value="3" selected>3 équipes</option><option value="4">4 équipes</option><option value="5">5 équipes</option><option value="6">6 équipes</option></select></div>
      <div><label>Participants au total</label><input id="participantsTotal" type="number" min="2" value="18" oninput="renderTeams();updateSessionMeta()"></div>
      <div><label>Score de départ auto</label><input id="baseScore" disabled value="1250"><div class="hint-text">Calculé selon jeu + difficulté + âge.</div></div>
    </div>
    <div class="grid2" style="margin-top:14px">
      <div><label>Répartition automatique</label><input id="playersHint" disabled value="À définir"></div>
      <div><label>Mode</label><input disabled value="Compétitif immersif"></div>
    </div>
    <div id="gamePreview"></div>
    <div class="notice">Nom, code et nombre estimé de joueurs par équipe : tout est modifiable si tu veux ajuster manuellement.</div>
    <div id="teamsBox"></div>
    <div class="btns"><button class="btn main" onclick="createSession()">Créer la session</button></div>
    <div id="sessionOutput"></div>
  </section>`;
  renderTeams(); updateScore(); updateSessionMeta(); previewGame();
}
function renderTeams(){
  const n = Number(qs('#teamCount')?.value || 3);
  const total = Number(qs('#participantsTotal')?.value || 0);
  const defs = ['ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT'];
  const base = n ? Math.floor(total / n) : 0;
  const rest = n ? total % n : 0;
  qs('#teamsBox').innerHTML = `<div class="grid3">${
    Array.from({length:n},(_,i)=>{
      const suggested = total ? (i < rest ? base+1 : base) : '';
      return `<div class="card">
        <div class="pills"><span class="pill">Équipe ${i+1}</span>${suggested!==''?`<span class="pill">${suggested} joueurs</span>`:''}</div>
        <label>Nom d’équipe</label><input class="teamName" value="Équipe ${i+1}">
        <label style="margin-top:8px">Code</label><input class="teamCode" value="${defs[i]}">
        <label style="margin-top:8px">Joueurs prévus</label><input class="teamSuggested" value="${suggested!==''?suggested:''}" ${suggested!==''?'':'placeholder="à définir"'}>
      </div>`;
    }).join('')
  }</div>`;
}
function updateScore(){ if(qs('#baseScore')) qs('#baseScore').value = scoreBase(); }
function updateSessionMeta(){
  const teams = Number(qs('#teamCount')?.value || 3);
  const duration = Number(qs('#duration')?.value || 45);
  const total = Number(qs('#participantsTotal')?.value || 0);
  let txt = participantsBreakdown(total, teams);
  txt += ` · jusqu’à ${duration} min`;
  if(qs('#playersHint')) qs('#playersHint').value = txt;
}
function previewGame(){
  const g = gameByKey(qs('#gameSelect').value);
  qs('#gamePreview').innerHTML = `
    <div class="card" style="--accent:${g.color};margin-top:14px;background:${g.bg}">
      <div class="pills"><span class="pill">${esc(g.family)}</span><span class="pill">${esc(g.title)}</span></div>
      <h3>${esc(g.tagline)}</h3>
      <div class="small">${esc(g.intro)}</div>
    </div>`;
}
function createSession(){
  const id = 'ga-' + Date.now();
  const names = qsa('.teamName').map(x=>x.value.trim());
  const codes = qsa('.teamCode').map(x=>x.value.trim().toUpperCase());
  const sizes = qsa('.teamSuggested').map(x=>x.value.trim());
  const session = {
    id,
    name: qs('#sessionName').value.trim(),
    gameKey: qs('#gameSelect').value,
    age: qs('#ageSelect').value,
    duration: Number(qs('#duration').value),
    difficulty: qs('#difficulty').value,
    participantsTotal: Number(qs('#participantsTotal').value||0),
    baseScore: Number(qs('#baseScore').value),
    teams: names.map((n,i)=>({
      name: n || `Équipe ${i+1}`,
      code: codes[i] || `TEAM${i+1}`,
      suggestedSize: Number(sizes[i] || 0),
      players: '',
      index: 0,
      score: Number(qs('#baseScore').value),
      hints: 0
    }))
  };
  const s = store(); s.sessions[id] = session; save(s);
  const origin = location.origin && location.origin!=='null' ? location.origin + location.pathname : location.pathname;
  qs('#sessionOutput').innerHTML = `
    <div class="notice"><strong>Session créée.</strong> Tu peux ouvrir chaque équipe directement avec son lien.</div>
    <div class="cards">
      ${session.teams.map(t=>`
        <div class="card">
          <div class="pills"><span class="pill">${esc(t.name)}</span><span class="pill">${esc(t.code)}</span>${t.suggestedSize?`<span class="pill">${t.suggestedSize} joueurs</span>`:''}</div>
          <div class="small">${origin}?player=1&session=${id}&team=${encodeURIComponent(t.code)}</div>
          <div class="btns">
            <button class="btn main" onclick="navigator.clipboard.writeText('${origin}?player=1&session=${id}&team=${encodeURIComponent(t.code)}')">Copier</button>
            <button class="btn alt" onclick="window.open('${origin}?player=1&session=${id}&team=${encodeURIComponent(t.code)}','_blank')">Ouvrir</button>
          </div>
        </div>`).join('')}
    </div>`;
}

function showManualEntry(){
  setTab('Jouer');
  qs('#main').innerHTML = `<section class="panel"><h2 class="section-title">Entrée joueur</h2><div class="notice">Tu peux entrer ici avec l’identifiant de session et le code équipe si besoin.</div><div class="grid2"><div><label>ID session</label><input id="sid"></div><div><label>Code équipe</label><input id="tcode"></div></div><div class="btns"><button class="btn main" onclick="manualOpen()">Entrer</button></div></section>`;
}
function manualOpen(){
  const s = qs('#sid').value.trim(), t = qs('#tcode').value.trim();
  history.replaceState({},'',`?player=1&session=${encodeURIComponent(s)}&team=${encodeURIComponent(t)}`);
  bootPlayer();
}
function showInfo(){
  setTab('Notes');
  qs('#main').innerHTML = `<section class="panel"><h2 class="section-title">Ce build contient</h2><div class="goal-grid"><div class="goal"><h4>2 univers stables</h4><div>Domination Nocturne et Odyssée Verte avec pools par difficulté.</div></div><div class="goal"><h4>Répartition auto</h4><div>Total participants → tailles d’équipes calculées automatiquement.</div></div><div class="goal"><h4>Prochaine étape</h4><div>Étendre ce niveau à plus d’univers, plus d’images et plus d’événements.</div></div></div></section>`;
}

function currentPlayer(team, idx){
  const arr = (team.players||'').split(',').map(x=>x.trim()).filter(Boolean);
  return arr.length ? arr[idx % arr.length] : team.name;
}
function currentList(session){
  const level = difficultyPack(session);
  const key = `${session.gameKey}_${level}`;
  let list = PACKS[key] || [];
  return list.slice(0, durationCount(session.duration));
}
function bootPlayer(){
  const p = new URLSearchParams(location.search), sid = p.get('session'), code = p.get('team');
  if(!(p.get('player')==='1' && sid && code)){ renderHome(); return; }
  const s = store().sessions[sid];
  if(!s){ qs('#app').innerHTML = `<section class="panel"><div class="notice">Session introuvable.</div></section>`; return; }
  const team = s.teams.find(x=>x.code===code);
  if(!team){ qs('#app').innerHTML = `<section class="panel"><div class="notice">Équipe introuvable.</div></section>`; return; }
  const g = gameByKey(s.gameKey);
  qs('#app').innerHTML = `
    <div class="hero" style="background:${g.bg}">
      <div><img src="./assets/logo.jpeg" class="hero-logo" alt="logo"></div>
      <div><div class="kicker">${esc(g.title)}</div><h1>${esc(g.tagline)}</h1><div class="subtitle">${esc(g.intro)}</div></div>
      <div class="hero-stats">
        <div class="stat green"><strong>${esc(team.code)}</strong><span>code équipe</span></div>
        <div class="stat blue"><strong>${s.duration}</strong><span>minutes</span></div>
        <div class="stat pink"><strong>${currentList(s).length}</strong><span>défis</span></div>
        <div class="stat gold"><strong>${team.score}</strong><span>score départ</span></div>
      </div>
    </div>
    <section class="panel">
      <h2 class="section-title">Avant de commencer</h2>
      <div class="story">${esc(g.intro)}</div>
      <div class="goal-grid" style="margin-top:14px">
        <div class="goal"><h4>Objectif</h4><div>${esc(g.goal)}</div></div>
        <div class="goal"><h4>Règle utile</h4><div>${esc(g.rules)}</div></div>
        <div class="goal"><h4>Cartes Bonus</h4><div>${esc(g.help)}</div></div>
      </div>
      <div class="grid2" style="margin-top:14px">
        <div><label>Nom d’équipe</label><input id="teamNameInput" value="${esc(team.name)}"></div>
        <div><label>Joueurs (séparés par virgule)</label><input id="playersInput" value="${esc(team.players)}" placeholder="Lina, Tom, Hugo"></div>
      </div>
      <div class="btns"><button class="btn main" onclick="startGame('${sid}','${code}')">Lancer la mission</button></div>
    </section>`;
}
function startGame(sid, code){
  const s = store(), session = s.sessions[sid], team = session.teams.find(x=>x.code===code);
  team.name = qs('#teamNameInput').value.trim() || team.name;
  team.players = qs('#playersInput').value.trim();
  save(s);
  RUN = {sid,code,attempts:0};
  startAmbience(gameByKey(session.gameKey).theme);
  playTone('start');
  renderChallenge();
}
function themeEvent(key, idx){
  const map = {
    domination_nocturne:['🌧 La pluie brouille les certitudes.','⚠️ Une autre équipe accélère peut-être déjà.','🌘 La nuit récompense les groupes les plus lucides.'],
    odyssee_verte:['🌿 Le terrain cache plus d’une issue.','🧭 Une fausse piste peut coûter cher.','✨ Une bonne lecture peut tout ouvrir.']
  };
  const arr = map[key] || ['⚡ La tension monte.'];
  return arr[idx % arr.length];
}
function renderChallenge(){
  const s = store(), session = s.sessions[RUN.sid], team = session.teams.find(x=>x.code===RUN.code), game = gameByKey(session.gameKey), list = currentList(session), c = list[team.index];
  const typeLabel = {logic:'🧠 Logique',observation:'👁 Observation',deduction:'🔐 Déduction',strategy:'⚔️ Stratégie',navigation:'🧭 Orientation',pattern:'🔁 Motif',code:'🔐 Code',choice:'🎯 Choix'}[c.kind] || 'Défi';
  const answerTag = c.multi ? ' · ✅ Plusieurs réponses' : '';
  qs('#app').innerHTML = `
    <section class="screen" style="--accent:${game.color};background:${game.bg}">
      <div class="hud">
        <div class="hud-group">
          <div class="badge points">Score : ${team.score}</div>
          <div class="badge time">Défi ${team.index+1}/${list.length}</div>
          <div class="badge event">Cartes Bonus : ${team.hints}</div>
        </div>
        <div class="hud-group"><div class="badge">${session.duration} min</div></div>
      </div>
      <div class="notice">${esc(themeEvent(session.gameKey, team.index))}</div>
      <div class="player-turn">🔥 C’EST À : ${esc(currentPlayer(team, team.index))} DE JOUER</div>
      <div class="story">${esc(c.scene)}</div>
      <h2 class="challenge-title">${esc(c.title)}</h2>
      <div class="challenge-type">${typeLabel}${answerTag}</div>
      ${c.visual ? `<div class="visual">${esc(c.visual)}</div>` : ''}
      <div class="story"><strong>Énigme :</strong><br>${esc(c.prompt)}</div>
      <div class="freeclue"><strong>Indice discret gratuit :</strong><br>${esc(c.free_clue)}</div>
      <div class="choice-grid">${c.options.map((o,i)=>`<button class="choice" onclick="pick('${['A','B','C','D'][i]}',this)">${esc(o)}</button>`).join('')}</div>
      <div class="help-grid">
        <div class="help" onclick="useHint(1)"><h4>Carte Bonus I</h4><div>Petit guidage contre une légère pénalité.</div></div>
        <div class="help" onclick="useHint(2)"><h4>Carte Bonus II</h4><div>Révélation forte contre grosse pénalité.</div></div>
        <div class="help" onclick="validateChoice()"><h4>Valider</h4><div>Confirme votre choix pour cette énigme.</div></div>
      </div>
      <div id="feedback"></div>
    </section>`;
  PICKS = [];
  RUN.attempts = 0;
}
function pick(letter, el){
  qsa('.choice').forEach(b=>b.classList.remove('selected'));
  el.classList.add('selected');
  PICKS = [letter];
}
function useHint(level){
  const s = store(), session = s.sessions[RUN.sid], team = session.teams.find(x=>x.code===RUN.code), c = currentList(session)[team.index];
  team.hints += 1;
  team.score = Math.max(0, team.score - (level===1 ? 35 : 80));
  save(s);
  playTone('hint');
  qs('#feedback').innerHTML = `<div class="feedback help"><strong>${level===1 ? 'Carte Bonus I' : 'Carte Bonus II'}</strong><br>${esc(level===1 ? c.help1 : c.help2)}</div>`;
}
function validateChoice(){
  const s = store(), session = s.sessions[RUN.sid], team = session.teams.find(x=>x.code===RUN.code), c = currentList(session)[team.index];
  if(!PICKS.length){
    qs('#feedback').innerHTML = `<div class="feedback bad">Choisis d’abord une réponse.</div>`;
    return;
  }
  const ok = PICKS[0] === c.answer;
  const last = team.index >= currentList(session).length - 1;
  if(ok){
    team.score += 120;
    save(s);
    playTone('ok');
    qs('#feedback').innerHTML = `<div class="feedback ok"><strong>Excellent choix.</strong><br>${esc(c.explanation)}<br><br><strong>${esc(c.bonus)}</strong></div><div class="btns"><button class="btn main" onclick="${last?'finishRun()':'nextChallenge()'}">${last?'Voir le résultat':'Défi suivant'}</button></div>`;
  } else {
    RUN.attempts += 1;
    playTone('bad');
    if(RUN.attempts < 2){
      team.score = Math.max(0, team.score - 40);
      save(s);
      qs('#feedback').innerHTML = `<div class="feedback bad"><strong>Mauvaise piste.</strong><br>Tu as encore une chance. Relis vraiment la scène, exploite l’indice discret et corrige ta lecture avant de valider à nouveau.<br><br><span class="small">Pénalité légère : -40 points.</span></div>`;
    } else {
      team.score = Math.max(0, team.score - 80);
      save(s);
      qs('#feedback').innerHTML = `<div class="feedback bad"><strong>Défi perdu.</strong><br>Bonne réponse : <strong>${esc(c.answer)}</strong>.<br>${esc(c.explanation)}<br><br><span class="small">Vous passez au défi suivant. Aucun retour arrière possible.</span></div><div class="btns"><button class="btn main" onclick="${last?'finishRun()':'nextChallenge()'}">${last?'Voir le résultat':'Défi suivant'}</button></div>`;
    }
  }
}
function nextChallenge(){
  const s = store(), session = s.sessions[RUN.sid], team = session.teams.find(x=>x.code===RUN.code);
  team.index += 1;
  save(s);
  renderChallenge();
}
function finishRun(){
  stopAmbience();
  const s = store(), session = s.sessions[RUN.sid], team = session.teams.find(x=>x.code===RUN.code);
  const mention = team.score >= 1700 ? 'Domination totale' : team.score >= 1450 ? 'Percée magistrale' : team.score >= 1200 ? 'Mission tenue' : 'Survie sous pression';
  const rankStyle = team.score >= 1700 ? '👑' : team.score >= 1450 ? '🏆' : team.score >= 1200 ? '⚡' : '🌧️';
  qs('#app').innerHTML = `
    <section class="panel finale">
      <h2 class="section-title">Fin de mission</h2>
      <div class="final-card">
        <div class="big-score">${team.score} pts</div>
        <p><strong>${rankStyle} ${esc(team.name)}</strong> — ${mention}</p>
        <p>Cartes Bonus utilisées : ${team.hints}</p>
      </div>
      <div class="goal-grid" style="margin-top:16px">
        <div class="goal"><h4>Lecture du terrain</h4><div>Votre équipe a tenu la pression et su corriger ses erreurs au bon moment.</div></div>
        <div class="goal"><h4>Récompense</h4><div>Sortie renforcée, mention finale, score valorisé et fin de mission plus marquante.</div></div>
        <div class="goal"><h4>Suite</h4><div>On peut maintenant pousser plus loin : plus d’univers, plus d’images, plus d’événements et plus de surprises.</div></div>
      </div>
      <div class="btns"><button class="btn main" onclick="history.replaceState({},'',location.pathname); renderHome();">Retour accueil</button></div>
    </section>`;
}
async function init(){
  await loadData();
  const p = new URLSearchParams(location.search);
  if(p.get('player')==='1') bootPlayer();
  else renderHome();
}
init();
