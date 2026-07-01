'use strict';

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
