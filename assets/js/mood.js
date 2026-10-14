(() => {
  const figure = document.querySelector('.mood-junction');
  if (!figure) return;
  const controls = figure.querySelector('.mood-settings');
  const buttons = [...controls.querySelectorAll('button')];
  const note = figure.querySelector('.mood-route-note');
  const descriptions = {
    seeking: 'Seeking favors the eastern shortcut.',
    cautious: 'Caution favors the western detour.'
  };

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const setting = button.dataset.setting;
      figure.dataset.setting = setting;
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      note.textContent = descriptions[setting];
    });
  });
  controls.hidden = false;
})();
