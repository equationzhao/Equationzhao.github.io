(function () {
  var key = 'appearance';
  var legacyKey = 'theme';
  var themes = [
    { id: 'night-console', label: 'Night Console' },
    { id: 'crt-terminal', label: 'CRT Terminal' },
    { id: 'racing-dashboard', label: 'Racing Dashboard' },
    { id: 'alpine-brevet', label: 'Alpine Brevet' },
  ];
  var themeMap = themes.reduce(function (acc, theme) {
    acc[theme.id] = theme;
    return acc;
  }, {});
  var legacyMap = {
    dark: 'night-console',
    light: 'night-console',
  };

  function normalizeTheme(value) {
    var next = legacyMap[value] || value || 'night-console';
    return themeMap[next] ? next : 'night-console';
  }

  function currentTheme() {
    return normalizeTheme(
      document.documentElement.getAttribute('data-theme') ||
      localStorage.getItem(key) ||
      localStorage.getItem(legacyKey)
    );
  }

  function setAppearance(next, animate) {
    var theme = normalizeTheme(next);
    if (animate) {
      document.documentElement.classList.remove('appearance-changing');
      window.requestAnimationFrame(function () {
        document.documentElement.classList.add('appearance-changing');
      });
      window.setTimeout(function () {
        document.documentElement.classList.remove('appearance-changing');
      }, 460);
    }
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(key, theme);
    localStorage.removeItem(legacyKey);
    updatePicker(theme);
    window.dispatchEvent(new CustomEvent('appearancechange', { detail: { theme: theme } }));
  }

  function closeMenu() {
    var btn = document.getElementById('theme-toggle');
    var menu = document.getElementById('theme-menu');
    if (!btn || !menu) return;
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }

  function openMenu() {
    var btn = document.getElementById('theme-toggle');
    var menu = document.getElementById('theme-menu');
    if (!btn || !menu) return;
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  }

  function toggleMenu() {
    var menu = document.getElementById('theme-menu');
    if (!menu) return;
    if (menu.hidden) openMenu();
    else closeMenu();
  }

  function updatePicker(themeId) {
    var theme = themeMap[normalizeTheme(themeId)];
    var btn = document.getElementById('theme-toggle');
    var label = btn && btn.querySelector('.theme-label');
    if (btn) btn.dataset.themeValue = theme.id;
    if (label) label.textContent = theme.label;

    document.querySelectorAll('#theme-menu [data-theme-value]').forEach(function (option) {
      var selected = option.dataset.themeValue === theme.id;
      option.classList.toggle('is-selected', selected);
      option.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
  }

  function initAppearancePicker() {
    var theme = currentTheme();
    document.documentElement.setAttribute('data-theme', theme);
    updatePicker(theme);

    var btn = document.getElementById('theme-toggle');
    var menu = document.getElementById('theme-menu');
    if (!btn || !menu || btn.dataset.themeReady === 'true') return;
    btn.dataset.themeReady = 'true';

    btn.addEventListener('click', function () {
      toggleMenu();
    });

    menu.addEventListener('click', function (event) {
      var target = event.target;
      var option = target && target.closest ? target.closest('[data-theme-value]') : null;
      if (!option) return;
      setAppearance(option.dataset.themeValue, true);
      closeMenu();
    });
  }

  if (!window.__eqAppearanceReady) {
    window.__eqAppearanceReady = true;

    document.addEventListener('click', function (event) {
      var target = event.target;
      if (target && target.closest && target.closest('.appearance-switcher')) return;
      closeMenu();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });

    document.addEventListener('astro:page-load', initAppearancePicker);
  }

  window.__eqInitThemeToggle = initAppearancePicker;
  window.__eqSetAppearance = setAppearance;

  setAppearance(currentTheme(), false);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppearancePicker, { once: true });
  } else {
    initAppearancePicker();
  }
})();
