'use strict';

// ============================================
// PROGRAMARE DE IEȘIRE CU STANDUL
// Tabel în care fiecare vestitor își programează propriile ieșiri cu standul.
// Fiecare rând = { id, date (yyyy-mm-dd), time (hh:mm), vestitor, coleg }.
// Structură identică cu fieldScheduling.js (programarea de ieșire pe teren),
// dar cu propriul state (state.standSchedulingRows) și propriul tabel
// (#standTableBody), ca cele două programări să rămână independente.
//
// Depinde de: state.standSchedulingRows (storage.js), saveState(),
// escHtml() / showToast() (utils.js).
// ============================================

const STAND_MONTHS = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
];

function defaultStandSchedulingRow() {
  return { id: Date.now().toString() + Math.random().toString(36).slice(2, 6), date: '', time: '', vestitor: '', coleg: '' };
}

// Descompune un string yyyy-mm-dd în { ziua, luna, anul } pentru afișare.
function standDateParts(dateStr) {
  if (!dateStr) return { ziua: '', luna: '', anul: '' };
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return { ziua: '', luna: '', anul: '' };
  return { ziua: String(d), luna: STAND_MONTHS[m - 1] || '', anul: String(y) };
}

// Caută, printre celelalte rânduri salvate, o programare anterioară cu
// aceeași pereche vestitor + coleg (comparație fără spații/majuscule,
// nesensibilă la ordine). Întoarce rândul găsit sau null.
function standFindPairMatch(vestitor, coleg, excludeId) {
  const v = (vestitor || '').trim().toLowerCase();
  const c = (coleg || '').trim().toLowerCase();
  if (!v || !c) return null;

  const rows = Array.isArray(state.standSchedulingRows) ? state.standSchedulingRows : [];
  return rows.find(r => {
    if (r.id === excludeId) return false;
    const rv = (r.vestitor || '').trim().toLowerCase();
    const rc = (r.coleg || '').trim().toLowerCase();
    if (!rv || !rc) return false;
    return (rv === v && rc === c) || (rv === c && rc === v);
  }) || null;
}

function addStandSchedulingRow() {
  if (!Array.isArray(state.standSchedulingRows)) state.standSchedulingRows = [];
  state.standSchedulingRows.push(defaultStandSchedulingRow());
  saveState();
  renderStandSchedulingTable();
  requestAnimationFrame(() => {
    const inputs = document.querySelectorAll('#standTableBody .fs2-cell-date');
    const last = inputs[inputs.length - 1];
    if (last) last.focus();
  });
}

function updateStandSchedulingCell(id, field, value) {
  const row = (state.standSchedulingRows || []).find(r => r.id === id);
  if (!row) return;
  row[field] = value;
  saveState();
  renderStandSchedulingTable();
}

// Salvează valoarea la fiecare literă tastată, fără să redeseneze tabelul
// (redesenarea ar scoate cursorul din câmp). Redesenarea are loc la blur.
function updateStandSchedulingCellSilent(id, field, value) {
  const row = (state.standSchedulingRows || []).find(r => r.id === id);
  if (!row) return;
  row[field] = value;
  saveState();
}

function deleteStandSchedulingRow(id) {
  if (!confirm('Ștergi această programare?')) return;
  state.standSchedulingRows = (state.standSchedulingRows || []).filter(r => r.id !== id);
  saveState();
  renderStandSchedulingTable();
  showToast('Programare ștearsă.', 'success');
}

function saveStandSchedulingTable() {
  saveState();
  showToast('Programare salvată! 💾', 'success');
}

// ============================================
// TRIMITE PE WHATSAPP
// ============================================
function shareStandSchedulingWhatsApp() {
  const rows = Array.isArray(state.standSchedulingRows) ? state.standSchedulingRows : [];
  const filled = rows.filter(r => r.date || r.vestitor || r.coleg);

  if (filled.length === 0) {
    showToast('Nu există nicio programare de trimis.', 'error');
    return;
  }

  const sorted = [...filled].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const parts = ['*Programare de ieșire cu standul*'];
  sorted.forEach(r => {
    const { ziua, luna, anul } = standDateParts(r.date);
    const dataText = ziua ? `${ziua} ${luna} ${anul}` : '—';
    const oraText = r.time && r.time.trim() ? ` ora ${r.time.trim()}` : '';
    const vestitor = r.vestitor && r.vestitor.trim() ? r.vestitor.trim() : '—';
    const coleg = r.coleg && r.coleg.trim() ? r.coleg.trim() : '—';
    parts.push(`• ${dataText}${oraText}: ${vestitor} + ${coleg}`);
  });

  const text = parts.join('\n');
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

// ============================================
// RANDARE
// ============================================
function renderStandSchedulingTable() {
  const container = document.getElementById('standTableBody');
  if (!container) return;

  if (!Array.isArray(state.standSchedulingRows)) state.standSchedulingRows = [];
  const rows = state.standSchedulingRows;

  if (rows.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="8" class="fs2-empty">Nicio programare încă. Apasă „+ Adaugă programare”.</td>
      </tr>`;
    return;
  }

  container.innerHTML = rows.map(row => {
    const { ziua, luna, anul } = standDateParts(row.date);
    const match = standFindPairMatch(row.vestitor, row.coleg, row.id);
    const warningRow = match ? `
      <tr class="fs2-warning-row">
        <td colspan="8">
          ⚠️ ${escHtml((row.vestitor || '').trim())} a mai fost programat cu ${escHtml((row.coleg || '').trim())}
          ${match.date ? `pe ${escHtml(standDateParts(match.date).ziua)} ${escHtml(standDateParts(match.date).luna)} ${escHtml(standDateParts(match.date).anul)}` : 'anterior'}.
          Alege alt coleg data aceasta, dacă se poate.
        </td>
      </tr>` : '';

    return `
      <tr class="fs2-row${match ? ' fs2-row-flagged' : ''}">
        <td class="fs2-cell fs2-cell-date-wrap">
          <input type="date" class="fs2-cell-input fs2-cell-date" value="${escHtml(row.date || '')}"
            onchange="updateStandSchedulingCell('${row.id}', 'date', this.value)" />
        </td>
        <td class="fs2-cell fs2-cell-part">${ziua || '—'}</td>
        <td class="fs2-cell fs2-cell-part">${luna || '—'}</td>
        <td class="fs2-cell fs2-cell-part">${anul || '—'}</td>
        <td class="fs2-cell fs2-cell-time-wrap">
          <input type="time" class="fs2-cell-input fs2-cell-time" value="${escHtml(row.time || '')}"
            onchange="updateStandSchedulingCell('${row.id}', 'time', this.value)" />
        </td>
        <td class="fs2-cell">
          <input type="text" class="fs2-cell-input" placeholder="Nume vestitor" value="${escHtml(row.vestitor || '')}"
            oninput="updateStandSchedulingCellSilent('${row.id}', 'vestitor', this.value)"
            onblur="renderStandSchedulingTable()" />
        </td>
        <td class="fs2-cell">
          <input type="text" class="fs2-cell-input" placeholder="Nume vestitor colaborator" value="${escHtml(row.coleg || '')}"
            oninput="updateStandSchedulingCellSilent('${row.id}', 'coleg', this.value)"
            onblur="renderStandSchedulingTable()" />
        </td>
        <td class="fs2-cell fs2-cell-del">
          <button class="fs-sched-del" onclick="deleteStandSchedulingRow('${row.id}')" title="Șterge programarea">✕</button>
        </td>
      </tr>
      ${warningRow}
    `;
  }).join('');
}
