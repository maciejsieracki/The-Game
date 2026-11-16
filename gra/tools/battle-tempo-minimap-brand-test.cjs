'use strict';
/**
 * R-WEB-UI-BATTLE-TEMPO-MINIMAP-PANEL-BRANDBOOK-Q1 — test oprawy panelu Tempo + minimapy w bitwie.
 *
 * Bramka: node tools/battle-tempo-minimap-brand-test.cjs
 *
 * Co sprawdza:
 *  (A) battleHudTheme.ts (esbuild, kod źródłowy): style panelu zewnętrznego, rzędu Tempo, przycisków
 *      i ramki minimapy używają WYŁĄCZNIE tokenów marki (var(--tg-*)) dla kolorów/promieni/obwódek —
 *      bez zahardkodowanej palety poza fallbackami w var(); aktywne tempo ma inny styl niż wyłączone.
 *  (B) każdy token var(--tg-*) użyty w panelu istnieje w src/ui/icons/brand/tokens.css (kanon marki).
 *  (C) battleScene.ts (źródło): przyciski tempa mają aria-label, rząd Tempo pokazuje odczyt ×N
 *      aktualizowany w _syncTempoPanelHighlight, ramka canvasBox to applyTempoMinimapFrame1E,
 *      a obsługa kliku/przeciągania minimapy (pointerdown/pointermove/pointerup + minimapPixelToTile)
 *      oraz handlery pauzy/tempa/AUTO nadal są podłączone (zero zmian logiki).
 *
 * Mutacja (dowód nietautologiczności): zamiana var(--tg-gold-dim) na #a08030 w applyTempoRow1E
 * lub usunięcie aria-label z mkTempoBtn → sekcja A/C pada.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// (A) — bundle battleHudTheme.ts (bez importów zewnętrznych) i wywołanie helperów na atrapie elementu.
const bundled = esbuild.buildSync({
  entryPoints: [path.join(ROOT, 'src/battle/battleHudTheme.ts')],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  loader: { '.svg': 'text', '.css': 'text' },
  logLevel: 'silent',
});
const mod = { exports: {} };
new Function('module', 'exports', 'require', 'document', bundled.outputFiles[0].text)(mod, mod.exports, require, undefined);
const H = mod.exports;

function fakeEl() {
  const classes = new Set();
  return { style: {}, classList: { add: c => classes.add(c), has: c => classes.has(c) }, _classes: classes };
}

const outer = fakeEl();
H.applyTempoMinimapOuterPanel1E(outer);
const row = fakeEl();
H.applyTempoRow1E(row);
const frame = fakeEl();
H.applyTempoMinimapFrame1E(frame);
const btnOff = fakeEl();
H.applyTempoBtn1E(btnOff, { active: false });
const btnOn = fakeEl();
H.applyTempoBtn1E(btnOn, { active: true });
const btnAuto = fakeEl();
H.applyTempoBtn1E(btnAuto, { active: true, auto: true });

const TOKEN_PROPS = ['borderRadius', 'border', 'background', 'color', 'borderBottom', 'boxShadow'];

// A1: panel zewnętrzny, rząd i ramka minimapy — tła/obwódki z tokenów.
assert.match(outer.style.border, /var\(--tg-border-gold/, 'panel: obwódka z tokenu');
assert.match(outer.style.background, /var\(--tg-panel-grad/, 'panel: tło z tokenu');
assert.match(outer.style.borderRadius, /var\(--tg-radius-panel/, 'panel: promień z tokenu');
assert.match(row.style.borderBottom, /var\(--tg-gold-dim/, 'rząd Tempo: separator z tokenu');
assert.match(frame.style.background, /var\(--tg-bg-deep/, 'ramka minimapy: tło z tokenu (nie jaskrawa tafla)');
assert.match(frame.style.boxShadow, /var\(--tg-gold-dim/, 'ramka minimapy: obwódka z tokenu');

// A2: przyciski — kolor aktywnego i nieaktywnego różni się, AUTO-aktywny ma gradient przycisku marki.
assert.match(btnOff.style.border, /rgba\(232,216,138,0\.4\)/, 'przycisk wyłączony: obwódka złota');
assert.match(btnOn.style.border, /var\(--tg-gold-primary/, 'przycisk aktywny: obwódka z tokenu złota');
assert.match(btnAuto.style.background, /var\(--tg-btn-primary/, 'AUTO aktywny: gradient przycisku marki');
assert.match(btnAuto.style.color, /var\(--tg-btn-primary-ink/, 'AUTO aktywny: atrament przycisku marki');
assert.notEqual(btnOff.style.background, btnOn.style.background, 'aktywne tempo wyraźnie inne niż wyłączone');
assert.match(btnOff.style.background, /var\(--tg-panel-grad/, 'przycisk wyłączony: gradient z tokenu panelu');
assert.ok(btnOff._classes.has('civ-tempo-btn'), 'przyciski tempa mają klasę stanów hover/focus');

// A3: brak gołych kolorów hex w właściwościach wizualnych panelu poza fallbackami w var(...).
const stripVarFallbacks = s => s.replace(/var\(([^()]*(\([^()]*\))?[^()]*)\)/g, 'VAR');
for (const [name, el] of Object.entries({ outer, row, frame, btnOff, btnOn, btnAuto })) {
  for (const prop of TOKEN_PROPS) {
    const v = el.style[prop];
    if (!v) continue;
    const bare = stripVarFallbacks(v);
    // dopuszczamy rgba(...) (już używane w palecie gry), zakazujemy gołych #hex poza var()
    assert.doesNotMatch(bare, /#[0-9a-fA-F]{3,8}\b/, `${name}.${prop} ma gołe #hex poza tokenem: ${v}`);
  }
}

// (B) — tokeny istnieją w kanonie marki.
const tokensCss = read('src/ui/icons/brand/tokens.css');
const used = new Set();
for (const el of [outer, row, frame, btnOff, btnOn, btnAuto]) {
  for (const prop of TOKEN_PROPS) {
    const v = el.style[prop] || '';
    for (const m of v.matchAll(/var\((--tg-[a-z0-9-]+)/g)) used.add(m[1]);
  }
}
assert.ok(used.size >= 6, 'panel używa co najmniej 6 tokenów marki');
for (const t of used) {
  assert.ok(tokensCss.includes(t + ':') || tokensCss.includes(t + ' '), `token ${t} nieobecny w tokens.css`);
}

// (C) — źródło battleScene.ts: wiązanie UI bez zmiany logiki.
const scene = read('src/battle/battleScene.ts');
const tempoBlockStart = scene.indexOf('private _buildMinimapOverlay(): void {');
assert.ok(tempoBlockStart > 0, 'znaleziono _buildMinimapOverlay');
const tempoBlock = scene.slice(tempoBlockStart, scene.indexOf('\n  }\n', tempoBlockStart));
assert.match(tempoBlock, /b\.setAttribute\('aria-label', title\)/, 'przyciski tempa mają aria-label');
assert.match(tempoBlock, /applyTempoMinimapFrame1E\(canvasBox\)/, 'ramka minimapy z oprawy marki');
assert.match(tempoBlock, /tempoSpeedLbl/, 'odczyt tempa ×N dodany do rzędu');
assert.match(tempoBlock, /canvasBox\.addEventListener\('pointerdown'/, 'klik/przeciąganie minimapy zachowane');
assert.match(tempoBlock, /minimapPixelToTile\(px, py/, 'klik w minimapę przesuwa kamerę (logika zachowana)');
assert.match(tempoBlock, /_togglePause\(\)/, 'pauza podłączona');
assert.match(tempoBlock, /_adjustSpeedIdx\(-1\)/, 'zwolnij podłączone');
assert.match(tempoBlock, /_adjustSpeedIdx\(1\)/, 'przyspiesz podłączone');
assert.match(tempoBlock, /_toggleManualMode\(\)/, 'AUTO podłączone');

const syncStart = scene.indexOf('private _syncTempoPanelHighlight(): void {');
assert.ok(syncStart > 0, 'znaleziono _syncTempoPanelHighlight');
const syncBlock = scene.slice(syncStart, scene.indexOf('\n  }\n', syncStart));
assert.match(syncBlock, /this\._tempoSpeedLbl\.textContent = speedTag/, 'odczyt ×N aktualizowany przy zmianie tempa');
assert.match(syncBlock, /applyTempoBtn1E\(this\._tempoAutoBtn, \{ active: !this\._manualMode, auto: true \}\)/, 'AUTO aktywne wg trybu');

// Brak zmian w zakresie logiki: stare wywołanie applyMinimap1E nie jest już używane w scenie.
assert.doesNotMatch(scene, /applyMinimap1E\(/, 'scena nie używa już applyMinimap1E (oprawa przeniesiona)');

console.log('battle-tempo-minimap-brand-test: OK (A: 3 grupy stylu, B: ' + used.size + ' tokenów, C: wiązanie sceny)');
