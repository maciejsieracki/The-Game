#!/usr/bin/env node
/**
 * H-BUDOWA-KARTA-KOLEJKA-Q1 — runtime/render regression test.
 * Bundles and executes the production cityPanel path in Chromium; it does not
 * inspect source text as its functional oracle.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch { console.error('Playwright is required'); process.exit(1); }

const GRA = path.resolve(__dirname, '..');
const CITY_PANEL = path.resolve(GRA, 'src/ui/cityPanel.ts');
const ENTRY = path.resolve(__dirname, '.building-queue-rr-entry.ts');
const OUT = path.resolve(__dirname, '.building-queue-rr-bundle.cjs');
const MUTANT = path.resolve(__dirname, '.building-queue-rr-mutant.cjs');
const FALLBACK = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let passed = 0;
function check(name, value, detail) {
  if (!value) throw new Error(`FAIL ${name}${detail ? ` — ${JSON.stringify(detail)}` : ''}`);
  passed++; console.log(`PASS ${name}`);
}
function listSvgs(dir, prefix = './brand/', out = {}) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listSvgs(p, `${prefix}${e.name}/`, out);
    else if (e.name.endsWith('.svg')) out[`${prefix}${e.name}`] = fs.readFileSync(p, 'utf8');
  }
  return out;
}
function plugins(sourceOverride) {
  const brandAssets = path.resolve(GRA, 'src/ui/icons/brandAssets.ts');
  const brandDir = path.resolve(GRA, 'src/ui/icons/brand');
  return [{ name: 'vite-compat', setup(build) {
    build.onResolve({ filter: /\?raw$/ }, a => ({ path: path.resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw' }));
    build.onLoad({ filter: /.*/, namespace: 'raw' }, a => ({ contents: fs.readFileSync(a.path, 'utf8'), loader: 'text' }));
    build.onLoad({ filter: /brandAssets\.ts$/ }, a => {
      if (path.resolve(a.path) !== brandAssets) return null;
      return { contents: fs.readFileSync(a.path, 'utf8').replace(/import\.meta\.glob\('\.\/brand\/\*\*\/\*\.svg',[\s\S]*?\)/, JSON.stringify(listSvgs(brandDir))), loader: 'ts', resolveDir: path.dirname(a.path) };
    });
    build.onLoad({ filter: /\.ts$/ }, a => {
      const s = fs.readFileSync(a.path, 'utf8');
      if (!s.includes('import.meta.glob')) return null;
      return { contents: 'const __glob=()=>({});\n' + s.replace(/import\.meta\.glob/g, '__glob'), loader: 'ts', resolveDir: path.dirname(a.path) };
    });
  }}, { name: 'expose', setup(build) {
    build.onLoad({ filter: /cityPanel\.ts$/ }, a => {
      if (path.resolve(a.path) !== CITY_PANEL) return null;
      const s = sourceOverride ?? fs.readFileSync(a.path, 'utf8');
      return { contents: `${s}\nexport { appendBuildableItemRow as __available, appendBuildQueueSection as __queue, renderProd as __prod, ensureStyles as __styles };\n`, loader: 'ts', resolveDir: path.dirname(a.path) };
    });
  }}];
}
async function bundle(outfile, sourceOverride) {
  fs.writeFileSync(ENTRY, [
    "import { configureCityPanel } from '../src/ui/cityPanel.ts';",
    "import { __available, __queue, __prod, __styles } from '../src/ui/cityPanel.ts';",
    "import { loadGameData } from '../src/data/loader.ts';",
    "import { foundCityAt } from '../src/game/cities.ts';",
    "import { TerenBazowy, Nakladka } from '../src/types/hex.ts';",
    "import { disposeHoverDetailDock } from '../src/ui/hoverDetailDock.ts';",
    'window.__configure=configureCityPanel; window.__available=__available; window.__queue=__queue; window.__prod=__prod; window.__styles=__styles; window.__dispose=disposeHoverDetailDock; window.__load=loadGameData; window.__found=foundCityAt; window.__T=TerenBazowy; window.__N=Nakladka;'
  ].join('\n'));
  await esbuild.build({ entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020', outfile, absWorkingDir: GRA, loader: { '.ts': 'ts' }, plugins: plugins(sourceOverride), logLevel: 'silent' });
}
async function launch() {
  try { return await chromium.launch({ headless: true }); }
  catch { return chromium.launch({ headless: true, executablePath: FALLBACK, args: ['--no-sandbox'] }); }
}
async function scenario(browser, bundle) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.setContent('<!doctype html><html><head></head><body></body></html>');
  await page.addScriptTag({ content: fs.readFileSync(bundle, 'utf8') });
  const result = await page.evaluate(async () => {
    window.__styles();
    const data = window.__load(); const hexes = {};
    for (let q = -5; q <= 5; q++) for (let r = -5; r <= 5; r++) hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: window.__T.Laka, nakladka: undefined };
    const map = { szerokoscQ: 11, wysokoscR: 11, hexes, seed: 1, riverPaths: [] };
    const city = window.__found(0, 0, 0, [], map, 'Testowo'); if (!city) throw new Error('city fixture missing');
    city.population = 6; const buildings = Object.values(data.buildings); const def = buildings.find(b => b && b.id) || buildings[0];
    const item = { kind: 'budynek', id: def.id, nazwa: def.nazwa, koszt: 20 };
    const unit = { kind: 'jednostka', id: 'unit-test', nazwa: 'Jednostka testowa', koszt: 10 };
    const prod = { kolejka: [item, { ...item, id: def.id, nazwa: `${def.nazwa} oczekujący` }], postep: 3 };
    const calls = { set: 0, build: 0 };
    window.__configure({ data, getProduction: () => prod, setProduction: () => { calls.set++; }, getUnlockedTechs: () => [], getTreasury: () => 999, getBuiltBuildingIds: () => [], getEmpireStock: () => ({}), getResourceAccess: () => ({ potential: [], active: [] }) });
    const availableMount = document.createElement('div'); availableMount.id = 'available'; document.body.appendChild(availableMount);
    window.__available(availableMount, city, item, data, { praca: 10, skarb: 999, buildLabel: 'Buduj' });
    const queueMount = document.createElement('div'); queueMount.id = 'queue'; document.body.appendChild(queueMount);
    window.__queue(queueMount, city, false, prod, 10);
    const activeMount = document.createElement('div'); activeMount.id = 'active'; document.body.appendChild(activeMount);
    window.__prod(activeMount, city, null);
    const snapshot = JSON.stringify(prod.kolejka);
    const availableRow = availableMount.querySelector('.hover-detail-anchor');
    const queueIcon = queueMount.querySelector('.qitem .hover-detail-anchor');
    const activeIcon = activeMount.querySelector('.hover-detail-anchor');
    // Real available preview uses its actual hover event; queue/front use real click.
    availableRow.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await new Promise(r => setTimeout(r, 260));
    const availableCard = !!document.querySelector('.entity-card.bld-detail-card');
    window.__dispose();
    queueIcon?.click(); const queueCard = !!document.querySelector('.entity-card.bld-detail-card');
    const afterQueue = JSON.stringify(prod.kolejka);
    window.__dispose();
    activeIcon?.click(); const activeCard = !!document.querySelector('.entity-card.bld-detail-card');
    return { availableCard, queueCard, activeCard, before: snapshot, after: afterQueue, calls, queueIcon: !!queueIcon, activeIcon: !!activeIcon, cards: document.querySelectorAll('.entity-card.bld-detail-card').length };
  });
  await page.close(); return { result, errors };
}
(async () => {
  await bundle(OUT);
  const browser = await launch();
  try {
    const live = await scenario(browser, OUT); check('brak błędów runtime/pageerror', live.errors.length === 0, live.errors); const r = live.result;
    check('dostępny budynek renderuje i pokazuje kartę przez realny hover', r.availableCard);
    check('oczekujący budynek ma realny interaktywny anchor i karta otwiera się po kliknięciu', r.queueIcon && r.queueCard);
    check('aktywny budynek ma realny interaktywny anchor i karta otwiera się po kliknięciu', r.activeIcon && r.activeCard);
    check('snapshot kolejki przed/po podglądzie karty jest identyczny', r.before === r.after, { before: r.before, after: r.after });
    check('podgląd nie wywołuje callbacku zapisu kolejki ani budynku', r.calls.set === 0 && r.calls.build === 0, r.calls);
    const original = fs.readFileSync(CITY_PANEL, 'utf8');
    const mutantSource = original.replace(/attachInteractiveDetail\(\s*queueIcon/, 'attachHoverDetail(queueIcon').replace(/\{ delayMs: 260, sideHint: 'auto' \}/, '260, \'auto\'');
    assert.notStrictEqual(mutantSource, original, 'mutation must alter production anchor');
    await bundle(MUTANT, mutantSource);
    const mutant = await scenario(browser, MUTANT);
    check('mutacja produkcyjnego anchoru powoduje rzeczywisty FAIL testu kliknięcia', !mutant.result.queueCard);
    check('mutacja nie jest maskowana błędem runtime', mutant.errors.length === 0, mutant.errors);
    console.log(`building-queue-detail-card: all assertions passed (${passed})`);
  } finally { await browser.close(); for (const p of [ENTRY, OUT, MUTANT]) try { fs.unlinkSync(p); } catch {} }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
