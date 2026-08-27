'use strict';
/**
 * ev3-stan-mapy-measure.cjs — NARZEDZIE EVALUATORA, runda 3 tematu
 * R-AI-WYRAB-PRZY-RZECE-FARMY-Q1. Nie jest bramka.
 *
 * ROZNICA METODY wobec `ai2-sciezki-rozdzielone-measure.cjs` (Operator, runda 3):
 * Operator liczy WSZYSTKO ze STRUMIENIA ROZKAZOW (lista `buildImprovement` zwracana
 * przez `decideAITurn`). Ten harness liczy wszystko ze STANU MAPY — po kazdej turze
 * robi SNAPSHOT dwoch warstw kazdego heksa:
 *     snapWarstwy[t]  : hk -> liczba TRWALYCH ulepszen na heksie
 *     snapNakladka[t] : hk -> nakladka heksa (Las / Brak / ...)
 * i wyprowadza metryki WYLACZNIE z roznic miedzy snapshotami.
 *
 * W SZCZEGOLNOSCI `wyrab` NIE jest liczony z rozkazow: wyrab to akcja, nie warstwa,
 * wiec jego jedynym sladem w STANIE jest ZNIKNIECIE nakladki Las. Licze:
 *     wyrab(state)  = |{ hk : nakladka(t-1)=Las AND nakladka(t)!=Las }|
 *     farmy@POwyrab = |{ hk in wyrab(state) : 'farma' pojawia sie na hk w turze > tury wycinki }|
 * Zaden z tych licznikow nie moze byc zawyzony przez rozkaz, ktory silnik odrzucil.
 *
 * FIDELITY wzgledem silnika (main.ts:28879-28905, sciezka AI CYWILIZACJI):
 *   • `wyrab` (meta.typ === 'wycinka') NIE trafia do placedImprovements, tylko zdejmuje las
 *     — i tylko wtedy, gdy heks NADAL ma nakladke Las (bezpiecznik wyscigu miast);
 *   • po zdjeciu lasu silnik wola `stripImprovementsWhenForestRemoved` (usuwa `oboz_lowiecki`).
 *     ANI harness Operatora rundy 2/3, ANI moj z rundy 2 tego NIE modelowaly — tu modeluje.
 *
 * SCIEZKI (regula stala wlasciciela: AI GRACZA != AI CYWILIZACJI):
 *   AI CYWILIZACJI — prawdziwe wejscie `decideAITurn` (ai.ts:1984), maxItemsPerCity=1.
 *   AI GRACZA      — `main.ts` to closure `boot()`, niebundlowalna; konfiguracja odtworzona
 *                    1:1 z `main.ts:~27068-27095` (skipWyrab: true) — BRAK DOWODU (§13a).
 *
 * Run z gra/:  node tools/ev3-stan-mapy-measure.cjs
 * Env: EV3_SRC_DIR · EV3_SEEDS · EV3_TURNS · EV3_TAG · EV3_ONLY=civ · EV3_TRACE · EV3_NOSTRIP
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const SRC = process.env.EV3_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const TAG = process.env.EV3_TAG || 'ev3';
const ENTRY = path.resolve(__dirname, `.ev3-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.ev3-${TAG}-bundle.cjs`);

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export { pickAutoImprovements, AUTO_ULEPSZENIA_PRACA_RESERVE } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { getImprovementMeta, isImprovementTechUnlocked } from ${JSON.stringify(SRC + '/game/improvement-tech')};
export { isImprovementAllowedForCiv } from ${JSON.stringify(SRC + '/game/terrain-improvements')};
export { stripImprovementsWhenForestRemoved } from ${JSON.stringify(SRC + '/map/improvement-build')};
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
const STRIP = !process.env.EV3_NOSTRIP;
/**
 * BRAMKA TERYTORIUM SILNIKA (main.ts:28840-28860, sciezka AI CYWILIZACJI):
 *   • fort/posterunek — odrzucone, gdy heks nie jest we WLASNYM terytorium i nie stoi
 *     na nim WLASNA jednostka (AI z auto-ulepszen nie przekazuje jednostek → odrzucone);
 *   • pozostale klucze — odrzucone, gdy heks nie jest we wlasnym terytorium.
 * Terytorium liczone jak `buildAllTerritoryNodes()`: JEDEN wezel na MIASTO, promien
 * `cityTerritoryRadius` = max(5, pop) (territory.ts:74) → dla pop 6 = 6 heksow.
 * Harnessy obu rol podaja pickerowi `territoryNodes` jako JEDEN WEZEL NA HEKS (pop 6),
 * wiec `inPlayerTerritory` w pickerze widzi promien 4+6=10 — o wiele wiecej niz silnik.
 * EV3_REALGATE=1 wlacza bramke silnika i pokazuje, ile rozkazow gra faktycznie wykona.
 */
const REALGATE = process.env.EV3_REALGATE === '1';
/**
 * EV3_REALTERR=1 — podaje pickerowi `territoryNodes` DOKLADNIE tak, jak robi to gra:
 * `buildAllTerritoryNodes()` (main.ts:4141-4149) = JEDEN wezel na MIASTO, `pop` miasta,
 * bez fortow i posterunkow. Harnessy obu rol (runda 1-3) podawaly wezel NA KAZDY HEKS
 * terytorium, kazdy z pop 6 → `inPlayerTerritory` w pickerze widzialo promien ~10 zamiast 6.
 * Razem z EV3_REALGATE=1 to najwierniejszy dostepny model sciezki AI CYWILIZACJI.
 */
const REALTERR = process.env.EV3_REALTERR === '1';
const hexDistAx2 = (aq, ar, bq, br) => (Math.abs(aq - bq) + Math.abs(ar - br) + Math.abs(aq + ar - bq - br)) / 2;

const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo',
  'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta',
  'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Drogi brukowane', 'Matematyka',
]);
const SEEDS = (process.env.EV3_SEEDS || '11,77,314,2718,1337').split(',').map(s => Number(s.trim()));
const TURNS = Number(process.env.EV3_TURNS || 40);

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

function riverSets(map) {
  const paths = new Set();
  for (const p of (map.riverPaths || [])) for (const x of p) paths.add(`${x.q},${x.r}`);
  const szeroka = new Set(paths);
  for (const [hk, h] of Object.entries(map.hexes)) if (h?.rzeka?.obecna) szeroka.add(hk);
  return { paths, szeroka };
}

// --- METRYKI ZE STANU MAPY --------------------------------------------------
function metrykiZeStanu(snapWarstwy) {
  const turns = snapWarstwy.length;
  const allHex = new Set();
  for (const s of snapWarstwy) for (const hk of s.keys()) allHex.add(hk);
  const zmiany = new Map();
  const koncowe = new Map();
  for (const hk of allHex) {
    const lista = [];
    let prev = 0;
    for (let t = 0; t < turns; t++) {
      const cur = snapWarstwy[t].get(hk) || 0;
      if (cur > prev) for (let i = 0; i < cur - prev; i++) lista.push(t);
      prev = cur;
    }
    if (lista.length) { zmiany.set(hk, lista); koncowe.set(hk, prev); }
  }
  let e1max = 0, e1sum = 0;
  for (let t = 0; t < turns; t++) {
    let n = 0;
    for (const [hk, lista] of zmiany) {
      const ma = (snapWarstwy[t].get(hk) || 0) >= 1;
      const dostanie = lista[lista.length - 1] > t;
      if (ma && dostanie) n++;
    }
    e1max = Math.max(e1max, n); e1sum += n;
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
    e1max, e1avg: e1sum / turns, e2count: multi.length,
    e2span: multi.length ? spanSum / multi.length : 0,
    e2foreign: multi.length ? foreignSum / multi.length : 0,
    heksowTknietych: zmiany.size,
    warstwRazem: [...koncowe.values()].reduce((a, b) => a + b, 0),
    slady: slady.slice(0, 6),
  };
}

/** WYRAB ZE STANU: nakladka Las znika miedzy snapshotami. Farmy PO wyrebie: 'farma' pojawia
 *  sie na tym heksie w turze POZNIEJSZEJ niz tura zniknnieca lasu. */
function wyrabZeStanu(snapNakladka, snapKlucze) {
  const turns = snapNakladka.length;
  const wyciete = new Map(); // hk -> tura wyciecia
  const allHex = new Set();
  for (const s of snapNakladka) for (const hk of s.keys()) allHex.add(hk);
  for (const hk of allHex) {
    for (let t = 1; t < turns; t++) {
      const prev = snapNakladka[t - 1].get(hk);
      const cur = snapNakladka[t].get(hk);
      if (prev === Nakladka.Las && cur !== Nakladka.Las && !wyciete.has(hk)) wyciete.set(hk, t);
    }
  }
  let farmyPo = 0; const slad = [];
  for (const [hk, tw] of wyciete) {
    let tf = -1;
    for (let t = tw; t < turns; t++) {
      if ((snapKlucze[t].get(hk) || []).includes('farma')) { tf = t; break; }
    }
    if (tf > tw) farmyPo++;
    slad.push({ hk, turaWyrebu: tw - 1, turaFarmy: tf - 1 });
  }
  slad.sort((a, b) => a.turaWyrebu - b.turaWyrebu);
  return { wyrab: wyciete.size, farmyPoWyrebie: farmyPo, slad };
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
  const POP = 6;
  const cities = spots.map((s, i) => ({ id: `c${i}`, ownerId: OWNER, q: s.q, r: s.r, name: `C${i}`, population: POP }));
  const territoryNodes = [];
  const cityHexes = new Map();
  cities.forEach(c => {
    const t = territoryFor(map, c.q, c.r, 4, OWNER, c.id, POP);
    if (!REALTERR) territoryNodes.push(...t);
    cityHexes.set(c.id, new Set(t.map(n => `${n.q},${n.r}`)));
  });
  // model wierny: jeden wezel na miasto (buildAllTerritoryNodes)
  if (REALTERR) for (const c of cities) territoryNodes.push({ q: c.q, r: c.r, ownerId: OWNER, cityId: c.id, pop: POP, level: 1 });
  // plon liczymy zawsze po REALNYM terytorium miasta (promien max(5,pop)), niezaleznie od modelu
  const plonHexes = [];
  { const seen = new Set();
    for (const c of cities) for (let dq = -Math.max(5, POP); dq <= Math.max(5, POP); dq++) for (let dr = -Math.max(5, POP); dr <= Math.max(5, POP); dr++) {
      if (hexDistAx2(c.q + dq, c.r + dr, c.q, c.r) > Math.max(5, POP)) continue;
      const hk = `${c.q + dq},${c.r + dr}`;
      if (seen.has(hk)) continue; const h = map.hexes[hk]; if (!h || h.terenBazowy === TerenBazowy.Morze) continue;
      seen.add(hk); plonHexes.push({ q: c.q + dq, r: c.r + dr }); } }
  const placed = new Map();
  const data = { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } };
  const snapWarstwy = [], snapNakladka = [], snapKlucze = [];
  const klucze = {}; let rozkazow = 0, odrzuconych = 0, strippedOboz = 0, odrzuconychGate = 0;
  const dystanse = []; const pozaTerytorium = {};
  const REAL_RADIUS = Math.max(5, POP);
  let maxNaMiastoNaTure = 0;
  // SNAPSHOT BAZOWY (stan przed tura 0) — bez niego wyrab wykonany w turze 0 nie ma
  // z czym byc porownany i wypada z licznika „ze STANU".
  {
    const sw = new Map(), sn = new Map(), sk = new Map();
    for (const hk of Object.keys(map.hexes)) sn.set(hk, map.hexes[hk]?.nakladka);
    snapWarstwy.push(sw); snapNakladka.push(sn); snapKlucze.push(sk);
  }
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
      let dmin = Infinity;
      for (const cc of cities) dmin = Math.min(dmin, hexDistAx2(c.q, c.r, cc.q, cc.r));
      dystanse.push({ key: c.key, d: dmin });
      if (dmin > REAL_RADIUS) {
        pozaTerytorium[c.key] = (pozaTerytorium[c.key] || 0) + 1;
        if (REALGATE) { odrzuconychGate++; continue; }
      }
      const meta = M.getImprovementMeta(c.key);
      if (meta && meta.typ === 'wycinka') {
        // silnik: tylko gdy heks NADAL ma las (bezpiecznik wyscigu), potem strip
        if (map.hexes[hk]?.nakladka !== Nakladka.Las) { odrzuconych++; continue; }
        map.hexes[hk].nakladka = Nakladka.Brak;
        if (STRIP) {
          const prev = placed.get(hk) ?? [];
          const next = M.stripImprovementsWhenForestRemoved(prev);
          if (next.length !== prev.length) { strippedOboz += prev.length - next.length; }
          if (next.length) placed.set(hk, next); else placed.delete(hk);
        }
        continue;
      }
      const cur = placed.get(hk);
      const arr = Array.isArray(cur) ? [...cur] : (cur ? [cur] : []);
      if (arr.includes(c.key)) { odrzuconych++; continue; } // bezpiecznik wyscigu silnika
      arr.push(c.key);
      placed.set(hk, arr);
    }
    const sw = new Map(), sn = new Map(), sk = new Map();
    for (const [hk, v] of placed) { sw.set(hk, Array.isArray(v) ? v.length : 1); sk.set(hk, Array.isArray(v) ? v : [v]); }
    for (const hk of Object.keys(map.hexes)) sn.set(hk, map.hexes[hk]?.nakladka);
    snapWarstwy.push(sw); snapNakladka.push(sn); snapKlucze.push(sk);
  }
  // pulap obronny per miasto: ile posterunkow/fortow w promieniu kazdego miasta
  const pulap = { limit: Math.max(1, Math.ceil(POP / 10)), naruszen: 0, max: 0, maxOverlap: 0, naruszenOverlap: 0, detale: [] };
  const hexDistAx = (aq, ar, bq, br) => (Math.abs(aq - bq) + Math.abs(ar - br) + Math.abs(aq + ar - bq - br)) / 2;
  // (a) atrybucja do NAJBLIZSZEGO miasta — kazdy heks liczony raz
  const perCityNearest = new Map(cities.map(c => [c.id, { posterunek: 0, fort: 0 }]));
  for (const [hk, v] of placed) {
    const layers = Array.isArray(v) ? v : [v];
    const [q, r] = hk.split(',').map(Number);
    let best = null, bestD = Infinity;
    for (const c of cities) { const d = hexDistAx(q, r, c.q, c.r); if (d < bestD) { bestD = d; best = c; } }
    for (const k of layers) if (k === 'posterunek' || k === 'fort') perCityNearest.get(best.id)[k]++;
  }
  for (const [cid, o] of perCityNearest) {
    for (const key of ['posterunek', 'fort']) {
      pulap.max = Math.max(pulap.max, o[key]);
      if (o[key] > pulap.limit) { pulap.naruszen++; pulap.detale.push(`${cid}:${key}=${o[key]}`); }
    }
  }
  // (b) liczenie po promieniu miasta (jak w kodzie: candidateHexes) — promienie sie NAKLADAJA
  for (const [, hexes] of cityHexes) {
    for (const key of ['posterunek', 'fort']) {
      let n = 0;
      for (const hk of hexes) if ((placed.get(hk) ?? []).includes(key)) n++;
      pulap.maxOverlap = Math.max(pulap.maxOverlap, n);
      if (n > pulap.limit) pulap.naruszenOverlap++;
    }
  }
  return { map, rzeki, territoryNodes, plonHexes, placed, snapWarstwy, snapNakladka, snapKlucze, klucze, rozkazow, odrzuconych, strippedOboz, odrzuconychGate, dystanse, pozaTerytorium, maxNaMiastoNaTure, pulap, REAL_RADIUS };
}

// ===========================================================================
// AI GRACZA — konfiguracja odtworzona z main.ts (BRAK DOWODU, §13a)
// ===========================================================================
function runPlayer(seed, focus) {
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
  const snapWarstwy = [], snapNakladka = [], snapKlucze = [];
  const klucze = {};
  let pool = 200;
  {
    const sw = new Map(), sn = new Map(), sk = new Map();
    for (const hk of Object.keys(map.hexes)) sn.set(hk, map.hexes[hk]?.nakladka);
    snapWarstwy.push(sw); snapNakladka.push(sn); snapKlucze.push(sk);
  }
  for (let t = 0; t < TURNS; t++) {
    pool += 60;
    const workingPlaced = new Map(placed);
    const picks = M.pickAutoImprovements({
      cities, ownerId: OWNER, map, territoryNodes,
      placedImprovements: workingPlaced,
      pracaAvailable: pool, unlockedTechs: TECHS,
      pracaSurplusThreshold: M.AUTO_ULEPSZENIA_PRACA_RESERVE,
      skipWyrab: true, civArchetype: 'grecy',
      isImprovementAllowedForCiv: (key, civ) => M.isImprovementAllowedForCiv(key, civ),
      getFocus: c => c.ulepszeniaFocus,
      getOnlyWorked: c => c.ulepszeniaOnlyWorked,
      pracaBudgetPercent: 33, getPracaBudgetPercent: () => 33,
    });
    for (const pick of picks) {
      if (!M.isImprovementTechUnlocked(pick.key, TECHS)) continue;
      if (!M.isImprovementAllowedForCiv(pick.key, 'grecy')) continue;
      if (pool < pick.kosztPraca) continue;
      if (pool - pick.kosztPraca < M.AUTO_ULEPSZENIA_PRACA_RESERVE) continue;
      const hk = `${pick.q},${pick.r}`;
      const meta = M.getImprovementMeta(pick.key);
      if (meta && meta.typ === 'wycinka') {
        if (map.hexes[hk]?.nakladka !== Nakladka.Las) continue;
        pool -= pick.kosztPraca;
        map.hexes[hk].nakladka = Nakladka.Brak;
        if (STRIP) {
          const prev = placed.get(hk) ?? [];
          const next = M.stripImprovementsWhenForestRemoved(prev);
          if (next.length) placed.set(hk, next); else placed.delete(hk);
        }
        klucze[pick.key] = (klucze[pick.key] || 0) + 1;
        continue;
      }
      const prev = placed.get(hk) ?? [];
      if (prev.includes(pick.key)) continue;
      pool -= pick.kosztPraca;
      placed.set(hk, [...prev, pick.key]);
      klucze[pick.key] = (klucze[pick.key] || 0) + 1;
    }
    const sw = new Map(), sn = new Map(), sk = new Map();
    for (const [hk, v] of placed) { sw.set(hk, v.length); sk.set(hk, v); }
    for (const hk of Object.keys(map.hexes)) sn.set(hk, map.hexes[hk]?.nakladka);
    snapWarstwy.push(sw); snapNakladka.push(sn); snapKlucze.push(sk);
  }
  return { map, rzeki, territoryNodes, placed, snapWarstwy, snapNakladka, snapKlucze, klucze };
}

// ===========================================================================
function agregat(nazwa, przebiegi) {
  console.log(`\n### ${nazwa}`);
  console.log('ziarno | warstw | heks.tk | E1max | E1sr | E2 n | E2rozp | E2obcy | farmy | f@rzeka | WYRAB(stan) | farmy@POwyrab | post | fort | tartak | oboz | zyw/sur/infra | plon ZYW | drewno');
  const A = { warstw: 0, heks: 0, e1max: 0, e1: [], span: [], foreign: [], kat: { zywnosc: 0, surowce: 0, infra: 0, wyrab: 0, inne: 0 }, klucze: {}, farmy: 0, fRzekaP: 0, fRzekaS: 0, wyrab: 0, farmyPo: 0, post: 0, fort: 0, plon: { zywnosc: 0, praca: 0, handel: 0, drewno: 0 } };
  for (const p of przebiegi) {
    const m = metrykiZeStanu(p.snapWarstwy);
    const w = wyrabZeStanu(p.snapNakladka, p.snapKlucze);
    let farmy = 0, fP = 0, fS = 0, post = 0, fort = 0, tartak = 0, oboz = 0;
    const kat = { zywnosc: 0, surowce: 0, infra: 0, wyrab: 0, inne: 0 };
    for (const [hk, v] of p.placed) {
      for (const k of (Array.isArray(v) ? v : [v])) {
        kat[kategoria(k)]++;
        if (k === 'farma') { farmy++; if (p.rzeki.paths.has(hk)) fP++; if (p.rzeki.szeroka.has(hk)) fS++; }
        if (k === 'posterunek') post++;
        if (k === 'fort') fort++;
        if (k === 'tartak') tartak++;
        if (k === 'oboz_lowiecki') oboz++;
      }
    }
    const plon = plonTerytorium(p.map, p.plonHexes || p.territoryNodes, p.placed, p.rzeki);
    console.log(`${String(p.seed).padStart(6)} | ${String(m.warstwRazem).padStart(6)} | ${String(m.heksowTknietych).padStart(7)} | ${String(m.e1max).padStart(5)} | ${m.e1avg.toFixed(1).padStart(4)} | ${String(m.e2count).padStart(4)} | ${m.e2span.toFixed(1).padStart(6)} | ${m.e2foreign.toFixed(1).padStart(6)} | ${String(farmy).padStart(5)} | ${String(fP).padStart(7)} | ${String(w.wyrab).padStart(11)} | ${String(w.farmyPoWyrebie).padStart(13)} | ${String(post).padStart(4)} | ${String(fort).padStart(4)} | ${String(tartak).padStart(6)} | ${String(oboz).padStart(4)} | ${kat.zywnosc}/${kat.surowce}/${kat.infra} | ${String(plon.zywnosc).padStart(8)} | ${String(plon.drewno).padStart(6)}`);
    if (process.env.EV3_TRACE) {
      for (const s of m.slady) console.log(`        SLAD-E2 ${s.hk}${p.rzeki.paths.has(s.hk) ? ' [RZEKA]' : ''}: warstwy w turach ${s.lista.join(',')} (rozpietosc ${s.span}, obcych ${s.foreign})`);
      for (const s of w.slad.slice(0, 8)) console.log(`        SLAD-WYRAB ${s.hk}${p.rzeki.paths.has(s.hk) ? ' [RZEKA]' : ''}: las znika w turze ${s.turaWyrebu}, farma w turze ${s.turaFarmy}`);
    }
    A.warstw += m.warstwRazem; A.heks += m.heksowTknietych;
    A.e1max = Math.max(A.e1max, m.e1max); A.e1.push(m.e1avg); A.span.push(m.e2span); A.foreign.push(m.e2foreign);
    for (const k of Object.keys(kat)) A.kat[k] += kat[k];
    for (const [k, v] of Object.entries(p.klucze)) A.klucze[k] = (A.klucze[k] || 0) + v;
    A.farmy += farmy; A.fRzekaP += fP; A.fRzekaS += fS; A.wyrab += w.wyrab; A.farmyPo += w.farmyPoWyrebie;
    A.post += post; A.fort += fort;
    for (const k of Object.keys(A.plon)) A.plon[k] += plon[k];
  }
  const avg = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  console.log(`RAZEM  | ${String(A.warstw).padStart(6)} | ${String(A.heks).padStart(7)} | ${String(A.e1max).padStart(5)} | ${avg(A.e1).toFixed(1).padStart(4)} |      | ${avg(A.span).toFixed(1).padStart(6)} | ${avg(A.foreign).toFixed(1).padStart(6)} | ${String(A.farmy).padStart(5)} | ${String(A.fRzekaP).padStart(7)} | ${String(A.wyrab).padStart(11)} | ${String(A.farmyPo).padStart(13)} | ${String(A.post).padStart(4)} | ${String(A.fort).padStart(4)} | ${String(A.klucze.tartak || 0).padStart(6)} |      | ${A.kat.zywnosc}/${A.kat.surowce}/${A.kat.infra} | ${String(A.plon.zywnosc).padStart(8)} | ${String(A.plon.drewno).padStart(6)}`);
  console.log(`  udzial farm przy rzece: PATH ${A.farmy ? (100 * A.fRzekaP / A.farmy).toFixed(1) : '0'}%  ·  SZEROKA ${A.farmy ? (100 * A.fRzekaS / A.farmy).toFixed(1) : '0'}%`);
  console.log(`  KLUCZE (ze strumienia rozkazow, kontrola): ${Object.entries(A.klucze).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
  console.log(`  PLON TERYTORIUM/ture (suma po ziarnach): zywnosc ${A.plon.zywnosc} · praca ${A.plon.praca} · handel ${A.plon.handel} · drewno ${A.plon.drewno}`);
  return A;
}

console.log(`# EVALUATOR runda 3 — POMIAR ZE STANU MAPY (snapshot warstw + nakladki po kazdej turze)`);
console.log(`# src: ${SRC}`);
console.log(`# ziarna: ${SEEDS.join(', ')} · tur: ${TURNS} · mapa 36x28 „kontynenty", 3 miasta, pop 6 · strip lasu: ${STRIP}`);
console.log(`# MODEL TERYTORIUM: ${REALTERR ? 'WIERNY (jeden wezel na miasto, promien max(5,pop)=6 — jak buildAllTerritoryNodes)' : 'HARNESSOWY (wezel na kazdy heks promienia 4, kazdy pop 6 → promien ~10) — jak u Operatora'} · BRAMKA SILNIKA: ${REALGATE ? 'WLACZONA' : 'wylaczona'}`);

const civ = SEEDS.map(seed => ({ seed, ...runCiv(seed) }));
const aggCiv = agregat('AI CYWILIZACJI — decideAITurn (prawdziwe wejscie, maxItemsPerCity=1)', civ);
console.log(`  ASERCJA maxItemsPerCity=1 (behawioralna): max rozkazow na miasto na ture = ${Math.max(...civ.map(c => c.maxNaMiastoNaTure))}`);
console.log(`  ROZKAZY vs STAN: rozkazow ${civ.reduce((s, c) => s + c.rozkazow, 0)} · odrzuconych przez silnik ${civ.reduce((s, c) => s + c.odrzuconych, 0)} · obozow skasowanych przez wyrab ${civ.reduce((s, c) => s + c.strippedOboz, 0)}`);
console.log(`  WYRAB: ze STANU ${civ.reduce((s, c) => s + wyrabZeStanu(c.snapNakladka, c.snapKlucze).wyrab, 0)} · z ROZKAZOW ${civ.reduce((s, c) => s + (c.klucze.wyrab || 0), 0)}`);
console.log(`  WYRAB per ziarno (stan|rozkazy): ${civ.map(c => `${c.seed}: ${wyrabZeStanu(c.snapNakladka, c.snapKlucze).wyrab}|${c.klucze.wyrab || 0}`).join(' · ')}`);
const pozaAgg = {};
for (const c of civ) for (const [k, v] of Object.entries(c.pozaTerytorium)) pozaAgg[k] = (pozaAgg[k] || 0) + v;
console.log(`  BRAMKA TERYTORIUM SILNIKA (promien miasta max(5,pop)=${civ[0].REAL_RADIUS}; harness daje pickerowi wezel-na-heks → promien ~10):`);
console.log(`    rozkazy POZA realnym terytorium miasta: ${Object.values(pozaAgg).reduce((a, b) => a + b, 0)} z ${civ.reduce((s, c) => s + c.rozkazow, 0)} — per klucz: ${Object.entries(pozaAgg).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' · ') || 'brak'}`);
console.log(`    EV3_REALGATE=${REALGATE ? '1 (bramka WLACZONA — powyzsze rozkazy odrzucone)' : '0 (bramka wylaczona, jak u Operatora)'} · odrzuconych przez bramke ${civ.reduce((s, c) => s + c.odrzuconychGate, 0)}`);
console.log(`  PULAP OBRONNY ceil(pop/10)=${civ[0].pulap.limit}:`);
console.log(`    (a) atrybucja do NAJBLIZSZEGO miasta: max ${Math.max(...civ.map(c => c.pulap.max))} · naruszen ${civ.reduce((s, c) => s + c.pulap.naruszen, 0)} ${civ.flatMap(c => c.pulap.detale.map(d => c.seed + '/' + d)).join(' ')}`);
console.log(`    (b) po promieniu miasta (promienie sie NAKLADAJA, jak candidateHexes w kodzie): max ${Math.max(...civ.map(c => c.pulap.maxOverlap))} · naruszen ${civ.reduce((s, c) => s + c.pulap.naruszenOverlap, 0)}`);
console.log(`  PER ZIARNO wyrab(stan)/farmy@PO/posterunek/fort: ${civ.map(c => { const w = wyrabZeStanu(c.snapNakladka, c.snapKlucze); let po = 0, fo = 0; for (const [, v] of c.placed) for (const k of v) { if (k === 'posterunek') po++; if (k === 'fort') fo++; } return `${c.seed}: ${w.wyrab}/${w.farmyPoWyrebie}/${po}/${fo}`; }).join(' · ')}`);

if (process.env.EV3_ONLY === 'civ') { console.log('\n(EV3_ONLY=civ — sciezka AI GRACZA pominieta)'); process.exit(0); }
const PROFILE = ['zywnosc', 'surowce', 'infrastruktura', 'zrownowazone'];
const aggP = {};
for (const f of PROFILE) {
  const przeb = SEEDS.map(seed => ({ seed, ...runPlayer(seed, f) }));
  aggP[f] = agregat(`AI GRACZA — profil „${f}" (konfiguracja odtworzona z main.ts, skipWyrab: true)`, przeb);
}
function wek(a) { const s = a.kat.zywnosc + a.kat.surowce + a.kat.infra + a.kat.wyrab; return s ? [a.kat.zywnosc / s, a.kat.surowce / s, a.kat.infra / s, a.kat.wyrab / s] : [0, 0, 0, 0]; }
const vC = wek(aggCiv);
console.log('\n### PODOBIENSTWO ROZKLADOW: profil AI GRACZA vs AI CYWILIZACJI');
console.log('profil          | cosinus | odleglosc TV (0=identyczne, 1=rozlaczne)');
for (const f of PROFILE) {
  const v = wek(aggP[f]);
  const cos = v.reduce((s, x, i) => s + x * vC[i], 0) / (Math.hypot(...v) * Math.hypot(...vC) || 1);
  const tv = 0.5 * v.reduce((s, x, i) => s + Math.abs(x - vC[i]), 0);
  console.log(`${f.padEnd(15)} | ${cos.toFixed(4).padStart(7)} | ${tv.toFixed(4)}`);
}
console.log(`  wektor AI CYWILIZACJI [zyw,sur,infra,wyrab] = [${vC.map(x => x.toFixed(3)).join(', ')}]`);
for (const f of PROFILE) console.log(`  wektor AI GRACZA „${f}" = [${wek(aggP[f]).map(x => x.toFixed(3)).join(', ')}]`);
