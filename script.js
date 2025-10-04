/* ============================================================
   Stopwatch — Core + Bonus
   - Core: Start/Stop/Reset (hh:mm:ss)
   - Bonus: milliseconds, Lap, responsive, theme toggle
   ============================================================ */

const el = {
  hours:  document.getElementById('hours'),
  minutes:document.getElementById('minutes'),
  seconds:document.getElementById('seconds'),
  ms:     document.getElementById('ms'),

  btnStart: document.getElementById('start'),
  btnStop:  document.getElementById('stop'),
  btnReset: document.getElementById('reset'),
  btnLap:   document.getElementById('lap'),
  btnTheme: document.getElementById('theme'),
  btnClear: document.getElementById('clear-laps'),

  lapList:  document.getElementById('lap-list')
};

// --- State ---
let intervalId = null;    // setInterval handle
let startEpoch = 0;       // when the current run started
let elapsedMs  = 0;       // total elapsed time (ms) including pauses
let laps = [];            // array of {total, delta}

// --- Utilities ---
const pad2 = (n) => String(n).padStart(2, '0');
const pad2ms = (n) => String(Math.floor(n/10)).padStart(2, '0'); // show centiseconds

function formatTime(ms){
  const totalSeconds = Math.floor(ms / 1000);
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centis  = Math.floor((ms % 1000) / 10); // 0..99
  return {
    h: pad2(hours),
    m: pad2(minutes),
    s: pad2(seconds),
    cs: pad2(centis)
  };
}

function render(ms){
  const {h, m, s, cs} = formatTime(ms);
  el.hours.textContent   = h;
  el.minutes.textContent = m;
  el.seconds.textContent = s;
  el.ms.textContent      = cs;
}

function update(){
  const now = Date.now();
  const current = now - startEpoch + elapsedMs;
  render(current);
}

// --- Controls (enable/disable sets) ---
function setRunningUI(running){
  el.btnStart.disabled = running; // prevent multiple timers
  el.btnStop.disabled  = !running;
  el.btnReset.disabled = false;   // allow reset any time after start pressed
  el.btnLap.disabled   = !running;
  el.btnClear.disabled = laps.length === 0;
}

// --- Core actions ---
function start(){
  if (intervalId !== null) return;     // guard against multiple intervals
  startEpoch = Date.now();             // mark when this run begins
  intervalId = setInterval(update, 10); // 10ms for smooth milliseconds
  setRunningUI(true);
}

function stop(){
  if (intervalId === null) return;
  clearInterval(intervalId);
  intervalId = null;
  // Lock in elapsed time up to now
  elapsedMs = Date.now() - startEpoch + elapsedMs;
  render(elapsedMs);
  setRunningUI(false);
}

function reset(){
  // Stop if running
  if (intervalId !== null){
    clearInterval(intervalId);
    intervalId = null;
  }
  startEpoch = 0;
  elapsedMs  = 0;
  render(0);
  // Clear laps
  laps = [];
  drawLaps();
  // Reset buttons
  el.btnReset.disabled = true;
  el.btnStop.disabled  = true;
  el.btnStart.disabled = false;
  el.btnLap.disabled   = true;
  el.btnClear.disabled = true;
}

// --- Bonus: Laps ---
function lap(){
  // compute current total time (whether running or paused)
  const total = intervalId ? (Date.now() - startEpoch + elapsedMs) : elapsedMs;
  const last  = laps.length ? laps[laps.length - 1].total : 0;
  const delta = total - last;
  laps.push({ total, delta });
  drawLaps();
}

function clearLaps(){
  laps = [];
  drawLaps();
}

function drawLaps(){
  el.lapList.innerHTML = '';
  laps.forEach((l, i) => {
    const li = document.createElement('li');
    const idx = document.createElement('span');
    const time = document.createElement('span');
    const delta = document.createElement('span');

    idx.className = 'idx';
    time.className = 'time';
    delta.className = 'delta';

    const t = formatTime(l.total);
    const d = formatTime(l.delta);

    idx.textContent = `#${i+1}`;
    time.textContent = `${t.h}:${t.m}:${t.s}.${t.cs}`;
    delta.textContent = `+${d.h}:${d.m}:${d.s}.${d.cs}`;

    li.appendChild(idx);
    li.appendChild(time);
    li.appendChild(delta);
    el.lapList.appendChild(li);
  });

  el.btnClear.disabled = laps.length === 0;
}

// --- Theme toggle (light/dark) ---
function toggleTheme(){
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('stopwatch-theme', next);
}

function restoreTheme(){
  const saved = localStorage.getItem('stopwatch-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
}

// --- Keyboard shortcuts (optional UX) ---
// Space: start/stop, R: reset, L: lap, T: theme
function onKey(e){
  if (['INPUT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName)) return;
  if (e.code === 'Space'){ e.preventDefault(); intervalId ? stop() : start(); }
  else if (e.key.toLowerCase() === 'r'){ reset(); }
  else if (e.key.toLowerCase() === 'l'){ if (!el.btnLap.disabled) lap(); }
  else if (e.key.toLowerCase() === 't'){ toggleTheme(); }
}

// --- Wire up ---
el.btnStart.addEventListener('click', start);
el.btnStop.addEventListener('click', stop);
el.btnReset.addEventListener('click', reset);
el.btnLap.addEventListener('click', lap);
el.btnClear.addEventListener('click', clearLaps);
el.btnTheme.addEventListener('click', toggleTheme);
window.addEventListener('keydown', onKey);

// Initial render + theme
restoreTheme();
render(0);
