'use strict';

// ============================================
// FIELD SERVICE
// ============================================
function saveFieldServiceNote() {
  const fsDate = document.getElementById('fs-date')?.value || new Date().toISOString().split('T')[0];
  const fsTitle = document.getElementById('fs-title')?.value?.trim();
  const fsContent = document.getElementById('fs-content')?.value?.trim();

  if (!fsTitle) {
    showToast('Adaugă un titlu sau subiect pentru întrunire.', 'error');
    document.getElementById('fs-title')?.focus();
    return;
  }

  const note = {
    id: Date.now().toString(),
    title: fsTitle,
    content: fsContent || 'Fără conținut',
    category: 'fieldservice',
    tags: ['serviciu-teren'],
    date: fsDate,
  };

  state.notes.push(note);
  markStudyDay();
  saveState();
  showToast('Notiță serviciu de teren salvată! 🧑‍🤝‍🧑', 'success');

  // Clear inputs
  const titleInput = document.getElementById('fs-title');
  const contentInput = document.getElementById('fs-content');
  if (titleInput) titleInput.value = '';
  if (contentInput) contentInput.value = '';

  renderFieldServiceList();
}

function renderFieldServiceList() {
  const container = document.getElementById('fsNotesList');
  if (!container) return;

  const filtered = state.notes.filter(n => n.category === 'fieldservice');

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state full-width">
        <p>Nicio notiță de serviciu de teren salvată încă.</p>
      </div>`;
    return;
  }

  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  container.innerHTML = sorted.map(note => `
    <div class="note-card" onclick="openNoteCard('${note.id}')">
      <div class="note-card-header">
        <span class="note-card-title">${escHtml(note.title)}</span>
        <span class="badge" style="background:#ec489922;color:#ec4899;flex-shrink:0">
          🧑‍🤝‍🧑 Serviciu
        </span>
      </div>
      <p class="note-card-body">${escHtml(note.content || 'Fără conținut')}</p>
      <div class="note-card-footer">
        <span class="note-card-date">${formatDate(note.date)}</span>
        <div style="display:flex;gap:6px">
          <button class="edit-btn-fs" onclick="event.stopPropagation(); openNoteCard('${note.id}')" title="Editează">✏️ Editează</button>
          <button class="delete-btn-fs" onclick="event.stopPropagation(); deleteFieldServiceNote('${note.id}')" title="Șterge">🗑 Șterge</button>
        </div>
      </div>
    </div>
  `).join('');
}

function deleteFieldServiceNote(id) {
  if (confirm('Ștergi această notiță?')) {
    state.notes = state.notes.filter(n => n.id !== id);
    saveState();
    renderFieldServiceList();
    showToast('Notiță ștearsă.', 'success');
  }
}

// ============================================
// PROGRAM ÎNTRUNIRE DE IEȘIRE PE TEREN
// ============================================
function renderFieldServiceSchedule() {
  const container = document.getElementById('fsScheduleGrid');
  if (!container) return;
  if (!state.fieldServiceSchedule) return;

  const dayKeys = ['marti', 'vineri', 'sambata'];

  container.innerHTML = dayKeys.map(dayKey => {
    const day = state.fieldServiceSchedule[dayKey];
    const rowsHtml = day.rows.map((row, i) => `
      <div class="fs-sched-row">
        <input class="fs-sched-cell fs-sched-cell-data" type="text" value="${escHtml(row.data)}"
          oninput="updateScheduleCell('${dayKey}', ${i}, 'data', this.value)" />
        <input class="fs-sched-cell fs-sched-cell-nume" type="text" value="${escHtml(row.nume)}"
          oninput="updateScheduleCell('${dayKey}', ${i}, 'nume', this.value)" />
        <button class="fs-sched-del" onclick="deleteScheduleRow('${dayKey}', ${i})" title="Șterge rândul">✕</button>
      </div>
    `).join('');

    return `
      <div class="fs-sched-table">
        <div class="fs-sched-header">
          <span class="fs-sched-header-label">DATA</span>
          <span class="fs-sched-header-day" style="background:${day.color}">${escHtml(day.label)}</span>
        </div>
        <div class="fs-sched-body">${rowsHtml}</div>
        <button class="fs-sched-add" onclick="addScheduleRow('${dayKey}')">+ Adaugă rând</button>
      </div>
    `;
  }).join('');
}

function updateScheduleCell(dayKey, index, field, value) {
  const row = state.fieldServiceSchedule?.[dayKey]?.rows?.[index];
  if (!row) return;
  row[field] = value;
  saveState();
  if (typeof mirrorScheduleToIdb === 'function') mirrorScheduleToIdb();
}

function addScheduleRow(dayKey) {
  const day = state.fieldServiceSchedule?.[dayKey];
  if (!day) return;
  day.rows.push({ data: '', nume: '' });
  saveState();
  if (typeof mirrorScheduleToIdb === 'function') mirrorScheduleToIdb();
  renderFieldServiceSchedule();
  // Focus pe prima celulă a noului rând
  const rows = document.querySelectorAll(`#fsScheduleGrid .fs-sched-table`);
  requestAnimationFrame(() => {
    const inputs = document.querySelectorAll('.fs-sched-row .fs-sched-cell-data');
    const last = inputs[inputs.length - 1];
    if (last) last.focus();
  });
}

function deleteScheduleRow(dayKey, index) {
  const day = state.fieldServiceSchedule?.[dayKey];
  if (!day) return;
  day.rows.splice(index, 1);
  saveState();
  if (typeof mirrorScheduleToIdb === 'function') mirrorScheduleToIdb();
  renderFieldServiceSchedule();
}

// ============================================
