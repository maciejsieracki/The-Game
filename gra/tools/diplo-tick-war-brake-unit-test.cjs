'use strict';
/**
 * diplo-tick-war-brake-unit-test.cjs — R-WEB-DIPLO-TICK-WAR-BRAKE-Q1 r2 (P6 + P7, czyste funkcje).
 * Run: node tools/diplo-tick-war-brake-unit-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(ROOT, 'src', '.dip-warbrake-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-warbrake-bundle.cjs');
const PARAMS = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'data', 'diplomacy-tick-params.json'), 'utf8'));

fs.writeFileSync(ENTRY, `export * from './game/diplomacy-tick-war-brake';\n`);
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

const p7 = PARAMS.p7;
const p6 = PARAMS.p6;
// epoka: 1 = kamien, 2 = braz, 3 = zelazo (ZALOZENIE r2)
const bonus = (nadwyzkaPn, epoka = 1, zaufanie = 10, kolejneTuryDostaw = 2) =>
  M.tradeTrustBonusPerTura({ nadwyzkaPn, epoka, zaufanie, kolejneTuryDostaw }, p7);

// --- flaga ---
eq('flaga domyslnie ON (wydanie ROBOCZA)', M.isDiploTickWarBrakeEnabled(), true);
M.setDiploTickWarBrakeOverride(false);
eq('override OFF', M.isDiploTickWarBrakeEnabled(), false);
M.setDiploTickWarBrakeOverride(null);
eq('override zdjety -> default ON', M.isDiploTickWarBrakeEnabled(), true);

// --- P7: tabela schodkowa kamien (100) ---
eq('kamien 0 -> 0', bonus(0), 0);
eq('kamien 99 -> 0', bonus(99), 0);
eq('kamien 100 -> 0.5', bonus(100), 0.5);
eq('kamien 149 -> 0.5 (brak interpolacji)', bonus(149), 0.5);
eq('kamien 150 -> 0.5', bonus(150), 0.5);
eq('kamien 199 -> 0.5', bonus(199), 0.5);
eq('kamien 200 -> 1.0', bonus(200), 1.0);
eq('kamien 1000 -> 5 (limit = 10 krokow)', bonus(1000), 5);
eq('kamien 5000 -> 5 (limit)', bonus(5000), 5);

// --- P7: brąz (200) i żelazo (400) ---
eq('braz 199 -> 0', bonus(199, 2), 0);
eq('braz 200 -> 0.5', bonus(200, 2), 0.5);
eq('braz 399 -> 0.5', bonus(399, 2), 0.5);
eq('braz 2000 -> 5', bonus(2000, 2), 5);
eq('zelazo 399 -> 0', bonus(399, 3), 0);
eq('zelazo 400 -> 0.5', bonus(400, 3), 0.5);
eq('zelazo 4000 -> 5', bonus(4000, 3), 5);

// --- P7: podwajanie na epoke ponad zelazo ---
eq('epoka 4 krok 800: 799 -> 0', bonus(799, 4), 0);
eq('epoka 4 krok 800: 800 -> 0.5', bonus(800, 4), 0.5);
eq('epoka 5 krok 1600: 1600 -> 0.5', bonus(1600, 5), 0.5);
eq('epoka 5 krok 1600: 8000 -> 2.5 (5 krokow)', bonus(8000, 5), 2.5);
eq('epoka 5 krok 1600: 16000 -> 5 (limit)', bonus(16000, 5), 5);
eq('krokPktWymiany(7) = 6400', M.krokPktWymiany(7, p7), 6400);

// --- P7: minimum 2 tury dostaw, pierwsza tura cyklu = 0 ---
eq('jednorazowa przesylka (1 tura) -> 0', bonus(1000, 1, 10, 1), 0);
eq('pierwsza tura cyklu (1) -> 0', bonus(5000, 3, 10, 1), 0);
eq('2 tury -> bonus', bonus(1000, 1, 10, 2), 5);

// --- P7: sufit 60 ---
eq('sufit: zaufanie 59.8 + 0.5 -> przyciete do 0.2', +bonus(100, 1, 59.8).toFixed(10), 0.2);
eq('sufit: zaufanie 60 -> 0', bonus(1000, 1, 60), 0);
eq('sufit: zaufanie 75 -> 0', bonus(1000, 1, 75), 0);

// --- P7: ujemna/zerowa nadwyzka ---
eq('nadwyzka ujemna -> 0', bonus(-500), 0);
eq('NaN -> 0', bonus(NaN), 0);

// --- P7: parametry z JSON (wersja ostateczna) ---
eq('max per tura z JSON = 5', p7.wymianaMaxPerTura, 5);
eq('sufit z JSON = 60', p7.wymianaSufitZaufania, 60);
eq('krok na zaufanie z JSON = 0.5', p7.wymianaZaufanieNaKrok, 0.5);
eq('krok kamien/braz/zelazo z JSON', [p7.wymianaKrokPktPerEpoka['1'], p7.wymianaKrokPktPerEpoka['2'], p7.wymianaKrokPktPerEpoka['3']], [100, 200, 400]);
eq('usuniete parametry wzoru nie istnieja', [p7.zaufaniePerNadwyzkaPn, p7.wymianaRefPn, p7.wymianaOknoTur], [undefined, undefined, undefined]);

// --- P6: licznik kryzysu ---
let c = 0;
const trace = [];
for (const z of [0, 0, 0, 0, 0]) {
  const s = M.advanceCrisisCounter(c, z, p6);
  trace.push(s);
  c = s.counter;
}
eq('P6 licznik po 5 turach <=0 = 5', c, 5);
eq('P6 ostrzezenie od tury 3 (2 tury przed wojna)', trace.map(t => t.warningActive), [false, false, true, true, true]);
eq('P6 wojna gotowa dopiero na turze 5', trace.map(t => t.warTriggerReady), [false, false, false, false, true]);

// ostrzezenie widoczne takze po load w trakcie kryzysu (licznik 4, nie tylko rownosc)
const afterLoad = M.advanceCrisisCounter(4, 0, p6);
eq('P6 po load licznik 4 -> ostrzezenie aktywne', afterLoad.warningActive, true);

// powyzej progu licznik sie zeruje
const up = M.advanceCrisisCounter(4, 1, p6);
eq('P6 Zaufanie > prog kasuje licznik', up.counter, 0);
eq('P6 Zaufanie > prog nie wyzwala wojny', up.warTriggerReady, false);

// przerwa w kryzysie resetuje odliczanie
let c2 = 0;
for (const z of [0, 0, 0, 5, 0, 0]) c2 = M.advanceCrisisCounter(c2, z, p6).counter;
eq('P6 przerwa resetuje, po niej 2 tury', c2, 2);

// prog dokladnie na granicy (<=)
eq('P6 Zaufanie == prog liczy sie jako kryzys', M.advanceCrisisCounter(0, 0, p6).counter, 1);

// --- P6: zapis/odczyt ---
eq('parse: brak pola (stary zapis) -> pusta mapa', M.parseCrisisCounters(undefined), {});
eq('parse: null -> pusta mapa', M.parseCrisisCounters(null), {});
eq('parse: smieci odrzucone', M.parseCrisisCounters({ '1-2': 'x', '1-3': -4, '2-3': 2.9, '4-5': NaN }), { '2-3': 2 });
eq('klucz pary symetryczny', M.crisisPairKey(7, 2), M.crisisPairKey(2, 7));

// --- P6: kolejka i strona wypowiadajaca ---
const q = M.sortCrisisQueue([
  { ownerA: 3, ownerB: 4, counter: 2 },
  { ownerA: 5, ownerB: 1, counter: 6 },
  { ownerA: 2, ownerB: 9, counter: 6 },
]);
eq('kolejka: najdluzej na progu, remis -> nizsze ownerId', q.map(e => [e.ownerA, e.ownerB]), [[5, 1], [2, 9], [3, 4]]);
eq('strona silniejsza wypowiada', M.pickWarDeclarer({ ownerId: 1, power: 10 }, { ownerId: 2, power: 30 }), 2);
eq('remis mocy -> nizsze ownerId', M.pickWarDeclarer({ ownerId: 8, power: 10 }, { ownerId: 3, power: 10 }), 3);

// --- r3 P6: wojna w toku nie liczy kryzysu (brak smiecia `1` w save) ---
eq('r3 P6: para w wojnie -> licznik 0 mimo Zaufania <= 0', M.crisisStepForPair(3, -5, true, p6).counter, 0);
eq('r3 P6: para w wojnie -> brak ostrzezenia i gotowosci', M.crisisStepForPair(3, -5, true, p6).warTriggerReady, false);
eq('r3 P6: pokoj (nie wojna) nadal liczy kryzys', M.crisisStepForPair(3, 0, false, p6).counter, 4);
eq('r3 P6: pokoj, Zaufanie > prog -> reset', M.crisisStepForPair(3, 1, false, p6).counter, 0);
// dokladnie N=5 tur kryzysu -> gotowosc dopiero w 5. turze, ostrzezenie od 3. (N-2)
let cs = { counter: 0, warningActive: false, warTriggerReady: false };
const seq = [];
for (let t = 1; t <= 6; t++) { cs = M.crisisStepForPair(cs.counter, 0, false, p6); seq.push([cs.counter, cs.warningActive, cs.warTriggerReady]); }
eq('r3 P6: sekwencja licznika/ostrzezenia/gotowosci', seq, [
  [1, false, false], [2, false, false], [3, true, false], [4, true, false], [5, true, true], [6, true, true],
]);

// --- r3 P4: dobra wola +1 trwa DOKLADNIE N tur (N=3 po darze) ---
let dw = 3;
const dwActive = [];
for (let t = 1; t <= 4; t++) { const st = M.dobraWolaTurnStep(dw); dwActive.push(st.activeThisTurn); dw = st.next; }
eq('r3 P4: dobra wola aktywna w 3 kolejnych turach, potem nie', dwActive, [true, true, true, false]);
eq('r3 P4: licznik 0 -> nieaktywna, bez ujemnych', M.dobraWolaTurnStep(0), { activeThisTurn: false, next: 0 });

// --- r3 P3: pary AI↔AI ---
const pairs = M.aiAiPairs([1, 2, 3, 4]);
eq('r3 P3: 4 owners -> 6 unikalnych par (i<j)', pairs.length, 6);
eq('r3 P3: kazda para raz, bez duplikatow', new Set(pairs.map(p => p.join('_'))).size, 6);
eq('r3 P3: brak par z 1 ownerem', M.aiAiPairs([7]).length, 0);
const okInfo = { isPlayer: false, isBarbarian: false, isCityCopy: false, eliminated: false, cityCount: 3 };
eq('r3 P3: zwykly AI z miastami = kwalifikuje sie', M.isAiAiEligibleOwner(okInfo), true);
eq('r3 P3: gracz wykluczony', M.isAiAiEligibleOwner({ ...okInfo, isPlayer: true }), false);
eq('r3 P3: barbarzynca wykluczony', M.isAiAiEligibleOwner({ ...okInfo, isBarbarian: true }), false);
eq('r3 P3: kopia miasta-panstwa wykluczona', M.isAiAiEligibleOwner({ ...okInfo, isCityCopy: true }), false);
eq('r3 P3: eliminowany (duch) wykluczony', M.isAiAiEligibleOwner({ ...okInfo, eliminated: true }), false);
eq('r3 P3: owner bez miast (duch) wykluczony', M.isAiAiEligibleOwner({ ...okInfo, cityCount: 0 }), false);

try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
console.log(`diplo-tick-war-brake-unit-test: ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
