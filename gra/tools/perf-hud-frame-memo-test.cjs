'use strict';
/**
 * R-WEB-PERF-LATE-GAME-LAG-HUD-Q2 (R1 obrona): test BEHAWIORALNY (kod z src/game/frame-memo.ts uruchamiany naprawdę,
 * esbuild transform + new Function) + kontrakt wiązań w main.ts/hud.ts + dowód, że siatka granic nie czyta rzeźby terenu.
 * Równoważność memo na żywym stanie gry (137 miast): harness tools/perf-late-game-interaction-r2-live-test.cjs, sekcja `equiv`
 * (hooki perfEquiv / perfHudFresh), wynik w runs/R-WEB-PERF-LATE-GAME-LAG-HUD-Q2/evidence/.
 * Bramka: node tools/perf-hud-frame-memo-test.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const hud = read('src/ui/hud.ts');
const main = read('src/main.ts');
const overlay = read('src/render/rangeOverlay.ts');

const js = esbuild.transformSync(read('src/game/frame-memo.ts'), { loader: 'ts', format: 'cjs' }).code;
const mod = { exports: {} };
new Function('module', 'exports', js)(mod, mod.exports);
const { createScopeMemo, createStateFrame } = mod.exports;

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('PASS:', name); };

// ---------------------------------------------------------------- StateFrame (migawka HUD)
t('StateFrame: poza zakresem każdy odczyt jest świeży', () => {
  let n = 0; const f = createStateFrame(() => ({ v: ++n }));
  assert.equal(f.snapshot().v, 1); assert.equal(f.snapshot().v, 2);
});
t('StateFrame: w zakresie jedno getState(), ta sama migawka; po zakresie znów świeżo', () => {
  let n = 0; const f = createStateFrame(() => ({ v: ++n }));
  const seen = [];
  f.run(() => { seen.push(f.snapshot().v, f.snapshot().v, f.snapshot().v); });
  assert.deepEqual(seen, [1, 1, 1]);
  assert.equal(n, 1);
  assert.equal(f.snapshot().v, 2);
});
t('StateFrame: HUD pokazuje aktualne dane po mutacji stanu PRZED updateHud (kolejne odświeżenia)', () => {
  const world = { gold: 1 }; const f = createStateFrame(() => ({ gold: world.gold }));
  const dom = [];
  const updateHud = () => f.run(() => { dom.push(f.snapshot().gold); dom.push(f.snapshot().gold); });
  updateHud(); world.gold = 7; updateHud(); world.gold = 9; updateHud();
  assert.deepEqual(dom, [1, 1, 7, 7, 9, 9]);
});
t('StateFrame: zagnieżdżone odświeżenie po mutacji NIE renderuje starej migawki (zarzut 5)', () => {
  const world = { gold: 1 }; const f = createStateFrame(() => ({ gold: world.gold }));
  const dom = [];
  const updateHud = (inner) => f.run(() => {
    dom.push(['a', f.snapshot().gold]);
    if (inner) { world.gold = 42; updateHud(false); } // moduł HUD zmienia stan i woła odświeżenie synchronicznie
    dom.push(['b', f.snapshot().gold]);               // zewnętrzne odświeżenie czyta po zagnieżdżonym
  });
  updateHud(true);
  assert.deepEqual(dom, [['a', 1], ['a', 42], ['b', 42], ['b', 42]]);
});
t('StateFrame: wyjątek w zakresie zamyka ramkę (brak przecieku starej migawki)', () => {
  const world = { gold: 1 }; const f = createStateFrame(() => ({ gold: world.gold }));
  assert.throws(() => f.run(() => { f.snapshot(); throw new Error('boom'); }), /boom/);
  world.gold = 5; assert.equal(f.snapshot().gold, 5);
});
t('StateFrame: invalidate() wymusza nowy odczyt w obrębie zakresu', () => {
  const world = { gold: 1 }; const f = createStateFrame(() => ({ gold: world.gold }));
  f.run(() => { assert.equal(f.snapshot().gold, 1); world.gold = 2; f.invalidate(); assert.equal(f.snapshot().gold, 2); });
});

// ---------------------------------------------------------------- ScopeMemo (memo per właściciel)
t('ScopeMemo: poza zakresem zawsze liczy od nowa', () => {
  const m = createScopeMemo(); let n = 0;
  m.cached('k', () => ++n, x => x); m.cached('k', () => ++n, x => x);
  assert.equal(n, 2);
});
t('ScopeMemo: w zakresie liczy raz per klucz; wynik równy wersji bez memo', () => {
  const world = { built: ['a', 'b'] };
  const raw = owner => new Set(world.built.map(x => x + owner));
  const m = createScopeMemo(); let calls = 0;
  const memo = owner => m.cached('built:' + owner, () => { calls++; return raw(owner); }, v => new Set(v));
  m.run(() => {
    for (let i = 0; i < 40; i++) assert.deepEqual([...memo(1)].sort(), [...raw(1)].sort());
    assert.equal(calls, 1);
    assert.deepEqual([...memo(2)].sort(), [...raw(2)].sort());
    assert.equal(calls, 2);
  });
});
t('ScopeMemo: kopia chroni wpis przed zanieczyszczeniem; nowy zakres nie widzi starych wpisów po mutacji świata', () => {
  const world = { built: ['a'] };
  const m = createScopeMemo();
  const memo = () => m.cached('k', () => new Set(world.built), v => new Set(v));
  m.run(() => { const s = memo(); s.add('POLLUTE'); assert.deepEqual([...memo()], ['a']); });
  world.built.push('b');
  m.run(() => { assert.deepEqual([...memo()].sort(), ['a', 'b']); });
  assert.deepEqual([...memo()].sort(), ['a', 'b']); // poza zakresem też świeżo
});
t('ScopeMemo: zagnieżdżony run współdzieli zakres; wyjątek zamyka zakres', () => {
  const m = createScopeMemo(); let n = 0;
  m.run(() => { m.cached('k', () => ++n, x => x); m.run(() => { m.cached('k', () => ++n, x => x); assert.equal(m.active, true); }); assert.equal(m.active, true); });
  assert.equal(n, 1); assert.equal(m.active, false);
  assert.throws(() => m.run(() => { throw new Error('x'); }), /x/);
  assert.equal(m.active, false);
});

// ---------------------------------------------------------------- wiązania (kod produkcyjny używa tych samych pomocników)
t('hud.ts: getState() wołane tylko przez StateFrame; updateHud = hudFrame.run', () => {
  assert.equal((hud.match(/cfg!?\.getState\(\)/g) || []).length, 1);
  assert.match(hud, /createStateFrame<HudState>\(\(\) => cfg!\.getState\(\)\)/);
  assert.match(hud, /export function updateHud\(\): void \{\s*hudFrame\.run\(/);
});
t('main.ts: memo właściciela przez createScopeMemo; zwracane kolekcje kopiowane', () => {
  assert.match(main, /const ownerScope = createScopeMemo\(\)/);
  // R6: w zakresie czystego odczytu (hudPureScope) wpisy idą do wspólnego zakresu; poza nim do ownerScope. `placed:` przejęła pamięć z main (FALA 523).
  assert.match(main, /import \{[^}]*hudPureScope[^}]*\} from '\.\/game\/frame-memo'/);
  assert.match(main, /\.cached\('built:'[^\n]*new Set\(v\)/);
  assert.match(main, /\.cached\('labels:'[^\n]*\[\.\.\.v\]/);
});
t('main.ts: odświeżenie HUD D1b idzie przez ramkę zdarzeń; zdarzenia kopiowane', () => {
  assert.match(main, /updateHud as refreshD1bHudRaw/);
  assert.match(main, /function refreshD1bHud\(\): void \{ withTurnEventsFrame\(\(\) => refreshD1bHudRaw\(\)\); \}/);
  assert.match(main, /return \[\.\.\.turnEventsFrame\]/);
});
t('main.ts: zagnieżdżone withTurnEventsFrame unieważnia ramkę zdarzeń przed i po (R6 uwaga FC 5)', () => {
  const i = main.indexOf('function withTurnEventsFrame');
  const body = main.slice(i, main.indexOf('function refreshD1bHud', i));
  assert.match(body, /if \(turnEventsFrame !== undefined\) \{[\s\S]*turnEventsFrame = null;\s*try \{ fn\(\); \} finally \{ turnEventsFrame = null; \}\s*return;/);
});
t('main.ts: siatka granic przebudowywana tylko przy zmianie podpisu zawartości', () => {
  assert.match(main, /sig === territoryBorderSig\) return/);
  assert.match(main, /function clearTerritoryBorderOverlay\(\): void \{\s*territoryBorderSig = null/);
});
t('rangeOverlay.ts: siatka granic czyta z mapy WYŁĄCZNIE istnienie heksu (rzeźba terenu nie wpływa na podpis, zarzut 7)', () => {
  const i = overlay.indexOf('function buildTerritoryBorderMesh');
  const body = overlay.slice(i, overlay.indexOf('\n}\n', i));
  const uses = body.match(/map\.[a-zA-Z]+(\[[^\]]*\])?/g) || [];
  assert.deepEqual([...new Set(uses)], ['map.hexes[`${q},${r}`]']);
  assert.match(body, /if \(!hex\) return null;\s*return axialToWorld\(q, r, HEX_R\)/);
  const j = overlay.indexOf('export function buildTerritoryBorderGroup');
  const g = overlay.slice(j, overlay.indexOf('\n}\n', j));
  assert.ok(!/terenBazowy|map\.hexes/.test(g.replace(/\/\/.*$/gm, '')), 'grupa nie czyta terenu z mapy');
});
console.log(`\nWYNIK: ${pass} PASS, 0 FAIL`);
