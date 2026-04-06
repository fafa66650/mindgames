
const scenarios = window.FAFA_SCENARIOS || [];
const codes = window.FAFA_CODES || [];
const TEAM_CODES = ['ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT','GAMMA','OMEGA'];
const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const state = { session:null };

const universeCards = [
  {key:'mario', title:'Super Mario Bros style', text:'Tuyaux secrets, boss, château, objets cachés et niveaux.'},
  {key:'pokemon', title:'Pokémon style', text:'Capture, évolution, arènes, duel et progression.'},
  {key:'onepiece', title:'One Piece style', text:'Équipage, trésor, reliques, îles et aventure pirate.'},
  {key:'dbz', title:'Dragon Ball Z style', text:'Montée en puissance, tournoi, énergie et transformation finale.'},
  {key:'kpop', title:'K-pop style', text:'Show, performance, défis de scène et bataille d’équipe.'},
  {key:'manga', title:'Manga / anime style', text:'Rivalité, arcs narratifs, héros, clans et missions secrètes.'},
];

function openTab(id){ qsa('.tab').forEach(b => b.classList.toggle('active', b.dataset.target===id)); qsa('.tab-panel').forEach(p => p.classList.toggle('active', p.id===id)); }
function closeModal(){ qs('#modal').classList.add('hidden'); }
function modal(html){ qs('#modalContent').innerHTML = html; qs('#modal').classList.remove('hidden'); }

function fillBasicSelects(){
  qs('#ageSelect').innerHTML = `<option value="6-10">Enfants 6–10 ans</option><option value="11-17" selected>Ados 11–17 ans</option><option value="18+">Adultes 18+</option>`;
  qs('#difficultySelect').innerHTML = `<option value="facile">Facile</option><option value="moyen" selected>Moyen</option><option value="difficile">Difficile</option><option value="expert">Expert</option>`;
  qs('#locationSelect').innerHTML = `<option value="intérieur">Intérieur</option><option value="extérieur">Extérieur</option>`;
  qs('#teamsSelect').innerHTML = Array.from({length:7}, (_,i)=>`<option value="${i+2}" ${i===1?'selected':''}>${i+2} équipes</option>`).join('');
  qs('#filterAge').innerHTML = `<option value="">Tous les âges</option><option value="6-10">Enfants 6–10 ans</option><option value="11-17">Ados 11–17 ans</option><option value="18+">Adultes 18+</option>`;
  qs('#filterDifficulty').innerHTML = `<option value="">Toutes les difficultés</option><option value="facile">Facile</option><option value="moyen">Moyen</option><option value="difficile">Difficile</option><option value="expert">Expert</option>`;
  qs('#filterLocation').innerHTML = `<option value="">Tous les lieux</option><option value="intérieur">Intérieur</option><option value="extérieur">Extérieur</option>`;
}
function init(){
  fillBasicSelects();
  qs('#statScenarios').textContent = scenarios.length;
  const types = [...new Map(scenarios.map(s => [s.gameKey, s.gameLabel])).entries()];
  qs('#gameSelect').innerHTML = `<option value="">Tous les jeux</option>` + types.map(([k,v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join('');
  const universes = [...new Set(scenarios.map(s => s.universe).filter(Boolean))].sort();
  qs('#universeSelect').innerHTML = `<option value="">Tous les univers</option>` + universes.map(u => `<option value="${esc(u)}">${esc(u)}</option>`).join('');
  renderUniverses(); renderLibrary(); renderCodes(); hydrateFromUrl();
}
function renderUniverses(){
  qs('#universeGrid').innerHTML = universeCards.map(u => `
    <article class="universe-card">
      <div class="pillbar"><span class="pill">${esc(u.key)}</span></div>
      <h3>${esc(u.title)}</h3>
      <p class="story">${esc(u.text)}</p>
    </article>
  `).join('');
}
function selectedFilters(){
  return {
    age: qs('#ageSelect').value,
    difficulty: qs('#difficultySelect').value,
    location: qs('#locationSelect').value,
    gameKey: qs('#gameSelect').value,
    universe: qs('#universeSelect').value,
    teams: Number(qs('#teamsSelect').value || 3),
    sessionName: qs('#sessionName').value || 'Mission FAFATRAINING V8'
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
  qs('#matchingResults').innerHTML = matches.length ? `<strong>${matches.length}</strong> scénario(x) compatible(s).` : `Aucun scénario trouvé avec ces critères.`;
}
function renderLibrary(){
  const age = qs('#filterAge').value, difficulty = qs('#filterDifficulty').value, location = qs('#filterLocation').value, search = qs('#filterSearch').value.toLowerCase().trim();
  const list = scenarios.filter(s => {
    const blob = [s.displayTitle||s.title,s.gameLabel,s.story,s.ageLabel,s.subtitle,s.universe].join(' ').toLowerCase();
    return (!age || s.ageKey===age) && (!difficulty || s.difficulty===difficulty) && (!location || s.location===location) && (!search || blob.includes(search));
  });
  qs('#libraryGrid').innerHTML = list.map(s => `
    <article class="mission-card" style="box-shadow: inset 0 0 0 2px ${esc(s.themeColor)}">
      <div class="pillbar">
        <span class="pill">${esc(s.gameLabel)}</span>
        <span class="pill">${esc(s.ageLabel)}</span>
        <span class="pill">${esc(s.difficulty)}</span>
        <span class="pill">${esc(s.universe || 'univers libre')}</span>
      </div>
      <h3>${esc(s.displayTitle || s.title)}</h3>
      <div class="story">${esc(s.story)}</div>
      <ul class="list">${(s.tasks||[]).slice(0,3).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>
      <div class="actions"><button onclick="showScenario('${esc(s.id)}')">Voir le détail</button></div>
    </article>
  `).join('');
}
function showScenario(id){
  const s = scenarios.find(x => x.id===id); if(!s) return;
  modal(`
    <h2>${esc(s.displayTitle || s.title)}</h2>
    <p><strong>${esc(s.subtitle || '')}</strong></p>
    <p>${esc(s.story)}</p>
    <p>${esc(s.intro || '')}</p>
    <h3>Épreuves</h3>
    <ul class="list">${(s.taskCards||[]).map(t=>`<li><strong>${esc(t.title)}</strong> — ${esc(t.description)}<br><em>${esc(t.why)}</em></li>`).join('')}</ul>
    <h3>Rôles</h3>
    <ul class="list">${(s.roles||[]).map(r=>`<li>${esc(r)}</li>`).join('')}</ul>
  `);
}
function generateSession(){
  const f = selectedFilters(), matches = matchingScenarios(f);
  if(!matches.length){ qs('#matchingResults').innerHTML = `Aucun scénario trouvé avec ces critères.`; return; }
  const selected = matches.slice(0, Math.min(f.teams, matches.length));
  const teams = Array.from({length:f.teams}, (_,i) => ({ code: TEAM_CODES[i], title: selected[i % selected.length].displayTitle || selected[i % selected.length].title, scenario: selected[i % selected.length] }));
  state.session = { ...f, teamsData: teams, commonFinal: "Assembler les informations de chaque équipe pour ouvrir la finale commune." };
  renderSession(); generateTeamLinks(); openTab('session');
}
function renderSession(){
  const s = state.session; if(!s) return;
  qs('#sessionOutput').innerHTML = `
    <article class="mission-card">
      <div class="pillbar"><span class="pill">${esc(s.sessionName)}</span><span class="pill">${s.teams} équipes</span><span class="pill">${esc(s.location)}</span></div>
      <h3>Brief global</h3>
      <div class="story">Toutes les équipes jouent en simultané avec des missions différentes. Elles ne peuvent pas se copier mais convergent toutes vers la même finale.</div>
      <ul class="list"><li>Âge : ${esc(s.age)}</li><li>Difficulté : ${esc(s.difficulty)}</li><li>Lieu : ${esc(s.location)}</li><li>Finale commune : ${esc(s.commonFinal)}</li></ul>
    </article>
    ${s.teamsData.map((t,idx)=>`
      <article class="mission-card" style="box-shadow: inset 0 0 0 2px ${esc(t.scenario.themeColor)}">
        <div class="pillbar"><span class="pill">${esc(t.code)}</span><span class="pill">Équipe ${idx+1}</span></div>
        <h3>${esc(t.title)}</h3>
        <div class="story">${esc(t.scenario.story)}</div>
        <ul class="list">${(t.scenario.tasks||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
      </article>`).join('')}
  `;
}
function generateTeamLinks(){
  const s = state.session; if(!s) return;
  const base = location.origin + location.pathname;
  qs('#teamLinks').innerHTML = s.teamsData.map((t,idx)=>`
    <article class="team-card" style="box-shadow: inset 0 0 0 2px ${esc(t.scenario.themeColor)}">
      <div class="pillbar"><span class="pill">${esc(t.code)}</span><span class="pill">Équipe ${idx+1}</span></div>
      <h3>${esc(t.title)}</h3>
      <p class="story">Lien direct pour l’équipe. Elle ne verra que ses propres missions.</p>
      <div class="inline-code">${esc(base)}?team=${esc(t.code)}</div>
    </article>`).join('');
}
function hydrateFromUrl(){ const team = new URLSearchParams(location.search).get('team'); if(team){ openTab('equipe'); renderTeamView(team.toUpperCase()); } }
function renderTeamView(teamCode){
  const s = state.session; let code = teamCode || new URLSearchParams(location.search).get('team');
  if(!code){ qs('#teamView').innerHTML = `<div class="notice">Génère une session puis ouvre un lien d’équipe pour voir ce mode.</div>`; return; }
  if(!s){ qs('#teamView').innerHTML = `<div class="notice">Aucune session active dans cette page. Génère d’abord une session depuis le mode animateur.</div>`; return; }
  const found = s.teamsData.find(t => t.code === code.toUpperCase());
  if(!found){ qs('#teamView').innerHTML = `<div class="notice">Code équipe introuvable.</div>`; return; }
  qs('#teamView').innerHTML = `<article class="team-card" style="box-shadow: inset 0 0 0 2px ${esc(found.scenario.themeColor)}"><div class="pillbar"><span class="pill">${esc(found.code)}</span><span class="pill">${esc(found.scenario.ageLabel)}</span><span class="pill">${esc(found.scenario.difficulty)}</span></div><h3>${esc(found.title)}</h3><div class="story">${esc(found.scenario.story)}</div><h3>Votre mission</h3><ul class="list">${(found.scenario.tasks||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ul><h3>Votre objectif final</h3><p class="story">Vous devez gagner vos indices, protéger votre information et atteindre la finale commune.</p></article>`;
}
function renderCodes(){
  qs('#codesGrid').innerHTML = codes.slice(0,24).map(c=>`
    <article class="mission-card">
      <div class="pillbar"><span class="pill">${esc(c.label||('Station '+c.station))}</span><span class="pill">Niveau ${esc(c.level||'1')}</span></div>
      <h3>${esc(c.code)}</h3>
      <button class="qr-button" onclick="showCodeHelp('${esc(c.code)}', ${c.station}, ${c.level||1})">
        <img src="assets/qr/station-${String(c.station).padStart(2,'0')}.png" alt="${esc(c.code)}">
      </button>
      <div class="story">Clique sur le QR pour voir son utilité.</div>
    </article>`).join('');
}
function showCodeHelp(code, station, level){
  modal(`<h2>QR ${esc(code)}</h2><p><strong>Station :</strong> ${station}</p><p><strong>Niveau :</strong> ${level}</p><p>Ce QR sert à débloquer un indice, un pouvoir, un message secret ou une étape de puzzle final. Il doit être utilisé uniquement au moment où le scénario le demande.</p><p><strong>Conseil animateur :</strong> place ce QR sur une affiche, une enveloppe, une balise ou une zone de jeu.</p>`);
}
function exportPrintable(){
  if(!state.session) return;
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Déroulé V8</title><style>body{font-family:Arial;padding:30px}.card{border:1px solid #ccc;border-radius:12px;padding:14px;margin-bottom:14px}</style></head><body><h1>${esc(state.session.sessionName)}</h1>${state.session.teamsData.map((t,i)=>`<div class="card"><h2>Équipe ${i+1} · ${esc(t.code)}</h2><h3>${esc(t.title)}</h3><p>${esc(t.scenario.story)}</p><ul>${(t.scenario.tasks||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</body></html>`);
  win.document.close();
}
init();
