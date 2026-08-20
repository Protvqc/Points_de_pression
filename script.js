// ============================================================
// BASE DE DONNEES DES 13 POINTS DE PRESSION
// ============================================================
const POINTS = [
  {id:1, lieu:"Sous le nez", nom:"Infra-orbital", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, donne tes mains!", type:"submission", typeLabel:"Soumission / donner les mains", cx:50, cy:13.5},
  {id:2, lieu:"Derrière lobe d'oreille", nom:"Angle mandibulaire", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, donne tes mains!", type:"submission", typeLabel:"Soumission / donner les mains", cx:58, cy:14},
  {id:3, lieu:"En dessous de la mâchoire", nom:"Hypoglosse", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, donne tes mains!", type:"submission", typeLabel:"Soumission / donner les mains", cx:50, cy:17.5},
  {id:4, lieu:"Centre du cou (corde de guitare)", nom:"Plexus brachial origine", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, donne tes mains!", type:"submission", typeLabel:"Soumission / donner les mains", cx:50, cy:20.5},
  {id:5, lieu:"Creux des clavicules", nom:"Plexus brachial claviculaire", methode:"Pression dynamique", mecanisme:"Contrainte par la douleur", verbalisation:"Police, assieds-toi!", type:"asseoir", typeLabel:"Faire asseoir", cx:42, cy:23.5},
  {id:6, lieu:"Clavicules / au-dessus du sternum", nom:"Nœud jugulaire", methode:"Pression dynamique", mecanisme:"Contrainte par la douleur", verbalisation:"Police, recule!", type:"distance", typeLabel:"Créer une distance / reculer", cx:50, cy:23},
  {id:7, lieu:"Épaule / pectoral", nom:"Plexus brachial jonction", methode:"Frappe", mecanisme:"Dysfonction biomécanique", verbalisation:"Police, lâche ça!", type:"lacher", typeLabel:"Faire lâcher un objet", cx:33, cy:26},
  {id:8, lieu:"Centre de l'avant-bras (intérieur)", nom:"Nerf médian", methode:"Frappe", mecanisme:"Dysfonction biomécanique", verbalisation:"Police, lâche ça!", type:"lacher", typeLabel:"Faire lâcher un objet", cx:22, cy:48},
  {id:9, lieu:"Dessus de l'avant-bras (côté pouce)", nom:"Nerf radial", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, assieds-toi!", type:"asseoir", typeLabel:"Faire asseoir", cx:18, cy:44},
  {id:10, lieu:"Dessous de l'avant-bras (côté petit doigt)", nom:"Nerf cubital", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, lève-toi!", type:"lever", typeLabel:"Faire lever", cx:26, cy:44},
  {id:11, lieu:"Cuisse / bandelette / dessus du genou (externe)", nom:"Nerf sciatique externe poplité", methode:"Frappe", mecanisme:"Dysfonction biomécanique", verbalisation:"Diversion / distance / ralentir", type:"diversion", typeLabel:"Diversion / ralentir (jambes)", cx:40, cy:68},
  {id:12, lieu:"Cuisse / intérieur / dessus du genou", nom:"Nerf fémoral", methode:"Frappe", mecanisme:"Dysfonction biomécanique", verbalisation:"Diversion / distance / ralentir", type:"diversion", typeLabel:"Diversion / ralentir (jambes)", cx:47, cy:68},
  {id:13, lieu:"Mollet / centre des gastrocnémiens (arrière)", nom:"Nerf tibial", methode:"Pression dynamique / Frappe", mecanisme:"Contrainte par la douleur / Dysfonction biomécanique", verbalisation:"Police, donne tes mains!", type:"submission", typeLabel:"Soumission / donner les mains", cx:50, cy:82}
];

const CATEGORIES = {
  submission: "Soumission / donner les mains",
  asseoir: "Faire asseoir",
  lever: "Faire lever",
  distance: "Créer une distance / reculer",
  lacher: "Faire lâcher un objet",
  diversion: "Diversion / ralentir (jambes)"
};

const HIT_RADIUS = 6; // rayon de tolerance en % pour un clic considere correct

// ============================================================
// ETAT DU JEU
// ============================================================
let state = {
  mode: null, // classic | chrono | review | category
  categoryFilter: null,
  queue: [],
  currentIndex: 0,
  current: null,
  score: 0,
  streak: 0,
  bestStreak: 0,
  missed: [],
  startTime: null,
  timerInterval: null,
  waitingAnswer: true
};

// ============================================================
// STOCKAGE LOCAL
// ============================================================
function loadStats() {
  const raw = localStorage.getItem('ppq_stats');
  return raw ? JSON.parse(raw) : { bestChronoMs: null, gamesPlayed: 0, bestScorePct: 0 };
}
function saveStats(stats) {
  localStorage.setItem('ppq_stats', JSON.stringify(stats));
}

// ============================================================
// NAVIGATION ECRANS
// ============================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goHome() {
  stopChrono();
  showScreen('screen-home');
  renderHomeStats();
}

function renderHomeStats() {
  const stats = loadStats();
  const el = document.getElementById('home-stats');
  if (stats.gamesPlayed === 0) {
    el.textContent = "Aucune partie jouée encore. Lance-toi!";
  } else {
    let txt = `Parties jouées: ${stats.gamesPlayed} · Meilleur score: ${stats.bestScorePct}%`;
    if (stats.bestChronoMs) {
      txt += ` · Meilleur chrono: ${formatTime(stats.bestChronoMs)}`;
    }
    el.textContent = txt;
  }
}

// ============================================================
// DEMARRAGE DES MODES
// ============================================================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startGame(mode, categoryFilter = null) {
  state.mode = mode;
  state.categoryFilter = categoryFilter;
  let pool = POINTS;
  if (categoryFilter) pool = POINTS.filter(p => p.type === categoryFilter);

  state.queue = shuffle(pool);
  state.currentIndex = 0;
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.missed = [];
  state.waitingAnswer = true;

  showScreen('screen-game');
  document.getElementById('chrono-display').classList.toggle('hidden', mode !== 'chrono');

  if (mode === 'chrono') startChrono();
  if (mode === 'review') {
    renderZones(true);
    document.getElementById('prompt-name').textContent = "Clique un point du corps";
    document.getElementById('prompt-type').textContent = "Mode révision libre — pas de score";
    document.getElementById('counter-value').textContent = "";
    document.getElementById('progress-bar').style.width = '0%';
  } else {
    renderZones(false);
    nextQuestion();
  }
}

function nextQuestion() {
  if (state.currentIndex >= state.queue.length) {
    finishGame();
    return;
  }
  state.current = state.queue[state.currentIndex];
  state.waitingAnswer = true;
  document.getElementById('prompt-name').textContent = state.current.nom;
  document.getElementById('prompt-type').textContent = `Objectif: ${state.current.typeLabel}`;
  document.getElementById('score-value').textContent = state.score;
  document.getElementById('streak-value').textContent = state.streak;
  document.getElementById('counter-value').textContent = `${state.currentIndex + 1} / ${state.queue.length}`;
  document.getElementById('progress-bar').style.width = `${(state.currentIndex / state.queue.length) * 100}%`;
  document.getElementById('reveal-marker').classList.add('hidden');
}

function finishGame() {
  stopChrono();
  const stats = loadStats();
  stats.gamesPlayed++;
  const pct = Math.round(((state.queue.length - state.missed.length) / state.queue.length) * 100);
  if (pct > stats.bestScorePct) stats.bestScorePct = pct;
  if (state.mode === 'chrono') {
    const elapsed = Date.now() - state.startTime;
    if (!stats.bestChronoMs || elapsed < stats.bestChronoMs) stats.bestChronoMs = elapsed;
    document.getElementById('result-time').textContent = `Temps: ${formatTime(elapsed)}`;
  } else {
    document.getElementById('result-time').textContent = '';
  }
  saveStats(stats);

  document.getElementById('result-percent').textContent = `${pct}%`;
  document.getElementById('result-detail').textContent =
    `${state.queue.length - state.missed.length} / ${state.queue.length} bonnes réponses · Série max: ${state.bestStreak}`;

  const weakBox = document.getElementById('result-weak-categories');
  weakBox.innerHTML = '';
  if (state.missed.length > 0) {
    const byCat = {};
    state.missed.forEach(p => { byCat[p.type] = (byCat[p.type] || 0) + 1; });
    Object.entries(byCat).forEach(([type, count]) => {
      const div = document.createElement('div');
      div.className = 'weak-cat-item';
      div.innerHTML = `<span>${CATEGORIES[type]}</span><span>${count} raté(s)</span>`;
      weakBox.appendChild(div);
    });
  } else {
    weakBox.innerHTML = '<div class="weak-cat-item"><span>Parfait, aucune faiblesse détectée! 🎉</span></div>';
  }

  showScreen('screen-results');
}

// ============================================================
// CHRONO
// ============================================================
function startChrono() {
  state.startTime = Date.now();
  state.timerInterval = setInterval(() => {
    const elapsed = Date.now() - state.startTime;
    document.getElementById('chrono-display').textContent = formatTime(elapsed);
  }, 100);
  nextQuestion();
}
function stopChrono() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = null;
}
function formatTime(ms) {
  const totalSec = ms / 1000;
  const min = Math.floor(totalSec / 60);
  const sec = (totalSec % 60).toFixed(1);
  return `${String(min).padStart(2,'0')}:${String(sec).padStart(4,'0')}`;
}

// ============================================================
// RENDU DES ZONES CLIQUABLES SUR LE SVG
// ============================================================
function renderZones(reviewMode) {
  const g = document.getElementById('clickable-zones');
  g.innerHTML = '';
  POINTS.forEach(p => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', p.cx);
    circle.setAttribute('cy', p.cy);
    circle.setAttribute('r', HIT_RADIUS);
    circle.setAttribute('class', 'zone-hit');
    circle.dataset.id = p.id;
    circle.addEventListener('click', () => handleZoneClick(p, reviewMode));
    g.appendChild(circle);
  });
}

// Detecte si le point clique est proche d'un point valide (tolerance) - utilise pour clic libre sur le SVG entier
function handleZoneClick(point, reviewMode) {
  if (reviewMode) {
    openExplainCard(point, true, null);
    return;
  }
  if (!state.waitingAnswer) return;
  state.waitingAnswer = false;

  const isCorrect = point.id === state.current.id;
  processAnswer(isCorrect, point);
}

// Clic direct sur le SVG (n'importe ou) - on cherche la zone la plus proche du point clique
function setupSvgGlobalClick() {
  const svg = document.getElementById('body-svg');
  svg.addEventListener('click', (e) => {
    if (state.mode === 'review') return; // gere par handleZoneClick sur les cercles
    if (!state.waitingAnswer) return;

    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    let closest = null, minDist = Infinity;
    POINTS.forEach(p => {
      const d = Math.hypot(p.cx - x, p.cy - y);
      if (d < minDist) { minDist = d; closest = p; }
    });

    state.waitingAnswer = false;
    const isCorrect = closest && closest.id === state.current.id && minDist <= HIT_RADIUS + 2;
    processAnswer(isCorrect, state.current);
  });
}

function processAnswer(isCorrect, pointClicked) {
  const flash = document.getElementById('feedback-flash');
  const marker = document.getElementById('reveal-marker');

  if (isCorrect) {
    state.score++;
    state.streak++;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;
    flash.className = 'feedback-flash flash-good';
    playTone(880, 0.1);
  } else {
    state.missed.push(state.current);
    state.streak = 0;
    flash.className = 'feedback-flash flash-bad';
    playTone(220, 0.15);

    // Afficher le marqueur sur le vrai emplacement
    positionRevealMarker(state.current);
    marker.classList.remove('hidden');
  }

  setTimeout(() => { flash.className = 'feedback-flash'; }, 250);
  openExplainCard(state.current, isCorrect, null);
}

function positionRevealMarker(point) {
  const svg = document.getElementById('body-svg');
  const rect = svg.getBoundingClientRect();
  const marker = document.getElementById('reveal-marker');
  const x = rect.left + (point.cx / 100) * rect.width;
  const y = rect.top + (point.cy / 100) * rect.height;
  marker.style.left = `${x}px`;
  marker.style.top = `${y}px`;
}

// ============================================================
// CARTE EXPLICATION
// ============================================================
function openExplainCard(point, isCorrect, _unused) {
  const card = document.getElementById('explain-card');
  const resultEl = document.getElementById('explain-result');

  if (state.mode === 'review') {
    resultEl.textContent = '📖 Fiche';
    resultEl.className = 'explain-result';
  } else {
    resultEl.textContent = isCorrect ? '✔ Correct!' : '✘ Raté';
    resultEl.className = 'explain-result ' + (isCorrect ? 'good' : 'bad');
  }

  document.getElementById('explain-nom').textContent = point.nom;
  document.getElementById('explain-lieu').textContent = point.lieu;
  document.getElementById('explain-methode').textContent = point.methode;
  document.getElementById('explain-mecanisme').textContent = point.mecanisme;
  document.getElementById('explain-type').textContent = point.typeLabel;
  document.getElementById('explain-verbal').textContent = `"${point.verbalisation}"`;

  card.classList.remove('hidden');
}

function closeExplainCardAndAdvance() {
  document.getElementById('explain-card').classList.add('hidden');
  if (state.mode === 'review') return;
  state.currentIndex++;
  nextQuestion();
}

// ============================================================
// SON (Web Audio API, pas de fichier externe requis)
// ============================================================
let audioCtx = null;
function playTone(freq, duration) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) { /* audio non supporte, on ignore silencieusement */ }
}

// ============================================================
// ECRAN CATEGORIES
// ============================================================
function renderCategoryList() {
  const list = document.getElementById('category-list');
  list.innerHTML = '';
  Object.entries(CATEGORIES).forEach(([type, label]) => {
    const count = POINTS.filter(p => p.type === type).length;
    const div = document.createElement('div');
    div.className = 'category-item';
    div.innerHTML = `<span>${label}</span><span class="cat-count">${count} pts</span>`;
    div.addEventListener('click', () => startGame('category', type));
    list.appendChild(div);
  });
}

// ============================================================
// EVENEMENTS GLOBAUX
// ============================================================
document.addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  if (!action) return;

  switch (action) {
    case 'start-classic': startGame('classic'); break;
    case 'start-chrono': startGame('chrono'); break;
    case 'start-review': startGame('review'); break;
    case 'show-category-select': renderCategoryList(); showScreen('screen-category'); break;
    case 'go-home': goHome(); break;
    case 'replay': startGame(state.mode, state.categoryFilter); break;
  }
});

document.getElementById('btn-next').addEventListener('click', closeExplainCardAndAdvance);

// ============================================================
// SERVICE WORKER (PWA offline)
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

// ============================================================
// INIT
// ============================================================
setupSvgGlobalClick();
renderHomeStats();
