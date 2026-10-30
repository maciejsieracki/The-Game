// Generator wektorow (REPIN-EKONOMIA-D1 / batch 1: mnozniki Handel->Pieniadz, civ economy yield).
// Uruchamia WERSJE WEBA z pinu 91dc998a: wycinek economy.ts (verbatim, patrz economy-mnoznik-slice.mts)
// i civ-matrix.ts@91dc998a oraz civ-matrix.json@91dc998a (lub MATRIX_JSON dla wektora "zero").
// Uruchomienie: node --experimental-strip-types --import <dir>/register.mjs gen-mnoznik.mts <out.json> [--zero]
import { writeFileSync } from 'node:fs';
import {
  mnoznikHandelPieniadzForCiv,
  mnoznikHandelPieniadzForCivByDifficulty,
  civEconomyYieldMultipliers,
} from '../gra/src/game/economy-mnoznik-slice.mts';
import { loadCivMatrix } from '../gra/src/game/civ-matrix.ts';

const out = process.argv[2];
const f = (x: any): { f: string } => ({ f: Object.is(x, -0) ? '-0' : String(x) });

const matrix = loadCivMatrix();
const keys: (string | null | undefined)[] = [null, undefined, '', 'nieznana_cywilizacja', 'GRECY', 'Grecy'];
for (const row of matrix.cywilizacje) {
  keys.push(row.ikonaId, row.typCywilizacji, row.Cywilizacja);
  keys.push(row.ikonaId.toUpperCase());
}
const uniqKeys = [...new Set(keys)];

const civsArg = { cywilizacje: [{ Cywilizacja: 'Grecy', ikonaId: 'grecy', mnoznikHandelPieniadz: 9 }] };
const FB_FORCIV: (number | undefined)[] = [undefined, 0, 1, 2.5, NaN, -0];
const forCiv: any[] = [];
for (const k of uniqKeys) {
  for (const civs of [undefined, civsArg]) {
    for (const fb of FB_FORCIV) {
      const got = fb === undefined
        ? mnoznikHandelPieniadzForCiv(k, civs as any)
        : mnoznikHandelPieniadzForCiv(k, civs as any, fb);
      forCiv.push({ key: k === undefined ? { u: true } : k, civs: civs === undefined ? 'none' : 'row',
        fb: fb === undefined ? { default: true } : f(fb), out: f(got) });
    }
  }
}

const DIFFS = ['easy', 'normal', 'hard'] as const;
const FB_DIFF = [0, 1, 1.5, 2.5, NaN, -0, Infinity];
const byDiff: any[] = [];
for (const k of uniqKeys) {
  for (const d of DIFFS) {
    for (const fb of FB_DIFF) {
      const got = mnoznikHandelPieniadzForCivByDifficulty(k, civsArg as any, d, fb);
      byDiff.push({ key: k === undefined ? { u: true } : k, diff: d, fb: f(fb), out: f(got) });
    }
  }
}

const bonusSets: any[] = [undefined, [], [{ realizuje: 'ekonomia', typ: 'bonus_zloto', cel: 'handel', wartosc: 0.15 }],
  [{ realizuje: 'ekonomia', typ: 'bonus_nauka', wartosc: 0.15 }]];
const yieldMult = bonusSets.map((b) => ({ bonusy: b === undefined ? 'undef' : b,
  out: civEconomyYieldMultipliers(b as any) }));

writeFileSync(out, JSON.stringify({ forCiv, byDiff, yieldMult, matrixKeyCount: uniqKeys.length }));
console.log('counts forCiv', forCiv.length, 'byDiff', byDiff.length, 'yield', yieldMult.length, 'keys', uniqKeys.length);
