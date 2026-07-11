'use strict';

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
