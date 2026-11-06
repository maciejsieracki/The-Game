'use strict';
/**
 * diplo-nap-trust-30-test.cjs — R-WEB-DIPLO-NAP-TRUST-30-Q1
 *
 * Decyzja właściciela (2026-11-05): pakt o nieagresji wymaga ORAZ Relacji ≥ próg ORAZ
 * Zaufania ≥ 30 (progNapZaufanie, stała na wszystkich trudnościach).
 *
 * Sekcje:
 *  A. parametr: progNapZaufanie = 30 na easy/normal/hard (bez ±trudność)
 *  B. bramka gracza/UI: resolveDiplomacyActionLock case '2' (Rel OK + Zaufanie 29 → zablokowany;
 *     Zaufanie 30 → dostępny; Rel za niska + Zaufanie OK → zablokowany; obie za niskie → notka z obiema)
 *  C. bramka silnika: evaluateProposal('nap') — AI/AI↔AI odrzuca przy Zaufaniu < 30
 *  D. pomiar progu Relacji (pomiar, nie asercja progu) przy 4 scenariuszach + rozjazd UI vs silnik
 *  E. wiring: ai.ts (Priorytet 3b) i main.ts (kontekst blokad) używają nowej bramki
 *
 * Run from gra/:  node tools/diplo-nap-trust-30-test.cjs
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing (npm ci w gra/)'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.nap-trust-30-bundle.cjs');
const entryFile = path.resolve(__dirname, '.nap-trust-30-entry.ts');
fs.writeFileSync(entryFile, `
export {
  evaluateProposal, NAP_GRANICA_RELACJA_NARZUT,
} from '../src/game/diplomacy-proposals.ts';
export {
  getEffectiveDiplomacyParams, DIPLOMACY_DIFFICULTY_DELTA,
} from '../src/game/diplomacy.ts';
export { resolveDiplomacyActionLock } from '../src/game/diplomacy-locks.ts';
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
    evaluateProposal, NAP_GRANICA_RELACJA_NARZUT,
    getEffectiveDiplomacyParams, DIPLOMACY_DIFFICULTY_DELTA,
    resolveDiplomacyActionLock,
  } = require(BUNDLE);

  let pass = 0;
  let fail = 0;
  function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

  console.log('diplo-nap-trust-30-test');

  // ---- A. parametr -------------------------------------------------------
  console.log('\nA. progNapZaufanie = 30, stały na trudnościach');
  for (const d of ['easy', 'normal', 'hard']) {
    const p = getEffectiveDiplomacyParams(d);
    ok(p.progNapZaufanie === 30, `A1 ${d}: progNapZaufanie === 30 (jest ${p.progNapZaufanie})`);
  }
  ok(getEffectiveDiplomacyParams('hard').progNapRelacja
    === getEffectiveDiplomacyParams('normal').progNapRelacja + DIPLOMACY_DIFFICULTY_DELTA.hard,
  'A2 progNapRelacja nadal skalowany o trudność (bez regresji)');

  // ---- B. bramka gracza/UI (resolveDiplomacyActionLock case '2') ----------
  console.log('\nB. bramka Paktu w blokadach (UI / propozycja gracza)');
  const lockCtx = (o = {}) => ({
    actionId: '2', contact: true, atWar: false, relTotal: 150, zaufanie: 60, respekt: 0,
    hasNap: false, hasHandel: false, hasTradeConnection: true, hasSojusz: false,
    hasGranice: false, sellableTechCount: 0, buyableTechCount: 0, knownRivalsCount: 0,
    progNapRelacja: 110, progHandelRelacja: 0, progSojuszRelacja: 151, progSojuszZaufanie: 91,
    progGraniceRelacja: 100, progGraniceZaufanie: 45, progWymianaTechZaufanie: 70,
    progNamowWojneZaufanie: 50, progWasalizacjaRespekt: 70, progTrybutZadanieMinRespekt: 70,
    progDarRelacja: 0, progNapZaufanie: 30, ...o,
  });
  {
    const r = resolveDiplomacyActionLock(lockCtx({ relTotal: 150, zaufanie: 29 }));
    ok(r.locked === true, 'B1 Relacja OK (150) + Zaufanie 29 → zablokowany');
    ok(/Zaufania 30/.test(r.note) && /masz 29/.test(r.note),
      `B1b notka wymienia wymagane Zaufanie 30 i stan (${r.note})`);
  }
  {
    const r = resolveDiplomacyActionLock(lockCtx({ relTotal: 150, zaufanie: 30 }));
    ok(r.locked === false, 'B2 Relacja OK + Zaufanie 30 → dostępny');
  }
  {
    const r = resolveDiplomacyActionLock(lockCtx({ relTotal: 100, zaufanie: 60 }));
    ok(r.locked === true && r.requirement && r.requirement.kind === 'stan',
      'B3 Relacja za niska (100 < 110) + Zaufanie OK → zablokowany (wymóg Relacji)');
  }
  {
    const r = resolveDiplomacyActionLock(lockCtx({ relTotal: 100, zaufanie: 10 }));
    ok(r.locked === true && /Zaufania 30/.test(r.note) && /Relacji 110/.test(r.note),
      `B4 obie za niskie → notka z obiema wymaganymi wartościami (${r.note})`);
  }
  {
    const r = resolveDiplomacyActionLock(lockCtx({ hasNap: true, zaufanie: 0 }));
    ok(r.active === true && r.locked === false, 'B5 pakt już zawarty → nadal „już zawarty" (bez zmian)');
  }
  {
    const r = resolveDiplomacyActionLock(lockCtx({ progNapZaufanie: undefined, relTotal: 150, zaufanie: 0 }));
    ok(r.locked === false, 'B6 wsteczna zgodność: brak progNapZaufanie → bramka Zaufania pominięta');
  }

  // ---- C. bramka silnika (evaluateProposal 'nap') -------------------------
  console.log('\nC. bramka Paktu w silniku (AI/AI↔AI, propozycje)');
  const rel = (z, r, s = 'pokoj') => ({ zaufanie: z, respekt: r, status: s });
  const ctx = (o = {}) => ({
    relation: rel(60, 50), stanWojny: false, turn: 10,
    proposerRespekt: 40, responderRespekt: 60, militaryRatio: 1, ...o,
  });
  const napProp = (pay = { turns: 15 }) => ({
    actionId: 'nap', proposerOwnerId: 0, responderOwnerId: 1, payload: pay,
  });
  {
    const r = evaluateProposal(napProp(), ctx({ relation: rel(29, 150) }));
    ok(r.accepted === false, 'C1 Relacja 179 (wysoka) + Zaufanie 29 → odrzucony');
    ok(/Zaufanie/.test(r.reason), `C1b powód wskazuje Zaufanie (${r.reason})`);
  }
  {
    const r = evaluateProposal(napProp(), ctx({ relation: rel(30, 150) }));
    ok(r.accepted === true, 'C2 Relacja 180 + Zaufanie 30 → przyjęty');
  }
  {
    const r = evaluateProposal(napProp(), ctx({ relation: rel(60, 0) }));
    ok(r.accepted === false, 'C3 Zaufanie OK, Relacja 60 < progu → nadal odrzucony (Relacja bez zmian)');
  }

  // ---- D. pomiar progu Relacji (minimalna przyjęta Relacja, zaufanie=100) --
  console.log('\nD. POMIAR (nie asercja): minimalna Relacja przyjęcia paktu, Zaufanie 100, bez słodzika');
  function minAcceptedRelacja(difficulty, granica) {
    for (let score = 0; score <= 200; score++) {
      const z = Math.min(score, 100);
      const r = score - z;
      const res = evaluateProposal(napProp(), ctx({
        relation: rel(z, r), difficulty, karaWspolnaGranica: granica,
      }));
      if (res.accepted) return score;
    }
    return null;
  }
  const scen = [
    ['Normalny, bez wspólnej granicy', 'normal', false],
    ['Normalny, ze wspólną granicą', 'normal', true],
    ['Trudny, bez wspólnej granicy', 'hard', false],
    ['Trudny, ze wspólną granicą', 'hard', true],
  ];
  for (const [label, d, g] of scen) {
    const m = minAcceptedRelacja(d, g);
    console.log(`  MEASURE ${label}: silnik wymaga Relacji >= ${m}`);
  }
  const uiNormal = getEffectiveDiplomacyParams('normal').progNapRelacja;
  const uiHard = getEffectiveDiplomacyParams('hard').progNapRelacja;
  console.log(`  MEASURE UI (blokada gracza, progNapRelacja bez narzutu granicy): normal=${uiNormal}, hard=${uiHard}`);
  console.log(`  MEASURE narzut granicy = ${NAP_GRANICA_RELACJA_NARZUT} (zob. diplomacy-proposals.ts)`);
  ok(minAcceptedRelacja('hard', true) === uiHard + NAP_GRANICA_RELACJA_NARZUT,
    'D1 silnik: Trudny + wspólna granica = progNapRelacja + narzut (rozkład „140" potwierdzony)');
  ok(minAcceptedRelacja('normal', false) === uiNormal,
    'D2 silnik: Normalny bez granicy = progNapRelacja');

  // ---- E. wiring (źródła) -------------------------------------------------
  console.log('\nE. wiring źródeł');
  const readSrc = rel => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8');
  ok(/rel\.relation\.zaufanie\s*>=\s*dipP\.progNapZaufanie/.test(readSrc('src/game/ai.ts')),
    'E1 ai.ts Priorytet 3b: propozycja paktu wymaga zaufanie >= dipP.progNapZaufanie');
  ok(/progNapZaufanie:\s*dip\.progNapZaufanie/.test(readSrc('src/main.ts')),
    'E2 main.ts: kontekst blokad przekazuje progNapZaufanie');
  ok(/relation\.zaufanie\s*<\s*p\.progNapZaufanie/.test(readSrc('src/game/diplomacy-proposals.ts')),
    'E3 diplomacy-proposals.ts case nap: bramka Zaufania w evaluateProposal');

  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
