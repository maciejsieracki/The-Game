'use strict';
/**
 * recruit-list-order-by-era-test.cjs -- R-WEB-RECRUIT-LIST-ORDER-BY-ERA-Q1 (2026-11-03).
 *
 * Reguła (zgłoszenie właściciela): na liście jednostek do rekrutacji NAJPIERW najnowsza epoka,
 * potem starsze (malejąco po epokach); w epoce od najmocniejszej do najsłabszej (fieldPower).
 * Jeden komparator (src/game/recruit-list-order.ts) dla panelu miasta i panelu Armia.
 *
 * CZĘŚĆ A (komparator, czysta logika): epoka malejąco, siła malejąco, remisy (koszt malejąco,
 *   potem nazwa), brak epoki = najstarsza, stabilność/determinizm, brak mutacji wejścia.
 * CZĘŚĆ B (prawdziwy Chromium + prawdziwy cityPanel.ts + prawdziwe gra/data): dla KAŻDEJ epoki
 *   (1..3, wszystkie technologie odblokowane) kolejność DOM wierszy w panelu miasta
 *   (showCityPanel -> REKRUTACJA) == w panelu Armia (mountCityRecruitmentCardsForArmy)
 *   == recruitPanelPurchasableUnits; epoka malejąco, w epoce siła malejąco; najnowsza epoka
 *   widoczna na górze bez przewijania.
 * CZĘŚĆ C (mutacje): odwrócenie komparatora epok oraz wyłączenie członu epoki łamią test.
 *
 * Usage (z gra/): node tools/recruit-list-order-by-era-test.cjs [--shots <katalog>] [--before]
 *   --before : wynik na starym zachowaniu (sama siła, bez epok) -- tylko do zrzutów PRZED
 *              i dowodu RED; kod produkcyjny nietknięty (mutacja w pamięci bundla).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const CITY_TS = path.resolve(GRA, 'src/ui/cityPanel.ts');
const ORDER_TS = path.resolve(GRA, 'src/game/recruit-list-order.ts');
const LOADER_TS = path.resolve(GRA, 'src/data/loader.ts');
const CITIES_TS = path.resolve(GRA, 'src/game/cities.ts');
const HEX_TS = path.resolve(GRA, 'src/types/hex.ts');
const POWER_TS = path.resolve(GRA, 'src/game/unit-power.ts');
const TMP = fs.mkdtempSync(path.join(fs.existsSync('/dev/shm') ? '/dev/shm' : os.tmpdir(), 'recruit-order-era-'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* best effort */ } });

const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let chromium;
try { ({ chromium } = require(path.join(GRA, 'node_modules', 'playwright'))); }
catch { console.error('playwright missing (npm ci --ignore-scripts w gra/)'); process.exit(1); }

const ARGV = process.argv.slice(2);
const BEFORE = ARGV.includes('--before');
const shotsIdx = ARGV.indexOf('--shots');
const SHOTS = shotsIdx >= 0 ? ARGV[shotsIdx + 1] : null;
const CHROME = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/pw-browsers/chromium';

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail).slice(0, 600) : '')); }
}

const J = JSON.stringify;
const ENTRY_SRC = [
  `import { configureCityPanel, showCityPanel, hideCityPanel, mountCityRecruitmentCardsForArmy, recruitPanelPurchasableUnits } from ${J(CITY_TS)};`,
  `import { loadGameData } from ${J(LOADER_TS)};`,
  `import { foundCityAt } from ${J(CITIES_TS)};`,
  `import { TerenBazowy, Nakladka } from ${J(HEX_TS)};`,
  `import { sortRecruitListByEra, compareRecruitUnitDefs, recruitEraRank, RECRUIT_ERA_ORDER } from ${J(ORDER_TS)};`,
  `import { fieldPower } from ${J(POWER_TS)};`,
  `import { UNIT_RECRUIT_CARD_CSS } from ${J(path.resolve(GRA, 'src/ui/unitRecruitCard.ts'))};`,
  'window.__api = { configureCityPanel, showCityPanel, hideCityPanel, mountCityRecruitmentCardsForArmy, recruitPanelPurchasableUnits,',
  '  loadGameData, foundCityAt, TerenBazowy, Nakladka, sortRecruitListByEra, compareRecruitUnitDefs, recruitEraRank,',
  '  RECRUIT_ERA_ORDER, fieldPower, UNIT_RECRUIT_CARD_CSS };',
].join('\n');

function browserPlugin(mutations) {
  return {
    name: 'recruit-order-compat',
    setup(build) {
      build.onResolve({ filter: /\.svg\?raw$/ }, a => ({ path: a.path, namespace: 'svg-raw-empty' }));
      build.onLoad({ filter: /.*/, namespace: 'svg-raw-empty' }, () => ({ contents: '', loader: 'text' }));
      build.onLoad({ filter: /\.ts$/ }, a => {
        const abs = path.resolve(a.path);
        let src = Object.prototype.hasOwnProperty.call(mutations, abs) ? mutations[abs] : fs.readFileSync(abs, 'utf8');
        if (src.includes('import.meta.glob')) {
          src = 'const __g = () => ({});\n' + src.replace(/import\.meta\.glob/g, '__g');
        }
        return { contents: src, loader: 'ts', resolveDir: path.dirname(abs) };
      });
    },
  };
}

let bundleSeq = 0;
async function buildBundle(mutations) {
  const id = ++bundleSeq;
  const entry = path.join(TMP, `entry-${id}.ts`);
  const out = path.join(TMP, `bundle-${id}.js`);
  fs.writeFileSync(entry, ENTRY_SRC, 'utf8');
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: out, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [browserPlugin(mutations)], logLevel: 'silent',
  });
  return fs.readFileSync(out, 'utf8');
}

/** Wykonywane w Chromium: konfiguracja panelu + odczyt realnego DOM obu paneli dla epoki. */
const PAGE_SRC = `
window.__runEpoch = function (epoch) {
  const A = window.__api;
  document.body.innerHTML = '';
  const data = A.loadGameData();
  const flatMap = { szerokoscQ: 20, wysokoscR: 20, hexes: {}, seed: 42, riverPaths: [] };
  for (let q = 0; q < 20; q++) for (let r = 0; r < 20; r++) {
    flatMap.hexes[q + ',' + r] = {
      coords: { q: q, r: r }, terenBazowy: A.TerenBazowy.Rownina, nakladka: A.Nakladka.Brak,
      ulepszenie: 'brak', wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  const cities = [];
  const city = A.foundCityAt(8, 8, 0, cities, flatMap, 'Testowo');
  if (!city) throw new Error('fixture city could not be founded');
  city.population = 10;
  const norm = v => String(v || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const keys = new Set(['drewno','kamien','glina','ruda','ruda_zelaza','ruda_cyny','cegla','braz','zelazo','stal','konie','zywnosc']);
  for (const row of data.resources || []) for (const v of [row.id, row.nazwa, row.name, row.Zasob]) if (v) { keys.add(String(v)); keys.add(norm(v)); }
  for (const row of data.units || []) if (row.Surowiec) { keys.add(String(row.Surowiec)); keys.add(norm(row.Surowiec)); }
  const stock = {}; for (const k of keys) stock[k] = 1000000;
  city.surowce = { ...stock };
  cities.push(city);
  const allB = []; for (const row of data.buildings || []) for (const v of [row.id, row.nazwa, row.Budynek]) if (v) allB.push(String(v));
  const allTechs = (data.tech || []).map(r => r.Technologia).filter(Boolean);
  const allRes = [...keys];
  const production = { kolejka: [], postep: 0, rekrutacja: [] };
  A.configureCityPanel({
    data, difficulty: 'normal', getCities: () => cities, getEpoch: () => epoch,
    getUnlockedTechs: () => allTechs, getBuiltBuildingIds: () => allB, getEmpireBuiltIds: () => allB,
    getResourceAccess: () => allRes, getEmpireResourceAccess: () => allRes, getEmpireStock: () => stock,
    getProduction: () => production, getTreasury: () => 1000000, getEmpireRekruciTotal: () => 1000000,
    getManpowerSnapshot: () => ({ manpowerBiezacy: 1000000, manpowerMax: 1000000, kosztJednostki: 1, epoka: epoch }),
    getEmpireHud: () => ({ pracaPool: 1000, pracaRate: 100, zloto: 1000000, zlotoRate: 100, nauka: 1000, naukaRate: 100,
      zywnoscReserve: 1000, zywnoscRate: 100, kultura: 100, kulturaRate: 10, religionStock: 100, religionRate: 10 }),
    getCivKey: () => 'grecy', getCivBonusy: () => [], getOwnerHasZlotoAccess: () => true,
    getCityHasCoastOrRiver: () => true, getCapitalCityId: () => city.id, getHasKopalniaNaZlozuZelaza: () => true,
    getPlacedImprovements: () => new Map(), getAliveUnitTypeNames: () => new Set(), getCityWorkedRange: () => 5,
    getWorkedTiles: () => [], getOwnerColor: () => 0x4f8cc9, getDifficulty: () => 'normal',
    getBuildingCostPace: () => 'niski', getKosztJednostekPace: () => 'niski',
    onPurchaseUnit: () => {}, onCancelRecruitment: () => {}, onChange: () => {},
  });
  const byName = new Map(data.units.map(u => [u.Jednostka, u]));
  const model = A.recruitPanelPurchasableUnits(city, data).map(it => {
    const u = byName.get(it.id);
    return { id: it.id, epoka: u ? u.Epoka : null, power: u ? A.fieldPower(u).total : null, cost: u ? u['Pieniądz (koszt)'] : null };
  });
  const rowsOf = root => [...root.querySelectorAll('.unit-recruit-compact-row')].map(r => ({
    name: (r.querySelector('.bld-compact-name') || {}).textContent || '',
    meta: (r.querySelector('.unit-compact-meta') || {}).textContent || '',
  }));
  // --- panel MIASTA (prawdziwy showCityPanel -> zakładka REKRUTACJA) ---
  A.showCityPanel(city, flatMap, () => {});
  const btn = [...document.querySelectorAll('.civ-v-icon-btn')].find(b => /Jednostki do rekrutacji/i.test(b.getAttribute('aria-label') || ''));
  if (!btn) throw new Error('recruitment rail button missing');
  btn.click();
  const cityRoot = document.querySelector('#cs-units');
  const cityRows = rowsOf(cityRoot);
  const list = cityRoot.querySelector('.list-scroll');
  const first = cityRoot.querySelector('.unit-recruit-compact-row');
  let firstVisible = false;
  if (list && first) {
    const lr = list.getBoundingClientRect(), fr = first.getBoundingClientRect();
    firstVisible = fr.top >= lr.top - 1 && fr.bottom <= lr.bottom + 1 && list.scrollTop === 0;
  }
  // --- panel ARMIA (prawdziwy mountCityRecruitmentCardsForArmy) ---
  A.hideCityPanel();
  document.body.innerHTML = '';
  const css = document.createElement('style'); css.textContent = A.UNIT_RECRUIT_CARD_CSS + '\\n' + (window.__armyCss || ''); document.head.appendChild(css);
  const host = document.createElement('div'); host.style.cssText = 'width:420px;margin:8px;background:#1b1712;';
  document.body.appendChild(host);
  if (!A.mountCityRecruitmentCardsForArmy(city.id, host)) throw new Error('army mount failed');
  const armyRows = rowsOf(host);
  const armyList = host.querySelector('.list-scroll');
  const armyFirst = host.querySelector('.unit-recruit-compact-row');
  let armyFirstVisible = false;
  if (armyList && armyFirst) {
    const lr = armyList.getBoundingClientRect(), fr = armyFirst.getBoundingClientRect();
    armyFirstVisible = fr.top >= lr.top - 1 && fr.bottom <= lr.bottom + 1 && armyList.scrollTop === 0;
  }
  return { model, cityRows, armyRows, firstVisible, armyFirstVisible };
};
`;

const ERA = ['Kamień', 'Brąz', 'Żelazo'];
const rank = e => Math.max(0, ERA.indexOf(e));

/** CSS hosta panelu Armia z prawdziwego empireDetailPanel.ts (jak army-panel-recruit-remove-test). */
function armyHostCss() {
  const src = fs.readFileSync(path.join(GRA, 'src', 'ui', 'empireDetailPanel.ts'), 'utf8').split('\n');
  const i0 = src.findIndex(l => l.startsWith('.civ-emp-mass-city-recruit-list.civ-cs{'));
  const i1 = src.findIndex(l => l.startsWith('.civ-emp-mass-rally{'));
  if (i0 < 0 || i1 <= i0) throw new Error('nie znaleziono CSS hosta w empireDetailPanel.ts');
  return src.slice(i0, i1).join('\n') + '\n' + src.filter(l => /^\.civ-emp-mass-(city|empty)/.test(l)).join('\n');
}

async function collect(browser, bundle) {
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  try {
    await page.setContent('<!doctype html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#0b0f16;color:#eee;font-family:system-ui,sans-serif;}</style></head><body></body></html>');
    await page.addScriptTag({ content: bundle });
    await page.addScriptTag({ content: PAGE_SRC });
    await page.evaluate(css => { window.__armyCss = css; }, armyHostCss());
    const out = {};
    for (const epoch of [1, 2, 3]) {
      out[epoch] = await page.evaluate(e => window.__runEpoch(e), epoch);
    }
    out.errors = errors;
    return out;
  } finally { await page.close(); }
}

/** Zrzut panelu miasta: osobny przebieg, który zatrzymuje się na otwartym panelu REKRUTACJA. */
async function cityShot(browser, bundle, file) {
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  try {
    await page.setContent('<!doctype html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#0b0f16;color:#eee;font-family:system-ui,sans-serif;}</style></head><body></body></html>');
    await page.addScriptTag({ content: bundle });
    await page.addScriptTag({ content: PAGE_SRC.replace('A.hideCityPanel();', 'if (window.__stopAtCity) return { stopped: true };\n  A.hideCityPanel();') });
    await page.evaluate(() => { window.__stopAtCity = true; return window.__runEpoch(3); });
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file, fullPage: false });
  } finally { await page.close(); }
}

function evaluateOrder(res) {
  const failures = [];
  for (const epoch of [1, 2, 3]) {
    const r = res[epoch];
    const ids = r.model.map(m => m.id);
    const cityIds = r.cityRows.map(x => x.name);
    const armyIds = r.armyRows.map(x => x.name);
    const name = id => id;
    if (r.model.length < 2) failures.push(`E${epoch}: lista < 2 jednostek (${r.model.length})`);
    if (JSON.stringify(cityIds.map(name)) !== JSON.stringify(ids.map(name))) failures.push(`E${epoch}: DOM miasta != model`);
    if (JSON.stringify(armyIds.map(name)) !== JSON.stringify(ids.map(name))) failures.push(`E${epoch}: DOM Armii != model`);
    for (let i = 1; i < r.model.length; i++) {
      const a = r.model[i - 1], b = r.model[i];
      if (rank(a.epoka) < rank(b.epoka)) { failures.push(`E${epoch}: ${a.id}(${a.epoka}) przed ${b.id}(${b.epoka}) -- starsza epoka wyżej`); break; }
      if (rank(a.epoka) === rank(b.epoka) && a.power < b.power) { failures.push(`E${epoch}: ${a.id}(${a.power}) przed ${b.id}(${b.power}) -- słabsza wyżej w epoce`); break; }
    }
    const newest = Math.max(...r.model.map(m => rank(m.epoka)));
    if (r.model.length && rank(r.model[0].epoka) !== newest) failures.push(`E${epoch}: pierwsza jednostka nie z najnowszej epoki`);
    if (!r.firstVisible) failures.push(`E${epoch}: pierwszy wiersz panelu miasta niewidoczny bez przewijania`);
    if (!r.armyFirstVisible) failures.push(`E${epoch}: pierwszy wiersz panelu Armia niewidoczny bez przewijania`);
  }
  return failures;
}

async function main() {
  const orderSrc = fs.readFileSync(ORDER_TS, 'utf8');
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  try {
    // Wariant bazowy: --before wyłącza człon epoki (zachowanie sprzed zmiany).
    const eraLine = 'const era = recruitEraRank(b.Epoka) - recruitEraRank(a.Epoka);';
    check('M0: komparator zawiera linię członu epoki (kotwica mutacji)', orderSrc.includes(eraLine));
    const mutations = BEFORE ? { [ORDER_TS]: orderSrc.replace(eraLine, 'const era = 0;') } : {};
    const bundle = await buildBundle(mutations);

    // ---------------- CZĘŚĆ A: komparator ----------------
    console.log('\n-- CZESC A: komparator (czysta logika) --');
    const page0 = await browser.newPage();
    await page0.setContent('<html><body></body></html>');
    await page0.addScriptTag({ content: bundle });
    const A = await page0.evaluate(() => {
      const X = window.__api;
      const u = (Jednostka, Epoka, atk, def, hp, cost) => ({ Jednostka, Epoka, meleeAttack: atk, meleeDefence: def, health: hp, 'Pieniądz (koszt)': cost });
      const src = [
        u('K-slaby', 'Kamień', 1, 1, 10, 5), u('K-mocny', 'Kamień', 9, 9, 90, 20),
        u('B-slaby', 'Brąz', 2, 2, 20, 8), u('B-mocny', 'Brąz', 12, 12, 120, 30),
        u('Z-slaby', 'Żelazo', 3, 3, 30, 10), u('Z-mocny', 'Żelazo', 15, 15, 150, 40),
        u('Bez-epoki', undefined, 50, 50, 500, 1),
        u('Z-remis-b', 'Żelazo', 5, 5, 50, 10), u('Z-remis-a', 'Żelazo', 5, 5, 50, 10), u('Z-remis-drogi', 'Żelazo', 5, 5, 50, 99),
      ];
      const snapshot = JSON.stringify(src);
      const sorted = X.sortRecruitListByEra(src, x => x);
      const again = X.sortRecruitListByEra(src.slice().reverse(), x => x);
      const withMissing = X.sortRecruitListByEra([{ id: 'brak-def' }, { id: 'Z' }], x => x.id === 'Z' ? src[5] : null);
      return {
        ids: sorted.map(x => x.Jednostka), idsReversedInput: again.map(x => x.Jednostka),
        unchanged: JSON.stringify(src) === snapshot, missing: withMissing.map(x => x.id),
        rankNone: X.recruitEraRank(undefined), rankUnknown: X.recruitEraRank('Średniowiecze'), rankZ: X.recruitEraRank('Żelazo'),
        order: X.RECRUIT_ERA_ORDER,
      };
    });
    await page0.close();
    check('A1: epoka malejąco (Żelazo, potem Brąz, potem Kamień), w epoce siła malejąco',
      JSON.stringify(A.ids.filter(n => n !== 'Bez-epoki')) === JSON.stringify([
        'Z-mocny', 'Z-remis-drogi', 'Z-remis-a', 'Z-remis-b', 'Z-slaby', 'B-mocny', 'B-slaby', 'K-mocny', 'K-slaby']), A.ids);
    check('A2: jednostka bez epoki = najstarsza (w grupie Kamień, wg siły -- najmocniejsza z grupy)',
      A.ids.indexOf('Bez-epoki') > A.ids.indexOf('B-slaby') && A.ids.indexOf('Bez-epoki') < A.ids.indexOf('K-mocny'), A.ids);
    check('A3: remis siły -- koszt malejąco, potem nazwa rosnąco (Z-remis-drogi, a, b)',
      A.ids.indexOf('Z-remis-drogi') < A.ids.indexOf('Z-remis-a') && A.ids.indexOf('Z-remis-a') < A.ids.indexOf('Z-remis-b'));
    check('A4: deterministyczne -- odwrócone wejście daje ten sam porządek', JSON.stringify(A.ids) === JSON.stringify(A.idsReversedInput));
    check('A5: nie mutuje wejścia', A.unchanged === true);
    check('A6: brak definicji -> na końcu', JSON.stringify(A.missing) === '["Z","brak-def"]', A.missing);
    check('A7: rangi epok: brak=0, nieznana=0, Żelazo=2; kolejność epok Kamień,Brąz,Żelazo',
      A.rankNone === 0 && A.rankUnknown === 0 && A.rankZ === 2 && JSON.stringify(A.order) === JSON.stringify(ERA), A);

    // ---------------- CZĘŚĆ B: prawdziwe panele ----------------
    console.log('\n-- CZESC B: prawdziwy Chromium, prawdziwe dane, oba panele --');
    const res = await collect(browser, bundle);
    check('B0: brak bledow strony', (res.errors || []).length === 0, res.errors);
    for (const epoch of [1, 2, 3]) {
      const r = res[epoch];
      console.log(`  [epoka ${epoch}] ${r.model.map(m => `${m.id}(${m.epoka},${m.power})`).join(' | ')}`);
    }
    const failures = evaluateOrder(res);
    check('B1: dla epok 1..3 -- epoka malejąco, siła malejąco w epoce, DOM miasta == DOM Armii == model, pierwszy wiersz widoczny',
      failures.length === 0, failures);
    const e3 = res[3];
    check('B2: epoka 3 zawiera jednostki z >=2 epok (test nie jest pusty)', new Set(e3.model.map(m => m.epoka)).size >= 2,
      [...new Set(e3.model.map(m => m.epoka))]);
    check('B3: epoka 3 -- pierwszy wiersz obu paneli to Żelazo',
      /Żelazo/.test(e3.cityRows[0].meta) && /Żelazo/.test(e3.armyRows[0].meta), [e3.cityRows[0], e3.armyRows[0]]);

    if (SHOTS) {
      const tag = BEFORE ? 'PRZED' : 'PO';
      fs.mkdirSync(SHOTS, { recursive: true });
      await cityShot(browser, bundle, path.join(SHOTS, `${tag}-miasto-epoka3.png`));
      const page = await browser.newPage({ viewport: { width: 460, height: 560 } });
      await page.setContent('<!doctype html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#0b0f16;color:#eee;font-family:system-ui,sans-serif;}</style></head><body></body></html>');
      await page.addScriptTag({ content: bundle });
      await page.addScriptTag({ content: PAGE_SRC });
      await page.evaluate(css => { window.__armyCss = css; }, armyHostCss());
      await page.evaluate(() => window.__runEpoch(3));
      await page.screenshot({ path: path.join(SHOTS, `${tag}-armia-epoka3.png`) });
      await page.close();
    }

    // ---------------- CZĘŚĆ C: mutacje ----------------
    if (!BEFORE) {
      console.log('\n-- CZESC C: mutacje musza lamac test --');
      const mutants = {
        'odwrócenie komparatora epok': orderSrc.replace(eraLine, 'const era = recruitEraRank(a.Epoka) - recruitEraRank(b.Epoka);'),
        'wyłączenie członu epoki': orderSrc.replace(eraLine, 'const era = 0;'),
        'odwrócenie siły': orderSrc.replace('const power = fieldPower(b, coeff).total - fieldPower(a, coeff).total;',
          'const power = fieldPower(a, coeff).total - fieldPower(b, coeff).total;'),
      };
      for (const [label, src] of Object.entries(mutants)) {
        check(`C0 (${label}): mutacja trafiła w kod`, src !== orderSrc);
        const mb = await buildBundle({ [ORDER_TS]: src });
        const mres = await collect(browser, mb);
        const mf = evaluateOrder(mres);
        check(`C (${label}): test wykrywa mutację (B1 czerwone)`, mf.length > 0, mf.slice(0, 2));
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`\n=== recruit-list-order-by-era-test: ${pass} pass, ${fail} fail ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });
