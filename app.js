
const APP=document.getElementById('app');const RAIN=document.getElementById('rain');const CTX=RAIN.getContext('2d');let audioCtx=null,ambienceNode=null;
function initAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();return audioCtx}
function beep(freq=440,dur=.15,type='sine',vol=.03){try{const ctx=initAudio();const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=vol;o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+dur)}catch(e){}}
function playOk(){beep(760,.12,'triangle',.03);setTimeout(()=>beep(980,.12,'triangle',.02),90)}
function playBad(){beep(180,.18,'sawtooth',.035);setTimeout(()=>beep(130,.18,'sawtooth',.03),100)}
function playTension(){beep(320,.08,'square',.016)}
function toggleAmbience(on=true){try{const ctx=initAudio();if(ambienceNode){ambienceNode.osc.stop();ambienceNode=null}if(!on)return;const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();osc.type='sawtooth';osc.frequency.value=58;filter.type='lowpass';filter.frequency.value=240;gain.gain.value=.008;osc.connect(filter);filter.connect(gain);gain.connect(ctx.destination);osc.start();ambienceNode={osc,gain}}catch(e){}}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'').trim()}

const THEMES={
night:{
 body:'theme-night',title:'NIGHT PROTOCOL',mood:'Enquête, néons, pluie, surveillance.',
 rules:'Lis tout. Doute intelligemment. Une mauvaise réponse ressemble souvent à une bonne pendant quelques secondes. Avant de demander la réponse, l’équipe doit d’abord utiliser ses cartes aide si elle bloque.',
 introLines:['Transmission instable…','Une infiltration a été confirmée dans votre périmètre.','Plusieurs fragments ont été altérés avant votre arrivée.','Certaines preuves sont vraies. D’autres ont été injectées pour vous faire conclure trop vite.','Vous n’avez qu’une seule chance de garder une lecture froide.','Réseau rétabli. Mission autorisée.'],
 assets:['night_scene_intro.png','night_scene_console.png','night_scene_dossier.png','night_puzzle_badges.png','night_puzzle_codewall.png','night_puzzle_grid.png'],
 finalPrompt:'Quel profil reste la piste finale la plus solide ?',finalChoices:['A · Agent noir','B · Agent blanc','C · Agent gris','D · Agent bleu'],finalAnswer:1,
 bank:{
  facile:[
   {kind:'logic',type:'text',title:'Déclaration verrouillée',scene:'Trois agents sont interrogés. Un seul dit vrai.',prompt:'A dit : “B ment.” B dit : “C ment.” C dit : “A et B mentent.” Qui dit vrai ?',validator:v=>norm(v)==='c',exp:'Si C dit vrai, alors A et B mentent. La structure reste cohérente.',free:'🧠 Commence par l’hypothèse la plus forte.',h1:'Teste C vrai.',h2:'La bonne réponse est C.',fragment:'N'},
   {kind:'observation',type:'choice',visual:'asset:night_puzzle_badges.png',title:'Écran de badge',scene:'Quatre badges apparaissent. Un seul casse la logique.',prompt:'Quel badge est incohérent ?',choices:['A · Badge 1','B · Badge 2','C · Badge 3','D · Badge 4'],answerIndex:3,exp:'Le 4 inverse la logique commune.',free:'👁️ Cherche ce qui change de coin.',h1:'Le symbole ne change pas.',h2:'Le badge incohérent est le 4.',fragment:'7'},
   {kind:'deduction',type:'choice',visual:'asset:night_scene_dossier.png',title:'Dossier scellé',scene:'Le rapport donne trois indices fiables : le traître n’était pas au quai, le badge bleu est exclu, et la sortie a eu lieu après 22h.',prompt:'Quel profil reste cohérent ?',choices:['A · Quai / bleu / 21h40','B · Hall / noir / 22h15','C · Quai / noir / 22h20','D · Hall / bleu / 22h30'],answerIndex:1,exp:'Seul B respecte toutes les contraintes.',free:'🧾 Élimine le quai puis le bleu.',h1:'Le quai tombe.',h2:'Le profil cohérent est B.',fragment:'G'}
  ],
  moyen:[
   {kind:'pattern',type:'choice',title:'Signal miroir',scene:'Une seule séquence est parfaitement symétrique.',prompt:'Quelle ligne respecte le miroir ?',choices:['A · ▲ ● ■ ■ ● ▲','B · ▲ ● ■ ● ■ ▲','C · ● ▲ ■ ■ ● ▲','D · ▲ ● ▲ ▲ ● ■'],answerIndex:0,exp:'A se relit de droite à gauche sans casser la structure.',free:'🔁 Relis depuis la fin.',h1:'Le centre doit se répondre.',h2:'La bonne ligne est A.',fragment:'4'},
   {kind:'logic',type:'choice',title:'Mot-clé masqué',scene:'Le terminal indique : mot de 5 lettres, 2e = A, 5e = E.',prompt:'Quel mot reste possible ?',choices:['A · TABLE','B · CABLE','C · CARTE','D · SALVE'],answerIndex:3,exp:'SALVE respecte toutes les contraintes.',free:'🧠 Vérifie toutes les contraintes.',h1:'Élimine ce qui casse la 5e lettre.',h2:'Le mot possible est SALVE.',fragment:'H'},
   {kind:'memory',type:'choice',title:'Lecture brève',scene:'Le message s’affiche une seconde : pluie, lanterne, clé cuivre, vitre fendue, quai vide.',prompt:'Quel duo apparaissait vraiment ?',choices:['A · clé cuivre + vitre fendue','B · pluie + torche blanche','C · quai vide + badge rouge','D · lanterne + moteur bleu'],answerIndex:0,exp:'A reprend exactement deux éléments sans les modifier.',free:'📝 Un seul duo ne change aucun mot.',h1:'Les adjectifs piègent.',h2:'Le bon duo est A.',fragment:'2'},
   {kind:'branch',type:'choice',visual:'asset:night_puzzle_codewall.png',title:'Porte latérale',scene:'Deux accès s’ouvrent : tunnel discret ou hall principal. Le tunnel fait perdre 10 secondes mais évite un faux rapport.',prompt:'Quel chemin choisissez-vous ?',choices:['A · Tunnel discret','B · Hall principal'],answerIndex:0,exp:'Le tunnel sécurise la suite en évitant un piège narratif.',free:'⚠️ Le chemin le plus rapide n’est pas toujours le plus sûr.',h1:'La discrétion protège ici.',h2:'Le tunnel était la meilleure option.',fragment:'T',branchSuccess:{score:40,time:-10},branchFail:{score:-40,time:-15}},
   {kind:'logic',type:'text',title:'Heure tronquée',scene:'Si l’agent noir sort avant 22h, alors la taupe ne peut pas être au hall. Or la taupe est au hall.',prompt:'Que déduire sur l’agent noir ?',validator:v=>norm(v).includes('nesortpasavant22h')||norm(v).includes('apres22h'),exp:'Il ne peut pas être sorti avant 22h.',free:'🧠 Utilise la contraposée.',h1:'Si A alors B ; non B donc non A.',h2:'Il n’est pas sorti avant 22h.',fragment:'K'}
  ],
  difficile:[
   {kind:'logic',type:'text',title:'Salle d’interrogatoire',scene:'Quatre phrases ont été enregistrées. Une seule peut tenir sans contradiction avec les autres.',prompt:'A : “Je suis innocent et B ment.”\nB : “C était avec moi toute la soirée.”\nC : “A et D ne disent pas la vérité.”\nD : “Si B ment, alors A ment aussi.”\n\nQuelle phrase est la plus crédible ?',validator:v=>norm(v)==='d',exp:'D est la seule phrase stable.',free:'🧠 Cherche une structure conditionnelle stable.',h1:'Teste le cas où B ment.',h2:'La phrase la plus crédible est D.',fragment:'A'},
   {kind:'code',type:'choice',title:'Clavier asymétrique',scene:'Code à 4 chiffres : somme 18, le 2e vaut le 1er + 2, le dernier vaut la moitié du 3e.',prompt:'Quel code reste cohérent ?',choices:['A · 4 - 6 - 8 - 4','B · 2 - 4 - 8 - 4','C · 3 - 5 - 6 - 3','D · 5 - 7 - 4 - 2'],answerIndex:1,exp:'B respecte les relations internes.',free:'🔐 Fixe d’abord la relation 2e = 1er + 2.',h1:'Puis vérifie la moitié.',h2:'Le code cohérent est B.',fragment:'Q'},
   {kind:'strategy',type:'choice',title:'Fenêtre de tirage',scene:'Le protocole te donne deux options : verrouiller maintenant ou relire une dernière fois en perdant 20 secondes.',prompt:'Quel choix maximise vos chances de finir correctement ?',choices:['A · Verrouiller','B · Relire','C · Ignorer le fragment','D · Réinitialiser'],answerIndex:1,exp:'Relire évite les faux évidents.',free:'⚠️ La précipitation est le vrai piège.',h1:'Le protocole récompense la lucidité.',h2:'Le meilleur choix est B.',fragment:'P'},
   {kind:'branch',type:'text',visual:'asset:night_puzzle_grid.png',title:'Grille de dérivation',scene:'Trois trajets mentaux sont possibles. L’un mène à un fragment bonus, l’un est neutre, l’un entraîne un sabotage.',prompt:'Écris : alpha, beta ou gamma.',validator:v=>['alpha','beta','gamma'].includes(norm(v)),exp:'Le choix ouvre une suite différente selon la voie prise.',free:'🧠 Choisis une voie, puis assume son risque.',h1:'Une voie est prudente, une voie est rentable, une voie est toxique.',h2:'Alpha = bonus, Beta = neutre, Gamma = sabotage.',fragment:'R',branchMap:{alpha:{score:80},beta:{score:0},gamma:{score:-90,time:-20}}}
  ],
  extreme:[
   {kind:'meta',type:'choice',title:'Croisement lourd',scene:'Quatre fragments de règle : la taupe n’utilise jamais la sortie principale ; si l’agent noir ment, l’agent gris ment aussi ; l’agent gris n’était pas sur zone après 22h ; la taupe était encore là après 22h.',prompt:'Quel agent reste le plus crédible comme taupe ?',choices:['A · Agent noir','B · Agent blanc','C · Agent gris','D · Agent bleu'],answerIndex:1,exp:'Le blanc reste la piste la plus stable.',free:'🧠 Élimine d’abord ce qui viole l’heure.',h1:'Le gris tombe tout de suite.',h2:'La piste la plus stable est l’agent blanc.',fragment:'X'},
   {kind:'logic',type:'text',title:'Recoupement terminal',scene:'Si le traître passe par le hall, alors le badge noir est exclu. Si le hall est exclu, la sortie principale devient impossible. Or la sortie principale est impossible.',prompt:'Que déduire sur le hall ?',validator:v=>norm(v).includes('lehallsestpossible')||norm(v).includes('onpeutpaslexclure')||norm(v).includes('lehallsrestepossible'),exp:'Le piège est de conclure trop vite : le hall reste possible.',free:'🧠 Évite l’inversion abusive.',h1:'Ne lis pas “si B alors A”.',h2:'Le hall reste possible.',fragment:'Z'}
  ]
 }},
jungle:{
 body:'theme-jungle',title:'L’EXPÉDITION INTERDITE',mood:'Ruines, jungle, glyphes, chemins perdus.',
 rules:'Dans la jungle, la lecture du terrain compte autant que la vitesse. Les pièges sont visuels, spatiaux ou liés à l’ordre des repères.',
 introLines:['La jungle ne se tait jamais complètement.','Les murs anciens répondent à peine, mais ils répondent.','Des chemins se ressemblent. Les vrais repères se cachent dans l’ordre, pas dans la forme.','Un mauvais choix peut t’éloigner de la sortie pendant de longues minutes.','Expédition ouverte.'],
 assets:['jungle_scene_intro.png','jungle_scene_ruins.png','jungle_scene_map.png','jungle_puzzle_tablet.png','jungle_puzzle_path.png','jungle_puzzle_glyphs.png'],
 finalPrompt:'Quelle dernière piste ouvre vraiment le passage ?',finalChoices:['A · Nord','B · Centre','C · Est','D · Ouest'],finalAnswer:1,
 bank:{
  facile:[
   {kind:'navigation',type:'choice',visual:'asset:jungle_puzzle_path.png',title:'Le couloir des ruines',scene:'La route correcte doit suivre : arche creuse, zone détrempée, dalle gravée, clairière.',prompt:'Quelle route reste crédible ?',choices:['A · Est / arche / zone humide / dalle / clairière','B · Ouest / arche / clairière / zone humide','C · Nord / dalle / arche / clairière','D · Sud / rivière / colline / 2 pierres'],answerIndex:0,exp:'A garde les bons repères dans le bon ordre.',free:'🧭 L’ordre complet est la clé.',h1:'La clairière vient après la dalle.',h2:'La bonne route commence par l’Est.',fragment:'V'},
   {kind:'pattern',type:'choice',visual:'asset:jungle_puzzle_tablet.png',title:'La mosaïque humide',scene:'Une frise doit être symétrique depuis le centre vers les bords.',prompt:'Quelle ligne garde la bonne symétrie ?',choices:['A · feuille / eau / soleil / soleil / eau / feuille','B · feuille / eau / lune / soleil / eau / feuille','C · eau / feuille / soleil / soleil / eau / feuille','D · feuille / eau / soleil / lune / eau / feuille'],answerIndex:0,exp:'A est la seule séquence qui répond exactement en miroir.',free:'🔁 Relis la ligne depuis la fin.',h1:'Le centre doit se répondre exactement.',h2:'La bonne suite est A.',fragment:'E'}
  ],
  moyen:[
   {kind:'code',type:'choice',title:'Le mécanisme des runes',scene:'Le code a 4 chiffres pairs différents. Leur somme vaut 20 et le deuxième vaut le premier + 2.',prompt:'Quelle séquence est valable ?',choices:['A · 2 - 4 - 6 - 8','B · 4 - 6 - 8 - 2','C · 6 - 8 - 4 - 2','D · 2 - 6 - 4 - 8'],answerIndex:0,exp:'A valide tout.',free:'🔐 Commence par la relation entre le 1er et le 2e chiffre.',h1:'La somme 20 élimine déjà beaucoup d’options.',h2:'La bonne séquence commence par 2 puis 4.',fragment:'R'},
   {kind:'observation',type:'choice',visual:'asset:jungle_puzzle_glyphs.png',title:'Le mur des glyphes',scene:'Cinq glyphes appartiennent à deux familles répétées. Un seul n’appartient à aucune famille.',prompt:'Quel glyphe est isolé ?',choices:['A · 2e','B · 4e','C · 5e','D · 1er'],answerIndex:2,exp:'Les glyphes 1 et 3 se répondent, 2 et 4 aussi. Le 5e reste isolé.',free:'👁️ Cherche celui qui n’a aucun jumeau.',h1:'Deux paires se forment.',h2:'Le glyphe isolé se trouve à la fin.',fragment:'T'},
   {kind:'memory',type:'choice',title:'Le carnet détrempé',scene:'Le carnet s’ouvre une seconde : pierre rouge, clé cuivre, feuille noire, roue d’obsidienne, corde verte.',prompt:'Quel duo était visible ?',choices:['A · roue d’obsidienne + corde verte','B · pierre rouge + lampe blanche','C · feuille noire + gourde','D · clé cuivre + torche'],answerIndex:0,exp:'A est le seul duo entièrement présent dans la scène.',free:'👁️ Une seule proposition contient deux vrais éléments vus ensemble.',h1:'Élimine les objets jamais cités.',h2:'Le bon duo réunit la roue et la corde.',fragment:'U'},
   {kind:'branch',type:'choice',visual:'asset:jungle_puzzle_path.png',title:'Fourche des lianes',scene:'Le chemin gauche est plus court mais passe près des statues doubles. Le chemin droit est plus long et plus stable.',prompt:'Quel chemin choisissez-vous ?',choices:['A · Gauche','B · Droite'],answerIndex:1,exp:'La droite évite le piège des statues doubles.',free:'⚠️ Le raccourci attire mais piège souvent.',h1:'La sécurité coûte parfois quelques secondes.',h2:'Le chemin droit était le plus stable.',fragment:'J',branchSuccess:{score:30},branchFail:{score:-50,time:-15}}
  ],
  difficile:[
   {kind:'choice',type:'choice',title:'La chambre des faux leviers',scene:'Un message prévient : “ne choisis pas le levier central, sauf si la lampe bleue s’éteint.” La lampe bleue est encore allumée.',prompt:'Quel levier faut-il éviter ?',choices:['A · Levier gauche','B · Levier central','C · Levier droit','D · Aucun'],answerIndex:1,exp:'Tant que la lampe bleue reste allumée, il faut éviter le levier central.',free:'⚠️ Ici, le décor donne déjà la règle.',h1:'La lampe bleue n’est pas éteinte.',h2:'Le levier central est interdit.',fragment:'O'},
   {kind:'logic',type:'text',title:'La salle des 4 dalles',scene:'Quatre dalles doivent être activées dans l’ordre, mais deux se copient mutuellement. On sait que la 2e est après la 4e, et que la 1re n’est jamais jouée la dernière.',prompt:'Quelle dalle ne peut pas être jouée en premier : 1, 2, 3 ou 4 ?',validator:v=>norm(v)==='2',exp:'Si la 2e doit venir après la 4e, elle ne peut pas ouvrir la séquence.',free:'🧠 Une seule dalle est bloquée dès la première condition.',h1:'Pense avant / après.',h2:'La dalle 2 ne peut pas être jouée en premier.',fragment:'L'},
   {kind:'branch',type:'text',visual:'asset:jungle_puzzle_tablet.png',title:'Tablette à double lecture',scene:'Tu peux lire la tablette en mode rituel ou en mode géométrique. Écris : rituel ou geometrie.',prompt:'Réponse libre attendue.',validator:v=>['rituel','geometrie'].includes(norm(v)),exp:'Le choix de lecture modifie la valeur du fragment obtenu.',free:'🧠 Une lecture est plus immersive, l’autre plus rationnelle.',h1:'Rituel = plus narratif, géométrie = plus stable.',h2:'Rituel donne un petit bonus narratif, géométrie sécurise le score.',fragment:'M',branchMap:{rituel:{score:20},geometrie:{score:50}}}
  ],
  extreme:[
   {kind:'meta',type:'choice',title:'La clé du sanctuaire',scene:'Les fragments réunis indiquent une entrée stable, mais l’une des quatre directions casse toujours la logique du parcours.',prompt:'Quelle direction reste la plus solide ?',choices:['A · Nord','B · Centre','C · Est','D · Ouest'],answerIndex:1,exp:'Le centre reste la seule direction cohérente quand on recoupe les fragments.',free:'🧠 La bonne piste n’est pas la plus spectaculaire, mais la plus stable.',h1:'Le faux chemin a l’air plus épique.',h2:'La direction stable est le centre.',fragment:'W'},
   {kind:'logic',type:'text',title:'Mythe fracturé',scene:'Trois récits parlent du même passage. Deux embellissent le danger. Un seul reste cohérent si on retire les éléments symboliques.',prompt:'Quel récit reste le plus exploitable : A, B ou C ?',validator:v=>norm(v)==='c',exp:'Le récit C reste exploitable une fois le symbolique retiré.',free:'⚠️ Sépare le décor rituel de l’information utile.',h1:'Deux récits gonflent artificiellement le danger.',h2:'Le récit exploitable est C.',fragment:'Y'}
  ]
 }},
lab:{
 body:'theme-lab',title:'ZONE 13',mood:'Laboratoire, alarme, pression, confinement.',
 rules:'Dans Zone 13, chaque action a un coût. Les énigmes favorisent le tri, la lecture technique et la gestion de pression.',
 introLines:['L’alarme a déjà commencé quand vous entrez.','La lumière change, les signaux se déclenchent en cascade, et plusieurs écrans se contredisent.','Dans Zone 13, chaque action a un coût. Chaque hésitation a un impact.','Ce qu’il faut, c’est de la vitesse intelligente.','Protocole activé.'],
 assets:['lab_scene_intro.png','lab_scene_report.png','lab_scene_circuit.png','lab_puzzle_matrix.png','lab_puzzle_lock.png','lab_puzzle_alert.png'],
 finalPrompt:'Quelle lettre verrouille la sécurité finale ?',finalChoices:['A · R','B · N','C · I','D · U'],finalAnswer:1,
 bank:{
  facile:[
   {kind:'code',type:'choice',visual:'asset:lab_puzzle_lock.png',title:'Code de stabilisation',scene:'Le panneau impose un code dont la somme vaut 12, avec trois chiffres égaux.',prompt:'Quelle combinaison doit être validée ?',choices:['A · 4 - 4 - 4','B · 3 - 3 - 6','C · 2 - 5 - 5','D · 1 - 1 - 10'],answerIndex:0,exp:'4-4-4 est la seule combinaison qui respecte à la fois la somme et l’égalité.',free:'🔐 Le mot important ici est “égaux”.',h1:'La somme 12 doit être atteinte avec trois chiffres identiques.',h2:'La combinaison correcte est 4 - 4 - 4.',fragment:'S'},
   {kind:'logic',type:'choice',title:'Suite critique',scene:'La suite affichée grimpe trop vite pour être lue à moitié : 2, 4, 8, ?',prompt:'Quelle valeur doit suivre ?',choices:['A · 16','B · 10','C · 12','D · 14'],answerIndex:0,exp:'La valeur double à chaque étape.',free:'🧠 La logique ne change pas en cours de route.',h1:'Chaque valeur vaut le double.',h2:'La bonne réponse est 16.',fragment:'A'}
  ],
  moyen:[
   {kind:'strategy',type:'choice',title:'Protocole d’urgence',scene:'Attendre peut aggraver la situation. Fuir coupe toute chance de stabilisation.',prompt:'Quelle action reste la plus crédible ?',choices:['A · Attendre','B · Agir','C · Fuir','D · Éteindre tout'],answerIndex:1,exp:'Agir reste la seule réponse cohérente.',free:'⚠️ Élimine les options qui abandonnent le problème.',h1:'Attendre ou fuir ne stabilisent rien.',h2:'Il faut agir.',fragment:'F'},
   {kind:'observation',type:'choice',visual:'asset:lab_puzzle_alert.png',title:'Écran parasite',scene:'Quatre lignes semblent correctes, mais une seule casse la logique d’ensemble.',prompt:'Quelle ligne est incohérente ?',choices:['A · 22 / 24 / 26','B · 30 / 32 / 34','C · 12 / 16 / 14','D · 40 / 42 / 44'],answerIndex:2,exp:'C casse la progression régulière.',free:'👁️ Trois lignes gardent la même montée.',h1:'Cherche la seule ligne qui brise le rythme.',h2:'La ligne C casse la progression.',fragment:'E'},
   {kind:'memory',type:'choice',title:'Rapport de confinement',scene:'Le rapport affiche : vanne rouge, chambre 4, niveau 2, clé noire, module est.',prompt:'Quel élément n’était pas présent ?',choices:['A · chambre 4','B · clé noire','C · niveau 3','D · module est'],answerIndex:2,exp:'Niveau 3 n’apparaissait pas.',free:'📝 Un seul élément a été modifié.',h1:'Tout est correct sauf le niveau.',h2:'Le faux élément est niveau 3.',fragment:'T'},
   {kind:'branch',type:'choice',visual:'asset:lab_puzzle_matrix.png',title:'Dérivation de pression',scene:'Tu peux purger doucement ou forcer une baisse rapide. La purge lente prend du temps mais évite un surcoût.',prompt:'Quelle option choisissez-vous ?',choices:['A · Purge lente','B · Baisse rapide'],answerIndex:0,exp:'La purge lente protège le score.',free:'⚠️ La solution brutale coûte souvent cher.',h1:'Le temps n’est pas toujours la vraie perte.',h2:'La purge lente était plus stable.',fragment:'L',branchSuccess:{time:-10},branchFail:{score:-60}}
  ],
  difficile:[
   {kind:'choice',type:'choice',title:'Fermeture finale',scene:'Le système propose deux actions : lancer la fermeture générale maintenant, ou vérifier une dernière fois le circuit.',prompt:'Quel choix garde le plus de maîtrise ?',choices:['A · Fermer immédiatement sans relire','B · Vérifier le dernier circuit puis fermer','C · Ignorer le dernier circuit','D · Rebooter tout au hasard'],answerIndex:1,exp:'Relire une dernière fois reste la décision la plus robuste.',free:'⚠️ Le bon réflexe mélange vitesse et contrôle.',h1:'La précipitation pure est une fausse sécurité.',h2:'Vérifier puis fermer est la meilleure piste.',fragment:'N'},
   {kind:'logic',type:'text',title:'Chambre d’inversion',scene:'Si la chambre A déborde, alors la chambre C coupe le flux. Or le flux n’est pas coupé.',prompt:'Que peut-on affirmer sur A ?',validator:v=>norm(v).includes('nedebordepas')||norm(v).includes('chambreanedebordepas')||norm(v).includes('apasdeborde'),exp:'Par contraposée, A n’a pas débordé.',free:'🧠 Cherche la contraposée utile.',h1:'Si A alors B ; non B donc…',h2:'A n’a pas débordé.',fragment:'O'},
   {kind:'branch',type:'text',visual:'asset:lab_puzzle_lock.png',title:'Verrou à double protocole',scene:'Tu peux saisir le code en mode manuel ou auto. Écris : manuel ou auto.',prompt:'Réponse libre attendue.',validator:v=>['manuel','auto'].includes(norm(v)),exp:'Le choix de protocole influence le risque.',free:'🧠 Le manuel sécurise, l’auto accélère.',h1:'Auto peut coûter, manuel peut ralentir.',h2:'Manuel = plus sûr, Auto = plus rapide mais plus risqué.',fragment:'P',branchMap:{manuel:{score:40},auto:{time:-10,score:-20}}}
  ],
  extreme:[
   {kind:'meta',type:'choice',title:'Dernière stabilisation',scene:'Les fragments restants forment SAFE TY. Une seule lettre manque pour verrouiller le protocole.',prompt:'Quelle lettre manque ?',choices:['A · R','B · N','C · I','D · U'],answerIndex:1,exp:'SAFE TY devient SAFETY avec N.',free:'🧠 Le mot final doit signifier sécurité.',h1:'Le protocole cherche un mot de stabilisation.',h2:'La lettre manquante est N.',fragment:'Q'},
   {kind:'logic',type:'text',title:'Rapport contradictoire',scene:'Le rapport 1 décrit une cause, le rapport 2 une conséquence, le rapport 3 mélange les deux pour tromper l’opérateur.',prompt:'Quel rapport faut-il écarter : 1, 2 ou 3 ?',validator:v=>norm(v)==='3',exp:'Le rapport 3 mélange cause et conséquence pour piéger.',free:'⚠️ Cherche le document qui confond les niveaux.',h1:'Deux rapports restent techniquement propres.',h2:'Le rapport à écarter est le 3.',fragment:'R'}
  ]
 }}
};

let state={theme:'night',totalPlayers:18,teamCount:3,publicType:'adultes',difficulty:'difficile',duration:3600,teams:[],activeTeam:0,hints:0,time:0,index:0,picked:null,attempts:0,selectedChallenges:[],fragments:[],timerActive:false,metaPick:null};
function saveState(){localStorage.setItem('fafa_state_final_v5',JSON.stringify(state))}
function loadState(){try{const raw=localStorage.getItem('fafa_state_final_v5');if(raw)Object.assign(state,JSON.parse(raw))}catch(e){}}
function clearState(){localStorage.removeItem('fafa_state_final_v5')}
function route(){return location.hash||'#admin'}
function currentTheme(){return THEMES[state.theme]}
function setTheme(){document.body.className=currentTheme().body}
function ageLevel(){return state.publicType==='enfants'?'kids':state.publicType==='ados'?'teens':'adults'}
function teamDistribution(total,teams){const base=Math.floor(total/teams),rest=total%teams;if(rest===0)return `${teams} équipes de ${base}`;return `${rest} équipes de ${base+1} · ${teams-rest} équipes de ${base}`}
function teamLink(i){return `${location.origin}${location.pathname}#team-${i}`}
function initTeams(){const suggested=Math.ceil(state.totalPlayers/state.teamCount);if(state.teams.length!==state.teamCount){state.teams=Array.from({length:state.teamCount},(_,i)=>({name:`Équipe ${i+1}`,players:Array.from({length:suggested},()=>''),score:0,progress:0}))}}
function currentTeam(){return state.teams[state.activeTeam]||{name:'Équipe',players:[],score:0,progress:0}}
function currentPlayer(){const team=currentTeam();if(!team.players.length)return team.name;return team.players[state.index%team.players.length]||team.name}
function timerColor(){if(state.time>120)return'green';if(state.time>45)return'orange';return'red'}
function fmt(t){const m=String(Math.floor(t/60)).padStart(2,'0');const s=String(t%60).padStart(2,'0');return`${m}:${s}`}

function extraAgeChallenges(themeKey){
 const age=ageLevel();
 const packs={
  night:{
   kids:[
    {kind:'observation',type:'choice',visual:'asset:night_puzzle_badges.png',title:'Repère lumineux',scene:'Un badge n’est pas rangé comme les autres.',prompt:'Quel repère paraît le plus suspect ?',choices:['A · coin haut gauche','B · coin haut droit','C · centre','D · coin bas gauche'],answerIndex:1,exp:'Le coin haut droit casse la logique visuelle.',free:'👁️ Cherche l’élément qui ne se range pas avec les autres.',h1:'Le centre n’est pas le piège.',h2:'Le repère suspect est en haut à droite.',fragment:'B'},
    {kind:'pattern',type:'choice',visual:'asset:night_puzzle_codewall.png',title:'Mur de code simple',scene:'Les symboles suivent une répétition simple.',prompt:'Quelle suite termine correctement la ligne ?',choices:['A · ▲ ● ▲','B · ■ ● ■','C · ▲ ■ ●','D · ● ● ●'],answerIndex:0,exp:'La répétition revient sur ▲ ● ▲.',free:'🔁 Observe le rythme plutôt que les formes seules.',h1:'Le premier symbole revient.',h2:'La bonne fin est ▲ ● ▲.',fragment:'C'}
   ],
   teens:[
    {kind:'code',type:'choice',visual:'asset:night_puzzle_codewall.png',title:'Code mural',scene:'La somme des deux premiers chiffres vaut le troisième. Le dernier vaut le premier + 1.',prompt:'Quelle ligne reste valide ?',choices:['A · 2 3 5 3','B · 3 4 7 4','C · 2 4 6 5','D · 4 4 8 4'],answerIndex:0,exp:'2+3=5 et le dernier vaut bien 3.',free:'🔐 Vérifie les deux règles ensemble.',h1:'D’abord la somme.',h2:'Puis le dernier = premier + 1. La bonne ligne est A.',fragment:'D'},
    {kind:'logic',type:'text',title:'Fausse alerte',scene:'Si le badge bleu est faux, alors l’alerte 3 est vraie. L’alerte 3 est fausse.',prompt:'Que peut-on affirmer sur le badge bleu ?',validator:v=>norm(v).includes('nestpasfaux')||norm(v).includes('badgebleuvrai'),exp:'Par contraposée, le badge bleu n’est pas faux.',free:'🧠 Utilise la contraposée.',h1:'Si A alors B ; non B donc non A.',h2:'Le badge bleu n’est pas faux.',fragment:'E'}
   ],
   adults:[
    {kind:'deduction',type:'choice',visual:'asset:night_puzzle_badges.png',title:'Recoupement d’accès',scene:'Le badge violet n’ouvre ni la porte A ni la C. Le badge or n’ouvre pas la B. La porte B ne s’ouvre qu’avec un badge chaud.',prompt:'Quel accès reste le plus cohérent ?',choices:['A · Violet → A','B · Or → B','C · Bleu → B','D · Violet → C'],answerIndex:2,exp:'Il reste Bleu vers B.',free:'🧠 Élimine d’abord les impossibilités directes.',h1:'Violet tombe deux fois.',h2:'Or ne va pas vers B. Il reste Bleu → B.',fragment:'F'},
    {kind:'meta',type:'text',title:'Lecture inversée',scene:'Trois rapports disent presque la même chose, mais seul l’un garde la même conclusion lorsqu’on inverse cause et conséquence.',prompt:'Quel rapport reste stable : A, B ou C ?',validator:v=>norm(v)==='b',exp:'Le rapport B est le seul qui ne piège pas par inversion abusive.',free:'⚠️ Cherche celui qui ne confond pas cause et conséquence.',h1:'Un rapport tient même relu à l’envers.',h2:'Le bon rapport est B.',fragment:'G'}
   ]
  },
  jungle:{
   kids:[
    {kind:'navigation',type:'choice',visual:'asset:jungle_puzzle_path.png',title:'Chemin coloré',scene:'Un seul chemin respecte la séquence pierre → liane → dalle.',prompt:'Quel chemin faut-il prendre ?',choices:['A · sentier 1','B · sentier 2','C · sentier 3','D · sentier 4'],answerIndex:2,exp:'Le sentier 3 garde le bon ordre des repères.',free:'🧭 L’ordre compte plus que la beauté du chemin.',h1:'Cherche la dalle en dernier.',h2:'Le bon chemin est le 3.',fragment:'H'},
    {kind:'observation',type:'choice',visual:'asset:jungle_puzzle_tablet.png',title:'Tablette vivante',scene:'Un glyphe n’a pas la même famille que les autres.',prompt:'Quel glyphe est intrus ?',choices:['A · soleil','B · feuille','C · feuille fendue','D · feuille sombre'],answerIndex:0,exp:'Les trois feuilles vont ensemble.',free:'👁️ Cherche la famille dominante.',h1:'Trois formes se ressemblent.',h2:'Le soleil est l’intrus.',fragment:'I'}
   ],
   teens:[
    {kind:'pattern',type:'choice',visual:'asset:jungle_puzzle_glyphs.png',title:'Ordre des glyphes',scene:'Le motif revient tous les 3 symboles.',prompt:'Quel symbole doit venir ensuite ?',choices:['A · serpent','B · pierre','C · feuille','D · soleil'],answerIndex:2,exp:'La séquence ramène la feuille.',free:'🔁 Compte par blocs de 3.',h1:'Le cycle repart.',h2:'La feuille revient.',fragment:'J'},
    {kind:'logic',type:'text',title:'Pont de racines',scene:'Si la racine centrale casse, la plateforme sud devient impossible. La plateforme sud est utilisée.',prompt:'Que peut-on dire de la racine centrale ?',validator:v=>norm(v).includes('necassepas')||norm(v).includes('intacte'),exp:'La racine centrale n’a pas cassé.',free:'🧠 Encore une logique conditionnelle.',h1:'Si A alors B ; or non B ?',h2:'La racine centrale n’a pas cassé.',fragment:'K'}
   ],
   adults:[
    {kind:'deduction',type:'choice',visual:'asset:jungle_puzzle_path.png',title:'Tracé du sanctuaire',scene:'Le parcours réel traverse exactement deux zones humides, évite les statues doubles, puis termine par une dalle fendue.',prompt:'Quel tracé reste possible ?',choices:['A · 1-3-4','B · 2-4-6','C · 1-5-6','D · 3-4-5'],answerIndex:1,exp:'Le tracé 2-4-6 respecte les trois contraintes.',free:'🧠 Compte les zones humides avant tout.',h1:'Il en faut exactement deux.',h2:'Le seul tracé cohérent est 2-4-6.',fragment:'L'},
    {kind:'meta',type:'text',title:'Mythe secondaire',scene:'Deux récits parlent du même signe d’ouverture. L’un ajoute des symboles sans valeur technique.',prompt:'Quel récit faut-il écarter : A ou B ?',validator:v=>norm(v)==='a',exp:'Le récit A surcharge le symbole et brouille la lecture.',free:'⚠️ Écarte le récit trop décoratif.',h1:'Le bon récit reste sobre.',h2:'Le récit à écarter est A.',fragment:'M'}
   ]
  },
  lab:{
   kids:[
    {kind:'code',type:'choice',visual:'asset:lab_puzzle_lock.png',title:'Verrou simple',scene:'Le verrou demande deux nombres identiques dont la somme vaut 8.',prompt:'Quelle combinaison convient ?',choices:['A · 4 et 4','B · 3 et 5','C · 2 et 6','D · 1 et 7'],answerIndex:0,exp:'4 et 4 sont identiques et totalisent 8.',free:'🔐 Les deux nombres doivent être les mêmes.',h1:'Même valeur des deux côtés.',h2:'4 et 4.',fragment:'N'},
    {kind:'observation',type:'choice',visual:'asset:lab_puzzle_alert.png',title:'Voyant parasite',scene:'Un voyant ne suit pas la couleur du reste.',prompt:'Lequel est incohérent ?',choices:['A · rouge','B · rouge sombre','C · cyan','D · rouge clair'],answerIndex:2,exp:'Le cyan casse la logique dominante rouge.',free:'👁️ Cherche la rupture de famille.',h1:'Trois voyants sont proches.',h2:'Le cyan est l’intrus.',fragment:'O'}
   ],
   teens:[
    {kind:'logic',type:'text',title:'Conduite de secours',scene:'Si la vanne nord s’ouvre, la pression descend sous 4. La pression n’est pas sous 4.',prompt:'Que peut-on affirmer sur la vanne nord ?',validator:v=>norm(v).includes('nestpasouverte')||norm(v).includes('fermee'),exp:'La vanne nord n’est pas ouverte.',free:'🧠 La pression te donne la réponse indirecte.',h1:'Si A alors B ; non B donc…',h2:'La vanne nord n’est pas ouverte.',fragment:'P'},
    {kind:'pattern',type:'choice',visual:'asset:lab_puzzle_matrix.png',title:'Matrice chaude',scene:'Une matrice répète un motif de 4 valeurs : 2, 3, 5, 8...',prompt:'Quelle valeur suit ?',choices:['A · 10','B · 12','C · 13','D · 15'],answerIndex:2,exp:'5 + 8 = 13.',free:'🧠 Observe les deux derniers nombres.',h1:'Ce n’est plus une addition constante.',h2:'La valeur suivante est 13.',fragment:'Q'}
   ],
   adults:[
    {kind:'deduction',type:'choice',visual:'asset:lab_puzzle_lock.png',title:'Verrou de chambre',scene:'La chambre 4 ne peut pas être ouverte si la 2 est vide. La 2 est pleine. La 4 n’accepte ni rouge ni noir.',prompt:'Quelle carte d’accès reste cohérente ?',choices:['A · carte rouge','B · carte noire','C · carte bleue','D · carte rouge-noire'],answerIndex:2,exp:'Rouge et noir sont exclus, il reste la carte bleue.',free:'🧠 Commence par les exclusions directes.',h1:'Deux couleurs tombent tout de suite.',h2:'La carte cohérente est la bleue.',fragment:'R'},
    {kind:'meta',type:'text',title:'Rapport technique secondaire',scene:'Deux rapports techniques existent. L’un mélange paramètre et résultat.',prompt:'Quel rapport faut-il écarter : A ou B ?',validator:v=>norm(v)==='b',exp:'Le rapport B mélange paramètre et résultat.',free:'⚠️ Écarte celui qui confond lecture et effet.',h1:'Un rapport reste net.',h2:'Le rapport à écarter est B.',fragment:'S'}
   ]
  }
 };
 return packs[themeKey]?.[age] || [];
}

function chooseChallenges(){
  const GAME=currentTheme(); const order={facile:['facile'],moyen:['facile','moyen'],difficile:['moyen','difficile'],extreme:['difficile','extreme']};
  let count=state.duration<=1800?4:state.duration<=2700?5:state.duration<=3600?6:state.duration<=5400?7:8;
  if(state.publicType==='enfants')count=Math.max(4,count-1);
  if(state.publicType==='adultes'&&state.difficulty==='extreme')count=Math.min(11,count+2);
  let arr=[];(order[state.difficulty]||['moyen']).forEach(k=>arr=arr.concat(GAME.bank[k]||[]));
  arr=arr.concat(extraAgeChallenges(state.theme));
  return arr.slice(0,count);
}

function renderAdmin(){
 setTheme(); const GAME=currentTheme();
 APP.innerHTML=`<div class="hero">
  <div><img src="./assets/logo.png" class="hero-logo" alt="logo"></div>
  <div><div class="kicker">FAFATRAINING GAME ARENA</div><h1>${GAME.title}</h1><div class="subtitle">Version finale GitHub Pages poussée au maximum sur cette base : densité d’épreuves par âge et difficulté, embranchements, scènes dédiées par thème, cartes aide / bonus plus visibles, menus et logique automatique plus cohérents de bout en bout.</div></div>
  <div class="hero-stats">
   <div class="stat a"><strong>${state.teamCount}</strong><span>équipes</span></div>
   <div class="stat b"><strong>${state.totalPlayers}</strong><span>joueurs</span></div>
   <div class="stat c"><strong>${state.difficulty}</strong><span>difficulté</span></div>
   <div class="stat d"><strong>${state.duration/60} min</strong><span>durée</span></div>
  </div></div>

  <section class="panel">
   <h2>Administration de mission</h2>
   <div class="admin-grid">
    <div>
      <div class="toolbar">
        <button class="btn-dark btn-tab active">Configuration</button>
        <button class="btn-dark btn-tab">Équipes</button>
        <button class="btn-dark btn-tab">Liens</button>
        <button class="btn-dark btn-tab">Logique auto</button>
      </div>
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
      <div class="btns"><button class="btn-main" onclick="buildTeams()">GÉNÉRER LES ÉQUIPES</button><button class="btn-alt" onclick="resetAll()">RÉINITIALISER</button></div>
      <div id="teamsEditor"></div>
    </div>
    <div>
      <div class="goal-grid" style="grid-template-columns:1fr">
        <div class="goal"><h4>Répartition auto</h4><div>${teamDistribution(state.totalPlayers,state.teamCount)}</div></div>
        <div class="goal"><h4>Règles</h4><div>${GAME.rules}</div></div>
        <div class="goal"><h4>Logique auto</h4><div>La quantité d’épreuves, leur densité, leur variété et la difficulté changent selon l’âge, le public, la difficulté et la durée.</div></div>
      </div>
    </div>
   </div>
  </section>

  <section class="panel">
    <h2>Scènes et assets du thème</h2>
    <div class="asset-grid">${GAME.assets.map(f=>`<div class="theme-asset"><img src="./assets/${f}" alt="${f}"><div class="tiny" style="margin-top:8px">${f}</div></div>`).join('')}</div>
  </section>`;
}

function buildTeams(){
 state.theme=document.getElementById('theme').value;
 state.totalPlayers=parseInt(document.getElementById('totalPlayers').value||'18',10);
 state.teamCount=parseInt(document.getElementById('teamCount').value||'3',10);
 state.publicType=document.getElementById('publicType').value;
 state.difficulty=document.getElementById('difficulty').value;
 state.duration=parseInt(document.getElementById('duration').value||'3600',10);
 initTeams(); setTheme();
 const suggested=Math.ceil(state.totalPlayers/state.teamCount);
 document.getElementById('teamsEditor').innerHTML=`<div class="notice"><strong>Concordance joueurs / équipes :</strong><br>${state.totalPlayers} joueurs pour ${state.teamCount} équipes → répartition cible : ${teamDistribution(state.totalPlayers,state.teamCount)}.</div>
 <div class="team-grid">${state.teams.map((team,i)=>`<div class="team-card"><h4>Équipe ${i+1}</h4><label>Nom d’équipe</label><input id="teamName_${i}" value="${team.name}"><label style="margin-top:8px">Joueurs (un par ligne)</label><textarea id="teamPlayers_${i}" placeholder="Nom 1\nNom 2\nNom 3">${team.players.join('\n')}</textarea><div class="team-link-box"><strong>Lien équipe</strong><code>${teamLink(i)}</code><div class="tiny">À ouvrir par l’équipe. Le suivi admin n’y apparaît pas.</div></div></div>`).join('')}</div>
 <div class="btns"><button class="btn-main" onclick="startMission()">LANCER LA MISSION</button></div>`;
}

function startMission(){
 initTeams();
 state.teams=state.teams.map((team,i)=>({name:document.getElementById(`teamName_${i}`)?.value?.trim()||`Équipe ${i+1}`,players:(document.getElementById(`teamPlayers_${i}`)?.value||'').split('\n').map(x=>x.trim()).filter(Boolean),score:0,progress:0}));
 state.hints=0;state.time=state.duration;state.index=0;state.activeTeam=0;state.fragments=[];state.metaPick=null;state.selectedChallenges=chooseChallenges();state.timerActive=false;saveState();location.hash='#admin-intro';renderRoute();
}

function renderAdminDash(){
 return `<aside class="dash"><h3>Suivi administrateur</h3><div class="small">Visible uniquement côté admin.</div>${state.teams.map((team,idx)=>`<div class="dash-team" style="${idx===state.activeTeam?'box-shadow:0 0 0 2px rgba(114,204,255,.28) inset;':''}"><strong>${team.name}</strong><br>Score : ${team.score} pts<br>Progression : ${team.progress}/${state.selectedChallenges.length}<br>Joueurs : ${team.players.length||0}</div>`).join('')}<div class="btns"><button class="btn-dark" onclick="adminBoost()">+100 équipe active</button><button class="btn-dark" onclick="adminHint()">Indice admin</button></div><div id="adminMsg"></div></aside>`;
}
function adminBoost(){currentTeam().score+=100;saveState();renderAdminPlay()}
function adminHint(){const c=state.selectedChallenges[state.index];document.getElementById('adminMsg').innerHTML=`<div class="freeclue"><strong>Indice admin :</strong><br>${c.free}</div>`}

function showIntro(isPlayer=false){
 setTheme();toggleAmbience(true);const GAME=currentTheme();
 APP.innerHTML=`<section class="cinematic-screen"><div class="cinematic-box"><div class="kicker glitch" data-text="TRANSMISSION">TRANSMISSION</div><h1 class="glitch" data-text="${GAME.title}">${GAME.title}</h1><div id="cineBox"></div><div class="btns"><button class="btn-main hidden" id="introBtn" onclick="${isPlayer?'goPlayer()':'goAdmin()'}">${isPlayer?'COMMENCER POUR L’ÉQUIPE':'ENTRER DANS LA MISSION'}</button></div></div></section>`;
 let i=0;const box=document.getElementById('cineBox');
 function step(){if(i<GAME.introLines.length){box.innerHTML+=`<div class="cinematic-line fadein">${GAME.introLines[i]}</div>`;playTension();i++;setTimeout(step,900)}else{document.getElementById('introBtn').classList.remove('hidden');beep(640,.16,'triangle',.03)}}
 step();
}

function startTicking(){if(state.timerActive)return;state.timerActive=true;saveState();const tick=()=>{loadState();if(!state.timerActive)return;state.time=Math.max(0,state.time-1);if(state.time===45)playTension();if(state.time===30)playBad();saveState();if(state.time<=0){state.timerActive=false;saveState();finishMission(true);return}setTimeout(tick,1000)};setTimeout(tick,1000)}
function goAdmin(){startTicking();location.hash='#admin-play';renderRoute()}
function goPlayer(){startTicking();renderPlayer()}

function randomEvent(){if(Math.random()<0.34){const events=[{txt:'🎁 BONUS : +100 points à l’équipe active',fn:()=>currentTeam().score+=100},{txt:'💣 SABOTAGE : -80 points à l’équipe active',fn:()=>currentTeam().score=Math.max(0,currentTeam().score-80)},{txt:'⏱ FAILLE TEMPORELLE : -15 secondes',fn:()=>state.time=Math.max(0,state.time-15)},{txt:'⚠️ FAUX INDICE : cette manche contient une évidence piégée',fn:()=>{}}];const ev=events[Math.floor(Math.random()*events.length)];ev.fn();return ev.txt}return''}

function renderAdminPlay(){if(state.index>=state.selectedChallenges.length){renderMeta(true);return}APP.innerHTML=challengeMarkup(true)}
function renderPlayer(){if(state.index>=state.selectedChallenges.length){renderMeta(false);return}APP.innerHTML=challengeMarkup(false)}

function visualForChallenge(c){
 if(c.visual&&c.visual.startsWith('asset:')){const f=c.visual.split(':')[1];return`<div class="visual"><img src="./assets/${f}" alt="${f}"></div>`}
 const fallback={night:'night_scene_console.png',jungle:'jungle_scene_ruins.png',lab:'lab_scene_report.png'};return`<div class="visual"><img src="./assets/${fallback[state.theme]}" alt="theme"></div>`
}

function challengeMarkup(showAdmin){
 const c=state.selectedChallenges[state.index];const event=showAdmin?randomEvent():'';const team=currentTeam();
 const names={logic:'🧠 Logique',observation:'👁 Observation',deduction:'🔐 Déduction',strategy:'⚔️ Stratégie',pattern:'🔁 Motif',code:'🔐 Code',memory:'🧠 Mémoire',meta:'💣 Recoupement',navigation:'🧭 Navigation',choice:'⚡ Choix',branch:'🌪 Embranchement'};
 return `<div class="${showAdmin?'game-wrap':''}">
  <section class="game-shell fadein">
   <div class="hud"><div class="hud-left"><div class="badge points">${team.name} · ${team.score} pts</div><div class="badge meta">Épreuve ${state.index+1}/${state.selectedChallenges.length}</div><div class="badge meta">Cartes utilisées : ${state.hints}</div></div><div class="hud-right"><div class="badge timer ${timerColor()}">⏱ ${fmt(state.time)}</div></div></div>
   ${event?`<div class="eventbox">${event}</div>`:''}
   <div class="turn">🔥 C’EST À : ${currentPlayer()} DE JOUER</div>
   <div class="rules"><strong>Règle utile :</strong> si l’équipe bloque, elle doit d’abord relire puis utiliser une carte aide avant d’attendre la réponse.</div>
   <div class="help-legend"><span class="help-chip">⚡ Carte aide</span><span class="help-chip">⚡⚡ Carte bonus</span><span class="help-chip">👁 Indice discret</span></div>
   <div class="story">${c.scene.replace(/\n/g,'<br>')}</div>
   <div class="help-floating"><button class="help-pill help-aide" title="Carte aide" onclick="useHint(1, ${showAdmin})">⚡</button><button class="help-pill help-bonus" title="Carte bonus" onclick="useHint(2, ${showAdmin})">⚡⚡</button><button class="help-pill help-info" title="Indice discret" onclick="showFree()">👁</button></div>
   <h2 class="challenge-title">${c.title}</h2>
   <div class="challenge-type">${names[c.kind]||'Défi'}</div>
   ${visualForChallenge(c)}
   <div class="story"><strong>Énigme :</strong><br>${c.prompt.replace(/\n/g,'<br>')}</div>
   <div id="freeSlot"></div>
   ${c.type==='choice'?`<div class="choice-grid">${c.choices.map((ch,i)=>`<button class="choice" onclick="pick(${i}, this)">${ch}</button>`).join('')}</div>`:`<div class="panel" style="padding:14px;margin-top:14px"><label>Réponse libre</label><input id="freeAnswer" placeholder="Entre ta réponse"></div>`}
   <div id="feedback"></div>
  </section>
  ${showAdmin?renderAdminDash():''}
 </div>
 <div class="validate-bar"><button class="validate-btn" onclick="validate(${showAdmin})">VALIDER LA RÉPONSE</button></div>`;
}

function showFree(){const c=state.selectedChallenges[state.index];document.getElementById('freeSlot').innerHTML=`<div class="freeclue"><strong>Indice discret :</strong><br>${c.free}</div>`}
function pick(i,el){document.querySelectorAll('.choice').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');state.picked=i}
function useHint(level,showAdmin){const c=state.selectedChallenges[state.index];state.hints++;currentTeam().score=Math.max(0,currentTeam().score-(level===1?40:90));beep(level===1?520:420,.09,'triangle',.02);document.getElementById('feedback').innerHTML=`<div class="feedback help"><strong>${level===1?'Carte aide ⚡':'Carte bonus ⚡⚡'}</strong><br>${level===1?c.h1:c.h2}</div>`;saveState()}
function offerHint(showAdmin){document.getElementById('feedback').innerHTML+=`<div class="btns"><button class="btn-alt" onclick="useHint(1, ${showAdmin})">UTILISER UNE CARTE AIDE</button><button class="btn-alt" onclick="useHint(2, ${showAdmin})">UTILISER UNE CARTE BONUS</button></div>`}

function applyBranchEffects(c, answerText=null){
 if(c.kind!=='branch') return;
 if(c.branchMap && answerText && c.branchMap[answerText]){
   const fx = c.branchMap[answerText];
   if(fx.score) currentTeam().score += fx.score;
   if(fx.time) state.time = Math.max(0, state.time + fx.time);
 }
 if(c.branchSuccess){
   if(c.branchSuccess.score) currentTeam().score += c.branchSuccess.score;
   if(c.branchSuccess.time) state.time = Math.max(0, state.time + c.branchSuccess.time);
 }
}
function applyBranchFailure(c){
 if(c.kind!=='branch') return;
 if(c.branchFail){
   if(c.branchFail.score) currentTeam().score += c.branchFail.score;
   if(c.branchFail.time) state.time = Math.max(0, state.time + c.branchFail.time);
 }
}

function validate(showAdmin){
 const c=state.selectedChallenges[state.index];let ok=false;let answerText=null;
 if(c.type==='choice'){if(state.picked===null){document.getElementById('feedback').innerHTML=`<div class="feedback bad">Choisis d’abord une réponse.</div>`;return}ok=state.picked===c.answerIndex;answerText = c.choices[state.picked] ? norm(c.choices[state.picked].split('·').pop()) : null}
 else { const freeVal=document.getElementById('freeAnswer').value; ok=c.validator(freeVal); answerText=norm(freeVal) }
 const shell=document.querySelector('.game-shell');const team=currentTeam();
 if(ok){
   team.score += 120; team.progress = Math.max(team.progress, state.index+1); state.fragments.push(c.fragment); applyBranchEffects(c, answerText); playOk(); shell.classList.remove('flash-bad'); shell.classList.add('flash-good');
   document.getElementById('feedback').innerHTML=`<div class="feedback ok"><strong>✅ Bonne réponse.</strong><br>${c.exp}${c.kind==='branch'?'<br><br><strong>Effet d’embranchement appliqué.</strong>':''}<br><br><strong>Fragment obtenu : ${c.fragment}</strong></div><div class="btns"><button class="btn-main" onclick="nextChallenge(${showAdmin})">ÉPREUVE SUIVANTE</button></div>`;
 } else {
   state.attempts++; playBad(); shell.classList.remove('flash-good'); shell.classList.add('flash-bad');
   if(state.attempts<2){
     team.score=Math.max(0,team.score-40); document.getElementById('feedback').innerHTML=`<div class="feedback bad"><strong>❌ Mauvaise piste.</strong><br>Relis la scène. Si vous bloquez, utilisez d’abord une carte aide au lieu de brûler la réponse.<br><br><span class="small">Pénalité : -40 points.</span></div>`; offerHint(showAdmin);
   } else {
     team.score=Math.max(0,team.score-80); applyBranchFailure(c); document.getElementById('feedback').innerHTML=`<div class="feedback bad"><strong>💥 Défi perdu.</strong><br>${c.exp}${c.kind==='branch'?'<br><br><strong>Effet d’embranchement défavorable appliqué.</strong>':''}<br><br><span class="small">L’équipe suivante prend le relais.</span></div><div class="btns"><button class="btn-main" onclick="nextChallenge(${showAdmin})">ÉPREUVE SUIVANTE</button></div>`;
   }
 }
 saveState();
}
function nextChallenge(showAdmin){currentTeam().progress=Math.max(currentTeam().progress,state.index+1);state.index++;state.activeTeam=(state.activeTeam+1)%state.teamCount;state.attempts=0;saveState();showAdmin?renderAdminPlay():renderPlayer()}
function renderMeta(showAdmin){
 const GAME=currentTheme();
 APP.innerHTML=`<div class="${showAdmin?'game-wrap':''}">
  <section class="game-shell fadein">
   <div class="hud"><div class="hud-left"><div class="badge points">Final de mission</div><div class="badge meta">Fragments : ${state.fragments.length}</div></div><div class="hud-right"><div class="badge timer ${timerColor()}">⏱ ${fmt(state.time)}</div></div></div>
   <div class="turn glitch" data-text="RÉVÉLATION">💣 RÉVÉLATION FINALE</div>
   <div class="story">Fragments récupérés : <strong>${state.fragments.join(' · ')||'aucun'}</strong><br><br>La dernière étape te force à relire le parcours et à désigner la piste la plus stable.</div>
   <div class="story"><strong>${GAME.finalPrompt}</strong></div>
   <div class="choice-grid">${GAME.finalChoices.map((choice,i)=>`<button class="choice" onclick="pickMeta(${i}, this)">${choice}</button>`).join('')}</div>
   <div id="feedback"></div>
  </section>${showAdmin?renderAdminDash():''}</div>
  <div class="validate-bar"><button class="validate-btn" onclick="validateMeta(${showAdmin})">VALIDER LE VERDICT FINAL</button></div>`;
}
function pickMeta(i,el){document.querySelectorAll('.choice').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');state.metaPick=i}
function validateMeta(showAdmin){
 const GAME=currentTheme();
 if(state.metaPick===null){document.getElementById('feedback').innerHTML=`<div class="feedback bad">Choisis d’abord une piste.</div>`;return}
 if(state.metaPick===GAME.finalAnswer){currentTeam().score+=180;playOk();document.getElementById('feedback').innerHTML=`<div class="feedback ok"><strong>✅ Verdict validé.</strong><br>La piste finale retenue est la plus solide. L’équipe active ferme la mission.</div><div class="btns"><button class="btn-main" onclick="finishMission(false)">CLÔTURER LA MISSION</button></div>`}
 else{currentTeam().score=Math.max(0,currentTeam().score-120);playBad();document.getElementById('feedback').innerHTML=`<div class="feedback bad"><strong>❌ Verdict erroné.</strong><br>La meilleure piste finale n’était pas celle-ci, mais la mission peut quand même être clôturée avec le score actuel.</div><div class="btns"><button class="btn-main" onclick="finishMission(false)">CLÔTURER LA MISSION</button></div>`}
 saveState();
}
function finishMission(timeout){
 state.timerActive=false;saveState();toggleAmbience(false);const ranking=[...state.teams].sort((a,b)=>b.score-a.score);
 APP.innerHTML=`<section class="final-wrap fadein">
  <div class="wow-banner"><div class="wow-title">MISSION FERMÉE</div><div class="small">Pluie · néons · verdict · classement</div></div>
  <div class="final-card" style="margin-top:16px"><div class="big-score">${ranking[0]?.score||0} pts</div><p><strong>${ranking[0]?.name||'Aucune équipe'}</strong> remporte la mission.</p><p>${timeout?'Le chrono a forcé la fermeture de la partie avant la résolution complète.':'La mission se termine dans un halo de tension, de scène et de décision. Les équipes ont tenu jusqu’au bout.'}</p></div>
  <div class="rank-grid">${ranking.map((team,idx)=>`<div class="rank-card"><h4>${idx+1}. ${team.name}</h4>Score : ${team.score} pts<br>Progression : ${team.progress}/${state.selectedChallenges.length}<br>Joueurs : ${team.players.filter(Boolean).length}</div>`).join('')}</div>
  <div class="goal-grid"><div class="goal"><h4>Révélation</h4><div>Le classement final s’affiche clairement, avec une vraie sensation de fin.</div></div><div class="goal"><h4>Ce qui a compté</h4><div>Lecture, recoupement, cartes aide, embranchements et sang-froid.</div></div><div class="goal"><h4>GitHub only</h4><div>Tout reste autonome, sans backend, compatible GitHub Pages.</div></div></div>
  <div class="btns"><button class="btn-main" onclick="resetAll()">RETOUR ACCUEIL</button></div>
 </section>`;
}
function resetAll(){clearState();state={theme:'night',totalPlayers:18,teamCount:3,publicType:'adultes',difficulty:'difficile',duration:3600,teams:[],activeTeam:0,hints:0,time:0,index:0,picked:null,attempts:0,selectedChallenges:[],fragments:[],timerActive:false,metaPick:null};location.hash='#admin';renderRoute()}
function renderRoute(){loadState();setTheme();const r=route();if(r.startsWith('#team-')){if(!state.selectedChallenges.length){APP.innerHTML=`<section class="panel"><h2>Lien d’équipe</h2><div class="notice">La mission n’a pas encore été lancée par l’administrateur.</div><div class="btns"><button class="btn-main" onclick="location.hash='#admin';renderRoute()">Retour</button></div></section>`;return}showIntro(true);return}if(r==='#admin-intro'){showIntro(false);return}if(r==='#admin-play'){if(!state.selectedChallenges.length){renderAdmin();return}renderAdminPlay();return}renderAdmin()}
function resizeRain(){RAIN.width=innerWidth;RAIN.height=innerHeight}let drops=[];function initRain(){resizeRain();drops=Array.from({length:180},()=>({x:Math.random()*RAIN.width,y:Math.random()*RAIN.height,l:10+Math.random()*18,v:6+Math.random()*8}))}
function drawRain(){CTX.clearRect(0,0,RAIN.width,RAIN.height);CTX.strokeStyle='rgba(114,204,255,.35)';CTX.lineWidth=1;CTX.beginPath();for(const d of drops){CTX.moveTo(d.x,d.y);CTX.lineTo(d.x-4,d.y+d.l);d.y+=d.v;d.x-=.6;if(d.y>RAIN.height||d.x<-20){d.x=Math.random()*RAIN.width+40;d.y=-20}}CTX.stroke();requestAnimationFrame(drawRain)}
window.addEventListener('hashchange',renderRoute);window.addEventListener('resize',resizeRain);initRain();drawRain();renderRoute();if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}))}
