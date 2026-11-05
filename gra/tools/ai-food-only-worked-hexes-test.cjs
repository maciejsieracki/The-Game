'use strict';
/**
 * R-WEB-AUTOIMPROVE-SIMPLE-FOOD-RULE-NO-TOGGLES-Q1 (decyzja wlasciciela 2026-11-04, ABC A + A) ZAKTUALIZOWAL ten kontrakt: przelacznika
 * „Tylko pola z obywatelami” juz NIE MA — regula jest ZAWSZE wlaczona (gracz kazdy profil + AI); JEDYNY wyjatek to OBOZ LOWIECKI
 * (stoi tam, gdzie las, nie wymaga obywatela). Dawne kontrole „filtr OFF” zastapione kontrolami „obywatele wszedzie” i wyjatkiem obozu.
 * Oryginal R-WEB-AI-FOOD-ONLY-WORKED-HEXES-Q1 (decyzja wlasciciela 2026-11-03/04): przy wlaczonym „Tylko pola z obywatelami”
 * ulepszenia ZWIAZANE Z ZYWNOSCIA (farma, irygacja, tarasy, bydlo/owce/lama, oboz lowiecki, lodzie rybackie,
 * warzelnia soli, wycinka pod farme) NIE powstaja na heksie bez obywatela — ZADNYCH wyjatkow (rzeka/wyrab Q2/Q3,
 * zloza, przebieg „brakujacy surowiec”). Dotyczy automatu gracza (profile „zywnosc” i „zrownowazone”) ORAZ AI
 * (`decideAITurn` -> `planCityImprovements`). Prawdziwe funkcje, zadnych atrap pickera.
 *
 * Run z gra/:   node tools/ai-food-only-worked-hexes-test.cjs
 * Mutacja:      AFW_SRC_DIR=<kopia gra/src z mutacja> node tools/ai-food-only-worked-hexes-test.cjs   (MUSI byc czerwony)
 * Pomiar:       AFW_MEASURE=1 [AFW_SEEDS=1,2,3] [AFW_TURNS=60] [AFW_WORLDS=kontynenty,pangea] node tools/ai-food-only-worked-hexes-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AFW_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const MEASURE = process.env.AFW_MEASURE === '1';
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'afw-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `
export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export { workedHexCoordsForCity } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements, decideAITurn, workedHexCoordsForCity, generateMap } = require(bundle);

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}

/** Ulepszenia zwiazane z zywnoscia (decyzja wlasciciela T1) — niezalezna lista testu. */
// NO-TOGGLES-Q1: obozu lowieckiego NIE MA w zbiorze (wyjatek wlasciciela 2026-11-04) — stoi tam, gdzie las, bez obywatela.
const FOOD = new Set(['farma', 'irygacja', 'tarasy', 'bydlo', 'owce', 'lama', 'lodzie_rybackie', 'warzelnia_soli', 'wyrab']);
const LIVESTOCK = new Set(['bydlo', 'owce', 'lama']);
const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo', 'Brązownictwo',
  'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta', 'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Irygacja',
  'Drogi brukowane', 'Matematyka', 'Pieniądz', 'Hodowla', 'Nawadnianie',
]);
const K = (q, r) => `${q},${r}`;

// ---------------------------------------------------------------------------
// Scenariusz zblizony do zrzutu: miasto z kilkoma obywatelami, dziesiatki heksow ziemi, rzeka, las na rzece, zloza.
// ---------------------------------------------------------------------------
const W = 30, H = 30, CQ = 15, CR = 15, PID = 3;
const RIVER = [[15, 11], [15, 12], [15, 13], [15, 14], [16, 14], [16, 16], [16, 17], [15, 18]];
function makeScenarioMap() {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: (q + r) % 5 === 0 ? 'laka' : 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  for (const [q, r] of RIVER) hexes[K(q, r)].rzeka = { obecna: true, krawedzie: [] };
  for (const [q, r] of [[15, 12], [15, 13], [16, 16]]) hexes[K(q, r)].nakladka = 'las';        // las NA rzece
  hexes[K(12, 14)].nakladka = 'zloze_bydla';                                                    // zloze bydla
  hexes[K(18, 16)].nakladka = 'zloze_owiec';                                                    // zloze owiec
  hexes[K(13, 17)].zloze = 'sol';                                                               // sol
  return { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: [RIVER.map(([q, r]) => ({ q, r }))] };
}
const popAt = t => Math.min(7, 3 + Math.floor(t / 8));
const mkCity = t => ({ id: 'city0', ownerId: PID, q: CQ, r: CR, name: 'Ateny', population: popAt(t) });
const mkTN = t => [{ q: CQ, r: CR, ownerId: PID, cityId: 'city0', pop: popAt(t), level: 1 }];
const ERA = 3;

/** Heksy z obywatelami w danej turze — ta sama funkcja, ktora zasila filtr (main.ts getWorkedHexKeys / ai.ts). */
function workedNow(city, map, tn) {
  return new Set(workedHexCoordsForCity(city, map, tn, undefined, ERA).map(({ q, r }) => K(q, r)));
}

/**
 * Symulacja `turns` tur. mode: 'ai' | 'player-zywnosc' | 'player-zrownowazone'. Zwraca log wszystkich picków z flaga `off`
 * (ulepszenie ZYWNOSCIOWE na heksie bez obywatela w momencie decyzji; centrum miasta liczy sie jako pracowane).
 */
function sim({ mode, turns = 40, deficits = [], resourcePassFree = false }) {
  const map = makeScenarioMap();
  const placed = new Map();
  const log = [];
  for (let t = 0; t < turns; t++) {
    const city = mkCity(t), tn = mkTN(t);
    const worked = workedNow(city, map, tn);
    worked.add(K(CQ, CR));
    let picks;
    if (mode === 'ai') {
      const data = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
      const cmds = decideAITurn(PID, [], [city], map, data, {
        civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {}, territoryNodes: tn,
        placedImprovements: new Map(placed), improvementTechs: TECHS, pracaAvailable: 600, civEra: ERA,
        resourceDeficitKeys: deficits,
      });
      picks = cmds.filter(c => c.type === 'buildImprovement').map(c => ({ q: c.q, r: c.r, key: c.key }));
    } else {
      const focus = mode === 'player-zywnosc' ? 'zywnosc' : 'zrownowazone';
      picks = pickAutoImprovements({
        cities: [city], ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(placed),
        pracaAvailable: 600, unlockedTechs: TECHS, pracaSurplusThreshold: 0, skipWyrab: false, demandDriven: true,
        resourceDeficitKeys: deficits, getFocus: () => focus,
        getWorkedHexKeys: () => new Set(workedHexCoordsForCity(city, map, tn, undefined, ERA).map(({ q, r }) => K(q, r))),
        pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: 'grecy', playerEra: ERA,
        foodImprovementStages: () => true, clearingHexKeys: new Set(),
      });
    }
    for (const p of picks) {
      const hk = K(p.q, p.r);
      const hx = map.hexes[hk];
      const off = FOOD.has(p.key) && !worked.has(hk);
      let cause = null;
      if (off) {
        if (p.key === 'wyrab') cause = 'wyrab-rzeka-poza-obywatelem';
        else if (p.key === 'farma' && log.some(e => e.key === 'wyrab' && e.hk === hk)) cause = 'farma-po-wycince-rzeki';
        else if (p.key === 'warzelnia_soli') cause = 'przebieg-brakujacy-surowiec/zloze-soli';
        else if (hx && (hx.zloze || String(hx.nakladka).startsWith('zloze'))) cause = 'zloze-na-heksie';
        else cause = 'inne';
      }
      log.push({ t, key: p.key, hk, off, cause });
      if (p.key === 'wyrab') { if (hx) hx.nakladka = 'brak'; continue; }
      placed.set(hk, [...(placed.get(hk) ?? []), p.key]);
    }
  }
  return { log, placed, map };
}
const offOf = log => log.filter(e => e.off);
const dl = log => log.slice(0, 6).map(e => `${e.t}:${e.key}@${e.hk}`).join(' ') || 'nic';

if (!MEASURE) {
  const MODES = ['ai', 'player-zywnosc', 'player-zrownowazone'];

  console.log('(A) 0 ulepszen zywnosciowych poza polami obywateli — scenariusz zrzutu, 40 tur, bez niedoboru');
  for (const mode of MODES) {
    const { log } = sim({ mode });
    const bad = offOf(log);
    ok(log.length > 0, `${mode}: automat cos buduje (${log.length} ulepszen)`);
    ok(bad.length === 0, `${mode}: 0 ulepszen zywnosciowych bez obywatela (jest ${bad.length}: ${dl(bad)})`);
  }

  console.log('(B) niedobor soli (przebieg „brakujacy surowiec”) NIE otwiera filtra dla zywnosci (warzelnia soli)');
  for (const mode of MODES) {
    for (const free of (mode === 'ai' ? [true] : [false, true])) {
      const { log } = sim({ mode, deficits: ['sol'], resourcePassFree: free });
      const bad = offOf(log);
      ok(bad.length === 0, `${mode}${free ? ' (resource-pass bez filtra)' : ''}: 0 zywnosciowych bez obywatela przy niedoborze soli (jest ${bad.length}: ${dl(bad)})`);
    }
  }

  console.log('(C) wyjatek rzeczny (wycinka lasu na rzece / farma po wycince) nie obowiazuje przy wlaczonym filtrze');
  for (const mode of MODES) {
    // obywatele NIE na rzece: wymus pop=1 (jedno pole poza rzeka) i las na wszystkich heksach rzeki
    const { log } = sim({ mode, turns: 30 });
    const river = log.filter(e => e.off && (e.cause === 'wyrab-rzeka-poza-obywatelem' || e.cause === 'farma-po-wycince-rzeki'));
    ok(river.length === 0, `${mode}: brak wycinki/farmy rzecznej poza obywatelem (jest ${river.length}: ${dl(river)})`);
  }

  console.log('(D) kompletnosc: po farmie automat buduje DALEJ na polach obywateli (irygacja, trzoda), nie wychodzi poza nie');
  for (const mode of MODES) {
    const { log, placed } = sim({ mode, turns: 60 });
    const keys = new Set(log.map(e => e.key));
    const irr = log.filter(e => e.key === 'irygacja').length;
    const stock = log.filter(e => LIVESTOCK.has(e.key)).length;
    ok(keys.has('farma'), `${mode}: farma postawiona`);
    ok(irr >= 1, `${mode}: irygacja zbudowana na polach obywateli (${irr})`);
    ok(stock >= 1, `${mode}: trzoda zbudowana na polach obywateli (${stock})`);
    ok(offOf(log).length === 0, `${mode}: i nadal 0 poza obywatelami po 60 turach`);
    void placed;
  }

  console.log('(E) BRAK przelacznika: dawny parametr getOnlyWorked=false (przycisk wylaczony) NIE wylacza reguly — zywnosc nadal tylko przy obywatelach');
  {
    const map = makeScenarioMap();
    const city = mkCity(0), tn = mkTN(0);
    const picks = pickAutoImprovements({
      cities: [city], ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(), pracaAvailable: 600,
      unlockedTechs: TECHS, pracaSurplusThreshold: 0, skipWyrab: false, demandDriven: true, resourceDeficitKeys: [],
      getFocus: () => 'zywnosc', getOnlyWorked: () => false /* martwy parametr: ignorowany */, getWorkedHexKeys: () => workedNow(city, map, tn),
      pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: 'grecy', playerEra: ERA,
      foodImprovementStages: () => true, clearingHexKeys: new Set(),
    });
    const worked = workedNow(city, map, tn);
    const outside = picks.filter(p => FOOD.has(p.key) && !worked.has(K(p.q, p.r)) && !(p.q === CQ && p.r === CR));
    ok(picks.length > 0 && outside.length === 0, `getOnlyWorked=false ignorowany: ${picks.length} pickow, 0 zywnosciowych poza obywatelami (jest ${outside.length})`);
  }

  console.log('(F) KAZDY klucz z listy zywnosciowej osobno: sonda na heksie BEZ obywatela (kontrola: obywatele WSZEDZIE -> klucz budowany; bez obywatela — nigdy; wyjatek: oboz lowiecki)');
  {
    const SEA = ['morze'];
    const PROBES = [
      { key: 'farma', civ: 'grecy', setup: () => {} },
      { key: 'irygacja', civ: 'grecy', setup: () => {}, pre: 'farma' },
      { key: 'tarasy', civ: 'chinczycy', setup: h => { h.terenBazowy = 'wzgorza'; } },
      { key: 'bydlo', civ: 'grecy', setup: h => { h.nakladka = 'zloze_bydla'; } },
      { key: 'owce', civ: 'grecy', setup: h => { h.terenBazowy = 'wzgorza'; } },
      { key: 'lama', civ: 'inkowie', setup: h => { h.terenBazowy = 'wzgorza'; } },
      { key: 'oboz_lowiecki', civ: 'grecy', focus: 'zrownowazone', demand: true, setup: h => { h.nakladka = 'las'; }, pre: 'tartak' },
      { key: 'lodzie_rybackie', civ: 'grecy', setup: h => { h.terenBazowy = SEA[0]; } },
      { key: 'wyrab', civ: 'grecy', setup: h => { h.nakladka = 'las'; } },
      { key: 'warzelnia_soli', civ: 'grecy', setup: h => { h.zloze = 'sol'; } },
    ];
    for (const P of PROBES) {
      const run = (citizensEverywhere) => {
        const map = makeScenarioMap();
        const city = { id: 'city0', ownerId: PID, q: CQ, r: CR, name: 'Ateny', population: 1 };
        const tn = [{ q: CQ, r: CR, ownerId: PID, cityId: 'city0', pop: 1, level: 1 }];
        const worked = new Set(workedHexCoordsForCity(city, map, tn, undefined, ERA).map(({ q, r }) => K(q, r)));
        worked.add(K(CQ, CR));
        // cala ziemia dookola = teren sondy (wszystkie heksy promienia poza polami obywateli sa kandydatami)
        const placed = new Map();
        const probeHexes = new Set();
        for (let q = CQ - 3; q <= CQ + 3; q++) for (let r = CR - 3; r <= CR + 3; r++) {
          const hk = K(q, r), h = map.hexes[hk];
          if (!h || (q === CQ && r === CR) || worked.has(hk)) continue;
          if (Math.abs(q - CQ) + Math.abs(r - CR) > 4 && Math.abs((q - CQ) + (r - CR)) > 3) continue;
          h.rzeka = { obecna: false, krawedzie: [] }; h.nakladka = 'brak'; h.zloze = undefined;
          P.setup(h);
          probeHexes.add(hk);
          if (P.pre === 'tartak') placed.set(hk, ['tartak']);
          if (P.pre === 'farma') placed.set(hk, ['farma']);
        }
        // kontrola: obywatele stoja na KAZDYM heksie sondy (picker musi umiec zbudowac klucz); inaczej tylko naturalne pola obywateli
        const pickWorked = citizensEverywhere ? new Set([...worked, ...probeHexes]) : worked;
        const picks = [];
        for (let round = 0; round < 25; round++) {
          const got = pickAutoImprovements({
            cities: [city], ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(placed), pracaAvailable: 900,
            unlockedTechs: TECHS, pracaSurplusThreshold: 0, skipWyrab: false, demandDriven: !!P.demand, resourceDeficitKeys: [],
            getFocus: () => P.focus ?? 'zywnosc', getWorkedHexKeys: () => pickWorked,
            pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: P.civ, playerEra: ERA,
            foodImprovementStages: () => true, clearingHexKeys: new Set(),
          });
          if (!got.length) break;
          for (const g of got) {
            picks.push(g);
            const hk = K(g.q, g.r);
            if (g.key === 'wyrab') map.hexes[hk].nakladka = 'brak';
            else placed.set(hk, [...(placed.get(hk) ?? []), g.key]);
          }
        }
        return { picks, worked };
      };
      const off = run(true), on = run(false);
      const ctrl = off.picks.filter(p => p.key === P.key && !off.worked.has(K(p.q, p.r)));
      const bad = on.picks.filter(p => p.key === P.key && !on.worked.has(K(p.q, p.r)));
      // AI (decideAITurn -> planCityImprovements) na tej samej sondzie: te same heksy bez obywatela, civType wg sondy
      {
        const map = makeScenarioMap();
        const city = { id: 'city0', ownerId: PID, q: CQ, r: CR, name: 'Ateny', population: 1 };
        const tn = [{ q: CQ, r: CR, ownerId: PID, cityId: 'city0', pop: 1, level: 1 }];
        const worked = new Set(workedHexCoordsForCity(city, map, tn, undefined, ERA).map(({ q, r }) => K(q, r)));
        worked.add(K(CQ, CR));
        const placed = new Map();
        for (let q = CQ - 3; q <= CQ + 3; q++) for (let r = CR - 3; r <= CR + 3; r++) {
          const hk = K(q, r), h = map.hexes[hk];
          if (!h || (q === CQ && r === CR) || worked.has(hk)) continue;
          if (Math.abs(q - CQ) + Math.abs(r - CR) > 4 && Math.abs((q - CQ) + (r - CR)) > 3) continue;
          h.rzeka = { obecna: false, krawedzie: [] }; h.nakladka = 'brak'; h.zloze = undefined;
          P.setup(h);
          if (P.pre === 'tartak') placed.set(hk, ['tartak']);
          if (P.pre === 'farma') placed.set(hk, ['farma']);
        }
        const aiBad = [];
        let aiSame = 0, aiCampOutside = 0;
        for (let t = 0; t < 30; t++) {
          const data = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
          const cmds = decideAITurn(PID, [], [city], map, data, {
            civType: P.civ, poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {}, territoryNodes: tn,
            placedImprovements: new Map(placed), improvementTechs: TECHS, pracaAvailable: 900, civEra: ERA, resourceDeficitKeys: [],
          });
          for (const c of cmds) {
            if (c.type !== 'buildImprovement') continue;
            const hk = K(c.q, c.r);
            if (c.key === 'wyrab') map.hexes[hk].nakladka = 'brak'; else placed.set(hk, [...(placed.get(hk) ?? []), c.key]);
            if (c.key === P.key) aiSame++;
            if (FOOD.has(c.key) && !worked.has(hk)) aiBad.push(`${c.key}@${hk}`);
            if (c.key === 'oboz_lowiecki' && !worked.has(hk)) aiCampOutside++;
          }
        }
        ok(aiBad.length === 0, `${P.key}: AI (decideAITurn, civ=${P.civ}) 0 zywnosciowych poza obywatelami w sondzie (jest ${aiBad.length}: ${aiBad.slice(0, 3).join(' ') || 'nic'}; ${P.key} postawiony ${aiSame}x)`);
        if (P.key === 'oboz_lowiecki') ok(aiCampOutside > 0, `oboz_lowiecki: AI stawia obóz TAKZE poza polami obywateli — wyjatek wlasciciela 2026-11-04 (${aiCampOutside}x)`);
      }
      const ctrlOn = off.picks.filter(p => p.key === P.key);
      ok(ctrlOn.length > 0, `${P.key}: kontrola — gdy obywatele stoja na heksach sondy, automat buduje klucz (${ctrlOn.length}) [sonda realna]`);
      if (P.key === 'oboz_lowiecki') {
        ok(bad.length > 0, `oboz_lowiecki: WYJATEK — gracz stawia obóz takze poza polami obywateli (${bad.length}) [dopisek wlasciciela 2026-11-04]`);
      } else {
        ok(bad.length === 0, `${P.key}: bez obywatela 0 poza polami obywateli (jest ${bad.length}: ${bad.slice(0, 3).map(p => `${p.key}@${p.q},${p.r}`).join(' ') || 'nic'})`);
      }
    }
  }

  console.log('(G) farma ZOSTAJE po przesunieciu obywatela: istniejaca farma na heksie, ktory przestal byc pracowany, nie dostaje NOWYCH ulepszen zywnosciowych i nie jest usuwana');
  for (const mode of ['player-zywnosc', 'player-zrownowazone']) {
    const map = makeScenarioMap();
    const city = { id: 'city0', ownerId: PID, q: CQ, r: CR, name: 'Ateny', population: 1 };
    const tn = [{ q: CQ, r: CR, ownerId: PID, cityId: 'city0', pop: 1, level: 1 }];
    const worked = new Set(workedHexCoordsForCity(city, map, tn, undefined, ERA).map(({ q, r }) => K(q, r)));
    worked.add(K(CQ, CR));
    const stale = [[15, 13], [15, 14], [16, 14]].map(([q, r]) => K(q, r)).filter(hk => !worked.has(hk));
    const placed = new Map(stale.map(hk => [hk, ['farma']]));
    const picks = pickAutoImprovements({
      cities: [city], ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(placed), pracaAvailable: 900,
      unlockedTechs: TECHS, pracaSurplusThreshold: 0, skipWyrab: false, demandDriven: true, resourceDeficitKeys: [],
      getFocus: () => (mode === 'player-zywnosc' ? 'zywnosc' : 'zrownowazone'),
      getWorkedHexKeys: () => worked, pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: 'grecy',
      playerEra: ERA, foodImprovementStages: () => true, clearingHexKeys: new Set(),
    });
    const onStale = picks.filter(p => stale.includes(K(p.q, p.r)));
    ok(stale.length > 0, `${mode}: sa heksy z farma poza polami obywateli (${stale.length})`);
    ok(onStale.length === 0, `${mode}: zero nowych ulepszen na heksach z "osieroconymi" farmami (jest ${onStale.length}); picker nie ma komendy burzenia`);
  }

  console.log('(H) HILLS-CLEAR-REVERT-Q1 (wlasciciel 2026-11-05, odp. B): las na WZGORZACH i GORACH pod obywatelem NIE jest wycinany pod zywnosc — AI (decideAITurn) i gracz; wycinka tylko pod farme (Laka/Rownina)');
  for (const terr of ['wzgorza', 'gory']) {
    for (const mode of ['ai', 'player-zywnosc']) {
      const map = makeScenarioMap();
      for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
        const hx = map.hexes[K(q, r)];
        if (!(q === CQ && r === CR)) { hx.terenBazowy = terr; hx.nakladka = 'las'; hx.rzeka = { obecna: false, krawedzie: [] }; } // caly lad = las (obywatele MUSZA stac na lesie)
      }
      const placed = new Map();
      const cuts = [], offW = [];
      const dbg = {}; if (process.env.DBGH) globalThis.__civAutoImproveDebug = e => { if (e.scope === 'las') dbg[e.reason + '|' + e.verdict] = (dbg[e.reason + '|' + e.verdict] || 0) + 1; };
      for (let t = 0; t < 12; t++) {
        const city = { id: 'city0', ownerId: PID, q: CQ, r: CR, name: 'Ateny', population: 6 };
        const tn = [{ q: CQ, r: CR, ownerId: PID, cityId: 'city0', pop: 6, level: 1 }];
        const worked = new Set(workedHexCoordsForCity(city, map, tn, undefined, ERA).map(({ q, r }) => K(q, r)));
        let picks;
        if (mode === 'ai') {
          const data = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
          picks = decideAITurn(PID, [], [city], map, data, {
            civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {}, territoryNodes: tn,
            placedImprovements: new Map(placed), improvementTechs: TECHS, pracaAvailable: 900, civEra: ERA, resourceDeficitKeys: [],
          }).filter(c => c.type === 'buildImprovement').map(c => ({ q: c.q, r: c.r, key: c.key }));
        } else {
          picks = pickAutoImprovements({
            cities: [city], ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(placed), pracaAvailable: 900,
            unlockedTechs: TECHS, pracaSurplusThreshold: 0, demandDriven: true, resourceDeficitKeys: [], getFocus: () => 'zywnosc',
            getWorkedHexKeys: () => worked, pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: 'grecy',
            playerEra: ERA, foodImprovementStages: () => true, clearingHexKeys: new Set(),
          });
        }
        for (const p of picks) {
          const hk = K(p.q, p.r);
          if (p.key === 'wyrab') { cuts.push(hk); if (!worked.has(hk)) offW.push(hk); map.hexes[hk].nakladka = 'brak'; continue; }
          placed.set(hk, [...(placed.get(hk) ?? []), p.key]);
        }
      }
      if (process.env.DBGH) console.log(mode, terr, JSON.stringify(dbg));
      // Wyjatek Wzgorz z r2 cofniety: zero wycinek zarowno na Wzgorzach, jak i na Gorach (mutacja: `|| terenBazowy === Wzgorza` w wyrabMaSens => FAIL).
      ok(cuts.length === 0, `${mode}: las na ${terr === 'wzgorza' ? 'Wzgorzach' : 'Gorach'} NIE jest wycinany pod zywnosc (${cuts.length})`);
    }
  }

  console.log(`\n${passed} OK, ${failed} FAIL`);
  process.exit(failed ? 1 : 0);
}

// ---------------------------------------------------------------------------
// POMIAR (AFW_MEASURE=1): pelne mapy wygenerowane, kilka ziaren x typow swiata, wiele miast AI, decideAITurn.
// ---------------------------------------------------------------------------
const seeds = (process.env.AFW_SEEDS || '1,2,3,4,5,6').split(',').map(Number);
const worlds = (process.env.AFW_WORLDS || 'kontynenty,pangea').split(',');
const TURNS = Number(process.env.AFW_TURNS || 60);

function landSpots(map, n) {
  const scored = [];
  for (const k of Object.keys(map.hexes).sort()) {
    const h = map.hexes[k];
    if (!h || ['morze', 'plytkie_morze', 'wybrzeze', 'Morze', 'PlytkieMorze', 'Wybrzeze'].includes(h.terenBazowy)) continue;
    const [q, r] = k.split(',').map(Number);
    let land = 0;
    for (let dq = -3; dq <= 3; dq++) for (let dr = -3; dr <= 3; dr++) {
      if (Math.abs(dq + dr) > 3) continue;
      const nb = map.hexes[K(q + dq, r + dr)];
      if (nb && !['morze', 'plytkie_morze', 'Morze', 'PlytkieMorze'].includes(nb.terenBazowy)) land++;
    }
    scored.push({ q, r, land });
  }
  scored.sort((a, b) => (b.land - a.land) || (a.q - b.q) || (a.r - b.r));
  const out = [];
  for (const s of scored) {
    if (out.every(o => Math.abs(o.q - s.q) + Math.abs(o.r - s.r) > 7)) out.push(s);
    if (out.length >= n) break;
  }
  return out;
}

const ACTOR = process.env.AFW_ACTOR || 'ai'; // ai | zywnosc | zrownowazone (automat gracza)
const IMPR = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data', 'terrain-improvements.json'), 'utf8'));
const foodBonus = key => Number((IMPR[key] && IMPR[key].bonus && IMPR[key].bonus.zywnosc) || 0);
const agg = { food: 0, off: 0, causes: {}, byKey: {}, ms: 0, calls: 0, irr: 0, stock: 0, effFood: 0, allFood: 0, offOtherCity: 0 };
for (const world of worlds) for (const seed of seeds) {
  const map = generateMap(36, 28, seed, world);
  const spots = landSpots(map, 3);
  const placed = new Map();
  for (let t = 0; t < TURNS; t++) {
    const pop = Math.min(8, 2 + Math.floor(t / 7));
    const cities = spots.map((s, i) => ({ id: `c${i}`, ownerId: PID, q: s.q, r: s.r, name: `C${i}`, population: pop }));
    const tn = cities.map(c => ({ q: c.q, r: c.r, ownerId: PID, cityId: c.id, pop, level: 1 }));
    const workedByCity = new Map(cities.map(c => [c.id, new Set([K(c.q, c.r), ...workedHexCoordsForCity(c, map, tn, undefined, ERA).map(h => K(h.q, h.r))])]));
    const allWorked = new Set([...workedByCity.values()].flatMap(s => [...s]));
    let cmds;
    const t0 = process.hrtime.bigint();
    if (ACTOR === 'ai') {
      const data = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
      cmds = decideAITurn(PID, [], cities, map, data, {
        civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {}, territoryNodes: tn,
        placedImprovements: new Map(placed), improvementTechs: TECHS, pracaAvailable: 400, civEra: ERA, resourceDeficitKeys: [],
      }).filter(c => c.type === 'buildImprovement');
    } else {
      cmds = pickAutoImprovements({
        cities, ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(placed), pracaAvailable: 400,
        unlockedTechs: TECHS, pracaSurplusThreshold: 0, skipWyrab: false, demandDriven: true, resourceDeficitKeys: [],
        getFocus: () => ACTOR,
        getWorkedHexKeys: c => workedByCity.get(c.id) ?? new Set(),
        pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: 'grecy', playerEra: ERA,
        foodImprovementStages: () => true, clearingHexKeys: new Set(),
      }).map(p => ({ q: p.q, r: p.r, key: p.key, cityId: p.cityId }));
    }
    agg.ms += Number(process.hrtime.bigint() - t0) / 1e6; agg.calls++;
    for (const c of cmds) {
      const hk = K(c.q, c.r);
      if (c.key === 'wyrab') { map.hexes[hk].nakladka = 'brak'; }
      else placed.set(hk, [...(placed.get(hk) ?? []), c.key]);
      if (!FOOD.has(c.key)) continue;
      agg.food++;
      agg.byKey[c.key] = (agg.byKey[c.key] ?? 0) + 1;
      if (c.key === 'irygacja') agg.irr++;
      if (LIVESTOCK.has(c.key)) agg.stock++;
      // gracz: pick niesie cityId -> pole musi byc polem obywatela TEGO miasta (scisle). AI: komenda bez cityId -> pole dowolnego
      // miasta AI (miasta moga miec nakladajace sie promienie; decyzja miasta A nie moze wybrac heksu spoza jego pol obywateli,
      // ale komenda tego nie zdradza — dlatego metryka AI jest luzniejsza; `perCityStrict` mowi ktore z metryk jest ostre).
      const okNear = c.cityId ? workedByCity.get(c.cityId).has(hk) : allWorked.has(hk);
      if (!okNear) {
        agg.off++;
        if (allWorked.has(hk)) agg.offOtherCity++;
        const hx = map.hexes[hk];
        const cause = c.key === 'wyrab' ? 'wyrab-rzeka-lub-las-poza-obywatelem'
          : (hx && (hx.zloze || String(hx.nakladka).startsWith('zloze'))) ? 'zloze-na-heksie'
          : c.key === 'warzelnia_soli' ? 'warzelnia-soli'
          : 'inne/farma-po-wycince';
        agg.causes[`${cause}:${c.key}`] = (agg.causes[`${cause}:${c.key}`] ?? 0) + 1;
      }
    }
  }
  // PLON ZYWNOSCI z ulepszen na koncu gry (nominalny `bonus.zywnosc` z terrain-improvements.json):
  // effFood = tylko ulepszenia na polach obywateli w ostatniej turze (tylko te realnie daja plon), allFood = wszystkie postawione.
  {
    const pop = Math.min(8, 2 + Math.floor((TURNS - 1) / 7));
    const cities = spots.map((s, i) => ({ id: `c${i}`, ownerId: PID, q: s.q, r: s.r, name: `C${i}`, population: pop }));
    const tn = cities.map(c => ({ q: c.q, r: c.r, ownerId: PID, cityId: c.id, pop, level: 1 }));
    const wk = new Set(cities.flatMap(c => [K(c.q, c.r), ...workedHexCoordsForCity(c, map, tn, undefined, ERA).map(h => K(h.q, h.r))]));
    for (const [hk, keys] of placed) for (const k of keys) { const b = foodBonus(k); agg.allFood += b; if (wk.has(hk)) agg.effFood += b; }
  }
}
const OUT = JSON.stringify({
  actor: ACTOR, perCityStrict: ACTOR !== 'ai', seeds, worlds, TURNS, foodImprovements: agg.food, offWorked: agg.off, offWorkedButOtherCityWorks: agg.offOtherCity,
  offPct: agg.food ? +(100 * agg.off / agg.food).toFixed(2) : 0, causes: agg.causes, byKey: agg.byKey,
  irrigation: agg.irr, livestock: agg.stock, effectiveFoodFromImprovements: +agg.effFood.toFixed(1),
  allFoodFromImprovementsIncludingUnworked: +agg.allFood.toFixed(1), avgPickMsPerTurn: +(agg.ms / agg.calls).toFixed(2),
}, null, 1);
if (process.env.AFW_OUT) fs.writeFileSync(process.env.AFW_OUT, OUT + '\nEXIT=0\n'); else console.log(OUT);
