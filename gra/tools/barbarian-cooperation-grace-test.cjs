'use strict';
// R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1 (GOAL 2) — okres karencji po wygaśnięciu/
// jednostronnym usunięciu traktatu WspolnaWalkaBarbarzyncy. REGUŁA PRZECIW SAMOOSZUKIWANIU
// (dispatch): sprawdza KAŻDĄ z 3 tur karencji z osobna ORAZ turę 4 (kara wraca) — nie
// tylko jedną turę losowo. Zgodnie z raportem rundy 1: mechanizm karencji jest DZIŚ
// zaprojektowany i przetestowany jako czyste funkcje (diplomacy-treaties.ts +
// diplomacy-border-march.ts), NIE wpięty w main.ts (poza allowlistą tej rundy) — ten test
// dowodzi poprawności samego mechanizmu, nie jego live-wiringu w grze.
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.barb-grace-entry.ts');
const bundle = path.resolve(__dirname, '.barb-grace-bundle.cjs');
fs.writeFileSync(entry, `
export {
  addTreaty, expireTreaties, removeTreatiesById, hasBarbarianCooperationTreaty,
  recordBarbarianCooperationGrace, pruneExpiredBarbarianCooperationGrace,
  isBarbarianCooperationGraceActive,
} from '../src/game/diplomacy-treaties.ts';
export { hasAuthorizedBorderCrossing, applyUnauthorizedBorderPenalties } from '../src/game/diplomacy-border-march.ts';
export { BARBARIAN_COOPERATION_TURNS } from '../src/game/diplomacy-barbarian-cooperation.ts';
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
const M = require(bundle);
let pass = 0; let fail = 0;
function ok(value, message) { if (value) { pass++; console.log('  OK:', message); } else { fail++; console.error('  FAIL:', message); } }

const A = 0; // gracz
const B = 2; // AI

function ctxFor(deals, grace, turn) {
  return {
    treaties: deals,
    isMilitary: true,
    relation: { status: 'neutralni', zaufanie: 20, respekt: 30 },
    barbarianCooperationGrace: grace,
    turn,
  };
}
const RELKEY = `${Math.min(A, B)}_${Math.max(A, B)}`; // diploPairKey (diplomacy-pn-engine.ts): min_max
function penaltyFor(deals, grace, turn, relZaufanie = 20) {
  const relations = new Map([[RELKEY, { zaufanie: relZaufanie, respekt: 30, status: 'neutralni' }]]);
  const pairs = [{ intruderOwnerId: B, territoryOwnerId: A }];
  const params = { karaPrzemarszNieautoryzowany_zaufanie_perTura: 5 };
  const resolveCtx = () => ctxFor(deals, grace, turn);
  return M.applyUnauthorizedBorderPenalties(pairs, relations, params, resolveCtx);
}

// --- Scenariusz 1: NATURALNE WYGAŚNIĘCIE (GOAL 1 czas wybrany: 5 tur, zawarta t.5 -> wygasaTura=10) ---
let deals = M.addTreaty([], {
  id: 'coop-natural', rodzaj: 'wspolna_walka_barbarzyncy', strony: [A, B],
  wygasaTura: 10, zawartaTura: 5, wspolnaWalkaBarbarzyncy: true,
});
ok(M.hasAuthorizedBorderCrossing(B, A, ctxFor(deals, [], 9)), 'aktywna umowa autoryzuje przemarsz PRZED wygaśnięciem (t.9)');
ok(M.hasBarbarianCooperationTreaty(deals, A, B), 'aktywna umowa daje też prawo do współpracy bojowej (GOAL4: nietknięte)');

deals = M.expireTreaties(deals, 10); // wygasaTura(10) > 10 === false -> usunięta z activeDeals
ok(deals.length === 0, 'traktat naprawdę znika z activeDeals na granicy własnego wygasaTura (bez kikuta — patrz JSDoc w diplomacy-treaties.ts)');
ok(!M.hasAuthorizedBorderCrossing(B, A, ctxFor(deals, [], 10)), 'BEZ zapisanej karencji (ctx.barbarianCooperationGrace pominięte) — kara wraca od razu (backward-compatible, zero zmian domyślnego zachowania)');

let grace = M.recordBarbarianCooperationGrace([], A, B, 10 + M.BARBARIAN_COOPERATION_TURNS - 1); // graceUntilTurn = 12
ok(!M.hasBarbarianCooperationTreaty(deals, A, B), 'w karencji NIE MA już współpracy bojowej (traktat usunięty z activeDeals, GOAL4 nietknięte)');

// Dokładnie 3 tury karencji z osobna: t.10, t.11, t.12 -> autoryzowane, ZERO kary.
for (const t of [10, 11, 12]) {
  ok(M.hasAuthorizedBorderCrossing(B, A, ctxFor(deals, grace, t)), `karencja tura ${t}: przemarsz nadal autoryzowany`);
  const res = penaltyFor(deals, grace, t);
  ok(res.penalizedPairs === 0, `karencja tura ${t}: ZERO kar Zaufania`);
  ok(res.relations.get(RELKEY).zaufanie === 20, `karencja tura ${t}: Zaufanie NIE spadło (nadal 20)`);
}
// Tura 4 od wygaśnięcia (t.13) -> kara wraca do naliczania normalnie.
ok(!M.hasAuthorizedBorderCrossing(B, A, ctxFor(deals, grace, 13)), 'tura 13 (4. od wygaśnięcia): przemarsz JUŻ nieautoryzowany');
{
  const res = penaltyFor(deals, grace, 13);
  ok(res.penalizedPairs === 1, 'tura 13: kara Zaufania wraca do naliczania');
  ok(res.relations.get(RELKEY).zaufanie === 15, 'tura 13: Zaufanie spadło o karę (20 -> 15)');
}
{
  const pruned = M.pruneExpiredBarbarianCooperationGrace(grace, 13);
  ok(pruned.length === 0, 'pruneExpiredBarbarianCooperationGrace usuwa wpis po minięciu okna (analogon expireTreaties)');
}

// --- Scenariusz 2: JEDNOSTRONNE USUNIĘCIE (GOAL 3: istniejący przycisk "Zerwij" -> removeTreatiesById) ---
// Traktat zawarty na 15 tur (wygasaTura=25), zerwany dobrowolnie w turze 7 — DALEKO przed
// naturalnym końcem. Kryterium 3 dispatchu: "uruchamia TEN SAM mechanizm karencji co
// naturalne wygaśnięcie" — ten sam recordBarbarianCooperationGrace, zakotwiczony na
// turze USUNIĘCIA (7), nie na oryginalnym wygasaTura (25).
let deals2 = M.addTreaty([], {
  id: 'coop-voluntary', rodzaj: 'wspolna_walka_barbarzyncy', strony: [A, B],
  wygasaTura: 25, zawartaTura: 2, wspolnaWalkaBarbarzyncy: true,
});
ok(M.hasAuthorizedBorderCrossing(B, A, ctxFor(deals2, [], 7)), 'przed zerwaniem: umowa nadal daleko od naturalnego końca, autoryzuje przemarsz');
const REMOVE_TURN = 7;
deals2 = M.removeTreatiesById(deals2, ['coop-voluntary']);
ok(deals2.length === 0, 'removeTreatiesById faktycznie usuwa traktat z activeDeals (kryterium 3)');
let grace2 = M.recordBarbarianCooperationGrace([], A, B, REMOVE_TURN + M.BARBARIAN_COOPERATION_TURNS - 1); // 9
for (const t of [7, 8, 9]) {
  ok(M.hasAuthorizedBorderCrossing(B, A, ctxFor(deals2, grace2, t)), `zerwanie dobrowolne, karencja tura ${t}: przemarsz nadal autoryzowany`);
  ok(penaltyFor(deals2, grace2, t).penalizedPairs === 0, `zerwanie dobrowolne, karencja tura ${t}: ZERO kar`);
}
ok(!M.hasAuthorizedBorderCrossing(B, A, ctxFor(deals2, grace2, 10)), 'zerwanie dobrowolne: tura 10 (4. od usunięcia) — kara wraca');
ok(penaltyFor(deals2, grace2, 10).penalizedPairs === 1, 'zerwanie dobrowolne: tura 10 — kara faktycznie naliczona');

// --- Nietautologiczność: mutacja granicy karencji (o 1 turę za mało) MUSI zaczerwienić powyższe. ---
const mutatedGrace = M.recordBarbarianCooperationGrace([], A, B, 10 + M.BARBARIAN_COOPERATION_TURNS - 1 - 1); // o 1 tura za krótko
ok(!M.hasAuthorizedBorderCrossing(B, A, ctxFor([], mutatedGrace, 12)), 'dowód nietautologiczności: skrócona o 1 turę karencja NIE autoryzuje już tury 12 (test faktycznie mierzy długość okna)');

// --- Symetria klucza pary (a,b) == (b,a), jak pairKey() w reszcie diplomacy-treaties.ts ---
const graceAB = M.recordBarbarianCooperationGrace([], A, B, 12);
ok(M.isBarbarianCooperationGraceActive(graceAB, B, A, 12), 'karencja jest symetryczna względem kolejności stron pary');

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
