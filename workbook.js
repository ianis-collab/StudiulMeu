/* ============================================
   StudiuMeu – VIAȚA CREȘTINĂ ȘI PREDICAREA (WORKBOOK)
   Gestionează caietul de lucru, cuvântarea de 5 minute,
   asistentul AI pentru schițe și timerul de 5 min.
   Depinde de: storage.js, utils.js, nav.js
   ============================================ */

'use strict';

// ============================================
// CAIET DE LUCRU
// ============================================
function addWbMinistryItem() {
  const list = document.getElementById('wbMinistryList');
  const item = document.createElement('div');
  item.className = 'wb-item';
  item.innerHTML = `
    <div class="form-row">
      <div class="form-group"><label>Subiect / Tip</label><input type="text" class="form-input" placeholder="ex: Prezentarea inițială"/></div>
      <div class="form-group"><label>Student / Asistent</label><input type="text" class="form-input" placeholder="Nume"/></div>
    </div>
    <div class="form-group"><label>Notițe pregătire</label><textarea class="form-textarea small" placeholder="Ce vei spune, versete de folosit..."></textarea></div>
  `;
  list.appendChild(item);
}

function saveWorkbook() {
  const week = document.getElementById('wb-week')?.value?.trim();
  if (!week) {
    showToast('Adaugă săptămâna.', 'error');
    document.getElementById('wb-week')?.focus();
    return;
  }

  const wbId = Date.now().toString();
  const wb = {
    id:       wbId,
    week,
    date:     document.getElementById('wb-date')?.value || new Date().toISOString().split('T')[0],
    reading:  document.getElementById('wb-reading')?.value || '',
    progress: 60,
  };

  state.workbooks.push(wb);
  markStudyDay();
  saveState();
  showToast('Pregătire Viața creștină și predicarea salvată! 📋', 'success');

  state.notes.push({
    id:       wbId + '_wb',
    title:    `Caiet: ${week}`,
    content:  `Pregătire pentru săptămâna ${week}. Lectură: ${wb.reading}`,
    category: 'workbook',
    tags:     ['caiet-lucru'],
    date:     wb.date,
  });
  saveState();
}

// ============================================
// CUVÂNTARE (5 MIN) – DRAFT
// ============================================
function saveTalkDraft() {
  if (!state.talkDraft) state.talkDraft = {};
  state.talkDraft = {
    subject:  document.getElementById('talk-subject')?.value || '',
    duration: document.getElementById('talk-duration')?.value || '5 minute',
    notes:    document.getElementById('talk-notes')?.value || '',
  };
  saveState();
}

function loadTalkDraft() {
  const draft    = state.talkDraft || {};
  const subject  = document.getElementById('talk-subject');
  const duration = document.getElementById('talk-duration');
  const notes    = document.getElementById('talk-notes');

  if (subject)  subject.value  = draft.subject  || '';
  if (duration) duration.value = draft.duration || '5 minute';
  if (notes)    notes.value    = draft.notes    || '';
}

// ============================================
// AI ASISTENT – SCHIȚĂ CUVÂNTARE
// ============================================
let generatedTalkOutlineText = '';

function toggleTalkAiPanel() {
  const panel = document.getElementById('talkAiPanel');
  if (!panel) return;
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function generateTalkOutline(style) {
  const subjectInput = document.getElementById('talk-subject');
  const subject      = subjectInput ? subjectInput.value.trim() : '';
  const sugDiv       = document.getElementById('talkAiSuggestions');
  const useBtn       = document.getElementById('useTalkOutlineBtn');

  if (!subject) {
    showToast('Introduceți mai întâi subiectul cuvântării.', 'error');
    subjectInput?.focus();
    return;
  }

  sugDiv.style.display = 'block';
  sugDiv.innerHTML     = `⏳ Se generează schița...`;
  useBtn.style.display = 'none';

  setTimeout(() => {
    let outline = '';
    const cleanSubject = subject.charAt(0).toUpperCase() + subject.slice(1);

    if (style === 'explicativ') {
      outline =
        `📌 DISCURS EXPLICATIV: "${cleanSubject}"\n\n` +
        `1. INTRODUCERE (Atenție & Interes):\n` +
        `   - De ce este important subiectul "${cleanSubject}" astăzi?\n` +
        `   - Definirea termenilor principali.\n\n` +
        `2. CORPUL CUVÂNTĂRII (Explicații cheie):\n` +
        `   - Ce ne învață Biblia în mod direct despre acest aspect?\n` +
        `   - Dovezi scripturale și principii de bază.\n\n` +
        `3. CONCLUZIE:\n` +
        `   - Rezumatul punctelor principale.\n` +
        `   - Îndemn final bazat pe adevărul analizat.`;
    } else if (style === 'practic') {
      outline =
        `📌 DISCURS PRACTIC: "${cleanSubject}"\n\n` +
        `1. INTRODUCERE:\n` +
        `   - Impactul subiectului "${cleanSubject}" în activitățile zilnice.\n\n` +
        `2. CORPUL CUVÂNTĂRII (Aplicare practică):\n` +
        `   - Pasul 1: Cum implementăm acest lucru în familie sau la locul de muncă?\n` +
        `   - Pasul 2: Obstacole comune și cum le putem depăși cu ajutorul spiritului sfânt.\n` +
        `   - Ilustrare sugestivă potrivită pentru ilustrarea ideii.\n\n` +
        `3. CONCLUZIE:\n` +
        `   - O acțiune clară pe care o putem face în săptămâna următoare.`;
    } else {
      outline =
        `📌 DISCURS ÎNCURAJATOR: "${cleanSubject}"\n\n` +
        `1. INTRODUCERE:\n` +
        `   - Sentimentele noastre legate de "${cleanSubject}" în momente dificile.\n\n` +
        `2. CORPUL CUVÂNTĂRII (Consolare și Sprijin):\n` +
        `   - Promisiunile lui Iehova care ne dau putere.\n` +
        `   - Exemple biblice de credință (cum au perseverat alții).\n` +
        `   - Cum ne sprijină congregația creștină.\n\n` +
        `3. CONCLUZIE:\n` +
        `   - Un mesaj cald de speranță și încredere în viitor.`;
    }

    generatedTalkOutlineText = outline;
    sugDiv.innerHTML         = outline.replace(/\n/g, '<br>');
    useBtn.style.display     = 'inline-block';
    showToast('Schiță AI generată! ✨', 'success');
  }, 500);
}

function applyTalkOutline() {
  const notesTextarea = document.getElementById('talk-notes');
  if (notesTextarea && generatedTalkOutlineText) {
    notesTextarea.value = notesTextarea.value.trim()
      ? notesTextarea.value + '\n\n' + generatedTalkOutlineText
      : generatedTalkOutlineText;
    saveTalkDraft();
    updateWordCounters();
    showToast('Schița a fost aplicată în notițe! ✍️', 'success');
  }
}

// ============================================
// TIMER CUVÂNTARE 5 MINUTE
// ============================================
let talkTimerInterval = null;
let talkTimerSeconds  = 300;
let talkTimerRunning  = false;
let talkTimerFinished = false;

function talkTimerStart() {
  if (talkTimerFinished || talkTimerRunning) return;
  talkTimerRunning = true;
  document.getElementById('talkTimerStartBtn').style.display = 'none';
  document.getElementById('talkTimerPauseBtn').style.display = 'inline-flex';

  talkTimerInterval = setInterval(function () {
    if (talkTimerSeconds <= 0) {
      talkTimerFinish();
      return;
    }
    talkTimerSeconds--;
    talkTimerUpdateUI();
  }, 1000);
}

function talkTimerPause() {
  if (!talkTimerRunning) return;
  clearInterval(talkTimerInterval);
  talkTimerRunning = false;
  var startBtn = document.getElementById('talkTimerStartBtn');
  if (startBtn) { startBtn.style.display = 'inline-flex'; startBtn.textContent = '▶ Continuă'; }
  document.getElementById('talkTimerPauseBtn').style.display = 'none';
}

function talkTimerStop() {
  clearInterval(talkTimerInterval);
  talkTimerRunning = false;
}

function talkTimerReset() {
  talkTimerStop();
  talkTimerSeconds  = 300;
  talkTimerFinished = false;

  var startBtn = document.getElementById('talkTimerStartBtn');
  var pauseBtn = document.getElementById('talkTimerPauseBtn');
  var timerBar = document.getElementById('talkTimerBar');

  if (startBtn) { startBtn.style.display = 'inline-flex'; startBtn.textContent = '▶ Start'; }
  if (pauseBtn) pauseBtn.style.display = 'none';
  if (timerBar) timerBar.classList.remove('timer-warning', 'timer-danger', 'timer-done');

  var labelEl = document.getElementById('talkTimerLabel');
  if (labelEl) labelEl.textContent = 'din 5 minute';

  talkTimerUpdateUI();
}

function talkTimerFinish() {
  clearInterval(talkTimerInterval);
  talkTimerRunning  = false;
  talkTimerFinished = true;
  talkTimerSeconds  = 0;

  var timerBar = document.getElementById('talkTimerBar');
  if (timerBar) timerBar.classList.add('timer-done');

  var startBtn = document.getElementById('talkTimerStartBtn');
  var pauseBtn = document.getElementById('talkTimerPauseBtn');
  if (startBtn) startBtn.style.display = 'none';
  if (pauseBtn) pauseBtn.style.display = 'none';

  document.getElementById('talkTimerValue').textContent = '00:00';
  document.getElementById('talkTimerIcon').textContent  = '🔴';
  document.getElementById('talkTimerLabel').textContent = 'Timp expirat!';
  document.getElementById('talkTimerFill').style.width  = '0%';

  showToast('⏰ Cele 5 minute pentru cuvântare s-au încheiat!', 'error');
}

function talkTimerUpdateUI() {
  var total     = 300;
  var remaining = talkTimerSeconds;
  var pct       = (remaining / total) * 100;

  var mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  var ss = String(remaining % 60).padStart(2, '0');

  var valEl    = document.getElementById('talkTimerValue');
  var fillEl   = document.getElementById('talkTimerFill');
  var iconEl   = document.getElementById('talkTimerIcon');
  var timerBar = document.getElementById('talkTimerBar');

  if (valEl)  valEl.textContent    = mm + ':' + ss;
  if (fillEl) fillEl.style.width   = pct + '%';

  if (timerBar) {
    timerBar.classList.remove('timer-warning', 'timer-danger');
    if (remaining <= 20) {
      timerBar.classList.add('timer-danger');
      if (iconEl) iconEl.textContent = '🔴';
    } else if (remaining <= 60) {
      timerBar.classList.add('timer-warning');
      if (iconEl) iconEl.textContent = '🟠';
    } else {
      if (iconEl) iconEl.textContent = '⏱';
    }
  }
}
