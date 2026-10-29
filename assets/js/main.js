// Keep the photo frame stable, and rotate only while the visitor can see it.
(function () {
  var gallery = document.querySelector('.portrait-gallery');
  if (!gallery) return;
  var slides = Array.from(gallery.querySelectorAll('.portrait-slide'));
  var controls = gallery.querySelector('.portrait-controls');
  var count = gallery.querySelector('.photo-count');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var current = 0;
  var manuallyControlled = false;
  var hovered = false;
  var focused = false;
  var visible = true;
  var timer = null;
  var request = 0;
  controls.hidden = false;

  function schedule() {
    clearTimeout(timer);
    if (manuallyControlled || motion.matches || hovered || focused || !visible || document.hidden) return;
    timer = setTimeout(function () { show(current + 1); }, 7000);
  }
  function show(index) {
    clearTimeout(timer);
    index = (index + slides.length) % slides.length;
    var target = slides[index];
    var token = ++request;
    // Decode before fading so a slow connection never produces an empty frame.
    target.decode().then(function () {
      if (token !== request) return;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
        slide.setAttribute('aria-hidden', String(i !== index));
      });
      current = index;
      count.textContent = (current + 1) + ' / ' + slides.length;
      schedule();
    }).catch(function () { if (token === request) schedule(); });
  }
  gallery.querySelector('.photo-previous').addEventListener('click', function () { manuallyControlled = true; show(current - 1); });
  gallery.querySelector('.photo-next').addEventListener('click', function () { manuallyControlled = true; show(current + 1); });
  gallery.addEventListener('keydown', function (event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    manuallyControlled = true;
    show(current + (event.key === 'ArrowRight' ? 1 : -1));
  });
  gallery.addEventListener('mouseenter', function () { hovered = true; schedule(); });
  gallery.addEventListener('mouseleave', function () { hovered = false; schedule(); });
  gallery.addEventListener('focusin', function () { focused = true; schedule(); });
  gallery.addEventListener('focusout', function (event) {
    focused = gallery.contains(event.relatedTarget);
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', schedule);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      schedule();
    }).observe(gallery);
  }
  schedule();
})();
