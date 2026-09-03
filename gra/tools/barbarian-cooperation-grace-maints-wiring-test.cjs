'use strict';
/**
 * barbarian-cooperation-grace-maints-wiring-test.cjs
 *
 * R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1 (GOAL 2/3), RUNDA 2 — dowod ZYWEGO wpiecia
 * mechanizmu karencji w main.ts w DOKLADNIE trzech punktach z decision-abc.md rundy 1:
 *   (1) runDiplomacyTurnTick() — recordBarbarianCooperationGrace przy naturalnym wygasnieciu,
 *   (2) breakTreatyVoluntarily(dealId, ...) — to samo przy jednostronnym zerwaniu,
 *   (3) resolveBorderMarchCtx (budowa BorderMarchCheckContext dla
 *       applyUnauthorizedBorderPenalties) — dopiecie barbarianCooperationGrace/turn.
 *
 * REGULA PRZECIW SAMOOSZUKIWANIU: `barbarian-cooperation-grace-test.cjs` (runda 1) dowodzi
 * poprawnosci SAMYCH czystych funkcji w diplomacy-treaties.ts/diplomacy-border-march.ts —
 * NIE dowodzi, ze main.ts faktycznie je woła. Ten plik wycina DOSLOWNIE trzy fragmenty ze
 * ZRODLA src/main.ts (indexOf na unikalnych kotwicach "decision-abc.md pkt N" dopisanych w
 * tej rundzie) i WYKONUJE JE SAME jako funkcje w harnessie — nie kopie recznie przepisane.
 * Gdy kod w main.ts sie przesunie/zniknie, kotwica nie zostanie znaleziona i test PADA
 * (throw), zamiast cicho testowac nieaktualna kopie. Scenariusz: dokladnie taki jak zadany
 * w rundzie 2 — traktat wygasa/zostaje zerwany -> jednostka wojskowa partnera na terytorium
 * przez 3 tury BEZ kary Zaufania -> w turze 4 kara wraca; panel "Aktywne traktaty" (slicony
 * activeTreatiesForPair) nie pokazuje juz nieistniejacego traktatu.
 *
 * Usage (z gra/): node tools/barbarian-cooperation-grace-maints-wiring-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const MAIN_TS = path.resolve(__dirname, '..', 'src', 'main.ts');
const ENTRY = path.resolve(__dirname, '.bcg-mtw-entry.ts');
const BUNDLE = path.resolve(__dirname, '.bcg-mtw-bundle.cjs');

let pass = 0;
let fail = 0;
function ok(value, message) {
  if (value) { pass++; console.log('  OK:', message); }
  else { fail++; console.error('  FAIL:', message); }
}

/** Wycina [head..tail) ze zrodla main.ts; rzuca, gdy kotwica sie nie znajduje (kod sie przesunal). */
function sliceMain(src, head, tail) {
  const i = src.indexOf(head);
  if (i < 0) throw new Error('main.ts: nie znaleziono kotwicy poczatkowej: ' + JSON.stringify(head));
  const j = src.indexOf(tail, i + head.length);
  if (j < 0) throw new Error('main.ts: nie znaleziono kotwicy koncowej: ' + JSON.stringify(tail));
  return src.slice(i, j).trim();
}

function main() {
  const src = fs.readFileSync(MAIN_TS, 'utf8');

  // --- (1) runDiplomacyTurnTick — blok naturalnego wygasniecia (decision-abc.md pkt 1) ---
  const HEAD1 = "if (kindExpired === RodzajTraktatu.WspolnaWalkaBarbarzyncy || d.wspolnaWalkaBarbarzyncy === true) {";
  const TAIL1 = "if (kindExpired === 'sojusz_defensywny'";
  const slice1 = sliceMain(src, HEAD1, TAIL1);
  ok(slice1.includes('recordBarbarianCooperationGrace') && slice1.includes('BARBARIAN_COOPERATION_TURNS'),
    '(recon) fragment (1) wyciety z main.ts zawiera recordBarbarianCooperationGrace + BARBARIAN_COOPERATION_TURNS');

  // --- (2) breakTreatyVoluntarily — blok jednostronnego zerwania (decision-abc.md pkt 2) ---
  const HEAD2 = "if (normalizeTreatyKind(deal.rodzaj) === RodzajTraktatu.WspolnaWalkaBarbarzyncy || deal.wspolnaWalkaBarbarzyncy === true) {";
  const TAIL2 = "const cur = getDiploRelation(a, b);";
  const slice2 = sliceMain(src, HEAD2, TAIL2);
  ok(slice2.includes('recordBarbarianCooperationGrace') && slice2.includes('BARBARIAN_COOPERATION_TURNS'),
    '(recon) fragment (2) wyciety z main.ts zawiera recordBarbarianCooperationGrace + BARBARIAN_COOPERATION_TURNS');

  // --- (3) resolveBorderMarchCtx — budowa BorderMarchCheckContext (decision-abc.md pkt 3) ---
  const HEAD3 = 'const resolveBorderMarchCtx = (pair: BorderMarchPair): BorderMarchCheckContext => ({';
  const TAIL3 = 'const { relations, penalizedPairs } = applyUnauthorizedBorderPenalties(';
  const slice3raw = sliceMain(src, HEAD3, TAIL3);
  const slice3 = slice3raw.endsWith(');') ? slice3raw : slice3raw + ';';
  ok(slice3.includes('barbarianCooperationGrace') && slice3.includes('turn,'),
    '(recon) fragment (3) wyciety z main.ts zawiera pola barbarianCooperationGrace/turn w BorderMarchCheckContext');

  // --- panel "Aktywne traktaty" — activeTreatiesForPair (bez zmian tej rundy, weryfikacja skutku) ---
  const HEAD4 = 'function activeTreatiesForPair(a: number, b: number): {';
  const TAIL4 = 'function syncRelationFromDeals(a: number, b: number): void {';
  const slice4 = sliceMain(src, HEAD4, TAIL4);

  const entry = [
    "import { RodzajTraktatu } from '../src/types/diplomacy';",
    "import {",
    "  type ActiveDeal, type BarbarianCooperationGraceState,",
    "  addTreaty, expireTreaties, removeTreatiesById, normalizeTreatyKind,",
    "  recordBarbarianCooperationGrace, hasBarbarianCooperationTreaty,",
    "} from '../src/game/diplomacy-treaties';",
    "import {",
    "  hasAuthorizedBorderCrossing, applyUnauthorizedBorderPenalties,",
    "  type BorderMarchPair, type BorderMarchCheckContext,",
    "} from '../src/game/diplomacy-border-march';",
    "import { BARBARIAN_COOPERATION_TURNS } from '../src/game/diplomacy-barbarian-cooperation';",
    "",
    "// ============ (1) DOSLOWNIE wyciete z src/main.ts (runDiplomacyTurnTick) ============",
    "export function point1_onExpire(",
    "  d: ActiveDeal, kindExpired: ReturnType<typeof normalizeTreatyKind>, pa: number, pb: number,",
    "  turn: number, barbarianCooperationGraceIn: BarbarianCooperationGraceState,",
    "): BarbarianCooperationGraceState {",
    "  let barbarianCooperationGrace = barbarianCooperationGraceIn;",
    "  " + slice1,
    "  return barbarianCooperationGrace;",
    "}",
    "",
    "// ============ (2) DOSLOWNIE wyciete z src/main.ts (breakTreatyVoluntarily) ============",
    "export function point2_onVoluntaryBreak(",
    "  deal: ActiveDeal, a: number, b: number, turn: number,",
    "  barbarianCooperationGraceIn: BarbarianCooperationGraceState,",
    "): BarbarianCooperationGraceState {",
    "  let barbarianCooperationGrace = barbarianCooperationGraceIn;",
    "  " + slice2,
    "  return barbarianCooperationGrace;",
    "}",
    "",
    "// ============ (3) DOSLOWNIE wyciete z src/main.ts (resolveBorderMarchCtx) ============",
    "export function point3_buildResolveCtx(",
    "  activeDeals: readonly ActiveDeal[],",
    "  barbarianCooperationGrace: BarbarianCooperationGraceState,",
    "  turn: number,",
    ") {",
    "  const getDiploRelation = (_a: number, _b: number) => ({ status: 'neutralni' as const, zaufanie: 20, respekt: 30 });",
    "  " + slice3,
    "  return resolveBorderMarchCtx;",
    "}",
    "",
    "// ============ panel — DOSLOWNIE wyciete z src/main.ts (activeTreatiesForPair) ============",
    "// `activeDeals`/`turn` sa w main.ts zmiennymi domkniecia (closure) tej samej funkcji IIFE",
    "// co activeTreatiesForPair — tutaj dostarczone przez fabryke, zeby ten sam, doslowny",
    "// kod funkcji zadzialal bez zmiany ani jednego znaku.",
    "function dealInvolvesOwners(deal: ActiveDeal, a: number, b: number): boolean {",
    "  const [p0, p1] = a < b ? [a, b] : [b, a];",
    "  return deal.strony[0] === p0 && deal.strony[1] === p1;",
    "}",
    "function treatyDisplayLabel(_r: unknown): string { return 'Wspolna walka z barbarzyncami'; }",
    "function treatyBreakPenaltyLabel(_d: ActiveDeal): string { return ''; }",
    "export function activeTreatiesForPairFactory(activeDeals: readonly ActiveDeal[], turn: number) {",
    "  " + slice4,
    "  return activeTreatiesForPair;",
    "}",
    "",
    "export { hasAuthorizedBorderCrossing, applyUnauthorizedBorderPenalties, addTreaty, expireTreaties, removeTreatiesById, hasBarbarianCooperationTreaty, normalizeTreatyKind, BARBARIAN_COOPERATION_TURNS };",
    "",
  ].join('\n');
  fs.writeFileSync(ENTRY, entry, 'utf8');

  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  });
  const M = require(BUNDLE);

  const A = 0; // gracz
  const B = 2; // AI partner
  function ctxWith(deals, grace, turn) {
    const base = M.point3_buildResolveCtx(deals, grace, turn);
    const pair = { intruderOwnerId: B, territoryOwnerId: A, isMilitary: true };
    return base(pair);
  }
  function penaltyAt(deals, grace, turn) {
    const relations = new Map([[`${A}_${B}`, { zaufanie: 20, respekt: 30, status: 'neutralni' }]]);
    const pairs = [{ intruderOwnerId: B, territoryOwnerId: A, isMilitary: true }];
    const params = { karaPrzemarszNieautoryzowany_zaufanie_perTura: 5 };
    const resolveCtx = M.point3_buildResolveCtx(deals, grace, turn);
    return M.applyUnauthorizedBorderPenalties(pairs, relations, params, resolveCtx);
  }

  console.log('\n--- Scenariusz 1: NATURALNE WYGASNIECIE, wpiecie main.ts (punkt 1 + punkt 3) ---');
  let deals = M.addTreaty([], {
    id: 'coop-natural', rodzaj: 'wspolna_walka_barbarzyncy', strony: [A, B],
    wygasaTura: 10, zawartaTura: 5, wspolnaWalkaBarbarzyncy: true,
  });
  ok(M.hasAuthorizedBorderCrossing(B, A, ctxWith(deals, [], 9)),
    'przed wygasnieciem (t.9): jednostka wojskowa partnera na terytorium — autoryzowana, umowa aktywna');

  const dealsBefore = deals;
  deals = M.expireTreaties(deals, 10);
  ok(deals.length === 0, 'traktat naprawde znika z activeDeals na granicy wygasaTura=10 (bez kikuta)');
  let grace = [];
  for (const d of dealsBefore) {
    if (deals.some(x => x.id === d.id)) continue;
    const kindExpired = M.normalizeTreatyKind ? M.normalizeTreatyKind(d.rodzaj) : d.rodzaj;
    const [pa, pb] = d.strony;
    grace = M.point1_onExpire(d, kindExpired, pa, pb, 10, grace);
  }
  ok(grace.length === 1 && grace[0].graceUntilTurn === 12,
    'PUNKT 1 (wyciety z main.ts): wygasniecie w t.10 zapisuje karencje do t.12 wlacznie (10+3-1)');

  console.log('  Jednostka wojskowa partnera (AI, ownerId=2) pozostaje na terytorium gracza (ownerId=0) przez 3 tury karencji:');
  for (const t of [10, 11, 12]) {
    ok(M.hasAuthorizedBorderCrossing(B, A, ctxWith(deals, grace, t)),
      `  tura ${t} (karencja, wpiecie main.ts): przemarsz nadal autoryzowany`);
    const res = penaltyAt(deals, grace, t);
    ok(res.penalizedPairs === 0 && res.relations.get(`${A}_${B}`).zaufanie === 20,
      `  tura ${t} (karencja, wpiecie main.ts): ZERO kary Zaufania (nadal 20)`);
  }
  ok(!M.hasAuthorizedBorderCrossing(B, A, ctxWith(deals, grace, 13)),
    'tura 13 (4. od wygasniecia, wpiecie main.ts): przemarsz JUZ nieautoryzowany');
  {
    const res = penaltyAt(deals, grace, 13);
    ok(res.penalizedPairs === 1 && res.relations.get(`${A}_${B}`).zaufanie === 15,
      'tura 13 (4. od wygasniecia, wpiecie main.ts): kara Zaufania faktycznie wraca (20 -> 15)');
  }

  console.log('\n--- Panel "Aktywne traktaty" (activeTreatiesForPair, wyciety z main.ts) ---');
  const panelAfterExpire = M.activeTreatiesForPairFactory(deals, 13)(A, B);
  ok(Array.isArray(panelAfterExpire) && panelAfterExpire.length === 0,
    'panel "Aktywne traktaty" (main.ts activeTreatiesForPair) NIE pokazuje wygaslego traktatu WspolnaWalkaBarbarzyncy');

  console.log('\n--- Scenariusz 2: JEDNOSTRONNE ZERWANIE, wpiecie main.ts (punkt 2 + punkt 3) ---');
  let deals2 = M.addTreaty([], {
    id: 'coop-voluntary', rodzaj: 'wspolna_walka_barbarzyncy', strony: [A, B],
    wygasaTura: 25, zawartaTura: 2, wspolnaWalkaBarbarzyncy: true,
  });
  ok(M.hasAuthorizedBorderCrossing(B, A, ctxWith(deals2, [], 7)),
    'przed zerwaniem (t.7): umowa daleko od naturalnego konca, autoryzuje przemarsz');
  const panelBeforeBreak = M.activeTreatiesForPairFactory(deals2, 7)(A, B);
  ok(panelBeforeBreak.length === 1 && panelBeforeBreak[0].id === 'coop-voluntary',
    'panel "Aktywne traktaty" PRZED zerwaniem: traktat WspolnaWalkaBarbarzyncy widoczny (kontrola nietautologicznosci)');

  const dealToBreak = deals2.find(d => d.id === 'coop-voluntary');
  deals2 = M.removeTreatiesById(deals2, ['coop-voluntary']);
  ok(deals2.length === 0, 'PUNKT 2 (wyciety z main.ts, breakTreatyVoluntarily): removeTreatiesById faktycznie usuwa traktat z activeDeals');
  let grace2 = M.point2_onVoluntaryBreak(dealToBreak, A, B, 7, []);
  ok(grace2.length === 1 && grace2[0].graceUntilTurn === 9,
    'PUNKT 2 (wyciety z main.ts): zerwanie w t.7 zapisuje karencje do t.9 wlacznie (7+3-1)');

  for (const t of [7, 8, 9]) {
    ok(M.hasAuthorizedBorderCrossing(B, A, ctxWith(deals2, grace2, t)),
      `  zerwanie dobrowolne, tura ${t} (karencja, wpiecie main.ts): przemarsz nadal autoryzowany`);
    ok(penaltyAt(deals2, grace2, t).penalizedPairs === 0,
      `  zerwanie dobrowolne, tura ${t} (karencja, wpiecie main.ts): ZERO kary`);
  }
  ok(!M.hasAuthorizedBorderCrossing(B, A, ctxWith(deals2, grace2, 10)),
    'zerwanie dobrowolne: tura 10 (4. od usuniecia, wpiecie main.ts) — przemarsz nieautoryzowany');
  ok(penaltyAt(deals2, grace2, 10).penalizedPairs === 1,
    'zerwanie dobrowolne: tura 10 (wpiecie main.ts) — kara faktycznie naliczona');

  const panelAfterBreak = M.activeTreatiesForPairFactory(deals2, 10)(A, B);
  ok(panelAfterBreak.length === 0,
    'panel "Aktywne traktaty" (main.ts activeTreatiesForPair) NIE pokazuje zerwanego traktatu WspolnaWalkaBarbarzyncy');

  console.log('\n--- Nietautologicznosc: inny rodzaj traktatu (NAP) w tej samej sciezce (1) NIE otwiera karencji ---');
  let grace3 = [];
  const napDeal = { id: 'nap-x', rodzaj: 'pakt_nieagresji', strony: [A, B], wygasaTura: 10, zawartaTura: 5 };
  grace3 = M.point1_onExpire(napDeal, 'pakt_nieagresji', A, B, 10, grace3);
  ok(grace3.length === 0, 'PUNKT 1: wygasniecie traktatu INNEGO rodzaju (NAP) nie tworzy wpisu karencji (dowod, ze warunek faktycznie filtruje po rodzaju)');

  try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ }
  try { fs.unlinkSync(BUNDLE); } catch (_) { /* ok */ }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
}

main();
