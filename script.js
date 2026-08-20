const POINTS = [
  {id:1, lieu:"Sous le nez", nom:"Infra-orbital", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, donne tes mains!", type:"submission", typeLabel:"Soumission / donner les mains", cx:50, cy:11},
  {id:2, lieu:"Derrière lobe d'oreille", nom:"Angle mandibulaire", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, donne tes mains!", type:"submission", typeLabel:"Soumission / donner les mains", cx:57, cy:10.5},
  {id:3, lieu:"En dessous de la mâchoire", nom:"Hypoglosse", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, donne tes mains!", type:"submission", typeLabel:"Soumission / donner les mains", cx:50, cy:14.5},
  {id:4, lieu:"Centre du cou (corde de guitare)", nom:"Plexus brachial origine", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, donne tes mains!", type:"submission", typeLabel:"Soumission / donner les mains", cx:50, cy:18.5},
  {id:5, lieu:"Creux des clavicules", nom:"Plexus brachial claviculaire", methode:"Pression dynamique", mecanisme:"Contrainte par la douleur", verbalisation:"Police, assieds-toi!", type:"asseoir", typeLabel:"Faire asseoir", cx:41, cy:25},
  {id:6, lieu:"Clavicules / au-dessus du sternum", nom:"Nœud jugulaire", methode:"Pression dynamique", mecanisme:"Contrainte par la douleur", verbalisation:"Police, recule!", type:"distance", typeLabel:"Créer une distance / reculer", cx:50, cy:26},
  {id:7, lieu:"Épaule / pectoral", nom:"Plexus brachial jonction", methode:"Frappe", mecanisme:"Dysfonction biomécanique", verbalisation:"Police, lâche ça!", type:"lacher", typeLabel:"Faire lâcher un objet", cx:32, cy:29},
  {id:8, lieu:"Centre de l'avant-bras (intérieur)", nom:"Nerf médian", methode:"Frappe", mecanisme:"Dysfonction biomécanique", verbalisation:"Police, lâche ça!", type:"lacher", typeLabel:"Faire lâcher un objet", cx:20, cy:56},
  {id:9, lieu:"Dessus de l'avant-bras (côté pouce)", nom:"Nerf radial", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, assieds-toi!", type:"asseoir", typeLabel:"Faire asseoir", cx:15, cy:51},
  {id:10, lieu:"Dessous de l'avant-bras (côté petit doigt)", nom:"Nerf cubital", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, lève-toi!", type:"lever", typeLabel:"Faire lever", cx:23, cy:52},
  {id:11, lieu:"Cuisse / bandelette / dessus du genou (externe)", nom:"Nerf sciatique externe poplité", methode:"Frappe", mecanisme:"Dysfonction biomécanique", verbalisation:"Diversion / distance / ralentir", type:"diversion", typeLabel:"Diversion / ralentir (jambes)", cx:36, cy:87},
  {id:12, lieu:"Cuisse / intérieur / dessus du genou", nom:"Nerf fémoral", methode:"Frappe", mecanisme:"Dysfonction biomécanique", verbalisation:"Diversion / distance / ralentir", type:"diversion", typeLabel:"Diversion / ralentir (jambes)", cx:63, cy:87},
  {id:13, lieu:"Mollet / centre des gastrocnémiens (arrière)", nom:"Nerf tibial", methode:"Pression dynamique / Frappe", mecanisme:"Contrainte par la douleur / Dysfonction biomécanique", verbalisation:"Police, donne tes mains!", type:"submission", typeLabel:"Soumission / donner les mains", cx:59, cy:100}
];

const CATEGORIES = {
  submission: "Soumission / donner les mains",
  asseoir: "Faire asseoir",
  lever: "Faire lever",
  distance: "Créer une distance / reculer",
  lacher: "Faire lâcher un objet",
  diversion: "Diversion / ralentir (jambes)"
};

const HIT_RADIUS = 5.5;

let state = {
  mode: null, categoryFilter: null, queue: [], currentIndex: 0, current: null,
  score: 0, streak: 0, bestStreak: 0, missed: [], startTime: null, timerInterval: null, waitingAnswer: true
};

function loadStats() {
  const raw = localStorage.getItem('ppq_stats');
  return raw ? JSON.parse(raw) : { bestChronoMs: null, gamesPlayed: 0, bestScorePct: 0 };
}
function saveStats(stats) { localStorage.setItem('ppq_stats', JSON.stringify(stats)); }

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goHome() { stopChrono(); showScreen('screen-home'); renderHomeStats(); }

function renderHomeStats() {
  const stats = loadStats();
  const el = document.getElementById('home-stats');
  if (stats.gamesPlayed === 0) {
    el.textContent = "Aucune partie jouée encore. Lance-toi!";
  } else {
    let txt = `Parties: ${stats.gamesPlayed} · Meilleur score: ${stats.bestScorePct}%`;
    if (stats.bestChronoMs) txt += ` · Meilleur chrono: ${formatTime(stats.bestChronoMs)}`;
    el.textContent = txt;
  }
}

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
  renderZones(mode === 'review');

  if (mode === 'chrono') { startChrono(); return; }
  if (mode === 'review') {
    document.getElementById('prompt-name').textContent = "Clique un point du corps";
    document.getElementById('counter-value').textContent = "";
    document.getElementById('progress-bar').style.width = '0%';
    return;
  }
  nextQuestion();
}

function nextQuestion() {
  if (state.currentIndex >= state.queue.length) { finishGame(); return; }
  state.current = state.queue[state.currentIndex];
  state.waitingAnswer = true;
  document.getElementById('prompt-name').textContent = state.current.nom;
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

function startChrono() {
  state.startTime = Date.now();
  state.timerInterval = setInterval(() => {
    const elapsed = Date.now() - state.startTime;
    document.getElementById('chrono-display').textContent = formatTime(elapsed);
  }, 100);
  nextQuestion();
}
function stopChrono() { if (state.timerInterval) clearInterval(state.timerInterval); state.timerInterval = null; }
function formatTime(ms) {
  const totalSec = ms / 1000;
  const min = Math.floor(totalSec / 60);
  const sec = (totalSec % 60).toFixed(1);
  return `${String(min).padStart(2,'0')}:${String(sec).padStart(4,'0')}`;
}

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
    if (reviewMode) {
      circle.addEventListener('click', (e) => { e.stopPropagation(); openExplainCard(p, true, true); });
    }
    g.appendChild(circle);
  });
}

function setupSvgGlobalClick() {
  const svg = document.getElementById('body-svg');
  svg.addEventListener('click', (e) => {
    if (state.mode === 'review') return;
    if (!state.waitingAnswer) return;

    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;
    const x = viewBox.x + xRatio * viewBox.width;
    const y = viewBox.y + yRatio * viewBox.height;

    let closest = null, minDist = Infinity;
    POINTS.forEach(p => {
      const d = Math.hypot(p.cx - x, p.cy - y);
      if (d < minDist) { minDist = d; closest = p; }
    });

    state.waitingAnswer = false;
    const isCorrect = closest && closest.id === state.current.id && minDist <= HIT_RADIUS;
    processAnswer(isCorrect);
  });
}

function processAnswer(isCorrect) {
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
    positionRevealMarker(state.current);
    marker.classList.remove('hidden');
  }

  setTimeout(() => { flash.className = 'feedback-flash'; }, 250);
  openExplainCard(state.current, isCorrect, false);
}

function positionRevealMarker(point) {
  const svg = document.getElementById('body-svg');
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  const marker = document.getElementById('reveal-marker');
  const x = rect.left + ((point.cx - viewBox.x) / viewBox.width) * rect.width;
  const y = rect.top + ((point.cy - viewBox.y) / viewBox.height) * rect.height;
  marker.style.left = `${x}px`;
  marker.style.top = `${y}px`;
}

function openExplainCard(point, isCorrect, isReview) {
  const card = document.getElementById('explain-card');
  const resultEl = document.getElementById('explain-result');

  if (isReview) {
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

  card.dataset.reviewMode = isReview ? '1' : '0';
  card.classList.remove('hidden');
}

function closeExplainCardAndAdvance() {
  const card = document.getElementById('explain-card');
  const wasReview = card.dataset.reviewMode === '1';
  card.classList.add('hidden');
  if (wasReview || state.mode === 'review') return;
  state.currentIndex++;
  nextQuestion();
}

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
  } catch (e) {}
}

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

document.addEventListener('click', (e) => {
  const action = e.target.closest('[data-action]')?.dataset.action;
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

setupSvgGlobalClick();
renderHomeStats();
