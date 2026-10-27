const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const app = readFileSync(path.join(root, 'dist/app.js'), 'utf8');
const defaults = readFileSync(path.join(root, 'dist/site.config.js'), 'utf8');

function render(customize = () => {}) {
  class Element {
    constructor(tag = 'div') {
      this.tag = tag;
      this.attributes = {};
      this.children = [];
      this.hidden = true;
      this.dataset = {};
      this.classList = { add() {}, toggle() {} };
    }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes.flatMap(n => n.tag === 'fragment' ? n.children : [n]); }
    addEventListener() {}
    getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; }
  }
  const ids = new Map();
  const meta = new Map(['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]'].map(k => [k, new Element('meta')]));
  const document = {
    hidden: false, title: '', head: new Element('head'), body: new Element(),
    addEventListener() {},
    getElementById(id) { if (!ids.has(id)) ids.set(id, new Element()); return ids.get(id); },
    querySelector(selector) { return selector === '.hero' ? new Element() : meta.get(selector) || null; },
    createElement: tag => new Element(tag),
    createElementNS: (_, tag) => new Element(tag),
    createDocumentFragment: () => new Element('fragment'),
  };
  const engine = { setPaused() {}, wake() {}, start() {}, end() {} };
  const window = {
    innerWidth: 1280, addEventListener() {}, setTimeout() { return 1; }, clearTimeout() {},
    matchMedia: () => ({ matches: false, addEventListener() {} }), createLightFluid: () => engine,
  };
  const context = vm.createContext({ window, document, Element, URL, console });
  vm.runInContext(defaults, context);
  window.LIGHT_SITE = { ...window.LIGHT_SITE };
  customize(window.LIGHT_SITE);
  vm.runInContext(app, context);
  return { ids, document, config: window.LIGHT_SITE };
}

test('default page uses generic branding and hides optional registration', () => {
  const r = render();
  assert.equal(r.ids.get('site-title').textContent, 'Light');
  assert.equal(r.document.title, 'Light · 个人主页');
  assert.equal(r.ids.get('icp-link').hidden, true);
  assert.equal(r.ids.get('icp-separator').hidden, true);
  assert.equal(r.document.head.children.length, 0);
  assert.equal(r.ids.get('sites').children.length, 4);
  for (const link of r.ids.get('sites').children) assert.equal(new URL(link.href).hostname, 'example.com');
});

test('custom site URL and registration update metadata without HTML injection', () => {
  const r = render(c => {
    c.name = '<b>My Home</b>';
    c.title = 'My Home';
    c.siteUrl = 'https://example.org/start/';
    c.icp = { label: 'Example registration', url: 'https://example.org/registration' };
  });
  assert.equal(r.ids.get('site-title').textContent, '<b>My Home</b>');
  assert.equal(r.ids.get('icp-link').hidden, false);
  assert.equal(r.ids.get('icp-separator').hidden, false);
  assert.equal(r.ids.get('icp-link').href, 'https://example.org/registration');
  assert.equal(r.document.head.children.find(n => n.attributes.rel === 'canonical').attributes.href, 'https://example.org/start/');
  assert.equal(r.document.head.children.find(n => n.attributes.property === 'og:url').attributes.content, 'https://example.org/start/');
});

test('invalid URLs do not become navigation, metadata, or registration links', () => {
  const r = render(c => {
    c.siteUrl = 'javascript:alert(1)';
    c.icp = { label: 'Invalid', url: 'data:text/html,invalid' };
    c.links = [null, { name: 'Invalid', url: 'javascript:alert(1)' }, { name: 'Local', url: '/relative' }, { name: '', url: 'https://example.org/' }, { name: 'Valid', url: 'https://example.org/', icon: 'unknown' }];
  });
  assert.equal(r.document.head.children.length, 0);
  assert.equal(r.ids.get('icp-link').hidden, true);
  assert.equal(r.ids.get('sites').children.length, 1);
  assert.equal(r.ids.get('sites').children[0].href, 'https://example.org/');
});

test('no-script fallback has the same default navigation and no registration', () => {
  const html = readFileSync(path.join(root, 'dist/index.html'), 'utf8');
  const r = render();
  const fallback = [...html.matchAll(/class="site-link" href="([^"]+)"/g)].map(m => m[1]);
  assert.equal(JSON.stringify(fallback), JSON.stringify(r.config.links.map(x => x.url)));
  assert.match(html, /id="icp-link"[^>]*hidden/);
  assert.match(html, /<h1 id="site-title">Light<\/h1>/);
});
