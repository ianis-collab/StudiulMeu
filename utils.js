/* ============================================
   StudiuMeu – UTILS
   Funcții helper, pure, fără dependențe de `state`.
   Pasul 1 al modularizării: extras 1:1 din app.js,
   fără nicio schimbare de comportament.
   ============================================ */

'use strict';

/**
 * Scapă caracterele HTML speciale dintr-un text, ca să poată fi
 * inserat în siguranță cu innerHTML (previne probleme de afișare/XSS).
 */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formatează o dată (string ISO) în format românesc citibil, ex: "27 iun. 2026".
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

// Referință internă la timer-ul toast-ului curent, ca să putem
// anula afișarea anterioară dacă apare un toast nou rapid.
let toastTimer = null;

/**
 * Afișează un mesaj scurt (toast) în colțul aplicației.
 * @param {string} message - textul de afișat
 * @param {'success'|'error'} type - stilul vizual al toast-ului
 */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
