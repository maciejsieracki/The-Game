'use strict';
/**
 * farma-lesie-usun-istniejace-test.cjs — bramka tematu
 * R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1.
 *
 * GOAL (ECHO wlasciciela 2026-08-27, wariant C turnieju): zaden stan gry — nowa partia,
 * trwajaca partia, wczytany zapis — nie zawiera farmy stojacej na heksie z nakladka Las.
 * Kazda taka farma (relikt uchylonej reguly z 2026-07-21) znika; LAS ZOSTAJE nietkniety;
 * praca wlozona w farme NIE wraca (wzorzec z decyzji o obozie lowieckim, ten sam dzien).
 * Dotyczy takze farm na Wzgorzach — te sa farmami lesnymi z definicji starej reguly
 * (jedyna droga na Wzgorza wiodla przez `nakladka === Las`), wiec znikaja bez wyjatku
 * terenowego.
 *
 * Dowodem NIE jest regex po zrodle, tylko POMIAR ZACHOWANIA realnymi funkcjami gry:
 *   • zywy stan gry  -> map/improvement-build.ts::removeLegacyFarmsOnForest
 *                       (+ planLegacyFarmOnForestRemoval, stripLegacyFarmOnForest)
 *   • wczytanie zapisu -> PELNY round-trip PRODUKCYJNY, bez zadnej repliki:
 *                       map/mapSnapshot.ts::serializeMapForSave -> game/save.ts::serializeGame
 *                       -> game/save.ts::deserializeGame (tam siedzi migracja ladunku)
 *                       -> map/mapSnapshot.ts::buildGameMapFromSnapshot
 *   • ekonomia miasta -> game/turn-economy.ts::hexToWorkedTile + game/economy.ts::tileYield
 *                       (realna sciezka plonu heksa, nie replika)
 *   • nowa partia     -> map/generator.ts::generateMap (POMIAR, nie zalozenie)
 *
 * OGRANICZENIE DOWODU (§13a — brak dowodu raportujemy jako brak dowodu): wpiecie w
 * `gra/src/main.ts` (dwa wywolania `sweepLegacyFarmsOnForest`) NIE jest tu dowiedzione
 * pomiarem — main.ts nie da sie zbundlowac samodzielnie (caly silnik + DOM + THREE).
 * Sekcja (7) sprawdza je STRUKTURALNIE po zrodle i jest jawnie oznaczona jako slabszy
 * rodzaj dowodu. Zielona bramka NIE jest dowodem zachowania w przegladarce.
 *
 * Uruchamiaj z gra/:  node tools/farma-lesie-usun-istniejace-test.cjs
 * Pomiar bez asercji: MEASURE=1 node tools/farma-lesie-usun-istniejace-test.cjs
 * Dowod mutacyjny:    USUN_SRC_DIR=/tmp/<kopia-src> USUN_TAG=mut node tools/farma-lesie-usun-istniejace-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.USUN_SRC_DIR || path.resolve(__dirname, '..', 'src');
const TAG = process.env.USUN_TAG || 'main';
const ENTRY = path.resolve(__dirname, `.farma-lesie-usun-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.farma-lesie-usun-${TAG}-bundle.cjs`);

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export {
  isLegacyFarmOnForestLayer,
  stripLegacyFarmOnForest,
  planLegacyFarmOnForestRemoval,
  removeLegacyFarmsOnForest,
  stripImprovementsWhenForestRemoved,
  isFarmBaseTerrain,
  isImprovementBlockedOnForest,
} from ${JSON.stringify(SRC + '/map/improvement-build')};
export {
  improvementKeysForHex,
  migrateImprovementLayers,
  FARMA_POTENTIAL_FOOD_BONUS,
} from ${JSON.stringify(SRC + '/game/terrain-improvements')};
export {
  serializeGame,
  deserializeGame,
  migrateLegacyFarmsOnForestInSave,
  SAVE_VERSION,
} from ${JSON.stringify(SRC + '/game/save')};
export {
  serializeMapForSave,
  buildGameMapFromSnapshot,
  isValidMapSnapshot,
} from ${JSON.stringify(SRC + '/map/mapSnapshot')};
export { hexToWorkedTile } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { tileYield } from ${JSON.stringify(SRC + '/game/economy')};
export { TerenBazowy, Nakladka, Ulepszenie } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');

let M, TerenBazowy, Nakladka, Ulepszenie;
async function buildBundle() {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
    absWorkingDir: path.resolve(__dirname, '..'),
    logLevel: 'warning',
  });
  delete require.cache[require.resolve(BUNDLE)];
  M = require(BUNDLE);
  ({ TerenBazowy, Nakladka, Ulepszenie } = M);
}

let pass = 0, fail = 0;
const ok = (cond, name, extra) => {
  if (cond) { pass++; console.log(`  [OK] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name}${extra ? ' :: ' + extra : ''}`); }
};

// ---------------------------------------------------------------------------
// Pomocnicze: syntetyczna mapa + odtworzenie STAREJ REGULY 2026-07-21
// ---------------------------------------------------------------------------

/** Heks syntetyczny w ksztalcie, ktorego uzywa produkcja (coords + pola dynamiczne). */
function hex(q, r, teren, nakladka) {
  return {
    coords: { q, r },
    terenBazowy: teren,
    nakladka: nakladka || Nakladka.Brak,
    ulepszenie: Ulepszenie.Brak,
    wlasciciel: null,
    wioska: { istnieje: false, ludnosc: 0 },
    widocznosc: {},
    rzeka: { obecna: false, krawedzie: [] },
  };
}

/**
 * Stara regula 2026-07-21 („farma MOZE na lesie — bez wyrebu; Laka/Rownina zawsze,
 * Wzgorza gdy nakladka Las"). Odtworzona TU, w scenariuszu testowym, bo w zrodle jej
 * juz nie ma (uchylona przez R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1) — dispatch wymaga
 * scenariusza odtwarzajacego stan sprzed tej zmiany.
 */
function staraRegulaPozwalaNaFarme(h) {
  if (h.nakladka === Nakladka.Las) {
    return h.terenBazowy === TerenBazowy.Laka
        || h.terenBazowy === TerenBazowy.Rownina
        || h.terenBazowy === TerenBazowy.Wzgorza;
  }
  return h.terenBazowy === TerenBazowy.Laka || h.terenBazowy === TerenBazowy.Rownina;
}

/**
 * Zapisuje warstwy na heksie DOKLADNIE tak, jak robil to silnik przed ta zmiana
 * (main.ts::syncHexUlepszenieFields): `ulepszenia` + `improvementKey` + legacy
 * pole `ulepszenie`. To jest przygotowanie DANYCH WEJSCIOWYCH scenariusza (stan
 * sprzed naprawy), nie replika naprawianej logiki.
 */
function setHexLayers(h, layers) {
  if (layers.length) {
    h.ulepszenia = [...layers];
    h.improvementKey = layers[layers.length - 1];
    if (layers.includes('farma')) h.ulepszenie = Ulepszenie.Farma;
  } else {
    delete h.ulepszenia;
    delete h.improvementKey;
    h.ulepszenie = Ulepszenie.Brak;
  }
}

/** Zasiewa mape farmami wg STAREJ reguly. Zwraca Map placedImprovements + liczniki. */
function zasiejStareFarmy(map, opts) {
  const withTartak = (opts && opts.withTartak) || false;
  const placed = new Map();
  let naLesie = 0, naOtwartym = 0;
  const keys = Object.keys(map.hexes);
  for (let i = 0; i < keys.length; i++) {
    const h = map.hexes[keys[i]];
    if (!h || !staraRegulaPozwalaNaFarme(h)) continue;
    const layers = (withTartak && h.nakladka === Nakladka.Las && i % 3 === 0)
      ? ['farma', 'tartak']
      : ['farma'];
    placed.set(keys[i], layers);
    setHexLayers(h, layers);
    if (h.nakladka === Nakladka.Las) naLesie++; else naOtwartym++;
  }
  return { placed, naLesie, naOtwartym };
}

/** Ile heksow ma farme wg REALNEJ sciezki plonow (`improvementKeysForHex`). */
function policzFarmy(map, predicate) {
  let n = 0;
  for (const hk of Object.keys(map.hexes)) {
    const h = map.hexes[hk];
    if (!h || !predicate(h)) continue;
    if (M.improvementKeysForHex(h).includes('farma')) n++;
  }
  return n;
}
const NA_LESIE = h => h.nakladka === Nakladka.Las;
const NA_OTWARTYM = h => h.nakladka !== Nakladka.Las;

/** Ile heksow ma nakladke Las (kontrola: las MUSI zostac nietkniety). */
function policzLasy(map) {
  let n = 0;
  for (const hk of Object.keys(map.hexes)) if (map.hexes[hk] && map.hexes[hk].nakladka === Nakladka.Las) n++;
  return n;
}

/**
 * Rola integratora (w produkcji: main.ts::sweepLegacyFarmsOnForest) — synchronizacja
 * pol heksa po usunieciu warstwy. Testowana funkcja to `removeLegacyFarmsOnForest`;
 * to jest tylko ujscie jej callbacku. Wpiecie w main.ts sprawdza sekcja (7).
 */
function zastosujSprzatanie(map, placed) {
  return M.removeLegacyFarmsOnForest(map.hexes, placed, (hexKey, layers) => {
    const h = map.hexes[hexKey];
    if (!h) return;
    if (h.ulepszenie === Ulepszenie.Farma) h.ulepszenie = Ulepszenie.Brak;
    setHexLayers(h, layers);
  });
}

/** Buduje SaveGame w ksztalcie produkcyjnym (main.ts::buildSaveGameSnapshot, wycinek istotny). */
function zbudujZapis(map, placed) {
  return {
    wersja: M.SAVE_VERSION,
    tura: 12,
    seed: map.seed,
    units: [],
    cities: [],
    explored: [],
    meta: { placedImprovements: Array.from(placed.entries()) },
    mapSnapshot: M.serializeMapForSave(map),
  };
}

const SEEDS = [42, 4242, 777, 90210];

// =============================================================================
// POMIAR (MEASURE=1) — liczby do raportu, bez asercji
// =============================================================================
function measure() {
  console.log('seed | farmy na LESIE PRZED | PO | farmy na OTWARTYM PRZED | PO | heksy z Las PRZED | PO');
  for (const seed of SEEDS) {
    const map = M.generateMap(36, 28, seed, 'kontynenty');
    const z = zasiejStareFarmy(map, { withTartak: true });
    const przedLes = policzFarmy(map, NA_LESIE);
    const przedOtw = policzFarmy(map, NA_OTWARTYM);
    const przedLas = policzLasy(map);
    zastosujSprzatanie(map, z.placed);
    console.log([
      seed, przedLes, policzFarmy(map, NA_LESIE),
      przedOtw, policzFarmy(map, NA_OTWARTYM),
      przedLas, policzLasy(map),
    ].join(' | '));
  }
}

// =============================================================================
// ASERCJE
// =============================================================================
function run() {
  // --- (1) PRYMITYWY REGULY ------------------------------------------------
  console.log('\n--- (1) PRYMITYWY: farma + Las ---');
  ok(M.isLegacyFarmOnForestLayer('farma', Nakladka.Las) === true,
    'prymityw: farma na Las = relikt do usuniecia');
  ok(M.isLegacyFarmOnForestLayer('farma', Nakladka.Brak) === false,
    'prymityw: farma bez lasu NIE jest reliktem');
  ok(M.isLegacyFarmOnForestLayer('tartak', Nakladka.Las) === false,
    'prymityw: tartak na Las NIE jest reliktem (ma wlasna, odrebna zasade)');
  ok(M.isLegacyFarmOnForestLayer('oboz_lowiecki', Nakladka.Las) === false,
    'prymityw: oboz lowiecki na Las NIE jest reliktem');
  ok(M.isLegacyFarmOnForestLayer('glinianka', Nakladka.Las) === false,
    'prymityw: glinianka na Las NIE jest reliktem');
  ok(M.isLegacyFarmOnForestLayer('irygacja', Nakladka.Las) === false,
    'zakres §14: irygacja na lesie NIE jest ruszana tym tematem');
  for (const n of [Nakladka.Brak, Nakladka.ZlozeGliny, Nakladka.ZlozeRudy, Nakladka.ZlozeKonia,
    Nakladka.ZlozeOwiec, Nakladka.ZlozeBydla, Nakladka.ZlozeLamy]) {
    ok(M.isLegacyFarmOnForestLayer('farma', n) === false,
      `prymityw: farma na nakladce „${n}" (nie-las) NIE jest reliktem`);
  }
  const s1 = M.stripLegacyFarmOnForest(['farma', 'tartak'], Nakladka.Las);
  ok(s1.length === 1 && s1[0] === 'tartak',
    'strip: z lesnego heksa znika TYLKO farma, tartak zostaje', JSON.stringify(s1));
  const s2 = M.stripLegacyFarmOnForest(['farma', 'droga'], Nakladka.Brak);
  ok(s2.length === 2 && s2.includes('farma'),
    'strip: poza lasem lista wraca bez zmian', JSON.stringify(s2));
  ok(M.stripLegacyFarmOnForest([], Nakladka.Las).length === 0,
    'strip: pusta lista na lesie = pusta lista (brak wyjatku)');

  // --- (2) SYNTETYK: kazdy teren bazowy pod lasem + kontrola ---------------
  console.log('\n--- (2) SYNTETYK: wszystkie tereny, las vs otwarte ---');
  {
    const hexes = {
      '0,0': hex(0, 0, TerenBazowy.Laka, Nakladka.Las),
      '1,0': hex(1, 0, TerenBazowy.Rownina, Nakladka.Las),
      '2,0': hex(2, 0, TerenBazowy.Wzgorza, Nakladka.Las),
      '3,0': hex(3, 0, TerenBazowy.Laka, Nakladka.Brak),
      '4,0': hex(4, 0, TerenBazowy.Rownina, Nakladka.Brak),
      '5,0': hex(5, 0, TerenBazowy.Rownina, Nakladka.Las),   // farma + tartak
      '6,0': hex(6, 0, TerenBazowy.Laka, Nakladka.Las),      // sam tartak, bez farmy
      '7,0': hex(7, 0, TerenBazowy.Laka, Nakladka.Las),      // farma+tartak TYLKO w polach heksa
    };
    const map = { hexes, szerokoscQ: 8, wysokoscR: 1, seed: 1, riverPaths: [] };
    const placed = new Map();
    for (const hk of ['0,0', '1,0', '2,0', '3,0', '4,0']) { placed.set(hk, ['farma']); setHexLayers(hexes[hk], ['farma']); }
    placed.set('5,0', ['farma', 'tartak']); setHexLayers(hexes['5,0'], ['farma', 'tartak']);
    placed.set('6,0', ['tartak']); setHexLayers(hexes['6,0'], ['tartak']);
    setHexLayers(hexes['7,0'], ['farma', 'tartak']); // BEZ wpisu w placedImprovements (stan z mapSnapshotu)

    const plan = M.planLegacyFarmOnForestRemoval(hexes, placed);
    ok(plan.scanned === 8, 'plan: przejrzano wszystkie 8 heksow (kontrola istotnosci)', String(plan.scanned));
    ok(plan.removed === 5, 'plan: 5 heksow z farma na lesie (Laka/Rownina/Wzgorza/mix/tylko-pola)', String(plan.removed));
    ok(plan.farmsOnOpenTerrain === 2, 'plan: 2 farmy na otwartym terenie policzone OSOBNO', String(plan.farmsOnOpenTerrain));

    const rep = zastosujSprzatanie(map, placed);
    ok(rep.removed === 5, 'usuniecie: 5 farm-reliktow zniknelo', String(rep.removed));
    ok(!placed.has('0,0') && !placed.has('1,0') && !placed.has('2,0'),
      'usuniecie: heksy z sama farma znikaja z rejestru placedImprovements');
    ok(M.improvementKeysForHex(hexes['2,0']).length === 0,
      'WZGORZA+Las: farma znika BEZ wyjatku terenowego (byla farma lesna z definicji starej reguly)');
    ok(hexes['2,0'].nakladka === Nakladka.Las && hexes['1,0'].nakladka === Nakladka.Las
      && hexes['0,0'].nakladka === Nakladka.Las,
      'LAS ZOSTAJE: nakladka Las nietknieta na kazdym sprzatanym heksie');
    ok(hexes['0,0'].ulepszenie === Ulepszenie.Brak,
      'heks wraca do stanu „las, bez ulepszenia" (legacy pole `ulepszenie` = brak)');
    const l5 = placed.get('5,0');
    ok(!!l5 && l5.length === 1 && l5[0] === 'tartak',
      'mix farma+tartak na lesie: znika TYLKO farma, tartak zostaje', JSON.stringify(l5));
    ok(M.improvementKeysForHex(hexes['5,0']).join(',') === 'tartak',
      'mix: pola heksa (zrodlo plonow) tez pokazuja juz tylko tartak');
    ok(placed.get('6,0') && placed.get('6,0')[0] === 'tartak',
      'heks z samym tartakiem w lesie: NIETKNIETY');
    ok(M.improvementKeysForHex(hexes['7,0']).join(',') === 'tartak',
      'farma obecna TYLKO w polach heksa (bez wpisu w rejestrze) tez znika, tartak zostaje',
      JSON.stringify(M.improvementKeysForHex(hexes['7,0'])));
    ok(placed.has('7,0') === false,
      'sprzatanie NIE tworzy wpisu w rejestrze tam, gdzie go nie bylo (naprawa nie jest za szeroka)');
    ok(placed.get('3,0') && placed.get('3,0')[0] === 'farma'
      && placed.get('4,0') && placed.get('4,0')[0] === 'farma',
      'KONTROLA: farmy na Lace/Rowninie BEZ lasu przetrwaly bez zmian');
    ok(M.improvementKeysForHex(hexes['3,0']).includes('farma')
      && hexes['3,0'].ulepszenie === Ulepszenie.Farma,
      'KONTROLA: pola heksa farmy na otwartym terenie nietkniete');

    // --- (2b) IDEMPOTENCJA (kryterium 4) ---
    let drugieWywolania = 0;
    const rep2 = M.removeLegacyFarmsOnForest(hexes, placed, () => { drugieWywolania++; });
    ok(rep2.removed === 0, 'idempotencja: drugi przebieg usuwa 0 heksow', String(rep2.removed));
    ok(drugieWywolania === 0, 'idempotencja: drugi przebieg nie zglasza ZADNEJ zmiany heksa');
    // 4 wpisy: 3,0 + 4,0 (farmy na otwartym) oraz 5,0 + 6,0 (tartaki w lesie).
    ok(placed.size === 4, 'idempotencja: rejestr bez zmian po drugim przebiegu (4 wpisy)', String(placed.size));
    ok(M.improvementKeysForHex(hexes['3,0']).includes('farma'),
      'idempotencja: drugi przebieg nie kasuje niczego ponownie (kontrolna farma stoi)');
    const rep3 = M.removeLegacyFarmsOnForest(hexes, placed);
    ok(rep3.removed === 0, 'idempotencja: trzeci przebieg BEZ callbacku nie rzuca bledu i nie zmienia nic');
  }

  // --- (3) SKUTEK EKONOMICZNY (kryterium 2) --------------------------------
  console.log('\n--- (3) SKUTEK: miasto traci plon z farmy, las zostaje ---');
  {
    const hLes = hex(0, 0, TerenBazowy.Laka, Nakladka.Las);
    const hLesGoly = hex(1, 0, TerenBazowy.Laka, Nakladka.Las);
    const hOtw = hex(2, 0, TerenBazowy.Laka, Nakladka.Brak);
    setHexLayers(hLes, ['farma']);
    setHexLayers(hOtw, ['farma']);
    const hexes = { '0,0': hLes, '1,0': hLesGoly, '2,0': hOtw };
    const placed = new Map([['0,0', ['farma']], ['2,0', ['farma']]]);
    const zywnoscPrzed = M.tileYield(M.hexToWorkedTile(hLes)).zywnosc;
    const zywnoscOtwPrzed = M.tileYield(M.hexToWorkedTile(hOtw)).zywnosc;
    zastosujSprzatanie({ hexes }, placed);
    const zywnoscPo = M.tileYield(M.hexToWorkedTile(hLes)).zywnosc;
    const zywnoscGoly = M.tileYield(M.hexToWorkedTile(hLesGoly)).zywnosc;
    ok(zywnoscPrzed > zywnoscPo,
      'skutek: zywnosc heksa SPADA po usunieciu farmy', `${zywnoscPrzed} -> ${zywnoscPo}`);
    ok(zywnoscPrzed - zywnoscPo === M.FARMA_POTENTIAL_FOOD_BONUS,
      'skutek: spadek = dokladnie bonus farmy z terrain-improvements.json (nic wiecej nie znika)',
      `${zywnoscPrzed - zywnoscPo} vs ${M.FARMA_POTENTIAL_FOOD_BONUS}`);
    ok(zywnoscPo === zywnoscGoly,
      'skutek: heks jest teraz IDENTYCZNY z golym lasem — „las, bez ulepszenia"',
      `${zywnoscPo} vs ${zywnoscGoly}`);
    ok(M.tileYield(M.hexToWorkedTile(hOtw)).zywnosc === zywnoscOtwPrzed,
      'skutek: plon farmy na otwartym terenie BEZ ZMIAN');
    const repKeys = Object.keys(M.planLegacyFarmOnForestRemoval(hexes, placed)).sort().join(',');
    ok(repKeys === 'changes,farmsOnOpenTerrain,removed,scanned',
      'praca NIE wraca: raport sprzatania nie ma ZADNEGO pola zwrotu pracy/surowca', repKeys);
  }

  // --- (4) POMIAR PRZED/PO NA 4 ZIARNACH, sciezka ZYWEGO STANU -------------
  console.log('\n--- (4) PRZED/PO na ziarnach: zywy stan gry (trwajaca partia) ---');
  for (const seed of SEEDS) {
    const map = M.generateMap(36, 28, seed, 'kontynenty');
    const z = zasiejStareFarmy(map, { withTartak: true });
    const przedLes = policzFarmy(map, NA_LESIE);
    const przedOtw = policzFarmy(map, NA_OTWARTYM);
    const przedLas = policzLasy(map);
    ok(przedLes > 0, `ziarno ${seed}: PRZED — sa farmy na lesie (warunek istotnosci)`, String(przedLes));
    ok(przedOtw > 0, `ziarno ${seed}: PRZED — sa farmy na otwartym terenie (kontrola)`, String(przedOtw));
    const rep = zastosujSprzatanie(map, z.placed);
    const poLes = policzFarmy(map, NA_LESIE);
    ok(poLes === 0, `ziarno ${seed}: PO — DOKLADNIE 0 farm na lesie`, `${przedLes} -> ${poLes}`);
    ok(rep.removed === przedLes,
      `ziarno ${seed}: raport zgadza sie z pomiarem (${rep.removed} = ${przedLes})`);
    ok(policzFarmy(map, NA_OTWARTYM) === przedOtw,
      `ziarno ${seed}: farmy na Lace/Rowninie BEZ lasu przetrwaly WSZYSTKIE`,
      `${przedOtw} -> ${policzFarmy(map, NA_OTWARTYM)}`);
    ok(policzLasy(map) === przedLas,
      `ziarno ${seed}: LAS nietkniety — liczba heksow z nakladka Las bez zmian`,
      `${przedLas} -> ${policzLasy(map)}`);
    let ilePlaced = 0;
    for (const [hk, layers] of z.placed) {
      const h = map.hexes[hk];
      if (h && h.nakladka === Nakladka.Las && layers.includes('farma')) ilePlaced++;
    }
    ok(ilePlaced === 0, `ziarno ${seed}: rejestr placedImprovements tez czysty`, String(ilePlaced));
    const rep2 = M.removeLegacyFarmsOnForest(map.hexes, z.placed);
    ok(rep2.removed === 0, `ziarno ${seed}: idempotencja na realnej mapie (drugi przebieg = 0)`);
  }

  // --- (5) PRZED/PO na ziarnach, sciezka WCZYTANIA ZAPISU (bez repliki) ----
  console.log('\n--- (5) PRZED/PO na ziarnach: pelny round-trip zapis -> wczytanie ---');
  for (const seed of SEEDS) {
    const map = M.generateMap(36, 28, seed, 'kontynenty');
    const z = zasiejStareFarmy(map, { withTartak: true });
    const przedLes = policzFarmy(map, NA_LESIE);
    const przedOtw = policzFarmy(map, NA_OTWARTYM);
    const przedLas = policzLasy(map);
    const zapis = zbudujZapis(map, z.placed);
    ok(przedLes > 0, `zapis ${seed}: PRZED — stary zapis niesie farmy na lesie`, String(przedLes));
    const json = M.serializeGame(zapis);
    const wczytany = M.deserializeGame(json);
    ok(M.isValidMapSnapshot(wczytany.mapSnapshot) === true,
      `zapis ${seed}: mapSnapshot po migracji nadal POPRAWNY KSZTALTOWO (migracja nie psuje zapisu)`);
    const mapaPo = M.buildGameMapFromSnapshot(wczytany.mapSnapshot);
    const poLes = policzFarmy(mapaPo, NA_LESIE);
    ok(poLes === 0, `zapis ${seed}: PO wczytaniu — 0 farm na lesie w odtworzonej mapie`,
      `${przedLes} -> ${poLes}`);
    ok(policzFarmy(mapaPo, NA_OTWARTYM) === przedOtw,
      `zapis ${seed}: farmy na otwartym terenie przezyly wczytanie`,
      `${przedOtw} -> ${policzFarmy(mapaPo, NA_OTWARTYM)}`);
    ok(policzLasy(mapaPo) === przedLas,
      `zapis ${seed}: LAS nietkniety po wczytaniu`, `${przedLas} -> ${policzLasy(mapaPo)}`);
    let zleWpisy = 0, dobreWpisy = 0;
    for (const [hk, layers] of wczytany.meta.placedImprovements) {
      const h = mapaPo.hexes[hk];
      const ls = Array.isArray(layers) ? layers : [layers];
      if (h && h.nakladka === Nakladka.Las && ls.includes('farma')) zleWpisy++;
      if (ls.includes('farma')) dobreWpisy++;
    }
    ok(zleWpisy === 0, `zapis ${seed}: meta.placedImprovements bez farm na lesie`, String(zleWpisy));
    ok(dobreWpisy === przedOtw,
      `zapis ${seed}: w rejestrze zostaly DOKLADNIE farmy z otwartego terenu`,
      `${dobreWpisy} vs ${przedOtw}`);
    ok(M.migrateLegacyFarmsOnForestInSave(wczytany) === 0,
      `zapis ${seed}: idempotencja migracji ladunku (drugie wywolanie = 0 zmian)`);
    ok(wczytany.tura === 12 && wczytany.seed === map.seed,
      `zapis ${seed}: reszta zapisu nietknieta (tura/seed)`);
  }

  // --- (5b) STARY ZAPIS BEZ mapSnapshotu — udokumentowane ograniczenie -----
  console.log('\n--- (5b) Zapis bez mapSnapshotu: migracja ladunku nie zgaduje ---');
  {
    const bezSnap = {
      wersja: M.SAVE_VERSION, tura: 3, seed: 42, units: [], cities: [], explored: [],
      meta: { placedImprovements: [['0,0', ['farma']]] },
    };
    const n = M.migrateLegacyFarmsOnForestInSave(bezSnap);
    ok(n === 0, 'bez mapSnapshotu: migracja ladunku zwraca 0 (nie zna nakladek) i nie rzuca', String(n));
    ok(bezSnap.meta.placedImprovements.length === 1,
      'bez mapSnapshotu: rejestr NIETKNIETY — sprzatanie takiego zapisu robi przebieg po zywym stanie (main.ts)');
    const puste = { wersja: M.SAVE_VERSION, tura: 1, seed: 1, units: [], cities: [], explored: [] };
    ok(M.migrateLegacyFarmsOnForestInSave(puste) === 0,
      'zapis bez meta i bez mapSnapshotu: migracja nie rzuca bledu');
  }

  // --- (6) NOWA PARTIA (kryterium 1c) — POMIAR, nie zalozenie --------------
  console.log('\n--- (6) NOWA PARTIA: generator nie stawia farm w lesie ---');
  for (const seed of SEEDS) {
    const map = M.generateMap(36, 28, seed, 'kontynenty');
    const lasy = policzLasy(map);
    ok(lasy > 0, `nowa partia ${seed}: mapa MA lasy (warunek istotnosci pomiaru)`, String(lasy));
    ok(policzFarmy(map, NA_LESIE) === 0,
      `nowa partia ${seed}: 0 farm na lesie od razu po generacji (pomiar)`);
    const plan = M.planLegacyFarmOnForestRemoval(map.hexes, new Map());
    ok(plan.removed === 0,
      `nowa partia ${seed}: sprzatanie nie ma czego usuwac (removed=0)`, String(plan.removed));
    ok(plan.scanned === Object.keys(map.hexes).length,
      `nowa partia ${seed}: przejrzano CALA mape (${plan.scanned} heksow)`);
  }

  // --- (7) WPIECIE W main.ts — dowod STRUKTURALNY (slabszy, jawnie) -------
  console.log('\n--- (7) WPIECIE main.ts (dowod strukturalny, NIE pomiar zachowania) ---');
  {
    const mainTs = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
    ok(/function sweepLegacyFarmsOnForest\(/.test(mainTs),
      'main.ts: istnieje funkcja sweepLegacyFarmsOnForest');
    ok(/sweepLegacyFarmsOnForest[\s\S]{0,600}removeLegacyFarmsOnForest\(/.test(mainTs),
      'main.ts: sweep deleguje decyzje do removeLegacyFarmsOnForest (jedno zrodlo reguly)');
    ok(mainTs.includes("sweepLegacyFarmsOnForest('wczytanie zapisu')"),
      'main.ts: wpiecie na sciezce WCZYTANIA ZAPISU (stan a)');
    ok(mainTs.includes("sweepLegacyFarmsOnForest('granica tury')"),
      'main.ts: wpiecie na GRANICY TURY — trwajaca partia (stan b) i nowa partia (stan c)');
    const wywolania = (mainTs.match(/sweepLegacyFarmsOnForest\(/g) || []).length;
    ok(wywolania === 3,
      'main.ts: dokladnie 1 definicja + 2 wywolania (zmiana punktowa, wspolbieznosc)', String(wywolania));
    const restoreIdx = mainTs.indexOf('function restorePlacedImprovementsFromSave');
    const sweepIdx = mainTs.indexOf("sweepLegacyFarmsOnForest('wczytanie zapisu')");
    const meshIdx = mainTs.indexOf('syncLivestockAndPlacedMeshes();', sweepIdx);
    ok(restoreIdx >= 0 && sweepIdx > restoreIdx && meshIdx > sweepIdx,
      'main.ts: sprzatanie stoi W restorePlacedImprovementsFromSave, przed odbudowa meshy');
    const turnIdx = mainTs.indexOf('turn++;');
    const sweepTurnIdx = mainTs.indexOf("sweepLegacyFarmsOnForest('granica tury')");
    const autosaveIdx = mainTs.indexOf('doRotatingAutosave()', sweepTurnIdx);
    ok(turnIdx >= 0 && sweepTurnIdx > turnIdx && autosaveIdx > sweepTurnIdx,
      'main.ts: sprzatanie na granicy tury stoi PO turn++ i PRZED rotacyjnym autozapisem');
  }

  // --- (8) NIE-POSZERZANIE ZAKRESU (§14) ----------------------------------
  console.log('\n--- (8) STRAZNIK ZAKRESU: co ten temat NIE zmienia ---');
  ok(M.stripImprovementsWhenForestRemoved(['farma']).includes('farma'),
    'kanon nietkniety: WYRAB lasu spod farmy nadal NIE kasuje farmy (las znika, farma zostaje)');
  ok(M.stripImprovementsWhenForestRemoved(['oboz_lowiecki']).length === 0,
    'kanon nietkniety: wyrab nadal kasuje oboz lowiecki (ulepszenie zalezne od lasu)');
  ok(M.isFarmBaseTerrain(TerenBazowy.Laka, Nakladka.Brak) === true
    && M.isFarmBaseTerrain(TerenBazowy.Laka, Nakladka.Las) === false,
    'kwalifikacja nietknieta: isFarmBaseTerrain dziala jak po R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1');
  ok(M.isImprovementBlockedOnForest('farma', Nakladka.Las) === true
    && M.isImprovementBlockedOnForest('tartak', Nakladka.Las) === false,
    'kwalifikacja nietknieta: budowa farmy na lesie nadal zablokowana, tartak nadal wolny');
  const mig = M.migrateImprovementLayers(['farma'], { nakladka: Nakladka.Las });
  ok(mig.length === 1 && mig[0] === 'farma',
    'migrateImprovementLayers (migracja KLUCZY legacy) nadal nie kasuje warstw — kasowanie to osobna warstwa',
    JSON.stringify(mig));
  {
    const h = hex(0, 0, TerenBazowy.Laka, Nakladka.Las);
    setHexLayers(h, ['oboz_lowiecki', 'tartak']);
    const placed = new Map([['0,0', ['oboz_lowiecki', 'tartak']]]);
    const rep = M.removeLegacyFarmsOnForest({ '0,0': h }, placed);
    ok(rep.removed === 0 && placed.get('0,0').length === 2,
      'zakres: heks lesny z tartakiem i obozem NIETKNIETY');
  }
  {
    const h = hex(0, 0, TerenBazowy.Rownina, Nakladka.Las);
    setHexLayers(h, ['irygacja']);
    const placed = new Map([['0,0', ['irygacja']]]);
    const rep = M.removeLegacyFarmsOnForest({ '0,0': h }, placed);
    ok(rep.removed === 0 && placed.get('0,0').length === 1,
      'zakres §14: irygacja stojaca na lesie NIE jest ruszana (osobny, nieotwarty temat)');
  }
  {
    const h = hex(0, 0, TerenBazowy.Wzgorza, Nakladka.ZlozeOwiec);
    setHexLayers(h, ['owce']);
    const placed = new Map([['0,0', ['owce']]]);
    ok(M.removeLegacyFarmsOnForest({ '0,0': h }, placed).removed === 0,
      'zakres: hodowla na zlozu (bez lasu) NIETKNIETA');
  }
}

(async () => {
  await buildBundle();
  if (process.env.MEASURE === '1') { measure(); return; }
  run();
  console.log(`\n=== farma-lesie-usun-istniejace: ${pass} OK / ${fail} FAIL ===`);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
