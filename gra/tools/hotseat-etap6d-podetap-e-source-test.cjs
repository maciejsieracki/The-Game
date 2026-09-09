'use strict';
/**
 * hotseat-etap6d-podetap-e-source-test.cjs — bramka R-HOTSEAT-ETAP6D-PODETAP-E-Q1.
 *
 * ŚCIEŻKI SILNIKOWE (kryteria dispatchu 1/2/5): 14 funkcji stołu negocjacyjnego
 * (`negotiationTable`) są głęboko zagnieżdżonymi domknięciami wewnątrz `boot()` w
 * main.ts — main.ts NIE da się zbundlować/wykonać samodzielnie (ten sam, udokumentowany
 * problem co `dyplo-karta-duplikat-komunikat-test.cjs`/`granice-relacja-dyplomatyczna-
 * test.cjs`: main.ts bootuje scenę przy imporcie). Ten test więc pracuje NA ŹRÓDLE
 * main.ts — brace-matched ekstrakcja ciała każdej z 14 funkcji, po czym:
 *
 *  (A) PO (bieżący worktree): ciało NIE zawiera już żadnego z wzorców hardkodu aktywnego
 *      fotela (`proposerOwnerId|responderOwnerId|awaitingOwnerId` `===0`/`!==0`, ani
 *      literału `0` jako drugiego argumentu do `ownerDeclareWarOn`/`getDiploRelation`/
 *      `setDiploRelation`/`applyDiploEventTracked`/`applyCounterOffer`) — i zawiera co
 *      najmniej jedno wywołanie `isMe(`/`ME()`.
 *  (B) PRZED (git HEAD, sprzed tej rundy): TE SAME ciała (te same 14 nazw) MAJĄ ten
 *      hardkod — dowód nietautologiczności (test faktycznie odróżnia stan sprzed migracji
 *      od stanu po niej; nie zawsze przechodziłby "przez przypadek").
 *  (C) `applyProposalOutcome`: ciało w PO jest BAJT-W-BAJT identyczne z ciałem w PRZED
 *      (kryterium 2 dispatchu — funkcja WYKLUCZONA z migracji, nietknięta).
 *
 * Uruchamianie z katalogu gra/: node tools/hotseat-etap6d-podetap-e-source-test.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA, '..');

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}

const FUNCTIONS = [
  'negotiationPartnerOwnerIdOf', 'resolveNegotiationEntryAt', 'resolvePendingNegotiationsForOwner',
  'handleNegotiationAccept', 'handleNegotiationCounter', 'handleNegotiationReject',
  'handleRequestAiNegotiationResponse', 'getNegotiationsForPair', 'negotiationSummary',
  'previewNegotiationEntry', 'collectTurnEvents', 'collectOpenDiploProposalQueue',
  'openDiplomacyAudienceForNegotiation', 'actionableNegotiationIdsForPair',
  'findIncomingNegotiationForAction',
];

/** Brace-matched wycięcie ciała `function NAME(...) { ... }` (obsługuje wieloliniowe
 *  sygnatury z wcięciami, jak w main.ts). Zwraca null, gdy nazwa nie znaleziona. */
function extractFunctionBody(src, name) {
  const sigRe = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = sigRe.exec(src);
  if (!m) return null;
  // Parametry mogą zawierać literały typu obiektowego z własnymi `{}` (np.
  // `siblingOverride?: { givePn: number; receivePn: number }`) -- trzeba najpierw
  // dopasować nawiasy OKRĄGŁE listy parametrów, dopiero PO nich szukać `{` ciała.
  const parenStart = src.indexOf('(', m.index);
  if (parenStart < 0) return null;
  let pdepth = 0;
  let parenEnd = -1;
  for (let i = parenStart; i < src.length; i++) {
    if (src[i] === '(') pdepth++;
    else if (src[i] === ')') {
      pdepth--;
      if (pdepth === 0) { parenEnd = i; break; }
    }
  }
  if (parenEnd < 0) return null;
  // Typ zwracany może też zawierać literał obiektowy w JEDNEJ linii (np.
  // `): { accepted: boolean; ... }` albo `): Array<{ id: string; ... }>`) -- taki
  // nawias TEŻ trzeba pominąć, żeby nie wziąć go za otwarcie ciała funkcji. Odróżnienie:
  // prawdziwe ciało funkcji zawsze rozciąga się na wiele linii, literał typu zwracanego
  // (w tym kodzie) jest zawsze zapisany w jednej linii.
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
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(m.index, i + 1);
    }
  }
  return null;
}

// Wzorzec hardkodu aktywnego fotela na polach negotiationTable (===0/!==0).
const FIELD_HARDCODE_RE = /\b(proposerOwnerId|responderOwnerId|awaitingOwnerId)\s*(===|!==)\s*0\b/;
// Literał 0 jako drugi argument do funkcji silnika dyplomacji operujących na parze.
const ARG_HARDCODE_RE = /\b(ownerDeclareWarOn|getDiploRelation|setDiploRelation|applyDiploEventTracked|applyCounterOffer)\(\s*[^,()]*,\s*0\s*[,)]/;

function hasHardcode(body) {
  return FIELD_HARDCODE_RE.test(body) || ARG_HARDCODE_RE.test(body);
}
function hasIsMeOrMe(body) {
  return /\bisMe\(|\bME\(\)/.test(body);
}

console.log('hotseat-etap6d-podetap-e-source-test (R-HOTSEAT-ETAP6D-PODETAP-E-Q1)\n');

const mainSrcPo = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
let mainSrcPrzed;
try {
  mainSrcPrzed = execSync('git show HEAD:gra/src/main.ts', { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch (e) {
  console.error('FAIL: nie udało się odczytać gra/src/main.ts z HEAD:', e.message);
  process.exit(1);
}

console.log('A/B. 14 funkcji stołu negocjacyjnego — PO czyste, PRZED miało hardkod (nietautologiczność)\n');
for (const name of FUNCTIONS) {
  const bodyPo = extractFunctionBody(mainSrcPo, name);
  const bodyPrzed = extractFunctionBody(mainSrcPrzed, name);
  ok(bodyPo !== null, `${name}: ciało PO znalezione w main.ts`);
  ok(bodyPrzed !== null, `${name}: ciało PRZED (HEAD) znalezione w main.ts`);
  if (bodyPo === null || bodyPrzed === null) continue;

  ok(!hasHardcode(bodyPo), `${name}: PO -- zero pozostałych literałów 0 (proposerOwnerId/responderOwnerId/awaitingOwnerId ===0/!==0 lub jako 2. argument)`);
  ok(hasIsMeOrMe(bodyPo), `${name}: PO -- zawiera isMe()/ME()`);
  ok(hasHardcode(bodyPrzed), `${name}: PRZED (HEAD) -- MIAŁO hardkod (dowód, że test nie jest tautologiczny -- odróżnia stan sprzed migracji)`);
}

console.log('\nC. applyProposalOutcome -- WYKLUCZONA z migracji, ciało nietknięte\n');
{
  const bodyPo = extractFunctionBody(mainSrcPo, 'applyProposalOutcome');
  const bodyPrzed = extractFunctionBody(mainSrcPrzed, 'applyProposalOutcome');
  ok(bodyPo !== null && bodyPrzed !== null, 'applyProposalOutcome: ciało znalezione w obu wersjach');
  ok(bodyPo === bodyPrzed, 'applyProposalOutcome: ciało PO === ciało PRZED, bajt w bajt (funkcja nietknięta)');
}

console.log(`\nhotseat-etap6d-podetap-e-source-test: ${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
