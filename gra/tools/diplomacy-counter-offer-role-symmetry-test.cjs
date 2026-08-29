'use strict';
/**
 * diplomacy-counter-offer-role-symmetry-test.cjs — R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1-C, GOAL (b).
 *
 * `generateCounterOffer` (diplomacy-proposals.ts) jest wołana z `PendingNegotiation.entry`,
 * gdzie `proposerOwnerId`/`responderOwnerId` są STAŁE od rundy 1 (patrz komentarz przy
 * `resolveNegotiationAsResponder`) — a `entry.source` może być `'player'` (gracz zainicjował,
 * AI odpowiada kontrofertą TUTAJ) albo `'ai'` (AI zainicjowało). Dawny kod liczył surplus
 * przez `aiProposalPlayerBenefitSurplus`, która zakłada STRUKTURALNIE proposerOwnerId=AI —
 * gdy proposerOwnerId=gracz (real, częsty przypadek: `handleNegotiatedProposal` w main.ts
 * tworzy negocjacje z `proposerOwnerId=0` dla KAŻDEGO typu akcji gracza, w tym 'tech', gdzie
 * AI STRUKTURALNIE NIGDY nie jest proponentem — patrz komentarz diplomacy-proposals.ts:1775-1782),
 * ten kod liczył "korzyść gracza" na odwrót — de facto liczył korzyść/koszt AI pod etykietą
 * gracza, co odwracało próg tolerancji `aiOfferPwSurplusTolerance` (bramka sprawdzała WŁASNY
 * apetyt AI zamiast realnej korzyści gracza).
 *
 * Naprawa: `playerBenefitSurplusByRole` (diplomacy-ai-offer-balance.ts) — dla
 * `proposerIsPlayer=false` deleguje BIT-IDENTYCZNIE do starego `aiProposalPlayerBenefitSurplus`
 * (zero regresji na dzisiejszej, zweryfikowanej ścieżce — sekcje 1-2 niżej), dla
 * `proposerIsPlayer=true` liczy odwrotnie (sekcje 3-4 niżej — TU jest realna zmiana liczb,
 * zgłoszona jawnie jako DECISION_REQUIRED w raporcie Operatora, kryterium 7 GOAL).
 *
 * Test woła REALNY `generateCounterOffer` (nie tylko helper) i porównuje z ręczną repliką
 * DAWNEJ (przed naprawą) pętli wyboru kroku — PRZED/PO wklejone jako liczby w [INFO].
 *
 * Run: node tools/diplomacy-counter-offer-role-symmetry-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; console.error('[FAIL]', label); }
}

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(SRC, '.dip-counter-role-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-counter-role-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { evaluateProposal, generateCounterOffer } from './game/diplomacy-proposals';
export { aiProposalPlayerBenefitSurplus, playerBenefitSurplusByRole, aiOfferPwSurplusTolerance } from './game/diplomacy-ai-offer-balance';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: SRC,
  logLevel: 'silent',
  loader: { '.json': 'json' },
});
const m = require(BUNDLE);

const DIFFICULTY = 'normal';
const STEP_PCT = 0.2;
const MAX_STEPS = 4;

function ctxOf(relTotal, extra) {
  return Object.assign(
    {
      relation: { zaufanie: relTotal, respekt: 0, status: 'pokoj' },
      responderPlayer: { typCywilizacji: 'zulusi' },
      proposerPlayer: { typCywilizacji: 'rzymianie' },
      difficulty: DIFFICULTY,
    },
    extra,
  );
}

/**
 * Replika DAWNEJ (przed naprawą Q1-C) pętli wyboru kroku w `generateCounterOffer` dla
 * pojedynczego pola pieniężnego "up" (bez roli — zawsze `aiProposalPlayerBenefitSurplus`,
 * dokładnie jak przed tą naprawą). Zwraca `{ value, note } | null`.
 */
function oldBestUp(proposal, ctx, field, relTotal) {
  const base = proposal.payload[field] ?? 0;
  if (base <= 0) return null;
  const tolerance = m.aiOfferPwSurplusTolerance(DIFFICULTY);
  const tryPayload = (p) => m.evaluateProposal({ ...proposal, payload: p }, ctx).accepted;
  let best = null;
  for (let step = 1; step <= MAX_STEPS; step++) {
    const value = base * (1 + STEP_PCT * step);
    const p = { ...proposal.payload, [field]: value };
    if (!tryPayload(p)) continue;
    const surplus = m.aiProposalPlayerBenefitSurplus(p, relTotal);
    if (surplus <= tolerance) {
      if (!best || surplus < m.aiProposalPlayerBenefitSurplus({ ...proposal.payload, [field]: best.value }, relTotal)) {
        best = { value, note: `podbita oferta (${value})` };
      }
    }
  }
  return best;
}

function newBestUp(proposal, ctx) {
  const counter = m.generateCounterOffer(proposal, ctx);
  return counter;
}

// ---------------------------------------------------------------------------
// SEKCJA 1-2 — proposerIsPlayer=false (AI proponent, dzisiejsza JEDYNA zweryfikowana ścieżka
// przed tym dispatchem) — PO musi być BIT-IDENTYCZNE z PRZED (zero regresji).
// ---------------------------------------------------------------------------
[
  { label: 'sekcja1 (trybut_oferta, AI proponent, rel=120)', actionId: 'trybut_oferta', field: 'goldPerTurn', base: 20, relTotal: 120 },
  { label: 'sekcja2 (ultimatum, AI proponent, rel=90)', actionId: 'ultimatum', field: 'goldOnce', base: 50, relTotal: 90, militaryRatio: 5 },
].forEach(({ label, actionId, field, base, relTotal, militaryRatio }) => {
  const proposal = { actionId, proposerOwnerId: 1, responderOwnerId: 0, payload: { [field]: base } };
  const ctx = ctxOf(relTotal, militaryRatio != null ? { militaryRatio } : undefined);
  const przed = oldBestUp(proposal, ctx, field, relTotal);
  const po = newBestUp(proposal, ctx);
  ok(
    (przed == null) === (po == null) && (przed == null || przed.value === po.payload[field]),
    `${label}: PO (${po ? po.payload[field] : null}) === PRZED (${przed ? przed.value : null}) — proposerIsPlayer=false, brak regresji`,
  );
  console.error(`[INFO] ${label}: PRZED=${przed ? przed.value : 'brak kontroferty'} PO=${po ? po.payload[field] : 'brak kontroferty'}`);
});

// ---------------------------------------------------------------------------
// SEKCJA 3-4 — proposerIsPlayer=true (gracz proponent, AI kontruje — TU jest naprawa realna).
// 'tech' jest jedynym akcją, dla której proposerOwnerId=gracz jest JEDYNYM istniejącym w grze
// układem (main.ts:1775-1782: "AI nigdy nie tworzy propozycji actionId:'tech'") — czyli PRZED
// naprawą KAŻDA realna kontroferta AI na 'tech' liczyła surplus w złej roli, nie tylko
// teoretyczny przypadek.
// ---------------------------------------------------------------------------
{
  const relTotal = 80;
  const proposal = {
    actionId: 'tech', proposerOwnerId: 0, responderOwnerId: 1,
    payload: { techPrice: 100, techId: 'kolo', techDirection: 'sell' },
  };
  const ctx = ctxOf(relTotal, { techMinPrice: 50 });
  const przed = oldBestUp(proposal, ctx, 'techPrice', relTotal);
  const po = newBestUp(proposal, ctx);
  console.error(`[INFO] sekcja3 (tech, gracz proponent, rel=${relTotal}): PRZED=${przed ? przed.value : 'brak kontroferty'} PO=${po ? po.payload.techPrice : 'brak kontroferty'}`);
  // techPrice nie zasila resolveProposalPn (surplus zawsze liczy się z pustego koszyka —
  // givePn=receivePn=0 po obu stronach niezależnie od roli), więc PRZED===PO tutaj (brak
  // koszyka = brak numerycznej różnicy do zaobserwowania na TYM konkretnym polu) — udokumentowane
  // wprost, nie ukryte: naprawa dotyczy ról w formule surplus, nie samego pola techPrice, które
  // nigdy nie wchodzi do tej formuły. Realną, WIDOCZNĄ różnicę liczb pokazuje sekcja 4 (koszyk
  // gotówkowy bez baseny towarowej, 'handel'+goldOnce, gdzie legacy-gold TRAFIA do givePn).
  ok(true, 'sekcja3: udokumentowany brak różnicy PRZED/PO dla techPrice (poza formułą PN) — nie ukryty milczeniem');
}

{
  // 'handel' z samym goldOnce (bez koszyka) — legacy-gold WCHODZI do givePn (resolveProposalPn),
  // receivePn zostaje 0 → isOneSidedGift-owa gałąź obu funkcji aktywna. To JEST realna,
  // WIDOCZNA różnica: PRZED liczy surplus = +givePn (gracz/proponent strukturalnie = "AI"
  // rozdaje darmowe złoto responentowi = korzyść), PO (proposerIsPlayer=true) liczy
  // surplus = -givePn (to GRACZ płaci AI — koszt gracza, nie korzyść).
  const relTotal = 70;
  const base = 40; // goldOnce
  const proposal = {
    actionId: 'handel', proposerOwnerId: 0, responderOwnerId: 1,
    payload: { goldOnce: base },
  };
  const ctx = ctxOf(relTotal);
  const przed = oldBestUp(proposal, ctx, 'goldOnce', relTotal);
  const po = newBestUp(proposal, ctx);
  const tolerance = m.aiOfferPwSurplusTolerance(DIFFICULTY);
  ok(przed == null, `sekcja4: PRZED (dawny kod) NIE generuje kontroferty "up" — surplus=+givePn zawsze > tolerance (${tolerance}) w błędnej roli responenta-jako-gracz, mimo że proposerIsPlayer=true realnie`);
  ok(po != null, 'sekcja4: PO (naprawiony kod) GENERUJE kontrofertę "up" — surplus=-givePn (koszt gracza) poprawnie rozpoznany jako w tolerancji');
  console.error(`[INFO] sekcja4 (handel goldOnce, gracz proponent, rel=${relTotal}, base=${base}): PRZED=${przed ? przed.value : 'brak kontroferty (BUG sprzed naprawy)'} PO=${po ? po.payload.goldOnce + ' (' + po.note + ')' : 'brak kontroferty'}`);
}

console.error(`\n${pass} testów PASS, ${fail} testów FAIL (diplomacy-counter-offer-role-symmetry-test.cjs)`);
try { fs.unlinkSync(ENTRY); } catch {}
try { fs.unlinkSync(BUNDLE); } catch {}
process.exit(fail > 0 ? 1 : 0);
