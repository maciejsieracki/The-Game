'use strict';
/**
 * resource-building-toggle-ui-live.cjs -- R-WEB-RESOURCE-BUILDING-ENABLE-TOGGLE-Q1.
 * Weryfikacja UI w PRAWDZIWYM Chromium (nie jsdom): prawdziwy panel imperium (CSS + handlery z
 * empireDetailPanel.ts), sekcja "Budynki produkcyjne" renderowana wprost z silnikowej migawki
 * (buildEmpireProducersSnap + ta sama logika wlaczania co main.ts: City.wylaczoneBudynki).
 * Klika przelacznik, odczytuje stan z DOM, robi zrzuty do evidence/.
 *
 * Run from gra/: node tools/resource-building-toggle-ui-live.cjs [outDir]
 * Wymaga: /opt/pw-browsers/chromium-1194/chrome-linux/chrome (albo PW_CHROMIUM).
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(GRA, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-RESOURCE-BUILDING-ENABLE-TOGGLE-Q1', 'evidence'));
fs.mkdirSync(OUT, { recursive: true });
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright-core'));

const ENTRY = path.join(__dirname, '.rbt-live-entry.ts');
const BUNDLE = path.join(__dirname, '.rbt-live-bundle.js');
fs.writeFileSync(ENTRY, `
import { renderProducersSection, configureEmpireProducerToggle, wireProducerToggles, mountEmpireDetailPanel } from '../src/ui/empireDetailPanel';
import { buildEmpireProducersSnap, setProductionBuildingEnabled, operationalBuiltByCity } from '../src/game/building-toggle';
import { advanceCityEconomy, forecastNextTurnProduction } from '../src/game/turn-economy';
import econParams from '../data/econ-params.json';
import civs from '../data/civs.json';
import societyParams from '../data/society-params.json';
import buildings from '../data/buildings.json';
import units from '../data/units.json';
import tech from '../data/tech.json';

const DATA: any = { civs, econParams, societyParams, buildings, units, tech };
const MAP: any = { hexes: { '0,0': { coords: { q: 0, r: 0 }, terenBazowy: 'laka', nakladka: 'brak', rzeka: null, ulepszenia: ['tartak'] } } };
const mk = (id: string, q: number, name: string, extra: any = {}) => ({ id, ownerId: 0, q, r: q, name, population: 3, magazynZywnosci: 50, surowce: { glina: 600, drewno: 600, ruda: 300, ruda_cyny: 300, ruda_zelaza: 300 }, ...extra });
const cities: any[] = [mk('c1', 0, 'Roma'), mk('c2', 40, 'Ostia'), mk('c3', 80, 'Capua')];
const built: Record<string, string[]> = { c1: ['cegielnia', 'garncarnia', 'kuznia'], c2: ['cegielnia', 'wielka_odlewnia', 'stolarnia'], c3: ['targowisko'] };
const builtMap = new Map(Object.entries(built));
let realized: Record<string, number> | undefined = undefined;
const lastRealized: any = { v: undefined };

function runTurn() {
  const econ = advanceCityEconomy(cities, MAP, DATA, 'normal', [], new Map(), builtMap, 2, new Set(), new Map(), new Map(), () => 2, undefined);
  lastRealized.v = { ...(econ.converterProducedByOwner.get(0) ?? {}), ...(econ.rawInflowByOwner?.get(0) ?? {}) };
  return econ;
}
// Prognoza: TEN SAM kod co tick (forecastNextTurnProduction), na kopii miast -- bez zmiany stanu.
function forecastBase(extra: any = {}) {
  return { cities, map: MAP, data: DATA, difficulty: 'normal' as const, builtByCity: builtMap, playerEra: 2, playerZbadane: new Set<string>(), resolveOwnerEra: () => 2, ...extra };
}
function forecast() {
  const f = forecastNextTurnProduction(forecastBase());
  return { ...(f.producedByOwner.get(0) ?? {}), ...(f.rawInflowByOwner.get(0) ?? {}) } as Record<string, number>;
}
function snap() {
  const pot = forecastNextTurnProduction(forecastBase({ ignoreStock: true })).rawInflowByOwner.get(0) ?? {};
  const allOn = cities.map(c => { const k: any = { ...c }; delete k.wylaczoneBudynki; return k; });
  const potAll = forecastNextTurnProduction(forecastBase({ cities: allOn, ignoreStock: true })).rawInflowByOwner.get(0) ?? {};
  return buildEmpireProducersSnap({
    cities, ownerId: 0, builtByCity: builtMap, era: 2, rawParams: econParams as any, difficulty: 'normal',
    realizedLastTurn: lastRealized.v, forecastNext: forecast(), rawInflowPotential: { enabled: { ...pot }, installed: { ...potAll } }, buildingLabel: (id: string) => String((buildings as any[]).find(b => b.id === id)?.nazwa ?? id),
  });
}
function paint() {
  const host = document.getElementById('host')!;
  host.innerHTML = renderProducersSection(snap());
  wireProducerToggles(host, paint);
}
configureEmpireProducerToggle({
  onToggle: (cityId, buildingId, enabled) => {
    const c = cities.find(x => x.id === cityId);
    setProductionBuildingEnabled(c, buildingId, enabled);
    (window as any).__log.push([cityId, buildingId, enabled]);
  },
});
(window as any).__log = [];
(window as any).__forecast = () => forecast();
(window as any).__runTurn = () => { runTurn(); paint(); return lastRealized.v; };
(window as any).__stocks = () => cities.map(c => ({ id: c.id, cegla: c.surowce.cegla ?? 0, glina: c.surowce.glina, off: c.wylaczoneBudynki ?? [] }));
mountEmpireDetailPanel(() => ({} as any)); // wstrzykuje prawdziwy CSS panelu imperium
paint();
`, 'utf8');

const STUB = {
  name: 'stub-assets-live',
  setup(build) {
    build.onResolve({ filter: /\.svg\?raw$/ }, (a) => ({ path: a.path, namespace: 'stub-live-svg' }));
    build.onLoad({ filter: /.*/, namespace: 'stub-live-svg' }, () => ({ contents: 'export default "";\n', loader: 'js' }));
    build.onResolve({ filter: /icons\/brandAssets$/ }, (a) => ({ path: a.path, namespace: 'stub-live' }));
    build.onLoad({ filter: /.*/, namespace: 'stub-live' }, () => ({
      contents: ['brandIconSvg', 'improvementIconSvg', 'mapResourceIconSvg', 'terrainIconSvg', 'buildingIconSvg', 'unitIconSvg',
        'civIconSvg', 'epochIconSvg', 'settingIconSvg', 'brandMenuComponentsCss', 'menuIconSvg', 'brandMenuEmblemSvg',
        'newGameIntroEmblemSvg', 'brandMotionCss', 'brandMenuBackgroundCss', 'svgThumbHtml']
        .map(n => 'export function ' + n + '(a) { return ""; }').join('\n') + '\n',
      loader: 'js',
    }));
  },
};

(async () => {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    loader: { '.ts': 'ts', '.json': 'json' }, plugins: [STUB],
    define: { 'import.meta.glob': '__globStub', 'import.meta.env': '__envStub' },
    banner: { js: 'var __globStub = function () { return {}; }; var __envStub = {};' },
    outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
  });
  const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 760, height: 1100 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.setContent('<!doctype html><html><body style="margin:0;background:#0f141c"><div class="civ-emp-panel open" style="position:static;width:640px;height:auto;transform:none;display:block"><div class="civ-emp-body" style="padding:12px"><div id="host"></div></div></div></body></html>');
  await page.addScriptTag({ path: BUNDLE });

  let pass = 0; let fail = 0;
  const ok = (c, m) => { if (c) { pass++; console.log('PASS:', m); } else { fail++; console.error('FAIL:', m); } };
  const states = async () => page.$$eval('[data-prod-toggle]', els => els.map(e => e.getAttribute('data-prod-toggle') + '=' + e.textContent));

  ok(errors.length === 0, 'brak bledow strony po zaladowaniu: ' + errors.join(' | '));
  const s0 = await states();
  ok(s0.length === 5, '5 przelacznikow budynkow produkcyjnych (Capua bez budynkow produkcyjnych pominieta): ' + s0.join(', '));
  ok(s0.every(x => x.endsWith('=Włączony')), 'wszystkie poczatkowo Włączony');
  ok(!(await page.textContent('#host')).includes('Capua'), 'miasto bez budynkow produkcyjnych nie jest na liscie');
  ok(!(await page.textContent('#host')).includes('Kuźnia') && !(await page.textContent('#host')).includes('kuznia'), 'kuznia (bez produkcji surowca) nie jest na liscie');
  await page.screenshot({ path: path.join(OUT, '01-wszystko-wlaczone-brak-tury.png'), fullPage: true });

  // tura 1 (wszystko wlaczone) -> faktyczna produkcja
  const real1 = await page.evaluate(() => (window).__runTurn());
  ok(real1 && real1.cegla > 0, 'tura 1: faktyczna cegla > 0: ' + JSON.stringify(real1));
  const t1 = await page.textContent('#host');
  ok(t1.includes(String(real1.cegla)), 'panel pokazuje faktyczna produkcje cegly z ostatniej tury (' + real1.cegla + ')');
  await page.screenshot({ path: path.join(OUT, '02-po-turze-wszystko-wlaczone.png'), fullPage: true });
  const potBefore = await page.$$eval('#host .civ-emp-mini .civ-emp-mini-r', rows => rows.map(r => r.textContent));

  // KLIK: wylacz Cegielnie w Ostii
  await page.click('[data-prod-toggle="c2|cegielnia"]');
  const s1 = await states();
  ok(s1.includes('c2|cegielnia=Wyłączony'), 'po jednym kliknieciu Cegielnia w Ostii = Wyłączony');
  ok(s1.filter(x => x.endsWith('=Wyłączony')).length === 1, 'tylko ta jedna pozycja wylaczona');
  ok((await page.evaluate(() => (window).__log.length)) === 1, 'hook silnika wywolany raz');
  const potAfter = await page.$$eval('#host .civ-emp-mini .civ-emp-mini-r', rows => rows.map(r => r.textContent));
  ok(JSON.stringify(potBefore) !== JSON.stringify(potAfter), 'agregaty zmienily sie po wylaczeniu (mozliwe wlaczone spadlo)');
  await page.screenshot({ path: path.join(OUT, '03-cegielnia-ostia-wylaczona.png'), fullPage: true });

  // tura 2: Ostia nie produkuje cegly; faktyczna spadla
  const stockBefore = await page.evaluate(() => (window).__stocks());
  const real2 = await page.evaluate(() => (window).__runTurn());
  const stockAfter = await page.evaluate(() => (window).__stocks());
  const ostiaDelta = (stockAfter.find(c => c.id === 'c2').cegla) - (stockBefore.find(c => c.id === 'c2').cegla);
  ok(ostiaDelta === 0, 'tura 2: Ostia (Cegielnia wylaczona) nie przyrasta cegla (delta ' + ostiaDelta + ')');
  ok(real2.cegla < real1.cegla, 'tura 2: faktyczna cegla spadla ' + real1.cegla + ' -> ' + real2.cegla);
  await page.screenshot({ path: path.join(OUT, '04-po-turze-cegielnia-wylaczona.png'), fullPage: true });

  // KLIK: wlacz z powrotem
  await page.click('[data-prod-toggle="c2|cegielnia"]');
  const s2 = await states();
  ok(s2.every(x => x.endsWith('=Włączony')), 'po ponownym kliknieciu wszystko Włączony');
  const real3 = await page.evaluate(() => (window).__runTurn());
  ok(real3.cegla === real1.cegla, 'tura 3 po wlaczeniu: faktyczna cegla wrocila do ' + real1.cegla + ' (jest ' + real3.cegla + ')');
  await page.screenshot({ path: path.join(OUT, '05-wlaczone-ponownie.png'), fullPage: true });

  // ---- PROGNOZA nastepnej tury (R-WEB-RESOURCE-BUILDING-PANEL-FORECAST-Q1) ----
  const hdr = await page.textContent('#host .civ-emp-mini');
  ok(hdr.includes('OSTATNIA TURA (ZREALIZOWANO)') && hdr.includes('PROGNOZA NASTĘPNEJ TURY') && hdr.includes('MAKSIMUM (WŁĄCZONE)'), 'naglowki: ostatnia tura (zrealizowano) / prognoza nastepnej tury / maksimum');
  const rowText = async (label) => page.$$eval('#host .civ-emp-mini .civ-emp-mini-r', (rows, l) => { const r = rows.find(x => x.textContent.startsWith(l)); return r ? [...r.children].map(c => c.textContent) : null; }, label);
  const drewnoRow = await rowText('Drewno');
  ok(drewnoRow !== null, 'agregat zawiera wiersz Drewno (Stolarnia w Ostii): ' + JSON.stringify(drewnoRow));
  const cell = async (label, idx) => { const r = await rowText(label); return r ? Number(r[idx]) : NaN; };
  // prognoza == to, co faktycznie wyprodukuje sie po kolejnym endTurn (bez zmiany stanu)
  const fcOn = await page.evaluate(() => (window).__forecast());
  const shownCeglaOn = await cell('Cegła', 2);
  ok(shownCeglaOn === Math.round(fcOn.cegla), 'panel: prognoza cegly = ' + shownCeglaOn + ' (silnik ' + fcOn.cegla + ')');
  const realN = await page.evaluate(() => (window).__runTurn());
  ok(realN.cegla === fcOn.cegla && (realN.drewno ?? 0) === (fcOn.drewno ?? 0), 'prognoza == realna tura: cegla ' + fcOn.cegla + '/' + realN.cegla + ', drewno ' + fcOn.drewno + '/' + realN.drewno);
  await page.screenshot({ path: path.join(OUT, '06-prognoza-wszystko-wlaczone.png'), fullPage: true });
  // KLIK zmienia prognoze
  const before = await cell('Cegła', 2);
  await page.click('[data-prod-toggle="c1|cegielnia"]');
  const afterOff = await cell('Cegła', 2);
  ok(afterOff < before, 'klik wylacz Cegielnie (Roma): prognoza cegly spadla ' + before + ' -> ' + afterOff);
  const stolBefore = await cell('Drewno', 2);
  await page.click('[data-prod-toggle="c2|stolarnia"]');
  const stolAfter = await cell('Drewno', 2);
  ok(stolAfter < stolBefore, 'klik wylacz Stolarnie (Ostia): prognoza drewna spadla ' + stolBefore + ' -> ' + stolAfter);
  const fcOff = await page.evaluate(() => (window).__forecast());
  const realOff = await page.evaluate(() => (window).__runTurn());
  ok(realOff.cegla === fcOff.cegla && (realOff.drewno ?? 0) === (fcOff.drewno ?? 0), 'po wylaczeniu: prognoza == realna tura: cegla ' + fcOff.cegla + '/' + realOff.cegla + ', drewno ' + fcOff.drewno + '/' + realOff.drewno);
  await page.screenshot({ path: path.join(OUT, '07-prognoza-wylaczone.png'), fullPage: true });
  await page.click('[data-prod-toggle="c1|cegielnia"]');
  const afterOn = await cell('Cegła', 2);
  ok(afterOn > afterOff, 'klik wlacz Cegielnie: prognoza cegly wrocila (' + afterOff + ' -> ' + afterOn + ')');

  ok(errors.length === 0, 'brak bledow strony do konca: ' + errors.join(' | '));
  console.log(`\nresource-building-toggle-ui-live: ${pass} passed, ${fail} failed`);
  await browser.close();
  try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(2); });
