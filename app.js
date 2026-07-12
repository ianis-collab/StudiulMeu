/* ============================================
   StudiuMeu – APP (INIT & UTILITĂȚI GLOBALE)
   Inițializarea aplicației, scalarea fontului,
   numărătoarea cuvintelor și backup export/import.

   Ordinea de încărcare în index.html:
     1. storage.js
     2. utils.js
     3. nav.js
     4. dashboard.js
     5. watchtower.js
     6. workbook.js
     7. discurs.js
     8. bible-study.js
     9. notes-meetings.js
    10. app.js  ← acest fișier
   ============================================ */

'use strict';

// ============================================
// INIT
// ============================================
function init() {
  loadState();
  loadTheme();
  updateGreeting();
  loadYearText();
  renderDashboard();

  // Textul anului – click pentru editare
  document.getElementById('yearTextBox')?.addEventListener('click', toggleYearTextEdit);

  // Navigare prin sidebar
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.dataset.page);
    });
  });

  // Temă
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

  // Sidebar collapse
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });

  // Sidebar extindere (vizibil doar când sidebar e restrâns)
  document.getElementById('sidebarExpandBtn')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('collapsed');
  });

  // Hamburger (mobil)
  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('mobile-open');
  });

  // Buton „+" rapid
  document.getElementById('quickAddBtn')?.addEventListener('click', handleQuickAdd);

  // Căutare globală
  let searchTimer;
  document.getElementById('globalSearch')?.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => handleSearch(e.target.value), 400);
  });
  document.getElementById('globalSearch')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch(e.target.value);
  });

  // Filtre notițe
  document.querySelectorAll('#notesFilters .filter-tab').forEach(btn => {
    btn.addEventListener('click', () => renderNotesList(btn.dataset.filter));
  });

  // Filtre versete
  document.querySelectorAll('#verseFilters .filter-tab').forEach(btn => {
    btn.addEventListener('click', () => renderVersesList(btn.dataset.filter));
  });

  // Progres Turnul de Veghe (auto-update la schimbare)
  document.getElementById('wt-paragraphs')?.addEventListener('input', updateWtProgress);

  // Închidere modală la click pe overlay
  document.getElementById('noteModal')?.addEventListener('click', function (e) {
    if (e.target === this) closeNoteModal();
  });
  document.getElementById('paragraphModal')?.addEventListener('click', function (e) {
    if (e.target === this) closeParagraphModal();
  });

  // Escape – închide modale
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeNoteModal(); closeParagraphModal(); }
  });

  // Actualizare salut la fiecare minut
  setInterval(updateGreeting, 60000);

  // Scalare font
  initFontScale();
  initNoteFontSizes();

  console.log('%c📖 StudiuMeu – Pregătire Întruniri', 'color:#4f8ef7;font-size:16px;font-weight:bold');
  console.log('%cAplicație personală pentru Martorii lui Iehova', 'color:#8b949e;font-size:12px');
}

// ============================================
// (Scalarea fontului global și pentru notițe este acum
//  în fontScale.js; numărătoarea de cuvinte în wordCounter.js
//  — nu se mai duplică aici pentru a evita erori de redeclarare)
// ============================================

// ============================================
// EXPORT / IMPORT BACKUP
// ============================================
function exportData() {
  try {
    saveState();
    const backup = {
      app:        'StudiuMeu',
      version:    1,
      exportedAt: new Date().toISOString(),
      state,
      preferences: {
        theme:     localStorage.getItem('studiuMeu_theme')     || 'dark',
        yearText:  localStorage.getItem('studiuMeu_yearText')  || '',
        yearColor: localStorage.getItem('studiuMeu_yearColor') || '#e6edf3',
        yearSize:  localStorage.getItem('studiuMeu_yearSize')  || '14',
        fontScale: localStorage.getItem('studiuMeu_fontScale') || '14',
      },
    };

    const json  = JSON.stringify(backup, null, 2);
    const blob  = new Blob([json], { type: 'application/json' });
    const url   = URL.createObjectURL(blob);
    const today = new Date().toISOString().split('T')[0];
    const link  = document.createElement('a');
    link.href      = url;
    link.download  = `studiu-meu-backup-${today}.json`;
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
    const input    = document.createElement('input');
    input.type     = 'file';
    input.accept   = 'application/json,.json';
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
      const parsed        = JSON.parse(event.target.result);
      const importedState = parsed.state || parsed;

      if (!importedState || typeof importedState !== 'object') throw new Error('Format backup invalid.');

      const validKeys    = ['notes', 'verses', 'wtStudies', 'workbooks', 'meetings'];
      const hasValidShape= validKeys.some(key => Array.isArray(importedState[key]));
      if (!hasValidShape) throw new Error('Fișierul nu pare să fie un backup StudiuMeu valid.');

      const shouldImport = confirm(
        'Importul va înlocui datele salvate acum în aplicație. Continui?\n\n' +
        'Recomandare: fă mai întâi un export al datelor actuale.'
      );
      if (!shouldImport) return;

      state = {
        notes:        Array.isArray(importedState.notes)      ? importedState.notes      : [],
        verses:       Array.isArray(importedState.verses)     ? importedState.verses     : [],
        wtStudies:    Array.isArray(importedState.wtStudies)  ? importedState.wtStudies  : [],
        workbooks:    Array.isArray(importedState.workbooks)  ? importedState.workbooks  : [],
        meetings:     Array.isArray(importedState.meetings)   ? importedState.meetings   : [],
        streak:       Number(importedState.streak) || 0,
        lastStudyDate:importedState.lastStudyDate || null,
        bibleNotes:   importedState.bibleNotes && typeof importedState.bibleNotes === 'object'
          ? importedState.bibleNotes : {},
        publications: Array.isArray(importedState.publications) ? importedState.publications : [],
        videoMeta:    importedState.videoMeta && typeof importedState.videoMeta === 'object'
          ? importedState.videoMeta : {},
      };
      saveState();

      if (parsed.preferences && typeof parsed.preferences === 'object') {
        const pref = parsed.preferences;
        if (pref.theme)     localStorage.setItem('studiuMeu_theme', pref.theme);
        if (pref.yearText)  localStorage.setItem('studiuMeu_yearText', pref.yearText);
        else                localStorage.removeItem('studiuMeu_yearText');
        if (pref.yearColor) localStorage.setItem('studiuMeu_yearColor', pref.yearColor);
        else                localStorage.removeItem('studiuMeu_yearColor');
        if (pref.yearSize)  localStorage.setItem('studiuMeu_yearSize', pref.yearSize);
        else                localStorage.removeItem('studiuMeu_yearSize');
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

  reader.onerror = function () { showToast('Nu s-a putut citi fișierul.', 'error'); };
  reader.readAsText(file);
}

// ============================================
// PORNIRE
// ============================================
document.addEventListener('DOMContentLoaded', init);
document.addEventListener('DOMContentLoaded', updateWordCounters);
