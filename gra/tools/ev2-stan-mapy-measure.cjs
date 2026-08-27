'use strict';
/**
 * ev2-stan-mapy-measure.cjs — NARZEDZIE EVALUATORA, runda 2 tematu
 * R-AI-WYRAB-PRZY-RZECE-FARMY-Q1. Nie jest bramka.
 *
 * ROZNICA METODY wobec `ai2-sciezki-rozdzielone-measure.cjs` (Operator):
 * Operator liczy E1/E2 ze STRUMIENIA ZDARZEN (lista rozkazow zwroconych przez picker
 * / decideAITurn). Ten harness liczy je ze STANU MAPY: po kazdej turze robi SNAPSHOT
 * warstw na kazdym heksie (`hk -> [klucze]`) i wyprowadza metryki wylacznie z ROZNIC
 * miedzy kolejnymi snapshotami. Zaden licznik nie pochodzi z listy rozkazow.
 *   - heks JEST TKNIETY w turze T  <=> liczba warstw na nim w snapshot(T) > w snapshot(T-1)
 *   - E1(T) = ile heksow ma w snapshot(T) >= 1 warstwe I dostanie jeszcze warstwe pozniej
 *   - E2 rozpietosc = (ostatnia tura zmiany) - (pierwsza tura zmiany) dla heksow z >=2 warstwami
 *   - E2 obcych = ile INNYCH heksow zmienilo swoj stan w miedzyczasie
 *
 * SCIEZKI (rozroznienie AI GRACZA vs AI CYWILIZACJI — regula stala wlasciciela):
 *   AI CYWILIZACJI — prawdziwe wejscie `decideAITurn` (ai.ts).
 *   AI GRACZA      — `main.ts` jest closure `boot()`, niebundlowalna; konfiguracja
 *                    odtworzona. Dwa warianty odtworzenia:
 *                      P-OP   = dokladnie jak w harnessie Operatora (playerEra: 3),
 *                      P-EV   = dokladnie jak w main.ts (:27068-27095) — BEZ `playerEra`,
 *                               z `getPracaBudgetPercent` per miasto.
 *                    Roznica miedzy P-OP a P-EV mierzy wplyw driftu konfiguracji.
 *
 * Run z gra/:  node tools/ev2-stan-mapy-measure.cjs
 * Env: EV2_SRC_DIR (katalog src do zbundlowania) · EV2_SEEDS · EV2_TURNS · EV2_TAG · EV2_TRACE
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const SRC = process.env.EV2_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const TAG = process.env.EV2_TAG || 'ev2';
const ENTRY = path.resolve(__dirname, `.ev2-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.ev2-${TAG}-bundle.cjs`);

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export { pickAutoImprovements, AUTO_ULEPSZENIA_PRACA_RESERVE } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { getImprovementMeta, isImprovementTechUnlocked } from ${JSON.stringify(SRC + '/game/improvement-tech')};
export { isImprovementAllowedForCiv } from ${JSON.stringify(SRC + '/game/terrain-improvements')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
export { tileYield } from ${JSON.stringify(SRC + '/game/economy')};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'warning',
});
const M = require(BUNDLE);
const { TerenBazowy, Nakladka } = M;

const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo',
  'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta',
  'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Drogi brukowane', 'Matematyka',
]);
const SEEDS = (process.env.EV2_SEEDS || '11,77,314,2718,1337').split(',').map(s => Number(s.trim()));
const TURNS = Number(process.env.EV2_TURNS || 40);

const KAT_ZYWNOSC = ['farma', 'bydlo', 'owce', 'lama', 'tarasy', 'oboz_lowiecki', 'lodzie_rybackie', 'irygacja'];
const KAT_SUROWCE = ['tartak', 'kamieniolom', 'glinianka', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny', 'kopalnia_zlota', 'stadnina', 'warzelnia_soli'];
const KAT_INFRA = ['posterunek', 'droga', 'droga_brukowana', 'fort'];
function kategoria(key) {
  if (KAT_ZYWNOSC.includes(key)) return 'zywnosc';
  if (KAT_SUROWCE.includes(key)) return 'surowce';
  if (KAT_INFRA.includes(key)) return 'infra';
  if (key === 'wyrab') return 'wyrab';
  return 'inne';
}

function territoryFor(map, cx, cy, rad, ownerId, cityId, pop) {
  const out = [];
  for (let dq = -rad; dq <= rad; dq++) {
    for (let dr = -rad; dr <= rad; dr++) {
      if (Math.abs(dq + dr) > rad) continue;
      const h = map.hexes[`${cx + dq},${cy + dr}`];
      if (!h || h.terenBazowy === TerenBazowy.Morze) continue;
      out.push({ q: cx + dq, r: cy + dr, ownerId, cityId, pop, level: 1 });
    }
  }
  return out;
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

/** DWIE definicje rzeki — implementacja uzywa TYLKO riverPaths (buildRiverHexSet). */
function riverSets(map) {
  const paths = new Set();
  for (const p of (map.riverPaths || [])) for (const x of p) paths.add(`${x.q},${x.r}`);
  const szeroka = new Set(paths);
  for (const [hk, h] of Object.entries(map.hexes)) if (h?.rzeka?.obecna) szeroka.add(hk);
  return { paths, szeroka };
}

// --- METRYKI ZE STANU MAPY --------------------------------------------------
/** snapshots[t] = Map(hk -> liczba warstw) po turze t. */
function metrykiZeStanu(snapshots) {
  const turns = snapshots.length;
  const allHex = new Set();
  for (const s of snapshots) for (const hk of s.keys()) allHex.add(hk);

  // tury, w ktorych heks zmienil stan (przyrost warstw)
  const zmiany = new Map(); // hk -> [tury]
  const koncowe = new Map(); // hk -> liczba warstw na koniec
  for (const hk of allHex) {
    const lista = [];
    let prev = 0;
    for (let t = 0; t < turns; t++) {
      const cur = snapshots[t].get(hk) || 0;
      if (cur > prev) for (let i = 0; i < cur - prev; i++) lista.push(t);
      prev = cur;
    }
    if (lista.length) { zmiany.set(hk, lista); koncowe.set(hk, prev); }
  }

  // E1(T) ze stanu: heks ma >=1 warstwe w snapshot(T) i dostanie kolejna po T
  let e1max = 0, e1sum = 0;
  for (let t = 0; t < turns; t++) {
    let n = 0;
    for (const [hk, lista] of zmiany) {
      const ma = (snapshots[t].get(hk) || 0) >= 1;
      const dostanie = lista[lista.length - 1] > t;
      if (ma && dostanie) n++;
    }
    e1max = Math.max(e1max, n);
    e1sum += n;
  }

  const multi = [...zmiany.entries()].filter(([, l]) => l.length >= 2);
  let spanSum = 0, foreignSum = 0;
  const slady = [];
  for (const [hk, lista] of multi) {
    const first = lista[0], last = lista[lista.length - 1];
    spanSum += last - first;
    let foreign = 0;
    for (const [hk2, l2] of zmiany) {
      if (hk2 === hk) continue;
      if (l2.some(t => t > first && t < last)) foreign++;
    }
    foreignSum += foreign;
    slady.push({ hk, span: last - first, foreign, lista });
  }
  slady.sort((a, b) => b.span - a.span);
  return {
    e1max, e1avg: e1sum / turns,
    e2count: multi.length,
    e2span: multi.length ? spanSum / multi.length : 0,
    e2foreign: multi.length ? foreignSum / multi.length : 0,
    heksowTknietych: zmiany.size,
    warstwRazem: [...koncowe.values()].reduce((a, b) => a + b, 0),
    slady: slady.slice(0, 5),
  };
}

function plonTerytorium(map, territoryNodes, placed, rzeki) {
  const out = { zywnosc: 0, praca: 0, handel: 0, drewno: 0 };
  const seen = new Set();
  for (const n of territoryNodes) {
    const hk = `${n.q},${n.r}`;
    if (seen.has(hk)) continue;
    seen.add(hk);
    const h = map.hexes[hk];
    if (!h) continue;
    const layers = placed.get(hk);
    const y = M.tileYield({
      terenBazowy: h.terenBazowy, nakladka: h.nakladka,
      maRzeke: rzeki.szeroka.has(hk) || !!h.rzeka?.obecna,
      zloze: h.zloze,
      ulepszeniaKeys: Array.isArray(layers) ? layers : (layers ? [layers] : []),
    });
    out.zywnosc += y.zywnosc || 0; out.praca += y.praca || 0;
    out.handel += y.handel || 0; out.drewno += y.drewno || 0;
  }
  return out;
}

// ===========================================================================
// AI CYWILIZACJI — prawdziwe wejscie decideAITurn
// ===========================================================================
function runCiv(seed) {
  const map = M.generateMap(36, 28, seed, 'kontynenty');
  const rzeki = riverSets(map);
  const spots = pickCitySpots(map, 3);
  const OWNER = 1;
  const cities = spots.map((s, i) => ({ id: `c${i}`, ownerId: OWNER, q: s.q, r: s.r, name: `C${i}`, population: 6 }));
  const territoryNodes = [];
  cities.forEach(c => territoryNodes.push(...territoryFor(map, c.q, c.r, 4, OWNER, c.id, 6)));
  const placed = new Map();
  const data = { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } };
  const snapshots = [];
  const klucze = {};
  let rozkazow = 0;
  let maxNaMiastoNaTure = 0;
  for (let t = 0; t < TURNS; t++) {
    const cmds = M.decideAITurn(OWNER, [], cities, map, data, {
      civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {},
      territoryNodes, placedImprovements: placed, improvementTechs: TECHS,
      pracaAvailable: 100000, civEra: 3,
    }).filter(c => c.type === 'buildImprovement');
    maxNaMiastoNaTure = Math.max(maxNaMiastoNaTure, cmds.length / cities.length);
    for (const c of cmds) {
      rozkazow++;
      klucze[c.key] = (klucze[c.key] || 0) + 1;
      const hk = `${c.q},${c.r}`;
      if (c.key === 'wyrab') { if (map.hexes[hk]) map.hexes[hk].nakladka = Nakladka.Brak; continue; }
      const cur = placed.get(hk);
      const arr = Array.isArray(cur) ? [...cur] : (cur ? [cur] : []);
      arr.push(c.key);
      placed.set(hk, arr);
    }
    const snap = new Map();
    for (const [hk, v] of placed) snap.set(hk, Array.isArray(v) ? v.length : 1);
    snapshots.push(snap);
  }
  return { map, rzeki, territoryNodes, placed, snapshots, klucze, rozkazow, maxNaMiastoNaTure };
}

// ===========================================================================
// AI GRACZA — konfiguracja odtworzona (dwa warianty)
// ===========================================================================
function runPlayer(seed, focus, wariant) {
  const map = M.generateMap(36, 28, seed, 'kontynenty');
  const rzeki = riverSets(map);
  const spots = pickCitySpots(map, 3);
  const OWNER = 0;
  const cities = spots.map((s, i) => ({
    id: `c${i}`, ownerId: OWNER, q: s.q, r: s.r, population: 6,
    ulepszeniaFocus: focus, ulepszeniaOnlyWorked: false,
  }));
  const territoryNodes = [];
  cities.forEach(c => territoryNodes.push(...territoryFor(map, c.q, c.r, 4, OWNER, c.id, 6)));
  const placed = new Map();
  const snapshots = [];
  const klucze = {};
  let pool = 200;
  for (let t = 0; t < TURNS; t++) {
    pool += 60;
    const workingPlaced = new Map(placed);
    const opts = {
      cities, ownerId: OWNER, map, territoryNodes,
      placedImprovements: workingPlaced,
      pracaAvailable: pool,
      unlockedTechs: TECHS,
      pracaSurplusThreshold: M.AUTO_ULEPSZENIA_PRACA_RESERVE,
      skipWyrab: true,
      civArchetype: 'grecy',
      isImprovementAllowedForCiv: (key, civ) => M.isImprovementAllowedForCiv(key, civ),
      getFocus: c => c.ulepszeniaFocus,
      getOnlyWorked: c => c.ulepszeniaOnlyWorked,
      pracaBudgetPercent: 33,
      getPracaBudgetPercent: () => 33,
    };
    if (wariant === 'P-OP') opts.playerEra = 3;   // odtworzenie Operatora
    // wariant P-EV: BEZ playerEra — main.ts go NIE przekazuje w tym wywolaniu
    const picks = M.pickAutoImprovements(opts);
    for (const pick of picks) {
      if (!M.isImprovementTechUnlocked(pick.key, TECHS)) continue;
      if (!M.isImprovementAllowedForCiv(pick.key, 'grecy')) continue;
      if (pool < pick.kosztPraca) continue;
      if (pool - pick.kosztPraca < M.AUTO_ULEPSZENIA_PRACA_RESERVE) continue;
      const hk = `${pick.q},${pick.r}`;
      const prev = placed.get(hk) ?? [];
      if (prev.includes(pick.key)) continue;
      pool -= pick.kosztPraca;
      placed.set(hk, [...prev, pick.key]);
      klucze[pick.key] = (klucze[pick.key] || 0) + 1;
    }
    const snap = new Map();
    for (const [hk, v] of placed) snap.set(hk, v.length);
    snapshots.push(snap);
  }
  return { map, rzeki, territoryNodes, placed, snapshots, klucze };
}

// ===========================================================================
function agregat(nazwa, przebiegi) {
  console.log(`\n### ${nazwa}`);
  console.log('ziarno | warstw | heks.tk | E1max | E1sr | E2 n | E2 rozp | E2 obcych | farmy | f@rzekaPATH | f@rzekaSZER | tartak | post+fort | zyw/sur/infra');
  const A = { warstw: 0, heks: 0, e1max: 0, e1: [], span: [], foreign: [], kat: { zywnosc: 0, surowce: 0, infra: 0, wyrab: 0, inne: 0 }, klucze: {}, farmy: 0, fRzekaP: 0, fRzekaS: 0, plon: { zywnosc: 0, praca: 0, handel: 0, drewno: 0 } };
  for (const p of przebiegi) {
    const m = metrykiZeStanu(p.snapshots);
    // farmy przy rzece — ze STANU koncowego mapy
    let farmy = 0, fP = 0, fS = 0;
    const kat = { zywnosc: 0, surowce: 0, infra: 0, wyrab: 0, inne: 0 };
    for (const [hk, v] of p.placed) {
      for (const k of (Array.isArray(v) ? v : [v])) {
        kat[kategoria(k)]++;
        if (k === 'farma') { farmy++; if (p.rzeki.paths.has(hk)) fP++; if (p.rzeki.szeroka.has(hk)) fS++; }
      }
    }
    const tartak = (p.klucze.tartak || 0);
    const pf = (p.klucze.posterunek || 0) + (p.klucze.fort || 0);
    const plon = plonTerytorium(p.map, p.territoryNodes, p.placed, p.rzeki);
    console.log(`${String(p.seed).padStart(6)} | ${String(m.warstwRazem).padStart(6)} | ${String(m.heksowTknietych).padStart(7)} | ${String(m.e1max).padStart(5)} | ${m.e1avg.toFixed(1).padStart(4)} | ${String(m.e2count).padStart(4)} | ${m.e2span.toFixed(1).padStart(7)} | ${m.e2foreign.toFixed(1).padStart(9)} | ${String(farmy).padStart(5)} | ${String(fP).padStart(11)} | ${String(fS).padStart(11)} | ${String(tartak).padStart(6)} | ${String(pf).padStart(9)} | ${kat.zywnosc}/${kat.surowce}/${kat.infra}`);
    if (process.env.EV2_TRACE) {
      for (const s of m.slady) console.log(`        SLAD ${s.hk}${p.rzeki.paths.has(s.hk) ? ' [RZEKA]' : ''}: warstwy w turach ${s.lista.join(',')} (rozpietosc ${s.span}, obcych ${s.foreign})`);
    }
    A.warstw += m.warstwRazem; A.heks += m.heksowTknietych;
    A.e1max = Math.max(A.e1max, m.e1max); A.e1.push(m.e1avg); A.span.push(m.e2span); A.foreign.push(m.e2foreign);
    for (const k of Object.keys(kat)) A.kat[k] += kat[k];
    for (const [k, v] of Object.entries(p.klucze)) A.klucze[k] = (A.klucze[k] || 0) + v;
    A.farmy += farmy; A.fRzekaP += fP; A.fRzekaS += fS;
    for (const k of Object.keys(A.plon)) A.plon[k] += plon[k];
  }
  const avg = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  console.log(`RAZEM  | ${String(A.warstw).padStart(6)} | ${String(A.heks).padStart(7)} | ${String(A.e1max).padStart(5)} | ${avg(A.e1).toFixed(1).padStart(4)} |      | ${avg(A.span).toFixed(1).padStart(7)} | ${avg(A.foreign).toFixed(1).padStart(9)} | ${String(A.farmy).padStart(5)} | ${String(A.fRzekaP).padStart(11)} | ${String(A.fRzekaS).padStart(11)} | ${String(A.klucze.tartak || 0).padStart(6)} | ${String((A.klucze.posterunek || 0) + (A.klucze.fort || 0)).padStart(9)} | ${A.kat.zywnosc}/${A.kat.surowce}/${A.kat.infra}`);
  console.log(`  udzial farm przy rzece: PATH ${A.farmy ? (100 * A.fRzekaP / A.farmy).toFixed(1) : '0'}%  ·  SZEROKA ${A.farmy ? (100 * A.fRzekaS / A.farmy).toFixed(1) : '0'}%`);
  console.log(`  KLUCZE: ${Object.entries(A.klucze).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
  console.log(`  PLON TERYTORIUM/ture (suma po ziarnach): zywnosc ${A.plon.zywnosc} · praca ${A.plon.praca} · handel ${A.plon.handel} · drewno ${A.plon.drewno}`);
  return A;
}

console.log(`# EVALUATOR runda 2 — POMIAR ZE STANU MAPY (snapshot po kazdej turze)`);
console.log(`# src: ${SRC}`);
console.log(`# ziarna: ${SEEDS.join(', ')} · tur: ${TURNS} · mapa 36x28 „kontynenty", 3 miasta, promien 4, pop 6`);

const civ = SEEDS.map(seed => ({ seed, ...runCiv(seed) }));
const aggCiv = agregat('AI CYWILIZACJI — decideAITurn (prawdziwe wejscie, maxItemsPerCity=1)', civ);
console.log(`  ASERCJA maxItemsPerCity=1 (behawioralna): max rozkazow na miasto na ture = ${Math.max(...civ.map(c => c.maxNaMiastoNaTure))}`);

const PROFILE = ['zywnosc', 'surowce', 'infrastruktura', 'zrownowazone'];
const aggP = {};
if (process.env.EV2_ONLY === 'civ') { console.log('\n(EV2_ONLY=civ — sciezka AI GRACZA pominieta w tym przebiegu)'); process.exit(0); }
for (const w of ['P-EV', 'P-OP']) {
  for (const f of PROFILE) {
    const przeb = SEEDS.map(seed => ({ seed, ...runPlayer(seed, f, w) }));
    aggP[`${w}|${f}`] = agregat(`AI GRACZA [${w}] — profil „${f}"`, przeb);
  }
}

function wek(a) { const s = a.kat.zywnosc + a.kat.surowce + a.kat.infra + a.kat.wyrab; return s ? [a.kat.zywnosc / s, a.kat.surowce / s, a.kat.infra / s, a.kat.wyrab / s] : [0, 0, 0, 0]; }
const vC = wek(aggCiv);
console.log('\n### PODOBIENSTWO ROZKLADOW: profil gracza (P-EV) vs AI CYWILIZACJI');
console.log('profil          | cosinus | odleglosc TV (0=identyczne, 1=rozlaczne)');
for (const f of PROFILE) {
  const v = wek(aggP[`P-EV|${f}`]);
  const cos = v.reduce((s, x, i) => s + x * vC[i], 0) / (Math.hypot(...v) * Math.hypot(...vC) || 1);
  const tv = 0.5 * v.reduce((s, x, i) => s + Math.abs(x - vC[i]), 0);
  console.log(`${f.padEnd(15)} | ${cos.toFixed(4).padStart(7)} | ${tv.toFixed(4)}`);
}
console.log(`  wektor AI CYWILIZACJI [zyw,sur,infra,wyrab] = [${vC.map(x => x.toFixed(3)).join(', ')}]`);
for (const f of PROFILE) console.log(`  wektor gracza „${f}" = [${wek(aggP[`P-EV|${f}`]).map(x => x.toFixed(3)).join(', ')}]`);

console.log('\n### CZY PROFILE GRACZA SIE ROZNIA (P-EV, rozklad kategorii + klucze)');
for (const f of PROFILE) {
  const a = aggP[`P-EV|${f}`];
  console.log(`${f.padEnd(15)} | warstw ${String(a.warstw).padStart(4)} | zyw/sur/infra ${a.kat.zywnosc}/${a.kat.surowce}/${a.kat.infra} | farmy ${a.farmy} | klucze: ${Object.entries(a.klucze).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([k, v]) => `${k}=${v}`).join(' ')}`);
}
console.log('\n### DRIFT KONFIGURACJI: P-OP (playerEra:3, jak Operator) vs P-EV (jak main.ts, bez playerEra)');
for (const f of PROFILE) {
  const a = aggP[`P-OP|${f}`], b = aggP[`P-EV|${f}`];
  console.log(`${f.padEnd(15)} | P-OP warstw ${String(a.warstw).padStart(4)} zyw/sur/infra ${a.kat.zywnosc}/${a.kat.surowce}/${a.kat.infra} | P-EV warstw ${String(b.warstw).padStart(4)} zyw/sur/infra ${b.kat.zywnosc}/${b.kat.surowce}/${b.kat.infra}`);
}
