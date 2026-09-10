'use strict';
/**
 * hotseat-etap6d-podetap-b-exec-test.cjs — bramka R-HOTSEAT-ETAP6D-PODETAP-B-Q1.
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU (dispatch): sprawdzone w Podetapie E rundzie 1 — bramka
 * regexem na TEKŚCIE main.ts (bez wykonania) NIE dowodzi niczego. Ten plik WYKONUJE naprawdę
 * ciała 7 funkcji tego tematu, które NIE mają bezpośredniej, pojedynczo-klikalnej ścieżki UI
 * (dispatch dopuszcza dla nich test jednostkowy z realnym wykonaniem zamiast/obok Chromium):
 *   `playerFormalRelationLabel`, `foreignCivsMissingTradeTreatyForCity`, `collectDiploChipCounts`,
 *   `enqueueNegotiationFromAiCmd`, `applyBorderMarchPenaltiesEndTurn`, `currentVisibleForOwner`,
 *   `peacefulArchetypeForOwner`.
 * Pozostałe 6 funkcji z allowlisty tego tematu (`buildPlayerDiploRelations`,
 * `buildDiploPairSummaryData`, `buildAudienceActions`, `buildPendingNegotiationRows`,
 * `buildEmpireDetailSnap`) mają żywy dowód Chromium w
 * `hotseat-etap6d-podetap-b-live-test.cjs` (panel dyplomacji, audiencja, panel imperium/Miasta).
 * `relationColorFn`/`unitRingStanceForPlayer` były już zmigrowane wcześniej (R-HOTSEAT-ETAP6E-
 * RENDER-Q1, commit b51d6c50) — zero zmian w tej rundzie, nie wymaga nowej bramki.
 * `cityMapOutlineKindForOwner` ma ZERO literałów `0` już dziś (używa `isMeSafe`/`meNow()` z
 * udokumentowanego powodu TDZ przy boot -- main.ts komentarz przy L~17932/L~10470) — świadomie
 * NIETKNIĘTA, patrz uzasadnienie w raporcie Operatora.
 *
 * Metoda identyczna jak `hotseat-etap6d-podetap-e-exec-test.cjs`: brace-matched wycięcie ciała
 * funkcji WPROST ze źródła main.ts, `esbuild.transformSync` (zdejmuje wyłącznie adnotacje TS),
 * `new Function` zamykająca wynik nad mockami jako wolnymi zmiennymi — realne wykonanie
 * PRAWDZIWEGO ciała, nie reimplementacja. Każdy blok: najpierw PRAWDZIWE `isMe`/`ME` (musi dać
 * oczekiwany wynik), potem WSTRZYKNIĘTA MUTACJA (musi się zaczerwienić, inaczej assertion jest
 * bezwartościowy). `PLAYER=7` (celowo NIE 0) w każdym teście, żeby złapać każdy pozostały
 * zaszyty literał `0`, który udawałby poprawne zachowanie tylko przypadkiem.
 *
 * Uruchamianie z katalogu gra/: node tools/hotseat-etap6d-podetap-b-exec-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');

let pass = 0;
let fail = 0;
let mutationExpected = false;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else if (mutationExpected) { pass++; console.log('  OK (mutacja poprawnie czerwieni):', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}

/** Identyczny brace-matched ekstraktor co hotseat-etap6d-podetap-e-exec-test.cjs. */
function extractFullFunctionSource(src, name) {
  const sigRe = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = sigRe.exec(src);
  if (!m) return null;
  const parenStart = src.indexOf('(', m.index);
  if (parenStart < 0) return null;
  let pdepth = 0;
  let parenEnd = -1;
  for (let i = parenStart; i < src.length; i++) {
    if (src[i] === '(') pdepth++;
    else if (src[i] === ')') { pdepth--; if (pdepth === 0) { parenEnd = i; break; } }
  }
  if (parenEnd < 0) return null;
  let braceStart = -1;
  let searchFrom = parenEnd;
  for (;;) {
    const idx = src.indexOf('{', searchFrom);
    if (idx < 0) return null;
    let d = 0;
    let close = -1;
    for (let i = idx; i < src.length; i++) {
      if (src[i] === '{') d++;
      else if (src[i] === '}') { d--; if (d === 0) { close = i; break; } }
    }
    if (close < 0) return null;
    if (src.slice(idx, close + 1).includes('\n')) { braceStart = idx; break; }
    searchFrom = close + 1;
  }
  if (braceStart < 0) return null;
  let depth = 0;
  for (let i = braceStart; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(m.index, i + 1); }
  }
  return null;
}

function compileRealFunction(name, freeVarNames, mocks) {
  const tsSrc = extractFullFunctionSource(mainSrc, name);
  if (!tsSrc) throw new Error(`Nie znaleziono ${name} w main.ts`);
  const { code } = esbuild.transformSync(tsSrc, { loader: 'ts', format: 'cjs', target: 'node18' });
  const factory = new Function(...freeVarNames, `${code}\nreturn ${name};`);
  const args = freeVarNames.map(v => mocks[v]);
  return factory(...args);
}

console.log('hotseat-etap6d-podetap-b-exec-test (R-HOTSEAT-ETAP6D-PODETAP-B-Q1)\n');

const PLAYER = 7; // celowo NIE 0 -- łapie każdy pozostały zaszyty literał `0`
const WRONG = 99; // wartość mutacji ME() -- też celowo NIE 0
function makeIsMe(id) { return (ownerId) => ownerId === id; }
function makeME(id) { return () => id; }
const BROKEN_isMe = () => false;
const BROKEN_ME = () => WRONG;

// ─────────────────────────────────────────────────────────────────────────────
// 1. playerFormalRelationLabel
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. playerFormalRelationLabel — realne wykonanie\n');
{
  const activeDeals = [{ strony: [PLAYER, 4], rodzaj: 'pakt' }];
  function run(isMe, ME) {
    const captured = {};
    const mocks = {
      isBarbarian: () => false,
      activeDeals,
      normalizeTreatyKind: (r) => r,
      RodzajTraktatu: { PaktNieagresji: 'pakt', UmowaSzlakow: 'szlaki' },
      getDiploRelation: (a, b) => { captured.relArgs = [a, b]; return { status: 'pokoj' }; },
      resolveFormalDiplomaticStatus: (ctx) => { captured.ctx = ctx; return { label: 'X' }; },
      allianceFormalKindBetween: (deals, a, b) => { captured.allianceArgs = [a, b]; return null; },
      // R-HOTSEAT-DYPLO-KONTAKT-PER-FOTEL-Q1: `diplomaticContactEstablished` (Set) ->
      // `diplomaticContactEstablishedSet(humanOwnerId = ME())` (akcesor per-fotel main.ts) --
      // ciało funkcji woła akcesor bez argumentu (domyślny ME()), mock ignoruje arg i zwraca
      // to samo, co dawny płaski Set -- zero zmiany w tym, co ten test dowodzi.
      diplomaticContactEstablishedSet: () => new Set([4]),
      isMe, ME,
    };
    const fn = compileRealFunction('playerFormalRelationLabel', Object.keys(mocks), mocks);
    fn(4);
    return captured;
  }

  mutationExpected = false;
  const c = run(makeIsMe(PLAYER), makeME(PLAYER));
  ok(c.relArgs[0] === PLAYER, `PRAWDZIWY ME(): getDiploRelation pierwszy arg = ME() = ${PLAYER}, otrzymano ${JSON.stringify(c.relArgs)}`);
  ok(c.allianceArgs[0] === PLAYER, `PRAWDZIWY ME(): allianceFormalKindBetween drugi arg (a) = ME() = ${PLAYER}, otrzymano ${JSON.stringify(c.allianceArgs)}`);
  ok(c.ctx.hasNap === true, `PRAWDZIWY: hasNap=true (deal[strony includes ME()=${PLAYER}] rozpoznany), otrzymano ${c.ctx.hasNap}`);

  mutationExpected = true;
  const cBroken = run(BROKEN_isMe, BROKEN_ME);
  ok(cBroken.relArgs[0] === PLAYER, `MUTACJA ME()=>${WRONG}: getDiploRelation POWINIEN dostać ${WRONG}, nie ${PLAYER} -- czerwieni się poprawnie`);
  ok(cBroken.ctx.hasNap === false, `MUTACJA ME()=>${WRONG}: deal.strony.includes(ME()) POWINNO być false (deal ma [${PLAYER},4], nie ${WRONG}) -- hasNap POWINNO stać się false -- czerwieni się poprawnie`);
  mutationExpected = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. foreignCivsMissingTradeTreatyForCity
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. foreignCivsMissingTradeTreatyForCity — realne wykonanie\n');
{
  const AI = 4;
  const cities = [{ id: 'c1', ownerId: PLAYER }, { id: 'c2', ownerId: AI }];
  function run(isMe, ME) {
    const calls = { getDiploRelation: [], hasSzlakowTreaty: [] };
    const mocks = {
      cities,
      aiOwnerCivMap: new Map([[AI, 'grecy']]),
      isBarbarian: () => false,
      getDiploRelation: (a, b) => { calls.getDiploRelation.push([a, b]); return { status: 'pokoj' }; },
      hasSzlakowTreaty: (deals, a, b) => { calls.hasSzlakowTreaty.push([a, b]); return false; },
      activeDeals: [],
      citiesHaveTradeConnection: () => true,
      map: {}, cityBuilt: new Map(), DEFAULT_TRADE_ROUTE_PARAMS: {},
      buildAllTerritoryNodes: () => [],
      ownerDiploLabel: (id) => 'AI-' + id,
      isMe, ME,
    };
    const fn = compileRealFunction('foreignCivsMissingTradeTreatyForCity', Object.keys(mocks), mocks);
    const out = fn('c1');
    return { out, calls };
  }

  mutationExpected = false;
  const { out, calls } = run(makeIsMe(PLAYER), makeME(PLAYER));
  ok(out.length === 1 && out[0] === 'AI-4', `PRAWDZIWY isMe: miasto gracza rozpoznane, wynik=${JSON.stringify(out)}`);
  ok(calls.getDiploRelation[0][0] === PLAYER, `PRAWDZIWY ME(): getDiploRelation pierwszy arg = ${PLAYER}, otrzymano ${JSON.stringify(calls.getDiploRelation)}`);
  ok(calls.hasSzlakowTreaty[0][0] === PLAYER, `PRAWDZIWY ME(): hasSzlakowTreaty drugi arg = ${PLAYER}, otrzymano ${JSON.stringify(calls.hasSzlakowTreaty)}`);

  mutationExpected = true;
  const broken = run(BROKEN_isMe, BROKEN_ME);
  ok(broken.out.length === 1, `MUTACJA isMe=>false: !isMe(city.ownerId) POWINNO być true (miasto gracza nie rozpoznane) -> wczesny return [] -- czerwieni się poprawnie`);
  mutationExpected = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. collectDiploChipCounts
// ─────────────────────────────────────────────────────────────────────────────
// NAPRAWA rundy 2 (Final Control WERDYKT 2): runda 1 asercjonowała WYŁĄCZNIE zagregowany
// wynik {sojusze,pakty,wojny}, który mockiem maskował złamanie jednej z dwóch ścieżek
// klasyfikacji przez działającą drugą. Tu: (a) getDiploRelation ZAWSZE zwraca 'pokoj'
// niezależnie od argumentów -- jedyna droga, żeby AI1 trafił do "sojusze" to prawidłowe
// dodanie go do sojuszPartners przez L15031 `d.strony.includes(ME())`; AI2 (bez deala) jest
// kontrolą drugiej pętli i musi wylądować w "pakty". (b) getDiploRelation wywołania są
// przechwytywane i asercjonowane WPROST na pierwszym argumencie (L15039 `getDiploRelation(ME(),
// oid)`), niezależnie od zagregowanego wyniku -- dwa niezależne wywołania (AI1, AI2), każde z
// osobną asercją.
// NAPRAWA rundy 3 (Final Control WERDYKT po rundzie 2, drugi FAIL z rzędu tej samej klasy
// defektu): mock `contacted={AI1=4,AI2=5}` NIGDY nie zawiera wartości granicznej PLAYER=7,
// więc guard `if (isMe(oid)) continue;` (L15038) i jego regresja (np. `oid === 0`) są pod tym
// mockiem NIEROZRÓŻNIALNE -- obie wersje dają identyczny wynik, bo guard po prostu nigdy nie
// ma szansy się uruchomić na prawdziwym trafieniu. Tu: trzeci kontakt `oid=PLAYER` (=7) w
// mocku `contacted`, kontrola że blok PRAWDZIWY (isMe=makeIsMe(PLAYER)) go WYKLUCZA --
// getDiploRelation NIE jest wołane dla oid=PLAYER, licznik wywołań zostaje 2 (nie 3), i żaden
// z dwóch wywołań nie ma oid=PLAYER jako drugiego argumentu. Regresja guardu na literał inny
// niż `isMe(oid)` (np. `oid === 0`) NIE wyklucza PLAYER=7 -- oid=PLAYER trafia do pętli,
// getDiploRelation wywoływane 3x zamiast 2x -- ta bramka wtedy czerwienieje.
console.log('\n3. collectDiploChipCounts — realne wykonanie\n');
{
  const AI1 = 4; // ścieżka (a): sojuszPartners przez activeDeals + d.strony.includes(ME())
  const AI2 = 5; // ścieżka (b) kontrolna: bez deala, tylko getDiploRelation(ME(), oid)
  const activeDeals = [{ strony: [PLAYER, AI1], rodzaj: 'sojusz' }];
  function run(isMe, ME) {
    const calls = { getDiploRelation: [] };
    const mocks = {
      // trzeci kontakt = PLAYER (wartość graniczna guardu isMe(oid)) -- musi być wykluczony
      // przez `if (isMe(oid)) continue;` w bloku PRAWDZIWY, patrz komentarz NAPRAWA rundy 3 wyżej.
      getDiplomaticContacts: () => new Set([AI1, AI2, PLAYER]),
      activeDeals,
      isAllianceDealKind: () => true,
      normalizeTreatyKind: (r) => r,
      RodzajTraktatu: { PaktNieagresji: 'pakt' },
      // status ZAWSZE 'pokoj' niezależnie od (a,b) -- odcina ścieżkę (b) od wyniku "sojusze",
      // żeby test na sojusze===1 mierzył WYŁĄCZNIE ścieżkę (a).
      getDiploRelation: (a, b) => { calls.getDiploRelation.push([a, b]); return { status: 'pokoj' }; },
      isMe, ME,
    };
    const fn = compileRealFunction('collectDiploChipCounts', Object.keys(mocks), mocks);
    const out = fn();
    return { out, calls };
  }

  mutationExpected = false;
  const { out: real, calls: realCalls } = run(makeIsMe(PLAYER), makeME(PLAYER));
  ok(real.sojusze === 1, `PRAWDZIWY ME() ścieżka (a) L15031 (d.strony.includes(ME())): AI1 poprawnie dodany do sojuszPartners -> sojusze=1, otrzymano ${JSON.stringify(real)}`);
  ok(real.pakty === 1, `PRAWDZIWY: AI2 (bez deala, rel.status='pokoj') -> pakty=1 -- kontrola drugiej pętli, otrzymano ${JSON.stringify(real)}`);
  ok(real.wojny === 0, `PRAWDZIWY: wojny=0 (żadna relacja 'wojna' w mocku), otrzymano ${JSON.stringify(real)}`);
  ok(realCalls.getDiploRelation.length === 2, `PRAWDZIWY: getDiploRelation wywołane dokładnie 2x (guard isMe(oid) L15038 wyklucza oid=PLAYER=${PLAYER} z contacted={${AI1},${AI2},${PLAYER}}), otrzymano ${realCalls.getDiploRelation.length}`);
  ok(realCalls.getDiploRelation[0][0] === PLAYER, `PRAWDZIWY ME() ścieżka (b) L15039, wywołanie 1 (oid=${realCalls.getDiploRelation[0] && realCalls.getDiploRelation[0][1]}): pierwszy arg = ME() = ${PLAYER}, otrzymano ${JSON.stringify(realCalls.getDiploRelation[0])}`);
  ok(realCalls.getDiploRelation[1][0] === PLAYER, `PRAWDZIWY ME() ścieżka (b) L15039, wywołanie 2 (oid=${realCalls.getDiploRelation[1] && realCalls.getDiploRelation[1][1]}): pierwszy arg = ME() = ${PLAYER}, otrzymano ${JSON.stringify(realCalls.getDiploRelation[1])}`);
  ok(realCalls.getDiploRelation.every((c) => c[1] !== PLAYER), `PRAWDZIWY guard L15038 \`if (isMe(oid)) continue;\`: żadne wywołanie getDiploRelation nie ma oid=PLAYER=${PLAYER} jako drugiego argumentu (guard wykluczył wartość graniczną) -- otrzymano oid-y: ${JSON.stringify(realCalls.getDiploRelation.map((c) => c[1]))}`);

  mutationExpected = true;
  const { out: broken, calls: brokenCalls } = run(BROKEN_isMe, BROKEN_ME);
  ok(broken.sojusze === 0, `MUTACJA ME()=>${WRONG} ścieżka (a): d.strony.includes(${WRONG}) POWINNO być false (deal ma [${PLAYER},${AI1}]) -> sojuszPartners pusty -> sojusze POWINNO spaść z 1 do 0 -- czerwieni się poprawnie`);
  ok(brokenCalls.getDiploRelation[0] && brokenCalls.getDiploRelation[0][0] === PLAYER, `MUTACJA ME()=>${WRONG} ścieżka (b): getDiploRelation pierwszy arg POWINIEN być ${WRONG}, nie ${PLAYER} -- czerwieni się poprawnie`);
  ok(brokenCalls.getDiploRelation.length === 3, `MUTACJA isMe=>zawsze false: guard L15038 NIE wyklucza już PLAYER=${PLAYER} (isMe zepsute) -> getDiploRelation wywołane 3x zamiast 2x (AI1,AI2,PLAYER wszystkie przechodzą) -- czerwieni się poprawnie, otrzymano ${brokenCalls.getDiploRelation.length}`);
  mutationExpected = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. enqueueNegotiationFromAiCmd
// ─────────────────────────────────────────────────────────────────────────────
// NAPRAWA rundy 2 (Final Control WERDYKT 2): runda 1 przechwytywała i asercjonowała tylko 3
// z ok. 12 wywołań ME()/isMe() w ciele tej funkcji. Tu: WSZYSTKIE 12 miejsc, każde z osobną
// asercją w bloku PRAWDZIWY (mutationExpected=false -- to jest jedyny blok, który faktycznie
// czerwienieje, blok MUTACJA jest logiem, patrz komentarz nagłówkowy pliku). Dwa warianty cmd
// (`zaproponuj_umowe_handlowa`, `zaproponuj_pokoj`) uruchamiają dwie rozłączne gałęzie funkcji,
// żeby dotrzeć do wszystkich 12 call site'ów:
//   L15968 atWarWithPlayer, L15982 aiCommandToPendingProposal (już było), L15986 rel (gałąź
//   handlowa), L15992 priceableTradableGoodOptions, L15994 quantityTradableGoodOptions,
//   L16001 ownerBasketAffordCtx, L16030 relForPeace (gałąź pokoju), L16040
//   quantityTradableGoodOptions (pokój), L16049 relForBalance, L16054 pnBalanceOpts.playerOwnerId,
//   L16085 hasPendingNegotiationForPair (już było), L16090 createNegotiation (już było).
console.log('\n4. enqueueNegotiationFromAiCmd — realne wykonanie\n');
{
  const AI = 4;
  function run(isMe, ME, cmdType) {
    const calls = {
      getDiploRelation: [],
      priceableTradableGoodOptions: [],
      quantityTradableGoodOptions: [],
      ownerBasketAffordCtx: [],
      aiCommandToPendingProposal: [],
      hasPendingNegotiationForPair: [],
      createNegotiation: [],
      pnBalanceOpts: null,
    };
    const mocks = {
      isOwnerClusterCityState: () => false,
      ownerCityStateOpts: () => ({}),
      getDiploRelation: (a, b) => { calls.getDiploRelation.push([a, b]); return { status: 'pokoj' }; },
      clampAiResourceTradeCommand: (cmd) => cmd,
      buildAiResourceTradeClampCtx: () => ({}),
      aiCommandToPendingProposal: (cmd, ownerId, playerId, turn) => {
        calls.aiCommandToPendingProposal.push(playerId);
        return { actionId: 'x', payload: { giveItems: [{ typ: 'zloto', ilosc: 1 }] } };
      },
      buildDiploTreasury: () => ({ getPieniadze: () => 0 }),
      computeQuickDealBasket: () => ({}),
      priceableTradableGoodOptions: (id) => { calls.priceableTradableGoodOptions.push(id); return []; },
      quantityTradableGoodOptions: (id) => { calls.quantityTradableGoodOptions.push(id); return []; },
      effectiveGameDifficultyForOwner: () => 'normal',
      relationTotal: () => 0,
      ownerBasketAffordCtx: (id) => { calls.ownerBasketAffordCtx.push(id); return {}; },
      // Musi być non-null, inaczej gałąź 'zaproponuj_umowe_handlowa' wraca wcześniej, przed
      // dotarciem do L16049/L16054 (relForBalance/pnBalanceOpts).
      buildClampedAiTradeAgreementPayload: () => ({}),
      treatyBasePnFromConfig: () => 0,
      // >0, inaczej gałąź 'zaproponuj_pokoj' nigdy nie dociera do L16040
      // (quantityTradableGoodOptions wołane tylko gdy neededPn>0).
      peaceOfferAiRequestPn: () => 5,
      peaceOfferAiRequestBasket: () => [],
      clampAiProposalPayloadToRealResources: (ownerId, payload) => payload,
      trimProposalForZeroBalance: (payload, relTotal, difficulty, pnBalanceOpts) => {
        calls.pnBalanceOpts = pnBalanceOpts;
        return payload;
      },
      hasPendingNegotiationForPair: (table, playerId, ownerId, actionId) => {
        calls.hasPendingNegotiationForPair.push(playerId);
        return false;
      },
      isOfferRejectedOnCooldown: () => false,
      rejectedOfferCooldowns: new Map(),
      negotiationTable: [],
      negotiationSeq: 0,
      createNegotiation: (entry) => {
        calls.createNegotiation.push(entry.responderOwnerId);
        return entry;
      },
      turn: 1,
      refreshD1bHud: () => {},
      isDiplomacyPanelOpen: () => false,
      updateDiplomacyPanel: () => {},
      isMe, ME,
    };
    const fn = compileRealFunction('enqueueNegotiationFromAiCmd', Object.keys(mocks), mocks);
    fn(AI, { type: cmdType });
    return calls;
  }

  // --- Wariant A: cmd.type='zaproponuj_umowe_handlowa' -- gałąź handlowa (L15986-L16001). ---
  mutationExpected = false;
  const realTrade = run(makeIsMe(PLAYER), makeME(PLAYER), 'zaproponuj_umowe_handlowa');
  ok(realTrade.getDiploRelation.length === 3, `PRAWDZIWY (handel): getDiploRelation wywołane 3x (L15968, L15986, L16049), otrzymano ${realTrade.getDiploRelation.length}`);
  ok(realTrade.getDiploRelation[0] && realTrade.getDiploRelation[0][1] === PLAYER, `PRAWDZIWY ME() L15968 (atWarWithPlayer): drugi arg getDiploRelation = ${PLAYER}, otrzymano ${JSON.stringify(realTrade.getDiploRelation[0])}`);
  ok(realTrade.getDiploRelation[1] && realTrade.getDiploRelation[1][1] === PLAYER, `PRAWDZIWY ME() L15986 (rel, gałąź handlowa): drugi arg getDiploRelation = ${PLAYER}, otrzymano ${JSON.stringify(realTrade.getDiploRelation[1])}`);
  ok(realTrade.getDiploRelation[2] && realTrade.getDiploRelation[2][1] === PLAYER, `PRAWDZIWY ME() L16049 (relForBalance): drugi arg getDiploRelation = ${PLAYER}, otrzymano ${JSON.stringify(realTrade.getDiploRelation[2])}`);
  ok(realTrade.priceableTradableGoodOptions[1] === PLAYER, `PRAWDZIWY ME() L15992 (theirResourceOptions): priceableTradableGoodOptions 2. wywołanie = ME() = ${PLAYER}, otrzymano ${JSON.stringify(realTrade.priceableTradableGoodOptions)}`);
  ok(realTrade.quantityTradableGoodOptions[1] === PLAYER, `PRAWDZIWY ME() L15994 (theirQuantityResourceOptions): quantityTradableGoodOptions 2. wywołanie = ME() = ${PLAYER}, otrzymano ${JSON.stringify(realTrade.quantityTradableGoodOptions)}`);
  ok(realTrade.ownerBasketAffordCtx[1] === PLAYER, `PRAWDZIWY ME() L16001 (ownerBasketAffordCtx dla theirCtx): 2. wywołanie = ME() = ${PLAYER}, otrzymano ${JSON.stringify(realTrade.ownerBasketAffordCtx)}`);
  ok(!!realTrade.pnBalanceOpts && realTrade.pnBalanceOpts.playerOwnerId === PLAYER, `PRAWDZIWY ME() L16054 (pnBalanceOpts.playerOwnerId) = ${PLAYER}, otrzymano ${JSON.stringify(realTrade.pnBalanceOpts)}`);
  ok(realTrade.aiCommandToPendingProposal[0] === PLAYER, `PRAWDZIWY ME() L15982: aiCommandToPendingProposal 3. arg (playerId) = ${PLAYER}, otrzymano ${JSON.stringify(realTrade.aiCommandToPendingProposal)}`);
  ok(realTrade.hasPendingNegotiationForPair[0] === PLAYER, `PRAWDZIWY ME() L16085: hasPendingNegotiationForPair 2. arg = ${PLAYER}, otrzymano ${JSON.stringify(realTrade.hasPendingNegotiationForPair)}`);
  ok(realTrade.createNegotiation[0] === PLAYER, `PRAWDZIWY ME() L16090: createNegotiation entry.responderOwnerId = ${PLAYER}, otrzymano ${JSON.stringify(realTrade.createNegotiation)}`);

  mutationExpected = true;
  const brokenTrade = run(BROKEN_isMe, BROKEN_ME, 'zaproponuj_umowe_handlowa');
  ok(brokenTrade.getDiploRelation[0] && brokenTrade.getDiploRelation[0][1] === PLAYER, `MUTACJA ME()=>${WRONG} L15968: POWINIEN dostać ${WRONG}, nie ${PLAYER} -- czerwieni się poprawnie`);
  ok(brokenTrade.priceableTradableGoodOptions[1] === PLAYER, `MUTACJA ME()=>${WRONG} L15992: priceableTradableGoodOptions POWINIEN dostać ${WRONG}, nie ${PLAYER} -- czerwieni się poprawnie`);
  ok(!!brokenTrade.pnBalanceOpts && brokenTrade.pnBalanceOpts.playerOwnerId === PLAYER, `MUTACJA ME()=>${WRONG} L16054: pnBalanceOpts.playerOwnerId POWINIEN być ${WRONG}, nie ${PLAYER} -- czerwieni się poprawnie`);
  mutationExpected = false;

  // --- Wariant B: cmd.type='zaproponuj_pokoj' -- gałąź pokoju (L16030-L16040). ---
  mutationExpected = false;
  const realPeace = run(makeIsMe(PLAYER), makeME(PLAYER), 'zaproponuj_pokoj');
  ok(realPeace.getDiploRelation.length === 3, `PRAWDZIWY (pokój): getDiploRelation wywołane 3x (L15968, L16030, L16049), otrzymano ${realPeace.getDiploRelation.length}`);
  ok(realPeace.getDiploRelation[0] && realPeace.getDiploRelation[0][1] === PLAYER, `PRAWDZIWY ME() L15968 (atWarWithPlayer, gałąź pokoju): drugi arg = ${PLAYER}, otrzymano ${JSON.stringify(realPeace.getDiploRelation[0])}`);
  ok(realPeace.getDiploRelation[1] && realPeace.getDiploRelation[1][1] === PLAYER, `PRAWDZIWY ME() L16030 (relForPeace): drugi arg getDiploRelation = ${PLAYER}, otrzymano ${JSON.stringify(realPeace.getDiploRelation[1])}`);
  ok(realPeace.getDiploRelation[2] && realPeace.getDiploRelation[2][1] === PLAYER, `PRAWDZIWY ME() L16049 (relForBalance, gałąź pokoju): drugi arg = ${PLAYER}, otrzymano ${JSON.stringify(realPeace.getDiploRelation[2])}`);
  ok(realPeace.quantityTradableGoodOptions.length === 1 && realPeace.quantityTradableGoodOptions[0] === PLAYER, `PRAWDZIWY ME() L16040 (peaceOfferAiRequestBasket arg): quantityTradableGoodOptions(ME()) = ${PLAYER}, otrzymano ${JSON.stringify(realPeace.quantityTradableGoodOptions)}`);
  ok(!!realPeace.pnBalanceOpts && realPeace.pnBalanceOpts.playerOwnerId === PLAYER, `PRAWDZIWY ME() L16054 (pnBalanceOpts.playerOwnerId, gałąź pokoju) = ${PLAYER}, otrzymano ${JSON.stringify(realPeace.pnBalanceOpts)}`);

  mutationExpected = true;
  const brokenPeace = run(BROKEN_isMe, BROKEN_ME, 'zaproponuj_pokoj');
  ok(brokenPeace.getDiploRelation[1] && brokenPeace.getDiploRelation[1][1] === PLAYER, `MUTACJA ME()=>${WRONG} L16030: relForPeace POWINIEN dostać ${WRONG}, nie ${PLAYER} -- czerwieni się poprawnie`);
  ok(brokenPeace.quantityTradableGoodOptions[0] === PLAYER, `MUTACJA ME()=>${WRONG} L16040: quantityTradableGoodOptions POWINIEN dostać ${WRONG}, nie ${PLAYER} -- czerwieni się poprawnie`);
  mutationExpected = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. applyBorderMarchPenaltiesEndTurn
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. applyBorderMarchPenaltiesEndTurn — realne wykonanie\n');
{
  function run(isMe, ME) {
    const calls = { classifyPlayerBorderMarchNotice: [] };
    const mocks = {
      buildAllTerritoryNodes: () => [],
      isCredibilityScoutUnit: () => false,
      units: [],
      collectUnauthorizedBorderPairs: () => [],
      enrichBorderMarchPairsWithMilitary: () => [],
      dedupeBorderMarchPairs: (p) => p,
      defaultIsMilitaryUnit: () => false,
      loadBorderMarchParams: () => ({ karaPrzemarszNieautoryzowany_zaufanie_perTura: 1 }),
      getDiploRelation: () => ({ status: 'pokoj' }),
      barbarianCooperationGrace: undefined,
      turn: 1,
      applyUnauthorizedBorderPenalties: () => ({ relations: new Map(), penalizedPairs: 1 }),
      diplomacyRelations: new Map(),
      activeDeals: [],
      classifyPlayerBorderMarchNotice: (enriched, ctxFn, playerOwnerId) => {
        calls.classifyPlayerBorderMarchNotice.push(playerOwnerId);
        return { playerBorderViolated: false, playerTrespassing: false, violatingIntruders: [], trespassedOwners: [] };
      },
      ownerDiploLabel: (id) => 'AI-' + id,
      borderMarchEventTargets: new Map(),
      borderMarchEventLog: [],
      wiarygodnoscN7ActivePairs: new Set(),
      appendWiarygodnoscEvent: () => {},
      _diplomacyParams: () => ({ wiarygodnoscN7NieautoryzowanyPrzemarsz: 1 }),
      hasAuthorizedBorderCrossing: () => true,
      isMe, ME,
    };
    const fn = compileRealFunction('applyBorderMarchPenaltiesEndTurn', Object.keys(mocks), mocks);
    fn();
    return calls;
  }

  mutationExpected = false;
  const real = run(makeIsMe(PLAYER), makeME(PLAYER));
  ok(real.classifyPlayerBorderMarchNotice[0] === PLAYER, `PRAWDZIWY ME(): classifyPlayerBorderMarchNotice 3. arg = ME() = ${PLAYER}, otrzymano ${JSON.stringify(real.classifyPlayerBorderMarchNotice)}`);

  mutationExpected = true;
  const broken = run(BROKEN_isMe, BROKEN_ME);
  ok(broken.classifyPlayerBorderMarchNotice[0] === PLAYER, `MUTACJA ME()=>${WRONG}: classifyPlayerBorderMarchNotice POWINIEN dostać ${WRONG}, nie ${PLAYER} -- czerwieni się poprawnie`);
  mutationExpected = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. currentVisibleForOwner
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. currentVisibleForOwner — realne wykonanie\n');
{
  const AI = 4;
  function run(isMe, ME) {
    const calls = { allianceFormalKindBetween: [] };
    const mocks = {
      computePlayerVisibility: () => new Set(['h1']),
      map: {}, units: [], cities: [], unitSight: {},
      allianceFormalKindBetween: (deals, a, b) => {
        calls.allianceFormalKindBetween.push(a);
        return a === PLAYER ? 'sojusz' : null;
      },
      activeDeals: [],
      ownPlayerVisibleHexes: () => ['h2'],
      isMe, ME,
    };
    const fn = compileRealFunction('currentVisibleForOwner', Object.keys(mocks), mocks);
    const out = fn(AI);
    return { out, calls };
  }

  mutationExpected = false;
  const { out, calls } = run(makeIsMe(PLAYER), makeME(PLAYER));
  ok(out.has('h1') && out.has('h2'), `PRAWDZIWY: !isMe(AI)=true wchodzi w gałąź, allianceFormalKindBetween(deals, ME()=${PLAYER}, AI) rozpoznaje sojusz, ownPlayerVisibleHexes dołączone, wynik=${JSON.stringify([...out])}`);
  ok(calls.allianceFormalKindBetween[0] === PLAYER, `PRAWDZIWY ME(): drugi arg allianceFormalKindBetween = ${PLAYER}`);

  mutationExpected = true;
  const broken = run(BROKEN_isMe, BROKEN_ME);
  ok(broken.out.has('h2'), `MUTACJA ME()=>${WRONG}: allianceFormalKindBetween(deals, ${WRONG}, AI) POWINNO zwrócić null (nie ${PLAYER}) -> 'h2' NIE powinno zostać dołączone -- czerwieni się poprawnie`);
  mutationExpected = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. peacefulArchetypeForOwner
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. peacefulArchetypeForOwner — realne wykonanie\n');
{
  function run(isMe, ME) {
    const mocks = {
      aiOwnerCivMap: new Map([[4, 'grecy']]),
      civAiProfileForTyp: () => ({ sklonnoscDoPodboju: 2, agresywnosc: 1, tolerancjaRyzyka: 1 }),
      resolveArchetypeAggression: () => 0.5,
      ARCHETYPE_AGGRESSION: {},
      data: {},
      resolveDiplomacyCivBias: () => ({ peaceful: true }),
      isMe, ME,
    };
    const fn = compileRealFunction('peacefulArchetypeForOwner', Object.keys(mocks), mocks);
    return fn(PLAYER); // wołane z REALNYM id gracza -- musi dać false niezależnie od reszty logiki
  }

  mutationExpected = false;
  const real = run(makeIsMe(PLAYER), makeME(PLAYER));
  ok(real === false, `PRAWDZIWY isMe: peacefulArchetypeForOwner(ownerId=ME()=${PLAYER}) musi zwrócić false (gracz nie ma archetypu AI), otrzymano ${real}`);

  mutationExpected = true;
  const broken = run(BROKEN_isMe, BROKEN_ME);
  ok(broken === false, `MUTACJA isMe=>false: guard isMe(ownerId) nigdy prawdziwy -> POWINNO fałszywie przejść dalej i zwrócić true (peaceful mocka) zamiast false -- czerwieni się poprawnie`);
  mutationExpected = false;
}

console.log(`\nhotseat-etap6d-podetap-b-exec-test: ${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
