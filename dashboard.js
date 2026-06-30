/* ============================================
   StudiuMeu – PANOU PRINCIPAL (DASHBOARD)
   Randează statisticile, seria de studiu, următoarea întrunire
   și notițele recente afișate pe ecranul principal.
   Depinde de: storage.js, utils.js, nav.js
   ============================================ */

'use strict';

// ============================================
// SALUT & DATĂ
// ============================================
function updateGreeting() {
  const now = new Date();
  const hours = now.getHours();
  let greeting;
  if (hours < 12) greeting = 'Bună dimineața! 🌅';
  else if (hours < 18) greeting = 'Bună ziua! 🌿';
  else greeting = 'Bună seara! 🌙';

  document.getElementById('greetingText').textContent = greeting;

  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('greetingDate').textContent =
    now.toLocaleDateString('ro-RO', opts);

  // Setează câmpurile de dată la data de azi (dacă nu au deja o valoare)
  const today = now.toISOString().split('T')[0];
  ['wt-date', 'wb-date', 'fs-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = today;
  });
}

// ============================================
// DASHBOARD
// ============================================
function renderDashboard() {
  document.getElementById('stat-articles').textContent = state.wtStudies.length;
  document.getElementById('stat-notes').textContent    = state.notes.length;
  document.getElementById('stat-meetings').textContent = state.meetings.length;
  document.getElementById('stat-verses').textContent   = state.verses.length;

  updateStreak();
  document.getElementById('streakCount').textContent = `${state.streak} zile studiu`;

  updateNextMeeting();
  renderRecentNotes();
}

function updateStreak() {
  const el = document.getElementById('streakCount');
  if (el) el.textContent = `${state.streak} zile studiu`;
}

function updateNextMeeting() {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day   = today.getDay(); // 0=Dum, 4=Joi

  let daysUntilSun = (0 - day + 7) % 7;
  let nextSun = new Date(today);
  nextSun.setDate(today.getDate() + daysUntilSun);

  let daysUntilThu = (4 - day + 7) % 7;
  let nextThu = new Date(today);
  nextThu.setDate(today.getDate() + daysUntilThu);

  let nextMeeting, nextName;
  if (nextThu < nextSun) {
    nextMeeting = nextThu;
    nextName    = 'Viața și Activitatea Creștină';
  } else {
    nextMeeting = nextSun;
    nextName    = 'Studierea Turnului de Veghe';
  }

  const nameEl = document.getElementById('nextMeetingName');
  const dateEl = document.getElementById('nextMeetingDate');
  if (nameEl) nameEl.textContent = nextName;
  if (dateEl) {
    const opts = { weekday: 'long', day: 'numeric', month: 'long' };
    const diff = Math.round((nextMeeting - today) / (1000 * 60 * 60 * 24));
    let dateStr = nextMeeting.toLocaleDateString('ro-RO', opts);
    if (diff === 0)      dateStr += ' (astăzi)';
    else if (diff === 1) dateStr += ' (mâine)';
    else                 dateStr += ` (în ${diff} zile)`;
    dateEl.textContent = dateStr;
  }

  const lastStudy = nextName.includes('Turnul')
    ? state.wtStudies[state.wtStudies.length - 1]
    : state.workbooks[state.workbooks.length - 1];
  const prog = lastStudy ? (lastStudy.progress || 0) : 0;
  const progressEl = document.getElementById('nextMeetingProgress');
  const barEl      = document.getElementById('nextMeetingProgressBar');
  if (progressEl) progressEl.textContent = `${prog}%`;
  if (barEl)      barEl.style.width = `${prog}%`;
}

function renderRecentNotes() {
  const container = document.getElementById('recentNotesList');
  if (!container) return;

  const recent = [...state.notes]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  if (recent.length === 0) {
    container.innerHTML = '<div class="empty-state-small">Nicio notiță încă. Începe studiul!</div>';
    return;
  }

  const colors = {
    watchtower:  '#4f8ef7',
    workbook:    '#10c9a0',
    bible:       '#a855f7',
    general:     '#f97b4f',
    fieldservice:'#ec4899',
  };

  container.innerHTML = recent.map(note => `
    <div class="recent-item" onclick="openNoteCard('${note.id}')">
      <div class="recent-item-dot" style="background:${colors[note.category] || '#4f8ef7'}"></div>
      <span class="recent-item-title">${escHtml(note.title)}</span>
      <span class="recent-item-date">${formatDate(note.date)}</span>
    </div>
  `).join('');
}

// Helper – navigare spre cititorul Bibliei
function readVerseInBible() {
  navigateTo('biblereader');
}
