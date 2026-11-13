'use strict';
/**
 * diplo-truce-until-turn-test.cjs — R-WEB-DIPLO-TRUCE-UNTIL-TURN-DISPLAY-Q1 (#306/#319).
 * W relacji dyplomacji, gdy rozejm jest aktywny, napis „Rozejm do tury N” (N = truceUntilTurn pary
 * z danych stanu, nie stała). Bez aktywnego rozejmu — brak napisu.
 *
 * Część 1 (RUNTIME): esbuild bundle diplomacy-display.ts; N liczone z truceUntilTurn(start, dur)
 *          z diplomacy-peace-lock.ts (ta sama ścieżka co main.ts przy akceptacji rozejmu).
 * Część 2 (WIRING, źródło): diplomacyAudience.ts wpina napis do formalBannerHtml.
 * Mutant M1: napis z zaszytą stałą N (10) — test MUSI czerwienić.
 * Run: node tools/diplo-truce-until-turn-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const DISPLAY = path.resolve(GRA, 'src', 'game', 'diplomacy-display.ts');
const AUDIENCE = path.resolve(GRA, 'src', 'ui', 'diplomacyAudience.ts');
const ENTRY = path.resolve(GRA, 'src', '.dip-truce-until-turn-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-truce-until-turn.cjs');
const BUNDLE_M1 = path.resolve(__dirname, '.dip-truce-until-turn-m1.cjs');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const ENTRY_SRC = [
  "export { truceUntilTurnLabelPl } from './game/diplomacy-display';",
  "export { truceUntilTurn } from './game/diplomacy-peace-lock';",
  '',
].join('\n');

async function bundle(outfile, plugins) {
  fs.writeFileSync(ENTRY, ENTRY_SRC);
  try {
    await esbuild.build({
      entryPoints: [ENTRY],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile,
      logLevel: 'silent',
      plugins: plugins || [],
    });
  } finally {
    fs.unlinkSync(ENTRY);
  }
  return require(outfile);
}

function mutantPlugin(from, to) {
  return {
    name: 'mutant-truce-label',
    setup(build) {
      build.onLoad({ filter: /diplomacy-display\.ts$/ }, () => {
        const src = fs.readFileSync(DISPLAY, 'utf8');
        if (!src.includes(from)) throw new Error('mutant anchor missing: ' + from);
        return { contents: src.replace(from, to), loader: 'ts' };
      });
    },
  };
}

(async () => {
  const M = await bundle(BUNDLE);
  const label = M.truceUntilTurnLabelPl;
  const truceUntilTurn = M.truceUntilTurn;

  // Część 1 — aktywny rozejm: napis z właściwym N (dla dwóch różnych tur startu i długości).
  const until5 = truceUntilTurn(12, 5);   // 17
  const until15 = truceUntilTurn(40, 15); // 55
  check('aktywny rozejm 5 tur od tury 12 → „Rozejm do tury 17”', label(until5, 12) === 'Rozejm do tury 17', label(until5, 12));
  check('aktywny rozejm 15 tur od tury 40 → „Rozejm do tury 55”', label(until15, 41) === 'Rozejm do tury 55', label(until15, 41));
  check('w turze zawarcia rozejm aktywny (włącznie z turą zawarcia)', label(until5, 12) !== null, label(until5, 12));
  check('ostatnia tura przed wygaśnięciem nadal pokazuje N', label(until5, 16) === 'Rozejm do tury 17', label(until5, 16));

  // Część 1 — brak rozejmu: brak napisu.
  check('brak pola truceUntilTurn (undefined) → null', label(undefined, 20) === null, label(undefined, 20));
  check('brak pola truceUntilTurn (null) → null', label(null, 20) === null, label(null, 20));
  check('rozejm wygasł dokładnie w turze N → null (wojna wraca, brak napisu)', label(until5, 17) === null, label(until5, 17));
  check('rozejm po wygaśnięciu (tura > N) → null', label(until5, 30) === null, label(until5, 30));
  const badLen = truceUntilTurn(12, 7);
  check('nieprawidłowa długość (truceUntilTurn → null) → null', label(badLen, 12) === null, label(badLen, 12));

  // Mutant M1: stała N=10 zamiast danych pary — test musi czerwienić.
  const M1 = await bundle(BUNDLE_M1, [mutantPlugin(
    "return 'Rozejm do tury ' + Math.floor(truceUntilTurn as number);",
    "return 'Rozejm do tury 10';",
  )]);
  const m1Out = M1.truceUntilTurnLabelPl(until5, 12);
  check('M1 (stałe N=10) wykryte: napis dla N=17 jest błędny', m1Out !== 'Rozejm do tury 17', m1Out);

  // Część 2 — wiring: banner relacji wywołuje helper i pokazuje napis tylko dla aktywnego rozejmu.
  const aud = fs.readFileSync(AUDIENCE, 'utf8');
  check('diplomacyAudience importuje truceUntilTurnLabelPl', /truceUntilTurnLabelPl,/.test(aud));
  check('formalBannerHtml liczy truceLabel i dokleja do podpisu', /const truceLabel = [\s\S]*?truceUntilTurnLabelPl\(st\.truceUntilTurn, st\.currentTurn\)[\s\S]*?subParts\.push\(truceLabel\)/.test(aud));
  check('napis pomijany dla wojny (kind !== wojna)', /formalStatus\.kind !== 'wojna'/.test(aud));

  console.log('\nWYNIK: ' + pass + ' PASS / ' + fail + ' FAIL');
  process.exitCode = fail === 0 ? 0 : 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
