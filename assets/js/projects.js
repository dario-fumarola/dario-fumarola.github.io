(() => {
  'use strict';

  // Mood Swings, eqs. 3–4. Example logits in the visual are illustrative.
  function distribution(logits, tau) {
    const temperature = 0.7 * Math.pow(1.8 / 0.7, tau);
    const max = Math.max(...logits);
    const weights = logits.map(value => Math.exp((value - max) / temperature));
    const total = weights.reduce((sum, value) => sum + value, 0);
    return { temperature, probabilities: weights.map(value => value / total) };
  }

  // Broadcast-Gain, eq. 7: survival without two adjacent lost attempts.
  function expectedSwitch(q, interval = 6) {
    let previous = 1;
    let current = 1;
    let cycles = 4;
    for (let n = 2; n <= 5; n += 1) {
      const next = q * current + q * (1 - q) * previous;
      cycles += next;
      previous = current;
      current = next;
    }
    return interval * cycles;
  }

  function patternSwitch(delivered, interval = 6) {
    for (let cycle = 4; cycle < 8; cycle += 1) {
      if (!delivered[cycle - 1] && !delivered[cycle - 2]) return cycle * interval;
    }
    return 8 * interval;
  }

  // Keep the exact calculations independently checkable without a browser.
  if (typeof module !== 'undefined' && module.exports) module.exports = { distribution, expectedSwitch, patternSwitch };
  if (typeof document === 'undefined') return;
  const $ = id => document.getElementById(id);
  const all = selector => [...document.querySelectorAll(selector)];
  const fixed = (value, digits = 1) => Number(value).toFixed(digits);
  const pressed = (selector, value, key) => all(selector).forEach(button => button.setAttribute('aria-pressed', String(button.dataset[key] === String(value))));
  const svgNode = (name, attributes) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };

  function bars(target, rows, maximum, suffix = '') {
    const nodes = rows.map(row => {
      const item = document.createElement('div');
      item.className = `bar-row${row.highlight ? ' highlight' : ''}`;
      const name = document.createElement('span');
      name.className = 'bar-name';
      name.textContent = row.name;
      const track = document.createElement('div');
      track.className = 'bar-track';
      track.setAttribute('aria-hidden', 'true');
      const fill = document.createElement('span');
      fill.className = 'bar';
      fill.style.setProperty('--bar-width', `${100 * row.value / maximum}%`);
      track.append(fill);
      const number = document.createElement('span');
      number.className = 'bar-number';
      number.textContent = `${fixed(row.value)}${row.half !== undefined ? ` ± ${fixed(row.half)}` : ''}${suffix}`;
      if (row.interval) {
        const interval = document.createElement('small');
        interval.textContent = `[${row.interval.map(value => fixed(value)).join(', ')}]`;
        number.append(interval);
      }
      item.append(name, track, number);
      return item;
    });
    $(target).replaceChildren(...nodes);
  }

  function initMood() {
    let mood = 'seeking';
    const exampleLogits = { seeking: [0, 2.2, 0.5, 1, 0.2], cautious: [0, 0.7, 0.3, 2.1, 0.2] };
    function updatePolicy() {
      const tau = Number($('mood-temperature').value);
      const { temperature, probabilities } = distribution(exampleLogits[mood], tau);
      const preferred = mood === 'seeking' ? 1 : 3;
      $('mood-temperature-value').textContent = fixed(tau, 2);
      $('mood-temperature').setAttribute('aria-valuetext', `Tau ${fixed(tau, 2)}, temperature ${fixed(temperature, 3)}`);
      all('#mood-probs .prob-column').forEach((column, index) => {
        column.classList.toggle('preferred', index === preferred);
        column.querySelector('.prob-fill').style.setProperty('--probability', probabilities[index]);
        column.querySelector('output').textContent = `${fixed(100 * probabilities[index], 0)}%`;
      });
      const east = mood === 'seeking';
      $('mood-east-route').setAttribute('class', `route ${east ? 'active' : 'inactive'}-route`);
      $('mood-west-route').setAttribute('class', `route ${east ? 'inactive' : 'active'}-route`);
      const entropy = -probabilities.reduce((sum, probability) => sum + probability * Math.log(probability), 0);
      $('mood-demo-summary').textContent = `Example actor favors ${east ? 'east' : 'west'}. T = ${fixed(temperature, 3)}; entropy = ${fixed(entropy, 3)} nats. Temperature keeps this ranking.`;
      pressed('[data-mood]', mood, 'mood');
    }
    all('[data-mood]').forEach(button => button.addEventListener('click', () => { mood = button.dataset.mood; updatePolicy(); }));
    $('mood-temperature').addEventListener('input', updatePolicy);
    updatePolicy();

    // Tables 11–12. Common alarm states, not the reset-based population.
    const outcomes = {
      pac: {
        failure: [[12.6,11.4,13.9],[8.4,7.4,9.5],[5.0,4.3,5.8],[3.9,3.2,4.7]],
        deadline: [[56.8,27.4,15.8],[63.4,13.6,23.0],[49.2,10.2,40.6]]
      },
      hack: {
        failure: [[18.4,16.7,20.1],[13.1,11.7,14.6],[7.9,6.7,9.2],[6.2,5.1,7.5]],
        deadline: [[48.5,41.8,9.7],[62.9,23.6,13.5],[48.6,18.8,32.6]]
      }
    };
    const failureNames = ['Continue seeking','Entropy-matched seeking','Cost weight to 0.7','Cost weight to 0.8'];
    const deadlineNames = ['Continue seeking','Cost weight to 0.7','Cost weight to 0.8'];
    function updateOutcomes() {
      const task = outcomes[$('mood-task').value];
      bars('mood-failure-chart', task.failure.map((entry, index) => ({ name: failureNames[index], value: entry[0], interval: entry.slice(1), highlight: index === 2 })), 20, '%');
      const rows = task.deadline.map((entry, index) => {
        const row = document.createElement('div');
        row.className = 'stack-row';
        const label = document.createElement('div');
        label.className = 'stack-label';
        label.textContent = deadlineNames[index];
        const chart = document.createElement('div');
        chart.className = 'stack-bar';
        chart.setAttribute('aria-hidden', 'true');
        entry.forEach((share, shareIndex) => {
          const part = document.createElement('span');
          part.className = ['', 'failure', 'timeout'][shareIndex];
          part.style.setProperty('--share', `${share}%`);
          chart.append(part);
        });
        const values = document.createElement('div');
        values.className = 'stack-values';
        values.textContent = `${fixed(entry[0])}% completed · ${fixed(entry[1])}% failed · ${fixed(entry[2])}% timed out`;
        row.append(label, chart, values);
        return row;
      });
      $('mood-deadline-chart').replaceChildren(...rows);
    }
    $('mood-task').addEventListener('change', updateOutcomes);
    updateOutcomes();

    // Table 5. cost, lower CI, upper CI, reward, completion, layout exceedance.
    const budgets = [0.10,0.15,0.20,0.35,0.50];
    const calibration = {
      pac: [[.082,.075,.090,125.8,39.6,20.3],[.126,.116,.137,136.7,46.9,19.5],[.168,.158,.178,142.4,51.8,18.8],[.309,.291,.327,157.1,58.8,21.5],[.452,.430,.475,166.0,60.2,23.4]],
      hack: [[.079,.070,.088,52.7,47.6,21.9],[.123,.113,.134,60.9,55.8,20.8],[.167,.157,.177,64.8,60.1,19.8],[.305,.286,.325,71.8,66.4,23.4],[.448,.423,.474,75.9,70.2,25.8]]
    };
    let budget = 2;
    const x = value => 50 + value * 390 / .55;
    const y = value => 195 - value * 175 / .55;
    function updateBudget() {
      const rows = calibration[$('budget-task').value];
      const row = rows[budget];
      $('budget-cost').replaceChildren(document.createTextNode(fixed(row[0], 3)));
      const interval = document.createElement('small');
      interval.textContent = `95% interval [${fixed(row[1],3)}, ${fixed(row[2],3)}]`;
      $('budget-cost').append(interval);
      $('budget-reward').textContent = fixed(row[3]);
      $('budget-completion').textContent = `${fixed(row[4])}%`;
      $('budget-exceedance').firstChild.textContent = `${fixed(row[5])}%`;
      $('budget-curve').setAttribute('d', rows.map((entry,index) => `${index ? 'L' : 'M'}${x(budgets[index])} ${y(entry[0])}`).join(' '));
      $('budget-dots').replaceChildren(...rows.flatMap((entry,index) => {
        const position = x(budgets[index]);
        return [
          svgNode('path', {d:`M${position} ${y(entry[1])}V${y(entry[2])}M${position-4} ${y(entry[1])}H${position+4}M${position-4} ${y(entry[2])}H${position+4}`,class:'ink',fill:'none','stroke-width':1.2}),
          svgNode('circle',{cx:position,cy:y(entry[0]),r:3})
        ];
      }));
      $('budget-selected').setAttribute('cx', x(budgets[budget]));
      $('budget-selected').setAttribute('cy', y(row[0]));
      $('budget-plot').setAttribute('aria-label', `${$('budget-task').selectedOptions[0].text}: requested ${fixed(budgets[budget],2)}, measured mean cost ${fixed(row[0],3)}. Five measured points.`);
      pressed('[data-budget]', budget, 'budget');
    }
    all('[data-budget]').forEach(button => button.addEventListener('click', () => { budget = Number(button.dataset.budget); updateBudget(); }));
    $('budget-task').addEventListener('change', updateBudget);
    updateBudget();
  }

  function initMemory() {
    // Table 1, ordered by the two storage bits: state * 2 + plan.
    const cache = {
      nav: [[0,0,3.86,7.53],[1.1,.7,3.64,7.25],[.8,.7,3.72,7.39],[1.8,.8,3.55,7.18]],
      chain: [[0,0,3.95,7.82],[1.7,1.1,3.79,7.56],[1.4,1.0,3.83,7.64],[2.8,1.2,3.70,7.43]]
    };
    function updateCache() {
      const state = $('keep-state').checked;
      const plan = $('keep-plan').checked;
      const row = cache[$('memory-task').value][Number(state) * 2 + Number(plan)];
      $('memory-cost').textContent = row[0] ? `${fixed(row[0])} ± ${fixed(row[1])}%` : '0% (reference)';
      $('memory-time').textContent = `${fixed(row[2],2)} ms`;
      $('memory-state-label').textContent = state ? 'corrected' : 'original proposal';
      $('memory-plan-label').textContent = plan ? 'corrected sequence' : 'not stored';
      $('memory-state-box').setAttribute('class', state ? 'wash-fill' : 'neutral-fill neutral-stroke');
      $('memory-plan-box').setAttribute('class', plan ? 'wash-fill' : 'neutral-fill neutral-stroke');
    }
    ['keep-state','keep-plan','memory-task'].forEach(id => $(id).addEventListener('change', updateCache));
    updateCache();

    // Tables 2–3: success, success half-width, contacts, contact half-width.
    const controllers = {
      nav: [
        ['Frozen recurrent policy',68.4,1.9,37.1,2.3],['CBF filter',79.2,1.6,6.4,.8],['Predictive filter',82.1,1.5,4.1,.6],
        ['Action refinement',83.9,1.4,15.9,1.1],['Action + state fitting',85.2,1.3,14.4,1.1],['State correction, discard',82.7,1.5,18.2,1.2],
        ['State correction, retain',85.4,1.3,14.2,1.0],['Warm-started MPC',85.8,1.3,6.0,.7]
      ],
      chain: [
        ['Frozen recurrent policy',58.6,2.0,24.6,1.8],['Action refinement',76.0,1.6,9.7,1.0],['Action + state fitting',78.1,1.5,8.3,.9],
        ['State correction, discard',74.2,1.7,11.1,1.1],['State correction, retain',78.6,1.5,8.1,.9],['Warm-started MPC',79.4,1.5,4.8,.7]
      ]
    };
    let metric = 'success';
    function updateControllers() {
      const success = metric === 'success';
      const offset = success ? 1 : 3;
      bars('controller-chart',controllers[$('controller-task').value].map(row => ({name:row[0],value:row[offset],half:row[offset+1],highlight:row[0] === 'State correction, retain'})),success ? 100 : 40,success ? '%' : '');
      $('controller-chart-title').textContent = success ? 'Episode success' : 'Contact-containing steps per 1,000';
      $('controller-unit').textContent = `${success ? 'Higher' : 'Lower'} is better · ${success ? '%' : 'Rate'} ± 95% half-width`;
      $('controller-scale').firstChild.textContent = `Bars use a ${success ? '0–100%' : '0–40 contact'} scale. Five independently trained models. `;
      pressed('[data-controller-metric]',metric,'controllerMetric');
    }
    all('[data-controller-metric]').forEach(button => button.addEventListener('click',() => {metric=button.dataset.controllerMetric;updateControllers();}));
    $('controller-task').addEventListener('change', updateControllers);
    updateControllers();

    // Table 4: signed cost reduction and reported interval half-width.
    const contexts = {nav:{stable:[2.0,1.2],target:[-.8,.9],stale:[-.5,1.0]},chain:{stable:[3.0,1.6],target:[-1.9,1.1],stale:[-1.4,1.2]}};
    const explanations = {
      stable:'The correction still fits the current target and observations.',
      target:'The next input announces a new reachable target. Retaining the old correction increases mean subsequent cost; the navigation interval includes zero.',
      stale:'Relevant sensor records are delayed by two inputs. The local optimizer can improve an objective built from outdated geometry.'
    };
    let context = 'stable';
    function updateContext() {
      const [value,half] = contexts[$('context-task').value][context];
      $('context-cost').textContent = `${fixed(Math.abs(value))}% ${value < 0 ? 'higher' : 'lower'} cost`;
      $('context-cost').classList.toggle('negative', value < 0);
      $('context-interval').textContent = `Cost reduction: ${fixed(value)}%; 95% interval [${fixed(value-half)}, ${fixed(value+half)}]`;
      $('context-explanation').textContent = context === 'target' && $('context-task').value === 'chain'
        ? 'The next input announces a new reachable target. Retaining the old correction increases mean subsequent cost.'
        : explanations[context];
      pressed('[data-context]',context,'context');
    }
    all('[data-context]').forEach(button => button.addEventListener('click',() => {context=button.dataset.context;updateContext();}));
    $('context-task').addEventListener('change',updateContext);
    updateContext();
  }

  function initBroadcast() {
    const x = q => 45 + 375*q;
    const y = time => 195 - (time-24)*150/24;
    $('deadline-curve').setAttribute('d',Array.from({length:101},(_,index) => {
      const q=index/100;
      return `${index ? 'L' : 'M'}${x(q)} ${y(expectedSwitch(q))}`;
    }).join(' '));
    function updateDelivery() {
      const q=Number($('delivery').value);
      const time=expectedSwitch(q);
      $('delivery-value').textContent=`${fixed(q*100,0)}%`;
      $('delivery').setAttribute('aria-valuetext',`${fixed(q*100,0)}% delivery, original expected switch ${fixed(time,2)} steps`);
      $('original-switch').firstChild.textContent=`${fixed(time,2)} `;
      $('delivery-marker').setAttribute('cx',x(q));
      $('delivery-marker').setAttribute('cy',y(time));
      $('delivery-marker-line').setAttribute('d',`M${x(q)} 195V${y(time)}`);
    }
    $('delivery').addEventListener('input',updateDelivery);
    updateDelivery();

    let pattern=Array(8).fill(true);
    const presets={none:Array(8).fill(false),all:Array(8).fill(true),mixed:[true,false,true,false,false,true,false,true]};
    function updatePattern() {
      const time=patternSwitch(pattern);
      all('[data-cycle]').forEach((button,index) => {
        button.setAttribute('aria-pressed',String(pattern[index]));
        button.setAttribute('aria-label',`Report at step ${(index+1)*6} ${pattern[index] ? 'delivered' : 'lost'}`);
        button.dataset.switch=String((index+1)*6===time);
      });
      all('[data-pattern]').forEach(button => button.setAttribute('aria-pressed',String(presets[button.dataset.pattern].every((value,index)=>value===pattern[index]))));
      $('pattern-switch').textContent=`step ${time}`;
      $('pattern-green').textContent=`${time+2} vs. 26`;
      $('pattern-explanation').textContent=time===48 ? 'Filled dots are delivered reports. No eligible empty-cache boundary occurs before cycle eight, so original BG reaches its maximum. The deadline ignores that extension.' : `Two lost attempts empty the cache at step ${time}. Original BG switches then; BG-D switches at 24. Reports shown after step ${time} do not affect this first switch.`;
    }
    all('[data-cycle]').forEach(button => button.addEventListener('click',() => {const index=Number(button.dataset.cycle);pattern[index]=!pattern[index];updatePattern();}));
    all('[data-pattern]').forEach(button => button.addEventListener('click',() => {pattern=[...presets[button.dataset.pattern]];updatePattern();}));
    updatePattern();

    // Table 5, one-factor tests: p95 wait and rate for each scheduler.
    const workloads={
      reference:[[156.8,683.6],[184.6,653.8],[173.4,678.9],[164.9,682.8]],
      balanced:[[143.5,691.2],[164.7,666.3],[149.8,697.0],[141.9,699.5]],
      unbalanced:[[307.2,443.8],[283.0,485.4],[214.5,632.0],[263.7,546.2]],
      fast:[[171.6,679.8],[203.7,641.1],[190.2,661.5],[178.4,675.3]],
      clear1:[[139.7,714.2],[167.8,685.9],[154.6,711.8],[146.8,715.7]],
      clear6:[[280.4,477.2],[181.6,655.1],[202.3,663.8],[192.7,641.6]],
      pop80:[[77.6,476.8],[91.4,454.8],[96.3,454.6],[82.9,470.8]],
      pop180:[[211.6,757.5],[244.8,731.4],[237.9,749.8],[222.4,756.2]]
    };
    const notes={
      reference:'Reference: 140 agents, 70% report loss, reports every six steps, two-step clearance, and 75:25 demand alternating every 256 steps. The 12-step timer has the lowest waiting here.',
      balanced:'Steady balanced demand gives BG-D(24) the lowest mean waiting and highest throughput among these four schedulers.',
      unbalanced:'With persistent 90:10 demand, original BG uses long phases on the busy axis. Capping it at 24 steps raises p95 waiting by 49.2 steps and reduces throughput.',
      fast:'Axis preference alternates every 64 steps. The 12-step timer retains the lowest waiting; longer holds respond more slowly.',
      clear1:'One-step clearance makes frequent switching cheap. Fixed 12 has the lowest waiting, while BG-D(24) has slightly higher throughput.',
      clear6:'A 12-step phase now spends half its time closed. Fixed 24 has the lowest waiting; original BG has the highest throughput. BG-D can switch earlier on evidence and pay clearance more often.',
      pop80:'With 80 agents, the 12-step timer has the lowest waiting and highest throughput among these schedulers.',
      pop180:'With 180 agents, the 12-step timer still leads on both waiting and throughput. BG-D(24) improves both measures over original BG.'
    };
    let metric='wait';
    function updateWorkload() {
      const key=$('workload').value;
      const waiting=metric==='wait';
      bars('workload-chart',workloads[key].map((row,index)=>({name:['Fixed 12','Fixed 24','Original BG','BG-D(24)'][index],value:row[waiting ? 0 : 1],highlight:index===3})),waiting ? 350 : 800);
      $('workload-chart-title').textContent=waiting ? 'p95 waiting' : 'Throughput';
      $('workload-unit').textContent=waiting ? 'Steps · Lower is better' : 'Crossings per 1,000 steps · Higher is better';
      $('workload-scale').textContent=`Bars use a ${waiting ? '0–350 step' : '0–800 crossing'} scale. Means from Table 5; controller settings are not retuned.`;
      $('workload-explanation').textContent=notes[key];
      pressed('[data-workload-metric]',metric,'workloadMetric');
    }
    all('[data-workload-metric]').forEach(button=>button.addEventListener('click',()=>{metric=button.dataset.workloadMetric;updateWorkload();}));
    $('workload').addEventListener('change',updateWorkload);
    updateWorkload();
  }

  const initializers={mood:initMood,memory:initMemory,broadcast:initBroadcast};
  const init=initializers[document.body.dataset.project];
  if (init) init();
})();
