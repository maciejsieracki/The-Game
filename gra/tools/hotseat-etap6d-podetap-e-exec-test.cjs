'use strict';
/**
 * hotseat-etap6d-podetap-e-exec-test.cjs — bramka R-HOTSEAT-ETAP6D-PODETAP-E-Q1, RUNDA 2
 * (naprawa ZARZUTU 2 Evaluatora rundy 1: `hotseat-etap6d-podetap-e-source-test.cjs` sprawdzał
 * ciała funkcji WYŁĄCZNIE regexem na tekście — main.ts nigdy nie był wykonywany).
 *
 * Ten plik WYKONUJE naprawdę 4 funkcje silnikowe explicite zwolnione przez dispatch z dowodu
 * Chromium pod warunkiem realnego testu jednostkowego:
 *   `collectTurnEvents`, `collectOpenDiploProposalQueue`, `resolvePendingNegotiationsForOwner`,
 *   `resolveNegotiationEntryAt`.
 * PLUS (sekcja 5, dodana w obronie rundy 1 -- naprawa ZARZUTU 3): `handleNegotiationCounter`,
 * jako UZUPEŁNIENIE żywej bramki Chromium (którą dispatch nominalnie wymagał tu wprost) —
 * patrz `03-obrona-runda1.md` ZARZUT 3 dla stanu prób sprowokowania realnej kontroferty AI
 * przez UI i uzasadnienia, dlaczego to wykonanie jest dodatkiem, nie zamiennikiem.
 *
 * Metoda (main.ts nie da się zaimportować — bootuje scenę przy imporcie, patrz komentarz w
 * source-test.cjs): ciało KAŻDEJ z funkcji jest wycinane ze ŹRÓDŁA main.ts (ten sam
 * brace-matched ekstraktor co source-test.cjs — identyczny mechanizm, więc gdyby main.ts się
 * przesunął i ekstrakcja złapała złe ciało, złapałaby to też source-test.cjs), zamykane w
 * `new Function(...)` z DOKŁADNIE tymi wolnymi identyfikatorami, których faktycznie używa (nie
 * z reimplementacją logiki tych identyfikatorów — to realne domknięcia stanu testowego:
 * tablice/Mapy/Sety mutowane PRZEZ wykonanie prawdziwego ciała funkcji, oraz "spy" funkcje
 * zapisujące swoje argumenty), po czym WYWOŁYWANA z prawdziwymi argumentami i asercje czytają
 * REALNY efekt wykonania (zwrócona wartość, mutacja negotiationTable, argumenty przekazane do
 * spy). Różnica względem source-test.cjs: tam regex na TEKŚCIE ciała, tu wykonanie ciała.
 *
 * Kontrola nietautologiczności (jak wymaga dispatch, "reguła przeciw samooszukiwaniu"): każdy
 * blok najpierw uruchamia się z PRAWDZIWYM `isMe`/`ME` (musi dać oczekiwany wynik), potem z
 * WSTRZYKNIĘTĄ MUTACJĄ `isMe` (stale `() => false`, `ME` stale `() => 0`) — test MUSI
 * zaczerwienić się na mutacji, inaczej assertion jest bezwartościowy.
 *
 * Uruchamianie z katalogu gra/: node tools/hotseat-etap6d-podetap-e-exec-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');

let pass = 0;
let fail = 0;
let mutationExpected = false; // gdy true, `ok(false, ...)` liczy się jako oczekiwane (nie FAIL globalny)
function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else if (mutationExpected) { pass++; console.log('  OK (mutacja poprawnie czerwieni):', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}

/** Brace-matched wycięcie CAŁEGO tekstu `function NAME(...): RetType { ... }` (sygnatura +
 *  ciało, z oryginalnymi adnotacjami TS) wprost ze źródła main.ts. Ten sam mechanizm
 *  brace-matchingu co ekstraktor w hotseat-etap6d-podetap-e-source-test.cjs (świadomie: gdyby
 *  main.ts się przesunął i ekstrakcja złapała złe granice funkcji, złapałaby to RÓWNIEŻ tamten
 *  plik, więc oba testy fałszywie-pozytywnie zgadzałyby się tylko razem, nigdy osobno). */
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

/** Kompiluje wycięty-ze-źródła (prawdziwy, TS) tekst funkcji do wywoływalnej funkcji JS:
 *  esbuild.transformSync (loader 'ts') zdejmuje WYŁĄCZNIE adnotacje typów -- nie zmienia
 *  ani jednej linii logiki -- po czym `new Function` zamyka wynik nad mockami jako wolnymi
 *  zmiennymi. To wykonanie PRAWDZIWEGO ciała funkcji z main.ts, nie reimplementacja. */
function compileRealFunction(name, freeVarNames, mocks) {
  const tsSrc = extractFullFunctionSource(mainSrc, name);
  if (!tsSrc) throw new Error(`Nie znaleziono ${name} w main.ts`);
  const { code } = esbuild.transformSync(tsSrc, { loader: 'ts', format: 'cjs', target: 'node18' });
  const factory = new Function(...freeVarNames, `${code}\nreturn ${name};`);
  const args = freeVarNames.map(v => mocks[v]);
  return factory(...args);
}

console.log('hotseat-etap6d-podetap-e-exec-test (R-HOTSEAT-ETAP6D-PODETAP-E-Q1, runda 2)\n');

// ─────────────────────────────────────────────────────────────────────────────
// Wspólne mocki
// ─────────────────────────────────────────────────────────────────────────────
function makeIsMe(realPlayerId) {
  return (ownerId) => ownerId === realPlayerId;
}
function makeME(realPlayerId) {
  return () => realPlayerId;
}
// Mutacja wymagana przez "regułę przeciw samooszukiwaniu": isMe zawsze false, ME zawsze 0
// (0 jest CELOWO wybrane jako fałszywy "gracz", żeby ewentualny pozostały hardkod `===0` w
// cofniętej migracji NADAL by przechodził -- to jest silniejsza mutacja niż samo isMe=>false).
const BROKEN_isMe = () => false;
const BROKEN_ME = () => 0;

// ─────────────────────────────────────────────────────────────────────────────
// 1. collectOpenDiploProposalQueue — najprostsza, 4 wolne zmienne
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. collectOpenDiploProposalQueue — realne wykonanie\n');
{
  const PLAYER = 7; // celowo NIE 0 -- gdyby gdzieś zostal hardkod `===0`, ten test by go złapał
  const negotiationTable = [
    { id: 'n-player-awaits', awaitingOwnerId: PLAYER, proposerOwnerId: 3, responderOwnerId: PLAYER },
    { id: 'n-ai-awaits', awaitingOwnerId: 3, proposerOwnerId: PLAYER, responderOwnerId: 3 },
    { id: 'n-dismissed', awaitingOwnerId: PLAYER, proposerOwnerId: PLAYER, responderOwnerId: 9 },
  ];
  const pendingDiplomacyInbox = [{ id: 'p1', ownerId: 5 }];
  const dismissedSidePanelEventIds = new Set(['n-dismissed']);

  function run(isMe) {
    const fn = compileRealFunction(
      'collectOpenDiploProposalQueue',
      ['pendingDiplomacyInbox', 'dismissedSidePanelEventIds', 'negotiationTable', 'isMe'],
      { pendingDiplomacyInbox, dismissedSidePanelEventIds, negotiationTable, isMe },
    );
    return fn();
  }

  mutationExpected = false;
  const queue = run(makeIsMe(PLAYER));
  ok(queue.length === 2, `PRAWDZIWY isMe: kolejka ma 2 wpisy (pendingDiplomacyInbox + n-player-awaits), otrzymano ${queue.length}`);
  ok(queue.some(q => q.id === 'p1' && q.ownerId === 5), 'zawiera wpis z pendingDiplomacyInbox nietknięty');
  ok(queue.some(q => q.id === 'n-player-awaits' && q.ownerId === 3), 'n-player-awaits: aiOwnerId=3 (proposer, bo responder=PLAYER)');
  ok(!queue.some(q => q.id === 'n-ai-awaits'), 'n-ai-awaits POMINIĘTY (awaitingOwnerId != PLAYER)');
  ok(!queue.some(q => q.id === 'n-dismissed'), 'n-dismissed POMINIĘTY (w dismissedSidePanelEventIds)');

  // Mutacja: isMe zawsze false -> PLAYER nie rozpoznawany, n-player-awaits znika z kolejki.
  mutationExpected = true;
  const queueBroken = run(BROKEN_isMe);
  ok(queueBroken.some(q => q.id === 'n-player-awaits'), 'MUTACJA isMe=>false: n-player-awaits POWINIEN zniknąć z kolejki (czerwieni się poprawnie)');
  mutationExpected = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. collectTurnEvents — pełne ciało, część negotiationTable
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. collectTurnEvents — realne wykonanie (fragment stołu negocjacyjnego)\n');
{
  const PLAYER = 7;
  const NEGOTIATION_MAX_ROUNDS = 5;
  const negotiationTable = [
    { id: 'n1', awaitingOwnerId: PLAYER, proposerOwnerId: 4, responderOwnerId: PLAYER, round: 1 },
  ];
  const mocks = {
    shouldDeferEotEvents: () => false,
    endTurnInProgress: false,
    rationAutoEventLog: [],
    warEventLog: [],
    villageEventLog: [],
    tradeRouteEventLog: [],
    borderMarchEventLog: [],
    cities: [],
    cityOrderState: new Map(),
    revoltWarningMessage: () => '',
    cityProd: new Map(),
    cityHasActionableProduction: () => false,
    productionOptionsFingerprint: () => '',
    prodEmptyDismissFp: new Map(),
    pendingDiplomacyInbox: [],
    diploPendingTitle: () => '',
    negotiationTable,
    isMe: null, // podstawiane per-run
    ownerDiploLabel: (id) => 'AI-' + id,
    negotiationSummary: () => 'summary',
    NEGOTIATION_MAX_ROUNDS,
    dismissedSidePanelEventIds: new Set(),
  };
  const freeVars = Object.keys(mocks);

  function run(isMe) {
    const fn = compileRealFunction('collectTurnEvents', freeVars, { ...mocks, isMe });
    return fn();
  }

  mutationExpected = false;
  const events = run(makeIsMe(PLAYER));
  const negEvent = events.find(e => e.id === 'n1');
  ok(!!negEvent, `PRAWDZIWY isMe: wpis n1 (awaitingOwnerId=PLAYER) wygenerował zdarzenie, otrzymano ${events.length} zdarzeń`);
  ok(!!negEvent && negEvent.title === 'Dyplomacja: AI-4', 'zdarzenie n1: aiOwnerId=4 (proposer, bo responder=PLAYER) w tytule');

  mutationExpected = true;
  const eventsBroken = run(BROKEN_isMe);
  ok(!!eventsBroken.find(e => e.id === 'n1'), 'MUTACJA isMe=>false: zdarzenie n1 POWINNO zniknąć z listy (czerwieni się poprawnie)');
  mutationExpected = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 i 4. resolveNegotiationEntryAt + resolvePendingNegotiationsForOwner — realne wykonanie
//    z pełnym łańcuchem zależności silnika negocjacji, zmockowanym jako proste spy.
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3+4. resolveNegotiationEntryAt / resolvePendingNegotiationsForOwner — realne wykonanie\n');
{
  const PLAYER = 7;
  const AI = 4;

  function baseMocks(negotiationTable, calls) {
    return {
      negotiationStillValid: () => ({ valid: true }),
      buildNegotiationWorldCtx: (a, b, atWar) => ({ a, b, atWar }),
      getDiploRelation: () => ({ status: 'pokoj' }),
      livePackageSiblingFor: () => undefined,
      buildProposalEvalContext: (proposer, responder, sibling) => ({ proposer, responder, sibling }),
      // Domyślnie: AI odrzuca z warThreat, żeby pokryć gałąź `entry.payload.warThreat`
      // (ownerDeclareWarOn/playerDeclareWarOnOwner) w jednym przebiegu jak i drugim.
      resolveNegotiationAsResponder: (entry) => ({ kind: 'rejected', reason: 'test' }),
      clampNegotiationPayloadToRealResources: (p, r, payload) => payload,
      applyProposalOutcome: (...args) => calls.applyProposalOutcome.push(args),
      playerDeclareWarOnOwner: (...args) => calls.playerDeclareWarOnOwner.push(args),
      ownerDeclareWarOn: (...args) => calls.ownerDeclareWarOn.push(args),
      negotiationSummary: () => 'summary',
      showHintMessage: (...args) => calls.showHintMessage.push(args),
      DIPLOMACY_MSG_PREFIX: '[Dyplomacja]',
      ownerDiploLabel: (id) => 'Owner-' + id,
      turn: 1,
      negotiationTable,
      isMe: null, // podstawiane per-run
      ME: null,
      isTreatyBaseFairnessAction: () => false,
      packageSiblingPn: () => ({ givePn: 0, receivePn: 0 }),
      refreshD1bHud: () => {},
      isDiplomacyPanelOpen: () => false,
      updateDiplomacyPanel: () => {},
    };
  }

  // 3a. resolveNegotiationEntryAt: AI (responder) odrzuca ofertę GRACZA z warThreat →
  //     entry.proposerOwnerId to gracz → gałąź isMe(proposerOwnerId) → playerDeclareWarOnOwner.
  {
    function makeTable() {
      return [{ id: 'n1', awaitingOwnerId: AI, proposerOwnerId: PLAYER, responderOwnerId: AI, payload: { warThreat: true }, actionId: 'trybut_zadanie' }];
    }
    function run(isMe, ME) {
      const calls = { applyProposalOutcome: [], playerDeclareWarOnOwner: [], ownerDeclareWarOn: [], showHintMessage: [] };
      const table = makeTable();
      const mocks = baseMocks(table, calls);
      const freeVars = Object.keys(mocks);
      const fn = compileRealFunction('resolveNegotiationEntryAt', freeVars, { ...mocks, isMe, ME });
      fn(0);
      return calls;
    }

    mutationExpected = false;
    const calls = run(makeIsMe(PLAYER), makeME(PLAYER));
    ok(calls.playerDeclareWarOnOwner.length === 1 && calls.playerDeclareWarOnOwner[0][0] === AI,
      `PRAWDZIWY isMe: proposerOwnerId=PLAYER rozpoznany → playerDeclareWarOnOwner(${AI}) wywołane, wywołania=${JSON.stringify(calls.playerDeclareWarOnOwner)}`);
    ok(calls.ownerDeclareWarOn.length === 0, 'PRAWDZIWY isMe: ownerDeclareWarOn NIE wywołane (proposer to gracz, nie responder)');

    mutationExpected = true;
    const callsBroken = run(BROKEN_isMe, BROKEN_ME);
    ok(callsBroken.playerDeclareWarOnOwner.length === 1,
      'MUTACJA isMe=>false: playerDeclareWarOnOwner NIE powinien być wywołany (gałąź isMe(proposerOwnerId) nigdy prawdziwa) -- czerwieni się poprawnie');
    mutationExpected = false;
  }

  // 3b. resolveNegotiationEntryAt: GRACZ (responder) odrzuca ofertę AI z warThreat →
  //     entry.responderOwnerId to gracz → gałąź isMe(responderOwnerId) → ownerDeclareWarOn(proposer, ME()).
  {
    function makeTable() {
      return [{ id: 'n2', awaitingOwnerId: PLAYER, proposerOwnerId: AI, responderOwnerId: PLAYER, payload: { warThreat: true }, actionId: 'trybut_zadanie' }];
    }
    function run(isMe, ME) {
      const calls = { applyProposalOutcome: [], playerDeclareWarOnOwner: [], ownerDeclareWarOn: [], showHintMessage: [] };
      const table = makeTable();
      const mocks = baseMocks(table, calls);
      const freeVars = Object.keys(mocks);
      const fn = compileRealFunction('resolveNegotiationEntryAt', freeVars, { ...mocks, isMe, ME });
      fn(0);
      return calls;
    }

    mutationExpected = false;
    const calls = run(makeIsMe(PLAYER), makeME(PLAYER));
    ok(calls.ownerDeclareWarOn.length === 1 && calls.ownerDeclareWarOn[0][0] === AI && calls.ownerDeclareWarOn[0][1] === PLAYER,
      `PRAWDZIWY isMe: responderOwnerId=PLAYER rozpoznany → ownerDeclareWarOn(${AI}, ME()=${PLAYER}) wywołane, wywołania=${JSON.stringify(calls.ownerDeclareWarOn)}`);
    ok(calls.ownerDeclareWarOn.length === 1 && calls.ownerDeclareWarOn[0][1] === PLAYER,
      `drugi argument ownerDeclareWarOn to ME() realnie wywołane (=${PLAYER}), nie zaszyty literał 0`);

    mutationExpected = true;
    const callsBroken = run(BROKEN_isMe, BROKEN_ME);
    ok(callsBroken.ownerDeclareWarOn.length === 1,
      'MUTACJA isMe=>false: ownerDeclareWarOn NIE powinien być wywołany (gałąź isMe(responderOwnerId) nigdy prawdziwa) -- czerwieni się poprawnie');
    mutationExpected = false;
  }

  // 4. resolvePendingNegotiationsForOwner: filtruje wpisy TYLKO tam gdzie gracz jest stroną
  //    (proposer LUB responder) — z parą AI↔AI (PLAYER nigdzie) NIE wolno rozstrzygać.
  {
    const AI2 = 9;
    function makeTable() {
      return [
        { id: 'n-player-side', awaitingOwnerId: AI, proposerOwnerId: PLAYER, responderOwnerId: AI, payload: {}, actionId: 'x' },
        { id: 'n-ai-only', awaitingOwnerId: AI, proposerOwnerId: AI2, responderOwnerId: AI, payload: {}, actionId: 'x' },
      ];
    }
    function run(isMe, ME) {
      const calls = { applyProposalOutcome: [], playerDeclareWarOnOwner: [], ownerDeclareWarOn: [], showHintMessage: [] };
      const table = makeTable();
      const mocks = baseMocks(table, calls);
      // resolvePendingNegotiationsForOwner woła resolveNegotiationEntryAt WEWNĘTRZNIE (z
      // main.ts, prawdziwe ciało) -- kompilujemy obie funkcje w tym samym zestawie wolnych
      // zmiennych i wstrzykujemy resolveNegotiationEntryAt jako dodatkową wolną zmienną.
      const freeVarsInner = Object.keys(mocks);
      const resolveEntryAt = compileRealFunction('resolveNegotiationEntryAt', freeVarsInner, { ...mocks, isMe, ME });
      const mocks2 = { ...mocks, isMe, ME, resolveNegotiationEntryAt: resolveEntryAt };
      const freeVars2 = Object.keys(mocks2);
      const fn = compileRealFunction('resolvePendingNegotiationsForOwner', freeVars2, mocks2);
      fn(AI);
      return { table, calls };
    }

    mutationExpected = false;
    const { table, calls } = run(makeIsMe(PLAYER), makeME(PLAYER));
    ok(table.length === 1 && table[0].id === 'n-ai-only',
      `PRAWDZIWY isMe: n-player-side ROZSTRZYGNIĘTY (usunięty z tabeli), n-ai-only NIETKNIĘTY, pozostało=${JSON.stringify(table.map(t => t.id))}`);
    ok(calls.applyProposalOutcome.length === 1, 'applyProposalOutcome wywołane dokładnie raz (dla n-player-side)');

    mutationExpected = true;
    const broken = run(BROKEN_isMe, BROKEN_ME);
    ok(broken.table.length === 1,
      'MUTACJA isMe=>false: n-player-side NIE powinien być rozstrzygnięty (filtr isMe(proposer)||isMe(responder) nigdy prawdziwy) -- czerwieni się poprawnie');
    mutationExpected = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. handleNegotiationCounter — DODATEK RUNDY 2 (naprawa ZARZUTU 3 Evaluatora rundy 1:
//    "CAŁA funkcja pozostaje bez pokrycia poza wadliwym regexem" -- source-test.cjs regexem
//    NIE liczy się jako pokrycie). Dispatch nominalnie wymagał tu Chromium (żywy klik
//    kontroferty w audiencji) -- Chromium NIE dowodzi tu więcej niż realne wykonanie ciała
//    funkcji (ta sama logika, ten sam guard `isMe(entry.awaitingOwnerId)`, patrz nagłówek
//    live-test.cjs runda 2 dla stanu prób sprowokowania AI do realnej kontroferty przez UI --
//    NIE zdjęte z listy do zamknięcia, patrz obrona rundy 1 ZARZUT 3). To wykonanie jest
//    UZUPEŁNIENIEM, nie zamiennikiem żywego klawisza "Edytuj"/kontroferta w audiencji.
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. handleNegotiationCounter — realne wykonanie (uzupełnienie, patrz obrona ZARZUT 3)\n');
{
  const PLAYER = 7;
  const AI = 4;

  function baseMocks(negotiationTable, calls) {
    return {
      canPlayerCounterNegotiation: () => true,
      buildProposalFromPayload: (aiOwnerId, payload) => ({ uiPayload: { ...payload, aiOwnerId } }),
      applyCounterOffer: (entry, uiPayload, authorOwnerId, turn) => {
        calls.applyCounterOffer.push([entry.id, uiPayload, authorOwnerId, turn]);
        return { ...entry, payload: uiPayload, round: entry.round + 1, authorOwnerId, awaitingOwnerId: authorOwnerId === PLAYER ? AI : PLAYER };
      },
      refreshD1bHud: () => {},
      updateDiplomacyAudience: () => {},
      isDiplomacyPanelOpen: () => false,
      updateDiplomacyPanel: () => {},
      showHintMessage: (...args) => calls.showHintMessage.push(args),
      negotiationTable,
      isMe: null, // podstawiane per-run
      ME: null,
      turn: 3,
    };
  }

  // 5a. Wpis CZEKA NA GRACZA (awaitingOwnerId=PLAYER) -> gałąź realna: applyCounterOffer
  //     wywołane z authorOwnerId=ME() (realnie wywołane, nie zaszyty literał 0).
  {
    function makeTable() {
      return [{ id: 'n1', awaitingOwnerId: PLAYER, proposerOwnerId: AI, responderOwnerId: PLAYER, payload: {}, round: 1 }];
    }
    function run(isMe, ME) {
      const calls = { applyCounterOffer: [], showHintMessage: [] };
      const table = makeTable();
      const mocks = baseMocks(table, calls);
      const freeVars = Object.keys(mocks);
      const fn = compileRealFunction('handleNegotiationCounter', freeVars, { ...mocks, isMe, ME });
      fn('n1', { givePn: 5 });
      return calls;
    }

    mutationExpected = false;
    const calls = run(makeIsMe(PLAYER), makeME(PLAYER));
    ok(calls.applyCounterOffer.length === 1 && calls.applyCounterOffer[0][2] === PLAYER,
      `PRAWDZIWY isMe/ME: awaitingOwnerId=PLAYER rozpoznany -> applyCounterOffer wywołane z authorOwnerId=ME()=${PLAYER} (realnie), wywołania=${JSON.stringify(calls.applyCounterOffer)}`);
    ok(calls.showHintMessage.length === 0, 'PRAWDZIWY isMe: żaden hint "limit rund" (guard przeszedł poprawnie)');

    mutationExpected = true;
    const callsBroken = run(BROKEN_isMe, BROKEN_ME);
    ok(callsBroken.applyCounterOffer.length === 1,
      'MUTACJA isMe=>false: applyCounterOffer NIE powinien być wywołany (guard !isMe(awaitingOwnerId) blokuje) -- czerwieni się poprawnie');
    ok(callsBroken.showHintMessage.length === 0,
      'MUTACJA isMe=>false: hint "limit rund" POWINIEN się pojawić zamiast cichego wyjścia -- czerwieni się poprawnie');
    mutationExpected = false;
  }

  // 5b. Wpis CZEKA NA AI (awaitingOwnerId=AI, NIE gracza) -> guard MUSI zablokować (gracz nie
  //     może kontrować wpisu, w którym to AI ma odpowiedzieć) -- niezależnie od isMe realnego.
  {
    function makeTable() {
      return [{ id: 'n2', awaitingOwnerId: AI, proposerOwnerId: PLAYER, responderOwnerId: AI, payload: {}, round: 1 }];
    }
    function run(isMe, ME) {
      const calls = { applyCounterOffer: [], showHintMessage: [] };
      const table = makeTable();
      const mocks = baseMocks(table, calls);
      const freeVars = Object.keys(mocks);
      const fn = compileRealFunction('handleNegotiationCounter', freeVars, { ...mocks, isMe, ME });
      fn('n2', { givePn: 5 });
      return calls;
    }
    const calls = run(makeIsMe(PLAYER), makeME(PLAYER));
    ok(calls.applyCounterOffer.length === 0, 'awaitingOwnerId=AI (nie gracz): applyCounterOffer POPRAWNIE zablokowane guardem');
    ok(calls.showHintMessage.length === 1, 'awaitingOwnerId=AI: hint "limit rund" pokazany (guard zadziałał)');
  }
}

console.log(`\nhotseat-etap6d-podetap-e-exec-test: ${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
