'use strict';
/**
 * ev-rzeka-slad-czasowy-measure.cjs — POMIAR EVALUATORA (nie bramka) dla
 * R-AI-WYRAB-PRZY-RZECE-FARMY-Q1, runda 1. Niezalezna weryfikacja raportu Operatora.
 *
 * Harness (mapa 36x28 „kontynenty", 3 miasta, promien 4, pop 6, maxItemsPerCity=1, 40 tur)
 * jest 1:1 z tools/oboz-lowiecki-ai-40tur-measure.cjs, zeby liczby byly porownywalne
 * z baza 99/56 i z pomiarem Operatora.
 *
 * CO MIERZY — cztery rzeczy, ktorych pomiar Operatora nie daje:
 *
 * E1  METRYKA EVALUATORA „heksy w toku rownolegle" (niezalezna od metryki Operatora):
 *     heks jest W TOKU w turze T, jesli dostal juz pierwsze ulepszenie w turze <= T
 *     i dostanie JESZCZE JEDNO w turze > T. Czyli AI go zaczelo, poszlo gdzie indziej
 *     i wroci. To jest doslowne „robi 15 heksow naraz" wlasciciela — liczba heksow,
 *     ktore AI zonglowa w tej samej turze. Metryka NIE pyta, czy da sie postawic
 *     cokolwiek jeszcze (to robi metryka Operatora) — pyta, co AI FAKTYCZNIE zrobilo.
 *     Dolna granica idealu: <= liczba miast (kazde miasto konczy swoj jeden heks).
 *
 * E2  ROZPIETOSC HEKSA: dla heksow z >= 2 ulepszeniami — ile tur minelo miedzy
 *     pierwszym a ostatnim, i ile INNYCH heksow AI tknelo w tym czasie.
 *     „Kompleksowo" = rozpietosc bliska liczbie ulepszen, obce heksy bliskie 0.
 *
 * E3  DIAGNOZA METRYKI OPERATORA: dla heksow „rozgrzebanych" wg jego definicji
 *     — KTORE klucze jeszcze sie kwalifikuja. Jesli to zawsze ten sam klucz
 *     (np. droga), metryka jest zdegenerowana i nie moze zejsc do zera.
 *
 * E4  SLAD CZASOWY heksow z rzeka (tura wyrebu / farmy / trzody) + kontrola odwrotna
 *     (drogi, kopalnie, lodzie) + limit tartak/oboz na 10 obywateli per miasto.
 *
 * Run: node tools/ev-rzeka-slad-czasowy-measure.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.EV_SRC_DIR || path.resolve(__dirname, '..', 'src');
const TAG = process.env.EV_TAG || 'ev';
const ENTRY = path.resolve(__dirname, `.ev-rzeka-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.ev-rzeka-${TAG}-bundle.cjs`);

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { pickAutoImprovements, AI_IMPROVEMENT_PRIORITY } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { buildImprovementQualifier } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'warning',
});
const M = require(BUNDLE);
const { TerenBazowy, Nakladka } = M;

const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo',
  'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta',
  'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Drogi brukowane', 'Matematyka',
]);
const PASTWISKA = ['owce', 'bydlo', 'lama'];
const INFRA_KONTROLA = ['droga', 'droga_brukowana', 'posterunek', 'fort', 'lodzie_rybackie',
  'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny', 'kamieniolom', 'glinianka',
  'tartak', 'irygacja', 'tarasy', 'stadnina', 'warzelnia_soli', 'wyrab'];

function territoryFor(map, cx, cy, rad, ownerId, cityId) {
  const out = [];
  for (let dq = -rad; dq <= rad; dq++) {
    for (let dr = -rad; dr <= rad; dr++) {
      if (Math.abs(dq + dr) > rad) continue;
      const h = map.hexes[`${cx + dq},${cy + dr}`];
      if (!h || h.terenBazowy === TerenBazowy.Morze) continue;
      out.push({ q: cx + dq, r: cy + dr, ownerId, cityId });
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

function riverHexKeys(map) {
  const set = new Set();
  for (const p of (map.riverPaths || [])) for (const x of p) set.add(`${x.q},${x.r}`);
  return set;
}

function simulate(seed, turns) {
  const map = M.generateMap(36, 28, seed, 'kontynenty');
  const rivers = riverHexKeys(map);
  const spots = pickCitySpots(map, 3);
  const cities = spots.map((s, i) => ({ id: `c${i}`, ownerId: 1, q: s.q, r: s.r, population: 6 }));
  const territoryNodes = [];
  cities.forEach(c => territoryNodes.push(...territoryFor(map, c.q, c.r, 4, 1, c.id)));

  const placed = new Map();
  const counts = {};
  const perCity = {};           // cityId -> { tartak, oboz_lowiecki }
  const events = [];            // { t, hk, key, cityId } — pelny slad czasowy
  let turnsRun = 0;

  for (let t = 0; t < turns; t++) {
    const picks = M.pickAutoImprovements({
      cities, ownerId: 1, map, territoryNodes,
      placedImprovements: placed,
      pracaAvailable: 100000,
      unlockedTechs: TECHS,
      pracaSurplusThreshold: 0,
      pracaBudgetPercent: 100,
      maxItemsPerCity: 1,
      skipWyrab: false,
      playerEra: 3,
      priorityOverride: M.AI_IMPROVEMENT_PRIORITY,
    });
    turnsRun = t + 1;
    if (!picks.length) break;
    for (const p of picks) {
      const hk = `${p.q},${p.r}`;
      const prev = placed.get(hk) ?? [];
      if (prev.includes(p.key)) continue;
      placed.set(hk, [...prev, p.key]);
      counts[p.key] = (counts[p.key] ?? 0) + 1;
      events.push({ t, hk, key: p.key, cityId: p.cityId });
      perCity[p.cityId] = perCity[p.cityId] ?? { tartak: 0, oboz_lowiecki: 0, razem: 0 };
      perCity[p.cityId].razem++;
      if (p.key === 'tartak') perCity[p.cityId].tartak++;
      if (p.key === 'oboz_lowiecki') perCity[p.cityId].oboz_lowiecki++;
    }
  }

  // --- E1: heksy w toku rownolegle ---
  const first = new Map(), last = new Map();
  for (const e of events) {
    if (!first.has(e.hk)) first.set(e.hk, e.t);
    last.set(e.hk, e.t);
  }
  const wTokuPerTura = [];
  for (let t = 0; t < turnsRun; t++) {
    let n = 0;
    for (const [hk, f] of first) if (f <= t && last.get(hk) > t) n++;
    wTokuPerTura.push(n);
  }
  const e1max = wTokuPerTura.length ? Math.max(...wTokuPerTura) : 0;
  const e1sr = wTokuPerTura.length
    ? wTokuPerTura.reduce((a, b) => a + b, 0) / wTokuPerTura.length : 0;

  // --- E2: rozpietosc heksow wieloulepszeniowych ---
  const wielo = [];
  for (const [hk, f] of first) {
    const l = last.get(hk);
    const n = (placed.get(hk) || []).length;
    if (n < 2) continue;
    const obce = new Set();
    for (const e of events) if (e.t > f && e.t < l && e.hk !== hk) obce.add(e.hk);
    wielo.push({ hk, n, rozpietosc: l - f, obce: obce.size });
  }
  const e2rozp = wielo.length ? wielo.reduce((s, w) => s + w.rozpietosc, 0) / wielo.length : 0;
  const e2obce = wielo.length ? wielo.reduce((s, w) => s + w.obce, 0) / wielo.length : 0;

  // --- E3: metryka Operatora + diagnoza, KTORY klucz trzyma heks „rozgrzebany" ---
  const qual = M.buildImprovementQualifier({
    map, cityNodes: cities.map(c => ({ q: c.q, r: c.r, pop: c.population, level: 1 })),
    territoryNodes, playerOwnerIdNum: 1, placedImprovements: placed,
    researchedTechs: TECHS, playerEra: 3,
  });
  let tkniete = 0, rozgrzebaneOp = 0;
  const trzymaKlucz = {};
  for (const [hk, layers] of placed) {
    if (!layers || !layers.length) continue;
    tkniete++;
    const [q, r] = hk.split(',').map(Number);
    const otwarte = M.AI_IMPROVEMENT_PRIORITY.filter(
      k => k !== 'wyrab' && !layers.includes(k) && qual(k, q, r));
    if (otwarte.length) {
      rozgrzebaneOp++;
      for (const k of otwarte) trzymaKlucz[k] = (trzymaKlucz[k] ?? 0) + 1;
    }
  }
  // Ile heksow byloby „rozgrzebanych" gdyby z listy wyjac takze infrastrukture (droga/fort/posterunek)
  const BEZ_INFRA = new Set(['wyrab', 'droga', 'droga_brukowana', 'posterunek', 'fort']);
  let rozgrzebaneBezInfra = 0;
  for (const [hk, layers] of placed) {
    if (!layers || !layers.length) continue;
    const [q, r] = hk.split(',').map(Number);
    if (M.AI_IMPROVEMENT_PRIORITY.some(k => !BEZ_INFRA.has(k) && !layers.includes(k) && qual(k, q, r))) {
      rozgrzebaneBezInfra++;
    }
  }

  // --- E4: slad czasowy heksow z rzeka ---
  const rzekaSlad = [];
  for (const [hk, layers] of placed) {
    if (!rivers.has(hk)) continue;
    const ev = events.filter(e => e.hk === hk);
    rzekaSlad.push({
      hk,
      las: map.hexes[hk] ? map.hexes[hk].nakladka === Nakladka.Las : false,
      ciag: ev.map(e => `${e.key}@t${e.t}`).join(' -> '),
    });
  }
  rzekaSlad.sort((a, b) => a.hk.localeCompare(b.hk));

  let farmyPrzyRzece = 0;
  for (const [hk, layers] of placed) if (rivers.has(hk) && layers.includes('farma')) farmyPrzyRzece++;
  let rzekaTkniete = 0;
  for (const hk of placed.keys()) if (rivers.has(hk)) rzekaTkniete++;
  // Ile heksow z rzeka W TERYTORIUM w ogole istnieje (gorna granica)
  let rzekaWTerytorium = 0;
  const seen = new Set();
  for (const n of territoryNodes) {
    const hk = `${n.q},${n.r}`;
    if (seen.has(hk)) continue; seen.add(hk);
    if (rivers.has(hk)) rzekaWTerytorium++;
  }

  const oboz = counts['oboz_lowiecki'] ?? 0;
  let pastw = 0; for (const k of PASTWISKA) pastw += counts[k] ?? 0;

  return {
    seed, turnsRun, oboz, pastw, counts, perCity,
    tkniete, rozgrzebaneOp, rozgrzebaneBezInfra, trzymaKlucz,
    e1max, e1sr, e1last: wTokuPerTura[wTokuPerTura.length - 1] ?? 0,
    wieloN: wielo.length, e2rozp, e2obce,
    rzekaSlad, farmyPrzyRzece, rzekaTkniete, rzekaWTerytorium,
    ulepszenRazem: events.length,
  };
}

const seeds = (process.env.EV_SEEDS || '7,99,512,4242,1337').split(',').map(Number);
const TURNS = Number(process.env.EV_TURNS || 40);
const SLAD = Number(process.env.EV_SLAD || 8);
console.log(`\n=== EVALUATOR ${TAG} · ${TURNS} tur · ziarna ${seeds.join(',')} · src=${SRC} ===`);

let sE1max = 0, sTk = 0, sRozOp = 0, sRozBI = 0, sOboz = 0, sPastw = 0, sFarmRz = 0;
const trzymaGlob = {};
for (const s of seeds) {
  const r = simulate(s, TURNS);
  sE1max = Math.max(sE1max, r.e1max);
  sTk += r.tkniete; sRozOp += r.rozgrzebaneOp; sRozBI += r.rozgrzebaneBezInfra;
  sOboz += r.oboz; sPastw += r.pastw; sFarmRz += r.farmyPrzyRzece;
  for (const [k, v] of Object.entries(r.trzymaKlucz)) trzymaGlob[k] = (trzymaGlob[k] ?? 0) + v;

  console.log(`\n--- seed ${r.seed} (${r.turnsRun} tur, ${r.ulepszenRazem} ulepszen) ---`);
  console.log(`E1 heksy W TOKU rownolegle: max=${r.e1max} · srednia=${r.e1sr.toFixed(1)} · na koniec=${r.e1last}`);
  console.log(`E2 heksy z >=2 ulepszeniami: ${r.wieloN} · srednia rozpietosc=${r.e2rozp.toFixed(1)} tur · srednio obcych heksow w miedzyczasie=${r.e2obce.toFixed(1)}`);
  console.log(`E3 metryka Operatora: rozgrzebane=${r.rozgrzebaneOp}/${r.tkniete} tknietych · bez infrastruktury(droga/fort/posterunek)=${r.rozgrzebaneBezInfra}/${r.tkniete}`);
  console.log(`   trzyma-otwarte (klucz: ile heksow): ${Object.entries(r.trzymaKlucz).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}:${v}`).join(' ')}`);
  console.log(`E4 rzeka: heksow z rzeka w terytorium=${r.rzekaWTerytorium} · tknietych przez AI=${r.rzekaTkniete} · z farma=${r.farmyPrzyRzece}`);
  console.log(`   oboz=${r.oboz} pastwiska=${r.pastw}`);
  console.log(`   per miasto (limit ceil(pop6/10)=1): ${Object.entries(r.perCity).map(([c,v])=>`${c}[tartak=${v.tartak} oboz=${v.oboz_lowiecki} razem=${v.razem}]`).join(' ')}`);
  console.log(`   kontrola odwrotna: ${INFRA_KONTROLA.map(k => `${k}=${r.counts[k] ?? 0}`).join(' ')}`);
  console.log(`   SLAD CZASOWY (pierwsze ${SLAD} heksow z rzeka tknietych przez AI):`);
  for (const x of r.rzekaSlad.slice(0, SLAD)) {
    console.log(`     ${x.hk}${x.las ? ' [Las]' : '      '} : ${x.ciag}`);
  }
}
console.log(`\n=== RAZEM (${seeds.length} ziaren x ${TURNS} tur) ===`);
console.log(`E1 max heksow w toku rownolegle (najgorsze ziarno): ${sE1max}`);
console.log(`E3 metryka Operatora: ${sRozOp}/${sTk} · po wyjeciu infrastruktury: ${sRozBI}/${sTk}`);
console.log(`oboz=${sOboz} pastwiska=${sPastw} farmy_przy_rzece=${sFarmRz}`);
console.log(`trzyma-otwarte globalnie: ${Object.entries(trzymaGlob).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}:${v}`).join(' ')}`);

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}
