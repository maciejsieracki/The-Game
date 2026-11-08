'use strict';

/**
 * R-WEB-AUTO-IMPROVE-Q3-RIVER-BALANCED-DEFENSECAP-WARNING-Q1 (decyzje wlasciciela ABC, 2026-11-03) — cztery zmiany automatu ulepszen:
 *   (1) wycinka lasu na/przy rzece takze w profilu K2 „Zrownowazone” (dawniej tylko K1 „Zywnosc”);
 *   (2) farma na wycietym heksie rzeki BEZ obywatela mimo „Tylko pola z obywatelami” ON (K1 i K2); reszta ulepszen nadal za filtrem;
 *   (3) brak limitu `defenseCap = ceil(pop/10)` fortow i posterunkow na miasto/klucz;
 *   (4) staly wskaznik „Budzet niewydany” (czysta funkcja `unspentBudgetWarning` + realny render `createBuildModeHud` w Chromium).
 * R-WEB-AI-FOOD-ONLY-WORKED-HEXES-Q1 (decyzja wlasciciela 2026-11-03/04, NADRZEDNA — „tak ma byc i koniec”): zmiany (1) i (2) przy
 * „Tylko pola z obywatelami” ON ZNIESIONE (wycinka rzeczna i farma na wycietym heksie bez obywatela). Asercje (1), (2), (2c2) ODWROCONE
 * (0 wycinek/farm poza polami obywateli); (3) i (4) bez zmian. Nowy kontrakt: ai-food-only-worked-hexes-test.cjs.
 * Prawdziwy `pickAutoImprovements`, bez mockow. Run z gra/:  node tools/auto-improve-q3-test.cjs
 * RED/GREEN:  AUTO_Q3_SRC_DIR=<kopia gra/src sprzed zmian> node tools/auto-improve-q3-test.cjs   (MUSI byc czerwony)
 * Mutacje:    AUTO_Q3_SRC_DIR=<kopia gra/src z mutacja> ...   (MUSI byc czerwony)
 * Zrzut UI:   AUTO_Q3_SHOT_DIR=<katalog> (opcjonalnie; domyslnie w katalogu tymczasowym)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AUTO_Q3_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const SHOT_DIR = process.env.AUTO_Q3_SHOT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'q3-shot-'));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-improve-q3-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export * as AIMP from ${JSON.stringify(SRC + '/game/auto-improvements')};\nexport { resolveEffectiveUlepszenia } from ${JSON.stringify(SRC + '/game/cities')};\n`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements, unspentBudgetWarning, freshSurplusReport, AUTO_ULEPSZENIA_PRACA_RESERVE } = require(bundle).AIMP;
const { resolveEffectiveUlepszenia } = require(bundle);

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}

const FULL = new Set(['Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna', 'Irygacja', 'Łowiectwo', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo',
  'Górnictwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta', 'Wojskowość', 'Żegluga', 'Drogi brukowane', 'Matematyka',
  'Obróbka kamienia', 'Kamieniarstwo']);
const K = (q, r) => `${q},${r}`;
const desc = picks => picks.map(p => p.key + '@' + K(p.q, p.r)).join(' ') || 'nic';

// ---------------------------------------------------------------------------
// Mapa/miasto jak w autoclear-river-forest-priority-test: miasto (12,12) w lesie, rzeka (12,10),(12,11),(13,10).
const W = 24, H = 24, CQ = 12, CR = 12;
function makeMap({ river = [], forest = [] } = {}) {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  for (const [q, r] of river) hexes[K(q, r)].rzeka = { obecna: true, krawedzie: [] };
  for (const [q, r] of forest) hexes[K(q, r)].nakladka = 'las';
  return { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: river.length ? [river.map(([q, r]) => ({ q, r }))] : [] };
}
const CITY = focus => ({ id: 'c0', ownerId: 0, q: CQ, r: CR, name: 'Mykeny', population: 3, ulepszeniaFocus: focus });
const TN = [{ q: CQ, r: CR, ownerId: 0, cityId: 'c0', pop: 3, level: 1 }];
const RIVER = [[12, 10], [12, 11], [13, 10]];
const isRiver = (q, r) => RIVER.some(([a, b]) => a === q && b === r);
// „Na/przy rzece” = heks rzeki albo jej sasiad (jak `onRiverHex` pickera: dostep do rzeki).
const AX = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
const nearRiver = (q, r) => isRiver(q, r) || AX.some(([dq, dr]) => isRiver(q + dq, r + dr));
const FOREST_AROUND = [];
for (let q = 9; q <= 15; q++) for (let r = 9; r <= 15; r++) if (!(q === CQ && r === CR)) FOREST_AROUND.push([q, r]);
const WORKED_NO_RIVER = [[11, 12], [13, 12], [12, 13]];

// R-WEB-AUTOIMPROVE-SIMPLE-FOOD-RULE-NO-TOGGLES-Q1: parametr `onlyWorked` jest martwy (przelacznik usuniety; regula zywnosci zawsze wlaczona).
const FOOD_KEYS = new Set(['farma', 'irygacja', 'tarasy', 'bydlo', 'owce', 'lama', 'lodzie_rybackie', 'warzelnia_soli', 'wyrab']);
function pick({ map, worked, onlyWorked = true, skipWyrab = false, focus, placed = new Map(), clearing = new Set(), pool = 400, report, deficit = [] }) {
  const workedSet = new Set(worked.map(([q, r]) => K(q, r)));
  return pickAutoImprovements({
    cities: [CITY(focus)], ownerId: 0, map, territoryNodes: TN, placedImprovements: placed, pracaAvailable: pool,
    unlockedTechs: FULL, pracaSurplusThreshold: 0, skipWyrab, demandDriven: true, resourceDeficitKeys: deficit,
    getFocus: () => focus, getWorkedHexKeys: () => workedSet,
    pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: 'rzymianie', playerEra: 3,
    foodImprovementStages: () => true, clearingHexKeys: clearing, ...(report ? { surplusReport: report } : {}),
  });
}
/** Symulacja tura po turze: wycinka trwa 1 ture, potem las znika; reszta wchodzi do `placed`. */
function sim({ map, worked, onlyWorked, skipWyrab = false, skipFrom = null, focus, turns = 12 }) {
  const placed = new Map(), clearing = new Map(), log = [];
  for (let t = 0; t < turns; t++) {
    const picks = pick({ map, worked, onlyWorked, skipWyrab: skipWyrab || (skipFrom !== null && t >= skipFrom), focus, placed, clearing: new Set(clearing.keys()) });
    for (const p of picks) {
      const hk = K(p.q, p.r);
      log.push({ t, key: p.key, q: p.q, r: p.r, hk });
      if (p.key === 'wyrab') { clearing.set(hk, t + 1); continue; }
      placed.set(hk, [...(placed.get(hk) ?? []), p.key]);
    }
    for (const [hk, doneT] of [...clearing]) if (t + 1 >= doneT) { map.hexes[hk].nakladka = 'brak'; clearing.delete(hk); }
  }
  return { log, placed };
}
const dl = log => log.slice(0, 10).map(e => `${e.t}:${e.key}@${e.hk}`).join(' ') || 'nic';
const MAXT = 4;

(async () => {
  // ===== (1) K2 „Zrownowazone”: wycinka lasu na/przy rzece ==========================================================
  console.log('(1) K2 „Zrownowazone” + rzeka + las + „Tylko pola z obywatelami” ON: wycinka na heksie rzeki w <= 4 turach (jak K1)');
  for (const focus of ['zywnosc', 'zrownowazone']) {
    const map = makeMap({ river: RIVER, forest: FOREST_AROUND });
    const { log } = sim({ map, worked: WORKED_NO_RIVER, onlyWorked: true, focus });
    const rc = log.find(e => e.key === 'wyrab' && isRiver(e.q, e.r));
    ok(!!rc, `${focus}: wycinka rzeczna bez obywatela WYSTEPUJE przy filtrze ON (NO-CITIZEN-Q1, decyzja wlasciciela 2026-11-05; jest: ${rc && rc.hk})`);
  }
  console.log('(1b) K2: „Wolno wycinac las” OFF (skipWyrab) nadal blokuje cala wycinke (U-6 = A)');
  {
    const map = makeMap({ river: RIVER, forest: FOREST_AROUND });
    const { log } = sim({ map, worked: WORKED_NO_RIVER, onlyWorked: true, focus: 'zrownowazone', skipWyrab: true });
    ok(!log.some(e => e.key === 'wyrab'), `K2 + skipWyrab: brak wycinki (log: ${dl(log)})`);
  }
  console.log('(1c) K2: las BEZ rzeki poza polami obywateli nadal NIE jest wycinany (filtr zachowany)');
  {
    const map = makeMap({ river: [], forest: FOREST_AROUND });
    const { log } = sim({ map, worked: WORKED_NO_RIVER, onlyWorked: true, focus: 'zrownowazone' });
    const bad = log.filter(e => e.key === 'wyrab' && !WORKED_NO_RIVER.some(([q, r]) => q === e.q && r === e.r));
    ok(bad.length === 0, `K2: brak wycinki poza polami obywateli (${bad.length}; log: ${dl(log)})`);
  }

  // ===== (2) farma na wycietym heksie rzeki bez obywatela ==========================================================
  console.log('(2) po wycince lasu na/przy rzece farma powstaje na wycietym heksie BEZ obywatela (K1 i K2, filtr ON)');
  for (const focus of ['zywnosc', 'zrownowazone']) {
    const map = makeMap({ river: RIVER, forest: FOREST_AROUND });
    const { log } = sim({ map, worked: WORKED_NO_RIVER, onlyWorked: true, focus, turns: 14 });
    const cleared = log.filter(e => e.key === 'wyrab' && isRiver(e.q, e.r));
    const withFarm = cleared.filter(c => log.some(e => e.key === 'farma' && e.hk === c.hk && e.t > c.t));
    ok(cleared.length > 0 && withFarm.length === 0, `${focus}: wycinki rzeczne bez obywatela sa (${cleared.length}), ale farma po nich NIE powstaje bez obywatela (NO-CITIZEN-Q1; z farma: ${withFarm.length}; log: ${dl(log)})`);
    const farmNoCitizen = log.filter(e => e.key === 'farma' && !WORKED_NO_RIVER.some(([q, r]) => q === e.q && r === e.r) && e.hk !== K(CQ, CR));
    ok(farmNoCitizen.length === 0, `${focus}: zero farm poza polami obywateli (${farmNoCitizen.length})`);
  }
  console.log('(2b) wyjatek zawezony: reszta ulepszen nadal za filtrem „Tylko pola z obywatelami”');
  for (const focus of ['zywnosc', 'zrownowazone']) {
    const map = makeMap({ river: RIVER, forest: FOREST_AROUND });
    const { log } = sim({ map, worked: WORKED_NO_RIVER, onlyWorked: true, focus, turns: 20 });
    const centre = K(CQ, CR);
    const allowed = new Set([...WORKED_NO_RIVER.map(([q, r]) => K(q, r)), centre]);
    // Nowa regula (wlasciciel 2026-11-04): za filtrem obywateli zostaja WYLACZNIE ulepszenia zywnosciowe; drogi itp. stawia sie gdziekolwiek.
    const other = log.filter(e => FOOD_KEYS.has(e.key) && !['farma', 'wyrab'].includes(e.key) && !allowed.has(e.hk));
    ok(other.length === 0, `${focus}: zywnosc poza farma/wycinka nic bez obywatela (naruszen: ${other.length}; ${dl(other)})`);
    const farmOff = log.filter(e => e.key === 'farma' && !allowed.has(e.hk) && !nearRiver(e.q, e.r));
    ok(farmOff.length === 0, `${focus}: farma bez obywatela TYLKO na heksie na/przy rzece (gdzie indziej: ${farmOff.length})`);
  }
  console.log('(2c) „Wolno wycinac las” OFF: wyjatek farmy NIE dziala (wyciecie wylaczone) — heks rzeki bez lasu i bez obywatela bez farmy');
  for (const focus of ['zywnosc', 'zrownowazone']) {
    const map = makeMap({ river: RIVER, forest: [] });
    const { log } = sim({ map, worked: WORKED_NO_RIVER, onlyWorked: true, focus, skipWyrab: true, turns: 8 });
    ok(!log.some(e => e.key === 'farma' && isRiver(e.q, e.r)), `${focus}: skipWyrab -> brak farmy na heksie rzeki bez obywatela (log: ${dl(log)})`);
  }
  console.log('(2e) wyjatek tylko dla heksow WYCIETYCH przez automat: naturalnie otwarte pole przy rzece (bez lasu, bez obywatela) NIE dostaje farmy');
  for (const focus of ['zywnosc', 'zrownowazone']) {
    const map = makeMap({ river: RIVER, forest: [] });
    const { log } = sim({ map, worked: WORKED_NO_RIVER, onlyWorked: true, focus, turns: 8 });
    const bad = log.filter(e => e.key === 'farma' && nearRiver(e.q, e.r) && !WORKED_NO_RIVER.some(([q, r]) => q === e.q && r === e.r) && e.hk !== K(CQ, CR));
    ok(bad.length === 0, `${focus}: brak farm bez obywatela na otwartych polach przy rzece (${bad.length}; log: ${dl(log)})`);
  }
  console.log('(2c2) „Wolno wycinac las” wylaczone PO wycince: wyjatek farmy gasnie (brak farm bez obywatela na wycietych heksach od tury wylaczenia)');
  for (const focus of ['zywnosc', 'zrownowazone']) {
    const map = makeMap({ river: RIVER, forest: FOREST_AROUND });
    const { log } = sim({ map, worked: WORKED_NO_RIVER, onlyWorked: true, focus, skipFrom: 2, turns: 12 });
    const cleared = log.filter(e => e.key === 'wyrab' && isRiver(e.q, e.r));
    const late = log.filter(e => e.t >= 2 && e.key === 'farma' && nearRiver(e.q, e.r) && !WORKED_NO_RIVER.some(([q, r]) => q === e.q && r === e.r) && e.hk !== K(CQ, CR));
    ok(late.length === 0, `${focus}: (Q1 AI-FOOD: wycinek rzecznych bez obywatela ${cleared.length}) farm bez obywatela po wylaczeniu ${late.length} (log: ${dl(log)})`);
  }
  console.log('(2d) profil „surowce” NIE dostaje wyjatku farmy (zakres: Zywnosc i Zrownowazone)');
  {
    const map = makeMap({ river: RIVER, forest: [] });
    const { log } = sim({ map, worked: WORKED_NO_RIVER, onlyWorked: true, focus: 'surowce', turns: 6 });
    ok(!log.some(e => e.key === 'farma' && isRiver(e.q, e.r)), `surowce: brak farmy rzecznej bez obywatela (log: ${dl(log)})`);
  }

  // ===== (3) brak defenseCap ========================================================================================
  console.log('(3) brak limitu fortow/posterunkow na miasto: pop 5, kilka posterunkow przy granicy -> wiecej niz 1 (profil „infrastruktura”)');
  {
    const FARMS = [[CQ + 1, CR], [CQ + 1, CR - 1], [CQ, CR + 1], [CQ - 1, CR + 1], [CQ - 1, CR]];
    const W2 = 44, CQ2 = 22, CR2 = 22;
    const hexes = {};
    for (let q = 0; q < W2; q++) for (let r = 0; r < W2; r++) {
      hexes[K(q, r)] = { coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] } };
    }
    const map = { szerokoscQ: W2, wysokoscR: W2, hexes, seed: 7, riverPaths: [] };
    const placed = new Map(FARMS.map(([a, b]) => [K(a - CQ + CQ2, b - CR + CR2), ['farma']]));
    const city = { id: 'c0', ownerId: 0, q: CQ2, r: CR2, name: 'A', population: 5, ulepszeniaFocus: 'infrastruktura' };
    const tn = [{ q: CQ2, r: CR2, ownerId: 0, cityId: 'c0', pop: 5, level: 1 }];
    const perKey = { posterunek: 0, fort: 0 };
    for (let t = 0; t < 12; t++) {
      const picks = pickAutoImprovements({
        cities: [city], ownerId: 0, map, territoryNodes: tn, placedImprovements: placed, pracaAvailable: 100000, unlockedTechs: FULL,
        pracaSurplusThreshold: 30, skipWyrab: true, demandDriven: false, getFocus: () => 'infrastruktura', getOnlyWorked: () => false,
        getWorkedHexKeys: () => new Set(), pracaBudgetPercent: 100, civArchetype: 'grecy', playerEra: 3, cityLimitExhausted: true,
      });
      for (const p of picks) { placed.set(K(p.q, p.r), [...(placed.get(K(p.q, p.r)) ?? []), p.key]); if (p.key in perKey) perKey[p.key]++; }
    }
    console.log(`  [info] pop 5, 12 wywolan: posterunek=${perKey.posterunek}, fort=${perKey.fort} (dawny sufit: 1 + 1)`);
    ok(perKey.posterunek + perKey.fort >= 3, `wiecej niz dawny sufit 1 posterunek + 1 fort (jest ${perKey.posterunek}+${perKey.fort})`);
    ok(perKey.posterunek > 1 || perKey.fort > 1, 'przynajmniej jeden z kluczy przekracza 1 sztuke na miasto');
  }

  // ===== (4) wskaznik „Budzet niewydany” — logika na prawdziwym raporcie pickera ====================================
  console.log('(4) wskaznik niewydanego budzetu: czysta funkcja zasilana prawdziwym surplusReport pickera');
  ok(typeof unspentBudgetWarning === 'function' && typeof freshSurplusReport === 'function', 'eksport unspentBudgetWarning istnieje');
  if (typeof unspentBudgetWarning === 'function') {
    // K2, brak rzek, miasto w lesie ze wszystkimi polami obywateli juz po farmie -> brak kandydatow przy obywatelach, reszta terytorium czeka.
    const mapOpen = makeMap({ river: [], forest: [] });
    const workedAll = [[CQ, CR], [11, 12], [13, 12], [12, 13]];
    // R-WEB-AUTOIMPROVE-PASTURE-IRRIGATION-NOT-BUILT-Q2 (2026-11-08): trzoda wolno stawiac tez POZA rzeka (na farmie na polu obywatela), wiec
    // „brak kandydatow przy obywatelach” oznacza teraz pola po farmie I trzodzie (irygacji bez rzeki i tak nie ma).
    const placedFarms = new Map(workedAll.map(([q, r]) => [K(q, r), ['farma', 'bydlo']]));
    const run = ({ onlyWorked, pool = 400, deficit = [], freeFarmAt = null }) => {
      const report = freshSurplusReport();
      const placedNow = new Map(placedFarms);
      if (freeFarmAt) placedNow.delete(K(freeFarmAt[0], freeFarmAt[1])); // pole obywatela bez farmy = kandydat zywnosciowy
      const picks = pick({ map: mapOpen, worked: workedAll, onlyWorked, focus: 'zrownowazone', placed: placedNow, pool, report, deficit });
      return { report, picks };
    };
    const A = run({ onlyWorked: true });
    const wA = unspentBudgetWarning(A.report, { onlyWorkedOn: true, poolAboveReserve: true });
    console.log(`  [info] filtr ON: picks=${desc(A.picks)}, anyCandidate=${A.report.anyCandidate}, czeka=${A.report.filterWaitingKeys.size}`);
    ok(!A.report.anyCandidate && !!wA && wA.waitingHexes > 0, `filtr ON, brak kandydatow przy obywatelach: wskaznik jest, X=${wA && wA.waitingHexes} pol czeka`);
    ok(A.report.surplus === true, 'stary raport nadwyzki (surplus) nadal true w tym scenariuszu (kompatybilnosc)');
    // Filtr nie ma juz przelacznika: gdy na polu obywatela jest kandydat zywnosciowy, picker wydaje i wskaznika brak.
    const B = run({ freeFarmAt: [11, 12] });
    ok(B.picks.some(p => p.key === 'farma') && B.report.anyCandidate, `kandydat zywnosciowy na polu obywatela: automat stawia farme (${desc(B.picks)})`);
    ok(unspentBudgetWarning(B.report, { onlyWorkedOn: true, poolAboveReserve: true }) === null, 'sa kandydaci przy obywatelach: wskaznika brak (warunek ustapil)');
    ok(unspentBudgetWarning(A.report, { onlyWorkedOn: false, poolAboveReserve: true }) === null, 'wskaznik znika po wylaczeniu filtra (onlyWorkedOn=false)');
    ok(unspentBudgetWarning(A.report, { onlyWorkedOn: true, poolAboveReserve: false }) === null, 'pula <= rezerwa+prog: wskaznika brak');
    const C = run({ onlyWorked: true, deficit: ['kamien'] });
    ok(unspentBudgetWarning(C.report, { onlyWorkedOn: true, poolAboveReserve: true }) === null, `niedobor surowca (kamien): wskaznika brak (deficitActive=${C.report.deficitActive}, picks=${desc(C.picks)})`);
    ok(unspentBudgetWarning(null, { onlyWorkedOn: true, poolAboveReserve: true }) === null, 'brak raportu: null');
    ok(AUTO_ULEPSZENIA_PRACA_RESERVE === 30, 'rezerwa Pracy bez zmian (30)');
  }

  // ===== (4b) UI: realny render buildModeHud w Chromium ==============================================================
  console.log('(4b) UI: realny render `createBuildModeHud` w Chromium — wskaznik pojawia sie / znika, mobile bez poziomego przewijania, klik');
  let chromium;
  try { ({ chromium } = require(path.resolve(GRA_ROOT, 'node_modules', 'playwright'))); } catch (e) { chromium = null; }
  ok(!!chromium, 'playwright dostepny');
  if (chromium) {
    const STUB = path.resolve(__dirname, '.stubs', 'ev4-r4q2-brandassets-stub.ts');
    const STUB_OWL = path.resolve(__dirname, '.stubs', 'ev4-r4q2-scienceOwlIcon-stub.ts');
    const uiEntry = path.join(temp, 'ui-entry.ts');
    const uiOut = path.join(temp, 'ui-bundle.js');
    fs.writeFileSync(uiEntry, `import { createBuildModeHud } from ${JSON.stringify(SRC + '/ui/buildModeHud.ts')};\nwindow.__createBuildModeHud = createBuildModeHud;\n`);
    await esbuild.build({
      entryPoints: [uiEntry], bundle: true, platform: 'browser', format: 'iife', target: 'es2020', outfile: uiOut, absWorkingDir: GRA_ROOT,
      loader: { '.ts': 'ts' }, logLevel: 'silent', nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
      plugins: [{ name: 'stub', setup(b) {
        b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: STUB }));
        b.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: STUB_OWL }));
      } }],
    });
    const bundleJs = fs.readFileSync(uiOut, 'utf8');
    const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new'] });
    const errs = [];
    try {
      const page = await browser.newPage({ viewport: { width: 320, height: 900 } });
      page.on('pageerror', e => errs.push(String(e)));
      page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      await page.setContent('<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width"><style>*{margin:0;padding:0;box-sizing:border-box;}'
        + 'body{background:#0b0f16;color:#eee;}</style></head><body></body></html>');
      await page.addScriptTag({ content: bundleJs });
      await page.addScriptTag({ content: `
        window.__state = { warn: { waitingHexes: 7 } };
        window.__cfg = () => ({
          listTypes: () => [], getActiveKey: () => null, onSelectType: () => {}, onExit: () => {}, isOpen: () => true,
          listPlayerCities: () => [{ id: 'm1', name: 'Testowo' }], getUlepszeniaCityId: () => 'm1', onUlepszeniaCityIdChange: () => {},
          getUlepszeniaEmpireState: () => ({ focus: 'zrownowazone', tryb: 'auto', pracaAutoPercent: 100 }),
          onUlepszeniaEmpireFocusChange: () => {}, onUlepszeniaEmpireTrybChange: () => {}, onUlepszeniaEmpirePracaPercentChange: () => {},
          getUlepszeniaCityOverride: () => false, onUlepszeniaCityOverrideChange: () => {},
          getUlepszeniaEffectiveState: () => ({ focus: 'zrownowazone', tryb: 'auto', pracaAutoPercent: 100, override: false }),
          getUnspentBudgetWarning: () => window.__state.warn,
        });
        window.__hud = window.__createBuildModeHud(window.__cfg());
        document.body.appendChild(window.__hud.el);
        window.__hud.update();
      ` });
      const probe = () => page.evaluate(() => {
        const el = document.querySelector('[data-ulepszenia-unspent]');
        const slider = document.querySelector('[data-ulepszenia-empire-percent]');
        const btn = document.querySelector('[data-ulepszenia-unspent-disable-filter]');
        const r = el ? el.getBoundingClientRect() : null;
        const b = btn ? btn.getBoundingClientRect() : null;
        const sr = slider ? slider.getBoundingClientRect() : null;
        return {
          present: !!el, text: el ? el.querySelector('span').textContent.replace(/\s+/g, ' ').trim() : '', w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0,
          belowSlider: !!(r && sr && r.top >= sr.top), btnW: b ? Math.round(b.width) : 0, btnH: b ? Math.round(b.height) : 0,
          btnCx: b ? Math.round(b.left + b.width / 2) : 0, btnCy: b ? Math.round(b.top + b.height / 2) : 0,
          docScrollW: document.documentElement.scrollWidth, elScrollW: window.__hud.el.scrollWidth, elClientW: window.__hud.el.clientWidth,
          elementAtBtn: b ? (() => { const t = document.elementFromPoint(Math.round(b.left + b.width / 2), Math.round(b.top + b.height / 2)); return !!t && (t === btn || btn.contains(t)); })() : false,
        };
      });
      const on = await probe();
      console.log('  [info] ' + JSON.stringify(on));
      ok(on.present && on.w > 0 && on.h > 0, 'wskaznik jest w DOM i ma niezerowy prostokat');
      ok(on.text === 'Budżet niewydany: żywność powstaje tylko na polach z obywatelami (7 pól czeka na obywatela).',
        `tekst wskaznika zgodny z decyzja wlasciciela (jest: "${on.text}")`);
      ok(on.belowSlider, 'wskaznik jest przy suwaku „Z puli imperium na prace automatyczna” (pod nim)');
      ok(on.docScrollW <= 320 && on.elScrollW <= on.elClientW + 1, `mobile 320 px: brak poziomego przewijania (doc ${on.docScrollW}, panel ${on.elScrollW}/${on.elClientW})`);
      ok(on.btnW === 0, 'brak przycisku „Wyłącz filtr” (przelacznik usuniety)');
      const noToggles = await page.evaluate(() => ({ onlyBtn: !!document.querySelector('[data-ulepszenia-empire-only-worked],[data-ulepszenia-city-only-worked]'), wyrabBtn: !!document.querySelector('[data-ulepszenia-empire-wyrab],[data-ulepszenia-city-wyrab]'), txt: /Tylko pola z obywatelami|Wolno wycinać las/.test(document.body.textContent || '') }));
      ok(!noToggles.onlyBtn && !noToggles.wyrabBtn && !noToggles.txt, `UI trybu budowy: BRAK przyciskow „Tylko pola z obywatelami” i „Wolno wycinac las” (${JSON.stringify(noToggles)})`);
      await page.screenshot({ path: path.join(SHOT_DIR, 'q3-wskaznik-niewydany-320.png') });
      await page.setViewportSize({ width: 900, height: 900 });
      await page.screenshot({ path: path.join(SHOT_DIR, 'q3-wskaznik-niewydany-900.png') });
      await page.setViewportSize({ width: 320, height: 900 });
      // stala obecnosc, nie toast: ten sam stan renderowany wielokrotnie = jeden element
      await page.evaluate(() => { window.__state.warn = { waitingHexes: 3 }; window.__hud.update(); window.__hud.update(); window.__hud.update(); });
      const cnt = await page.evaluate(() => document.querySelectorAll('[data-ulepszenia-unspent]').length);
      ok(cnt === 1, `wielokrotny render = dokladnie jeden element wskaznika (${cnt})`);
      await page.evaluate(() => { window.__state.warn = null; window.__hud.update(); });
      ok(!(await probe()).present, 'warunek ustapil (null) -> wskaznik znika');
      ok(errs.length === 0, `0 bledow strony (${errs.length}: ${errs.slice(0, 2).join(' | ')})`);
    } finally {
      await browser.close();
    }
    console.log('  [info] zrzuty: ' + SHOT_DIR);
  }

  console.log(`\n${passed} OK, ${failed} FAIL`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
