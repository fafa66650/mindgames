
const qs=s=>document.querySelector(s), qsa=s=>[...document.querySelectorAll(s)];
let GAMES=[], MISSIONS={}, playerState=null, multiPicked=[];
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
async function loadData(){GAMES=await fetch('./data/games.json').then(r=>r.json());MISSIONS=await fetch('./data/missions.json').then(r=>r.json());}
function store(){return JSON.parse(localStorage.getItem('fafa_game_arena_clean_store_v2')||'{"sessions":{}}')}
function save(v){localStorage.setItem('fafa_game_arena_clean_store_v2',JSON.stringify(v))}
function linkFor(sessionId,teamCode){return `${location.origin}${location.pathname}?player=1&session=${encodeURIComponent(sessionId)}&team=${encodeURIComponent(teamCode)}`}
function ageLabel(a){return a==='6-10'?'Enfants 6–10 ans':a==='11-17'?'Ados 11–17 ans':'Adultes 18+'}
function diffLabel(d){return d==='facile'?'Accessible':d==='moyen'?'Équilibré':'Challenge'}
function renderHome(){
 qs('#app').innerHTML=`<div class="hero"><div><img src="./assets/logo.jpeg" class="hero-logo" alt="FAFATRAINING"></div><div><div class="kicker">FAFATRAINING GAME ARENA</div><h1>Version complète propre avec ton logo.</h1><div class="subtitle">Administrateur simple, entrée joueur directe, liens équipe fiables, missions claires, score temps + points et fiche animateur lisible.</div><div class="actions"><button onclick="showAdmin()">Administrateur</button><button class="ghost" onclick="showGuide()">Guide animateur</button></div></div><div class="hero-stats"><div class="stat"><strong>${GAMES.length}</strong><span>jeux</span></div><div class="stat"><strong>${Object.keys(MISSIONS).length*12}</strong><span>missions</span></div><div class="stat"><strong>2</strong><span>espaces</span></div><div class="stat"><strong>1er</strong><span>gagne</span></div></div></div><div class="tabs"><button class="tabbtn active" onclick="showAdmin()">Administrateur</button><button class="tabbtn" onclick="showGuide()">Guide animateur</button></div><div id="mainpanel"></div>`;
 showAdmin();
}
function active(name){qsa('.tabbtn').forEach(b=>b.classList.toggle('active',b.textContent.trim()===name))}
function showAdmin(){
 active('Administrateur');
 qs('#mainpanel').innerHTML=`<section class="panel"><h2>Préparer une session</h2><div class="notice">Choisis le jeu, l’âge, la difficulté, le nombre d’équipes et la durée. Ensuite l’app génère un lien direct par équipe. Chaque équipe pourra saisir son nom et les noms des joueurs, puis commencer sans passer par l’administrateur.</div><div class="row"><div><label>Nom de session</label><input id="sessionName" value="Session FAFATRAINING"></div><div><label>Jeu</label><select id="gameSelect">${GAMES.map(g=>`<option value="${g.key}">${g.title}</option>`).join('')}</select></div><div><label>Âge</label><select id="ageSelect"><option value="6-10">Enfants 6–10 ans</option><option value="11-17" selected>Ados 11–17 ans</option><option value="18+">Adultes 18+</option></select></div><div><label>Difficulté</label><select id="difficultySelect"><option value="facile">Accessible</option><option value="moyen" selected>Équilibré</option><option value="difficile">Challenge</option></select></div></div><div class="row3" style="margin-top:14px"><div><label>Nombre d’équipes</label><select id="teamCount">${Array.from({length:8},(_,i)=>`<option value="${i+2}">${i+2} équipes</option>`).join('')}</select></div><div><label>Durée totale</label><select id="durationSelect"><option value="30">30 min</option><option value="45">45 min</option><option value="60" selected>60 min</option><option value="75">75 min</option><option value="90">90 min</option></select></div><div><label>Score de départ</label><input id="basePoints" type="number" value="1000"></div></div><div class="actions"><button onclick="createSession()">Lancer la session</button></div><div id="sessionOutput"></div></section>`;
}
function showGuide(){
 active('Guide animateur');
 qs('#mainpanel').innerHTML=`<section class="panel"><h2>Guide animateur</h2><div class="notice"><strong>1.</strong> Prépare une session.<br><strong>2.</strong> Envoie à chaque équipe son lien direct.<br><strong>3.</strong> Chaque équipe écrit son nom et ses joueurs.<br><strong>4.</strong> Lis la fiche animateur pour avoir question, réponse et indice à chaque manche.<br><strong>5.</strong> La première équipe qui termine toutes les manches gagne.</div></section>`;
}
function createSession(){
 const sessionName=qs('#sessionName').value.trim()||'Session FAFATRAINING';
 const gameKey=qs('#gameSelect').value, age=qs('#ageSelect').value, difficulty=qs('#difficultySelect').value;
 const teamCount=Number(qs('#teamCount').value), duration=Number(qs('#durationSelect').value), basePoints=Number(qs('#basePoints').value||1000);
 const sessionId=`${gameKey}-${Date.now()}`, teamCodes=['ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT','GAMMA','OMEGA'].slice(0,teamCount);
 const s=store(); s.sessions[sessionId]={sessionId,sessionName,gameKey,age,difficulty,duration,basePoints,teams:teamCodes.map((code,i)=>({code,teamName:`Équipe ${i+1}`,playerNames:'',currentMission:0,points:basePoints,penalties:0,hints:0,finished:false,finishedAt:null}))}; save(s);
 const game=GAMES.find(g=>g.key===gameKey);
 qs('#sessionOutput').innerHTML=`<div class="grid"><article class="card"><h3>Session créée</h3><p><strong>Nom :</strong> ${esc(sessionName)}</p><p><strong>Jeu :</strong> ${esc(game.title)}</p><p><strong>Âge :</strong> ${ageLabel(age)} · <strong>Difficulté :</strong> ${diffLabel(difficulty)} · <strong>Durée :</strong> ${duration} min</p><div class="actions"><button class="ghost" onclick="showSheet('${sessionId}')">Voir la fiche animateur</button></div></article>${s.sessions[sessionId].teams.map(t=>`<article class="card"><div class="pillbar"><span class="pill">${esc(game.title)}</span><span class="pill">${esc(t.code)}</span></div><h3>${esc(t.teamName)}</h3><p><strong>Lien direct :</strong><br><span class="small">${esc(linkFor(sessionId,t.code))}</span></p><div class="actions"><button onclick="navigator.clipboard.writeText('${linkFor(sessionId,t.code)}')">Copier le lien</button><button class="ghost" onclick="window.open('${linkFor(sessionId,t.code)}','_blank')">Ouvrir</button></div></article>`).join('')}</div><div id="sheetHolder"></div>`;
}
function showSheet(sessionId){
 const s=store().sessions[sessionId], game=GAMES.find(g=>g.key===s.gameKey), list=MISSIONS[s.gameKey]||[];
 qs('#sheetHolder').innerHTML=`<section class="panel"><h2>Fiche animateur — ${esc(game.title)}</h2><div class="notice"><strong>Session :</strong> ${esc(s.sessionName)}<br><strong>Âge :</strong> ${ageLabel(s.age)} · <strong>Difficulté :</strong> ${diffLabel(s.difficulty)} · <strong>Durée :</strong> ${s.duration} min</div><div class="grid">${list.map((m,i)=>`<article class="sheet-card"><div class="pillbar"><span class="pill">Manche ${i+1}</span><span class="pill">${m.type}</span></div><h3>${esc(m.question)}</h3>${m.options?`<p><strong>Choix :</strong><br>${m.options.map(o=>esc(o)).join('<br>')}</p>`:''}<p><strong>Réponse :</strong> ${Array.isArray(m.answer)?m.answer.join(', '):esc(m.answer)}</p><p><strong>Indice :</strong> ${esc(m.hint)}</p></article>`).join('')}</div></section>`;
}
function param(n){return new URLSearchParams(location.search).get(n)}
function showPlayer(sessionId,teamCode){
 const s=store().sessions[sessionId];
 if(!s){qs('#app').innerHTML=`<section class="panel"><h2>Session introuvable</h2><div class="notice">Le lien reçu ne correspond à aucune session enregistrée sur cet appareil.</div></section>`;return}
 const team=s.teams.find(t=>t.code===teamCode), game=GAMES.find(g=>g.key===s.gameKey);
 if(!team){qs('#app').innerHTML=`<section class="panel"><h2>Équipe introuvable</h2><div class="notice">Le code équipe demandé n’existe pas dans cette session.</div></section>`;return}
 qs('#app').innerHTML=`<div class="hero"><div><img src="./assets/logo.jpeg" class="hero-logo" alt="FAFATRAINING"></div><div><div class="kicker">${esc(game.title)}</div><h1>${esc(game.tagline)}</h1><div class="subtitle">${esc(game.story)}</div></div><div class="hero-stats"><div class="stat"><strong>${esc(team.code)}</strong><span>code équipe</span></div><div class="stat"><strong>${s.duration}</strong><span>minutes</span></div><div class="stat"><strong>12</strong><span>manches</span></div><div class="stat"><strong>1er</strong><span>gagne</span></div></div></div><section class="panel"><h2>Entrée d’équipe</h2><div class="notice">Vous entrez directement dans votre jeu. Renseignez simplement votre nom d’équipe et les joueurs avant de lancer la partie.</div><div class="row3"><div><label>Code équipe</label><input value="${esc(team.code)}" disabled></div><div><label>Nom d’équipe</label><input id="teamNameField" value="${esc(team.teamName)}"></div><div><label>Joueurs</label><input id="playerNamesField" placeholder="Ex : Léa, Tom, Lina, Hugo" value="${esc(team.playerNames||'')}"></div></div><div class="actions"><button onclick="startPlayer('${sessionId}','${teamCode}')">COMMENCER</button></div></section>`;
}
function startPlayer(sessionId,teamCode){
 const s=store(), sess=s.sessions[sessionId], team=sess.teams.find(t=>t.code===teamCode);
 team.teamName=qs('#teamNameField').value.trim()||team.teamName; team.playerNames=qs('#playerNamesField').value.trim(); save(s);
 playerState={sessionId,teamCode,gameKey:sess.gameKey,duration:sess.duration,missionIndex:team.currentMission||0,points:team.points||sess.basePoints,penalties:team.penalties||0,hints:team.hints||0,remainingSeconds:sess.duration*60,timer:null};
 const game=GAMES.find(g=>g.key===sess.gameKey);
 qs('#app').innerHTML=`<div class="mission-wrap"><article class="mission-card"><div class="pillbar"><span class="pill">${esc(game.title)}</span><span class="pill">${esc(team.teamName)}</span></div><h2 class="mission-title">Prêt ? Votre mission commence maintenant.</h2><p class="context">${esc(game.story)}</p><div class="notice"><strong>Objectif :</strong> terminer toutes les missions avant les autres équipes.<br><strong>Consignes :</strong> lisez le contexte, répondez clairement, utilisez l’aide seulement si besoin.<br><strong>Pénalités :</strong> une aide coûte du temps et des points. Les erreurs coûtent aussi des points.<br><strong>Bonus :</strong> terminer très vite rapporte un bonus final.</div><div class="actions"><button onclick="enterGame()">ENTRER DANS LA PARTIE</button></div></article></div>`;
}
function fmt(t){const mm=String(Math.floor(t/60)).padStart(2,'0');const ss=String(t%60).padStart(2,'0');return `${mm}:${ss}`}
function startTimer(){if(playerState.timer)return;playerState.timer=setInterval(()=>{playerState.remainingSeconds--;const t=qs('#timer');if(t)t.textContent=fmt(playerState.remainingSeconds);if(playerState.remainingSeconds<=0){clearInterval(playerState.timer);playerState.timer=null;finish(false)}},1000)}
function context(gameKey,i){
 const map={
  undercover:["Une série de mots circule. Un seul mot casse l’univers commun.","Quelqu’un a forcé une définition. Un détail trahit l’intrus.","Un joueur a parlé trop large. Un autre trop précis."],
  loupsgarous:["Le village a repéré une incohérence pendant le débat.","La nuit a semé le doute. Le jour doit trancher.","Un comportement semble casser la logique collective."],
  traitreabord:["Le navire avance, mais une action ne correspond plus aux procédures.","Un ordre a été transmis. Quelqu’un l’a peut-être déformé.","L’équipage doit décider vite sans tomber dans le sabotage."],
  burgerquiz:["La manche part vite. Une réponse semble absurde, mais une seule est juste.","Le rythme monte. Il faut trancher sans casser l’ambiance.","Tout va vite, mais la logique existe encore."],
  mario:["Le niveau semble simple, mais un intrus attend au mauvais endroit.","Un bonus est utile, un autre vous fait perdre du temps.","Le royaume vous teste sur la vitesse et la lecture."],
  culture:["Une question claire vous attend. Ne surjouez pas, lisez bien.","Le thème change, mais la logique reste simple si vous restez concentrés.","Une seule réponse colle à la bonne catégorie."]
 };
 const arr=map[gameKey]||["Le jeu avance. Lisez bien avant de répondre."]; return arr[i%arr.length];
}
function enterGame(){startTimer();renderMission()}
function renderMission(){
 const s=store(), sess=s.sessions[playerState.sessionId], team=sess.teams.find(t=>t.code===playerState.teamCode), game=GAMES.find(g=>g.key===playerState.gameKey), list=MISSIONS[playerState.gameKey], m=list[playerState.missionIndex];
 team.currentMission=playerState.missionIndex; team.points=playerState.points; team.penalties=playerState.penalties; team.hints=playerState.hints; save(s);
 let block='';
 if(m.type==='choice'){block=`<div class="choice-grid">${m.options.map((o,i)=>`<button class="choice-btn" onclick="choose('${['A','B','C','D'][i]}')">${esc(o)}</button>`).join('')}</div>`}
 else if(m.type==='multi'){multiPicked=[]; block=`<div class="choice-grid">${m.options.map((o,i)=>`<button class="choice-btn" onclick="pickMulti('${['A','B','C','D'][i]}',this)">${esc(o)}</button>`).join('')}</div><div class="actions"><button class="ghost" onclick="validateMulti()">Valider la sélection</button></div>`}
 else {block=`<input id="textAnswer" placeholder="Écris ta réponse ici"><div class="actions"><button onclick="validateText()">Valider</button></div>`}
 qs('#app').innerHTML=`<div class="mission-wrap"><article class="mission-card"><div class="inline-top"><div class="pillbar"><span class="pill">${esc(game.title)}</span><span class="pill">${esc(team.teamName)}</span><span class="pill">Manche ${playerState.missionIndex+1}/12</span></div><div class="timer" id="timer">${fmt(playerState.remainingSeconds)}</div></div><div class="scoreline"><span class="score-pill">Points : ${playerState.points}</span><span class="score-pill">Aides : ${playerState.hints}</span><span class="score-pill">Pénalités : ${playerState.penalties}</span></div><p class="context"><strong>Contexte :</strong> ${esc(context(playerState.gameKey,playerState.missionIndex))}</p><div class="question">${esc(m.question)}</div>${block}<div class="actions"><button class="ghost" onclick="hint()">Besoin d’aide (-20 pts / -60 s)</button></div><div id="feedback" class="notice">Lis la question, puis réponds. La première équipe qui termine toutes les manches gagne.</div></article></div>`;
}
function hint(){const m=MISSIONS[playerState.gameKey][playerState.missionIndex]; playerState.hints+=1; playerState.penalties+=1; playerState.points=Math.max(0,playerState.points-20); playerState.remainingSeconds=Math.max(0,playerState.remainingSeconds-60); qs('#feedback').innerHTML=`<strong>Indice :</strong> ${esc(m.hint)}<br><span class="small">Pénalité appliquée : -20 points et -60 secondes.</span>`; qs('#timer').textContent=fmt(playerState.remainingSeconds)}
function choose(v){const m=MISSIONS[playerState.gameKey][playerState.missionIndex]; answer(v===m.answer)}
function pickMulti(v,el){if(multiPicked.includes(v)){multiPicked=multiPicked.filter(x=>x!==v);el.style.outline=''}else{multiPicked.push(v);el.style.outline='2px solid #a9ff4f'}}
function validateMulti(){const m=MISSIONS[playerState.gameKey][playerState.missionIndex]; answer([...m.answer].sort().join(',')===[...multiPicked].sort().join(','))}
function validateText(){const m=MISSIONS[playerState.gameKey][playerState.missionIndex], val=(qs('#textAnswer').value||'').trim().toLowerCase(); answer(val===String(m.answer).trim().toLowerCase())}
function answer(ok){
 const list=MISSIONS[playerState.gameKey];
 if(ok){playerState.points+=25; qs('#feedback').innerHTML='<strong>Bonne réponse.</strong> Vous passez à la manche suivante.'; if(playerState.missionIndex>=list.length-1){setTimeout(()=>finish(true),400)}else{playerState.missionIndex+=1; setTimeout(renderMission,450)}}
 else {playerState.penalties+=1; playerState.points=Math.max(0,playerState.points-10); playerState.remainingSeconds=Math.max(0,playerState.remainingSeconds-15); qs('#feedback').innerHTML='<strong>Mauvaise réponse.</strong> Relis bien la question.<br><span class="small">Pénalité : -10 points et -15 secondes.</span>'; qs('#timer').textContent=fmt(playerState.remainingSeconds)}
}
function finish(success){
 if(playerState.timer){clearInterval(playerState.timer); playerState.timer=null}
 const s=store(), sess=s.sessions[playerState.sessionId], team=sess.teams.find(t=>t.code===playerState.teamCode);
 team.finished=success; team.points=playerState.points; team.penalties=playerState.penalties; team.hints=playerState.hints; team.finishedAt=Date.now();
 const spent=sess.duration*60-playerState.remainingSeconds; if(success){if(spent<=sess.duration*60*0.5)team.points+=100; else if(spent<=sess.duration*60*0.75)team.points+=50}
 save(s);
 const ranked=[...sess.teams].sort((a,b)=>{const af=a.finished?1:0,bf=b.finished?1:0;if(bf!==af)return bf-af;if((b.points||0)!==(a.points||0))return(b.points||0)-(a.points||0);return(a.finishedAt||999999999999)-(b.finishedAt||999999999999)});
 qs('#app').innerHTML=`<div class="mission-wrap"><article class="mission-card"><h2 class="mission-title">${success?'Fin de partie':'Temps écoulé'}</h2><p class="context">${success?'Mission accomplie. Votre équipe a terminé toutes les manches.':'Le temps est écoulé. Votre équipe n’a pas terminé à temps.'}</p><div class="notice"><strong>Score final :</strong> ${team.points}<br><strong>Aides utilisées :</strong> ${team.hints}<br><strong>Pénalités :</strong> ${team.penalties}</div><h3>Classement provisoire</h3><div class="grid">${ranked.slice(0,3).map((t,i)=>`<article class="card"><h3>${i===0?'🥇':i===1?'🥈':'🥉'} ${esc(t.teamName)}</h3><p>${t.points||0} points</p></article>`).join('')}</div></article></div>`;
}
async function boot(){await loadData();const isPlayer=new URLSearchParams(location.search).get('player')==='1', sessionId=param('session'), teamCode=param('team'); if(isPlayer&&sessionId&&teamCode)showPlayer(sessionId,teamCode); else renderHome()}
boot();
