// R-RUSTPORT-P6-W6S-SIEGE-GATE-Q1: generator wektorow z URUCHOMIONEGO weba dla `siegeAllowedBetween`
// (gra/src/game/diplomacy-siege-war-gate.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75).
//
// Uzycie (poza repo, esbuild zainstalowany w katalogu <esbuildDir>):
//   node tests/p6_w6s_siege_gen.mjs <katalog gra/src z pinu> <katalog z node_modules/esbuild> \
//     > tests/p6_w6s_siege_vectors/siege.json
// Katalog gra/src: `git archive 07d2fbd72f758705f8e1d59cc4968027ffbafe75 gra/src gra/data` rozpakowany poza repo.
// Web jest transpilowany przez esbuild (bundle do pliku tymczasowego poza repo) i importowany jako prawdziwy modul,
// wiec wektory pochodza z wykonania kodu webowego, nie z reki.

import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [webSrc, esbuildDir] = process.argv.slice(2);
if (!webSrc || !esbuildDir) throw new Error('podaj katalog gra/src z pinu i katalog z esbuild');

const require = createRequire(path.join(esbuildDir, 'package.json'));
const { buildSync } = require('esbuild');

const outDir = mkdtempSync(path.join(tmpdir(), 'p6-w6s-siege-'));
const outFile = path.join(outDir, 'siege-gate.mjs');
try {
  buildSync({
    entryPoints: [path.join(webSrc, 'game', 'diplomacy-siege-war-gate.ts')],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    write: true,
    outfile: outFile,
    logLevel: 'silent',
  });
  const mod = await import(pathToFileURL(outFile).href);
  const { siegeAllowedBetween } = mod;
  if (typeof siegeAllowedBetween !== 'function') throw new Error('brak siegeAllowedBetween w webie');

  // Deterministyczny PRNG (mulberry32), zeby wektory byly powtarzalne.
  let seed = 0x5eed1234;
  const rnd = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const OWNERS = [0, 1, 2, 3, 4, 9]; // 0 = gracz, 9 = barbarzyncy (id bez znaczenia dla bramki)
  const MATRICES = 6;
  const matrices = [];
  for (let m = 0; m < MATRICES; m++) {
    // Relacja kierunkowa (asymetryczna) + przekatna wlaczona dla czesci wierszy,
    // zeby sprawdzic, ze bramka odrzuca "wrog samemu sobie" wylacznie przez warunek rownosci.
    const table = {};
    for (const a of OWNERS) {
      for (const b of OWNERS) {
        table[`${a},${b}`] = a === b ? rnd() < 0.5 : rnd() < 0.45;
      }
    }
    matrices.push(table);
  }

  const cases = [];
  matrices.forEach((table, mi) => {
    const areEnemies = (a, b) => table[`${a},${b}`];
    for (const besieger of OWNERS) {
      for (const defender of OWNERS) {
        cases.push({
          matrix: mi,
          besieger,
          defender,
          allowed: siegeAllowedBetween(besieger, defender, areEnemies),
        });
      }
    }
  });

  const out = {
    source: 'gra/src/game/diplomacy-siege-war-gate.ts@07d2fbd72f758705f8e1d59cc4968027ffbafe75',
    generator: 'tests/p6_w6s_siege_gen.mjs',
    owners: OWNERS,
    matrices: matrices.map(t => OWNERS.map(a => OWNERS.map(b => t[`${a},${b}`]))),
    cases,
  };
  process.stdout.write(JSON.stringify(out, null, 1) + '\n');
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
