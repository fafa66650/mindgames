
const scenarios = window.FAFA_SCENARIOS || [];
const TEAM_CODES = ['ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT','GAMMA','OMEGA'];

const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const state = { session:null };

function openTab(id){
  qsa('.tab').forEach(b => b.classList.toggle('active', b.dataset.target===id));
  qsa('.tab-panel').forEach(p => p.classList.toggle('active', p.id===id));
}
function closeModal(){ qs('#modal').classList.add('hidden'); }
function modal(html){ qs('#modalContent').innerHTML = html; qs('#modal').classList.remove('hidden'); }

function init(){
  qs('#statScenarios').textContent = scenarios.length;
  const gameSelect = qs('#gameSelect');
  const types = [...new Map(scenarios.map(s => [s.gameKey, s.gameLabel])).entries()];
  gameSelect.innerHTML = types.map(([k,v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join('');
  renderLibrary();
  hydrateFromUrl();
}

function selectedFilters(prefix=''){
  return {
    age: qs('#'+prefix+'ageSelect') ? qs('#'+prefix+'ageSelect').value : (qs('#ageSelect').value),
    difficulty: qs('#'+prefix+'difficultySelect') ? qs('#'+prefix+'difficultySelect').value : (qs('#difficultySelect').value),
    location: qs('#'+prefix+'locationSelect') ? qs('#'+prefix+'locationSelect').value : (qs('#locationSelect').value),
    gameKey: qs('#gameSelect').value,
    universe: qs('#universeSelect').value
  };
}
function matchingScenarios(f){
  return scenarios.filter(s =>
    (!f.age || s.ageKey===f.age) &&
    (!f.difficulty || s.difficulty===f.difficulty) &&
    (!f.location || s.location===f.location) &&
    (!f.gameKey || s.gameKey===f.gameKey) &&
    (!f.universe || !s.universe || s.universe===f.universe)
  );
}
function previewMatchingScenarios(){
  const matches = matchingScenarios(selectedFilters());
  qs('#matchingResults').innerHTML = matches.length
    ? `<strong>${matches.length}</strong> scénario(x) compatible(s). Clique sur “Bibliothèque” pour tous les voir.`
    : `Aucun scénario trouvé avec ces critères.`;
}
function renderLibrary(){
  const age = qs('#filterAge').value, difficulty = qs('#filterDifficulty').value, location = qs('#filterLocation').value, search = qs('#filterSearch').value.toLowerCase().trim();
  const list = scenarios.filter(s => {
    const blob = [s.title,s.gameLabel,s.story,s.theme,s.ageLabel].join(' ').toLowerCase();
    return (!age || s.ageKey===age) && (!difficulty || s.difficulty===difficulty) && (!location || s.location===location) && (!search || blob.includes(search));
  });
  qs('#libraryGrid').innerHTML = list.map(s => `
    <article class="mission-card" style="box-shadow: inset 0 0 0 2px ${esc(s.themeColor)}">
      <div class="pillbar">
        <span class="pill">${esc(s.gameLabel)}</span>
        <span class="pill">${esc(s.ageLabel)}</span>
        <span class="pill">${esc(s.location)}</span>
        <span class="pill">${esc(s.difficulty)}</span>
      </div>
      <h4 style="color:${esc(s.themeColor)}">${esc(s.title)}</h4>
      <p>${esc(s.story)}</p>
      <button class="ghost" onclick="showScenario('${esc(s.id)}')">Voir le détail</button>
    </article>
  `).join('') || '<div class="notice">Aucun résultat.</div>';
}
function showScenario(id){
  const s = scenarios.find(x => x.id===id);
  if(!s) return;
  modal(`
    <h2>${esc(s.title)}</h2>
    <div class="pillbar">
      <span class="pill">${esc(s.gameLabel)}</span>
      <span class="pill">${esc(s.ageLabel)}</span>
      <span class="pill">${esc(s.location)}</span>
      <span class="pill">${esc(s.difficulty)}</span>
      ${s.universe ? `<span class="pill">${esc(s.universe)}</span>` : ''}
    </div>
    <p>${esc(s.story)}</p>
    <h3>Manches / épreuves</h3>
    <ul>${s.tasks.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    ${s.roles && s.roles.length ? `<h3>Rôles possibles</h3><p>${s.roles.map(esc).join(', ')}</p>` : ''}
    <p class="muted">${esc(s.explanations)}</p>
  `);
}
function scenarioById(id){ return scenarios.find(s => s.id===id); }

function deterministicCode(base){
  return base.replace(/[^A-Z0-9]/g,'').slice(0,10);
}
function buildSession(){
  const filters = selectedFilters();
  const matches = matchingScenarios(filters);
  if(!matches.length) return null;
  const scenario = matches[0];
  const teamCount = Math.max(2, Math.min(8, Number(qs('#teamCount').value || 3)));
  const sessionName = qs('#sessionName').value.trim() || 'Mission FAFATRAINING';
  const teams = Array.from({length:teamCount}, (_,i) => {
    const code = TEAM_CODES[i];
    const missions = scenario.tasks.map((task, idx) => {
      const answer = deterministicCode(`${scenario.id}-${code}-${idx+1}`);
      const station = ((i*4)+idx) % 48 + 1;
      return {
        step: idx+1,
        title: `Mission ${idx+1} – ${code}`,
        prompt: task,
        answer,
        station,
        hint: `Cherche la logique de l’équipe ${code} et note bien chaque détail.`,
      };
    });
    return {
      code,
      name: `Équipe ${i+1}`,
      color: ['#35B9FF','#FF4FD8','#FFC247','#39FF14','#FF8A1F','#8F9BFF','#00E7C4','#FF5A54'][i],
      missions
    };
  });
  return { sessionName, scenario, teamCount, teams };
}

function generateSession(){
  const session = buildSession();
  if(!session){
    qs('#sessionOutput').innerHTML = 'Aucun scénario compatible.';
    openTab('session');
    return;
  }
  state.session = session;
  const baseUrl = new URL(window.location.href);
  baseUrl.search = '';
  const teamBlocks = session.teams.map(team => {
    const url = `${baseUrl.toString()}?mode=team&sid=${encodeURIComponent(session.scenario.id)}&teams=${session.teamCount}&code=${encodeURIComponent(team.code)}`;
    return `
      <div class="team-card" style="box-shadow: inset 0 0 0 2px ${team.color}">
        <h4 style="color:${team.color}">${esc(team.name)} · ${esc(team.code)}</h4>
        <p><strong>Lien direct équipe :</strong></p>
        <div class="linkbox">${esc(url)}</div>
        <p><strong>Parcours :</strong> ${team.missions.map(m => `Mission ${m.step} → Station ${m.station}`).join(' · ')}</p>
        <p><strong>Réponses animateur :</strong> ${team.missions.map(m => `${m.title}: ${m.answer}`).join(' | ')}</p>
      </div>
    `;
  }).join('');

  const qrBlock = session.teams.slice(0,4).map(team => {
    const first = team.missions[0];
    return `<div class="team-card"><h4>${esc(team.name)} · QR utile</h4><p>Premier QR à utiliser : <strong>Station ${first.station}</strong></p><img src="assets/qr/station-${String(first.station).padStart(2,'0')}.png" alt="QR station ${first.station}" style="max-width:160px;border-radius:12px;background:#fff;padding:6px"></div>`;
  }).join('');

  qs('#sessionOutput').innerHTML = `
    <div class="notice">
      <h3>${esc(session.sessionName)}</h3>
      <div class="pillbar">
        <span class="pill">${esc(session.scenario.gameLabel)}</span>
        <span class="pill">${esc(session.scenario.ageLabel)}</span>
        <span class="pill">${esc(session.scenario.location)}</span>
        <span class="pill">${esc(session.scenario.difficulty)}</span>
        ${session.scenario.universe ? `<span class="pill">${esc(session.scenario.universe)}</span>` : ''}
      </div>
      <p><strong>Titre :</strong> ${esc(session.scenario.title)}</p>
      <p><strong>Histoire :</strong> ${esc(session.scenario.story)}</p>
      <h3>Déroulé conseillé sur 1h à 1h30</h3>
      <ul>
        <li>0–10 min : briefing, répartition des équipes, explication du contexte.</li>
        <li>10–25 min : mission 1.</li>
        <li>25–40 min : mission 2.</li>
        <li>40–55 min : mission 3.</li>
        <li>55–70 min : mission 4 + finale.</li>
      </ul>
      <p><strong>Comment tu connais les réponses :</strong> elles sont affichées ci-dessous équipe par équipe et dans le guide fourni dans le ZIP.</p>
    </div>
    <h3>Liens et corrections par équipe</h3>
    <div class="team-grid">${teamBlocks}</div>
    <h3>QR utiles pour démarrer</h3>
    <div class="team-grid">${qrBlock}</div>
  `;
  openTab('session');
}

function hydrateFromUrl(){
  const url = new URL(window.location.href);
  const mode = url.searchParams.get('mode');
  const sid = url.searchParams.get('sid');
  const code = url.searchParams.get('code');
  const teams = url.searchParams.get('teams');
  if(mode==='team' && sid && code && teams){
    openTab('equipe');
    qs('#teamScenarioId').value = sid;
    qs('#teamCode').value = code;
    qs('#teamTotal').value = teams;
    loadTeamView();
  }
}

function buildTeamSession(sid, total, code){
  const scenario = scenarioById(sid);
  if(!scenario) return null;
  const teamIndex = TEAM_CODES.indexOf(code.toUpperCase());
  if(teamIndex < 0 || teamIndex >= total) return null;
  const team = {
    code: TEAM_CODES[teamIndex],
    name: `Équipe ${teamIndex+1}`,
    color: ['#35B9FF','#FF4FD8','#FFC247','#39FF14','#FF8A1F','#8F9BFF','#00E7C4','#FF5A54'][teamIndex],
    missions: scenario.tasks.map((task, idx) => ({
      step: idx+1,
      title: `Mission ${idx+1} – ${TEAM_CODES[teamIndex]}`,
      prompt: task,
      answer: deterministicCode(`${scenario.id}-${TEAM_CODES[teamIndex]}-${idx+1}`),
      station: ((teamIndex*4)+idx) % 48 + 1,
      hint: `Pense au thème du jeu et cherche ce qui débloque la suite.`,
    }))
  };
  return {scenario, team};
}

function loadTeamView(){
  const sid = qs('#teamScenarioId').value.trim().toUpperCase();
  const code = qs('#teamCode').value.trim().toUpperCase();
  const total = Math.max(2, Math.min(8, Number(qs('#teamTotal').value || 3)));
  const data = buildTeamSession(sid, total, code);
  if(!data){
    qs('#teamView').innerHTML = 'Impossible d’ouvrir cette équipe. Vérifie le code et le scénario.';
    return;
  }
  const {scenario, team} = data;
  qs('#teamView').innerHTML = `
    <div class="team-card" style="box-shadow: inset 0 0 0 2px ${team.color}">
      <div class="pillbar">
        <span class="pill">${esc(team.name)}</span>
        <span class="pill">${esc(scenario.title)}</span>
        <span class="pill">${esc(scenario.location)}</span>
      </div>
      <h3 style="color:${team.color};margin-top:0">${esc(team.name)} · ${esc(team.code)}</h3>
      <p>${esc(scenario.story)}</p>
      <div class="mission-grid">
        ${team.missions.map(m => `
          <div class="mission-card">
            <h4>${esc(m.title)}</h4>
            <p><strong>Objectif :</strong> ${esc(m.prompt)}</p>
            <p><strong>Station / QR :</strong> ${m.station}</p>
            <p class="muted">${esc(m.hint)}</p>
            <div class="answer-row">
              <input id="ans-${m.step}" type="text" placeholder="Entre la réponse">
              <button onclick="checkAnswer(${m.step}, '${m.answer}')">Valider</button>
            </div>
            <div id="res-${m.step}" class="muted"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
function checkAnswer(step, answer){
  const val = qs('#ans-'+step).value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  const ok = val === answer;
  qs('#res-'+step).innerHTML = ok ? `<span class="ok">Bonne réponse. Mission validée.</span>` : `<span class="bad">Mauvaise réponse. Réessaie.</span>`;
}

init();
