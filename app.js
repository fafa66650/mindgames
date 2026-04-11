
const APP = document.getElementById('app');
const RAIN = document.getElementById('rain');
const CTX = RAIN.getContext('2d');

const audioFiles = {
  theme_night: './audio/theme_night.wav',
  theme_jungle: './audio/theme_jungle.wav',
  theme_lab: './audio/theme_lab.wav',
  ok: './audio/ok.wav',
  bad: './audio/bad.wav',
  tension: './audio/tension.wav',
  glitch: './audio/glitch.wav'
};
const audioPool = {};
let soundEnabled = false;

function prepareAudio() {
  Object.entries(audioFiles).forEach(([k, v]) => {
    if (!audioPool[k]) {
      const a = new Audio(v);
      a.preload = 'auto';
      a.loop = k.startsWith('theme_');
      a.volume = k.startsWith('theme_') ? 0.55 : 0.95;
      audioPool[k] = a;
    }
  });
}
function currentThemeTrack() {
  return state.theme === 'jungle' ? 'theme_jungle' : state.theme === 'lab' ? 'theme_lab' : 'theme_night';
}
function autoEnableSound() {
  if (state.soundMode === 'off') { soundEnabled = false; save(); return; }
  if (soundEnabled) return;
  soundEnabled = true;
  prepareAudio();
  save();
}
function playFile(name) {
  if (!soundEnabled) return;
  try {
    prepareAudio();
    const a = audioPool[name].cloneNode();
    a.volume = audioPool[name].volume;
    a.play().catch(() => {});
  } catch (e) {}
}
function startThemeMusic() {
  if (!soundEnabled) return;
  try {
    prepareAudio();
    ['theme_night','theme_jungle','theme_lab'].forEach(k => {
      audioPool[k].pause();
      audioPool[k].currentTime = 0;
    });
    const key = currentThemeTrack();
    audioPool[key].currentTime = 0;
    audioPool[key].play().catch(() => {});
  } catch (e) {}
}
function stopThemeMusic() {
  try {
    prepareAudio();
    ['theme_night','theme_jungle','theme_lab'].forEach(k => {
      audioPool[k].pause();
      audioPool[k].currentTime = 0;
    });
  } catch (e) {}
}
function norm(s) {
  return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'').trim();
}

const THEMES = {
  "": {
    body:'theme-night',
    title:'GAME ARENA',
    subtitle:'Une plateforme d’escape game immersive pensée pour le terrain, le téléphone et l’ordinateur. Tu prépares tes équipes, choisis le niveau, règles la durée, puis tu lances une mission vivante avec pression, indices, pièges et retournements.'
  },
  night: {
    body:'theme-night',
    title:'GAME ARENA',
    subtitle:'Une mission urbaine sous pluie et néons, pensée pour la lecture d’indices, la logique et la tension.',
    mission:'Infiltration nocturne. Des indices ont été altérés. Ton équipe doit lire froidement, éviter les fausses pistes et sortir avec le meilleur score.',
    intro:['Transmission instable…','Une infiltration a été confirmée.','Lis vite, mais lis bien.','La nuit favorise les erreurs de lecture.','Mission autorisée.']
  },
  jungle: {
    body:'theme-jungle',
    title:'GAME ARENA',
    subtitle:'Une expédition au cœur de ruines vivantes, entre repères cachés, trajectoires et glyphes.',
    mission:'Une ancienne voie est de nouveau ouverte. Les bons passages se lisent dans l’ordre, la forme et les détails.',
    intro:['La jungle ne se tait jamais complètement.','Les ruines se lisent par couches.','Le bon chemin n’est pas toujours le plus beau.','Expédition ouverte.']
  },
  lab: {
    body:'theme-lab',
    title:'GAME ARENA',
    subtitle:'Un protocole d’urgence dans un environnement instable, où chaque action, chaque lecture et chaque décision comptent.',
    mission:'Le système se dégrade. Ton équipe doit stabiliser, lire, trier et verrouiller le bon chemin avant la rupture.',
    intro:['L’alarme a déjà commencé.','Les écrans se contredisent.','Chaque décision a un coût.','Protocole activé.']
  }
};

const FINALS = {"night": {"prompt": "Quel profil reste la piste finale la plus solide ?", "choices": ["A · Agent noir", "B · Agent blanc", "C · Agent gris", "D · Agent bleu"], "answer": 1}, "jungle": {"prompt": "Quelle dernière piste ouvre vraiment le passage ?", "choices": ["A · Nord", "B · Centre", "C · Est", "D · Ouest"], "answer": 1}, "lab": {"prompt": "Quelle lettre verrouille la sécurité finale ?", "choices": ["A · R", "B · N", "C · I", "D · U"], "answer": 1}};
const BANK = {"night": [{"age": "enfants", "level": 1, "label": "Observation", "title": "Repère lumineux", "scene": "Un badge n’est pas rangé comme les autres.", "prompt": "Quel repère paraît le plus suspect ?", "visual": "night_puzzle_badges.png", "answerType": "choice", "choices": ["A · coin haut gauche", "B · coin haut droit", "C · centre", "D · coin bas gauche"], "answerIndex": 1, "exp": "Le coin haut droit casse la logique visuelle.", "free": "Cherche l’élément qui change vraiment de place.", "h1": "Le centre n’est pas le piège.", "h2": "Le repère suspect est en haut à droite.", "fragment": "A", "visualNeeded": true}, {"age": "enfants", "level": 2, "label": "Suite", "title": "Mur de symboles", "scene": "Les symboles suivent une répétition simple.", "prompt": "Quelle suite termine correctement la ligne ?", "visual": "night_puzzle_codewall.png", "answerType": "choice", "choices": ["A · ▲ ● ▲", "B · ■ ● ■", "C · ▲ ■ ●", "D · ● ● ●"], "answerIndex": 0, "exp": "La répétition revient sur ▲ ● ▲.", "free": "Observe le rythme.", "h1": "Le premier symbole revient.", "h2": "La bonne fin est ▲ ● ▲.", "fragment": "B", "visualNeeded": true}, {"age": "enfants", "level": 3, "label": "Choix", "title": "Tunnel ou hall", "scene": "Le tunnel est plus discret. Le hall paraît plus rapide mais plus risqué.", "prompt": "Quel chemin choisissez-vous ?", "visual": "night_scene_console.png", "answerType": "choice", "choices": ["A · Tunnel", "B · Hall"], "answerIndex": 0, "exp": "Le tunnel protégeait la suite.", "free": "Le plus rapide n’est pas toujours le meilleur.", "h1": "La discrétion protège ici.", "h2": "Le tunnel était la bonne voie.", "fragment": "C", "branchSuccess": {"score": 40}, "branchFail": {"score": -40, "time": -10}, "visualNeeded": true}, {"age": "ados", "level": 1, "label": "Logique", "title": "Déclaration verrouillée", "scene": "Trois agents sont interrogés. Un seul dit vrai.", "prompt": "A dit : “B ment.” B dit : “C ment.” C dit : “A et B mentent.” Qui dit vrai ?", "visual": null, "answerType": "text", "validatorType": "equals", "validatorValue": "c", "exp": "Si A dit vrai, alors B ment. Si B ment, alors “C ment” est faux, donc C dit vrai aussi. Cela crée deux vérités, impossible. Si B dit vrai, alors C ment. Mais C dit “A et B mentent” devient faux, ce qui n’aide pas A. La seule configuration stable est celle où C est le seul à dire vrai.", "free": "Teste l’hypothèse la plus forte.", "h1": "Commence par C.", "h2": "La bonne réponse est C.", "fragment": "D", "visualNeeded": false}, {"age": "ados", "level": 2, "label": "Mémoire", "title": "Lecture brève", "scene": "Le message s’affiche une seconde : pluie, lanterne, clé cuivre, vitre fendue, quai vide.", "prompt": "Quel duo apparaissait vraiment ?", "visual": "night_scene_console.png", "answerType": "choice", "choices": ["A · clé cuivre + vitre fendue", "B · pluie + torche blanche", "C · quai vide + badge rouge", "D · lanterne + moteur bleu"], "answerIndex": 0, "exp": "Le duo correct reprend exactement deux mots du message initial sans changer ni l’objet ni l’adjectif. Les autres réponses mélangent des éléments inventés.", "free": "Un seul duo ne change aucun mot.", "h1": "Les adjectifs piègent.", "h2": "Le bon duo est A.", "fragment": "E", "visualNeeded": false}, {"age": "ados", "level": 3, "label": "Code", "title": "Clavier asymétrique", "scene": "Code à 4 chiffres : somme 18, le 2e vaut le 1er + 2, le dernier vaut la moitié du 3e.", "prompt": "Quel code reste cohérent ?", "visual": "night_puzzle_codewall.png", "answerType": "choice", "choices": ["A · 4 - 6 - 8 - 4", "B · 2 - 4 - 8 - 4", "C · 3 - 5 - 6 - 3", "D · 5 - 7 - 4 - 2"], "answerIndex": 1, "exp": "Le bon code respecte en même temps les trois contraintes : la somme totale, le deuxième chiffre qui vaut le premier plus deux, et le dernier qui vaut la moitié du troisième.", "free": "Fixe d’abord la relation 2e = 1er + 2.", "h1": "Puis vérifie la moitié.", "h2": "Le code cohérent est B.", "fragment": "F", "visualNeeded": true}, {"age": "ados", "level": 4, "label": "Recoupement", "title": "Croisement lourd", "scene": "La taupe n’utilise jamais la sortie principale. Si l’agent noir ment, l’agent gris ment aussi. L’agent gris n’était pas sur zone après 22h. La taupe était encore là après 22h.", "prompt": "Quel agent reste le plus crédible comme taupe ?", "visual": null, "answerType": "choice", "choices": ["A · Agent noir", "B · Agent blanc", "C · Agent gris", "D · Agent bleu"], "answerIndex": 1, "exp": "L’agent gris est exclu par l’horaire. L’agent noir entraîne une contradiction conditionnelle. Le blanc reste le seul profil qui ne casse aucune règle du dossier.", "free": "Élimine d’abord ce qui viole l’heure.", "h1": "Le gris tombe tout de suite.", "h2": "Le blanc reste le plus solide.", "fragment": "G", "visualNeeded": false}, {"age": "adultes", "level": 1, "label": "Déduction", "title": "Dossier scellé", "scene": "Le rapport donne trois indices fiables : le traître n’était pas au quai, le badge bleu est exclu, et la sortie a eu lieu après 22h.", "prompt": "Quel profil reste cohérent ?", "visual": "night_scene_dossier.png", "answerType": "choice", "choices": ["A · Quai / bleu / 21h40", "B · Hall / noir / 22h15", "C · Quai / noir / 22h20", "D · Hall / bleu / 22h30"], "answerIndex": 1, "exp": "On élimine d’abord tout ce qui mentionne le quai, puis tout ce qui utilise le badge bleu, puis tout horaire avant 22h. Il ne reste qu’un seul profil valide.", "free": "Élimine le quai puis le bleu.", "h1": "Le quai tombe.", "h2": "Le profil cohérent est B.", "fragment": "H", "visualNeeded": true}, {"age": "adultes", "level": 2, "label": "Observation", "title": "Trouve la ligne symétrique", "scene": "Une seule séquence est parfaitement symétrique.", "prompt": "Quelle ligne respecte le miroir ?", "visual": "night_puzzle_grid.png", "answerType": "choice", "choices": ["A · ▲ ● ■ ■ ● ▲", "B · ▲ ● ■ ● ■ ▲", "C · ● ▲ ■ ■ ● ▲", "D · ▲ ● ▲ ▲ ● ■"], "answerIndex": 0, "exp": "Une séquence miroir se lit de gauche à droite et de droite à gauche sans changer l’ordre des symboles. Une seule ligne garde cette symétrie complète.", "free": "Relis depuis la fin.", "h1": "Le centre doit se répondre.", "h2": "La bonne ligne est A.", "fragment": "I", "visualNeeded": true}, {"age": "adultes", "level": 3, "label": "Interrogatoire", "title": "Salle d’interrogatoire", "scene": "Quatre phrases ont été enregistrées. Une seule peut tenir sans contradiction avec les autres.", "prompt": "A : “Je suis innocent et B ment.”
B : “C était avec moi toute la soirée.”
C : “A et D ne disent pas la vérité.”
D : “Si B ment, alors A ment aussi.”

Quelle phrase est la plus crédible ?", "visual": null, "answerType": "text", "validatorType": "equals", "validatorValue": "d", "exp": "La phrase D reste la seule qui peut tenir sans forcer plusieurs contradictions à la fois. Les autres hypothèses finissent par produire deux affirmations vraies ou aucune stable.", "free": "Cherche une structure conditionnelle stable.", "h1": "Teste le cas où B ment.", "h2": "La phrase la plus crédible est D.", "fragment": "J", "visualNeeded": false}, {"age": "adultes", "level": 4, "label": "Logique pure", "title": "Recoupement terminal", "scene": "Si le traître passe par le hall, alors le badge noir est exclu. Si le hall est exclu, la sortie principale devient impossible. Or la sortie principale est impossible.", "prompt": "Que déduire sur le hall ?", "visual": null, "answerType": "text", "validatorType": "containsAny", "validatorValue": ["possible", "onpeutpaslexclure"], "exp": "Le piège est logique : “si A alors B” ne veut pas dire “si non B alors non A” sans passer par la bonne contraposée. Ici, la conclusion trop rapide serait fausse.", "free": "Évite l’inversion abusive.", "h1": "Ne lis pas “si B alors A”.", "h2": "Le hall reste possible.", "fragment": "K", "visualNeeded": false}, {"age": "adultes", "level": 3, "label": "Embranchement", "title": "Grille de dérivation", "scene": "Trois trajets sont possibles. L’un mène à un bonus, l’un est neutre, l’un entraîne un sabotage.", "prompt": "Écris : alpha, beta ou gamma.", "visual": "night_puzzle_grid.png", "answerType": "text", "validatorType": "in", "validatorValue": ["alpha", "beta", "gamma"], "exp": "Le choix ouvre une suite différente selon la voie prise.", "free": "Une voie est prudente, une voie est rentable, une voie est toxique.", "h1": "Alpha = bonus.", "h2": "Beta = neutre, Gamma = sabotage.", "fragment": "L", "branchMap": {"alpha": {"score": 80}, "beta": {"score": 0}, "gamma": {"score": -90, "time": -20}}, "visualNeeded": true}], "jungle": [{"age": "enfants", "level": 1, "label": "Chemin", "title": "Chemin coloré", "scene": "Un seul chemin respecte la séquence pierre → liane → dalle.", "prompt": "Quel chemin faut-il prendre ?", "visual": "jungle_puzzle_path.png", "answerType": "choice", "choices": ["A · sentier 1", "B · sentier 2", "C · sentier 3", "D · sentier 4"], "answerIndex": 2, "exp": "Le sentier 3 garde le bon ordre.", "free": "L’ordre compte plus que le décor.", "h1": "Cherche la dalle en dernier.", "h2": "Le bon chemin est le 3.", "fragment": "A", "visualNeeded": true}, {"age": "enfants", "level": 2, "label": "Observation", "title": "Tablette vivante", "scene": "Un glyphe n’a pas la même famille que les autres.", "prompt": "Quel glyphe est intrus ?", "visual": "jungle_puzzle_glyphs.png", "answerType": "choice", "choices": ["A · soleil", "B · feuille", "C · feuille fendue", "D · feuille sombre"], "answerIndex": 0, "exp": "Les trois feuilles vont ensemble.", "free": "Cherche la famille dominante.", "h1": "Trois formes se ressemblent.", "h2": "Le soleil est l’intrus.", "fragment": "B", "visualNeeded": true}, {"age": "enfants", "level": 3, "label": "Choix", "title": "Fourche des lianes", "scene": "Le chemin gauche est plus court mais passe près des statues doubles. Le chemin droit est plus long et plus stable.", "prompt": "Quel chemin choisissez-vous ?", "visual": "jungle_puzzle_path.png", "answerType": "choice", "choices": ["A · Gauche", "B · Droite"], "answerIndex": 1, "exp": "La droite évite le piège.", "free": "Le raccourci attire mais piège souvent.", "h1": "La sécurité coûte parfois quelques secondes.", "h2": "Le chemin droit était le plus stable.", "fragment": "C", "branchSuccess": {"score": 30}, "branchFail": {"score": -50, "time": -15}, "visualNeeded": true}, {"age": "ados", "level": 1, "label": "Navigation", "title": "Route des repères", "scene": "La route correcte doit suivre : arche creuse, zone détrempée, dalle gravée, clairière.", "prompt": "Quelle route reste crédible ?", "visual": "jungle_puzzle_path.png", "answerType": "choice", "choices": ["A · Est / arche / zone humide / dalle / clairière", "B · Ouest / arche / clairière / zone humide", "C · Nord / dalle / arche / clairière", "D · Sud / rivière / colline / 2 pierres"], "answerIndex": 0, "exp": "A garde les bons repères dans le bon ordre.", "free": "L’ordre complet est la clé.", "h1": "La clairière vient après la dalle.", "h2": "La bonne route commence par l’Est.", "fragment": "D", "visualNeeded": true}, {"age": "ados", "level": 2, "label": "Cycle", "title": "Ordre des glyphes", "scene": "Le motif revient tous les 3 symboles.", "prompt": "Quel symbole doit venir ensuite ?", "visual": "jungle_puzzle_glyphs.png", "answerType": "choice", "choices": ["A · serpent", "B · pierre", "C · feuille", "D · soleil"], "answerIndex": 2, "exp": "La séquence ramène la feuille.", "free": "Compte par blocs de 3.", "h1": "Le cycle repart.", "h2": "La feuille revient.", "fragment": "E", "visualNeeded": true}, {"age": "ados", "level": 3, "label": "Double lecture", "title": "Tablette à double lecture", "scene": "Tu peux lire la tablette en mode rituel ou en mode géométrique.", "prompt": "Écris : rituel ou geometrie.", "visual": "jungle_puzzle_tablet.png", "answerType": "text", "validatorType": "in", "validatorValue": ["rituel", "geometrie"], "exp": "Le choix de lecture modifie la valeur du fragment obtenu.", "free": "Une lecture est plus immersive, l’autre plus rationnelle.", "h1": "Rituel = plus narratif.", "h2": "Géométrie sécurise davantage.", "fragment": "F", "branchMap": {"rituel": {"score": 20}, "geometrie": {"score": 50}}, "visualNeeded": true}, {"age": "ados", "level": 4, "label": "Mythe", "title": "Récit exploitable", "scene": "Trois récits parlent du même passage. Deux embellissent le danger. Un seul reste cohérent si on retire les éléments symboliques.", "prompt": "Quel récit reste le plus exploitable : A, B ou C ?", "visual": "jungle_scene_ruins.png", "answerType": "text", "validatorType": "equals", "validatorValue": "c", "exp": "Le récit C reste exploitable.", "free": "Sépare le décor rituel de l’information utile.", "h1": "Deux récits gonflent artificiellement le danger.", "h2": "Le récit exploitable est C.", "fragment": "G", "visualNeeded": true}, {"age": "adultes", "level": 1, "label": "Code", "title": "Mécanisme des runes", "scene": "Le code a 4 chiffres pairs différents. Leur somme vaut 20 et le deuxième vaut le premier + 2.", "prompt": "Quelle séquence est valable ?", "visual": "jungle_puzzle_tablet.png", "answerType": "choice", "choices": ["A · 2 - 4 - 6 - 8", "B · 4 - 6 - 8 - 2", "C · 6 - 8 - 4 - 2", "D · 2 - 6 - 4 - 8"], "answerIndex": 0, "exp": "A valide tout.", "free": "Commence par la relation entre le 1er et le 2e chiffre.", "h1": "La somme 20 élimine déjà beaucoup.", "h2": "La bonne séquence commence par 2 puis 4.", "fragment": "H", "visualNeeded": true}, {"age": "adultes", "level": 2, "label": "Tracé", "title": "Tracé cohérent", "scene": "Le parcours réel traverse exactement deux zones humides, évite les statues doubles, puis termine par une dalle fendue.", "prompt": "Quel tracé reste possible ?", "visual": "jungle_scene_map.png", "answerType": "choice", "choices": ["A · 1-3-4", "B · 2-4-6", "C · 1-5-6", "D · 3-4-5"], "answerIndex": 1, "exp": "Le tracé 2-4-6 respecte les trois contraintes.", "free": "Compte les zones humides avant tout.", "h1": "Il en faut exactement deux.", "h2": "Le seul tracé cohérent est 2-4-6.", "fragment": "I", "visualNeeded": true}, {"age": "adultes", "level": 3, "label": "Ordre", "title": "Salle des dalles", "scene": "Quatre dalles doivent être activées dans l’ordre, mais deux se copient mutuellement. On sait que la 2e est après la 4e, et que la 1re n’est jamais jouée la dernière.", "prompt": "Quelle dalle ne peut pas être jouée en premier : 1, 2, 3 ou 4 ?", "visual": "jungle_puzzle_tablet.png", "answerType": "text", "validatorType": "equals", "validatorValue": "2", "exp": "La dalle 2 ne peut pas ouvrir la séquence.", "free": "Une seule dalle est bloquée dès la première condition.", "h1": "Pense avant / après.", "h2": "La dalle 2 ne peut pas être jouée en premier.", "fragment": "J", "visualNeeded": true}, {"age": "adultes", "level": 4, "label": "Récit", "title": "Récit à écarter", "scene": "Deux récits parlent du même signe d’ouverture. L’un ajoute des symboles sans valeur technique.", "prompt": "Quel récit faut-il écarter : A ou B ?", "visual": "jungle_scene_ruins.png", "answerType": "text", "validatorType": "equals", "validatorValue": "a", "exp": "Le récit A surcharge le symbole.", "free": "Écarte le récit trop décoratif.", "h1": "Le bon récit reste sobre.", "h2": "Le récit à écarter est A.", "fragment": "K", "visualNeeded": true}], "lab": [{"age": "enfants", "level": 1, "label": "Verrou", "title": "Double 4", "scene": "Le verrou demande deux nombres identiques dont la somme vaut 8.", "prompt": "Quelle combinaison convient ?", "visual": "lab_puzzle_lock.png", "answerType": "choice", "choices": ["A · 4 et 4", "B · 3 et 5", "C · 2 et 6", "D · 1 et 7"], "answerIndex": 0, "exp": "4 et 4 sont identiques et totalisent 8.", "free": "Les deux nombres doivent être les mêmes.", "h1": "Même valeur des deux côtés.", "h2": "4 et 4.", "fragment": "A", "visualNeeded": true}, {"age": "enfants", "level": 2, "label": "Voyants", "title": "Famille de couleurs", "scene": "Un voyant ne suit pas la couleur du reste.", "prompt": "Lequel est incohérent ?", "visual": "lab_puzzle_alert.png", "answerType": "choice", "choices": ["A · rouge", "B · rouge sombre", "C · cyan", "D · rouge clair"], "answerIndex": 2, "exp": "Le cyan casse la logique dominante rouge.", "free": "Cherche la rupture de famille.", "h1": "Trois voyants sont proches.", "h2": "Le cyan est l’intrus.", "fragment": "B", "visualNeeded": true}, {"age": "enfants", "level": 3, "label": "Pression", "title": "Purge ou force", "scene": "Tu peux purger doucement ou forcer une baisse rapide. La purge lente prend du temps mais évite un surcoût.", "prompt": "Quelle option choisissez-vous ?", "visual": "lab_puzzle_matrix.png", "answerType": "choice", "choices": ["A · Purge lente", "B · Baisse rapide"], "answerIndex": 0, "exp": "La purge lente protège le score.", "free": "La solution brutale coûte souvent cher.", "h1": "Le temps n’est pas toujours la vraie perte.", "h2": "La purge lente était plus stable.", "fragment": "C", "branchSuccess": {"time": -10}, "branchFail": {"score": -60}, "visualNeeded": true}, {"age": "ados", "level": 1, "label": "Action", "title": "Protocole d’urgence", "scene": "Attendre peut aggraver la situation. Fuir coupe toute chance de stabilisation.", "prompt": "Quelle action reste la plus crédible ?", "visual": "lab_scene_circuit.png", "answerType": "choice", "choices": ["A · Attendre", "B · Agir", "C · Fuir", "D · Éteindre tout"], "answerIndex": 1, "exp": "Agir reste la seule réponse cohérente.", "free": "Élimine les options qui abandonnent le problème.", "h1": "Attendre ou fuir ne stabilisent rien.", "h2": "Il faut agir.", "fragment": "D", "visualNeeded": true}, {"age": "ados", "level": 2, "label": "Suite", "title": "Matrice chaude", "scene": "Une matrice répète un motif de 4 valeurs : 2, 3, 5, 8...", "prompt": "Quelle valeur suit ?", "visual": "lab_puzzle_matrix.png", "answerType": "choice", "choices": ["A · 10", "B · 12", "C · 13", "D · 15"], "answerIndex": 2, "exp": "5 + 8 = 13.", "free": "Observe les deux derniers nombres.", "h1": "Ce n’est plus une addition constante.", "h2": "La valeur suivante est 13.", "fragment": "E", "visualNeeded": true}, {"age": "ados", "level": 3, "label": "Protocole", "title": "Manuel ou auto", "scene": "Tu peux saisir le code en mode manuel ou auto.", "prompt": "Écris : manuel ou auto.", "visual": "lab_puzzle_lock.png", "answerType": "text", "validatorType": "in", "validatorValue": ["manuel", "auto"], "exp": "Le choix de protocole influence le risque.", "free": "Le manuel sécurise, l’auto accélère.", "h1": "Auto peut coûter.", "h2": "Manuel peut ralentir mais rassure.", "fragment": "F", "branchMap": {"manuel": {"score": 40}, "auto": {"time": -10, "score": -20}}, "visualNeeded": true}, {"age": "ados", "level": 4, "label": "Rapport", "title": "Rapport à écarter", "scene": "Le rapport 1 décrit une cause, le rapport 2 une conséquence, le rapport 3 mélange les deux pour tromper l’opérateur.", "prompt": "Quel rapport faut-il écarter : 1, 2 ou 3 ?", "visual": "lab_scene_report.png", "answerType": "text", "validatorType": "equals", "validatorValue": "3", "exp": "Le rapport 3 mélange cause et conséquence pour piéger.", "free": "Cherche le document qui confond les niveaux.", "h1": "Deux rapports restent techniquement propres.", "h2": "Le rapport à écarter est le 3.", "fragment": "G", "visualNeeded": true}, {"age": "adultes", "level": 1, "label": "Suite", "title": "Doublement", "scene": "La suite affichée grimpe trop vite pour être lue à moitié : 2, 4, 8, ?", "visual": "lab_scene_circuit.png", "prompt": "Quelle valeur doit suivre ?", "answerType": "choice", "choices": ["A · 16", "B · 10", "C · 12", "D · 14"], "answerIndex": 0, "exp": "La valeur double à chaque étape.", "free": "La logique ne change pas.", "h1": "Chaque valeur vaut le double.", "h2": "La bonne réponse est 16.", "fragment": "H", "visualNeeded": true}, {"age": "adultes", "level": 2, "label": "Observation", "title": "Ligne incohérente", "scene": "Quatre lignes semblent correctes, mais une seule casse la logique d’ensemble.", "visual": "lab_puzzle_alert.png", "prompt": "Quelle ligne est incohérente ?", "answerType": "choice", "choices": ["A · 22 / 24 / 26", "B · 30 / 32 / 34", "C · 12 / 16 / 14", "D · 40 / 42 / 44"], "answerIndex": 2, "exp": "C casse la progression régulière.", "free": "Trois lignes gardent la même montée.", "h1": "Cherche la seule ligne qui brise le rythme.", "h2": "La ligne C casse la progression.", "fragment": "I", "visualNeeded": true}, {"age": "adultes", "level": 3, "label": "Logique", "title": "Contraposée", "scene": "Si la chambre A déborde, alors la chambre C coupe le flux. Or le flux n’est pas coupé.", "visual": "lab_scene_report.png", "prompt": "Que peut-on affirmer sur A ?", "answerType": "text", "validatorType": "containsAny", "validatorValue": ["nedebordepas", "apasdeborde"], "exp": "Par contraposée, A n’a pas débordé.", "free": "Cherche la contraposée utile.", "h1": "Si A alors B ; non B donc…", "h2": "A n’a pas débordé.", "fragment": "J", "visualNeeded": true}, {"age": "adultes", "level": 4, "label": "Carte", "title": "Carte d’accès", "scene": "La chambre 4 ne peut pas être ouverte si la 2 est vide. La 2 est pleine. La 4 n’accepte ni rouge ni noir.", "visual": "lab_puzzle_lock.png", "prompt": "Quelle carte d’accès reste cohérente ?", "answerType": "choice", "choices": ["A · carte rouge", "B · carte noire", "C · carte bleue", "D · carte rouge-noire"], "answerIndex": 2, "exp": "Rouge et noir sont exclus, il reste la carte bleue.", "free": "Commence par les exclusions directes.", "h1": "Deux couleurs tombent tout de suite.", "h2": "La carte cohérente est la bleue.", "fragment": "K", "visualNeeded": true}]};

let state = {
  theme:'',
  totalPlayers:'',
  teamCount:'',
  publicType:'',
  difficulty:'',
  duration:'',
  teams:[],
  activeTeam:0,
  hints:0,
  time:0,
  index:0,
  picked:null,
  attempts:0,
  selectedChallenges:[],
  fragments:[],
  timerActive:false,
  metaPick:null,
  showVisual:true,
  soundMode:'on'
};

function save() {
  localStorage.setItem('fafa_v12', JSON.stringify({...state, soundEnabled}));
}
function load() {
  try {
    const raw = localStorage.getItem('fafa_v12');
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.assign(state, parsed);
      soundEnabled = !!parsed.soundEnabled;
    }
  } catch (e) {}
}
function clearStore() {
  localStorage.removeItem('fafa_v12');
}
function setTheme() {
  document.body.className = THEMES[state.theme || ''].body;
}
function currentTeam() {
  return state.teams[state.activeTeam] || {name:'Équipe', players:[], score:0, progress:0};
}
function currentPlayer() {
  const t = currentTeam();
  if (!t.players.length) return t.name || 'Équipe';
  return t.players[state.index % t.players.length] || t.name;
}
function fmt(t) {
  const m=String(Math.floor(t/60)).padStart(2,'0');
  const s=String(t%60).padStart(2,'0');
  return `${m}:${s}`;
}
function timerColor() {
  if (state.time > 120) return 'green';
  if (state.time > 45) return 'orange';
  return 'red';
}
function syncTimerBadge() {
  const el = document.getElementById('live-timer');
  if (!el) return;
  el.textContent = '⏱ ' + fmt(state.time);
  el.className = 'badge timer timer-live ' + timerColor();
}

function ready() {
  return state.theme && state.totalPlayers && state.teamCount && state.publicType && state.difficulty && state.duration;
}
function difficultyWeight() {
  return {facile:1,moyen:2,difficile:3,extreme:4}[state.difficulty] || 1;
}
function challengeCount() {
  const minutes = Number(state.duration||0)/60;
  let base = minutes<=30 ? 4 : minutes<=45 ? 6 : minutes<=60 ? 8 : minutes<=90 ? 10 : 12;
  if (state.publicType === 'enfants') base -= 1;
  if (state.publicType === 'adultes') base += 1;
  base += Math.max(0, difficultyWeight()-2);
  if ((Number(state.totalPlayers)||0) >= 24) base += 1;
  if ((Number(state.teamCount)||0) >= 5) base += 1;
  return Math.max(4, Math.min(16, base));
}
function autoDistribution() {
  if (!state.totalPlayers || !state.teamCount) return 'à définir';
  const total=Number(state.totalPlayers), teams=Number(state.teamCount);
  const base=Math.floor(total/teams), rest=total%teams;
  return rest===0 ? `${teams} équipes de ${base}` : `${rest} équipes de ${base+1} · ${teams-rest} équipes de ${base}`;
}
function poolForCurrent() {
  if (!ready()) return [];
  const age = state.publicType;
  const maxLevel = difficultyWeight();
  return (BANK[state.theme] || []).filter(x => x.age === age && x.level <= maxLevel);
}
function chooseChallenges() {
  const pool = poolForCurrent();
  const count = challengeCount();
  const out = [];
  let i = 0;
  while (out.length < count && pool.length) {
    const src = pool[i % pool.length];
    out.push({...src, instance:i+1});
    i++;
  }
  return out;
}


function renderStudioSystems(){
  return `<section class="studio-systems panel">
    <h3>Interface tactique</h3>
    <div class="inventory-bar">
      <div class="inv-slot">🔑<span>Clé</span></div>
      <div class="inv-slot">📁<span>Dossier</span></div>
      <div class="inv-slot">💾<span>Data</span></div>
      <div class="inv-slot">🧩<span>Fragment</span></div>
    </div>
    <div class="mini-grid">
      <button class="sys-btn" onclick="triggerStudioEvent('scan')">SCAN DOSSIER</button>
      <button class="sys-btn" onclick="triggerStudioEvent('decrypt')">DÉCRYPTER</button>
      <button class="sys-btn" onclick="triggerStudioEvent('combine')">COMBINER OBJETS</button>
      <button class="sys-btn" onclick="triggerStudioEvent('trace')">TRACER INDICES</button>
    </div>
    <div id="studioFeed" class="notice">Les systèmes interactifs de mission sont prêts.</div>
  </section>`;
}
function triggerStudioEvent(type){
  const feed=document.getElementById('studioFeed');
  const map={
    scan:'Analyse en cours… anomalies détectées dans le dossier sélectionné.',
    decrypt:'Décryptage progressif… une donnée cachée vient d’être révélée.',
    combine:'Association logique validée… un nouvel élément de puzzle est disponible.',
    trace:'Traçage des indices terminé… plusieurs connexions ont été établies.'
  };
  if(feed) feed.innerHTML='<strong>Système :</strong> '+map[type];
}


function renderAdmin() {
  setTheme();
  const theme = THEMES[state.theme || ''];
  APP.innerHTML = `
    <div class="hero">
      <div><img src="./assets/logo.png" class="hero-logo" alt="logo"></div>
      <div>
        <div class="kicker">FAFATRAINING</div>
        <h1>${theme.title}</h1>
        <div class="subtitle">${theme.subtitle}</div>
        <div class="notice"><strong>Ce que tu prépares ici :</strong><br>une expérience d’escape game numérique pensée comme un vrai jeu d’évasion : équipes, rotation des joueurs, ambiance, pression, indices, pièges et montée en intensité jusqu’au final.</div>
        ${state.theme ? `<div class="notice"><strong>Mission choisie :</strong><br>${THEMES[state.theme].mission}</div>` : ''}
      </div>
      <div class="stats">
        <div class="stat a"><strong>${state.teamCount || '—'}</strong><span>équipes</span></div>
        <div class="stat b"><strong>${state.totalPlayers || '—'}</strong><span>joueurs</span></div>
        <div class="stat c"><strong>${state.difficulty || '—'}</strong><span>difficulté</span></div>
        <div class="stat d"><strong>${state.duration ? Number(state.duration)/60+' min' : '—'}</strong><span>durée</span></div>
      </div>
    </div>

    <section class="panel">
      <h2>Administration de mission</h2>
      <div class="grid4">
        <div><label>Thème</label><select id="theme">
          <option value="">Choisir</option>
          <option value="night" ${state.theme==='night'?'selected':''}>Night Protocol</option>
          <option value="jungle" ${state.theme==='jungle'?'selected':''}>Expédition interdite</option>
          <option value="lab" ${state.theme==='lab'?'selected':''}>Zone 13</option>
        </select></div>
        <div><label>Nombre total de joueurs</label><input id="totalPlayers" type="number" min="2" placeholder="Ex : 22" value="${state.totalPlayers || ''}"></div>
        <div><label>Nombre d’équipes</label><select id="teamCount">
          <option value="">Choisir</option>
          ${[2,3,4,5,6].map(n=>`<option value="${n}" ${String(state.teamCount)===String(n)?'selected':''}>${n} équipes</option>`).join('')}
        </select></div>
        <div><label>Type de public</label><select id="publicType">
          <option value="">Choisir</option>
          <option value="enfants" ${state.publicType==='enfants'?'selected':''}>Enfants</option>
          <option value="ados" ${state.publicType==='ados'?'selected':''}>Ados</option>
          <option value="adultes" ${state.publicType==='adultes'?'selected':''}>Adultes</option>
        </select></div>
      </div>
      <div class="grid3" style="margin-top:14px">
        <div><label>Difficulté</label><select id="difficulty">
          <option value="">Choisir</option>
          <option value="facile" ${state.difficulty==='facile'?'selected':''}>Facile</option>
          <option value="moyen" ${state.difficulty==='moyen'?'selected':''}>Moyen</option>
          <option value="difficile" ${state.difficulty==='difficile'?'selected':''}>Difficile</option>
          <option value="extreme" ${state.difficulty==='extreme'?'selected':''}>Extrême</option>
        </select></div>
        <div><label>Durée</label><select id="duration">
          <option value="">Choisir</option>
          <option value="1800" ${String(state.duration)==='1800'?'selected':''}>30 min</option>
          <option value="2700" ${String(state.duration)==='2700'?'selected':''}>45 min</option>
          <option value="3600" ${String(state.duration)==='3600'?'selected':''}>60 min</option>
          <option value="5400" ${String(state.duration)==='5400'?'selected':''}>90 min</option>
          <option value="7200" ${String(state.duration)==='7200'?'selected':''}>120 min</option>
        </select></div>
        <div><label>Nombre d’épreuves auto</label><input disabled value="${ready() ? challengeCount() + ' épreuves + final' : 'à définir'}"></div>
      </div>
      <div class="grid2" style="margin-top:14px">
        <div><label>Son</label><select id="soundMode"><option value="on" ${state.soundMode==='on'?'selected':''}>Activé automatiquement</option><option value="off" ${state.soundMode==='off'?'selected':''}>Coupé</option></select></div>
        <div><label>Mode image d’indice</label><input disabled value="affichée seulement quand elle sert vraiment"></div>
      </div>

      <div class="summary-grid" style="margin-top:14px">
        <div class="card"><h4>Répartition auto</h4><div>${autoDistribution()}</div></div>
        <div class="card"><h4>Niveau attendu</h4><div>${state.difficulty || 'à définir'}</div></div>
        <div class="card"><h4>Variété disponible</h4><div>${ready() ? `${poolForCurrent().length} modèles pour ce réglage` : 'à définir'}</div></div>
        <div class="card"><h4>Musique</h4><div>${state.soundMode==='off' ? 'coupée' : 'activée au lancement'}</div></div>
      </div>

      <div class="btns">
        <button class="btn-main" onclick="generateTeamsFromForm()">GÉNÉRER LES ÉQUIPES</button>
        <button class="btn-alt" onclick="resetAll()">RÉINITIALISER</button>
      </div>
      <div id="teamsEditor"></div>
    </section>`;
}

function readAdminForm() {
  state.theme = document.getElementById('theme').value;
  state.totalPlayers = document.getElementById('totalPlayers').value;
  state.teamCount = document.getElementById('teamCount').value;
  state.publicType = document.getElementById('publicType').value;
  state.difficulty = document.getElementById('difficulty').value;
  state.duration = document.getElementById('duration').value;
  state.soundMode = document.getElementById('soundMode').value;
  save();
}
function generateTeamsFromForm() {
  readAdminForm();
  if (!ready()) {
    alert('Remplis d’abord le thème, le nombre de joueurs, le nombre d’équipes, le public, la difficulté et la durée.');
    return;
  }
  const total = Number(state.totalPlayers), teams = Number(state.teamCount), suggested = Math.ceil(total/teams);
  state.teams = Array.from({length:teams}, (_,i)=>({name:`Équipe ${i+1}`, players:Array.from({length:suggested}, ()=>''), score:0, progress:0}));
  save();
  renderAdmin();
  document.getElementById('teamsEditor').innerHTML = `
    <div class="notice"><strong>Répartition cible :</strong> ${autoDistribution()}</div>
    <div class="team-grid">
      ${state.teams.map((team,i)=>`
        <div class="team-card">
          <h4>Équipe ${i+1}</h4>
          <label>Nom d’équipe</label>
          <input id="teamName_${i}" value="${team.name}">
          <label style="margin-top:8px">Joueurs (un par ligne)</label>
          <textarea id="teamPlayers_${i}" placeholder="Nom 1&#10;Nom 2&#10;Nom 3">${team.players.join('\n')}</textarea>
          <div class="notice"><strong>Lien équipe</strong><code>${location.origin}${location.pathname}#team-${i}</code></div>
        </div>`).join('')}
    </div>
    <div class="btns"><button class="btn-main" onclick="launchMission()">LANCER LA MISSION</button></div>`;
  document.getElementById('teamsEditor').innerHTML += `
    <section class="panel" style="margin-top:14px">
      <h3>Suivi administrateur</h3>
      <div class="team-grid">
        ${state.teams.map((team,idx)=>`
          <div class="team-card">
            <strong>${team.name}</strong><br>
            Score : ${team.score} pts<br>
            Progression : ${team.progress}/${state.selectedChallenges.length || challengeCount()}<br>
            Joueurs : ${team.players.filter(Boolean).length}
          </div>`).join('')}
      </div>
      <div class="notice"><strong>Rappel :</strong> le suivi administrateur reste ici, côté administration. Il n’apparaît plus dans le mode joueur.</div>
    </section>`;
}
function launchMission() {
  if (!state.teams.length) { alert('Génère d’abord les équipes.'); return; }
  autoEnableSound();
  state.teams = state.teams.map((team,i)=>({
    name: document.getElementById(`teamName_${i}`)?.value?.trim() || `Équipe ${i+1}`,
    players: (document.getElementById(`teamPlayers_${i}`)?.value || '').split('\n').map(x=>x.trim()).filter(Boolean),
    score:0, progress:0
  }));
  state.hints=0; state.time=Number(state.duration); state.index=0; state.activeTeam=0; state.fragments=[]; state.metaPick=null; state.selectedChallenges=chooseChallenges(); state.timerActive=false; state.picked=null; state.attempts=0; state.showVisual=true;
  save();
  location.hash='#admin-intro';
  renderRoute();
}

function showIntro(isPlayer=false) {
  const theme = THEMES[state.theme];
  playFile('glitch');
  APP.innerHTML = `<section class="cinematic"><div class="cinematic-box"><div class="kicker">OUVERTURE CINÉMATIQUE</div><h1>ACCÈS MISSION</h1><div class="notice"><strong>Brief de mission :</strong><br>${theme.mission}<br><br><em>Les systèmes tactiques, inventaires et outils d’analyse ont été synchronisés. Votre cellule entre en zone rouge.</em></div><div class="notice"><strong>Important :</strong><br>le chrono part dès que tu entres dans la première épreuve. Lis vite, répartis les rôles, et garde tes aides pour les vrais blocages.</div><div id="cineBox"></div><div class="btns"><button class="btn-alt" onclick="location.hash='#admin';renderRoute();">RETOUR ACCUEIL</button><button class="btn-main hidden" id="introBtn" onclick="${isPlayer ? 'goPlayer()' : 'goAdmin()'}">ENTRER DANS LA PREMIÈRE ÉPREUVE</button></div></div></section>`;
  let i=0; const box=document.getElementById('cineBox');
  function step() {
    if (i < theme.intro.length) {
      box.innerHTML += `<div class="cine-line fadein">${theme.intro[i]}</div>`;
      playFile('glitch');
      i++;
      setTimeout(step, 900);
    } else {
      document.getElementById('introBtn').classList.remove('hidden');
    }
  }
  step();
}

function startTicking() {
  if (state.timerActive) return;
  state.timerActive = true;
  save();
  startThemeMusic();
  syncTimerBadge();
  const tick = () => {
    const raw = localStorage.getItem('fafa_v12');
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.assign(state, parsed);
      soundEnabled = !!parsed.soundEnabled;
    }
    if (!state.timerActive) return;
    state.time = Math.max(0, Number(state.time) - 1);
    if (state.time === 45 || state.time === 30 || state.time === 15) playFile('tension');
    save();
    syncTimerBadge();
    if (state.time <= 0) {
      state.timerActive = false;
      save();
      finishMission(true);
      return;
    }
    setTimeout(tick, 1000);
  };
  setTimeout(tick, 1000);
}
function goAdmin() { startTicking(); renderAdminPlay(); }
function goPlayer() { startTicking(); renderPlayer(); }

function randomEvent() {
  if (Math.random() < 0.24) {
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
function renderAdminMonitor() {
  return '';
}
function adminBoost() {}
function adminHint() {}
function visualBlock(c) {
  if(!c.visual || !c.visualNeeded || !state.showVisual) return '';
  return `<div class="visual small"><img src="./assets/${c.visual}" alt="${c.visual}"><div class="challenge-sub">Indice visuel utile pour résoudre cette épreuve</div></div>`;
}
function renderChallenge(showAdmin) {
  const c = state.selectedChallenges[state.index];
  const event = showAdmin ? randomEvent() : '';
  const main = `
    <section class="game-shell fadein">
      <div class="hud">
        <div class="hud-left">
          <div class="badge points">${currentTeam().name} · ${currentTeam().score} pts</div>
          <div class="badge meta">Épreuve ${state.index+1}/${state.selectedChallenges.length}</div>
          <div class="badge meta">${c.label}</div>
        </div>
        <div class="hud-right"><div id="live-timer" class="badge timer timer-live ${timerColor()}">⏱ ${fmt(state.time)}</div></div>
      </div>
      ${event?`<div class="eventbox">${event}</div>`:''}
      <div class="turn">🔥 C’EST À : ${currentPlayer()} DE JOUER</div>
      <div class="rules"><strong>Règle :</strong> lis la scène, réponds, puis utilise une aide seulement si nécessaire.</div>
      <div class="story">${c.scene}</div>
      <div class="help-floating"><button class="help-pill help-aide" onclick="useHint(1)">AIDE</button><button class="help-pill help-bonus" onclick="useHint(2)">BONUS</button><button class="help-pill help-info" onclick="showFree()">INDICE</button></div>
      <h2 class="challenge-title">${c.title}</h2>
      <div class="challenge-sub">Type d’épreuve : ${c.label}</div>
      ${c.visual && c.visualNeeded ? `<div class="visual-toggle"><button class="btn-alt" onclick="toggleVisual()">${state.showVisual ? 'MASQUER L’INDICE VISUEL' : 'AFFICHER L’INDICE VISUEL'}</button></div>` : ''}
      ${visualBlock(c)}
      <div class="story"><strong>Énigme :</strong><br>${c.prompt.replace(/\n/g,'<br>')}</div>
      <div id="freeSlot"></div>
      ${c.answerType==='choice'
        ? `<div class="choice-grid">${c.choices.map((choice,i)=>`<button class="choice" onclick="pick(${i}, this)">${choice}</button>`).join('')}</div>`
        : `<div class="panel" style="padding:14px;margin-top:14px"><label>Réponse libre</label><input id="freeAnswer" placeholder="Entre ta réponse"></div>`}
      <div id="feedback"></div>
    </section>`;
  APP.innerHTML = `<div class="game-layout">${main}</div><div class="validate-bar"><button class="validate-btn" onclick="validate(${showAdmin})">VALIDER LA RÉPONSE</button></div>`;
  syncTimerBadge();
}
function renderAdminPlay() { if (state.index >= state.selectedChallenges.length) { renderFinal(true); return; } renderChallenge(true); }
function renderPlayer() { if (state.index >= state.selectedChallenges.length) { renderFinal(false); return; } renderChallenge(false); }
function toggleVisual() { state.showVisual = !state.showVisual; save(); location.hash === '#admin-play' ? renderAdminPlay() : renderPlayer(); }
function pick(i,el) { document.querySelectorAll('.choice').forEach(x=>x.classList.remove('selected')); el.classList.add('selected'); state.picked=i; }
function showFree() { const c=state.selectedChallenges[state.index]; document.getElementById('freeSlot').innerHTML = `<div class="freeclue"><strong>Indice discret :</strong><br>${c.free}</div>`; }
function useHint(level) {
  const c=state.selectedChallenges[state.index];
  state.hints++;
  currentTeam().score = Math.max(0, currentTeam().score - (level===1 ? 40 : 90));
  document.getElementById('feedback').innerHTML = `<div class="feedback help"><strong>${level===1 ? 'Carte aide' : 'Carte bonus'}</strong><br>${level===1 ? c.h1 : c.h2}</div>`;
  save();
}
function isValid(c, val) {
  if (c.validatorType === 'equals') return norm(val) === c.validatorValue;
  if (c.validatorType === 'in') return c.validatorValue.includes(norm(val));
  if (c.validatorType === 'containsAny') return c.validatorValue.some(x=>norm(val).includes(x));
  return false;
}
function applyBranchSuccess(c, answer) {
  if (c.branchMap && c.branchMap[answer]) {
    const fx = c.branchMap[answer];
    if (fx.score) currentTeam().score += fx.score;
    if (fx.time) state.time = Math.max(0, state.time + fx.time);
  }
  if (c.branchSuccess) {
    if (c.branchSuccess.score) currentTeam().score += c.branchSuccess.score;
    if (c.branchSuccess.time) state.time = Math.max(0, state.time + c.branchSuccess.time);
  }
}
function applyBranchFail(c) {
  if (c.branchFail) {
    if (c.branchFail.score) currentTeam().score += c.branchFail.score;
    if (c.branchFail.time) state.time = Math.max(0, state.time + c.branchFail.time);
  }
}
function validate(showAdmin) {
  const c = state.selectedChallenges[state.index];
  let ok = false;
  let answer = '';
  if (c.answerType === 'choice') {
    if (state.picked === null) {
      document.getElementById('feedback').innerHTML = `<div class="feedback bad">Choisis d’abord une réponse.</div>`;
      return;
    }
    ok = state.picked === c.answerIndex;
    answer = norm(c.choices[state.picked].split('·').pop());
  } else {
    const val = document.getElementById('freeAnswer').value;
    ok = isValid(c, val);
    answer = norm(val);
  }
  const shell = document.querySelector('.game-shell');
  if (ok) {
    currentTeam().score += 120;
    currentTeam().progress = Math.max(currentTeam().progress, state.index+1);
    state.fragments.push(c.fragment);
    applyBranchSuccess(c, answer);
    playFile('ok');
    shell.classList.remove('flash-bad'); shell.classList.add('flash-good');
    document.getElementById('feedback').innerHTML = `<div class="feedback ok"><strong>✅ Bonne réponse.</strong><br><strong>Explication :</strong> ${c.exp}${c.branchMap||c.branchSuccess?'<br><br><strong>Effet d’embranchement appliqué.</strong>':''}<br><br><strong>Fragment obtenu :</strong> ${c.fragment}</div><div class="btns"><button class="btn-main" onclick="nextChallenge(${showAdmin})">ÉPREUVE SUIVANTE</button></div>`;
  } else {
    state.attempts++;
    playFile('bad');
    shell.classList.remove('flash-good'); shell.classList.add('flash-bad');
    if (state.attempts < 2) {
      currentTeam().score = Math.max(0, currentTeam().score - 40);
      document.getElementById('feedback').innerHTML = `<div class="feedback bad"><strong>❌ Mauvaise piste.</strong><br>Tu peux corriger et répondre une seconde fois avant la sanction finale.<br><br><span class="small">Pénalité : -40 points.</span></div>`;
    } else {
      currentTeam().score = Math.max(0, currentTeam().score - 80);
      applyBranchFail(c);
      document.getElementById('feedback').innerHTML = `<div class="feedback bad"><strong>💥 Défi perdu.</strong><br>${c.exp}${c.branchFail?'<br><br><strong>Effet d’embranchement défavorable appliqué.</strong>':''}</div><div class="btns"><button class="btn-main" onclick="nextChallenge(${showAdmin})">ÉPREUVE SUIVANTE</button></div>`;
    }
  }
  save();
}
function nextChallenge(showAdmin) {
  currentTeam().progress = Math.max(currentTeam().progress, state.index+1);
  state.index++;
  state.activeTeam = (state.activeTeam + 1) % state.teams.length;
  state.attempts = 0;
  state.picked = null;
  save();
  showAdmin ? renderAdminPlay() : renderPlayer();
}
function renderFinal(showAdmin) {
  const f = FINALS[state.theme];
  const main = `
    <section class="game-shell fadein">
      <div class="hud"><div class="hud-left"><div class="badge points">Final de mission</div><div class="badge meta">Fragments : ${state.fragments.length}</div></div><div class="hud-right"><div id="live-timer" class="badge timer timer-live ${timerColor()}">⏱ ${fmt(state.time)}</div></div></div>
      <div class="turn">💣 RÉVÉLATION FINALE • DOSSIER CLASSIFIÉ</div>
      <div class="story">Fragments récupérés : <strong>${state.fragments.join(' · ')||'aucun'}</strong></div>
      <div class="story"><strong>${f.prompt}</strong></div>
      <div class="choice-grid">${f.choices.map((choice,i)=>`<button class="choice" onclick="pickMeta(${i}, this)">${choice}</button>`).join('')}</div>
      <div id="feedback"></div>
    </section>`;
  APP.innerHTML = `<div class="game-layout">${main}</div><div class="validate-bar"><button class="validate-btn" onclick="validateMeta()">VALIDER LE VERDICT FINAL</button></div>`;
  syncTimerBadge();
}
function pickMeta(i,el) { document.querySelectorAll('.choice').forEach(x=>x.classList.remove('selected')); el.classList.add('selected'); state.metaPick=i; }
function validateMeta() {
  const f = FINALS[state.theme];
  if (state.metaPick === null) {
    document.getElementById('feedback').innerHTML = `<div class="feedback bad">Choisis d’abord une piste.</div>`;
    return;
  }
  if (state.metaPick === f.answer) {
    currentTeam().score += 180;
    playFile('ok');
    document.getElementById('feedback').innerHTML = `<div class="feedback ok"><strong>✅ Verdict validé.</strong><br>La piste finale retenue est la plus solide.</div><div class="btns"><button class="btn-main" onclick="finishMission(false)">CLÔTURER LA MISSION</button></div>`;
  } else {
    currentTeam().score = Math.max(0, currentTeam().score - 120);
    playFile('bad');
    document.getElementById('feedback').innerHTML = `<div class="feedback bad"><strong>❌ Verdict erroné.</strong><br>La mission peut quand même être clôturée avec le score actuel.</div><div class="btns"><button class="btn-main" onclick="finishMission(false)">CLÔTURER LA MISSION</button></div>`;
  }
  save();
}
function finishMission(timeout) {
  stopThemeMusic();
  state.timerActive = false;
  save();
  const ranking = [...state.teams].sort((a,b)=>b.score-a.score);
  APP.innerHTML = `
    <section class="panel"><div class="wow-banner"><div class="wow-title">MISSION FERMÉE</div><div class="small">${state.theme==='night'?'Night Protocol':state.theme==='jungle'?'Expédition interdite':'Zone 13'}</div></div></section>
    <section class="final-card">
      <div class="big-score">${ranking[0]?.score || 0} pts</div>
      <p><strong>${ranking[0]?.name || 'Aucune équipe'}</strong> remporte la mission.</p>
      <p>${timeout ? 'Le chrono a forcé la fermeture de la partie.' : 'La mission se termine avec une vraie sensation de fin, un classement clair et une ambiance plus nette.'}</p>
      <div class="preview-grid" style="margin-top:14px">${ranking.map((team,idx)=>`<div class="card"><h4>${idx+1}. ${team.name}</h4>Score : ${team.score} pts<br>Progression : ${team.progress}/${state.selectedChallenges.length}<br>Joueurs : ${team.players.filter(Boolean).length}</div>`).join('')}</div>
      <div class="btns"><button class="btn-main" onclick="resetAll()">RETOUR ACCUEIL</button></div>
    </section>`;
}
function resetAll() {
  clearStore();
  soundEnabled = false;
  state = {theme:'', totalPlayers:'', teamCount:'', publicType:'', difficulty:'', duration:'', teams:[], activeTeam:0, hints:0, time:0, index:0, picked:null, attempts:0, selectedChallenges:[], fragments:[], timerActive:false, metaPick:null, showVisual:true};
  location.hash = '#admin';
  renderRoute();
}
function renderRoute() {
  load();
  setTheme();
  const r = location.hash || '#admin';
  if (r.startsWith('#team-')) {
    if (!state.selectedChallenges.length) { stopThemeMusic(); renderAdmin(); return; }
    stopThemeMusic();
    showIntro(true);
    return;
  }
  if (r === '#admin-intro') {
    stopThemeMusic();
    showIntro(false);
    return;
  }
  if (r === '#admin-play') {
    if (!state.selectedChallenges.length) { stopThemeMusic(); renderAdmin(); return; }
    renderAdminPlay();
    return;
  }
  stopThemeMusic();
  renderAdmin();
}

function resizeRain() {
  RAIN.width = innerWidth; RAIN.height = innerHeight;
}
let drops = [];
function initRain() {
  resizeRain();
  drops = Array.from({length:180}, ()=>({x:Math.random()*RAIN.width, y:Math.random()*RAIN.height, l:10+Math.random()*18, v:6+Math.random()*8}));
}
function drawRain() {
  CTX.clearRect(0,0,RAIN.width,RAIN.height);
  CTX.strokeStyle='rgba(114,204,255,.35)';
  CTX.lineWidth=1;
  CTX.beginPath();
  for (const d of drops) {
    CTX.moveTo(d.x,d.y);
    CTX.lineTo(d.x-4,d.y+d.l);
    d.y += d.v; d.x -= .6;
    if (d.y>RAIN.height || d.x<-20) { d.x=Math.random()*RAIN.width+40; d.y=-20; }
  }
  CTX.stroke();
  requestAnimationFrame(drawRain);
}

window.addEventListener('hashchange', renderRoute);
window.addEventListener('resize', resizeRain);
initRain();
drawRain();
renderRoute();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', ()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
