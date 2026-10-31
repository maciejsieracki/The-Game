// P6.M07B partia 1 - generator wektorow z URUCHOMIONEGO kodu weba (pin edb8fb56).
//
// Uzycie (z katalogu poza repo, np. mktemp -d):
//   git archive edb8fb56 gra/src/map/gen-helpers.ts | tar -x -C <DIR>   (lub gra/src)
//   node --experimental-strip-types gen_turn_vectors.mjs <DIR>/gra/src/map/gen-helpers.ts <wyjscie.json>
//
// Skrypt wyciaga DOSLOWNIE tekst funkcji/stalych z pinu (po nazwie, do domykajacej klamry
// na poziomie zerowym), zapisuje je jako modul TS w katalogu tymczasowym obok (z package.json
// type=module), importuje i uruchamia. Wynik `out` kazdego przypadku pochodzi z funkcji weba.
// Ziarno PRNG (mulberry32) i domena wspolrzednych sa stale -> wyjscie jest deterministyczne.
//
// Domena: |q|,|r| <= DOMAIN_R (29). Limit wynika z dowodu ekwiwalencji mutanta M1
// (dossier P6-M07B-RZEKI-B-TRACE.md, sekcja "M1").

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SEED = 0x5eed2026;
const DOMAIN_R = 29;
const PIN = 'edb8fb56';
const N_UNIT = 1200;
const N_UTURN = 7000;
const N_VIOL = 28000;

const [, , srcArg, outArg] = process.argv;
if (!srcArg || !outArg) {
  console.error('usage: node --experimental-strip-types gen_turn_vectors.mjs <gen-helpers.ts> <out.json>');
  process.exit(2);
}

// ---- 1. ekstrakcja tekstu z pinu -------------------------------------------------------
const lines = fs.readFileSync(srcArg, 'utf8').split('\n');

function extract(prefix, kind) {
  const i = lines.findIndex((l) => l.startsWith(prefix));
  if (i < 0) throw new Error(`brak w pinie: ${prefix}`);
  const out = [];
  for (let j = i; j < lines.length; j++) {
    out.push(lines[j]);
    if (kind === 'fn' && lines[j] === '}') break;
    if (kind === 'const' && lines[j].trimEnd().endsWith(';')) break;
  }
  return out.join('\n');
}

const parts = [
  'export type RiverCoord = { q: number; r: number };',
  extract('export const HEX_DIRECTIONS', 'const'),
  extract('function riverHexDirDelta', 'fn'),
  extract('function neighborDirIndex', 'fn'),
  extract('export const RIVER_TURN_WINDOW_HEX', 'const'),
  extract('export const RIVER_TURN_WINDOW_MAX_SUM', 'const'),
  extract('function signedRiverDirDelta', 'fn'),
  extract('function pathSegmentDirs', 'fn'),
  extract('function pathSignedTurnDeltas', 'fn'),
  extract('export function riverSegmentUnitVector', 'fn'),
  extract('export function riverPathHasSharpUTurn', 'fn'),
  extract('export function riverPathViolatesTurnWindow', 'fn'),
].map((s) => s.replace(/^function /m, 'export function '));
const pinSnippet = parts.join('\n\n');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'm07b-gen-'));
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}\n');
const tsFile = path.join(tmp, 'web-turn.ts');
fs.writeFileSync(tsFile, pinSnippet + '\n');
const web = await import(pathToFileURL(tsFile).href);

// ---- 2. PRNG i generatory sciezek ------------------------------------------------------
let st = SEED >>> 0;
function rnd() {
  st = (st + 0x6d2b79f5) >>> 0;
  let t = st;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1)); // [lo, hi]
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const inBounds = (q, r) => Math.abs(q) <= DOMAIN_R && Math.abs(r) <= DOMAIN_R;

function randomStart() {
  return [ri(-DOMAIN_R, DOMAIN_R), ri(-DOMAIN_R, DOMAIN_R)];
}

// Tryb: 'walk' (losowy), 'uturn' (czesto zawrot), 'straight', 'zigzag', 'same' (skret tego samego znaku),
// 'jump' (czasem krok niesasiedni: segment bez kierunku, pathSegmentDirs go pomija).
function randomPath(len, mode) {
  const [sq, sr] = randomStart();
  const p = [[sq, sr]];
  let d = ri(0, 5);
  const sgn = rnd() < 0.5 ? 1 : -1;
  for (let k = 0; k < len; k++) {
    const [cq, cr] = p[p.length - 1];
    let stepped = false;
    if (mode === 'jump' && rnd() < 0.15) {
      const nq = cq + ri(-3, 3);
      const nr = cr + ri(-3, 3);
      if (inBounds(nq, nr) && (nq !== cq || nr !== cr)) { p.push([nq, nr]); stepped = true; }
    }
    if (!stepped) {
      let nd;
      if (mode === 'straight') nd = d;
      else if (mode === 'zigzag') nd = (k % 2 === 0) ? d : (d + 1) % 6;
      else if (mode === 'same') nd = ((d + sgn) % 6 + 6) % 6;
      else if (mode === 'uturn') nd = rnd() < 0.5 ? (d + 3) % 6 : (d + ri(0, 5)) % 6;
      else nd = ri(0, 5);
      // proba kroku: skok o 1 lub 2 zamiast kierunku sasiedniego (pokrywa |delta| > 1)
      let tries = 0;
      while (tries++ < 12) {
        const [dq, dr] = DIRS[nd];
        if (inBounds(cq + dq, cr + dr)) { p.push([cq + dq, cr + dr]); d = nd; stepped = true; break; }
        nd = ri(0, 5);
      }
      if (!stepped) break;
    }
  }
  return p;
}

const flat = (p) => p.flatMap(([q, r]) => [q, r]);
const toObjs = (p) => p.map(([q, r]) => ({ q, r }));

// ---- 3. przypadki ----------------------------------------------------------------------
const vectors = [];
const stats = { unit: 0, uturn: 0, uturnTrue: 0, viol: 0, violTrue: 0, violDefaults: 0 };

// unit: pary punktow (w tym ten sam heks, sasiedzi, skoki)
for (let i = 0; i < N_UNIT; i++) {
  const [aq, ar] = randomStart();
  let bq, br;
  const m = i % 4;
  if (m === 0) { bq = aq; br = ar; }
  else if (m === 1) { const [dq, dr] = DIRS[ri(0, 5)]; bq = aq + dq; br = ar + dr; }
  else { bq = ri(-DOMAIN_R, DOMAIN_R); br = ri(-DOMAIN_R, DOMAIN_R); }
  if (!inBounds(bq, br)) { bq = aq; br = ar; }
  const u = web.riverSegmentUnitVector({ q: aq, r: ar }, { q: bq, r: br });
  vectors.push({ fn: 'unit', a: [aq, ar], b: [bq, br], x: u.x, y: u.y });
  stats.unit++;
}

const MODES = ['walk', 'uturn', 'straight', 'zigzag', 'same', 'jump'];
const lenOf = () => ri(0, 18);

// uturn: dlugosci 0..18
for (let i = 0; i < N_UTURN; i++) {
  const p = randomPath(lenOf(), MODES[i % MODES.length]);
  const out = web.riverPathHasSharpUTurn(toObjs(p));
  vectors.push({ fn: 'uturn', p: flat(p), out });
  stats.uturn++;
  if (out) stats.uturnTrue++;
}

// viol: okno 1..9, maxSum 0..4; N-1/N/N+1 wzgledem maks. |sumy okna| tej samej trasy
function maxWindowAbs(p, w) {
  const deltas = web.pathSignedTurnDeltas(web.pathSegmentDirs(toObjs(p)));
  let best = 0;
  for (let i = 0; i < deltas.length; i++) {
    if (i + 1 < w) continue;
    const s = deltas.slice(i + 1 - w, i + 1).reduce((a, b) => a + b, 0);
    best = Math.max(best, Math.abs(s));
  }
  return best;
}
for (let i = 0; i < N_VIOL; i++) {
  const p = randomPath(lenOf(), MODES[i % MODES.length]);
  if (i % 5 === 4) {
    // domyslne parametry (windowHex=6, maxSum=1) - przypadek bez jawnych argumentow
    const out = web.riverPathViolatesTurnWindow(toObjs(p));
    vectors.push({ fn: 'viol', p: flat(p), out });
    stats.viol++;
    stats.violDefaults++;
    if (out) stats.violTrue++;
    continue;
  }
  const w = ri(1, 9);
  const S = maxWindowAbs(p, w);
  const pick = [S - 1, S, S + 1, ri(0, 4)][i % 4];
  const maxSum = Math.min(4, Math.max(0, pick));
  const out = web.riverPathViolatesTurnWindow(toObjs(p), w, maxSum);
  vectors.push({ fn: 'viol', p: flat(p), windowHex: w, maxSum, out });
  stats.viol++;
  if (out) stats.violTrue++;
}

const doc = {
  schema: 'p6-m07b-turn-v2',
  pin: PIN,
  source: 'gra/src/map/gen-helpers.ts (wyciag po nazwie, uruchomione przez node --experimental-strip-types)',
  generator: 'gen_turn_vectors.mjs',
  seed: SEED,
  domainR: DOMAIN_R,
  stats,
  vectors,
};
fs.writeFileSync(outArg, JSON.stringify(doc) + '\n');
fs.rmSync(tmp, { recursive: true, force: true });
console.log(JSON.stringify(stats));
