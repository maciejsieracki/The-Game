// R-RUSTPORT-P4-1B-Q2-RIVER-TRIM: generator wektorow `trimMediumRenderPathAtMain` z pinu 07d2fbd72.
// Generator WYKONUJE tekst pinu: wycina z `gra/src/map/gen-helpers.ts` dwie funkcje
// (`trimMediumTailAlongMain` :7623-7634, `trimMediumRenderPathAtMain` :8194-8203) oraz `hexKey`
// (:157-159), sprawdza straznik SHA-256 wycietych fragmentow, usuwa typy (`stripTypeScriptTypes`)
// i wykonuje je w node.
//
// Uzycie (Node 22+; cwd = korzen repo; plik pinu poza repo):
//   git show 07d2fbd72:gra/src/map/gen-helpers.ts > <TMP>/gen-helpers.ts
//   node rust-port/engine/tests/p4_1b_river_trim_vectors/gen.mjs <TMP>/gen-helpers.ts \
//     > rust-port/engine/tests/p4_1b_river_trim_vectors/vectors.json

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const [SRC] = process.argv.slice(2);
if (!SRC) throw new Error('uzycie: gen.mjs <gen-helpers.ts z pinu>');
const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const EXPECTED_SHA256 = 'b087f66e08ff5f3e7b4ed9f632b64ed43568519ca61f9820a020149ed545f943';

const text = readFileSync(SRC, 'utf8');
const lines = text.split('\n');

// Wycina funkcje od linii (1-based `start`, z komentarzem JSDoc nad nia lub bez) do pierwszej
// linii `}` w kolumnie 0, sprawdzajac sygnature.
function cut(start, sigLine, signature) {
  if (!lines[sigLine - 1].includes(signature)) {
    throw new Error(`linia ${sigLine} nie zawiera ${signature}: ${lines[sigLine - 1]}`);
  }
  let i = sigLine - 1;
  while (lines[i] !== '}') i += 1;
  return { from: start, to: i + 1, text: lines.slice(start - 1, i + 1).join('\n') };
}
const fHexKey = cut(157, 157, 'export function hexKey(q: number, r: number): string {');
const fTail = cut(7623, 7623, 'function trimMediumTailAlongMain(path: RiverCoord[], mainKeys: Set<string>): RiverCoord[] {');
const fRender = cut(8194, 8194,'export function trimMediumRenderPathAtMain(');
if (fHexKey.to !== 159) throw new Error(`hexKey konczy sie w ${fHexKey.to}, oczekiwano 159`);
if (fTail.to !== 7634) throw new Error(`trimMediumTailAlongMain konczy sie w ${fTail.to}, oczekiwano 7634`);
if (fRender.to !== 8203) throw new Error(`trimMediumRenderPathAtMain konczy sie w ${fRender.to}, oczekiwano 8203`);
const fragments = [fHexKey, fTail, fRender];
const joined = fragments.map(f => f.text).join('\n---\n');
const sha = createHash('sha256').update(joined).digest('hex');
if (EXPECTED_SHA256 === 'FILL_ME') {
  process.stderr.write(`SHA-256 fragmentow: ${sha}\n`);
} else if (sha !== EXPECTED_SHA256) {
  throw new Error(`straznik SHA-256 fragmentow: ${sha} != ${EXPECTED_SHA256} (pin ${PIN})`);
}

const js = stripTypeScriptTypes(
  fragments.map(f => f.text.replace(/^export /m, '')).join('\n'),
  { mode: 'strip' },
);
const F = new Function(`${js}\nreturn { trimMediumRenderPathAtMain };`)();

// Deterministyczny LCG.
let seed = 0x7e1d2b0f;
const rnd = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const c = (q, r) => ({ q, r });
function walk(len) {
  const out = [];
  let q = ri(-6, 6);
  let r = ri(-6, 6);
  for (let i = 0; i < len; i += 1) {
    out.push(c(q, r));
    const [dq, dr] = DIRS[ri(0, 5)];
    q += dq;
    r += dr;
  }
  return out;
}

const cases = [];
const toJson = p => p.map(x => [x.q, x.r]);
function add(name, path, mainPaths) {
  const before = JSON.stringify(path);
  const res = F.trimMediumRenderPathAtMain(path, mainPaths);
  if (JSON.stringify(path) !== before) throw new Error(`pin zmodyfikowal wejscie: ${name}`);
  cases.push({
    name,
    path: toJson(path),
    mainPaths: mainPaths.map(mp => (mp == null ? null : toJson(mp))),
    expected: toJson(res),
    trimmed: res.length !== path.length,
  });
}

// --- Reczne przypadki (kazda kategoria z dispatchu) ---
const P5 = () => [c(0, 0), c(1, 0), c(2, 0), c(3, 0), c(4, 0)];
add('len0', [], [[c(0, 0)]]);
add('len1_na_main', [c(0, 0)], [[c(0, 0)]]);
add('len2_oba_na_main', [c(0, 0), c(1, 0)], [[c(0, 0), c(1, 0)]]);
add('len2_brak_main', [c(0, 0), c(1, 0)], []);
add('pusty_mainPaths', P5(), []);
add('mainPaths_z_pusta_sciezka', P5(), [[]]);
add('mainPaths_null', P5(), [null]);
add('mainPaths_null_i_ogon', P5(), [null, [c(3, 0), c(4, 0)]]);
add('ogon0_main_obok', P5(), [[c(9, 9), c(9, 8)]]);
add('ogon1_tylko_ostatni', P5(), [[c(4, 0), c(5, 0)]]);
add('ogon_tylko_przedostatni', P5(), [[c(3, 0), c(3, 1)]]);
add('ogon2', P5(), [[c(3, 0), c(4, 0)]]);
add('ogon3', P5(), [[c(2, 0), c(3, 0), c(4, 0)]]);
add('ogon4', P5(), [[c(1, 0), c(2, 0), c(3, 0), c(4, 0)]]);
add('cala_na_main_zostaja_2', P5(), [P5()]);
add('cala_na_main_len3', P5().slice(0, 3), [P5().slice(0, 3)]);
add('cala_na_main_dwie_sciezki', P5(), [[c(0, 0), c(1, 0)], [c(2, 0), c(3, 0), c(4, 0)]]);
add('duplikaty_w_mainPaths', P5(), [[c(3, 0), c(3, 0), c(4, 0)], [c(4, 0), c(3, 0)]]);
add('duplikaty_cala', P5(), [P5(), P5(), P5()]);
add('przerwa_w_ogonie', P5(), [[c(1, 0), c(2, 0), c(4, 0)]]);
add('srodek_na_main_koniec_nie', P5(), [[c(1, 0), c(2, 0), c(3, 0)]]);
add('ujemne_wsp', [c(-3, 2), c(-2, 1), c(-1, 0), c(0, -1)], [[c(-1, 0), c(0, -1)]]);
add('powtorzony_heks_w_sciezce', [c(0, 0), c(1, 0), c(0, 0), c(1, 0)], [[c(0, 0), c(1, 0)]]);

// --- Losowe: sciezki 0..14, main z ogona sciezki (k heksow) + szum, duplikaty, null ---
for (let i = 0; i < 260; i += 1) {
  const len = ri(0, 14);
  const path = walk(len);
  const mode = ri(0, 7);
  const mainPaths = [];
  if (mode === 1) {
    mainPaths.push(walk(ri(1, 8)));
  } else if (mode !== 0) {
    const k = Math.min(len, ri(0, len + 1));
    const tail = path.slice(len - k).map(x => ({ ...x }));
    // mode 7: wyrwij jeden heks z ogona (tylko ostatni / tylko przedostatni / przerwa)
    if (mode === 7 && tail.length >= 2) tail.splice(ri(0, tail.length - 1), 1);
    mainPaths.push(tail);
    if (ri(0, 2) === 0) mainPaths.push(walk(ri(0, 6)));
    if (ri(0, 3) === 0 && tail.length > 0) mainPaths.push([{ ...tail[ri(0, tail.length - 1)] }]);
    if (ri(0, 9) === 0) mainPaths.push(null);
  }
  add(`los_${i}`, path, mainPaths);
}

const nTrim = cases.filter(x => x.trimmed).length;
if (cases.length < 150) throw new Error(`za malo wektorow: ${cases.length}`);
if (nTrim < 50) throw new Error(`za malo przyciec: ${nTrim}`);
process.stdout.write(`${JSON.stringify({
  pin: PIN,
  source: 'gra/src/map/gen-helpers.ts',
  fragments: fragments.map((f, i) => ({
    fn: ['hexKey', 'trimMediumTailAlongMain', 'trimMediumRenderPathAtMain'][i],
    lines: [f.from, f.to],
  })),
  fragmentsSha256: sha,
  count: cases.length,
  trimmedCount: nTrim,
  cases,
})}\n`);
