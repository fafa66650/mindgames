
let GAMES = [], SCENARIOS = [], MISSIONS = [];
const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const TEAM_CODES = ['ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT','GAMMA','OMEGA'];
let currentPlayer = {scenarioId:null, missionIndex:0, duration:60, teamCode:'', teamName:'', playerNames:'', timer:null, remaining:0, sessionId:''};

function getStore(){
  return JSON.parse(localStorage.getItem('fafa_mindgame_v15_store') || '{"sessions":{},"currentSession":null}');
}
function setStore(v){
  localStorage.setItem('fafa_mindgame_v15_store', JSON.stringify(v));
}
function getCurrentSession(){
  return getStore().currentSession;
}
function openTab(id){
  qsa('.tab').forEach(b => b.classList.toggle('active', b.dataset.target===id));
  qsa('.tab-panel').forEach(p => p.classList.toggle('active', p.id===id));
}
async function init(){
  GAMES = await fetch('./data/games.json').then(r=>r.json());
  SCENARIOS = await fetch('./data/scenarios.json').then(r=>r.json());
  MISSIONS = await fetch('./data/missions.json').then(r=>r.json());
  qs('#countGames').textContent = GAMES.length;
  qs('#countScenarios').textContent = SCENARIOS.length;
  qs('#countMissions').textContent = MISSIONS.length;
  qs('#gameSelect').innerHTML = GAMES.map(g=>`<option value="${g.key}">${g.title}</option>`).join('');
  qs('#ageSelect').innerHTML = ['6-10','11-17','18+'].map(v=>`<option value="${v}" ${v==='11-17'?'selected':''}>${v==='6-10'?'Enfants 6–10 ans':v==='11-17'?'Ados 11–17 ans':'Adultes 18+'}</option>`).join('');
  qs('#difficultySelect').innerHTML = ['facile','moyen','difficile'].map(v=>`<option value="${v}" ${v==='moyen'?'selected':''}>${v==='facile'?'Accessible':v==='moyen'?'Équilibré':'Challenge'}</option>`).join('');
  qs('#teamCount').innerHTML = Array.from({length:7}, (_,i)=>`<option value="${i+2}">${i+2} équipes</option>`).join('');
  qs('#playerScenarioSelect').innerHTML = SCENARIOS.map(s=>`<option value="${s.id}">${s.game_title} · ${s.age_label} · ${s.difficulty_label}</option>`).join('');
  qs('#answersScenarioSelect').innerHTML = SCENARIOS.map(s=>`<option value="${s.id}">${s.game_title} · ${s.age_label} · ${s.difficulty_label}</option>`).join('');
  renderLibrary();
  renderAnswers();
  hydratePlayerLink();
  renderLiveBoard();
}
function scenarioById(id){ return SCENARIOS.find(s => s.id===id); }
function missionsByScenario(id){ return MISSIONS.filter(m => m.scenario_id===id).sort((a,b)=>a.number-b.number); }
function absoluteIndex(){
  const u = new URL(window.location.href);
  return u.origin + u.pathname.replace(/\/[^\/]*$/, '/index.html');
}
function playerLink(sid, teamCode, duration, sessionId){
  return `${absoluteIndex()}?player=1&scenario=${encodeURIComponent(sid)}&team=${encodeURIComponent(teamCode)}&duration=${duration}&session=${encodeURIComponent(sessionId)}`;
}
function qrFor(url){
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;
}
function prepareSession(){
  const gameKey = qs('#gameSelect').value;
  const age = qs('#ageSelect').value;
  const diff = qs('#difficultySelect').value;
  const teamCount = Number(qs('#teamCount').value || 2);
  const duration = Number(qs('#durationSelect').value || 60);
  const name = qs('#sessionName').value || 'Session FAFATRAINING';
  const scenario = SCENARIOS.find(s => s.game_key===gameKey && s.age_key===age && s.difficulty_key===diff);
  if(!scenario){ qs('#sessionSummary').textContent = 'Aucun scénario trouvé.'; return; }

  const store = getStore();
  const sessionId = 'S' + Date.now();
  store.currentSession = sessionId;
  store.sessions[sessionId] = {
    id: sessionId,
    name,
    scenarioId: scenario.id,
    duration,
    createdAt: new Date().toISOString(),
    teams: TEAM_CODES.slice(0, teamCount).map((code, i)=>({
      code, teamName:`Équipe ${i+1}`, playerNames:'', missionIndex:0, progress:0, status:'En attente', lastAnswer:'-', history:[]
    })),
    logs:[]
  };
  setStore(store);

  const ms = missionsByScenario(scenario.id);
  qs('#answersScenarioSelect').value = scenario.id;
  qs('#sessionSummary').innerHTML = `
    <strong>${esc(name)}</strong><br>
    Jeu : <strong>${esc(scenario.game_title)}</strong> · Âge : <strong>${esc(scenario.age_label)}</strong> · Difficulté : <strong>${esc(scenario.difficulty_label)}</strong><br>
    Durée totale : <strong>${duration} min</strong> · Missions : <strong>${ms.length}</strong><br>
    Session active : <strong>${sessionId}</strong>
  `;
  qs('#scenarioPreview').innerHTML = `
    <article class="card">
      <div class="pillbar">
        <span class="pill">${esc(scenario.game_title)}</span>
        <span class="pill">${esc(scenario.family)}</span>
        <span class="pill">${esc(scenario.age_label)}</span>
        <span class="pill">${esc(scenario.difficulty_label)}</span>
      </div>
      <h3>Scénario préparé</h3>
      <p>${esc(scenario.hook)}</p>
      <p class="meta"><strong>Ambiance :</strong> ${esc(scenario.tone)} · <strong>Durée conseillée :</strong> ${scenario.duration_min} min</p>
    </article>
  `;
  qs('#teamLinks').innerHTML = store.sessions[sessionId].teams.map((team, i)=>{
    const link = playerLink(scenario.id, team.code, duration, sessionId);
    return `
      <article class="card">
        <h3>Équipe ${i+1}</h3>
        <p><strong>Code :</strong> ${esc(team.code)}</p>
        <p><strong>Lien joueur :</strong><br><small>${esc(link)}</small></p>
        <div class="actions">
          <button onclick="copyLink('${link.replace(/'/g,'&#39;')}')">Copier le lien</button>
          <button class="ghost" onclick="window.open('${link.replace(/'/g,'&#39;')}','_blank')">Ouvrir</button>
        </div>
        <img class="qr-img" src="${qrFor(link)}" alt="QR ${esc(team.code)}">
      </article>
    `;
  }).join('');
  renderLiveBoard();
  renderAnswers();
}
function renderLiveBoard(){
  const store = getStore();
  const sid = store.currentSession;
  const session = sid ? store.sessions[sid] : null;
  const live = qs('#liveBoard');
  if(!live) return;
  if(!session){ live.innerHTML = '<div class="notice">Aucune session active.</div>'; return; }
  const total = missionsByScenario(session.scenarioId).length;
  live.innerHTML = session.teams.map(team=>`
    <article class="card">
      <h3>${esc(team.teamName || team.code)}</h3>
      <p><strong>Code :</strong> ${esc(team.code)}</p>
      <p><strong>Joueurs :</strong> ${esc(team.playerNames || '-')}</p>
      <p><strong>Progression :</strong> ${team.progress}%</p>
      <p><strong>Mission :</strong> ${team.missionIndex+1} / ${total}</p>
      <p><strong>Statut :</strong> ${esc(team.status)}</p>
      <p><strong>Dernière réponse :</strong> ${esc(team.lastAnswer)}</p>
    </article>
  `).join('');
}
function copyLink(link){
  if(navigator.clipboard) navigator.clipboard.writeText(link);
  alert('Lien copié.');
}
function hydratePlayerLink(){
  const p = new URLSearchParams(window.location.search);
  if(p.get('player') === '1' && p.get('scenario')){
    openTab('player');
    qs('#playerScenarioSelect').value = p.get('scenario');
    qs('#teamCodeInput').value = (p.get('team') || '').toUpperCase();
    qs('#playerDurationSelect').value = String(Number(p.get('duration') || 60));
    currentPlayer.sessionId = p.get('session') || '';
  }
}
function launchPlayerGame(){
  const sid = qs('#playerScenarioSelect').value;
  const teamCode = (qs('#teamCodeInput').value || '').toUpperCase() || 'ALPHA';
  const duration = Number(qs('#playerDurationSelect').value || 60);
  const teamName = qs('#teamNameInput').value.trim();
  const playerNames = qs('#playerNamesInput').value.trim();
  if(!currentPlayer.sessionId){
    currentPlayer.sessionId = getCurrentSession() || '';
  }
  currentPlayer = {scenarioId:sid, missionIndex:0, duration, teamCode, teamName, playerNames, timer:null, remaining:duration*60, sessionId:currentPlayer.sessionId};
  syncTeamMeta();
  qs('#playerLobby').classList.add('hidden');
  qs('#playerGame').classList.remove('hidden');
  renderPlayerGame();
}
function syncTeamMeta(){
  const store = getStore();
  if(!currentPlayer.sessionId || !store.sessions[currentPlayer.sessionId]) return;
  const session = store.sessions[currentPlayer.sessionId];
  const team = session.teams.find(t=>t.code===currentPlayer.teamCode);
  if(team){
    if(currentPlayer.teamName) team.teamName = currentPlayer.teamName;
    if(currentPlayer.playerNames) team.playerNames = currentPlayer.playerNames;
    team.missionIndex = currentPlayer.missionIndex;
    const total = missionsByScenario(session.scenarioId).length;
    team.progress = Math.round(((currentPlayer.missionIndex+1)/total)*100);
  }
  store.sessions[currentPlayer.sessionId] = session;
  setStore(store);
  renderLiveBoard();
}
function updateTeamStatus(status, answer='-'){
  const store = getStore();
  if(!currentPlayer.sessionId || !store.sessions[currentPlayer.sessionId]) return;
  const session = store.sessions[currentPlayer.sessionId];
  const team = session.teams.find(t=>t.code===currentPlayer.teamCode);
  if(team){
    team.status = status;
    team.lastAnswer = answer;
    const total = missionsByScenario(session.scenarioId).length;
    team.progress = Math.round(((currentPlayer.missionIndex+1)/total)*100);
    team.missionIndex = currentPlayer.missionIndex;
    team.history.push({mission: currentPlayer.missionIndex+1, answer, status, ts: new Date().toLocaleTimeString('fr-FR')});
  }
  session.logs.push({team: currentPlayer.teamCode, answer, mission: currentPlayer.missionIndex+1, status, ts: new Date().toLocaleTimeString('fr-FR')});
  store.sessions[currentPlayer.sessionId] = session;
  setStore(store);
  renderLiveBoard();
  renderAnswers();
}
function renderPlayerGame(){
  const scenario = scenarioById(currentPlayer.scenarioId);
  const ms = missionsByScenario(currentPlayer.scenarioId);
  const m = ms[currentPlayer.missionIndex];
  if(!scenario || !m) return;
  const phase = currentPlayer.missionIndex < Math.ceil(ms.length * 0.33) ? '🟢 Phase 1'
    : currentPlayer.missionIndex < Math.ceil(ms.length * 0.75) ? '🟡 Phase 2' : '🔴 Phase finale';
  qs('#pillGame').textContent = scenario.game_title;
  qs('#pillAge').textContent = scenario.age_label;
  qs('#pillDiff').textContent = scenario.difficulty_label;
  qs('#pillTeam').textContent = currentPlayer.teamName || currentPlayer.teamCode;
  qs('#missionProgress').textContent = Math.round(((currentPlayer.missionIndex+1)/ms.length)*100) + '%';
  qs('#playerGameTitle').textContent = `${phase} · ${scenario.game_title} · Mission ${m.number}/${ms.length}`;
  qs('#playerHook').textContent = scenario.hook;
  qs('#missionTitle').textContent = m.title;
  qs('#missionSummary').textContent = m.summary;
  qs('#missionInstruction').textContent = m.instruction;
  qs('#missionType').textContent = m.answer_type;
  qs('#hintBox').textContent = 'Aucun indice utilisé pour le moment.';
  qs('#validationResult').textContent = ['vote','validation'].includes(m.answer_type)
    ? "Cette mission doit être validée par l’animateur."
    : "Entre la réponse et valide.";
  qs('#missionQr').src = qrFor(playerLink(currentPlayer.scenarioId, currentPlayer.teamCode, currentPlayer.duration, currentPlayer.sessionId) + `&mission=${m.number}`);
  qs('#teamMeta').textContent = `Équipe : ${currentPlayer.teamName || currentPlayer.teamCode} · Joueurs : ${currentPlayer.playerNames || '-'}`;
  syncTeamMeta();
  updateTeamStatus('En mission', '-');
  updateGlobalTimer();
}
function startGlobalTimer(){
  if(currentPlayer.timer) return;
  currentPlayer.timer = setInterval(()=>{
    currentPlayer.remaining -= 1;
    updateGlobalTimer();
    if(currentPlayer.remaining <= 0){
      clearInterval(currentPlayer.timer);
      currentPlayer.timer = null;
      qs('#globalTimer').textContent = 'Temps écoulé';
      updateTeamStatus('Temps écoulé', '-');
    }
  }, 1000);
}
function updateGlobalTimer(){
  const total = Math.max(0, currentPlayer.remaining || 0);
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  qs('#globalTimer').textContent = `${mm}:${ss}`;
}
function prevMission(){
  if(currentPlayer.missionIndex > 0){
    currentPlayer.missionIndex -= 1;
    renderPlayerGame();
  }
}
function nextMission(){
  const total = missionsByScenario(currentPlayer.scenarioId).length;
  if(currentPlayer.missionIndex < total - 1){
    currentPlayer.missionIndex += 1;
    renderPlayerGame();
  }
}
function backToLobby(){
  if(currentPlayer.timer){
    clearInterval(currentPlayer.timer);
    currentPlayer.timer = null;
  }
  updateTeamStatus('Lobby', '-');
  qs('#playerGame').classList.add('hidden');
  qs('#playerLobby').classList.remove('hidden');
  currentPlayer = {scenarioId:null, missionIndex:0, duration:60, teamCode:'', teamName:'', playerNames:'', timer:null, remaining:0, sessionId:''};
  openTab('player');
}
function validateCurrentMission(){
  const ms = missionsByScenario(currentPlayer.scenarioId);
  const m = ms[currentPlayer.missionIndex];
  const answer = (qs('#answerInput').value || '').trim().toLowerCase();
  if(['vote','validation'].includes(m.answer_type)){
    qs('#validationResult').textContent = 'Validation animateur nécessaire pour cette manche.';
    qs('#hintBox').textContent = m.hint;
    updateTeamStatus('Attente validation', 'validation animateur');
    return;
  }
  if(!answer){
    qs('#validationResult').textContent = 'Entre une réponse.';
    return;
  }
  if(answer === String(m.expected_answer).trim().toLowerCase()){
    qs('#validationResult').innerHTML = '✅ <strong>Bonne réponse</strong> — mission validée.';
    qs('#hintBox').textContent = 'Bien joué. Passe à la suite.';
    updateTeamStatus('Bonne réponse', answer);
  } else {
    qs('#validationResult').innerHTML = '❌ <strong>Réponse incorrecte</strong>.';
    qs('#hintBox').textContent = m.hint;
    updateTeamStatus('Erreur', answer);
  }
}
function renderLibrary(){
  const q = (qs('#searchInput').value || '').toLowerCase().trim();
  qs('#libraryGrid').innerHTML = SCENARIOS.filter(s=>{
    const blob = [s.game_title, s.family, s.hook, s.age_label, s.difficulty_label].join(' ').toLowerCase();
    return !q || blob.includes(q);
  }).map(s=>`
    <article class="card ${esc(s.theme)}" style="border-color:${esc(s.accent)}55">
      <div class="pillbar">
        <span class="pill">${esc(s.game_title)}</span>
        <span class="pill">${esc(s.age_label)}</span>
        <span class="pill">${esc(s.difficulty_label)}</span>
      </div>
      <h3>${esc(s.game_title)}</h3>
      <p>${esc(s.hook)}</p>
      <p class="meta"><strong>Univers :</strong> ${esc(s.family)} · <strong>Missions :</strong> ${s.round_count}</p>
      <div class="actions"><button onclick="previewScenario('${s.id}')">Voir le scénario</button></div>
    </article>
  `).join('');
}
function previewScenario(sid){
  openTab('library');
  const s = scenarioById(sid);
  const ms = missionsByScenario(sid);
  qs('#libraryGrid').innerHTML = `
    <article class="card" style="border-color:${esc(s.accent)}77">
      <div class="pillbar">
        <span class="pill">${esc(s.game_title)}</span>
        <span class="pill">${esc(s.age_label)}</span>
        <span class="pill">${esc(s.difficulty_label)}</span>
      </div>
      <h3>${esc(s.game_title)} · ${esc(s.family)}</h3>
      <p>${esc(s.hook)}</p>
      <div class="actions"><button onclick="renderLibrary()">Retour bibliothèque</button></div>
    </article>
    ${ms.map(m=>`
      <article class="card">
        <div class="pillbar"><span class="pill">Mission ${m.number}</span><span class="pill">${esc(m.answer_type)}</span></div>
        <h3>${esc(m.title)}</h3>
        <p>${esc(m.summary)}</p>
      </article>
    `).join('')}
  `;
}
function renderAnswers(){
  const store = getStore();
  const sid = store.currentSession;
  const session = sid ? store.sessions[sid] : null;
  if(session){
    const scenario = scenarioById(session.scenarioId);
    qs('#answersSessionInfo').innerHTML = `<strong>Session active :</strong> ${esc(session.name)} · ${esc(session.id)} · ${esc(scenario.game_title)} · ${session.teams.length} équipe(s)`;
    qs('#answersLiveTeams').innerHTML = session.teams.map(team=>`
      <article class="card">
        <h3>${esc(team.teamName || team.code)}</h3>
        <p><strong>Code :</strong> ${esc(team.code)}</p>
        <p><strong>Joueurs :</strong> ${esc(team.playerNames || '-')}</p>
        <p><strong>Progression :</strong> ${team.progress}%</p>
        <p><strong>Mission :</strong> ${team.missionIndex+1}</p>
        <p><strong>Statut :</strong> ${esc(team.status)}</p>
        <p><strong>Dernière réponse :</strong> ${esc(team.lastAnswer)}</p>
      </article>
    `).join('');
  } else {
    qs('#answersSessionInfo').textContent = 'Aucune session active pour le moment.';
    qs('#answersLiveTeams').innerHTML = '';
  }
  const scenarioId = qs('#answersScenarioSelect').value || SCENARIOS[0].id;
  const scenario = scenarioById(scenarioId);
  const ms = missionsByScenario(scenarioId);
  qs('#answersGrid').innerHTML = `
    <article class="card" style="border-color:${esc(scenario.accent)}77">
      <h3>${esc(scenario.game_title)} · Réponses animateur</h3>
      <p>${esc(scenario.hook)}</p>
    </article>
    ${ms.map(m=>`
      <article class="card">
        <div class="pillbar">
          <span class="pill">Mission ${m.number}</span>
          <span class="pill">${esc(m.answer_type)}</span>
        </div>
        <h3>${esc(m.title)}</h3>
        <p><strong>Réponse attendue :</strong> ${esc(m.expected_answer)}</p>
        <p><strong>Indice :</strong> ${esc(m.hint)}</p>
      </article>
    `).join('')}
  `;
}
function resetSession(){
  const store = getStore();
  if(store.currentSession && store.sessions[store.currentSession]){
    delete store.sessions[store.currentSession];
  }
  store.currentSession = null;
  setStore(store);
  qs('#sessionSummary').textContent = 'Session réinitialisée.';
  qs('#scenarioPreview').innerHTML = '';
  qs('#teamLinks').innerHTML = '';
  renderLiveBoard();
  renderAnswers();
}
function exportSession(){
  const store = getStore();
  const sid = store.currentSession;
  const session = sid ? store.sessions[sid] : null;
  if(!session){ alert('Aucune session active.'); return; }
  const blob = new Blob([JSON.stringify(session, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${session.id}_${session.name.replace(/\s+/g,'_')}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
init();
