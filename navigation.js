'use strict';

// ============================================
// NAVIGATION
// ============================================
const pageTitles = {
  dashboard: 'Panou Principal',
  watchtower: 'Turnul de Veghe – Studiu',
  discurs: 'Discurs Biblic – 30 minute',
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
  if (page === 'watchtower' || page === 'discurs') {
    document.getElementById('navGroup-watchtower')?.classList.add('open');
  }

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
    case 'bible': renderVersesList('all'); renderProphecies(); break;
    case 'meetings': renderMeetings(); break;
    case 'watchtower': renderWtParagraphs(); break;
    case 'discurs': renderDiscursPage(); break;
    case 'workbook': loadTalkDraft(); break;
    case 'biblereader': initBibleReader(); break;
    case 'fieldservice': renderFieldServiceList(); break;
  }
  updateWordCounters();
}

function toggleNavGroup(id) {
  document.getElementById(`navGroup-${id}`)?.classList.toggle('open');
}

// ============================================
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
