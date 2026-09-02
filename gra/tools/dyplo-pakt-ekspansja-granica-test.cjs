'use strict';
/**
 * dyplo-pakt-ekspansja-granica-test.cjs — R-DYPLO-PAKT-WETO-EKSPANSJA-Q1
 *
 * Bramka czynnika „Ekspansja przy granicy" przy Pakcie o nieagresji.
 * Test napisany Z KRYTERIÓW KOŃCA dispatchu, nie z implementacji:
 *
 *  A. Pakt NIGDY nie jest strukturalnie nieosiągalny — istnieje oferta, którą gracz
 *     może złożyć, żeby go zawrzeć mimo aktywnego czynnika (GOAL: „albo umowa jest
 *     osiągalna, albo jej niedostępność jest jawnie zakomunikowana").
 *  B. Czynnik nadal COŚ kosztuje — nie został po cichu wyzerowany.
 *  C. Komunikat odmowy mówi gracz-owi CO MA ZROBIĆ: podaje wymaganą liczbę i nazywa
 *     przyczynę narzutu (GOAL: „gracz WIE, co ma zrobić").
 *  D. Czynnik jest STANEM CIĄGŁYM (−2 Zaufania/turę), a nie karą jednorazową —
 *     rozstrzygnięcie rozjazdu kod-vs-UI z kryterium 3 dispatchu.
 *  E. PARYTET (rule_108): ta sama bramka na ścieżce gracz→AI i AI→gracz przy ocenie
 *     silnikowej; jawnie udokumentowany wyjątek ręcznej akceptacji gracza (C-DYP-Q1=A).
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.dyplo-pakt-ekspansja-bundle.cjs');
const entryFile = path.resolve(__dirname, '.dyplo-pakt-ekspansja-entry.ts');
fs.writeFileSync(entryFile, `
export {
  evaluateProposal, evaluatePendingFromAI, resolvePlayerAcceptsAiPending,
  aiCommandToPendingProposal, sweetenerEasePoints, NAP_EKSPANSJA_RELACJA_NARZUT,
} from '../src/game/diplomacy-proposals.ts';
export {
  getEffectiveDiplomacyParams, tickDiplomacy, applyDiplomaticEvent, computeTickZaufanieDelta,
} from '../src/game/diplomacy.ts';
export { buildRelationBreakdown } from '../src/game/diplomacy-factors.ts';
export { renderPnBalancePanelHtml } from '../src/ui/diplomacyAcceptanceBalance.ts';
`, 'utf8');

async function main() {
await esbuild.build({
  entryPoints: [entryFile],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
  loader: { '.json': 'json', '.svg': 'text', '.css': 'text' },
});

const {
  evaluateProposal, evaluatePendingFromAI, resolvePlayerAcceptsAiPending,
  aiCommandToPendingProposal, sweetenerEasePoints, NAP_EKSPANSJA_RELACJA_NARZUT,
  getEffectiveDiplomacyParams, tickDiplomacy, applyDiplomaticEvent, computeTickZaufanieDelta,
  buildRelationBreakdown, renderPnBalancePanelHtml,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

const rel = (z, r, s = 'pokoj') => ({ zaufanie: z, respekt: r, status: s });
const ctx = (o = {}) => ({
  relation: rel(60, 50), stanWojny: false, turn: 10,
  proposerRespekt: 40, responderRespekt: 60, militaryRatio: 1, ...o,
});
const prop = (a, p = 0, r = 1, pay = {}) => ({ actionId: a, proposerOwnerId: p, responderOwnerId: r, payload: pay });
const gold = n => ({ turns: 15, giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: n }] });

console.log('dyplo-pakt-ekspansja-granica-test');
const P = getEffectiveDiplomacyParams('normal');
const BASE = P.progNapRelacja;          // 50 @ normal
const NARZUT = NAP_EKSPANSJA_RELACJA_NARZUT;

// ---------------------------------------------------------------------------
// A. Pakt jest OSIĄGALNY mimo czynnika — trzy niezależne drogi.
// ---------------------------------------------------------------------------
// A1 — sama Relacja wystarczy, gdy przekracza próg z narzutem.
{
  const score = BASE + NARZUT;          // dokładnie na progu
  const r = evaluateProposal(prop('nap', 0, 1, { turns: 15 }),
    ctx({ relation: rel(score, 0), ekspansjaPrzyGranicy: true }));
  ok(r.accepted && r.deal?.rodzaj === 'pakt_nieagresji',
    `A1 Relacja ${score} (=próg+narzut) + ekspansja → pakt zawarty`);
}
// A2 — MAKSYMALNY słodzik kasuje narzut w całości: Relacja na gołym progu wystarcza.
//      To jest gwarancja z definicji stałej (narzut === sufit ease) — bez niej czynnik
//      znów mógłby stać się nieprzebijalny.
{
  const pay = gold(20 * 25);            // 500 PW netto = sufit ease (20 pkt)
  const ease = sweetenerEasePoints(pay, { difficulty: 'normal', proposerOwnerId: 0, playerOwnerId: 0 });
  ok(ease === NARZUT, `A2a sufit słodzika (${ease}) === narzut ekspansji (${NARZUT})`);
  const r = evaluateProposal(prop('nap', 0, 1, pay),
    ctx({ relation: rel(BASE, 0), ekspansjaPrzyGranicy: true }));
  ok(r.accepted, `A2b Relacja ${BASE} (goły próg) + maks. słodzik + ekspansja → pakt zawarty`);
}
// A3 — REGRESJA GŁÓWNA: sytuacja ze zgłoszenia właściciela (oryginalnie Relacja 81/200
//      przy progNapRelacja=50), przed naprawą odrzucane BEZWARUNKOWO, niezależnie od kwoty.
//      SKALOWANE (R-BALANS-PAKT-NIEAGRESJI-I-GLINA-Q1, 2026-09-02): próg podniesiony 50->90
//      (progNapRelacja w gra/data/diplomacy.json, WYROCZNIA runtime — gra/src/game/diplomacy.ts
//      to tylko fallback nadpisywany przez ten JSON w getBaseDiplomacyParams(); oba zmienione
//      w tym temacie). gold(300) daje ease=12 (300/25, sufit ease=20 wymaga >=500 PW — patrz A2),
//      więc próg efektywny = 90+20(narzut ekspansji)-12 = 98. Zauf/Resp podniesione tak, by
//      scenariusz dalej dowodził TEGO SAMEGO: brak strukturalnego weta — hojna oferta domyka
//      lukę do progu (zmierzone realnym evaluateProposal, nie wyliczone na papierze).
{
  const r = evaluateProposal(prop('nap', 0, 1, gold(300)),
    ctx({ relation: rel(41, 64), ekspansjaPrzyGranicy: true }));
  ok(r.accepted, 'A3 zgłoszenie właściciela, skalowane do progu 90 (Zauf 41 + Resp 64 = Relacja 105, oferta 300 PW) → pakt zawarty');
}
// A4 — dowód, że NIE MA już sufitu nieprzebijalności: maksymalna możliwa Relacja przechodzi.
{
  const r = evaluateProposal(prop('nap', 0, 1, { turns: 15 }),
    ctx({ relation: rel(100, 100), ekspansjaPrzyGranicy: true }));
  ok(r.accepted, 'A4 Relacja 200/200 + ekspansja → pakt zawarty (przed naprawą: NIGDY)');
}

// ---------------------------------------------------------------------------
// B. Czynnik nadal kosztuje — zero cichego rozluźnienia do no-op.
// ---------------------------------------------------------------------------
{
  const score = BASE + NARZUT - 1;      // jeden punkt pod progiem z narzutem
  const withExp = evaluateProposal(prop('nap', 0, 1, { turns: 15 }),
    ctx({ relation: rel(score, 0), ekspansjaPrzyGranicy: true }));
  const noExp = evaluateProposal(prop('nap', 0, 1, { turns: 15 }),
    ctx({ relation: rel(score, 0), ekspansjaPrzyGranicy: false }));
  ok(!withExp.accepted, `B1 Relacja ${score} + ekspansja → ODRZUCONE (czynnik dalej boli)`);
  ok(noExp.accepted, `B2 ta sama Relacja ${score} BEZ ekspansji → przyjęte (różnica to wyłącznie czynnik)`);
  ok(NARZUT > 0, 'B3 narzut > 0 — czynnik nie został wyzerowany');
}
// B4 — czynnik nie wypycha progu wyżej niż o narzut (nie ma podwójnego liczenia).
{
  const r = evaluateProposal(prop('nap', 0, 1, { turns: 15 }),
    ctx({ relation: rel(BASE + NARZUT, 0), ekspansjaPrzyGranicy: true }));
  const r2 = evaluateProposal(prop('nap', 0, 1, { turns: 15 }),
    ctx({ relation: rel(BASE, 0), ekspansjaPrzyGranicy: false }));
  ok(r.accepted && r2.accepted, 'B4 próg z ekspansją = próg bazowy + dokładnie narzut');
}

// ---------------------------------------------------------------------------
// C. Uczciwość komunikatu — gracz wie CO ZROBIĆ (GOAL).
// ---------------------------------------------------------------------------
{
  const r = evaluateProposal(prop('nap', 0, 1, { turns: 15 }),
    ctx({ relation: rel(BASE, 0), ekspansjaPrzyGranicy: true }));
  const msg = String(r.reason ?? '');
  ok(!r.accepted, 'C0 scenariusz odmowy przygotowany');
  ok(msg.includes(String(BASE + NARZUT)),
    `C1 komunikat podaje WYMAGANĄ liczbę (${BASE + NARZUT}): "${msg}"`);
  ok(/ekspansj/i.test(msg), 'C2 komunikat nazywa przyczynę narzutu (ekspansja przy granicy)');
  ok(/dołóż|podnieś/i.test(msg), 'C3 komunikat mówi, JAKĄ akcją to zdjąć (dołóż do oferty / podnieś Relację)');
  ok(!/brak zaufania do paktu/.test(msg),
    'C4 zniknął stary, bezwyjściowy komunikat „brak zaufania do paktu"');
}
// C5 — bez czynnika komunikat zostaje w starej, krótkiej formie (brak szumu).
{
  const r = evaluateProposal(prop('nap', 0, 1, { turns: 15 }),
    ctx({ relation: rel(BASE - 1, 0), ekspansjaPrzyGranicy: false }));
  ok(!r.accepted && !/ekspansj/i.test(String(r.reason)),
    'C5 bez ekspansji komunikat nie wspomina o ekspansji');
}

// ---------------------------------------------------------------------------
// D. Stan CIĄGŁY vs kara jednorazowa (kryterium 3 dispatchu).
// ---------------------------------------------------------------------------
{
  let r = rel(50, 50);
  for (let t = 1; t <= 5; t++) r = tickDiplomacy(r, { turn: t, ekspansjaPrzyGranicy: true });
  ok(r.zaufanie === 40, `D1 stan ciągły: Zaufanie 50 → ${r.zaufanie} po 5 turach (−2/turę, nie jednorazowo)`);
  ok(computeTickZaufanieDelta({ turn: 1, ekspansjaPrzyGranicy: true }, false) === -2,
    'D2 delta per tura = −2');
  const oneShot = applyDiplomaticEvent(rel(20, 30), 'tarcia_graniczne');
  ok(oneShot.zaufanie === 18,
    'D3 `tarcia_graniczne` to OSOBNE, jednorazowe zdarzenie (20 → 18) — nie ten sam mechanizm');
  const row = (buildRelationBreakdown([], { ekspansjaPrzyGranicy: true }, getEffectiveDiplomacyParams('normal'))
    .negatywne || []).find(x => /kspansj/.test(x.label || ''));
  ok(!!row && row.perTurn === true && row.value === -2,
    'D4 wiersz UI „ZA CO CIĘ NIE LUBIĄ" zgodny z pomiarem: −2, perTurn=true');
}

// ---------------------------------------------------------------------------
// E. PARYTET gracz ↔ AI (rule_108).
// ---------------------------------------------------------------------------
{
  const pend = aiCommandToPendingProposal(
    { type: 'zaproponuj_pakt', targetId: '0', powod: 'x', turns: 15 }, 1, 0, 10);
  const c = ctx({ relation: rel(BASE, 0), ekspansjaPrzyGranicy: true });
  // E1 — ocena silnikowa jest identyczna niezależnie od kierunku propozycji.
  const playerToAi = evaluateProposal(prop('nap', 0, 1, { turns: 15 }), c);
  const aiToPlayer = evaluatePendingFromAI(pend, c);
  ok(playerToAi.accepted === aiToPlayer.accepted && playerToAi.reason === aiToPlayer.reason,
    'E1 gracz→AI i AI→gracz: identyczny werdykt i identyczny komunikat (brak asymetrii bramki)');
  // E2 — i po drugiej stronie progu tak samo.
  const c2 = ctx({ relation: rel(BASE + NARZUT, 0), ekspansjaPrzyGranicy: true });
  ok(evaluateProposal(prop('nap', 0, 1, { turns: 15 }), c2).accepted
    === evaluatePendingFromAI(pend, c2).accepted,
    'E2 parytet zachowany również powyżej progu');
  // E3 — JAWNY, udokumentowany wyjątek: ręczna akceptacja gracza nie ma progów (C-DYP-Q1=A).
  //      Pinujemy go, żeby przyszła zmiana nie przemknęła jako „przypadkowa asymetria".
  const manual = resolvePlayerAcceptsAiPending(pend, 10, 'normal', { atWar: false });
  ok(manual.accepted,
    'E3 ręczna akceptacja gracza celowo bez progów (C-DYP-Q1=A) — wyjątek JAWNY, nie przypadkowy');
}

// ---------------------------------------------------------------------------
// F. Komunikat DOCIERA NA EKRAN — nie zostaje w silniku (GOAL: „gracz WIE").
//     Panel bilansu renderuje `responderPreview.reason` dosłownie, więc uczciwość
//     komunikatu z sekcji C jest tym, co gracz faktycznie widzi na Stole negocjacji.
// ---------------------------------------------------------------------------
{
  const blocked = evaluateProposal(prop('nap', 0, 1, { turns: 15 }),
    ctx({ relation: rel(BASE, 0), ekspansjaPrzyGranicy: true }));
  const html = renderPnBalancePanelHtml({
    actionLabel: 'Pakt o nieagresji',
    theirBalance: { mode: 'treaty', accepted: false, balancePn: 64, statusLabel: 'x' },
    myBalance: { mode: 'treaty', accepted: false, balancePn: 64 },
    awaitingAiResponse: true,
    canAccept: false,
    responderPreview: { accepted: blocked.accepted, reason: blocked.reason },
  });
  ok(html.includes(String(BASE + NARZUT)),
    `F1 panel bilansu pokazuje graczowi wymaganą liczbę (${BASE + NARZUT})`);
  ok(/ekspansj/i.test(html), 'F2 panel bilansu nazywa przyczynę narzutu');
  ok(!html.includes('brak zaufania do paktu'),
    'F3 panel bilansu nie pokazuje już bezwyjściowego „brak zaufania do paktu"');
  ok(html.includes('da-pn-balance-bar no'), 'F4 panel nadal koloruje odmowę na czerwono (bez regresji tonu)');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
