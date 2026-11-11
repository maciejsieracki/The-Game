'use strict';
/**
 * resource-building-utilization-live.cjs -- R-WEB-UI-RESOURCE-BUILDING-UTILIZATION-PERCENT-Q1.
 * Weryfikacja w PRAWDZIWYM Chromium przez Vite HTTP (prawdziwe ikony surowcow z brandAssets, prawdziwy CSS
 * panelu imperium): strona-harness montuje sekcje "Budynki produkcyjne" z silnikowej migawki
 * (forecastNextTurnProduction -> buildEmpireProducersSnap -> renderProducersSection).
 * Scenariusz: kilka miast, 3 garncarnie na wspolnej puli gliny (100/50/0%), wylaczona garncarnia, stolarnia/kamieniarski.
 * Po tym liczy REALNA ture (advanceCityEconomy) i porownuje zrealizowane cykle z pokazanym procentem.
 *
 * Run from gra/: node tools/resource-building-utilization-live.cjs [outDir]
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(GRA, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-UI-RESOURCE-BUILDING-UTILIZATION-PERCENT-Q1', 'evidence'));
fs.mkdirSync(OUT, { recursive: true });
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright-core'));

const HTML = path.join(GRA, '.rbu-live.html');
const ENTRY = path.join(GRA, '.rbu-live-entry.ts');
const PORT = 5199;
fs.writeFileSync(HTML, '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#0f141c"><div class="civ-emp-panel open" style="position:static;width:760px;height:auto;transform:none;display:block"><div class="civ-emp-body" style="padding:12px"><div id="host"></div></div></div><script type="module" src="/.rbu-live-entry.ts"></script></body></html>');
fs.writeFileSync(ENTRY, `
import { renderProducersSection, wireProducerToggles, configureEmpireProducerToggle, mountEmpireDetailPanel } from './src/ui/empireDetailPanel';
import { buildEmpireProducersSnap, setProductionBuildingEnabled } from './src/game/building-toggle';
import { advanceCityEconomy, forecastNextTurnProduction } from './src/game/turn-economy';
import { converterProductionDisplayForBuilding } from './src/game/converters';
import econParams from './data/econ-params.json';
import civs from './data/civs.json';
import societyParams from './data/society-params.json';
import buildings from './data/buildings.json';
import units from './data/units.json';
import tech from './data/tech.json';

const DATA: any = { civs, econParams, societyParams, buildings, units, tech };
const MAP: any = { hexes: { '0,0': { coords: { q: 0, r: 0 }, terenBazowy: 'laka', nakladka: 'brak', rzeka: null, ulepszenia: [] } } };
const mk = (id: string, q: number, name: string, extra: any = {}) => ({ id, ownerId: 0, q, r: q, name, population: 3, magazynZywnosci: 50, surowce: {}, ...extra });
const cities: any[] = [
  mk('uruk', 0, 'Uruk', { surowce: { glina: 75, drewno: 600 } }),
  mk('sparta', 40, 'Sparta'), mk('korynt', 80, 'Korynt'), mk('argos', 120, 'Argos'), mk('teby', 160, 'Teby'),
];
setProductionBuildingEnabled(cities[3], 'garncarnia', false);
const built: Record<string, string[]> = {
  uruk: ['garncarnia', 'stolarnia'], sparta: ['garncarnia', 'kamieniarski'], korynt: ['garncarnia', 'cegielnia'],
  argos: ['garncarnia'], teby: ['cegielnia', 'stolarnia'],
};
const builtMap = new Map(Object.entries(built));
const base = () => ({ cities, map: MAP, data: DATA, difficulty: 'normal' as const, builtByCity: builtMap, playerEra: 1, playerZbadane: new Set<string>(), resolveOwnerEra: () => 1 });
const label = (id: string) => String((buildings as any[]).find(b => b.id === id)?.nazwa ?? id);
function paint() {
  const f = forecastNextTurnProduction(base());
  const snap = buildEmpireProducersSnap({
    cities, ownerId: 0, builtByCity: builtMap, era: 1, rawParams: econParams as any, difficulty: 'normal', realizedLastTurn: undefined,
    forecastNext: { ...(f.producedByOwner.get(0) ?? {}), ...(f.rawInflowByOwner.get(0) ?? {}) },
    utilizationByCity: f.utilizationByCity, buildingLabel: label,
  });
  const host = document.getElementById('host')!;
  host.innerHTML = renderProducersSection(snap);
  wireProducerToggles(host, paint);
  return { f, snap };
}
configureEmpireProducerToggle({ onToggle: (cityId: string, buildingId: string, enabled: boolean) => { setProductionBuildingEnabled(cities.find(c => c.id === cityId), buildingId, enabled); } });
mountEmpireDetailPanel(() => ({} as any));
(window as any).__paint = () => { const r = paint(); return JSON.parse(JSON.stringify({ util: [...r.f.utilizationByCity.entries()], produced: [...r.f.producedByOwner.entries()] })); };
(window as any).__real = () => {
  const econ = advanceCityEconomy(cities, MAP, DATA, 'normal', [], new Map(), builtMap, 1, new Set(), new Map(), new Map(), () => 1, undefined);
  return JSON.parse(JSON.stringify({
    produced: econ.converterProducedByOwner.get(0),
    nominalGarn: converterProductionDisplayForBuilding('garncarnia', econParams as any, 'normal', 1)?.produced,
    nominalCeg: converterProductionDisplayForBuilding('cegielnia', econParams as any, 'normal', 1)?.produced,
  }));
};
(window as any).__ready = true;
`);

(async () => {
  const vite = spawn(process.execPath, [path.join(GRA, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: GRA, stdio: ['ignore', 'pipe', 'pipe'] });
  let vlog = '';
  vite.stdout.on('data', d => { vlog += d; }); vite.stderr.on('data', d => { vlog += d; });
  const cleanup = () => { try { vite.kill('SIGTERM'); } catch (e) { /* */ } for (const f of [HTML, ENTRY]) { try { fs.unlinkSync(f); } catch (e) { /* */ } } };
  let pass = 0; let fail = 0;
  const ok = (c, m) => { if (c) { pass++; console.log('PASS:', m); } else { fail++; console.error('FAIL:', m); } };
  try {
    for (let i = 0; i < 60 && !/Local:/.test(vlog); i++) await new Promise(r => setTimeout(r, 500));
    const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
    const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 800, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(`http://127.0.0.1:${PORT}/.rbu-live.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 90000 });
    const data = await page.evaluate(() => window.__paint());
    ok(errors.length === 0, 'brak bledow strony: ' + errors.join(' | '));
    const pctOf = async key => page.$eval(`[data-prod-row="${key}"] [data-prod-util-pct]`, e => e.getAttribute('data-prod-util-pct')).catch(() => null);
    const pcts = { uruk: await pctOf('uruk|garncarnia'), sparta: await pctOf('sparta|garncarnia'), korynt: await pctOf('korynt|garncarnia') };
    console.log('   pokazane % garncarni (Uruk/Sparta/Korynt):', JSON.stringify(pcts));
    ok(pcts.uruk === '100', 'Uruk garncarnia 100%');
    ok(pcts.sparta !== null && Number(pcts.sparta) > 0 && Number(pcts.sparta) < 100, 'Sparta garncarnia czesciowo (0<%<100): ' + pcts.sparta);
    ok(pcts.korynt === '0', 'Korynt garncarnia 0%');
    const offTxt = await page.textContent('[data-prod-row="argos|garncarnia"]');
    ok(/wyłączony/.test(offTxt) && !(await page.$('[data-prod-row="argos|garncarnia"] [data-prod-util-pct]')), 'Argos garncarnia: "wyłączony" zamiast procentu');
    const st = await page.textContent('[data-prod-row="uruk|stolarnia"]');
    ok(/100%/.test(st) && /bez przerobu/.test(st), 'Stolarnia: 100% bez przerobu');
    const chips = await page.$$eval('[data-prod-row="sparta|garncarnia"] .bld-res-chip svg', e => e.length);
    ok(chips >= 1, 'powod < 100% jako chip z prawdziwa ikona surowca (svg w chipie): ' + chips);
    ok(await page.$('[data-prod-type="garncarnia"]') !== null, 'agregat per typ: Garncarnia');
    console.log('   agregat:', (await page.textContent('#civ-emp-producers-type-sum')).replace(/\s+/g, ' '));
    await page.screenshot({ path: path.join(OUT, '01-panel-imperium-procenty.png'), fullPage: true });

    // spojnosc z REALNA tura (te same miasta): zrealizowana ceramika == suma cykli z prognozy
    const fcCykle = data.util.filter(([id, r]) => r.garncarnia).reduce((a, [id, r]) => a + r.garncarnia.cykle, 0);
    const fcProdCeramika = (data.produced[0][1] || {}).ceramika;
    const real = await page.evaluate(() => window.__real());
    ok(real.produced.ceramika === fcProdCeramika, `realna tura: ceramika ${real.produced.ceramika} == prognoza ${fcProdCeramika}`);
    ok(real.produced.ceramika === fcCykle, `realna ceramika ${real.produced.ceramika} == suma cykli pokazanych garncarni ${fcCykle} (wylaczona nie liczy sie)`);
    // klik: wlacz Argos -> w nastepnej prognozie Argos dostaje wpis procentowy
    await page.click('[data-prod-toggle="argos|garncarnia"]');
    const argosPct = await pctOf('argos|garncarnia');
    ok(argosPct !== null, 'po wlaczeniu Argos pokazuje procent: ' + argosPct);
    await page.screenshot({ path: path.join(OUT, '02-po-wlaczeniu-argos.png'), fullPage: true });
    await browser.close();
  } catch (e) {
    fail++; console.error('FAIL: wyjatek', e && e.stack || e);
  } finally { cleanup(); }
  console.log(`\nresource-building-utilization-live: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
