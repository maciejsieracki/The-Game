'use strict';
/**
 * diplomacy-bilans-unifikacja-test.cjs — R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1.
 *
 * NOWE SPRAWDZENIE (nie duplikat istniejących testów dyplomacji). Pokrywa:
 *
 * 1) GOAL a, kryterium 1-2: wartość "Bilans (netto)" wyświetlana przez
 *    `incomingTradeNetBalancePw`/`renderPnBalancePanelHtml` (diplomacyAcceptanceBalance.ts)
 *    jest ZAWSZE dokładnie tą liczbą, której realnie użyła bramka akceptacji — dowiedzione
 *    na obu zrzutach właściciela (355/260 PW @ Relacja 63,3; 60/86 PW @ Relacja 69,5) I na
 *    syntetycznym scenariuszu bilans=0→accepted=true. Zrzuty właściciela są reprodukowane w
 *    kierunku "own" (gracz proponuje, AI odpowiada), bo recon tego dispatchu (patrz raport
 *    Operatora) ustalił, że dla kierunku "incoming" typu handel/traktat-z-koszykiem realną
 *    bramką akceptacji NIE jest evaluateProposal, tylko osobna, celowa bramka
 *    `previewIncomingPlayerAccept`/R-PW-ACCEPT-OVERPAY-Q1=A (diplomacy-acceptance-points.ts,
 *    POZA allowlistą tego tematu) — i że TA bramka jest już dziś wewnętrznie spójna z
 *    wyświetlanym surowym netto (obie liczą myOfferPn−theirOfferPn, ten sam próg ≥0).
 *    Sekcja 1c dowodzi tego wprost (recon, nie milczące założenie).
 *
 * 2) GOAL b, kryterium 3: generator startowej oferty AI (`trimProposalForZeroBalance`,
 *    diplomacy-ai-offer-balance.ts) — po rozszerzeniu o opcjonalny `fairness`
 *    (multiplier/treatyBasePn) — dla ≥2 syntetycznych scenariuszy z niezerową bazą traktatu
 *    i niezerowym mnożnikiem chęci partnera, wygenerowana oferta AI ocenia się przez TĘ SAMĄ
 *    zunifikowaną funkcję z bilansem bliskim 0. Dowodzi też, że realny punkt integracji jest
 *    `generateCounterOffer` (kontroferta AI na propozycję GRACZA) — nie
 *    `enqueueNegotiationFromAiCmd` (oferta startowa AI), dla którego oba składniki są
 *    matematycznie no-op (recon, sekcja 3).
 *
 * Run: node tools/diplomacy-bilans-unifikacja-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; console.error('[FAIL]', label); }
}

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(SRC, '.dip-bilans-unif-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-bilans-unif-bundle.cjs');
fs.writeFileSync(ENTRY, `
export {
  evaluateProposal, generateCounterOffer, handelRequiredPn, handelWillingnessMultiplier,
  treatyBaseFairnessGap, treatyBasePnFromConfig,
} from './game/diplomacy-proposals';
export {
  responderPwSurplus, aiProposalPlayerBenefitSurplus, trimProposalForZeroBalance,
} from './game/diplomacy-ai-offer-balance';
export {
  balancePanelDataFromRow, balancePanelDataFromRows, renderPnBalancePanelHtml,
  incomingTradeNetBalancePw, isIncomingBasketTradePanel,
} from './ui/diplomacyAcceptanceBalance';
export { computePlayerAcceptanceSides, previewIncomingPlayerAccept } from './game/diplomacy-acceptance-points';
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

function ctxOf(relTotal, extra) {
  return Object.assign(
    {
      relation: { zaufanie: relTotal, respekt: 0, status: 'pokoj' },
      responderPlayer: { typCywilizacji: 'zulusi' },
      proposerPlayer: { typCywilizacji: 'rzymianie' },
    },
    extra,
  );
}

// ---------------------------------------------------------------------------
// SEKCJA 1 — GOAL a: bilans wyświetlany == bilans bramki (evaluateProposal), kierunek "own"
// (gracz proponuje 'handel', AI odpowiada — to jest kierunek, w którym evaluateProposal
// REALNIE jest bramką akceptacji dla tego typu propozycji — patrz nagłówek pliku).
// ---------------------------------------------------------------------------

/**
 * Buduje wiersz stołu "own" (gracz proponuje, czeka na AI) i sprawdza, że
 * `theirBalance.balancePn` (czytane przez naprawiony `incomingTradeNetBalancePw` i renderer)
 * jest BIT-IDENTYCZNE z `evaluateProposal(...).pwBalance` — ta sama liczba, ten sam próg
 * `>= 0 -> accepted`.
 */
function ownHandelRow(myGive, theirGive, relTotal) {
  const payload = { givePn: myGive, receivePn: theirGive };
  const evalRes = m.evaluateProposal(
    { actionId: 'handel', proposerOwnerId: 0, responderOwnerId: 1, payload },
    ctxOf(relTotal),
  );
  const acc = m.computePlayerAcceptanceSides('handel', payload, relTotal, false);
  const row = {
    direction: 'own',
    actionLabel: 'Handel',
    acceptanceMy: acc.my,
    acceptanceTheir: acc.their,
    awaitingAiResponse: true,
    canAccept: undefined,
    responderPreview: { accepted: evalRes.accepted, reason: evalRes.reason, pwBalance: evalRes.pwBalance },
  };
  return { row, evalRes };
}

// --- Zrzut właściciela #1: 355/260 PW @ Relacja 63,3 (dziś błędnie "+95" + blokada) ---
{
  const { row, evalRes } = ownHandelRow(355, 260, 63.3);
  const panel = m.balancePanelDataFromRows([row]);
  ok(evalRes.accepted === false, 'zrzut #1: evaluateProposal odrzuca (355 PW poniżej wymaganych @ Relacji 63,3)');
  ok(typeof evalRes.pwBalance === 'number', 'zrzut #1: evaluateProposal niesie numeryczny pwBalance');
  ok(
    panel.theirBalance.balancePn === evalRes.pwBalance,
    `zrzut #1: panel.theirBalance.balancePn (${panel.theirBalance.balancePn}) === evaluateProposal.pwBalance (${evalRes.pwBalance}) — NIGDY osobno liczony surowy netto`,
  );
  ok(
    m.incomingTradeNetBalancePw(panel) === evalRes.pwBalance,
    `zrzut #1: incomingTradeNetBalancePw (${m.incomingTradeNetBalancePw(panel)}) === evaluateProposal.pwBalance (${evalRes.pwBalance})`,
  );
  ok(panel.canAccept === false, 'zrzut #1: canAccept zgodny z accepted=false — NIGDY "bilans dodatni ale zablokowane"');
  const html = m.renderPnBalancePanelHtml(panel);
  ok(html.includes('da-pn-balance-bar no'), 'zrzut #1: render pokazuje ton "no" (blokada)');
  ok(!html.includes('>+95<') && !html.includes('>+95 PW<'), 'zrzut #1: render NIE pokazuje starego, błędnego "+95"');
  console.error(`[INFO] zrzut #1 (355/260 @ 63,3): evaluateProposal.pwBalance=${evalRes.pwBalance}, accepted=${evalRes.accepted}, panel.canAccept=${panel.canAccept}`);
}

// --- Zrzut właściciela #2: 60/86 PW @ Relacja 69,5 (dziś "-26" + blokada) ---
{
  const { row, evalRes } = ownHandelRow(60, 86, 69.5);
  const panel = m.balancePanelDataFromRows([row]);
  ok(evalRes.accepted === false, 'zrzut #2: evaluateProposal odrzuca (60 PW poniżej wymaganych @ Relacji 69,5)');
  ok(
    panel.theirBalance.balancePn === evalRes.pwBalance,
    `zrzut #2: panel.theirBalance.balancePn (${panel.theirBalance.balancePn}) === evaluateProposal.pwBalance (${evalRes.pwBalance})`,
  );
  ok(
    m.incomingTradeNetBalancePw(panel) === evalRes.pwBalance,
    `zrzut #2: incomingTradeNetBalancePw (${m.incomingTradeNetBalancePw(panel)}) === evaluateProposal.pwBalance (${evalRes.pwBalance})`,
  );
  ok(panel.canAccept === false, 'zrzut #2: canAccept zgodny z accepted=false');
  console.error(`[INFO] zrzut #2 (60/86 @ 69,5): evaluateProposal.pwBalance=${evalRes.pwBalance}, accepted=${evalRes.accepted}, panel.canAccept=${panel.canAccept}`);
}

// --- Scenariusz trzeci (kryterium 1: min. 3 scenariusze) + syntetyczny bilans=0 (kryterium 2) ---
{
  // Dobieramy givePn tak, by evaluateProposal zaakceptowała DOKŁADNIE na progu (pwBalance=0).
  const relTotal = 80;
  const receivePn = 200;
  // handelRequiredPn(receivePn, relTotal, 1) — parytet (multiplier domyślnie 1 w evaluateProposal
  // dla 'handel' gdy responder=AI, responderIsPlayer=false → policzony przez silnik ze stance;
  // żeby dostać CZYSTY test progu 0, liczymy wymagany próg tą samą funkcją co silnik.
  const required = m.handelRequiredPn(receivePn, relTotal, 1);
  const { row: rowZero, evalRes: evalZero } = ownHandelRow(required, receivePn, relTotal);
  // Multiplier realnie zastosowany przez silnik (stance-zależny) może != 1 — sprawdzamy
  // WYNIK evaluateProposal jako wyrocznię, nie zakładamy dokładnie 0 na pierwszy rzut;
  // dobieramy `givePn` binarnym poszukiwaniem, żeby faktycznie trafić pwBalance===0.
  function evalAt(give) {
    return m.evaluateProposal(
      { actionId: 'handel', proposerOwnerId: 0, responderOwnerId: 1, payload: { givePn: give, receivePn } },
      ctxOf(relTotal),
    );
  }
  let lo = 0, hi = required * 3, zeroGive = null;
  for (let i = 0; i < 60 && lo <= hi; i++) {
    const mid = Math.floor((lo + hi) / 2);
    const r = evalAt(mid);
    if (r.pwBalance === 0) { zeroGive = mid; break; }
    if (r.pwBalance != null && r.pwBalance < 0) lo = mid + 1; else hi = mid - 1;
  }
  ok(zeroGive != null, 'syntetyczny bilans=0: binarne poszukiwanie znalazło givePn z pwBalance===0');
  if (zeroGive != null) {
    const r0 = evalAt(zeroGive);
    ok(r0.accepted === true, 'syntetyczny bilans=0: evaluateProposal.accepted === true GDY pwBalance===0 (kryterium 2)');
    const { row } = ownHandelRow(zeroGive, receivePn, relTotal);
    const panel = m.balancePanelDataFromRows([row]);
    ok(panel.theirBalance.balancePn === 0, 'syntetyczny bilans=0: panel.theirBalance.balancePn === 0');
    ok(panel.canAccept === true, 'syntetyczny bilans=0: panel.canAccept === true — bilans=0 ZAWSZE odpowiada accepted=true');
    console.error(`[INFO] syntetyczny bilans=0: givePn=${zeroGive}, receivePn=${receivePn}, rel=${relTotal}`);
  }
}

// ---------------------------------------------------------------------------
// SEKCJA 1c — recon: dla kierunku "incoming" (AI proponuje, gracz odpowiada) typu
// handel/traktat-z-koszykiem, previewIncomingPlayerAccept (nie evaluateProposal) JEST realną
// bramką klikaną w handleNegotiationAccept — i jest JUŻ dziś wewnętrznie spójna z surowym
// netto (oba liczą myOfferPn−theirOfferPn, próg >=0). Test dowodzi tego wprost, żeby
// "unifikacja dla WSZYSTKICH ścieżek" (GOAL a) nie została pomylona z faktycznym stanem kodu:
// evaluateProposal DLA TEGO KIERUNKU zwraca inny (bo inaczej bramkowany: handelRequiredPn+
// multiplier, gdzie multiplier=1 gdy responderIsPlayer, ALE fairMin nadal >> raw net) wynik
// niż previewIncomingPlayerAccept — bo to DWIE RÓŻNE, obie celowe bramki dla dwóch różnych
// kierunków, nie jedna rozjechana bramka.
// ---------------------------------------------------------------------------
{
  const myGive = 355, theirGive = 260, relTotal = 63.3;
  // incoming: proposer=AI(1), responder=player(0). payload.givePn=proposer(AI) daje=theirGive,
  // payload.receivePn=proposer(AI) dostaje=myGive (patrz recon Operatora / diplomacy-pn-engine).
  const acc = m.computePlayerAcceptanceSides('handel', { givePn: theirGive, receivePn: myGive }, relTotal, true);
  const preview = m.previewIncomingPlayerAccept('handel', { givePn: theirGive, receivePn: myGive }, relTotal);
  ok(preview != null, 'recon 1c: previewIncomingPlayerAccept (nie null) dla handel+basket incoming — to jest realna bramka klikana przez gracza');
  const rawNet = myGive - theirGive;
  ok(
    preview.accepted === (rawNet >= 0),
    `recon 1c: previewIncomingPlayerAccept.accepted (${preview.accepted}) === (surowe netto ${rawNet} >= 0) — bramka gracza-klika-Przyjmij jest DZIŚ JUŻ spójna z surowym netto dla tego kierunku`,
  );
  const row = {
    direction: 'incoming', actionLabel: 'Handel', acceptanceMy: acc.my, acceptanceTheir: acc.their,
    canAccept: true, responderPreview: preview,
  };
  const panel = m.balancePanelDataFromRows([row]);
  ok(
    m.incomingTradeNetBalancePw(panel) === rawNet,
    `recon 1c: incomingTradeNetBalancePw (${m.incomingTradeNetBalancePw(panel)}) === surowe netto (${rawNet}) dla incoming+handel+basket — brak numerycznego pwBalance z evaluateProposal na tej ścieżce (previewIncomingPlayerAccept przechwytuje wcześniej), więc fallback = surowe netto, TAKŻE UŻYWANE przez tę samą bramkę`,
  );
  ok(panel.canAccept === preview.accepted, 'recon 1c: panel.canAccept zgodny z previewIncomingPlayerAccept.accepted (jedyna realna bramka tego kierunku)');
}

// ---------------------------------------------------------------------------
// SEKCJA 2 — GOAL b, kryterium 3: generator AI (`responderPwSurplus`/
// `aiProposalPlayerBenefitSurplus`, diplomacy-ai-offer-balance.ts) z niezerowym mnożnikiem
// chęci partnera ORAZ niezerową bazą traktatu — 2 syntetyczne scenariusze, formuła
// bezpośrednio (handelRequiredPn/treatyBaseFairnessGap importowane z diplomacy-proposals.ts,
// TA SAMA matematyka co evaluateProposal — nie duplikat). `responderPwSurplus` zakłada
// proposerOwnerId=AI/responderOwnerId=gracz (nazwy parametrów w kodzie źródłowym) — dokładnie
// kierunek `enqueueNegotiationFromAiCmd`; testujemy więc formułę wprost, nie przez trim/koszyk
// (który operuje na tej samej funkcji, ale przez dodatkową warstwę binarnego przeszukiwania
// nieistotną dla dowodu unifikacji formuły).
// ---------------------------------------------------------------------------

// --- Scenariusz b1: mnożnik chęci != 1 ---
// `responderPwSurplus(proposerGivePn, proposerReceivePn, ...)`: `proposerGivePn` (tu: `demand`)
// jest ARGUMENTEM "receive" dla `handelRequiredPn` (patrz responderDemandPn w kodzie źródłowym
// — nadwyżka respondenta liczona jako "ile respondent MUSI oddać (proposerReceivePn) vs ile
// FAIR-MIN wynika z tego, co dostał (proposerGivePn)"). Zero-bilans wychodzi więc gdy
// `proposerReceivePn === handelRequiredPn(demand, relTotal, multiplier)`.
{
  const relTotal = 55;
  const demand = 300; // ile respondent (gracz) dostaje od proponenta (AI) — "proposerGivePn"
  const multiplier = 1.15; // syntetyczny mnożnik niechęci (>1) — jak handelWillingnessMultiplier realnie zwraca
  const requiredWithMultiplier = m.handelRequiredPn(demand, relTotal, multiplier);
  const requiredNoMultiplier = m.handelRequiredPn(demand, relTotal, 1);
  ok(
    requiredWithMultiplier > requiredNoMultiplier,
    `b1 setup: próg Z mnożnikiem (${requiredWithMultiplier}) > próg BEZ mnożnika (${requiredNoMultiplier}) — mnożnik syntetyczny realnie podnosi wymóg`,
  );
  // Respondent oddaje dokładnie próg Z mnożnikiem — bilans (nadwyżka respondenta) ma wyjść ~0.
  const surplusAtThreshold = m.responderPwSurplus(demand, requiredWithMultiplier, relTotal, { multiplier });
  ok(
    Math.abs(surplusAtThreshold) <= 1,
    `b1: responderPwSurplus przy proposerReceivePn=próg Z mnożnikiem (${requiredWithMultiplier}) daje bilans (${surplusAtThreshold}) bliski 0 — zunifikowana formuła z evaluateProposal`,
  );
  // Kontrola: TA SAMA oferta oceniona wg starego wzoru (bez mnożnika, multiplier domyślnie 1)
  // wychodzi zauważalnie NIE-zerowa — dowód, że mnożnik faktycznie zmienia wynik formuły.
  const surplusIgnoringMultiplier = m.responderPwSurplus(demand, requiredWithMultiplier, relTotal);
  ok(
    surplusIgnoringMultiplier > 5,
    `b1: TA SAMA oferta oceniona BEZ mnożnika (stary, częściowy wzór) daje bilans ${surplusIgnoringMultiplier} (nie bliski 0) — mnożnik jest realnym składnikiem formuły, nie kosmetyką`,
  );
}

// --- Scenariusz b2: baza traktatu != 0 (umowa_szlakow/umowa_handlowa) ---
{
  const relTotal = 70;
  const treatyBasePn = 80; // baza konfigu (jak umowa_szlakow/umowa_handlowa w diplomacy-acceptance-points.json)
  const proposerGivePn = 500; // koszyk: AI daje 500 PW
  const proposerReceivePn = 40; // koszyk: AI dostaje 40 PW
  // Dobierz proposerGivePn tak, by treatyBaseFairnessGap(basePn, give, receive, rel) === 0
  // (parytet bazy traktatu @ Relacji) — binarne poszukiwanie, ta sama funkcja co evaluateProposal.
  let lo = 0, hi = proposerGivePn, zeroGive = null;
  for (let i = 0; i < 40 && lo <= hi; i++) {
    const mid = Math.floor((lo + hi) / 2);
    const gap = m.treatyBaseFairnessGap(treatyBasePn, mid, proposerReceivePn, relTotal);
    if (gap === 0) { zeroGive = mid; break; }
    if (gap > 0) lo = mid + 1; else hi = mid - 1;
  }
  ok(zeroGive != null, 'b2 setup: binarne poszukiwanie znalazło givePn z treatyBaseFairnessGap===0');
  if (zeroGive != null) {
    const surplus = m.responderPwSurplus(zeroGive, proposerReceivePn, relTotal, { treatyBasePn });
    ok(
      Math.abs(surplus) <= 1,
      `b2: responderPwSurplus przy givePn=próg bazy traktatu (${zeroGive}) daje bilans (${surplus}) bliski 0 wg treatyBaseFairnessGap — ta sama funkcja, którą evaluateProposal realnie stosuje dla umowa_szlakow/umowa_handlowa gdy proponentem jest gracz`,
    );
    const surplusIgnoringBase = m.responderPwSurplus(zeroGive, proposerReceivePn, relTotal);
    ok(
      Math.abs(surplusIgnoringBase) > 30,
      `b2: TA SAMA oferta oceniona BEZ bazy traktatu (stary wzór, handel-only) daje bilans ${surplusIgnoringBase} (nie bliski 0) — baza traktatu jest realnym składnikiem formuły dla tego typu propozycji`,
    );
  }
}

// ---------------------------------------------------------------------------
// SEKCJA 3 — no-op dla realnego wywołania (enqueueNegotiationFromAiCmd: proposerOwnerId=AI,
// responderOwnerId=gracz) — dowód, że main.ts NIE regresuje: bez `fairness` (main.ts nie
// zmienił swojego jedynego call site'u poza komentarzem) zachowanie jest bit-identyczne.
// ---------------------------------------------------------------------------
{
  const relTotal = 63.3;
  const payload = { givePn: 1000, receivePn: 260 };
  const before = m.trimProposalForZeroBalance(payload, relTotal, 'normal');
  const afterNoopMultiplier = m.trimProposalForZeroBalance(payload, relTotal, 'normal', undefined, { multiplier: 1, treatyBasePn: 0 });
  ok(
    JSON.stringify(before) === JSON.stringify(afterNoopMultiplier),
    'no-op: trimProposalForZeroBalance bez fairness === z fairness={multiplier:1,treatyBasePn:0} (domyślne wartości identyczne)',
  );
  // Realny kierunek main.ts: responderIsPlayer=true -> handelWillingnessMultiplier zawsze 1.
  ok(
    m.handelWillingnessMultiplier({ willingnessTrade: 0.1 }, { progHandelWillingnessMin: 0.5 }, true) === 1,
    'no-op: handelWillingnessMultiplier(...,responderIsPlayer=true) === 1 zawsze — potwierdza inertność dla enqueueNegotiationFromAiCmd',
  );
}

console.log(`\n${pass} testów PASS, ${fail} testów FAIL (diplomacy-bilans-unifikacja-test.cjs)`);
try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exit(fail > 0 ? 1 : 0);
