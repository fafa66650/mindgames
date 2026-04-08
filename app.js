
const qs=s=>document.querySelector(s), qsa=s=>[...document.querySelectorAll(s)];
let GAMES=[], MISSIONS={}, playerState=null, multiPicked=[];
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
async function loadData(){GAMES=await fetch('./data/games.json').then(r=>r.json());MISSIONS=await fetch('./data/missions.json').then(r=>r.json());}
function store(){return JSON.parse(localStorage.getItem('fafa_game_arena_clean_store_v4')||'{"sessions":{}}')}
function save(v){localStorage.setItem('fafa_game_arena_clean_store_v4',JSON.stringify(v))}
function linkFor(sessionId,teamCode){return `${location.origin}${location.pathname}?player=1&session=${encodeURIComponent(sessionId)}&team=${encodeURIComponent(teamCode)}`}
function ageLabel(a){return a==='6-10'?'Enfants 6–10 ans':a==='11-17'?'Ados 11–17 ans':'Adultes 18+'}
function diffLabel(d){return d==='facile'?'Accessible':d==='moyen'?'Équilibré':'Challenge'}
function normalize(s){return String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'').trim();}
function gameByKey(k){return GAMES.find(g=>g.key===k)}
function renderHome(){
 qs('#app').innerHTML=`<div class="hero"><div><img src="./assets/logo.jpeg" class="hero-logo" alt="FAFATRAINING"></div><div><div class="kicker">FAFATRAINING GAME ARENA</div><h1>Un jeu interactif, immersif et prêt à lancer.</h1><div class="subtitle">Choisis un univers, prépare tes équipes, lance la session, suis la progression et fais entrer les joueurs dans une vraie aventure. Ici, chaque monde a sa couleur, son ambiance, sa logique et son rythme.</div></div><div class="hero-stats"><div class="stat green"><strong>${GAMES.length}</strong><span>univers jouables</span></div><div class="stat blue"><strong>${Object.keys(MISSIONS).length*12}</strong><span>manches actives</span></div><div class="stat pink"><strong>2</strong><span>espaces clairs</span></div><div class="stat gold"><strong>live</strong><span>suivi local</span></div></div></div><div class="tabs"><button class="tabbtn active" onclick="showAdmin()">Administrateur</button><button class="tabbtn" onclick="showTrackingTab()">Suivi des sessions</button><button class="tabbtn" onclick="showGuide()">Guide animateur</button></div><div id="mainpanel"></div>`;
 showAdmin();
}
function active(name){qsa('.tabbtn').forEach(b=>b.classList.toggle('active',b.textContent.trim()===name))}
function universeOptions(){const fams=[...new Set(GAMES.map(g=>g.family))];return `<option value="all">Tous les univers</option>` + fams.map(f=>`<option value="${f}">${f}</option>`).join('')}
function filteredGameOptions(family){return GAMES.filter(g=>family==='all' || g.family===family).map(g=>`<option value="${g.key}">${g.title}</option>`).join('')}
function showAdmin(){
 active('Administrateur');
 qs('#mainpanel').innerHTML=`<section class="panel"><h2>Préparer une session</h2><div class="notice">Choisis d’abord un univers, puis le jeu exact. L’administrateur prépare la partie et transmet un lien direct à chaque équipe. Le suivi des sessions est volontairement dans un onglet séparé pour garder cet espace plus lisible.</div><div class="row"><div><label>Nom de session</label><input id="sessionName" value="Session FAFATRAINING"></div><div><label>Univers</label><select id="familySelect" onchange="refreshGameSelect()">${universeOptions()}</select></div><div><label>Jeu</label><select id="gameSelect" onchange="previewGame()">${filteredGameOptions('all')}</select></div><div><label>Âge</label><select id="ageSelect"><option value="6-10">Enfants 6–10 ans</option><option value="11-17" selected>Ados 11–17 ans</option><option value="18+">Adultes 18+</option></select></div></div><div class="row3" style="margin-top:14px"><div><label>Difficulté</label><select id="difficultySelect"><option value="facile">Accessible</option><option value="moyen" selected>Équilibré</option><option value="difficile">Challenge</option></select></div><div><label>Nombre d’équipes</label><select id="teamCount">${Array.from({length:8},(_,i)=>`<option value="${i+2}">${i+2} équipes</option>`).join('')}</select></div><div><label>Durée totale</label><select id="durationSelect"><option value="30">30 min</option><option value="45">45 min</option><option value="60" selected>60 min</option><option value="75">75 min</option><option value="90">90 min</option></select></div></div><div class="row3" style="margin-top:14px"><div><label>Score de départ</label><input id="basePoints" type="number" value="1000"></div><div><label>Couleur d’univers</label><input id="colorPreview" disabled></div><div><label>Accent</label><input id="accentPreview" disabled></div></div><div class="actions"><button onclick="createSession()">Lancer la session</button></div><div id="gamePreview"></div><div id="sessionOutput"></div></section>`;
 previewGame();
}
function refreshGameSelect(){const family = qs('#familySelect').value; qs('#gameSelect').innerHTML = filteredGameOptions(family); previewGame();}
function previewGame(){
  const key = qs('#gameSelect')?.value || GAMES[0].key;
  const g = gameByKey(key);
  if(qs('#colorPreview')) qs('#colorPreview').value = g.color;
  if(qs('#accentPreview')) qs('#accentPreview').value = g.accent;
  if(qs('#gamePreview')) qs('#gamePreview').innerHTML = `<div class="grid"><article class="card themed" style="--game:${g.color}"><div class="pillbar"><span class="pill">${esc(g.family)}</span><span class="pill">${esc(g.title)}</span></div><h3>${esc(g.tagline)}</h3><p>${esc(g.intro || g.story)}</p></article></div>`;
}
function showTrackingTab(){
 active('Suivi des sessions');
 qs('#mainpanel').innerHTML = `<section class="panel"><h2>Suivi des sessions</h2><div id="adminTracking"></div></section>`;
 renderTracking();
}
function showGuide(){
 active('Guide animateur');
 qs('#mainpanel').innerHTML=`<section class="panel"><h2>Guide animateur</h2><div class="notice"><strong>1.</strong> Prépare une session.<br><strong>2.</strong> Envoie à chaque équipe son lien direct.<br><strong>3.</strong> Chaque équipe écrit son nom et ses joueurs.<br><strong>4.</strong> Lis la fiche animateur pour avoir question, réponse et indice à chaque manche.<br><strong>5.</strong> Le suivi admin est local sur cet appareil. Pour aider à distance sur d’autres téléphones, il faut un backend partagé.<br><strong>6.</strong> La première équipe qui termine toutes les manches gagne.</div></section>`;
}
function createSession(){
 const sessionName=qs('#sessionName').value.trim()||'Session FAFATRAINING';
 const gameKey=qs('#gameSelect').value, age=qs('#ageSelect').value, difficulty=qs('#difficultySelect').value;
 const teamCount=Number(qs('#teamCount').value), duration=Number(qs('#durationSelect').value), basePoints=Number(qs('#basePoints').value||1000);
 const sessionId=`${gameKey}-${Date.now()}`, teamCodes=['ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT','GAMMA','OMEGA'].slice(0,teamCount);
 const s=store(); s.sessions[sessionId]={sessionId,sessionName,gameKey,age,difficulty,duration,basePoints,teams:teamCodes.map((code,i)=>({code,teamName:`Équipe ${i+1}`,playerNames:'',currentMission:0,points:basePoints,penalties:0,hints:0,finished:false,finishedAt:null,lastHelp:'-',activePlayerIndex:0}))}; save(s);
 const game=gameByKey(gameKey);
 qs('#sessionOutput').innerHTML=`<div class="grid"><article class="card themed" style="--game:${game.color}"><h3>Session créée</h3><p><strong>Nom :</strong> ${esc(sessionName)}</p><p><strong>Jeu :</strong> ${esc(game.title)}</p><p><strong>Âge :</strong> ${ageLabel(age)} · <strong>Difficulté :</strong> ${diffLabel(difficulty)} · <strong>Durée :</strong> ${duration} min</p><div class="actions"><button class="ghost" onclick="showSheet('${sessionId}')">Voir la fiche animateur</button><button class="ghost" onclick="showTrackingTab()">Ouvrir le suivi</button></div></article>${s.sessions[sessionId].teams.map(t=>`<article class="card themed" style="--game:${game.color}"><div class="pillbar"><span class="pill">${esc(game.title)}</span><span class="pill">${esc(t.code)}</span></div><h3>${esc(t.teamName)}</h3><p><strong>Lien direct :</strong><br><span class="small">${esc(linkFor(sessionId,t.code))}</span></p><div class="actions"><button onclick="navigator.clipboard.writeText('${linkFor(sessionId,t.code)}')">Copier le lien</button><button class="ghost" onclick="window.open('${linkFor(sessionId,t.code)}','_blank')">Ouvrir</button></div></article>`).join('')}</div><div id="sheetHolder"></div>`;
}
function showSheet(sessionId){
 const s=store().sessions[sessionId], game=gameByKey(s.gameKey), list=MISSIONS[s.gameKey]||[];
 qs('#sheetHolder').innerHTML=`<section class="panel"><h2>Fiche animateur — ${esc(game.title)}</h2><div class="notice"><strong>Session :</strong> ${esc(s.sessionName)}<br><strong>Âge :</strong> ${ageLabel(s.age)} · <strong>Difficulté :</strong> ${diffLabel(s.difficulty)} · <strong>Durée :</strong> ${s.duration} min</div><div class="grid">${list.map((m,i)=>`<article class="sheet-card themed" style="--game:${game.color}"><div class="pillbar"><span class="pill">Manche ${i+1}</span><span class="pill">${m.type==='multi'?'Plusieurs bonnes réponses':m.type==='choice'?'Une seule bonne réponse':'Réponse texte'}</span></div><h3>${esc(m.question)}</h3>${m.options?`<p><strong>Choix :</strong><br>${m.options.map(o=>esc(o)).join('<br>')}</p>`:''}<p><strong>Réponse :</strong> ${Array.isArray(m.answer)?m.answer.join(', '):esc(m.answer)}</p><p><strong>Indice :</strong> ${esc(m.hint)}</p></article>`).join('')}</div></section>`;
}
function renderTracking(){
  if(!qs('#adminTracking')) return;
  const s = store();
  const ids = Object.keys(s.sessions);
  if(ids.length===0){ qs('#adminTracking').innerHTML = `<div class="notice">Aucune session active pour le moment.</div>`; return; }
  const cards = ids.reverse().map(id=>{
    const sess = s.sessions[id], game = gameByKey(sess.gameKey);
    const ranked = [...sess.teams].sort((a,b)=>{ if((b.currentMission||0)!==(a.currentMission||0)) return (b.currentMission||0)-(a.currentMission||0); return (b.points||0)-(a.points||0);});
    return `<article class="card themed" style="--game:${game.color}"><div class="pillbar"><span class="pill">${esc(sess.sessionName)}</span><span class="pill">${esc(game.title)}</span></div><p><strong>Âge :</strong> ${ageLabel(sess.age)} · <strong>Difficulté :</strong> ${diffLabel(sess.difficulty)}</p><div class="grid">${ranked.map((t,i)=>`<article class="card subcard"><h3>${i===0?'🥇':i===1?'🥈':i===2?'🥉':'Équipe'} ${esc(t.teamName)}</h3><p><strong>Joueurs :</strong> ${esc(t.playerNames||'-')}</p><p><strong>Manche :</strong> ${(t.currentMission||0)+1}/12</p><p><strong>Points :</strong> ${t.points||0}</p><p><strong>Aides :</strong> ${t.hints||0}</p><p><strong>Dernière aide :</strong> ${esc(t.lastHelp||'-')}</p></article>`).join('')}</div></article>`;
  }).join('');
  qs('#adminTracking').innerHTML = `<div class="grid">${cards}</div><div class="notice">Le suivi fonctionne localement sur cet appareil. Pour pousser des indices à distance vers d’autres téléphones en direct, il faudrait une base partagée / backend.</div>`;
}
function param(n){return new URLSearchParams(location.search).get(n)}
function showPlayer(sessionId,teamCode){
 const s=store().sessions[sessionId];
 if(!s){qs('#app').innerHTML=`<section class="panel"><h2>Session introuvable</h2><div class="notice">Le lien reçu ne correspond à aucune session enregistrée sur cet appareil.</div></section>`;return}
 const team=s.teams.find(t=>t.code===teamCode), game=gameByKey(s.gameKey);
 if(!team){qs('#app').innerHTML=`<section class="panel"><h2>Équipe introuvable</h2><div class="notice">Le code équipe demandé n’existe pas dans cette session.</div></section>`;return}
 qs('#app').innerHTML=`<div class="hero playerhero themed" style="--game:${game.color}"><div><img src="./assets/logo.jpeg" class="hero-logo" alt="FAFATRAINING"></div><div><div class="kicker">${esc(game.title)} · ${esc(game.accent)}</div><h1>${esc(game.tagline)}</h1><div class="subtitle">${esc(game.intro || game.story)}</div></div><div class="hero-stats"><div class="stat green"><strong>${esc(team.code)}</strong><span>code équipe</span></div><div class="stat blue"><strong>${s.duration}</strong><span>minutes</span></div><div class="stat pink"><strong>12</strong><span>manches</span></div><div class="stat gold"><strong>1er</strong><span>gagne</span></div></div></div><section class="panel themed" style="--game:${game.color}"><h2>Entrée d’équipe</h2><div class="notice">Vous entrez directement dans votre jeu. Renseignez votre nom d’équipe et les joueurs avant de lancer la partie.</div><div class="row3"><div><label>Code équipe</label><input value="${esc(team.code)}" disabled></div><div><label>Nom d’équipe</label><input id="teamNameField" value="${esc(team.teamName)}"></div><div><label>Joueurs</label><input id="playerNamesField" placeholder="Ex : Léa, Tom, Lina, Hugo" value="${esc(team.playerNames||'')}"></div></div><div class="actions"><button onclick="startPlayer('${sessionId}','${teamCode}')">COMMENCER</button></div></section>`;
}
function startPlayer(sessionId,teamCode){
 const s=store(), sess=s.sessions[sessionId], team=sess.teams.find(t=>t.code===teamCode);
 team.teamName=qs('#teamNameField').value.trim()||team.teamName; team.playerNames=qs('#playerNamesField').value.trim(); save(s);
 playerState={sessionId,teamCode,gameKey:sess.gameKey,duration:sess.duration,difficulty:sess.difficulty,missionIndex:team.currentMission||0,points:team.points||sess.basePoints,penalties:team.penalties||0,hints:team.hints||0,remainingSeconds:sess.duration*60,timer:null};
 const game=gameByKey(sess.gameKey);
 qs('#app').innerHTML=`<div class="mission-wrap"><article class="mission-card themed" style="--game:${game.color}"><div class="pillbar"><span class="pill">${esc(game.title)}</span><span class="pill">${esc(team.teamName)}</span></div><h2 class="mission-title">Préparez-vous à entrer dans l’univers.</h2><p class="context">${esc(game.intro || game.story)}</p><div class="notice"><strong>Objectif :</strong> terminer toutes les missions avant les autres équipes.<br><strong>Règles :</strong> lisez le contexte, repérez la vraie question, choisissez ensemble puis validez. Certaines manches ont une seule bonne réponse, d’autres plusieurs. Regardez bien le libellé affiché.<br><strong>Aides :</strong> aide 1 = légère, aide 2 = moyenne, aide 3 = forte. Selon la difficulté, l’aide coûte soit des points, soit du temps, jamais les deux à la fois.</div><div class="actions"><button onclick="enterGame()">ENTRER DANS LA PARTIE</button></div></article></div>`;
}
function fmt(t){const mm=String(Math.floor(t/60)).padStart(2,'0');const ss=String(t%60).padStart(2,'0');return `${mm}:${ss}`}
function startTimer(){if(playerState.timer)return;playerState.timer=setInterval(()=>{playerState.remainingSeconds--;const t=qs('#timer');if(t)t.textContent=fmt(playerState.remainingSeconds);if(playerState.remainingSeconds<=0){clearInterval(playerState.timer);playerState.timer=null;finish(false)}},1000)}
function context(gameKey,i){
 const map={
  undercover:["Quelqu’un n’a pas le même mot. L’équipe doit repérer le mauvais alignement sans se perdre dans trop de détails.","La manche semble simple, mais un détail de vocabulaire peut suffire à trahir l’intrus.","L’univers paraît cohérent, pourtant un seul élément casse le thème commun."],
  loupsgarous:["La brume recouvre le village. Les regards changent, les phrases se croisent et un mauvais jugement peut coûter très cher.","La nuit a laissé du doute derrière elle. Le jour doit lire les comportements et ne pas céder à la panique.","Une présence gêne l’équilibre du village. À vous de repérer ce qui ne tient pas debout."],
  traitreabord:["Le navire suit sa route, mais une consigne anormale peut faire dérailler toute la mission.","L’équipage reçoit des informations, encore faut-il repérer celle qui sent le sabotage.","Un détail dans les ordres de bord menace l’équilibre du groupe."],
  burgerquiz:["La manche est rapide, drôle, mais une seule réponse reste vraiment cohérente.","Ici, le ton est fun, mais la logique compte toujours.","Une réponse est absurde, une autre presque crédible : il faut trancher vite."],
  mario:["Le niveau semble coloré et fun, mais un mauvais choix vous ralentit immédiatement.","Bonus, pièges et faux raccourcis se mélangent dans cette manche.","Le royaume vous teste sur la vitesse de lecture et le bon réflexe."],
  culture:["Le thème paraît simple, mais une seule réponse correspond exactement à la question.","Ici, tout se joue sur la bonne catégorie, pas sur l’approximation.","Une bonne lecture suffit souvent à trouver la réponse juste."],
  million:["Le projecteur est sur vous. Une bonne réponse vous fait monter, une erreur vous freine immédiatement.","Le palier semble proche, mais une seule option tient vraiment debout.","Tout paraît simple jusqu’au détail qui fait trébucher l’équipe."],
  lestraitres:["La salle semble calme, mais les intentions ne le sont pas. Il faut lire entre les lignes.","Un détail de comportement peut faire tomber un masque.","Tout le monde avance, mais tout le monde n’est pas loyal."],
  onepiece:["Le journal de bord mentionne une piste, mais une mauvaise lecture peut vous éloigner du bon cap.","La route est ouverte, encore faut-il repérer le bon indice dans le bruit.","Un équipage solide sait lire, trier et choisir."],
  dbz:["L’énergie monte. Cette manche teste d’abord votre maîtrise, pas seulement votre vitesse.","Le bon choix est celui qui combine puissance et lecture juste.","Une erreur vous ralentit, mais une bonne réponse vous remet en orbite."],
  naruto:["La mission commence discrètement. Le détail juste vaut plus qu’un réflexe précipité.","Ici, la stratégie et la lecture fine comptent plus que la précipitation.","Un indice bien lu peut suffire à faire basculer la manche."],
  disney:["La magie opère, mais il faut rester lucide. Tout ce qui brille n’est pas forcément la bonne réponse.","Les souvenirs aident, à condition de ne pas se laisser distraire par le décor.","Un personnage, un lieu, une chanson : l’équipe doit reconnaître le bon monde."],
 };
 const arr=map[gameKey]||["Le jeu avance. Lisez bien avant de répondre."]; return arr[i%arr.length];
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
 else if(m.type==='multi'){marker='✅ Plusieurs bonnes réponses'; multiPicked=[]; block=`<div class="choice-grid">${m.options.map((o,i)=>`<button class="choice-btn" onclick="pickMulti('${['A','B','C','D'][i]}',this)">${esc(o)}</button>`).join('')}</div><div class="actions"><button class="ghost" onclick="validateMulti()">Valider la sélection</button></div>`}
 else {marker='⌨️ Réponse texte'; block=`<input id="textAnswer" placeholder="Écris ta réponse ici"><div class="actions"><button onclick="validateText()">Valider</button></div>`}
 const helpText = `Aides : ${playerState.hints}`;
 qs('#app').innerHTML=`<div class="mission-wrap"><article class="mission-card themed mission-theme" style="--game:${game.color}"><div class="inline-top"><div class="pillbar"><span class="pill">${esc(game.title)}</span><span class="pill">${esc(team.teamName)}</span><span class="pill">Manche ${playerState.missionIndex+1}/12</span><span class="pill">Joueur actif : ${esc(currentActivePlayer(team))}</span><span class="pill">${marker}</span></div><div class="timer" id="timer">${fmt(playerState.remainingSeconds)}</div></div><div class="scoreline"><span class="score-pill points">Points : ${playerState.points}</span><span class="score-pill aides">${helpText}</span><span class="score-pill penalites">Pénalités : ${playerState.penalties}</span></div><div class="notice contextbox"><strong>Contexte</strong><br>${esc(context(playerState.gameKey,playerState.missionIndex))}</div><div class="notice questionbox"><strong>Question</strong><br>${esc(m.question)}</div>${block}<div class="actions"><button class="ghost" onclick="hint(1)">Aide 1</button><button class="ghost" onclick="hint(2)">Aide 2</button><button class="ghost" onclick="hint(3)">Aide 3</button></div><div id="feedback" class="notice">Lis la question, puis réponds. La première équipe qui termine toutes les manches gagne.</div></article></div>`;
}
function applyHintPenalty(level){
  let mode='points', value=0;
  const d = playerState.difficulty;
  if(d==='facile'){
    if(level===1){mode='points'; value=0}
    if(level===2){mode='points'; value=10}
    if(level===3){mode='points'; value=25}
  } else if(d==='moyen'){
    if(level===1){mode='points'; value=5}
    if(level===2){mode='points'; value=15}
    if(level===3){mode='time'; value=45}
  } else {
    if(level===1){mode='time'; value=15}
    if(level===2){mode='time'; value=30}
    if(level===3){mode='time'; value=60}
  }
  if(mode==='points'){ playerState.points = Math.max(0, playerState.points - value); }
  else { playerState.remainingSeconds = Math.max(0, playerState.remainingSeconds - value); }
  return {mode, value};
}
function hint(level){
  const m=MISSIONS[playerState.gameKey][playerState.missionIndex];
  playerState.hints+=1;
  const penalty = applyHintPenalty(level);
  playerState.penalties+=1;
  let msg = '';
  if(level===1) msg = 'Pense à la catégorie la plus évidente et élimine l’élément qui la casse.';
  if(level===2) msg = m.hint;
  if(level===3) msg = Array.isArray(m.answer) ? `Réponses attendues : ${m.answer.join(', ')}` : `La réponse commence par : ${String(m.answer).slice(0,2)}`;
  renderMission();
  qs('#feedback').innerHTML=`<div class="feedback help"><strong>Aide ${level}</strong><br>${esc(msg)}<br><span class="small">Pénalité : ${penalty.mode==='points' ? '-'+penalty.value+' points' : '-'+penalty.value+' secondes'}.</span></div>`;
  if(qs('#timer')) qs('#timer').textContent=fmt(playerState.remainingSeconds);
}
function choose(v){const m=MISSIONS[playerState.gameKey][playerState.missionIndex]; answer(v===m.answer)}
function pickMulti(v,el){if(multiPicked.includes(v)){multiPicked=multiPicked.filter(x=>x!==v);el.style.outline=''}else{multiPicked.push(v);el.style.outline='2px solid #a9ff4f'}}
function validateMulti(){const m=MISSIONS[playerState.gameKey][playerState.missionIndex]; answer([...m.answer].sort().join(',')===[...multiPicked].sort().join(','))}
function validateText(){const m=MISSIONS[playerState.gameKey][playerState.missionIndex], val=normalize(qs('#textAnswer').value||''); answer(val===normalize(m.answer))}
function answer(ok){
 const list=MISSIONS[playerState.gameKey];
 if(ok){
   playerState.points+=25;
   qs('#feedback').innerHTML='<div class="feedback ok"><strong>Bonne réponse</strong><br>Vous passez à la manche suivante.</div>';
   if(playerState.missionIndex>=list.length-1){setTimeout(()=>finish(true),500)}else{playerState.missionIndex+=1; setTimeout(renderMission,650)}
 } else {
   playerState.penalties+=1; playerState.points=Math.max(0,playerState.points-10);
   qs('#feedback').innerHTML='<div class="feedback bad"><strong>Mauvaise réponse</strong><br>Relis bien le contexte et la vraie question.</div><div class="small" style="margin-top:8px">Tu peux tester une autre réponse ou utiliser une aide si besoin.</div>';
 }
}
function finish(success){
 if(playerState.timer){clearInterval(playerState.timer); playerState.timer=null}
 const s=store(), sess=s.sessions[playerState.sessionId], team=sess.teams.find(t=>t.code===playerState.teamCode), game=gameByKey(playerState.gameKey);
 team.finished=success; team.points=playerState.points; team.penalties=playerState.penalties; team.hints=playerState.hints; team.finishedAt=Date.now();
 const spent=sess.duration*60-playerState.remainingSeconds; if(success){if(spent<=sess.duration*60*0.5)team.points+=100; else if(spent<=sess.duration*60*0.75)team.points+=50}
 save(s);
 const ranked=[...sess.teams].sort((a,b)=>{const af=a.finished?1:0,bf=b.finished?1:0;if(bf!==af)return bf-af;if((b.points||0)!==(a.points||0))return(b.points||0)-(a.points||0);return(a.finishedAt||999999999999)-(b.finishedAt||999999999999)});
 qs('#app').innerHTML=`<div class="mission-wrap"><article class="mission-card themed" style="--game:${game.color}"><h2 class="mission-title">${success?'Fin de partie':'Temps écoulé'}</h2><p class="context">${success?'Mission accomplie. Votre équipe a terminé toutes les manches.':'Le temps est écoulé. Votre équipe n’a pas terminé à temps.'}</p><div class="notice"><strong>Score final :</strong> ${team.points}<br><strong>Aides utilisées :</strong> ${team.hints}<br><strong>Pénalités :</strong> ${team.penalties}</div><h3>Classement provisoire</h3><div class="grid">${ranked.slice(0,3).map((t,i)=>`<article class="card subcard"><h3>${i===0?'🥇':i===1?'🥈':'🥉'} ${esc(t.teamName)}</h3><p>${t.points||0} points</p></article>`).join('')}</div></article></div>`;
}
async function boot(){await loadData();const isPlayer=new URLSearchParams(location.search).get('player')==='1', sessionId=param('session'), teamCode=param('team'); if(isPlayer&&sessionId&&teamCode)showPlayer(sessionId,teamCode); else renderHome()}
boot();
