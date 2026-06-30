/* ============================================
   StudiuMeu – NOTIȚE, ÎNTRUNIRI, SERVICIU DE TEREN & CĂUTARE
   Gestionează notițele, ștergerea, căutarea globală,
   serviciul de teren și calendarul de întruniri.
   Depinde de: storage.js, utils.js, nav.js
   ============================================ */

'use strict';

// ============================================
// NOTIȚE – MODAL
// ============================================
let editingNoteId    = null;
let activeNotesFilter= 'all';

function openNewNoteModal() {
  editingNoteId = null;
  document.getElementById('noteModalTitle').textContent = 'Notiță Nouă';
  document.getElementById('noteTitle').value   = '';
  document.getElementById('noteContent').value = '';
  document.getElementById('noteTags').value    = '';
  document.getElementById('noteCategory').value= 'general';
  const deleteBtn = document.getElementById('deleteNoteBtn');
  if (deleteBtn) deleteBtn.style.display = 'none';
  document.getElementById('noteModal').classList.add('open');
}

function openNoteCard(id) {
  const note = state.notes.find(n => n.id === id);
  if (!note) return;
  editingNoteId = id;
  document.getElementById('noteModalTitle').textContent = 'Editează Notița';
  document.getElementById('noteTitle').value    = note.title;
  document.getElementById('noteContent').value  = note.content;
  document.getElementById('noteTags').value     = (note.tags || []).join(', ');
  document.getElementById('noteCategory').value = note.category || 'general';
  const deleteBtn = document.getElementById('deleteNoteBtn');
  if (deleteBtn) deleteBtn.style.display = 'inline-flex';
  document.getElementById('noteModal').classList.add('open');
}

function closeNoteModal() {
  document.getElementById('noteModal').classList.remove('open');
  editingNoteId = null;
}

function saveNote() {
  const title   = document.getElementById('noteTitle')?.value?.trim();
  const content = document.getElementById('noteContent')?.value?.trim();
  if (!title) { showToast('Adaugă un titlu pentru notiță.', 'error'); return; }

  const tags = document.getElementById('noteTags')?.value
    .split(',').map(t => t.trim()).filter(Boolean) || [];

  if (editingNoteId) {
    const idx = state.notes.findIndex(n => n.id === editingNoteId);
    if (idx !== -1) {
      state.notes[idx] = {
        ...state.notes[idx], title, content, tags,
        category: document.getElementById('noteCategory')?.value || 'general',
      };
    }
    showToast('Notiță actualizată! ✅', 'success');
  } else {
    state.notes.push({
      id:       Date.now().toString(),
      title, content, tags,
      category: document.getElementById('noteCategory')?.value || 'general',
      date:     new Date().toISOString().split('T')[0],
    });
    showToast('Notiță salvată! ✅', 'success');
  }

  markStudyDay();
  saveState();
  closeNoteModal();
  renderNotesList();
  if (currentPage === 'fieldservice') renderFieldServiceList();
}

function deleteCurrentNote() {
  if (!editingNoteId) return;
  if (confirm('Ștergi această notiță definitiv?')) {
    if (editingNoteId.endsWith('_wt')) {
      const studyId = editingNoteId.replace('_wt', '');
      state.wtStudies = state.wtStudies.filter(s => s.id !== studyId);
    } else if (editingNoteId.endsWith('_wb')) {
      const wbId = editingNoteId.replace('_wb', '');
      state.workbooks = state.workbooks.filter(w => w.id !== wbId);
    }
    state.notes = state.notes.filter(n => n.id !== editingNoteId);
    saveState();
    closeNoteModal();
    renderNotesList();
    renderDashboard();
    showToast('Notiță ștearsă. 🗑', 'success');
  }
}

// ============================================
// NOTIȚE – LISTA
// ============================================
function renderNotesList(filter) {
  if (filter !== undefined) activeNotesFilter = filter;
  const container = document.getElementById('notesList');
  if (!container) return;

  document.querySelectorAll('#notesFilters .filter-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === activeNotesFilter);
  });

  const filtered = activeNotesFilter === 'all'
    ? state.notes
    : state.notes.filter(n => n.category === activeNotesFilter);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state full-width">
        <svg viewBox="0 0 24 24" width="56" height="56" opacity=".25"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
        <p>Nicio notiță în această categorie.</p>
        <button class="btn-primary" onclick="openNewNoteModal()" style="margin-top:12px">Creează o Notiță</button>
      </div>`;
    return;
  }

  const catColors  = { watchtower:'#4f8ef7', workbook:'#10c9a0', bible:'#a855f7', general:'#f97b4f', fieldservice:'#ec4899' };
  const catLabels  = { watchtower:'🗼 TV', workbook:'📋 VCP', bible:'📖 Biblie', general:'📝 General', fieldservice:'🚗 Serviciu' };
  const sorted     = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  container.innerHTML = sorted.map(note => `
    <div class="note-card" onclick="openNoteCard('${note.id}')">
      <div class="note-card-header">
        <span class="note-card-title">${escHtml(note.title)}</span>
        <span class="badge" style="background:${catColors[note.category]}22;color:${catColors[note.category]};flex-shrink:0">
          ${catLabels[note.category] || '📝'}
        </span>
      </div>
      <p class="note-card-body">${escHtml(note.content || 'Fără conținut')}</p>
      <div class="note-card-footer">
        <span class="note-card-date">${formatDate(note.date)}</span>
        <div class="note-tags">
          ${(note.tags || []).slice(0, 3).map(t => `<span class="note-tag">#${escHtml(t)}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

// ============================================
// TEXTUL ANULUI
// ============================================
let yearTextColor = '#e6edf3';
let yearFontSize  = 14;

function buildSizeButtons() {
  const container = document.getElementById('yearSizeButtons');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 1; i <= 24; i++) {
    const btn = document.createElement('button');
    btn.textContent    = i;
    btn.className      = 'size-btn' + (i === yearFontSize ? ' active' : '');
    btn.dataset.size   = i;
    btn.onclick        = () => selectYearSize(btn);
    container.appendChild(btn);
  }
}

function selectYearSize(btn) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  yearFontSize = parseInt(btn.dataset.size);
  const input  = document.getElementById('yearTextInput');
  if (input) input.style.fontSize = yearFontSize + 'px';
}

function loadYearText() {
  const saved      = localStorage.getItem('studiuMeu_yearText');
  const savedColor = localStorage.getItem('studiuMeu_yearColor') || '#e6edf3';
  const savedSize  = parseInt(localStorage.getItem('studiuMeu_yearSize')) || 14;
  yearTextColor    = savedColor;
  yearFontSize     = savedSize;
  const display    = document.getElementById('yearTextDisplay');
  const actions    = document.getElementById('yearTextActions');
  if (display) {
    if (saved) {
      display.textContent       = saved;
      display.style.fontStyle   = 'normal';
      display.style.opacity     = '1';
      display.style.color       = savedColor;
      display.style.fontSize    = savedSize + 'px';
      if (actions) actions.style.display = 'flex';
    } else {
      display.textContent       = 'Apasă pentru a adăuga textul anului...';
      display.style.fontStyle   = 'italic';
      display.style.opacity     = '0.5';
      display.style.color       = '';
      display.style.fontSize    = '';
      if (actions) actions.style.display = 'none';
    }
  }
}

function openYearTextEdit() {
  const editDiv   = document.getElementById('yearTextEdit');
  const displayP  = document.getElementById('yearTextDisplay');
  const input     = document.getElementById('yearTextInput');
  if (!editDiv || !displayP || !input) return;
  const saved      = localStorage.getItem('studiuMeu_yearText') || '';
  const savedColor = localStorage.getItem('studiuMeu_yearColor') || '#e6edf3';
  const savedSize  = parseInt(localStorage.getItem('studiuMeu_yearSize')) || 14;
  input.value              = saved;
  input.style.fontSize     = savedSize + 'px';
  yearTextColor            = savedColor;
  yearFontSize             = savedSize;
  document.querySelectorAll('.color-swatch').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === savedColor);
  });
  buildSizeButtons();
  editDiv.style.display    = 'block';
  displayP.style.display   = 'none';
  document.getElementById('yearTextActions').style.display = 'none';
  input.focus();
}

function toggleYearTextEdit() {
  const saved = localStorage.getItem('studiuMeu_yearText');
  if (saved) return;
  openYearTextEdit();
}

function selectYearColor(btn) {
  document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  yearTextColor = btn.dataset.color;
}

function saveYearText() {
  const input = document.getElementById('yearTextInput');
  const text  = input?.value?.trim();
  if (text) {
    localStorage.setItem('studiuMeu_yearText',  text);
    localStorage.setItem('studiuMeu_yearColor', yearTextColor);
    localStorage.setItem('studiuMeu_yearSize',  yearFontSize);
  } else {
    localStorage.removeItem('studiuMeu_yearText');
    localStorage.removeItem('studiuMeu_yearColor');
    localStorage.removeItem('studiuMeu_yearSize');
  }
  document.getElementById('yearTextEdit').style.display    = 'none';
  document.getElementById('yearTextDisplay').style.display = 'block';
  loadYearText();
  showToast('Textul anului salvat! ✨', 'success');
}

function deleteYearText() {
  if (confirm('Ștergi textul anului? (De obicei se schimbă o dată pe an)')) {
    localStorage.removeItem('studiuMeu_yearText');
    localStorage.removeItem('studiuMeu_yearColor');
    localStorage.removeItem('studiuMeu_yearSize');
    document.getElementById('yearTextEdit').style.display    = 'none';
    document.getElementById('yearTextDisplay').style.display = 'block';
    loadYearText();
    showToast('Textul anului șters.', 'success');
  }
}

function cancelYearText() {
  document.getElementById('yearTextEdit').style.display    = 'none';
  document.getElementById('yearTextDisplay').style.display = 'block';
  const saved = localStorage.getItem('studiuMeu_yearText');
  if (saved) document.getElementById('yearTextActions').style.display = 'flex';
}

// ============================================
// SERVICIU DE TEREN
// ============================================
function saveFieldServiceNote() {
  const fsDate    = document.getElementById('fs-date')?.value || new Date().toISOString().split('T')[0];
  const fsTitle   = document.getElementById('fs-title')?.value?.trim();
  const fsContent = document.getElementById('fs-content')?.value?.trim();

  if (!fsTitle) {
    showToast('Adaugă un titlu sau subiect pentru întrunire.', 'error');
    document.getElementById('fs-title')?.focus();
    return;
  }

  state.notes.push({
    id:       Date.now().toString(),
    title:    fsTitle,
    content:  fsContent || 'Fără conținut',
    category: 'fieldservice',
    tags:     ['serviciu-teren'],
    date:     fsDate,
  });
  markStudyDay();
  saveState();
  showToast('Notiță serviciu de teren salvată! 🚗', 'success');

  const titleInput   = document.getElementById('fs-title');
  const contentInput = document.getElementById('fs-content');
  if (titleInput)   titleInput.value   = '';
  if (contentInput) contentInput.value = '';

  renderFieldServiceList();
}

function renderFieldServiceList() {
  const container = document.getElementById('fsNotesList');
  if (!container) return;

  const filtered = state.notes.filter(n => n.category === 'fieldservice');
  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state full-width"><p>Nicio notiță de serviciu de teren salvată încă.</p></div>`;
    return;
  }

  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
  container.innerHTML = sorted.map(note => `
    <div class="note-card" onclick="openNoteCard('${note.id}')">
      <div class="note-card-header">
        <span class="note-card-title">${escHtml(note.title)}</span>
        <span class="badge" style="background:#ec489922;color:#ec4899;flex-shrink:0">🚗 Serviciu</span>
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
// ÎNTRUNIRI (CALENDAR)
// ============================================
function addMeetingEntry() {
  const name = prompt('Tipul întrunirii (ex: Turnul de Veghe, Viața creștină și predicarea):');
  if (!name) return;
  const date = prompt('Data (YYYY-MM-DD):') || new Date().toISOString().split('T')[0];

  state.meetings.push({ id: Date.now().toString(), name, date, progress: 0 });
  saveState();
  renderMeetings();
  showToast('Întrunire adăugată! 📅', 'success');
}

function renderMeetings() {
  const container = document.getElementById('meetingsCalendar');
  if (!container) return;

  const lastWt = state.wtStudies[state.wtStudies.length - 1];
  const lastWb = state.workbooks[state.workbooks.length - 1];

  const wpEl  = document.getElementById('weekendProgress');
  const wpBar = document.getElementById('weekendProgressBar');
  const prog1 = lastWt?.progress || 0;
  if (wpEl)  wpEl.textContent    = `${prog1}%`;
  if (wpBar) wpBar.style.width   = `${prog1}%`;

  const wdEl  = document.getElementById('weekdayProgress');
  const wdBar = document.getElementById('weekdayProgressBar');
  const prog2 = lastWb?.progress || 0;
  if (wdEl)  wdEl.textContent    = `${prog2}%`;
  if (wdBar) wdBar.style.width   = `${prog2}%`;

  if (state.meetings.length === 0) {
    container.innerHTML = '<div class="empty-state-small">Nicio întrunire planificată. Apasă „+ Adaugă Întrunire".</div>';
    return;
  }

  const sorted = [...state.meetings].sort((a, b) => new Date(a.date) - new Date(b.date));
  container.innerHTML = sorted.map(m => `
    <div class="meeting-calendar-item">
      <span class="meeting-cal-date">${formatDate(m.date)}</span>
      <span class="meeting-cal-name">${escHtml(m.name)}</span>
      <span class="meeting-cal-progress">${m.progress}%</span>
      <button class="delete-btn" onclick="deleteMeeting('${m.id}')">🗑</button>
    </div>
  `).join('');
}

function deleteMeeting(id) {
  state.meetings = state.meetings.filter(m => m.id !== id);
  saveState();
  renderMeetings();
}

// ============================================
// STREAK
// ============================================
function markStudyDay() {
  const today = new Date().toDateString();
  if (state.lastStudyDate !== today) {
    state.streak = (state.lastStudyDate === new Date(Date.now() - 86400000).toDateString())
      ? state.streak + 1
      : 1;
    state.lastStudyDate = today;
  }
}

// ============================================
// BUTON RAPID (+ din header)
// ============================================
function handleQuickAdd() {
  switch (currentPage) {
    case 'watchtower':   addWtParagraph();                                      break;
    case 'notes':        openNewNoteModal();                                    break;
    case 'fieldservice': document.getElementById('fs-title')?.focus();         break;
    case 'bible':        document.getElementById('verse-ref-input')?.focus();  break;
    case 'meetings':     addMeetingEntry();                                     break;
    default:             openNewNoteModal();
  }
}

// ============================================
// CĂUTARE GLOBALĂ
// ============================================
function handleSearch(query) {
  if (!query.trim()) return;
  query = query.toLowerCase();
  navigateTo('notes');
  const filtered = state.notes.filter(n =>
    n.title?.toLowerCase().includes(query) ||
    n.content?.toLowerCase().includes(query) ||
    (n.tags || []).some(t => t.toLowerCase().includes(query))
  );
  renderSearchResults(filtered, query);
}

function renderSearchResults(results, query) {
  const container = document.getElementById('notesList');
  if (!container) return;

  if (results.length === 0) {
    container.innerHTML = `<div class="empty-state full-width"><p>Niciun rezultat pentru „${escHtml(query)}".</p></div>`;
    return;
  }

  const catColors = { watchtower:'#4f8ef7', workbook:'#10c9a0', bible:'#a855f7', general:'#f97b4f' };
  container.innerHTML = results.map(note => `
    <div class="note-card" onclick="openNoteCard('${note.id}')">
      <div class="note-card-header">
        <span class="note-card-title">${highlight(note.title, query)}</span>
      </div>
      <p class="note-card-body">${highlight(note.content || '', query)}</p>
      <div class="note-card-footer">
        <span class="note-card-date">${formatDate(note.date)}</span>
      </div>
    </div>
  `).join('');
}

function highlight(text, query) {
  if (!query || !text) return escHtml(text || '');
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escHtml(text).replace(regex, '<mark style="background:var(--accent-glow);color:var(--accent);border-radius:2px">$1</mark>');
}

// ============================================
// TEMĂ LUMINOS / ÎNTUNECAT
// ============================================
function toggleTheme() {
  const html   = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('studiuMeu_theme', isDark ? 'light' : 'dark');
  document.getElementById('themeLabel').textContent = isDark ? 'Mod Întunecat' : 'Mod Luminos';
}

function loadTheme() {
  const saved = localStorage.getItem('studiuMeu_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('themeLabel').textContent = saved === 'dark' ? 'Mod Luminos' : 'Mod Întunecat';
}
