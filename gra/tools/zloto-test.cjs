'use strict';
/**
 * zloto-test.cjs — wprowadzenie złota jako surowca DOSTĘPOWEGO (Maciej 2026-07-25).
 *
 * Pokrywa:
 *   A. złoże złota powstaje wyłącznie na terenie zgodnym z regułą (Wzgórza/Góry), kilka ziaren;
 *   B. złoto jest RZADSZE niż miedź na tej samej mapie (liczby);
 *   C. Kopalnia złota na złożu daje imperium dostęp; bez kopalni / bez złoża — brak dostępu;
 *   D. Mennica niedostępna bez dostępu do złota; dostępna z dostępem (+ Targowisko + tech);
 *   E. Mennica niedostępna bez Targowiska w mieście (mimo dostępu do złota);
 *   F. złoto W magazynie państwa (PYTANIE-84-R9) + asercje pilnujące kosztów budowy;
 *   G. parytet AI: identyczny wynik dla dwóch różnych ownerId;
 *   H. stary zapis (mapa/miasto bez złóż złota) wczytuje się bez wyjątku, Mennica już
 *      zbudowana nie znika.
 *
 * Run from gra/:  node tools/zloto-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.zloto-test-entry.ts');
const BUNDLE = path.resolve(__dirname, '.zloto-test-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../src/map/generator';
export { DEPOSIT_RULES, FAIR_PLAY_DEPOSIT_IDS } from '../src/map/gen-helpers';
export { empireHasKopalniaZlota, KOPALNIA_ZLOTA_KEY } from '../src/game/zloto-access';
export { getCityResourceAccessForCity, getResourceAccessForCity } from '../src/game/resource-access';
export {
  buildImprovementQualifier, depositAllowsPlayerImprovement, galleryTerrainEligible,
} from '../src/map/improvement-build';
export { buildableProduction, eraBuildingCatalog } from '../src/game/production';
export { CITY_BUILDING_PREREQ } from '../src/game/building-resource-gate';
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
const rawBuildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const rawTerrainImprovements = JSON.parse(fs.readFileSync(path.join(GRA, 'data/terrain-improvements.json'), 'utf8'));
const rawResources = JSON.parse(fs.readFileSync(path.join(GRA, 'data/resources.json'), 'utf8'));
const DATA = { buildings: rawBuildings, units: [] };

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('  FAIL:', msg); } }

const TB = M.TerenBazowy;
const zlotoRule = M.DEPOSIT_RULES.find(r => r.id === 'zloto');
const miedzRule = M.DEPOSIT_RULES.find(r => r.id === 'miedz');

// ===========================================================================
// A. Złoże złota powstaje wyłącznie na terenie zgodnym z regułą (Wzgórza/Góry),
//    sprawdzone przez kilka ziaren + rozmiarów.
// ===========================================================================
console.log('-- A. reguła terenowa złota --');
{
  ok(!!zlotoRule, 'DEPOSIT_RULES zawiera regułę id=zloto');
  const seeds = [1, 2, 3, 4, 5, 42, 777, 2026];
  let totalZloto = 0;
  let violations = 0;
  const detail = [];
  for (const s of seeds) {
    const m = M.generateMap(M.DEFAULT_WIDTH, M.DEFAULT_HEIGHT, s);
    for (const k in m.hexes) {
      const hex = m.hexes[k];
      if (hex.zloze !== 'zloto') continue;
      totalZloto++;
      const onGoodTerrain = hex.terenBazowy === TB.Wzgorza || hex.terenBazowy === TB.Gory;
      if (!onGoodTerrain || !zlotoRule.allowedOn(hex)) {
        violations++;
        detail.push(`seed ${s} ${k}: zloto on ${hex.terenBazowy}`);
      }
    }
  }
  ok(violations === 0, `0 złóż złota poza Wzgórza/Góry (naruszenia: ${violations}) ${detail.slice(0, 3).join(' | ')}`);
  ok(totalZloto > 0, `co najmniej jedno złoże złota w ${seeds.length} ziarnach (ma: ${totalZloto})`);
}

// ===========================================================================
// B. Złoto jest RZADSZE niż miedź na tej samej mapie (liczby z kilku ziaren).
// ===========================================================================
console.log('-- B. rzadkość złota vs miedzi --');
{
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 42, 123, 777, 2026, 999, 55, 66, 77, 88, 99];
  let miedz = 0, zloto = 0;
  for (const s of seeds) {
    const m = M.generateMap(M.DEFAULT_WIDTH, M.DEFAULT_HEIGHT, s);
    for (const k in m.hexes) {
      const hex = m.hexes[k];
      if (hex.zloze === 'miedz') miedz++;
      if (hex.zloze === 'zloto') zloto++;
    }
  }
  console.log(`  ${seeds.length} ziaren (${M.DEFAULT_WIDTH}x${M.DEFAULT_HEIGHT}, kontynenty): miedz=${miedz}, zloto=${zloto}`);
  ok(zloto < miedz, `złoto (${zloto}) rzadsze niż miedź (${miedz}) łącznie w ${seeds.length} ziarnach`);
  ok(zlotoRule.rarity < miedzRule.rarity,
    `parametr rarity: zloto (${zlotoRule.rarity}) < miedz (${miedzRule.rarity})`);
  ok(!M.FAIR_PLAY_DEPOSIT_IDS.includes('zloto'),
    'złoto NIE jest w FAIR_PLAY_DEPOSIT_IDS (nie jest gwarantowane każdemu graczowi jak żelazo/miedź/glina)');
}

// ===========================================================================
// C. Kopalnia złota na złożu daje imperium dostęp; bez kopalni / bez złoża — brak.
// ===========================================================================
console.log('-- C. dostęp imperium do złota (empireHasKopalniaZlota) --');
{
  const withMine = new Map([['5,5', ['kopalnia_zlota']]]);
  const withoutMine = new Map([['5,5', ['kopalnia_zelaza']]]);
  const empty = new Map();

  ok(M.empireHasKopalniaZlota(withMine) === true, 'Kopalnia złota gdziekolwiek w placedImprovements -> dostęp TAK');
  ok(M.empireHasKopalniaZlota(withoutMine) === false, 'Inna kopalnia (nie złota) -> dostęp NIE');
  ok(M.empireHasKopalniaZlota(empty) === false, 'Brak jakichkolwiek ulepszeń -> dostęp NIE');
  ok(M.empireHasKopalniaZlota(null) === false, 'null placedImprovements -> dostęp NIE (bez wyjątku)');
  ok(M.empireHasKopalniaZlota(undefined) === false, 'undefined placedImprovements -> dostęp NIE (bez wyjątku)');

  // Wiele wpisów, kopalnia złota gdzieś w środku listy warstw jednego heksu.
  const multi = new Map([
    ['1,1', ['droga', 'farma']],
    ['9,9', ['kopalnia_zlota', 'droga']],
  ]);
  ok(M.empireHasKopalniaZlota(multi) === true, 'Kopalnia złota jako jedna z wielu warstw na heksie -> dostęp TAK');
}

// ===========================================================================
// C2. Kwalifikacja placementu (buildImprovementQualifier) — Kopalnia złota TYLKO
//     na hex.zloze==='zloto', na Wzgórzach/Górach, w terytorium gracza.
// ===========================================================================
console.log('-- C2. kwalifikacja budowy Kopalni złota na mapie --');
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
    '1,0': mkHex(1, 0, TB.Wzgorza, 'zloto'),
    '2,0': mkHex(2, 0, TB.Gory, 'zloto'),
    '3,0': mkHex(3, 0, TB.Wzgorza, 'miedz'),
    '4,0': mkHex(4, 0, TB.Rownina, 'zloto'), // reguła terenowa: zloto NIGDY na Rownina -- placeDeposits by tego nie zrobił, ale sprawdzamy że qualifies i tak wymusza teren
  };
  const map = { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };
  const cityNodes = [{ q: 0, r: 0, pop: 5, level: 1 }];
  const territoryNodes = [{ q: 0, r: 0, pop: 5, level: 1, ownerId: 0 }];
  const qualifies = M.buildImprovementQualifier({ map, cityNodes, territoryNodes, playerOwnerIdNum: 0 });

  ok(qualifies('kopalnia_zlota', 1, 0) === true, 'Kopalnia złota: Wzgórza + zloze=zloto -> OK');
  ok(qualifies('kopalnia_zlota', 2, 0) === true, 'Kopalnia złota: Góry + zloze=zloto -> OK');
  ok(qualifies('kopalnia_zlota', 3, 0) === false, 'Kopalnia złota: Wzgórza + zloze=miedz -> NIE');
  ok(qualifies('kopalnia_zlota', 4, 0) === false, 'Kopalnia złota: Równina (zły teren, mimo zloze=zloto) -> NIE');
  ok(qualifies('kopalnia_zlota', 0, 0) === false, 'Kopalnia złota: Równina bez złoża -> NIE');

  ok(M.depositAllowsPlayerImprovement('kopalnia_zlota', hexes['1,0']) === true,
    'depositAllowsPlayerImprovement: kopalnia_zlota na zloze=zloto -> true');
  ok(M.depositAllowsPlayerImprovement('kopalnia_zlota', hexes['3,0']) === false,
    'depositAllowsPlayerImprovement: kopalnia_zlota na zloze=miedz -> false');
  ok(M.galleryTerrainEligible('kopalnia_zlota', TB.Wzgorza) === true, 'galleryTerrainEligible: kopalnia_zlota Wzgórza -> true');
  ok(M.galleryTerrainEligible('kopalnia_zlota', TB.Rownina) === false, 'galleryTerrainEligible: kopalnia_zlota Równina -> false');
}

// ===========================================================================
// D + E. Mennica — bramka złota (empire-wide) + bramka Targowiska (to samo miasto).
// ===========================================================================
console.log('-- D+E. bramka Mennicy (złoto + Targowisko) --');
{
  ok(M.CITY_BUILDING_PREREQ.mennica === 'targowisko',
    `CITY_BUILDING_PREREQ.mennica === 'targowisko' (ma: ${JSON.stringify(M.CITY_BUILDING_PREREQ.mennica)})`);

  const CITY = { id: 'c1', q: 0, r: 0, ownerId: 0, population: 5 };
  function ctx(overrides) {
    return Object.assign({
      epoch: 2, builtBuildingIds: [], productionQueue: [], isCapital: true,
      ownerId: 0, difficulty: 'normal',
    }, overrides);
  }
  function mennicaBuildable(overrides) {
    const items = M.buildableProduction(CITY, DATA, ['Waluta'], ctx(overrides));
    return items.some(it => it.id === 'mennica');
  }

  ok(mennicaBuildable({}) === false,
    'Mennica NIEDOSTĘPNA: brak Targowiska w mieście');
  ok(mennicaBuildable({ builtBuildingIds: ['targowisko'] }) === true,
    'Mennica DOSTĘPNA: Targowisko w mieście + Waluta (bez dostępu do złota — kanon magazyn)');
  ok(mennicaBuildable({ builtBuildingIds: ['targowisko'], activeResourceLabels: ['Złoto'] }) === true,
    'Mennica DOSTĘPNA: Targowisko + dostęp złota nie jest już wymagany, ale nie blokuje');
  ok(mennicaBuildable({ builtBuildingIds: ['targowisko'], empireActiveResourceLabels: ['Złoto'] }) === true,
    'Mennica DOSTĘPNA również przez empireActiveResourceLabels (bez wymogu złota)');

  // Bez technologii Waluta -- niedostępna niezależnie od reszty.
  const itemsNoTech = M.buildableProduction(
    CITY, DATA, [],
    ctx({ builtBuildingIds: ['targowisko'], activeResourceLabels: ['Złoto'] }),
  );
  ok(!itemsNoTech.some(it => it.id === 'mennica'), 'Mennica NIEDOSTĘPNA bez zbadanej technologii Waluta');
}

// ===========================================================================
// F. Złoto W magazynie państwa (PYTANIE-84-R9) — asercja pilnująca danych.
// ===========================================================================
console.log('-- F. złoto magazynowane w skarbcu państwa (PYTANIE-84-R9) --');
{
  const kz = rawTerrainImprovements['kopalnia_zlota'];
  ok(!!kz, 'terrain-improvements.json ma wpis kopalnia_zlota');
  ok(kz.surowiecOdblokowany === 'zloto',
    `kopalnia_zlota.surowiecOdblokowany = zloto (ma: ${JSON.stringify(kz && kz.surowiecOdblokowany)})`);
  ok(kz.surowiec_ilosc_tura === 1,
    `kopalnia_zlota.surowiec_ilosc_tura = 1 (ma: ${JSON.stringify(kz && kz.surowiec_ilosc_tura)})`);

  const stad = rawTerrainImprovements['stadnina'];
  ok(stad?.surowiec_ilosc_tura === 5, 'stadnina: 5 Koń/t do magazynu państwa (R-ZUZYCIE-SUROWCOW-OBYWATELE-PROD-Q1, korekta 2026-08-12)');

  const zlotoRes = rawResources.find(r => r.Surowiec === 'Złoto');
  ok(!!zlotoRes, 'resources.json: wpis Złoto istnieje');
  ok((zlotoRes.Uwagi || '').includes('zloto'), 'resources.json Złoto: klucz stock zloto w uwagach');

  // (2) żaden budynek w buildings.json nie ma 'zloto' w koszt_surowce.
  let buildingsWithGoldCost = 0;
  for (const b of rawBuildings) {
    if (b.koszt_surowce && Object.prototype.hasOwnProperty.call(b.koszt_surowce, 'zloto')) {
      buildingsWithGoldCost++;
    }
  }
  ok(buildingsWithGoldCost === 0,
    `0 budynków z 'zloto' w koszt_surowce (ma: ${buildingsWithGoldCost}) -- złoto nie jest kosztem budowy`);

  // (3) mennica sama nie kosztuje złota (jedyny budynek tematycznie powiązany).
  const mennicaDef = rawBuildings.find(b => b.id === 'mennica');
  ok(!!mennicaDef && !Object.prototype.hasOwnProperty.call(mennicaDef.koszt_surowce || {}, 'zloto'),
    'Mennica: koszt_surowce nie zawiera zloto');

  // (4) City.surowce -- struktura symulowanego "miasta" bez żadnego pola zloto po całej
  //     ścieżce dostępu (getCityResourceAccessForCity nie zwraca "zloto" jako klucz surowca
  //     magazynowanego -- tylko etykietę dostępu "Złoto" w active/potential, nigdy ilość).
  const map = {
    hexes: { '0,0': { coords: { q: 0, r: 0 }, terenBazowy: TB.Rownina, nakladka: M.Nakladka.Brak, zloze: undefined, rzeka: { obecna: false, krawedzie: [] } } },
    riverPaths: [], startPositions: [{ q: 0, r: 0 }],
  };
  const placed = new Map([['5,5', ['kopalnia_zlota']]]);
  const access = M.getCityResourceAccessForCity(
    { id: 'c1', q: 0, r: 0, population: 1 }, map, placed, 99, { ownerId: '0' },
  );
  ok(Array.isArray(access.active) && access.active.includes('Złoto'),
    'getCityResourceAccessForCity: "Złoto" pojawia się jako ETYKIETA dostępu (active), nie jako ilość');
  ok(typeof access.active[0] !== 'object', 'etykiety dostępu to stringi, nie obiekty z ilością');
}

// ===========================================================================
// G. Parytet AI: identyczny wynik dla dwóch różnych ownerId.
// ===========================================================================
console.log('-- G. parytet AI --');
{
  ok(M.empireHasKopalniaZlota(new Map([['1,1', ['kopalnia_zlota']]])) ===
     M.empireHasKopalniaZlota(new Map([['9,9', ['kopalnia_zlota']]])),
    'empireHasKopalniaZlota: ownerId-agnostyczne z założenia (przyjmuje już przefiltrowaną per-owner mapę)');

  function ctxFor(ownerId, overrides) {
    return Object.assign({
      epoch: 2, builtBuildingIds: ['targowisko'], productionQueue: [],
      isCapital: true, ownerId, difficulty: 'normal',
      activeResourceLabels: ['Złoto'],
    }, overrides);
  }
  const CITY0 = { id: 'c0', q: 0, r: 0, ownerId: 0, population: 5 };
  const CITY7 = { id: 'c7', q: 0, r: 0, ownerId: 7, population: 5 };
  const idsPlayer = M.buildableProduction(CITY0, DATA, ['Waluta'], ctxFor(0)).map(it => it.id).sort();
  const idsAi = M.buildableProduction(CITY7, DATA, ['Waluta'], ctxFor(7)).map(it => it.id).sort();
  ok(JSON.stringify(idsPlayer) === JSON.stringify(idsAi),
    `Parytet AI: identyczna lista budynków dla ownerId=0 i ownerId=7 (gracz: ${JSON.stringify(idsPlayer)}, AI: ${JSON.stringify(idsAi)})`);
  ok(idsPlayer.includes('mennica'), 'Parytet AI: Mennica dostępna dla obu przy identycznym stanie (złoto+Targowisko+Waluta)');

  // Bez etykiety Złoto — Mennica nadal budowalna (kanon magazyn, Targowisko w ctx).
  const idsPlayerNoGold = M.buildableProduction(CITY0, DATA, ['Waluta'], ctxFor(0, { activeResourceLabels: [] })).map(it => it.id);
  const idsAiNoGold = M.buildableProduction(CITY7, DATA, ['Waluta'], ctxFor(7, { activeResourceLabels: [] })).map(it => it.id);
  ok(idsPlayerNoGold.includes('mennica') && idsAiNoGold.includes('mennica'),
    'Parytet AI: bez dostępu do złota, Mennica budowalna identycznie dla gracza i AI (kanon magazyn)');
}

// ===========================================================================
// H. Stary zapis (mapa/miasto sprzed złota) wczytuje się bez wyjątku; Mennica
//    już zbudowana w takim zapisie NIE znika (status pozostaje 'built').
// ===========================================================================
console.log('-- H. kompatybilność starego zapisu --');
{
  // Mapa "sprzed złota" -- żaden heks nie ma pola zloze==='zloto' (pole może w ogóle nie istnieć).
  const oldHexes = {};
  for (let q = 0; q < 6; q++) {
    oldHexes[`${q},0`] = {
      coords: { q, r: 0 }, terenBazowy: q % 2 === 0 ? TB.Wzgorza : TB.Rownina,
      nakladka: M.Nakladka.Brak, rzeka: { obecna: false, krawedzie: [] },
      // brak pola "zloze" w ogóle -- symuluje JSON zapisu sprzed tej funkcji.
    };
  }
  const oldMap = { hexes: oldHexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };
  const oldPlacedImprovements = new Map(); // stary zapis -- brak jakiejkolwiek Kopalni złota

  let threw = false;
  let access;
  try {
    access = M.getCityResourceAccessForCity(
      { id: 'old1', q: 0, r: 0, population: 3 }, oldMap, oldPlacedImprovements, 99, { ownerId: '0' },
    );
  } catch (e) {
    threw = true;
  }
  ok(!threw, 'stary zapis (mapa bez złóż złota) -- getCityResourceAccessForCity nie wywala wyjątku');
  ok(access && !access.active.includes('Złoto'), 'stary zapis bez Kopalni złota -- brak etykiety "Złoto" (poprawnie, bez dostępu)');

  let threw2 = false;
  try {
    M.empireHasKopalniaZlota(oldPlacedImprovements);
  } catch (e) {
    threw2 = true;
  }
  ok(!threw2, 'stary zapis -- empireHasKopalniaZlota nie wywala wyjątku na pustej/starej mapie ulepszeń');

  // Mennica JUŻ zbudowana w starym zapisie -- eraBuildingCatalog musi nadal zwracać
  // status='built' (nie 'locked'), niezależnie od (nieistniejącej w starym zapisie) bramki
  // złota/Targowiska -- bramka dotyczy WYŁĄCZNIE nowego budowania, nie unieważnia istniejącego.
  const CITY = { id: 'oldcity', q: 0, r: 0, ownerId: 0, population: 5 };
  const catalog = M.eraBuildingCatalog(DATA, ['Waluta'], {
    epoch: 2, builtBuildingIds: ['mennica'], productionQueue: [], isCapital: true,
  });
  const mennicaEntry = catalog.find(e => e.id === 'mennica');
  ok(!!mennicaEntry && mennicaEntry.status === 'built',
    `Mennica już zbudowana w starym zapisie -- status='built', nie znika (ma: ${mennicaEntry && mennicaEntry.status})`);
}

console.log(`\nzloto-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
