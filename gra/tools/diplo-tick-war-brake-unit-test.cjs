'use strict';
/**
 * diplo-tick-war-brake-unit-test.cjs — R-WEB-DIPLO-TICK-WAR-BRAKE-Q1 (P6 + P7, czyste funkcje).
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
const bonus = (nadwyzkaPn, epoka = 1, zaufanie = 10, kolejneTuryDostaw = 2) =>
  M.tradeTrustBonusPerTura({ nadwyzkaPn, epoka, zaufanie, kolejneTuryDostaw }, p7);

// --- P7: tabela kroków zgodna z ERAMI silnika (numer 1..10) ---
eq('tabela ma klucze 1..10', Object.keys(p7.wymianaKrokPktPerEpoka).sort((a, b) => a - b), ['1','2','3','4','5','6','7','8','9','10']);
const kroki = [1,2,3,4,5,6,7,8,9,10].map(e => M.krokPktWymiany(e, p7));
eq('kroki: 100,200,400, potem x2 do epoki 10', kroki, [100,200,400,800,1600,3200,6400,12800,25600,51200]);
eq('epoka 0 przycieta do 1', M.krokPktWymiany(0, p7), 100);
eq('epoka 11 przycieta do 10', M.krokPktWymiany(11, p7), 51200);

// --- P7: schodki, epoka 1 (kamień) ---
eq('kamien 0 -> 0', bonus(0), 0);
eq('kamien 99 -> 0', bonus(99), 0);
eq('kamien 100 -> 0.5', bonus(100), 0.5);
eq('kamien 199 -> 0.5', bonus(199), 0.5);
eq('kamien 200 -> 1.0', bonus(200), 1.0);
eq('kamien 1000 -> 5 (limit)', bonus(1000), 5);
eq('kamien 5000 -> 5 (limit)', bonus(5000), 5);
eq('brak interpolacji 150 -> 0.5 (nie 0.75)', bonus(150), 0.5);

// --- P7: epoka 2 (brąz) i 3 (żelazo) ---
eq('braz 199 -> 0', bonus(199, 2), 0);
eq('braz 200 -> 0.5', bonus(200, 2), 0.5);
eq('braz 399 -> 0.5', bonus(399, 2), 0.5);
eq('braz 400 -> 1.0', bonus(400, 2), 1.0);
eq('braz 2000 -> 5', bonus(2000, 2), 5);
eq('zelazo 399 -> 0', bonus(399, 3), 0);
eq('zelazo 400 -> 0.5', bonus(400, 3), 0.5);
eq('zelazo 4000 -> 5', bonus(4000, 3), 5);

// --- P7: epoki po żelazie (x2 na epokę) ---
eq('epoka 4: 799 -> 0, 800 -> 0.5', [bonus(799, 4), bonus(800, 4)], [0, 0.5]);
eq('epoka 10: 51199 -> 0, 51200 -> 0.5', [bonus(51199, 10), bonus(51200, 10)], [0, 0.5]);

// --- P7: minimum 2 tury dostaw, pierwsza tura cyklu = 0 ---
eq('jednorazowa przesylka (1 tura) -> 0', bonus(1000, 1, 10, 1), 0);
eq('2 tury -> bonus', bonus(1000, 1, 10, 2), 5);

// --- P7: sufit 60 ---
eq('sufit: zaufanie 59.8 + 0.5 -> przyciete do 0.2', +bonus(100, 1, 59.8).toFixed(10), 0.2);
eq('sufit: zaufanie 60 -> 0', bonus(1000, 1, 60), 0);
eq('sufit: zaufanie 75 (po darach) -> 0', bonus(1000, 1, 75), 0);

// --- P7: ujemna/zerowa nadwyzka ---
eq('nadwyzka ujemna -> 0', bonus(-500), 0);
eq('NaN -> 0', bonus(NaN), 0);

// --- P7: nieprawidłowa konfiguracja nie przechodzi cicho ---
let threw = false;
try { M.krokPktWymiany(3, { ...p7, wymianaKrokPktPerEpoka: {} }); } catch (_) { threw = true; }
eq('brak kroku w tabeli -> wyjatek', threw, true);

// --- P7: parametry z JSON ---
eq('max per tura z JSON = 5', p7.wymianaMaxPerTura, 5);
eq('sufit z JSON = 60', p7.wymianaSufitZaufania, 60);
eq('0,5 za krok z JSON', p7.wymianaZaufanieNaKrok, 0.5);
eq('brak usunietych kluczy wzoru (zaufaniePerNadwyzkaPn, wymianaRefPn, wymianaOknoTur)',
  ['zaufaniePerNadwyzkaPn', 'wymianaRefPn', 'wymianaOknoTur'].filter(k => k in p7), []);

// --- flaga ---
eq('flaga: nazwa z dispatchu', M.DIPLO_TICK_WAR_BRAKE_FLAG, 'DIPLO_TICK_WAR_BRAKE_ENABLED');
eq('flaga domyslnie OFF w JSON', PARAMS.flagaDomyslna, false);

// --- P6: licznik kryzysu ---
let c = 0;
const trace = [];
for (const z of [0, 0, 0, 0, 0]) {
  const s = M.advanceCrisisCounter(c, z, p6);
  trace.push(s);
  c = s.counter;
}
eq('P6 licznik po 5 turach <=0 = 5', c, 5);
eq('P6 okno ostrzezenia: tury 3 i 4 (2 tury przed wojna)', trace.map(t => t.warnNow), [false, false, true, true, false]);
eq('P6 wojna gotowa dopiero na turze 5', trace.map(t => t.warTriggerReady), [false, false, false, false, true]);

// ostrzezenie widoczne po load w trakcie kryzysu (licznik 3 zapisany w save)
const afterLoad = M.advanceCrisisCounter(2, 0, p6);
eq('P6 po load z licznikiem 2 -> licznik 3, ostrzezenie', [afterLoad.counter, afterLoad.warnNow], [3, true]);

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

// ostrzezenie przy N <= ostrzezenieTurPrzed: okno obejmuje cały kryzys (ZAŁOŻENIE)
const pShort = { kryzysProgZaufania: 0, kryzysTurDoWojny: 2, kryzysOstrzezenieTurPrzed: 5 };
eq('P6 krotkie N: ostrzezenie od pierwszej tury', M.advanceCrisisCounter(0, 0, pShort).warnNow, true);

// --- P6: zapis/odczyt ---
eq('parse: brak pola (stary zapis) -> pusta mapa', M.parseCrisisCounters(undefined), {});
eq('parse: null -> pusta mapa', M.parseCrisisCounters(null), {});
eq('parse: smieci odrzucone', M.parseCrisisCounters({ '1-2': 'x', '1-3': -4, '2-3': 2.9, '4-5': NaN }), { '2-3': 2 });
eq('klucz pary symetryczny', M.crisisPairKey(7, 2), M.crisisPairKey(2, 7));

// --- P6: kolejka i strona wypowiadająca ---
const q = M.sortCrisisQueue([
  { ownerA: 3, ownerB: 4, counter: 2 },
  { ownerA: 5, ownerB: 1, counter: 6 },
  { ownerA: 2, ownerB: 9, counter: 6 },
]);
eq('kolejka: najdluzej na progu, remis -> nizsze ownerId', q.map(e => [e.ownerA, e.ownerB]), [[5, 1], [2, 9], [3, 4]]);
eq('strona silniejsza wypowiada', M.pickWarDeclarer({ ownerId: 1, power: 10 }, { ownerId: 2, power: 30 }), 2);
eq('remis mocy -> nizsze ownerId', M.pickWarDeclarer({ ownerId: 8, power: 10 }, { ownerId: 3, power: 10 }), 3);

try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
console.log(`diplo-tick-war-brake-unit-test: ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
