// Keep an explicit theme choice consistent across the portfolio and project pages.
(function () {
  var toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;
  function updateLabel() {
    var dark = document.documentElement.dataset.theme === 'dark';
    toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.setAttribute('title', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  updateLabel();
  toggle.addEventListener('click', function () {
    var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    updateLabel();
  });
})();
