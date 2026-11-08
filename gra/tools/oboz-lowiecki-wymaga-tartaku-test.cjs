'use strict';
/**
 * oboz-lowiecki-wymaga-tartaku-test.cjs — bramka tematu
 * R-ULEPSZENIA-OBOZ-LOWIECKI-WYMAGA-TARTAKU-Q1.
 *
 * GOAL: `oboz_lowiecki` na polu lasu wymaga WCZEŚNIEJ zbudowanego, ukończonego `tartak`
 * na TYM SAMYM heksie — dokładnie wzorzec `droga_brukowana` wymagającej `droga`
 * (map/improvement-build.ts, ~929-936). Jednakowo dla ścieżki gracza, tooltipa heksu
 * i AI (auto-improvements/planCityImprovements).
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU (dispatch): dowodem NIE jest regex po źródle ani
 * założenie „qualifies() to teraz blokuje, więc AI musi respektować" — tylko realna
 * symulacja kilku tur `pickAutoImprovements` (TA SAMA funkcja, przez którą chodzi
 * `planCityImprovements` w ai.ts, patrz import w tym pliku) na dwóch scenariuszach mapy
 * (bez tartaków / z tartakami), z logiem faktycznych decyzji budowy.
 *
 * Uruchamiaj z gra/:  node tools/oboz-lowiecki-wymaga-tartaku-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.OBOZ_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.oboz-tartak-entry.ts');
const BUNDLE = path.resolve(__dirname, '.oboz-tartak-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export {
  buildImprovementQualifier,
  createImprovementBuildApi,
  computeImprovementBuildImpact,
} from ${JSON.stringify(SRC + '/map/improvement-build')};
export { pickAutoImprovements, AI_IMPROVEMENT_PRIORITY } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { migrateImprovementLayers } from ${JSON.stringify(SRC + '/game/terrain-improvements')};
export { buildHexContextTooltipHtml } from ${JSON.stringify(SRC + '/ui/hexContextTooltip')};
export { TerenBazowy, Nakladka, Ulepszenie } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');

// hexContextTooltip.ts ciągnie icons/brandAssets, który na poziomie modułu woła
// import.meta.glob(...) — w bundlu cjs to natychmiastowy TypeError. Ten sam, istniejący
// commitowany stub co tools/oboz-lowiecki-las-test.cjs / hex-tooltip-mozliwe-ulepszenia-zloze-test.cjs.
const BRAND_STUB = path.resolve(__dirname, '.stubs', 'hex-tooltip-zloze-brandAssets-stub.ts');
if (!fs.existsSync(BRAND_STUB)) {
  console.error('[oboz-lowiecki-wymaga-tartaku] brak stuba brandAssets: ' + BRAND_STUB);
  process.exit(1);
}
const stubBrandAssetsPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
  },
};

let M, TerenBazowy, Nakladka;
async function buildBundle() {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
    absWorkingDir: path.resolve(__dirname, '..'),
    plugins: [stubBrandAssetsPlugin], logLevel: 'warning',
  });
  delete require.cache[require.resolve(BUNDLE)];
  M = require(BUNDLE);
  ({ TerenBazowy, Nakladka } = M);
}

let pass = 0, fail = 0;
const ok = (cond, name, extra) => {
  if (cond) { pass++; console.log(`  [OK] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name}${extra ? ' :: ' + extra : ''}`); }
};

function synthMap(cells) {
  const hexes = {};
  cells.forEach((c, i) => {
    const q = i, r = 0;
    hexes[`${q},${r}`] = {
      coords: { q, r },
      terenBazowy: c.teren,
      nakladka: c.nakladka ?? Nakladka.Brak,
      zloze: c.zloze,
      wysokosc: 0.5,
      rzeka: { obecna: false },
    };
  });
  return { hexes, width: cells.length, height: 1, riverPaths: [], starts: [] };
}

function stateForWholeMap(map, extra) {
  const nodes = [];
  for (const hk of Object.keys(map.hexes)) {
    const h = map.hexes[hk];
    if (!h || h.terenBazowy === TerenBazowy.Morze) continue;
    nodes.push({ q: h.coords.q, r: h.coords.r, ownerId: 0, cityId: 'c0' });
  }
  return Object.assign({
    map,
    cityNodes: [{ q: 0, r: 0, pop: 1, level: 1 }],
    territoryNodes: nodes,
    playerOwnerIdNum: 0,
    placedImprovements: new Map(),
    researchedTechs: new Set(['lowiectwo', 'Łowiectwo', 'obrobka drewna', 'Obróbka drewna']),
    playerEra: 1,
  }, extra || {});
}

async function main() {
  await buildBundle();

  console.log('\n=== CZĘŚĆ 1 — GRACZ: qualifies()/canBuild/commit ===');
  {
    const cells = [
      { teren: TerenBazowy.Rownina, nakladka: Nakladka.Las },  // 0: las, BEZ tartaku
      { teren: TerenBazowy.Rownina, nakladka: Nakladka.Las },  // 1: las, z tartakiem (existing)
      { teren: TerenBazowy.Wzgorza, nakladka: Nakladka.Las },  // 2: las na wzgórzu, BEZ tartaku
      { teren: TerenBazowy.Wzgorza, nakladka: Nakladka.Las },  // 3: las na wzgórzu, z tartakiem
      { teren: TerenBazowy.Rownina, nakladka: Nakladka.Las },  // 4: las, BEZ tartaku (kontrola tartaku samego)
    ];
    const smap = synthMap(cells);
    const placed = new Map([
      ['1,0', ['tartak']],
      ['3,0', ['tartak']],
    ]);
    const st = stateForWholeMap(smap, { placedImprovements: placed });
    const qual = M.buildImprovementQualifier(st);
    const api = M.createImprovementBuildApi(st, { activeKey: 'oboz_lowiecki' });

    ok(qual('oboz_lowiecki', 0, 0) === false,
      'K1 gracz: las BEZ tartaku -> obóz NIEDOSTĘPNY (qualifies)');
    ok(api.canBuild('oboz_lowiecki', 0, 0) === false,
      'K1 gracz (build API): las bez tartaku -> canBuild=false');
    ok(qual('oboz_lowiecki', 1, 0) === true,
      'K2 gracz: las Z tartakiem na TYM heksie -> obóz DOSTĘPNY (qualifies)');
    ok(api.canBuild('oboz_lowiecki', 1, 0) === true,
      'K2 gracz (build API): las z tartakiem -> canBuild=true');
    ok(qual('oboz_lowiecki', 2, 0) === false,
      'las na wzgórzu BEZ tartaku -> obóz NIEDOSTĘPNY (teren pod lasem bez znaczenia — sam gate tartaku decyduje)');
    ok(qual('oboz_lowiecki', 3, 0) === true,
      'las na wzgórzu Z tartakiem -> obóz DOSTĘPNY');

    // commit — drugi, niezależny gate w computeImprovementBuildImpact (analogia do
    // hard-blocku Las wyżej w tej samej funkcji).
    ok(M.computeImprovementBuildImpact('oboz_lowiecki', smap.hexes['0,0'], []) === null,
      'K1 gracz (commit): impact=null na lesie bez tartaku w existing');
    ok(M.computeImprovementBuildImpact('oboz_lowiecki', smap.hexes['1,0'], ['tartak']) !== null,
      'K2 gracz (commit): impact!=null na lesie z tartakiem w existing');

    // KRYTERIUM 3 GOAL: tartak sam nadal budowalny bez zmian (gate dotyczy WYŁĄCZNIE obozu).
    ok(qual('tartak', 0, 0) === true,
      'GOAL-3 gracz: tartak na lesie BEZ obozu -> nadal DOSTĘPNY (gate nic mu nie zabrał)');
    ok(qual('tartak', 4, 0) === true,
      'GOAL-3 gracz: tartak na kolejnym lesie bez wcześniejszej budowy -> DOSTĘPNY');
  }

  console.log('\n=== CZĘŚĆ 2 — TOOLTIP HEKSU (CivPedia „Możliwe ulepszenia") ===');
  {
    const cells = [
      { teren: TerenBazowy.Rownina, nakladka: Nakladka.Las },  // 0: las bez tartaku
      { teren: TerenBazowy.Rownina, nakladka: Nakladka.Las },  // 1: las z tartakiem
    ];
    const smap = synthMap(cells);
    const tooltipAllows = (idx, layers) => {
      const hex = Object.assign({}, smap.hexes[`${idx},0`], { ulepszenia: layers ?? [] });
      const html = M.buildHexContextTooltipHtml({
        q: idx, r: 0, hex, esc: (x) => String(x), currentEra: 99, map: smap,
      });
      return typeof html === 'string' && html.includes('Obóz łowiecki');
    };
    ok(tooltipAllows(0, []) === false,
      'K1 tooltip: las bez tartaku -> Obóz łowiecki NIE jest na liście (identycznie jak droga_brukowana bez drogi)');
    ok(tooltipAllows(1, ['tartak']) === true,
      'K2 tooltip: las z tartakiem -> Obóz łowiecki JEST na liście');
  }

  console.log('\n=== CZĘŚĆ 3 — TEKST WARUNKU (CivPedia, data/terrain-improvements.json) ===');
  {
    const dataPath = path.resolve(__dirname, '..', 'data', 'terrain-improvements.json');
    const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const row = raw.oboz_lowiecki || {};
    const blob = `${row.teren || ''} ${row.warunek || ''}`;
    ok(/tartak/i.test(blob),
      'K5 CivPedia: teren/warunek obozu łowieckiego wprost wspomina "tartak"',
      blob.slice(0, 120));
  }

  console.log('\n=== CZĘŚĆ 4 — KOLEJNOŚĆ AI_IMPROVEMENT_PRIORITY ===');
  {
    const idxTartak = M.AI_IMPROVEMENT_PRIORITY.indexOf('tartak');
    const idxOboz = M.AI_IMPROVEMENT_PRIORITY.indexOf('oboz_lowiecki');
    ok(idxTartak !== -1 && idxOboz !== -1 && idxTartak < idxOboz,
      `AI_IMPROVEMENT_PRIORITY: tartak (idx ${idxTartak}) PRZED oboz_lowiecki (idx ${idxOboz})`);
  }

  // ===========================================================================
  // CZĘŚĆ 5 — AI: SYMULACJA WIELU TUR, REALNE LOGI DECYZJI (anty-halucynacyjne)
  // ===========================================================================
  console.log('\n=== CZĘŚĆ 5 — AI: symulacja 10 tur, dwa scenariusze mapy ===');

  const TECHS = new Set([
    'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo',
    'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta',
    'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Drogi brukowane', 'Matematyka',
  ]);

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
      if (!h || h.terenBazowy === TerenBazowy.Morze || h.terenBazowy === TerenBazowy.PlytkieMorze) continue;
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

  /**
   * Symuluje `turns` tur `pickAutoImprovements` (AI CYWILIZACJI: ta sama funkcja co
   * `planCityImprovements` w ai.ts). Zwraca log KAŻDEJ pojedynczej decyzji budowy
   * (turn, hex, key) plus zbiorcze liczniki — dowód „na żywo", nie założenie.
   */
  function simulate(seed, turns, seedTartakEverywhere) {
    const map = M.generateMap(36, 28, seed, 'kontynenty');
    const spots = pickCitySpots(map, 3);
    const cities = spots.map((s, i) => ({ id: `c${i}`, ownerId: 1, q: s.q, r: s.r, population: 8 }));
    const territoryNodes = [];
    cities.forEach(c => territoryNodes.push(...territoryFor(map, c.q, c.r, 4, 1, c.id)));

    const placed = new Map();
    if (seedTartakEverywhere) {
      // Scenariusz B: KAŻDY heks lasu w zasięgu miast ma JUŻ zbudowany, ukończony tartak
      // (stan sprzed tej tury symulacji — dokładnie kryterium 4 dispatchu: „mapa z lasami
      // mającymi już zbudowane tartaki").
      for (const node of territoryNodes) {
        const hex = map.hexes[`${node.q},${node.r}`];
        if (hex && hex.nakladka === Nakladka.Las) placed.set(`${node.q},${node.r}`, ['tartak']);
      }
    }

    const log = [];
    const counts = {};
    for (let t = 1; t <= turns; t++) {
      const picks = M.pickAutoImprovements({
        cities, ownerId: 1, map, territoryNodes,
        placedImprovements: placed,
        pracaAvailable: 100000,
        unlockedTechs: TECHS,
        pracaSurplusThreshold: 0,
        pracaBudgetPercent: 100,
        maxItemsPerCity: 3,
        skipWyrab: true,
        playerEra: 3,
        priorityOverride: M.AI_IMPROVEMENT_PRIORITY,
      });
      for (const p of picks) {
        const hk = `${p.q},${p.r}`;
        const prev = placed.get(hk) ?? [];
        if (prev.includes(p.key)) continue;
        // Log PRZED aktualizacją `placed` — decyzja `oboz_lowiecki` musi być poparta
        // tartakiem obecnym na TYM heksie w chwili decyzji, nie w tej samej turze po fakcie.
        log.push({ turn: t, q: p.q, r: p.r, key: p.key, hadTartakBefore: prev.includes('tartak') });
        placed.set(hk, [...prev, p.key]);
        counts[p.key] = (counts[p.key] ?? 0) + 1;
      }
      if (!picks.length && t > 3) break;
    }
    return { seed, log, counts, placed };
  }

  const seeds = [42, 1337];
  const TURNS = 10;

  console.log('\n--- Scenariusz A: mapa BEZ wcześniejszych tartaków (świeże miasta) ---');
  let scenarioAObozBezTartaku = [];
  for (const seed of seeds) {
    const r = simulate(seed, TURNS, false);
    const obozDecisions = r.log.filter(e => e.key === 'oboz_lowiecki');
    const bezTartaku = obozDecisions.filter(e => !e.hadTartakBefore);
    scenarioAObozBezTartaku = scenarioAObozBezTartaku.concat(bezTartaku);
    console.log(`  seed ${seed}: decyzji łącznie=${r.log.length} tartak=${r.counts.tartak ?? 0} oboz_lowiecki=${r.counts.oboz_lowiecki ?? 0}`);
    for (const e of obozDecisions) {
      console.log(`    [decyzja] tura ${e.turn} hex (${e.q},${e.r}) key=oboz_lowiecki hadTartakBefore=${e.hadTartakBefore}`);
    }
    if (bezTartaku.length) {
      console.log('    [FAIL-LOG] oboz_lowiecki zbudowany BEZ tartaku:', JSON.stringify(bezTartaku));
    }
  }
  ok(scenarioAObozBezTartaku.length === 0,
    'K3 AI (scenariusz A, żywy log): ZERO wystąpień oboz_lowiecki budowanego na hexie bez tartaku',
    JSON.stringify(scenarioAObozBezTartaku));

  console.log('\n--- Scenariusz B: mapa Z lasami mającymi już zbudowane tartaki ---');
  let scenarioBObozCount = 0;
  for (const seed of seeds) {
    const r = simulate(seed, TURNS, true);
    scenarioBObozCount += (r.counts.oboz_lowiecki ?? 0);
    console.log(`  seed ${seed}: decyzji łącznie=${r.log.length} oboz_lowiecki=${r.counts.oboz_lowiecki ?? 0}`);
    for (const e of r.log.filter(x => x.key === 'oboz_lowiecki')) {
      console.log(`    [decyzja] tura ${e.turn} hex (${e.q},${e.r}) key=oboz_lowiecki hadTartakBefore=${e.hadTartakBefore}`);
    }
  }
  ok(scenarioBObozCount > 0,
    `K4 AI (scenariusz B, żywy log): AI POTRAFI zbudować oboz_lowiecki gdy tartak już istnieje na heksie (razem=${scenarioBObozCount})`);

  console.log('\n=== WYNIK ===');
  console.log(`oboz-lowiecki-wymaga-tartaku-test: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
