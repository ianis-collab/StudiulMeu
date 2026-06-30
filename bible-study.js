/* ============================================
   StudiuMeu – STUDIU BIBLIC PERSONAL & CITITOR BIBLIE
   Gestionează versete salvate, profeții și cititorul
   Bibliei cu notițe pe capitole.
   Depinde de: storage.js, utils.js
   ============================================ */

'use strict';

// ============================================
// VERSETE SALVATE
// ============================================
function addVerseEntry() {
  saveVerse();
}

function saveVerse() {
  const ref  = document.getElementById('verse-ref-input')?.value?.trim();
  const text = document.getElementById('verse-text-input')?.value?.trim();

  if (!ref) {
    showToast('Adaugă referința biblică.', 'error');
    document.getElementById('verse-ref-input')?.focus();
    return;
  }

  const verse = {
    id:         Date.now().toString(),
    ref,
    text,
    category:   document.getElementById('verse-category')?.value || 'Altele',
    meditation: document.getElementById('verse-meditation')?.value?.trim() || '',
    date:       new Date().toISOString().split('T')[0],
  };

  state.verses.push(verse);
  markStudyDay();
  saveState();
  showToast('Verset salvat! 📖', 'success');

  ['verse-ref-input', 'verse-text-input', 'verse-meditation'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  renderVersesList('all');
}

let activeVerseFilter = 'all';

function renderVersesList(filter) {
  activeVerseFilter = filter;
  const container   = document.getElementById('versesList');
  if (!container) return;

  document.querySelectorAll('#verseFilters .filter-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  const filtered = filter === 'all'
    ? state.verses
    : state.verses.filter(v => v.category === filter);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48" opacity=".3"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
        <p>Niciun verset în această categorie.</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(v => `
    <div class="verse-entry">
      <div class="verse-entry-header">
        <span class="verse-entry-ref">📖 ${escHtml(v.ref)}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="verse-entry-cat">${escHtml(v.category)}</span>
          <button class="delete-btn" onclick="deleteVerse('${v.id}')" title="Șterge">🗑</button>
        </div>
      </div>
      ${v.text      ? `<p class="verse-entry-text">"${escHtml(v.text)}"</p>` : ''}
      ${v.meditation? `<p class="verse-entry-meditation">💭 ${escHtml(v.meditation)}</p>` : ''}
      <small style="color:var(--text-muted);font-size:0.75rem">${formatDate(v.date)}</small>
    </div>
  `).join('');
}

function deleteVerse(id) {
  if (confirm('Ștergi acest verset?')) {
    state.verses = state.verses.filter(v => v.id !== id);
    saveState();
    renderVersesList(activeVerseFilter);
    showToast('Verset șters.', 'success');
  }
}

// ============================================
// PROFEȚII ȘI ÎMPLINIREA LOR
// ============================================
function addProphecy() {
  const newProphecy = { id: Date.now().toString(), text: '', year: '', fulfillment: '', reference: '' };
  state.prophecies.push(newProphecy);
  saveState();
  renderProphecies();
  setTimeout(() => editProphecy(newProphecy.id), 100);
}

function deleteProphecy(id) {
  if (!confirm('Ștergi această profeție?')) return;
  state.prophecies = state.prophecies.filter(p => p.id !== id);
  saveState();
  renderProphecies();
  showToast('Profeția a fost ștearsă.', 'success');
}

function editProphecy(id) {
  const row = document.querySelector(`tr[data-prophecy-id="${id}"]`);
  if (!row) return;
  const prophecy = state.prophecies.find(p => p.id === id);
  if (!prophecy) return;

  row.classList.add('editing');
  const cells = row.querySelectorAll('td');
  cells[0].innerHTML = `<textarea class="prophecy-input-text">${escHtml(prophecy.text)}</textarea>`;
  cells[1].innerHTML = `<input type="text" class="prophecy-input-year" value="${escHtml(prophecy.year)}" placeholder="ex: 607 î.e.n." />`;
  cells[2].innerHTML = `<textarea class="prophecy-input-fulfillment">${escHtml(prophecy.fulfillment)}</textarea>`;
  cells[3].innerHTML = `<input type="text" class="prophecy-input-reference" value="${escHtml(prophecy.reference)}" placeholder="ex: Daniel 4:17" />`;
  cells[4].innerHTML = `
    <div class="edit-actions">
      <button class="save-edit" onclick="saveProphecyEdit('${id}')">💾 Salvează</button>
      <button class="cancel-edit" onclick="cancelProphecyEdit('${id}')">✕</button>
    </div>
  `;
  const firstInput = row.querySelector('textarea, input');
  if (firstInput) firstInput.focus();
}

function saveProphecyEdit(id) {
  const row = document.querySelector(`tr[data-prophecy-id="${id}"]`);
  if (!row) return;
  const prophecy = state.prophecies.find(p => p.id === id);
  if (!prophecy) return;

  const textInput        = row.querySelector('.prophecy-input-text');
  const yearInput        = row.querySelector('.prophecy-input-year');
  const fulfillmentInput = row.querySelector('.prophecy-input-fulfillment');
  const referenceInput   = row.querySelector('.prophecy-input-reference');

  if (textInput)        prophecy.text        = textInput.value.trim();
  if (yearInput)        prophecy.year        = yearInput.value.trim();
  if (fulfillmentInput) prophecy.fulfillment = fulfillmentInput.value.trim();
  if (referenceInput)   prophecy.reference   = referenceInput.value.trim();

  if (!prophecy.text && !prophecy.year && !prophecy.fulfillment && !prophecy.reference) {
    state.prophecies = state.prophecies.filter(p => p.id !== id);
    showToast('Câmpurile goale au fost eliminate.', 'success');
  } else {
    showToast('Profeția a fost salvată! ✅', 'success');
  }

  saveState();
  renderProphecies();
}

function cancelProphecyEdit(id) {
  const row = document.querySelector(`tr[data-prophecy-id="${id}"]`);
  if (!row) return;
  const prophecy = state.prophecies.find(p => p.id === id);
  if (!prophecy) return;
  if (!prophecy.text && !prophecy.year && !prophecy.fulfillment && !prophecy.reference) {
    state.prophecies = state.prophecies.filter(p => p.id !== id);
    saveState();
  }
  renderProphecies();
}

function renderProphecies() {
  const tbody = document.getElementById('prophecyTableBody');
  const empty = document.getElementById('prophecyEmpty');
  if (!tbody) return;

  const sorted = [...state.prophecies].sort((a, b) => (parseInt(a.year) || 0) - (parseInt(b.year) || 0));

  if (sorted.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  tbody.innerHTML = sorted.map(p => `
    <tr data-prophecy-id="${p.id}">
      <td class="prophecy-text">${escHtml(p.text) || '—'}</td>
      <td class="prophecy-year">${escHtml(p.year) || '—'}</td>
      <td class="prophecy-fulfillment">${escHtml(p.fulfillment) || '—'}</td>
      <td class="prophecy-reference">${p.reference ? escHtml(p.reference) : '—'}</td>
      <td>
        <div class="prophecy-actions">
          <button class="edit-btn" onclick="editProphecy('${p.id}')" title="Editează">✏️</button>
          <button class="delete-btn" onclick="deleteProphecy('${p.id}')" title="Șterge">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function exportProphecies() {
  if (state.prophecies.length === 0) { showToast('Nu există profeții de exportat.', 'error'); return; }

  let text = '📜 PROFEȚII ȘI ÎMPLINIREA LOR\n' + '='.repeat(50) + '\n\n';
  const sorted = [...state.prophecies].sort((a, b) => (parseInt(a.year) || 0) - (parseInt(b.year) || 0));
  sorted.forEach((p, i) => {
    text += `${i + 1}. PROFECȚIA: ${p.text || '—'}\n`;
    text += `   📅 ANUL: ${p.year || '—'}\n`;
    text += `   ✅ ÎMPLINIREA: ${p.fulfillment || '—'}\n`;
    text += `   📖 REFERINȚĂ: ${p.reference || '—'}\n\n`;
  });

  navigator.clipboard.writeText(text).then(() => {
    showToast('Profețiile au fost copiate în clipboard! 📋', 'success');
  }).catch(() => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `profetii-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Profețiile au fost exportate ca fișier! 📄', 'success');
  });
}

function addExampleProphecies() {
  if (state.prophecies.length > 0) {
    if (!confirm('Ai deja profeții salvate. Adaug exemplele?')) return;
  }
  const base = Date.now();
  const examples = [
    { id: `${base}_1`, text: 'Distrugerea Ierusalimului și a templului', year: '607 î.e.n.', fulfillment: 'Babilonienii au distrus Ierusalimul și templul lui Iehova, iar poporul a fost dus în captivitate.', reference: '2 Cronici 36:17-21' },
    { id: `${base}_2`, text: 'Revenirea evreilor din exil', year: '537 î.e.n.', fulfillment: 'Cirus al Persiei a permis evreilor să se întoarcă în Ierusalim și să reconstruiască templul.', reference: 'Ezra 1:1-4' },
    { id: `${base}_3`, text: 'Nașterea lui Isus Mesia', year: '2 î.e.n.', fulfillment: 'Isus s-a născut în Betleem, așa cum a fost profețit.', reference: 'Mica 5:1; Matei 2:1' },
  ];
  state.prophecies = [...state.prophecies, ...examples];
  saveState();
  renderProphecies();
  showToast('Exemple de profeții adăugate! 📜', 'success');
}

// ============================================
// CITITOR BIBLIE (BIBLE READER)
// ============================================
const BIBLE_BOOKS = {
  ot: [
    { name: 'Geneza',        slug: 'geneza',                   chapters: 50  },
    { name: 'Exodul',        slug: 'exodul',                   chapters: 40  },
    { name: 'Leviticul',     slug: 'leviticul',                chapters: 27  },
    { name: 'Numeri',        slug: 'numeri',                   chapters: 36  },
    { name: 'Deuteronomul',  slug: 'deuteronomul',             chapters: 34  },
    { name: 'Iosua',         slug: 'iosua',                    chapters: 24  },
    { name: 'Judecătorii',   slug: 'judecatorii',              chapters: 21  },
    { name: 'Rut',           slug: 'rut',                      chapters: 4   },
    { name: '1 Samuel',      slug: '1-samuel',                 chapters: 31  },
    { name: '2 Samuel',      slug: '2-samuel',                 chapters: 24  },
    { name: '1 Regi',        slug: '1-regi',                   chapters: 22  },
    { name: '2 Regi',        slug: '2-regi',                   chapters: 25  },
    { name: '1 Cronici',     slug: '1-cronici',                chapters: 29  },
    { name: '2 Cronici',     slug: '2-cronici',                chapters: 36  },
    { name: 'Ezra',          slug: 'ezra',                     chapters: 10  },
    { name: 'Neemia',        slug: 'neemia',                   chapters: 13  },
    { name: 'Estera',        slug: 'estera',                   chapters: 10  },
    { name: 'Iov',           slug: 'iov',                      chapters: 42  },
    { name: 'Psalmii',       slug: 'psalmii',                  chapters: 150 },
    { name: 'Proverbele',    slug: 'proverbele',               chapters: 31  },
    { name: 'Eclesiastul',   slug: 'eclesiastul',              chapters: 12  },
    { name: 'Cântarea',      slug: 'cantarea-cantarilor',      chapters: 8   },
    { name: 'Isaia',         slug: 'isaia',                    chapters: 66  },
    { name: 'Ieremia',       slug: 'ieremia',                  chapters: 52  },
    { name: 'Plângerile',    slug: 'plangerile-lui-ieremia',   chapters: 5   },
    { name: 'Ezechiel',      slug: 'ezechiel',                 chapters: 48  },
    { name: 'Daniel',        slug: 'daniel',                   chapters: 12  },
    { name: 'Osea',          slug: 'osea',                     chapters: 14  },
    { name: 'Ioel',          slug: 'ioel',                     chapters: 3   },
    { name: 'Amos',          slug: 'amos',                     chapters: 9   },
    { name: 'Obadia',        slug: 'obadia',                   chapters: 1   },
    { name: 'Iona',          slug: 'iona',                     chapters: 4   },
    { name: 'Mica',          slug: 'mica',                     chapters: 7   },
    { name: 'Naum',          slug: 'naum',                     chapters: 3   },
    { name: 'Habacuc',       slug: 'habacuc',                  chapters: 3   },
    { name: 'Țefania',       slug: 'tefania',                  chapters: 3   },
    { name: 'Hagai',         slug: 'hagai',                    chapters: 2   },
    { name: 'Zaharia',       slug: 'zaharia',                  chapters: 14  },
    { name: 'Maleahi',       slug: 'maleahi',                  chapters: 4   },
  ],
  nt: [
    { name: 'Matei',          slug: 'matei',                    chapters: 28 },
    { name: 'Marcu',          slug: 'marcu',                    chapters: 16 },
    { name: 'Luca',           slug: 'luca',                     chapters: 24 },
    { name: 'Ioan',           slug: 'ioan',                     chapters: 21 },
    { name: 'Faptele',        slug: 'faptele-apostolilor',      chapters: 28 },
    { name: 'Romani',         slug: 'romani',                   chapters: 16 },
    { name: '1 Corinteni',    slug: '1-corinteni',              chapters: 16 },
    { name: '2 Corinteni',    slug: '2-corinteni',              chapters: 13 },
    { name: 'Galateni',       slug: 'galateni',                 chapters: 6  },
    { name: 'Efeseni',        slug: 'efeseni',                  chapters: 6  },
    { name: 'Filipeni',       slug: 'filipeni',                 chapters: 4  },
    { name: 'Coloseni',       slug: 'coloseni',                 chapters: 4  },
    { name: '1 Tesaloniceni', slug: '1-tesaloniceni',           chapters: 5  },
    { name: '2 Tesaloniceni', slug: '2-tesaloniceni',           chapters: 3  },
    { name: '1 Timotei',      slug: '1-timotei',                chapters: 6  },
    { name: '2 Timotei',      slug: '2-timotei',                chapters: 4  },
    { name: 'Tit',            slug: 'tit',                      chapters: 3  },
    { name: 'Filimon',        slug: 'filimon',                  chapters: 1  },
    { name: 'Evrei',          slug: 'evrei',                    chapters: 13 },
    { name: 'Iacov',          slug: 'iacov',                    chapters: 5  },
    { name: '1 Petru',        slug: '1-petru',                  chapters: 5  },
    { name: '2 Petru',        slug: '2-petru',                  chapters: 3  },
    { name: '1 Ioan',         slug: '1-ioan',                   chapters: 5  },
    { name: '2 Ioan',         slug: '2-ioan',                   chapters: 1  },
    { name: '3 Ioan',         slug: '3-ioan',                   chapters: 1  },
    { name: 'Iuda',           slug: 'iuda',                     chapters: 1  },
    { name: 'Revelația',      slug: 'revelatia',                chapters: 22 },
  ],
};

let brState = {
  testament:     'ot',
  bookSlug:      null,
  bookName:      null,
  totalChapters: 0,
  chapter:       null,
  initialized:   false,
};

function initBibleReader() {
  if (!state.bibleNotes) state.bibleNotes = {};
  if (brState.initialized) {
    if (brState.bookSlug) refreshChapterButtons();
    return;
  }
  brState.initialized = true;
  renderBibleBooks('ot');
}

function switchTestament(t) {
  brState.testament = t;
  document.getElementById('tab-ot').classList.toggle('active', t === 'ot');
  document.getElementById('tab-nt').classList.toggle('active', t === 'nt');
  document.getElementById('chapterSelectorCard').style.display = 'none';
  document.getElementById('chapterNotesCard').style.display   = 'none';
  document.getElementById('bibleWelcome').style.display       = 'flex';
  document.getElementById('bibleChapterView').style.display   = 'none';
  brState.bookSlug = null;
  brState.chapter  = null;
  renderBibleBooks(t);
}

function renderBibleBooks(testament) {
  const container = document.getElementById('bibleBooksList');
  if (!container) return;
  const books = BIBLE_BOOKS[testament];
  container.innerHTML = books.map(book => `
    <button class="bible-book-btn ${brState.bookSlug === book.slug ? 'active' : ''}"
      onclick="selectBook('${book.slug}', 1, ${book.chapters}, '${testament}')">
      <span>${escHtml(book.name)}</span>
      <span class="bible-book-chapters">${book.chapters} cap.</span>
    </button>
  `).join('');
}

function selectBook(slug, firstChapter, totalChapters, testament) {
  if (!state.bibleNotes) state.bibleNotes = {};
  brState.bookSlug      = slug;
  brState.totalChapters = totalChapters;
  brState.testament     = testament || brState.testament;

  const allBooks    = [...BIBLE_BOOKS.ot, ...BIBLE_BOOKS.nt];
  const book        = allBooks.find(b => b.slug === slug);
  brState.bookName  = book ? book.name : slug;
  brState.totalChapters = book ? book.chapters : totalChapters;

  renderBibleBooks(brState.testament);

  document.getElementById('selectedBookName').textContent = brState.bookName;
  document.getElementById('chapterSelectorCard').style.display = 'block';
  renderChapters();
  openChapter(1);
}

function renderChapters() {
  const container = document.getElementById('bibleChaptersList');
  if (!container) return;
  const buttons = [];
  for (let i = 1; i <= brState.totalChapters; i++) {
    const key      = `${brState.bookSlug}-${i}`;
    const hasNotes = state.bibleNotes && state.bibleNotes[key] &&
      (state.bibleNotes[key].text || (state.bibleNotes[key].markedVerses || []).length > 0);
    buttons.push(`
      <button class="bible-chapter-btn ${brState.chapter === i ? 'active' : ''} ${hasNotes ? 'has-notes' : ''}"
        onclick="openChapter(${i})" title="Capitol ${i}${hasNotes ? ' (ai notițe)' : ''}">${i}</button>
    `);
  }
  container.innerHTML = buttons.join('');
}

function refreshChapterButtons() {
  const container = document.getElementById('bibleChaptersList');
  if (!container) return;
  container.querySelectorAll('.bible-chapter-btn').forEach((btn, idx) => {
    const chapNum  = idx + 1;
    const key      = `${brState.bookSlug}-${chapNum}`;
    const hasNotes = state.bibleNotes && state.bibleNotes[key] &&
      (state.bibleNotes[key].text || (state.bibleNotes[key].markedVerses || []).length > 0);
    btn.classList.toggle('active', brState.chapter === chapNum);
    btn.classList.toggle('has-notes', !!hasNotes);
  });
}

function openChapter(chapNum) {
  if (!state.bibleNotes) state.bibleNotes = {};
  brState.chapter = chapNum;

  const key      = `${brState.bookSlug}-${chapNum}`;
  const noteData = state.bibleNotes[key] || { text: '', markedVerses: [] };
  const jwUrl    = getBibleUrl(brState.bookSlug, chapNum);

  document.getElementById('bibleWelcome').style.display      = 'none';
  document.getElementById('bibleChapterView').style.display  = 'flex';
  document.getElementById('chapterNotesCard').style.display  = 'block';

  document.getElementById('chapterTitle').textContent = `${brState.bookName} ${chapNum}`;
  const readLink = document.getElementById('jwReadLink');
  readLink.href  = jwUrl;

  document.getElementById('btnPrevChap').disabled = chapNum <= 1;
  document.getElementById('btnNextChap').disabled = chapNum >= brState.totalChapters;

  document.getElementById('chapterNotesText').value    = noteData.text || '';
  document.getElementById('chapterNotesBadge').textContent = `${brState.bookName} ${chapNum}`;

  renderChapterNotesDisplay(noteData);
  renderMarkedVerses(noteData.markedVerses || []);
  refreshChapterButtons();
}

function navigateChapter(delta) {
  const next = brState.chapter + delta;
  if (next >= 1 && next <= brState.totalChapters) openChapter(next);
}

function openOnJwOrg() {
  if (!brState.bookSlug || !brState.chapter) {
    window.open('https://www.jw.org/ro/biblioteca/biblie/biblia-de-studiu/carti/', '_blank');
    return;
  }
  window.open(getBibleUrl(brState.bookSlug, brState.chapter), '_blank');
}

function backToBooks() {
  document.getElementById('chapterSelectorCard').style.display = 'none';
  document.getElementById('chapterNotesCard').style.display   = 'none';
  brState.bookSlug = null;
  brState.chapter  = null;
  document.getElementById('bibleWelcome').style.display      = 'flex';
  document.getElementById('bibleChapterView').style.display  = 'none';
  renderBibleBooks(brState.testament);
}

let notesSaveTimer = null;
function autoSaveChapterNote() {
  clearTimeout(notesSaveTimer);
  notesSaveTimer = setTimeout(saveChapterNote, 800);
}

function saveChapterNote() {
  if (!brState.bookSlug || !brState.chapter) return;
  if (!state.bibleNotes) state.bibleNotes = {};
  const key  = `${brState.bookSlug}-${brState.chapter}`;
  const text = document.getElementById('chapterNotesText').value;
  if (!state.bibleNotes[key]) state.bibleNotes[key] = { text: '', markedVerses: [] };
  state.bibleNotes[key].text = text;
  saveState();
  markStudyDay();
  refreshChapterButtons();
  renderChapterNotesDisplay(state.bibleNotes[key]);
}

function renderChapterNotesDisplay(noteData) {
  const container = document.getElementById('chapterNotesDisplay');
  if (!container) return;
  if (!noteData || !noteData.text) { container.innerHTML = ''; return; }
  container.innerHTML = `
    <div class="chapter-notes-box">
      <p class="chapter-notes-box-title">📝 Notițele tale pentru ${escHtml(brState.bookName)} ${brState.chapter}</p>
      <p class="chapter-notes-box-text">${escHtml(noteData.text)}</p>
    </div>`;
}

function addMarkedVerse() {
  const input = document.getElementById('markedVerseRef');
  const ref   = input.value.trim();
  if (!ref) return;
  if (!brState.bookSlug || !brState.chapter) return;
  if (!state.bibleNotes) state.bibleNotes = {};
  const key = `${brState.bookSlug}-${brState.chapter}`;
  if (!state.bibleNotes[key]) state.bibleNotes[key] = { text: '', markedVerses: [] };
  state.bibleNotes[key].markedVerses = state.bibleNotes[key].markedVerses || [];
  state.bibleNotes[key].markedVerses.push(ref);
  saveState();
  input.value = '';
  renderMarkedVerses(state.bibleNotes[key].markedVerses);
  renderChapterHighlights(state.bibleNotes[key].markedVerses);
  refreshChapterButtons();
  showToast(`Verset ${ref} marcat! ✨`, 'success');
}

function removeMarkedVerse(key, idx) {
  if (!state.bibleNotes || !state.bibleNotes[key]) return;
  state.bibleNotes[key].markedVerses.splice(idx, 1);
  saveState();
  renderMarkedVerses(state.bibleNotes[key].markedVerses);
  renderChapterHighlights(state.bibleNotes[key].markedVerses);
  refreshChapterButtons();
}

function renderMarkedVerses(list) {
  const container = document.getElementById('markedVersesList');
  if (!container) return;
  if (!list || list.length === 0) {
    container.innerHTML = '<div style="font-size:0.78rem;color:var(--text-muted);padding:4px 0">Niciun verset marcat.</div>';
    return;
  }
  const key = `${brState.bookSlug}-${brState.chapter}`;
  container.innerHTML = list.map((v, i) => `
    <div class="marked-verse-item">
      <span>${escHtml(brState.bookName)} ${brState.chapter}:${escHtml(v)}</span>
      <button class="delete-btn" onclick="removeMarkedVerse('${key}', ${i})" title="Șterge">✕</button>
    </div>`).join('');
  renderChapterHighlights(list);
}

function renderChapterHighlights(list) {
  const container = document.getElementById('chapterHighlights');
  if (!container || !list || list.length === 0) {
    if (container) container.innerHTML = '';
    return;
  }
  container.innerHTML = `
    <p style="font-size:0.78rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">Versete marcate în ${escHtml(brState.bookName)} ${brState.chapter}</p>
    ${list.map(v => `
      <div class="highlight-item">
        <span style="font-size:1.2rem">⭐</span>
        <span class="highlight-ref">${escHtml(brState.bookName)} ${brState.chapter}:${escHtml(v)}</span>
        <a href="${getBibleUrl(brState.bookSlug, brState.chapter)}" target="_blank"
           style="font-size:0.78rem;color:var(--accent);text-decoration:none;font-weight:600">jw.org ↗</a>
      </div>`).join('')}`;
}
