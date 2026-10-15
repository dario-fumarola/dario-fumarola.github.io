(() => {
  'use strict';
  // Equation 7 and Appendix B of Broadcast-Gain.
  function survival(q) {
    const f = [1, 1];
    for (let n = 2; n <= 5; n += 1) f[n] = q * f[n - 1] + q * (1 - q) * f[n - 2];
    return f;
  }
  function expectedSwitch(q, interval = 6) {
    return interval * (4 + survival(q).slice(2).reduce((sum, value) => sum + value, 0));
  }
  function switchDistribution(q) {
    const f = survival(q);
    return [1 - f[2], f[2] - f[3], f[3] - f[4], f[4] - f[5], f[5]];
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { expectedSwitch, switchDistribution };
  if (typeof document === 'undefined' || document.body.dataset.project !== 'broadcast') return;
  const $ = id => document.getElementById(id);
  const x = q => 45 + 375 * q;
  const y = time => 195 - (time - 24) * 150 / 24;
  $('deadline-curve').setAttribute('d', Array.from({ length: 101 }, (_, i) => {
    const q = i / 100;
    return (i ? 'L' : 'M') + x(q) + ' ' + y(expectedSwitch(q));
  }).join(' '));
  function update() {
    const q = Number($('delivery').value);
    const time = expectedSwitch(q);
    $('delivery-value').textContent = Math.round(q * 100) + '%';
    $('delivery').setAttribute('aria-valuetext', Math.round(q * 100) + ' percent delivery. Original expected switch ' + time.toFixed(2) + ' steps.');
    $('original-switch').textContent = time.toFixed(2) + ' steps';
    $('delivery-marker').setAttribute('cx', x(q));
    $('delivery-marker').setAttribute('cy', y(time));
    $('delivery-marker-line').setAttribute('d', 'M' + x(q) + ' 195V' + y(time));
    const probabilities = switchDistribution(q);
    [...($('switch-distribution')?.children || [])].forEach((column, index) => {
      column.querySelector('output').textContent = (100 * probabilities[index]).toFixed(1) + '%';
      column.querySelector('i').style.height = 100 * probabilities[index] + '%';
    });
  }
  $('delivery').addEventListener('input', update);
  update();
})();
