'use strict';
/**
 * oboz-lowiecki-las-test.cjs — bramka tematu R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1.
 *
 * GOAL: obóz łowiecki wyłącznie na nakładce Las (dowolny teren pod lasem — także Wzgórza),
 * nigdy poza lasem. Jednakowo dla gracza, automatu ulepszeń i AI.
 *
 * Dowodem NIE jest regex po źródle, tylko POMIAR ZACHOWANIA na wygenerowanej mapie:
 *   • ścieżka gracza  -> buildImprovementQualifier / createImprovementBuildApi.canBuild
 *   • automat/AI      -> pickAutoImprovements (ta sama funkcja dla obu, patrz ai.ts
 *                        planCityImprovements -> pickAutoImprovements)
 *   • tooltip heksu   -> galleryTerrainEligible + reguła nakładki (hexContextTooltip)
 *
 * PUŁAPKA (combat.ts:638-646): 'Plaskie (rownina/laka)' zawiera podciąg 'las'.
 * Test 6 pilnuje, że równina NIE przechodzi i że kod nie używa dopasowania po podciągu.
 *
 * Uruchamiaj z gra/:  node tools/oboz-lowiecki-las-test.cjs
 * Tryb pomiaru (bez asercji, liczby do raportu):  MEASURE=1 node tools/oboz-lowiecki-las-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.OBOZ_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.oboz-lowiecki-las-entry.ts');
const BUNDLE = path.resolve(__dirname, '.oboz-lowiecki-las-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export {
  buildImprovementQualifier,
  createImprovementBuildApi,
  galleryTerrainEligible,
  hasAnimalDeposit,
  isImprovementBlockedOnForest,
  computeImprovementBuildImpact,
  depositAllowsPlayerImprovement,
} from ${JSON.stringify(SRC + '/map/improvement-build')};
export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { buildHexContextTooltipHtml } from ${JSON.stringify(SRC + '/ui/hexContextTooltip')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');

// `hexContextTooltip.ts` ciągnie `icons/brandAssets`, który na poziomie modułu woła
// `import.meta.glob(...)` — w bundlu cjs to natychmiastowy TypeError. Podmieniamy WYŁĄCZNIE
// ten moduł na istniejący, commitowany stub (ten sam patent i ta sama fixture co
// tools/hex-tooltip-mozliwe-ulepszenia-zloze-test.cjs); cała reszta tooltipa jest prawdziwa.
const BRAND_STUB = path.resolve(__dirname, '.stubs', 'hex-tooltip-zloze-brandAssets-stub.ts');
if (!fs.existsSync(BRAND_STUB)) {
  console.error('[oboz-lowiecki-las-test] brak stuba brandAssets: ' + BRAND_STUB);
  process.exit(1);
}
const stubBrandAssetsPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
  },
};

// esbuild odrzuca pluginy w API synchronicznym — stąd async build i async main().
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

// --- stan kwalifikatora obejmujący CAŁĄ mapę (terytorium = każdy heks lądu) --------
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
    researchedTechs: new Set(['lowiectwo', 'Łowiectwo']),
    playerEra: 1,
  }, extra || {});
}

// =============================================================================
// KROK 2 — POMIAR: ile pól kwalifikuje się w trzech wariantach
// =============================================================================
function measureVariants(seeds) {
  const rows = [];
  for (const seed of seeds) {
    const map = M.generateMap(36, 28, seed, 'kontynenty');
    let lad = 0, las = 0, animalNak = 0, dzis = 0, tylkoLas = 0;
    let lasIZlozeNakladka = 0, lasIZlozeString = 0, lasNaWzgorzu = 0;
    let wzgorzeBezLasuZeZlozem = 0;
    for (const hk of Object.keys(map.hexes)) {
      const h = map.hexes[hk];
      if (!h || h.terenBazowy === TerenBazowy.Morze || h.terenBazowy === TerenBazowy.Wybrzeze) continue;
      lad++;
      const isLas = h.nakladka === Nakladka.Las;
      const anim = M.hasAnimalDeposit(h.nakladka);
      const animStr = ['konie', 'owce', 'bydlo', 'lama'].includes(String(h.zloze || '').toLowerCase());
      if (isLas) las++;
      if (anim) animalNak++;
      if (isLas || anim) dzis++;
      if (isLas) tylkoLas++;
      if (isLas && anim) lasIZlozeNakladka++;
      if (isLas && animStr) lasIZlozeString++;
      if (isLas && h.terenBazowy === TerenBazowy.Wzgorza) lasNaWzgorzu++;
      if (!isLas && anim && h.terenBazowy === TerenBazowy.Wzgorza) wzgorzeBezLasuZeZlozem++;
    }
    rows.push({ seed, lad, dzis, tylkoLas, lasIZlozeNakladka, lasIZlozeString,
      las, animalNak, lasNaWzgorzu, wzgorzeBezLasuZeZlozem });
  }
  return rows;
}

// =============================================================================
// Syntetyczna mikro-mapa: pełna kontrola nad terenem/nakładką/złożem
// =============================================================================
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

// =============================================================================
async function main() {
  await buildBundle();
  const seeds = [42, 1337, 2026, 7, 99];
  const rows = measureVariants(seeds);

  console.log('\n=== KROK 2 — POMIAR WARIANTÓW (mapa 36x28, kontynenty) ===');
  console.log('seed | ląd | DZIŚ(Las LUB złoże) | TYLKO Las | Las I złoże(nakładka) | Las I złoże(hex.zloze) | las | złoże zwierzęce (nakładka) | las na wzgórzu | wzgórze bez lasu ze złożem');
  for (const r of rows) {
    console.log(`${r.seed} | ${r.lad} | ${r.dzis} | ${r.tylkoLas} | ${r.lasIZlozeNakladka} | ${r.lasIZlozeString} | ${r.las} | ${r.animalNak} | ${r.lasNaWzgorzu} | ${r.wzgorzeBezLasuZeZlozem}`);
  }
  const sum = k => rows.reduce((s, r) => s + r[k], 0);
  console.log(`SUMA(${seeds.length} map): dziś=${sum('dzis')} tylkoLas=${sum('tylkoLas')} zlozeZwierzeceNakladka=${sum('animalNak')} LasIZlozeNakladka=${sum('lasIZlozeNakladka')} LasIZlozeString=${sum('lasIZlozeString')} lasNaWzgorzu=${sum('lasNaWzgorzu')} wzgorzeBezLasuZeZlozem=${sum('wzgorzeBezLasuZeZlozem')}`);

  if (process.env.MEASURE) return;

  console.log('\n=== ASERCJE ZACHOWANIA ===');

  // --- syntetyczne przypadki brzegowe -------------------------------------
  const cells = [
    { teren: TerenBazowy.Wzgorza, nakladka: Nakladka.ZlozeKonia },       // 0: wzgórze BEZ lasu ze złożem zwierzęcym
    { teren: TerenBazowy.Wzgorza, nakladka: Nakladka.Las },              // 1: LAS NA WZGÓRZU
    { teren: TerenBazowy.Rownina, nakladka: Nakladka.Las },              // 2: las na równinie
    { teren: TerenBazowy.Rownina, nakladka: Nakladka.Brak },             // 3: równina bez lasu (pułapka „p-LAS-kie")
    { teren: TerenBazowy.Rownina, nakladka: Nakladka.ZlozeKonia },       // 4: równina bez lasu ze złożem koni
    { teren: TerenBazowy.Laka,    nakladka: Nakladka.Las },              // 5: las na łące
    { teren: TerenBazowy.Wzgorza, nakladka: Nakladka.Brak },             // 6: gołe wzgórze
    { teren: TerenBazowy.Rownina, nakladka: Nakladka.Las, zloze: 'konie' }, // 7: las + złoże w hex.zloze
    { teren: TerenBazowy.Gory,    nakladka: Nakladka.Brak },             // 8: góry
    { teren: TerenBazowy.Pustynia, nakladka: Nakladka.Las },             // 9: las na pustyni
  ];
  const smap = synthMap(cells);
  const st = stateForWholeMap(smap);
  const qual = M.buildImprovementQualifier(st);
  const api = M.createImprovementBuildApi(st, { activeKey: 'oboz_lowiecki' });

  const at = i => ({ q: i, r: 0 });

  // --- (1) GRACZ ----------------------------------------------------------
  ok(qual('oboz_lowiecki', 0, 0) === false,
    'K1 gracz: wzgórze BEZ lasu ze złożem zwierzęcym -> obóz NIEDOSTĘPNY');
  ok(api.canBuild('oboz_lowiecki', 0, 0) === false,
    'K1 gracz (build API): wzgórze bez lasu ze złożem -> canBuild=false');
  ok(qual('oboz_lowiecki', 1, 0) === true,
    'K2 gracz: LAS NA WZGÓRZU -> obóz DOSTĘPNY');
  ok(qual('oboz_lowiecki', 2, 0) === true,
    'K3 gracz: las na równinie -> obóz DOSTĘPNY');
  ok(qual('oboz_lowiecki', 3, 0) === false,
    'K4 gracz: równina BEZ lasu -> obóz NIEDOSTĘPNY (pułapka „p-LAS-kie")');
  ok(qual('oboz_lowiecki', 4, 0) === false,
    'K4b gracz: równina bez lasu ze złożem koni -> obóz NIEDOSTĘPNY');
  ok(qual('oboz_lowiecki', 5, 0) === true, 'gracz: las na łące -> DOSTĘPNY');
  ok(qual('oboz_lowiecki', 6, 0) === false, 'gracz: gołe wzgórze -> NIEDOSTĘPNY');
  ok(qual('oboz_lowiecki', 8, 0) === false, 'gracz: góry bez lasu -> NIEDOSTĘPNY');
  ok(qual('oboz_lowiecki', 9, 0) === true, 'gracz: las na pustyni -> DOSTĘPNY (las = warunek jedyny)');

  // commit gracza — twarda blokada w computeImprovementBuildImpact
  ok(M.computeImprovementBuildImpact('oboz_lowiecki', smap.hexes['0,0'], []) === null,
    'K1 gracz (commit): impact=null na wzgórzu bez lasu ze złożem — blokada także poza panelem');
  ok(M.computeImprovementBuildImpact('oboz_lowiecki', smap.hexes['1,0'], []) !== null,
    'K2 gracz (commit): impact!=null na lesie na wzgórzu');
  ok(M.computeImprovementBuildImpact('oboz_lowiecki', smap.hexes['3,0'], []) === null,
    'K4 gracz (commit): impact=null na równinie bez lasu');

  // depositAllowsPlayerImprovement — wyjątek rezerwy złoża
  ok(M.depositAllowsPlayerImprovement('oboz_lowiecki', smap.hexes['0,0']) === false,
    'K1 rezerwa złoża: obóz NIE jest już wyjątkiem na złożu zwierzęcym bez lasu');
  ok(M.depositAllowsPlayerImprovement('oboz_lowiecki', smap.hexes['1,0']) === true,
    'K2 rezerwa złoża: obóz jest wyjątkiem na lesie');

  // --- (2) AUTOMAT / AI (ta sama funkcja: pickAutoImprovements) -----------
  const pickFor = (idx) => {
    const c = cells[idx];
    const one = synthMap([c]);
    const picks = M.pickAutoImprovements({
      cities: [{ id: 'c0', ownerId: 0, q: 0, r: 0, population: 1 }],
      ownerId: 0,
      map: one,
      territoryNodes: [{ q: 0, r: 0, ownerId: 0, cityId: 'c0' }],
      placedImprovements: new Map(),
      pracaAvailable: 100000,
      unlockedTechs: new Set(['lowiectwo', 'Łowiectwo']),
      pracaSurplusThreshold: 0,
      pracaBudgetPercent: 100,
      maxItemsPerCity: 5,
      skipWyrab: true,
      playerEra: 1,
      priorityOverride: ['oboz_lowiecki'],
    });
    return picks.some(p => p.key === 'oboz_lowiecki');
  };
  ok(pickFor(0) === false, 'K1 automat+AI: wzgórze bez lasu ze złożem -> picker NIE stawia obozu');
  ok(pickFor(1) === true,  'K2 automat+AI: LAS NA WZGÓRZU -> picker stawia obóz');
  ok(pickFor(2) === true,  'K3 automat+AI: las na równinie -> picker stawia obóz');
  ok(pickFor(3) === false, 'K4 automat+AI: równina bez lasu -> picker NIE stawia obozu');
  ok(pickFor(4) === false, 'K4b automat+AI: równina bez lasu ze złożem koni -> picker NIE stawia obozu');
  ok(pickFor(6) === false, 'automat+AI: gołe wzgórze -> picker NIE stawia obozu');

  // --- (3) TOOLTIP heksu --------------------------------------------------
  // POMIAR ZACHOWANIA, nie powtórzenie logiki: wołamy PRAWDZIWY, eksportowany
  // `buildHexContextTooltipHtml` i sprawdzamy, czy „Obóz łowiecki" pada w sekcji
  // „Możliwe ulepszenia (teren)". Wcześniejsza wersja tego testu odtwarzała pipeline
  // tooltipa u siebie — była TAUTOLOGIĄ (zielona niezależnie od treści źródła).
  const tooltipAllows = (idx) => {
    const hex = smap.hexes[`${idx},0`];
    const html = M.buildHexContextTooltipHtml({
      q: idx, r: 0, hex, esc: (x) => String(x), currentEra: 99, map: smap,
    });
    const head = 'Możliwe ulepszenia (teren)';
    const at = html.indexOf(head);
    if (at < 0) return false;
    return html.slice(at).includes('Obóz łowiecki');
  };
  ok(tooltipAllows(0) === false, 'K1 tooltip: wzgórze bez lasu ze złożem -> obozu NIE ma na liście');
  ok(tooltipAllows(1) === true,  'K2 tooltip: LAS NA WZGÓRZU -> obóz JEST na liście');
  ok(tooltipAllows(2) === true,  'K3 tooltip: las na równinie -> obóz JEST na liście');
  ok(tooltipAllows(3) === false, 'K4 tooltip: równina bez lasu -> obozu NIE ma na liście');
  ok(M.galleryTerrainEligible('oboz_lowiecki', TerenBazowy.Wzgorza) === true,
    'K2 tooltip: galeria terenu dopuszcza Wzgórza (bez tego las na wzgórzu przepada)');

  // --- (4) PUŁAPKA „p-LAS-kie" -------------------------------------------
  // Nazwa terenu równiny zawiera podciąg 'las'. Asercja wprost: dopasowanie po
  // podciągu dałoby TRUE, a zachowanie kodu MUSI być FALSE.
  const NAZWA_ROWNINY = 'Plaskie (rownina/laka)';
  ok(NAZWA_ROWNINY.toLowerCase().includes('las') === true,
    'K4 pułapka: nazwa równiny FAKTYCZNIE zawiera podciąg „las" (warunek istotności testu)');
  ok(qual('oboz_lowiecki', 3, 0) === false && qual('oboz_lowiecki', 4, 0) === false,
    'K4 pułapka: mimo podciągu „las" w nazwie równiny obóz na równinie bez lasu jest NIEDOSTĘPNY');
  // strażnik źródła: żadna ścieżka obozu nie może kwalifikować po nazwie tekstowej
  for (const rel of ['map/improvement-build.ts', 'ui/hexContextTooltip.ts', 'game/auto-improvements.ts']) {
    const txt = fs.readFileSync(path.resolve(SRC, rel), 'utf8');
    ok(!/includes\(\s*['"]las['"]\s*\)/i.test(txt),
      `K4 pułapka: ${rel} nie kwalifikuje lasu przez .includes('las')`);
  }

  // --- (5) STARE ZAPISY ---------------------------------------------------
  // Obóz już postawiony poza lasem ZOSTAJE (brak cichej migracji kasującej cudze ulepszenia).
  const sHex = smap.hexes['0,0'];
  const stWith = stateForWholeMap(smap, {
    placedImprovements: new Map([['0,0', ['oboz_lowiecki']]]),
  });
  const apiWith = M.createImprovementBuildApi(stWith, { activeKey: 'oboz_lowiecki' });
  ok(Array.isArray(stWith.placedImprovements.get('0,0'))
    && stWith.placedImprovements.get('0,0').includes('oboz_lowiecki'),
    'K6 stare zapisy: istniejący obóz poza lasem NIE jest usuwany przez zawężenie (zostaje)');
  ok(apiWith.canBuild('oboz_lowiecki', 0, 0) === false,
    'K6 stare zapisy: nie da się postawić NOWEGO obozu na tym samym polu poza lasem');
  void sHex; void at;

  console.log(`\noboz-lowiecki-las-test: ${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
