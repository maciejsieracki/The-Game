'use strict';
/**
 * ai-plus10-matrix-test.cjs — R-WEB-CULT-REL-AI-PLUS10-Q1 (poprawka rundy 2, 2026-11-27).
 *
 * Macierz 3×3 „Kultura i religia”: poziom GRACZA × poziom AI, epoki 1–3, linie Kultury i Religii.
 *
 * Tabele (wartość linii przy 100% / 0% własnej; epoki 1/2/3; skala 1,0 / 1,6 / 2,3):
 *   Wspólna formuła ADDYTYWNA (runda 2, DODATEK 4): Δ = 0/+6/+13 dodane do granic epoki 1;
 *   D_e = D − Δ, G_e = G_podmiotu + Δ, wartość = D_e + (G_e − D_e)·udział.
 *   GRACZ (człowiek, także hotseat):
 *     łatwy    G +10/+16/+23   D −10/−16/−23
 *     normalny G  +5/+11/+18   D −15/−21/−28
 *     trudny   G   0/ +6/+13   D −20/−26/−33
 *   AI (cywilizacja komputera): plus G_AI +10/+16/+23 na KAŻDYM poziomie;
 *     minus D   łatwy −10/−16/−23; normalny −15/−21/−28; trudny −20/−26/−33
 *
 * Testy wartości: `cultureReligionLineValue` i pełne `computeHappinessBreakdown` (linia kultury)
 * dla każdej kombinacji poziomów. Mutacje (ręcznie, wyniki w raporcie): AI czyta poziom gracza,
 * G AI zależne od poziomu, D AI mnożone zamiast dodawane — każda daje czerwone asercje tu.
 *
 * Run: cd gra && node tools/ai-plus10-matrix-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.ai-plus10-matrix-entry.ts');
const BUNDLE = path.resolve(__dirname, '.ai-plus10-matrix-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  computeHappinessBreakdown,
} from '../src/game/society-breakdown';
export {
  cultureReligionLineValue,
  setCulturaReligiaLevel,
  getCulturaReligiaLevel,
  getCulturaReligiaLevelAi,
  getCulturaReligiaLevelForOwner,
  CULTURA_RELIGIA_BOUNDS_DEFAULT,
} from '../src/game/culture-religion-level';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[ai-plus10-matrix-test] bundle failed:', e.message || e);
  process.exit(2);
}

const M = require(BUNDLE);
const SOCIETY = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'data', 'society-params.json'), 'utf8'));
const SKALA = SOCIETY.szczescie.szczescie_skala_kultura_religia.hard;
const X1 = SKALA[0];

let pass = 0;
let fail = 0;
function eq(name, got, want) {
  const ok = typeof want === 'number' && typeof got === 'number'
    ? Math.abs(got - want) < 1e-9
    : got === want;
  if (ok) { pass++; return; }
  fail++;
  console.log('FAIL', name, JSON.stringify({ got, want }));
}

// Oczekiwane wartości (epoki 1/2/3).
const PLAYER = {
  latwy: { G: [10, 16, 23], D: [-10, -16, -23] },
  normalny: { G: [5, 11, 18], D: [-15, -21, -28] },
  trudny: { G: [0, 6, 13], D: [-20, -26, -33] },
};
const AI = {
  latwy: { G: [10, 16, 23], D: [-10, -16, -23] },
  normalny: { G: [10, 16, 23], D: [-15, -21, -28] },
  trudny: { G: [10, 16, 23], D: [-20, -26, -33] },
};
const LEVELS = ['latwy', 'normalny', 'trudny'];
const EPOKI = [0, 1, 2];

function happy(over) {
  return Object.assign({
    difficulty: 'hard',
    era: 1,
    population: 3,
    buildingZadowolenie: 0,
    haRel: 0,
    ownCultureShare: 1,
    ownReligionShare: 1,
  }, over);
}
function kulturaLine(bd) {
  const l = bd.lines.find((x) => x.id === 'kultura');
  return l ? l.value : 0;
}

// ---------------------------------------------------------------------------
// 1. Wartości linii (funkcja): gracz vs AI, każdy poziom, epoki 1–3, 100% i 0%.
// ---------------------------------------------------------------------------
for (const lvl of LEVELS) {
  for (const e of EPOKI) {
    const k = SKALA[e] / X1;
    eq(`gracz ${lvl} e${e + 1} G (100%)`, M.cultureReligionLineValue(lvl, k, 1, undefined, true), PLAYER[lvl].G[e]);
    eq(`gracz ${lvl} e${e + 1} D (0%)`, M.cultureReligionLineValue(lvl, k, 0, undefined, true), PLAYER[lvl].D[e]);
    eq(`AI ${lvl} e${e + 1} G (100%)`, M.cultureReligionLineValue(lvl, k, 1, undefined, false), AI[lvl].G[e]);
    eq(`AI ${lvl} e${e + 1} D (0%)`, M.cultureReligionLineValue(lvl, k, 0, undefined, false), AI[lvl].D[e]);
    // Połowa udziału = średnia granic (liniowość).
    eq(`AI ${lvl} e${e + 1} 50%`, M.cultureReligionLineValue(lvl, k, 0.5, undefined, false),
      (AI[lvl].G[e] + AI[lvl].D[e]) / 2);
  }
}
// Plus AI jest stały +10 w epoce 1 niezależnie od poziomu gracza i AI.
for (const lvl of LEVELS) {
  eq(`AI plus G epoka 1 = +10 (${lvl})`, M.CULTURA_RELIGIA_BOUNDS_DEFAULT[lvl].GAi, 10);
  eq(`gracz plus G bez zmian (${lvl})`, M.CULTURA_RELIGIA_BOUNDS_DEFAULT[lvl].G, PLAYER[lvl].G[0]);
}

// ---------------------------------------------------------------------------
// 2. Macierz 3×3 (poziom gracza × poziom AI) przez pełne Szczęście (kultura), epoki 1–3.
//    Linia kultury dla właściciela wybiera poziom WŁAŚCIWY dla swojego typu.
// ---------------------------------------------------------------------------
for (const pl of LEVELS) {
  for (const al of LEVELS) {
    M.setCulturaReligiaLevel(pl, al);
    eq(`stan gracz=${pl}`, M.getCulturaReligiaLevel(), pl);
    eq(`stan AI=${al} (gracz ${pl})`, M.getCulturaReligiaLevelAi(), al);
    for (const e of EPOKI) {
      const era = e + 1;
      const pHi = kulturaLine(M.computeHappinessBreakdown(happy({ era, ownerIsHuman: true, ownCultureShare: 1 }), SOCIETY));
      const pLo = kulturaLine(M.computeHappinessBreakdown(happy({ era, ownerIsHuman: true, ownCultureShare: 0 }), SOCIETY));
      eq(`[${pl}/${al}] gracz e${era} G`, pHi, PLAYER[pl].G[e]);
      eq(`[${pl}/${al}] gracz e${era} D`, pLo, PLAYER[pl].D[e]);
      const aHi = kulturaLine(M.computeHappinessBreakdown(happy({ era, ownerIsHuman: false, ownCultureShare: 1 }), SOCIETY));
      const aLo = kulturaLine(M.computeHappinessBreakdown(happy({ era, ownerIsHuman: false, ownCultureShare: 0 }), SOCIETY));
      eq(`[${pl}/${al}] AI e${era} G`, aHi, AI[al].G[e]);
      eq(`[${pl}/${al}] AI e${era} D`, aLo, AI[al].D[e]);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Hotseat: każdy człowiek = gracz (ownerIsHuman true) — ta sama wartość co gracz.
// ---------------------------------------------------------------------------
M.setCulturaReligiaLevel('trudny', 'latwy');
eq('hotseat: człowiek 1 = człowiek 2 (trudny, 100%)',
  kulturaLine(M.computeHappinessBreakdown(happy({ ownerIsHuman: true, ownCultureShare: 1 }), SOCIETY)), 0);
eq('hotseat: człowiek trudny 0% = −20',
  kulturaLine(M.computeHappinessBreakdown(happy({ ownerIsHuman: true, ownCultureShare: 0 }), SOCIETY)), -20);

// ---------------------------------------------------------------------------
// 4. Zapis / wczytanie: round-trip obu pól, stary zapis, zgodność.
// ---------------------------------------------------------------------------
M.setCulturaReligiaLevel('normalny', 'trudny');
eq('round-trip gracz', M.getCulturaReligiaLevel(), 'normalny');
eq('round-trip AI', M.getCulturaReligiaLevelAi(), 'trudny');

// Stary zapis: tylko pole gracza → AI = poziom gracza.
M.setCulturaReligiaLevel('trudny');
eq('stary zapis: AI = gracz (trudny)', M.getCulturaReligiaLevelAi(), 'trudny');
M.setCulturaReligiaLevel('latwy', undefined);
eq('stary zapis: AI = gracz (latwy)', M.getCulturaReligiaLevelAi(), 'latwy');
M.setCulturaReligiaLevel('latwy', 'xxx');
eq('zła wartość AI = poziom gracza', M.getCulturaReligiaLevelAi(), 'latwy');

// Zgodność (null): gracz null → AI null (dzisiejsze zachowanie bit-w-bit).
M.setCulturaReligiaLevel(null, 'trudny');
eq('zgodność: gracz null', M.getCulturaReligiaLevel(), null);
eq('zgodność: AI null (mimo pola AI)', M.getCulturaReligiaLevelAi(), null);
// Zgodność = dzisiejszy wzór proporcjonalneSzczescie (0% własnej → −10), dla AI tak samo jak dla gracza.
eq('zgodność: linia kultury AI = dzisiejsza (0% → −10)',
  kulturaLine(M.computeHappinessBreakdown(happy({ ownerIsHuman: false, ownCultureShare: 0 }), SOCIETY)), -10);
eq('zgodność: linia kultury gracza = dzisiejsza (0% → −10)',
  kulturaLine(M.computeHappinessBreakdown(happy({ ownerIsHuman: true, ownCultureShare: 0 }), SOCIETY)), -10);

// Dla właściwego typu właściciela.
M.setCulturaReligiaLevel('trudny', 'latwy');
eq('wybór poziomu: gracz', M.getCulturaReligiaLevelForOwner(true), 'trudny');
eq('wybór poziomu: AI', M.getCulturaReligiaLevelForOwner(false), 'latwy');

// Przywróć domyślne (inne testy w tym procesie nie działają — pojedynczy bundle, ale czytelnie).
M.setCulturaReligiaLevel('latwy', 'latwy');

console.log(`ai-plus10-matrix-test: ${pass} pass / ${fail} fail`);
if (fail > 0) process.exit(1);
