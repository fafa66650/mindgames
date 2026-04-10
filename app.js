
const APP = document.getElementById('app');
const RAIN = document.getElementById('rain');
const CTX = RAIN.getContext('2d');
let audioCtx = null;
let ambienceNode = null;

function initAudio(){ if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); return audioCtx; }
function beep(freq=440,dur=.15,type='sine',vol=.03){
  try{
    const ctx = initAudio();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
  }catch(e){}
}
function playOk(){ beep(760,.12,'triangle',.03); setTimeout(()=>beep(980,.12,'triangle',.02),90); }
function playBad(){ beep(180,.18,'sawtooth',.035); setTimeout(()=>beep(130,.18,'sawtooth',.03),100); }
function playTension(){ beep(320,.08,'square',.016); }
function toggleAmbience(on=true){
  try{
    const ctx = initAudio();
    if(ambienceNode){ ambienceNode.osc.stop(); ambienceNode = null; }
    if(!on) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain(), filter = ctx.createBiquadFilter();
    osc.type = 'sawtooth'; osc.frequency.value = 58;
    filter.type = 'lowpass'; filter.frequency.value = 240;
    gain.gain.value = .008;
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.start(); ambienceNode = {osc,gain};
  }catch(e){}
}
function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'').trim(); }

const THEMES = {
  night: {
    body: 'theme-night',
    title: 'NIGHT PROTOCOL',
    mood: 'Enquête, néons, pluie, surveillance.',
    rules: 'Lis tout. Doute intelligemment. Une mauvaise réponse ressemble souvent à une bonne pendant quelques secondes. Avant de demander la réponse, l’équipe doit d’abord utiliser ses cartes aide si elle bloque.',
    introLines: [
      'Transmission instable…',
      'Une infiltration a été confirmée dans votre périmètre.',
      'Plusieurs fragments ont été altérés avant votre arrivée.',
      'Certaines preuves sont vraies. D’autres ont été injectées pour vous faire conclure trop vite.',
      'Vous n’avez qu’une seule chance de garder une lecture froide.',
      'Réseau rétabli. Mission autorisée.'
    ],
    assetLabels: ['Dossier altéré', 'Mur de néons', 'Console brouillée', 'Badges incohérents'],
    finalPrompt: 'Quel profil reste la piste finale la plus solide ?',
    finalChoices: ['A · Agent noir','B · Agent blanc','C · Agent gris','D · Agent bleu'],
    finalAnswer: 1,
    bank: {
      facile: [
        {kind:'logic', type:'text', title:'Déclaration verrouillée', scene:'Trois agents sont interrogés. Un seul dit vrai.', prompt:'A dit : “B ment.” B dit : “C ment.” C dit : “A et B mentent.” Qui dit vrai ?', validator:v=>norm(v)==='c', exp:'Si C dit vrai, alors A et B mentent. La structure reste cohérente jusqu’au bout.', free:'🧠 Commence par l’hypothèse la plus forte.', h1:'Teste C vrai, puis remonte.', h2:'La bonne réponse est C.', fragment:'N'},
        {kind:'observation', type:'choice', visual:'surveillance', title:'Écran de badge', scene:'Quatre badges apparaissent. Un seul casse la logique d’orientation.', prompt:'Quel badge est incohérent ?', choices:['A · Badge 1','B · Badge 2','C · Badge 3','D · Badge 4'], answerIndex:3, exp:'Les trois premiers portent leur repère dans le même coin. Le quatrième l’inverse.', free:'👁️ Cherche ce qui change de coin.', h1:'Le symbole ne change pas, seule sa position.', h2:'Le badge incohérent est le 4.', fragment:'7'},
        {kind:'deduction', type:'choice', visual:'document', title:'Dossier scellé 04', scene:'Le rapport donne trois indices fiables : le traître n’était pas au quai, le badge bleu est exclu, et la sortie a eu lieu après 22h.', prompt:'Quel profil reste cohérent ?', choices:['A · Quai / badge bleu / 21h40','B · Hall / badge noir / 22h15','C · Quai / badge noir / 22h20','D · Hall / badge bleu / 22h30'], answerIndex:1, exp:'A et C tombent à cause du quai. D tombe à cause du badge bleu. Il reste B.', free:'🧾 Élimine d’abord le quai.', h1:'Puis élimine le badge bleu.', h2:'Le profil cohérent est B.', fragment:'G'}
      ],
      moyen: [
        {kind:'pattern', type:'choice', title:'Signal miroir', scene:'Une seule séquence est parfaitement symétrique.', prompt:'Quelle ligne respecte le miroir ?', choices:['A · ▲ ● ■ ■ ● ▲','B · ▲ ● ■ ● ■ ▲','C · ● ▲ ■ ■ ● ▲','D · ▲ ● ▲ ▲ ● ■'], answerIndex:0, exp:'A se relit de droite à gauche sans casser la structure.', free:'🔁 Relis depuis la fin.', h1:'Le centre doit se répondre exactement.', h2:'La bonne ligne est A.', fragment:'4'},
        {kind:'logic', type:'choice', title:'Mot-clé masqué', scene:'Le terminal indique : le mot-clé contient 5 lettres. La 2e est A. La 5e est E. Ce n’est ni ALIVE ni FABLE.', prompt:'Quel mot reste possible ?', choices:['A · TABLE','B · CABLE','C · CARTE','D · SALVE'], answerIndex:3, exp:'SALVE est le seul mot qui garde A en 2e, E en 5e, sans être exclu.', free:'🧠 Vérifie toutes les contraintes dans l’ordre.', h1:'Deux choix tombent sur la position finale.', h2:'Le mot possible est SALVE.', fragment:'H'},
        {kind:'memory', type:'choice', title:'Lecture brève', scene:'Le message s’affiche une seconde : pluie, lanterne, clé cuivre, vitre fendue, quai vide.', prompt:'Quel duo apparaissait vraiment ?', choices:['A · clé cuivre + vitre fendue','B · pluie + torche blanche','C · quai vide + badge rouge','D · lanterne + moteur bleu'], answerIndex:0, exp:'A est la seule proposition qui reprend exactement deux éléments sans les modifier.', free:'📝 Cherche le duo qui ne change aucun mot important.', h1:'Les faux adjectifs sont le piège principal.', h2:'Le bon duo est A.', fragment:'2'},
        {kind:'observation', type:'choice', visual:'trajectories', title:'Trajectoires surveillées', scene:'Quatre trajectoires paraissent cohérentes. Une seule casse la direction d’ensemble.', prompt:'Quelle trajectoire est fausse ?', choices:['A · Trace 1','B · Trace 2','C · Trace 3','D · Trace 4'], answerIndex:3, exp:'Les trois premières montent dans le même sens. La quatrième inverse brutalement l’angle.', free:'👁️ Ce n’est pas la forme : c’est le sens qui trahit.', h1:'Compare d’abord les angles.', h2:'La trajectoire fausse est la 4.', fragment:'9'},
        {kind:'logic', type:'text', title:'Heure tronquée', scene:'Un journal note : si l’agent noir sort avant 22h, alors la taupe ne peut pas être au hall. Or la taupe est au hall. Qu’en déduire sur l’agent noir ?', prompt:'Réponse libre attendue.', validator:v=>norm(v).includes('apres22h') || norm(v).includes('nesortpasavant22h') || norm(v).includes('ilnestpassortiavant22h'), exp:'Par contraposée, si la taupe est bien au hall, alors l’agent noir ne peut pas être sorti avant 22h.', free:'🧠 Ce n’est pas une question de culture, mais de logique conditionnelle.', h1:'“Si A alors B” et “non B”, donc…', h2:'Il n’est pas sorti avant 22h.', fragment:'K'}
      ],
      difficile: [
        {kind:'logic', type:'text', title:'Salle d’interrogatoire', scene:'Quatre phrases ont été enregistrées. Une seule peut tenir sans contradiction avec les autres.', prompt:'A : “Je suis innocent et B ment.”\\nB : “C était avec moi toute la soirée.”\\nC : “A et D ne disent pas la vérité.”\\nD : “Si B ment, alors A ment aussi.”\\n\\nQuelle phrase est la plus crédible ?', validator:v=>norm(v)==='d', exp:'D est la seule phrase qui reste stable quand on teste les autres hypothèses.', free:'🧠 Cherche une structure conditionnelle stable.', h1:'Teste le cas où B ment. Que force alors D ?', h2:'La phrase la plus crédible est D.', fragment:'T'},
        {kind:'code', type:'choice', title:'Clavier asymétrique', scene:'Le terminal impose un code à 4 chiffres. Leur somme vaut 18. Le 2e vaut le 1er + 2. Le dernier vaut la moitié du 3e.', prompt:'Quel code reste cohérent ?', choices:['A · 4 - 6 - 8 - 4','B · 2 - 4 - 8 - 4','C · 3 - 5 - 6 - 3','D · 5 - 7 - 4 - 2'], answerIndex:1, exp:'B respecte les relations internes et la somme 18.', free:'🔐 Fixe d’abord la relation 2e = 1er + 2.', h1:'Puis vérifie la moitié entre le 3e et le 4e.', h2:'Le code cohérent est B.', fragment:'A'},
        {kind:'strategy', type:'choice', title:'Fenêtre de tirage', scene:'Le protocole te donne deux options : verrouiller maintenant en perdant un fragment, ou relire une dernière fois en perdant 20 secondes.', prompt:'Quel choix maximise vos chances de finir correctement ?', choices:['A · Verrouiller maintenant','B · Relire encore','C · Ignorer le fragment','D · Réinitialiser au hasard'], answerIndex:1, exp:'Dans Night Protocol, les faux évidents sont nombreux. Relire avant la fermeture reste le meilleur choix stratégique.', free:'⚠️ Ici, la précipitation est le vrai piège.', h1:'Le protocole récompense la lucidité avant la vitesse brute.', h2:'Le meilleur choix est B.', fragment:'3'},
        {kind:'deduction', type:'text', title:'Double alibi croisé', scene:'Deux agents se couvrent mutuellement. Or on sait qu’au moins un des deux ment et qu’aucun menteur ne protège un innocent dans cette cellule.', prompt:'Que peut-on déduire sur la paire ?', validator:v=>norm(v).includes('lesdeuxsontsuspects') || norm(v).includes('lesdeuxsuspects') || norm(v).includes('aucundesdeuxnestfiable') || norm(v).includes('aucundeseuxnestfiable'), exp:'Si au moins un ment et qu’aucun menteur ne protège un innocent, la paire entière devient non fiable.', free:'🧠 Ce n’est pas “trouver le coupable”, c’est qualifier la paire.', h1:'Le menteur ne peut pas blanchir un innocent ici.', h2:'La paire entière devient suspecte / non fiable.', fragment:'Q'}
      ],
      extreme: [
        {kind:'meta', type:'choice', title:'Croisement lourd', scene:'Tu disposes de quatre fragments de règle : la taupe n’utilise jamais la sortie principale ; si l’agent noir ment, l’agent gris ment aussi ; l’agent gris n’était pas sur zone après 22h ; la taupe était encore là après 22h.', prompt:'Quel agent reste le plus crédible comme taupe ?', choices:['A · Agent noir','B · Agent blanc','C · Agent gris','D · Agent bleu'], answerIndex:1, exp:'Le gris tombe à cause de l’heure. Le noir reste instable à cause de la condition. Le blanc est la piste la plus stable.', free:'🧠 Commence par éliminer ce qui viole directement l’heure.', h1:'Le gris tombe tout de suite. Le noir reste fragile.', h2:'La piste la plus stable est l’agent blanc.', fragment:'E'},
        {kind:'observation', type:'text', visual:'grid9', title:'Grille de surveillance 9 cases', scene:'Huit cases suivent un déplacement régulier du repère. Une seule brise la logique générale.', prompt:'Quel numéro de case est l’intrus ?', validator:v=>norm(v)==='9' || norm(v)==='case9', exp:'Les huit premières suivent un rythme progressif. La neuvième casse l’ensemble.', free:'👁️ Ce n’est pas la forme qui change, c’est le rythme du déplacement.', h1:'Observe comment le point glisse de case en case.', h2:'L’intrus est la case 9.', fragment:'1'},
        {kind:'logic', type:'text', title:'Recoupement terminal', scene:'On sait que si le traître passe par le hall, alors le badge noir est exclu. On sait aussi que si le hall est exclu, la sortie principale devient impossible. Or la sortie principale est impossible. Que déduire sur le hall ?', prompt:'Réponse libre attendue.', validator:v=>norm(v).includes('lehallsrestepossible') || norm(v).includes('onpeutpaslexclure') || norm(v).includes('lehallsestpossible') || norm(v).includes('lehallsnestsurementpasurexclu'), exp:'Le piège est de conclure trop vite. “Sortie principale impossible” ne suffit pas à exclure le hall ; au contraire, le hall reste possible.', free:'🧠 Ici, il faut éviter l’inversion abusive.', h1:'Ne transforme pas “si A alors B” en “si B alors A”.', h2:'Le hall reste possible / on ne peut pas l’exclure.', fragment:'R'}
      ]
    }
  },
  jungle: {
    body: 'theme-jungle',
    title: 'L’EXPÉDITION INTERDITE',
    mood: 'Ruines, jungle, glyphes, chemins perdus.',
    rules: 'Dans la jungle, la lecture du terrain compte autant que la vitesse. Les pièges sont souvent visuels ou liés à l’ordre des repères.',
    introLines: [
      'La jungle ne se tait jamais complètement.',
      'Les murs anciens répondent à peine, mais ils répondent.',
      'Des chemins se ressemblent. Les vrais repères se cachent dans l’ordre, pas dans la forme.',
      'Un mauvais choix peut t’éloigner de la sortie pendant de longues minutes.',
      'Expédition ouverte.'
    ],
    assetLabels: ['Carte fragmentée', 'Glyphes humides', 'Passage des ruines', 'Tablette rituelle'],
    finalPrompt: 'Quelle dernière piste ouvre vraiment le passage ?',
    finalChoices: ['A · Nord', 'B · Centre', 'C · Est', 'D · Ouest'],
    finalAnswer: 1,
    bank: {
      facile: [
        {kind:'navigation', type:'choice', title:'Le couloir des ruines', scene:'La route correcte doit suivre : arche creuse, zone détrempée, dalle gravée, clairière.', prompt:'Quelle route reste crédible ?', choices:['A · Est / arche / zone humide / dalle / clairière','B · Ouest / arche / clairière / zone humide','C · Nord / dalle / arche / clairière','D · Sud / rivière / colline / 2 pierres'], answerIndex:0, exp:'A garde les bons repères dans le bon ordre.', free:'🧭 L’ordre complet est la clé.', h1:'La clairière vient après la dalle.', h2:'La bonne route commence par l’Est.', fragment:'V'},
        {kind:'pattern', type:'choice', title:'La mosaïque humide', scene:'Une frise doit être symétrique depuis le centre vers les bords.', prompt:'Quelle ligne garde la bonne symétrie ?', choices:['A · feuille / eau / soleil / soleil / eau / feuille','B · feuille / eau / lune / soleil / eau / feuille','C · eau / feuille / soleil / soleil / eau / feuille','D · feuille / eau / soleil / lune / eau / feuille'], answerIndex:0, exp:'A est la seule séquence qui répond exactement en miroir.', free:'🔁 Relis la ligne depuis la fin.', h1:'Le centre doit se répondre exactement.', h2:'La bonne suite est A.', fragment:'E'}
      ],
      moyen: [
        {kind:'code', type:'choice', title:'Le mécanisme des runes', scene:'Le code a 4 chiffres pairs différents. Leur somme vaut 20 et le deuxième vaut le premier + 2.', prompt:'Quelle séquence est valable ?', choices:['A · 2 - 4 - 6 - 8','B · 4 - 6 - 8 - 2','C · 6 - 8 - 4 - 2','D · 2 - 6 - 4 - 8'], answerIndex:0, exp:'A valide tout.', free:'🔐 Commence par la relation entre le 1er et le 2e chiffre.', h1:'La somme 20 élimine déjà beaucoup d’options.', h2:'La bonne séquence commence par 2 puis 4.', fragment:'R'},
        {kind:'observation', type:'choice', title:'Le mur des glyphes', scene:'Cinq glyphes appartiennent à deux familles répétées. Un seul n’appartient à aucune famille.', prompt:'Quel glyphe est isolé ?', choices:['A · 2e','B · 4e','C · 5e','D · 1er'], answerIndex:2, exp:'Les glyphes 1 et 3 se répondent, 2 et 4 aussi. Le 5e reste isolé.', free:'👁️ Cherche celui qui n’a aucun jumeau.', h1:'Deux paires se forment avant l’intrus.', h2:'Le glyphe isolé se trouve à la fin.', fragment:'T'},
        {kind:'memory', type:'choice', title:'Le carnet détrempé', scene:'Le carnet s’ouvre une seconde : pierre rouge, clé cuivre, feuille noire, roue d’obsidienne, corde verte.', prompt:'Quel duo était visible ?', choices:['A · roue d’obsidienne + corde verte','B · pierre rouge + lampe blanche','C · feuille noire + gourde','D · clé cuivre + torche'], answerIndex:0, exp:'A est le seul duo entièrement présent dans la scène.', free:'👁️ Une seule proposition contient deux vrais éléments vus ensemble.', h1:'Élimine les objets jamais cités.', h2:'Le bon duo réunit la roue et la corde.', fragment:'U'}
      ],
      difficile: [
        {kind:'choice', type:'choice', title:'La chambre des faux leviers', scene:'Un message prévient : “ne choisis pas le levier central, sauf si la lampe bleue s’éteint.” La lampe bleue est encore allumée.', prompt:'Quel levier faut-il éviter ?', choices:['A · Levier gauche','B · Levier central','C · Levier droit','D · Aucun'], answerIndex:1, exp:'Tant que la lampe bleue reste allumée, il faut éviter le levier central.', free:'⚠️ Ici, le décor donne déjà la règle.', h1:'La lampe bleue n’est pas éteinte.', h2:'Le levier central est interdit.', fragment:'R'},
        {kind:'logic', type:'text', title:'La salle des 4 dalles', scene:'Quatre dalles doivent être activées dans l’ordre, mais deux se copient mutuellement. On sait que la 2e est après la 4e, et que la 1re n’est jamais jouée la dernière.', prompt:'Quelle dalle ne peut pas être jouée en premier : 1, 2, 3 ou 4 ?', validator:v=>norm(v)==='2', exp:'Si la 2e doit venir après la 4e, elle ne peut pas ouvrir la séquence.', free:'🧠 Une seule dalle est bloquée dès la première condition.', h1:'Pense “avant / après”, pas “forte / faible”.', h2:'La dalle 2 ne peut pas être jouée en premier.', fragment:'O'}
      ],
      extreme: [
        {kind:'meta', type:'choice', title:'La clé du sanctuaire', scene:'Les fragments réunis indiquent une entrée stable, mais l’une des quatre directions casse toujours la logique du parcours.', prompt:'Quelle direction reste la plus solide ?', choices:['A · Nord','B · Centre','C · Est','D · Ouest'], answerIndex:1, exp:'Le centre reste la seule direction cohérente quand on recoupe les fragments.', free:'🧠 La bonne piste n’est pas la plus spectaculaire, mais la plus stable.', h1:'Le faux chemin a l’air plus “épique”.', h2:'La direction stable est le centre.', fragment:'C'}
      ]
    }
  },
  lab: {
    body: 'theme-lab',
    title: 'ZONE 13',
    mood: 'Laboratoire, alarme, stabilisation, urgence.',
    rules: 'Dans Zone 13, chaque action a un coût. Les énigmes favorisent le tri, la lecture technique et la gestion de pression.',
    introLines: [
      'L’alarme a déjà commencé quand vous entrez.',
      'La lumière change, les signaux se déclenchent en cascade, et plusieurs écrans se contredisent.',
      'Dans Zone 13, chaque action a un coût. Chaque hésitation a un impact.',
      'Ce qu’il faut, c’est de la vitesse intelligente.',
      'Protocole activé.'
    ],
    assetLabels: ['Panneau d’alerte', 'Circuit instable', 'Rapport de confinement', 'Écran parasite'],
    finalPrompt: 'Quelle lettre verrouille la sécurité finale ?',
    finalChoices: ['A · R','B · N','C · I','D · U'],
    finalAnswer: 1,
    bank: {
      facile: [
        {kind:'code', type:'choice', title:'Code de stabilisation', scene:'Le panneau impose un code dont la somme vaut 12, avec trois chiffres égaux.', prompt:'Quelle combinaison doit être validée ?', choices:['A · 4 - 4 - 4','B · 3 - 3 - 6','C · 2 - 5 - 5','D · 1 - 1 - 10'], answerIndex:0, exp:'4-4-4 est la seule combinaison qui respecte à la fois la somme et l’égalité.', free:'🔐 Le mot important ici est “égaux”.', h1:'La somme 12 doit être atteinte avec trois chiffres identiques.', h2:'La combinaison correcte est 4 - 4 - 4.', fragment:'S'},
        {kind:'logic', type:'choice', title:'Suite critique', scene:'La suite affichée grimpe trop vite pour être lue à moitié : 2, 4, 8, ?', prompt:'Quelle valeur doit suivre ?', choices:['A · 16','B · 10','C · 12','D · 14'], answerIndex:0, exp:'La valeur double à chaque étape : 2, 4, 8, 16.', free:'🧠 La logique ne change pas en cours de route.', h1:'Chaque valeur vaut le double de la précédente.', h2:'La bonne réponse est 16.', fragment:'A'}
      ],
      moyen: [
        {kind:'strategy', type:'choice', title:'Protocole d’urgence', scene:'Attendre peut aggraver la situation. Fuir coupe toute chance de stabilisation.', prompt:'Quelle action reste la plus crédible ?', choices:['A · Attendre','B · Agir','C · Fuir','D · Éteindre tout'], answerIndex:1, exp:'Agir reste la seule réponse cohérente dans cette configuration.', free:'⚠️ Élimine les options qui abandonnent le problème.', h1:'Attendre ou fuir ne stabilisent rien.', h2:'Il faut agir.', fragment:'F'},
        {kind:'observation', type:'choice', title:'Écran parasite', scene:'Quatre lignes semblent correctes, mais une seule casse la logique d’ensemble.', prompt:'Quelle ligne est incohérente ?', choices:['A · 22 / 24 / 26','B · 30 / 32 / 34','C · 12 / 16 / 14','D · 40 / 42 / 44'], answerIndex:2, exp:'A, B et D suivent une progression régulière de +2. C casse cette logique.', free:'👁️ Trois lignes gardent la même montée régulière.', h1:'Cherche la seule ligne qui brise le rythme.', h2:'La ligne C casse la progression.', fragment:'E'},
        {kind:'memory', type:'choice', title:'Rapport de confinement', scene:'Le rapport affiche : vanne rouge, chambre 4, niveau 2, clé noire, module est.', prompt:'Quel élément n’était pas présent ?', choices:['A · chambre 4','B · clé noire','C · niveau 3','D · module est'], answerIndex:2, exp:'Niveau 3 n’apparaissait pas : le rapport indiquait niveau 2.', free:'📝 Un seul élément a été modifié.', h1:'Tout est correct sauf le niveau.', h2:'Le faux élément est niveau 3.', fragment:'T'}
      ],
      difficile: [
        {kind:'choice', type:'choice', title:'Fermeture finale', scene:'Le système propose deux actions : lancer la fermeture générale maintenant, ou vérifier une dernière fois le circuit.', prompt:'Quel choix garde le plus de maîtrise ?', choices:['A · Fermer immédiatement sans relire','B · Vérifier le dernier circuit puis fermer','C · Ignorer le dernier circuit','D · Rebooter tout au hasard'], answerIndex:1, exp:'Dans un environnement critique, relire une dernière fois avant la fermeture reste la décision la plus robuste.', free:'⚠️ Le bon réflexe mélange vitesse et contrôle.', h1:'La précipitation pure est une fausse sécurité.', h2:'Vérifier puis fermer est la meilleure piste.', fragment:'Y'},
        {kind:'logic', type:'text', title:'Chambre d’inversion', scene:'Si la chambre A déborde, alors la chambre C coupe le flux. Or le flux n’est pas coupé. Que peut-on affirmer sur A ?', prompt:'Réponse libre attendue.', validator:v=>norm(v).includes('anedebordepas') || norm(v).includes('lanedebordepas') || norm(v).includes('apasdeborde'), exp:'Par contraposée : si le flux n’est pas coupé, A n’a pas débordé.', free:'🧠 Cherche la contraposée utile.', h1:'Si A alors B ; non B donc…', h2:'A n’a pas débordé.', fragment:'N'}
      ],
      extreme: [
        {kind:'meta', type:'choice', title:'Dernière stabilisation', scene:'Les fragments restants forment SAFE TY. Une seule lettre manque pour verrouiller le protocole.', prompt:'Quelle lettre manque ?', choices:['A · R','B · N','C · I','D · U'], answerIndex:1, exp:'SAFE TY devient SAFETY avec N.', free:'🧠 Le mot final doit signifier sécurité.', h1:'Le protocole cherche un mot de stabilisation.', h2:'La lettre manquante est N.', fragment:'L'}
      ]
    }
  }
};

let state = {
  theme: 'night',
  totalPlayers: 18,
  teamCount: 3,
  publicType: 'adultes',
  difficulty: 'difficile',
  duration: 3600,
  teams: [],
  activeTeam: 0,
  hints: 0,
  time: 0,
  index: 0,
  picked: null,
  attempts: 0,
  selectedChallenges: [],
  fragments: [],
  timerActive: false,
  metaPick: null
};

function saveState(){ localStorage.setItem('fafa_state_ultimate', JSON.stringify(state)); }
function loadState(){ try{ const raw = localStorage.getItem('fafa_state_ultimate'); if(raw) Object.assign(state, JSON.parse(raw)); }catch(e){} }
function clearState(){ localStorage.removeItem('fafa_state_ultimate'); }
function route(){ return location.hash || '#admin'; }

function setTheme(){ document.body.className = THEMES[state.theme].body; }
function teamDistribution(total, teams){
  const base=Math.floor(total/teams), rest=total%teams;
  if(rest===0) return `${teams} équipes de ${base}`;
  return `${rest} équipes de ${base+1} · ${teams-rest} équipes de ${base}`;
}
function teamLink(i){ return `${location.origin}${location.pathname}#team-${i}`; }
function currentTheme(){ return THEMES[state.theme]; }
function initTeams(){
  const suggested = Math.ceil(state.totalPlayers / state.teamCount);
  if(state.teams.length !== state.teamCount){
    state.teams = Array.from({length:state.teamCount}, (_,i)=>({
      name:`Équipe ${i+1}`,
      players:Array.from({length:suggested}, ()=>''), score:0, progress:0
    }));
  }
}
function currentTeam(){ return state.teams[state.activeTeam] || {name:'Équipe',players:[],score:0,progress:0}; }
function currentPlayer(){
  const team = currentTeam();
  if(!team.players.length) return team.name;
  return team.players[state.index % team.players.length] || team.name;
}
function timerColor(){ if(state.time > 120) return 'green'; if(state.time > 45) return 'orange'; return 'red'; }
function fmt(t){ const m=String(Math.floor(t/60)).padStart(2,'0'); const s=String(t%60).padStart(2,'0'); return `${m}:${s}`; }

function chooseChallenges(){
  const GAME = currentTheme();
  const order = {facile:['facile'], moyen:['facile','moyen'], difficile:['moyen','difficile'], extreme:['difficile','extreme']};
  let count = state.duration <= 1800 ? 4 : state.duration <= 2700 ? 5 : state.duration <= 3600 ? 6 : state.duration <= 5400 ? 7 : 8;
  if(state.publicType === 'enfants') count = Math.max(4, count - 1);
  if(state.publicType === 'ados') count = count;
  if(state.publicType === 'adultes') count = Math.min(9, count + (state.difficulty === 'extreme' ? 1 : 0));
  let arr=[]; (order[state.difficulty]||['moyen']).forEach(k=>arr=arr.concat(GAME.bank[k]||[]));
  return arr.slice(0,count);
}

function renderAdmin(){
  setTheme();
  const GAME = currentTheme();
  APP.innerHTML = `
    <div class="hero">
      <div><img src="./assets/logo.png" class="hero-logo" alt="logo"></div>
      <div>
        <div class="kicker">FAFATRAINING GAME ARENA</div>
        <h1>${GAME.title}</h1>
        <div class="subtitle">Version ultime GitHub only : tout tourne uniquement en statique, compatible GitHub Pages. Admin privé, vues équipe par lien, quantités d’épreuves adaptées à l’âge, au public, à la difficulté et à la durée.</div>
      </div>
      <div class="hero-stats">
        <div class="stat a"><strong>${state.teamCount}</strong><span>équipes</span></div>
        <div class="stat b"><strong>${state.totalPlayers}</strong><span>joueurs</span></div>
        <div class="stat c"><strong>${state.difficulty}</strong><span>difficulté</span></div>
        <div class="stat d"><strong>${state.duration/60} min</strong><span>durée</span></div>
      </div>
    </div>

    <section class="panel">
      <h2 class="section-title">Administration de mission</h2>
      <div class="admin-grid">
        <div>
          <div class="grid4">
            <div><label>Thème</label><select id="theme">${Object.keys(THEMES).map(k=>`<option value="${k}" ${state.theme===k?'selected':''}>${THEMES[k].title}</option>`).join('')}</select></div>
            <div><label>Nombre total de joueurs</label><input id="totalPlayers" type="number" min="2" value="${state.totalPlayers}"></div>
            <div><label>Nombre d’équipes</label><select id="teamCount">${[2,3,4,5,6].map(n=>`<option value="${n}" ${state.teamCount==n?'selected':''}>${n} équipes</option>`).join('')}</select></div>
            <div><label>Type de public</label><select id="publicType">
              <option value="enfants" ${state.publicType==='enfants'?'selected':''}>Enfants</option>
              <option value="ados" ${state.publicType==='ados'?'selected':''}>Ados</option>
              <option value="adultes" ${state.publicType==='adultes'?'selected':''}>Adultes</option>
            </select></div>
          </div>
          <div class="grid3" style="margin-top:14px">
            <div><label>Difficulté</label><select id="difficulty">
              <option value="facile" ${state.difficulty==='facile'?'selected':''}>Facile</option>
              <option value="moyen" ${state.difficulty==='moyen'?'selected':''}>Moyen</option>
              <option value="difficile" ${state.difficulty==='difficile'?'selected':''}>Difficile</option>
              <option value="extreme" ${state.difficulty==='extreme'?'selected':''}>Extrême</option>
            </select></div>
            <div><label>Durée</label><select id="duration">
              <option value="1800" ${state.duration===1800?'selected':''}>30 min</option>
              <option value="2700" ${state.duration===2700?'selected':''}>45 min</option>
              <option value="3600" ${state.duration===3600?'selected':''}>60 min</option>
              <option value="5400" ${state.duration===5400?'selected':''}>90 min</option>
              <option value="7200" ${state.duration===7200?'selected':''}>120 min</option>
            </select></div>
            <div><label>Nombre d’épreuves auto</label><input disabled value="${chooseChallenges().length} épreuves + méta final"></div>
          </div>
          <div class="btns">
            <button class="btn-main" onclick="buildTeams()">GÉNÉRER LES ÉQUIPES</button>
            <button class="btn-alt" onclick="resetAll()">RÉINITIALISER</button>
          </div>
          <div id="teamsEditor"></div>
        </div>
        <div>
          <div class="goal-grid" style="grid-template-columns:1fr">
            <div class="goal"><h4>Répartition auto</h4><div>${teamDistribution(state.totalPlayers, state.teamCount)}</div></div>
            <div class="goal"><h4>Règles</h4><div>${GAME.rules}</div></div>
            <div class="goal"><h4>GitHub only</h4><div>Tout fonctionne sans backend. Le suivi admin est privé. Les liens d’équipe ouvrent une vue équipe sans tableau complet.</div></div>
          </div>
        </div>
      </div>
    </section>

    <section class="panel">
      <h2 class="section-title">Assets visuels du thème</h2>
      <div class="asset-grid">
        <div class="theme-asset"><h4>${GAME.assetLabels[0]}</h4>${visualBlock('document', state.theme)}</div>
        <div class="theme-asset"><h4>${GAME.assetLabels[1]}</h4>${themeScene('main', state.theme)}</div>
        <div class="theme-asset"><h4>${GAME.assetLabels[2]}</h4>${themeScene('secondary', state.theme)}</div>
        <div class="theme-asset"><h4>${GAME.assetLabels[3]}</h4>${visualBlock('surveillance', state.theme)}</div>
      </div>
    </section>`;
}

function buildTeams(){
  state.theme = document.getElementById('theme').value;
  state.totalPlayers = parseInt(document.getElementById('totalPlayers').value || '18', 10);
  state.teamCount = parseInt(document.getElementById('teamCount').value || '3', 10);
  state.publicType = document.getElementById('publicType').value;
  state.difficulty = document.getElementById('difficulty').value;
  state.duration = parseInt(document.getElementById('duration').value || '3600', 10);
  initTeams();
  setTheme();
  const suggested = Math.ceil(state.totalPlayers / state.teamCount);
  document.getElementById('teamsEditor').innerHTML = `
    <div class="notice"><strong>Concordance joueurs / équipes :</strong><br>${state.totalPlayers} joueurs pour ${state.teamCount} équipes → répartition cible : ${teamDistribution(state.totalPlayers, state.teamCount)}.</div>
    <div class="team-grid">
      ${state.teams.map((team, i)=>`
        <div class="team-card">
          <h4>Équipe ${i+1}</h4>
          <label>Nom d’équipe</label>
          <input id="teamName_${i}" value="${team.name}">
          <label style="margin-top:8px">Joueurs (un par ligne)</label>
          <textarea id="teamPlayers_${i}" placeholder="Nom 1&#10;Nom 2&#10;Nom 3">${team.players.join('\\n')}</textarea>
          <div class="team-link-box">
            <strong>Lien équipe</strong>
            <code>${teamLink(i)}</code>
            <div class="tiny">À ouvrir par l’équipe. Le suivi admin n’y apparaît pas.</div>
          </div>
        </div>`).join('')}
    </div>
    <div class="btns"><button class="btn-main" onclick="startMission()">LANCER LA MISSION</button></div>`;
}

function startMission(){
  initTeams();
  state.teams = state.teams.map((team,i)=>({
    name: document.getElementById(`teamName_${i}`)?.value?.trim() || `Équipe ${i+1}`,
    players: (document.getElementById(`teamPlayers_${i}`)?.value || '').split('\\n').map(x=>x.trim()).filter(Boolean),
    score: 0,
    progress: 0
  }));
  state.hints = 0;
  state.time = state.duration;
  state.index = 0;
  state.activeTeam = 0;
  state.fragments = [];
  state.metaPick = null;
  state.selectedChallenges = chooseChallenges();
  state.timerActive = false;
  saveState();
  location.hash = '#admin-intro';
  renderRoute();
}

function renderAdminDash(){
  return `
    <aside class="dash">
      <h3>Suivi administrateur</h3>
      <div class="small">Visible uniquement côté admin.</div>
      ${state.teams.map((team, idx)=>`
        <div class="dash-team" style="${idx===state.activeTeam?'box-shadow:0 0 0 2px rgba(114,204,255,.28) inset;':''}">
          <strong>${team.name}</strong><br>
          Score : ${team.score} pts<br>
          Progression : ${team.progress}/${state.selectedChallenges.length}<br>
          Joueurs : ${team.players.length || 0}
        </div>`).join('')}
      <div class="btns">
        <button class="btn-dark" onclick="adminBoost()">+100 équipe active</button>
        <button class="btn-dark" onclick="adminHint()">Indice admin</button>
      </div>
      <div id="adminMsg"></div>
    </aside>`;
}
function adminBoost(){ currentTeam().score += 100; saveState(); renderAdminPlay(); }
function adminHint(){
  const c = state.selectedChallenges[state.index];
  document.getElementById('adminMsg').innerHTML = `<div class="freeclue"><strong>Indice admin :</strong><br>${c.free}</div>`;
}

function showIntro(isPlayer=false){
  setTheme(); toggleAmbience(true);
  const GAME = currentTheme();
  APP.innerHTML = `
    <section class="cinematic-screen">
      <div class="cinematic-box">
        <div class="kicker glitch" data-text="TRANSMISSION">TRANSMISSION</div>
        <h1 class="glitch" data-text="${GAME.title}">${GAME.title}</h1>
        <div id="cineBox"></div>
        <div class="btns"><button class="btn-main hidden" id="introBtn" onclick="${isPlayer ? 'goPlayer()' : 'goAdmin()'}">${isPlayer ? 'COMMENCER POUR L’ÉQUIPE' : 'ENTRER DANS LA MISSION'}</button></div>
      </div>
    </section>`;
  let i=0; const box=document.getElementById('cineBox');
  function step(){
    if(i < GAME.introLines.length){
      box.innerHTML += `<div class="cinematic-line fadein">${GAME.introLines[i]}</div>`;
      playTension();
      i++;
      setTimeout(step, 900);
    } else {
      document.getElementById('introBtn').classList.remove('hidden');
      beep(640,.16,'triangle',.03);
    }
  }
  step();
}

function startTicking(){
  if(state.timerActive) return;
  state.timerActive = true;
  saveState();
  const tick = () => {
    loadState();
    if(!state.timerActive) return;
    state.time = Math.max(0, state.time - 1);
    if(state.time === 45) playTension();
    if(state.time === 30) playBad();
    saveState();
    if(state.time <= 0){
      state.timerActive = false;
      saveState();
      finishMission(true);
      return;
    }
    setTimeout(tick, 1000);
  };
  setTimeout(tick, 1000);
}

function goAdmin(){ startTicking(); location.hash='#admin-play'; renderRoute(); }
function goPlayer(){ startTicking(); renderPlayer(); }

function randomEvent(){
  if(Math.random() < 0.34){
    const events = [
      {txt:'🎁 BONUS : +100 points à l’équipe active', fn:()=>currentTeam().score += 100},
      {txt:'💣 SABOTAGE : -80 points à l’équipe active', fn:()=>currentTeam().score = Math.max(0, currentTeam().score - 80)},
      {txt:'⏱ FAILLE TEMPORELLE : -15 secondes', fn:()=>state.time = Math.max(0, state.time - 15)},
      {txt:'⚠️ FAUX INDICE : cette manche contient une évidence piégée', fn:()=>{}},
    ];
    const ev = events[Math.floor(Math.random()*events.length)];
    ev.fn(); return ev.txt;
  }
  return '';
}

function renderAdminPlay(){
  if(state.index >= state.selectedChallenges.length){ renderMeta(true); return; }
  APP.innerHTML = challengeMarkup(true);
}
function renderPlayer(){
  if(state.index >= state.selectedChallenges.length){ renderMeta(false); return; }
  APP.innerHTML = challengeMarkup(false);
}
function challengeMarkup(showAdmin){
  const GAME = currentTheme();
  const c = state.selectedChallenges[state.index];
  const event = showAdmin ? randomEvent() : '';
  const team = currentTeam();
  const names = {logic:'🧠 Logique',observation:'👁 Observation',deduction:'🔐 Déduction',strategy:'⚔️ Stratégie',pattern:'🔁 Motif',code:'🔐 Code',memory:'🧠 Mémoire',meta:'💣 Recoupement',navigation:'🧭 Navigation',choice:'⚡ Choix'};
  return `
    <div class="${showAdmin ? 'game-wrap' : ''}">
      <section class="game-shell fadein">
        <div class="hud">
          <div class="hud-left">
            <div class="badge points">${team.name} · ${team.score} pts</div>
            <div class="badge meta">Épreuve ${state.index+1}/${state.selectedChallenges.length}</div>
            <div class="badge meta">Cartes utilisées : ${state.hints}</div>
          </div>
          <div class="hud-right"><div class="badge timer ${timerColor()}">⏱ ${fmt(state.time)}</div></div>
        </div>
        ${event ? `<div class="eventbox">${event}</div>` : ''}
        <div class="turn">🔥 C’EST À : ${currentPlayer()} DE JOUER</div>
        <div class="rules"><strong>Règle utile :</strong> si l’équipe bloque, elle doit d’abord relire puis utiliser une carte aide avant d’attendre la réponse.</div>
        <div class="story">${c.scene.replace(/\\n/g,'<br>')}</div>
        <div class="help-floating">
          <button class="help-pill" onclick="useHint(1, ${showAdmin})">⚡</button>
          <button class="help-pill" onclick="useHint(2, ${showAdmin})">⚡⚡</button>
          <button class="help-pill" onclick="showFree()">👁</button>
        </div>
        <h2 class="challenge-title">${c.title}</h2>
        <div class="challenge-type">${names[c.kind] || 'Défi'}</div>
        ${c.visual ? visualBlock(c.visual, state.theme) : themeScene('mood', state.theme)}
        <div class="story"><strong>Énigme :</strong><br>${c.prompt.replace(/\\n/g,'<br>')}</div>
        <div id="freeSlot"></div>
        ${c.type === 'choice'
          ? `<div class="choice-grid">${c.choices.map((ch,i)=>`<button class="choice" onclick="pick(${i}, this)">${ch}</button>`).join('')}</div>`
          : `<div class="panel" style="padding:14px;margin-top:14px"><label>Réponse libre</label><input id="freeAnswer" placeholder="Entre ta réponse"></div>`}
        <div id="feedback"></div>
      </section>
      ${showAdmin ? renderAdminDash() : ''}
    </div>
    <div class="validate-bar"><button class="validate-btn" onclick="validate(${showAdmin})">VALIDER LA RÉPONSE</button></div>`;
}
function showFree(){
  const c = state.selectedChallenges[state.index];
  document.getElementById('freeSlot').innerHTML = `<div class="freeclue"><strong>Indice discret :</strong><br>${c.free}</div>`;
}
function pick(i,el){
  document.querySelectorAll('.choice').forEach(x=>x.classList.remove('selected'));
  el.classList.add('selected'); state.picked = i;
}
function useHint(level, showAdmin){
  const c = state.selectedChallenges[state.index];
  state.hints++;
  currentTeam().score = Math.max(0, currentTeam().score - (level===1 ? 40 : 90));
  beep(level===1?520:420,.09,'triangle',.02);
  document.getElementById('feedback').innerHTML = `<div class="feedback help"><strong>${level===1 ? 'Carte aide ⚡' : 'Carte bonus ⚡⚡'}</strong><br>${level===1 ? c.h1 : c.h2}</div>`;
  saveState();
}
function offerHint(showAdmin){
  document.getElementById('feedback').innerHTML += `<div class="btns"><button class="btn-alt" onclick="useHint(1, ${showAdmin})">UTILISER UNE CARTE AIDE</button><button class="btn-alt" onclick="useHint(2, ${showAdmin})">UTILISER UNE CARTE BONUS</button></div>`;
}
function validate(showAdmin){
  const c = state.selectedChallenges[state.index];
  let ok = false;
  if(c.type === 'choice'){
    if(state.picked === null){ document.getElementById('feedback').innerHTML = `<div class="feedback bad">Choisis d’abord une réponse.</div>`; return; }
    ok = state.picked === c.answerIndex;
  } else {
    ok = c.validator(document.getElementById('freeAnswer').value);
  }
  const shell = document.querySelector('.game-shell');
  const team = currentTeam();
  if(ok){
    team.score += 120; team.progress = Math.max(team.progress, state.index+1); state.fragments.push(c.fragment); playOk();
    shell.classList.remove('flash-bad'); shell.classList.add('flash-good');
    document.getElementById('feedback').innerHTML = `<div class="feedback ok"><strong>✅ Bonne réponse.</strong><br>${c.exp}<br><br><strong>Fragment obtenu : ${c.fragment}</strong></div><div class="btns"><button class="btn-main" onclick="nextChallenge(${showAdmin})">ÉPREUVE SUIVANTE</button></div>`;
  } else {
    state.attempts++; playBad();
    shell.classList.remove('flash-good'); shell.classList.add('flash-bad');
    if(state.attempts < 2){
      team.score = Math.max(0, team.score - 40);
      document.getElementById('feedback').innerHTML = `<div class="feedback bad"><strong>❌ Mauvaise piste.</strong><br>Relis la scène. Si vous bloquez, utilisez d’abord une carte aide au lieu de brûler la réponse.<br><br><span class="small">Pénalité : -40 points.</span></div>`;
      offerHint(showAdmin);
    } else {
      team.score = Math.max(0, team.score - 80);
      document.getElementById('feedback').innerHTML = `<div class="feedback bad"><strong>💥 Défi perdu.</strong><br>${c.exp}<br><br><span class="small">L’équipe suivante prend le relais.</span></div><div class="btns"><button class="btn-main" onclick="nextChallenge(${showAdmin})">ÉPREUVE SUIVANTE</button></div>`;
    }
  }
  saveState();
}
function nextChallenge(showAdmin){
  currentTeam().progress = Math.max(currentTeam().progress, state.index+1);
  state.index++;
  state.activeTeam = (state.activeTeam + 1) % state.teamCount;
  state.attempts = 0;
  saveState();
  showAdmin ? renderAdminPlay() : renderPlayer();
}
function renderMeta(showAdmin){
  const GAME = currentTheme();
  APP.innerHTML = `
    <div class="${showAdmin ? 'game-wrap' : ''}">
      <section class="game-shell fadein">
        <div class="hud">
          <div class="hud-left"><div class="badge points">Final de mission</div><div class="badge meta">Fragments : ${state.fragments.length}</div></div>
          <div class="hud-right"><div class="badge timer ${timerColor()}">⏱ ${fmt(state.time)}</div></div>
        </div>
        <div class="turn glitch" data-text="RÉVÉLATION">💣 RÉVÉLATION FINALE</div>
        <div class="story">Fragments récupérés : <strong>${state.fragments.join(' · ') || 'aucun'}</strong><br><br>La dernière étape te force à relire le parcours et à désigner la piste la plus stable.</div>
        <div class="story"><strong>${GAME.finalPrompt}</strong></div>
        <div class="choice-grid">
          ${GAME.finalChoices.map((choice,i)=>`<button class="choice" onclick="pickMeta(${i}, this)">${choice}</button>`).join('')}
        </div>
        <div id="feedback"></div>
      </section>
      ${showAdmin ? renderAdminDash() : ''}
    </div>
    <div class="validate-bar"><button class="validate-btn" onclick="validateMeta(${showAdmin})">VALIDER LE VERDICT FINAL</button></div>`;
}
function pickMeta(i,el){
  document.querySelectorAll('.choice').forEach(x=>x.classList.remove('selected'));
  el.classList.add('selected'); state.metaPick = i;
}
function validateMeta(showAdmin){
  const GAME = currentTheme();
  if(state.metaPick === null){ document.getElementById('feedback').innerHTML = `<div class="feedback bad">Choisis d’abord une piste.</div>`; return; }
  if(state.metaPick === GAME.finalAnswer){
    currentTeam().score += 180; playOk();
    document.getElementById('feedback').innerHTML = `<div class="feedback ok"><strong>✅ Verdict validé.</strong><br>La piste finale retenue est la plus solide. L’équipe active ferme la mission.</div><div class="btns"><button class="btn-main" onclick="finishMission(false)">CLÔTURER LA MISSION</button></div>`;
  } else {
    currentTeam().score = Math.max(0, currentTeam().score - 120); playBad();
    document.getElementById('feedback').innerHTML = `<div class="feedback bad"><strong>❌ Verdict erroné.</strong><br>La meilleure piste finale n’était pas celle-ci, mais la mission peut quand même être clôturée avec le score actuel.</div><div class="btns"><button class="btn-main" onclick="finishMission(false)">CLÔTURER LA MISSION</button></div>`;
  }
  saveState();
}
function finishMission(timeout){
  state.timerActive = false;
  saveState();
  toggleAmbience(false);
  const ranking = [...state.teams].sort((a,b)=>b.score-a.score);
  APP.innerHTML = `
    <section class="final-wrap fadein">
      <div class="wow-banner">
        <div class="wow-title">MISSION FERMÉE</div>
        <div class="small">Pluie · néons · verdict · classement</div>
      </div>
      <div class="final-card" style="margin-top:16px">
        <div class="big-score">${ranking[0]?.score || 0} pts</div>
        <p><strong>${ranking[0]?.name || 'Aucune équipe'}</strong> remporte la mission.</p>
        <p>${timeout ? 'Le chrono a forcé la fermeture de la partie avant la résolution complète.' : 'La mission se termine dans un halo de néon, de pluie et de tension. Les équipes ont tenu, chuté, remonté, et fini dans une vraie sensation de clôture.'}</p>
      </div>
      <div class="rank-grid">
        ${ranking.map((team, idx)=>`<div class="rank-card"><h4>${idx+1}. ${team.name}</h4>Score : ${team.score} pts<br>Progression : ${team.progress}/${state.selectedChallenges.length}<br>Joueurs : ${team.players.filter(Boolean).length}</div>`).join('')}
      </div>
      <div class="goal-grid">
        <div class="goal"><h4>Révélation</h4><div>Le classement final s’affiche clairement, avec une vraie sensation de fin de mission.</div></div>
        <div class="goal"><h4>Ce qui a compté</h4><div>Lecture, recoupement, cartes aide, et sang-froid sous pression.</div></div>
        <div class="goal"><h4>GitHub only</h4><div>Tout reste autonome, sans backend, compatible GitHub Pages.</div></div>
      </div>
      <div class="btns"><button class="btn-main" onclick="resetAll()">RETOUR ACCUEIL</button></div>
    </section>`;
}
function resetAll(){
  clearState();
  state = {theme:'night', totalPlayers:18, teamCount:3, publicType:'adultes', difficulty:'difficile', duration:3600, teams:[], activeTeam:0, hints:0, time:0, index:0, picked:null, attempts:0, selectedChallenges:[], fragments:[], timerActive:false, metaPick:null};
  location.hash = '#admin';
  renderRoute();
}

function themeScene(kind, theme){
  if(theme === 'night'){
    if(kind === 'main'){
      return `<div class="theme-scene"><svg viewBox="0 0 720 240" xmlns="http://www.w3.org/2000/svg"><rect width="720" height="240" rx="18" fill="#0a1020"/><g stroke="#72ccff" stroke-width="4" fill="none"><path d="M60 180 L160 70 L260 160 L360 60 L460 170 L560 80 L660 150" opacity=".8"/></g><g fill="#8b5cf6"><circle cx="160" cy="70" r="8"/><circle cx="360" cy="60" r="8"/><circle cx="560" cy="80" r="8"/></g><text x="40" y="38" fill="#ffd166" font-size="24">NIGHT PROTOCOL</text></svg></div>`;
    }
    if(kind === 'secondary'){
      return `<div class="theme-scene"><svg viewBox="0 0 720 240" xmlns="http://www.w3.org/2000/svg"><rect width="720" height="240" rx="18" fill="#0a1020"/><g fill="#18243b" stroke="#72ccff" stroke-width="2"><rect x="40" y="40" width="280" height="70" rx="10"/><rect x="360" y="40" width="320" height="70" rx="10"/><rect x="40" y="135" width="640" height="60" rx="10"/></g><g fill="#72ccff"><rect x="60" y="62" width="120" height="10" rx="4"/><rect x="60" y="82" width="190" height="10" rx="4"/><rect x="380" y="62" width="160" height="10" rx="4"/><rect x="380" y="82" width="220" height="10" rx="4"/><rect x="60" y="155" width="220" height="10" rx="4"/><rect x="60" y="175" width="540" height="10" rx="4"/></g></svg></div>`;
    }
    return `<div class="theme-scene"><svg viewBox="0 0 720 220" xmlns="http://www.w3.org/2000/svg"><rect width="720" height="220" rx="18" fill="#09111d"/><g stroke="#72ccff" stroke-width="2" opacity=".45"><path d="M0 190 C120 150 180 170 280 120 S470 90 720 150"/></g><g fill="#8b5cf6" opacity=".35"><circle cx="120" cy="70" r="22"/><circle cx="260" cy="120" r="12"/><circle cx="520" cy="80" r="28"/></g><text x="36" y="44" fill="#ffd166" font-size="20">Zone de tension</text></svg></div>`;
  }
  if(theme === 'jungle'){
    if(kind === 'main'){
      return `<div class="theme-scene"><svg viewBox="0 0 720 240" xmlns="http://www.w3.org/2000/svg"><rect width="720" height="240" rx="18" fill="#08140f"/><g fill="#28d695" opacity=".25"><circle cx="100" cy="70" r="36"/><circle cx="180" cy="110" r="28"/><circle cx="580" cy="80" r="40"/><circle cx="640" cy="120" r="24"/></g><g stroke="#ffd166" stroke-width="4" fill="none"><path d="M80 180 L180 120 L300 150 L420 90 L540 140 L650 100"/></g><text x="40" y="38" fill="#ffd166" font-size="24">EXPÉDITION INTERDITE</text></svg></div>`;
    }
    if(kind === 'secondary'){
      return `<div class="theme-scene"><svg viewBox="0 0 720 240" xmlns="http://www.w3.org/2000/svg"><rect width="720" height="240" rx="18" fill="#0b1812"/><g fill="#1c2e23" stroke="#28d695" stroke-width="2"><rect x="40" y="46" width="180" height="140" rx="16"/><rect x="280" y="40" width="160" height="150" rx="16"/><rect x="500" y="54" width="170" height="136" rx="16"/></g><g fill="#ffd166"><circle cx="86" cy="82" r="8"/><circle cx="166" cy="140" r="8"/><circle cx="324" cy="88" r="8"/><circle cx="384" cy="152" r="8"/><circle cx="544" cy="98" r="8"/><circle cx="612" cy="150" r="8"/></g></svg></div>`;
    }
    return `<div class="theme-scene"><svg viewBox="0 0 720 220" xmlns="http://www.w3.org/2000/svg"><rect width="720" height="220" rx="18" fill="#0b1812"/><g stroke="#28d695" stroke-width="2" opacity=".5"><path d="M40 180 C100 110 180 190 260 120 S430 80 520 140 S640 160 700 100"/></g><g fill="#ffd166" opacity=".35"><rect x="84" y="72" width="48" height="48" rx="8"/><rect x="220" y="92" width="34" height="34" rx="8"/><rect x="520" y="60" width="56" height="56" rx="8"/></g><text x="36" y="44" fill="#ffd166" font-size="20">Glyphes mouvants</text></svg></div>`;
  }
  if(theme === 'lab'){
    if(kind === 'main'){
      return `<div class="theme-scene"><svg viewBox="0 0 720 240" xmlns="http://www.w3.org/2000/svg"><rect width="720" height="240" rx="18" fill="#14090b"/><g stroke="#ff6262" stroke-width="4"><path d="M40 180 L120 180 L140 90 L220 90 L240 150 L320 150 L340 60 L420 60 L440 170 L520 170 L540 110 L620 110 L640 180 L680 180"/></g><g fill="#72ccff" opacity=".4"><circle cx="140" cy="90" r="8"/><circle cx="340" cy="60" r="8"/><circle cx="540" cy="110" r="8"/></g><text x="40" y="38" fill="#ffd166" font-size="24">ZONE 13</text></svg></div>`;
    }
    if(kind === 'secondary'){
      return `<div class="theme-scene"><svg viewBox="0 0 720 240" xmlns="http://www.w3.org/2000/svg"><rect width="720" height="240" rx="18" fill="#14090b"/><g fill="#24161c" stroke="#72ccff" stroke-width="2"><rect x="40" y="40" width="180" height="70" rx="10"/><rect x="260" y="40" width="180" height="70" rx="10"/><rect x="480" y="40" width="180" height="70" rx="10"/><rect x="40" y="140" width="620" height="50" rx="10"/></g><g fill="#ff6262"><rect x="60" y="64" width="120" height="10" rx="4"/><rect x="280" y="64" width="120" height="10" rx="4"/><rect x="500" y="64" width="120" height="10" rx="4"/><rect x="60" y="158" width="560" height="12" rx="4"/></g></svg></div>`;
    }
    return `<div class="theme-scene"><svg viewBox="0 0 720 220" xmlns="http://www.w3.org/2000/svg"><rect width="720" height="220" rx="18" fill="#14090b"/><g stroke="#ff6262" stroke-width="2" opacity=".55"><path d="M0 150 L80 150 L120 70 L190 70 L220 180 L300 180 L340 90 L420 90 L460 160 L720 160"/></g><g fill="#72ccff" opacity=".35"><circle cx="120" cy="70" r="12"/><circle cx="340" cy="90" r="12"/><circle cx="560" cy="160" r="12"/></g><text x="36" y="44" fill="#ffd166" font-size="20">Surchauffe contrôlée</text></svg></div>`;
  }
  return '';
}
function visualBlock(type, theme){
  if(type === 'surveillance' && theme === 'night'){
    return `<div class="visual"><svg viewBox="0 0 720 220" xmlns="http://www.w3.org/2000/svg"><rect width="720" height="220" rx="18" fill="#0b1220"/><g fill="#18243b" stroke="#72ccff" stroke-width="3"><rect x="30" y="40" width="120" height="120" rx="12"/><rect x="200" y="40" width="120" height="120" rx="12"/><rect x="370" y="40" width="120" height="120" rx="12"/><rect x="540" y="40" width="120" height="120" rx="12"/></g><g fill="#ffd166"><circle cx="58" cy="68" r="10"/><circle cx="228" cy="68" r="10"/><circle cx="398" cy="68" r="10"/><circle cx="632" cy="132" r="10"/></g></svg></div>`;
  }
  if(type === 'document' && theme === 'night'){
    return `<div class="visual"><table class="doc-table"><tr><th>Lieu</th><th>Badge</th><th>Heure</th></tr><tr><td>Quai</td><td>Bleu</td><td>21h40</td></tr><tr><td>Hall</td><td>Noir</td><td>22h15</td></tr><tr><td>Quai</td><td>Noir</td><td>22h20</td></tr><tr><td>Hall</td><td>Bleu</td><td>22h30</td></tr></table></div>`;
  }
  if(type === 'grid9' && theme === 'night'){
    return `<div class="visual"><svg viewBox="0 0 720 260" xmlns="http://www.w3.org/2000/svg"><rect width="720" height="260" rx="18" fill="#0b1220"/><g fill="#18243b" stroke="#72ccff" stroke-width="2">${[0,1,2,3,4,5,6,7,8].map(i=>{const x=40+(i%3)*220,y=30+Math.floor(i/3)*70;return `<rect x="${x}" y="${y}" width="120" height="48" rx="8"/>`;}).join('')}</g><g fill="#ffd166"><circle cx="60" cy="50" r="6"/><circle cx="280" cy="50" r="6"/><circle cx="500" cy="50" r="6"/><circle cx="80" cy="120" r="6"/><circle cx="300" cy="120" r="6"/><circle cx="520" cy="120" r="6"/><circle cx="100" cy="190" r="6"/><circle cx="320" cy="190" r="6"/><circle cx="580" cy="210" r="6"/></g></svg></div>`;
  }
  return themeScene('secondary', theme);
}

function renderRoute(){
  loadState();
  setTheme();
  const r = route();
  if(r.startsWith('#team-')){
    if(!state.selectedChallenges.length){
      APP.innerHTML = `<section class="panel"><h2 class="section-title">Lien d’équipe</h2><div class="notice">La mission n’a pas encore été lancée par l’administrateur.</div><div class="btns"><button class="btn-main" onclick="location.hash='#admin';renderRoute()">Retour</button></div></section>`;
      return;
    }
    showIntro(true); return;
  }
  if(r === '#admin-intro'){ showIntro(false); return; }
  if(r === '#admin-play'){
    if(!state.selectedChallenges.length){ renderAdmin(); return; }
    renderAdminPlay(); return;
  }
  renderAdmin();
}

function resizeRain(){ RAIN.width = innerWidth; RAIN.height = innerHeight; }
let drops=[];
function initRain(){ resizeRain(); drops = Array.from({length:180}, ()=>({x:Math.random()*RAIN.width,y:Math.random()*RAIN.height,l:10+Math.random()*18,v:6+Math.random()*8})); }
function drawRain(){
  CTX.clearRect(0,0,RAIN.width,RAIN.height);
  CTX.strokeStyle='rgba(114,204,255,.35)'; CTX.lineWidth=1; CTX.beginPath();
  for(const d of drops){
    CTX.moveTo(d.x,d.y); CTX.lineTo(d.x-4,d.y+d.l);
    d.y+=d.v; d.x-=.6;
    if(d.y>RAIN.height||d.x<-20){ d.x=Math.random()*RAIN.width+40; d.y=-20; }
  }
  CTX.stroke(); requestAnimationFrame(drawRain);
}

window.addEventListener('hashchange', renderRoute);
window.addEventListener('resize', resizeRain);
initRain(); drawRain(); renderRoute();

// PWA registration
if('serviceWorker' in navigator){
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
