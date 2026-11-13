// P6 COUNTER-FALANGITA (R-RUSTPORT-P6-COUNTER-FALANGITA-Q1): generator wektorow pinu dla mnoznika
// kontrataku `counterMultiplier` (gra/src/game/combat.ts) z PINU 07d2fbd72, na wszystkich 64 parach
// typ x typ (8 x 8) macierzy counter-multipliers.json.
//
// Wykonywany jest TEKST pinu (po zdjeciu typow TypeScript), a nie przepisana kopia:
//   - funkcja prywatna parseCounterBonusFrac (combat.ts), verbatim,
//   - funkcja eksportowana counterMultiplier (combat.ts), verbatim,
//   - stala: COUNTER_MULT = combat-params.json counter_multiplier (wstrzykiwana wartosc; jedyna zmiana tekstu),
//   - dane: gra/data/counters.json (wiersze Rodzaj=Atak, Status=potwierdzone), wczytane z pina.
// Typy kanoniczne (lowercase) jak w counter-multipliers.json: spearman, mount, distance, slinger,
// swordsman, falangite, offensive, naval. Atakujacy i cel przekazywane jako te napisy.
//
// Straznik: SHA-256 wycietego tekstu pinu (funkcje), counters.json i combat-params.json.
// Wynik -> p6_counter_falangita_vectors/vectors.json.
//
// Uruchomienie (z korzenia repo): node rust-port/engine/tests/p6_counter_falangita_gen.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const COMBAT = 'gra/src/game/combat.ts';
const BATTLE_SCENE = 'gra/src/battle/battleScene.ts';
const COUNTERS = 'gra/data/counters.json';
const PARAMS = 'gra/data/combat-params.json';
const TYPES = ['spearman', 'mount', 'distance', 'slinger', 'swordsman', 'falangite', 'offensive', 'naval'];
// Oczekiwane skroty (straznik); wpisane po pierwszym uruchomieniu na PINIE.
const EXPECT_FRAGMENT_SHA256 = 'c5a878dd5d944f1698ad19d55b131f92d7cb2dd5495d53bde516e415c4506c4a';
const EXPECT_COUNTERS_SHA256 = 'ebb07f4e554ae416f2b5a9a8be8cc00876e94ec1a34eb94eb245205ac094d129';
const EXPECT_PARAMS_SHA256 = '5cc90d60c76da67039a1330261a00584933216c8ec80bff3db5183b05c07326e';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const outDir = join(here, 'p6_counter_falangita_vectors');
const outPath = join(outDir, 'vectors.json');

const sha = (s) => createHash('sha256').update(s).digest('hex');
const gitShow = (path) =>
  execFileSync('git', ['-C', repoRoot, 'show', `${PIN}:${path}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// Funkcja eksportowana (`export function name(`) lub prywatna (`function name(`), konczaca sie na "\n}\n".
function extractFn(src, name, exported) {
  const re = exported ? new RegExp(`export function ${name}\\(`) : new RegExp(`(^|\\n)function ${name}\\(`);
  const m = re.exec(src);
  if (!m) throw new Error(`brak ${name} w pinie ${PIN}`);
  const start = m.index + (m[1] !== undefined ? m[1].length : 0);
  const end = src.indexOf('\n}\n', start);
  if (end < 0) throw new Error(`nie znaleziono konca ${name}`);
  return src.slice(start, end + 3).replace(/^export /, '');
}

const combatSrc = gitShow(COMBAT);
const battleSceneSrc = gitShow(BATTLE_SCENE);
const countersText = gitShow(COUNTERS);
const paramsText = gitShow(PARAMS);
const countersRaw = JSON.parse(countersText);
const counterMultParam = JSON.parse(paramsText).counter_multiplier;
if (typeof counterMultParam !== 'number') throw new Error('combat-params.json: brak counter_multiplier');

// Wiersze wchodza do counterMultiplier przez normCounters (battleScene.ts): klucz z ogonkiem
// "Typ atakujący" -> ASCII "Typ atakujacy" (combat.ts czyta wylacznie ASCII).
const fragment = [
  extractFn(battleSceneSrc, 'normCounters', false),
  extractFn(combatSrc, 'parseCounterBonusFrac', false),
  extractFn(combatSrc, 'counterMultiplier', true),
].join('\n');
const fragmentSha = sha(fragment);
const countersSha = sha(countersText);
const paramsSha = sha(paramsText);
for (const [label, got, expect] of [
  ['fragment', fragmentSha, EXPECT_FRAGMENT_SHA256],
  ['counters', countersSha, EXPECT_COUNTERS_SHA256],
  ['params', paramsSha, EXPECT_PARAMS_SHA256],
]) {
  if (expect === null) console.log(`UWAGA: brak oczekiwanego skrotu ${label}: ${got}`);
  else if (got !== expect) throw new Error(`straznik ${label}: ${got} != ${expect}`);
}

// Wykonanie tekstu pinu: typy zdjete, COUNTER_MULT wstrzykniete z combat-params.json.
const js = stripTypeScriptTypes(`const COUNTER_MULT = ${JSON.stringify(counterMultParam)};\n${fragment}\n`);
const pinFns = new Function(`${js}\nreturn { normCounters, counterMultiplier };`)();
const counters = pinFns.normCounters(countersRaw);
const counterMultiplier = pinFns.counterMultiplier;

const cases = [];
for (const atk of TYPES) {
  for (const cel of TYPES) {
    cases.push({ atakujacy: atk, cel, mnoznik: counterMultiplier(atk, cel, counters) });
  }
}

const out = {
  source: {
    pin: PIN,
    file: COMBAT,
    fragment: 'parseCounterBonusFrac + counterMultiplier (verbatim, typy zdjete), COUNTER_MULT wstrzykniety',
    fragmentSha256: fragmentSha,
    countersFile: COUNTERS,
    countersSha256: countersSha,
    paramsFile: PARAMS,
    paramsSha256: paramsSha,
  },
  counts: { cases: cases.length, nonUnit: cases.filter((c) => c.mnoznik !== 1).length },
  cases,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
console.log(`zapisano ${outPath}: ${out.counts.cases} par, ${out.counts.nonUnit} niejednostkowych`);
