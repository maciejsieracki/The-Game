'use strict';
/**
 * fc3-kronika-trzy-stany.cjs — NARZEDZIE FINAL CONTROL, runda 3 tematu
 * R-AI-WYRAB-PRZY-RZECE-FARMY-Q1. Nie jest bramka — jest KRONIKA.
 *
 * Kontynuacja `fc2-kronika-dwie-sciezki.cjs` (runda 2). PYTANIA WLASCICIELA:
 *   1. Czy heks NADAL jest domykany kompleksowo, mimo ze `posterunek` i `fort`
 *      WYSZLY z sekwencji domykania (wariant W-B)?
 *   2. Czy w KRONICE widac `wyrab` i FARME POWSTAJACA PO NIM?
 * Porownanie TRZECH stanow tego samego pliku zrodlowego: PRZED (runda 1) /
 * W-A (runda 2) / W-B (runda 3) — przez `FC3_SRC_DIR`.
 *
 * DWIE SCIEZKI, OSOBNO (regula stala wlasciciela 2026-08-27):
 *   AI CYWILIZACJI — PRAWDZIWE wejscie `decideAITurn` (ai.ts), maxItemsPerCity=1.
 *   AI GRACZA      — konfiguracja `main.ts` (~:27066-27094) ODTWORZONA; `main.ts`
 *                    to closure `boot()`, niebundlowalna w Node → BRAK DOWODU.
 *
 * TRZECIA METODA (inna niz Operator i Evaluator rundy 3):
 *   Operator liczy ze STRUMIENIA ROZKAZOW, Evaluator ze SNAPSHOTU STANU MAPY.
 *   Ja licze CIAGLOSC HEKSA w porzadku chronologicznym — z jedna zmiana wobec
 *   rundy 2, wymuszona przez W-B: ciaglosc liczona jest DWA RAZY —
 *     K1 = po WSZYSTKICH rozkazach (metryka rundy 2, porownywalna wstecz),
 *     K2 = po rozkazach PLONOWYCH (bez `posterunek`/`fort`) — kontrakt W-B mowi,
 *          ze heks jest domkniety, gdy stoja na nim ulepszenia PLONOWE.
 *   Dochodzi GLEBOKOSC domkniecia (ile ulepszen plonowych na heks roboczy) —
 *   bo sama ciaglosc dalaby sie oszukac heksem z jednym ulepszeniem.
 *
 * MODEL SILNIKA przy wyrebie (czego kronika rundy 2 NIE robila, a Evaluator
 * rundy 3 slusznie dolozyl): wyrab wchodzi tylko gdy heks NADAL ma nakladke Las,
 * po nim `stripImprovementsWhenForestRemoved` zdejmuje ulepszenia lesne.
 *
 * Run z gra/:  node tools/fc3-kronika-trzy-stany.cjs
 * Env: FC3_SEEDS FC3_TURNS FC3_SRC_DIR FC3_TAG FC3_KRONIKA_SEED FC3_PROFILE FC3_STAN
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const SRC = process.env.FC3_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const TAG = process.env.FC3_TAG || 'fc3';
const STAN = process.env.FC3_STAN || TAG;
const ENTRY = path.resolve(__dirname, `.fc3-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.fc3-${TAG}-bundle.cjs`);

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export { pickAutoImprovements, AUTO_ULEPSZENIA_PRACA_RESERVE } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { isImprovementTechUnlocked } from ${JSON.stringify(SRC + '/game/improvement-tech')};
export { isImprovementAllowedForCiv } from ${JSON.stringify(SRC + '/game/terrain-improvements')};
export { stripImprovementsWhenForestRemoved } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { tileYield } from ${JSON.stringify(SRC + '/game/economy')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
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
const SEEDS = (process.env.FC3_SEEDS || '1337,2026,5150,7,99').split(',').map(s => Number(s.trim()));
const TURNS = Number(process.env.FC3_TURNS || 40);
const KRONIKA_SEED = Number(process.env.FC3_KRONIKA_SEED || SEEDS[0]);
const PROFILE = process.env.FC3_PROFILE || 'zrownowazone';

/** Zbior zeroplonowy — zmierzony niezaleznie w rundzie 2 (delta tileYield 0/0/0/0). */
const ZEROPLON = new Set(['posterunek', 'fort']);
const KAT = {
  zywnosc: ['farma', 'bydlo', 'owce', 'lama', 'tarasy', 'oboz_lowiecki', 'lodzie_rybackie', 'irygacja'],
  surowce: ['tartak', 'kamieniolom', 'glinianka', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny', 'kopalnia_zlota', 'stadnina', 'warzelnia_soli'],
  infra: ['posterunek', 'droga', 'droga_brukowana', 'fort'],
};
const kategoria = k => (KAT.zywnosc.includes(k) ? 'zywnosc' : KAT.surowce.includes(k) ? 'surowce' : KAT.infra.includes(k) ? 'infra' : k === 'wyrab' ? 'wyrab' : 'inne');

function territoryFor(map, cx, cy, rad, ownerId, cityId, pop) {
  const out = [];
  for (let dq = -rad; dq <= rad; dq++) for (let dr = -rad; dr <= rad; dr++) {
    if (Math.abs(dq + dr) > rad) continue;
    const h = map.hexes[`${cx + dq},${cy + dr}`];
    if (!h || h.terenBazowy === TerenBazowy.Morze) continue;
    out.push({ q: cx + dq, r: cy + dr, ownerId, cityId, pop, level: 1 });
  }
  return out;
}
function hexToCity(territoryNodes, cities) {
  const m = new Map();
  for (const n of territoryNodes) { const hk = `${n.q},${n.r}`; if (!m.has(hk)) m.set(hk, n.cityId); }
  const dist = (q, r, c) => (Math.abs(q - c.q) + Math.abs(r - c.r) + Math.abs((q - c.q) + (r - c.r))) / 2;
  return (hk) => {
    const got = m.get(hk); if (got) return got;
    const [q, r] = hk.split(',').map(Number);
    let best = cities[0], bd = Infinity;
    for (const c of cities) { const d = dist(q, r, c); if (d < bd) { bd = d; best = c; } }
    return best.id;
  };
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
    for (let dq = -3; dq <= 3; dq++) for (let dr = -3; dr <= 3; dr++) {
      if (Math.abs(dq + dr) > 3) continue;
      const nb = map.hexes[`${q + dq},${r + dr}`];
      if (nb && nb.terenBazowy !== TerenBazowy.Morze) land++;
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
function riverSetWdrozona(map) {
  const s = new Set();
  for (const p of (map.riverPaths || [])) for (const x of p) s.add(`${x.q},${x.r}`);
  return s;
}
function plonTerytorium(map, territoryNodes, placed, rivers) {
  const out = { zywnosc: 0, praca: 0, handel: 0, drewno: 0 };
  const seen = new Set();
  for (const n of territoryNodes) {
    const hk = `${n.q},${n.r}`;
    if (seen.has(hk)) continue; seen.add(hk);
    const h = map.hexes[hk]; if (!h) continue;
    const layers = placed.get(hk);
    const y = M.tileYield({
      terenBazowy: h.terenBazowy, nakladka: h.nakladka,
      maRzeke: rivers.has(hk) || !!h.rzeka?.obecna, zloze: h.zloze,
      ulepszeniaKeys: Array.isArray(layers) ? layers : (layers ? [layers] : []),
    });
    out.zywnosc += y.zywnosc || 0; out.praca += y.praca || 0;
    out.handel += y.handel || 0; out.drewno += y.drewno || 0;
  }
  return out;
}

/** Commit rozkazu na mapie — MODEL SILNIKA (wyrab zdejmuje las + strip lesnych). */
function commit(map, placed, hk, key, log) {
  if (key === 'wyrab') {
    if (map.hexes[hk]?.nakladka !== Nakladka.Las) { log.odrzuconych++; return false; }
    map.hexes[hk].nakladka = Nakladka.Brak;
    const prev = placed.get(hk) ?? [];
    const next = M.stripImprovementsWhenForestRemoved(prev);
    if (next.length !== prev.length) log.stripped += prev.length - next.length;
    placed.set(hk, next);
    return true;
  }
  const prev = placed.get(hk) ?? [];
  if (prev.includes(key)) { log.duplikatow++; return false; }
  placed.set(hk, [...prev, key]);
  return true;
}

function runCiv(seed) {
  const map = M.generateMap(36, 28, seed, 'kontynenty');
  const rivers = riverSetWdrozona(map);
  const spots = pickCitySpots(map, 3);
  const OWNER = 1;
  const cities = spots.map((s, i) => ({ id: `c${i}`, ownerId: OWNER, q: s.q, r: s.r, name: `C${i}`, population: 6 }));
  const territoryNodes = [];
  cities.forEach(c => territoryNodes.push(...territoryFor(map, c.q, c.r, 4, OWNER, c.id, 6)));
  const h2c = hexToCity(territoryNodes, cities);
  const placed = new Map();
  const data = { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } };
  const events = []; const log = { odrzuconych: 0, duplikatow: 0, stripped: 0 };
  for (let t = 0; t < TURNS; t++) {
    const cmds = M.decideAITurn(OWNER, [], cities, map, data, {
      civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {},
      territoryNodes, placedImprovements: placed, improvementTechs: TECHS,
      pracaAvailable: 100000, civEra: 3,
    }).filter(c => c.type === 'buildImprovement');
    for (const c of cmds) {
      const hk = `${c.q},${c.r}`;
      const las = map.hexes[hk]?.nakladka === Nakladka.Las;
      if (!commit(map, placed, hk, c.key, log)) continue;
      events.push({ t, hk, key: c.key, cityId: h2c(hk), las });
    }
  }
  return { seed, events, rivers, cities, map, log, plon: plonTerytorium(map, territoryNodes, placed, rivers) };
}

function runPlayer(seed, focus) {
  const map = M.generateMap(36, 28, seed, 'kontynenty');
  const rivers = riverSetWdrozona(map);
  const spots = pickCitySpots(map, 3);
  const OWNER = 0;
  const cities = spots.map((s, i) => ({
    id: `c${i}`, ownerId: OWNER, q: s.q, r: s.r, population: 6,
    ulepszeniaFocus: focus, ulepszeniaOnlyWorked: false,
  }));
  const territoryNodes = [];
  cities.forEach(c => territoryNodes.push(...territoryFor(map, c.q, c.r, 4, OWNER, c.id, 6)));
  const h2c = hexToCity(territoryNodes, cities);
  const placed = new Map();
  const events = []; const log = { odrzuconych: 0, duplikatow: 0, stripped: 0 };
  let pool = 200;
  for (let t = 0; t < TURNS; t++) {
    pool += 60;
    const workingPlaced = new Map(placed);
    const picks = M.pickAutoImprovements({
      cities, ownerId: OWNER, map, territoryNodes,
      placedImprovements: workingPlaced, pracaAvailable: pool, unlockedTechs: TECHS,
      pracaSurplusThreshold: M.AUTO_ULEPSZENIA_PRACA_RESERVE,
      skipWyrab: true, civArchetype: 'grecy',
      isImprovementAllowedForCiv: (key, civ) => M.isImprovementAllowedForCiv(key, civ),
      getFocus: c => c.ulepszeniaFocus, getOnlyWorked: c => c.ulepszeniaOnlyWorked,
      pracaBudgetPercent: 33, getPracaBudgetPercent: () => 33,
    });
    for (const pick of picks) {
      if (!M.isImprovementTechUnlocked(pick.key, TECHS)) continue;
      if (!M.isImprovementAllowedForCiv(pick.key, 'grecy')) continue;
      if (pool < pick.kosztPraca) continue;
      if (pool - pick.kosztPraca < M.AUTO_ULEPSZENIA_PRACA_RESERVE) continue;
      const hk = `${pick.q},${pick.r}`;
      const las = map.hexes[hk]?.nakladka === Nakladka.Las;
      if (!commit(map, placed, hk, pick.key, log)) continue;
      pool -= pick.kosztPraca;
      events.push({ t, hk, key: pick.key, cityId: h2c(hk), las });
    }
  }
  return { seed, events, rivers, cities, map, log, plon: plonTerytorium(map, territoryNodes, placed, rivers) };
}

/** CIAGLOSC — K1 po wszystkich rozkazach, K2 po PLONOWYCH (kontrakt W-B). */
function ciaglosc(events, tylkoPlonowe) {
  const src = tylkoPlonowe ? events.filter(e => !ZEROPLON.has(e.key)) : events;
  const byHex = new Map();
  for (const e of src) { if (!byHex.has(e.hk)) byHex.set(e.hk, []); byHex.get(e.hk).push(e); }
  let wiele = 0, ciagle = 0, przerwSum = 0;
  const najgorsze = [];
  for (const [hk, list] of byHex) {
    if (list.length < 2) continue;
    wiele++;
    const tury = new Set(list.map(e => e.t)).size;
    const span = list[list.length - 1].t - list[0].t + 1;
    const przerwa = span - tury;
    przerwSum += przerwa;
    if (przerwa === 0) ciagle++;
    else najgorsze.push({ hk, przerwa, span, slad: list.map(e => `${e.key}@t${e.t}`).join(' -> ') });
  }
  najgorsze.sort((a, b) => b.przerwa - a.przerwa);
  return { heksow: byHex.size, wiele, ciagle, pct: wiele ? 100 * ciagle / wiele : 0, przerwaSr: wiele ? przerwSum / wiele : 0, najgorsze: najgorsze.slice(0, 5) };
}
/** GLEBOKOSC — ile ulepszen PLONOWYCH przypada na heks roboczy (>=1 plonowe). */
function glebokosc(events) {
  const byHex = new Map();
  for (const e of events) {
    if (ZEROPLON.has(e.key) || e.key === 'wyrab') continue;
    byHex.set(e.hk, (byHex.get(e.hk) || 0) + 1);
  }
  let sum = 0, jeden = 0;
  for (const v of byHex.values()) { sum += v; if (v === 1) jeden++; }
  return { heksowRoboczych: byHex.size, srednia: byHex.size ? sum / byHex.size : 0, jednoulepszeniowych: jeden };
}
/** WYRAB → FARMA: czy farma powstaje PO wyrebie na TYM SAMYM heksie i po ilu turach. */
function wyrabFarma(events) {
  const wyciete = new Map();
  let wyrebow = 0, farmPoWyrebie = 0; const opoznienia = []; const pary = [];
  for (const e of events) {
    if (e.key === 'wyrab') { wyrebow++; if (!wyciete.has(e.hk)) wyciete.set(e.hk, e.t); continue; }
    if (e.key === 'farma' && wyciete.has(e.hk) && e.t >= wyciete.get(e.hk)) {
      farmPoWyrebie++; const d = e.t - wyciete.get(e.hk); opoznienia.push(d);
      pary.push(`${e.hk} wyrab@t${wyciete.get(e.hk)} -> farma@t${e.t} (+${d})`);
      wyciete.delete(e.hk);
    }
  }
  return { wyrebow, farmPoWyrebie, opoznienieSr: opoznienia.length ? opoznienia.reduce((a, b) => a + b, 0) / opoznienia.length : 0, pary };
}
function rozklad(events) {
  const counts = {}; const kat = { zywnosc: 0, surowce: 0, infra: 0, wyrab: 0, inne: 0 };
  for (const e of events) { counts[e.key] = (counts[e.key] || 0) + 1; kat[kategoria(e.key)]++; }
  return { counts, kat, kluczy: Object.keys(counts).length };
}
function rzeki(events, rivers) {
  let farmy = 0, farmyRzeka = 0, naRzece = 0;
  for (const e of events) {
    if (rivers.has(e.hk)) naRzece++;
    if (e.key === 'farma') { farmy++; if (rivers.has(e.hk)) farmyRzeka++; }
  }
  return { farmy, farmyRzeka, naRzece, razem: events.length };
}

function tabela(nazwa, wyniki) {
  console.log(`\n### ${nazwa}   [STAN: ${STAN}]`);
  console.log('ziarno | rozk | heks | K1 ciagl | K1 % | K2 ciagl | K2 % | K2 przerwa | glebok. | wyrab | farma@PO | poster. | fort | tartak | zyw/sur/infra | farmy@rzeka/farmy | plon zywnosci');
  const S = { rozk: 0, heks: 0, k1w: 0, k1c: 0, k2w: 0, k2c: 0, k2p: 0, gsum: 0, gh: 0, wyrab: 0, fpo: 0, kat: { zywnosc: 0, surowce: 0, infra: 0, wyrab: 0, inne: 0 }, perKey: {}, farmy: 0, farmyRzeka: 0, naRzece: 0, plon: { zywnosc: 0, praca: 0, handel: 0, drewno: 0 }, odrz: 0, strip: 0 };
  for (const w of wyniki) {
    const k1 = ciaglosc(w.events, false), k2 = ciaglosc(w.events, true);
    const g = glebokosc(w.events), wf = wyrabFarma(w.events), r = rozklad(w.events), rz = rzeki(w.events, w.rivers);
    S.rozk += w.events.length; S.heks += k1.heksow; S.k1w += k1.wiele; S.k1c += k1.ciagle;
    S.k2w += k2.wiele; S.k2c += k2.ciagle; S.k2p += k2.przerwaSr * k2.wiele;
    S.gsum += g.srednia * g.heksowRoboczych; S.gh += g.heksowRoboczych;
    S.wyrab += wf.wyrebow; S.fpo += wf.farmPoWyrebie;
    for (const k of Object.keys(S.kat)) S.kat[k] += r.kat[k];
    for (const [k, v] of Object.entries(r.counts)) S.perKey[k] = (S.perKey[k] || 0) + v;
    S.farmy += rz.farmy; S.farmyRzeka += rz.farmyRzeka; S.naRzece += rz.naRzece;
    for (const k of Object.keys(S.plon)) S.plon[k] += w.plon[k];
    S.odrz += w.log.odrzuconych; S.strip += w.log.stripped;
    console.log([String(w.seed).padStart(6), String(w.events.length).padStart(4), String(k1.heksow).padStart(4),
      `${k1.ciagle}/${k1.wiele}`.padStart(8), k1.pct.toFixed(0).padStart(4), `${k2.ciagle}/${k2.wiele}`.padStart(8), k2.pct.toFixed(0).padStart(4),
      k2.przerwaSr.toFixed(2).padStart(10), g.srednia.toFixed(2).padStart(7), String(wf.wyrebow).padStart(5), String(wf.farmPoWyrebie).padStart(8),
      String(r.counts.posterunek || 0).padStart(7), String(r.counts.fort || 0).padStart(4), String(r.counts.tartak || 0).padStart(6),
      `${r.kat.zywnosc}/${r.kat.surowce}/${r.kat.infra}`.padStart(13), `${rz.farmyRzeka}/${rz.farmy}`.padStart(17), String(w.plon.zywnosc).padStart(13)].join(' | '));
  }
  console.log([' RAZEM', String(S.rozk).padStart(4), String(S.heks).padStart(4), `${S.k1c}/${S.k1w}`.padStart(8),
    (S.k1w ? 100 * S.k1c / S.k1w : 0).toFixed(0).padStart(4), `${S.k2c}/${S.k2w}`.padStart(8), (S.k2w ? 100 * S.k2c / S.k2w : 0).toFixed(0).padStart(4),
    (S.k2p / Math.max(1, S.k2w)).toFixed(2).padStart(10), (S.gsum / Math.max(1, S.gh)).toFixed(2).padStart(7), String(S.wyrab).padStart(5), String(S.fpo).padStart(8),
    String(S.perKey.posterunek || 0).padStart(7), String(S.perKey.fort || 0).padStart(4), String(S.perKey.tartak || 0).padStart(6),
    `${S.kat.zywnosc}/${S.kat.surowce}/${S.kat.infra}`.padStart(13), `${S.farmyRzeka}/${S.farmy}`.padStart(17), String(S.plon.zywnosc).padStart(13)].join(' | '));
  console.log(`  udzial farm przy rzece: ${(100 * S.farmyRzeka / Math.max(1, S.farmy)).toFixed(1)}% · rozkazow na heksach z rzeka: ${(100 * S.naRzece / Math.max(1, S.rozk)).toFixed(1)}%`);
  console.log(`  PLON TERYTORIUM/ture (suma po ziarnach): zywnosc ${S.plon.zywnosc} · praca ${S.plon.praca} · handel ${S.plon.handel} · drewno ${S.plon.drewno}`);
  console.log(`  ulepszenia ZEROPLONOWE (posterunek+fort): ${(S.perKey.posterunek || 0) + (S.perKey.fort || 0)}/${S.rozk} = ${(100 * ((S.perKey.posterunek || 0) + (S.perKey.fort || 0)) / Math.max(1, S.rozk)).toFixed(1)}%`);
  console.log(`  model silnika: rozkazow wyrebu odrzuconych (heks juz bez lasu) ${S.odrz} · warstw skasowanych przez strip lasu ${S.strip}`);
  console.log(`  klucze (${Object.keys(S.perKey).length}): ${Object.entries(S.perKey).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
  return S;
}

function kronika(nazwa, w, limitTur) {
  console.log(`\n================ KRONIKA [${STAN}] — ${nazwa} · ziarno ${w.seed} ================`);
  console.log(`miasta: ${w.cities.map(c => `${c.id}(${c.q},${c.r})`).join(' · ')} · heksow z rzeka na mapie: ${w.rivers.size}`);
  const byTurn = new Map();
  for (const e of w.events) { if (!byTurn.has(e.t)) byTurn.set(e.t, []); byTurn.get(e.t).push(e); }
  let lastHexes = new Set(); const znane = new Set();
  for (let t = 0; t < Math.min(TURNS, limitTur); t++) {
    const list = byTurn.get(t) || [];
    if (!list.length) { console.log(`tura ${String(t).padStart(2)} | —`); continue; }
    const parts = list.map(e => {
      const znak = lastHexes.has(e.hk) ? 'KONTYNUACJA' : (znane.has(e.hk) ? 'POWROT PO PRZERWIE' : 'NOWY HEKS');
      znane.add(e.hk);
      const flagi = `${w.rivers.has(e.hk) ? '[RZEKA]' : '[  -  ]'}${e.las ? '[LAS]' : '[    ]'}${ZEROPLON.has(e.key) ? '[OBRONA]' : ''}`;
      return `(${e.hk.padEnd(7)}) ${flagi} ${e.key.padEnd(16)} ${znak}`;
    });
    lastHexes = new Set(list.map(e => e.hk));
    console.log(`tura ${String(t).padStart(2)} | ${parts.join('\n       | ')}`);
  }
  const wf = wyrabFarma(w.events);
  console.log(`--- PARY wyrab -> farma na TYM SAMYM heksie (ziarno ${w.seed}): ${wf.farmPoWyrebie}/${wf.wyrebow}, srednie opoznienie ${wf.opoznienieSr.toFixed(1)} tury`);
  for (const p of wf.pary.slice(0, 12)) console.log(`    ${p}`);
  const k2 = ciaglosc(w.events, true);
  for (const n of k2.najgorsze) console.log(`    PRZERWANY(plonowe) ${n.hk}: przerwa ${n.przerwa} tur, span ${n.span} — ${n.slad}`);
}

console.log(`# KRONIKA FINAL CONTROL runda 3 — TRZY STANY, dwie sciezki AI osobno`);
console.log(`# STAN: ${STAN} · zrodlo: ${SRC}`);
console.log(`# ziarna: ${SEEDS.join(', ')} · tur: ${TURNS} · mapa 36x28 „kontynenty", 3 miasta, promien 4, pop 6`);

const civ = SEEDS.map(runCiv);
tabela('AI CYWILIZACJI — PRAWDZIWE wejscie decideAITurn (maxItemsPerCity=1)', civ);
const pl = SEEDS.map(s => runPlayer(s, PROFILE));
tabela(`AI GRACZA — konfiguracja main.ts ODTWORZONA (BRAK DOWODU), profil „${PROFILE}"`, pl);

const idx = SEEDS.indexOf(KRONIKA_SEED) >= 0 ? SEEDS.indexOf(KRONIKA_SEED) : 0;
kronika('AI CYWILIZACJI (decideAITurn)', civ[idx], TURNS);
kronika(`AI GRACZA (main.ts odtworzone, profil ${PROFILE})`, pl[idx], 12);
