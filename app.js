
const qs=s=>document.querySelector(s), qsa=s=>[...document.querySelectorAll(s)];
let GAMES=[], PACKS={}, RUN=null, PICKS=[], CLOCK=null, SECONDS=0, AMBIENCE=null;
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
function store(){ return JSON.parse(localStorage.getItem('fafa_v5_max') || '{"sessions":{}}'); }
function save(v){ localStorage.setItem('fafa_v5_max', JSON.stringify(v)); }
function gameByKey(k){ return GAMES.find(g=>g.key===k); }

function playTone(type='ok'){
  try{
    const c = new(window.AudioContext||window.webkitAudioContext)();
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = type==='start' ? 'triangle' : 'sine';
    o.frequency.value = type==='ok' ? 690 : type==='bad' ? 190 : type==='start' ? 420 : 480;
    g.gain.value = 0.03;
    o.start();
    o.stop(c.currentTime + 0.18);
  }catch(e){}
}
function stopAmbience(){
  if(AMBIENCE){ try{ AMBIENCE.osc.stop(); }catch(e){} AMBIENCE=null; }
}
function startAmbience(theme){
  stopAmbience();
  try{
    const c = new(window.AudioContext||window.webkitAudioContext)();
    const osc = c.createOscillator(), gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = theme==='nocturne' ? 'triangle' : 'sine';
    osc.frequency.value = theme==='nocturne' ? 106 : 178;
    gain.gain.value = 0.012;
    osc.start();
    AMBIENCE={osc,gain};
  }catch(e){}
}
function fmt(t){ const m=String(Math.floor(t/60)).padStart(2,'0'); const s=String(t%60).padStart(2,'0'); return `${m}:${s}`; }

function difficultyPack(session){
  if(session.difficulty==='difficile' || session.age==='adults') return 'hard';
  if(session.difficulty==='facile' || session.age==='kids') return 'easy';
  return 'medium';
}
function durationCount(duration){
  if(duration<=30) return 4;
  if(duration<=45) return 5;
  if(duration<=60) return 5;
  if(duration<=90) return 5;
  return 5;
}
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
function participantsBreakdown(total, teams){
  if(!total || !teams) return 'À définir';
  const base = Math.floor(total / teams), rest = total % teams;
  if(rest===0) return `${teams} équipes de ${base}`;
  return `${rest} équipes de ${base+1} · ${teams-rest} équipes de ${base}`;
}

function renderHome(){
  qs('#app').innerHTML = `
  <div class="hero">
    <div><img src="./assets/logo.jpeg" class="hero-logo" alt="FAFATRAINING"></div>
    <div>
      <div class="kicker">FAFATRAINING GAME ARENA</div>
      <h1>ENTRE DANS LE JEU.</h1>
      <div class="subtitle">Version immersive renforcée : chrono visible, bouton valider impossible à rater, pastilles d’aide, ambiances et fin de partie plus forte.</div>
    </div>
    <div class="hero-stats">
      <div class="stat green"><strong>2</strong><span>univers stables</span></div>
      <div class="stat blue"><strong>10</strong><span>défis variés</span></div>
      <div class="stat pink"><strong>audio</strong><span>ambiance live</span></div>
      <div class="stat gold"><strong>v5</strong><span>upgrade immersif</span></div>
    </div>
  </div>
  <div class="tabs">
    <button class="tab active" onclick="showAdmin()">Administrateur</button>
    <button class="tab" onclick="showManual()">Jouer</button>
    <button class="tab" onclick="showNotes()">Notes</button>
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
    <div class="notice">Tout est regroupé au même endroit : âge, difficulté, durée, participants, équipes et répartition automatique. Le score de départ s’ajuste seul.</div>
    <div class="grid4">
      <div><label>Nom de session</label><input id="sessionName" value="Session Arena"></div>
      <div><label>Univers / mode</label><select id="gameSelect" onchange="previewGame();updateScore();updateMeta()">${GAMES.map(g=>`<option value="${g.key}">${g.title}</option>`).join('')}</select></div>
      <div><label>Âge</label><select id="ageSelect" onchange="updateScore();updateMeta()"><option value="kids">Enfant</option><option value="teens" selected>Ado</option><option value="adults">Adulte</option></select></div>
      <div><label>Durée</label><select id="duration" onchange="updateMeta()"><option value="30">30 min</option><option value="45" selected>45 min</option><option value="60">60 min</option><option value="90">90 min</option><option value="120">120 min</option></select></div>
    </div>
    <div class="grid4" style="margin-top:14px">
      <div><label>Difficulté</label><select id="difficulty" onchange="updateScore();updateMeta()"><option value="facile">Accessible</option><option value="moyen" selected>Équilibré</option><option value="difficile">Challenge</option></select></div>
      <div><label>Nombre d’équipes</label><select id="teamCount" onchange="renderTeams();updateMeta()"><option value="2">2 équipes</option><option value="3" selected>3 équipes</option><option value="4">4 équipes</option><option value="5">5 équipes</option><option value="6">6 équipes</option></select></div>
      <div><label>Participants au total</label><input id="participantsTotal" type="number" min="2" value="18" oninput="renderTeams();updateMeta()"></div>
      <div><label>Score de départ auto</label><input id="baseScore" disabled value="1250"><div class="hint-text">Calculé selon jeu + difficulté + âge.</div></div>
    </div>
    <div class="grid2" style="margin-top:14px">
      <div><label>Répartition automatique</label><input id="playersHint" disabled value="À définir"></div>
      <div><label>Mode</label><input disabled value="Compétitif immersif"></div>
    </div>
    <div id="preview"></div>
    <div class="notice">Tu peux garder la répartition auto ou la modifier manuellement, équipe par équipe.</div>
    <div id="teamsBox"></div>
    <div class="btns"><button class="btn main" onclick="createSession()">Créer la session</button></div>
    <div id="sessionOutput"></div>
  </section>`;
  renderTeams(); updateScore(); updateMeta(); previewGame();
}
function renderTeams(){
  const n=Number(qs('#teamCount')?.value||3), total=Number(qs('#participantsTotal')?.value||0);
  const defs=['ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT'];
  const base=Math.floor(total/n), rest=total%n;
  qs('#teamsBox').innerHTML = `<div class="grid3">${
    Array.from({length:n},(_,i)=>{
      const suggested=total?(i<rest?base+1:base):'';
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
function updateMeta(){
  const teams=Number(qs('#teamCount')?.value||3), total=Number(qs('#participantsTotal')?.value||0), duration=Number(qs('#duration')?.value||45);
  if(qs('#playersHint')) qs('#playersHint').value = `${participantsBreakdown(total,teams)} · jusqu’à ${duration} min`;
}
function previewGame(){
  const g=gameByKey(qs('#gameSelect').value);
  qs('#preview').innerHTML = `<div class="card" style="--accent:${g.color};margin-top:14px;background:${g.bg}">
    <div class="pills"><span class="pill">${esc(g.family)}</span><span class="pill">${esc(g.title)}</span></div>
    <h3>${esc(g.tagline)}</h3>
    <div class="small">${esc(g.intro)}</div>
  </div>`;
}
function createSession(){
  const id='ga-'+Date.now();
  const session={
    id,
    name: qs('#sessionName').value.trim(),
    gameKey: qs('#gameSelect').value,
    age: qs('#ageSelect').value,
    difficulty: qs('#difficulty').value,
    duration: Number(qs('#duration').value),
    participantsTotal: Number(qs('#participantsTotal').value||0),
    baseScore: Number(qs('#baseScore').value),
    teams: qsa('.teamName').map((el,i)=>({
      name: el.value.trim() || `Équipe ${i+1}`,
      code: qsa('.teamCode')[i].value.trim().toUpperCase() || `TEAM${i+1}`,
      suggestedSize: Number(qsa('.teamSuggested')[i].value||0),
      players:'',
      index:0,
      score:Number(qs('#baseScore').value),
      hints:0
    }))
  };
  const s=store(); s.sessions[id]=session; save(s);
  const origin = location.origin && location.origin!=='null' ? location.origin + location.pathname : location.pathname;
  qs('#sessionOutput').innerHTML = `<div class="notice"><strong>Session créée.</strong> Ouvre chaque équipe avec son lien direct.</div>
  <div class="cards">${session.teams.map(t=>`<div class="card">
    <div class="pills"><span class="pill">${esc(t.name)}</span><span class="pill">${esc(t.code)}</span>${t.suggestedSize?`<span class="pill">${t.suggestedSize} joueurs</span>`:''}</div>
    <div class="small">${origin}?player=1&session=${id}&team=${encodeURIComponent(t.code)}</div>
    <div class="btns"><button class="btn main" onclick="navigator.clipboard.writeText('${origin}?player=1&session=${id}&team=${encodeURIComponent(t.code)}')">Copier</button><button class="btn alt" onclick="window.open('${origin}?player=1&session=${id}&team=${encodeURIComponent(t.code)}','_blank')">Ouvrir</button></div>
  </div>`).join('')}</div>`;
}

function showManual(){
  setTab('Jouer');
  qs('#main').innerHTML = `<section class="panel"><h2 class="section-title">Entrée joueur</h2><div class="notice">Entre ici avec l’identifiant de session et le code équipe si besoin.</div><div class="grid2"><div><label>ID session</label><input id="sid"></div><div><label>Code équipe</label><input id="tcode"></div></div><div class="btns"><button class="btn main" onclick="manualOpen()">Entrer</button></div></section>`;
}
function manualOpen(){
  const sid=qs('#sid').value.trim(), t=qs('#tcode').value.trim();
  history.replaceState({},'',`?player=1&session=${encodeURIComponent(sid)}&team=${encodeURIComponent(t)}`);
  bootPlayer();
}
function showNotes(){
  setTab('Notes');
  qs('#main').innerHTML = `<section class="panel"><h2 class="section-title">Ce build pousse</h2><div class="goal-grid"><div class="goal"><h4>Logistique</h4><div>Participants au total, répartition auto, 6 équipes, 120 min.</div></div><div class="goal"><h4>Gameplay</h4><div>Chrono visible, validate fixe, pastilles d’aide, 2 essais, pools par difficulté.</div></div><div class="goal"><h4>Immersion</h4><div>Ambiance sonore légère, mood visuel plus fort et fin de partie renforcée.</div></div></div></section>`;
}

function currentList(session){
  const level = difficultyPack(session), key=`${session.gameKey}_${level}`;
  return (PACKS[key] || []).slice(0, durationCount(session.duration));
}
function currentPlayer(team){
  const arr=(team.players||'').split(',').map(x=>x.trim()).filter(Boolean);
  return arr.length ? arr[team.index % arr.length] : team.name;
}
function timerClass(){
  if(SECONDS > 120) return 'green';
  if(SECONDS > 45) return 'orange';
  return 'red';
}
function startTimer(durationMin){
  clearInterval(CLOCK);
  SECONDS = durationMin * 60;
  CLOCK = setInterval(()=>{
    SECONDS--;
    const badge=qs('#timerBadge'); if(badge){ badge.textContent = `⏱ ${fmt(SECONDS)}`; badge.className = `badge time timer-badge ${timerClass()}`; }
    if(SECONDS === 30) playTone('bad');
    if(SECONDS <= 0){ clearInterval(CLOCK); finishRun(true); }
  },1000);
}
function themeEvent(gameKey, idx){
  const map = {
    domination_nocturne:['🌧 La pluie brouille les certitudes.','⚠️ Une équipe accélère peut-être déjà.','🌘 La nuit récompense les plus lucides.'],
    odyssee_verte:['🌿 Le terrain cache plus d’une issue.','🧭 Une fausse piste peut coûter cher.','✨ Une bonne lecture peut tout ouvrir.']
  };
  const arr = map[gameKey] || ['⚡ La tension monte.'];
  return arr[idx % arr.length];
}
function bootPlayer(){
  const p=new URLSearchParams(location.search), sid=p.get('session'), code=p.get('team');
  if(!(p.get('player')==='1' && sid && code)){ renderHome(); return; }
  const s=store().sessions[sid];
  if(!s){ qs('#app').innerHTML=`<section class="panel"><div class="notice">Session introuvable.</div></section>`; return; }
  const team=s.teams.find(x=>x.code===code);
  if(!team){ qs('#app').innerHTML=`<section class="panel"><div class="notice">Équipe introuvable.</div></section>`; return; }
  const g=gameByKey(s.gameKey);
  qs('#app').innerHTML = `<div class="hero" style="background:${g.bg}">
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
  const s=store(), session=s.sessions[sid], team=session.teams.find(x=>x.code===code), game=gameByKey(session.gameKey);
  team.name = qs('#teamNameInput').value.trim() || team.name;
  team.players = qs('#playersInput').value.trim();
  save(s);
  RUN={sid,code,attempts:0,ended:false};
  startAmbience(game.theme);
  playTone('start');
  startTimer(session.duration);
  renderChallenge();
}
function renderChallenge(){
  const s=store(), session=s.sessions[RUN.sid], team=session.teams.find(x=>x.code===RUN.code), game=gameByKey(session.gameKey), list=currentList(session), c=list[team.index];
  if(!c){ finishRun(false); return; }
  const typeLabel = {logic:'🧠 Logique',observation:'👁 Observation',deduction:'🔐 Déduction',strategy:'⚔️ Stratégie',navigation:'🧭 Orientation',pattern:'🔁 Motif',code:'🔐 Code',choice:'🎯 Choix'}[c.kind] || 'Défi';
  qs('#app').innerHTML = `
  <section class="screen" style="background:${game.bg}">
    <div class="challenge-shell" style="--accent:${game.color}">
      <div class="hud">
        <div class="hud-group">
          <div class="badge points">Score : ${team.score}</div>
          <div class="badge event">Défi ${team.index+1}/${list.length}</div>
          <div class="badge event">Pastilles : ${team.hints}</div>
        </div>
        <div class="hud-group"><div id="timerBadge" class="badge time timer-badge ${timerClass()}">⏱ ${fmt(SECONDS)}</div></div>
      </div>
      <div class="notice">${esc(themeEvent(session.gameKey, team.index))}</div>
      <div class="player-turn">🔥 C’EST À : ${esc(currentPlayer(team))} DE JOUER</div>
      <div class="story">${esc(c.scene)}</div>
      <div class="help-floating">
        <button class="help-pill" onclick="useHint(1)" aria-label="Pastille aide 1">⚡</button>
        <button class="help-pill" onclick="useHint(2)" aria-label="Pastille aide 2">⚡⚡</button>
        <button class="help-pill" onclick="showFreeClue()" aria-label="Indice discret">👁</button>
      </div>
      <h2 class="challenge-title">${esc(c.title)}</h2>
      <div class="challenge-type">${typeLabel}</div>
      ${c.visual ? `<div class="visual">${esc(c.visual)}</div>` : ''}
      <div class="story"><strong>Énigme :</strong><br>${esc(c.prompt)}</div>
      <div id="freeClueSlot"></div>
      <div class="choice-grid">${c.options.map((o,i)=>`<button class="choice" onclick="pick('${['A','B','C','D'][i]}',this)">${esc(o)}</button>`).join('')}</div>
      <div id="feedback"></div>
    </div>
    <div class="validate-bar"><button class="validate-btn" onclick="validateChoice()">VALIDER LA RÉPONSE</button></div>
  </section>`;
  PICKS=[]; RUN.attempts=0;
}
function showFreeClue(){
  const s=store(), session=s.sessions[RUN.sid], team=session.teams.find(x=>x.code===RUN.code), c=currentList(session)[team.index];
  qs('#freeClueSlot').innerHTML = `<div class="freeclue"><strong>Indice discret :</strong><br>${esc(c.free_clue)}</div>`;
}
function pick(letter, el){
  qsa('.choice').forEach(b=>b.classList.remove('selected'));
  el.classList.add('selected');
  PICKS=[letter];
}
function useHint(level){
  const s=store(), session=s.sessions[RUN.sid], team=session.teams.find(x=>x.code===RUN.code), c=currentList(session)[team.index];
  team.hints += 1;
  team.score = Math.max(0, team.score - (level===1 ? 35 : 80));
  save(s);
  playTone('hint');
  qs('#feedback').innerHTML = `<div class="feedback help"><strong>${level===1 ? 'Pastille ⚡' : 'Pastille ⚡⚡'}</strong><br>${esc(level===1 ? c.help1 : c.help2)}</div>`;
}
function validateChoice(){
  const s=store(), session=s.sessions[RUN.sid], team=session.teams.find(x=>x.code===RUN.code), c=currentList(session)[team.index];
  if(!PICKS.length){
    qs('#feedback').innerHTML = `<div class="feedback bad">Choisis d’abord une réponse.</div>`;
    return;
  }
  const ok=PICKS[0]===c.answer;
  const last = team.index >= currentList(session).length - 1;
  if(ok){
    team.score += 120;
    save(s);
    playTone('ok');
    qs('#feedback').innerHTML = `<div class="feedback ok"><strong>Excellent choix.</strong><br>${esc(c.explanation)}<br><br><strong>${esc(c.bonus)}</strong></div><div class="btns"><button class="btn main" onclick="${last?'finishRun(false)':'nextChallenge()'}">${last?'Voir la fin de mission':'Défi suivant'}</button></div>`;
  } else {
    RUN.attempts += 1;
    playTone('bad');
    if(RUN.attempts < 2){
      team.score = Math.max(0, team.score - 40);
      save(s);
      qs('#feedback').innerHTML = `<div class="feedback bad"><strong>Mauvaise piste.</strong><br>Tu as encore une chance. Relis la scène, regarde l’indice discret et corrige ta lecture avant de valider à nouveau.<br><br><span class="small">Pénalité : -40 points.</span></div>`;
    } else {
      team.score = Math.max(0, team.score - 80);
      save(s);
      qs('#feedback').innerHTML = `<div class="feedback bad"><strong>Défi perdu.</strong><br>Bonne réponse : <strong>${esc(c.answer)}</strong>.<br>${esc(c.explanation)}<br><br><span class="small">Vous passez au défi suivant. Pas de retour arrière.</span></div><div class="btns"><button class="btn main" onclick="${last?'finishRun(false)':'nextChallenge()'}">${last?'Voir la fin de mission':'Défi suivant'}</button></div>`;
    }
  }
}
function nextChallenge(){
  const s=store(), session=s.sessions[RUN.sid], team=session.teams.find(x=>x.code===RUN.code);
  team.index += 1;
  save(s);
  renderChallenge();
}
function finishRun(timeout=false){
  if(RUN?.ended) return;
  RUN.ended = true;
  clearInterval(CLOCK);
  stopAmbience();
  const s=store(), session=s.sessions[RUN.sid], team=session.teams.find(x=>x.code===RUN.code);
  const mention = timeout ? 'Temps écoulé' : team.score >= 1700 ? 'Domination totale' : team.score >= 1450 ? 'Percée magistrale' : team.score >= 1200 ? 'Mission tenue' : 'Survie sous pression';
  const icon = timeout ? '⏱' : team.score >= 1700 ? '👑' : team.score >= 1450 ? '🏆' : team.score >= 1200 ? '⚡' : '🌧️';
  qs('#app').innerHTML = `
    <section class="panel finale">
      <h2 class="section-title">Fin de mission</h2>
      <div class="final-card" style="--accent:${gameByKey(session.gameKey).color}">
        <div class="big-score">${team.score} pts</div>
        <p><strong>${icon} ${esc(team.name)}</strong> — ${mention}</p>
        <p>Cartes Bonus utilisées : ${team.hints}</p>
        <p>${timeout ? 'Le chrono a fini par fermer la mission.' : 'Votre équipe a tenu jusqu’au bout et laisse une vraie trace dans l’arène.'}</p>
      </div>
      <div class="goal-grid" style="margin-top:16px">
        <div class="goal"><h4>Ce qui a compté</h4><div>Lecture des indices, gestion des erreurs et capacité à garder le rythme.</div></div>
        <div class="goal"><h4>Récompense</h4><div>Une sortie plus forte, plus lisible et plus valorisante que la version précédente.</div></div>
        <div class="goal"><h4>Prochaine passe</h4><div>Étendre ce niveau à plus d’univers, plus d’images, plus d’événements et plus de surprises.</div></div>
      </div>
      <div class="btns"><button class="btn main" onclick="history.replaceState({},'',location.pathname); renderHome();">Retour accueil</button></div>
    </section>`;
}
async function init(){
  await loadData();
  const p=new URLSearchParams(location.search);
  if(p.get('player')==='1') bootPlayer();
  else renderHome();
}
init();
