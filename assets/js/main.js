// Show all work by default; filters progressively enhance the complete list.
(function () {
  var buttons = document.querySelectorAll('.filter-btn');
  var cards = document.querySelectorAll('.project-card[data-category]');
  function filter(category) {
    var visible = [];
    cards.forEach(function (card) {
      card.hidden = category !== 'all' && card.dataset.category !== category;
      card.classList.remove('second-column', 'last-row');
      if (!card.hidden) visible.push(card);
    });
    visible.forEach(function (card, index) {
      card.classList.toggle('second-column', index % 2 === 1);
      card.classList.toggle('last-row', index >= Math.floor((visible.length - 1) / 2) * 2);
    });
  }
  filter('all');
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      buttons.forEach(function (other) {
        other.setAttribute('aria-pressed', String(other === button));
      });
      filter(button.dataset.filter);
    });
  });
})();
