// Theme toggle (theme is applied pre-paint by the inline script in <head>)
(function () {
  var toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', function () {
    var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
  });
})();

// Photo slideshow
(function () {
  var slides = document.querySelectorAll('.slideshow .slide');
  if (slides.length < 2) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var current = 0;
  setInterval(function () {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 5000);
})();

// Conference / Research tabs
(function () {
  var buttons = document.querySelectorAll('.pill-btn');
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      buttons.forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.projects-section').forEach(function (s) {
        s.classList.remove('active');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      var target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
})();
