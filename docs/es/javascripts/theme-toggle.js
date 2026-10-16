const THEME_STORAGE_KEY = 'deporteca-theme';
const LIGHT_THEME = 'light';
const DARK_THEME = 'dark';

function getStoredTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY);
}

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_THEME : LIGHT_THEME;
}

// Zensical colorea la página según data-md-color-scheme (slate = oscuro, default = claro)
const MD_SCHEME = { [DARK_THEME]: 'slate', [LIGHT_THEME]: 'default' };

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-md-color-scheme', MD_SCHEME[theme]);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  updateToggleButton(theme);
}

function getCurrentTheme() {
  return getStoredTheme() || DARK_THEME;
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  setTheme(currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME);
}

function updateToggleButton(theme) {
  const button = document.querySelector('.theme-toggle');
  if (button) {
    button.textContent = theme === DARK_THEME ? '☀️' : '🌙';
    button.title = theme === DARK_THEME ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
  }
}

function initThemeToggle() {
  setTheme(getCurrentTheme());

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!getStoredTheme()) {
      setTheme(e.matches ? DARK_THEME : LIGHT_THEME);
    }
  });

  if (!document.querySelector('.theme-toggle')) {
    const button = document.createElement('button');
    button.className = 'theme-toggle';
    button.setAttribute('aria-label', 'Cambiar tema');
    button.addEventListener('click', toggleTheme);
    document.body.appendChild(button);
    updateToggleButton(getCurrentTheme());
  } else {
    document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeToggle);
} else {
  initThemeToggle();
}
