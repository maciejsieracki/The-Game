'use strict';
/**
 * R-WEB-PERF-LATE-GAME-LAG-HUD-Q2: test KONTRAKTU STRUKTURALNEGO (źródło) dla memo ramkowych.
 * Dowód wydajności i równoważności: runs/R-WEB-PERF-LATE-GAME-LAG-HUD-Q2/ (pomiar przed/po + bramki).
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const hud = fs.readFileSync(path.join(__dirname, '../src/ui/hud.ts'), 'utf8');
const main = fs.readFileSync(path.join(__dirname, '../src/main.ts'), 'utf8');
let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('PASS:', name); };

t('hud.ts: cfg.getState() wołane tylko w hudStateSnapshot', () => {
  const calls = hud.match(/cfg!?\.getState\(\)/g) || [];
  assert.equal(calls.length, 2, 'dwa wywołania (poza ramką + wypełnienie ramki), oba w hudStateSnapshot');
  const fnStart = hud.indexOf('function hudStateSnapshot()');
  const fnEnd = hud.indexOf('\n}\n', fnStart);
  assert.equal((hud.slice(fnStart, fnEnd).match(/cfg!?\.getState\(\)/g) || []).length, 2);
});
t('hud.ts: updateHud otwiera i zawsze zamyka ramkę (try/finally, zagnieżdżenie bezpieczne)', () => {
  const i = hud.indexOf('export function updateHud(): void');
  const body = hud.slice(i, hud.indexOf('\n}\n', i));
  assert.match(body, /const outer = hudStateFrameActive/);
  assert.match(body, /finally\s*\{[^}]*hudStateFrameActive = false[^}]*hudStateFrame = null/s);
});
t('hud.ts: poza updateHud snapshot czyta świeży stan', () => {
  assert.match(hud, /if \(!hudStateFrameActive\) return cfg!\.getState\(\)/);
});
t('main.ts: memo właściciela jest zakresowe i zwraca kopie', () => {
  assert.match(main, /let ownerScopeMemo: Map<string, unknown> \| null = null/);
  assert.match(main, /return new Set\(hit\)/);
  assert.match(main, /return new Map\(hit\)/);
  assert.match(main, /return \[\.\.\.hit\]/);
  assert.match(main, /try \{ return fn\(\); \} finally \{ ownerScopeMemo = null; \}/);
});
t('main.ts: odświeżenie HUD D1b idzie przez ramkę zdarzeń; zdarzenia kopiowane', () => {
  assert.match(main, /updateHud as refreshD1bHudRaw/);
  assert.match(main, /function refreshD1bHud\(\): void \{ withTurnEventsFrame\(\(\) => refreshD1bHudRaw\(\)\); \}/);
  assert.match(main, /return \[\.\.\.turnEventsFrame\]/);
});
t('main.ts: siatka granic przebudowywana tylko przy zmianie podpisu zawartości', () => {
  assert.match(main, /sig === territoryBorderSig\) return/);
  assert.match(main, /function clearTerritoryBorderOverlay\(\): void \{\s*territoryBorderSig = null/);
});
console.log(`\nWYNIK: ${pass} PASS, 0 FAIL`);
