'use strict';
/**
 * ai-granary-prog-populacji-spojnosc-test.cjs
 * P-AI-GRANARY-PROG-POPULACJI-DUPLIKAT-Q1, runda 1.
 *
 * KONTEKST (GENEZA dispatchu — NIE naprawiać importem, patrz 00-dispatch.md): stałe
 * `AI_POP_CAP_NO_GRANARY_BY_DIFFICULTY` i `AI_POP_CAP_WITH_GRANARY_I` w
 * `gra/src/game/ai.ts` (komentarz przy `granaryPriorityBonus()`, ok. linii 1428-1479)
 * ŚWIADOMIE duplikują progi populacji z `economy.ts`/`econ-params.json` ręcznie —
 * `ai.ts` celowo NIE importuje `economy.ts`, żeby nie ciągnąć całego modułu ekonomii
 * do testów jednostkowych AI. To udokumentowany kompromis architektoniczny, nie błąd.
 * Dwa niezależne źródła tej samej liczby mogą się jednak cicho rozjechać przy
 * przyszłej zmianie balansu populacji (`econ-params.json` albo `cityPopulationCap`) —
 * ten test jest zabezpieczeniem WYŁĄCZNIE przed takim rozjazdem, nie próbą usunięcia
 * duplikacji.
 *
 * METODA (bez zmiany ai.ts, bez eksportu jego prywatnych stałych):
 *   1. Czytamy `gra/src/game/ai.ts` jako TEKST i regexem wycinamy DOKŁADNIE literały
 *      `AI_POP_CAP_NO_GRANARY_BY_DIFFICULTY` (easy/normal/hard) i
 *      `AI_POP_CAP_WITH_GRANARY_I` — liczby pochodzą z realnego pliku źródłowego,
 *      NIE są przepisywane ręcznie w tym teście (żadna trzecia kopia).
 *   2. Bundlujemy (esbuild) i wołamy REALNE `cityPopulationCap` + `loadEconParams` z
 *      `gra/src/game/economy.ts` na PRAWDZIWYCH danych z `gra/data/econ-params.json`,
 *      dla wszystkich trzech trudności (easy/normal/hard).
 *   3. Porównujemy wyciągnięte stałe AI z realnym wynikiem `cityPopulationCap`.
 *
 * Dowód mutacyjny (wykonany ręcznie przy tej rundzie, patrz raport Operatora): ręczne
 * rozjechanie jednej wartości w `AI_POP_CAP_NO_GRANARY_BY_DIFFICULTY`/
 * `AI_POP_CAP_WITH_GRANARY_I` w `ai.ts` (tymczasowo, cofnięte) realnie czerwieni ten
 * test; przywrócenie oryginału — zielony.
 *
 * node gra/tools/ai-granary-prog-populacji-spojnosc-test.cjs
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// Krok 1: wyciągnij AI_POP_CAP_* z gra/src/game/ai.ts jako tekst (nie importujemy
// ai.ts — nie eksportuje tych stałych, i nie wolno zmieniać gra/src/** żeby je
// wyeksportować w tej rundzie).
// ---------------------------------------------------------------------------
const AI_TS = path.join(__dirname, '..', 'src', 'game', 'ai.ts');
const aiSrc = fs.readFileSync(AI_TS, 'utf8');

const noGranaryMatch = aiSrc.match(
  /const AI_POP_CAP_NO_GRANARY_BY_DIFFICULTY: Record<DifficultyLevel, number> = \{([^}]*)\};/,
);
ok(!!noGranaryMatch, 'znaleziono AI_POP_CAP_NO_GRANARY_BY_DIFFICULTY w ai.ts');
const noGranaryBody = noGranaryMatch ? noGranaryMatch[1] : '';

function extractField(body, key) {
  const m = body.match(new RegExp(key + ':\\s*(-?\\d+(?:\\.\\d+)?)'));
  return m ? Number(m[1]) : undefined;
}

const aiNoGranary = {
  easy: extractField(noGranaryBody, 'easy'),
  normal: extractField(noGranaryBody, 'normal'),
  hard: extractField(noGranaryBody, 'hard'),
};
ok(typeof aiNoGranary.easy === 'number', 'wyciągnięto AI_POP_CAP_NO_GRANARY_BY_DIFFICULTY.easy z ai.ts');
ok(typeof aiNoGranary.normal === 'number', 'wyciągnięto AI_POP_CAP_NO_GRANARY_BY_DIFFICULTY.normal z ai.ts');
ok(typeof aiNoGranary.hard === 'number', 'wyciągnięto AI_POP_CAP_NO_GRANARY_BY_DIFFICULTY.hard z ai.ts');

const withGranaryMatch = aiSrc.match(/const AI_POP_CAP_WITH_GRANARY_I = (-?\d+(?:\.\d+)?);/);
ok(!!withGranaryMatch, 'znaleziono AI_POP_CAP_WITH_GRANARY_I w ai.ts');
const aiWithGranaryI = withGranaryMatch ? Number(withGranaryMatch[1]) : undefined;
ok(typeof aiWithGranaryI === 'number', 'wyciągnięto AI_POP_CAP_WITH_GRANARY_I z ai.ts');

// ---------------------------------------------------------------------------
// Krok 2: zbunduluj realne cityPopulationCap + loadEconParams z economy.ts i policz
// realny sufit populacji na PRAWDZIWYCH danych econ-params.json dla trzech trudności.
// ---------------------------------------------------------------------------
const ENTRY = path.join(__dirname, '.ai-granary-prog-populacji-spojnosc-entry.ts');
const BUNDLE = path.join(__dirname, '.ai-granary-prog-populacji-spojnosc-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `import { cityPopulationCap, loadEconParams } from '../src/game/economy';
import rawEconJson from '../data/econ-params.json';
export { cityPopulationCap, loadEconParams, rawEconJson };`,
);

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE,
    logLevel: 'silent',
  });

  const { cityPopulationCap, loadEconParams, rawEconJson } = require(BUNDLE);

  const DIFFICULTIES = ['easy', 'normal', 'hard'];
  for (const d of DIFFICULTIES) {
    const params = loadEconParams(rawEconJson, d);
    const realNoGranary = cityPopulationCap(false, false, params);
    const realWithGranaryI = cityPopulationCap(false, true, params);

    ok(
      aiNoGranary[d] === realNoGranary,
      `AI_POP_CAP_NO_GRANARY_BY_DIFFICULTY.${d} (${aiNoGranary[d]}) == cityPopulationCap(false, false, params) realny (${realNoGranary}) dla trudności "${d}"`,
    );
    ok(
      aiWithGranaryI === realWithGranaryI,
      `AI_POP_CAP_WITH_GRANARY_I (${aiWithGranaryI}) == cityPopulationCap(false, true, params) realny (${realWithGranaryI}) dla trudności "${d}"`,
    );
  }
} finally {
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(BUNDLE); } catch (_e) { /* noop */ }
}

console.log('ai-granary-prog-populacji-spojnosc-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
