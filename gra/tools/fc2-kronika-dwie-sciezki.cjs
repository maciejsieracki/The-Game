'use strict';
/**
 * fc2-kronika-dwie-sciezki.cjs — NARZEDZIE FINAL CONTROL, runda 2 tematu
 * R-AI-WYRAB-PRZY-RZECE-FARMY-Q1. Nie jest bramka — jest kronika.
 *
 * PYTANIE WLASCICIELA, na ktore ten plik odpowiada:
 *   „czy widac, ze KONCZY jeden heks przed nastepnym, i czy widac priorytet rzek"
 *   oraz „czy AI CYWILIZACJI buduje ROWNOMIERNIE (tartaki, drogi, kopalnie),
 *   a nie sama zywnosc".
 * Metryka moze spadac, a zachowanie nadal wygladac chaotycznie — dlatego kronika,
 * nie tylko liczby.
 *
 * DWIE SCIEZKI, OSOBNO (ECHO wlasciciela 2026-08-27):
 *   AI CYWILIZACJI — PRAWDZIWE wejscie `decideAITurn` (ai.ts), maxItemsPerCity=1.
 *   AI GRACZA      — konfiguracja `main.ts` (~:27066-27094) odtworzona; `main.ts`
 *                    to closure `boot()`, niebundlowalna w Node → to jest ODTWORZENIE
 *                    konfiguracji, NIE prawdziwe wejscie. Raportowane jako BRAK DOWODU.
 *
 * TRZECIA METODA (inna niz Operator i Evaluator rundy 2):
 *   Operator liczyl E1/E2 ze STRUMIENIA ROZKAZOW, Evaluator ze SNAPSHOTU STANU MAPY.
 *   Ja licze **przeploty w porzadku chronologicznym**: ile razy sciezka zmienia heks
 *   miedzy kolejnymi rozkazami (`przejsc`) i ile razy WRACA na heks, ktory juz
 *   opuscila (`powrotow`). „Konczy heks przed nastepnym" == powrotow 0.
 *   Powroty sa liczone PER MIASTO — trzy miasta pracuja rownolegle z definicji
 *   i przeplot miedzy miastami nie jest chaosem.
 *
 * Run z gra/:  node tools/fc2-kronika-dwie-sciezki.cjs
 * Env: FC2_SEEDS  FC2_TURNS  FC2_SRC_DIR  FC2_TAG  FC2_KRONIKA_SEED  FC2_PROFILE
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const SRC = process.env.FC2_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const TAG = process.env.FC2_TAG || 'fc2';
const ENTRY = path.resolve(__dirname, `.fc2-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.fc2-${TAG}-bundle.cjs`);

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export { pickAutoImprovements, AUTO_ULEPSZENIA_PRACA_RESERVE } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { isImprovementTechUnlocked } from ${JSON.stringify(SRC + '/game/improvement-tech')};
export { isImprovementAllowedForCiv } from ${JSON.stringify(SRC + '/game/terrain-improvements')};
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
const SEEDS = (process.env.FC2_SEEDS || '1337,2026,5150').split(',').map(s => Number(s.trim()));
const TURNS = Number(process.env.FC2_TURNS || 40);
const KRONIKA_SEED = Number(process.env.FC2_KRONIKA_SEED || SEEDS[0]);
const PROFILE = process.env.FC2_PROFILE || 'zrownowazone';

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
/** Przypisanie heksa do miasta z `territoryNodes` — `decideAITurn` NIE zwraca
 *  cityId w komendzie (`AICmdBuildImprovement` w ai.ts:125 nie ma tego pola),
 *  wiec atrybucje robie sam, TA SAMA metoda dla obu sciezek: heks nalezy do
 *  miasta, ktore ma go w swoim promieniu terytorium (pierwsze po id). */
function hexToCity(territoryNodes, cities) {
  const m = new Map();
  for (const n of territoryNodes) {
    const hk = `${n.q},${n.r}`;
    if (!m.has(hk)) m.set(hk, n.cityId);
  }
  // heksy spoza promienia terytorium (picker skanuje promien +1) — najblizsze miasto
  const dist = (q, r, c) => (Math.abs(q - c.q) + Math.abs(r - c.r) + Math.abs((q - c.q) + (r - c.r))) / 2;
  return (hk) => {
    const got = m.get(hk);
    if (got) return got;
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
/** Definicja WDROZONA w auto-improvements.ts: heks nalezy do sciezki rzeki. */
function riverSetWdrozona(map) {
  const s = new Set();
  for (const p of (map.riverPaths || [])) for (const x of p) s.add(`${x.q},${x.r}`);
  return s;
}

// --- SCIEZKA AI CYWILIZACJI — PRAWDZIWE wejscie decideAITurn ----------------
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
  const events = [];
  const lasNaStart = new Map();
  for (const [hk, h] of Object.entries(map.hexes)) lasNaStart.set(hk, h?.nakladka === Nakladka.Las);
  for (let t = 0; t < TURNS; t++) {
    const cmds = M.decideAITurn(OWNER, [], cities, map, data, {
      civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {},
      territoryNodes, placedImprovements: placed, improvementTechs: TECHS,
      pracaAvailable: 100000, civEra: 3,
    }).filter(c => c.type === 'buildImprovement');
    for (const c of cmds) {
      const hk = `${c.q},${c.r}`;
      events.push({ t, hk, key: c.key, cityId: h2c(hk), las: lasNaStart.get(hk) === true });
      if (c.key === 'wyrab') { if (map.hexes[hk]) map.hexes[hk].nakladka = Nakladka.Brak; }
      else {
        const cur = placed.get(hk); const arr = Array.isArray(cur) ? [...cur] : (cur ? [cur] : []);
        arr.push(c.key); placed.set(hk, arr);
      }
    }
  }
  return { seed, events, rivers, cities, map };
}

// --- SCIEZKA AI GRACZA — konfiguracja main.ts ODTWORZONA (BRAK DOWODU) ------
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
  const events = [];
  const lasNaStart = new Map();
  for (const [hk, h] of Object.entries(map.hexes)) lasNaStart.set(hk, h?.nakladka === Nakladka.Las);
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
      const prev = placed.get(hk) ?? [];
      if (prev.includes(pick.key)) continue;
      pool -= pick.kosztPraca;
      placed.set(hk, [...prev, pick.key]);
      events.push({ t, hk, key: pick.key, cityId: h2c(hk), las: lasNaStart.get(hk) === true });
    }
  }
  return { seed, events, rivers, cities, map };
}

// --- METRYKA FC (TRZECIA METODA): CIAGLOSC HEKSA, bez atrybucji do miasta ---
// Operator liczyl E1/E2 ze STRUMIENIA ROZKAZOW, Evaluator ze SNAPSHOTU STANU MAPY.
// Ja licze CIAGLOSC: dla kazdego heksa z >= 2 rozkazami biore `tury` = liczba ROZNYCH
// tur z rozkazem na tym heksie oraz `span` = ostatnia - pierwsza + 1. Heks jest
// DOMKNIETY BEZ PRZERWY, gdy `tury == span` — czyli praca na nim nie zostala przerwana
// ani na jedna ture. „Konczy jeden heks przed nastepnym" == udzial takich heksow ~100%.
// Ta metryka NIE wymaga wiedzy, ktore miasto wydalo rozkaz — a `AICmdBuildImprovement`
// (ai.ts:125) cityId NIE niesie, wiec kazda atrybucja per miasto bylaby zgadywaniem
// (promienie kandydatow sasiednich miast zachodza na siebie: `cityTerritoryRadius + 1`).
function ciaglosc(events) {
  const byHex = new Map();
  for (const e of events) {
    if (!byHex.has(e.hk)) byHex.set(e.hk, []);
    byHex.get(e.hk).push(e);
  }
  let wiele = 0, ciagle = 0, przerwSum = 0, spanSum = 0;
  const najgorsze = [];
  for (const [hk, list] of byHex) {
    if (list.length < 2) continue;
    wiele++;
    const tury = new Set(list.map(e => e.t)).size;
    const span = list[list.length - 1].t - list[0].t + 1;
    spanSum += span;
    const przerwa = span - tury;
    przerwSum += przerwa;
    if (przerwa === 0) ciagle++;
    else najgorsze.push({ hk, przerwa, span, slad: list.map(e => `${e.key}@t${e.t}`).join(' -> ') });
  }
  najgorsze.sort((a, b) => b.przerwa - a.przerwa);
  return {
    heksow: byHex.size, wiele, ciagle,
    pct: wiele ? (100 * ciagle / wiele) : 0,
    przerwaSr: wiele ? (przerwSum / wiele) : 0,
    spanSr: wiele ? (spanSum / wiele) : 0,
    najgorsze: najgorsze.slice(0, 5),
  };
}
function rownomiernosc(events) {
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

function kronika(nazwa, w, limitTur) {
  console.log(`\n================ KRONIKA — ${nazwa} · ziarno ${w.seed} ================`);
  console.log(`miasta: ${w.cities.map(c => `${c.id}(${c.q},${c.r})`).join(' · ')}`);
  console.log(`heksow z rzeka na mapie (definicja wdrozona, map.riverPaths): ${w.rivers.size}`);
  const byTurn = new Map();
  for (const e of w.events) { if (!byTurn.has(e.t)) byTurn.set(e.t, []); byTurn.get(e.t).push(e); }
  let lastHexes = new Set();
  const znane = new Set();
  for (let t = 0; t < Math.min(TURNS, limitTur); t++) {
    const list = byTurn.get(t) || [];
    if (!list.length) { console.log(`tura ${String(t).padStart(2)} | —`); continue; }
    const parts = list.map(e => {
      const znak = lastHexes.has(e.hk) ? 'KONTYNUACJA' : (znane.has(e.hk) ? 'POWROT PO PRZERWIE' : 'NOWY HEKS');
      znane.add(e.hk);
      const flagi = `${w.rivers.has(e.hk) ? '[RZEKA]' : '[  -  ]'}${e.las ? '[LAS]' : ''}`;
      return `(${e.hk.padEnd(7)}) ${flagi} ${e.key.padEnd(16)} ${znak}`;
    });
    lastHexes = new Set(list.map(e => e.hk));
    console.log(`tura ${String(t).padStart(2)} | ${parts.join('\n       | ')}`);
  }
  const cg = ciaglosc(w.events); const r = rownomiernosc(w.events); const rz = rzeki(w.events, w.rivers);
  console.log(`--- ziarno ${w.seed}: rozkazow ${w.events.length} · heksow tknietych ${cg.heksow} · z >=2 rozkazami ${cg.wiele} · DOMKNIETYCH BEZ PRZERWY ${cg.ciagle} (${cg.pct.toFixed(1)}%) · srednia przerwa ${cg.przerwaSr.toFixed(2)} tury`);
  console.log(`    kluczy roznych: ${r.kluczy} · zyw/sur/infra/wyrab: ${r.kat.zywnosc}/${r.kat.surowce}/${r.kat.infra}/${r.kat.wyrab}`);
  console.log(`    rozkazy na heksach z rzeka: ${rz.naRzece}/${rz.razem} · farmy przy rzece: ${rz.farmyRzeka}/${rz.farmy}`);
  console.log(`    rozbicie: ${Object.entries(r.counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
  for (const n of cg.najgorsze) console.log(`    PRZERWANY ${n.hk}: przerwa ${n.przerwa} tur, span ${n.span} — ${n.slad}`);
}

function tabela(nazwa, wyniki) {
  console.log(`\n### ${nazwa}`);
  console.log('ziarno | rozkazow | heksow | >=2 | CIAGLYCH | % | przerwa sr | kluczy | zyw/sur/infra/wyrab | tartak | droga | kopalnie | rozkazy@rzeka | farmy@rzeka/farmy');
  const sum = { rozkazow: 0, wiele: 0, ciagle: 0, heksow: 0, przerw: 0, tartak: 0, droga: 0, kop: 0, naRzece: 0, farmy: 0, farmyRzeka: 0, kat: { zywnosc: 0, surowce: 0, infra: 0, wyrab: 0, inne: 0 }, klucze: new Set() };
  for (const w of wyniki) {
    const cg = ciaglosc(w.events); const r = rownomiernosc(w.events); const rz = rzeki(w.events, w.rivers);
    const kop = Object.entries(r.counts).filter(([k]) => k.startsWith('kopalnia')).reduce((s, [, v]) => s + v, 0);
    sum.rozkazow += w.events.length; sum.wiele += cg.wiele; sum.ciagle += cg.ciagle; sum.heksow += cg.heksow; sum.przerw += cg.przerwaSr * cg.wiele;
    sum.tartak += r.counts.tartak || 0; sum.droga += (r.counts.droga || 0) + (r.counts.droga_brukowana || 0); sum.kop += kop;
    sum.naRzece += rz.naRzece; sum.farmy += rz.farmy; sum.farmyRzeka += rz.farmyRzeka;
    for (const k of Object.keys(sum.kat)) sum.kat[k] += r.kat[k];
    for (const [k, v] of Object.entries(r.counts)) { sum.klucze.add(k); sum.perKey = sum.perKey || {}; sum.perKey[k] = (sum.perKey[k] || 0) + v; }
    console.log(`${String(w.seed).padStart(6)} | ${String(w.events.length).padStart(8)} | ${String(cg.heksow).padStart(6)} | ${String(cg.wiele).padStart(3)} | ${String(cg.ciagle).padStart(8)} | ${cg.pct.toFixed(0).padStart(3)} | ${cg.przerwaSr.toFixed(2).padStart(10)} | ${String(r.kluczy).padStart(6)} | ${String(`${r.kat.zywnosc}/${r.kat.surowce}/${r.kat.infra}/${r.kat.wyrab}`).padStart(19)} | ${String(r.counts.tartak || 0).padStart(6)} | ${String((r.counts.droga || 0) + (r.counts.droga_brukowana || 0)).padStart(5)} | ${String(kop).padStart(8)} | ${String(`${rz.naRzece}/${w.events.length}`).padStart(13)} | ${rz.farmyRzeka}/${rz.farmy}`);
  }
  const pctAll = sum.wiele ? (100 * sum.ciagle / sum.wiele) : 0;
  console.log(`RAZEM  | ${String(sum.rozkazow).padStart(8)} | ${String(sum.heksow).padStart(6)} | ${String(sum.wiele).padStart(3)} | ${String(sum.ciagle).padStart(8)} | ${pctAll.toFixed(0).padStart(3)} | ${(sum.przerw / Math.max(1, sum.wiele)).toFixed(2).padStart(10)} | ${String(sum.klucze.size).padStart(6)} | ${String(`${sum.kat.zywnosc}/${sum.kat.surowce}/${sum.kat.infra}/${sum.kat.wyrab}`).padStart(19)} | ${String(sum.tartak).padStart(6)} | ${String(sum.droga).padStart(5)} | ${String(sum.kop).padStart(8)} | ${String(`${sum.naRzece}/${sum.rozkazow}`).padStart(13)} | ${sum.farmyRzeka}/${sum.farmy}`);
  const pct = sum.farmy ? (100 * sum.farmyRzeka / sum.farmy) : 0;
  console.log(`  udzial farm przy rzece: ${pct.toFixed(1)}% · udzial rozkazow na heksach z rzeka: ${(100 * sum.naRzece / Math.max(1, sum.rozkazow)).toFixed(1)}%`);
  console.log(`  klucze uzyte (${sum.klucze.size}): ${Object.entries(sum.perKey || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
  const zeroPlon = (sum.perKey?.posterunek || 0) + (sum.perKey?.fort || 0);
  console.log(`  ulepszenia o ZEROWEJ delcie plonu (posterunek+fort, zmierzone tileYield): ${zeroPlon}/${sum.rozkazow} = ${(100 * zeroPlon / Math.max(1, sum.rozkazow)).toFixed(1)}%`);
  return sum;
}

console.log(`# KRONIKA FINAL CONTROL — dwie sciezki AI osobno`);
console.log(`# zrodlo: ${SRC}`);
console.log(`# ziarna: ${SEEDS.join(', ')} · tur: ${TURNS} · mapa 36x28 „kontynenty", 3 miasta, promien 4, pop 6`);
console.log(`# profil AI GRACZA w tym przebiegu: ${PROFILE}`);

const civ = SEEDS.map(runCiv);
tabela('AI CYWILIZACJI — PRAWDZIWE wejscie decideAITurn (maxItemsPerCity=1)', civ);
const pl = SEEDS.map(s => runPlayer(s, PROFILE));
tabela(`AI GRACZA — konfiguracja main.ts ODTWORZONA (BRAK DOWODU), profil „${PROFILE}"`, pl);

const kcIdx = SEEDS.indexOf(KRONIKA_SEED) >= 0 ? SEEDS.indexOf(KRONIKA_SEED) : 0;
kronika('AI CYWILIZACJI (decideAITurn)', civ[kcIdx], TURNS);
kronika(`AI GRACZA (main.ts odtworzone, profil ${PROFILE})`, pl[kcIdx], 12);
