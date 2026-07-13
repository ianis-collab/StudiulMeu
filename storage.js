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
  temeCursant: [],
  prophecies: [],
  streak: 0,
  lastStudyDate: null,
  publications: [],
  videoMeta: {},
  songs: [],
  lastPlayedSongId: null,
  myUser: null,      // { id, name } — identitatea folosită la trimiterea cuvântărilor
  contacts: [],       // [{ id, name }] — persoane cu care s-au trimis/primit cuvântări

  // Programul întrunirii de ieșire pe teren (3 coloane: Marți, Vineri, Sâmbătă)
  fieldServiceSchedule: null, // se inițializează cu valori implicite la loadState()

  // Setări notificări (anunț cu o zi înainte / în ziua respectivă)
  notifSettings: { enabled: false },
};

// Valorile implicite ale programului, folosite doar dacă utilizatorul nu are deja
// o versiune salvată în localStorage.
function defaultFieldServiceSchedule() {
  return {
    marti:   { label: 'MARȚI - ora 17 - ZOOM',              color: '#bcd4ea', rows: [] },
    vineri:  { label: 'VINERI - ora 17 - ZOOM',             color: '#f2c4ad', rows: [] },
    sambata: { label: 'SÂMBĂTĂ - ora 9.30 - Sala Regatului', color: '#f4c430', rows: [] },
  };
}

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

  // Dacă nu există deja un program salvat, se inițializează cu datele din poza
  // primită de la utilizator (28 aprilie - 18 iulie 2026).
  if (!state.fieldServiceSchedule) {
    const sch = defaultFieldServiceSchedule();
    sch.marti.rows = [
      ['28 aprilie', 'POPESCU VALI'], ['5 mai', 'KHILBURG DANIEL'], ['12 mai', 'DRAGAN ION'],
      ['19 mai', 'PETREA IONEL'], ['26 mai', 'MIHOC PETRE'], ['2 iunie', 'LAZAR VIOREL'],
      ['9 iunie', 'POINESCU ILIE'], ['16 iunie', 'TRICA LAZAR'], ['23 iunie', 'POPESCU VALI'],
      ['30 iunie', 'DRAGAN ION'], ['7 iulie', 'OROS SORIN'], ['14 iulie', 'POPESCU VALI'],
    ].map(([data, nume]) => ({ data, nume }));
    sch.vineri.rows = [
      ['1 mai', 'RIJNITA REMUS'], ['8 mai', 'LAZAR VIOREL'], ['15 mai', 'POINESCU ILIE'],
      ['22 mai', 'TRICA LAZAR'], ['29 mai', 'KHILBURG DANIEL'], ['5 iunie', 'DRAGAN ION'],
      ['12 iunie', 'OROS SORIN'], ['19 iunie', 'CONGRES INTERNATIONAL'], ['26 iunie', 'PETREA IONEL'],
      ['3 iulie', 'POINESCU ILIE'], ['10 iulie', 'LAZAR FLAVIUS'], ['17 iulie', 'LAZAR COSMIN'],
    ].map(([data, nume]) => ({ data, nume }));
    sch.sambata.rows = [
      ['2 mai', 'GHEORGHE ILIE'], ['9 mai', 'VILSAN MIRCEA'], ['16 mai', 'MOTRE MIHAI'],
      ['23 mai', 'LAZAR FLAVIUS'], ['30 mai', 'LAZAR COSMIN'], ['6 iunie', 'RIJNITA REMUS'],
      ['13 iunie', 'VILSAN MIRCEA'], ['20 iunie', 'CONGRES INTERNATIONAL'], ['27 iunie', 'MIHOC PETRE'],
      ['4 iulie', 'TRICA LAZAR'], ['11 iulie', 'RIJNITA REMUS'], ['18 iulie', 'MOTRE MIHAI'],
    ].map(([data, nume]) => ({ data, nume }));
    state.fieldServiceSchedule = sch;
    saveState();
  }
}

/**
 * Salvează `state` curent în localStorage (serializat ca JSON).
 */
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
