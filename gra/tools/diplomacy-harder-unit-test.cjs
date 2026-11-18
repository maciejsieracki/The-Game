'use strict';
/**
 * diplomacy-harder-unit-test.cjs — R-WEB-DIPLO-HARDER-RELATIONS-A-NEIGHBOR-TENSION-Q1 (etap 1, część A).
 * Czyste testy A1 (napięcie graniczne), A2 (handel nie daje przyjaźni), A3 (zazdrość lidera)
 * na prawdziwych funkcjach (esbuild), plus parytet flagi OFF dla tickDiplomacy.
 * Run: node tools/diplomacy-harder-unit-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(ROOT, 'src', '.dip-harder-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-harder-bundle.cjs');

fs.writeFileSync(ENTRY, [
  "export * from './game/diplomacy-harder';",
  "export { tickDiplomacy, computeTickZaufanieDelta } from './game/diplomacy';",
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

const P = M.HARDER_PARAMS;
eq('flaga domyslnie OFF', M.isHarderDiplomacyEnabled(), false);

// --- A1: napięcie graniczne ---
eq('A1 tura 0 -> 0', M.napieciePenaltyZaTure(0), 0);
eq('A1 tura 9 -> 0 (przed pierwszym krokiem)', M.napieciePenaltyZaTure(9), 0);
eq('A1 tura 10 -> -1', M.napieciePenaltyZaTure(10), -1);
eq('A1 tura 25 -> -2', M.napieciePenaltyZaTure(25), -2);
eq('A1 tura 59 -> -5', M.napieciePenaltyZaTure(59), -5);
eq('A1 tura 60 -> -6 (granicaMax)', M.napieciePenaltyZaTure(60), -6);
eq('A1 tura 500 -> -6 (ucięte do granicaMax)', M.napieciePenaltyZaTure(500), -6);

M.resetNeighborTenureForTest();
eq('A1 licznik start = 0', M.neighborTenureTur('1|2', 100, true), 0);
eq('A1 licznik idempotentny w turze', M.neighborTenureTur('1|2', 100, true), 0);
eq('A1 licznik po 12 turach = 12', M.neighborTenureTur('1|2', 112, true), 12);
eq('A1 NAP/brak sąsiedztwa zeruje licznik', M.neighborTenureTur('1|2', 113, false), 0);
eq('A1 po resecie start od nowa', M.neighborTenureTur('1|2', 120, true), 0);

// --- A2: handel nie podnosi Zaufania ponad sufit bez NAP/sojuszu ---
eq('A2 pod sufitem bez zmian', M.capZaufanieZaHandel(40, 1, false), 1);
eq('A2 na suficie -> 0', M.capZaufanieZaHandel(50, 1, false), 0);
eq('A2 ponad sufitem -> 0', M.capZaufanieZaHandel(80, 1, false), 0);
eq('A2 z NAP/sojuszem nie obcina', M.capZaufanieZaHandel(80, 1, true), 1);
eq('A2 ujemny dZ nie jest ruszany', M.capZaufanieZaHandel(80, -2, false), -2);

// --- A3: zazdrość lidera ---
const base = { czyParaZLiderem: true, partnerToGracz: false, sojuszZLiderem: false, mocLidera: 120, mocDrugiego: 100 };
eq('A3 lider 20% przewagi -> -2', M.zazdroscLidera({ ...base, mocLidera: 120, mocDrugiego: 100 }), -2);
eq('A3 lider 10% przewagi -> -1', M.zazdroscLidera({ ...base, mocLidera: 110, mocDrugiego: 100 }), -1);
eq('A3 para bez lidera -> 0', M.zazdroscLidera({ ...base, czyParaZLiderem: false }), 0);
eq('A3 partner-gracz -> 0', M.zazdroscLidera({ ...base, partnerToGracz: true }), 0);
eq('A3 sojusznik lidera -> 0', M.zazdroscLidera({ ...base, sojuszZLiderem: true }), 0);
eq('A3 brak mocy lidera -> 0', M.zazdroscLidera({ ...base, mocLidera: 0 }), 0);
eq('A3 parametry z JSON (start -1 / -2 / 20%)',
  [P.zazdroscNaTure, P.zazdroscNaTureDuza, P.zazdroscProgPrzewagi], [1, 2, 0.2]);

// --- integracja z tickDiplomacy (flaga OFF = baza; ON = A2) ---
const rel = (zaufanie) => ({ zaufanie, respekt: 0, status: 'pokoj', relacjaOgolna: zaufanie, traktaty: [], urazyHistoryczne: 0 });

M.setHarderDiplomacyEnabledForTest(false);
const offAt60 = M.tickDiplomacy(rel(60), { turn: 5, aktywnyHandel: true }).zaufanie;
eq('flaga OFF: handel podnosi 60 -> 61 (baza)', offAt60, 61);

M.setHarderDiplomacyEnabledForTest(true);
const onAt60 = M.tickDiplomacy(rel(60), { turn: 5, aktywnyHandel: true }).zaufanie;
eq('flaga ON: handel nie podnosi 60 (A2, zaufanie nie rośnie)', onAt60, 60);
const onAt40 = M.tickDiplomacy(rel(40), { turn: 5, aktywnyHandel: true }).zaufanie;
eq('flaga ON: handel pod sufitem działa jak baza (40 -> 41)', onAt40, 41);
const onNapAt60 = M.tickDiplomacy(rel(60), { turn: 5, aktywnyHandel: true, pokojTrustTier: 'nap' }).zaufanie;
eq('flaga ON: z NAP handel dalej podnosi 60 -> 63 (+1 handel, +2 NAP; A2 nie dotyczy)', onNapAt60, 63);
const onAz = M.tickDiplomacy(rel(40), { turn: 5, zazdroscDelta: -2 }).zaufanie;
eq('flaga ON: zazdrość -2 obniża Zaufanie 40 -> 38 (A3 wpięte w tick)', onAz, 38);
M.setHarderDiplomacyEnabledForTest(false);
eq('flaga OFF: pusty ctx daje dZ 0 (parytet z bazą)', M.computeTickZaufanieDelta({ turn: 5 }, false), 0);
M.setHarderDiplomacyEnabledForTest(null);

try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
console.log(`diplomacy-harder-unit-test: PASS ${pass} FAIL ${fail}`);
if (fail > 0) process.exit(1);
