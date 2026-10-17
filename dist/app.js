(() => {
  'use strict';
  const ICON_PATHS = Object.freeze({
    camera: ['M4 8.5h3.1l1.25-2h3.3l1.25 2H20a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 20 18.5H4A1.5 1.5 0 0 1 2.5 17v-7A1.5 1.5 0 0 1 4 8.5Z', 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z'],
    member: ['M4 6.5h16A1.5 1.5 0 0 1 21.5 8v8A1.5 1.5 0 0 1 20 17.5H4A1.5 1.5 0 0 1 2.5 16V8A1.5 1.5 0 0 1 4 6.5Z', 'M6 10.5h12', 'M8 13.5h3'],
    activity: ['M3 12h3l2-6 4 12 2-6h7'],
    transfer: ['M4 8h14l-3-3', 'M20 16H6l3 3'],
  });

  function createIcon(key) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('aria-hidden', 'true');
    (ICON_PATHS[key] || ICON_PATHS.transfer).forEach(d => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      svg.append(path);
    });
    return svg;
  }

  const config = window.GX404_SITE;
  if (config && Array.isArray(config.links)) {
    document.getElementById('site-title').textContent = config.name;
    document.getElementById('footer-name').textContent = config.name;
    document.getElementById('tagline').textContent = config.tagline;
    document.getElementById('intro').textContent = config.intro;
    if (config.icp) {
      const registration = document.getElementById('icp-link');
      registration.textContent = config.icp.label;
      registration.href = config.icp.url;
      registration.setAttribute('aria-label', `${config.icp.label}（在新标签页打开）`);
    }
    const fragment = document.createDocumentFragment();
    config.links.forEach(item => {
      let url;
      try { url = new URL(item.url); } catch { return; }
      if (!['http:', 'https:'].includes(url.protocol)) return;
      const anchor = document.createElement('a');
      anchor.className = 'site-link';
      anchor.href = url.href;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.title = `${item.name} · ${url.hostname}（新标签页）`;
      const icon = document.createElement('span');
      icon.className = 'site-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.append(createIcon(item.icon));
      const name = document.createElement('span');
      name.textContent = item.name;
      const hint = document.createElement('span');
      hint.className = 'sr-only';
      hint.textContent = '（在新标签页打开）';
      anchor.append(icon, name, hint);
      fragment.append(anchor);
    });
    document.getElementById('sites').replaceChildren(fragment);
  }
  document.getElementById('year').textContent = String(new Date().getFullYear());

  const canvas = document.getElementById('fluid-background');
  const hint = document.getElementById('interaction-hint');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let engine;
  let unavailable = false;
  let introPlayed = false;
  let introTimer = null;
  const paused = () => motionQuery.matches;

  function stopIntro() {
    window.clearTimeout(introTimer);
    introTimer = null;
  }

  function playIntro() {
    if (introPlayed || introTimer !== null || !engine || paused() || document.hidden || unavailable) return;
    const hero = document.querySelector('.hero');
    const count = window.innerWidth < 600 ? 3 : 4;
    let index = 0;
    function splash() {
      introTimer = null;
      if (!engine || paused() || document.hidden || unavailable) return;
      introPlayed = true;
      const bounds = hero.getBoundingClientRect();
      // Spread the opening colors across the hero, away from navigation links.
      const x = bounds.left + bounds.width * (0.14 + 0.72 * (index + Math.random()) / count);
      const y = bounds.top + bounds.height * (0.2 + Math.random() * 0.5);
      engine.start('intro', x, y);
      engine.end('intro');
      index += 1;
      if (index < count) introTimer = window.setTimeout(splash, 240);
    }
    splash();
  }

  function initialise() {
    if (engine || unavailable || motionQuery.matches) return;
    try {
      engine = window.createGX404Fluid(canvas);
      canvas.dataset.renderer = 'webgl';
    } catch {
      unavailable = true;
      canvas.dataset.renderer = 'unavailable';
      canvas.hidden = true;
    }
  }

  function updateMotion() {
    if (!paused() && !document.hidden) initialise();
    engine?.setPaused(paused() || document.hidden);
    document.body.classList.toggle('motion-paused', paused() || document.hidden);
    hint.hidden = paused() || unavailable;
    if (paused() || document.hidden || unavailable) stopIntro();
    else { engine?.wake(); playIntro(); }
  }

  const activePointers = new Set();
  window.addEventListener('pointerdown', event => {
    if (paused() || unavailable || (event.pointerType === 'mouse' && event.button !== 0)) return;
    if (event.target instanceof Element && event.target.closest('a, button, input, textarea, select, [role="button"]')) return;
    introPlayed = true;
    stopIntro();
    activePointers.add(event.pointerId);
    engine?.start(event.pointerId, event.clientX, event.clientY);
    document.body.classList.add('has-interacted');
    if (event.target instanceof Element && event.target.closest('.hero')) {
      try { canvas.setPointerCapture(event.pointerId); } catch { /* Window listeners also cover uncaptured pointers. */ }
    }
  }, { passive: true });
  window.addEventListener('pointermove', event => {
    if (activePointers.has(event.pointerId)) engine?.move(event.pointerId, event.clientX, event.clientY);
  }, { passive: true });
  function endPointer(event) {
    activePointers.delete(event.pointerId);
    engine?.end(event.pointerId);
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  }
  window.addEventListener('pointerup', endPointer, { passive: true });
  window.addEventListener('pointercancel', endPointer, { passive: true });
  window.addEventListener('blur', () => {
    activePointers.forEach(id => engine?.end(id));
    activePointers.clear();
  });
  window.addEventListener('resize', () => engine?.resize(), { passive: true });
  document.addEventListener('visibilitychange', () => {
    activePointers.clear();
    updateMotion();
  });
  motionQuery.addEventListener('change', updateMotion);
  window.addEventListener('focus', updateMotion);
  window.addEventListener('pageshow', updateMotion);
  window.addEventListener('pagehide', () => {
    stopIntro();
    activePointers.clear();
    engine?.setPaused(true);
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    stopIntro();
    engine?.setPaused(true);
    engine = undefined;
    unavailable = true;
    canvas.hidden = true;
    hint.hidden = true;
    activePointers.clear();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    unavailable = false;
    canvas.hidden = false;
    updateMotion();
  });
  updateMotion();
})();

