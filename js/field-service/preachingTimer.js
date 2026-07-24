'use strict';

// ============================================
// ASISTENT DE PREDICARE (RAPORT) - CRONOMETRU
// Cronometru simplu (numără crescător de la 0), pornit/oprit cu un
// singur buton central. Cifrele (HH:MM:SS) se afișează în dreapta
// butonului. Folosit pentru a cronometra timpul de predicare, ca
// vestitorul să știe ce să treacă la raport.
// ============================================

let preachTimerSeconds = 0;
let preachTimerInterval = null;
let preachTimerRunning = false;

function preachTimerToggle() {
  if (preachTimerRunning) {
    preachTimerPause();
  } else {
    preachTimerStart();
  }
}

function preachTimerStart() {
  if (preachTimerRunning) return;
  preachTimerRunning = true;

  const btn = document.getElementById('preachTimerToggleBtn');
  if (btn) {
    btn.textContent = '⏸';
    btn.classList.add('is-running');
    btn.setAttribute('aria-label', 'Pune pe pauză');
  }

  preachTimerInterval = setInterval(function() {
    preachTimerSeconds++;
    preachTimerUpdateUI();
  }, 1000);
}

function preachTimerPause() {
  if (!preachTimerRunning) return;
  clearInterval(preachTimerInterval);
  preachTimerRunning = false;

  const btn = document.getElementById('preachTimerToggleBtn');
  if (btn) {
    btn.textContent = '▶';
    btn.classList.remove('is-running');
    btn.setAttribute('aria-label', 'Pornește cronometrul');
  }
}

function preachTimerReset() {
  clearInterval(preachTimerInterval);
  preachTimerRunning = false;
  preachTimerSeconds = 0;

  const btn = document.getElementById('preachTimerToggleBtn');
  if (btn) {
    btn.textContent = '▶';
    btn.classList.remove('is-running');
    btn.setAttribute('aria-label', 'Pornește cronometrul');
  }

  preachTimerUpdateUI();
}

function preachTimerUpdateUI() {
  const hh = String(Math.floor(preachTimerSeconds / 3600)).padStart(2, '0');
  const mm = String(Math.floor((preachTimerSeconds % 3600) / 60)).padStart(2, '0');
  const ss = String(preachTimerSeconds % 60).padStart(2, '0');

  const valEl = document.getElementById('preachTimerValue');
  if (valEl) valEl.textContent = `${hh}:${mm}:${ss}`;
}
