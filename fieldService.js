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
  if (!state.fieldServiceSchedule.coWeek) {
    state.fieldServiceSchedule.coWeek = { enabled: false, from: '', to: '' };
  }

  renderFieldServiceCoWeekBar();

  const coWeek = state.fieldServiceSchedule.coWeek;
  const dayKeys = ['marti', 'vineri', 'sambata'];

  container.innerHTML = dayKeys.map(dayKey => {
    const day = state.fieldServiceSchedule[dayKey];
    const rowsHtml = day.rows.map((row, i) => {
      const disabled = coWeek.enabled && isDateInCoWeekRange(row.data);
      return `
      <div class="fs-sched-row${disabled ? ' fs-sched-row-disabled' : ''}">
        <input class="fs-sched-cell fs-sched-cell-data" type="text" value="${escHtml(row.data)}" ${disabled ? 'disabled' : ''}
          oninput="updateScheduleCell('${dayKey}', ${i}, 'data', this.value)" />
        <input class="fs-sched-cell fs-sched-cell-nume" type="text" value="${escHtml(row.nume)}" ${disabled ? 'disabled' : ''}
          placeholder="${disabled ? 'Fără programare (supraveghetor)' : ''}"
          oninput="updateScheduleCell('${dayKey}', ${i}, 'nume', this.value)" />
        <button class="fs-sched-del" onclick="deleteScheduleRow('${dayKey}', ${i})" title="Șterge rândul">✕</button>
      </div>
    `;
    }).join('');

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

// ============================================
// SĂPTĂMÂNA CU VIZITA SUPRAVEGHETORULUI DE CIRCUMSCRIPȚIE
// Bifă + interval de date (setat manual), salvată împreună cu programul.
// Când e activă: se afișează un mesaj informativ, rândurile cu dată în
// interval sunt dezactivate (nu se pot completa colaboratori), iar
// "Sugerează programul" sare peste acele date. Restul rămâne neschimbat.
// ============================================
function renderFieldServiceCoWeekBar() {
  const bar = document.getElementById('fsCoWeekBar');
  if (!bar || !state.fieldServiceSchedule) return;
  const coWeek = state.fieldServiceSchedule.coWeek || { enabled: false, from: '', to: '' };

  bar.innerHTML = `
    <label class="fs-coweek-check">
      <input type="checkbox" ${coWeek.enabled ? 'checked' : ''} onchange="toggleFieldServiceCoWeek(this.checked)" />
      <span>Săptămână cu vizita supraveghetorului de circumscripție</span>
    </label>
    <div class="fs-coweek-dates" style="${coWeek.enabled ? '' : 'display:none'}">
      <label>De la: <input type="date" value="${escHtml(coWeek.from || '')}" onchange="updateFieldServiceCoWeekDate('from', this.value)" /></label>
      <label>Până la: <input type="date" value="${escHtml(coWeek.to || '')}" onchange="updateFieldServiceCoWeekDate('to', this.value)" /></label>
    </div>
    ${coWeek.enabled ? `
      <div class="fs-coweek-info">
        ℹ️ Săptămâna aceasta ne vizitează supraveghetorul de circumscripție — nu se programează colaboratori pentru serviciul de teren.
      </div>
    ` : ''}
  `;
}

function toggleFieldServiceCoWeek(checked) {
  if (!state.fieldServiceSchedule) return;
  if (!state.fieldServiceSchedule.coWeek) state.fieldServiceSchedule.coWeek = { enabled: false, from: '', to: '' };
  state.fieldServiceSchedule.coWeek.enabled = checked;
  saveState();
  if (typeof mirrorScheduleToIdb === 'function') mirrorScheduleToIdb();
  renderFieldServiceSchedule();
}

function updateFieldServiceCoWeekDate(field, value) {
  if (!state.fieldServiceSchedule?.coWeek) return;
  state.fieldServiceSchedule.coWeek[field] = value;
  saveState();
  if (typeof mirrorScheduleToIdb === 'function') mirrorScheduleToIdb();
  renderFieldServiceSchedule();
}

// Verifică dacă textul liber al unui rând (ex: "22 iulie") cade în
// intervalul [from, to] setat manual pentru săptămâna supraveghetorului.
function isDateInCoWeekRange(rowDateText) {
  const coWeek = state.fieldServiceSchedule?.coWeek;
  if (!coWeek || !coWeek.enabled || !coWeek.from || !coWeek.to) return false;

  const parsed = parseRoDateApprox(rowDateText);
  if (parsed == null) return false;

  const from = new Date(coWeek.from + 'T00:00:00').getTime();
  const to = new Date(coWeek.to + 'T23:59:59').getTime();
  if (isNaN(from) || isNaN(to)) return false;

  return parsed >= from && parsed <= to;
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
// SALVARE MANUALĂ (buton "💾 Salvează")
// Datele se salvează oricum automat la fiecare modificare, dar butonul
// oferă o confirmare vizuală explicită, cerută de utilizator.
// ============================================
function saveFieldServiceScheduleManual() {
  saveState();
  if (typeof mirrorScheduleToIdb === 'function') mirrorScheduleToIdb();
  showToast('Program salvat! 💾', 'success');
}

// ============================================
// TRIMITE PE WHATSAPP
// Construiește un text formatat cu toate cele 3 zile (dată + nume) și
// deschide WhatsApp cu mesajul precompletat.
// ============================================
function buildFieldServiceShareText(table) {
  if (!table) return '';
  const dayKeys = ['marti', 'vineri', 'sambata'];
  const parts = [];
  const title = table.title ? `📅 ${table.title}\n` : '';
  parts.push(`${title}*Program pentru Întrunirea de Ieșire pe Teren*`);

  dayKeys.forEach(dayKey => {
    const day = table[dayKey];
    if (!day) return;
    parts.push(`\n*${day.label}*`);
    const rows = Array.isArray(day.rows) ? day.rows.filter(r => (r.data && r.data.trim()) || (r.nume && r.nume.trim())) : [];
    if (rows.length === 0) {
      parts.push('—');
    } else {
      rows.forEach(row => {
        const data = row.data && row.data.trim() ? row.data.trim() : '—';
        const nume = row.nume && row.nume.trim() ? row.nume.trim() : '—';
        parts.push(`• ${data}: ${nume}`);
      });
    }
  });

  return parts.join('\n');
}

function shareFieldServiceScheduleWhatsApp(tableId) {
  const table = tableId ? (state.fieldServiceExtraTables || []).find(t => t.id === tableId) : state.fieldServiceSchedule;
  if (!table) {
    showToast('Nu există niciun program de trimis.', 'error');
    return;
  }
  const text = buildFieldServiceShareText(table);
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

// ============================================
// TABELE CALENDAR SUPLIMENTARE
// Permit crearea mai multor tabele (ex: pentru perioade diferite), toate
// vizibile simultan, fără să se suprapună — fiecare e un card separat.
// ============================================
function addFieldServiceExtraTable() {
  const title = prompt('Denumire pentru noul tabel (ex: "Iulie 2026"):', '');
  if (title === null) return; // utilizatorul a anulat

  if (!Array.isArray(state.fieldServiceExtraTables)) state.fieldServiceExtraTables = [];

  const table = defaultFieldServiceSchedule();
  table.id = Date.now().toString();
  table.title = title.trim() || 'Tabel nou';

  state.fieldServiceExtraTables.push(table);
  saveState();
  if (typeof mirrorScheduleToIdb === 'function') mirrorScheduleToIdb();
  renderFieldServiceExtraTables();
  showToast('Tabel calendar nou creat! 🗓️', 'success');
}

function deleteFieldServiceExtraTable(tableId) {
  if (!confirm('Ștergi acest tabel calendar?')) return;
  state.fieldServiceExtraTables = (state.fieldServiceExtraTables || []).filter(t => t.id !== tableId);
  saveState();
  if (typeof mirrorScheduleToIdb === 'function') mirrorScheduleToIdb();
  renderFieldServiceExtraTables();
  showToast('Tabel calendar șters.', 'success');
}

function renameFieldServiceExtraTable(tableId, value) {
  const table = (state.fieldServiceExtraTables || []).find(t => t.id === tableId);
  if (!table) return;
  table.title = value;
  saveState();
}

function updateExtraScheduleCell(tableId, dayKey, index, field, value) {
  const table = (state.fieldServiceExtraTables || []).find(t => t.id === tableId);
  const row = table?.[dayKey]?.rows?.[index];
  if (!row) return;
  row[field] = value;
  saveState();
  if (typeof mirrorScheduleToIdb === 'function') mirrorScheduleToIdb();
}

function addExtraScheduleRow(tableId, dayKey) {
  const table = (state.fieldServiceExtraTables || []).find(t => t.id === tableId);
  const day = table?.[dayKey];
  if (!day) return;
  day.rows.push({ data: '', nume: '' });
  saveState();
  if (typeof mirrorScheduleToIdb === 'function') mirrorScheduleToIdb();
  renderFieldServiceExtraTables();
  requestAnimationFrame(() => {
    const inputs = document.querySelectorAll(`.fs-extra-table[data-table-id="${tableId}"] .fs-sched-row .fs-sched-cell-data`);
    const last = inputs[inputs.length - 1];
    if (last) last.focus();
  });
}

function deleteExtraScheduleRow(tableId, dayKey, index) {
  const table = (state.fieldServiceExtraTables || []).find(t => t.id === tableId);
  const day = table?.[dayKey];
  if (!day) return;
  day.rows.splice(index, 1);
  saveState();
  if (typeof mirrorScheduleToIdb === 'function') mirrorScheduleToIdb();
  renderFieldServiceExtraTables();
}

function renderFieldServiceExtraTables() {
  const container = document.getElementById('fsExtraTables');
  if (!container) return;

  const tables = Array.isArray(state.fieldServiceExtraTables) ? state.fieldServiceExtraTables : [];

  if (tables.length === 0) {
    container.innerHTML = `<div class="empty-state full-width"><p>Niciun tabel calendar suplimentar. Apasă „🗓️ Tabel Calendar Nou” ca să adaugi unul.</p></div>`;
    return;
  }

  const dayKeys = ['marti', 'vineri', 'sambata'];

  container.innerHTML = tables.map(table => {
    const gridHtml = dayKeys.map(dayKey => {
      const day = table[dayKey];
      if (!day) return '';
      const rowsHtml = day.rows.map((row, i) => `
        <div class="fs-sched-row">
          <input class="fs-sched-cell fs-sched-cell-data" type="text" value="${escHtml(row.data)}"
            oninput="updateExtraScheduleCell('${table.id}', '${dayKey}', ${i}, 'data', this.value)" />
          <input class="fs-sched-cell fs-sched-cell-nume" type="text" value="${escHtml(row.nume)}"
            oninput="updateExtraScheduleCell('${table.id}', '${dayKey}', ${i}, 'nume', this.value)" />
          <button class="fs-sched-del" onclick="deleteExtraScheduleRow('${table.id}', '${dayKey}', ${i})" title="Șterge rândul">✕</button>
        </div>
      `).join('');

      return `
        <div class="fs-sched-table">
          <div class="fs-sched-header">
            <span class="fs-sched-header-label">DATA</span>
            <span class="fs-sched-header-day" style="background:${day.color}">${escHtml(day.label)}</span>
          </div>
          <div class="fs-sched-body">${rowsHtml}</div>
          <button class="fs-sched-add" onclick="addExtraScheduleRow('${table.id}', '${dayKey}')">+ Adaugă rând</button>
        </div>
      `;
    }).join('');

    return `
      <div class="card fs-extra-table" data-table-id="${table.id}" style="margin-bottom:16px">
        <div class="card-header">
          <input type="text" class="form-input" value="${escHtml(table.title || '')}"
            placeholder="Denumire tabel" style="max-width:220px;font-weight:600"
            oninput="renameFieldServiceExtraTable('${table.id}', this.value)" />
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" class="btn-outline btn-sm" onclick="saveFieldServiceScheduleManual()" style="font-size:0.75rem;padding:5px 10px">💾 Salvează</button>
            <button type="button" class="btn-outline btn-sm" onclick="shareFieldServiceScheduleWhatsApp('${table.id}')" style="font-size:0.75rem;padding:5px 10px">📲 Trimite pe WhatsApp</button>
            <button type="button" class="btn-outline btn-sm" onclick="deleteFieldServiceExtraTable('${table.id}')" style="font-size:0.75rem;padding:5px 10px;color:#e53e3e">🗑 Șterge tabel</button>
          </div>
        </div>
        <div class="fs-sched-grid">${gridHtml}</div>
      </div>
    `;
  }).join('');
}

// ============================================
// COLABORATORI (Setări) — folosiți de "Sugerează programul"
// ============================================
const FS_DAY_LABELS = { marti: 'Marți', vineri: 'Vineri', sambata: 'Sâmbătă' };

function renderCollaboratorsSettings() {
  const container = document.getElementById('fsCollaboratorsSettings');
  if (!container) return;

  const list = Array.isArray(state.fieldServiceCollaborators) ? state.fieldServiceCollaborators : [];

  if (list.length === 0) {
    container.innerHTML = `<p class="empty-state-small">Niciun colaborator adăugat încă.</p>`;
    return;
  }

  container.innerHTML = list.map(c => `
    <div class="fs-collab-row">
      <input type="text" class="form-input fs-collab-name" placeholder="Nume colaborator"
        value="${escHtml(c.name || '')}" oninput="updateCollaboratorName('${c.id}', this.value)" />
      <div class="fs-collab-days">
        ${Object.keys(FS_DAY_LABELS).map(dayKey => `
          <label class="fs-collab-day">
            <input type="checkbox" ${Array.isArray(c.days) && c.days.includes(dayKey) ? 'checked' : ''}
              onchange="toggleCollaboratorDay('${c.id}', '${dayKey}')" />
            ${FS_DAY_LABELS[dayKey]}
          </label>
        `).join('')}
      </div>
      <button type="button" class="fs-collab-del" title="Șterge colaborator" onclick="removeCollaborator('${c.id}')">✕</button>
    </div>
  `).join('');
}

function addCollaborator() {
  if (!Array.isArray(state.fieldServiceCollaborators)) state.fieldServiceCollaborators = [];
  state.fieldServiceCollaborators.push({
    id: Date.now().toString(),
    name: '',
    days: ['marti', 'vineri', 'sambata'],
  });
  saveState();
  renderCollaboratorsSettings();
}

function removeCollaborator(id) {
  state.fieldServiceCollaborators = (state.fieldServiceCollaborators || []).filter(c => c.id !== id);
  saveState();
  renderCollaboratorsSettings();
}

function updateCollaboratorName(id, value) {
  const c = (state.fieldServiceCollaborators || []).find(c => c.id === id);
  if (!c) return;
  c.name = value;
  saveState();
}

function toggleCollaboratorDay(id, dayKey) {
  const c = (state.fieldServiceCollaborators || []).find(c => c.id === id);
  if (!c) return;
  if (!Array.isArray(c.days)) c.days = [];
  const idx = c.days.indexOf(dayKey);
  if (idx >= 0) c.days.splice(idx, 1);
  else c.days.push(dayKey);
  saveState();
}

// ============================================
// SUGEREAZĂ PROGRAMUL — propune nume pentru rândurile
// care au dată completată dar nume gol. NU modifică
// tabelul automat; utilizatorul trebuie să apese
// "Aplică sugestia" (sau poate edita propunerea înainte).
// ============================================
let fsCurrentSuggestion = null;

// Încearcă să extragă o dată aproximativă (pentru sortare cronologică)
// dintr-un text liber de forma "28 aprilie" / "7 iul". Întoarce un
// timestamp sau null dacă nu poate fi recunoscută.
function parseRoDateApprox(text) {
  if (!text) return null;
  const months = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
    'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
  const m = text.toLowerCase().match(/(\d{1,2})\s*([a-zăâîșț]+)/i);
  if (!m) return null;

  const day = parseInt(m[1], 10);
  const monthText = m[2];
  const monthIdx = months.findIndex(mo => mo.startsWith(monthText) || monthText.startsWith(mo.slice(0, 3)));
  if (monthIdx === -1 || !day || day < 1 || day > 31) return null;

  const now = new Date();
  let candidate = new Date(now.getFullYear(), monthIdx, day);
  // Dacă data pare cu mult în trecut, presupunem că e vorba de anul următor
  if ((now - candidate) / 86400000 > 200) {
    candidate = new Date(now.getFullYear() + 1, monthIdx, day);
  }
  return candidate.getTime();
}

// Adună toate rândurile cu dată completată dar fără nume, din toate cele
// 3 zile, și le ordonează cronologic (cât se poate deduce din text).
function collectEmptyScheduleSlots() {
  const dayKeys = ['marti', 'vineri', 'sambata'];
  const slots = [];

  dayKeys.forEach(dayKey => {
    const day = state.fieldServiceSchedule?.[dayKey];
    if (!day || !Array.isArray(day.rows)) return;
    day.rows.forEach((row, idx) => {
      if (row.data && row.data.trim() && (!row.nume || !row.nume.trim())) {
        if (isDateInCoWeekRange(row.data)) return; // săptămâna supraveghetorului — nu se sugerează
        slots.push({ dayKey, idx, date: row.data.trim(), parsed: parseRoDateApprox(row.data) });
      }
    });
  });

  slots.sort((a, b) => {
    if (a.parsed != null && b.parsed != null) return a.parsed - b.parsed;
    if (a.parsed != null) return -1;
    if (b.parsed != null) return 1;
    return 0; // ordine stabilă dacă nu se poate deduce data
  });

  return slots;
}

function suggestFieldServiceSchedule() {
  const collaborators = (state.fieldServiceCollaborators || []).filter(c => c.name && c.name.trim());

  if (collaborators.length === 0) {
    showToast('Adaugă mai întâi colaboratori din Setări (⚙️) ca să poți genera o sugestie.', 'error');
    return;
  }

  const slots = collectEmptyScheduleSlots();
  if (slots.length === 0) {
    showToast('Nu există rânduri cu dată completată și nume gol de propus.', 'error');
    return;
  }

  // Baza de echilibrare: câte întruniri are deja asignate fiecare colaborator
  // (numărând rândurile deja completate din tabel).
  const counts = {};
  collaborators.forEach(c => { counts[c.id] = 0; });
  ['marti', 'vineri', 'sambata'].forEach(dayKey => {
    const day = state.fieldServiceSchedule?.[dayKey];
    if (!day || !Array.isArray(day.rows)) return;
    day.rows.forEach(row => {
      if (row.nume && row.nume.trim()) {
        const match = collaborators.find(c => c.name.trim().toLowerCase() === row.nume.trim().toLowerCase());
        if (match) counts[match.id]++;
      }
    });
  });

  const lastFirst = state.fieldServiceScheduleMeta?.lastFirstPerson || null;
  const suggestion = [];

  slots.forEach((slot, i) => {
    let candidates = collaborators.filter(c => Array.isArray(c.days) && c.days.includes(slot.dayKey));

    if (candidates.length === 0) {
      suggestion.push({
        ...slot,
        proposedName: '',
        reason: `Niciun colaborator disponibil ${FS_DAY_LABELS[slot.dayKey]}.`,
      });
      return;
    }

    const reasonParts = [];

    // Regula "nu de două ori primul la rând" se aplică doar primului rând
    // din sugestia curentă (primul din program), comparat cu ultima
    // sugestie APLICATĂ anterior.
    if (i === 0 && lastFirst) {
      const withoutLast = candidates.filter(c => c.name.trim() !== lastFirst);
      if (withoutLast.length > 0) {
        candidates = withoutLast;
        reasonParts.push(`nu a fost ultima dată primul (ultima dată: ${lastFirst})`);
      }
    }

    // Alege colaboratorul cu cele mai puține întruniri asignate până acum
    // (distribuție echilibrată), păstrând ordinea stabilă la egalitate.
    candidates.sort((a, b) => (counts[a.id] || 0) - (counts[b.id] || 0));
    const chosen = candidates[0];
    counts[chosen.id] = (counts[chosen.id] || 0) + 1;

    reasonParts.push(`disponibil ${FS_DAY_LABELS[slot.dayKey].toLowerCase()}`);
    reasonParts.push(`echilibrare sarcini (${counts[chosen.id]} întâlniri asignate)`);

    suggestion.push({ ...slot, proposedName: chosen.name.trim(), reason: reasonParts.join(' · ') });
  });

  fsCurrentSuggestion = suggestion;
  renderFieldServiceSuggestion();
}

function renderFieldServiceSuggestion() {
  const panel = document.getElementById('fsSuggestionPanel');
  if (!panel) return;

  if (!fsCurrentSuggestion || fsCurrentSuggestion.length === 0) {
    panel.style.display = 'none';
    panel.innerHTML = '';
    return;
  }

  panel.style.display = 'block';
  panel.innerHTML = `
    <div class="fs-suggestion-header">
      <span>🧠 Propunere de program</span>
      <span class="fs-suggestion-sub">Verifică și, dacă e nevoie, modifică numele înainte să aplici.</span>
    </div>
    <div class="fs-suggestion-list">
      ${fsCurrentSuggestion.map((item, i) => `
        <div class="fs-suggestion-item">
          <div class="fs-suggestion-meta">
            <span class="fs-suggestion-day">${FS_DAY_LABELS[item.dayKey]}</span>
            <span class="fs-suggestion-date">${escHtml(item.date)}</span>
          </div>
          <input type="text" class="form-input fs-suggestion-name" value="${escHtml(item.proposedName)}"
            placeholder="Nume" oninput="updateSuggestionName(${i}, this.value)" />
          <p class="fs-suggestion-reason">${escHtml(item.reason)}</p>
        </div>
      `).join('')}
    </div>
    <div class="action-row">
      <button class="btn-primary" onclick="applyFieldServiceSuggestion()">✅ Aplică sugestia</button>
      <button class="btn-outline" onclick="cancelFieldServiceSuggestion()">✕ Anulează</button>
    </div>
  `;
}

function updateSuggestionName(index, value) {
  if (fsCurrentSuggestion && fsCurrentSuggestion[index]) {
    fsCurrentSuggestion[index].proposedName = value;
  }
}

function applyFieldServiceSuggestion() {
  if (!fsCurrentSuggestion || fsCurrentSuggestion.length === 0) return;

  fsCurrentSuggestion.forEach(item => {
    if (!item.proposedName || !item.proposedName.trim()) return; // rând lăsat necompletat, nu se atinge
    const row = state.fieldServiceSchedule?.[item.dayKey]?.rows?.[item.idx];
    if (row) row.nume = item.proposedName.trim();
  });

  // Ține minte cine a fost primul, ca următoarea sugestie să înceapă cu altcineva
  const first = fsCurrentSuggestion[0];
  if (first && first.proposedName && first.proposedName.trim()) {
    if (!state.fieldServiceScheduleMeta) state.fieldServiceScheduleMeta = {};
    state.fieldServiceScheduleMeta.lastFirstPerson = first.proposedName.trim();
  }

  saveState();
  if (typeof mirrorScheduleToIdb === 'function') mirrorScheduleToIdb();

  fsCurrentSuggestion = null;
  renderFieldServiceSchedule();
  renderFieldServiceSuggestion();
  showToast('Programul sugerat a fost aplicat! ✅', 'success');
}

function cancelFieldServiceSuggestion() {
  fsCurrentSuggestion = null;
  renderFieldServiceSuggestion();
}

// ============================================
