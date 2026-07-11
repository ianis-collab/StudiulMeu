'use strict';

// ============================================
// SETĂRI – deschidere / închidere modal
// ============================================
function openSettingsModal() {
  syncSettingsThemeSwitch();
  document.getElementById('settingsModal')?.classList.add('open');
}

function closeSettingsModal() {
  document.getElementById('settingsModal')?.classList.remove('open');
}

// ============================================
// SWITCH TEMĂ (în panoul de Setări)
// Folosește toggleTheme() deja existentă în theme.js,
// doar sincronizează poziția cercului alb.
// ============================================
function toggleSettingsTheme() {
  toggleTheme();
  syncSettingsThemeSwitch();
}

function syncSettingsThemeSwitch() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const sw = document.getElementById('settingsThemeSwitch');
  if (sw) sw.setAttribute('aria-pressed', String(!isDark));
}

// ============================================
// EXPORT CUVÂNTĂRI CA WORD (.doc)
// Include Cuvântarea de 5 minute (ciornă curentă)
// și toate Cuvântările de 30 minute salvate.
// ============================================
function exportTalksWord() {
  try {
    const today = new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });

    let body = `<h1>Cuvântări – StudiuMeu</h1><p class="meta">Exportat la data de ${escHtml(today)}</p>`;

    // --- Cuvântările de 5 minute ---
    body += `<h2>🎤 Cuvântările de 5 minute</h2>`;
    const talks5 = Array.isArray(state.talk5Talks) ? state.talk5Talks : [];

    if (talks5.length === 0) {
      body += `<p>Nicio cuvântare de 5 minute salvată încă.</p>`;
    } else {
      const sorted5 = [...talks5].sort((a, b) => new Date(b.date) - new Date(a.date));
      sorted5.forEach(talk => {
        body += `<h3>${escHtml(talk.subject || 'Fără subiect')} — ${escHtml(formatDate(talk.date))} (${escHtml(talk.duration || '5 minute')})</h3>`;
        body += `<p><strong>Notițe:</strong></p>`;
        body += `<p>${escHtml(talk.notes || '').replace(/\n/g, '<br>') || '—'}</p>`;
        body += `<hr>`;
      });
    }

    // --- Cuvântările de 30 minute (Discurs Biblic) ---
    body += `<h2>📢 Cuvântările de 30 minute (Discurs Biblic)</h2>`;
    const talks30 = Array.isArray(state.discursTalks) ? state.discursTalks : [];

    if (talks30.length === 0) {
      body += `<p>Nicio cuvântare de 30 minute salvată încă.</p>`;
    } else {
      const sorted = [...talks30].sort((a, b) => new Date(b.data) - new Date(a.data));
      sorted.forEach(talk => {
        const sections = Array.isArray(talk.sections) ? talk.sections : [];
        const totalMin = sections.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

        body += `<h3>${escHtml(talk.titlu || 'Fără titlu')} — ${escHtml(formatDate(talk.data))} (${totalMin} min)</h3>`;
        if (talk.verset) body += `<p><strong>Verset:</strong> ${escHtml(talk.verset)}</p>`;

        if (sections.length) {
          body += `<p><strong>Subtitluri:</strong></p><ol>`;
          sections.forEach(s => {
            body += `<li>${escHtml(s.title)} (${escHtml(String(s.duration))} min)</li>`;
          });
          body += `</ol>`;
        }

        body += `<p><strong>Notițe:</strong></p>`;
        body += `<p>${escHtml(talk.note || '').replace(/\n/g, '<br>') || '—'}</p>`;
        body += `<hr>`;
      });
    }

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Cuvântări</title>
        <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 12pt; color: #1a2035; }
          h1 { color: #2b5797; font-size: 20pt; margin-bottom: 4pt; }
          h2 { color: #4f8ef7; font-size: 15pt; margin-top: 22pt; border-bottom: 1px solid #ccc; padding-bottom: 4pt; }
          h3 { font-size: 13pt; margin-top: 16pt; margin-bottom: 2pt; }
          .meta { color: #666; font-size: 10pt; margin-bottom: 14pt; }
          hr { border: none; border-top: 1px solid #ddd; margin: 14pt 0; }
        </style>
      </head>
      <body>${body}</body>
      </html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const dateForFile = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `cuvantari-studiu-meu-${dateForFile}.doc`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast('Cuvântările au fost exportate în Word! 📝', 'success');
  } catch (error) {
    console.error('Export Word error:', error);
    showToast('Nu s-au putut exporta cuvântările.', 'error');
  }
}
