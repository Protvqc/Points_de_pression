const POINTS = [
  {id:1, lieu:"Sous le nez", nom:"Infra-orbital", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, donne tes mains!", type:"submission", typeLabel:"Soumission / donner les mains", cx:50, cy:9},
  {id:2, lieu:"Derrière lobe d'oreille", nom:"Angle mandibulaire", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, donne tes mains!", type:"submission", typeLabel:"Soumission / donner les mains", cx:56.5, cy:11},
  {id:3, lieu:"En dessous de la mâchoire", nom:"Hypoglosse", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, donne tes mains!", type:"submission", typeLabel:"Soumission / donner les mains", cx:50, cy:14.5},
  {id:4, lieu:"Centre du cou (corde de guitare)", nom:"Plexus brachial origine", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, donne tes mains!", type:"submission", typeLabel:"Soumission / donner les mains", cx:50, cy:18.5},
  {id:5, lieu:"Creux des clavicules", nom:"Plexus brachial claviculaire", methode:"Pression dynamique", mecanisme:"Contrainte par la douleur", verbalisation:"Police, assieds-toi!", type:"asseoir", typeLabel:"Faire asseoir", cx:41, cy:24},
  {id:6, lieu:"Clavicules / au-dessus du sternum", nom:"Nœud jugulaire", methode:"Pression dynamique", mecanisme:"Contrainte par la douleur", verbalisation:"Police, recule!", type:"distance", typeLabel:"Créer une distance / reculer", cx:50, cy:25},
  {id:7, lieu:"Épaule / pectoral", nom:"Plexus brachial jonction", methode:"Frappe", mecanisme:"Dysfonction biomécanique", verbalisation:"Police, lâche ça!", type:"lacher", typeLabel:"Faire lâcher un objet", cx:32, cy:29},
  {id:8, lieu:"Centre de l'avant-bras (intérieur)", nom:"Nerf médian", methode:"Frappe", mecanisme:"Dysfonction biomécanique", verbalisation:"Police, lâche ça!", type:"lacher", typeLabel:"Faire lâcher un objet", cx:17.5, cy:64},
  {id:9, lieu:"Dessus de l'avant-bras (côté pouce)", nom:"Nerf radial", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, assieds-toi!", type:"asseoir", typeLabel:"Faire asseoir", cx:19, cy:60},
  {id:10, lieu:"Dessous de l'avant-bras (côté petit doigt)", nom:"Nerf cubital", methode:"Touché pression", mecanisme:"Contrainte par la douleur", verbalisation:"Police, lève-toi!", type:"lever", typeLabel:"Faire lever", cx:16, cy:60},
  {id:11, lieu:"Cuisse / bandelette / dessus du genou (externe)", nom:"Nerf sciatique externe poplité", methode:"Frappe", mecanisme:"Dysfonction biomécanique", verbalisation:"Diversion / distance / ralentir", type:"diversion", typeLabel:"Diversion / ralentir (jambes)", cx:36, cy:94},
  {id:12, lieu:"Cuisse / intérieur / dessus du genou", nom:"Nerf fémoral", methode:"Frappe", mecanisme:"Dysfonction biomécanique", verbalisation:"Diversion / distance / ralentir", type:"diversion", typeLabel:"Diversion / ralentir (jambes)", cx:63, cy:94},
  {id:13, lieu:"Mollet / centre des gastrocnémiens (arrière)", nom:"Nerf tibial", methode:"Pression dynamique / Frappe", mecanisme:"Contrainte par la douleur / Dysfonction biomécanique", verbalisation:"Police, donne tes mains!", type:"submission", typeLabel:"Soumission / donner les mains", cx:59, cy:108}
];

const CATEGORIES = {
  submission: "Soumission / donner les mains", asseoir: "Faire asseoir", lever: "Faire lever",
  distance: "Créer une distance / reculer", lacher: "Faire lâcher un objet", diversion: "Diversion / ralentir (jambes)"
};

const METHODE_OPTIONS = ["Touché pression", "Pression dynamique", "Frappe", "Pression dynamique / Frappe"];
const MECANISME_OPTIONS = ["Contrainte par la douleur", "Dysfonction biomécanique", "Contrainte par la douleur / Dysfonction biomécanique"];
const TYPE_OPTIONS = Object.values(CATEGORIES);

const HIT_RADIUS = 5;

let state = {
  mode: null, categoryFilter: null, queue: [], currentIndex: 0, current: null,
  score: 0, streak: 0, bestStreak: 0, missed: [], startTime: null, timerInterval: null, waitingAnswer: true,
  quiz: { methode: null, mecanisme: null, type: null }
};

function loadStats() {
  const raw = localStorage.getItem('ppq_stats');
  return raw ? JSON.parse(raw) : { bestChronoMs: null, gamesPlayed: 0, bestScorePct: 0 };
}
function saveStats(s) { localStorage.setItem('ppq_stats', JSON.stringify(s)); }

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goHome() { stopChrono(); resetZoom(); showScreen('screen-home'); renderHomeStats(); }

function renderHomeStats() {
  const stats = loadStats();
  const el = document.getElementById('home-stats');
  if (stats.gamesPlayed === 0) { el.textContent = "Aucune partie jouée encore. Lance-toi!"; return; }
  let txt = `Parties: ${stats.gamesPlayed} · Meilleur score: ${stats.bestScorePct}%`;
  if (stats.bestChronoMs) txt += ` · Meilleur chrono: ${formatTime(stats.bestChronoMs)}`;
  el.textContent = txt;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function startGame(mode, categoryFilter = null) {
  state.mode = mode; state.categoryFilter = categoryFilter;
  let pool = POINTS;
  if (categoryFilter) pool = POINTS.filter(p => p.type === categoryFilter);
  state.queue = shuffle(pool); state.currentIndex = 0; state.score = 0; state.streak = 0;
  state.bestStreak = 0; state.missed = []; state.waitingAnswer = true;

  showScreen('screen-game'); resetZoom();
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
  } else document.getElementById('result-time').textContent = '';
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
  } else weakBox.innerHTML = '<div class="weak-cat-item"><span>Parfait, aucune faiblesse détectée! 🎉</span></div>';

  showScreen('screen-results');
}

function startChrono() {
  state.startTime = Date.now();
  state.timerInterval = setInterval(() => {
    document.getElementById('chrono-display').textContent = formatTime(Date.now() - state.startTime);
  }, 100);
  nextQuestion();
}
function stopChrono() { if (state.timerInterval) clearInterval(state.timerInterval); state.timerInterval = null; }
function formatTime(ms) {
  const totalSec = ms / 1000, min = Math.floor(totalSec / 60), sec = (totalSec % 60).toFixed(1);
  return `${String(min).padStart(2,'0')}:${String(sec).padStart(4,'0')}`;
}

function renderZones(reviewMode) {
  const g = document.getElementById('clickable-zones');
  g.innerHTML = '';
  POINTS.forEach(p => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', p.cx); circle.setAttribute('cy', p.cy); circle.setAttribute('r', HIT_RADIUS);
    circle.setAttribute('class', 'zone-hit'); circle.dataset.id = p.id;
    if (reviewMode) circle.addEventListener('click', (e) => { e.stopPropagation(); openExplainCard(p, true, true); });
    g.appendChild(circle);
  });
}

// ============================================================
// ZOOM / PAN sur le personnage
// ============================================================
let zoomState = { scale: 1, x: 0, y: 0 };
let pointers = new Map();
let lastPinchDist = null;
let panStart = null;

function applyTransform() {
  document.getElementById('body-pan-layer').style.transform =
    `translate(${zoomState.x}px, ${zoomState.y}px) scale(${zoomState.scale})`;
}
function resetZoom() { zoomState = { scale: 1, x: 0, y: 0 }; applyTransform(); }
function clampZoom() {
  zoomState.scale = Math.min(Math.max(zoomState.scale, 1), 4);
}

function setupZoomPan() {
  const wrap = document.getElementById('body-wrap');

  wrap.addEventListener('pointerdown', (e) => {
    wrap.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) panStart = { x: e.clientX, y: e.clientY, ox: zoomState.x, oy: zoomState.y };
  });

  wrap.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      const pts = Array.from(pointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (lastPinchDist != null) {
        const delta = (dist - lastPinchDist) * 0.01;
        zoomState.scale += delta;
        clampZoom();
        applyTransform();
      }
      lastPinchDist = dist;
    } else if (pointers.size === 1 && zoomState.scale > 1 && panStart) {
      zoomState.x = panStart.ox + (e.clientX - panStart.x);
      zoomState.y = panStart.oy + (e.clientY - panStart.y);
      applyTransform();
    }
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) lastPinchDist = null;
    if (pointers.size === 0) panStart = null;
  }
  wrap.addEventListener('pointerup', endPointer);
  wrap.addEventListener('pointercancel', endPointer);
  wrap.addEventListener('pointerleave', endPointer);

  wrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomState.scale += e.deltaY * -0.001;
    clampZoom();
    applyTransform();
  }, { passive: false });

  document.getElementById('zoom-in').addEventListener('click', () => { zoomState.scale += 0.4; clampZoom(); applyTransform(); });
  document.getElementById('zoom-out').addEventListener('click', () => { zoomState.scale -= 0.4; clampZoom(); applyTransform(); });
  document.getElementById('zoom-reset').addEventListener('click', resetZoom);
}

// ============================================================
// CLIC SUR LE CORPS (tient compte du zoom/pan)
// ============================================================
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
    POINTS.forEach(p => { const d = Math.hypot(p.cx - x, p.cy - y); if (d < minDist) { minDist = d; closest = p; } });

    state.waitingAnswer = false;
    const isCorrect = closest && closest.id === state.current.id && minDist <= HIT_RADIUS;
    processAnswer(isCorrect);
  });
}

function processAnswer(isCorrect) {
  const flash = document.getElementById('feedback-flash');
  const marker = document.getElementById('reveal-marker');

  if (isCorrect) {
    state.score++; state.streak++;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;
    flash.className = 'feedback-flash flash-good'; playTone(880, 0.1);
  } else {
    state.missed.push(state.current); state.streak = 0;
    flash.className = 'feedback-flash flash-bad'; playTone(220, 0.15);
    positionRevealMarker(state.current); marker.classList.remove('hidden');
  }
  setTimeout(() => { flash.className = 'feedback-flash'; }, 250);
  openExplainCard(state.current, isCorrect, false);
}

function positionRevealMarker(point) {
  const svg = document.getElementById('body-svg');
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  const marker = document.getElementById('reveal-marker');
  const wrapRect = document.getElementById('body-wrap').getBoundingClientRect();
  const x = rect.left - wrapRect.left + ((point.cx - viewBox.x) / viewBox.width) * rect.width;
  const y = rect.top - wrapRect.top + ((point.cy - viewBox.y) / viewBox.height) * rect.height;
  marker.style.left = `${x}px`; marker.style.top = `${y}px`;
}

// ============================================================
// CARTE EXPLICATION + QUIZ A CHOIX MULTIPLES
// ============================================================
function buildOptions(pool, correctValue) {
  let opts = [...pool];
  if (!opts.includes(correctValue)) opts.push(correctValue);
  return shuffle(opts);
}

function renderOptionGroup(containerId, options, correctValue, key) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('div');
    btn.className = 'quiz-opt';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      if (state.quiz[key] !== null) return;
      state.quiz[key] = opt;
      container.querySelectorAll('.quiz-opt').forEach(el => el.classList.add('disabled'));
      btn.classList.add('selected');
      checkAllAnswered();
    });
    container.appendChild(btn);
  });
}

function checkAllAnswered() {
  const { methode, mecanisme, type } = state.quiz;
  if (methode !== null && mecanisme !== null && type !== null) {
    document.getElementById('btn-valider').classList.remove('hidden');
  }
}

function revealQuizAnswers(point) {
  const groups = [
    { id: 'options-methode', correct: point.methode, chosen: state.quiz.methode },
    { id: 'options-mecanisme', correct: point.mecanisme, chosen: state.quiz.mecanisme },
    { id: 'options-type', correct: point.typeLabel, chosen: state.quiz.type }
  ];
  groups.forEach(g => {
    document.querySelectorAll(`#${g.id} .quiz-opt`).forEach(el => {
      if (el.textContent === g.correct) el.classList.add('correct');
      else if (el.textContent === g.chosen) el.classList.add('incorrect');
    });
  });
  document.getElementById('btn-valider').classList.add('hidden');
  document.getElementById('verbal-reveal').textContent = `"${point.verbalisation}"`;
  document.getElementById('verbal-reveal').classList.remove('hidden');
  document.getElementById('btn-next').classList.remove('hidden');
}

function openExplainCard(point, isCorrectLocation, isReview) {
  const card = document.getElementById('explain-card');
  const resultEl = document.getElementById('explain-result');

  state.quiz = { methode: null, mecanisme: null, type: null };
  document.getElementById('verbal-reveal').classList.add('hidden');
  document.getElementById('btn-next').classList.add('hidden');
  document.getElementById('btn-valider').classList.add('hidden');

  if (isReview) { resultEl.textContent = '📖 Fiche'; resultEl.className = 'explain-result'; }
  else { resultEl.textContent = isCorrectLocation ? '✔ Correct!' : '✘ Raté'; resultEl.className = 'explain-result ' + (isCorrectLocation ? 'good' : 'bad'); }

  document.getElementById('explain-nom').textContent = point.nom;
  document.getElementById('explain-lieu').textContent = point.lieu;

  renderOptionGroup('options-methode', buildOptions(METHODE_OPTIONS, point.methode), point.methode, 'methode');
  renderOptionGroup('options-mecanisme', buildOptions(MECANISME_OPTIONS, point.mecanisme), point.mecanisme, 'mecanisme');
  renderOptionGroup('options-type', buildOptions(TYPE_OPTIONS, point.typeLabel), point.typeLabel, 'type');

  card.dataset.reviewMode = isReview ? '1' : '0';
  card.classList.remove('hidden');

  document.getElementById('btn-valider').onclick = () => revealQuizAnswers(point);
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
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.frequency.value = freq; osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
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
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
}

setupSvgGlobalClick();
setupZoomPan();
renderHomeStats();
