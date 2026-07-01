'use strict';

// ============================================
// NOTES
// ============================================
let editingNoteId = null;
let activeNotesFilter = 'all';

function openNewNoteModal() {
  editingNoteId = null;
  document.getElementById('noteModalTitle').textContent = 'Notiță Nouă';
  document.getElementById('noteTitle').value = '';
  document.getElementById('noteContent').value = '';
  document.getElementById('noteTags').value = '';
  document.getElementById('noteCategory').value = 'general';
  const deleteBtn = document.getElementById('deleteNoteBtn');
  if (deleteBtn) deleteBtn.style.display = 'none';
  document.getElementById('noteModal').classList.add('open');
}

function openNoteCard(id) {
  const note = state.notes.find(n => n.id === id);
  if (!note) return;
  editingNoteId = id;
  document.getElementById('noteModalTitle').textContent = 'Editează Notița';
  document.getElementById('noteTitle').value = note.title;
  document.getElementById('noteContent').value = note.content;
  document.getElementById('noteTags').value = (note.tags || []).join(', ');
  document.getElementById('noteCategory').value = note.category || 'general';
  const deleteBtn = document.getElementById('deleteNoteBtn');
  if (deleteBtn) deleteBtn.style.display = 'inline-flex';
  document.getElementById('noteModal').classList.add('open');
}

function deleteCurrentNote() {
  if (!editingNoteId) return;
  if (confirm('Ștergi această notiță definitiv?')) {
    // Check if it's linked to a watchtower study or workbook and delete it too
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
// ============================================
// TEXTUL ANULUI
// ============================================
let yearTextColor = '#e6edf3';
let yearFontSize = 14;

// Generează butoanele 1-24 pentru mărime font
function buildSizeButtons() {
  const container = document.getElementById('yearSizeButtons');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 1; i <= 24; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = 'size-btn' + (i === yearFontSize ? ' active' : '');
    btn.dataset.size = i;
    btn.onclick = () => selectYearSize(btn);
    container.appendChild(btn);
  }
}

function selectYearSize(btn) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  yearFontSize = parseInt(btn.dataset.size);
  // Previzualizare live în textarea
  const input = document.getElementById('yearTextInput');
  if (input) input.style.fontSize = yearFontSize + 'px';
}

function loadYearText() {
  const saved = localStorage.getItem('studiuMeu_yearText');
  const savedColor = localStorage.getItem('studiuMeu_yearColor') || '#e6edf3';
  const savedSize = parseInt(localStorage.getItem('studiuMeu_yearSize')) || 14;
  yearTextColor = savedColor;
  yearFontSize = savedSize;
  const display = document.getElementById('yearTextDisplay');
  const actions = document.getElementById('yearTextActions');
  if (display) {
    if (saved) {
      display.textContent = saved;
      display.style.fontStyle = 'normal';
      display.style.opacity = '1';
      display.style.color = savedColor;
      display.style.fontSize = savedSize + 'px';
      if (actions) actions.style.display = 'flex';
    } else {
      display.textContent = 'Apasă pentru a adăuga textul anului...';
      display.style.fontStyle = 'italic';
      display.style.opacity = '0.5';
      display.style.color = '';
      display.style.fontSize = '';
      if (actions) actions.style.display = 'none';
    }
  }
}

function openYearTextEdit() {
  const editDiv = document.getElementById('yearTextEdit');
  const displayP = document.getElementById('yearTextDisplay');
  const input = document.getElementById('yearTextInput');
  if (!editDiv || !displayP || !input) return;
  const saved = localStorage.getItem('studiuMeu_yearText') || '';
  const savedColor = localStorage.getItem('studiuMeu_yearColor') || '#e6edf3';
  const savedSize = parseInt(localStorage.getItem('studiuMeu_yearSize')) || 14;
  input.value = saved;
  input.style.fontSize = savedSize + 'px';
  yearTextColor = savedColor;
  yearFontSize = savedSize;
  document.querySelectorAll('.color-swatch').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === savedColor);
  });
  buildSizeButtons();
  editDiv.style.display = 'block';
  displayP.style.display = 'none';
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
  const text = input?.value?.trim();
  if (text) {
    localStorage.setItem('studiuMeu_yearText', text);
    localStorage.setItem('studiuMeu_yearColor', yearTextColor);
    localStorage.setItem('studiuMeu_yearSize', yearFontSize);
  } else {
    localStorage.removeItem('studiuMeu_yearText');
    localStorage.removeItem('studiuMeu_yearColor');
    localStorage.removeItem('studiuMeu_yearSize');
  }
  document.getElementById('yearTextEdit').style.display = 'none';
  document.getElementById('yearTextDisplay').style.display = 'block';
  loadYearText();
  showToast('Textul anului salvat! ✨', 'success');
}

function deleteYearText() {
  if (confirm('Ștergi textul anului? (De obicei se schimbă o dată pe an)')) {
    localStorage.removeItem('studiuMeu_yearText');
    localStorage.removeItem('studiuMeu_yearColor');
    localStorage.removeItem('studiuMeu_yearSize');
    document.getElementById('yearTextEdit').style.display = 'none';
    document.getElementById('yearTextDisplay').style.display = 'block';
    loadYearText();
    showToast('Textul anului șters.', 'success');
  }
}

function cancelYearText() {
  document.getElementById('yearTextEdit').style.display = 'none';
  document.getElementById('yearTextDisplay').style.display = 'block';
  const saved = localStorage.getItem('studiuMeu_yearText');
  if (saved) {
    document.getElementById('yearTextActions').style.display = 'flex';
  }
}

function closeNoteModal() {
  document.getElementById('noteModal').classList.remove('open');
  editingNoteId = null;
}

function saveNote() {
  const title = document.getElementById('noteTitle')?.value?.trim();
  const content = document.getElementById('noteContent')?.value?.trim();
  if (!title) {
    showToast('Adaugă un titlu pentru notiță.', 'error');
    return;
  }

  const tags = document.getElementById('noteTags')?.value
    .split(',').map(t => t.trim()).filter(Boolean) || [];

  if (editingNoteId) {
    const idx = state.notes.findIndex(n => n.id === editingNoteId);
    if (idx !== -1) {
      state.notes[idx] = { ...state.notes[idx], title, content, tags,
        category: document.getElementById('noteCategory')?.value || 'general' };
    }
    showToast('Notiță actualizată! ✅', 'success');
  } else {
    state.notes.push({
      id: Date.now().toString(),
      title, content, tags,
      category: document.getElementById('noteCategory')?.value || 'general',
      date: new Date().toISOString().split('T')[0],
    });
    showToast('Notiță salvată! ✅', 'success');
  }

  markStudyDay();
  saveState();
  closeNoteModal();
  renderNotesList();
  if (currentPage === 'fieldservice') {
    renderFieldServiceList();
  }
}

function renderNotesList(filter) {
  if (filter !== undefined) activeNotesFilter = filter;

  const container = document.getElementById('notesList');
  if (!container) return;

  // Update filter tabs
  document.querySelectorAll('#notesFilters .filter-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === activeNotesFilter);
  });

  const filtered = activeNotesFilter === 'all' ? state.notes :
    state.notes.filter(n => n.category === activeNotesFilter);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state full-width">
        <svg viewBox="0 0 24 24" width="56" height="56" opacity=".25"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
        <p>Nicio notiță în această categorie.</p>
        <button class="btn-primary" onclick="openNewNoteModal()" style="margin-top:12px">Creează o Notiță</button>
      </div>`;
    return;
  }

  const catColors = { watchtower:'#4f8ef7', workbook:'#10c9a0', bible:'#a855f7', general:'#f97b4f', fieldservice:'#ec4899' };
  const catLabels = { watchtower:'🗼 TV', workbook:'📋 VCP', bible:'📖 Biblie', general:'📝 General', fieldservice:'🚗 Serviciu' };

  const sorted = [...filtered].sort((a,b) => new Date(b.date) - new Date(a.date));

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
          ${(note.tags || []).slice(0,3).map(t => `<span class="note-tag">#${escHtml(t)}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

// ============================================
