/* ============================================
   StudiuMeu – FOOTNOTES (note de subsol / referințe biblice)
   Modul independent, folosit de secțiunea „Biblia – Studiu Offline”
   din bibleReader.js.

   CE FACE:
   - Ia textul lipit de utilizator (neschimbat, cuvânt cu cuvânt) și
     transformă marcajele de tip [a](url), [b](url), [*](url) — așa
     cum apar când textul e copiat de pe jw.org — în elemente <sup>
     interactive (data-uid, data-marker), fără să atingă restul textului.
   - La click/Enter pe un marcaj, deschide un mic popover unde utilizatorul
     poate scrie/lipi textul notei (pentru că paste-ul de pe jw.org NU
     include automat conținutul notei, doar linkul spre pagină).
   - Notele sunt salvate DOAR local, în `state.bibleFootnotes`,
     cheia fiind aceeași `bookSlug-capitol` folosită de restul modulului
     Bible Reader, plus un id unic per marcaj (fn1, fn2, ...).

   NU modifică textul versetelor și nu atinge alte funcții ale aplicației.
   ============================================ */

'use strict';

// Recunoaște marcaje de forma [a](orice-url), [b](...), [*](...)
// — exact formatul rezultat din copy/paste de pe jw.org.
const FOOTNOTE_MARKER_REGEX = /\[([a-zA-Z*])\]\([^)]*\)/g;

function ensureFootnoteStore() {
  if (!state.bibleFootnotes) state.bibleFootnotes = {};
}

function getFootnoteText(chapterKey, uid) {
  ensureFootnoteStore();
  return (state.bibleFootnotes[chapterKey] && state.bibleFootnotes[chapterKey][uid]) || '';
}

function setFootnoteText(chapterKey, uid, text) {
  ensureFootnoteStore();
  if (!state.bibleFootnotes[chapterKey]) state.bibleFootnotes[chapterKey] = {};
  if (text) {
    state.bibleFootnotes[chapterKey][uid] = text;
  } else {
    delete state.bibleFootnotes[chapterKey][uid];
  }
  saveState();
}

/**
 * Transformă textul brut (paste) în HTML afișabil:
 * - textul versetelor rămâne identic (doar scăpat pentru HTML)
 * - marcajele [a](url)/[*](url) devin <sup class="footnote-marker">
 * - liniile noi sunt păstrate vizual (<br>)
 */
function renderFootnoteText(rawText, chapterKey) {
  const escaped = escHtml(rawText || '');
  let counter = 0;
  const withMarkers = escaped.replace(FOOTNOTE_MARKER_REGEX, (match, marker) => {
    counter += 1;
    const uid = 'fn' + counter;
    const hasNote = !!getFootnoteText(chapterKey, uid);
    return `<sup class="footnote-marker${hasNote ? ' has-note' : ''}" ` +
      `data-chapter-key="${escHtml(chapterKey)}" data-uid="${uid}" data-marker="${escHtml(marker)}" ` +
      `tabindex="0" role="button" aria-label="Notă ${escHtml(marker)}">${escHtml(marker)}</sup>`;
  });
  return withMarkers.replace(/\n/g, '<br>');
}

/**
 * Randează textul offline al unui capitol (cu marcaje interactive)
 * într-un container din DOM, identificat prin id.
 */
function renderOfflineReadView(containerId, chapterKey, rawText) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!rawText || !rawText.trim()) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;margin:0">Niciun text salvat încă pentru acest capitol.</p>';
    return;
  }
  el.innerHTML = renderFootnoteText(rawText, chapterKey);
}

// ============================================
// POPOVER — afișare/editare notă la click pe marcaj
// ============================================

let fnPopoverEl = null;

function ensureFootnotePopover() {
  if (fnPopoverEl) return fnPopoverEl;
  fnPopoverEl = document.createElement('div');
  fnPopoverEl.id = 'footnotePopover';
  fnPopoverEl.className = 'footnote-popover';
  fnPopoverEl.style.display = 'none';
  document.body.appendChild(fnPopoverEl);
  return fnPopoverEl;
}

function closeFootnotePopover() {
  if (fnPopoverEl) fnPopoverEl.style.display = 'none';
}

function openFootnotePopover(markerEl) {
  const chapterKey = markerEl.getAttribute('data-chapter-key');
  const uid = markerEl.getAttribute('data-uid');
  const marker = markerEl.getAttribute('data-marker');
  const existing = getFootnoteText(chapterKey, uid);
  const pop = ensureFootnotePopover();

  pop.innerHTML = `
    <button class="footnote-popover-close" onclick="closeFootnotePopover()" title="Închide">✕</button>
    <div class="footnote-popover-label">Notă ${escHtml(marker)}</div>
    <textarea class="footnote-popover-input" placeholder="Lipește sau scrie textul notei...">${escHtml(existing)}</textarea>
    <div class="footnote-popover-actions">
      <button class="btn-primary btn-sm" onclick="saveFootnotePopover('${chapterKey}','${uid}', this)">💾 Salvează nota</button>
    </div>
  `;

  pop.style.display = 'block';
  positionFootnotePopover(pop, markerEl);
  const ta = pop.querySelector('.footnote-popover-input');
  if (ta) ta.focus();
}

function positionFootnotePopover(pop, markerEl) {
  const rect = markerEl.getBoundingClientRect();
  const popWidth = 280;
  let left = rect.left + window.scrollX;
  const maxLeft = window.scrollX + document.documentElement.clientWidth - popWidth - 12;
  if (left > maxLeft) left = Math.max(8, maxLeft);
  const top = rect.bottom + window.scrollY + 6;
  pop.style.top = top + 'px';
  pop.style.left = left + 'px';
}

function saveFootnotePopover(chapterKey, uid, btnEl) {
  const pop = btnEl.closest('.footnote-popover');
  const textarea = pop.querySelector('.footnote-popover-input');
  const text = textarea ? textarea.value.trim() : '';
  setFootnoteText(chapterKey, uid, text);

  document.querySelectorAll('.footnote-marker[data-chapter-key="' + chapterKey + '"][data-uid="' + uid + '"]')
    .forEach(function (m) { m.classList.toggle('has-note', !!text); });

  showToast(text ? 'Notă salvată! 📝' : 'Notă ștearsă.', 'success');
  closeFootnotePopover();
}

// Delegare globală de evenimente: click pe orice marcaj deschide popover-ul;
// click în afara popover-ului îl închide.
document.addEventListener('click', function (e) {
  const marker = e.target.closest && e.target.closest('.footnote-marker');
  if (marker) {
    e.stopPropagation();
    openFootnotePopover(marker);
    return;
  }
  if (fnPopoverEl && fnPopoverEl.style.display !== 'none' && !e.target.closest('#footnotePopover')) {
    closeFootnotePopover();
  }
});

// Accesibilitate: Enter/Space pe un marcaj focusat, Escape închide popover-ul.
document.addEventListener('keydown', function (e) {
  const active = document.activeElement;
  if ((e.key === 'Enter' || e.key === ' ') && active && active.classList && active.classList.contains('footnote-marker')) {
    e.preventDefault();
    openFootnotePopover(active);
  }
  if (e.key === 'Escape') closeFootnotePopover();
});
