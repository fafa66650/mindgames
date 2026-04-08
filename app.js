
const qs=s=>document.querySelector(s), qsa=s=>[...document.querySelectorAll(s)];
let GAMES=[], MISSIONS={}, playerState=null, multiPicked=[];
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

async function loadData(){
  GAMES=await fetch('./data/games.json').then(r=>r.json());
  MISSIONS=await fetch('./data/missions.json').then(r=>r.json());
}
function store(){return JSON.parse(localStorage.getItem('fafatraining_game_arena_store')||'{"sessions":{}}')}
function save(v){localStorage.setItem('fafatraining_game_arena_store',JSON.stringify(v))}
function linkFor(sessionId,teamCode){return `${location.origin}${location.pathname}?player=1&session=${encodeURIComponent(sessionId)}&team=${encodeURIComponent(teamCode)}`}
function ageLabel(a){return a==='6-10'?'Enfants 6–10 ans':a==='11-17'?'Ados 11–17 ans':'Adultes 18+'}
function diffLabel(d){return d==='facile'?'Accessible':d==='moyen'?'Équilibré':'Challenge'}
function normalize(s){return String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'').trim();}
function gameByKey(k){return GAMES.find(g=>g.key===k)}
function playTone(type='ok'){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = type==='ok' ? 660 : type==='bad' ? 220 : 440;
    gain.gain.value = 0.03; osc.start(); osc.stop(ctx.currentTime + 0.12);
  }catch(e){}
}
function scoreBaseFor(game, difficulty){
  let base = Number(game.score_base || 1000);
  if(difficulty === 'moyen') base += 50;
  if(difficulty === 'difficile') base += 100;
  return base;
}
function universeOptions(){
  const fams=[...new Set(GAMES.map(g=>g.family))];
  return `<option value="all">Tous les univers</option>` + fams.map(f=>`<option value="${f}">${f}</option>`).join('');
}
function filteredGameOptions(family){
  return GAMES.filter(g=>family==='all' || g.family===family).map(g=>`<option value="${g.key}">${g.title}</option>`).join('');
}
function renderHome(){
  qs('#app').innerHTML = `
  <div class="hero">
    <div><img src="./assets/logo.jpeg" class="hero-logo" alt="FAFATRAINING"></div>
    <div>
      <div class="kicker">FAFATRAINING Game Arena</div>
      <h1>Un jeu interactif, immersif et prêt à lancer.</h1>
      <div class="subtitle">Choisis un univers, prépare tes équipes, lance la session, suis la progression et fais entrer les joueurs dans une vraie aventure.</div>
    </div>
    <div class="hero-stats">
      <div class="stat green"><strong>${GAMES.length}</strong><span>univers jouables</span></div>
      <div class="stat blue"><strong>${Object.keys(MISSIONS).length*12}</strong><span>manches actives</span></div>
      <div class="stat pink"><strong>équipes</strong><span>liens directs</span></div>
      <div class="stat gold"><strong>live</strong><span>suivi local</span></div>
    </div>
  </div>
  <div class="tabs">
    <button class="tabbtn active" onclick="showAdmin()">Administrateur</button>
    <button class="tabbtn" onclick="showTrackingTab()">Suivi des sessions</button>
    <button class="tabbtn" onclick="showGuide()">Guide animateur</button>
  </div>
  <div id="mainpanel"></div>`;
  showAdmin();
}
function active(name){qsa('.tabbtn').forEach(b=>b.classList.toggle('active',b.textContent.trim()===name))}
function showAdmin(){
  active('Administrateur');
  qs('#mainpanel').innerHTML = `
  <section class="panel">
    <h2>Préparation d’une session</h2>
    <div class="notice paragraph-box"><strong>Étape 1 — Choisir le jeu.</strong><br>Choisis l’univers, le jeu, l’âge, la difficulté, la durée et le nombre d’équipes. Le score de départ est calculé automatiquement selon le jeu et la difficulté.</div>
    <div class="row">
      <div><label>Nom de session</label><input id="sessionName" value="Session FAFATRAINING"></div>
      <div><label>Univers</label><select id="familySelect" onchange="refreshGameSelect()">${universeOptions()}</select></div>
      <div><label>Jeu</label><select id="gameSelect" onchange="previewGame();renderTeamCodeInputs();updateScorePreview()">${filteredGameOptions('all')}</select></div>
      <div><label>Âge</label><select id="ageSelect"><option value="6-10">Enfants 6–10 ans</option><option value="11-17" selected>Ados 11–17 ans</option><option value="18+">Adultes 18+</option></select></div>
    </div>
    <div class="row3" style="margin-top:14px">
      <div><label>Difficulté</label><select id="difficultySelect" onchange="updateScorePreview()"><option value="facile">Accessible</option><option value="moyen" selected>Équilibré</option><option value="difficile">Challenge</option></select></div>
      <div><label>Nombre d’équipes</label><select id="teamCount" onchange="renderTeamCodeInputs()">${Array.from({length:8},(_,i)=>`<option value="${i+2}">${i+2} équipes</option>`).join('')}</select></div>
      <div><label>Durée totale</label><select id="durationSelect"><option value="30">30 min</option><option value="45">45 min</option><option value="60" selected>60 min</option><option value="75">75 min</option><option value="90">90 min</option></select></div>
    </div>
    <div class="row3" style="margin-top:14px">
      <div><label>Score de départ automatique</label><input id="basePoints" disabled></div>
      <div><label>Mode des aides</label><input id="helpMode" disabled></div>
      <div><label>Codes d’équipe</label><input value="Personnalisables ci-dessous" disabled></div>
    </div>
    <div class="notice paragraph-box" style="margin-top:14px"><strong>Étape 2 — Personnaliser les équipes.</strong><br>Tu peux garder les codes automatiques ou les modifier toi-même.</div>
    <div id="teamCodeBox"></div>
    <div class="actions"><button onclick="createSession()">Lancer la session</button></div>
    <div id="gamePreview"></div>
    <div id="sessionOutput"></div>
  </section>`;
  previewGame(); renderTeamCodeInputs(); updateScorePreview();
}
function refreshGameSelect(){
  const family = qs('#familySelect').value;
  qs('#gameSelect').innerHTML = filteredGameOptions(family);
  previewGame(); renderTeamCodeInputs(); updateScorePreview();
}
function updateScorePreview(){
  const g = gameByKey(qs('#gameSelect').value);
  const d = qs('#difficultySelect').value;
  qs('#basePoints').value = scoreBaseFor(g,d);
  qs('#helpMode').value = d==='facile' ? 'Aides surtout en points' : d==='moyen' ? 'Mix progressif' : 'Aides surtout en temps';
}
function defaultCodes(n){ return ['ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT','GAMMA','OMEGA'].slice(0,n); }
function renderTeamCodeInputs(){
  const n = Number(qs('#teamCount')?.value || 2);
  qs('#teamCodeBox').innerHTML = `<div class="grid">${defaultCodes(n).map((c,i)=>`<article class="card subcard"><label>Code équipe ${i+1}</label><input class="teamCodeInput" value="${c}"></article>`).join('')}</div>`;
}
function previewGame(){
  const key = qs('#gameSelect')?.value || GAMES[0].key;
  const g = gameByKey(key);
  qs('#gamePreview').innerHTML = `<div class="grid"><article class="card themed" style="--game:${g.color}"><div class="pillbar"><span class="pill">${esc(g.family)}</span><span class="pill">${esc(g.title)}</span></div><h3>${esc(g.tagline)}</h3><p>${esc(g.intro || g.story)}</p></article></div>`;
}
function showTrackingTab(){
  active('Suivi des sessions');
  qs('#mainpanel').innerHTML = `<section class="panel"><h2>Suivi des sessions</h2><div id="adminTracking"></div></section>`;
  renderTracking();
}
function showGuide(){
  active('Guide animateur');
  qs('#mainpanel').innerHTML = `
  <section class="panel">
    <h2>Guide animateur</h2>
    <div class="notice paragraph-box"><strong>Avant de lancer :</strong><br>Choisis le bon univers, vérifie le nombre d’équipes et personnalise les codes si besoin. Chaque équipe reçoit ensuite son propre lien.</div>
    <div class="notice paragraph-box"><strong>Pendant la partie :</strong><br>Laisse le groupe lire l’intro. Si ça bloque, encourage d’abord une nouvelle tentative, puis propose une aide. Plus l’aide est forte, plus la pénalité monte.</div>
    <div class="notice paragraph-box"><strong>Lecture du jeu :</strong><br>Le type de manche est toujours visible à côté de la question : une seule bonne réponse, plusieurs ou réponse texte.</div>
    <div class="notice paragraph-box"><strong>Suivi :</strong><br>Ouvre l’onglet Suivi des sessions pour voir la progression, les points, les aides et les manches en cours.</div>
    <div class="notice paragraph-box"><strong>Limite actuelle :</strong><br>Le suivi live fonctionne localement sur le même appareil. Pour aider des téléphones différents à distance en direct, il faudrait un backend partagé.</div>
  </section>`;
}
function createSession(){
  const sessionName=qs('#sessionName').value.trim()||'Session FAFATRAINING';
  const gameKey=qs('#gameSelect').value, age=qs('#ageSelect').value, difficulty=qs('#difficultySelect').value;
  const teamCount=Number(qs('#teamCount').value), duration=Number(qs('#durationSelect').value);
  const g = gameByKey(gameKey);
  const basePoints = scoreBaseFor(g, difficulty);
  let teamCodes = qsa('.teamCodeInput').map(i=>i.value.trim().toUpperCase()).filter(Boolean);
  if(teamCodes.length !== teamCount) teamCodes = defaultCodes(teamCount);
  teamCodes = teamCodes.map((c,i)=>c || `TEAM${i+1}`);
  const sessionId=`${gameKey}-${Date.now()}`;
  const s=store();
  s.sessions[sessionId]={sessionId,sessionName,gameKey,age,difficulty,duration,basePoints,teams:teamCodes.map((code,i)=>({code,teamName:`Équipe ${i+1}`,playerNames:'',currentMission:0,points:basePoints,penalties:0,hints:0,finished:false,finishedAt:null,lastHelp:'-'}))};
  save(s);
  qs('#sessionOutput').innerHTML=`<div class="grid"><article class="card themed" style="--game:${g.color}"><h3>Session créée</h3><p><strong>Nom :</strong> ${esc(sessionName)}</p><p><strong>Jeu :</strong> ${esc(g.title)}</p><p><strong>Âge :</strong> ${ageLabel(age)} · <strong>Difficulté :</strong> ${diffLabel(difficulty)} · <strong>Durée :</strong> ${duration} min</p><p><strong>Score de départ :</strong> ${basePoints}</p><div class="actions"><button class="ghost" onclick="showSheet('${sessionId}')">Voir la fiche animateur</button><button class="ghost" onclick="showTrackingTab()">Ouvrir le suivi</button></div></article>${s.sessions[sessionId].teams.map(t=>`<article class="card themed" style="--game:${g.color}"><div class="pillbar"><span class="pill">${esc(g.title)}</span><span class="pill">${esc(t.code)}</span></div><h3>${esc(t.teamName)}</h3><p><strong>Lien direct :</strong><br><span class="small">${esc(linkFor(sessionId,t.code))}</span></p><div class="actions"><button onclick="navigator.clipboard.writeText('${linkFor(sessionId,t.code)}')">Copier le lien</button><button class="ghost" onclick="window.open('${linkFor(sessionId,t.code)}','_blank')">Ouvrir</button></div></article>`).join('')}</div><div id="sheetHolder"></div>`;
}
function showSheet(sessionId){
  const s=store().sessions[sessionId], game=gameByKey(s.gameKey), list=MISSIONS[s.gameKey]||[];
  qs('#sheetHolder').innerHTML=`<section class="panel"><h2>Fiche animateur — ${esc(game.title)}</h2><div class="notice"><strong>Session :</strong> ${esc(s.sessionName)}<br><strong>Âge :</strong> ${ageLabel(s.age)} · <strong>Difficulté :</strong> ${diffLabel(s.difficulty)} · <strong>Durée :</strong> ${s.duration} min</div><div class="grid">${list.map((m,i)=>`<article class="sheet-card themed" style="--game:${game.color}"><div class="pillbar"><span class="pill">Manche ${i+1}</span><span class="pill">${m.type==='multi'?'Plusieurs bonnes réponses':m.type==='choice'?'Une seule bonne réponse':'Réponse texte'}</span></div><h3>${esc(m.question)}</h3>${m.options?`<p><strong>Choix :</strong><br>${m.options.map(o=>esc(o)).join('<br>')}</p>`:''}<p><strong>Réponse :</strong> ${Array.isArray(m.answer)?m.answer.join(', '):esc(m.answer)}</p><p><strong>Indice :</strong> ${esc(m.hint)}</p><p><strong>Explication :</strong> ${esc(m.explanation || '')}</p></article>`).join('')}</div></section>`;
}
function renderTracking(){
  if(!qs('#adminTracking')) return;
  const s = store();
  const ids = Object.keys(s.sessions);
  if(ids.length===0){ qs('#adminTracking').innerHTML = `<div class="notice">Aucune session active pour le moment.</div>`; return; }
  const cards = ids.reverse().map(id=>{
    const sess = s.sessions[id], game = gameByKey(sess.gameKey);
    const ranked = [...sess.teams].sort((a,b)=>{ if((b.currentMission||0)!==(a.currentMission||0)) return (b.currentMission||0)-(a.currentMission||0); return (b.points||0)-(a.points||0);});
    return `<article class="card themed" style="--game:${game.color}"><div class="pillbar"><span class="pill">${esc(sess.sessionName)}</span><span class="pill">${esc(game.title)}</span></div><p><strong>Âge :</strong> ${ageLabel(sess.age)} · <strong>Difficulté :</strong> ${diffLabel(sess.difficulty)}</p><div class="grid">${ranked.map((t,i)=>`<article class="card subcard"><h3>${i===0?'🥇':i===1?'🥈':i===2?'🥉':'Équipe'} ${esc(t.teamName)}</h3><p><strong>Code :</strong> ${esc(t.code)}</p><p><strong>Joueurs :</strong> ${esc(t.playerNames||'-')}</p><p><strong>Manche :</strong> ${(t.currentMission||0)+1}/12</p><p><strong>Points :</strong> ${t.points||0}</p><p><strong>Aides :</strong> ${t.hints||0}</p></article>`).join('')}</div></article>`;
  }).join('');
  qs('#adminTracking').innerHTML = `<div class="grid">${cards}</div><div class="notice">Le suivi fonctionne localement sur cet appareil. Pour suivre des équipes jouant sur d’autres téléphones en direct, il faudrait un backend partagé.</div>`;
}
function param(n){return new URLSearchParams(location.search).get(n)}
function showPlayer(sessionId,teamCode){
  const s=store().sessions[sessionId];
  if(!s){qs('#app').innerHTML=`<section class="panel"><h2>Session introuvable</h2><div class="notice">Le lien reçu ne correspond à aucune session enregistrée sur cet appareil.</div></section>`;return}
  const team=s.teams.find(t=>t.code===teamCode), game=gameByKey(s.gameKey);
  if(!team){qs('#app').innerHTML=`<section class="panel"><h2>Équipe introuvable</h2><div class="notice">Le code équipe demandé n’existe pas dans cette session.</div></section>`;return}
  qs('#app').innerHTML=`<div class="hero playerhero themed" style="--game:${game.color}"><div><img src="./assets/logo.jpeg" class="hero-logo" alt="FAFATRAINING"></div><div><div class="kicker">${esc(game.title)} · ${esc(game.accent)}</div><h1>${esc(game.tagline)}</h1><div class="subtitle">${esc(game.intro || game.story)}</div></div><div class="hero-stats"><div class="stat green"><strong>${esc(team.code)}</strong><span>code équipe</span></div><div class="stat blue"><strong>${s.duration}</strong><span>minutes</span></div><div class="stat pink"><strong>12</strong><span>manches</span></div><div class="stat gold"><strong>${s.basePoints}</strong><span>score départ</span></div></div></div><section class="panel themed" style="--game:${game.color}"><h2>Votre équipe entre dans le jeu</h2><div class="notice paragraph-box"><strong>Avant de commencer :</strong><br>Entrez le nom de votre équipe et les prénoms des joueurs. L’application désignera ensuite un joueur actif à chaque manche pour que tout le monde participe.</div><div class="row3"><div><label>Code équipe</label><input value="${esc(team.code)}" disabled></div><div><label>Nom d’équipe</label><input id="teamNameField" value="${esc(team.teamName)}"></div><div><label>Joueurs</label><input id="playerNamesField" placeholder="Ex : Léa, Tom, Lina, Hugo" value="${esc(team.playerNames||'')}"></div></div><div class="actions"><button onclick="startPlayer('${sessionId}','${teamCode}')">COMMENCER L’AVENTURE</button></div></section>`;
}
function startPlayer(sessionId,teamCode){
  const s=store(), sess=s.sessions[sessionId], team=sess.teams.find(t=>t.code===teamCode);
  team.teamName=qs('#teamNameField').value.trim()||team.teamName;
  team.playerNames=qs('#playerNamesField').value.trim();
  save(s);
  playerState={sessionId,teamCode,gameKey:sess.gameKey,duration:sess.duration,difficulty:sess.difficulty,missionIndex:team.currentMission||0,points:team.points||sess.basePoints,penalties:team.penalties||0,hints:team.hints||0,remainingSeconds:sess.duration*60,timer:null};
  const game=gameByKey(sess.gameKey);
  qs('#app').innerHTML=`<div class="mission-wrap"><article class="mission-card themed" style="--game:${game.color}"><div class="pillbar"><span class="pill">${esc(game.title)}</span><span class="pill">${esc(team.teamName)}</span></div><h2 class="mission-title">Entrez dans l’univers.</h2><p class="context">${esc(game.intro || game.story)}</p><div class="notice paragraph-box"><strong style="color:#a9ff4f">Objectif</strong><br>Terminer toutes les manches avant les autres équipes.</div><div class="notice paragraph-box"><strong style="color:#67c6ff">Règles</strong><br>Lisez le contexte, repérez la vraie question puis validez. Certaines manches ont une seule bonne réponse, d’autres plusieurs, d’autres demandent une réponse texte.</div><div class="notice paragraph-box"><strong style="color:#ff77b7">Aides</strong><br>Aide 1 = légère, aide 2 = moyenne, aide 3 = forte. Selon la difficulté, une aide enlève soit des points, soit du temps, jamais les deux.</div><div class="actions"><button onclick="enterGame()">ENTRER DANS LA PARTIE</button></div></article></div>`;
}
function fmt(t){const mm=String(Math.floor(t/60)).padStart(2,'0');const ss=String(t%60).padStart(2,'0');return `${mm}:${ss}`}
function startTimer(){if(playerState.timer)return;playerState.timer=setInterval(()=>{playerState.remainingSeconds--;const t=qs('#timer');if(t)t.textContent=fmt(playerState.remainingSeconds);if(playerState.remainingSeconds<=0){clearInterval(playerState.timer);playerState.timer=null;finish(false)}},1000)}
function context(gameKey,i){
  const map = {
    undercover:["Quelqu’un n’a pas le même mot. L’équipe doit repérer le mauvais alignement sans se perdre dans trop de détails.","La manche semble simple, mais un détail de vocabulaire peut suffire à trahir l’intrus.","L’univers paraît cohérent, pourtant un seul élément casse le thème commun."],
    loupsgarous:["La brume recouvre le village. Les regards changent, les phrases se croisent et un mauvais jugement peut coûter très cher.","La nuit a laissé du doute derrière elle. Le jour doit lire les comportements et ne pas céder à la panique.","Une présence gêne l’équilibre du village. À vous de repérer ce qui ne tient pas debout."],
    traitreabord:["Le navire suit sa route, mais une consigne anormale peut faire dérailler toute la mission.","L’équipage reçoit des informations, encore faut-il repérer celle qui sent le sabotage.","Un détail dans les ordres de bord menace l’équilibre du groupe."]
  };
  const arr = map[gameKey] || ["Le jeu avance. Lisez bien avant de répondre."];
  return arr[i % arr.length];
}
function currentActivePlayer(team){
  const names = (team.playerNames||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(names.length===0) return team.teamName;
  return names[(playerState.missionIndex) % names.length];
}
function enterGame(){startTimer();renderMission()}
function renderMission(){
  const s=store(), sess=s.sessions[playerState.sessionId], team=sess.teams.find(t=>t.code===playerState.teamCode), game=gameByKey(playerState.gameKey), list=MISSIONS[playerState.gameKey], m=list[playerState.missionIndex];
  team.currentMission=playerState.missionIndex; team.points=playerState.points; team.penalties=playerState.penalties; team.hints=playerState.hints; save(s);
  let block='', marker='';
  if(m.type==='choice'){marker='🎯 Une seule bonne réponse'; block=`<div class="choice-grid">${m.options.map((o,i)=>`<button class="choice-btn" onclick="choose('${['A','B','C','D'][i]}')">${esc(o)}</button>`).join('')}</div>`}
  else if(m.type==='multi'){marker='✅ Plusieurs bonnes réponses'; multiPicked=[]; block=`<div class="choice-grid">${m.options.map((o,i)=>`<button class="choice-btn" onclick="pickMulti('${['A','B','C','D'][i]}',this)">${esc(o)}</button>`).join('')}</div><div class="actions"><button class="ghost" onclick="validateMulti()">VALIDER LA SÉLECTION</button></div>`}
  else {marker='⌨️ Réponse texte'; block=`<input id="textAnswer" placeholder="Écris ta réponse ici"><div class="actions"><button onclick="validateText()">VALIDER</button></div>`}
  const danger = playerState.points <= 0;
  qs('#app').innerHTML=`<div class="mission-wrap"><article class="mission-card themed mission-theme" style="--game:${game.color}">
  <div class="inline-top"><div class="pillbar"><span class="pill">${esc(game.title)}</span><span class="pill">${esc(team.teamName)}</span><span class="pill">Manche ${playerState.missionIndex+1}/12</span><span class="pill">Joueur : ${esc(currentActivePlayer(team))}</span></div><div class="timer" id="timer">${fmt(playerState.remainingSeconds)}</div></div>
  <div class="scoreline"><span class="score-pill points">Points : ${playerState.points}</span><span class="score-pill aides">Aides : ${playerState.hints}</span><span class="score-pill penalites">Pénalités : ${playerState.penalties}</span></div>
  ${danger ? '<div class="feedback bad">Votre équipe n’a plus de points. À partir de maintenant, toute erreur ou aide coûte du temps uniquement. La partie continue.</div>' : ''}
  <div class="notice contextbox"><strong>Contexte</strong><br>${esc(context(playerState.gameKey,playerState.missionIndex))}</div>
  <div class="notice questionbox"><strong>Question</strong><br>${esc(m.question)}<div class="question-type">${marker}</div></div>
  ${block}
  <div class="actions"><button class="ghost" onclick="hint(1)">Aide 1</button><button class="ghost" onclick="hint(2)">Aide 2</button><button class="ghost" onclick="hint(3)">Aide 3</button></div>
  <div id="feedback" class="notice">Lis la question, puis réponds. La première équipe qui termine toutes les manches gagne.</div>
  </article></div>`;
}
function applyPenalty(mode,value){
  if(mode==='points'){
    if(playerState.points <= 0){
      playerState.remainingSeconds = Math.max(0, playerState.remainingSeconds - Math.max(15, value));
      return {mode:'time', value:Math.max(15,value), fallback:true};
    }
    playerState.points = Math.max(0, playerState.points - value);
    return {mode:'points', value, fallback:false};
  }
  playerState.remainingSeconds = Math.max(0, playerState.remainingSeconds - value);
  return {mode:'time', value, fallback:false};
}
function applyHintPenalty(level){
  let mode='points', value=0;
  const d = playerState.difficulty;
  if(d==='facile'){ if(level===1){mode='points';value=0} if(level===2){mode='points';value=10} if(level===3){mode='points';value=25} }
  else if(d==='moyen'){ if(level===1){mode='points';value=5} if(level===2){mode='points';value=15} if(level===3){mode='time';value=45} }
  else { if(level===1){mode='time';value=15} if(level===2){mode='time';value=30} if(level===3){mode='time';value=60} }
  return applyPenalty(mode,value);
}
function hint(level){
  const m=MISSIONS[playerState.gameKey][playerState.missionIndex];
  playerState.hints+=1;
  const penalty = applyHintPenalty(level);
  playerState.penalties+=1;
  let msg = '';
  if(level===1) msg = 'On sent que ça bloque. Essaie d’abord d’éliminer ce qui casse clairement l’univers ou la logique de la manche.';
  if(level===2) msg = m.hint;
  if(level===3) msg = Array.isArray(m.answer) ? `Réponses attendues : ${m.answer.join(', ')}` : `La réponse commence par : ${String(m.answer).slice(0,2)}`;
  playTone('hint');
  renderMission();
  qs('#feedback').innerHTML=`<div class="feedback help"><strong>Aide ${level}</strong><br>${esc(msg)}<br><span class="small">Pénalité : ${penalty.mode==='points' ? '-'+penalty.value+' points' : '-'+penalty.value+' secondes'}${penalty.fallback ? ' (points épuisés, bascule en temps)' : ''}.</span></div>`;
}
function choose(v){const m=MISSIONS[playerState.gameKey][playerState.missionIndex]; answer(v===m.answer, m)}
function pickMulti(v,el){if(multiPicked.includes(v)){multiPicked=multiPicked.filter(x=>x!==v);el.style.outline=''}else{multiPicked.push(v);el.style.outline='2px solid #a9ff4f'}}
function validateMulti(){const m=MISSIONS[playerState.gameKey][playerState.missionIndex]; answer([...m.answer].sort().join(',')===[...multiPicked].sort().join(','), m)}
function validateText(){const m=MISSIONS[playerState.gameKey][playerState.missionIndex], val=normalize(qs('#textAnswer').value||''); answer(val===normalize(m.answer), m)}
function answer(ok,m){
  if(ok){
    playerState.points += 25;
    playTone('ok');
    qs('#feedback').innerHTML=`<div class="feedback ok"><strong>Bonne réponse</strong><br>${esc(m.explanation || 'Bonne lecture de la manche.')}</div>`;
    if(playerState.missionIndex >= MISSIONS[playerState.gameKey].length-1){ setTimeout(()=>finish(true), 1200); }
    else { playerState.missionIndex += 1; setTimeout(renderMission, 1400); }
  } else {
    const penalty = applyPenalty('points', 10);
    playerState.penalties += 1;
    playTone('bad');
    qs('#feedback').innerHTML=`<div class="feedback bad"><strong>Mauvaise réponse</strong><br>Ce n’est pas la bonne piste.<br><span class="small">Pénalité : ${penalty.mode==='points' ? '-'+penalty.value+' points' : '-'+penalty.value+' secondes'}${penalty.fallback ? ' (points épuisés, bascule en temps)' : ''}.</span></div><div class="small" style="margin-top:8px">Tu peux retenter une autre réponse ou utiliser une aide si l’équipe bloque.</div>`;
  }
  const t = qs('#timer'); if(t) t.textContent = fmt(playerState.remainingSeconds);
}
function finish(success){
  if(playerState.timer){ clearInterval(playerState.timer); playerState.timer=null; }
  const s=store(), sess=s.sessions[playerState.sessionId], team=sess.teams.find(t=>t.code===playerState.teamCode), game=gameByKey(playerState.gameKey);
  team.finished=success; team.points=playerState.points; team.penalties=playerState.penalties; team.hints=playerState.hints; team.finishedAt=Date.now();
  const spent=sess.duration*60-playerState.remainingSeconds; if(success){ if(spent<=sess.duration*60*0.5) team.points+=100; else if(spent<=sess.duration*60*0.75) team.points+=50; }
  save(s);
  const ranked=[...sess.teams].sort((a,b)=>{const af=a.finished?1:0,bf=b.finished?1:0;if(bf!==af)return bf-af;if((b.points||0)!==(a.points||0))return(b.points||0)-(a.points||0);return(a.finishedAt||999999999999)-(b.finishedAt||999999999999)});
  qs('#app').innerHTML=`<div class="mission-wrap"><article class="mission-card themed" style="--game:${game.color}"><h2 class="mission-title">${success?'Fin de partie':'Temps écoulé'}</h2><p class="context">${success?'Mission accomplie. Votre équipe a terminé toutes les manches.':'Le temps est écoulé. Votre équipe n’a pas terminé à temps.'}</p><div class="notice"><strong>Score final :</strong> ${team.points}<br><strong>Aides utilisées :</strong> ${team.hints}<br><strong>Pénalités :</strong> ${team.penalties}</div><h3>Classement provisoire</h3><div class="grid">${ranked.slice(0,3).map((t,i)=>`<article class="card subcard"><h3>${i===0?'🥇':i===1?'🥈':'🥉'} ${esc(t.teamName)}</h3><p>${t.points||0} points</p></article>`).join('')}</div></article></div>`;
}
async function boot(){
  await loadData();
  const isPlayer=new URLSearchParams(location.search).get('player')==='1', sessionId=param('session'), teamCode=param('team');
  if(isPlayer&&sessionId&&teamCode) showPlayer(sessionId,teamCode); else renderHome();
}
boot();
