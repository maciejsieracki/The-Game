// R-RUSTPORT-P6-W6S-SIEGE-GATE-Q1: generator wektorow z URUCHOMIONEGO weba dla `siegeAllowedBetween`
// oraz `siegeBattleSideOwners` (gra/src/game/diplomacy-siege-war-gate.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75).
//
// Uzycie (poza repo, esbuild 0.25.0 zainstalowany w katalogu <esbuildDir>):
//   node tests/p6_w6s_siege_gen.mjs <katalog gra/src z pinu> <katalog z node_modules/esbuild> \
//     > tests/p6_w6s_siege_vectors/siege.json
// Katalog gra/src: `git archive 07d2fbd72f758705f8e1d59cc4968027ffbafe75 gra/src gra/data` rozpakowany poza repo.
// Web jest transpilowany przez esbuild (bundle do pliku tymczasowego poza repo) i importowany jako prawdziwy modul,
// wiec wektory pochodza z wykonania kodu webowego, nie z reki.
//
// Sekcja 1 (`matrices`, `cases`) i sekcja 2 (`sideMatrices`, `sideAlliances`, `sideCases`) maja NIEZALEZNE
// ziarna PRNG; dopisanie sekcji 2 nie zmienia bajtow sekcji 1.

import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
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
  const { siegeAllowedBetween, siegeBattleSideOwners } = mod;
  if (typeof siegeAllowedBetween !== 'function') throw new Error('brak siegeAllowedBetween w webie');
  if (typeof siegeBattleSideOwners !== 'function') throw new Error('brak siegeBattleSideOwners w webie');

  // Deterministyczny PRNG (mulberry32), zeby wektory byly powtarzalne.
  const makeRnd = (initialSeed) => {
    let seed = initialSeed;
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const OWNERS = [0, 1, 2, 3, 4, 9]; // 0 = gracz, 9 = barbarzyncy (id bez znaczenia dla bramki)
  const toRows = (t) => OWNERS.map(a => OWNERS.map(b => t[`${a},${b}`]));

  // ---- Sekcja 1: siegeAllowedBetween ----
  const rnd = makeRnd(0x5eed1234);
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

  // ---- Sekcja 2: siegeBattleSideOwners (wrogosc kierunkowa x sojusze formalne; kandydaci = wszyscy wlasciciele) ----
  const rnd2 = makeRnd(0x51de0042);
  const SIDE_ENEMY_MATRICES = 6;
  const SIDE_ALLIANCE_MATRICES = 4;
  const sideMatrices = [];
  for (let m = 0; m < SIDE_ENEMY_MATRICES; m++) {
    const table = {};
    for (const a of OWNERS) {
      for (const b of OWNERS) {
        table[`${a},${b}`] = rnd2() < 0.5;
      }
    }
    sideMatrices.push(table);
  }
  const sideAlliances = [];
  for (let m = 0; m < SIDE_ALLIANCE_MATRICES; m++) {
    // Sojusz symetryczny (formalny). Przekatna losowa: web jej nie pyta dla "sojusznika samego siebie".
    const table = {};
    for (const a of OWNERS) {
      for (const b of OWNERS) {
        if (a < b) {
          table[`${a},${b}`] = rnd2() < 0.3;
          table[`${b},${a}`] = table[`${a},${b}`];
        }
      }
    }
    for (const a of OWNERS) table[`${a},${a}`] = rnd2() < 0.5;
    sideAlliances.push(table);
  }

  const sideCases = [];
  sideMatrices.forEach((enemyTable, em) => {
    const areEnemies = (a, b) => enemyTable[`${a},${b}`];
    sideAlliances.forEach((allyTable, am) => {
      const hasFormalAlliance = (a, b) => allyTable[`${a},${b}`];
      for (const besieger of OWNERS) {
        for (const city of OWNERS) {
          const got = siegeBattleSideOwners(besieger, city, OWNERS, areEnemies, hasFormalAlliance);
          sideCases.push({
            enemy: em,
            alliance: am,
            besieger,
            city,
            attacker: [...got.attacker].sort((x, y) => x - y),
            defender: [...got.defender].sort((x, y) => x - y),
          });
        }
      }
    });
  });

  const out = {
    source: 'gra/src/game/diplomacy-siege-war-gate.ts@07d2fbd72f758705f8e1d59cc4968027ffbafe75',
    generator: 'tests/p6_w6s_siege_gen.mjs',
    owners: OWNERS,
    matrices: matrices.map(toRows),
    cases,
    sideMatrices: sideMatrices.map(toRows),
    sideAlliances: sideAlliances.map(toRows),
    sideCases,
  };
  process.stdout.write(JSON.stringify(out, null, 1) + '\n');
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
