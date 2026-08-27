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
  stripImprovementsWhenForestRemoved,
} from ${JSON.stringify(SRC + '/map/improvement-build')};
export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { migrateImprovementLayers } from ${JSON.stringify(SRC + '/game/terrain-improvements')};
export { buildHexContextTooltipHtml } from ${JSON.stringify(SRC + '/ui/hexContextTooltip')};
export { TerenBazowy, Nakladka, Ulepszenie } from ${JSON.stringify(SRC + '/types/hex')};
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
  // POPRAWKA rundy 1 (wznowienie): poprzednia asercja czytala Mape, ktora sama przed chwila
  // zbudowala („czy Map, do ktorej wlozylem X, zawiera X") — TAUTOLOGIA, zielona niezaleznie
  // od zrodla. Realna sciezka wczytania zapisu to `migrateImprovementLayers`
  // (game/terrain-improvements.ts), wolana z main.ts `restorePlacedImprovementsFromSave`
  // (~:12009) dla KAZDEGO heksa zapisu. To ona — i tylko ona — moglaby skasowac stare obozy.
  const migHill = M.migrateImprovementLayers(['oboz_lowiecki'],
    { nakladka: Nakladka.ZlozeKonia, zloze: 'konie' });
  ok(migHill.includes('oboz_lowiecki'),
    'K6 stare zapisy: realna sciezka wczytania (migrateImprovementLayers) NIE kasuje obozu na zlozu bez lasu',
    JSON.stringify(migHill));
  const migBare = M.migrateImprovementLayers(['oboz_lowiecki'], { nakladka: Nakladka.Brak });
  ok(migBare.includes('oboz_lowiecki'),
    'K6 stare zapisy: realna sciezka wczytania NIE kasuje obozu na golym terenie bez lasu',
    JSON.stringify(migBare));
  const migMixed = M.migrateImprovementLayers(['farma', 'oboz_lowiecki'], { nakladka: Nakladka.Brak });
  ok(migMixed.length === 2 && migMixed.includes('oboz_lowiecki') && migMixed.includes('farma'),
    'K6 stare zapisy: warstwa obozu przezywa migracje razem z sasiednimi warstwami',
    JSON.stringify(migMixed));

  const stWith = stateForWholeMap(smap, {
    placedImprovements: new Map([['0,0', ['oboz_lowiecki']]]),
  });
  const apiWith = M.createImprovementBuildApi(stWith, { activeKey: 'oboz_lowiecki' });
  ok(apiWith.canBuild('oboz_lowiecki', 0, 0) === false,
    'K6 stare zapisy: nie da sie postawic NOWEGO obozu na tym samym polu poza lasem');
  void at;

  // --- (6) WZGORZE BEZ LASU, KAZDY TYP ZLOZA ZWIERZECEGO -------------------
  // Dispatch kryterium 1 mowi „zloze zwierzece", nie „zloze koni". Sprawdzamy wszystkie
  // cztery nakladki z NAKLADKI_ZWIERZECZE, na wzgorzu, osobno dla gracza, commitu i tooltipa.
  const ANIMAL_NAK = [
    ['ZlozeKonia', Nakladka.ZlozeKonia], ['ZlozeOwiec', Nakladka.ZlozeOwiec],
    ['ZlozeBydla', Nakladka.ZlozeBydla], ['ZlozeLamy', Nakladka.ZlozeLamy],
  ];
  for (const [nazwa, nak] of ANIMAL_NAK) {
    const one = synthMap([{ teren: TerenBazowy.Wzgorza, nakladka: nak }]);
    const q1 = M.buildImprovementQualifier(stateForWholeMap(one));
    ok(q1('oboz_lowiecki', 0, 0) === false,
      `K1 gracz: wzgorze bez lasu + ${nazwa} -> obóz NIEDOSTĘPNY`);
    ok(M.computeImprovementBuildImpact('oboz_lowiecki', one.hexes['0,0'], []) === null,
      `K1 commit: wzgorze bez lasu + ${nazwa} -> impact=null`);
    const html1 = M.buildHexContextTooltipHtml({
      q: 0, r: 0, hex: one.hexes['0,0'], esc: (x) => String(x), currentEra: 99, map: one,
    });
    const h1 = html1.indexOf('Możliwe ulepszenia (teren)');
    ok(h1 < 0 || !html1.slice(h1).includes('Obóz łowiecki'),
      `K1 tooltip: wzgorze bez lasu + ${nazwa} -> obozu NIE ma na liscie`);
    const picks1 = M.pickAutoImprovements({
      cities: [{ id: 'c0', ownerId: 0, q: 0, r: 0, population: 1 }],
      ownerId: 0, map: one,
      territoryNodes: [{ q: 0, r: 0, ownerId: 0, cityId: 'c0' }],
      placedImprovements: new Map(), pracaAvailable: 100000,
      unlockedTechs: new Set(['lowiectwo', 'Łowiectwo']),
      pracaSurplusThreshold: 0, pracaBudgetPercent: 100, maxItemsPerCity: 5,
      skipWyrab: true, playerEra: 1, priorityOverride: ['oboz_lowiecki'],
    });
    ok(picks1.every(p => p.key !== 'oboz_lowiecki'),
      `K1 automat+AI: wzgorze bez lasu + ${nazwa} -> picker NIE stawia obozu`);
  }

  // --- (7) MAPA FAKTYCZNIE WYGENEROWANA (nie syntetyk) --------------------
  // Dispatch: „wygeneruj mape, wez pole ... i pokaz, ze oboz jest tam niedostepny — dla
  // gracza, dla automatu i dla AI OSOBNO". Ponizej te same asercje na heksach pochodzacych
  // z `generateMap`, nie z reki. UWAGA (znalezisko pomiarowe, patrz tabela wyzej): na 5
  // wygenerowanych mapach jest 0 pol „wzgorze bez lasu ze zlozem zwierzecym" i lacznie 1
  // pole ze zlozem zwierzecym jako NAKLADKA — dlatego ten przypadek MUSI byc syntetyczny
  // (sekcja 6 wyzej), a tu sprawdzamy przypadki, ktore na mapie faktycznie wystepuja.
  const gmap = M.generateMap(36, 28, 42, 'kontynenty');
  const gKeys = Object.keys(gmap.hexes).sort();
  const findG = (pred) => {
    for (const k of gKeys) { const h = gmap.hexes[k]; if (h && pred(h)) return h; }
    return null;
  };
  const gState = stateForWholeMap(gmap);
  const gQual = M.buildImprovementQualifier(gState);
  const gPick = (hex) => {
    const picks = M.pickAutoImprovements({
      cities: [{ id: 'c0', ownerId: 0, q: hex.coords.q, r: hex.coords.r, population: 1 }],
      ownerId: 0, map: gmap,
      territoryNodes: [{ q: hex.coords.q, r: hex.coords.r, ownerId: 0, cityId: 'c0' }],
      placedImprovements: new Map(), pracaAvailable: 100000,
      unlockedTechs: new Set(['lowiectwo', 'Łowiectwo']),
      pracaSurplusThreshold: 0, pracaBudgetPercent: 100, maxItemsPerCity: 5,
      skipWyrab: true, playerEra: 1, priorityOverride: ['oboz_lowiecki'],
    });
    return picks.some(p => p.key === 'oboz_lowiecki'
      && p.q === hex.coords.q && p.r === hex.coords.r);
  };
  const gTooltip = (hex) => {
    const html = M.buildHexContextTooltipHtml({
      q: hex.coords.q, r: hex.coords.r, hex, esc: (x) => String(x), currentEra: 99, map: gmap,
    });
    const i = html.indexOf('Możliwe ulepszenia (teren)');
    return i >= 0 && html.slice(i).includes('Obóz łowiecki');
  };
  const gCases = [
    ['LAS NA WZGORZU', h => h.nakladka === Nakladka.Las && h.terenBazowy === TerenBazowy.Wzgorza, true],
    ['las na rowninie', h => h.nakladka === Nakladka.Las && h.terenBazowy === TerenBazowy.Rownina, true],
    ['ROWNINA bez lasu', h => h.nakladka === Nakladka.Brak && h.terenBazowy === TerenBazowy.Rownina, false],
    ['gole wzgorze', h => h.nakladka === Nakladka.Brak && h.terenBazowy === TerenBazowy.Wzgorza, false],
  ];
  for (const [nazwa, pred, oczek] of gCases) {
    const h = findG(pred);
    ok(h !== null, `mapa 42: istnieje heks „${nazwa}" (warunek istotnosci)`);
    if (!h) continue;
    const co = `(${h.coords.q},${h.coords.r})`;
    ok(gQual('oboz_lowiecki', h.coords.q, h.coords.r) === oczek,
      `mapa 42 ${co} „${nazwa}" GRACZ: oboz ${oczek ? 'DOSTEPNY' : 'NIEDOSTEPNY'}`);
    ok(gPick(h) === oczek,
      `mapa 42 ${co} „${nazwa}" AUTOMAT+AI: picker ${oczek ? 'stawia' : 'NIE stawia'} obozu`);
    ok(gTooltip(h) === oczek,
      `mapa 42 ${co} „${nazwa}" TOOLTIP: oboz ${oczek ? 'JEST' : 'NIE ma go'} na liscie`);
    ok((M.computeImprovementBuildImpact('oboz_lowiecki', h, []) !== null) === oczek,
      `mapa 42 ${co} „${nazwa}" COMMIT: impact ${oczek ? '!=' : '=='} null`);
  }


  // =========================================================================
  // (8) P7 — WYRĄB LASU SPOD ULEPSZENIA (runda 2; ECHO właściciela 2026-08-27, wariant A)
  // =========================================================================
  // Dowodem NIE jest odczyt kodu `stripImprovementsWhenForestRemoved`. Dowodem jest POMIAR:
  // postaw obóz na heksie z lasem POCHODZĄCYM Z generateMap, wykonaj sekwencję wyrębu
  // przepisaną z main.ts, ODCZYTAJ warstwy heksa (mapa `placedImprovements` ORAZ pola
  // `hex.ulepszenia`/`hex.ulepszenie`, bo to one jadą do zapisu i do renderu).
  //
  // Ścieżka GRACZA i ścieżka AI mają OSOBNE, niezależne transkrypcje i osobne asercje —
  // wnioskowanie „skoro gracz działa, to AI też" jest tu zabronione (reguła b dispatchu).
  console.log('\n=== (8) P7 — WYRĄB LASU SPOD OBOZU (wariant A: obóz znika) ===');

  // main.ts:11307 improvementKeyToUlepszenie — przepisane 1:1 (mapa kluczy).
  const KEY_TO_ULEPSZENIE = {
    farma: M.Ulepszenie.Farma, irygacja: M.Ulepszenie.Irygacja,
    kopalnia_zelaza: M.Ulepszenie.Kopalnia, droga: M.Ulepszenie.Droga,
    pastwisko: M.Ulepszenie.Pastwisko, bydlo: M.Ulepszenie.Pastwisko,
    owce: M.Ulepszenie.Pastwisko, lama: M.Ulepszenie.Pastwisko,
  };

  // ---- ŚCIEŻKA GRACZA: main.ts:11321 + :11892 + :11906 (finalizeHexClearing) ----------
  function wyrabGracza(map, placedImprovements, hexKey) {
    // main.ts:11321 syncHexUlepszenieFields
    const syncHexUlepszenieFields = (hk, playerLayers) => {
      const hex = map.hexes[hk];
      if (!hex) return;
      if (playerLayers.length) {
        hex.ulepszenia = [...playerLayers];
        hex.improvementKey = playerLayers[playerLayers.length - 1];
        const ul = KEY_TO_ULEPSZENIE[playerLayers[playerLayers.length - 1]] ?? M.Ulepszenie.Brak;
        if (ul !== M.Ulepszenie.Brak) hex.ulepszenie = ul;
      } else {
        delete hex.ulepszenia;
        delete hex.improvementKey;
        hex.ulepszenie = M.Ulepszenie.Brak;
      }
    };
    // main.ts:11892 stripForestDependentImprovements
    const stripForestDependentImprovements = (hk) => {
      const prev = placedImprovements.get(hk) ?? [];
      const next = M.stripImprovementsWhenForestRemoved(prev);
      if (next.length === prev.length) return;
      if (next.length) {
        placedImprovements.set(hk, next);
        syncHexUlepszenieFields(hk, next);
      } else {
        placedImprovements.delete(hk);
        syncHexUlepszenieFields(hk, []);
      }
    };
    // main.ts:11906 finalizeHexClearing
    const hex = map.hexes[hexKey];
    if (hex?.nakladka === Nakladka.Las) hex.nakladka = Nakladka.Brak;
    stripForestDependentImprovements(hexKey);
  }

  // ---- ŚCIEŻKA AI: main.ts:28880 + :28903-28906 — OSOBNA transkrypcja ------------------
  // Celowo NIE wywołuje wyrabGracza(): asercja AI ma być niezależna, nie wnioskiem z gracza.
  function wyrabAI(map, placedImprovements, hexKey) {
    const hexForImprovement = map.hexes[hexKey];
    // main.ts:28880 — bezpiecznik wyścigu miast: bez lasu AI w ogóle nie wycina
    if (hexForImprovement.nakladka !== Nakladka.Las) return 'pominiete-brak-lasu';
    hexForImprovement.nakladka = Nakladka.Brak;            // main.ts:28903
    // main.ts:28904 stripForestDependentImprovements(hexKey) — ta sama funkcja co u gracza,
    // przepisana tu ponownie, żeby ścieżka AI nie zależała od transkrypcji gracza.
    const prev = placedImprovements.get(hexKey) ?? [];
    const next = M.stripImprovementsWhenForestRemoved(prev);
    if (next.length !== prev.length) {
      if (next.length) {
        placedImprovements.set(hexKey, next);
        hexForImprovement.ulepszenia = [...next];
        hexForImprovement.improvementKey = next[next.length - 1];
      } else {
        placedImprovements.delete(hexKey);
        delete hexForImprovement.ulepszenia;
        delete hexForImprovement.improvementKey;
        hexForImprovement.ulepszenie = M.Ulepszenie.Brak;
      }
    }
    return 'wyciete';
  }

  // Świeże mapy z generateMap — osobna dla gracza, osobna dla AI (żaden stan nie przecieka).
  const mkLasHex = (seed, pred) => {
    const mp = M.generateMap(36, 28, seed, 'kontynenty');
    const key = Object.keys(mp.hexes).sort().find(k => pred(mp.hexes[k]));
    return { mp, key };
  };
  const predLasWzg = h => h && h.nakladka === Nakladka.Las && h.terenBazowy === TerenBazowy.Wzgorza;
  const predLas = h => h && h.nakladka === Nakladka.Las;

  // --- P7-A: GRACZ ---------------------------------------------------------
  {
    const { mp, key } = mkLasHex(42, predLasWzg);
    ok(!!key, 'P7-A0 warunek istotności: mapa 42 ma LAS NA WZGÓRZU (heks z generateMap)');
    const hex = mp.hexes[key];
    const stA = stateForWholeMap(mp);
    const qA = M.buildImprovementQualifier(stA);
    ok(qA('oboz_lowiecki', hex.coords.q, hex.coords.r) === true,
      `P7-A1 warunek istotności: obóz JEST tu legalny przed wyrębem ${key}`);
    // Postawienie obozu ścieżką gracza (te same struktury co main.ts applyBuildRequest).
    const placed = new Map([[key, ['oboz_lowiecki']]]);
    hex.ulepszenia = ['oboz_lowiecki'];
    hex.improvementKey = 'oboz_lowiecki';
    ok(qA('wyrab', hex.coords.q, hex.coords.r) === true,
      'P7-A2 warunek istotności: wyrąb JEST dostępny na heksie z obozem (ścieżka realna)');
    wyrabGracza(mp, placed, key);
    console.log(`     [gracz] po wyrębie ${key}: nakladka=${hex.nakladka} placed=${JSON.stringify(placed.get(key) ?? null)} hex.ulepszenia=${JSON.stringify(hex.ulepszenia ?? null)}`);
    ok(hex.nakladka === Nakladka.Brak, 'P7-A3 wyrąb faktycznie zdjął las z heksa');
    ok(!(placed.get(key) ?? []).includes('oboz_lowiecki'),
      'P7-A4 GRACZ: po wyrębie lasu obóz ZNIKA z warstw heksa (placedImprovements)',
      JSON.stringify(placed.get(key) ?? null));
    ok(!(hex.ulepszenia ?? []).includes('oboz_lowiecki'),
      'P7-A5 GRACZ: po wyrębie obóz ZNIKA także z pól heksa idących do zapisu (hex.ulepszenia)',
      JSON.stringify(hex.ulepszenia ?? null));
    ok(M.computeImprovementBuildImpact('oboz_lowiecki', hex, []) === null,
      'P7-A6 GRACZ: na heksie po wyrębie NOWEGO obozu nie postawisz (gate commitu spójny)');
  }

  // --- P7-B: AI (OSOBNA asercja, osobna mapa, osobna transkrypcja) ---------
  {
    const { mp, key } = mkLasHex(1337, predLas);
    ok(!!key, 'P7-B0 warunek istotności: mapa 1337 ma heks z lasem');
    const hex = mp.hexes[key];
    const stB = stateForWholeMap(mp);
    ok(M.buildImprovementQualifier(stB)('oboz_lowiecki', hex.coords.q, hex.coords.r) === true,
      'P7-B1 warunek istotności: obóz legalny na tym heksie przed wyrębem AI');
    const placedAi = new Map([[key, ['oboz_lowiecki']]]);
    hex.ulepszenia = ['oboz_lowiecki'];
    const wynik = wyrabAI(mp, placedAi, key);
    console.log(`     [AI] po wyrębie ${key}: ${wynik} nakladka=${hex.nakladka} placed=${JSON.stringify(placedAi.get(key) ?? null)}`);
    ok(wynik === 'wyciete' && hex.nakladka === Nakladka.Brak,
      'P7-B2 warunek istotności: AI faktycznie wycięło las (nie weszło w continue)');
    ok(!(placedAi.get(key) ?? []).includes('oboz_lowiecki'),
      'P7-B3 AI: po wyrębie lasu obóz ZNIKA z warstw heksa (main.ts:28903-28904)',
      JSON.stringify(placedAi.get(key) ?? null));
    ok(!(hex.ulepszenia ?? []).includes('oboz_lowiecki'),
      'P7-B4 AI: obóz ZNIKA także z pól heksa (hex.ulepszenia)',
      JSON.stringify(hex.ulepszenia ?? null));
  }

  // --- P7-C: TARTAK NIE ZNIKA (kanon) — OSOBNA asercja ---------------------
  // Łatwo go zgubić pisząc filtr zbyt szeroko: tartak też wymaga Nakladka.Las przy budowie.
  {
    const { mp, key } = mkLasHex(2026, predLas);
    ok(!!key, 'P7-C0 warunek istotności: mapa 2026 ma heks z lasem');
    const hex = mp.hexes[key];
    const placedT = new Map([[key, ['tartak']]]);
    hex.ulepszenia = ['tartak'];
    hex.improvementKey = 'tartak';
    wyrabGracza(mp, placedT, key);
    console.log(`     [tartak] po wyrębie ${key}: nakladka=${hex.nakladka} placed=${JSON.stringify(placedT.get(key) ?? null)} hex.ulepszenia=${JSON.stringify(hex.ulepszenia ?? null)}`);
    ok(hex.nakladka === Nakladka.Brak, 'P7-C1 warunek istotności: las zdjęty także w tym przebiegu');
    ok((placedT.get(key) ?? []).includes('tartak'),
      'P7-C2 TARTAK NIE ZNIKA przy wyrębie (kanon: las zostaje przy tartaku)',
      JSON.stringify(placedT.get(key) ?? null));
    ok((hex.ulepszenia ?? []).includes('tartak'),
      'P7-C3 tartak zostaje także w polach heksa (nie skasowany po cichu)',
      JSON.stringify(hex.ulepszenia ?? null));
  }

  // --- P7-D: heks mieszany — znika WYŁĄCZNIE obóz, reszta bez zmian --------
  {
    const { mp, key } = mkLasHex(7, predLas);
    const hex = mp.hexes[key];
    const placedMix = new Map([[key, ['tartak', 'oboz_lowiecki', 'droga']]]);
    hex.ulepszenia = ['tartak', 'oboz_lowiecki', 'droga'];
    wyrabGracza(mp, placedMix, key);
    const po = placedMix.get(key) ?? [];
    console.log(`     [mix] po wyrębie ${key}: ${JSON.stringify(po)}`);
    ok(po.join(',') === 'tartak,droga',
      'P7-D1 heks mieszany: po wyrębie zostaje dokładnie [tartak, droga] — znika tylko obóz',
      JSON.stringify(po));
  }

  // --- P7-E: świadomie NIEUSUWANE, choć Las bywa ich warunkiem -------------
  // farma: Las jest warunkiem tylko na Wzgórzach (isFarmBaseTerrain); kasowanie cudzej farmy
  // to osobna decyzja właściciela (kryt. 6 rundy 1), a kanon trzyma ją w
  // tools/map-improvement-qualify-test.cjs („tartak stays…" — ta sama asercja obejmuje farmę).
  // glinianka: warunkiem jest złoże gliny, nie las.
  {
    const zostaja = M.stripImprovementsWhenForestRemoved(
      ['farma', 'glinianka', 'droga', 'fort', 'kamieniolom', 'irygacja']);
    ok(zostaja.join(',') === 'farma,glinianka,droga,fort,kamieniolom,irygacja',
      'P7-E1 filtr nie jest za szeroki: farma/glinianka/droga/fort/kamieniolom/irygacja ZOSTAJĄ',
      JSON.stringify(zostaja));
    const farmaWzg = M.stripImprovementsWhenForestRemoved(['farma']);
    ok(farmaWzg.join(',') === 'farma',
      'P7-E2 farma na Wzgórzu+Las ZOSTAJE po wyrębie (świadoma decyzja, nie przeoczenie)');
    ok(M.stripImprovementsWhenForestRemoved([]).length === 0,
      'P7-E3 pusta lista warstw nie wybucha i zostaje pusta');
  }

  console.log(`\noboz-lowiecki-las-test: ${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
