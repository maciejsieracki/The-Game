'use strict';
/**
 * diplomacy-incoming-own-gate-recon-test.cjs — R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1-C, GOAL (a).
 *
 * Recon: `previewIncomingPlayerAccept`/`computeIncomingPlayerAcceptNetPw`
 * (diplomacy-acceptance-points.ts, kierunek "incoming" — AI proponuje, gracz odpowiada) liczy
 * WYŁĄCZNIE surowe netto `myOfferPn − theirOfferPn >= 0` (żadnego mnożnika Relacji, żadnej
 * bazy traktatu, żadnego `handelWillingnessMultiplier`). `evaluateProposal`/`handelFairnessGate`
 * (diplomacy-proposals.ts, kierunek "own" — gracz proponuje, AI odpowiada) liczy próg
 * relacyjnie skalowany: `givePn >= handelRequiredPn(receivePn, relTotal, multiplier)`, gdzie
 * `handelRequiredPn` przy relTotal<100 wymaga WIĘCEJ niż surowa parytet (proponent dopłaca za
 * niską Relację).
 *
 * WNIOSEK RECONU (jawny, wymagany przez GOAL a): MECHANIZM ŚWIADOMIE INNY, BRAK BŁĘDU DO
 * NAPRAWIENIA W TYM DISPATCHU. Dowód niżej w 3 krokach:
 *
 * 1) Asymetria ISTNIEJE matematycznie przy relTotal<100 (sekcja 1) — dla identycznego koszyka
 *    (myGive=theirGive), incoming (raw net) akceptuje zawsze (0>=0), a `evaluateProposal` dla
 *    LUSTRZANEGO ułożenia ról (ten sam koszyk, proponent=gracz) odrzuca, bo wymaga nadpłaty
 *    proporcjonalnej do (100/relTotal). Test to POKAZUJE WPROST (nie ukrywa).
 * 2) Asymetria ZNIKA przy relTotal>=100 (sekcja 2, klamrowanie w `handelRequiredPn`/
 *    `diplomacyFairGivePn` do `Math.min(100, relTotal)`) — obie bramki wymagają wtedy
 *    dokładnie surowej parytetu, więc w "strefie zysku dla gracza" (relacja maksymalna) NIE MA
 *    żadnej rozbieżności.
 * 3) Powód, dla którego (1) NIE jest kwalifikowane jako "REALNA niespójność wymagająca
 *    ujednolicenia" w sensie GOAL (a) (sekcja 3, recon jawny, nie milczenie):
 *    a) Ofertę incoming GENERUJE AI (diplomacy-ai-offer-balance.ts), celując w bilans≈0 WG TEJ
 *       SAMEJ matematyki (`handelRequiredPn`/`treatyBaseFairnessGap`, patrz
 *       `diplomacy-bilans-unifikacja-test.cjs`, GOAL b) — świeżo wygenerowana oferta AI JUŻ
 *       spełnia relacyjnie skalowaną uczciwość; luka (1) dotyczy WYŁĄCZNIE koszyka
 *       edytowanego ręcznie przez gracza w negocjacji, w dół do surowej parytetu.
 *    b) Silnik jawnie i świadomie pozwala graczowi zaakceptować NIEKORZYSTNY DLA SIEBIE deal
 *       w tym kierunku (`diplomacy-acceptance-points.ts`, komentarz przy `mode==='basket'`:
 *       "gracz może przyjąć niekorzystny deal... to jest jego decyzja") — `evaluateProposal`
 *       istnieje po to, by ZDECYDOWAĆ ZA AI, czy zaakceptować propozycję gracza (trzeba
 *       chronić AI przed manipulacją nieufnego gracza); `previewIncomingPlayerAccept` NIE
 *       decyduje za AI (AI już zaproponowało) — chroni wyłącznie przed SUROWYM,
 *       jednoznacznym exploitem (netto ujemne dla AI), co explicite potwierdza już istniejący
 *       test `diplomacy-bilans-unifikacja-test.cjs` sekcja 1c (linie 188-197 tamtego pliku —
 *       "to DWIE RÓŻNE, obie celowe bramki dla dwóch różnych kierunków, nie jedna rozjechana
 *       bramka") — NIEZALEŻNY wcześniejszy recon tej samej pary funkcji doszedł do tego
 *       samego wniosku.
 *    c) Ujednolicenie (dociągnięcie incoming do relacyjnie skalowanego progu) wymagałoby
 *       PRZEBUDOWY wyświetlanego "Bilans (netto)" w UI (diplomacy-acceptance-points.ts liczy
 *       tylko dane, ale panel netto/etykiety w `diplomacyAcceptanceBalance.ts` zakładają
 *       surowe netto jako WYŚWIETLANĄ liczbę dla tego kierunku) — TEN plik jest POZA
 *       allowlistą tego dispatchu. Zmiana samej bramki bez zmiany wyświetlanej liczby
 *       stworzyłaby DOKŁADNIE ten defekt, przed którym chroni `diplomacy-bilans-unifikacja-
 *       test.cjs` (zrzut #1: "canAccept zgodny z accepted=false — NIGDY bilans dodatni ale
 *       zablokowane") — tylko w kierunku incoming zamiast own. Naprawa "w połowie" (sama
 *       bramka, bez displayu) pogorszyłaby spójność, nie poprawiła.
 *
 * Run: node tools/diplomacy-incoming-own-gate-recon-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; console.error('[FAIL]', label); }
}

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(SRC, '.dip-incoming-own-recon-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-incoming-own-recon-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { evaluateProposal, handelRequiredPn } from './game/diplomacy-proposals';
export { previewIncomingPlayerAccept, computeIncomingPlayerAcceptNetPw } from './game/diplomacy-acceptance-points';
export { diplomacyFairGivePn } from './game/diplomacy-value-catalog';
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

function ctxOf(relTotal) {
  return {
    relation: { zaufanie: relTotal, respekt: 0, status: 'pokoj' },
    responderPlayer: { typCywilizacji: 'zulusi' },
    proposerPlayer: { typCywilizacji: 'rzymianie' },
  };
}

// ---------------------------------------------------------------------------
// SEKCJA 1 — asymetria istnieje przy relTotal < 100: koszyk SUROWY-PARYTET (aiGive===
// playerGive) jest zawsze zaakceptowany przez incoming-gate (netto=0>=0), ale byłby
// ODRZUCONY przez evaluateProposal, gdyby TEN SAM koszyk (te same dwie liczby) był
// propozycją gracza (kierunek own) przy tej samej niskiej Relacji.
// ---------------------------------------------------------------------------
[
  { aiGive: 100, playerGive: 100, relTotal: 50 },
  { aiGive: 260, playerGive: 260, relTotal: 63.3 },
  { aiGive: 40, playerGive: 40, relTotal: 20 },
].forEach(({ aiGive, playerGive, relTotal }, i) => {
  // incoming: proposer=AI, payload.givePn=AI daje=aiGive, payload.receivePn=AI dostaje=playerGive.
  const preview = m.previewIncomingPlayerAccept('handel', { givePn: aiGive, receivePn: playerGive }, relTotal);
  ok(preview != null && preview.accepted === true,
    `sekcja1 #${i}: incoming previewIncomingPlayerAccept.accepted===true dla surowej parytetu (aiGive=${aiGive}===playerGive=${playerGive}) @ rel ${relTotal} (raw net=0>=0)`);

  // own (lustrzane ułożenie ról): TEN SAM koszyk jako propozycja gracza — gracz daje
  // playerGive, dostaje aiGive.
  const evalRes = m.evaluateProposal(
    { actionId: 'handel', proposerOwnerId: 0, responderOwnerId: 1, payload: { givePn: playerGive, receivePn: aiGive } },
    ctxOf(relTotal),
  );
  const required = m.handelRequiredPn(aiGive, relTotal, 1);
  ok(relTotal < 100 ? required > playerGive : required <= playerGive,
    `sekcja1 #${i}: handelRequiredPn(${aiGive}, ${relTotal}, 1)=${required} > playerGive=${playerGive} przy relTotal<100 (dopłata za niską Relację)`);
  ok(relTotal < 100 ? evalRes.accepted === false : true,
    `sekcja1 #${i}: evaluateProposal dla LUSTRZANEGO own-ułożenia odrzuca (accepted=${evalRes.accepted}) tę samą surową-paritetową ofertę @ rel ${relTotal} — ASYMETRIA POTWIERDZONA, nie ukryta`);
  console.error(`[INFO] sekcja1 #${i}: rel=${relTotal} incoming.accepted=${preview.accepted} own-mirror.accepted=${evalRes.accepted} (required own give=${required} vs playerGive=${playerGive})`);
});

// ---------------------------------------------------------------------------
// SEKCJA 2 — asymetria formuły (handelRequiredPn z multiplier=1, IZOLOWANA od
// handelWillingnessMultiplier zależnego od stance — osobny, niepowiązany wymiar,
// patrz komentarz bloku R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1=B+C w
// diplomacy-proposals.ts) ZNIKA przy relTotal >= 100 — klamrowanie do parytetu w
// diplomacyFairGivePn/handelRequiredPn (Relacja ponadprogowa nigdy nie daje zysku ponad
// parytet, "fix #20" w diplomacy-pn-engine.ts). Test celowo NIE woła evaluateProposal
// tutaj (jego wynik dodatkowo zależy od stance-driven willingness multiplier, osobny
// wymiar niepowiązany z pytaniem reconu — mnożnik chęci, nie mnożnik Relacji).
// ---------------------------------------------------------------------------
[100, 150, 200].forEach((relTotal, i) => {
  const receivePn = 120;
  const requiredAtMultiplier1 = m.handelRequiredPn(receivePn, relTotal, 1);
  ok(requiredAtMultiplier1 === receivePn,
    `sekcja2 #${i}: handelRequiredPn(${receivePn}, ${relTotal}, 1)=${requiredAtMultiplier1} === receivePn — przy relTotal>=100 formuła własna (multiplier=1, bez wpływu willingness) wymaga DOKŁADNIE surowej parytetu, tak jak incoming-gate — brak rozbieżności FORMUŁY w tej strefie`);
});

// ---------------------------------------------------------------------------
// SEKCJA 3 — dowód (3a): oferta wygenerowana przez AI (nie edytowana ręcznie) już spełnia
// relacyjnie skalowaną uczciwość formuły (handelRequiredPn z multiplier=1, patrz sekcja 2)
// — luka sekcji 1 wymaga RĘCZNEJ edycji koszyka przez gracza w dół do surowej parytetu,
// nie występuje w świeżo wygenerowanej ofercie AI, którą generator (diplomacy-ai-offer-
// balance.ts, GOAL b tego tematu) celuje w DOKŁADNIE tę samą liczbę.
// ---------------------------------------------------------------------------
{
  const relTotal = 50;
  const aiGive = 100; // to, co daje AI (proponent)
  // Generator AI (diplomacy-ai-offer-balance.ts, GOAL b) celuje w bilans respondenta≈0 —
  // t.j. playerGive ≈ handelRequiredPn(aiGive, relTotal, 1) (fair-value formuła, respondent =
  // gracz musi oddać PROPORCJONALNIE WIĘCEJ niż aiGive przy niskiej Relacji, DOKŁADNIE
  // odwrotny kierunek niż moja pierwotna, błędna intuicja — zweryfikowane debugiem tego testu).
  const fairPlayerGive = m.handelRequiredPn(aiGive, relTotal, 1);
  ok(fairPlayerGive > aiGive,
    `sekcja3: świeżo policzona fair-wartość gracz-daje (${fairPlayerGive}) > aiGive (${aiGive}) przy rel ${relTotal} — generator AI celuje w TĘ (wyższą) liczbę, nie w surową parytet, więc świeża oferta AI NIGDY nie trafia w lukę sekcji 1`);
  const previewFreshOffer = m.previewIncomingPlayerAccept('handel', { givePn: aiGive, receivePn: fairPlayerGive }, relTotal);
  ok(previewFreshOffer.accepted === true,
    'sekcja3: świeżo wygenerowana (nieedytowana) oferta AI @ fair-value przechodzi też incoming-gate (playerGive>aiGive, raw net dodatnie z zapasem) — brak luki na tej ścieżce');
  // Luka sekcji 1 pojawia się DOPIERO gdy gracz RĘCZNIE zmniejszy swój koszyk z powrotem do
  // surowej parytetu (playerGive=aiGive) zamiast zostawić fair-value (fairPlayerGive) — to
  // JEST dokładnie edytowalny exploit z sekcji 1, nie stan świeżo wygenerowanej oferty.
  const previewEdited = m.previewIncomingPlayerAccept('handel', { givePn: aiGive, receivePn: aiGive }, relTotal);
  ok(previewEdited.accepted === true,
    'sekcja3: PO ręcznej edycji koszyka gracza w dół do surowej parytetu (playerGive=aiGive) incoming-gate DALEJ akceptuje (luka sekcji 1 potwierdzona jako punkt wejścia edycji, nie generacji)');
  console.error(`[INFO] sekcja3: aiGive=${aiGive} @ rel ${relTotal} — świeża oferta (playerGive=${fairPlayerGive}) accepted=${previewFreshOffer.accepted}; edytowana w dół (playerGive=${aiGive}) accepted=${previewEdited.accepted}`);
}

console.error(`\n${pass} testów PASS, ${fail} testów FAIL (diplomacy-incoming-own-gate-recon-test.cjs)`);
try { fs.unlinkSync(ENTRY); } catch {}
try { fs.unlinkSync(BUNDLE); } catch {}
process.exit(fail > 0 ? 1 : 0);
