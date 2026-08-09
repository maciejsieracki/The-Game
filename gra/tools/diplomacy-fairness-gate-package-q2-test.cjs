'use strict';
/**
 * diplomacy-fairness-gate-package-q2-test.cjs — R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2=A.
 *
 * evaluateProposal-level math (packageSiblingGivePn/packageSiblingReceivePn) already ma
 * pełne pokrycie w diplomacy-proposal-test.cjs ("Q2: ..."), a panel (balancePanelDataFromRows,
 * BUG-PAKIET-BILANS-DODATNI-BLOKADA) w diplomacy-stol-pw-sum-test.cjs. Ten plik pokrywa
 * WARSTWĘ POŚREDNIĄ, której żaden z tamtych testów nie dotyka: main.ts jest closure'em
 * (handleNegotiationAcceptPackage nie jest eksportowalne przez esbuild-entry jak reszta
 * silnika) — więc, wzorem tools/border-march-wygasanie-test.cjs, weryfikujemy dwuwarstwowo:
 *
 * 1) ŹRÓDŁO (main.ts jako tekst) — snapshot-przed-wykonaniem naprawdę istnieje w kodzie
 *    (handleNegotiationAcceptPackage liczy siblingByTreatyId PRZED pętlą wykonania, nie
 *    live-scanuje stołu W TRAKCIE), bo bez tego evaluateProposal-level fix jest bezużyteczny
 *    w praktyce — kolejność wykonania pakietu (id sortowane alfabetycznie) zdejmowałaby
 *    sąsiada ze stołu PRZED oceną traktatu.
 *
 * 2) MECHANIZM (symulacja) — odtwarza DOKŁADNIE ten algorytm (naiwny live-scan vs snapshot)
 *    przy użyciu PRAWDZIWEGO evaluateProposal (ten sam import co diplomacy-proposal-test.cjs),
 *    żeby udowodnić, że snapshot naprawia realny scenariusz z alfabetycznym sortowaniem id
 *    ('negot-handel-…' < 'negot-umowa_szlakow-…' — handel wykonuje się PIERWSZY i znika ze
 *    stołu), a naiwny live-scan (bez snapshotu) faktycznie by się złamał.
 *
 * node tools/diplomacy-fairness-gate-package-q2-test.cjs
 */
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// CZĘŚĆ 1 — ŹRÓDŁO
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

const acceptPackageBody = fnBody('handleNegotiationAcceptPackage');
ok(acceptPackageBody != null, 'źródło: handleNegotiationAcceptPackage znaleziona');

if (acceptPackageBody) {
  const snapshotIdx = acceptPackageBody.indexOf('siblingByTreatyId');
  const execLoopIdx = acceptPackageBody.indexOf('handleNegotiationAccept(id');
  ok(snapshotIdx >= 0, 'źródło: siblingByTreatyId obecny w handleNegotiationAcceptPackage');
  ok(execLoopIdx >= 0, 'źródło: pętla wykonania handleNegotiationAccept(id, …) obecna');
  ok(
    snapshotIdx >= 0 && execLoopIdx >= 0 && snapshotIdx < execLoopIdx,
    'źródło: snapshot siblingByTreatyId liczony PRZED pętlą wykonania (nie live-scan w trakcie) — bez tego kolejność alfabetyczna id gubi kredyt pakietu',
  );
  // Snapshot musi być liczony na PEŁNYM `ids` (drugi argument packageSiblingPn), nie na
  // czymś już okrojonym przez wcześniejsze wykonanie.
  ok(
    /packageSiblingPn\([^)]*,\s*ids\)/.test(acceptPackageBody),
    'źródło: packageSiblingPn woła się z pełnym `ids` (snapshot całego pakietu), nie z tablicą mutowaną w locie',
  );
}

/**
 * Evaluator PASS-WITH-NOTES (injection test): poprzednia wersja tego pliku sprawdzała
 * TYLKO `indexOf('siblingByTreatyId') < indexOf('handleNegotiationAccept(id')` — to
 * przechodzi nawet gdy `packageSiblingPn(...)` jest WOŁANE NA ŻYWO wewnątrz pętli
 * wykonania (o ile sama deklaracja `const siblingByTreatyId = new Map(...)` tekstowo
 * poprzedza pętlę, co regresja może spełnić trywialnie). Realna ochrona: pętla, która
 * WOŁA `handleNegotiationAccept(id` (albo `resolveNegotiationEntryAt(ni` w
 * resolvePendingNegotiationsForOwner), NIE MOŻE zawierać w swoim ciele wywołania
 * `packageSiblingPn(` — snapshot musi być zbudowany w CAŁOŚCI PRZED, w oddzielnej pętli,
 * nie liczony pozycja-po-pozycji w trakcie wykonania (dokładnie regresja, którą Evaluator
 * wstrzyknął ręcznie i którą stary test przepuszczał 17/17).
 */
function nearestEnclosingForBlock(body, marker) {
  const markerIdx = body.indexOf(marker);
  if (markerIdx < 0) return null;
  const forRe = /for\s*\(/g;
  let m;
  let best = null;
  let bestStart = -1;
  while ((m = forRe.exec(body))) {
    const forKeywordStart = m.index;
    if (forKeywordStart > markerIdx) break;
    let parenDepth = 1;
    let j = forRe.lastIndex;
    while (parenDepth > 0 && j < body.length) {
      if (body[j] === '(') parenDepth++;
      else if (body[j] === ')') parenDepth--;
      j++;
    }
    const braceOpen = body.indexOf('{', j);
    if (braceOpen < 0) continue;
    let depth = 1;
    let p = braceOpen + 1;
    while (depth > 0 && p < body.length) {
      if (body[p] === '{') depth++;
      else if (body[p] === '}') depth--;
      p++;
    }
    const blockEnd = p;
    if (braceOpen < markerIdx && markerIdx < blockEnd && forKeywordStart > bestStart) {
      bestStart = forKeywordStart;
      best = body.slice(braceOpen + 1, blockEnd - 1);
    }
  }
  return best;
}

if (acceptPackageBody) {
  const execLoop = nearestEnclosingForBlock(acceptPackageBody, 'handleNegotiationAccept(id');
  ok(execLoop != null, 'źródło: pętla wykonania (for zawierające handleNegotiationAccept(id) znaleziona');
  ok(
    execLoop != null && !execLoop.includes('packageSiblingPn('),
    'źródło REALNA OCHRONA: pętla wykonania handleNegotiationAcceptPackage NIE zawiera wywołania packageSiblingPn( — snapshot zbudowany CAŁOŚCIOWO przed pętlą, nie liczony na żywo pozycja-po-pozycji',
  );
}

const resolvePendingBody = fnBody('resolvePendingNegotiationsForOwner');
ok(resolvePendingBody != null, 'źródło: resolvePendingNegotiationsForOwner znaleziona');
if (resolvePendingBody) {
  const execLoop2 = nearestEnclosingForBlock(resolvePendingBody, 'resolveNegotiationEntryAt(ni');
  ok(execLoop2 != null, 'źródło: pętla wykonania (for zawierające resolveNegotiationEntryAt(ni) znaleziona');
  ok(
    execLoop2 != null && !execLoop2.includes('packageSiblingPn('),
    'źródło REALNA OCHRONA: pętla wykonania resolvePendingNegotiationsForOwner NIE zawiera wywołania packageSiblingPn( — ta sama ochrona co handleNegotiationAcceptPackage',
  );
}

// Meta-test (wymóg Evaluatora: "verify this new assertion actually fails against the
// injected regression before finalizing") — odtwarzamy DOKŁADNIE wstrzykniętą regresję
// (packageSiblingPn wołane NA ŻYWO wewnątrz pętli wykonania, deklaracja Map nadal PRZED
// pętlą) jako syntetyczny tekst i dowodzimy, że nearestEnclosingForBlock ją wykrywa —
// gdyby tego nie robił, asercje wyżej byłyby równie ślepe jak stara wersja testu.
{
  const regressedBody = `
      const ids = actionableNegotiationIdsForPair(ownerId);
      const siblingByTreatyId = new Map();
      for (const id of ids) {
        if (negotiationTable.some(n => n.id === id)) {
          const entry = negotiationTable.find(n => n.id === id);
          const sibling = entry && isTreatyBaseFairnessAction(entry.actionId)
            ? packageSiblingPn(entry.proposerOwnerId, entry.responderOwnerId, id, ids)
            : undefined;
          handleNegotiationAccept(id, sibling);
        }
      }
  `;
  const regressedExecLoop = nearestEnclosingForBlock(regressedBody, 'handleNegotiationAccept(id');
  ok(
    regressedExecLoop != null && regressedExecLoop.includes('packageSiblingPn('),
    'META: nearestEnclosingForBlock WYKRYWA syntetyczną regresję Evaluatora (packageSiblingPn na żywo w pętli, mimo że deklaracja Map nadal tekstowo poprzedza pętlę) — dowód, że nowa asercja nie jest ślepa jak stara (indexOf-only)',
  );
  // I odwrotnie — kontrola pozytywna: prawdziwy (nieregresyjny) kod PRZECHODZI tę samą funkcję.
  ok(
    acceptPackageBody != null
      && nearestEnclosingForBlock(acceptPackageBody, 'handleNegotiationAccept(id') != null
      && !nearestEnclosingForBlock(acceptPackageBody, 'handleNegotiationAccept(id').includes('packageSiblingPn('),
    'META: ten sam mechanizm na PRAWDZIWYM (naprawionym) kodzie main.ts nie zgłasza fałszywego alarmu',
  );
}

// packageSiblingPn zwraca `{ givePn: number; receivePn: number }` jako typ w SYGNATURZE —
// ten obiektowy typ zwrotny zawiera własną parę { } PRZED ciałem funkcji, więc generyczny
// fnBody() (dopasowanie do pierwszego '{') łapie return-type, nie ciało. Zamiast tego —
// okno tekstowe od deklaracji do KOLEJNEJ funkcji, którą wiemy że po niej następuje.
const packageSiblingPnStart = src.indexOf('function packageSiblingPn(');
const livePackageSiblingStart = src.indexOf('function livePackageSiblingFor(');
ok(packageSiblingPnStart >= 0, 'źródło: packageSiblingPn znaleziona');
ok(livePackageSiblingStart > packageSiblingPnStart, 'źródło: livePackageSiblingFor znaleziona po packageSiblingPn');
const packageSiblingPnWindow = (packageSiblingPnStart >= 0 && livePackageSiblingStart > packageSiblingPnStart)
  ? src.slice(packageSiblingPnStart, livePackageSiblingStart)
  : '';
ok(
  packageSiblingPnWindow.includes('TREATY_GATED_NEGOTIATION_ACTIONS'),
  // KOREKTA (Evaluator #4): wykluczenie NIE chroni przed dwoma traktatami handlowymi na
  // jednym stole czerpiącymi z tego samego sąsiada (nieosiągalne dziś inaczej niż z legacy
  // save) — faktycznie zapobiega, żeby dedykowany koszyk `pokoj` zasilał TEŻ próg traktatu
  // handlowego jako „sąsiad". Patrz komentarz przy TREATY_GATED_NEGOTIATION_ACTIONS w main.ts.
  'źródło: packageSiblingPn pomija akcje z WŁASNĄ bramką treatyBaseFairnessGap (pokoj/umowa_szlakow/umowa_handlowa) — koszyk pokoj (baza 500 PW) nie zasila też progu traktatu handlowego jako sąsiad',
);

ok(
  /function previewNegotiationEntry\(\s*entry: PendingNegotiation,\s*siblingOverride/.test(src),
  'źródło: previewNegotiationEntry przyjmuje siblingOverride',
);
ok(
  /function resolveNegotiationEntryAt\(\s*ni: number,\s*siblingOverride/.test(src),
  'źródło: resolveNegotiationEntryAt przyjmuje siblingOverride',
);
ok(
  src.includes('packageSiblingGivePn: sibling?.givePn') && src.includes('packageSiblingReceivePn: sibling?.receivePn'),
  'źródło: buildProposalEvalContext przekazuje sibling do ProposalEvalContext.packageSiblingGivePn/receivePn',
);

const DP_TS = path.join(__dirname, '..', 'src', 'game', 'diplomacy-proposals.ts');
const dpSrc = fs.readFileSync(DP_TS, 'utf8');
ok(
  dpSrc.includes('ctx.packageSiblingGivePn') && dpSrc.includes('ctx.packageSiblingReceivePn'),
  'źródło: evaluateProposal (case umowa_szlakow/umowa_handlowa) czyta ctx.packageSiblingGivePn/receivePn',
);

// ---------------------------------------------------------------------------
// CZĘŚĆ 2 — MECHANIZM (symulacja z prawdziwym evaluateProposal)
// ---------------------------------------------------------------------------

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ENTRY = path.resolve(__dirname, '.dip-fairness-q2-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-fairness-q2-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { evaluateProposal } from '../src/game/diplomacy-proposals.ts';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
  loader: { '.json': 'json' },
});
const { evaluateProposal } = require(BUNDLE);

// Stół: 2 wpisy negocjacji gracz(0)→AI(1), ten sam kierunek — dokładnie scenariusz zgłoszenia
// (traktat handlowy bez własnego koszyka + osobny handel pokrywający deficyt). Id-formaty jak
// main.ts makeNegotiationId: `negot-{actionId}-{p0}-{p1}-t{turn}-{seq}` — 'h' < 'u', więc
// actionableNegotiationIdsForPair (sort localeCompare) wykonuje handel PRZED umowa_szlakow.
const table = [
  {
    id: 'negot-handel-0-1-t10-1',
    actionId: 'handel',
    proposerOwnerId: 0,
    responderOwnerId: 1,
    payload: { givePn: 54, receivePn: 0 },
  },
  {
    id: 'negot-umowa_szlakow-0-1-t10-2',
    actionId: 'umowa_szlakow',
    proposerOwnerId: 0,
    responderOwnerId: 1,
    payload: { turns: 20 },
  },
];
ok(
  [...table].sort((a, b) => a.id.localeCompare(b.id))[0].id === table[0].id,
  'setup: sortowanie alfabetyczne id wykonuje handel PRZED umowa_szlakow (reprodukuje realną kolejność silnika)',
);

const TREATY_GATED = new Set(['pokoj', 'umowa_szlakow', 'umowa_handlowa']);
function packageSiblingPnSim(liveTable, proposerId, responderId, excludeId, scopeIds) {
  let givePn = 0, receivePn = 0;
  for (const n of liveTable) {
    if (n.id === excludeId) continue;
    if (n.proposerOwnerId !== proposerId || n.responderOwnerId !== responderId) continue;
    if (TREATY_GATED.has(n.actionId)) continue;
    if (scopeIds && !scopeIds.includes(n.id)) continue;
    givePn += n.payload.givePn ?? 0;
    receivePn += n.payload.receivePn ?? 0;
  }
  return { givePn, receivePn };
}

// lowTradeCtx z diplomacy-proposal-test.cjs — rel(25,25) → relTotal 50 pkt → deficyt 40 PW.
const lowTradeCtx = {
  relation: { zaufanie: 25, respekt: 25, status: 'pokoj' },
  responderPlayer: { typCywilizacji: 'zulusi' },
  proposerPlayer: { typCywilizacji: 'rzymianie' },
};

function evalTreaty(entry, sibling) {
  return evaluateProposal(
    { actionId: entry.actionId, proposerOwnerId: entry.proposerOwnerId, responderOwnerId: entry.responderOwnerId, payload: entry.payload },
    { ...lowTradeCtx, packageSiblingGivePn: sibling?.givePn, packageSiblingReceivePn: sibling?.receivePn },
  );
}

// --- Naiwna implementacja (BEZ snapshotu) — live scan PO tym, jak wcześniejsze pozycje
// pakietu zostały wykonane i zdjęte ze stołu. Reprodukuje DOKŁADNIE bug opisany w zadaniu
// (item 3): "execution loop independently re-rejects an item that the package-level check
// already approved".
{
  const liveTable = table.map(e => ({ ...e }));
  const ids = liveTable.map(e => e.id).sort((a, b) => a.localeCompare(b));
  const results = {};
  for (const id of ids) {
    const idx = liveTable.findIndex(e => e.id === id);
    if (idx < 0) continue;
    const entry = liveTable[idx];
    const sibling = TREATY_GATED.has(entry.actionId)
      ? packageSiblingPnSim(liveTable, entry.proposerOwnerId, entry.responderOwnerId, entry.id)
      : undefined;
    const r = evalTreaty(entry, sibling);
    results[entry.actionId] = r;
    liveTable.splice(idx, 1); // main.ts: negotiationTable.splice — pozycja znika ze stołu
  }
  ok(results.handel.accepted === true, 'naiwny live-scan: handel (nietraktatowy) wykonuje się i przechodzi niezależnie');
  ok(
    results.umowa_szlakow.accepted === false,
    'naiwny live-scan REPRODUKUJE BUG: umowa_szlakow oceniana PO usunięciu handel ze stołu — sąsiad już zniknął, gap=40>0, fałszywe odrzucenie mimo że panel PRZED kliknięciem pokazywał pakiet jako dodatni',
  );
}

// --- Implementacja ZAIMPLEMENTOWANA (ZE snapshotem) — dokładnie handleNegotiationAcceptPackage:
// siblingByTreatyId liczony RAZ na pełnym `ids`, PRZED jakimkolwiek wykonaniem.
{
  const liveTable = table.map(e => ({ ...e }));
  const ids = liveTable.map(e => e.id).sort((a, b) => a.localeCompare(b));
  const siblingByTreatyId = new Map();
  for (const id of ids) {
    const entry = liveTable.find(e => e.id === id);
    if (entry && TREATY_GATED.has(entry.actionId)) {
      siblingByTreatyId.set(id, packageSiblingPnSim(liveTable, entry.proposerOwnerId, entry.responderOwnerId, id, ids));
    }
  }
  const results = {};
  for (const id of ids) {
    const idx = liveTable.findIndex(e => e.id === id);
    if (idx < 0) continue;
    const entry = liveTable[idx];
    const sibling = siblingByTreatyId.get(id);
    const r = evalTreaty(entry, sibling);
    results[entry.actionId] = r;
    liveTable.splice(idx, 1);
  }
  ok(results.handel.accepted === true, 'snapshot: handel nadal przechodzi niezależnie');
  ok(
    results.umowa_szlakow.accepted === true,
    'snapshot NAPRAWIA BUG: umowa_szlakow ocenia sąsiada ZE SNAPSHOTU sprzed wykonania (54 PW), niezależnie od tego że handel już zniknął ze stołu — decyzja spójna z tym, co pokazał panel',
  );
}

try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }

console.log(`diplomacy-fairness-gate-package-q2-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
