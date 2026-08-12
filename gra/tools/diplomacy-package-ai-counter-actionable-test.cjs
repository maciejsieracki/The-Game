'use strict';
/**
 * diplomacy-package-ai-counter-actionable-test.cjs — P-DYPLOMACJA-STOL-NEGOCJACJI-ZABLOKOWANY
 * (Maciej, playtest: „nie da się ani Przyjąć, ani Odrzucić oferty", zrzut pokazywał
 * „Kontroferta 2/3, wygasa za 5 tur" + panel „Spełnia warunki — użyj Przyjmij…", ale klik
 * nic nie robił).
 *
 * PRZYCZYNA: `actionableNegotiationIdsForPair` (main.ts, closure — niewołowalna przez
 * esbuild-entry jak reszta silnika, patrz wzorzec diplomacy-fairness-gate-package-q2-test.cjs)
 * liczyła wiersz „nasza kolej czeka na AI" jako `proposerOwnerId === 0` (gracz był
 * PIERWOTNYM proponentem) — ale role proposerOwnerId/responderOwnerId są STAŁE od rundy 1
 * (diplomacy-proposals.ts, komentarz przy PendingNegotiation) i NIE zmieniają się przy
 * kontrofercie. UI (buildPendingNegotiationRows/filterActionableNegotiationRows) liczy „own"
 * WYŁĄCZNIE z `awaitingOwnerId` — więc gdy AI zaproponowało jako pierwsze, a gracz skontrował
 * (Kontruj), UI pokazywał aktywny pasek Przyjmij/Odrzuć (dokładnie „Kontroferta 2/3"), ale
 * silnik wycinał ten wpis z `ids` w handleNegotiationAcceptPackage/RejectPackage — klik był
 * cichym no-opem.
 *
 * Ten plik, wzorem diplomacy-fairness-gate-package-q2-test.cjs, testuje DWUWARSTWOWO:
 * 1) ŹRÓDŁO — realny predykat wyodrębniony z main.ts i skompilowany jako wykonywalna funkcja
 *    (nie przepisany ręcznie — dowód, że test pilnuje FAKTYCZNEGO kodu, nie jego kopii).
 * 2) MECHANIZM — symulacja pętli wykonania (handleNegotiationAcceptPackage) + kontrola, że
 *    STARY predykat FAKTYCZNIE reprodukuje bug (nie tylko że nowy go naprawia).
 * 3) SPÓJNOŚĆ Z UI — filterActionableNegotiationRows (diplomacyAcceptanceBalance.ts,
 *    prawdziwy import) musi zgadzać się z main.ts co do tego, który wpis jest „actionable".
 *
 * Run: node tools/diplomacy-package-ai-counter-actionable-test.cjs
 */
const fs = require('fs');
const path = require('path');

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; console.error('FAIL:', label); }
}

console.log('diplomacy-package-ai-counter-actionable-test');

// ---------------------------------------------------------------------------
// CZĘŚĆ 1 — ŹRÓDŁO: wyodrębnij REALNY predykat actionableNegotiationIdsForPair z main.ts.
// ---------------------------------------------------------------------------
const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const src = fs.readFileSync(MAIN_TS, 'utf8');

function fnBody(name) {
  const re = new RegExp(`function ${name}\\([^)]*\\)[^{]*\\{`);
  const m = re.exec(src);
  if (!m) return null;
  let i = m.index + m[0].length;
  let depth = 1;
  const start = i;
  while (depth > 0 && i < src.length) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  return src.slice(start, i - 1);
}

const body = fnBody('actionableNegotiationIdsForPair');
ok(body != null, 'źródło: actionableNegotiationIdsForPair znaleziona w main.ts');

const filterMatch = body ? /\.filter\((n\s*=>\s*[^;]*?)\)\s*\.map\(n => n\.id\)/.exec(body) : null;
ok(filterMatch != null, 'źródło: predykat .filter(n => …) przed .map(n => n.id) wyodrębniony');
const predicateSrc = filterMatch ? filterMatch[1] : 'n => false';

// REGRESJA-STRAŻNIK: predykat NIE MOŻE odwoływać się do proposerOwnerId — to była
// dokładna przyczyna bugu (patrz nagłówek pliku).
ok(
  !predicateSrc.includes('proposerOwnerId'),
  'źródło REGRESJA-STRAŻNIK: predykat actionableNegotiationIdsForPair nie zawiera już proposerOwnerId (przyczyna P-DYPLOMACJA-STOL-NEGOCJACJI-ZABLOKOWANY)',
);

// Realny predykat jako wykonywalna funkcja — kompilowany z TEKSTU main.ts (nie ręczna kopia).
function makePredicate(ownerId) {
  // eslint-disable-next-line no-new-func
  const factory = new Function('ownerId', `return (${predicateSrc});`);
  return factory(ownerId);
}
const livePredicate = makePredicate(1);
ok(typeof livePredicate === 'function', 'źródło: predykat main.ts skompilowany jako wykonywalna funkcja (ownerId=1)');

// ---------------------------------------------------------------------------
// CZĘŚĆ 2 — MECHANIZM: scenariusz ze zgłoszenia — AI(1) proponuje jako pierwsze, gracz
// kontruje (Kontruj) -> runda 2, czeka AI. DOKŁADNIE „Kontroferta 2/3, wygasa za 5 tur".
// ---------------------------------------------------------------------------
function entry(over) {
  return {
    id: 'negot-x', proposerOwnerId: 0, responderOwnerId: 1, round: 1,
    awaitingOwnerId: 1, authorOwnerId: 0, createdTurn: 1, lastActionTurn: 1,
    expiresTurn: 10, source: 'player', ...over,
  };
}

// X — AI zainicjowało (proposerOwnerId=1, role STAŁE od rundy 1), gracz skontrował ->
// awaitingOwnerId=1 (czeka AI), round=2. To DOKŁADNIE „Kontroferta 2/3" ze zrzutu.
const aiInitiatedPlayerCountered = entry({
  id: 'negot-nap-0-1-t10-1', proposerOwnerId: 1, responderOwnerId: 0,
  awaitingOwnerId: 1, authorOwnerId: 0, round: 2,
});
// Y — gracz zainicjował (proposerOwnerId=0), czeka AI, round=1 — działało już PRZED naprawą.
const playerInitiatedAwaitingAi = entry({
  id: 'negot-nap-0-1-t10-2', proposerOwnerId: 0, responderOwnerId: 1,
  awaitingOwnerId: 1, authorOwnerId: 0, round: 1,
});
// Z — kolej gracza (awaitingOwnerId=0), niezależnie od tego kto proponował — „incoming".
const incomingPlayerTurn = entry({
  id: 'negot-nap-0-1-t10-3', proposerOwnerId: 1, responderOwnerId: 0,
  awaitingOwnerId: 0, authorOwnerId: 1, round: 1,
});

const OWNER_ID = 1; // AI, z którą negocjujemy
function getNegotiationsForPairSim(table, ownerId) {
  return table.filter(n =>
    (n.proposerOwnerId === ownerId && n.responderOwnerId === 0)
    || (n.proposerOwnerId === 0 && n.responderOwnerId === ownerId),
  );
}

const table = [aiInitiatedPlayerCountered, playerInitiatedAwaitingAi, incomingPlayerTurn];
const pairEntries = getNegotiationsForPairSim(table, OWNER_ID);
ok(pairEntries.length === 3, 'setup: wszystkie 3 wpisy widoczne dla pary (0,1) — getNegotiationsForPair');

const fixedIds = pairEntries.filter(n => livePredicate(n)).map(n => n.id);
ok(
  fixedIds.includes(aiInitiatedPlayerCountered.id),
  'NAPRAWA: wpis AI-inicjowany + skontrowany przez gracza (runda 2, „Kontroferta 2/3") jest w `ids` -> przycisk Przyjmij/Odrzuć REALNIE działa',
);
ok(fixedIds.includes(playerInitiatedAwaitingAi.id), 'brak regresji: wpis gracz-inicjowany + czeka AI nadal w `ids`');
ok(fixedIds.includes(incomingPlayerTurn.id), 'brak regresji: wpis kolej gracza (incoming) nadal w `ids`');
ok(fixedIds.length === 3, 'wszystkie 3 wpisy pary trafiają do `ids` (żaden nie ginie po cichu)');

// --- Odtworzenie STAREGO (błędnego) predykatu — dowód, że asercje wyżej faktycznie łapią
// regresję, nie tylko potwierdzają obecny stan (wymóg Evaluatora: udowodnij, że test pada
// na buggu, zanim uznasz go za gotowy).
function buggyPredicate(n, ownerId) {
  return n.awaitingOwnerId === 0 || (n.proposerOwnerId === 0 && n.awaitingOwnerId !== 0);
}
const buggyIds = pairEntries.filter(n => buggyPredicate(n, OWNER_ID)).map(n => n.id);
ok(
  !buggyIds.includes(aiInitiatedPlayerCountered.id),
  'META: stary (błędny) predykat FAKTYCZNIE reprodukuje bug — wpis AI-inicjowany+skontrowany wypada z `ids`',
);
ok(buggyIds.includes(playerInitiatedAwaitingAi.id), 'META: stary predykat NIE łamał wpisu gracz-inicjowanego (dlatego bug było łatwo przeoczyć)');
ok(buggyIds.includes(incomingPlayerTurn.id), 'META: stary predykat NIE łamał incoming (dlatego bug wyglądał na rzadki, nie systemowy)');

// ---------------------------------------------------------------------------
// CZĘŚĆ 3 — PĘTLA WYKONANIA: handleNegotiationAcceptPackage/RejectPackage wołają
// handleNegotiationAccept/Reject TYLKO dla id z `ids` (for (const id of ids) …) — potwierdź,
// że naprawiony predykat prowadzi do REALNEGO wykonania akcji, nie tylko poprawnej listy id.
// ---------------------------------------------------------------------------
{
  const calledFixed = [];
  for (const id of fixedIds) {
    if (table.some(n => n.id === id)) calledFixed.push(id);
  }
  ok(
    calledFixed.includes(aiInitiatedPlayerCountered.id),
    'PĘTLA WYKONANIA (po naprawie): handleNegotiationAccept faktycznie wołane dla wpisu „Kontroferta 2/3"',
  );

  const calledBuggy = [];
  for (const id of buggyIds) {
    if (table.some(n => n.id === id)) calledBuggy.push(id);
  }
  ok(
    !calledBuggy.includes(aiInitiatedPlayerCountered.id),
    'PĘTLA WYKONANIA (przed naprawą): handleNegotiationAccept NIGDY nie wołane dla tego wpisu -> Przyjmij/Odrzuć realnie nie działały',
  );
}

// ---------------------------------------------------------------------------
// CZĘŚĆ 4 — SPÓJNOŚĆ Z UI: filterActionableNegotiationRows (diplomacyAcceptanceBalance.ts,
// prawdziwy eksportowany import) musi zgadzać się z main.ts co do tego, który wpis jest
// „actionable" — dokładnie ta rozbieżność (UI: „Spełnia warunki — użyj Przyjmij"; silnik:
// milczenie) była źródłem zgłoszenia Macieja.
// ---------------------------------------------------------------------------
const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();
const ENTRY = path.resolve(__dirname, '.dip-pkg-ai-counter-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-pkg-ai-counter-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { filterActionableNegotiationRows } from '../src/ui/diplomacyAcceptanceBalance';
`);
esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});
const { filterActionableNegotiationRows } = require(BUNDLE);

// Wiersz UI odpowiadający aiInitiatedPlayerCountered — direction liczony TAK SAMO jak w
// main.ts::buildPendingNegotiationRows: `awaitingOwnerId===0 ? 'incoming' : 'own'`.
const uiRow = {
  id: aiInitiatedPlayerCountered.id,
  direction: aiInitiatedPlayerCountered.awaitingOwnerId === 0 ? 'incoming' : 'own',
  awaitingAiResponse: aiInitiatedPlayerCountered.awaitingOwnerId !== 0,
  actionLabel: 'Pakt nieagresji',
};
const uiActionable = filterActionableNegotiationRows([uiRow]);
ok(uiActionable.length === 1, 'UI: filterActionableNegotiationRows pokazuje ten wpis jako actionable (pasek Przyjmij/Odrzuć aktywny, tekst „Spełnia warunki")');
ok(
  fixedIds.includes(aiInitiatedPlayerCountered.id) === (uiActionable.length === 1),
  'SPÓJNOŚĆ UI<->SILNIK (po naprawie): main.ts `ids` i UI `filterActionableNegotiationRows` zgadzają się co do tego wpisu',
);
ok(
  buggyIds.includes(aiInitiatedPlayerCountered.id) !== (uiActionable.length === 1),
  'SPÓJNOŚĆ UI<->SILNIK (przed naprawą): UI mówił „actionable", silnik (stary predykat) milczał — dokładnie zgłoszony bug',
);

try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
