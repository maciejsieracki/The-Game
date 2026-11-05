'use strict';
/**
 * R-WEB-AUTOIMPROVE-SIMPLE-FOOD-RULE-NO-TOGGLES-Q1 (decyzja wlasciciela 2026-11-04, ABC A + A) — jedna prosta zasada zamiast dwoch przyciskow.
 *
 *   (1) ZYWNOSC (farma, irygacja, tarasy, trzoda, lodzie rybackie, warzelnia soli, wycinka pod farme) buduje sie ZAWSZE tylko na polach
 *       z obywatelami — KAZDY profil gracza (Zywnosc, Zrownowazone, Surowce, Infrastruktura) i AI jednakowo; BEZ parametru/przelacznika.
 *   (2) WYJATEK (dopisek wlasciciela): OBOZ LOWIECKI nie wymaga obywatela (stoi tam, gdzie las, razem z tartakiem).
 *   (3) WYCINKA LASU: automat ZAWSZE moze wycinac las, ale WYLACZNIE pod farme (teren pod farme: Laka/Rownina) i tylko na polu obywatela;
 *       NIGDY pod inne ulepszenia (profile Surowce/Infrastruktura nie wycinaja; las na wzgorzach NIE jest wycinany pod zywnosc — R-WEB-AUTOIMPROVE-HILLS-CLEAR-REVERT-Q1, decyzja wlasciciela 2026-11-05).
 *   (4) Pozostale (surowcowe/infrastrukturalne: kopalnie, kamieniolom, tartak, droga, fort...) bez reguly obywateli.
 *   (5) USTERKA ZE ZRZUTU: obywatel stoi na lesie (rzeka i nie-rzeka), profil Zywnosc/Zrownowazone, 100% puli — las MUSI byc wycinany pod farme.
 *   (6) UI/ustawienia: brak przyciskow i pol; STARY zapis z `ulepszeniaOnlyWorked`/`ulepszeniaWolnoWycinacLas`/`onlyWorked`/`wolnoWycinacLas` czyta sie bez bledu.
 *
 * Run z gra/:  node tools/simple-food-rule-no-toggles-test.cjs
 * Mutacja:     SFR_SRC_DIR=<kopia gra/src z mutacja> node tools/simple-food-rule-no-toggles-test.cjs   (MUSI byc czerwony)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.SFR_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sfr-nt-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `
export { pickAutoImprovements, FOOD_IMPROVEMENT_KEYS } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export * as CITIES from ${JSON.stringify(SRC + '/game/cities')};
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements, FOOD_IMPROVEMENT_KEYS, CITIES } = require(bundle);

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}

const FULL = ['Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna', 'Irygacja', 'Łowiectwo', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo',
  'Górnictwo', 'Odlewnictwo', 'Obróbka metali', 'Budownictwo', 'Obróbka brązu'];
const W = 24, H = 24, CQ = 12, CR = 12;
const K = (q, r) => `${q},${r}`;
const FOOD = new Set(['farma', 'irygacja', 'tarasy', 'bydlo', 'owce', 'lama', 'lodzie_rybackie', 'warzelnia_soli', 'wyrab']);
function makeMap({ river = [], forest = [], hills = [], mountains = [] } = {}) {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  for (const [q, r] of river) hexes[K(q, r)].rzeka = { obecna: true, krawedzie: [] };
  for (const [q, r] of forest) hexes[K(q, r)].nakladka = 'las';
  for (const [q, r] of hills) hexes[K(q, r)].terenBazowy = 'wzgorza';
  for (const [q, r] of mountains) hexes[K(q, r)].terenBazowy = 'gory';
  return { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: river.length ? [river.map(([q, r]) => ({ q, r }))] : [] };
}
const CITY = focus => ({ id: 'c0', ownerId: 0, q: CQ, r: CR, name: 'Larsa', population: 4, ulepszeniaFocus: focus });
const TN = [{ q: CQ, r: CR, ownerId: 0, cityId: 'c0', pop: 4, level: 1 }];
const RIVER = [[12, 10], [12, 11], [13, 10]];
const FOREST_AROUND = [];
for (let q = 8; q <= 16; q++) for (let r = 8; r <= 16; r++) if (!(q === CQ && r === CR)) FOREST_AROUND.push([q, r]);
// Obywatele stoja NA LESIE: dwa pola na rzece i dwa poza rzeka (stan ze zrzutu wlasciciela).
const WORKED_FOREST = [[12, 11], [12, 10], [11, 13], [13, 12]];

/** Jedno wolanie pickera. UWAGA: zadnego parametru filtra obywateli — regula jest wbudowana. */
function pick({ map, worked, focus, placed = new Map(), clearing = new Set(), pool = 600, extra = {} }) {
  const workedSet = new Set(worked.map(([q, r]) => K(q, r)));
  return pickAutoImprovements({
    cities: [CITY(focus)], ownerId: 0, map, territoryNodes: TN, placedImprovements: placed, pracaAvailable: pool,
    unlockedTechs: new Set(FULL), pracaSurplusThreshold: 0, demandDriven: true, resourceDeficitKeys: [],
    getFocus: () => focus, getWorkedHexKeys: () => workedSet,
    pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: 'rzymianie', playerEra: 3,
    foodImprovementStages: c => focus === 'zywnosc' || focus === 'zrownowazone', clearingHexKeys: clearing, ...extra,
  });
}
/** Symulacja tura po turze: wycinka trwa 1 ture, potem las znika. */
function sim({ map, worked, focus, turns = 14 }) {
  const placed = new Map(), clearing = new Map(), log = [];
  for (let t = 0; t < turns; t++) {
    const picks = pick({ map, worked, focus, placed, clearing: new Set(clearing.keys()) });
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

(async () => {
  console.log('(0) zbior FOOD_IMPROVEMENT_KEYS: zywnosc BEZ obozu lowieckiego');
  ok(FOOD_IMPROVEMENT_KEYS.has('farma') && FOOD_IMPROVEMENT_KEYS.has('irygacja') && FOOD_IMPROVEMENT_KEYS.has('wyrab'), 'farma, irygacja i wycinka sa zywnosciowe');
  ok(!FOOD_IMPROVEMENT_KEYS.has('oboz_lowiecki'), 'oboz_lowiecki NIE jest zywnosciowy (wyjatek wlasciciela 2026-11-04)');

  console.log('(5) USTERKA ZE ZRZUTU: obywatele stoja na lesie (rzeka + nie-rzeka) — las MUSI byc wycinany pod farme (Zywnosc i Zrownowazone)');
  for (const focus of ['zywnosc', 'zrownowazone']) {
    const map = makeMap({ river: RIVER, forest: FOREST_AROUND });
    const { log, placed } = sim({ map, worked: WORKED_FOREST, focus });
    const cuts = log.filter(e => e.key === 'wyrab');
    const wset = new Set(WORKED_FOREST.map(([q, r]) => K(q, r)));
    ok(WORKED_FOREST.every(([q, r]) => cuts.some(e => e.hk === K(q, r))), `${focus}: KAZDY las pod obywatelem wycinany (${cuts.length} wycinek: ${dl(cuts)})`);
    ok(cuts.every(e => wset.has(e.hk)), `${focus}: wycinka WYLACZNIE na polach obywateli (poza: ${cuts.filter(e => !wset.has(e.hk)).length})`);
    ok(WORKED_FOREST.every(([q, r]) => (placed.get(K(q, r)) ?? []).includes('farma')), `${focus}: na kazdym wycietym polu obywatela powstaje farma`);
    ok(log.filter(e => FOOD.has(e.key) && e.key !== 'wyrab').every(e => wset.has(e.hk) || (e.q === CQ && e.r === CR)),
      `${focus}: zero ulepszen zywnosciowych poza polami obywateli`);
  }

  console.log('(3) wycinka NIGDY pod inne ulepszenia: profile Surowce i Infrastruktura nie wycinaja; las na wzgorzach i na gorach NIE jest wycinany (wycinka tylko tam, gdzie powstanie farma)');
  for (const focus of ['surowce', 'infrastruktura']) {
    const map = makeMap({ river: RIVER, forest: FOREST_AROUND });
    const { log } = sim({ map, worked: WORKED_FOREST, focus, turns: 10 });
    ok(!log.some(e => e.key === 'wyrab'), `${focus}: zero wycinek (jest ${log.filter(e => e.key === 'wyrab').length})`);
    ok(!log.some(e => e.key === 'farma'), `${focus}: zero farm`);
  }
  // R-WEB-AUTOIMPROVE-HILLS-CLEAR-REVERT-Q1 (decyzja wlasciciela ABC 2026-11-05, odp. B „Cofnij”): wyjatek Wzgorz z r2 cofniety. Las na WZGORZACH
  // pod obywatelem NIE jest wycinany pod zywnosc (tarasy/owce) — wycinka WYLACZNIE tam, gdzie powstanie farma (Laka/Rownina). Gory tez nie.
  // Mutacja: przywrocenie `|| hx.terenBazowy === TerenBazowy.Wzgorza` w `wyrabMaSens` (auto-improvements.ts) => ten blok MUSI byc czerwony.
  for (const focus of ['zywnosc', 'zrownowazone']) {
    const hillsForest = FOREST_AROUND.filter(([q, r]) => Math.abs(q - CQ) + Math.abs(r - CR) <= 4);
    const map = makeMap({ forest: FOREST_AROUND, hills: hillsForest });
    const { log } = sim({ map, worked: WORKED_FOREST, focus, turns: 10 });
    const hillSet = new Set(hillsForest.map(([q, r]) => K(q, r)));
    const hillCuts = log.filter(e => e.key === 'wyrab' && hillSet.has(e.hk));
    ok(hillCuts.length === 0, `${focus}: las na wzgorzach pod obywatelem NIE jest wycinany (jest ${hillCuts.length})`);
    const mapG = makeMap({ forest: FOREST_AROUND, mountains: FOREST_AROUND });
    const rG = sim({ map: mapG, worked: WORKED_FOREST, focus, turns: 10 });
    ok(!rG.log.some(e => e.key === 'wyrab'), `${focus}: las na gorach (zadne ulepszenie zywnosciowe) NIE jest wycinany (jest ${rG.log.filter(e => e.key === 'wyrab').length})`);
  }

  console.log('(1) zywnosc tylko przy obywatelach we WSZYSTKICH profilach; martwy parametr getOnlyWorked=false nic nie zmienia');
  for (const focus of ['zywnosc', 'zrownowazone', 'surowce', 'infrastruktura']) {
    const map = makeMap({ river: RIVER, forest: [] });
    const picks = pick({ map, worked: [[11, 12], [13, 12]], focus, extra: { getOnlyWorked: () => false, resourceDeficitKeys: focus === 'surowce' ? ['sol'] : [] } });
    const bad = picks.filter(p => FOOD.has(p.key) && !(['11,12', '13,12', K(CQ, CR)].includes(K(p.q, p.r))));
    ok(bad.length === 0, `${focus}: 0 ulepszen zywnosciowych poza obywatelami (jest ${bad.length}: ${bad.map(p => p.key + '@' + p.q + ',' + p.r).join(' ') || 'nic'})`);
  }
  {
    // Surowce + sol na heksie BEZ obywatela: warzelnia soli jest zywnosciowa => nie powstaje; z obywatelem powstaje.
    const mk = () => { const m = makeMap({}); m.hexes[K(10, 12)].zloze = 'sol'; return m; };
    const out = pick({ map: mk(), worked: [[11, 12]], focus: 'surowce' }).filter(p => p.key === 'warzelnia_soli');
    ok(out.length === 0, `surowce: warzelnia soli na heksie bez obywatela NIE powstaje (jest ${out.length})`);
    const inn = pick({ map: mk(), worked: [[10, 12]], focus: 'surowce' }).filter(p => p.key === 'warzelnia_soli');
    ok(inn.length === 1, `surowce: warzelnia soli na polu obywatela powstaje (jest ${inn.length}) — kontrola zdolnosci sondy`);
  }

  console.log('(2) WYJATEK: oboz lowiecki bez obywatela (tam, gdzie las z tartakiem)');
  for (const focus of ['zrownowazone']) {
    const map = makeMap({ forest: [[9, 12]] });
    const placed = new Map([[K(9, 12), ['tartak']]]);
    const picks = pick({ map, worked: [[11, 12]], focus, placed, extra: { demandDriven: false, foodImprovementStages: () => false } });
    ok(picks.some(p => p.key === 'oboz_lowiecki' && p.q === 9 && p.r === 12), `${focus}: oboz lowiecki stoi na lesie z tartakiem BEZ obywatela (${picks.map(p => p.key + '@' + p.q + ',' + p.r).join(' ') || 'nic'})`);
  }

  console.log('(4) ulepszenia surowcowe/infrastrukturalne bez reguly obywateli (Surowce: tartak na lesie BEZ obywatela)');
  {
    const map = makeMap({ forest: [[9, 12]] });
    const picks = pick({ map, worked: [[11, 12]], focus: 'surowce', pool: 2000, extra: { demandDriven: false, foodImprovementStages: () => false } });
    ok(picks.some(p => p.key === 'tartak' && p.q === 9 && p.r === 12), `surowce: tartak stoi na lesie poza polami obywateli (${picks.slice(0, 6).map(p => p.key + '@' + p.q + ',' + p.r).join(' ') || 'nic'})`);
    ok(!picks.some(p => p.key === 'wyrab'), 'surowce: tartak NIE wycina lasu (stoi na lesie)');
  }

  console.log('(6) ustawienia: brak pol przelacznikow; STARY zapis czytany bez bledu i ignorowany');
  {
    const pol = CITIES.freshUlepszeniaEmpirePolicy();
    ok(!('onlyWorked' in pol) && !('wolnoWycinacLas' in pol), `swieza polityka bez pol onlyWorked/wolnoWycinacLas (${Object.keys(pol).join(',')})`);
    ok(CITIES.DEFAULT_ULEPSZENIA_ONLY_WORKED === undefined && CITIES.DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS === undefined, 'stale DEFAULT_ULEPSZENIA_ONLY_WORKED / _WOLNO_WYCINAC_LAS usuniete');
    const legacyEmpire = { focus: 'zywnosc', tryb: 'auto', pracaAutoPercent: 60, onlyWorked: false, wolnoWycinacLas: false };
    const legacyCity = { id: 'x', ownerId: 0, q: 1, r: 1, population: 2, ulepszeniaOverride: true, ulepszeniaFocus: 'surowce', ulepszeniaTryb: 'auto',
      ulepszeniaPracaPercent: 40, ulepszeniaOnlyWorked: false, ulepszeniaWolnoWycinacLas: false };
    let eff, err = null;
    try { eff = CITIES.resolveEffectiveUlepszenia(legacyCity, legacyEmpire); } catch (e) { err = e; }
    ok(!err && eff && eff.focus === 'surowce' && eff.pracaAutoPercent === 40 && !('onlyWorked' in eff) && !('wolnoWycinacLas' in eff),
      `stary wpis miasta (override) czytany bez bledu; pola przelacznikow ignorowane (${err ? err.message : JSON.stringify(eff)})`);
    let eff2, err2 = null;
    try { eff2 = CITIES.resolveEffectiveUlepszenia({ ...legacyCity, ulepszeniaOverride: false }, legacyEmpire); } catch (e) { err2 = e; }
    ok(!err2 && eff2 && eff2.focus === 'zywnosc' && eff2.pracaAutoPercent === 60, `stara polityka imperium czytana bez bledu (${err2 ? err2.message : JSON.stringify(eff2)})`);
    if (typeof CITIES.ensureCitySaveDefaults === 'function') {
      let err3 = null;
      try { CITIES.ensureCitySaveDefaults({ ...legacyCity }); } catch (e) { err3 = e; }
      ok(!err3, `ensureCitySaveDefaults na starym miescie bez bledu (${err3 ? err3.message : 'ok'})`);
    }
  }
  {
    const hud = fs.readFileSync(path.join(SRC, 'ui', 'buildModeHud.ts'), 'utf8');
    ok(!/Tylko pola z obywatelami<|Wolno wycinać las<|data-ulepszenia-(empire|city)-(only-worked|wyrab)/.test(hud), 'buildModeHud.ts: brak przyciskow „Tylko pola z obywatelami” / „Wolno wycinać las”');
    ok(!/onUlepszenia(Empire|City)(OnlyWorked|Wyrab)Change|onUnspentBudgetDisableFilter/.test(hud), 'buildModeHud.ts: brak handlerow przyciskow');
    const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
    ok(!/wolnoWycinacLas|ulepszeniaWolnoWycinacLas|ulepszeniaOnlyWorked|getSkipWyrab/.test(main), 'main.ts: brak odwolan do usunietych pol/przelacznikow');
    ok(!/skipWyrab: true/.test(main), 'main.ts: automat gracza nie przekazuje skipWyrab: true (wycinka zawsze dozwolona)');
  }

  console.log(`\n${passed} OK, ${failed} FAIL`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
