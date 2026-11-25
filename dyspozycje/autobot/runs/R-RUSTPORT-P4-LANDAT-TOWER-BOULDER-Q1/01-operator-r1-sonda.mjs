// R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1 (Operator r1): SONDA czasu trafienia wiezy i kamienia katapulty w PINIE 07d2fbd72.
//
// Uruchamia generator `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` (wykonanie calego tekstu pinu, straznik SHA-256
// nietkniety) z jednym dodatkiem DIAGNOSTYCZNYM po `new BattleScene(opts)`: owiniecie `_schedule` w chwili, gdy wywoluje
// je `_fireOneTower` (`battleScene.ts:4262`, `_schedule(RANGED_FLY_MS)`) albo `_attackWallTile` (`:7555`, `_schedule(700)`).
// Callback dostaje opakowanie, ktore wypisuje `PROBE <rodzaj> t0=<vNow wystrzalu> ms=<ms> fire=<vNow odpalenia>`.
// Tekst pinu i przebieg bitwy bez zmian (owiniecie tylko loguje i wola oryginalny callback).
//
// Uzycie (z korzenia repo): node dyspozycje/autobot/runs/R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1/01-operator-r1-sonda.mjs <scenariusz>
// Wynik: linie PROBE na stderr; skrypt tymczasowy w $TMPDIR (usuwany po uruchomieniu).
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..', '..');
const testsDir = join(repoRoot, 'rust-port', 'engine', 'tests');
const gen = readFileSync(join(testsDir, 'p6_k5loop_wiring_a_gen.mjs'), 'utf8');
const HERE_LINE = 'const here = dirname(fileURLToPath(import.meta.url));';
const BS_LINE = '  const bs = new BattleScene(opts);';
if (gen.split(HERE_LINE).length !== 2 || gen.split(BS_LINE).length !== 2) throw new Error('generator: kotwice niejednoznaczne');
const hook = `
  {
    let kind = null;
    for (const [m, k] of [['_fireOneTower', 'tower'], ['_attackWallTile', 'boulder']]) {
      const o = bs[m];
      bs[m] = function (...a) { const p = kind; kind = k; try { return o.apply(this, a); } finally { kind = p; } };
    }
    const os = bs._schedule;
    bs._schedule = function (ms, cb) {
      if (kind !== null && ((kind === 'tower' && ms === 380) || (kind === 'boulder' && ms === 700))) {
        const k = kind; const t0 = bs.vNow;
        return os.call(this, ms, () => { console.error('PROBE ' + k + ' t0=' + t0 + ' ms=' + ms + ' fire=' + bs.vNow); return cb(); });
      }
      return os.call(this, ms, cb);
    };
  }
`;
const src = gen
  .replace(HERE_LINE, `const here = ${JSON.stringify(testsDir)};`)
  .replace(BS_LINE, BS_LINE + hook);
const tmp = join(tmpdir(), `landat-tb-sonda-${process.pid}.mjs`);
writeFileSync(tmp, src);
try {
  execFileSync(process.execPath, [tmp], {
    env: { ...process.env, WIRING_A_TRACE: process.argv[2] ?? '' },
    stdio: ['ignore', 'inherit', 'inherit'],
    maxBuffer: 1 << 28,
  });
} finally {
  unlinkSync(tmp);
}
