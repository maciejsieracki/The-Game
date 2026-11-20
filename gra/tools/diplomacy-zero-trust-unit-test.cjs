'use strict';
/**
 * diplomacy-zero-trust-unit-test.cjs — R-WEB-DIPLO-ZERO-TRUST-TREATY-BREAK-PROTECTOR-Q1 (etap C, część 1).
 * Czyste testy na prawdziwych funkcjach (esbuild): licznik zerowego zaufania (narasta / zeruje), próg 5,
 * reset, flaga domyślnie OFF (parytet), wybór protektora (C1) i premia celu w planerze sojuszy
 * (planAiAiAllianceTickFull, tylko kolejność celu; progi E1 nietknięte).
 * Run: node tools/diplomacy-zero-trust-unit-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(ROOT, 'src', '.dip-zerotrust-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-zerotrust-bundle.cjs');

fs.writeFileSync(ENTRY, [
  "export * from './game/diplomacy-zero-trust';",
  "export { planAiAiAllianceTickFull } from './game/ai-ai-alliance-tick';",
  "export { RodzajTraktatu } from './types/diplomacy';",
].join('\n') + '\n');
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE, logLevel: 'silent' });
} finally {
  try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
}
const M = require(BUNDLE);

let pass = 0;
let fail = 0;
function eq(name, got, want) {
  const ok = Object.is(got, want) || JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++;
  else { fail++; console.log(`FAIL ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
}

// --- flaga i parametry (R-WEB-DIPLO-ENABLE-ALL-FLAGS-Q1, decyzja właściciela 2026-11-19: domyślnie ON w danych;
//     zachowanie OFF pokryte jawnym hakiem false) ---
M.resetZeroTrustSession();
eq('flaga domyslnie ON (dane)', M.isZeroTrustEnabled(), true);
eq('prog z danych = 5', M.zeroZaufaniaProgTur(), 5);
M.setZeroTrustEnabledForTest(false);
eq('hak OFF wymusza wylaczenie', M.isZeroTrustEnabled(), false);
M.setZeroTrustEnabledForTest(true);
eq('hak ON', M.isZeroTrustEnabled(), true);
M.setZeroTrustEnabledForTest(null);
eq('hak null wraca do danych (ON)', M.isZeroTrustEnabled(), true);

// --- licznik: narasta przy Zaufaniu 0, zeruje gdy > 0 ---
M.resetZeroTrustSession();
eq('licznik start 0', M.zeroTrustCount(1, 2), 0);
eq('krok 1', M.zeroTrustAdvancePair(1, 2, 0), 1);
eq('krok 2', M.zeroTrustAdvancePair(1, 2, 0), 2);
eq('zaufanie > 0 zeruje', M.zeroTrustAdvancePair(1, 2, 10), 0);
eq('po zerowaniu znów 1', M.zeroTrustAdvancePair(1, 2, 0), 1);
eq('kierunkowy: 2->1 osobny licznik', M.zeroTrustCount(2, 1), 0);
eq('zaufanie ujemne liczy jak zero', M.zeroTrustAdvancePair(1, 2, -5), 2);
eq('NaN nie zmienia licznika', M.zeroTrustAdvancePair(1, 2, NaN), 2);
eq('ai==partner ignorowane', M.zeroTrustAdvancePair(3, 3, 0), 0);

// --- próg 5 ---
M.resetZeroTrustSession();
for (let i = 0; i < 4; i++) M.zeroTrustAdvancePair(1, 0, 0);
eq('4 tury: brak zerwania', M.zeroTrustBreakDue(1, 0), false);
M.zeroTrustAdvancePair(1, 0, 0);
eq('5 tur: zerwanie', M.zeroTrustBreakDue(1, 0), true);
eq('próg jawny 6', M.zeroTrustBreakDue(1, 0, 6), false);

// --- reset (nowa gra / wczytanie) ---
M.resetZeroTrustSession();
eq('reset czyści licznik', M.zeroTrustCount(1, 0), 0);
eq('reset czyści statystyki', M.zeroTrustStats().zerwania, 0);

// --- rejestr zerwań (hak odczytowy) ---
M.zeroTrustRecordBreak(12, 1, 0, ['Pakt o nieagresji', 'Umowa handlowa']);
const st = M.zeroTrustStats();
eq('stats: 1 zerwanie', st.zerwania, 1);
eq('stats: tura i partner', [st.log[0].turn, st.log[0].ai, st.log[0].partner], [12, 1, 0]);

// --- C1: protektor (partner = gracz 0 i AI 2; AI 1 słabsza od gracza, silniejsza od AI 2) ---
const moc = { 0: 100, 1: 40, 2: 20, 3: 70, 4: 55 };
const powerOf = (oid) => moc[oid];
M.resetZeroTrustSession();
const owners = [1, 2, 3, 4];
const partnerzy = [0, 2, 3, 4, 1];
eq('C1 brak licznika = brak premii', M.zeroTrustPreferredTarget(1, owners, partnerzy, powerOf), null);
M.zeroTrustAdvancePair(1, 0, 0); // zaufanie 0 wobec gracza, gracz silniejszy (100 > 40)
eq('C1 najsilniejsza trzecia (bez gracza i p) = 3', M.zeroTrustPreferredTarget(1, owners, partnerzy, powerOf), 3);
// AI silniejsza od partnera: brak premii
M.resetZeroTrustSession();
M.zeroTrustAdvancePair(3, 2, 0); // 3 (70) wobec 2 (20): 3 silniejsza → brak premii
eq('C1 silniejsza AI bez premii', M.zeroTrustPreferredTarget(3, owners, partnerzy, powerOf), null);
// partner wykluczony z celów: gracz (0) nie jest w owners, a AI-partner 3 nie może być celem
M.resetZeroTrustSession();
M.zeroTrustAdvancePair(1, 3, 0); // 1 (40) słabsza od 3 (70)
eq('C1 partner 3 wykluczony, cel = 4', M.zeroTrustPreferredTarget(1, owners, partnerzy, powerOf), 4);

// --- C1 w planerze sojuszy: premia zmienia wybór celu, bez zmiany E1 ---
function planFor(preferowanyCel) {
  const side = { power: 1, treasuryGold: 0, allies: [], enemies: [] };
  return M.planAiAiAllianceTickFull({
    turn: 8,
    owners: [1, 2, 3],
    alliancesCount: new Map([[1, 0], [2, 0], [3, 0]]),
    pairPrefilter: () => true,
    pairInfo: () => ({
      warStatus: 'pokoj', hasNap: false, hasAlliance: false, sharesBorder: true,
      relacja: 50, zaufanie: 50, willingness: 0.9,
    }),
    sideOf: () => side,
    treasury: new Map([[1, 0], [2, 0], [3, 0]]),
    maxSojuszy: 2,
    ponowneProbyTur: 8,
    evaluate: () => ({ accept: true, reason: 'ok', paymentGold: 0, payer: null }),
    preferowanyCel,
  });
}
const celP1 = (plan) => plan.accepted.find(a => a.proposer === 1)?.target ?? null;
eq('planer bez premii: cel proponenta 1 = najniższe id (2)', celP1(planFor(undefined)), 2);
eq('planer z premia (1,3): cel proponenta 1 = 3', celP1(planFor((p, t) => p === 1 && t === 3)), 3);
eq('planer premia dla innego proponenta: cel 1 bez zmiany', celP1(planFor((p, t) => p === 2 && t === 3)), 2);

// --- krok licznika per para: sekwencja narastania i zerowania jak w tickZeroTrustTreaties ---
M.resetZeroTrustSession();
const serie = [0, 0, 0, 5, 0, 0, 0, 0, 0];
const wyniki = serie.map(z => M.zeroTrustAdvancePair(2, 0, z));
eq('seria licznika', wyniki, [1, 2, 3, 0, 1, 2, 3, 4, 5]);

// --- plan zerwania (main.ts tickZeroTrustTreaties → zeroTrustBreakOrders; filtr handel/NAP, wasale, licznik) ---
const T = M.RodzajTraktatu;
const deal = (id, rodzaj, a, b) => ({ id, rodzaj, strony: a < b ? [a, b] : [b, a] });
const lbl = (r) => String(r);
let zMap = () => 0;
const plan = (deals, owners = [1, 2]) => M.zeroTrustBreakOrders({ me: 0, owners, deals, zaufanie: (ai, p) => zMap(ai, p), labelOf: lbl });
const sig = (orders) => orders.map(o => [o.ai, o.partner, o.dealIds]);

M.resetZeroTrustSession();
M.setZeroTrustEnabledForTest(false);
eq('plan OFF = brak zleceń', sig(plan([deal('nap', T.PaktNieagresji, 0, 1)])), []);
eq('plan OFF nie zmienia licznika', M.zeroTrustCount(1, 0), 0);
M.setZeroTrustEnabledForTest(true);

M.resetZeroTrustSession();
const dealsG = [
  deal('nap', T.PaktNieagresji, 0, 1),
  deal('sojusz', T.SojuszWojskowy, 0, 1),
  deal('handel', T.UmowaHandlowa, 0, 1),
  deal('ai-h', T.UmowaHandlowa, 1, 2),
  deal('ai-sojusz', T.SojuszWojskowy, 1, 2),
];
for (let t = 1; t <= 4; t++) eq(`tura ${t}: brak zleceń (próg 5)`, sig(plan(dealsG)), []);
const o5 = plan(dealsG);
eq('tura 5: zlecenia tylko handel/NAP (sojusz nietknięty)', sig(o5), [[1, 0, ['nap', 'handel']], [1, 2, ['ai-h']], [2, 1, ['ai-h']]]);
eq('tura 5: etykiety typów z labelOf', o5[0].typy, ['pakt_nieagresji', 'umowa_handlowa']);
for (const o of o5) M.zeroTrustRecordBreak(5, o.ai, o.partner, o.typy);
eq('po zerwaniu licznik pary (1,0) = 0', M.zeroTrustCount(1, 0), 0);
eq('tura 6 po zerwaniu: brak powtórki (licznik 1)', sig(plan(dealsG)), []);
eq('licznik (1,0) po turze 6 = 1', M.zeroTrustCount(1, 0), 1);
for (let t = 7; t <= 9; t++) plan(dealsG);
eq('tura 10: powtórka dopiero po 5 kolejnych turach', sig(plan(dealsG)).some(x => x[0] === 1 && x[1] === 0), true);

// zaufanie > 0 zeruje licznik w planie
M.resetZeroTrustSession();
for (let t = 1; t <= 4; t++) plan(dealsG);
zMap = (ai, p) => (ai === 1 && p === 0 ? 10 : 0);
plan(dealsG);
zMap = () => 0;
eq('zaufanie > 0 zeruje licznik (1,0)', M.zeroTrustCount(1, 0), 0);

// wasal (gracz i AI) wykluczony po obu stronach: brak zleceń z graczem i z wasalem
M.resetZeroTrustSession();
const dW = [deal('nap', T.PaktNieagresji, 0, 1), deal('wasal', T.Wasalizacja, 0, 3)];
let wOrders = [];
for (let t = 1; t <= 6; t++) wOrders = wOrders.concat(sig(plan(dW, [1, 2, 3])));
eq('wasal: brak zleceń z graczem-wasalem i AI-wasalem', wOrders, []);
eq('wasal: licznik pary z wasalem nie rośnie', M.zeroTrustCount(1, 0), 0);

fs.unlinkSync(BUNDLE);
console.log(`diplomacy-zero-trust-unit-test: PASS=${pass} FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
