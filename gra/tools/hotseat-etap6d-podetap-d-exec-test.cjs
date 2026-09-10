'use strict';
/**
 * hotseat-etap6d-podetap-d-exec-test.cjs — bramka R-HOTSEAT-ETAP6D-PODETAP-D-Q1, RUNDA 2
 * (naprawa ZARZUTU 1 Evaluatora rundy 1: `ME()` jest w scenariuszu jednoosobowym żywej bramki
 * Chromium `hotseat-etap6d-podetap-d-worldendturn-live-test.cjs` dowiedlnym niezmiennikiem
 * `0` — `humanSeats.activeHumanOwnerId` nigdy nieprzełączane bez wywołania `switchActiveHuman`,
 * którego ta bramka nigdzie nie woła. Mutacja `ME()`→`0` jest tam więc behawioralnie RÓWNOWAŻNA
 * z definicji, niezależnie od jakości bramki — żaden test jednoosobowy nie może jej wykryć.
 * Decyzja orkiestratora: dodać TEN plik, wzorem już zintegrowanych
 * `hotseat-etap6d-podetap-b-exec-test.cjs` i `hotseat-etap6d-podetap-e-exec-test.cjs`).
 *
 * Metoda: ciała Bloku A i Bloku B (main.ts, wewnątrz `runWorldEndTurn`) NIE są osobnymi
 * funkcjami — są inline'owanymi blokami `if (...) { ... }` bez własnej sygnatury `function
 * NAME(...)`, więc ekstraktor funkcyjny z podetapu B/E (regex na `function NAME(`) tu nie
 * pasuje. Zamiast tego: wycięcie przez UNIKALNĄ KOTWICĘ tekstową (dosłowny fragment linii
 * otwierającej blok, zweryfikowany jako WYSTĘPUJĄCY DOKŁADNIE RAZ w main.ts) + brace-matching
 * od pierwszego `{` po kotwicy do odpowiadającego mu `}` — identyczny mechanizm brace-matchingu
 * co ekstraktor funkcyjny podetapów B/E, różni się tylko punktem startu (kotwica tekstowa
 * zamiast sygnatury `function`). Wycięty TEKST jest TEN SAM co w main.ts (assercja poniżej
 * porównuje go 1:1 z fragmentem odczytanym also przez niezależny substring po znanych liniach
 * 31238-31293 / 31850-31948, potwierdzonych świeżym `grep -n` tej rundy — zero rozjazdu).
 * `esbuild.transformSync` (loader 'ts') zdejmuje WYŁĄCZNIE adnotacje typów, `new Function(...)`
 * zamyka wynik nad mockami jako wolnymi zmiennymi (spy/dane, ŻADNEJ reimplementacji logiki,
 * którą dowodzimy) — REALNE wykonanie prawdziwego ciała, nie symulacja struktury danych.
 *
 * KLUCZOWA różnica względem rundy 1: `ME()` mock zwraca **7** (PLAYER), NIE 0 — każde miejsce
 * w wyciętym ciele, które faktycznie WOŁA `ME()` i przekazuje wynik dalej, jest przechwytywane
 * spy'em i asercjonowane wprost na wartości 7. Mutacja jest wykonywana DWA razy, DWIEMA
 * RÓŻNYMI METODAMI (reguła przeciw samooszukiwaniu z dispatchu):
 *   (a) na SKOMPILOWANYM KODZIE BLOKU, przez podmianę mocka wolnej zmiennej `ME` — mock
 *       `BROKEN_ME` (zwraca literał 0) zamiast `REAL_ME` (zwraca 7) — TEN SAM skompilowany
 *       kod bloku jest uruchamiany dwukrotnie, raz zamknięty nad każdym mockiem. To NIE jest
 *       string-replace `ME()` -> `0` w tekście źródłowym (żadna taka podmiana tekstu nie
 *       zachodzi) — metoda jest inna i, jeśli już, ostrzejsza: dowodzi, że blok FAKTYCZNIE
 *       WOŁA `ME()` i przekazuje jej wynik dalej (a nie tylko, że gdzieś w tekście stoi
 *       literał zamiast wywołania);
 *   (b) na main.ts NA DYSKU (jedno ręczne cofnięcie ME()->0 W TEKŚCIE ŹRÓDŁOWYM main.ts,
 *       jak Final Control robił w innych podetapach) — świeżo wycięty tekst PO mutacji
 *       main.ts musi dać INNY wynik niż PRZED, przez ten sam ekstraktor kotwica+brace-matching,
 *       po czym main.ts jest przywracany bajt w bajt.
 * Obie metody wymagają WPROST (funkcja `okMutation`, patrz niżej), by asercja z gałęzi
 * "PRAWDZIWY ME()" po mutacji dała `false` — brak furtki przepuszczającej `true` (naprawa
 * ZARZUTU 1 Evaluatora rundy 2: poprzednia wersja z `mutationExpected` przepuszczała pass
 * niezależnie od wyniku asercji, co czyniło te sekcje strukturalnie niezdolnymi do FAILA).
 * To jest dowód nietautologii: ME() != 0 dziś w tym teście (mock), i migracja 0->ME() w
 * main.ts FAKTYCZNIE ma efekt wykrywalny przez wykonanie (nie tylko przez grep) —
 * a mechanizm werdyktu (`okMutation`) realnie potrafi to wykrycie zgłosić jako FAIL, gdyby
 * efekt zniknął.
 *
 * Uruchamianie z katalogu gra/: node tools/hotseat-etap6d-podetap-d-exec-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const MAIN_TS_PATH = path.join(GRA, 'src', 'main.ts');

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}
// okMutation: dla asercji w sekcjach mutacyjnych. NAPRAWA ZARZUTU 1 Evaluatora rundy 2 --
// poprzednia wersja (`ok()` z furtką `mutationExpected`) dawała pass++ NIEZALEŻNIE od `cond`,
// więc żadna mutacja nie mogła nigdy sfailować bramki (dowód Evaluatora: BROKEN_ME->REAL_ME
// w kopii pliku, 41/0 mimo zerowego efektu). `okMutation` wymaga WPROST `cond === false` --
// `cond` to ta sama asercja co w gałęzi PRAWDZIWY ME() (np. "drugi arg === PLAYER"), więc po
// mutacji ME()->0 musi się ona realnie przestać zgadzać. `cond === true` (mutacja NIE miała
// efektu) jest FAIL bez wyjątku -- brak furtki w żadnym kierunku.
function okMutation(cond, msg) {
  if (cond === false) { pass++; console.log('  OK (mutacja realnie zmieniła wynik -- asercja teraz fałszywa):', msg); }
  else { fail++; console.error('  FAIL (mutacja NIE zmieniła wyniku -- test byłby tautologiczny):', msg); }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ekstraktor: unikalna kotwica tekstowa + brace-matching (analogiczny mechanizm co
// `extractFullFunctionSource` w podetapach B/E, punkt startu to dosłowny tekst kotwicy
// zamiast `function NAME(`).
// ─────────────────────────────────────────────────────────────────────────────
function extractAnchoredBlock(src, anchorLiteral) {
  const firstIdx = src.indexOf(anchorLiteral);
  if (firstIdx < 0) throw new Error(`Kotwica nie znaleziona: ${anchorLiteral}`);
  const secondIdx = src.indexOf(anchorLiteral, firstIdx + 1);
  if (secondIdx >= 0) throw new Error(`Kotwica NIE jest unikalna (druga wystąpienie na ${secondIdx}): ${anchorLiteral}`);
  const braceStart = src.indexOf('{', firstIdx + anchorLiteral.length - 1);
  if (braceStart < 0) throw new Error(`Brak '{' po kotwicy: ${anchorLiteral}`);
  let depth = 0;
  for (let i = braceStart; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(firstIdx, i + 1); }
  }
  throw new Error(`Brace-matching nie domknięty dla kotwicy: ${anchorLiteral}`);
}

function compileAnchoredBlock(src, anchorLiteral, freeVarNames, mocks) {
  const tsSrc = extractAnchoredBlock(src, anchorLiteral);
  const { code } = esbuild.transformSync(tsSrc, { loader: 'ts', format: 'cjs', target: 'node18' });
  const factory = new Function(...freeVarNames, code);
  const args = freeVarNames.map(v => mocks[v]);
  return { run: () => factory(...args), tsSrc, code };
}

console.log('hotseat-etap6d-podetap-d-exec-test (R-HOTSEAT-ETAP6D-PODETAP-D-Q1, runda 2)\n');

const mainSrc = fs.readFileSync(MAIN_TS_PATH, 'utf8');

const PLAYER = 7; // celowo NIE 0 -- ME() musi realnie różnić się od literału 0 w tym teście
const WRONG = 0;  // wartość mutacji ME()->WRONG (dokładnie to, co migracja tego podetapu usuwa)
function makeME(id) { return () => id; }
const REAL_ME = makeME(PLAYER);
const BROKEN_ME = makeME(WRONG);

const ANCHOR_A = "if (startOi === 0 && _menuCityStateDifficultyVsPlayer === 'hard') {";
// R-HOTSEAT-DYPLO-KONTAKT-PER-FOTEL-Q1: kotwica zaktualizowana -- `diplomaticallyDiscoveredOwners`
// (Set) -> `diplomaticallyDiscoveredOwnersSet()` (akcesor per-fotel main.ts, domyślny ME()).
const ANCHOR_B = 'if (diplomaticallyDiscoveredOwnersSet().has(ownerId)) {';

// Niezależna kontrola granic: substring po ZNANYCH liniach (potwierdzonych świeżym `grep -n`
// PO integracji R-HOTSEAT-DYPLO-KONTAKT-PER-FOTEL-Q1 do main: Blok A = 31620-31675, Blok B =
// 32232-32330 -- przesunięcie +32 linii względem numerów zapisanych podczas rundy Obrony tego
// tematu (Obrona dopisała nowy hak `saveLoadLegacyDiplomaticFormat` WCZEŚNIEJ w main.ts, ok.
// linia 22287, przesuwając wszystko poniżej o +32 linii -- orkiestrator poprawił te dwie stałe
// przy integracji, zweryfikowane świeżym przeliczeniem extractAnchoredBlock), porównany 1:1
// z wycięciem kotwica+brace-matching -- zero rozjazdu miedzy dwoma niezależnymi metodami
// lokalizacji.
{
  const lines = mainSrc.split('\n');
  // slice po liniach zachowuje wcięcie linii otwierającej (kotwica zaczyna się dopiero od
  // "if", bez wcięcia) -- porównanie od pierwszego "if (" w obu wycięciach, reszta identyczna.
  const blockALinesRaw = lines.slice(31620 - 1, 31675).join('\n');
  const blockBLinesRaw = lines.slice(32232 - 1, 32330).join('\n');
  const blockALines = blockALinesRaw.slice(blockALinesRaw.indexOf('if ('));
  const blockBLines = blockBLinesRaw.slice(blockBLinesRaw.indexOf('if ('));
  const blockAAnchor = extractAnchoredBlock(mainSrc, ANCHOR_A);
  const blockBAnchor = extractAnchoredBlock(mainSrc, ANCHOR_B);
  ok(blockALines === blockAAnchor, 'Blok A: substring po liniach 31620-31675 === wycięcie kotwica+brace-matching (zero rozjazdu)');
  ok(blockBLines === blockBAnchor, 'Blok B: substring po liniach 32232-32330 === wycięcie kotwica+brace-matching (zero rozjazdu)');
  const occA = (blockAAnchor.match(/ME\(\)/g) || []).length;
  const occB = (blockBAnchor.match(/ME\(\)/g) || []).length;
  ok(occA === 13, `Blok A: dokładnie 13 wystąpień ME() (potwierdzone rundą 2 Evaluatora/Obrony), otrzymano ${occA}`);
  ok(occB === 21, `Blok B: dokładnie 21 wystąpień ME() (korekta liczby z rundy 1: 20->21), otrzymano ${occB}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOK A -- klaster miast-państw wypowiada wymuszoną wojnę graczowi (DOW klastra PM na
// gracza). Free vars = wszystkie identyfikatory z zewnątrz, do których blok się odwołuje.
// ─────────────────────────────────────────────────────────────────────────────
function runBlockA(src, ME, calls) {
  const csA = 101; // klaster PM: odkryty, kopia-typu, kwalifikuje się -> DOW
  const csB = 102; // klaster PM: NIEODKRYTY -> pominięty (filtr diplomaticallyDiscoveredOwners)
  const freeVars = {
    startOi: 0,
    _menuCityStateDifficultyVsPlayer: 'hard',
    aiOwnerList: [csA, csB],
    eliminatedOwners: new Set(),
    typCityCopyOwners: new Set([csA, csB]),
    isOwnerPlayerSameCivType: () => true,
    // R-HOTSEAT-DYPLO-KONTAKT-PER-FOTEL-Q1: akcesor per-fotel zamiast płaskiego Seta.
    diplomaticallyDiscoveredOwnersSet: () => new Set([csA]), // csB świadomie NIE odkryty
    getDiploRelation: (a, b) => { calls.getDiploRelation.push([a, b]); return { status: 'pokoj' }; },
    activeDeals: [],
    dealInvolvesOwners: (d, a, b) => { calls.dealInvolvesOwners.push([a, b]); return false; },
    normalizeTreatyKind: (r) => r,
    RodzajTraktatu: { UmowaSzlakow: 'szlaki', UmowaWymiany: 'wymiana', UmowaHandlowa: 'handel', PaktNieagresji: 'pakt' },
    hasActiveResourceTradeDealForPair: (a, b) => { calls.hasActiveResourceTradeDealForPair.push([a, b]); return false; },
    isPeaceLockedBetween: (a, b) => { calls.isPeaceLockedBetween.push([a, b]); return false; },
    hasTreaty: (deals, a, b, kind) => { calls.hasTreaty.push([a, b]); return false; },
    // resolveClusterCityStateWarOnPlayer zwraca WSZYSTKICH przekazanych członków jako DOW --
    // spy (dane), nie reimplementacja logiki rzutu 60% (ta logika NIE jest w Bloku A -- Blok A
    // tylko WOŁA tę funkcję i konsumuje wynik).
    resolveClusterCityStateWarOnPlayer: (difficulty, turn, members) => {
      calls.resolveClusterCityStateWarOnPlayerMembers = members;
      return members.map(m => m.ownerId);
    },
    turn: 5,
    chargeWarDeclarationCredibility: (a, b) => { calls.chargeWarDeclarationCredibility.push([a, b]); },
    breakTreatiesOnWar: (a, b, flag) => { calls.breakTreatiesOnWar.push([a, b]); },
    applyAllianceObligationsOnWar: (a, b) => { calls.applyAllianceObligationsOnWar.push([a, b]); },
    applyDiploEventTracked: (a, b, rel, kind) => { calls.applyDiploEventTracked.push([a, b]); return { status: 'wojna' }; },
    setDiploRelation: (a, b, rel) => { calls.setDiploRelation.push([a, b]); },
    pruneTributeNegotiationsBetween: (a, b) => { calls.pruneTributeNegotiationsBetween.push([a, b]); },
    recordWarDeclarationEvent: (a, b) => { calls.recordWarDeclarationEvent.push([a, b]); },
    showHintMessage: () => {},
    ownerDiploLabel: (id) => 'PM-' + id,
    isDiplomacyPanelOpen: () => false,
    updateDiplomacyPanel: () => {},
    console,
    Math,
    ME,
  };
  const freeVarNames = Object.keys(freeVars);
  const { run } = compileAnchoredBlock(src, ANCHOR_A, freeVarNames, freeVars);
  run();
}

console.log('BLOK A — DOW klastra PM na gracza — realne wykonanie\n');
{
  const calls = {
    getDiploRelation: [], dealInvolvesOwners: [], hasActiveResourceTradeDealForPair: [],
    isPeaceLockedBetween: [], hasTreaty: [], chargeWarDeclarationCredibility: [],
    breakTreatiesOnWar: [], applyAllianceObligationsOnWar: [], applyDiploEventTracked: [],
    setDiploRelation: [], pruneTributeNegotiationsBetween: [], recordWarDeclarationEvent: [],
  };
  runBlockA(mainSrc, REAL_ME, calls);

  ok(!!calls.resolveClusterCityStateWarOnPlayerMembers
    && calls.resolveClusterCityStateWarOnPlayerMembers.length === 1
    && calls.resolveClusterCityStateWarOnPlayerMembers[0].ownerId === 101,
    `PRAWDZIWY ME()=${PLAYER}: filtr diplomaticallyDiscoveredOwners poprawnie ograniczył klaster do csA=101 (csB=102 nieodkryty pominięty), otrzymano ${JSON.stringify(calls.resolveClusterCityStateWarOnPlayerMembers)}`);
  ok(calls.getDiploRelation.every(([, b]) => b === PLAYER),
    `PRAWDZIWY ME(): getDiploRelation(csOwnerId, ME()=${PLAYER}) -- WSZYSTKIE ${calls.getDiploRelation.length} wywołania z drugim argumentem = ${PLAYER}, otrzymano ${JSON.stringify(calls.getDiploRelation)}`);
  ok(calls.dealInvolvesOwners.every(([a]) => a === PLAYER),
    `PRAWDZIWY ME(): dealInvolvesOwners(d, ME()=${PLAYER}, csOwnerId) -- pierwszy arg = ${PLAYER}, otrzymano ${JSON.stringify(calls.dealInvolvesOwners)}`);
  ok(calls.hasActiveResourceTradeDealForPair.every(([a]) => a === PLAYER),
    `PRAWDZIWY ME(): hasActiveResourceTradeDealForPair(ME()=${PLAYER}, csOwnerId), otrzymano ${JSON.stringify(calls.hasActiveResourceTradeDealForPair)}`);
  ok(calls.isPeaceLockedBetween.every(([, b]) => b === PLAYER),
    `PRAWDZIWY ME(): isPeaceLockedBetween(csOwnerId, ME()=${PLAYER}), otrzymano ${JSON.stringify(calls.isPeaceLockedBetween)}`);
  ok(calls.hasTreaty.every(([, b]) => b === PLAYER),
    `PRAWDZIWY ME(): hasTreaty(..., csOwnerId, ME()=${PLAYER}, ...), otrzymano ${JSON.stringify(calls.hasTreaty)}`);
  ok(calls.chargeWarDeclarationCredibility.length === 1 && calls.chargeWarDeclarationCredibility[0][1] === PLAYER,
    `PRAWDZIWY ME(): chargeWarDeclarationCredibility(csOwnerId, ME()=${PLAYER}), otrzymano ${JSON.stringify(calls.chargeWarDeclarationCredibility)}`);
  ok(calls.breakTreatiesOnWar.length === 1 && calls.breakTreatiesOnWar[0][1] === PLAYER,
    `PRAWDZIWY ME(): breakTreatiesOnWar(csOwnerId, ME()=${PLAYER}, false), otrzymano ${JSON.stringify(calls.breakTreatiesOnWar)}`);
  ok(calls.applyAllianceObligationsOnWar.length === 1 && calls.applyAllianceObligationsOnWar[0][1] === PLAYER,
    `PRAWDZIWY ME(): applyAllianceObligationsOnWar(csOwnerId, ME()=${PLAYER}), otrzymano ${JSON.stringify(calls.applyAllianceObligationsOnWar)}`);
  ok(calls.applyDiploEventTracked.length === 1 && calls.applyDiploEventTracked[0][1] === PLAYER,
    `PRAWDZIWY ME(): applyDiploEventTracked(csOwnerId, ME()=${PLAYER}, ...), otrzymano ${JSON.stringify(calls.applyDiploEventTracked)}`);
  ok(calls.setDiploRelation.length === 1 && calls.setDiploRelation[0][1] === PLAYER,
    `PRAWDZIWY ME(): setDiploRelation(csOwnerId, ME()=${PLAYER}, newRel), otrzymano ${JSON.stringify(calls.setDiploRelation)}`);
  ok(calls.pruneTributeNegotiationsBetween.length === 1 && calls.pruneTributeNegotiationsBetween[0][1] === PLAYER,
    `PRAWDZIWY ME(): pruneTributeNegotiationsBetween(csOwnerId, ME()=${PLAYER}), otrzymano ${JSON.stringify(calls.pruneTributeNegotiationsBetween)}`);
  ok(calls.recordWarDeclarationEvent.length === 1 && calls.recordWarDeclarationEvent[0][1] === PLAYER,
    `PRAWDZIWY ME(): recordWarDeclarationEvent(csOwnerId, ME()=${PLAYER}), otrzymano ${JSON.stringify(calls.recordWarDeclarationEvent)}`);

  // MUTACJA -- na WYCIĘTYM TEKŚCIE: ME()->0 (dispatch: "ME()->literal zly owner" tu dosłownie
  // literał 0, dokładnie to co migracja tego podetapu usuwała). Reguła przeciw
  // samooszukiwaniu: musi się czerwienić, inaczej assertion powyżej jest bezwartościowy.
  const brokenCalls = {
    getDiploRelation: [], dealInvolvesOwners: [], hasActiveResourceTradeDealForPair: [],
    isPeaceLockedBetween: [], hasTreaty: [], chargeWarDeclarationCredibility: [],
    breakTreatiesOnWar: [], applyAllianceObligationsOnWar: [], applyDiploEventTracked: [],
    setDiploRelation: [], pruneTributeNegotiationsBetween: [], recordWarDeclarationEvent: [],
  };
  runBlockA(mainSrc, BROKEN_ME, brokenCalls);
  okMutation(brokenCalls.getDiploRelation.every(([, b]) => b === PLAYER),
    `MUTACJA ME()=>${WRONG}: getDiploRelation drugi arg POWINIEN być ${WRONG}, nie ${PLAYER} -- czerwieni się poprawnie, otrzymano ${JSON.stringify(brokenCalls.getDiploRelation)}`);
  okMutation(brokenCalls.setDiploRelation.length === 1 && brokenCalls.setDiploRelation[0][1] === PLAYER,
    `MUTACJA ME()=>${WRONG}: setDiploRelation drugi arg POWINIEN być ${WRONG}, nie ${PLAYER} -- czerwieni się poprawnie, otrzymano ${JSON.stringify(brokenCalls.setDiploRelation)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOK B -- per-AI-owner tick dyplomacji (odpowiednik runDiplomacyTurnTick, ale OSOBNY kod
// wewnątrz runWorldEndTurn). Free vars = wszystkie identyfikatory z zewnątrz.
// ─────────────────────────────────────────────────────────────────────────────
function runBlockB(src, ME, calls) {
  const AI = 4;
  const activeDeals = [{ strony: [PLAYER, AI], rodzaj: 'szlaki' }];
  const freeVars = {
    ownerId: AI,
    potAI: 10, // objectivePowerByOwner.get(ownerId)?.power -- zadeklarowane TUŻ PRZED Blokiem B
    // R-HOTSEAT-DYPLO-KONTAKT-PER-FOTEL-Q1: akcesory per-fotel zamiast płaskich Setów.
    diplomaticallyDiscoveredOwnersSet: () => new Set([AI]),
    militaryRatioFromArmyM: (a, b) => { calls.militaryRatioFromArmyMArgs = [a, b]; return 1; },
    sumArmyMForOwner: (id) => (id === ME() ? 50 : 30),
    getDiploRelation: (a, b) => { calls.getDiploRelation.push([a, b]); return { status: 'pokoj' }; },
    turn: 5,
    player: { civType: 'rzymianie' },
    aiTyp: 'grecy',
    aiDiplomacyStance: (aiStub, humanStub) => { calls.aiDiplomacyStanceHumanStub = humanStub; return undefined; },
    objectivePowerByOwner: new Map([[AI, { power: 10 }], [PLAYER, { power: 20 }]]),
    computeRespekt: () => 0.5,
    activeDeals,
    dealInvolvesOwners: (d, a, b) => { calls.dealInvolvesOwners.push([a, b]); return d.strony.includes(a) && d.strony.includes(b); },
    normalizeTreatyKind: (r) => r,
    RodzajTraktatu: { UmowaSzlakow: 'szlaki', PaktNieagresji: 'pakt' },
    resolvePokojTrustTier: (deals, a, b) => { calls.resolvePokojTrustTierArgs = [a, b]; return 'niski'; },
    diplomaticContactEstablishedSet: () => new Set([AI]),
    sameCultureCircle: (a, b) => { calls.sameCultureCircleArgs = [a, b]; return true; },
    civKeyForOwner: (id) => (id === ME() ? 'rzymianie' : 'grecy'),
    ownerReligionForOwnerId: (id) => { calls.ownerReligionForOwnerIdArgs.push(id); return 'politeizm'; },
    cities: [{ ownerId: ME() }, { ownerId: ME() }, { ownerId: ME() }, { ownerId: AI }, { ownerId: AI }, { ownerId: AI }],
    ownersShareLandBorderLive: (a, b) => { calls.ownersShareLandBorderLiveArgs = [a, b]; return false; },
    getWiarygodnosc: (id) => { calls.getWiarygodnoscArgs.push(id); return 50; },
    tickDiplomacy: (rel) => rel,
    citiesHaveTradeConnection: () => false,
    map: {}, cityBuilt: new Map(), DEFAULT_TRADE_ROUTE_PARAMS: {}, buildAllTerritoryNodes: () => [],
    resolveArchetypeTrade: () => 0.5,
    ARCHETYPE_TRADE: {},
    hasActiveResourceTradeDealForPair: (a, b) => { calls.hasActiveResourceTradeDealForPair.push([a, b]); return false; },
    canAiProposeResourceTrade: () => false,
    aiResourceTradeLastProposalTurn: new Map(),
    pickResourceTradeRelOffer: () => null,
    relacjeDip: [],
    aiOneShotGiftLastTurn: new Map(),
    aiTradeAgreementLastProposalTurn: new Map(),
    AI_RESOURCE_TRADE_DEFAULT_TURNS: 10,
    hasTreaty: (deals, a, b) => { calls.hasTreaty.push([a, b]); return false; },
    contactedOwners: new Set([AI]),
    aiAudienceLastRequestTurn: new Map(),
    isPeaceLockedBetween: (a, b) => { calls.isPeaceLockedBetween.push([a, b]); return false; },
    setDiploRelation: (a, b, rel) => { calls.setDiploRelation.push([a, b]); },
    ME,
  };
  const freeVarNames = Object.keys(freeVars);
  const { run } = compileAnchoredBlock(src, ANCHOR_B, freeVarNames, freeVars);
  run();
  return freeVars.relacjeDip;
}

console.log('\nBLOK B — per-AI-owner tick dyplomacji — realne wykonanie\n');
{
  const calls = {
    getDiploRelation: [], dealInvolvesOwners: [], hasActiveResourceTradeDealForPair: [],
    isPeaceLockedBetween: [], hasTreaty: [], ownerReligionForOwnerIdArgs: [], getWiarygodnoscArgs: [], setDiploRelation: [],
  };
  const relacjeDip = runBlockB(mainSrc, REAL_ME, calls);

  ok(relacjeDip.length === 1 && relacjeDip[0].partnerId === String(PLAYER),
    `PRAWDZIWY ME()=${PLAYER}: relacjeDip.push({partnerId: String(ME())}) -- partnerId="${PLAYER}", otrzymano ${JSON.stringify(relacjeDip.map(r => r.partnerId))}`);
  ok(calls.militaryRatioFromArmyMArgs && calls.militaryRatioFromArmyMArgs[1] === 50,
    `PRAWDZIWY ME(): sumArmyMForOwner(ME()) drugi arg militaryRatioFromArmyM wynikł z ME()=${PLAYER} (mock zwraca 50 dla ME()), otrzymano ${JSON.stringify(calls.militaryRatioFromArmyMArgs)}`);
  ok(calls.getDiploRelation.length === 1 && calls.getDiploRelation[0][0] === PLAYER,
    `PRAWDZIWY ME(): getDiploRelation(ME()=${PLAYER}, ownerId), otrzymano ${JSON.stringify(calls.getDiploRelation)}`);
  ok(!!calls.aiDiplomacyStanceHumanStub && calls.aiDiplomacyStanceHumanStub.ownerId === PLAYER,
    `PRAWDZIWY ME(): humanStub={ownerId: ME()=${PLAYER}}, otrzymano ${JSON.stringify(calls.aiDiplomacyStanceHumanStub)}`);
  ok(calls.dealInvolvesOwners.every(([a]) => a === PLAYER),
    `PRAWDZIWY ME(): dealInvolvesOwners(d, ME()=${PLAYER}, ownerId), otrzymano ${JSON.stringify(calls.dealInvolvesOwners)}`);
  ok(calls.resolvePokojTrustTierArgs && calls.resolvePokojTrustTierArgs[0] === PLAYER,
    `PRAWDZIWY ME(): resolvePokojTrustTier(deals, ME()=${PLAYER}, ownerId, ...), otrzymano ${JSON.stringify(calls.resolvePokojTrustTierArgs)}`);
  ok(calls.sameCultureCircleArgs && calls.sameCultureCircleArgs[0] === 'rzymianie',
    `PRAWDZIWY ME(): sameCultureCircle(civKeyForOwner(ME()), ...) -- civKeyForOwner(ME()=${PLAYER})="rzymianie", otrzymano ${JSON.stringify(calls.sameCultureCircleArgs)}`);
  ok(calls.ownerReligionForOwnerIdArgs[0] === PLAYER,
    `PRAWDZIWY ME(): pierwsze wywołanie ownerReligionForOwnerId(ME()=${PLAYER}), otrzymano ${JSON.stringify(calls.ownerReligionForOwnerIdArgs)}`);
  ok(calls.ownersShareLandBorderLiveArgs && calls.ownersShareLandBorderLiveArgs[1] === PLAYER,
    `PRAWDZIWY ME(): ownersShareLandBorderLive(ownerId, ME()=${PLAYER}), otrzymano ${JSON.stringify(calls.ownersShareLandBorderLiveArgs)}`);
  ok(calls.getWiarygodnoscArgs[0] === PLAYER,
    `PRAWDZIWY ME(): getWiarygodnosc(ME()=${PLAYER}), otrzymano ${JSON.stringify(calls.getWiarygodnoscArgs)}`);
  ok(calls.hasActiveResourceTradeDealForPair.every(([a]) => a === PLAYER),
    `PRAWDZIWY ME(): hasActiveResourceTradeDealForPair(ME()=${PLAYER}, ownerId) x${calls.hasActiveResourceTradeDealForPair.length}, otrzymano ${JSON.stringify(calls.hasActiveResourceTradeDealForPair)}`);
  ok(calls.hasTreaty.every(([, b]) => b === PLAYER),
    `PRAWDZIWY ME(): hasTreaty(deals, ownerId, ME()=${PLAYER}, ...), otrzymano ${JSON.stringify(calls.hasTreaty)}`);
  ok(calls.isPeaceLockedBetween.every(([, b]) => b === PLAYER),
    `PRAWDZIWY ME(): isPeaceLockedBetween(ownerId, ME()=${PLAYER}), otrzymano ${JSON.stringify(calls.isPeaceLockedBetween)}`);

  // MUTACJA na WYCIĘTYM TEKŚCIE: ME()->0.
  const brokenCalls = {
    getDiploRelation: [], dealInvolvesOwners: [], hasActiveResourceTradeDealForPair: [],
    isPeaceLockedBetween: [], hasTreaty: [], ownerReligionForOwnerIdArgs: [], getWiarygodnoscArgs: [], setDiploRelation: [],
  };
  const brokenRelacjeDip = runBlockB(mainSrc, BROKEN_ME, brokenCalls);
  okMutation(brokenRelacjeDip.length === 1 && brokenRelacjeDip[0].partnerId === String(PLAYER),
    `MUTACJA ME()=>${WRONG}: partnerId POWINIEN być "${WRONG}", nie "${PLAYER}" -- czerwieni się poprawnie, otrzymano ${JSON.stringify(brokenRelacjeDip.map(r => r.partnerId))}`);
  okMutation(brokenCalls.getDiploRelation.length === 1 && brokenCalls.getDiploRelation[0][0] === PLAYER,
    `MUTACJA ME()=>${WRONG}: getDiploRelation pierwszy arg POWINIEN być ${WRONG}, nie ${PLAYER} -- czerwieni się poprawnie, otrzymano ${JSON.stringify(brokenCalls.getDiploRelation)}`);
  okMutation(brokenCalls.getWiarygodnoscArgs[0] === PLAYER,
    `MUTACJA ME()=>${WRONG}: getWiarygodnosc arg POWINIEN być ${WRONG}, nie ${PLAYER} -- czerwieni się poprawnie, otrzymano ${JSON.stringify(brokenCalls.getWiarygodnoscArgs)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MUTACJA NA main.ts NA DYSKU (dispatch, "REGUŁA PRZECIW SAMOOSZUKIWANIU" §c): jedno ręczne
// cofnięcie ME()->0 W PLIKU (nie tylko w wyciętym tekście w pamięci), przebudowanie CAŁEJ
// bramki (świeże wczytanie + świeże wycięcie tym samym ekstraktorem) na zmutowanym pliku,
// potwierdzenie że test faktycznie się czerwieni, po czym main.ts jest przywracany bajt w
// bajt (weryfikacja przez porównanie z oryginałem odczytanym na starcie).
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nMUTACJA NA DYSKU (main.ts) -- Blok A i Blok B, jedno cofnięcie ME()->0 każdy\n');
{
  const ORIG_A_NEEDLE = 'const relToPlayer = getDiploRelation(csOwnerId, ME());';
  const MUT_A = 'const relToPlayer = getDiploRelation(csOwnerId, 0);';
  // Wcięcie (16 spacji) w needle odróżnia to wystąpienie Bloku B (main.ts:31855) od
  // strukturalnie identycznej linii `const rel = getDiploRelation(ME(), ownerId);` w
  // main.ts:20391 (10 spacji, inna funkcja/kontekst, poza zakresem tego podetapu).
  const ORIG_B_NEEDLE = '                const rel = getDiploRelation(ME(), ownerId);';
  const MUT_B = '                const rel = getDiploRelation(0, ownerId);';

  ok(mainSrc.split(ORIG_A_NEEDLE).length - 1 === 1, `Blok A: needle mutacyjny występuje dokładnie 1x w main.ts (bezpieczne cofnięcie)`);
  ok(mainSrc.split(ORIG_B_NEEDLE).length - 1 === 1, `Blok B: needle mutacyjny występuje dokładnie 1x w main.ts (bezpieczne cofnięcie)`);

  // --- Blok A: cofnięcie na dysku ---
  {
    const mutatedSrc = mainSrc.replace(ORIG_A_NEEDLE, MUT_A);
    fs.writeFileSync(MAIN_TS_PATH, mutatedSrc, 'utf8');
    const freshSrc = fs.readFileSync(MAIN_TS_PATH, 'utf8');
    const calls = { getDiploRelation: [], dealInvolvesOwners: [], hasActiveResourceTradeDealForPair: [], isPeaceLockedBetween: [], hasTreaty: [], chargeWarDeclarationCredibility: [], breakTreatiesOnWar: [], applyAllianceObligationsOnWar: [], applyDiploEventTracked: [], setDiploRelation: [], pruneTributeNegotiationsBetween: [], recordWarDeclarationEvent: [] };
    runBlockA(freshSrc, REAL_ME, calls);
    okMutation(calls.getDiploRelation[0][1] === PLAYER, `MUTACJA main.ts NA DYSKU (Blok A, getDiploRelation(csOwnerId, ME()) -> (csOwnerId, 0)): świeżo wycięty tekst przez ten sam ekstraktor daje getDiploRelation drugi arg=0 (literał), NIE ${PLAYER} (ME()) -- czerwieni się poprawnie, otrzymano ${JSON.stringify(calls.getDiploRelation)}`);
    fs.writeFileSync(MAIN_TS_PATH, mainSrc, 'utf8');
    const restored = fs.readFileSync(MAIN_TS_PATH, 'utf8');
    ok(restored === mainSrc, 'main.ts PRZYWRÓCONY bajt w bajt po mutacji Bloku A (weryfikacja przez porównanie stringów)');
  }

  // --- Blok B: cofnięcie na dysku ---
  {
    const mutatedSrc = mainSrc.replace(ORIG_B_NEEDLE, MUT_B);
    fs.writeFileSync(MAIN_TS_PATH, mutatedSrc, 'utf8');
    const freshSrc = fs.readFileSync(MAIN_TS_PATH, 'utf8');
    const calls = { getDiploRelation: [], dealInvolvesOwners: [], hasActiveResourceTradeDealForPair: [], isPeaceLockedBetween: [], hasTreaty: [], ownerReligionForOwnerIdArgs: [], getWiarygodnoscArgs: [], setDiploRelation: [] };
    const relacjeDip = runBlockB(freshSrc, REAL_ME, calls);
    okMutation(calls.getDiploRelation[0][0] === PLAYER, `MUTACJA main.ts NA DYSKU (Blok B, getDiploRelation(ME(), ownerId) -> (0, ownerId)): świeżo wycięty tekst daje getDiploRelation pierwszy arg=0 (literał), NIE ${PLAYER} (ME()) -- czerwieni się poprawnie, otrzymano ${JSON.stringify(calls.getDiploRelation)}`);
    fs.writeFileSync(MAIN_TS_PATH, mainSrc, 'utf8');
    const restored = fs.readFileSync(MAIN_TS_PATH, 'utf8');
    ok(restored === mainSrc, 'main.ts PRZYWRÓCONY bajt w bajt po mutacji Bloku B (weryfikacja przez porównanie stringów)');
  }
}

console.log(`\nhotseat-etap6d-podetap-d-exec-test: ${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
