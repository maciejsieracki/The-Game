'use strict';
/**
 * siege-storm-needs-machines-test.cjs -- R-WEB-SIEGE-MACHINES-ONLY-TECH-AVAILABLE-VISIBLE-Q1.
 * (1) jednostkowo: lista machin per zestaw technologii + bramka szturmu bez machin;
 * (2) Chromium (opcjonalnie, --vite http://127.0.0.1:PORT): PRAWDZIWY panel oblezenia (siegeMapPanel.ts)
 *     serwowany przez Vite; DOM nie zawiera niedostepnych machin; szturm obwarowanego miasta bez machin zablokowany.
 * Mutacje: (a) lista bez filtra techu -> DOM zawiera Katapulte (test czerwieni); (b) isStormBlocked=false -> przycisk aktywny.
 * Usage (z gra/): node tools/siege-storm-needs-machines-test.cjs [--vite http://127.0.0.1:5199] [--shots <katalog>]
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const argOf = (f) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : null; };
const VITE = argOf('--vite'); const SHOTS = argOf('--shots');
const ENTRY = path.join(__dirname, '.siege-storm-needs-machines-entry.ts');
const BUNDLE = path.join(__dirname, '.siege-storm-needs-machines-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { loadGameData } from '../src/data/loader';
export * from '../src/game/siege-engine-build';
export { isSiegeUnit } from '../src/game/unit-power';
export { stormBlockedForRoster, stormBlockedWithoutMachines, STORM_NEEDS_SIEGE_MACHINES_MSG, canCaptureCity } from '../src/game/city-fortification';
`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(BUNDLE);
fs.unlinkSync(ENTRY);
let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.error('FAIL: ' + name + (detail === undefined ? '' : ' -- ' + JSON.stringify(detail))); }
}
const data = M.loadGameData();
const army = (n) => Array.from({ length: n }, (_, i) => ({ id: 'u' + i, ownerId: 0, typeId: 'Wojownik', category: 'wojownik' }));
const ctx = (techs) => ({ activeSiege: true, atWar: true, ownerId: 0, turn: 3, army: army(10), unlockedTechs: new Set(techs),
  treasury: 1e6, stock: { drewno: 1e5, braz: 1e5, zelazo: 1e5 } });
const names = (techs) => M.visibleSiegeEngineOptions(
  data.units.filter(M.isSiegeEngineDef).map(u => M.siegeEngineBuildOption(u, ctx(techs), 1)), new Set(techs)).map(o => o.unit.Jednostka).sort();

// --- (1) jednostkowo
check('start (bez technologii): zero machin', names([]).length === 0, names([]));
check('Obrobka drewna: tylko Taran', JSON.stringify(names(['Obróbka drewna'])) === JSON.stringify(['Taran']), names(['Obróbka drewna']));
check('Brazownictwo: Taran + Taran okuty + Wieza', JSON.stringify(names(['Obróbka drewna', 'Brązownictwo'])) === JSON.stringify(['Taran', 'Taran okuty', 'Wieża oblężnicza'].sort()), names(['Obróbka drewna', 'Brązownictwo']));
check('Sztuka wojenna dokłada Katapulte', names(['Obróbka drewna', 'Brązownictwo', 'Sztuka wojenna']).includes('Katapulta'));
check('szturm: obwarowane + brak machin = zablokowany', M.stormBlockedWithoutMachines(true, false) === true);
check('szturm: obwarowane + machina = dozwolony', M.stormBlockedWithoutMachines(true, true) === false);
check('szturm: miasto bez obwarowania = zasady bez zmian (dozwolony)', M.stormBlockedWithoutMachines(false, false) === false);
check('spojnosc z R1: zablokowany szturm <=> canCaptureCity=false bez wylomu',
  [[true, false], [true, true], [false, false], [false, true]].every(([f, m]) => M.stormBlockedWithoutMachines(f, m) === !M.canCaptureCity(f, m)));
check('komunikat zgodny z decyzja wlasciciela', /Potrzebne machiny oblężnicze — pozostaje oblężenie/.test(M.STORM_NEEDS_SIEGE_MACHINES_MSG));
// zarzut 1: zachowanie funkcji uzywanej przez main.ts (sklad armii -> blokada) na prawdziwych definicjach jednostek
{
  const def = (n) => data.units.find(u => u.Jednostka === n);
  const siege = (u) => M.isSiegeUnit(u);
  check('roster: sam Wojownik + obwarowane = zablokowany', M.stormBlockedForRoster(true, [def('Wojownik')], siege) === true);
  check('roster: Wojownik + Taran + obwarowane = dozwolony', M.stormBlockedForRoster(true, [def('Wojownik'), def('Taran')], siege) === false);
  check('roster: sam Wojownik + brak obwarowania = dozwolony', M.stormBlockedForRoster(false, [def('Wojownik')], siege) === false);
  check('roster: pusty + obwarowane = zablokowany', M.stormBlockedForRoster(true, [], siege) === true);
}
const main = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');
const execStorm = main.slice(main.indexOf('function executeSilentSiegeStorm'), main.indexOf('function executeSilentSiegeStorm') + 900);
check('AI (executeSilentSiegeStorm) juz blokuje szturm bez machin (pomiar, bez zmian)', /fortifiedCityCaptureBlocked\(/.test(execStorm) && /startMapSiege\(ctx\)/.test(execStorm));
const launch = main.slice(main.indexOf('function launchSiegeStormFromMap'), main.indexOf('function launchSiegeStormFromMap') + 1600);
check('gracz (launchSiegeStormFromMap) ma bramke machin PRZED preBattle', /playerStormBlockedWithoutMachines\(ctx\)/.test(launch));
check('main.ts: playerStormBlockedWithoutMachines deleguje do stormBlockedForRoster (cityIsFortified + isSiegeUnit)',
  /function playerStormBlockedWithoutMachines[\s\S]{0,700}anchor\.ownerId, false\);\s*\n\s*return stormBlockedForRoster\(\s*cityIsFortified\(city\.maMur, cityBuilt\.get\(city\.id\)\),\s*roster,\s*u => isSiegeUnit\(unitDefFor\(u\)\),/.test(main));
const cac = fs.readFileSync(path.join(GRA, 'src/ui/cityAttackChoice.ts'), 'utf8');
check('menu wyboru ataku: obie sciezki main.ts podaja isStormBlocked', (main.match(/isStormBlocked: \(\) => playerStormBlockedWithoutMachines\(/g) || []).length === 2);
check('panel dostaje isStormBlocked z main.ts', /isStormBlocked:\s*\(ctx: MapSiegeContext\) => playerStormBlockedWithoutMachines\(ctx\)/.test(main));

// --- (2) Chromium na prawdziwym panelu
async function live() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/chromium', args: ['--no-sandbox', '--headless=new'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    await page.route(VITE + '/__blank.html', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body style="background:#223"></body></html>' }));
    await page.goto(VITE + '/__blank.html');
    const run = async ({ techs, filter, stormBlocked }) => page.evaluate(async ({ techs, filter, stormBlocked }) => {
      const P = await import('/src/ui/siegeMapPanel.ts');
      const E = await import('/src/game/siege-engine-build.ts');
      const L = await import('/src/data/loader.ts');
      const data = L.loadGameData();
      const army = Array.from({ length: 12 }, (_, i) => ({ id: 'u' + i, ownerId: 0, typeId: 'Wojownik', category: 'wojownik' }));
      const unlocked = new Set(techs);
      const all = data.units.filter(E.isSiegeEngineDef).map(u => E.siegeEngineBuildOption(u,
        { activeSiege: true, atWar: true, ownerId: 0, turn: 3, army, unlockedTechs: unlocked, treasury: 1e6, stock: { drewno: 1e5, braz: 1e5, zelazo: 1e5 } }, 5));
      const options = filter ? E.visibleSiegeEngineOptions(all, unlocked) : all;
      const city = { id: 'c1', ownerId: 1, q: 3, r: 3, name: 'Memfis', population: 5, garnizon: 4, maMur: true, oblegane: true, oblegajacyOwnerId: 0 };
      P.hideSiegeMapPanel();
      P.showSiegeMapPanel({ tryb: 'oblezenie', city, atakujacy: army[0], garnizonUnit: null, oblegajacyOwnerId: 0 },
        { onBesiege() {}, onStorm() { window.__stormCalls = (window.__stormCalls || 0) + 1; }, onRetreat() {},
          getSiegeEngineOptions: () => options, onBuildSiegeEngine() {}, isStormBlocked: () => stormBlocked }, 3);
      const root = document.getElementById('civ-siege-map-panel');
      const storm = root.querySelector('[data-act="storm"]');
      const before = window.__stormCalls || 0; storm.click();
      return { text: root.textContent, btns: [...root.querySelectorAll('.civ-smp-mach-btn')].map(b => b.textContent),
        hasBuildBlock: !!root.querySelector('[data-siege-engine-build]'), stormDisabled: storm.disabled,
        stormClickFired: (window.__stormCalls || 0) > before, stormText: storm.textContent };
    }, { techs, filter, stormBlocked });
    const NAMES = ['Taran', 'Taran okuty', 'Katapulta', 'Wieża oblężnicza'];
    const snap = async (name) => { await page.waitForTimeout(500); if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name) }); } };

    let r = await run({ techs: [], filter: true, stormBlocked: true });
    await snap('01-start-bez-machin.png');
    check('LIVE start: sekcja „Zbuduj machine” nie istnieje w DOM', r.hasBuildBlock === false);
    check('LIVE start: zadna nazwa machiny w textContent', NAMES.every(n => !r.text.includes(n)) && !/Potrzeba co najmniej/.test(r.text), r.text.slice(0, 300));
    check('LIVE start: zero przyciskow machin (querySelectorAll)', r.btns.length === 0, r.btns);
    check('LIVE start: Szturm niedostepny + komunikat o machinach', r.stormDisabled && /Potrzebne machiny oblężnicze — pozostaje oblężenie/.test(r.stormText), r.stormText);
    check('LIVE start: klik w zablokowany Szturm nie uruchamia szturmu', r.stormClickFired === false);

    r = await run({ techs: ['Obróbka drewna'], filter: true, stormBlocked: false });
    await snap('02-po-obrobce-drewna.png');
    check('LIVE Obrobka drewna: dokladnie jeden przycisk - Taran', r.btns.length === 1 && /^Taran ·/.test(r.btns[0]), r.btns);
    check('LIVE Obrobka drewna: brak Katapulty/Wiezy/Tarana okutego w DOM', !/Katapulta|Wieża oblężnicza|Taran okuty/.test(r.text));

    r = await run({ techs: ['Obróbka drewna', 'Brązownictwo'], filter: true, stormBlocked: false });
    await snap('03-po-braz.png');
    check('LIVE Brazownictwo: 3 machiny, bez Katapulty', r.btns.length === 3 && !/Katapulta/.test(r.text), r.btns);
    check('LIVE z machina: Szturm aktywny i klik dziala', !r.stormDisabled && r.stormClickFired === true);

    // menu wyboru ataku (zarzut 3)
    const choice = (blocked) => page.evaluate(async (blocked) => {
      const C = await import('/src/ui/cityAttackChoice.ts');
      C.hideCityAttackChoice();
      window.__cacStorm = 0;
      const city = { id: 'c1', ownerId: 1, q: 3, r: 3, name: 'Memfis', population: 5, garnizon: 4, maMur: true };
      C.showCityAttackChoice({ tryb: 'oblezenie', city, atakujacy: { id: 'u0', ownerId: 0, typeId: 'Wojownik' }, garnizonUnit: null, oblegajacyOwnerId: 0 },
        { onSiege() {}, onStorm() { window.__cacStorm++; }, onCancel() {}, ...(blocked === null ? {} : { isStormBlocked: () => blocked }) });
      const b = document.querySelector('#civ-city-attack-choice [data-act="storm"]');
      b.click(); document.dispatchEvent(new KeyboardEvent('keydown', { key: '2' }));
      return { disabled: b.disabled, text: b.textContent, fired: window.__cacStorm };
    }, blocked);
    let c = await choice(true);
    await snap('04-menu-ataku-zablokowany.png');
    check('LIVE menu ataku: obwarowane bez machin => Szturm disabled + komunikat, klik i klawisz 2 nie odpalaja', c.disabled && /Potrzebne machiny oblężnicze — pozostaje oblężenie/.test(c.text) && c.fired === 0, c);
    c = await choice(false);
    check('LIVE menu ataku: z machina => Szturm aktywny (klik odpala)', !c.disabled && c.fired >= 1, c);
    c = await choice(null);
    check('LIVE menu ataku: bez isStormBlocked => zachowanie jak dotad', !c.disabled && c.fired >= 1, c);

    r = await run({ techs: [], filter: false, stormBlocked: true });
    check('MUTACJA (brak filtra techu): DOM zawiera niedostepne machiny => test czerwieni', NAMES.some(n => r.text.includes(n)) && r.btns.length > 0, r.btns);
    r = await run({ techs: [], filter: true, stormBlocked: false });
    check('MUTACJA (brak bramki szturmu): przycisk aktywny => test czerwieni', r.stormDisabled === false);
    check('brak bledow strony', errors.length === 0, errors);
  } finally { await browser.close(); }
}
(async () => {
  if (VITE) await live(); else console.log('SKIP: --vite nie podano, brak czesci Chromium');
  console.log(`\n${pass} PASS / ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
