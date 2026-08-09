'use strict';
/**
 * diplomacy-tech-trade-e2e-test.cjs — P-HANDEL-TECH-BLOKADA-AKCJA6-ASYMETRIA-Q1
 * (runda 3, 2026-08-09). BLOKER 1 (Evaluator runda 3 FAIL — „funkcja martwa w grze mimo
 * zielonych testów"): `diplomacy-tech-trade-execute-test.cjs` woła `executeTechTradeDealCore`
 * BEZPOŚREDNIO, z ręcznie sklejonym payloadem — omija dokładnie warstwę okablowania, która
 * była zepsuta w rundzie 2: `main.ts::buildProposalFromPayload` składał `uiPayload` z BIAŁEJ
 * LISTY pól i pomijał `techPaymentMode`/`techOfferId`, więc formularz wysyłał poprawny
 * payload, ale po drodze do stołu negocjacyjnego oba nowe pola ginęły — tryb tech-za-tech
 * był w 100% niedostępny z UI mimo 41/41 zielonych testów rundy 2 (żaden nie przechodził
 * przez tę konkretną funkcję).
 *
 * Ten plik zamyka DOKŁADNIE tę lukę: wycina PRAWDZIWY literał `uiPayload` wprost ze źródła
 * main.ts (nie kopię z pamięci — jeśli ktoś w przyszłości znów doda pole do
 * NegotiationPayload/ProposalPayload i zapomni dopisać go tu, test wykryje to automatycznie,
 * bo czyta AKTUALNY tekst main.ts przy każdym uruchomieniu), kompiluje go jako prawdziwą
 * funkcję i przepuszcza przez CAŁY łańcuch:
 *   payload formularza (dokładnie to, co UI wysyła) -> buildProposalPayload (wycięty z
 *   main.ts) -> evaluateProposal (REALNY moduł) -> executeTechTradeDealCore (REALNY moduł)
 * -> sprawdzenie stanu PO wykonaniu transakcji (nie tylko że pola przetrwały kopiowanie).
 *
 * Wzorowany na artefakcie Evaluatora `eval-e2e-test.cjs`
 * (scratchpad sesji, runda 3) — przeniesiony do stałego pakietu bramek jako
 * `diplomacy-tech-trade-e2e-test.cjs`, żeby ta klasa regresji (białe listy pól gubiące nowe
 * pole między warstwami) miała trwałe pokrycie, nie tylko jednorazowy artefakt diagnostyczny.
 */
const fs = require('fs');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

const BUNDLE = path.resolve(__dirname, '.dip-tech-trade-e2e-bundle.cjs');
const entry = path.resolve(__dirname, '.dip-tech-trade-e2e-entry.ts');
fs.writeFileSync(entry, `
export { executeTechTradeDealCore } from '../src/game/diplomacy-tech-trade.ts';
export { grantTechToOwner, createEmptyBasketTransferContext } from '../src/game/diplomacy-basket-transfer.ts';
export { applyOneShotGoldTransfer } from '../src/game/diplomacy-economy.ts';
export { evaluateProposal } from '../src/game/diplomacy-proposals.ts';
`);
esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});
const {
  executeTechTradeDealCore,
  grantTechToOwner,
  createEmptyBasketTransferContext,
  applyOneShotGoldTransfer,
  evaluateProposal,
} = require(BUNDLE);

console.log('diplomacy-tech-trade-e2e-test');

// ---------------------------------------------------------------------------
// Wycięcie PRAWDZIWEGO literału `uiPayload` z main.ts (nie kopia z pamięci — czyta
// aktualny plik przy KAŻDYM uruchomieniu testu, więc jeśli białe listy pól znów rozjadą
// się od NegotiationPayload/ProposalPayload, ten test to złapie bez ręcznej aktualizacji).
// ---------------------------------------------------------------------------
const mainSrc = fs.readFileSync(path.resolve(GRA, 'src/main.ts'), 'utf8').split('\n');
const startLine = mainSrc.findIndex(l => l.includes('const uiPayload: ProposalPayload = {'));
if (startLine < 0) {
  console.error('FAIL: nie znaleziono `const uiPayload: ProposalPayload = {` w main.ts — struktura buildProposalFromPayload się zmieniła, zaktualizuj ten test');
  process.exit(1);
}
let depth = 0;
let endLine = startLine;
for (let i = startLine; i < mainSrc.length; i++) {
  depth += (mainSrc[i].match(/{/g) || []).length - (mainSrc[i].match(/}/g) || []).length;
  if (i > startLine && depth === 0) { endLine = i; break; }
}
const literalSrc = mainSrc.slice(startLine, endLine + 1).join('\n')
  .replace('const uiPayload: ProposalPayload =', 'return ')
  // main.ts rzutuje niektóre pola przez `(payload as NegotiationPayload & {...})` — w izolowanej
  // funkcji `payload` to zwykły obiekt, rzutowanie TS i tak znika w JS w runtime, usuwamy je
  // tekstowo żeby `new Function` (czysty JS, bez transpilacji TS) nie potknął się o składnię.
  .replace(/\(payload as [^)]*\)/g, 'payload');
const buildProposalPayload = new Function('payload', literalSrc);

// Kontrola: literał faktycznie zawiera oba pola z BLOKERA 1 — jeśli ktoś je usunie z main.ts,
// ten asercja poinformuje WPROST o czym chodzi, zamiast gubić się w downstream niepowodzeniach.
ok(/techPaymentMode:\s*payload\.techPaymentMode/.test(literalSrc), 'buildProposalFromPayload (main.ts): literał uiPayload zawiera przypisanie techPaymentMode');
ok(/techOfferId:\s*payload\.techOfferId/.test(literalSrc), 'buildProposalFromPayload (main.ts): literał uiPayload zawiera przypisanie techOfferId');

// ---------------------------------------------------------------------------
// N1 (nota Evaluatora rundy 3): ostatni skok łańcucha (payload -> argumenty rdzenia
// executeTechTradeDealCore) był w tym pliku ręczną kopią trzech linii z main.ts, nie
// ekstrakcją — mutacja call-site w main.ts (np. paymentMode zawsze 'gold') przechodziła
// przez CAŁY plik niewykryta, bo kopia i produkcja mogły się rozjechać po cichu. Wycięcie
// wg dokładnie tej samej techniki co literał uiPayload wyżej.
// ---------------------------------------------------------------------------
const derivStart = mainSrc.findIndex(l => l.includes('const gold = payload.techPrice'));
if (derivStart < 0) {
  console.error('FAIL: nie znaleziono `const gold = payload.techPrice` w main.ts — derywacja argumentów executeTechTradeDealCore się zmieniła, zaktualizuj ten test');
  process.exit(1);
}
const derivSrc = mainSrc.slice(derivStart, derivStart + 3).join('\n')
  .replace(/const direction: 'sell' \| 'buy' =/, 'const direction =')
  .replace(/const paymentMode: 'gold' \| 'tech' =/, 'const paymentMode =');
ok(/const paymentMode = payload\.techPaymentMode === 'tech'/.test(derivSrc), 'main.ts: derywacja paymentMode wycięta poprawnie (kontrola kształtu)');
const deriveArgs = new Function('payload', derivSrc + '\nreturn { gold, direction, paymentMode };');

// ---------------------------------------------------------------------------
// Świat: skarbiec + kontekst tech w pamięci, REALNE grantTechToOwner/applyOneShotGoldTransfer.
// ---------------------------------------------------------------------------
function mkWorld({ p0 = [], p1 = [], gold0 = 1000, gold1 = 1000 } = {}) {
  let ctx = { researchedByOwner: new Map([[0, new Set(p0)], [1, new Set(p1)]]), surowiecBooleanGrants: [] };
  const skarb = new Map([[0, gold0], [1, gold1]]);
  const cancels = [];
  const deps = {
    getGold: (o) => skarb.get(o) ?? 0,
    transferGold: (from, to, amt) => { skarb.set(from, (skarb.get(from) ?? 0) - amt); skarb.set(to, (skarb.get(to) ?? 0) + amt); },
    ownerHasTech: (o, t) => (ctx.researchedByOwner.get(o) ?? new Set()).has(t),
    canGrantTech: (t, to) => { const r = grantTechToOwner(t, to, ctx); return { granted: r.granted, reason: r.reason }; },
    grantTech: (t, to) => { const r = grantTechToOwner(t, to, ctx); ctx = r.context; return { granted: r.granted, reason: r.reason }; },
    onCancelled: (r) => cancels.push(r),
  };
  return {
    deps,
    cancels,
    has: (o, t) => (ctx.researchedByOwner.get(o) ?? new Set()).has(t),
    gold: (o) => skarb.get(o) ?? 0,
  };
}

const REL = { zaufanie: 200, respekt: 100, status: 'pokoj' };
function evalIt(payload) {
  return evaluateProposal(
    { actionId: 'tech', proposerOwnerId: 0, responderOwnerId: 1, payload },
    { relation: REL, stanWojny: false, difficulty: 'normal', techMinPrice: 50 },
  );
}

// ---------------------------------------------------------------------------
// A — 4 kombinacje (Sprzedaż/Kupno x Gotówka/Technologia): payload formularza -> REALNY
// buildProposalPayload wycięty z main.ts -> evaluateProposal -> odczyt stanu. Proponent (0)
// zawsze zna 'Kolo', respondent (1) zawsze zna 'Brazownictwo' (dawcy głównej technologii —
// BLOKER 2 rundy 3 — mają co oddać w każdej kombinacji).
// ---------------------------------------------------------------------------
console.log('\n=== A. Formularz -> buildProposalFromPayload (REALNY literał main.ts) -> evaluateProposal ===');
const kombinacje = [
  ['Sprzedaz x Gotowka', { techId: 'Kolo', techDirection: 'sell', techPaymentMode: 'gold', goldOnce: 100 }, { p0: ['Kolo'] }],
  ['Kupno x Gotowka', { techId: 'Brazownictwo', techDirection: 'buy', techPaymentMode: 'gold', goldOnce: 100 }, { p1: ['Brazownictwo'] }],
  ['Sprzedaz x Technologia', { techId: 'Kolo', techDirection: 'sell', techPaymentMode: 'tech', techOfferId: 'Brazownictwo', goldOnce: 0 }, { p0: ['Kolo'], p1: ['Brazownictwo'] }],
  ['Kupno x Technologia', { techId: 'Brazownictwo', techDirection: 'buy', techPaymentMode: 'tech', techOfferId: 'Kolo', goldOnce: 0 }, { p0: ['Kolo'], p1: ['Brazownictwo'] }],
];

for (const [nazwa, formPayload, world] of kombinacje) {
  const ui = buildProposalPayload(formPayload);
  ok(ui.techPaymentMode === formPayload.techPaymentMode, `[${nazwa}] techPaymentMode przetrwał buildProposalFromPayload (formularz: '${formPayload.techPaymentMode}', po złożeniu: ${JSON.stringify(ui.techPaymentMode)})`);
  if (formPayload.techOfferId) {
    ok(ui.techOfferId === formPayload.techOfferId, `[${nazwa}] techOfferId przetrwał buildProposalFromPayload`);
  }
  const evalResult = evalIt(ui);
  ok(evalResult.accepted === true, `[${nazwa}] evaluateProposal akceptuje na maks. relacji (powód: "${evalResult.reason}")`);

  // B — koniec łańcucha: PO evaluateProposal.accepted, faktyczne wykonanie transakcji na
  // realnym świecie (nie tylko sprawdzenie że evaluateProposal się zgadza — to jest DOKŁADNIE
  // ten drugi krok, którego zabrakło w rundzie 2: „testy tylko wołały rdzeń bezpośrednio").
  const w = mkWorld(world);
  const { gold, direction, paymentMode } = deriveArgs(ui);
  const executed = executeTechTradeDealCore(0, 1, ui.techId, gold, direction, paymentMode, ui.techOfferId, w.deps);
  ok(executed === true, `[${nazwa}] executeTechTradeDealCore wykonuje deal DO KOŃCA po przejściu przez cały łańcuch formularz->wykonanie`);
  if (direction === 'buy') {
    ok(w.has(0, ui.techId), `[${nazwa}] proponent (kupujący) faktycznie posiada główną technologię PO wykonaniu`);
  } else {
    ok(w.has(1, ui.techId), `[${nazwa}] respondent faktycznie posiada główną technologię PO wykonaniu`);
  }
}

// ---------------------------------------------------------------------------
// B — REGRESJA WPROST na dokładny literał zmierzony przez Evaluatora rundy 3: formularz
// {"techId":"Brazownictwo","techDirection":"buy","techPaymentMode":"tech",
//  "techOfferId":"Kolo","goldOnce":0} musiał dawniej dawać techPrice=0 < próg 50 -> zawsze
// odrzucone. Po naprawie: akceptowane, bo evaluateProposal idzie gałęzią 'tech', nie ceny.
// ---------------------------------------------------------------------------
console.log('\n=== B. Regresja na dokładnym literale zmierzonym przez Evaluatora (BLOKER 1) ===');
{
  const formPayload = { techId: 'Brazownictwo', techDirection: 'buy', techPaymentMode: 'tech', techOfferId: 'Kolo', goldOnce: 0 };
  const ui = buildProposalPayload(formPayload);
  ok(ui.techPaymentMode === 'tech', 'regresja BLOKER 1: techPaymentMode NIE zgubiony (dawniej: undefined po buildProposalFromPayload)');
  ok(ui.techOfferId === 'Kolo', 'regresja BLOKER 1: techOfferId NIE zgubiony (dawniej: undefined po buildProposalFromPayload)');
  ok(ui.techPrice !== 0, 'regresja BLOKER 1: techPrice NIE wylicza się jako 0 w trybie tech (dawniej: 0, bo goldOnce=0 i `?? 50` nie łapie zera — próg minimalny zawsze odrzucał)');
  const evalResult = evalIt(ui);
  ok(evalResult.accepted === true, `regresja BLOKER 1: propozycja AKCEPTOWANA (dawniej zawsze odrzucana komunikatem "Cena poniżej minimum") — powód: "${evalResult.reason}"`);
  ok(!/Cena poniżej minimum/.test(evalResult.reason), 'regresja BLOKER 1: powód NIE zawiera „Cena poniżej minimum" (dowód, że silnik NIE idzie błędną gałęzią cenową gotówkową)');
}

// ---------------------------------------------------------------------------
// C — DOWÓD MUTACYJNY: reprodukcja dokładnej mutacji Evaluatora (białe listy pól bez
// techPaymentMode/techOfferId) na TEJ SAMEJ funkcji wyciętej z main.ts (lokalna kopia
// literału ZE STAREJ, zepsutej wersji) — potwierdza że test w sekcji A/B REALNIE łapie ten
// dokładny regres, nie tylko przypadkiem.
// ---------------------------------------------------------------------------
console.log('\n=== C. DOWÓD MUTACYJNY: białe listy pól bez techPaymentMode/techOfferId (dokładna mutacja rundy 2) ===');
{
  function buggyBuildProposalPayload_RoundTwoMutation(payload) {
    // Dokładnie ta wersja main.ts::buildProposalFromPayload sprzed naprawy BLOKERA 1 —
    // techPaymentMode/techOfferId POMINIĘTE w białej liście.
    return {
      turns: payload.turns,
      goldPerTurn: payload.goldPerTurn,
      goldOnce: payload.goldOnce,
      techId: payload.techId,
      techDirection: payload.techDirection,
      techPrice: payload.techId ? (payload.goldOnce ?? 50) : undefined,
    };
  }
  const formPayload = { techId: 'Brazownictwo', techDirection: 'buy', techPaymentMode: 'tech', techOfferId: 'Kolo', goldOnce: 0 };
  const ui = buggyBuildProposalPayload_RoundTwoMutation(formPayload);
  const mutantLostFields = ui.techPaymentMode === undefined && ui.techOfferId === undefined && ui.techPrice === 0;
  ok(mutantLostFields, 'DOWÓD MUTACYJNY: mutacja rundy 2 (białe listy bez nowych pól) faktycznie gubi techPaymentMode/techOfferId i wylicza techPrice=0');
  const evalResultUnderMutant = evalIt(ui);
  ok(evalResultUnderMutant.accepted === false && /Cena poniżej minimum/.test(evalResultUnderMutant.reason), 'DOWÓD MUTACYJNY: pod mutacją rundy 2 propozycja jest ZAWSZE odrzucana „Cena poniżej minimum" — dokładnie ślepy zaułek zmierzony przez Evaluatora; sekcja B tego pliku by to złapała');
}

try { fs.unlinkSync(entry); } catch (_) {}
try { fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`\ndiplomacy-tech-trade-e2e-test: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
