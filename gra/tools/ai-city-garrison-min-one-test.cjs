'use strict';
/**
 * ai-city-garrison-min-one-test.cjs -- R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1.
 *
 * Kontrakt (wymog wlasciciela 2026-11-18): kazde miasto AI trzyma min. 1 jednostke bojowa takze
 * w pokoju, a ta jednostka nie wchodzi do zbiorki/scalania armii.
 *
 * Czesc A -- czysta funkcja (gra/src/game/ai-city-garrison.ts):
 *   H1 garnizon = najslabsza kwalifikujaca sie jednostka na heksie miasta (remis: id);
 *   H2 cywil, zwiadowca, wodz, zaokretowany, galera nie sa garnizonem;
 *   H3 jednostki innego wlasciciela sa ignorowane;
 *   H4 wynik nie zalezy od kolejnosci wejsc (determinizm);
 *   H5 miasto bez kwalifikujacej sie jednostki -> cityNeedsGarrison === true.
 * Czesc B -- rekrutacja (emptyCityGarrisonRecruitIds, z ai.ts):
 *   R1 puste miasto w POKOJU dostaje garnizon; miasto z jednostka bojowa nie;
 *   R2 miasto tylko z cywilem/zwiadowca/wodzem dostaje garnizon.
 * Czesc C -- wykluczenie z armii (decideAITurn, pokoj/wojna bez wroga):
 *   C1 garnizon NIE dostaje rozkazu marszu do zbiorki (3 jednostki w promieniu zbiorki);
 *   C2 MUTACJA w kopii ai.ts (usuniete wykluczenie garnizonow z concentrationExcludedUnitIds)
 *      MUSI zlamac C1 (garnizon idzie do zbiorki).
 *
 * Run (z gra/):  node tools/ai-city-garrison-min-one-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const WORK = fs.mkdtempSync(path.join(process.env.GARRISON_TMP || os.tmpdir(), 'cgm1-'));
const SRC = path.resolve(__dirname, '..', 'src');
const CONC_LINE = '...cityGarrisonUnitIds,\n  ]);';

const ENTRY_BODY = `
export { decideAITurn, emptyCityGarrisonRecruitIds } from ${JSON.stringify(path.join(SRC, 'game', 'ai.ts'))};
export {
  getCityGarrisonUnitIds, garrisonUnitIdSet, cityNeedsGarrison, isGarrisonEligibleUnit,
  isGarrisonPriorityPurchase, garrisonGoldReserve, GARRISON_RESERVE_MAX_CITIES,
  garrisonReserveMaxCitiesFromParams, GARRISON_RESERVE_PARAM_KEY,
  rankGarrisonUnitIds, pickGarrisonUnitId,
} from ${JSON.stringify(path.join(SRC, 'game', 'ai-city-garrison.ts'))};
export { planHomeWar } from ${JSON.stringify(path.join(SRC, 'game', 'ai-war-home-defense.ts'))};
export { setArmyConsolidationOverride } from ${JSON.stringify(path.join(SRC, 'game', 'army-consolidation.ts'))};
`;

async function buildBundle(name, mutate) {
  const entry = path.join(WORK, `${name}-entry.ts`);
  const out = path.join(WORK, `${name}-bundle.cjs`);
  fs.writeFileSync(entry, ENTRY_BODY);
  const plugin = {
    name: 'mutate-min-one',
    setup(b) {
      b.onLoad({ filter: /game[\\/]ai\.ts$/ }, (args) => {
        let text = fs.readFileSync(args.path, 'utf8');
        if (mutate === true) {
          if (text.split(CONC_LINE).length !== 2) throw new Error('mutacja: nie znaleziono wykluczenia garnizonow w concentration');
          text = text.replace(CONC_LINE, '  ]);');
        } else if (Array.isArray(mutate)) {
          for (const [find, repl, count] of mutate) {
            if (text.split(find).length !== count + 1) throw new Error(`mutacja: oczekiwano ${count}x "${find}" w ai.ts`);
            text = text.split(find).join(repl);
          }
        }
        return { contents: text, loader: 'ts' };
      });
    },
  };
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: out, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: path.resolve(__dirname, '..'),
    logLevel: 'silent', plugins: [plugin],
  });
  return require(out);
}

let passed = 0;
let failed = 0;
function ok(value, message) {
  if (value) passed++; else { failed++; console.error('FAIL:', message); }
}

function unit(id, q, r, extra = {}) {
  return { id, ownerId: 1, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2, ...extra };
}
function bigMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}
const testData = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };

async function main() {
  const GOOD = await buildBundle('good', false);
  const MUT = await buildBundle('mut', true);
  // r4: mutanty filtrow garnizonu w sciezkach, ktorych dotad nie pilnowal zaden test.
  const MUT_CAMPAIGN = await buildBundle('mutcamp', [['if (campaignGarrisonIds.has(unit.id)) continue;', '', 3]]);
  const MUT_CS = await buildBundle('mutcs', [
    ['const csGarrisonUnitIds = garrisonUnitIdSet(', 'const csGarrisonUnitIds: Set<string> = new Set(); void garrisonUnitIdSet(', 1]]);
  const MUT_FM = await buildBundle('mutfm', [['&& !cityGarrisonUnitIds.has(u.id)', '&& true', 1]]);
  const strengthById = (u) => (u.str !== undefined ? u.str : 1);

  // ---- A: czysta funkcja ----
  {
    const city = { id: 'A', q: 5, r: 5 };
    const strong = unit('strong', 5, 5, { str: 9 });
    const weak = unit('weak', 5, 5, { str: 2 });
    const map = GOOD.getCityGarrisonUnitIds([city], [strong, weak], 1, strengthById);
    ok(map.get('A') === 'weak', `H1: garnizon = najslabsza jednostka na heksie (${map.get('A')})`);

    const tie = GOOD.getCityGarrisonUnitIds([city], [unit('zz', 5, 5), unit('aa', 5, 5)], 1, () => 1);
    ok(tie.get('A') === 'aa', `H1b: remis sily -> najmniejsze id (${tie.get('A')})`);

    const notEligible = [
      unit('civ', 5, 5, { typeId: 'Osadnik', category: 'osadnik' }),
      unit('scout', 5, 5, { typeId: 'Zwiadowca', category: 'zwiadowca' }),
      unit('gen', 5, 5, { typeId: 'Wodz', category: 'wodz', isGeneral: true }),
      unit('emb', 5, 5, { embarked: true }),
      unit('galera', 5, 5, { category: 'galera' }),
    ];
    ok(GOOD.getCityGarrisonUnitIds([city], notEligible, 1, strengthById).size === 0,
      'H2: cywil/zwiadowca/wodz/zaokretowany/galera nie sa garnizonem');
    ok(GOOD.cityNeedsGarrison(city, notEligible, 1) === true, 'H5: miasto tylko z niekwalifikujacymi sie -> potrzebuje garnizonu');
    ok(GOOD.cityNeedsGarrison(city, [unit('x', 5, 5)], 1) === false, 'H5b: miasto z jednostka bojowa -> nie potrzebuje');

    // H6: priorytet zakupu tylko dla najtanszego garnizonu (Wojownik) w pustym miescie.
    ok(GOOD.isGarrisonPriorityPurchase(city, notEligible, 1, 'Wojownik', 'Wojownik') === true,
      'H6: Wojownik do pustego miasta -> priorytet garnizonu');
    ok(GOOD.isGarrisonPriorityPurchase(city, notEligible, 1, 'Miecznik', 'Wojownik') === false,
      'H6b: drozsza jednostka bojowa NIE dostaje priorytetu/omijania rezerwy');
    ok(GOOD.isGarrisonPriorityPurchase(city, [unit('x', 5, 5)], 1, 'Wojownik', 'Wojownik') === false,
      'H7: miasto z jednostka bojowa -> brak priorytetu (jest juz garnizon)');
    // H8-H10 (r3): czysta bramka rezerwy zlota na garnizony (wyciagnieta z main.ts).
    ok(GOOD.garrisonGoldReserve(0, 10) === 0 && GOOD.garrisonGoldReserve(2, 0) === 0,
      'H8: brak pustych miast lub brak ceny -> rezerwa 0');
    ok(GOOD.garrisonGoldReserve(2, 10) === 20, 'H9: 2 puste miasta x 10 = rezerwa 20');
    ok(GOOD.garrisonGoldReserve(78, 10) === GOOD.GARRISON_RESERVE_MAX_CITIES * 10,
      'H10: 78 pustych miast -> rezerwa ograniczona sufitem (brak zamrozenia skarbca)');

    // H11 (r4, zarzut FC 6): odczyt sufitu rezerwy z ai-params.json (klucz, typ, fallback).
    const LIVE = require(path.resolve(__dirname, '..', 'data', 'ai-params.json'));
    ok(LIVE[GOOD.GARRISON_RESERVE_PARAM_KEY] !== undefined && LIVE[GOOD.GARRISON_RESERVE_PARAM_KEY].wartosc === 3,
      'H11a: zywy ai-params.json zawiera klucz garnizon_rezerwa_max_miast = 3 (zalozenie robocze)');
    ok(GOOD.garrisonReserveMaxCitiesFromParams(LIVE) === 3, 'H11b: odczyt z zywej tabeli = 3 (nie fallback)');
    ok(GOOD.garrisonReserveMaxCitiesFromParams({ garnizon_rezerwa_max_miast: { wartosc: 5 } }) === 5,
      'H11c: wartosc 5 w tabeli -> 5 (odczyt, nie stala 3 -- wykrywa literowke klucza w kodzie)');
    ok(GOOD.garrisonReserveMaxCitiesFromParams({ garnizon_rezerwa_max_miast_typo: { wartosc: 5 } }) === GOOD.GARRISON_RESERVE_MAX_CITIES,
      'H11d: brak klucza -> fallback');
    ok(GOOD.garrisonReserveMaxCitiesFromParams({ garnizon_rezerwa_max_miast: { wartosc: '5' } }) === GOOD.GARRISON_RESERVE_MAX_CITIES
      && GOOD.garrisonReserveMaxCitiesFromParams({ garnizon_rezerwa_max_miast: { wartosc: -1 } }) === GOOD.GARRISON_RESERVE_MAX_CITIES
      && GOOD.garrisonReserveMaxCitiesFromParams(null) === GOOD.GARRISON_RESERVE_MAX_CITIES,
      'H11e: zly typ / wartosc ujemna / brak tabeli -> fallback');
    ok(GOOD.garrisonReserveMaxCitiesFromParams({ garnizon_rezerwa_max_miast: { wartosc: 0 } }) === 0,
      'H11f: wartosc 0 -> 0 (rezerwa wylaczona, nie fallback)');

    const foreign = [unit('foreign', 5, 5, { ownerId: 2, str: 0 }), unit('own', 5, 5, { str: 5 })];
    ok(GOOD.getCityGarrisonUnitIds([city], foreign, 1, strengthById).get('A') === 'own',
      'H3: jednostka innego wlasciciela ignorowana');

    const a = [strong, weak, unit('mid', 5, 5, { str: 5 })];
    const b = [...a].reverse();
    const m1 = [...GOOD.getCityGarrisonUnitIds([city], a, 1, strengthById).entries()];
    const m2 = [...GOOD.getCityGarrisonUnitIds([city], b, 1, strengthById).entries()];
    ok(JSON.stringify(m1) === JSON.stringify(m2), 'H4: determinizm wzgledem kolejnosci jednostek');
    ok(!GOOD.isGarrisonEligibleUnit(unit('s', 0, 0, { typeId: 'Zwiadowca' })), 'H2b: Zwiadowca nie kwalifikuje sie');
  }

  // ---- B: rekrutacja (peace, bez wroga) ----
  {
    const cityA = { id: 'A', ownerId: 1, q: 5, r: 5, name: 'A', population: 5 };
    const cityB = { id: 'B', ownerId: 1, q: 15, r: 5, name: 'B', population: 5 };
    const cityC = { id: 'C', ownerId: 1, q: 25, r: 5, name: 'C', population: 5 };
    const opts = { civType: 'grecy', currentTurn: 40, canEngageOwner: () => true, atWarWithCiv: false };
    const mine = [unit('b1', 15, 5), unit('c-civ', 25, 5, { typeId: 'Osadnik', category: 'osadnik' })];
    const rec = GOOD.emptyCityGarrisonRecruitIds([cityA, cityB, cityC], mine, [], opts, testData);
    ok(rec.has('A'), 'R1: puste miasto A w pokoju dostaje garnizon');
    ok(!rec.has('B'), 'R1b: miasto B z jednostka bojowa nie dostaje garnizonu');
    ok(rec.has('C'), 'R2: miasto C z samym cywilem dostaje garnizon');
  }

  // ---- C: wykluczenie z armii ----
  {
    const map = bigMap(60, 60);
    const cityX = { id: 'X', ownerId: 1, q: 30, r: 30, name: 'X', population: 6 };
    const cities = [cityX];
    // Garnizon G (najmlodszy id 'a-garn') stoi na heksie miasta; dwie rezerwy w promieniu zbiorki.
    const G = unit('a-garn', 30, 30);
    // Rezerwy po JEDNEJ stronie garnizonu: kotwica zbiorki = R1 (najmniejsza suma odleglosci),
    // wiec garnizon (na heksie miasta) musialby sie ruszyc do R1 -- to jest dyskryminujace.
    const R1 = unit('b-res', 32, 30);
    const R2 = unit('c-res', 33, 30);
    const opts = { civType: 'grecy', currentTurn: 40, canEngageOwner: () => true, atWarWithCiv: true };
    GOOD.setArmyConsolidationOverride(false);
    MUT.setArmyConsolidationOverride(false);
    const movesOf = (B) => {
      const units = [{ ...G }, { ...R1 }, { ...R2 }];
      return B.decideAITurn(1, units, cities, map, testData, opts).filter(c => c.type === 'move');
    };
    const goodMoves = movesOf(GOOD);
    const mutMoves = movesOf(MUT);
    ok(!goodMoves.some(c => c.unitId === 'a-garn'), 'C1: garnizon NIE dostaje rozkazu marszu do zbiorki');
    ok(mutMoves.some(c => c.unitId === 'a-garn'), 'C2: mutacja (bez wykluczenia garnizonu) zlamala C1 -- garnizon idzie do zbiorki');

    // C3 (r3): w WOJNIE ofensywnej garnizon nie maszeruje na wrogie miasto (petla jednostek:
    // marsz/wioski/patrol), a jednostka polowa z tego samego miasta -- tak.
    const enemyCity = { id: 'E', ownerId: 2, q: 30, r: 40, name: 'E', population: 6 };
    const warOpts = { civType: 'grecy', currentTurn: 40, canEngageOwner: () => true, atWarWithCiv: true };
    const c3Moves = GOOD.decideAITurn(1, [{ ...G }, { ...R1, q: 30, r: 30 }], [cityX, enemyCity], map, testData, warOpts)
      .filter(c => c.type === 'move');
    ok(!c3Moves.some(c => c.unitId === 'a-garn'), 'C3: garnizon NIE maszeruje na wrogie miasto w wojnie ofensywnej');
    ok(c3Moves.some(c => c.unitId === 'b-res'), 'C3b: jednostka polowa z tego samego miasta maszeruje (garnizon zostaje, reszta idzie)');

    // C4 (r3, dyskryminujacy front-merge/konsolidacja POKOJOWA ai.ts ~4322): w pokoju przy wlaczonej
    // konsolidacji garnizon miasta Y NIE maszeruje do stolicy CAP; jednostka polowa 'b-field' -- tak.
    GOOD.setArmyConsolidationOverride(true);
    const capC4 = { id: 'CAP', ownerId: 1, q: 10, r: 10, name: 'CAP', population: 6 };
    const cityYC4 = { id: 'Y', ownerId: 1, q: 30, r: 30, name: 'Y', population: 6 };
    const garnC4 = unit('a-garn', 30, 30);
    const fieldC4 = unit('b-field', 31, 35);
    const peaceOpts = { civType: 'grecy', currentTurn: 40, capitalCityId: 'CAP', canEngageOwner: () => true, atWarWithCiv: false };
    const c4Moves = GOOD.decideAITurn(1, [{ ...garnC4 }, { ...fieldC4 }], [capC4, cityYC4], bigMap(60, 60), testData, peaceOpts)
      .filter(c => c.type === 'move');
    GOOD.setArmyConsolidationOverride(false);
    ok(!c4Moves.some(c => c.unitId === 'a-garn'), 'C4: garnizon NIE maszeruje do stolicy w pokojowej konsolidacji (front-merge wykluczony)');
    ok(c4Moves.some(c => c.unitId === 'b-field'), 'C4b: jednostka polowa maszeruje do stolicy w pokojowej konsolidacji');
  }

  // ---- D (r4): mutanty filtrow garnizonu -- kazdy MUSI zlamac swoj scenariusz ----
  {
    const map = bigMap(60, 60);
    // D1/D2: kampania wodza (recruiting): garnizon zostaje, jednostka polowa idzie na zbiorke.
    const cityK = { id: 'K', ownerId: 1, q: 30, r: 30, name: 'K', population: 6 };
    const enemyK = { id: 'E', ownerId: 2, q: 50, r: 30, name: 'E', population: 6 };
    const camp = {
      targetOwnerId: 2, stage: 'recruiting', gatherTurnsCompleted: 0, rallyQ: 45, rallyR: 30,
      target: { ownerId: 2, cityId: 'E', q: 50, r: 30 }, turn: 40,
    };
    const campMoves = (B) => B.decideAITurn(1, [unit('a-garn', 30, 30), unit('b-field', 32, 30)],
      [cityK, enemyK], map, testData, { civType: 'grecy', currentTurn: 40, canEngageOwner: () => true,
        atWarWithCiv: true, aiGeneralWarCampaign: { ...camp } }).filter(c => c.type === 'move');
    const gC = campMoves(GOOD), mC = campMoves(MUT_CAMPAIGN);
    ok(!gC.some(c => c.unitId === 'a-garn') && gC.some(c => c.unitId === 'b-field'),
      `D1: kampania wodza -- garnizon zostaje, jednostka polowa idzie na zbiorke (garn=${gC.some(c => c.unitId === 'a-garn')} field=${gC.some(c => c.unitId === 'b-field')})`);
    ok(mC.some(c => c.unitId === 'a-garn'), 'D2: MUTACJA filtra garnizonu w kampanii wodza (3 miejsca) lamie D1');

    // D3/D4: miasto-panstwo (defensiveCopy) -- garnizon nie zbiera chatki (csGarrisonUnitIds).
    const mapH = bigMap(60, 60);
    mapH.hexes['33,30'].wioska = { istnieje: true, ludnosc: 1 };
    const cityS = { id: 'S', ownerId: 1, q: 30, r: 30, name: 'S', population: 6 };
    const csMoves = (B) => B.decideAITurn(1, [unit('a-garn', 30, 30), unit('b-field', 31, 30)],
      [cityS], mapH, testData, { civType: 'grecy', currentTurn: 40, defensiveCopy: true,
        canEngageOwner: () => false, atWarWithCiv: false }).filter(c => c.type === 'move');
    const gS = csMoves(GOOD), mS = csMoves(MUT_CS);
    ok(!gS.some(c => c.unitId === 'a-garn') && gS.some(c => c.unitId === 'b-field'),
      `D3: miasto-panstwo -- garnizon nie zbiera chatki, jednostka polowa tak (garn=${gS.some(c => c.unitId === 'a-garn')} field=${gS.some(c => c.unitId === 'b-field')})`);
    ok(mS.some(c => c.unitId === 'a-garn'), 'D4: MUTACJA csGarrisonUnitIds (pusty zbior) lamie D3');

    // D5: front-merge/konsolidacja pokojowa (ai.ts ~4443) -- ten sam scenariusz co C4 na mutancie.
    MUT_FM.setArmyConsolidationOverride(true);
    const capD = { id: 'CAP', ownerId: 1, q: 10, r: 10, name: 'CAP', population: 6 };
    const cityYD = { id: 'Y', ownerId: 1, q: 30, r: 30, name: 'Y', population: 6 };
    const peaceOpts = { civType: 'grecy', currentTurn: 40, capitalCityId: 'CAP', canEngageOwner: () => true, atWarWithCiv: false };
    const fmMoves = MUT_FM.decideAITurn(1, [unit('a-garn', 30, 30), unit('b-field', 31, 35)], [capD, cityYD], bigMap(60, 60), testData, peaceOpts)
      .filter(c => c.type === 'move');
    MUT_FM.setArmyConsolidationOverride(false);
    ok(fmMoves.some(c => c.unitId === 'a-garn'), 'D5: MUTACJA wykluczenia garnizonu we front-merge (ai.ts ~4443) lamie C4');
  }

  // D6/D7 (r4): planer obrony domu (planHomeWar, P2) -- garnizon (garrisonUnitIds) NIE trafia do puli
  // przydzialu; jednostka polowa -- tak. Bez garrisonUnitIds (zachowanie sprzed r4) garnizon dostaje rozkaz.
  {
    const cityH = { id: 'H', ownerId: 1, q: 30, r: 30, name: 'H', population: 6, capturedFromOwnerId: undefined };
    const inv = { id: 'inv', ownerId: 2, typeId: 'Wojownik', category: 'miecznik', q: 30, r: 34, ruch: 2, ruchLeft: 2 };
    const mine = [unit('a-garn', 30, 30), unit('b-field', 31, 30)];
    const hwInput = (extra) => ({
      ownerId: 1, currentTurn: undefined, allUnits: [...mine, inv], myUnits: mine, myCities: [cityH], allCities: [cityH],
      enemyUnits: [inv], canEngageOwner: () => true, lockedUnitIds: new Set(), isOwnTerritory: () => true,
      strengthOf: () => 1, isFieldUnit: () => true, distance: (aq, ar, bq, br) => Math.max(Math.abs(aq - bq), Math.abs(ar - br)),
      ...extra,
    });
    const withG = GOOD.planHomeWar(hwInput({ garrisonUnitIds: new Set(['a-garn']) })).orders.map(o => o.unitId);
    const noG = GOOD.planHomeWar(hwInput({})).orders.map(o => o.unitId);
    ok(!withG.includes('a-garn') && withG.includes('b-field'), `D6: planHomeWar z garnizonem -- garnizon bez rozkazu, polowa z rozkazem (${withG})`);
    ok(noG.includes('a-garn'), `D7: bez garrisonUnitIds (mutant/stare zachowanie) garnizon dostaje rozkaz -- lamie D6 (${noG})`);
    // D8: wybor typu garnizonu -- najtanszy dostepny; fallbacki = kolejne wg rankingu.
    const defs = [
      { Jednostka: 'Drogi', Typ: 'Swordsman', 'Pieniądz (koszt)': 8, 'Utrzymanie (Pieniądz/turę)': 2 },
      { Jednostka: 'Tani', Typ: 'Distance', 'Pieniądz (koszt)': 3, 'Utrzymanie (Pieniądz/turę)': 1 },
      { Jednostka: 'Siege', Typ: 'Siege', 'Pieniądz (koszt)': 1 },
      { Jednostka: 'Zwiadowca', Typ: 'Swordsman', 'Pieniądz (koszt)': 1 },
      { Jednostka: 'Super', Typ: 'Swordsman', Klasa: 'Super', 'Pieniądz (koszt)': 2 },
      { Jednostka: 'Brak', Typ: 'Swordsman', 'Pieniądz (koszt)': 4 },
    ];
    const rank = GOOD.rankGarrisonUnitIds(defs, id => id !== 'Brak', () => true);
    ok(JSON.stringify(rank) === JSON.stringify(['Tani', 'Drogi']), `D8: ranking garnizonu (bez machin/zwiadowcy-bez-wyjatku/Super/niedostepnych) = ${JSON.stringify(rank)}`);
    ok(GOOD.pickGarrisonUnitId(defs, () => false, () => true) === null, 'D8b: brak dostepnej jednostki -> null (bez polecenia)');
  }

  const total = passed + failed;
  console.log(`ai-city-garrison-min-one-test: ${passed} passed, ${failed} failed (of ${total})`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
