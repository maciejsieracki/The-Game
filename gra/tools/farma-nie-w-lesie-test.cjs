'use strict';
/**
 * farma-nie-w-lesie-test.cjs — bramka tematu R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1.
 *
 * GOAL (ECHO wlasciciela 2026-08-27): „w lesie nie powinno byc mozliwosci budowania farm
 * zarowno na wzgorzach, jak i na innych terenach (...) W lesie mozna wybudowac tylko tartak
 * i ewentualnie obozowisko". UCHYLA decyzje z 2026-07-21 („farma MOZE na lesie — bez wyrebu").
 *
 * Regula docelowa: farma kwalifikuje sie WYLACZNIE na Lace i Rowninie BEZ nakladki Las.
 * Konsekwencja (swiadoma, wprost w dispatchu): farma na Wzgorzach staje sie niemozliwa
 * calkowicie — Wzgorza nigdy nie nalezaly do FLAT_FARM, a jedyna sciezka na Wzgorza wiodla
 * przez `nakladka === Las`. Dopisanie Wzgorz do terenow farmowych byloby poszerzeniem
 * zakresu (§14) i wymaga osobnego ECHO — tu tego NIE robimy.
 *
 * Dowodem NIE jest regex po zrodle, tylko POMIAR ZACHOWANIA realnymi funkcjami gry:
 *   • gracz (panel budowy) -> buildImprovementQualifier / createImprovementBuildApi.canBuild
 *   • gracz (commit)       -> computeImprovementBuildImpact  (drugi, niezalezny gate;
 *                             main.ts applyBuildRequest NIE powtarza qualifies())
 *   • AI GRACZA (automat ulepszen wspierajacy gracza) -> pickAutoImprovements
 *   • AI CYWILIZACJI (komputerowi przeciwnicy)        -> pickAutoImprovements przez
 *                             ai.ts planCityImprovements (ta sama funkcja, OSOBNA asercja —
 *                             wnioskowanie „skoro gracz dziala, to AI tez" jest zabronione)
 *   • tooltip heksu        -> buildHexContextTooltipHtml (prawdziwy HTML, nie replika pipeline'u)
 *   • galeria 3D           -> galleryTerrainEligible
 *   • wczytanie zapisu     -> migrateImprovementLayers
 *
 * PULAPKA „p-LAS-kie" (combat.ts:638-646): normTerrain('Plaskie (rownina/laka)') doslownie
 * zawiera podciag 'las'. Sekcja (6) pilnuje, ze rownina BEZ lasu przechodzi (farma DOSTEPNA)
 * i ze zadna sciezka farmy nie kwalifikuje lasu przez .includes('las').
 *
 * ZAKRES TEGO TEMATU: farmy JUZ STOJACE na lesie byly tu pytaniem ABC
 * P-ULEPSZENIA-FARMY-JUZ-STOJACE-W-LESIE-Q1. Rozstrzygniete 2026-08-27 jako wariant C
 * (znikaja) i zrealizowane OSOBNYM tematem R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1
 * z wlasna bramka `tools/farma-lesie-usun-istniejace-test.cjs`. TEN temat i ta bramka
 * nadal dotycza WYLACZNIE kwalifikacji; sekcja (7) pilnuje, ze sprzatanie nie zostalo
 * wlozone do funkcji sprawdzanych tutaj (patrz komentarz przy sekcji (7)).
 *
 * Uruchamiaj z gra/:  node tools/farma-nie-w-lesie-test.cjs
 * Tryb pomiaru (bez asercji, liczby do raportu):  MEASURE=1 node tools/farma-nie-w-lesie-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.FARMA_SRC_DIR || path.resolve(__dirname, '..', 'src');
const TAG = process.env.FARMA_TAG || 'main';
const ENTRY = path.resolve(__dirname, `.farma-nie-w-lesie-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.farma-nie-w-lesie-${TAG}-bundle.cjs`);

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export {
  buildImprovementQualifier,
  createImprovementBuildApi,
  galleryTerrainEligible,
  galleryComboEligible,
  isFarmBaseTerrain,
  isImprovementBlockedOnForest,
  getImprovementForestBlockHint,
  computeImprovementBuildImpact,
  stripImprovementsWhenForestRemoved,
} from ${JSON.stringify(SRC + '/map/improvement-build')};
export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { migrateImprovementLayers } from ${JSON.stringify(SRC + '/game/terrain-improvements')};
export { buildHexContextTooltipHtml } from ${JSON.stringify(SRC + '/ui/hexContextTooltip')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');

// `hexContextTooltip.ts` ciagnie `icons/brandAssets`, ktory na poziomie modulu wola
// `import.meta.glob(...)` — w bundlu cjs to natychmiastowy TypeError. Podmieniamy WYLACZNIE
// ten modul na istniejacy, commitowany stub (ten sam patent co oboz-lowiecki-las-test.cjs).
const BRAND_STUB = path.resolve(__dirname, '.stubs', 'hex-tooltip-zloze-brandAssets-stub.ts');
if (!fs.existsSync(BRAND_STUB)) {
  console.error('[farma-nie-w-lesie-test] brak stuba brandAssets: ' + BRAND_STUB);
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

// --- stan kwalifikatora obejmujacy CALA mape (terytorium = kazdy heks ladu) ----------
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
    researchedTechs: new Set(['rolnictwo', 'Rolnictwo']),
    playerEra: 1,
  }, extra || {});
}

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

// Wspolne wywolanie pickera: TA SAMA funkcja obsluguje AI GRACZA (automat ulepszen) i
// AI CYWILIZACJI (ai.ts planCityImprovements -> pickAutoImprovements). Rozroznienie jest
// w wolajacym, nie w pickerze — dlatego obie role maja nizej OSOBNE asercje.
function pickerPutsFarm(map, q, r) {
  const picks = M.pickAutoImprovements({
    cities: [{ id: 'c0', ownerId: 0, q, r, population: 1 }],
    ownerId: 0,
    map,
    territoryNodes: [{ q, r, ownerId: 0, cityId: 'c0' }],
    placedImprovements: new Map(),
    pracaAvailable: 100000,
    unlockedTechs: new Set(['rolnictwo', 'Rolnictwo']),
    pracaSurplusThreshold: 0,
    pracaBudgetPercent: 100,
    maxItemsPerCity: 5,
    skipWyrab: true,
    playerEra: 1,
    priorityOverride: ['farma'],
  });
  return picks.some(p => p.key === 'farma' && p.q === q && p.r === r);
}

function tooltipListsFarm(map, hex) {
  const html = M.buildHexContextTooltipHtml({
    q: hex.coords.q, r: hex.coords.r, hex, esc: (x) => String(x), currentEra: 99, map,
  });
  const i = html.indexOf('Możliwe ulepszenia (teren)');
  if (i < 0) return false;
  // „Farma" jako pozycja listy; „Farma" nie jest podciagiem innej nazwy ulepszenia.
  return html.slice(i).includes('Farma');
}

// =============================================================================
// POMIAR — ile heksow kwalifikuje sie pod farme, w rozbiciu wymaganym dispatchem
// =============================================================================
const KATEGORIE = [
  ['Laka+Las',        h => h.terenBazowy === TerenBazowy.Laka    && h.nakladka === Nakladka.Las],
  ['Rownina+Las',     h => h.terenBazowy === TerenBazowy.Rownina && h.nakladka === Nakladka.Las],
  ['Wzgorza+Las',     h => h.terenBazowy === TerenBazowy.Wzgorza && h.nakladka === Nakladka.Las],
  ['Laka bez lasu',   h => h.terenBazowy === TerenBazowy.Laka    && h.nakladka !== Nakladka.Las],
  ['Rownina bez lasu',h => h.terenBazowy === TerenBazowy.Rownina && h.nakladka !== Nakladka.Las],
];

function measure(seeds) {
  const rows = [];
  for (const seed of seeds) {
    const map = M.generateMap(36, 28, seed, 'kontynenty');
    const qual = M.buildImprovementQualifier(stateForWholeMap(map));
    const per = {};
    for (const [nazwa] of KATEGORIE) per[nazwa] = { hexow: 0, gracz: 0, commit: 0 };
    for (const hk of Object.keys(map.hexes)) {
      const h = map.hexes[hk];
      if (!h || h.terenBazowy === TerenBazowy.Morze) continue;
      for (const [nazwa, pred] of KATEGORIE) {
        if (!pred(h)) continue;
        per[nazwa].hexow++;
        if (qual('farma', h.coords.q, h.coords.r)) per[nazwa].gracz++;
        if (M.computeImprovementBuildImpact('farma', h, []) !== null) per[nazwa].commit++;
      }
    }
    rows.push({ seed, per, map });
  }
  return rows;
}

function printMeasure(rows) {
  console.log('\nseed  | kategoria          | heksow | GRACZ kwalifikuje | COMMIT przepuszcza');
  for (const r of rows) {
    for (const [nazwa] of KATEGORIE) {
      const c = r.per[nazwa];
      console.log(`${String(r.seed).padEnd(5)} | ${nazwa.padEnd(18)} | ${String(c.hexow).padStart(6)} | ${String(c.gracz).padStart(17)} | ${String(c.commit).padStart(18)}`);
    }
  }
  console.log('\nSUMA po wszystkich ziarnach:');
  for (const [nazwa] of KATEGORIE) {
    const hexow = rows.reduce((s, r) => s + r.per[nazwa].hexow, 0);
    const gracz = rows.reduce((s, r) => s + r.per[nazwa].gracz, 0);
    const commit = rows.reduce((s, r) => s + r.per[nazwa].commit, 0);
    console.log(`  ${nazwa.padEnd(18)} heksow=${hexow}  GRACZ=${gracz}  COMMIT=${commit}`);
  }
}

// =============================================================================
async function main() {
  await buildBundle();
  const seeds = (process.env.FARMA_SEEDS || '42,1337,2026,7,99').split(',').map(Number);

  console.log(`\n=== POMIAR — kwalifikacja farmy (mapa 36x28 „kontynenty", ${seeds.length} ziaren) ===`);
  const rows = measure(seeds);
  printMeasure(rows);

  // Pomiar sciezek nie-licznikowych na PIERWSZYM znalezionym heksie kazdej kategorii
  // (picker i tooltip sa za drogie na pelny skan mapy — mierzone reprezentantem).
  console.log('\n--- reprezentanci kategorii (mapa 42): AI GRACZA / AI CYWILIZACJI / tooltip / galeria ---');
  const gmap = M.generateMap(36, 28, 42, 'kontynenty');
  const gKeys = Object.keys(gmap.hexes).sort();
  const repr = {};
  for (const [nazwa, pred] of KATEGORIE) {
    for (const k of gKeys) {
      const h = gmap.hexes[k];
      if (h && h.terenBazowy !== TerenBazowy.Morze && pred(h)) { repr[nazwa] = h; break; }
    }
  }
  const gQual = M.buildImprovementQualifier(stateForWholeMap(gmap));
  for (const [nazwa] of KATEGORIE) {
    const h = repr[nazwa];
    if (!h) { console.log(`  ${nazwa.padEnd(18)} BRAK heksa na mapie 42`); continue; }
    console.log(`  ${nazwa.padEnd(18)} (${h.coords.q},${h.coords.r})  gracz=${gQual('farma', h.coords.q, h.coords.r)}  picker=${pickerPutsFarm(gmap, h.coords.q, h.coords.r)}  tooltip=${tooltipListsFarm(gmap, h)}  galeria=${M.galleryTerrainEligible('farma', h.terenBazowy)}`);
  }

  if (process.env.MEASURE) return;

  // ==========================================================================
  console.log('\n=== ASERCJE ZACHOWANIA ===');

  // Syntetyczna mikro-mapa — pelna kontrola nad terenem i nakladka.
  const cells = [
    { teren: TerenBazowy.Laka,     nakladka: Nakladka.Las },   // 0: LAS na lace
    { teren: TerenBazowy.Rownina,  nakladka: Nakladka.Las },   // 1: LAS na rowninie
    { teren: TerenBazowy.Wzgorza,  nakladka: Nakladka.Las },   // 2: LAS na wzgorzu
    { teren: TerenBazowy.Laka,     nakladka: Nakladka.Brak },  // 3: laka bez lasu
    { teren: TerenBazowy.Rownina,  nakladka: Nakladka.Brak },  // 4: rownina bez lasu („p-LAS-kie")
    { teren: TerenBazowy.Wzgorza,  nakladka: Nakladka.Brak },  // 5: gole wzgorze
    { teren: TerenBazowy.Pustynia, nakladka: Nakladka.Las },   // 6: las na pustyni
    { teren: TerenBazowy.Pustynia, nakladka: Nakladka.Brak },  // 7: pustynia bez lasu
    { teren: TerenBazowy.Rownina,  nakladka: Nakladka.ZlozeKonia }, // 8: rownina + zloze (nie-las)
    { teren: TerenBazowy.Gory,     nakladka: Nakladka.Brak },  // 9: gory
  ];
  const OCZEK = [false, false, false, true, true, false, false, false, true, false];
  const NAZWY = ['las na LACE', 'las na ROWNINIE', 'LAS NA WZGORZU', 'laka bez lasu',
    'rownina bez lasu', 'gole wzgorze', 'las na pustyni', 'pustynia bez lasu',
    'rownina + zloze konia (bez lasu)', 'gory'];

  const smap = synthMap(cells);
  const st = stateForWholeMap(smap);
  const qual = M.buildImprovementQualifier(st);
  const api = M.createImprovementBuildApi(st, { activeKey: 'farma' });

  // --- (1a) REGULA TERENU — jednostkowo na eksportowanej funkcji -----------
  // ZNALEZISKO MUTACYJNE (patrz raport, mutacja M1): sama `isFarmBaseTerrain` jest w
  // sciezkach zachowania ZAMASKOWANA przez drugi gate (`isImprovementBlockedOnForest`
  // w `computeImprovementBuildImpact`), ktory odcina farme na lesie wczesniej. Cofniecie
  // samej `isFarmBaseTerrain` do reguly z 2026-07-21 NIE zmienia wiec ani jednego wyniku
  // gracza/AI/tooltipa. Zeby ta polowa zmiany nie byla nieweryfikowalna, ponizej asercje
  // WPROST na eksportowanej funkcji — one czerwienia sie pod mutacja M1.
  console.log('\n--- (1a) isFarmBaseTerrain (regula terenu, jednostkowo) ---');
  ok(M.isFarmBaseTerrain(TerenBazowy.Laka, Nakladka.Las) === false,
    'isFarmBaseTerrain: Laka + Las -> false');
  ok(M.isFarmBaseTerrain(TerenBazowy.Rownina, Nakladka.Las) === false,
    'isFarmBaseTerrain: Rownina + Las -> false');
  ok(M.isFarmBaseTerrain(TerenBazowy.Wzgorza, Nakladka.Las) === false,
    'isFarmBaseTerrain: Wzgorza + Las -> false (uchyla regule 2026-07-21)');
  ok(M.isFarmBaseTerrain(TerenBazowy.Wzgorza, Nakladka.Brak) === false,
    'isFarmBaseTerrain: Wzgorza bez lasu -> false (farma na Wzgorzach niemozliwa CALKOWICIE)');
  ok(M.isFarmBaseTerrain(TerenBazowy.Laka, Nakladka.Brak) === true,
    'isFarmBaseTerrain: Laka bez lasu -> true');
  ok(M.isFarmBaseTerrain(TerenBazowy.Rownina, Nakladka.Brak) === true,
    'isFarmBaseTerrain: Rownina bez lasu -> true');
  ok(M.isFarmBaseTerrain(TerenBazowy.Rownina, Nakladka.ZlozeKonia) === true,
    'isFarmBaseTerrain: Rownina + zloze (nakladka != Las) -> true');
  ok(M.isFarmBaseTerrain(TerenBazowy.Pustynia, Nakladka.Brak) === false,
    'isFarmBaseTerrain: Pustynia bez lasu -> false (nie nalezy do FLAT_FARM)');

  // --- (1) GRACZ: panel budowy ---------------------------------------------
  console.log('\n--- (1) GRACZ (panel budowy) ---');
  for (let i = 0; i < cells.length; i++) {
    ok(qual('farma', i, 0) === OCZEK[i],
      `gracz: ${NAZWY[i]} -> farma ${OCZEK[i] ? 'DOSTEPNA' : 'NIEDOSTEPNA'}`,
      `qual=${qual('farma', i, 0)}`);
  }
  ok(api.canBuild('farma', 0, 0) === false, 'gracz (build API): las na lace -> canBuild=false');
  ok(api.canBuild('farma', 2, 0) === false, 'gracz (build API): LAS NA WZGORZU -> canBuild=false');
  ok(api.canBuild('farma', 3, 0) === true,  'gracz (build API): laka bez lasu -> canBuild=true');

  // --- (2) GRACZ: commit (drugi, niezalezny gate) ---------------------------
  console.log('\n--- (2) GRACZ (commit — computeImprovementBuildImpact) ---');
  for (let i = 0; i < cells.length; i++) {
    const hex = smap.hexes[`${i},0`];
    const wolno = M.computeImprovementBuildImpact('farma', hex, []) !== null;
    // commit nie zna terytorium ani terenow FLAT_FARM — pilnuje wylacznie blokady lasu.
    const oczekCommit = hex.nakladka !== Nakladka.Las;
    ok(wolno === oczekCommit,
      `commit: ${NAZWY[i]} -> impact ${oczekCommit ? '!=' : '=='} null`, `wolno=${wolno}`);
  }
  ok(M.isImprovementBlockedOnForest('farma', Nakladka.Las) === true,
    'commit: farma jest na liscie ulepszen ZABRONIONYCH na lesie (bylo: coexist)');
  ok(M.isImprovementBlockedOnForest('farma', Nakladka.Brak) === false,
    'commit: poza lasem farma nie jest blokowana');
  ok(M.isImprovementBlockedOnForest('tartak', Nakladka.Las) === false,
    'kanon: tartak nadal WOLNO na lesie (ECHO: „w lesie tylko tartak i obozowisko")');
  ok(M.isImprovementBlockedOnForest('oboz_lowiecki', Nakladka.Las) === false,
    'kanon: oboz lowiecki nadal WOLNO na lesie');
  const hint = M.getImprovementForestBlockHint('farma');
  ok(/wyr[aą]b/i.test(hint) && /farm/i.test(hint),
    'UX: podpowiedz przy probie budowy farmy na lesie kieruje na wyrab', hint);

  // --- (3) AI GRACZA (automat ulepszen wspierajacy gracza) ------------------
  console.log('\n--- (3) AI GRACZA (automat ulepszen) ---');
  for (let i = 0; i < cells.length; i++) {
    const one = synthMap([cells[i]]);
    ok(pickerPutsFarm(one, 0, 0) === OCZEK[i],
      `AI GRACZA: ${NAZWY[i]} -> automat ${OCZEK[i] ? 'stawia' : 'NIE stawia'} farmy`);
  }

  // --- (4) AI CYWILIZACJI (komputerowi przeciwnicy) ------------------------
  // ai.ts planCityImprovements wola DOKLADNIE pickAutoImprovements (patrz docstring
  // „Reuzywa buildImprovementQualifier (...) zero nowej logiki kwalifikacji"). Asercja
  // OSOBNA, na ownerId != gracz, zeby nie byla wnioskiem ze sciezki gracza.
  console.log('\n--- (4) AI CYWILIZACJI (komputerowi przeciwnicy) ---');
  const pickerAiCiv = (map, q, r) => {
    const picks = M.pickAutoImprovements({
      cities: [{ id: 'ai1', ownerId: 3, q, r, population: 1 }],
      ownerId: 3,
      map,
      territoryNodes: [{ q, r, ownerId: 3, cityId: 'ai1' }],
      placedImprovements: new Map(),
      pracaAvailable: 100000,
      unlockedTechs: new Set(['rolnictwo', 'Rolnictwo']),
      pracaSurplusThreshold: 0, pracaBudgetPercent: 100, maxItemsPerCity: 5,
      skipWyrab: true, playerEra: 1, priorityOverride: ['farma'],
    });
    return picks.some(p => p.key === 'farma' && p.q === q && p.r === r);
  };
  for (let i = 0; i < cells.length; i++) {
    const one = synthMap([cells[i]]);
    ok(pickerAiCiv(one, 0, 0) === OCZEK[i],
      `AI CYWILIZACJI: ${NAZWY[i]} -> AI ${OCZEK[i] ? 'stawia' : 'NIE stawia'} farmy`);
  }

  // --- (5) TOOLTIP heksu + galeria 3D --------------------------------------
  console.log('\n--- (5) TOOLTIP heksu (prawdziwy HTML) + galeria 3D ---');
  for (let i = 0; i < cells.length; i++) {
    const one = synthMap([cells[i]]);
    ok(tooltipListsFarm(one, one.hexes['0,0']) === OCZEK[i],
      `tooltip: ${NAZWY[i]} -> „Farma" ${OCZEK[i] ? 'JEST' : 'NIE ma jej'} na liscie`);
  }
  ok(M.galleryTerrainEligible('farma', TerenBazowy.Wzgorza) === false,
    'galeria 3D: Wzgorza NIE sa juz terenem farmowym (jedyna sciezka wiodla przez Las)');
  ok(M.galleryTerrainEligible('farma', TerenBazowy.Laka) === true, 'galeria 3D: Laka OK');
  ok(M.galleryTerrainEligible('farma', TerenBazowy.Rownina) === true, 'galeria 3D: Rownina OK');
  ok(M.galleryComboEligible(['farma', 'irygacja'], TerenBazowy.Wzgorza) === false,
    'galeria 3D: combo farma+irygacja na Wzgorzach niedozwolone');

  // --- (6) PULAPKA „p-LAS-kie" ---------------------------------------------
  console.log('\n--- (6) PULAPKA „p-LAS-kie" ---');
  const NAZWA_ROWNINY = 'Plaskie (rownina/laka)';
  ok(NAZWA_ROWNINY.toLowerCase().includes('las') === true,
    'pulapka: nazwa rowniny FAKTYCZNIE zawiera podciag „las" (warunek istotnosci testu)');
  ok(qual('farma', 4, 0) === true && qual('farma', 8, 0) === true,
    'pulapka: mimo podciagu „las" w nazwie rowniny farma na ROWNINIE BEZ LASU jest DOSTEPNA');
  ok(qual('farma', 1, 0) === false,
    'pulapka: rozroznienie dziala w druga strone — rownina Z LASEM jest NIEDOSTEPNA');
  ok(M.computeImprovementBuildImpact('farma', smap.hexes['4,0'], []) !== null
    && M.computeImprovementBuildImpact('farma', smap.hexes['1,0'], []) === null,
    'pulapka: commit tez odroznia rownine bez lasu od rowniny z lasem');
  for (const rel of ['map/improvement-build.ts', 'ui/hexContextTooltip.ts', 'game/auto-improvements.ts']) {
    const txt = fs.readFileSync(path.resolve(SRC, rel), 'utf8');
    ok(!/includes\(\s*['"]las['"]\s*\)/i.test(txt),
      `pulapka: ${rel} nie kwalifikuje lasu przez .includes('las')`);
  }

  // --- (7) ZAKRES TEGO TEMATU: farmy JUZ STOJACE na lesie ------------------
  // Dispatch tego tematu: „Istniejacych farm nie ruszamy w zadna strone" — TEN temat
  // zmienia wylacznie KWALIFIKACJE (czy wolno zbudowac), nigdy istniejacy stan.
  //
  // AKTUALIZACJA 2026-08-27 (R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1, wariant C):
  // pytanie P-ULEPSZENIA-FARMY-JUZ-STOJACE-W-LESIE-Q1 zostalo rozstrzygniete —
  // istniejace farmy w lesie ZNIKAJA. Robi to OSOBNA, niezalezna warstwa
  // (map/improvement-build.ts::removeLegacyFarmsOnForest + game/save.ts::
  // migrateLegacyFarmsOnForestInSave), a NIE funkcje sprawdzane nizej. Asercje zostaja
  // bez zmian i nadal sa STRAZNIKIEM: pilnuja, ze sprzatanie nie zostalo wlozone do
  // `migrateImprovementLayers` (migracja KLUCZY legacy) ani do
  // `stripImprovementsWhenForestRemoved` (wyrab lasu) — zlanie tych warstw kasowaloby
  // farme przy wyrebie, czyli dokladnie odwrotnie niz kanon. Zmieniono TYLKO opisy
  // asercji, ktore twierdzily, ze farma w lesie „przezywa"; nic w logice testu.
  console.log('\n--- (7) STRAZNIK ZAKRESU: farmy juz stojace na lesie ---');
  const migLas = M.migrateImprovementLayers(['farma'], { nakladka: Nakladka.Las });
  ok(migLas.length === 1 && migLas.includes('farma'),
    'zakres: migracja KLUCZY legacy (migrateImprovementLayers) nie jest miejscem kasowania farmy w lesie',
    JSON.stringify(migLas));
  const migLasMix = M.migrateImprovementLayers(['farma', 'tartak'], { nakladka: Nakladka.Las });
  ok(migLasMix.length === 2 && migLasMix.includes('farma'),
    'zakres: migracja kluczy nie rusza zadnej warstwy heksa lesnego (kasowanie = osobna warstwa)',
    JSON.stringify(migLasMix));
  ok(M.stripImprovementsWhenForestRemoved(['farma']).includes('farma'),
    'zakres: wyrab lasu spod farmy NIE kasuje farmy (farma nie jest ulepszeniem zaleznym od lasu)');
  const stStojaca = stateForWholeMap(smap, {
    placedImprovements: new Map([['2,0', ['farma']]]),
  });
  const apiStojaca = M.createImprovementBuildApi(stStojaca, { activeKey: 'farma' });
  ok(apiStojaca.canBuild('farma', 2, 0) === false,
    'zakres: na heksie ze stojaca farma w lesie nie da sie postawic NOWEJ farmy');

  // --- (8) MAPA FAKTYCZNIE WYGENEROWANA (nie syntetyk) ---------------------
  console.log('\n--- (8) MAPA Z generateMap (nie syntetyk) ---');
  const gCases = [
    ['Laka+Las', KATEGORIE[0][1], false],
    ['Rownina+Las', KATEGORIE[1][1], false],
    ['Wzgorza+Las', KATEGORIE[2][1], false],
    ['Laka bez lasu', KATEGORIE[3][1], true],
    ['Rownina bez lasu', KATEGORIE[4][1], true],
  ];
  for (const [nazwa, pred, oczek] of gCases) {
    const h = repr[nazwa];
    ok(!!h, `mapa 42: istnieje heks „${nazwa}" (warunek istotnosci)`);
    if (!h) continue;
    const co = `(${h.coords.q},${h.coords.r})`;
    ok(gQual('farma', h.coords.q, h.coords.r) === oczek,
      `mapa 42 ${co} „${nazwa}" GRACZ: farma ${oczek ? 'DOSTEPNA' : 'NIEDOSTEPNA'}`);
    ok(pickerPutsFarm(gmap, h.coords.q, h.coords.r) === oczek,
      `mapa 42 ${co} „${nazwa}" AI GRACZA + AI CYWILIZACJI: picker ${oczek ? 'stawia' : 'NIE stawia'} farmy`);
    ok(tooltipListsFarm(gmap, h) === oczek,
      `mapa 42 ${co} „${nazwa}" TOOLTIP: „Farma" ${oczek ? 'JEST' : 'NIE ma jej'} na liscie`);
    ok((M.computeImprovementBuildImpact('farma', h, []) !== null) === oczek,
      `mapa 42 ${co} „${nazwa}" COMMIT: impact ${oczek ? '!=' : '=='} null`);
  }

  // --- (9) POMIAR PO: trzy kategorie lesne musza byc ZEROWE na kazdym ziarnie
  console.log('\n--- (9) POMIAR PO — kategorie lesne zerowe, nielesne niepuste ---');
  for (const r of rows) {
    for (const nazwa of ['Laka+Las', 'Rownina+Las', 'Wzgorza+Las']) {
      const c = r.per[nazwa];
      ok(c.gracz === 0 && c.commit === 0,
        `ziarno ${r.seed}: „${nazwa}" — 0 heksow kwalifikujacych (heksow tej kategorii: ${c.hexow})`,
        `gracz=${c.gracz} commit=${c.commit}`);
    }
    for (const nazwa of ['Laka bez lasu', 'Rownina bez lasu']) {
      const c = r.per[nazwa];
      ok(c.hexow > 0 && c.gracz === c.hexow,
        `ziarno ${r.seed}: „${nazwa}" — WSZYSTKIE ${c.hexow} heksow nadal kwalifikuja (brak regresu)`,
        `gracz=${c.gracz}/${c.hexow}`);
    }
  }

  // --- (10) DANE: terrain-improvements.json uzgodnione z regula ------------
  console.log('\n--- (10) DANE terrain-improvements.json ---');
  const IMP = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '..', 'data', 'terrain-improvements.json'), 'utf8'));
  const f = IMP.farma;
  ok(!/Wzgórza z lasem/i.test(f.teren), 'JSON: farma.teren nie obiecuje juz „Wzgórza z lasem"', f.teren);
  ok(/Łąka/.test(f.teren) && /Równina/.test(f.teren), 'JSON: farma.teren nadal wymienia Łąkę i Równinę', f.teren);
  ok(/NIE na lesie|nie na lesie/.test(f.warunek), 'JSON: farma.warunek mowi wprost o zakazie lasu', f.warunek);
  // R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1 (2026-09-03): `warunek` jest tekstem DLA GRACZA,
  // renderowanym na karcie ulepszenia (improvementAdapter.ts) — surowa notatka deweloperska
  // (daty decyzji, cytaty ECHO, ID tematow) przeniesiona do nierenderowanego pola `uwagi`,
  // wzorzec P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1. Historia decyzji NIE jest wymazywana — zmienia
  // sie tylko nosnik, wiec asercje historii czytaja teraz `uwagi` zamiast `warunek`.
  ok(/2026-08-27/.test(f.uwagi || ''), 'JSON: farma.uwagi nosi date nowej decyzji', f.uwagi);
  ok(/2026-07-21/.test(f.uwagi || ''), 'JSON: farma.uwagi zachowuje slad decyzji uchylonej (nie wymazuje historii)', f.uwagi);
  ok(/ECHO/.test(f.uwagi || '') && /w lesie można wybudować tylko tartak/.test(f.uwagi || ''),
    'JSON: farma.uwagi zachowuje CYTAT ECHO wlasciciela (nie sama date)', f.uwagi);
  // KRYTERIUM 5 dispatchu — kontrola POZYTYWNA na tekscie WIDZIANYM PRZEZ GRACZA.
  // Zywy odpowiednik: (B8) w tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs.
  ok(!/\b[A-Z]-[A-ZŁŚŻŹĆŃÓĘĄ0-9-]+-Q\d|ECHO|właściciel|RUNDA \d|COFNIĘT|\d{4}-\d{2}-\d{2}/.test(f.warunek || ''),
    'JSON: farma.warunek (tekst gracza) bez sygnatury notatki deweloperskiej', f.warunek);

  console.log(`\nfarma-nie-w-lesie-test: ${pass} passed, ${fail} failed`);
  try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
  try { fs.unlinkSync(BUNDLE); } catch { /* ignore */ }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
