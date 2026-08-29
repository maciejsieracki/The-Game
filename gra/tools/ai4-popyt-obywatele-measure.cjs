'use strict';
/**
 * ai4-popyt-obywatele-measure.cjs — POMIAR OPERATORA, runda 4 tematu
 * R-AI-WYRAB-PRZY-RZECE-FARMY-Q1. To NIE jest bramka — to narzedzie pomiarowe.
 *
 * Mierzy trzy zasady rundy 4:
 *   ZASADA 1 — budowanie napedzane popytem: rozklad rozkazow zywnosc/surowce/infra
 *              OSOBNO przy braku niedoboru i przy niedoborze (kryteria 1-2 dispatchu).
 *   ZASADA 2 — budowa tylko przy obywatelach: odsetek rozkazow (nie-zlozowych) na
 *              heksach BEZ obywateli; zloza raportowane OSOBNO (kryterium 3).
 *   ZASADA 3 — nadwyzka: scenariusz „zero niedoboru + zero kandydatow przy obywatelach"
 *              i stan raportu nadwyzki pickera (kryterium 4).
 *
 * Harness mapy 1:1 z `ai2-sciezki-rozdzielone-measure.cjs` (runda 2/3), zeby liczby
 * byly porownywalne z baza poprzednich rund: mapa 36x28 „kontynenty", 3 miasta,
 * promien 4, pop 6, 40 tur.
 *
 * SCIEZKA AI CYWILIZACJI mierzona PRAWDZIWYM wejsciem `decideAITurn`.
 * SCIEZKA AI GRACZA: `main.ts` to closure `boot()`, niebundlowalna w Node — konfiguracja
 * wywolania odtworzona 1:1 i pilnowana TEKSTOWYM straznikiem w bramce tematu
 * (`ai4-popyt-obywatele-test.cjs`). To odtworzenie konfiguracji, nie prawdziwe wejscie —
 * raportowane jawnie jako takie (§13a).
 *
 * PRZED vs PO: ten sam plik uruchamiany dwa razy z roznym AI4_SRC_DIR.
 *   PO:    node tools/ai4-popyt-obywatele-measure.cjs
 *   PRZED: AI4_SRC_DIR=/tmp/ai4-src-przed/src AI4_TAG=przed node tools/ai4-popyt-obywatele-measure.cjs
 *
 * Env: AI4_SEEDS="7,99,512,4242,1337"  AI4_TURNS=40  AI4_SRC_DIR  AI4_TAG
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const SRC = process.env.AI4_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const TAG = process.env.AI4_TAG || 'po';
const ENTRY = path.resolve(__dirname, `.ai4-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.ai4-${TAG}-bundle.cjs`);

// `export * as` — drzewo PRZED nie ma czesci symboli rundy 4 (freshSurplusReport),
// wiec nazwany eksport wysypalby build. Namespace jest odporny na brak symbolu.
fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export * as AUTO from ${JSON.stringify(SRC + '/game/auto-improvements')};
export * as IMPB from ${JSON.stringify(SRC + '/map/improvement-build')};
export { workedHexCoordsForCity } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { getImprovementMeta, isImprovementTechUnlocked } from ${JSON.stringify(SRC + '/game/improvement-tech')};
export { isImprovementAllowedForCiv } from ${JSON.stringify(SRC + '/game/terrain-improvements')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
export { tileYield } from ${JSON.stringify(SRC + '/game/economy')};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'error',
  // AI4_SRC_DIR moze wskazywac drzewo PRZED poza `gra/` (np. /tmp) — wtedy zwykle
  // rozwiazywanie `node_modules` po katalogu importujacego nie znajdzie `three`.
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const M = require(BUNDLE);
const { TerenBazowy, Nakladka } = M;
const AUTO = M.AUTO;
const IMPB = M.IMPB;

const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo',
  'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta',
  'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Drogi brukowane', 'Matematyka',
]);
const SEEDS = (process.env.AI4_SEEDS || '7,99,512,4242,1337').split(',').map(s => Number(s.trim()));
const TURNS = Number(process.env.AI4_TURNS || 40);

const KAT_ZYWNOSC = ['farma', 'bydlo', 'owce', 'lama', 'tarasy', 'oboz_lowiecki', 'lodzie_rybackie', 'irygacja'];
const KAT_SUROWCE = ['tartak', 'kamieniolom', 'glinianka', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny', 'stadnina', 'warzelnia_soli'];
const KAT_INFRA = ['posterunek', 'droga', 'droga_brukowana', 'fort'];
function kategoria(key) {
  if (KAT_ZYWNOSC.includes(key)) return 'zywnosc';
  if (KAT_SUROWCE.includes(key)) return 'surowce';
  if (KAT_INFRA.includes(key)) return 'infra';
  if (key === 'wyrab') return 'wyrab';
  return 'inne';
}

/**
 * WEZLY TERYTORIUM DOKLADNIE W KSZTALCIE SILNIKA — JEDEN NA MIASTO.
 *
 * ZNALEZISKO OPERATORA RUNDY 4: harnessy rund 2 i 3 (`ai2-sciezki-rozdzielone-measure.cjs`,
 * `ai2-heks-po-heksie-test.cjs`) budowaly wezel NA KAZDY HEKS promienia. Silnik nigdy takiej
 * listy nie produkuje — `main.ts::buildAllTerritoryNodes` -> `buildTerritoryNodesFromCities`
 * (`map/territory-work.ts`) zwraca jeden wezel na miasto. Dopoki jedynym konsumentem byl
 * `territoryOwnerAt`, roznica nie miala skutkow. Od rundy 4 wezly czyta takze
 * `workedHexCoordsForCity`, a `okolica.ts::cityCenterKeysFromTerritoryNodes` traktuje KAZDY
 * wezel jako CENTRUM MIASTA i wyklucza je z pol obrabianych — przy wezle-na-heks caly
 * promien miasta wypadal z pol obrabianych i ZASADA 2 byla mierzona na pustym zbiorze.
 * Promien terytorium liczy teraz silnik z populacji wezla (`cityTerritoryRadius`).
 */
function territoryFor(map, cx, cy, _rad, ownerId, cityId, pop) {
  const h = map.hexes[`${cx},${cy}`];
  if (!h || h.terenBazowy === TerenBazowy.Morze) return [];
  return [{ q: cx, r: cy, ownerId, cityId, pop, level: 1 }];
}

function pickCitySpots(map, n) {
  const keys = Object.keys(map.hexes).sort((a, b) => {
    const [aq, ar] = a.split(',').map(Number); const [bq, br] = b.split(',').map(Number);
    return aq !== bq ? aq - bq : ar - br;
  });
  const scored = [];
  for (const k of keys) {
    const h = map.hexes[k];
    if (!h || h.terenBazowy === TerenBazowy.Morze || h.terenBazowy === TerenBazowy.Wybrzeze) continue;
    const [q, r] = k.split(',').map(Number);
    let land = 0;
    for (let dq = -3; dq <= 3; dq++) {
      for (let dr = -3; dr <= 3; dr++) {
        if (Math.abs(dq + dr) > 3) continue;
        const nb = map.hexes[`${q + dq},${r + dr}`];
        if (nb && nb.terenBazowy !== TerenBazowy.Morze) land++;
      }
    }
    scored.push({ q, r, land });
  }
  scored.sort((a, b) => (b.land - a.land) || (a.q - b.q) || (a.r - b.r));
  const out = [];
  for (const s of scored) {
    if (out.every(o => Math.abs(o.q - s.q) + Math.abs(o.r - s.r) > 8)) out.push(s);
    if (out.length >= n) break;
  }
  return out;
}

function riverHexKeys(map) {
  const set = new Set();
  for (const p of (map.riverPaths || [])) for (const x of p) set.add(`${x.q},${x.r}`);
  for (const [hk, h] of Object.entries(map.hexes)) if (h?.rzeka?.obecna) set.add(hk);
  return set;
}

/** Heks jest ZLOZOWY dla tego klucza = ten sam test, ktory picker stosuje jako wyjatek. */
function zlozoweDlaKlucza(map, hk, key) {
  const hex = map.hexes[hk];
  if (!hex) return false;
  if (typeof IMPB.hexHasDepositReserve !== 'function') return false;
  if (typeof IMPB.depositAllowsPlayerImprovement !== 'function') return false;
  return IMPB.hexHasDepositReserve(hex) && IMPB.depositAllowsPlayerImprovement(key, hex);
}

/** Suma heksow obrabianych przez obywateli WSZYSTKICH miast tego wlasciciela. */
function workedUnion(cities, map, territoryNodes) {
  const out = new Set();
  for (const c of cities) {
    for (const { q, r } of M.workedHexCoordsForCity(c, map, territoryNodes)) out.add(`${q},${r}`);
  }
  return out;
}

/**
 * SCIEZKA AI CYWILIZACJI — prawdziwe wejscie `decideAITurn`.
 * `deficitFor(t)` zwraca `resourceDeficitKeys` na ture t (scenariusze niedoboru).
 */
function runCiv(seed, deficitFor) {
  const map = M.generateMap(36, 28, seed, 'kontynenty');
  const rivers = riverHexKeys(map);
  const spots = pickCitySpots(map, 3);
  const OWNER = 1;
  const cities = spots.map((s, i) => ({ id: `c${i}`, ownerId: OWNER, q: s.q, r: s.r, name: `C${i}`, population: 6 }));
  const territoryNodes = [];
  cities.forEach(c => territoryNodes.push(...territoryFor(map, c.q, c.r, 4, OWNER, c.id, 6)));
  const placed = new Map();
  const data = { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } };
  const events = [];
  const surplusTurns = [];
  for (let t = 0; t < TURNS; t++) {
    const worked = workedUnion(cities, map, territoryNodes);
    const rep = typeof AUTO.freshSurplusReport === 'function' ? AUTO.freshSurplusReport() : null;
    const opts = {
      civType: 'grecy',
      poziomTrudnosci: 2,
      defensiveCopy: false,
      cityBuildings: {},
      territoryNodes,
      placedImprovements: placed,
      improvementTechs: TECHS,
      pracaAvailable: 100000,
      civEra: 3,
      resourceDeficitKeys: deficitFor(t),
    };
    if (rep) opts.improvementSurplusReport = rep;
    const cmds = M.decideAITurn(OWNER, [], cities, map, data, opts)
      .filter(c => c.type === 'buildImprovement');
    if (rep) surplusTurns.push({ t, ...rep, rozkazow: cmds.length });
    for (const c of cmds) {
      const hk = `${c.q},${c.r}`;
      events.push({
        t, hk, key: c.key,
        przyObywatelach: worked.has(hk),
        zlozowe: zlozoweDlaKlucza(map, hk, c.key),
        deficyt: (deficitFor(t) || []).length > 0,
      });
      if (c.key === 'wyrab') {
        if (map.hexes[hk]) map.hexes[hk].nakladka = Nakladka.Brak;
      } else {
        const cur = placed.get(hk);
        const arr = Array.isArray(cur) ? [...cur] : (cur ? [cur] : []);
        arr.push(c.key);
        placed.set(hk, arr);
      }
    }
  }
  return { events, rivers, surplusTurns, workedFinal: workedUnion(cities, map, territoryNodes) };
}

/** SCIEZKA AI GRACZA — konfiguracja odtworzona 1:1 z main.ts. */
function runPlayer(seed, focus, cfg) {
  const map = M.generateMap(36, 28, seed, 'kontynenty');
  const rivers = riverHexKeys(map);
  const spots = pickCitySpots(map, 3);
  const OWNER = 0;
  const cities = spots.map((s, i) => ({
    id: `c${i}`, ownerId: OWNER, q: s.q, r: s.r, name: `C${i}`, population: 6,
    ulepszeniaFocus: focus,
  }));
  const territoryNodes = [];
  cities.forEach(c => territoryNodes.push(...territoryFor(map, c.q, c.r, 4, OWNER, c.id, 6)));
  const placed = new Map();
  const events = [];
  let pool = 200;
  for (let t = 0; t < TURNS; t++) {
    pool += 60;
    const worked = workedUnion(cities, map, territoryNodes);
    const workingPlaced = new Map(placed);
    const args = {
      cities, ownerId: OWNER, map, territoryNodes,
      placedImprovements: workingPlaced,
      pracaAvailable: pool,
      unlockedTechs: TECHS,
      pracaSurplusThreshold: AUTO.AUTO_ULEPSZENIA_PRACA_RESERVE,
      skipWyrab: cfg.skipWyrab !== false,
      civArchetype: 'grecy',
      isImprovementAllowedForCiv: (key, civ) => M.isImprovementAllowedForCiv(key, civ),
      getFocus: c => c.ulepszeniaFocus,
      getOnlyWorked: () => cfg.onlyWorked === true,
      getWorkedHexKeys: c => new Set(
        M.workedHexCoordsForCity(c, map, territoryNodes).map(({ q, r }) => `${q},${r}`),
      ),
      pracaBudgetPercent: 33,
      getPracaBudgetPercent: () => 33,
      playerEra: 3,
    };
    if (cfg.demandDriven) {
      args.demandDriven = true;
      args.resourceDeficitKeys = cfg.deficitFor ? cfg.deficitFor(t) : [];
    }
    const picks = AUTO.pickAutoImprovements(args);
    for (const pick of picks) {
      if (!M.isImprovementTechUnlocked(pick.key, TECHS)) continue;
      if (!M.isImprovementAllowedForCiv(pick.key, 'grecy')) continue;
      if (pool < pick.kosztPraca) continue;
      if (pool - pick.kosztPraca < AUTO.AUTO_ULEPSZENIA_PRACA_RESERVE) continue;
      const hk = `${pick.q},${pick.r}`;
      const prev = placed.get(hk) ?? [];
      if (prev.includes(pick.key)) continue;
      pool -= pick.kosztPraca;
      if (pick.key === 'wyrab') {
        if (map.hexes[hk]) map.hexes[hk].nakladka = Nakladka.Brak;
      } else {
        placed.set(hk, [...prev, pick.key]);
      }
      events.push({
        t, hk, key: pick.key,
        przyObywatelach: worked.has(hk),
        zlozowe: zlozoweDlaKlucza(map, hk, pick.key),
      });
    }
  }
  return { events, rivers };
}

function podsumuj(wyniki) {
  const kat = { zywnosc: 0, surowce: 0, infra: 0, wyrab: 0, inne: 0 };
  const katDef = { zywnosc: 0, surowce: 0, infra: 0, wyrab: 0, inne: 0 };
  const katBezDef = { zywnosc: 0, surowce: 0, infra: 0, wyrab: 0, inne: 0 };
  const counts = {};
  let razem = 0, pozaObywatelami = 0, pozaObywatelamiNieZlozowe = 0, zlozowePozaObywatelami = 0;
  for (const w of wyniki) {
    for (const e of w.events) {
      razem++;
      counts[e.key] = (counts[e.key] || 0) + 1;
      kat[kategoria(e.key)]++;
      if (e.deficyt === true) katDef[kategoria(e.key)]++;
      else if (e.deficyt === false) katBezDef[kategoria(e.key)]++;
      if (!e.przyObywatelach) {
        pozaObywatelami++;
        if (e.zlozowe) zlozowePozaObywatelami++;
        else pozaObywatelamiNieZlozowe++;
      }
    }
  }
  return {
    razem, kat, katDef, katBezDef, counts,
    pozaObywatelami, pozaObywatelamiNieZlozowe, zlozowePozaObywatelami,
  };
}

function drukuj(naglowek, s) {
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) : '0.0');
  console.log(`\n### ${naglowek}`);
  console.log(`  rozkazow razem: ${s.razem}`);
  console.log(`  kategorie zyw/sur/infra/wyrab/inne: `
    + `${s.kat.zywnosc}/${s.kat.surowce}/${s.kat.infra}/${s.kat.wyrab}/${s.kat.inne}`);
  console.log(`  udzial: zywnosc ${pct(s.kat.zywnosc, s.razem)}% · surowce ${pct(s.kat.surowce, s.razem)}%`
    + ` · infra ${pct(s.kat.infra, s.razem)}% · wyrab ${pct(s.kat.wyrab, s.razem)}%`);
  const bezDefRazem = Object.values(s.katBezDef).reduce((a, b) => a + b, 0);
  const defRazem = Object.values(s.katDef).reduce((a, b) => a + b, 0);
  if (bezDefRazem || defRazem) {
    console.log(`  BEZ NIEDOBORU (${bezDefRazem} rozkazow): zyw/sur/infra/wyrab = `
      + `${s.katBezDef.zywnosc}/${s.katBezDef.surowce}/${s.katBezDef.infra}/${s.katBezDef.wyrab}`);
    console.log(`  PRZY NIEDOBORZE (${defRazem} rozkazow): zyw/sur/infra/wyrab = `
      + `${s.katDef.zywnosc}/${s.katDef.surowce}/${s.katDef.infra}/${s.katDef.wyrab}`);
  }
  console.log(`  ZASADA 2: rozkazy na heksach BEZ obywateli: ${s.pozaObywatelami} `
    + `(${pct(s.pozaObywatelami, s.razem)}%), w tym ZLOZOWE (wyjatek): ${s.zlozowePozaObywatelami}`
    + ` · NIE-zlozowe: ${s.pozaObywatelamiNieZlozowe} (${pct(s.pozaObywatelamiNieZlozowe, s.razem)}%)`);
  console.log(`  PER KLUCZ: ${Object.entries(s.counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
}

console.log(`# POMIAR RUNDY 4 (${TAG.toUpperCase()}) — zasady 1/2/3`);
console.log(`# zrodlo: ${SRC}`);
console.log(`# ziarna: ${SEEDS.join(', ')} · tur: ${TURNS} · mapa 36x28 „kontynenty", 3 miasta, promien 4, pop 6`);

// --- AI CYWILIZACJI ---------------------------------------------------------
const BEZ_NIEDOBORU = () => [];
const STALY_NIEDOBOR = () => ['drewno'];
const NIEDOBOR_OKNO = t => (t >= 10 && t < 20 ? ['drewno'] : []);

const civBez = SEEDS.map(seed => runCiv(seed, BEZ_NIEDOBORU));
drukuj('AI CYWILIZACJI — decideAITurn, SCENARIUSZ A: BEZ NIEDOBORU przez cale 40 tur', podsumuj(civBez));

const civDef = SEEDS.map(seed => runCiv(seed, STALY_NIEDOBOR));
drukuj('AI CYWILIZACJI — decideAITurn, SCENARIUSZ B: NIEDOBOR DREWNA przez cale 40 tur', podsumuj(civDef));

const civOkno = SEEDS.map(seed => runCiv(seed, NIEDOBOR_OKNO));
drukuj('AI CYWILIZACJI — decideAITurn, SCENARIUSZ C: NIEDOBOR DREWNA tylko w turach 10-19', podsumuj(civOkno));

// slad czasowy scenariusza C — czy rozkazy niezywnosciowe pojawiaja sie/znikaja z niedoborem
{
  const perTura = new Map();
  for (const w of civOkno) {
    for (const e of w.events) {
      const cur = perTura.get(e.t) || { zyw: 0, nieZyw: 0 };
      if (kategoria(e.key) === 'zywnosc') cur.zyw++; else cur.nieZyw++;
      perTura.set(e.t, cur);
    }
  }
  const linie = [];
  for (let t = 0; t < TURNS; t++) {
    const c = perTura.get(t) || { zyw: 0, nieZyw: 0 };
    linie.push(`t${t}${t >= 10 && t < 20 ? '*' : ' '}:${c.zyw}/${c.nieZyw}`);
  }
  console.log(`  SLAD CZASOWY (tura: zywnosc/nie-zywnosc; * = niedobor drewna aktywny)`);
  for (let i = 0; i < linie.length; i += 10) console.log('    ' + linie.slice(i, i + 10).join('  '));
}

// --- ZASADA 3: raport nadwyzki ---------------------------------------------
console.log(`\n### ZASADA 3 — raport nadwyzki pickera (AI CYWILIZACJI, scenariusz A: zero niedoboru)`);
if (civBez[0] && civBez[0].surplusTurns.length) {
  for (const w of civBez) {
    const nadwyzkowe = w.surplusTurns.filter(s => s.surplus);
    const pierwsza = nadwyzkowe.length ? nadwyzkowe[0].t : null;
    console.log(`  ziarno: tur z nadwyzka ${nadwyzkowe.length}/${TURNS}`
      + (pierwsza !== null ? ` · pierwsza tura z nadwyzka: t${pierwsza}` : '')
      + ` · tur z niedoborem: ${w.surplusTurns.filter(s => s.deficitActive).length}`
      + ` · tur z demandActive: ${w.surplusTurns.filter(s => s.demandActive).length}`);
  }
} else {
  console.log('  BRAK DANYCH — to drzewo zrodlowe nie zna `freshSurplusReport` (stan PRZED).');
}

// --- AI GRACZA: cztery profile ---------------------------------------------
const PROFILE = ['zywnosc', 'surowce', 'infrastruktura', 'zrownowazone'];
console.log(`\n### AI GRACZA — cztery profile, onlyWorked=FALSE (stale po obu stronach), skipWyrab=true`);
console.log('profil          | razem | zywnosc | surowce | infra | wyrab | odcisk (klucz=liczba)');
for (const f of PROFILE) {
  const cfg = { onlyWorked: false, skipWyrab: true, demandDriven: false };
  const s = podsumuj(SEEDS.map(seed => runPlayer(seed, f, cfg)));
  const odcisk = Object.entries(s.counts).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join(',');
  console.log(`${f.padEnd(15)} | ${String(s.razem).padStart(5)} | ${String(s.kat.zywnosc).padStart(7)} `
    + `| ${String(s.kat.surowce).padStart(7)} | ${String(s.kat.infra).padStart(5)} | ${String(s.kat.wyrab).padStart(5)} | ${odcisk}`);
}
if (typeof AUTO.freshSurplusReport === 'function') {
  console.log(`\n### AI GRACZA — profil „zrownowazone" Z ZASADA 1 (demandDriven), onlyWorked=FALSE`);
  for (const [nazwa, deficitFor] of [['bez niedoboru', BEZ_NIEDOBORU], ['niedobor drewna', STALY_NIEDOBOR]]) {
    const s = podsumuj(SEEDS.map(seed => runPlayer(seed, 'zrownowazone', {
      onlyWorked: false, skipWyrab: true, demandDriven: true, deficitFor,
    })));
    console.log(`  ${nazwa.padEnd(16)} razem ${String(s.razem).padStart(4)} · zyw/sur/infra/wyrab `
      + `${s.kat.zywnosc}/${s.kat.surowce}/${s.kat.infra}/${s.kat.wyrab}`);
  }
  console.log(`\n### R4-Q2 — automat GRACZA a przelacznik „wolno wycinac las" (profil zrownowazone, demandDriven)`);
  for (const skipWyrab of [true, false]) {
    const s = podsumuj(SEEDS.map(seed => runPlayer(seed, 'zrownowazone', {
      onlyWorked: true, skipWyrab, demandDriven: true, deficitFor: BEZ_NIEDOBORU,
    })));
    console.log(`  przelacznik ${skipWyrab ? 'WYLACZONY (skipWyrab=true) ' : 'WLACZONY  (skipWyrab=false)'}`
      + ` · razem ${String(s.razem).padStart(4)} · wyrab ${s.kat.wyrab} · farmy ${s.counts.farma || 0}`);
  }
  console.log(`\n### ZASADA 2 — AI GRACZA, profil zrownowazone: onlyWorked FALSE vs TRUE (demandDriven)`);
  for (const onlyWorked of [false, true]) {
    const s = podsumuj(SEEDS.map(seed => runPlayer(seed, 'zrownowazone', {
      onlyWorked, skipWyrab: true, demandDriven: true, deficitFor: BEZ_NIEDOBORU,
    })));
    const pct = s.razem ? (100 * s.pozaObywatelamiNieZlozowe / s.razem).toFixed(1) : '0.0';
    console.log(`  onlyWorked=${String(onlyWorked).padEnd(5)} · razem ${String(s.razem).padStart(4)}`
      + ` · poza obywatelami NIE-zlozowe ${s.pozaObywatelamiNieZlozowe} (${pct}%)`
      + ` · zlozowe poza obywatelami ${s.zlozowePozaObywatelami}`);
  }
}
