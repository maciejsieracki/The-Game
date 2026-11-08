'use strict';
/**
 * ai2-sciezki-rozdzielone-measure.cjs — POMIAR OPERATORA, runda 2 tematu
 * R-AI-WYRAB-PRZY-RZECE-FARMY-Q1. Nie jest bramka — jest narzedziem pomiarowym.
 *
 * POWOD ISTNIENIA: wszystkie trzy harnessy rundy 1 wolaly `pickAutoImprovements`
 * BEZPOSREDNIO, wiec nie wiadomo, ktora z dwoch konfiguracji zmierzyly. Wlasciciel
 * (ECHO 2026-08-27) zada rozroznienia dwoch AI:
 *   - AI GRACZA        — auto-ulepszenia EOT gracza (main.ts ~:27066-27094),
 *   - AI CYWILIZACJI   — `planCityImprovements` w ai.ts (~:1984), wolane z `decideAITurn`.
 *
 * SCIEZKA AI CYWILIZACJI jest mierzona PRAWDZIWYM wejsciem: `decideAITurn(...)`.
 * Picker NIE jest wolany przez ten plik na tej sciezce ani razu.
 *
 * SCIEZKA AI GRACZA: `main.ts` to closure `boot()`, niebundlowalna w Node (ten sam
 * problem co test 11/12 w `ai-improvements-test.cjs`). Odtwarzam wiec konfiguracje
 * wywolania 1:1 z main.ts i pilnuje jej TEKSTOWYM straznikiem w bramce tematu
 * (`ai2-heks-po-heksie-test.cjs`, test G). To jest odtworzenie konfiguracji, nie
 * prawdziwe wejscie — raportowane jawnie jako takie (§13a).
 *
 * Harness mapy 1:1 z `oboz-lowiecki-ai-40tur-measure.cjs` i z harnessem Evaluatora
 * rundy 1 (mapa 36x28 „kontynenty", 3 miasta, promien 4, pop 6, 40 tur), zeby liczby
 * byly porownywalne z baza rundy 1.
 *
 * METRYKI: E1/E2 Evaluatora rundy 1 (metryka Operatora rundy 1 byla zdegenerowana).
 *   E1 — heks jest W TOKU w turze T, jesli dostal pierwsze ulepszenie w turze <= T
 *        i dostanie kolejne w turze > T. Raport: max i srednia po turach.
 *   E2 — dla heksow z >= 2 ulepszeniami: rozpietosc w turach + ile OBCYCH heksow
 *        AI tknelo w miedzyczasie.
 *
 * Run z gra/:  node tools/ai2-sciezki-rozdzielone-measure.cjs
 * Env: AI2_SEEDS="7,99,512,4242,1337"  AI2_TURNS=40  AI2_TRACE=1
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const SRC = process.env.AI2_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const TAG = process.env.AI2_TAG || 'op2';
const ENTRY = path.resolve(__dirname, `.ai2-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.ai2-${TAG}-bundle.cjs`);

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export { pickAutoImprovements, AI_IMPROVEMENT_PRIORITY, AUTO_ULEPSZENIA_PRACA_RESERVE, prioritiesForUlepszeniaFocus } from ${JSON.stringify(SRC + '/game/auto-improvements')};
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

// --- stale harnessu (1:1 z runda 1) -----------------------------------------
const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo',
  'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta',
  'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Drogi brukowane', 'Matematyka',
]);
const SEEDS = (process.env.AI2_SEEDS || '7,99,512,4242,1337').split(',').map(s => Number(s.trim()));
const TURNS = Number(process.env.AI2_TURNS || 40);

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

function riverHexKeys(map) {
  const set = new Set();
  for (const p of (map.riverPaths || [])) for (const x of p) set.add(`${x.q},${x.r}`);
  for (const [hk, h] of Object.entries(map.hexes)) if (h?.rzeka?.obecna) set.add(hk);
  return set;
}

// --- metryki E1/E2 (definicje Evaluatora rundy 1) ----------------------------
function metryki(events, turns) {
  const byHex = new Map();
  for (const e of events) {
    if (!byHex.has(e.hk)) byHex.set(e.hk, []);
    byHex.get(e.hk).push(e);
  }
  // E1
  let e1max = 0, e1sum = 0;
  for (let t = 0; t < turns; t++) {
    let inProgress = 0;
    for (const list of byHex.values()) {
      const first = list[0].t, last = list[list.length - 1].t;
      if (first <= t && last > t) inProgress++;
    }
    e1max = Math.max(e1max, inProgress);
    e1sum += inProgress;
  }
  // E2
  const multi = [...byHex.entries()].filter(([, l]) => l.length >= 2);
  let spanSum = 0, foreignSum = 0;
  const worst = [];
  for (const [hk, list] of multi) {
    const first = list[0].t, last = list[list.length - 1].t;
    const span = last - first;
    const foreign = new Set();
    for (const e of events) {
      if (e.t > first && e.t < last && e.hk !== hk) foreign.add(e.hk);
    }
    spanSum += span; foreignSum += foreign.size;
    worst.push({ hk, span, foreign: foreign.size, slad: list.map(e => `${e.key}@t${e.t}`).join(' -> ') });
  }
  worst.sort((a, b) => b.span - a.span);
  return {
    e1max, e1avg: e1sum / turns,
    e2count: multi.length,
    e2span: multi.length ? spanSum / multi.length : 0,
    e2foreign: multi.length ? foreignSum / multi.length : 0,
    worst: worst.slice(0, 6),
  };
}

function podsumuj(events, rivers) {
  const counts = {};
  const kat = { zywnosc: 0, surowce: 0, infra: 0, wyrab: 0, inne: 0 };
  let farmyRzeka = 0, farmy = 0, wyrebow = 0, farmyPoWyrebie = 0;
  const wyrabHexes = new Set();
  for (const e of events) {
    counts[e.key] = (counts[e.key] || 0) + 1;
    kat[kategoria(e.key)]++;
    if (e.key === 'farma') { farmy++; if (rivers.has(e.hk)) farmyRzeka++; if (wyrabHexes.has(e.hk)) farmyPoWyrebie++; }
    if (e.key === 'wyrab') { wyrebow++; wyrabHexes.add(e.hk); }
  }
  return { counts, kat, farmy, farmyRzeka, wyrebow, farmyPoWyrebie, razem: events.length };
}

/** Sumaryczny plon NA TURE ze wszystkich heksow terytorium na koniec przebiegu.
 *  To jest miara „tempa rozwoju" — liczba ulepszen sama w sobie jej nie oddaje. */
function plonTerytorium(map, territoryNodes, placed, rivers) {
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
      terenBazowy: h.terenBazowy,
      nakladka: h.nakladka,
      maRzeke: rivers.has(hk) || !!h.rzeka?.obecna,
      zloze: h.zloze,
      ulepszeniaKeys: Array.isArray(layers) ? layers : (layers ? [layers] : []),
    });
    out.zywnosc += y.zywnosc || 0; out.praca += y.praca || 0;
    out.handel += y.handel || 0; out.drewno += y.drewno || 0;
  }
  return out;
}

// ===========================================================================
// SCIEZKA 1 — AI CYWILIZACJI, PRAWDZIWE WEJSCIE `decideAITurn`
// ===========================================================================
function runCiv(seed) {
  const map = M.generateMap(36, 28, seed, 'kontynenty');
  const rivers = riverHexKeys(map);
  const spots = pickCitySpots(map, 3);
  const OWNER = 1;
  const cities = spots.map((s, i) => ({ id: `c${i}`, ownerId: OWNER, q: s.q, r: s.r, name: `C${i}`, population: 6 }));
  const territoryNodes = [];
  cities.forEach(c => territoryNodes.push(...territoryFor(map, c.q, c.r, 4, OWNER, c.id, 6)));
  const placed = new Map();
  const data = {
    units: [], buildings: [], aiParams: {},
    terrainYields: { terrain_types: [] },
  };
  const events = [];
  for (let t = 0; t < TURNS; t++) {
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
    };
    const cmds = M.decideAITurn(OWNER, [], cities, map, data, opts)
      .filter(c => c.type === 'buildImprovement');
    for (const c of cmds) {
      const hk = `${c.q},${c.r}`;
      events.push({ t, hk, key: c.key, cityId: null });
      if (c.key === 'wyrab') {
        // wyrab usuwa nakladke Las — tak robi silnik przy egzekucji komendy
        if (map.hexes[hk]) map.hexes[hk].nakladka = Nakladka.Brak;
      } else {
        const cur = placed.get(hk);
        const arr = Array.isArray(cur) ? [...cur] : (cur ? [cur] : []);
        arr.push(c.key);
        placed.set(hk, arr);
      }
    }
  }
  return { events, rivers, plon: plonTerytorium(map, territoryNodes, placed, rivers) };
}

// ===========================================================================
// SCIEZKA 2 — AI GRACZA, konfiguracja odtworzona 1:1 z main.ts (~:27066-27094)
// ===========================================================================
function runPlayer(seed, focus) {
  const map = M.generateMap(36, 28, seed, 'kontynenty');
  const rivers = riverHexKeys(map);
  const spots = pickCitySpots(map, 3);
  const OWNER = 0;
  const cities = spots.map((s, i) => ({
    id: `c${i}`, ownerId: OWNER, q: s.q, r: s.r, population: 6,
    ulepszeniaFocus: focus, ulepszeniaOnlyWorked: false,
  }));
  const territoryNodes = [];
  cities.forEach(c => territoryNodes.push(...territoryFor(map, c.q, c.r, 4, OWNER, c.id, 6)));
  const placed = new Map();
  const events = [];
  // model puli Pracy gracza: start 200, przyrost 60/ture, minus wydatek (jawnie w raporcie)
  let pool = 200;
  for (let t = 0; t < TURNS; t++) {
    pool += 60;
    const workingPlaced = new Map(placed);
    const picks = M.pickAutoImprovements({
      cities, ownerId: OWNER, map, territoryNodes,
      placedImprovements: workingPlaced,
      pracaAvailable: pool,
      unlockedTechs: TECHS,
      pracaSurplusThreshold: M.AUTO_ULEPSZENIA_PRACA_RESERVE,
      skipWyrab: true,                       // main.ts: skipWyrab: true
      civArchetype: 'grecy',
      isImprovementAllowedForCiv: (key, civ) => M.isImprovementAllowedForCiv(key, civ),
      getFocus: c => c.ulepszeniaFocus,
      getOnlyWorked: c => c.ulepszeniaOnlyWorked,
      pracaBudgetPercent: 33,                // DEFAULT_ULEPSZENIA_PRACA_PERCENT
      getPracaBudgetPercent: () => 33,
      playerEra: 3,
    });
    // post-filtr main.ts (tech / civ / pula / rezerwa / duplikat warstwy)
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
      events.push({ t, hk, key: pick.key });
    }
  }
  return { events, rivers, plon: plonTerytorium(map, territoryNodes, placed, rivers) };
}

// ===========================================================================
function raportSciezki(nazwa, wyniki) {
  console.log(`\n### ${nazwa}`);
  console.log('ziarno | ulepszen | E1 max | E1 sr. | E2 n | E2 rozpietosc | E2 obcych | farmy | farmy@rzeka | wyrab | farmy@POwyrab | posterunek | fort | tartak | zyw/sur/infra | plon zywnosci');
  const agg = { e1max: 0, e1avg: [], e2span: [], e2f: [], kat: { zywnosc: 0, surowce: 0, infra: 0, wyrab: 0, inne: 0 }, tartak: 0, wyrab: 0, farmy: 0, farmyRzeka: 0, farmyPoWyrebie: 0, razem: 0 };
  for (const w of wyniki) {
    const m = metryki(w.events, TURNS);
    const s = podsumuj(w.events, w.rivers);
    agg.e1max = Math.max(agg.e1max, m.e1max);
    agg.e1avg.push(m.e1avg); agg.e2span.push(m.e2span); agg.e2f.push(m.e2foreign);
    for (const k of Object.keys(agg.kat)) agg.kat[k] += s.kat[k];
    agg.tartak += (s.counts.tartak || 0); agg.wyrab += s.wyrebow;
    agg.counts = agg.counts || {};
    for (const [k, v] of Object.entries(s.counts)) agg.counts[k] = (agg.counts[k] || 0) + v;
    agg.farmy += s.farmy; agg.farmyRzeka += s.farmyRzeka; agg.farmyPoWyrebie += s.farmyPoWyrebie; agg.razem += s.razem;
    console.log(
      `${String(w.seed).padStart(6)} | ${String(s.razem).padStart(8)} | ${String(m.e1max).padStart(6)} | ${m.e1avg.toFixed(1).padStart(6)} | ${String(m.e2count).padStart(4)} | ${m.e2span.toFixed(1).padStart(13)} | ${m.e2foreign.toFixed(1).padStart(9)} | ${String(s.farmy).padStart(5)} | ${String(s.farmyRzeka).padStart(11)} | ${String(s.wyrebow).padStart(5)} | ${String(s.farmyPoWyrebie).padStart(13)} | ${String(s.counts.posterunek || 0).padStart(10)} | ${String(s.counts.fort || 0).padStart(4)} | ${String(s.counts.tartak || 0).padStart(6)} | ${s.kat.zywnosc}/${s.kat.surowce}/${s.kat.infra} | ${String(w.plon.zywnosc).padStart(13)}`,
    );
    if (process.env.AI2_TRACE) {
      for (const wo of m.worst) console.log(`        SLAD ${wo.hk}${w.rivers.has(wo.hk) ? ' [RZEKA]' : ''}: ${wo.slad}  (rozpietosc ${wo.span} tur, obcych ${wo.foreign})`);
    }
  }
  const plonSum = wyniki.reduce((acc, w) => {
    for (const k of ['zywnosc', 'praca', 'handel', 'drewno']) acc[k] += w.plon[k];
    return acc;
  }, { zywnosc: 0, praca: 0, handel: 0, drewno: 0 });
  const avg = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  console.log(`RAZEM  | ${String(agg.razem).padStart(8)} | ${String(agg.e1max).padStart(6)} | ${avg(agg.e1avg).toFixed(1).padStart(6)} |      | ${avg(agg.e2span).toFixed(1).padStart(13)} | ${avg(agg.e2f).toFixed(1).padStart(9)} | ${String(agg.farmy).padStart(5)} | ${String(agg.farmyRzeka).padStart(11)} | ${String(agg.wyrab).padStart(5)} | ${String(agg.farmyPoWyrebie).padStart(13)} | ${String((agg.counts||{}).posterunek || 0).padStart(10)} | ${String((agg.counts||{}).fort || 0).padStart(4)} | ${String(agg.tartak).padStart(6)} | ${agg.kat.zywnosc}/${agg.kat.surowce}/${agg.kat.infra} | ${String(plonSum.zywnosc).padStart(13)}`);
  const udzialRzek = agg.farmy ? (100 * agg.farmyRzeka / agg.farmy) : 0;
  console.log(`  udzial farm przy rzece: ${udzialRzek.toFixed(1)}%  ·  rozklad kategorii zyw/sur/infra/wyrab: ${agg.kat.zywnosc}/${agg.kat.surowce}/${agg.kat.infra}/${agg.kat.wyrab}`);
  console.log(`  ROZBICIE PER KLUCZ: ${Object.entries(agg.counts || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
  console.log(`  PLON TERYTORIUM na ture (suma po ziarnach): zywnosc ${plonSum.zywnosc} · praca ${plonSum.praca} · handel ${plonSum.handel} · drewno ${plonSum.drewno}`);
  agg.plon = plonSum;
  return agg;
}

console.log(`# POMIAR ROZDZIELONY — AI GRACZA vs AI CYWILIZACJI`);
console.log(`# ziarna: ${SEEDS.join(', ')} · tur: ${TURNS} · mapa 36x28 „kontynenty", 3 miasta, promien 4, pop 6`);

const civ = SEEDS.map(seed => ({ seed, ...runCiv(seed) }));
const aggCiv = raportSciezki('AI CYWILIZACJI — prawdziwe wejscie decideAITurn (ai.ts:~1984, maxItemsPerCity=1)', civ);

const PROFILE = ['zywnosc', 'surowce', 'infrastruktura', 'zrownowazone'];
const aggPlayer = {};
for (const f of PROFILE) {
  const wyn = SEEDS.map(seed => ({ seed, ...runPlayer(seed, f) }));
  aggPlayer[f] = raportSciezki(`AI GRACZA — profil „${f}" (konfiguracja main.ts ~:27066-27094, skipWyrab=true, budzet 33%)`, wyn);
}

console.log('\n### CZY PROFILE GRACZA SIE ROZNIA (rozklad kategorii, suma po ziarnach)');
console.log('profil          | razem | zywnosc | surowce | infra | tartak | farmy | farmy@rzeka');
for (const f of PROFILE) {
  const a = aggPlayer[f];
  console.log(`${f.padEnd(15)} | ${String(a.razem).padStart(5)} | ${String(a.kat.zywnosc).padStart(7)} | ${String(a.kat.surowce).padStart(7)} | ${String(a.kat.infra).padStart(5)} | ${String(a.tartak).padStart(6)} | ${String(a.farmy).padStart(5)} | ${String(a.farmyRzeka).padStart(11)}`);
}
console.log(`${'AI CYWILIZACJI'.padEnd(15)} | ${String(aggCiv.razem).padStart(5)} | ${String(aggCiv.kat.zywnosc).padStart(7)} | ${String(aggCiv.kat.surowce).padStart(7)} | ${String(aggCiv.kat.infra).padStart(5)} | ${String(aggCiv.tartak).padStart(6)} | ${String(aggCiv.farmy).padStart(5)} | ${String(aggCiv.farmyRzeka).padStart(11)}`);

// podobienstwo rozkladow (Bhattacharyya / cosinus) Zrownowazona gracza vs AI cywilizacji
function wektor(a) { const s = a.kat.zywnosc + a.kat.surowce + a.kat.infra + a.kat.wyrab; return s ? [a.kat.zywnosc / s, a.kat.surowce / s, a.kat.infra / s, a.kat.wyrab / s] : [0, 0, 0, 0]; }
const vZ = wektor(aggPlayer['zrownowazone']); const vC = wektor(aggCiv);
const cos = vZ.reduce((s, x, i) => s + x * vC[i], 0) / (Math.hypot(...vZ) * Math.hypot(...vC) || 1);
console.log(`\npodobienstwo rozkladow „Zrownowazona" gracza vs AI cywilizacji (cosinus): ${cos.toFixed(4)}`);
console.log(`  wektor gracza [zyw,sur,infra,wyrab] = [${vZ.map(x => x.toFixed(3)).join(', ')}]`);
console.log(`  wektor AI cyw. [zyw,sur,infra,wyrab] = [${vC.map(x => x.toFixed(3)).join(', ')}]`);
