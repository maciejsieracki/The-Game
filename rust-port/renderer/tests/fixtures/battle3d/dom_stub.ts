// Universal DOM/WebAudio stub for running `new BattleScene(...)` under node
// (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q2). Every property read returns another
// stub, every call / construct returns a stub, writes are accepted. The
// generator dumps ONLY the THREE object graph (`scene`, `camera`); the stub's
// values never reach it (camera aspect stays the constructor's literal 1 —
// `_onResize` is never called).
const LAYOUT = new Set(['clientWidth', 'clientHeight', 'offsetWidth', 'offsetHeight', 'scrollWidth', 'scrollHeight', 'width', 'height', 'top', 'left', 'right', 'bottom', 'x', 'y']);
function mk(): any {
  const f = function () {};
  return new Proxy(f, {
    get(_t, p) {
      if (p === Symbol.toPrimitive) return (hint: string) => (hint === 'number' ? 0 : '');
      if (p === 'then') return undefined;
      if (p === Symbol.iterator) return function* () {};
      if (p === 'length') return 0;
      // A headless canvas/element has no layout: every size reads 0, so
      // `_syncRendererSize` returns early (`w === 0`) and camera.aspect keeps 1.
      if (typeof p === 'string' && LAYOUT.has(p)) return 0;
      return mk();
    },
    set() { return true; },
    apply() { return mk(); },
    construct() { return mk(); },
    has() { return true; },
  });
}
const g = globalThis as any;
g.window = g;
g.document = mk();
g.location = { search: '', href: '' };
g.requestAnimationFrame = () => 0;
g.cancelAnimationFrame = () => {};
g.addEventListener = () => {};
g.removeEventListener = () => {};
g.devicePixelRatio = 1;
g.innerWidth = 1280;
g.innerHeight = 720;
g.HTMLElement = class {};
g.HTMLCanvasElement = class {};
g.getComputedStyle = () => mk();
g.matchMedia = () => mk();
g.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
g.sessionStorage = g.localStorage;
g.ResizeObserver = class { observe() {} disconnect() {} };
g.Image = class {};
export {};
