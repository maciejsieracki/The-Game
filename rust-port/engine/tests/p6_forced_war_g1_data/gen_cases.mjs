// P6-FORCED-WAR-MODULES-Q1 (G1): generator / weryfikator wektorow cases.json z URUCHOMIONEGO weba.
//
// Uzycie (Node 22, poza repo nie jest wymagane; pliki webowe z `git archive`):
//   mkdir -p <DIR> && git archive origin/main gra/src | tar -x -C <DIR>
//   node gen_cases.mjs <DIR>/gra/src <sciezka>/cases.json          # tryb weryfikacji (exit 1 przy roznicy)
//   node gen_cases.mjs <DIR>/gra/src <sciezka>/cases.json --write  # przelicza `out` i dopisuje wektory hexDistance
//
// Wejscia (`in`) z istniejacego pliku sa zachowane; `out` jest zawsze przeliczany przez prawdziwe funkcje weba.
// Jedyny patch: w kopii forced-war-stone.ts import `./forced-war-common` dostaje rozszerzenie `.ts`
// (Node strip-types wymaga pelnego rozszerzenia). Patch nie zmienia logiki (kopie laduja w katalogu tymczasowym).
// Odleglosc heksowa dla pickForcedWarTargetId = dokladna kopia `hexDistance` z gra/src/units/setup.ts
// (wyciagnieta z zrodla tym samym regexem, bez przepisywania).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , srcDir, casesPath, mode] = process.argv;
if (!srcDir || !casesPath) {
  console.error('uzycie: node gen_cases.mjs <gra/src> <cases.json> [--write]');
  process.exit(2);
}
const write = mode === '--write';

// --- 1. Kopie modulow webowych w katalogu tymczasowym (poza repo) ---
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p6fw-web-'));
fs.mkdirSync(path.join(tmp, 'game'), { recursive: true });
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}\n');
fs.copyFileSync(
  path.join(srcDir, 'game', 'forced-war-common.ts'),
  path.join(tmp, 'game', 'forced-war-common.ts'),
);
const stoneSrc = fs.readFileSync(path.join(srcDir, 'game', 'forced-war-stone.ts'), 'utf8');
const stonePatched = stoneSrc.replace("from './forced-war-common';", "from './forced-war-common.ts';");
if (stonePatched === stoneSrc) throw new Error('patch importu nie zadzialal (zmieniony zrodlo weba?)');
fs.writeFileSync(path.join(tmp, 'game', 'forced-war-stone.ts'), stonePatched);

const setupSrc = fs.readFileSync(path.join(srcDir, 'units', 'setup.ts'), 'utf8');
const hdMatch = setupSrc.match(/export function hexDistance\([\s\S]*?\n\}\n/);
if (!hdMatch) throw new Error('nie znaleziono hexDistance w units/setup.ts');
fs.writeFileSync(path.join(tmp, 'hex.ts'), hdMatch[0]);

const common = await import(pathToFileURL(path.join(tmp, 'game', 'forced-war-common.ts')).href);
const stone = await import(pathToFileURL(path.join(tmp, 'game', 'forced-war-stone.ts')).href);
const hex = await import(pathToFileURL(path.join(tmp, 'hex.ts')).href);
const webHexDistance = hex.hexDistance;

// --- 2. Wywolania prawdziwych funkcji weba ---
const UNDEF = 'undefined';
const toRest = v => (v === UNDEF ? undefined : v);
const candidates = arr => arr.map(c => ({ ownerId: c.ownerId, q: c.q, r: c.r }));
const refOf = v => (v === null || v === undefined ? undefined : { q: v.q, r: v.r });

function callWeb(c) {
  const i = c.in;
  switch (c.fn) {
    case 'pickForcedWarTargetId':
      return common.pickForcedWarTargetId(
        candidates(i.candidates), refOf(i.ref), webHexDistance, new Set(i.blocked),
      );
    case 'pickStoneForcedWarTargetId':
      return stone.pickStoneForcedWarTargetId(
        candidates(i.candidates), refOf(i.ref), webHexDistance,
        { blockedOwnerIds: new Set(i.blocked) },
      );
    case 'shouldEndForcedWarByCityCount':
      return common.shouldEndForcedWarByCityCount(i.a, i.d, i.t);
    case 'countActiveWarsExcluding': {
      const wars = new Set(i.wars);
      const key = (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`;
      const ex = new Set(i.exclude);
      return common.countActiveWarsExcluding(
        i.ownerId, i.owners, (a, b) => wars.has(key(a, b)), oid => ex.has(oid),
      );
    }
    case 'isRestingFromForcedWar':
      return common.isRestingFromForcedWar(i.cur, toRest(i.rest));
    case 'countActiveForcedWarsForOwner':
      return common.countActiveForcedWarsForOwner(i.ownerId, i.pairs);
    case 'isForcedEraPeaceLocked':
      return common.isForcedEraPeaceLocked(i.cur, i.war);
    case 'isForcedWarRelationBlocked':
      return common.isForcedWarRelationBlocked(i.r);
    case 'isEligibleForStoneForcedWar':
      return stone.isEligibleForStoneForcedWar(i);
    case 'constant': {
      const all = { ...common, ...stone };
      if (!(i.name in all)) throw new Error(`nieznana stala ${i.name}`);
      return all[i.name];
    }
    case 'hexDistance':
      return webHexDistance(i.aq, i.ar, i.bq, i.br);
    default:
      throw new Error(`nieznana funkcja w wektorach: ${c.fn}`);
  }
}

// --- 3. Wektory hexDistance (deterministyczna siatka, do porownania z formula Rust) ---
const hexCases = [];
for (let q = -3; q <= 3; q++) {
  for (let r = -3; r <= 3; r++) {
    hexCases.push({ fn: 'hexDistance', in: { aq: 0, ar: 0, bq: q, br: r }, out: 0 });
  }
}
for (const [aq, ar, bq, br] of [[2, -1, -1, 1], [5, 0, 2, -1], [-4, 2, 3, -5], [1, 1, 1, 1]]) {
  hexCases.push({ fn: 'hexDistance', in: { aq, ar, bq, br }, out: 0 });
}

// --- 4. Przeliczenie i porownanie ---
const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
const base = cases.filter(c => c.fn !== 'hexDistance');
let diffs = 0;
for (const c of base) {
  const got = callWeb(c);
  const expect = c.out;
  const gotNorm = got === undefined || Number.isNaN(got) ? null : got;
  if (expect !== gotNorm) {
    diffs++;
    if (diffs <= 20) console.error('ROZNICA', c.fn, JSON.stringify(c.in), 'plik=', JSON.stringify(expect), 'web=', JSON.stringify(gotNorm));
  }
  c.out = gotNorm;
}
for (const c of hexCases) c.out = callWeb(c);

const existingHex = cases.filter(c => c.fn === 'hexDistance');
if (existingHex.length === 0 && !write) {
  console.log('(brak wektorow hexDistance w pliku; uzyj --write aby je dopisac)');
}

const outCases = write ? [...base, ...hexCases] : [...base, ...existingHex];
if (write) {
  fs.writeFileSync(casesPath, JSON.stringify(outCases, null, 1) + '\n');
}
console.log(`web-wektory: ${base.length} bazowych, roznic=${diffs}; hexDistance=${hexCases.length}${write ? ' (zapisano)' : ' (tryb weryfikacji)'}`);
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(diffs === 0 ? 0 : 1);
