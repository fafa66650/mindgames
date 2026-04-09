
const qs=s=>document.querySelector(s), qsa=s=>[...document.querySelectorAll(s)];
let GAMES=[], CHALLENGES=[], state=null, picks=[];
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

async function loadData(){
  GAMES = await fetch('./data/games.json').then(r=>r.json());
}
function store(){ return JSON.parse(localStorage.getItem('fafa_module1')||'{"sessions":{}}'); }
function save(v){ localStorage.setItem('fafa_module1', JSON.stringify(v)); }
function playTone(type='ok'){
  try{
    const c = new (window.AudioContext||window.webkitAudioContext)();
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.frequency.value = type==='ok' ? 660 : type==='bad' ? 220 : 440;
    g.gain.value = 0.03; o.start(); o.stop(c.currentTime + .15);
  }catch(e){}
}
function renderHome(){
  const g = GAMES[0];
  qs('#app').innerHTML = `
    <div class="hero">
      <div><img src="./assets/logo.png" class="hero-logo" alt="logo"></div>
      <div>
        <div class="kicker">FAFATRAINING GAME ARENA</div>
        <h1>ENTRE DANS LE JEU.</h1>
        <div class="subtitle">Module 1 propre : nouvelle structure, nouvelle esthétique, nouveau flow. Ici, on abandonne le scolaire pour une vraie mise en ambiance pluie, tension et narration dynamique.</div>
      </div>
      <div class="hero-stats">
        <div class="stat green"><strong>1</strong><span>univers refondu</span></div>
        <div class="stat blue"><strong>3</strong><span>défis variés</span></div>
        <div class="stat pink"><strong>mobile</strong><span>lisible</span></div>
        <div class="stat gold"><strong>pro</strong><span>module démo</span></div>
      </div>
    </div>
    <div class="tabs">
      <button class="tabbtn active" onclick="showAdmin()">Administrateur</button>
      <button class="tabbtn" onclick="showPlayerEntry()">Jouer</button>
      <button class="tabbtn" onclick="showNotes()">Notes module 1</button>
    </div>
    <div id="main"></div>
  `;
  showAdmin();
}
function setActive(name){ qsa('.tabbtn').forEach(b=>b.classList.toggle('active', b.textContent.trim()===name)); }
function showAdmin(){
  setActive('Administrateur');
  const g = GAMES[0];
  qs('#main').innerHTML = `
    <section class="panel">
      <h2 class="section-title">Préparer une session</h2>
      <div class="notice">Ici, tout est regroupé proprement. L’objectif n’est pas de t’assommer d’options, mais de te permettre de lancer vite une partie claire et stylée.</div>
      <div class="grid4">
        <div><label>Nom de session</label><input id="sessionName" value="Session Nocturne"></div>
        <div><label>Univers</label><input value="${esc(g.family)}" disabled></div>
        <div><label>Jeu</label><input value="${esc(g.title)}" disabled></div>
        <div><label>Durée</label><select id="duration"><option value="30">30 min</option><option value="45" selected>45 min</option><option value="60">60 min</option></select></div>
      </div>
      <div class="grid4" style="margin-top:14px">
        <div><label>Difficulté</label><select id="difficulty"><option value="facile">Accessible</option><option value="moyen" selected>Équilibré</option><option value="difficile">Challenge</option></select></div>
        <div><label>Nombre d’équipes</label><select id="teamCount" onchange="renderTeams()"><option value="2">2 équipes</option><option value="3" selected>3 équipes</option><option value="4">4 équipes</option></select></div>
        <div><label>Score de départ</label><input id="baseScore" value="1200" disabled></div>
        <div><label>Mode</label><input value="Compétitif immersif" disabled></div>
      </div>
      <div class="notice">Codes et noms d’équipes : tu peux tout personnaliser toi-même.</div>
      <div id="teamsBox"></div>
      <div class="actions">
        <button class="btn-main" onclick="createSession()">Créer la session</button>
      </div>
      <div id="sessionOutput"></div>
    </section>`;
  renderTeams();
}
function renderTeams(){
  const n = Number(qs('#teamCount')?.value || 3);
  const defaults = ['ALPHA','BRAVO','CHARLIE','DELTA'];
  qs('#teamsBox').innerHTML = `<div class="grid3">${Array.from({length:n},(_,i)=>`
    <div class="card">
      <div class="pillbar"><span class="pill">Équipe ${i+1}</span></div>
      <label>Nom d’équipe</label><input class="teamName" value="Équipe ${i+1}">
      <label style="margin-top:8px">Code</label><input class="teamCode" value="${defaults[i]}">
    </div>
  `).join('')}</div>`;
}
function createSession(){
  const sessionId = 'dn-' + Date.now();
  const names = qsa('.teamName').map(x=>x.value.trim());
  const codes = qsa('.teamCode').map(x=>x.value.trim().toUpperCase());
  const session = {
    sessionId,
    name: qs('#sessionName').value.trim(),
    duration: Number(qs('#duration').value),
    difficulty: qs('#difficulty').value,
    game: 'domination_nocturne',
    teams: names.map((n,i)=>({
      teamName:n||`Équipe ${i+1}`,
      teamCode:codes[i]||`TEAM${i+1}`,
      players:'',
      index:0,
      score:1200,
      hints:0
    }))
  };
  const s = store(); s.sessions[sessionId] = session; save(s);
  qs('#sessionOutput').innerHTML = `
    <div class="notice"><strong>Session créée.</strong> Les liens ci-dessous ouvrent directement l’entrée joueur.</div>
    <div class="links-list">
      ${session.teams.map(t=>`
        <div class="link-row">
          <strong>${esc(t.teamName)}</strong><br>
          <span class="small">${location.origin}${location.pathname}?player=1&session=${sessionId}&team=${encodeURIComponent(t.teamCode)}</span>
          <div class="actions">
            <button class="btn-main" onclick="navigator.clipboard.writeText('${location.origin}${location.pathname}?player=1&session=${sessionId}&team=${encodeURIComponent(t.teamCode)}')">Copier</button>
            <button class="btn-ghost" onclick="window.open('${location.origin}${location.pathname}?player=1&session=${sessionId}&team=${encodeURIComponent(t.teamCode)}','_blank')">Ouvrir</button>
          </div>
        </div>`).join('')}
    </div>`;
}
function showPlayerEntry(){
  setActive('Jouer');
  qs('#main').innerHTML = `
    <section class="panel">
      <h2 class="section-title">Entrée joueur</h2>
      <div class="notice">Si tu n’utilises pas un lien admin, tu peux entrer ici manuellement.</div>
      <div class="grid2">
        <div><label>ID session</label><input id="manualSession"></div>
        <div><label>Code équipe</label><input id="manualTeam"></div>
      </div>
      <div class="actions"><button class="btn-main" onclick="manualOpen()">Entrer</button></div>
    </section>`;
}
function manualOpen(){
  const s = qs('#manualSession').value.trim();
  const t = qs('#manualTeam').value.trim();
  history.replaceState({},'',`?player=1&session=${encodeURIComponent(s)}&team=${encodeURIComponent(t)}`);
  bootPlayer();
}
function showNotes(){
  setActive('Notes module 1');
  qs('#main').innerHTML = `
    <section class="panel">
      <h2 class="section-title">Ce module 1 contient déjà</h2>
      <div class="goal-grid">
        <div class="goal"><h4>Esthétique refaite</h4><div>Accueil plus propre, moins scolaire, plus premium.</div></div>
        <div class="goal"><h4>Flow admin propre</h4><div>Préparation de session rangée en blocs cohérents.</div></div>
        <div class="goal"><h4>Démo de gameplay</h4><div>3 défis vraiment différents sur le même univers.</div></div>
      </div>
      <div class="notice">La prochaine étape naturelle sera : multiplier les univers, enrichir la bibliothèque d’énigmes, ajouter les événements de match et les vrais retournements.</div>
    </section>`;
}
async function bootPlayer(){
  const p = new URLSearchParams(location.search);
  const sessionId = p.get('session'), teamCode = p.get('team');
  if(!(p.get('player')==='1' && sessionId && teamCode)){
    renderHome(); return;
  }
  const s = store().sessions[sessionId];
  if(!s){ qs('#app').innerHTML = `<section class="panel"><div class="notice">Session introuvable.</div></section>`; return; }
  const team = s.teams.find(x=>x.teamCode===teamCode);
  if(!team){ qs('#app').innerHTML = `<section class="panel"><div class="notice">Équipe introuvable.</div></section>`; return; }
  CHALLENGES = await fetch('./data/domination_nocturne.json').then(r=>r.json());
  qs('#app').innerHTML = `
    <div class="hero">
      <div><img src="./assets/logo.png" class="hero-logo" alt="logo"></div>
      <div>
        <div class="kicker">Domination Nocturne</div>
        <h1>La pluie tombe. Le village ment.</h1>
        <div class="subtitle">Module 1 : nouvelle entrée joueur, plus directe, plus lisible, plus envie de jouer.</div>
      </div>
      <div class="hero-stats">
        <div class="stat green"><strong>${esc(team.teamCode)}</strong><span>code équipe</span></div>
        <div class="stat blue"><strong>${s.duration}</strong><span>minutes</span></div>
        <div class="stat pink"><strong>3</strong><span>défis module</span></div>
        <div class="stat gold"><strong>${team.score}</strong><span>score départ</span></div>
      </div>
    </div>
    <section class="panel">
      <h2 class="section-title">Avant la mission</h2>
      <div class="story-block">${esc(gamesIntro())}</div>
      <div class="goal-grid">
        <div class="goal"><h4>Objectif</h4><div>Survivre à la pluie, lire juste, rester devant au score.</div></div>
        <div class="goal"><h4>Règle utile</h4><div>Une manche = un joueur actif, une énigme, une conséquence.</div></div>
        <div class="goal"><h4>Aides</h4><div>Un indice discret gratuit, puis 2 cartes bonus pénalisantes.</div></div>
      </div>
      <div class="grid2" style="margin-top:14px">
        <div><label>Nom d’équipe</label><input id="pTeamName" value="${esc(team.teamName)}"></div>
        <div><label>Joueurs (séparés par virgule)</label><input id="pPlayers" placeholder="Lina, Tom, Hugo" value="${esc(team.players)}"></div>
      </div>
      <div class="actions"><button class="btn-main" onclick="startRun('${sessionId}','${teamCode}')">Lancer la mission</button></div>
    </section>`;
}
function gamesIntro(){
  return "Sous la pluie, chaque erreur laisse une trace. Une équipe a déjà paniqué. Une autre prépare peut-être un piège. Vous entrez maintenant dans une version plus nerveuse, plus lisible et plus dynamique de Domination Nocturne.";
}
function startRun(sessionId, teamCode){
  const s = store();
  const session = s.sessions[sessionId];
  const team = session.teams.find(x=>x.teamCode===teamCode);
  team.teamName = qs('#pTeamName').value.trim() || team.teamName;
  team.players = qs('#pPlayers').value.trim();
  save(s);
  state = {
    sessionId, teamCode,
    score: team.score || 1200,
    challengeIndex: team.index || 0,
    hints: team.hints || 0,
    startTime: Date.now()
  };
  renderChallenge();
}
function activePlayer(team, idx){
  const arr = (team.players||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(!arr.length) return team.teamName;
  return arr[idx % arr.length];
}
function renderChallenge(){
  const s = store();
  const session = s.sessions[state.sessionId];
  const team = session.teams.find(x=>x.teamCode===state.teamCode);
  const c = CHALLENGES[state.challengeIndex];
  let typeLabel = {
    logic:'🧠 Logique',
    visual_pattern:'👁 Observation',
    deduction_code:'🔐 Code & déduction'
  }[c.kind] || 'Défi';
  const optionsHtml = c.options.map((o,i)=>`<button class="choice" onclick="pick('${['A','B','C','D'][i]}', this)">${esc(o)}</button>`).join('');
  qs('#app').innerHTML = `
    <div class="challenge">
      <div class="hud">
        <div class="hud-left">
          <div class="badge points">Score : ${state.score}</div>
          <div class="badge time">Défi ${state.challengeIndex+1} / ${CHALLENGES.length}</div>
          <div class="badge alert">Cartes bonus : ${state.hints}</div>
        </div>
        <div class="hud-right"><div class="badge">${session.duration} min</div></div>
      </div>
      <div class="focus-player">🔥 C’EST À : ${esc(activePlayer(team, state.challengeIndex))} DE JOUER</div>
      <div class="story-block">${esc(c.scene)}</div>
      <h2 class="challenge-title">${esc(c.title)}</h2>
      <div class="challenge-type">${typeLabel}</div>
      ${c.special_rule ? `<div class="notice">${esc(c.special_rule)}</div>` : ''}
      <div class="story-block"><strong>Énigme :</strong><br>${esc(c.prompt)}</div>
      ${c.symbols ? `<div class="notice" style="font-size:34px;text-align:center;letter-spacing:10px">${c.symbols.map(esc).join(' ')}</div>` : ''}
      <div class="free-clue"><strong>Indice discret gratuit :</strong><br>${esc(c.free_clue)}</div>
      <div class="choice-grid">${optionsHtml}</div>
      ${c.kind==='deduction_code' ? `<div class="help-cards">
        <div class="help-card" onclick="showHint(1)"><h4>Carte bonus I</h4><div>Petit guidage contre une légère pénalité.</div></div>
        <div class="help-card" onclick="showHint(2)"><h4>Carte bonus II</h4><div>Révélation forte contre grosse pénalité.</div></div>
        <div class="help-card" onclick="validateChoice()"><h4>Valider le choix</h4><div>Confirme la réponse sélectionnée.</div></div>
      </div>` : `<div class="help-cards">
        <div class="help-card" onclick="showHint(1)"><h4>Carte bonus I</h4><div>Petit guidage contre une légère pénalité.</div></div>
        <div class="help-card" onclick="showHint(2)"><h4>Carte bonus II</h4><div>Révélation forte contre grosse pénalité.</div></div>
        <div class="help-card" onclick="validateChoice()"><h4>Valider</h4><div>Confirme la réponse sélectionnée.</div></div>
      </div>`}
      <div id="feedback"></div>
    </div>`;
  picks = [];
}
function pick(letter, el){
  qsa('.choice').forEach(b=>b.classList.remove('selected'));
  el.classList.add('selected');
  picks = [letter];
}
function showHint(level){
  const c = CHALLENGES[state.challengeIndex];
  state.hints += 1;
  state.score = Math.max(0, state.score - (level===1 ? 40 : 90));
  playTone('hint');
  qs('#feedback').innerHTML = `<div class="feedback help"><strong>${level===1 ? 'Carte bonus I' : 'Carte bonus II'}</strong><br>${esc(level===1 ? c.help_1 : c.help_2)}</div>`;
}
function validateChoice(){
  const c = CHALLENGES[state.challengeIndex];
  if(!picks.length){
    qs('#feedback').innerHTML = `<div class="feedback bad">Choisis d’abord une réponse.</div>`;
    return;
  }
  const letter = picks[0];
  const ok = letter === c.answer;
  if(ok){
    state.score += 120;
    playTone('ok');
    qs('#feedback').innerHTML = `<div class="feedback ok"><strong>Excellent choix.</strong><br>${esc(c.explanation)}<br><br><strong>${esc(c.bonus)}</strong></div>`;
  } else {
    state.score = Math.max(0, state.score - 80);
    playTone('bad');
    qs('#feedback').innerHTML = `<div class="feedback bad"><strong>Mauvaise piste.</strong><br>${esc(c.explanation)}<br><br>Relis bien les indices avant de passer.</div>`;
  }
  const s = store();
  const session = s.sessions[state.sessionId];
  const team = session.teams.find(x=>x.teamCode===state.teamCode);
  team.score = state.score;
  team.hints = state.hints;
  save(s);
  const last = state.challengeIndex >= CHALLENGES.length-1;
  qs('#feedback').innerHTML += `<div class="footer-actions">
    <button class="btn-main" onclick="${last ? 'finishRun()' : 'nextChallenge()'}">${last ? 'Voir le résultat' : 'Défi suivant'}</button>
  </div>`;
}
function nextChallenge(){
  state.challengeIndex += 1;
  const s = store();
  const team = s.sessions[state.sessionId].teams.find(x=>x.teamCode===state.teamCode);
  team.index = state.challengeIndex;
  save(s);
  renderChallenge();
}
function finishRun(){
  const s = store();
  const session = s.sessions[state.sessionId];
  const team = session.teams.find(x=>x.teamCode===state.teamCode);
  team.score = state.score;
  save(s);
  qs('#app').innerHTML = `
    <section class="panel">
      <h2 class="section-title">Résultat du module 1</h2>
      <div class="notice"><strong>${esc(team.teamName)}</strong> termine la démo avec <strong>${state.score}</strong> points.</div>
      <div class="goal-grid">
        <div class="goal"><h4>Ce qui est validé</h4><div>Nouvelle esthétique, nouvelle entrée, flow admin plus propre.</div></div>
        <div class="goal"><h4>Ce qui reste à industrialiser</h4><div>Bibliothèque géante, événements live simulés, autres univers.</div></div>
        <div class="goal"><h4>Suite logique</h4><div>Étendre ce nouveau standard à tous les univers.</div></div>
      </div>
      <div class="actions">
        <button class="btn-main" onclick="history.replaceState({},'',location.pathname); renderHome();">Retour accueil</button>
      </div>
    </section>`;
}
async function init(){
  await loadData();
  const p = new URLSearchParams(location.search);
  if(p.get('player')==='1') bootPlayer();
  else renderHome();
}
init();
