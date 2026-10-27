(() => {
  'use strict';
  const ICON_PATHS = Object.freeze({
    grid: ['M3 3h7v7H3Z', 'M14 3h7v7h-7Z', 'M3 14h7v7H3Z', 'M14 14h7v7h-7Z'],
    book: ['M12 5v15', 'M3 4h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z'],
    user: ['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z', 'M4 21v-2a8 8 0 0 1 16 0v2'],
    mail: ['M3 5h18v14H3Z', 'M3 6l9 7 9-7'],
  });

  function createIcon(key) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('aria-hidden', 'true');
    (ICON_PATHS[key] || ICON_PATHS.grid).forEach(d => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      svg.append(path);
    });
    return svg;
  }

  function httpUrl(value) {
    if (typeof value !== 'string') return null;
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) ? url : null;
    } catch { return null; }
  }

  const config = window.LIGHT_SITE;
  if (config && typeof config === 'object') {
    document.getElementById('site-title').textContent = config.name;
    document.getElementById('footer-name').textContent = config.name;
    document.getElementById('tagline').textContent = config.tagline;
    document.getElementById('intro').textContent = config.intro;
    document.title = config.title || config.name;
    document.querySelector('meta[name="description"]').setAttribute('content', config.description || config.intro || '');
    document.querySelector('meta[property="og:title"]').setAttribute('content', document.title);
    document.querySelector('meta[property="og:description"]').setAttribute('content', config.description || config.intro || '');
    const siteUrl = httpUrl(config.siteUrl);
    if (siteUrl) {
      const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', siteUrl.href);
      const shareUrl = document.querySelector('meta[property="og:url"]') || document.createElement('meta');
      shareUrl.setAttribute('property', 'og:url');
      shareUrl.setAttribute('content', siteUrl.href);
      document.head.append(canonical, shareUrl);
    }
    const registration = document.getElementById('icp-link');
    const separator = document.getElementById('icp-separator');
    const registrationUrl = httpUrl(config.icp?.url);
    if (registrationUrl && typeof config.icp.label === 'string' && config.icp.label.trim()) {
      registration.textContent = config.icp.label;
      registration.href = registrationUrl.href;
      registration.setAttribute('aria-label', `${config.icp.label}（在新标签页打开）`);
      registration.hidden = false;
      separator.hidden = false;
    } else {
      registration.hidden = true;
      separator.hidden = true;
    }
    if (Array.isArray(config.links)) {
      const fragment = document.createDocumentFragment();
      config.links.forEach(item => {
        if (!item || typeof item.name !== 'string' || !item.name.trim()) return;
        const url = httpUrl(item.url);
        if (!url) return;
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
      engine = window.createLightFluid(canvas);
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

