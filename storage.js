/* ============================================
   StudiuMeu – STORAGE
   Tot ce ține de persistarea datelor în localStorage.
   Pasul 1 al modularizării: extras 1:1 din app.js,
   fără nicio schimbare de comportament.
   ============================================ */

'use strict';

// Cheia principală sub care se salvează tot obiectul `state`
const STORAGE_KEY = 'studiuMeu_data';

// Starea centrală a aplicației. Toate modulele citesc/scriu în acest obiect.
// (Notă: structura rămâne EXACT cea din app.js original, ca să nu se piardă
// datele utilizatorilor care au deja salvări în localStorage.)
let state = {
  notes: [],
  verses: [],
  wtStudies: [],
  workbooks: [],
  discursTalks: [],
  meetings: [],
  prophecies: [],
  streak: 0,
  lastStudyDate: null,
  publications: [],
  videoMeta: {},
};

/**
 * Încarcă `state` din localStorage și rulează curățarea notițelor/caietelor
 * "orfane" (fără notiță corespondentă), exact ca în versiunea originală.
 */
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
  } catch (e) { console.error('Load error:', e); }
}

/**
 * Salvează `state` curent în localStorage (serializat ca JSON).
 */
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
