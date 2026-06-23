/* ============================================
   StudiuMeu – JW Study App
   JavaScript Logic
   ============================================ */

'use strict';

// ============================================
// STATE & STORAGE
// ============================================
const STORAGE_KEY = 'studiuMeu_data';

let state = {
  notes: [],
  verses: [],
  wtStudies: [],
  workbooks: [],
  meetings: [],
  streak: 0,
  lastStudyDate: null,
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = { ...state, ...JSON.parse(saved) };
      
      // Cleanup orphaned watchtower studies (studies with no matching note)
      let cleaned = false;
      if (state.wtStudies && state.wtStudies.length > 0) {
        const initialCount = state.wtStudies.length;
        state.wtStudies = state.wtStudies.filter(study => {
          return state.notes.some(note => 
            note.id === study.id + '_wt' || 
            (note.category === 'watchtower' && note.title === `TV: ${study.title}`)
          );
        });
        if (state.wtStudies.length !== initialCount) cleaned = true;
      }
      
      // Cleanup orphaned workbooks
      if (state.workbooks && state.workbooks.length > 0) {
        const initialCount = state.workbooks.length;
        state.workbooks = state.workbooks.filter(wb => {
          return state.notes.some(note => 
            note.id === wb.id + '_wb' || 
            (note.category === 'workbook' && note.title === `Caiet: ${wb.week}`)
          );
        });
        if (state.workbooks.length !== initialCount) cleaned = true;
      }

      if (cleaned) {
        saveState();
      }
    }
  } catch(e) { console.error('Load error:', e); }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ============================================
// NAVIGATION
// ============================================
const pageTitles = {
  dashboard: 'Panou Principal',
  watchtower: 'Turnul de Veghe – Studiu',
  workbook: 'Viața creștină și predicarea',
  bible: 'Studiu Biblic Personal',
  biblereader: 'Biblia de Studiu – jw.org/ro',
  fieldservice: 'Întrunirea de Serviciu de Teren',
  notes: 'Notițele Mele',
  meetings: 'Programul Meu',
};

let currentPage = 'dashboard';

function navigateTo(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show target
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  const navEl = document.getElementById(`nav-${page}`);
  if (navEl) navEl.classList.add('active');

  document.getElementById('pageTitle').textContent = pageTitles[page] || page;
  currentPage = page;

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('mobile-open');

  // Re-render page
  renderPage(page);
  return false;
}

function renderPage(page) {
  switch(page) {
    case 'dashboard': renderDashboard(); break;
    case 'notes': renderNotesList(); break;
    case 'bible': renderVersesList('all'); break;
    case 'meetings': renderMeetings(); break;
    case 'watchtower': renderWtParagraphs(); break;
    case 'workbook': loadTalkDraft(); break;
    case 'biblereader': initBibleReader(); break;
    case 'fieldservice': renderFieldServiceList(); break;
  }
}

// ============================================
// GREETING & DATE
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

  // Set default date fields
  const today = now.toISOString().split('T')[0];
  const dateInputs = ['wt-date', 'wb-date', 'fs-date'];
  dateInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = today;
  });
}

// ============================================
// DASHBOARD RENDER
// ============================================
function renderDashboard() {
  // Stats
  document.getElementById('stat-articles').textContent = state.wtStudies.length;
  document.getElementById('stat-notes').textContent = state.notes.length;
  document.getElementById('stat-meetings').textContent = state.meetings.length;
  document.getElementById('stat-verses').textContent = state.verses.length;

  // Streak
  updateStreak();
  document.getElementById('streakCount').textContent = `${state.streak} zile studiu`;

  // Next meeting
  updateNextMeeting();

  // Recent notes
  renderRecentNotes();
}

function updateStreak() {
  const today = new Date().toDateString();
  if (state.lastStudyDate === today) return;
  // Just show the current streak from state
  const el = document.getElementById('streakCount');
  if (el) el.textContent = `${state.streak} zile studiu`;
}

function updateNextMeeting() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Duminică (0)
  let daysUntilSun = (0 - day + 7) % 7;
  let nextSun = new Date(today);
  nextSun.setDate(today.getDate() + daysUntilSun);

  // Joi (4)
  let daysUntilThu = (4 - day + 7) % 7;
  let nextThu = new Date(today);
  nextThu.setDate(today.getDate() + daysUntilThu);

  let nextMeeting, nextName;
  if (nextThu < nextSun) {
    nextMeeting = nextThu;
    nextName = 'Viața și Activitatea Creștină';
  } else {
    nextMeeting = nextSun;
    nextName = 'Studierea Turnului de Veghe';
  }

  const nameEl = document.getElementById('nextMeetingName');
  const dateEl = document.getElementById('nextMeetingDate');
  if (nameEl) nameEl.textContent = nextName;
  if (dateEl) {
    const opts = { weekday: 'long', day: 'numeric', month: 'long' };
    const diff = Math.round((nextMeeting - today) / (1000 * 60 * 60 * 24));
    let dateStr = nextMeeting.toLocaleDateString('ro-RO', opts);
    if (diff === 0) {
      dateStr += ' (astăzi)';
    } else if (diff === 1) {
      dateStr += ' (mâine)';
    } else {
      dateStr += ` (în ${diff} zile)`;
    }
    dateEl.textContent = dateStr;
  }

  // Progress
  const lastStudy = nextName.includes('Turnul') ? state.wtStudies[state.wtStudies.length - 1] : state.workbooks[state.workbooks.length - 1];
  const prog = lastStudy ? (lastStudy.progress || 0) : 0;
  const progressEl = document.getElementById('nextMeetingProgress');
  const barEl = document.getElementById('nextMeetingProgressBar');
  if (progressEl) progressEl.textContent = `${prog}%`;
  if (barEl) barEl.style.width = `${prog}%`;
}

function renderRecentNotes() {
  const container = document.getElementById('recentNotesList');
  if (!container) return;

  const recent = [...state.notes].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

  if (recent.length === 0) {
    container.innerHTML = '<div class="empty-state-small">Nicio notiță încă. Începe studiul!</div>';
    return;
  }

  const colors = { watchtower: '#4f8ef7', workbook: '#10c9a0', bible: '#a855f7', general: '#f97b4f', fieldservice: '#ec4899' };

  container.innerHTML = recent.map(note => `
    <div class="recent-item" onclick="openNoteCard('${note.id}')">
      <div class="recent-item-dot" style="background:${colors[note.category] || '#4f8ef7'}"></div>
      <span class="recent-item-title">${escHtml(note.title)}</span>
      <span class="recent-item-date">${formatDate(note.date)}</span>
    </div>
  `).join('');
}

// ============================================
// BIBLE BUTTON
// ============================================
function readVerseInBible() {
  navigateTo('biblereader');
}

// ============================================
// WATCHTOWER STUDY
// ============================================
let wtParagraphs = [];
let editingParagraphIndex = null;

function addWtParagraph() {
  openParagraphModal();
}

function openParagraphModal(index = null) {
  editingParagraphIndex = index;
  const modal = document.getElementById('paragraphModal');

  if (index !== null && wtParagraphs[index]) {
    const p = wtParagraphs[index];
    document.getElementById('parNumber').value = p.number;
    document.getElementById('parVerse').value = p.verse;
    document.getElementById('parMain').value = p.main;
    document.getElementById('parAnswer').value = p.answer;
    document.getElementById('parNotes').value = p.notes;
    modal.querySelector('h3').textContent = 'Editează Paragraf';
  } else {
    document.getElementById('parNumber').value = wtParagraphs.length + 1;
    document.getElementById('parVerse').value = '';
    document.getElementById('parMain').value = '';
    document.getElementById('parAnswer').value = '';
    document.getElementById('parNotes').value = '';
    modal.querySelector('h3').textContent = 'Paragraf Nou';
  }

  // Reset AI suggestion panel
  const aiList = document.getElementById('aiSuggestionsList');
  if (aiList) {
    aiList.innerHTML = `
      <div class="ai-empty-state">
        Scrie ideea principală a paragrafului în stânga, apoi apasă butonul pentru a primi sugestii de comentarii.
      </div>
    `;
  }

  modal.classList.add('open');
}

function closeParagraphModal() {
  document.getElementById('paragraphModal').classList.remove('open');
  editingParagraphIndex = null;
}

function saveParagraph() {
  const p = {
    number: parseInt(document.getElementById('parNumber').value) || wtParagraphs.length + 1,
    verse: document.getElementById('parVerse').value.trim(),
    main: document.getElementById('parMain').value.trim(),
    answer: document.getElementById('parAnswer').value.trim(),
    notes: document.getElementById('parNotes').value.trim(),
  };

  if (!p.answer && !p.main) {
    showToast('Adaugă cel puțin ideea principală sau răspunsul.', 'error');
    return;
  }

  if (editingParagraphIndex !== null) {
    wtParagraphs[editingParagraphIndex] = p;
  } else {
    wtParagraphs.push(p);
  }

  closeParagraphModal();
  renderWtParagraphs();
  updateWtProgress();
  showToast('Paragraf salvat! ✅', 'success');
}

function renderWtParagraphs() {
  const container = document.getElementById('wtParagraphsList');
  if (!container) return;

  if (wtParagraphs.length === 0) {
    container.innerHTML = '<div class="empty-state-small">Niciun paragraf adăugat. Apasă „+ Adaugă Paragraf".</div>';
    return;
  }

  container.innerHTML = wtParagraphs.map((p, i) => `
    <div class="paragraph-item">
      <div class="paragraph-item-header">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="paragraph-num">§ ${p.number}</span>
          ${p.verse ? `<span class="paragraph-verse">📖 ${escHtml(p.verse)}</span>` : ''}
        </div>
        <div style="display:flex;gap:6px">
          <button class="delete-btn" onclick="openParagraphModal(${i})" title="Editează">✏️</button>
          <button class="delete-btn" onclick="deleteParagraph(${i})" title="Șterge">🗑</button>
        </div>
      </div>
      ${p.main ? `<p class="paragraph-main">${escHtml(p.main)}</p>` : ''}
      ${p.answer ? `<p class="paragraph-answer">💬 ${escHtml(p.answer)}</p>` : ''}
      ${p.notes ? `<p class="paragraph-answer" style="opacity:.7;font-style:italic">📝 ${escHtml(p.notes)}</p>` : ''}
    </div>
  `).join('');
}

function deleteParagraph(index) {
  if (confirm('Ștergi acest paragraf?')) {
    wtParagraphs.splice(index, 1);
    renderWtParagraphs();
    updateWtProgress();
  }
}

function updateWtProgress() {
  const needed = parseInt(document.getElementById('wt-paragraphs')?.value) || 10;
  const pct = Math.min(100, Math.round((wtParagraphs.length / needed) * 100));
  const el = document.getElementById('wtProgress');
  const bar = document.getElementById('wtProgressBar');
  if (el) el.textContent = `${pct}%`;
  if (bar) bar.style.width = `${pct}%`;
}

function autoSynthesize() {
  if (wtParagraphs.length === 0) {
    showToast('Adaugă mai întâi câteva paragrafe.', 'error');
    return;
  }

  const title = document.getElementById('wt-title')?.value || 'Articolul';
  const baseVerse = document.getElementById('wt-base-verse')?.value || '';

  let synthesis = `📋 Sinteză: "${title}"\n\n`;
  if (baseVerse) synthesis += `📖 Verset de bază: ${baseVerse}\n\n`;
  synthesis += `Idei principale studiate:\n`;

  wtParagraphs.forEach(p => {
    if (p.main) synthesis += `• ${p.main}\n`;
  });

  synthesis += `\nRăspunsuri pregătite:\n`;
  wtParagraphs.forEach(p => {
    if (p.answer) synthesis += `§${p.number}: ${p.answer}\n\n`;
  });

  synthesis += `\n✨ Aplicare personală: [Completează cu gândurile tale...]`;

  document.getElementById('wt-synthesis').value = synthesis;
  showToast('Sinteză generată! ✨', 'success');
}

function saveWtStudy() {
  const title = document.getElementById('wt-title')?.value?.trim();
  if (!title) {
    showToast('Adaugă titlul articolului.', 'error');
    document.getElementById('wt-title')?.focus();
    return;
  }

  const studyId = Date.now().toString();
  const study = {
    id: studyId,
    title,
    date: document.getElementById('wt-date')?.value || new Date().toISOString().split('T')[0],
    edition: document.getElementById('wt-edition')?.value || '',
    paragraphsRange: document.getElementById('wt-paragraphs')?.value || '',
    baseVerse: document.getElementById('wt-base-verse')?.value || '',
    paragraphs: [...wtParagraphs],
    synthesis: document.getElementById('wt-synthesis')?.value || '',
    progress: Math.min(100, Math.round((wtParagraphs.length / 10) * 100)),
  };

  state.wtStudies.push(study);
  markStudyDay();
  saveState();
  showToast('Studiu Turnul de Veghe salvat! 🗼', 'success');

  // Add auto-note
  state.notes.push({
    id: studyId + '_wt',
    title: `TV: ${title}`,
    content: study.synthesis || `Studiu pregătit cu ${study.paragraphs.length} paragrafe.`,
    category: 'watchtower',
    tags: ['turnul-de-veghe'],
    date: study.date,
  });
  saveState();
}

// ============================================
// WATCHTOWER PARAGRAPH AI ASSISTANT
// ============================================
function generateParagraphSuggestions() {
  const mainInput = document.getElementById('parMain');
  const verseInput = document.getElementById('parVerse');
  const mainText = mainInput ? mainInput.value.trim() : '';
  const verseText = verseInput ? verseInput.value.trim() : '';

  const aiList = document.getElementById('aiSuggestionsList');
  if (!aiList) return;

  if (!mainText) {
    showToast('Introduceți o idee principală pentru a genera sugestii.', 'error');
    mainInput?.focus();
    return;
  }

  // Show loading indicator
  aiList.innerHTML = `
    <div style="text-align:center;padding:30px;color:var(--text-secondary);font-size:0.85rem">
      <span style="display:inline-block;animation:spin 1s linear infinite;margin-right:8px">✨</span>
      Se generează sugestiile de comentarii...
    </div>
  `;

  // Simulate AI delay for realistic feel
  setTimeout(() => {
    const suggestions = generateTemplates(mainText, verseText);
    
    aiList.innerHTML = suggestions.map((s, idx) => `
      <div class="ai-suggestion-card">
        <span class="ai-suggestion-tag">${s.type}</span>
        <p class="ai-suggestion-text" id="ai-sug-${idx}">${escHtml(s.text)}</p>
        <div class="ai-suggestion-actions">
          <button type="button" class="btn-xs btn-ghost" onclick="useAiSuggestion(${idx}, 'notes')">📋 La Notițe</button>
          <button type="button" class="btn-xs btn-primary" onclick="useAiSuggestion(${idx}, 'answer')">✍️ La Răspuns</button>
        </div>
      </div>
    `).join('');
    
    showToast('Sugestii AI generate cu succes! ✨', 'success');
  }, 600);
}

function generateTemplates(mainText, verseText) {
  let cleanedMain = mainText.charAt(0).toLowerCase() + mainText.slice(1);
  if (cleanedMain.endsWith('.')) {
    cleanedMain = cleanedMain.slice(0, -1);
  }

  const verseRefIntro = verseText ? `, așa cum reiese și din ${verseText},` : '';
  const verseRefLink = verseText ? ` Acest verset (${verseText}) ne îndeamnă să analizăm modul în care ne manifestăm credința în viața de zi cu zi.` : '';

  const s1 = {
    type: 'Scurt & Direct 💬',
    text: `Acest paragraf ne arată că ${cleanedMain}.${verseText ? ` Din versetul citat (${verseText}) înțelegem că acest aspect este esențial pentru noi.` : ''}`
  };

  const s2 = {
    type: 'Aprofundat & Explicativ 📚',
    text: `Ideea principală a paragrafului subliniază că ${cleanedMain}.${verseRefIntro ? ` Faptul acesta${verseRefIntro} arată că grija spirituală este un factor cheie în progresul nostru.` : ''} Înțelegerea profundă a acestui aspect ne ajută să rămânem fideli și să acționăm în armonie cu îndrumarea oferită.`
  };

  const s3 = {
    type: 'Aplicare practică ❤️',
    text: `Personal, consider că ${cleanedMain}.${verseRefLink} Putem pune în practică această idee fiind mai atenți la nevoile congregației și sprijinindu-ne reciproc în încercări.`
  };

  return [s1, s2, s3];
}

function useAiSuggestion(idx, field) {
  const textEl = document.getElementById(`ai-sug-${idx}`);
  if (!textEl) return;
  const suggestionText = textEl.textContent;

  if (field === 'answer') {
    const answerInput = document.getElementById('parAnswer');
    if (answerInput) {
      answerInput.value = suggestionText;
      showToast('Sugestia a fost setată ca răspuns! ✍️', 'success');
    }
  } else if (field === 'notes') {
    const notesInput = document.getElementById('parNotes');
    if (notesInput) {
      if (notesInput.value.trim()) {
        notesInput.value += '\n\n' + suggestionText;
      } else {
        notesInput.value = suggestionText;
      }
      showToast('Sugestia a fost adăugată la notițe! 📋', 'success');
    }
  }
}

// ============================================
// WORKBOOK
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
    id: wbId,
    week,
    date: document.getElementById('wb-date')?.value || new Date().toISOString().split('T')[0],
    reading: document.getElementById('wb-reading')?.value || '',
    progress: 60,
  };

  state.workbooks.push(wb);
  markStudyDay();
  saveState();
  showToast('Pregătire Viața creștină și predicarea salvată! 📋', 'success');

  state.notes.push({
    id: wbId + '_wb',
    title: `Caiet: ${week}`,
    content: `Pregătire pentru săptămâna ${week}. Lectură: ${wb.reading}`,
    category: 'workbook',
    tags: ['caiet-lucru'],
    date: wb.date,
  });
  saveState();
}

function saveTalkDraft() {
  if (!state.talkDraft) state.talkDraft = {};
  state.talkDraft = {
    subject: document.getElementById('talk-subject')?.value || '',
    duration: document.getElementById('talk-duration')?.value || '5 minute',
    notes: document.getElementById('talk-notes')?.value || '',
  };
  saveState();
}

function loadTalkDraft() {
  const draft = state.talkDraft || {};
  const subject = document.getElementById('talk-subject');
  const duration = document.getElementById('talk-duration');
  const notes = document.getElementById('talk-notes');

  if (subject) subject.value = draft.subject || '';
  if (duration) duration.value = draft.duration || '5 minute';
  if (notes) notes.value = draft.notes || '';
}

let generatedTalkOutlineText = '';

function toggleTalkAiPanel() {
  const panel = document.getElementById('talkAiPanel');
  if (!panel) return;
  const isHidden = panel.style.display === 'none';
  panel.style.display = isHidden ? 'block' : 'none';
}

function generateTalkOutline(style) {
  const subjectInput = document.getElementById('talk-subject');
  const subject = subjectInput ? subjectInput.value.trim() : '';
  const sugDiv = document.getElementById('talkAiSuggestions');
  const useBtn = document.getElementById('useTalkOutlineBtn');

  if (!subject) {
    showToast('Introduceți mai întâi subiectul cuvântării.', 'error');
    subjectInput?.focus();
    return;
  }

  sugDiv.style.display = 'block';
  sugDiv.innerHTML = `⏳ Se generează schița...`;
  useBtn.style.display = 'none';

  setTimeout(() => {
    let outline = '';
    const cleanSubject = subject.charAt(0).toUpperCase() + subject.slice(1);

    if (style === 'explicativ') {
      outline = `📌 DISCURS EXPLICATIV: "${cleanSubject}"\n\n` +
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
      outline = `📌 DISCURS PRACTIC: "${cleanSubject}"\n\n` +
                `1. INTRODUCERE:\n` +
                `   - Impactul subiectului "${cleanSubject}" în activitățile zilnice.\n\n` +
                `2. CORPUL CUVÂNTĂRII (Aplicare practică):\n` +
                `   - Pasul 1: Cum implementăm acest lucru în familie sau la locul de muncă?\n` +
                `   - Pasul 2: Obstacole comune și cum le putem depăși cu ajutorul spiritului sfânt.\n` +
                `   - Ilustrare sugestivă potrivită pentru ilustrarea ideii.\n\n` +
                `3. CONCLUZIE:\n` +
                `   - O acțiune clară pe care o putem face în săptămâna următoare.`;
    } else {
      outline = `📌 DISCURS ÎNCURAJATOR: "${cleanSubject}"\n\n` +
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
    sugDiv.innerHTML = outline.replace(/\n/g, '<br>');
    useBtn.style.display = 'inline-block';
    showToast('Schiță AI generată! ✨', 'success');
  }, 500);
}

function applyTalkOutline() {
  const notesTextarea = document.getElementById('talk-notes');
  if (notesTextarea && generatedTalkOutlineText) {
    if (notesTextarea.value.trim()) {
      notesTextarea.value += '\n\n' + generatedTalkOutlineText;
    } else {
      notesTextarea.value = generatedTalkOutlineText;
    }
    saveTalkDraft();
    showToast('Schița a fost aplicată în notițe! ✍️', 'success');
  }
}

// ============================================
// BIBLE STUDY
// ============================================
function addVerseEntry() {
  saveVerse();
}

function saveVerse() {
  const ref = document.getElementById('verse-ref-input')?.value?.trim();
  const text = document.getElementById('verse-text-input')?.value?.trim();

  if (!ref) {
    showToast('Adaugă referința biblică.', 'error');
    document.getElementById('verse-ref-input')?.focus();
    return;
  }

  const verse = {
    id: Date.now().toString(),
    ref,
    text,
    category: document.getElementById('verse-category')?.value || 'Altele',
    meditation: document.getElementById('verse-meditation')?.value?.trim() || '',
    date: new Date().toISOString().split('T')[0],
  };

  state.verses.push(verse);
  markStudyDay();
  saveState();
  showToast('Verset salvat! 📖', 'success');

  // Clear form
  ['verse-ref-input', 'verse-text-input', 'verse-meditation'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  renderVersesList('all');
}

let activeVerseFilter = 'all';

function renderVersesList(filter) {
  activeVerseFilter = filter;
  const container = document.getElementById('versesList');
  if (!container) return;

  // Update filter tabs
  document.querySelectorAll('#verseFilters .filter-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  const filtered = filter === 'all' ? state.verses :
    state.verses.filter(v => v.category === filter);

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
      ${v.text ? `<p class="verse-entry-text">"${escHtml(v.text)}"</p>` : ''}
      ${v.meditation ? `<p class="verse-entry-meditation">💭 ${escHtml(v.meditation)}</p>` : ''}
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
  showToast('Notiță serviciu de teren salvată! 🚗', 'success');

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
          🚗 Serviciu
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
// MEETINGS
// ============================================
function addMeetingEntry() {
  const name = prompt('Tipul întrunirii (ex: Turnul de Veghe, Viața creștină și predicarea):');
  if (!name) return;
  const date = prompt('Data (YYYY-MM-DD):') || new Date().toISOString().split('T')[0];

  state.meetings.push({
    id: Date.now().toString(),
    name, date,
    progress: 0,
  });
  saveState();
  renderMeetings();
  showToast('Întrunire adăugată! 📅', 'success');
}

function renderMeetings() {
  const container = document.getElementById('meetingsCalendar');
  if (!container) return;

  // Update progress bars
  const lastWt = state.wtStudies[state.wtStudies.length - 1];
  const lastWb = state.workbooks[state.workbooks.length - 1];

  const wpEl = document.getElementById('weekendProgress');
  const wpBar = document.getElementById('weekendProgressBar');
  const prog1 = lastWt?.progress || 0;
  if (wpEl) wpEl.textContent = `${prog1}%`;
  if (wpBar) wpBar.style.width = `${prog1}%`;

  const wdEl = document.getElementById('weekdayProgress');
  const wdBar = document.getElementById('weekdayProgressBar');
  const prog2 = lastWb?.progress || 0;
  if (wdEl) wdEl.textContent = `${prog2}%`;
  if (wdBar) wdBar.style.width = `${prog2}%`;

  if (state.meetings.length === 0) {
    container.innerHTML = '<div class="empty-state-small">Nicio întrunire planificată. Apasă „+ Adaugă Întrunire".</div>';
    return;
  }

  const sorted = [...state.meetings].sort((a,b) => new Date(a.date) - new Date(b.date));
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
      ? state.streak + 1 : 1;
    state.lastStudyDate = today;
  }
}

// ============================================
// QUICK ADD BUTTON
// ============================================
function handleQuickAdd() {
  switch(currentPage) {
    case 'watchtower': addWtParagraph(); break;
    case 'notes': openNewNoteModal(); break;
    case 'fieldservice': document.getElementById('fs-title')?.focus(); break;
    case 'bible': document.getElementById('verse-ref-input')?.focus(); break;
    case 'meetings': addMeetingEntry(); break;
    default: openNewNoteModal();
  }
}

// ============================================
// SEARCH
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
// THEME
// ============================================
function toggleTheme() {
  const html = document.documentElement;
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

// ============================================
// BIBLE READER MODULE
// ============================================

// All 66 books with their jw.org/ro slug and chapter count
const BIBLE_BOOKS = {
  ot: [
    { name: 'Geneza',          slug: 'geneza',            chapters: 50 },
    { name: 'Exodul',          slug: 'exodul',            chapters: 40 },
    { name: 'Leviticul',       slug: 'leviticul',         chapters: 27 },
    { name: 'Numeri',          slug: 'numeri',            chapters: 36 },
    { name: 'Deuteronomul',    slug: 'deuteronomul',      chapters: 34 },
    { name: 'Iosua',           slug: 'iosua',             chapters: 24 },
    { name: 'Judecătorii',     slug: 'judecatorii',       chapters: 21 },
    { name: 'Rut',             slug: 'rut',               chapters: 4  },
    { name: '1 Samuel',        slug: '1-samuel',          chapters: 31 },
    { name: '2 Samuel',        slug: '2-samuel',          chapters: 24 },
    { name: '1 Regi',          slug: '1-regi',            chapters: 22 },
    { name: '2 Regi',          slug: '2-regi',            chapters: 25 },
    { name: '1 Cronici',       slug: '1-cronici',         chapters: 29 },
    { name: '2 Cronici',       slug: '2-cronici',         chapters: 36 },
    { name: 'Ezra',            slug: 'ezra',              chapters: 10 },
    { name: 'Neemia',          slug: 'neemia',            chapters: 13 },
    { name: 'Estera',          slug: 'estera',            chapters: 10 },
    { name: 'Iov',             slug: 'iov',               chapters: 42 },
    { name: 'Psalmii',         slug: 'psalmii',           chapters: 150},
    { name: 'Proverbele',      slug: 'proverbele',        chapters: 31 },
    { name: 'Eclesiastul',     slug: 'eclesiastul',       chapters: 12 },
    { name: 'Cântarea',        slug: 'cantarea-cantarilor', chapters: 8 },
    { name: 'Isaia',           slug: 'isaia',             chapters: 66 },
    { name: 'Ieremia',         slug: 'ieremia',           chapters: 52 },
    { name: 'Plângerile',      slug: 'plangerile-lui-ieremia', chapters: 5 },
    { name: 'Ezechiel',        slug: 'ezechiel',          chapters: 48 },
    { name: 'Daniel',          slug: 'daniel',            chapters: 12 },
    { name: 'Osea',            slug: 'osea',              chapters: 14 },
    { name: 'Ioel',            slug: 'ioel',              chapters: 3  },
    { name: 'Amos',            slug: 'amos',              chapters: 9  },
    { name: 'Obadia',          slug: 'obadia',            chapters: 1  },
    { name: 'Iona',            slug: 'iona',              chapters: 4  },
    { name: 'Mica',            slug: 'mica',              chapters: 7  },
    { name: 'Naum',            slug: 'naum',              chapters: 3  },
    { name: 'Habacuc',         slug: 'habacuc',           chapters: 3  },
    { name: 'Țefania',         slug: 'tefania',           chapters: 3  },
    { name: 'Hagai',           slug: 'hagai',             chapters: 2  },
    { name: 'Zaharia',         slug: 'zaharia',           chapters: 14 },
    { name: 'Maleahi',         slug: 'maleahi',           chapters: 4  },
  ],
  nt: [
    { name: 'Matei',           slug: 'matei',             chapters: 28 },
    { name: 'Marcu',           slug: 'marcu',             chapters: 16 },
    { name: 'Luca',            slug: 'luca',              chapters: 24 },
    { name: 'Ioan',            slug: 'ioan',              chapters: 21 },
    { name: 'Faptele',         slug: 'faptele-apostolilor', chapters: 28 },
    { name: 'Romani',          slug: 'romani',            chapters: 16 },
    { name: '1 Corinteni',     slug: '1-corinteni',       chapters: 16 },
    { name: '2 Corinteni',     slug: '2-corinteni',       chapters: 13 },
    { name: 'Galateni',        slug: 'galateni',          chapters: 6  },
    { name: 'Efeseni',         slug: 'efeseni',           chapters: 6  },
    { name: 'Filipeni',        slug: 'filipeni',          chapters: 4  },
    { name: 'Coloseni',        slug: 'coloseni',          chapters: 4  },
    { name: '1 Tesaloniceni',  slug: '1-tesaloniceni',    chapters: 5  },
    { name: '2 Tesaloniceni',  slug: '2-tesaloniceni',    chapters: 3  },
    { name: '1 Timotei',       slug: '1-timotei',         chapters: 6  },
    { name: '2 Timotei',       slug: '2-timotei',         chapters: 4  },
    { name: 'Tit',             slug: 'tit',               chapters: 3  },
    { name: 'Filimon',         slug: 'filimon',           chapters: 1  },
    { name: 'Evrei',           slug: 'evrei',             chapters: 13 },
    { name: 'Iacov',           slug: 'iacov',             chapters: 5  },
    { name: '1 Petru',         slug: '1-petru',           chapters: 5  },
    { name: '2 Petru',         slug: '2-petru',           chapters: 3  },
    { name: '1 Ioan',          slug: '1-ioan',            chapters: 5  },
    { name: '2 Ioan',          slug: '2-ioan',            chapters: 1  },
    { name: '3 Ioan',          slug: '3-ioan',            chapters: 1  },
    { name: 'Iuda',            slug: 'iuda',              chapters: 1  },
    { name: 'Apocalipsa',      slug: 'apocalipsa',        chapters: 22 },
  ]
};

// State for bible reader
let brState = {
  testament: 'ot',
  bookSlug: null,
  bookName: null,
  totalChapters: 0,
  chapter: null,
  initialized: false,
};

// Notes stored as: state.bibleNotes[bookSlug+'-'+chapter] = { text, markedVerses }

function initBibleReader() {
  if (!state.bibleNotes) { state.bibleNotes = {}; }
  if (brState.initialized) {
    // refresh chapter buttons to show which ones have notes
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
  // Reset to book list
  document.getElementById('chapterSelectorCard').style.display = 'none';
  document.getElementById('chapterNotesCard').style.display = 'none';
  document.getElementById('bibleWelcome').style.display = 'flex';
  document.getElementById('bibleChapterView').style.display = 'none';
  brState.bookSlug = null;
  brState.chapter = null;
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
  brState.bookSlug = slug;
  brState.totalChapters = totalChapters;
  brState.testament = testament || brState.testament;

  // Find book name
  const allBooks = [...BIBLE_BOOKS.ot, ...BIBLE_BOOKS.nt];
  const book = allBooks.find(b => b.slug === slug);
  brState.bookName = book ? book.name : slug;
  brState.totalChapters = book ? book.chapters : totalChapters;

  // Update book buttons active state
  renderBibleBooks(brState.testament);

  // Show chapter selector
  document.getElementById('selectedBookName').textContent = brState.bookName;
  document.getElementById('chapterSelectorCard').style.display = 'block';

  renderChapters();

  // Open chapter 1 immediately
  openChapter(1);
}

function renderChapters() {
  const container = document.getElementById('bibleChaptersList');
  if (!container) return;
  const buttons = [];
  for (let i = 1; i <= brState.totalChapters; i++) {
    const key = `${brState.bookSlug}-${i}`;
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
    const chapNum = idx + 1;
    const key = `${brState.bookSlug}-${chapNum}`;
    const hasNotes = state.bibleNotes && state.bibleNotes[key] &&
      (state.bibleNotes[key].text || (state.bibleNotes[key].markedVerses || []).length > 0);
    btn.classList.toggle('active', brState.chapter === chapNum);
    btn.classList.toggle('has-notes', !!hasNotes);
  });
}

function openChapter(chapNum) {
  if (!state.bibleNotes) state.bibleNotes = {};
  brState.chapter = chapNum;

  const key = `${brState.bookSlug}-${chapNum}`;
  const noteData = state.bibleNotes[key] || { text: '', markedVerses: [] };

  // Build jw.org/ro URL
  const jwUrl = `https://www.jw.org/ro/biblioteca/biblie/biblia-de-studiu/carti/${brState.bookSlug}/${chapNum}/`;

  // Show chapter view panel
  document.getElementById('bibleWelcome').style.display = 'none';
  document.getElementById('bibleChapterView').style.display = 'flex';
  document.getElementById('chapterNotesCard').style.display = 'block';

  // Set title & link
  document.getElementById('chapterTitle').textContent = `${brState.bookName} ${chapNum}`;
  const readLink = document.getElementById('jwReadLink');
  readLink.href = jwUrl;

  // Nav buttons
  document.getElementById('btnPrevChap').disabled = chapNum <= 1;
  document.getElementById('btnNextChap').disabled = chapNum >= brState.totalChapters;

  // Notes textarea
  document.getElementById('chapterNotesText').value = noteData.text || '';
  document.getElementById('chapterNotesBadge').textContent = `${brState.bookName} ${chapNum}`;

  // Render notes display
  renderChapterNotesDisplay(noteData);

  // Render marked verses
  renderMarkedVerses(noteData.markedVerses || []);

  // Refresh chapter grid
  refreshChapterButtons();
}

function navigateChapter(delta) {
  const next = brState.chapter + delta;
  if (next >= 1 && next <= brState.totalChapters) {
    openChapter(next);
  }
}

function openOnJwOrg() {
  if (!brState.bookSlug || !brState.chapter) {
    window.open('https://www.jw.org/ro/biblioteca/biblie/biblia-de-studiu/carti/', '_blank');
    return;
  }
  const url = `https://www.jw.org/ro/biblioteca/biblie/biblia-de-studiu/carti/${brState.bookSlug}/${brState.chapter}/`;
  window.open(url, '_blank');
}

function backToBooks() {
  document.getElementById('chapterSelectorCard').style.display = 'none';
  document.getElementById('chapterNotesCard').style.display = 'none';
  brState.bookSlug = null;
  brState.chapter = null;
  document.getElementById('bibleWelcome').style.display = 'flex';
  document.getElementById('bibleChapterView').style.display = 'none';
  renderBibleBooks(brState.testament);
}

// Auto-save notes as user types (debounced)
let notesSaveTimer = null;
function autoSaveChapterNote() {
  clearTimeout(notesSaveTimer);
  notesSaveTimer = setTimeout(saveChapterNote, 800);
}

function saveChapterNote() {
  if (!brState.bookSlug || !brState.chapter) return;
  if (!state.bibleNotes) state.bibleNotes = {};
  const key = `${brState.bookSlug}-${brState.chapter}`;
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
  if (!noteData || !noteData.text) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = `
    <div class="chapter-notes-box">
      <p class="chapter-notes-box-title">📝 Notițele tale pentru ${escHtml(brState.bookName)} ${brState.chapter}</p>
      <p class="chapter-notes-box-text">${escHtml(noteData.text)}</p>
    </div>`;
}

function addMarkedVerse() {
  const input = document.getElementById('markedVerseRef');
  const ref = input.value.trim();
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
        <a href="https://www.jw.org/ro/biblioteca/biblie/biblia-de-studiu/carti/${brState.bookSlug}/${brState.chapter}/" target="_blank"
           style="font-size:0.78rem;color:var(--accent);text-decoration:none;font-weight:600">jw.org ↗</a>
      </div>`).join('')}`;
}

// ============================================
// EXPORT / IMPORT BACKUP
// ============================================
function exportData() {
  try {
    // Ne asigurăm că datele din variabila state sunt salvate înainte de export.
    saveState();

    const backup = {
      app: 'StudiuMeu',
      version: 1,
      exportedAt: new Date().toISOString(),
      state: state,
      preferences: {
        theme: localStorage.getItem('studiuMeu_theme') || 'dark',
        yearText: localStorage.getItem('studiuMeu_yearText') || '',
        yearColor: localStorage.getItem('studiuMeu_yearColor') || '#e6edf3',
        yearSize: localStorage.getItem('studiuMeu_yearSize') || '14',
        fontScale: localStorage.getItem('studiuMeu_fontScale') || '14',
      }
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `studiu-meu-backup-${today}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    showToast('Backup exportat cu succes! 📦', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showToast('Nu s-a putut exporta backup-ul.', 'error');
  }
}

function triggerImport() {
  try {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';

    input.addEventListener('change', function () {
      const file = input.files && input.files[0];
      input.remove();
      if (!file) return;

      importData(file);
    });

    document.body.appendChild(input);
    input.click();
  } catch (error) {
    console.error('Import trigger error:', error);
    showToast('Nu s-a putut deschide importul.', 'error');
  }
}

function importData(file) {
  const reader = new FileReader();

  reader.onload = function (event) {
    try {
      const parsed = JSON.parse(event.target.result);

      // Acceptă formatul nou de backup, dar și un fișier care conține direct obiectul state.
      const importedState = parsed.state || parsed;

      if (!importedState || typeof importedState !== 'object') {
        throw new Error('Format backup invalid.');
      }

      const validKeys = ['notes', 'verses', 'wtStudies', 'workbooks', 'meetings'];
      const hasValidShape = validKeys.some(key => Array.isArray(importedState[key]));
      if (!hasValidShape) {
        throw new Error('Fișierul nu pare să fie un backup StudiuMeu valid.');
      }

      const shouldImport = confirm(
        'Importul va înlocui datele salvate acum în aplicație. Continui?\n\n' +
        'Recomandare: fă mai întâi un export al datelor actuale.'
      );
      if (!shouldImport) return;

      state = {
        notes: Array.isArray(importedState.notes) ? importedState.notes : [],
        verses: Array.isArray(importedState.verses) ? importedState.verses : [],
        wtStudies: Array.isArray(importedState.wtStudies) ? importedState.wtStudies : [],
        workbooks: Array.isArray(importedState.workbooks) ? importedState.workbooks : [],
        meetings: Array.isArray(importedState.meetings) ? importedState.meetings : [],
        streak: Number(importedState.streak) || 0,
        lastStudyDate: importedState.lastStudyDate || null,
        bibleNotes: importedState.bibleNotes && typeof importedState.bibleNotes === 'object'
          ? importedState.bibleNotes
          : {},
      };

      saveState();

      // Importă și preferințele, dacă există în backup.
      if (parsed.preferences && typeof parsed.preferences === 'object') {
        const pref = parsed.preferences;

        if (pref.theme) localStorage.setItem('studiuMeu_theme', pref.theme);

        if (pref.yearText) localStorage.setItem('studiuMeu_yearText', pref.yearText);
        else localStorage.removeItem('studiuMeu_yearText');

        if (pref.yearColor) localStorage.setItem('studiuMeu_yearColor', pref.yearColor);
        else localStorage.removeItem('studiuMeu_yearColor');

        if (pref.yearSize) localStorage.setItem('studiuMeu_yearSize', pref.yearSize);
        else localStorage.removeItem('studiuMeu_yearSize');

        if (pref.fontScale) {
          localStorage.setItem('studiuMeu_fontScale', pref.fontScale);
          applyFontScale(parseInt(pref.fontScale));
          const sl = document.getElementById('fontScaleSlider');
          if (sl) sl.value = pref.fontScale;
        }
      }

      loadTheme();
      loadYearText();
      renderPage(currentPage);
      renderDashboard();

      showToast('Backup importat cu succes! ✅', 'success');
    } catch (error) {
      console.error('Import error:', error);
      showToast('Fișier invalid sau backup corupt.', 'error');
    }
  };

  reader.onerror = function () {
    showToast('Nu s-a putut citi fișierul.', 'error');
  };

  reader.readAsText(file);
}


// ============================================
// DISCURS BIBLIC MODAL + TIMER 30 MIN
// ============================================
let discursTimerInterval = null;
let discursTimerSeconds = 1800;
let discursTimerRunning = false;
let discursTimerFinished = false;

function openDiscursModal() {
  const modal = document.getElementById('discursModal');
  if (!modal) return;

  const draft = state.discursDraft || {};
  const titluEl = document.getElementById('discursTitlu');
  const versetEl = document.getElementById('discursVerset');
  const noteEl = document.getElementById('discursNote');
  const deleteBtn = document.getElementById('discursDeleteBtn');

  if (titluEl) titluEl.value = draft.titlu || '';
  if (versetEl) versetEl.value = draft.verset || '';
  if (noteEl) noteEl.value = draft.note || '';

  if (deleteBtn) deleteBtn.style.display = (draft.titlu || draft.note) ? 'inline-flex' : 'none';

  discursTimerReset();
  modal.classList.add('open');
}

function closeDiscursModal() {
  document.getElementById('discursModal')?.classList.remove('open');
  discursTimerStop();
}

function saveDiscursDraft() {
  if (!state.discursDraft) state.discursDraft = {};
  state.discursDraft = {
    titlu: document.getElementById('discursTitlu')?.value || '',
    verset: document.getElementById('discursVerset')?.value || '',
    note: document.getElementById('discursNote')?.value || '',
  };
  saveState();
}

function deleteDiscursDraft() {
  if (!confirm('Stergi ciorna discursului? Datele nu pot fi recuperate.')) return;
  state.discursDraft = {};
  saveState();
  const titluEl = document.getElementById('discursTitlu');
  const versetEl = document.getElementById('discursVerset');
  const noteEl = document.getElementById('discursNote');
  if (titluEl) titluEl.value = '';
  if (versetEl) versetEl.value = '';
  if (noteEl) { noteEl.value = ''; noteEl.disabled = false; }
  document.getElementById('discursDeleteBtn').style.display = 'none';
  discursTimerReset();
  showToast('Ciorna stearsa.', 'success');
}

function saveDiscursNote() {
  const titlu = document.getElementById('discursTitlu')?.value?.trim();
  const verset = document.getElementById('discursVerset')?.value?.trim();
  const note = document.getElementById('discursNote')?.value?.trim();

  if (!titlu) {
    showToast('Adauga titlul discursului.', 'error');
    document.getElementById('discursTitlu')?.focus();
    return;
  }

  const content = [
    verset ? '📖 Verset principal: ' + verset : '',
    note || 'Fara continut.'
  ].filter(Boolean).join('\n\n');

  state.notes.push({
    id: Date.now().toString(),
    title: '📢 Discurs: ' + titlu,
    content,
    category: 'general',
    tags: ['discurs', 'weekend'],
    date: new Date().toISOString().split('T')[0],
  });

  markStudyDay();
  saveState();
  showToast('Discursul a fost salvat ca notita! 📢', 'success');
  closeDiscursModal();
}

function discursTimerStart() {
  if (discursTimerFinished || discursTimerRunning) return;
  discursTimerRunning = true;
  document.getElementById('discursTimerStartBtn').style.display = 'none';
  document.getElementById('discursTimerPauseBtn').style.display = 'inline-flex';
  const ta = document.getElementById('discursNote');
  if (ta) ta.disabled = false;

  discursTimerInterval = setInterval(function() {
    if (discursTimerSeconds <= 0) {
      discursTimerFinish();
      return;
    }
    discursTimerSeconds--;
    discursTimerUpdateUI();
  }, 1000);
}

function discursTimerPause() {
  if (!discursTimerRunning) return;
  clearInterval(discursTimerInterval);
  discursTimerRunning = false;
  var startBtn = document.getElementById('discursTimerStartBtn');
  if (startBtn) { startBtn.style.display = 'inline-flex'; startBtn.textContent = '▶ Continua'; }
  document.getElementById('discursTimerPauseBtn').style.display = 'none';
}

function discursTimerStop() {
  clearInterval(discursTimerInterval);
  discursTimerRunning = false;
}

function discursTimerReset() {
  discursTimerStop();
  discursTimerSeconds = 1800;
  discursTimerFinished = false;

  var startBtn = document.getElementById('discursTimerStartBtn');
  var pauseBtn = document.getElementById('discursTimerPauseBtn');
  var ta = document.getElementById('discursNote');
  var blockedMsg = document.getElementById('discursBlockedMsg');
  var timerBar = document.getElementById('discursTimerBar');

  if (startBtn) { startBtn.style.display = 'inline-flex'; startBtn.textContent = '▶ Start'; }
  if (pauseBtn) pauseBtn.style.display = 'none';
  if (ta) ta.disabled = false;
  if (blockedMsg) blockedMsg.style.display = 'none';
  if (timerBar) { timerBar.classList.remove('timer-warning', 'timer-danger', 'timer-done'); }

  discursTimerUpdateUI();
}

function discursTimerFinish() {
  clearInterval(discursTimerInterval);
  discursTimerRunning = false;
  discursTimerFinished = true;
  discursTimerSeconds = 0;

  var ta = document.getElementById('discursNote');
  if (ta) ta.disabled = true;

  var blockedMsg = document.getElementById('discursBlockedMsg');
  if (blockedMsg) blockedMsg.style.display = 'block';

  var timerBar = document.getElementById('discursTimerBar');
  if (timerBar) timerBar.classList.add('timer-done');

  var startBtn = document.getElementById('discursTimerStartBtn');
  var pauseBtn = document.getElementById('discursTimerPauseBtn');
  if (startBtn) startBtn.style.display = 'none';
  if (pauseBtn) pauseBtn.style.display = 'none';

  document.getElementById('discursTimerValue').textContent = '00:00';
  document.getElementById('discursTimerIcon').textContent = '🔴';
  document.getElementById('discursTimerLabel').textContent = 'Timp expirat!';
  document.getElementById('discursTimerFill').style.width = '0%';

  saveDiscursDraft();
  showToast('⏰ Cele 30 de minute s-au incheiat! Discursul a fost blocat.', 'error');
}

function discursTimerUpdateUI() {
  var total = 1800;
  var remaining = discursTimerSeconds;
  var pct = (remaining / total) * 100;

  var mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  var ss = String(remaining % 60).padStart(2, '0');

  var valEl = document.getElementById('discursTimerValue');
  var fillEl = document.getElementById('discursTimerFill');
  var iconEl = document.getElementById('discursTimerIcon');
  var timerBar = document.getElementById('discursTimerBar');

  if (valEl) valEl.textContent = mm + ':' + ss;
  if (fillEl) fillEl.style.width = pct + '%';

  if (timerBar) {
    timerBar.classList.remove('timer-warning', 'timer-danger');
    if (remaining <= 120) {
      timerBar.classList.add('timer-danger');
      if (iconEl) iconEl.textContent = '🔴';
    } else if (remaining <= 300) {
      timerBar.classList.add('timer-warning');
      if (iconEl) iconEl.textContent = '🟠';
    } else {
      if (iconEl) iconEl.textContent = '⏱';
    }
  }
}

// ============================================
// HELPERS
// ============================================
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

let toastTimer = null;
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// INIT
// ============================================
function init() {
  loadState();
  loadTheme();
  updateGreeting();
  loadYearText();
  renderDashboard();

  // Textul anului - click pentru editare
  document.getElementById('yearTextBox')?.addEventListener('click', toggleYearTextEdit);

  // Navigation
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.dataset.page);
    });
  });

  // Theme toggle
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

  // Sidebar toggle
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });

  // Hamburger (mobile)
  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('mobile-open');
  });

  // Quick add
  document.getElementById('quickAddBtn')?.addEventListener('click', handleQuickAdd);

  // Search
  let searchTimer;
  document.getElementById('globalSearch')?.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => handleSearch(e.target.value), 400);
  });

  document.getElementById('globalSearch')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch(e.target.value);
  });

  // Filter tabs (notes)
  document.querySelectorAll('#notesFilters .filter-tab').forEach(btn => {
    btn.addEventListener('click', () => renderNotesList(btn.dataset.filter));
  });

  // Filter tabs (verses)
  document.querySelectorAll('#verseFilters .filter-tab').forEach(btn => {
    btn.addEventListener('click', () => renderVersesList(btn.dataset.filter));
  });

  // Watchtower progress auto-update
  document.getElementById('wt-paragraphs')?.addEventListener('input', updateWtProgress);

  // Close modals on overlay click
  document.getElementById('noteModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeNoteModal();
  });
  document.getElementById('paragraphModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeParagraphModal();
  });
  document.getElementById('discursModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeDiscursModal();
  });

  // Keyboard shortcut: Escape to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeNoteModal();
      closeParagraphModal();
      closeDiscursModal();
    }
  });

  // Update greeting every minute
  setInterval(updateGreeting, 60000);

  // Font scale control
  initFontScale();

  console.log('%c📖 StudiuMeu – Pregătire Întruniri', 'color:#4f8ef7;font-size:16px;font-weight:bold');
  console.log('%cAplicație personală pentru Martorii lui Iehova', 'color:#8b949e;font-size:12px');
}

// ============================================
// MĂRIRE TEXT GLOBAL (font scale 1–24px)
// ============================================
function applyFontScale(px) {
  document.documentElement.style.fontSize = px + 'px';
  const val = document.getElementById('fontScaleValue');
  if (val) val.textContent = px;
  localStorage.setItem('studiuMeu_fontScale', px);
}

function changeFontScale(delta) {
  const current = parseInt(localStorage.getItem('studiuMeu_fontScale')) || 14;
  const next = Math.min(24, Math.max(10, current + delta));
  applyFontScale(next);
}

function initFontScale() {
  const saved = parseInt(localStorage.getItem('studiuMeu_fontScale')) || 14;
  applyFontScale(saved);
}

document.addEventListener('DOMContentLoaded', init);
