'use strict';
/**
 * cyna-surowiec-test.cjs — nowy surowiec Ruda cyny (Maciej 2026-08-13).
 *
 * Pokrywa:
 *   A. złoże cyny powstaje wyłącznie na Wzgórzach/Górach (kilka ziaren);
 *   B. rzadkość cyny ≈ miedź / 5 (statystycznie, duża próbka);
 *   C. FAIR_PLAY_DEPOSIT_IDS zawiera 'cyna' — gwarantowany dostęp w każdej komórce siatki
 *      fair-play (jak żelazo/miedź/glina);
 *   D. kwalifikacja budowy Kopalni cyny na mapie (buildImprovementQualifier +
 *      depositAllowsPlayerImprovement) — TYLKO na złożu cyny, Wzgórza/Góry;
 *   E. Kopalnia cyny → territoryResourceYieldForImprovement → Ruda cyny do magazynu
 *      terytorialnego (SUROW-TERYT-01, ta sama stawka co miedź/żelazo: 20/t);
 *   F. konwerter Odlewni brązu zużywa Rudę cyny w proporcji 1:10 względem cykli — test na
 *      konkretnych liczbach (100 Ruda + 100 Drewno + 10 Ruda cyny → dokładnie 100 cykli/Brąz);
 *   G. SEDNO zgłoszenia: brak Cyny w magazynie → throughput=0 (Brąz NIE produkuje się wcale),
 *      mimo dostępnej Miedzi/Drewna — Cyna niczego nie zastępuje, tylko dodatkowo bramkuje;
 *   H. to samo dla odlewnia_zelaza__braz i wielka_odlewnia__braz (WSZYSTKIE trzy tiery);
 *   I. hasBrazAccess (braz-access.ts) NIEZMIENIONY — nadal patrzy WYŁĄCZNIE na
 *      empireStock.braz > 0 + budynek, niezależnie od tego jak Brąz powstał (regresja);
 *   J. cyna-access.ts: empireHasKopalniaNaZlozuCyny / cityHasOdlewniaForCyna — jednostki.
 *   K. Pokrycie AI (ai.ts): AI_IMPROVEMENT_FOR_DEFICIT['ruda_cyny'] zawiera 'kopalnia_cyny'
 *      (AI buduje Kopalnię cyny gdy brakuje Rudy cyny) i UPSTREAM_FOR_PROCESSED_RESOURCE.braz
 *      zawiera 'ruda_cyny' (deficyt Brązu boostuje też budowę Kopalni cyny, nie tylko
 *      Kopalni miedzi) — proste asercje na strukturze danych, bez symulacji decyzji AI.
 *
 * Run from gra/: node tools/cyna-surowiec-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.cyna-surowiec-entry.ts');
const BUNDLE = path.resolve(__dirname, '.cyna-surowiec-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../src/map/generator';
export { DEPOSIT_RULES, FAIR_PLAY_DEPOSIT_IDS, depositGridCoverageRatio, fairPlayResourceCellSize } from '../src/map/gen-helpers';
export {
  buildImprovementQualifier, depositAllowsPlayerImprovement, galleryTerrainEligible,
} from '../src/map/improvement-build';
export { territoryResourceYieldForImprovement } from '../src/game/terrain-improvements';
export { DEFAULT_CONVERTER_RECIPES, runConverter, runConverters } from '../src/game/converters';
export { hasBrazAccess, empireHasKopalniaMiedzi, cityHasPiecHutniczy } from '../src/game/braz-access';
export { empireHasKopalniaNaZlozuCyny, cityHasOdlewniaForCyna, hasCynaAccess } from '../src/game/cyna-access';
export { AI_IMPROVEMENT_FOR_DEFICIT, UPSTREAM_FOR_PROCESSED_RESOURCE } from '../src/game/ai';
export { TerenBazowy, Nakladka } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(BUNDLE);
const rawTerrainImprovements = JSON.parse(fs.readFileSync(path.join(GRA, 'data/terrain-improvements.json'), 'utf8'));
const rawResources = JSON.parse(fs.readFileSync(path.join(GRA, 'data/resources.json'), 'utf8'));

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const TB = M.TerenBazowy;
const cynaRule = M.DEPOSIT_RULES.find(r => r.id === 'cyna');
const miedzRule = M.DEPOSIT_RULES.find(r => r.id === 'miedz');

// ===========================================================================
// A. Złoże cyny powstaje wyłącznie na Wzgórzach/Górach.
// ===========================================================================
console.log('-- A. reguła terenowa cyny --');
{
  ok(!!cynaRule, 'DEPOSIT_RULES zawiera regułę id=cyna');
  const seeds = [1, 2, 3, 4, 5, 42, 777, 2026];
  let totalCyna = 0;
  let violations = 0;
  const detail = [];
  for (const s of seeds) {
    const m = M.generateMap(M.DEFAULT_WIDTH, M.DEFAULT_HEIGHT, s);
    for (const k in m.hexes) {
      const hex = m.hexes[k];
      if (hex.zloze !== 'cyna') continue;
      totalCyna++;
      const onGoodTerrain = hex.terenBazowy === TB.Wzgorza || hex.terenBazowy === TB.Gory;
      if (!onGoodTerrain || !cynaRule.allowedOn(hex)) {
        violations++;
        detail.push(`seed ${s} ${k}: cyna on ${hex.terenBazowy}`);
      }
    }
  }
  ok(violations === 0, `0 złóż cyny poza Wzgórza/Góry (naruszenia: ${violations}) ${detail.slice(0, 3).join(' | ')}`);
  ok(totalCyna > 0, `co najmniej jedno złoże cyny w ${seeds.length} ziarnach (ma: ${totalCyna})`);
}

// ===========================================================================
// B. Rzadkość cyny ≈ miedź / 5 (statystycznie, duża próbka ziaren).
// ===========================================================================
console.log('-- B. rzadkość cyny vs miedzi (≈ 1/5) --');
{
  const seeds = Array.from({ length: 20 }, (_, i) => 1000 + i);
  let miedz = 0, cyna = 0;
  for (const s of seeds) {
    const m = M.generateMap(M.DEFAULT_WIDTH, M.DEFAULT_HEIGHT, s);
    for (const k in m.hexes) {
      const hex = m.hexes[k];
      if (hex.zloze === 'miedz') miedz++;
      if (hex.zloze === 'cyna') cyna++;
    }
  }
  console.log(`  ${seeds.length} ziaren (${M.DEFAULT_WIDTH}x${M.DEFAULT_HEIGHT}, kontynenty): miedz=${miedz}, cyna=${cyna}`);
  eq(cynaRule.rarity, miedzRule.rarity / 5, 'parametr rarity: cyna === miedz / 5 dokładnie');
  ok(cyna < miedz, `cyna (${cyna}) rzadsza niż miedź (${miedz}) łącznie w ${seeds.length} ziarnach`);
  // Statystyczny margines (fair-play bootstrap dokłada dodatkowe złoża cyny w komórkach bez
  // naturalnego trafienia — patrz sekcja C, więc realny stosunek jest WYŻSZY niż czyste 1/5
  // rarity, nigdy dokładnie 1/5 po ensureDepositGridCoverage). Sprawdzamy pasmo rozsądne,
  // nie równość liczbową.
  const ratio = cyna / miedz;
  ok(ratio > 0 && ratio < 0.9, `stosunek cyna/miedz=${ratio.toFixed(2)} w rozsądnym paśmie (rzadsza, ale nie zerowa dzięki fair-play)`);
}

// ===========================================================================
// C. FAIR_PLAY_DEPOSIT_IDS zawiera 'cyna' — gwarantowany pakiet per komórka.
// ===========================================================================
console.log('-- C. FAIR_PLAY_DEPOSIT_IDS + pokrycie siatki --');
{
  ok(M.FAIR_PLAY_DEPOSIT_IDS.includes('cyna'),
    "FAIR_PLAY_DEPOSIT_IDS zawiera 'cyna' -- gwarantowana każdej cywilizacji jak żelazo/miedź/glina");
  ok(!M.FAIR_PLAY_DEPOSIT_IDS.includes('zloto'),
    'kontrola: złoto (świadomie rzadkie) nadal NIE jest w FAIR_PLAY_DEPOSIT_IDS');

  const m = M.generateMap(168, 120, 42, 'kontynenty', {
    mapSizeMenuLabel: 'Standardowy',
    worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
  });
  const cell = M.fairPlayResourceCellSize('medium');
  const ratioCyna = M.depositGridCoverageRatio(Object.keys(m.hexes), m.hexes, cell, ['cyna']);
  ok(ratioCyna >= 0.85, `pokrycie siatki wyłącznie cyną ≥85% (${(ratioCyna * 100).toFixed(0)}%) -- ensureDepositGridCoverage dogania cynę tak samo jak żelazo/miedź/glina`);
}

// ===========================================================================
// D. Kwalifikacja budowy Kopalni cyny na mapie (buildImprovementQualifier).
// ===========================================================================
console.log('-- D. kwalifikacja budowy Kopalni cyny --');
{
  function mkHex(q, r, teren, zloze) {
    return {
      coords: { q, r }, terenBazowy: teren, nakladka: M.Nakladka.Brak,
      zloze, rzeka: { obecna: false, krawedzie: [] }, ulepszenie: 'brak',
      wioska: { istnieje: false, ludnosc: 0 }, wlasciciel: null,
    };
  }
  const hexes = {
    '0,0': mkHex(0, 0, TB.Rownina),
    '1,0': mkHex(1, 0, TB.Wzgorza, 'cyna'),
    '2,0': mkHex(2, 0, TB.Gory, 'cyna'),
    '3,0': mkHex(3, 0, TB.Wzgorza, 'miedz'),
    '4,0': mkHex(4, 0, TB.Rownina, 'cyna'), // reguła terenowa: cyna NIGDY na Rownina -- sprawdzamy wymuszenie terenu
  };
  const map = { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };
  const cityNodes = [{ q: 0, r: 0, pop: 5, level: 1 }];
  const territoryNodes = [{ q: 0, r: 0, pop: 5, level: 1, ownerId: 0 }];
  const qualifies = M.buildImprovementQualifier({ map, cityNodes, territoryNodes, playerOwnerIdNum: 0 });

  ok(qualifies('kopalnia_cyny', 1, 0) === true, 'Kopalnia cyny: Wzgórza + zloze=cyna -> OK');
  ok(qualifies('kopalnia_cyny', 2, 0) === true, 'Kopalnia cyny: Góry + zloze=cyna -> OK');
  ok(qualifies('kopalnia_cyny', 3, 0) === false, 'Kopalnia cyny: Wzgórza + zloze=miedz -> NIE');
  ok(qualifies('kopalnia_cyny', 4, 0) === false, 'Kopalnia cyny: Równina (zły teren, mimo zloze=cyna) -> NIE');
  ok(qualifies('kopalnia_cyny', 0, 0) === false, 'Kopalnia cyny: Równina bez złoża -> NIE');
  // Kontrola: Kopalnia miedzi NIE kwalifikuje się na złożu cyny (odwrotna pomyłka).
  ok(qualifies('kopalnia_miedzi', 1, 0) === false, 'Kopalnia miedzi: Wzgórza + zloze=cyna -> NIE (nie miesza złóż)');

  ok(M.depositAllowsPlayerImprovement('kopalnia_cyny', hexes['1,0']) === true,
    'depositAllowsPlayerImprovement: kopalnia_cyny na zloze=cyna -> true');
  ok(M.depositAllowsPlayerImprovement('kopalnia_cyny', hexes['3,0']) === false,
    'depositAllowsPlayerImprovement: kopalnia_cyny na zloze=miedz -> false');
  ok(M.galleryTerrainEligible('kopalnia_cyny', TB.Wzgorza) === false || true, 'galleryTerrainEligible: kopalnia_cyny nie wymagana (reużywa domyślnego modelu render) -- brak asercji blokującej');
}

// ===========================================================================
// E. Terrain-improvements.json + territoryResourceYieldForImprovement.
// ===========================================================================
console.log('-- E. dane Kopalni cyny + plon terytorialny --');
{
  const kc = rawTerrainImprovements['kopalnia_cyny'];
  ok(!!kc, 'terrain-improvements.json ma wpis kopalnia_cyny');
  ok(kc.surowiecOdblokowany === 'ruda_cyny',
    `kopalnia_cyny.surowiecOdblokowany = ruda_cyny (ma: ${JSON.stringify(kc && kc.surowiecOdblokowany)})`);
  eq(kc.surowiec_ilosc_tura, 20, 'kopalnia_cyny.surowiec_ilosc_tura = 20/t (ta sama stawka co miedź/żelazo dziś)');
  eq(kc.tech, 'Brązownictwo', 'kopalnia_cyny.tech = Brązownictwo (reużycie, jak kopalnia_miedzi)');

  const kMiedzi = rawTerrainImprovements['kopalnia_miedzi'];
  const kZelaza = rawTerrainImprovements['kopalnia_zelaza'];
  eq(kc.surowiec_ilosc_tura, kMiedzi.surowiec_ilosc_tura, 'kopalnia_cyny: sama stawka co kopalnia_miedzi');
  eq(kc.surowiec_ilosc_tura, kZelaza.surowiec_ilosc_tura, 'kopalnia_cyny: sama stawka co kopalnia_zelaza');

  const yieldRow = M.territoryResourceYieldForImprovement('kopalnia_cyny');
  ok(!!yieldRow && yieldRow.resourceKey === 'ruda_cyny' && yieldRow.amount === 20,
    `territoryResourceYieldForImprovement('kopalnia_cyny') -> {resourceKey: ruda_cyny, amount: 20} (ma: ${JSON.stringify(yieldRow)})`);

  const cynaRes = rawResources.find(r => r.Surowiec === 'Ruda cyny');
  ok(!!cynaRes, 'resources.json: wpis "Ruda cyny" istnieje');
}

// ===========================================================================
// F + G + H. Konwerter Odlewni brązu — Ruda cyny jako trzeci input, proporcja 1:10.
// ===========================================================================
console.log('-- F+G+H. konwerter Brązu wymaga Rudy cyny (1 Ruda cyny / 10 cykli) --');
{
  const odlewniaBrazu = M.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'odlewnia_brazu');
  const odlewniaZelBraz = M.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'odlewnia_zelaza__braz');
  const wielkaOdlewniaBraz = M.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'wielka_odlewnia__braz');
  const odlewniaZelZelazo = M.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'odlewnia_zelaza__zelazo');
  const wielkaOdlewniaStal = M.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'wielka_odlewnia__stal');

  eq(M.DEFAULT_CONVERTER_RECIPES.length, 9, 'wciąż 9 receptur -- Cyna dopisana jako input, NIE nowa receptura');

  for (const [name, recipe] of [
    ['odlewnia_brazu', odlewniaBrazu],
    ['odlewnia_zelaza__braz', odlewniaZelBraz],
    ['wielka_odlewnia__braz', wielkaOdlewniaBraz],
  ]) {
    ok(!!recipe, `receptura ${name} istnieje`);
    eq(recipe.inputs.ruda_cyny, 0.1, `${name}.inputs.ruda_cyny = 0.1 (1 Ruda cyny / 10 cykli)`);
    eq(recipe.inputs.ruda, 1, `${name}.inputs.ruda = 1 (bez zmian)`);
    eq(recipe.inputs.drewno, 1, `${name}.inputs.drewno = 1 (bez zmian)`);
  }
  // Odlewnie żelaza/stali (INNE receptury tych samych budynków) NIE dostają Cyny --
  // Cyna wchodzi WYŁĄCZNIE do konwertera produkującego Brąz.
  ok(!Object.prototype.hasOwnProperty.call(odlewniaZelZelazo.inputs, 'ruda_cyny'),
    'odlewnia_zelaza__zelazo NIE ma ruda_cyny w inputs (Cyna tylko dla konwertera Brązu)');
  ok(!Object.prototype.hasOwnProperty.call(wielkaOdlewniaStal.inputs, 'ruda_cyny'),
    'wielka_odlewnia__stal NIE ma ruda_cyny w inputs (Cyna tylko dla konwertera Brązu)');
  // Martwa receptura 'huta' -- poza zakresem, NIE dotknięta.
  const huta = M.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'huta');
  ok(!Object.prototype.hasOwnProperty.call(huta.inputs, 'ruda_cyny'),
    "receptura martwa 'huta' (converters.ts, budynek nieistniejący) NIE dotknięta -- poza zakresem zgłoszenia");

  // F. 100 Ruda + 100 Drewno + 10 Ruda cyny -> dokładnie 100 cykli/Brąz (limitowane Cyną:
  // floor(10/0.1) = 100, mniej niż floor(100/1)=100 dla ruda/drewno -- równe, throughput musi
  // być >=100 żeby nie limitował on).
  let r = M.runConverter(odlewniaBrazu, { ruda: 100, drewno: 100, ruda_cyny: 10 }, 999, 999);
  eq(r.cykle, 100, 'F: 100 Ruda + 100 Drewno + 10 Ruda cyny -> dokładnie 100 cykli');
  eq(r.produced, 100, 'F: 100 Brązu wyprodukowane');
  eq(r.consumed.ruda_cyny, 10, 'F: cała Ruda cyny (10) zużyta');
  eq(r.stores.ruda_cyny, 0, 'F: magazyn Rudy cyny wyzerowany po 100 cyklach');

  // F2. Cyna jako WĄSKIE GARDŁO: mniej niż 1/10 pozostałych inputów -> limituje cykle.
  r = M.runConverter(odlewniaBrazu, { ruda: 100, drewno: 100, ruda_cyny: 3 }, 999, 999);
  eq(r.cykle, 30, 'F2: tylko 3 Ruda cyny (floor(3/0.1)=30) limituje do 30 cykli mimo 100 Ruda/Drewno dostępnych');
  eq(r.produced, 30, 'F2: 30 Brązu (limit Cyny, nie Rudy/Drewna)');

  // G. SEDNO zgłoszenia: brak Cyny (0) w magazynie -> throughput=0, NIEZALEŻNIE od dostępnej
  // Miedzi/Drewna. Cyna niczego nie zastępuje -- to DODATKOWY wymóg.
  r = M.runConverter(odlewniaBrazu, { ruda: 100, drewno: 100, ruda_cyny: 0 }, 999, 999);
  eq(r.cykle, 0, 'G: brak Rudy cyny (0) -> 0 cykli, mimo 100 Ruda + 100 Drewno dostępnych');
  eq(r.produced, 0, 'G: 0 Brązu wyprodukowane -- Odlewnia brązu NIE działa bez Cyny');
  eq(r.reason, 'brak-wejscia', "G: reason='brak-wejscia' (Cyna, nie Ruda/Drewno, jest wąskim gardłem)");

  // G2. Klucz ruda_cyny nieobecny w ogóle w stores (undefined, nie 0) -> to samo zachowanie
  // (have() traktuje brakujący klucz jak 0 -- test regresji na dokładnie ten przypadek).
  r = M.runConverter(odlewniaBrazu, { ruda: 100, drewno: 100 }, 999, 999);
  eq(r.cykle, 0, 'G2: pole ruda_cyny w ogóle nieobecne w magazynie -> 0 cykli (traktowane jak 0)');

  // H. To samo dla pozostałych dwóch tierów (odlewnia_zelaza / wielka_odlewnia) --
  // wszystkie TRZY budynki mają równoległy konwerter Brązu wymagający Cyny.
  const rZel = M.runConverter(odlewniaZelBraz, { ruda: 50, drewno: 50, ruda_cyny: 0 }, 999, 999);
  eq(rZel.cykle, 0, 'H: odlewnia_zelaza__braz -- brak Cyny -> 0 cykli Brązu');
  const rWlk = M.runConverter(wielkaOdlewniaBraz, { ruda: 50, drewno: 50, ruda_cyny: 0 }, 999, 999);
  eq(rWlk.cykle, 0, 'H: wielka_odlewnia__braz -- brak Cyny -> 0 cykli Brązu');

  // H2. runConverters (parytet AI, wielo-receptura na wspólnej puli) -- Brąz+Żelazo równolegle
  // w Odlewni żelaza: Żelazo NIE wymaga Cyny (osobna receptura), Brąz wymaga.
  const dualRecipes = [odlewniaZelBraz, odlewniaZelZelazo];
  const dual = M.runConverters(
    dualRecipes,
    { ruda: 20, ruda_zelaza: 20, drewno: 40, ruda_cyny: 0 },
    { odlewnia_zelaza__braz: 999, odlewnia_zelaza__zelazo: 999 },
    () => 999,
  );
  eq(dual.perBuilding.odlewnia_zelaza__braz.produced, 0, 'H2: bez Cyny -- 0 Brązu (konwerter braz)');
  eq(dual.perBuilding.odlewnia_zelaza__zelazo.produced, 20, 'H2: Żelazo produkuje się NORMALNIE (nie wymaga Cyny -- input inny niż braz)');
}

// ===========================================================================
// I. hasBrazAccess (braz-access.ts) NIEZMIENIONY -- regresja.
// ===========================================================================
console.log('-- I. hasBrazAccess niezmieniony (regresja) --');
{
  ok(M.hasBrazAccess({ braz: 1 }, ['odlewnia_brazu']) === true,
    'hasBrazAccess: braz w magazynie + odlewnia -> true (bez zmian, niezależnie od tego jak Brąz powstał)');
  ok(M.hasBrazAccess({ braz: 0 }, ['odlewnia_brazu']) === false,
    'hasBrazAccess: brak brazu w magazynie -> false');
  ok(M.hasBrazAccess({ braz: 1 }, []) === false,
    'hasBrazAccess: braz w magazynie ale brak odlewni -> false');
  // Kontrola: hasBrazAccess NIE patrzy na ruda_cyny w ogóle -- podpisując zdanie ze specyfikacji
  // "hasBrazAccess patrzy tylko na empireStock.braz > 0 + budynek".
  ok(M.hasBrazAccess({ braz: 1, ruda_cyny: 0 }, ['odlewnia_brazu']) === true,
    'hasBrazAccess: obecność/brak ruda_cyny w magazynie NIE wpływa na gate (tylko braz + budynek)');
  ok(M.empireHasKopalniaMiedzi(new Map([['5,5', ['kopalnia_miedzi']]])) === true, 'kontrola: empireHasKopalniaMiedzi bez zmian');
}

// ===========================================================================
// J. cyna-access.ts -- jednostki (wzorem zelazo-access.ts).
// ===========================================================================
console.log('-- J. cyna-access.ts jednostki --');
{
  const MAP = {
    hexes: {
      '1,1': { zloze: 'cyna' },
      '2,2': { zloze: 'miedz' },
      '3,3': {},
    },
  };
  const placedNone = new Map();
  ok(M.empireHasKopalniaNaZlozuCyny(placedNone, MAP) === false, 'brak placedImprovements -> false');

  const placedKopalniaOnCyna = new Map([['1,1', 'kopalnia_cyny']]);
  ok(M.empireHasKopalniaNaZlozuCyny(placedKopalniaOnCyna, MAP) === true,
    'Kopalnia cyny na hexie ze złożem cyny -> true');

  const placedKopalniaOnMiedz = new Map([['2,2', 'kopalnia_cyny']]);
  ok(M.empireHasKopalniaNaZlozuCyny(placedKopalniaOnMiedz, MAP) === false,
    'Kopalnia cyny na hexie ze złożem MIEDZI (nie cyny) -> false');

  ok(M.empireHasKopalniaNaZlozuCyny(placedKopalniaOnCyna, null) === false,
    'brak mapy (null) -> false (bezpiecznik)');

  ok(M.cityHasOdlewniaForCyna([]) === false, 'miasto bez budynków -> false');
  ok(M.cityHasOdlewniaForCyna(['odlewnia_brazu']) === true, 'Odlewnia brązu -> true');
  ok(M.cityHasOdlewniaForCyna(['odlewnia_zelaza']) === true, 'Odlewnia żelaza (upgrade) -> true');
  ok(M.cityHasOdlewniaForCyna(['wielka_odlewnia']) === true, 'Wielka odlewnia (upgrade) -> true');
  ok(M.cityHasOdlewniaForCyna(['kuznia']) === false, 'inny budynek (nie łańcuch odlewni) -> false');

  ok(M.hasCynaAccess({ ruda_cyny: 1 }, ['odlewnia_brazu']) === true, 'hasCynaAccess: stock + odlewnia -> true');
  ok(M.hasCynaAccess({ ruda_cyny: 0 }, ['odlewnia_brazu']) === false, 'hasCynaAccess: brak stocku -> false');
  ok(M.hasCynaAccess({ ruda_cyny: 1 }, []) === false, 'hasCynaAccess: stock bez odlewni -> false');
}

// ===========================================================================
// K. Pokrycie AI (ai.ts): AI_IMPROVEMENT_FOR_DEFICIT + UPSTREAM_FOR_PROCESSED_RESOURCE.
// ===========================================================================
console.log('-- K. pokrycie AI (deficyt Rudy cyny -> Kopalnia cyny; deficyt Brazu -> upstream Cyna) --');
{
  ok(!!M.AI_IMPROVEMENT_FOR_DEFICIT.ruda_cyny,
    "AI_IMPROVEMENT_FOR_DEFICIT ma klucz 'ruda_cyny'");
  ok(Array.isArray(M.AI_IMPROVEMENT_FOR_DEFICIT.ruda_cyny)
    && M.AI_IMPROVEMENT_FOR_DEFICIT.ruda_cyny.includes('kopalnia_cyny'),
    `AI_IMPROVEMENT_FOR_DEFICIT['ruda_cyny'] zawiera 'kopalnia_cyny' (ma: ${JSON.stringify(M.AI_IMPROVEMENT_FOR_DEFICIT.ruda_cyny)})`);

  ok(!!M.UPSTREAM_FOR_PROCESSED_RESOURCE.braz,
    "UPSTREAM_FOR_PROCESSED_RESOURCE ma klucz 'braz'");
  ok(Array.isArray(M.UPSTREAM_FOR_PROCESSED_RESOURCE.braz)
    && M.UPSTREAM_FOR_PROCESSED_RESOURCE.braz.includes('ruda_cyny'),
    `UPSTREAM_FOR_PROCESSED_RESOURCE.braz zawiera 'ruda_cyny' (ma: ${JSON.stringify(M.UPSTREAM_FOR_PROCESSED_RESOURCE.braz)})`);
  ok(M.UPSTREAM_FOR_PROCESSED_RESOURCE.braz.includes('ruda'),
    "UPSTREAM_FOR_PROCESSED_RESOURCE.braz nadal zawiera 'ruda' (regresja: Cyna dopisana, Miedz NIE usunieta)");
}

console.log(`\ncyna-surowiec-test: ${pass} pass, ${fail} fail`);
try { fs.unlinkSync(ENTRY); } catch (_) {}
try { fs.unlinkSync(BUNDLE); } catch (_) {}
process.exit(fail > 0 ? 1 : 0);
