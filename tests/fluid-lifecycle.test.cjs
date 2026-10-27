const {readFileSync} = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const mainRoot = path.resolve(__dirname, '..');
const fluid = readFileSync(path.join(mainRoot, 'dist/vendor/fluid.js'), 'utf8');
const scheduler = fluid.slice(fluid.indexOf('let lastUpdateTime ='), fluid.indexOf('function calcDeltaTime'));
const adapter = fluid.slice(fluid.lastIndexOf('return {'), fluid.lastIndexOf('\n};'));
function fixture(script) {
  const handlers = new Map(), frames = new Map();
  let clock = 1000, next = 0;
  const listen = (type, fn) => handlers.set(type, [...(handlers.get(type)||[]), fn]);
  const element = () => ({setAttribute(){}, append(){}, replaceChildren(){}, classList:{add(){},toggle(){}}, dataset:{}, hidden:false, addEventListener:listen, getBoundingClientRect:()=>({left:0,top:0,width:1200,height:700})});
  const document = {hidden:false, addEventListener:listen, createElement:element, getElementById:element, querySelector:element, body:element()};
  const motion = {matches:false, addEventListener:listen};
  const box = {document, matchMedia:()=>motion, innerWidth:1200, innerHeight:800, Element:class{}, URL, Math,
    Date:{now:()=>clock}, config:{PAUSED:false}, pointers:[], gl:{isContextLost:()=>false},
    requestAnimationFrame:fn=>{const id=++next; frames.set(id,fn); return id;}, cancelAnimationFrame:id=>frames.delete(id),
    setTimeout:()=>0, clearTimeout(){}, render(){}, resizeCanvas:()=>false, initFramebuffers(){}, updateColors(){}, applyInputs(){}, step(){}, calcDeltaTime:()=>.016};
  box.Date = class extends Date { static now(){return clock;} };
  box.window = {...box, addEventListener:listen};
  const ctx = vm.createContext(box);
  const engine = vm.runInContext(`(function(){${scheduler}\n${adapter}})()`,ctx);
  engine.start = () => {throw new Error('Resume must not require pointer input or a new splash');};
  box.window.createLightFluid = () => engine;
  // Intro is already played: reproduce a returning visitor, not opening splashes.
  script = script.replace('let introPlayed = false;', 'let introPlayed = true;').replace('seeded = false', 'seeded = true');
  vm.runInContext(script,ctx);
  const emit = type => {for(const fn of handlers.get(type)||[])fn();};
  return {frames,document,motion,emit,advance(ms){clock+=ms;},tick(){const pending=[...frames.values()];frames.clear();for(const fn of pending)fn();}};
}
const inputs=[['main',readFileSync(path.join(mainRoot,'dist/app.js'),'utf8')]];
for(const [name,script] of inputs) {
  test(`${name}: return after more than 20 seconds resumes without clicking`,()=>{
    const f=fixture(script);
    f.document.hidden=true; f.emit('visibilitychange'); assert.equal(f.frames.size,0);
    f.advance(30000); f.document.hidden=false; f.emit('visibilitychange');
    assert.equal(f.frames.size,1); f.tick(); assert.equal(f.frames.size,1);
    for(let i=0;i<5;i++)f.emit('focus'); assert.equal(f.frames.size,1);
  });
  test(`${name}: page restoration resumes, reduced motion stays paused`,()=>{
    const f=fixture(script);
    f.emit('pagehide'); assert.equal(f.frames.size,0);
    f.advance(30000); f.emit('pageshow'); assert.equal(f.frames.size,1);
    f.motion.matches=true;f.emit('change');f.emit('focus');assert.equal(f.frames.size,0);
    f.motion.matches=false;f.emit('change');assert.equal(f.frames.size,1);
  });
}
