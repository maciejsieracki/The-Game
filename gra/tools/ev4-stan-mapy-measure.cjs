'use strict';
/**
 * ev4-stan-mapy-measure.cjs — NIEZALEZNY POMIAR EVALUATORA, runda 4 tematu
 * R-AI-WYRAB-PRZY-RZECE-FARMY-Q1. To NIE jest bramka — to narzedzie pomiarowe.
 *
 * CELOWO INNA METODA NIZ POMIAR OPERATORA (`ai4-popyt-obywatele-measure.cjs`):
 *
 *  1. OPERATOR liczy STRUMIEN ROZKAZOW (kazde `buildImprovement` z `decideAITurn`).
 *     EVALUATOR liczy SNAPSHOT STANU MAPY po ostatniej turze: przechodzi po WSZYSTKICH
 *     heksach i zlicza faktycznie stojace warstwy `placedImprovements` + faktycznie
 *     usuniete lasy. Rozkaz mogl nie zostac wykonany albo zostac skasowany
 *     (`stripImprovementsWhenForestRemoved`) — snapshot pokazuje SKUTEK, nie intencje.
 *  2. OPERATOR klasyfikuje kategorie ZAKODOWANA LISTA KLUCZY skopiowana z zrodla
 *     (`KAT_ZYWNOSC = [...]`) — to ta sama lista, ktora testuje. EVALUATOR klasyfikuje
 *     z DANYCH GRY: `data/terrain-improvements.json`, `bonus.zywnosc > 0` = zywnosciowe.
 *     Gdyby ktos dopisal do `ULEPSZENIA_FOCUS_ZYWNOSC` klucz bez plonu zywnosci, pomiar
 *     Operatora nadal pokazalby „100% zywnosc", moj pokazalby wyciek.
 *  3. INNE MAPY I ZIARNA: 44x32 „pangea" zamiast 36x28 „kontynenty", 4 miasta zamiast 3,
 *     populacja 8 zamiast 6, ziarna 1..5 zamiast 7/99/512/4242/1337.
 *  4. „Przy obywatelach" liczone NA KONIEC (stan koncowy pol obrabianych), nie w turze
 *     wydania rozkazu — inna definicja, ten sam wynik oczekiwany dla Zasady 2.
 *
 * Env: EV4_SEEDS="1,2,3,4,5"  EV4_TURNS=40  EV4_SRC_DIR  EV4_TAG
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const SRC = process.env.EV4_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const TAG = process.env.EV4_TAG || 'po';
const ENTRY = path.resolve(__dirname, `.ev4-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.ev4-${TAG}-bundle.cjs`);

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export * as AUTO from ${JSON.stringify(SRC + '/game/auto-improvements')};
export * as IMPB from ${JSON.stringify(SRC + '/map/improvement-build')};
export { workedHexCoordsForCity } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { getImprovementMeta, isImprovementTechUnlocked } from ${JSON.stringify(SRC + '/game/improvement-tech')};
export { isImprovementAllowedForCiv } from ${JSON.stringify(SRC + '/game/terrain-improvements')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const M = require(BUNDLE);
const { TerenBazowy, Nakladka } = M;
const AUTO = M.AUTO;
const IMPB = M.IMPB;

// --- KLASYFIKACJA Z DANYCH GRY, nie z listy w zrodle -------------------------
const IMP_DATA = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data/terrain-improvements.json'), 'utf8'));
/** Zywnosciowe = ulepszenie, ktore realnie podnosi plon ZYWNOSCI heksa (dane gry). */
function jestZywnosciowe(key) {
  const v = IMP_DATA[key];
  return !!(v && v.bonus && Number(v.bonus.zywnosc) > 0);
}
function jestWycinka(key) {
  const v = IMP_DATA[key];
  return !!(v && v.typ === 'wycinka');
}
function kategoriaZDanych(key) {
  if (jestWycinka(key)) return 'wyrab';
  if (jestZywnosciowe(key)) return 'zywnosc';
  const v = IMP_DATA[key];
  // surowcowe = daje surowiec logistyczny; reszta = infrastruktura/obrona
  if (v && (v.surowiecOdblokowany || v.surowiec_ilosc_tura)) return 'surowce';
  return 'infra';
}

const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo',
  'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta',
  'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Drogi brukowane', 'Matematyka',
]);
const SEEDS = (process.env.EV4_SEEDS || '1,2,3,4,5').split(',').map(s => Number(s.trim()));
const TURNS = Number(process.env.EV4_TURNS || 40);
const MAP_W = 44, MAP_H = 32, MAP_PRESET = 'pangea';
const POP = 8, N_CITIES = 4;

/** Wezel terytorium DOKLADNIE w ksztalcie silnika: JEDEN na miasto. */
function territoryFor(map, c) {
  const h = map.hexes[`${c.q},${c.r}`];
  if (!h || h.terenBazowy === TerenBazowy.Morze) return [];
  return [{ q: c.q, r: c.r, ownerId: c.ownerId, cityId: c.id, pop: c.population, level: 1 }];
}

function pickCitySpots(map, n) {
  const keys = Object.keys(map.hexes).sort();
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

function workedUnion(cities, map, nodes) {
  const out = new Set();
  for (const c of cities) {
    for (const { q, r } of M.workedHexCoordsForCity(c, map, nodes)) out.add(`${q},${r}`);
  }
  return out;
}
function zlozoweDlaKlucza(map, hk, key) {
  const hex = map.hexes[hk];
  if (!hex) return false;
  if (typeof IMPB.hexHasDepositReserve !== 'function') return false;
  return IMPB.hexHasDepositReserve(hex) && IMPB.depositAllowsPlayerImprovement(key, hex);
}

/**
 * AI CYWILIZACJI, prawdziwe wejscie `decideAITurn`.
 * Zwraca SNAPSHOT: mapa hexKey -> lista warstw + lista wycietych lasow + raporty nadwyzki.
 */
function runCiv(seed, deficitFor) {
  const map = M.generateMap(MAP_W, MAP_H, seed, MAP_PRESET);
  const spots = pickCitySpots(map, N_CITIES);
  const OWNER = 1;
  const cities = spots.map((s, i) => ({
    id: `c${i}`, ownerId: OWNER, q: s.q, r: s.r, name: `C${i}`, population: POP,
  }));
  const nodes = [];
  cities.forEach(c => nodes.push(...territoryFor(map, c)));
  const placed = new Map();
  const wycinki = [];            // hexKey faktycznie pozbawiony lasu
  const data = { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } };
  const raporty = [];
  const lasPrzed = new Set(
    Object.entries(map.hexes).filter(([, h]) => h && h.nakladka === Nakladka.Las).map(([k]) => k),
  );
  for (let t = 0; t < TURNS; t++) {
    const rep = typeof AUTO.freshSurplusReport === 'function' ? AUTO.freshSurplusReport() : null;
    const opts = {
      civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {},
      territoryNodes: nodes, placedImprovements: placed, improvementTechs: TECHS,
      pracaAvailable: 100000, civEra: 3, resourceDeficitKeys: deficitFor(t),
    };
    if (rep) opts.improvementSurplusReport = rep;
    const cmds = M.decideAITurn(OWNER, [], cities, map, data, opts)
      .filter(c => c.type === 'buildImprovement');
    if (rep) {
      raporty.push({
        t, ...rep, rozkazow: cmds.length,
        wyrabowWTurze: cmds.filter(c => jestWycinka(c.key)).length,
        niedobor: (deficitFor(t) || []).length > 0,
      });
    }
    for (const c of cmds) {
      const hk = `${c.q},${c.r}`;
      if (jestWycinka(c.key)) {
        if (map.hexes[hk]) map.hexes[hk].nakladka = Nakladka.Brak;
        wycinki.push({ hk, t });
      } else {
        const cur = placed.get(hk);
        const arr = Array.isArray(cur) ? [...cur] : (cur ? [cur] : []);
        arr.push(c.key);
        placed.set(hk, arr);
      }
    }
  }
  // SNAPSHOT KONCOWY
  const workedEnd = workedUnion(cities, map, nodes);
  const stan = [];
  for (const [hk, layers] of placed.entries()) {
    for (const key of layers) {
      stan.push({
        hk, key,
        kat: kategoriaZDanych(key),
        przyObywatelach: workedEnd.has(hk),
        zlozowe: zlozoweDlaKlucza(map, hk, key),
      });
    }
  }
  for (const w of wycinki) {
    stan.push({
      hk: w.hk, key: 'wyrab', kat: 'wyrab',
      przyObywatelach: workedEnd.has(w.hk),
      zlozowe: zlozoweDlaKlucza(map, w.hk, 'wyrab'),
    });
  }
  const lasPo = new Set(
    Object.entries(map.hexes).filter(([, h]) => h && h.nakladka === Nakladka.Las).map(([k]) => k),
  );
  return { stan, raporty, lasPrzed: lasPrzed.size, lasPo: lasPo.size };
}

function podsumujStan(wyniki) {
  const kat = { zywnosc: 0, surowce: 0, infra: 0, wyrab: 0 };
  const counts = {};
  let razem = 0, poza = 0, pozaNieZlozowe = 0, pozaZlozowe = 0;
  for (const w of wyniki) for (const e of w.stan) {
    razem++; kat[e.kat]++; counts[e.key] = (counts[e.key] || 0) + 1;
    if (!e.przyObywatelach) { poza++; if (e.zlozowe) pozaZlozowe++; else pozaNieZlozowe++; }
  }
  return { razem, kat, counts, poza, pozaNieZlozowe, pozaZlozowe };
}
function drukuj(naglowek, s) {
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) : '0.0');
  console.log(`\n### ${naglowek}`);
  console.log(`  WARSTW NA MAPIE (snapshot): ${s.razem}`);
  console.log(`  zyw/sur/infra/wyrab: ${s.kat.zywnosc}/${s.kat.surowce}/${s.kat.infra}/${s.kat.wyrab}`
    + `  ->  zywnosc ${pct(s.kat.zywnosc, s.razem)}% · surowce ${pct(s.kat.surowce, s.razem)}%`
    + ` · infra ${pct(s.kat.infra, s.razem)}% · wyrab ${pct(s.kat.wyrab, s.razem)}%`);
  console.log(`  ZASADA 2: warstwy na heksach BEZ obywateli ${s.poza} (${pct(s.poza, s.razem)}%);`
    + ` z tego ZLOZOWE (wyjatek) ${s.pozaZlozowe} · NIE-ZLOZOWE ${s.pozaNieZlozowe}`
    + ` (${pct(s.pozaNieZlozowe, s.razem)}%)`);
  console.log(`  PER KLUCZ: ${Object.entries(s.counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
}

console.log(`# POMIAR EVALUATORA (${TAG.toUpperCase()}) — snapshot stanu mapy`);
console.log(`# zrodlo: ${SRC}`);
console.log(`# mapa ${MAP_W}x${MAP_H} „${MAP_PRESET}", ${N_CITIES} miasta, pop ${POP}, ziarna ${SEEDS.join(',')}, tur ${TURNS}`);

const BEZ = () => [];
const STALY = () => ['drewno'];
const OKNO = t => (t >= 15 && t < 25 ? ['kamien'] : []);

const A = SEEDS.map(s => runCiv(s, BEZ));
drukuj('A: AI CYWILIZACJI, BEZ NIEDOBORU (40 tur)', podsumujStan(A));
const B = SEEDS.map(s => runCiv(s, STALY));
drukuj('B: AI CYWILIZACJI, STALY NIEDOBOR DREWNA', podsumujStan(B));
const C = SEEDS.map(s => runCiv(s, OKNO));
drukuj('C: AI CYWILIZACJI, NIEDOBOR KAMIENIA tylko t15-t24', podsumujStan(C));

// SLAD CZASOWY scenariusza C — na strumieniu raportow, per tura
if (C[0] && C[0].raporty.length) {
  console.log(`\n  SLAD CZASOWY C (tura: rozkazow/wyrabow; * = niedobor aktywny)`);
  const agg = new Map();
  for (const w of C) for (const r of w.raporty) {
    const cur = agg.get(r.t) || { roz: 0, wyr: 0 };
    cur.roz += r.rozkazow; cur.wyr += r.wyrabowWTurze; agg.set(r.t, cur);
  }
  const linie = [];
  for (let t = 0; t < TURNS; t++) {
    const c = agg.get(t) || { roz: 0, wyr: 0 };
    linie.push(`t${t}${t >= 15 && t < 25 ? '*' : ' '}:${c.roz}/${c.wyr}`);
  }
  for (let i = 0; i < linie.length; i += 10) console.log('    ' + linie.slice(i, i + 10).join('  '));
}

// --- ZASADA 3: raport nadwyzki + KONTROLA SPOJNOSCI z faktycznymi rozkazami ---
if (A[0] && A[0].raporty.length) {
  console.log(`\n### ZASADA 3 — raport nadwyzki (scenariusz A: zero niedoboru)`);
  let turSurplus = 0, turSurplusZRozkazami = 0, turSurplusZWyrabem = 0, turRazem = 0;
  for (const w of A) for (const r of w.raporty) {
    turRazem++;
    if (!r.surplus) continue;
    turSurplus++;
    if (r.rozkazow > 0) turSurplusZRozkazami++;
    if (r.wyrabowWTurze > 0) turSurplusZWyrabem++;
  }
  console.log(`  tur razem ${turRazem} · tur z surplus=true ${turSurplus}`);
  console.log(`  KONTROLA SPOJNOSCI: tury z surplus=true, w ktorych AI JEDNAK wydalo rozkaz: `
    + `${turSurplusZRozkazami} (w tym rozkaz WYRABU: ${turSurplusZWyrabem})`);
  console.log(`  (surplus=true ma znaczyc „budzet ulepszen nie ma dzis czego kupic";`
    + ` rozkaz w tej samej turze = raport wewnetrznie sprzeczny)`);
} else {
  console.log('\n### ZASADA 3 — BRAK DANYCH (drzewo PRZED nie zna freshSurplusReport)');
}

// --- LAS ---------------------------------------------------------------------
{
  let p = 0, k = 0;
  for (const w of A) { p += w.lasPrzed; k += w.lasPo; }
  console.log(`\n### LAS (scenariusz A): heksow lasu przed ${p} -> po ${k} (ubytek ${p - k})`);
}
