// Runs before the stylesheet to avoid a flash of the wrong theme.
(() => {
  const key = 'tgw-theme';
  const valid = value => ['light', 'dark', 'system'].includes(value);
  let preference = 'system';
  try {
    const stored = localStorage.getItem(key);
    if (valid(stored)) preference = stored;
  } catch { /* Themes still work when browser storage is unavailable. */ }
  function apply(value) {
    preference = valid(value) ? value : 'system';
    document.documentElement.dataset.theme = preference;
    const control = document.querySelector('#theme-choice');
    if (control) control.value = preference;
  }
  apply(preference);
  document.addEventListener('DOMContentLoaded', () => {
    const control = document.querySelector('#theme-choice');
    control.value = preference;
    control.closest('.theme-picker').hidden = false;
    control.addEventListener('change', () => {
      apply(control.value);
      try { localStorage.setItem(key, preference); } catch { /* Session-only override. */ }
    });
  });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) apply(event.newValue);
  });
})();