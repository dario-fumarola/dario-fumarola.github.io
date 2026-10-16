(() => {
  const figure = document.querySelector('.memory-demo');
  if (!figure) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = figure.querySelector('.memory-motion-toggle');
  const scene = figure.querySelector('.memory-usecase');
  const explanation = figure.querySelector('.memory-step-explanation');
  const steps = [...figure.querySelectorAll('[data-step]')];
  figure.querySelector('.memory-steps').hidden=false;
  const panels = [...figure.querySelectorAll('.memory-route-panel')].map(panel => ({
    reference:panel.querySelector('.memory-safe-reference'),
    proposal:panel.querySelector('.memory-current-proposal'),
    executed:panel.querySelector('.memory-executed-move'),
    reveal:panel.querySelector('.memory-move-reveal'),
    robot:panel.querySelector('.memory-robot'),
    blocked:panel.querySelector('.memory-blocked-mark'),
    obstacle:panel.querySelector('.memory-obstacle-group'),
    obstacleLabel:panel.querySelector('.memory-obstacle-label'),
    status:panel.querySelector('.memory-route-status')
  }));
  const records = [...figure.querySelectorAll('.memory-record')];
  const links = [...figure.querySelectorAll('.memory-history-links path')];
  const cells = [...figure.querySelectorAll('.memory-state-cells rect')];
  const readNodes = [...figure.querySelectorAll('.memory-read-node')];
  const input = figure.querySelector('.memory-input-record');
  const inputArrow = figure.querySelector('.memory-input-arrow');
  const loop = figure.querySelector('.memory-state-loop');
  const stateFrame = figure.querySelector('.memory-state-frame');
  const cycleDuration = 19200;
  const straight = [[28,100],[76,100],[96,100],[156,100],[202,100],[224,100],[276,100]];
  const detour = [[28,100],[76,100],[96,36],[156,36],[202,36],[224,100],[276,100]];
  const clamp = x => Math.max(0,Math.min(1,x));
  const ease = x => x*x*(3-2*x);
  const progress = (t,a,b) => ease(clamp((t-a)/(b-a)));
  const mix = (a,b,p) => a.map((v,i) => v+(b[i]-v)*p);
  const pair = p => p.map(v => v.toFixed(2)).join(' ');
  function curve(points) {
    return 'M'+pair(points[0])+points.slice(0,-1).map((point,i) => {
      const previous=points[Math.max(0,i-1)], next=points[i+1], after=points[Math.min(points.length-1,i+2)];
      const c1=point.map((v,j)=>v+(next[j]-previous[j])/6);
      const c2=next.map((v,j)=>v-(after[j]-point[j])/6);
      return 'C'+pair(c1)+' '+pair(c2)+' '+pair(next);
    }).join('');
  }
  let elapsed=0, startTime=0, frame=null, manuallyPaused=false, hasLooped=false;
  let variant=0, lastDraw=-Infinity, lastPhase='', safePoints, routeLength;
  function prepare() {
    safePoints=detour.map(p=>[p[0],variant?200-p[1]:p[1]]);
    const d=curve(safePoints);
    panels.forEach(panel=>{
      [panel.reference,panel.executed,panel.reveal].forEach(path=>path.setAttribute('d',d));
      panel.obstacleLabel.setAttribute('y',variant?54:166);
    });
    routeLength=panels[0].reference.getTotalLength();
    lastPhase='';
    figure.dataset.detour=variant?'lower':'upper';
  }
  function render(time) {
    const phase=time<2600?'observe':time<6500?'correct':time<16700?'next':'arrive';
    const adjustment=progress(time,2600,4200);
    const firstMove=.25*progress(time,4400,6100);
    const continuation=.75*progress(time,10300,16700);
    const distance=firstMove+continuation;
    const points=straight.map((point,i)=>mix(point,safePoints[i],adjustment));
    const proposal=curve(points);
    const position=panels[0].reference.getPointAtLength(distance*routeLength);
    scene.style.opacity=String(Math.min(hasLooped?clamp(time/250):1,clamp((cycleDuration-time)/350)));
    panels.forEach(panel=>{
      panel.proposal.setAttribute('d',proposal);
      panel.proposal.style.opacity=String(1-.55*progress(time,16700,17500));
      panel.reveal.style.strokeDashoffset=String(1-distance);
      panel.robot.setAttribute('transform','translate('+position.x.toFixed(2)+' '+position.y.toFixed(2)+')');
      panel.blocked.style.opacity=String(progress(time,400,1100)*(1-adjustment));
      panel.obstacle.style.opacity=String(.4+.6*progress(time,200,1100));
    });
    // Records accumulate; every query reads weighted values from the retained sequence.
    const arrivals=[-1,-1,-1,-1,900,3400,7200,11200];
    const pulses=[progress(time,1100,1500)*(1-progress(time,2100,2500)),progress(time,6900,7400)*(1-progress(time,9200,9700)),progress(time,11300,11800)*(1-progress(time,13500,14000))];
    const read=Math.max(...pulses);
    records.forEach((record,i)=>{
      const present=arrivals[i]<0?1:progress(time,arrivals[i],arrivals[i]+500);
      record.style.opacity=String(.12+.88*present);
      record.classList.toggle('is-correction',i===5&&adjustment>.1);
      const weight=i===4||i===5 ? 1 : i===records.length-1 ? .65 : .22;
      links[i].style.opacity=String(present*(.08+.8*read*weight));
      links[i].style.strokeWidth=String(.7+read*weight);
    });
    const stateChange=progress(time,2900,4300);
    cells.forEach((cell,i)=>{
      const original=[.25,.6,.35,.7,.3,.5][i];
      const corrected=[.75,.4,.8,.35,.7,.45][i];
      const update=(i%2?.12:-.12)*progress(time,7200,8300);
      cell.style.opacity=String(clamp(original+(corrected-original)*stateChange+update));
      cell.classList.toggle('is-edited',phase==='correct'&&(i===0||i===2||i===4));
    });
    stateFrame.classList.toggle('is-corrected',stateChange>.9);
    input.style.opacity=String(.3+.7*read);
    inputArrow.style.opacity=String(.25+.75*read);
    loop.style.opacity=String(.18+.82*Math.max(read,stateChange*(1-progress(time,4700,5700))));
    readNodes.forEach(node=>node.style.opacity=String(.35+.65*read));
    if(phase===lastPhase)return;
    figure.dataset.phase=phase;
    const selected=phase==='arrive'?'next':phase;
    steps.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.step===selected)));
    const copy={
      observe:['A new obstacle blocks the straight route. Both controllers need another way through.','Read the obstacle observation','Update from the new observation'],
      correct:['Both find the same detour. The recurrent controller writes the correction into its state.','Save the corrected plan as a record','Keep the state edit'],
      next:['Attention reads the saved sequence. The recurrent controller starts from the state it already corrected.','Read relevant records again','Reuse the corrected state'],
      arrive:['Both reach the goal. The saved sequence grew; the recurrent state stayed the same size.','Keep a longer saved sequence','Keep updating the same state']
    }[phase];
    explanation.textContent=copy[0];
    panels.forEach((panel,i)=>panel.status.textContent=copy[i+1]);
    lastPhase=phase;
  }
  function pause() {
    if(frame!==null)cancelAnimationFrame(frame);
    frame=null;
  }
  function tick(timestamp) {
    elapsed=timestamp-startTime;
    if(elapsed>=cycleDuration){
      const cycles=Math.floor(elapsed/cycleDuration);
      variant=(variant+cycles)%2;
      startTime+=cycles*cycleDuration;
      elapsed%=cycleDuration;
      hasLooped=true;
      prepare();
    }
    if(timestamp-lastDraw>=32){render(elapsed);lastDraw=timestamp;}
    frame=requestAnimationFrame(tick);
  }
  function play() {
    if(frame!==null||document.hidden||manuallyPaused||reducedMotion.matches)return;
    const bounds=figure.getBoundingClientRect();
    const shown=Math.max(0,Math.min(bounds.bottom,innerHeight)-Math.max(bounds.top,0));
    if(!bounds.height||shown/bounds.height<.35)return;
    figure.dataset.playback='playing';
    startTime=performance.now()-elapsed;
    frame=requestAnimationFrame(tick);
  }
  function updateToggle() {
    toggle.hidden=reducedMotion.matches;
    toggle.setAttribute('aria-pressed',String(manuallyPaused));
    toggle.querySelector('span').textContent=manuallyPaused?'Resume motion':'Pause motion';
    toggle.querySelector('path').setAttribute('d',manuallyPaused?'M5 3 12 8 5 13Z':'M5 3v10M11 3v10');
  }
  toggle.addEventListener('click',()=>{
    manuallyPaused=!manuallyPaused;
    if(manuallyPaused){pause();scene.style.opacity='1';figure.dataset.playback='paused';}else{pause();play();}
    updateToggle();
  });
  steps.forEach(button=>button.addEventListener('click',()=>{
    pause();manuallyPaused=true;
    elapsed={observe:1800,correct:5900,next:9200}[button.dataset.step];
    render(elapsed);scene.style.opacity='1';figure.dataset.playback='paused';updateToggle();
  }));
  new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting&&entries[0].intersectionRatio>=.35)play();else pause();
  },{threshold:.35}).observe(figure);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else play();});
  reducedMotion.addEventListener('change',()=>{
    pause();lastPhase='';
    if(reducedMotion.matches){render(9200);figure.dataset.playback='static';}
    else{elapsed=0;hasLooped=false;render(0);figure.dataset.playback=manuallyPaused?'paused':'ready';play();}
    updateToggle();
  });
  prepare();
  render(reducedMotion.matches?9200:0);
  figure.dataset.playback=reducedMotion.matches?'static':'ready';
  updateToggle();
})();
