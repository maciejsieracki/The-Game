'use strict';
/**
 * hex-tooltip-stadnina-kopalnia-cyny-test.cjs -- P-HEX-TOOLTIP-MOZLIWE-ULEPSZENIA-BRAK-FILTRA-ZLOZA,
 * nota N5 (Evaluator, 2026-08-14): "stadnina pokazana w tooltipie w 0/1008 sprawdzonych
 * konfiguracji terenu (podczas gdy silnik budowy pozwala na nią w 36 z tych konfiguracji),
 * kopalnia_cyny analogicznie 0/1008 (silnik pozwala w 32)".
 * Run: cd gra && node tools/hex-tooltip-stadnina-kopalnia-cyny-test.cjs
 *
 * PRZYCZYNA (odwrotna klasa do rund 1-4 tego tematu -- tam NADMIAR, tu NIEDOMIAR):
 * `galleryTerrainEligible()` (src/map/improvement-build.ts) nie miala `case 'stadnina'` ani
 * `case 'kopalnia_cyny'` -- obie wpadaly w `default: return false`. `listTerrainPossibleImprovements()`
 * (src/ui/hexContextTooltip.ts) filtruje KAZDY klucz NAJPIERW przez `galleryTerrainEligible()`
 * (linia "if (!galleryTerrainEligible(key, teren)) continue;") -- dopiero PO tym zawezenie po
 * zlozu/nakladce. Dla kopalnia_cyny to zawezenie JUZ ISTNIALO (`if (key === 'kopalnia_cyny' &&
 * zloze !== 'cyna') continue;`), ale bylo martwym kodem -- nigdy nie osiagane, bo terenowa bramka
 * wyzej zawsze odrzucala klucz pierwsza. Dla stadniny takiego zawezenia w ogole nie bylo.
 *
 * NAPRAWA: dopisany `case 'stadnina'` (FLAT_FARM -- ten sam zbior co TERRAIN_ALLOW.stadnina) i
 * `case 'kopalnia_cyny'` (Wzgorza/Gory -- ta sama grupa co pozostale kopalnie) w
 * `galleryTerrainEligible()`; dopisana linia zawezajaca zloze dla stadniny
 * (`if (key === 'stadnina' && nakladka !== Nakladka.ZlozeKonia) continue;`) w
 * `listTerrainPossibleImprovements()` -- analogiczna do juz istniejacych linii bydlo/owce/lama.
 *
 * SWIADOMA GRANICA (nie regresja, udokumentowana i zaasertowana w sekcji [4] nizej): silnik
 * (createQualifier) pozwala budowac stadnine BEZ zloza konia NA TYM heksie, gdy imperium ma juz
 * odblokowane 'kon' gdziekolwiek indziej (isLivestockUnlockedForPlacement/empireUnlocks) -- to
 * stan GRACZA/IMPERIUM, nie wlasnosc heksu. Tooltip (jak przy terytorium/tech -- patrz docstring
 * listTerrainPossibleImprovements()) SWIADOMIE tego nie sprawdza, wiec w tym jednym, wąskim
 * przypadku tooltip pokazuje MNIEJ niz silnik faktycznie pozwala -- test [4] to potwierdza jako
 * OCZEKIWANE zachowanie, nie bug.
 *
 * METODOLOGIA -- dwa NIEZALEZNE, REALNE zrodla porownywane wprost (zaden nie jest reimplementacja):
 *   Silnik:   `buildImprovementQualifier()` (prawdziwy, zbundlowany z src/map/improvement-build.ts)
 *             -- ta sama fabryka co uzywa mainview/placementpreview do prawdziwej gry.
 *   Tooltip:  `buildHexContextTooltipHtml()` (prawdziwy, zbundlowany z src/ui/hexContextTooltip.ts,
 *             TYLKO z modulowym stubem icons/brandAssets -- ten sam, juz commitowany plik
 *             tools/.stubs/hex-tooltip-zloze-brandAssets-stub.ts uzywany przez
 *             hex-tooltip-mozliwe-ulepszenia-zloze-test.cjs runda 4) -- WOLANA WPROST, nie
 *             reimplementowana (usuwa slabosc N6 z rundy 4 dla TEGO pliku testowego: sekcja [2]
 *             tamtego testu reimplementowala petle zamiast wolac prawdziwy kod).
 * Sekcja [1]: pelny sweep terenow x nakladek x zloz -- engine===tooltip dla obu kluczy, w
 *   KAZDEJ z 256 konfiguracji (8 terenow x 8 nakladek x 4 warianty zloza).
 * Sekcja [2]: mutacja NA PRAWDZIWYM zrodle (kopia na dysku, bundlowana, usuwana po tescie) --
 *   cofniecie case'ow stadnina/kopalnia_cyny w galleryTerrainEligible() odtwarza dokladnie
 *   zgloszony bug (0/N zamiast pelnej listy).
 * Sekcja [3]: regex-pin na obu plikach zrodlowych -- literalne linie naprawy istnieja.
 * Sekcja [4]: granica empireUnlocks -- silnik TAK / tooltip NIE, udokumentowana jako OK.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const IMPROVEMENT_BUILD_SRC = path.join(GRA, 'src', 'map', 'improvement-build.ts');
const TOOLTIP_SRC = path.join(GRA, 'src', 'ui', 'hexContextTooltip.ts');
const BRAND_STUB = path.resolve(__dirname, '.stubs', 'hex-tooltip-zloze-brandAssets-stub.ts');

let passed = 0;
let failed = 0;
function assert(cond, msg, detail) {
  if (cond) { passed++; }
  else {
    failed++;
    console.error('FAIL:', msg, detail !== undefined ? JSON.stringify(detail) : '');
  }
}

console.log('hex-tooltip-stadnina-kopalnia-cyny-test (N5, P-HEX-TOOLTIP-MOZLIWE-ULEPSZENIA-BRAK-FILTRA-ZLOZA)\n');

assert(fs.existsSync(BRAND_STUB), `stub brandAssets istnieje (reuzyty z rundy 4): ${BRAND_STUB}`);

const stubBrandAssetsPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
  },
};

let bundleCounter = 0;

/** Bundluje named exports z `srcPath` (prawdziwy plik lub mutant) i zwraca cjs modul. */
async function bundleFrom(srcPath, exportNames, tag) {
  const id = `${tag}-${bundleCounter++}`;
  const entry = path.join(__dirname, `.hex-tooltip-stadnina-cyna-entry-${id}.ts`);
  const bundle = path.join(__dirname, `.hex-tooltip-stadnina-cyna-bundle-${id}.cjs`);
  const relImport = './' + path.relative(path.dirname(entry), srcPath).replace(/\\/g, '/').replace(/\.ts$/, '');
  fs.writeFileSync(entry, `export { ${exportNames.join(', ')} } from '${relImport}';\n`, 'utf8');
  try {
    await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      loader: { '.ts': 'ts', '.json': 'json' },
      outfile: bundle,
      absWorkingDir: GRA,
      plugins: [stubBrandAssetsPlugin],
      logLevel: 'silent',
    });
  } finally {
    try { fs.unlinkSync(entry); } catch { /* noop */ }
  }
  delete require.cache[require.resolve(bundle)];
  const mod = require(bundle);
  try { fs.unlinkSync(bundle); } catch { /* noop */ }
  return mod;
}

async function main() {
  // --- Bundle A: silnik (improvement-build.ts, prawdziwy) + typy -----------------------------
  const engineMod = await bundleFrom(
    IMPROVEMENT_BUILD_SRC,
    ['buildImprovementQualifier', 'galleryTerrainEligible'],
    'engine',
  );
  const typesMod = await bundleFrom(
    path.join(GRA, 'src', 'types', 'hex.ts'),
    ['TerenBazowy', 'Nakladka'],
    'types',
  );
  const { TerenBazowy: TB, Nakladka: NK } = typesMod;
  const { buildImprovementQualifier, galleryTerrainEligible } = engineMod;

  // --- Bundle B: tooltip (hexContextTooltip.ts, prawdziwy, stub TYLKO brandAssets) ------------
  const tooltipMod = await bundleFrom(TOOLTIP_SRC, ['buildHexContextTooltipHtml'], 'tooltip');
  const { buildHexContextTooltipHtml } = tooltipMod;
  assert(typeof buildHexContextTooltipHtml === 'function',
    'zbundlowano prawdziwy, eksportowany buildHexContextTooltipHtml() z hexContextTooltip.ts');
  assert(typeof buildImprovementQualifier === 'function',
    'zbundlowano prawdziwy, eksportowany buildImprovementQualifier() z improvement-build.ts');

  function mkHex(q, r, teren, nakladka, zloze) {
    return {
      coords: { q, r },
      terenBazowy: teren,
      nakladka: nakladka ?? NK.Brak,
      ulepszenie: 'brak',
      zloze: zloze,
      wioska: { istnieje: false, ludnosc: 0 },
      wlasciciel: null,
      rzeka: { obecna: false, krawedzie: [] },
    };
  }

  /** "Możliwe ulepszenia (teren)" -- porcja wyjścia tooltipa, żeby nie mylić z sekcjami
   * "Ulepszenia postawione"/"Hodowla / złoże aktywne" (mogłyby wspominać tę samą nazwę z innego
   * powodu). Sekcja jest ostatnim blokiem (bez cityName w tym teście), więc od jej nagłówka do
   * końca stringa. */
  function possibleSection(html) {
    const idx = html.indexOf('Możliwe ulepszenia (teren)');
    return idx === -1 ? '' : html.slice(idx);
  }

  function tooltipShows(hex, label) {
    const html = buildHexContextTooltipHtml({ q: hex.coords.q, r: hex.coords.r, hex, esc: (s) => s });
    return possibleSection(html).includes(`<b>${label}</b>`);
  }

  function engineQualifies(key, hex, extra) {
    const cityNodes = [{ q: hex.coords.q, r: hex.coords.r, pop: 5, level: 3 }];
    const territoryNodes = [{ q: hex.coords.q, r: hex.coords.r, pop: 5, level: 3, ownerId: 0 }];
    const map = { hexes: { [`${hex.coords.q},${hex.coords.r}`]: hex }, riverPaths: [], startPositions: [{ q: hex.coords.q, r: hex.coords.r }] };
    const qualifies = buildImprovementQualifier({
      map, cityNodes, territoryNodes, playerOwnerIdNum: 0, ...extra,
    });
    return qualifies(key, hex.coords.q, hex.coords.r);
  }

  // ============================================================================================
  // [1] SWEEP -- engine (buildImprovementQualifier) === tooltip (buildHexContextTooltipHtml)
  //     dla stadnina i kopalnia_cyny, na PELNYM iloczynie terenow x nakladek x wariantow zloza.
  // ============================================================================================
  console.log('[1] sweep: 8 terenow x 8 nakladek x 4 zloze = 256 konfiguracji, engine vs tooltip (realne, nie reimplementacja)');

  const TERRAINS = [TB.Laka, TB.Rownina, TB.Wzgorza, TB.Gory, TB.Wybrzeze, TB.Morze, TB.Pustynia, TB.Polarny];
  const NAKLADKI = [NK.Brak, NK.Las, NK.ZlozeGliny, NK.ZlozeRudy, NK.ZlozeKonia, NK.ZlozeOwiec, NK.ZlozeBydla, NK.ZlozeLamy];
  const ZLOZE_VARIANTS = [undefined, 'cyna', 'miedz', 'zelazo'];

  let stadninaTrueCount = 0;
  let cynyTrueCount = 0;
  let sweepChecked = 0;
  const mismatches = [];

  for (const teren of TERRAINS) {
    for (const nakladka of NAKLADKI) {
      for (const zloze of ZLOZE_VARIANTS) {
        const hex = mkHex(0, 0, teren, nakladka, zloze);
        sweepChecked++;

        const engineStadnina = engineQualifies('stadnina', hex);
        const tooltipStadnina = tooltipShows(hex, 'Stadnina');
        if (engineStadnina) stadninaTrueCount++;
        if (engineStadnina !== tooltipStadnina) {
          mismatches.push({ key: 'stadnina', teren, nakladka, zloze, engineStadnina, tooltipStadnina });
        }

        const engineCyny = engineQualifies('kopalnia_cyny', hex);
        const tooltipCyny = tooltipShows(hex, 'Kopalnia cyny');
        if (engineCyny) cynyTrueCount++;
        if (engineCyny !== tooltipCyny) {
          mismatches.push({ key: 'kopalnia_cyny', teren, nakladka, zloze, engineCyny, tooltipCyny });
        }
      }
    }
  }

  assert(sweepChecked === 256, `sweep sprawdził dokładnie 256 konfiguracji (ma: ${sweepChecked})`);
  assert(mismatches.length === 0,
    `engine === tooltip dla stadnina i kopalnia_cyny w KAŻDEJ z ${sweepChecked} konfiguracji (rozbieżności: ${mismatches.length})`,
    mismatches.slice(0, 5));
  // Kontrola czułości -- dowód, że sweep faktycznie ma pozytywne przypadki po obu stronach
  // (gdyby oba zawsze zwracały false, powyższa asercja byłaby fałszywie zielona).
  assert(stadninaTrueCount > 0,
    `sweep ma co najmniej jedną konfigurację, w której silnik POZWALA na stadninę (ma: ${stadninaTrueCount}/${sweepChecked})`);
  assert(cynyTrueCount > 0,
    `sweep ma co najmniej jedną konfigurację, w której silnik POZWALA na kopalnię cyny (ma: ${cynyTrueCount}/${sweepChecked})`);
  console.log(`    (silnik pozwala: stadnina ${stadninaTrueCount}/${sweepChecked}, kopalnia_cyny ${cynyTrueCount}/${sweepChecked})`);

  // --- Przypadki dokładnie ze zgłoszenia N5 (pozytywne, jednoznaczne) -------------------------
  {
    const hexStadninaOk = mkHex(0, 0, TB.Laka, NK.ZlozeKonia, undefined);
    assert(engineQualifies('stadnina', hexStadninaOk) === true, 'kontrola: silnik POZWALA na stadninę (Łąka + złoże konia)');
    assert(tooltipShows(hexStadninaOk, 'Stadnina') === true,
      'NAPRAWIONE: tooltip POKAZUJE Stadninę (Łąka + złoże konia) -- przed naprawą 0/1008');

    const hexCynyOk = mkHex(0, 0, TB.Wzgorza, NK.Brak, 'cyna');
    assert(engineQualifies('kopalnia_cyny', hexCynyOk) === true, 'kontrola: silnik POZWALA na kopalnię cyny (Wzgórza + złoże cyny)');
    assert(tooltipShows(hexCynyOk, 'Kopalnia cyny') === true,
      'NAPRAWIONE: tooltip POKAZUJE Kopalnię cyny (Wzgórza + złoże cyny) -- przed naprawą 0/1008');

    // Kontrola negatywna dokładnie ze zgłoszenia Macieja (Łąka goła -- bez lasu/rzeki/złoża):
    // ANI stadnina ANI kopalnia_cyny nie powinny się pojawić (brak złoża).
    const hexBareLaka = mkHex(0, 0, TB.Laka, NK.Brak, undefined);
    assert(tooltipShows(hexBareLaka, 'Stadnina') === false, 'Łąka goła (bez złoża konia): tooltip NIE pokazuje Stadniny');
    assert(tooltipShows(hexBareLaka, 'Kopalnia cyny') === false, 'Łąka goła: tooltip NIE pokazuje Kopalni cyny (zły teren)');
  }

  // ============================================================================================
  // [2] MUTACJA NA PRAWDZIWYM PLIKU ŹRÓDŁOWYM -- dowód, że sweep [1] łapie regresję.
  // ============================================================================================
  console.log('\n[2] mutacja: cofnięcie case\'ów stadnina/kopalnia_cyny w galleryTerrainEligible() odtwarza zgłoszony bug (0/N)');
  {
    const realSrc = fs.readFileSync(IMPROVEMENT_BUILD_SRC, 'utf8');

    const STADNINA_CASE = "    case 'stadnina':\n      return FLAT_FARM.has(teren);\n";
    assert(realSrc.includes(STADNINA_CASE), '[2] przygotowanie: prawdziwe źródło zawiera dosłowny case \'stadnina\' (kotwica mutacji)');
    // Kotwica MUSI być unikalna w całym pliku -- 'kopalnia_cyny' ma TRZY case'y w trzech funkcjach
    // (depositAllowsPlayerImprovement, qualifies(), galleryTerrainEligible). Samo
    // "    case 'kopalnia_cyny':\n" (4 spacje) jest podciągiem WEWNĄTRZ 6-spacjowego wcięcia
    // case'a w qualifies() (linia ~790) -- String.replace (bez /g) łapałby WTEDY pierwsze
    // wystąpienie w CAŁYM pliku, czyli TEN NIEWŁAŚCIWY, zostawiając galleryTerrainEligible
    // nietkniętą (mutant fałszywie "przechodziłby" -- realny błąd złapany podczas pisania tego
    // testu). Kotwica niżej obejmuje poprzedzający case 'kopalnia_zlota':\n BEZ komentarza + tę
    // samą return-linię (teren Wzgórza/Góry) -- ten dokładny ciąg istnieje TYLKO w
    // galleryTerrainEligible().
    const CYNY_GROUP_ANCHOR =
      "    case 'kopalnia_zlota':\n    case 'kopalnia_cyny':\n      return teren === TerenBazowy.Wzgorza || teren === TerenBazowy.Gory;";
    const CYNY_GROUP_WITHOUT_CYNA =
      "    case 'kopalnia_zlota':\n      return teren === TerenBazowy.Wzgorza || teren === TerenBazowy.Gory;";
    assert(realSrc.includes(CYNY_GROUP_ANCHOR),
      "[2] przygotowanie: prawdziwe źródło zawiera dosłowną grupę case'ów kopalń kończącą się case 'kopalnia_cyny' w galleryTerrainEligible()");
    const occurrences = realSrc.split(CYNY_GROUP_ANCHOR).length - 1;
    assert(occurrences === 1,
      `[2] przygotowanie: kotwica kopalni cyny jest UNIKALNA w pliku (wystąpień: ${occurrences})`);

    let mutantSrc = realSrc.replace(STADNINA_CASE, '');
    mutantSrc = mutantSrc.replace(CYNY_GROUP_ANCHOR, CYNY_GROUP_WITHOUT_CYNA);
    assert(mutantSrc.length < realSrc.length, '[2] przygotowanie: mutant krótszy niż oryginał (oba case\'y faktycznie usunięte)');

    const mutantPath = path.join(GRA, 'src', 'map', '.mutant-no-n5-cases.improvement-build.ts');
    fs.writeFileSync(mutantPath, mutantSrc, 'utf8');
    let mutantMod;
    try {
      mutantMod = await bundleFrom(mutantPath, ['galleryTerrainEligible'], 'mutant');
    } finally {
      try { fs.unlinkSync(mutantPath); } catch { /* noop */ }
    }

    assert(galleryTerrainEligible('stadnina', TB.Laka) === true,
      '[2] kontrola: PRAWDZIWA (naprawiona) galleryTerrainEligible(\'stadnina\', Łąka) === true');
    assert(mutantMod.galleryTerrainEligible('stadnina', TB.Laka) === false,
      '[2] MUTANT (case \'stadnina\' usunięty z PRAWDZIWEGO pliku): galleryTerrainEligible wraca do false -- mutacja złapana, odtwarza zgłoszony bug');

    assert(galleryTerrainEligible('kopalnia_cyny', TB.Wzgorza) === true,
      '[2] kontrola: PRAWDZIWA (naprawiona) galleryTerrainEligible(\'kopalnia_cyny\', Wzgórza) === true');
    assert(mutantMod.galleryTerrainEligible('kopalnia_cyny', TB.Wzgorza) === false,
      '[2] MUTANT (case \'kopalnia_cyny\' usunięty z PRAWDZIWEGO pliku): galleryTerrainEligible wraca do false -- mutacja złapana, odtwarza zgłoszony bug');

    // Kontrola: mutacja NIE psuje sąsiednich kluczy tej samej grupy (kamieniolom/miedzi/zelaza/zlota
    // dzielą tę samą return-linię co kopalnia_cyny -- dowód, że usunięto WYŁĄCZNIE jedną etykietę case).
    assert(mutantMod.galleryTerrainEligible('kopalnia_miedzi', TB.Wzgorza) === true,
      '[2] kontrola zakresu: mutacja NIE rusza kopalnia_miedzi (nadal true na Wzgórzach)');
    assert(mutantMod.galleryTerrainEligible('kopalnia_zlota', TB.Gory) === true,
      '[2] kontrola zakresu: mutacja NIE rusza kopalnia_zlota (nadal true na Górach)');
    assert(mutantMod.galleryTerrainEligible('bydlo', TB.Laka) === true,
      '[2] kontrola zakresu: mutacja NIE rusza bydlo (nadal true na Łące)');
  }

  // ============================================================================================
  // [3] REGEX-PIN na obu plikach źródłowych -- literalna linia naprawy w hexContextTooltip.ts.
  // ============================================================================================
  console.log('\n[3] regex-pin: linia zawężająca stadninę do złoża konia istnieje w listTerrainPossibleImprovements()');
  {
    const tooltipSrc = fs.readFileSync(TOOLTIP_SRC, 'utf8');
    const STADNINA_NARROW_LINE = "if (key === 'stadnina' && nakladka !== Nakladka.ZlozeKonia) continue;";
    assert(tooltipSrc.includes(STADNINA_NARROW_LINE),
      `hexContextTooltip.ts zawiera linię zawężającą stadninę do złoża konia: ${STADNINA_NARROW_LINE}`);
    // kopalnia_cyny -- linia istniała już PRZED tą naprawą (była martwym kodem), musi przetrwać.
    const CYNY_NARROW_LINE = "if (key === 'kopalnia_cyny' && zloze !== 'cyna') continue;";
    assert(tooltipSrc.includes(CYNY_NARROW_LINE),
      `hexContextTooltip.ts nadal zawiera (pre-istniejącą, teraz OSIĄGALNĄ) linię: ${CYNY_NARROW_LINE}`);
  }

  // ============================================================================================
  // [4] GRANICA empireUnlocks -- silnik pozwala BEZ lokalnego złoża (odblokowanie imperium),
  //     tooltip świadomie NIE -- udokumentowane jako OCZEKIWANE, nie regresja.
  // ============================================================================================
  console.log('\n[4] granica: empireUnlocks (stan imperium, nie własność heksu) świadomie POMINIĘTA w tooltipie');
  {
    const hexCity = mkHex(0, 0, TB.Rownina, NK.Brak, undefined);
    // Stadnina JUŻ POSTAWIONA na złożu konia gdzie indziej w imperium -- odblokowuje 'kon' empire-wide.
    const hexDepositBuilt = mkHex(5, 0, TB.Rownina, NK.ZlozeKonia, undefined);
    hexDepositBuilt.ulepszenie = 'stadnina';
    // Heks testowy -- BEZ lokalnego złoża konia -- jedyny sposób, by silnik i tak pozwolił, to
    // odblokowanie imperium z hexDepositBuilt.
    const hexNoDeposit = mkHex(10, 0, TB.Rownina, NK.Brak, undefined);

    const map = {
      hexes: {
        '0,0': hexCity,
        '5,0': hexDepositBuilt,
        '10,0': hexNoDeposit,
      },
      riverPaths: [],
      startPositions: [{ q: 0, r: 0 }],
    };
    const cityNodes = [{ q: 0, r: 0, pop: 5, level: 3 }, { q: 5, r: 0, pop: 5, level: 3 }, { q: 10, r: 0, pop: 5, level: 3 }];
    const territoryNodes = [
      { q: 0, r: 0, pop: 5, level: 3, ownerId: 0 },
      { q: 5, r: 0, pop: 5, level: 3, ownerId: 0 },
      { q: 10, r: 0, pop: 5, level: 3, ownerId: 0 },
    ];
    const qualifies = buildImprovementQualifier({ map, cityNodes, territoryNodes, playerOwnerIdNum: 0 });

    const engineAllowsViaEmpireUnlock = qualifies('stadnina', 10, 0);
    assert(engineAllowsViaEmpireUnlock === true,
      '[4] kontrola: SILNIK pozwala budować stadninę BEZ lokalnego złoża, bo imperium ma już odblokowane \'kon\' (empireUnlocks) -- to realne zachowanie createQualifier(), nie założenie');

    const tooltipShowsWithoutLocalDeposit = tooltipShows(hexNoDeposit, 'Stadnina');
    assert(tooltipShowsWithoutLocalDeposit === false,
      '[4] OCZEKIWANE (nie regresja): tooltip NIE pokazuje Stadniny na heksie bez lokalnego złoża, mimo że silnik by na to pozwolił -- empireUnlocks to stan imperium, świadomie pominięty w hex-property-only tooltipie (jak terytorium/tech)');

    // Kontrola: NA SAMYM hexDepositBuilt (z lokalnym złożem) tooltip i silnik zgadzają się --
    // granica dotyczy WYŁĄCZNIE braku lokalnego złoża + odblokowania gdzie indziej.
    const freshDepositHex = mkHex(5, 0, TB.Rownina, NK.ZlozeKonia, undefined); // bez postawionej stadniny -- "possible", nie "built"
    assert(tooltipShows(freshDepositHex, 'Stadnina') === true,
      '[4] kontrola: na heksie Z lokalnym złożem konia (jeszcze niezabudowanym) tooltip nadal pokazuje Stadninę normalnie');
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[hex-tooltip-stadnina-kopalnia-cyny-test] błąd:', e && e.stack || e);
  process.exit(1);
});
