// P6-R7K7C-PARITY-MISSING0: generator wektorow z WEBA (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75)
// dla semantyki "brak wpisu = 0" w skarbcach AI (aiSkarbiecByOwner) i pulach Pracy AI (aiPracaPoolByOwner).
//
// Oracle: WYCIETE fragmenty pinu `gra/src/main.ts`, wykonane bez przerobki:
//   A. ownerTreasury (`?? 0`)                        - linie 34864-34866
//   B. buildDiploTreasury (metoda `add` bez podlogi) - linie 22618-22646 (sciezka dyplomacji, ta sama
//      co apply_dipl_deltas_to_state dla skarbcow AI)
//   C. ownerPracaPool + setOwnerPracaPool (`?? 0`, podloga Math.max(0,..)) - linie 34876-34894
// Wolne zmienne (isHuman, mapy, setter slotu HUD) dostarcza atrapa tego generatora; gracz ludzki = 1.
//
// Uzycie: node gen.mjs <pin-main.ts> <katalog-wyjsciowy> <katalog-roboczy-POZA-REPO>
//   np. git show 07d2fbd72:gra/src/main.ts > <POZA-REPO>/pin-main.ts
//
// STRAZNIK: SHA-256 kazdego wycinka pinu musi sie zgadzac, inaczej generator konczy sie bledem.
// Scenariusze DETERMINISTYCZNE (PRNG mulberry32, ziarno 20261116), wartosci calkowite (dokladne w f64).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , pinMain, outDir, workRoot] = process.argv;
if (!pinMain || !outDir || !workRoot) {
  console.error('uzycie: node gen.mjs <pin-main.ts> <katalog-wyjsciowy> <katalog-roboczy-POZA-REPO>');
  process.exit(2);
}

const pinLines = readFileSync(pinMain, 'utf8').split('\n');

// Wycinek 1-based, inkluzywnie; sprawdza poczatek i koniec oraz zwraca tekst.
function slice(first, last, startsWith, endsWith) {
  const text = pinLines.slice(first - 1, last).join('\n') + '\n';
  if (!text.startsWith(startsWith)) throw new Error(`STRAZNIK: poczatek wycinka ${first}-${last}`);
  if (!text.trimEnd().endsWith(endsWith)) throw new Error(`STRAZNIK: koniec wycinka ${first}-${last}`);
  return text;
}
function blockFrom(startLine) {
  // Blok zaczyna sie w startLine i konczy pierwsza linia "    }" po nim (zamkniecie funkcji).
  const start = startLine - 1;
  let end = start;
  while (pinLines[end] !== '    }') end++;
  return { first: startLine, last: end + 1, text: pinLines.slice(start, end + 1).join('\n') + '\n' };
}

const snipA = slice(34864, 34866, '    function ownerTreasury(ownerId: number): number {', '    }');
const blockB = blockFrom(22618);
if (blockB.first !== 22618 || blockB.last !== 22646) throw new Error(`STRAZNIK: blok B ${blockB.first}-${blockB.last}`);
const snipB = blockB.text;
const snipC = slice(
  34876,
  34894,
  '    function ownerPracaPool(ownerId: number): number {',
  'aiPracaPoolByOwner.set(ownerId, v);\n      }\n    }',
);

// Sumy SHA-256 wycinkow (straznik pinu). Zmiana pinu -> generator konczy sie bledem.
const EXPECTED = {
  A: '03fcfdbc9f629943c962ac1cbdefa1e48e7bf09cf94803028ef789e734d1d7ca',
  B: 'b581f8267ceefc4126170b487c23f3fe18ad125fd6d8dbad31c82ba38fa541d4',
  C: 'dfe2fc108cde86af3dfc2ddb163538e92e5be56acde6d8e1f543379b9a417178',
};
const got = {
  A: createHash('sha256').update(snipA).digest('hex'),
  B: createHash('sha256').update(snipB).digest('hex'),
  C: createHash('sha256').update(snipC).digest('hex'),
};
if (process.env.P6_PRINT_SHA === '1') console.log(JSON.stringify(got, null, 2));
for (const k of ['A', 'B', 'C']) {
  if (got[k] !== EXPECTED[k]) {
    console.error(`STRAZNIK SHA-256 wycinka ${k}: ${got[k]} != ${EXPECTED[k]}`);
    process.exit(3);
  }
}

// Modul wykonawczy: wycinki pinu w jednej funkcji; wolne zmienne z atrapy.
const work = join(workRoot, 'owner-pools-gen');
mkdirSync(work, { recursive: true });
const modPath = join(work, 'pin-owner-pools.ts');
writeFileSync(
  modPath,
  `export function build(env: any) {
  const { isHuman, playerStateByHuman, pracaPoolByHuman, aiSkarbiecByOwner, aiPracaPoolByOwner, setOwnerLastPraca } = env;
${snipA}
${snipB}
${snipC}
  return { ownerTreasury, buildDiploTreasury, ownerPracaPool, setOwnerPracaPool };
}
`,
);
const pin = await import(pathToFileURL(modPath).href);

// PRNG mulberry32.
let seed = 20261116 >>> 0;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const OWNERS = [2, 3, 4, 5];
const HUMAN = 1;

function runPin(c) {
  const skarb = new Map(Object.entries(c.aiTreasury).map(([k, v]) => [Number(k), v]));
  const praca = new Map(Object.entries(c.aiPraca).map(([k, v]) => [Number(k), v]));
  const env = {
    isHuman: (id) => id === HUMAN,
    playerStateByHuman: new Map(),
    pracaPoolByHuman: new Map(),
    aiSkarbiecByOwner: skarb,
    aiPracaPoolByOwner: praca,
    setOwnerLastPraca: () => {},
  };
  const f = pin.build(env);
  const dip = f.buildDiploTreasury();
  for (const [k, d] of Object.entries(c.treasuryDeltas).sort(([a], [b]) => a - b)) {
    dip.add(Number(k), d);
  }
  for (const [k, d] of Object.entries(c.pracaDeltas).sort(([a], [b]) => a - b)) {
    const o = Number(k);
    f.setOwnerPracaPool(o, f.ownerPracaPool(o) + d);
  }
  return {
    expTreasury: Object.fromEntries([...skarb.entries()].sort(([a], [b]) => a - b)),
    expPraca: Object.fromEntries([...praca.entries()].sort(([a], [b]) => a - b)),
  };
}

const cases = [];
const N = 160;
for (let s = 0; s < N; s++) {
  const aiTreasury = {};
  const aiPraca = {};
  for (const o of OWNERS) {
    if (rnd() < 0.5) aiTreasury[o] = int(0, 60);
    if (rnd() < 0.5) aiPraca[o] = int(0, 30);
  }
  const treasuryDeltas = {};
  for (const o of OWNERS) {
    if (rnd() < 0.5) continue;
    treasuryDeltas[o] = int(-40, 40);
  }
  const pracaDeltas = {};
  for (const o of OWNERS) {
    if (rnd() < 0.5) continue;
    pracaDeltas[o] = int(-35, 25);
  }
  const base = { name: `brak-wpisu-${s}`, aiTreasury, aiPraca, treasuryDeltas, pracaDeltas };
  cases.push({ ...base, ...runPin(base) });
}
// Przypadki brzegowe na poczatku: pusty stan, same brakujace wpisy, zerowe delty, dlug AI.
const edge = [
  { name: 'brzeg-pusto', aiTreasury: {}, aiPraca: {}, treasuryDeltas: {}, pracaDeltas: {} },
  { name: 'brzeg-brak-skarbca-dodatnia', aiTreasury: {}, aiPraca: {}, treasuryDeltas: { 2: 5 }, pracaDeltas: {} },
  { name: 'brzeg-brak-skarbca-ujemna', aiTreasury: {}, aiPraca: {}, treasuryDeltas: { 2: -5 }, pracaDeltas: {} },
  { name: 'brzeg-brak-praca-ujemna', aiTreasury: {}, aiPraca: {}, treasuryDeltas: {}, pracaDeltas: { 3: -4 } },
  { name: 'brzeg-zero-delta-brak', aiTreasury: {}, aiPraca: {}, treasuryDeltas: { 4: 0 }, pracaDeltas: { 5: 0 } },
  { name: 'brzeg-dlug-ai-trwa', aiTreasury: { 2: -30 }, aiPraca: {}, treasuryDeltas: { 2: 10 }, pracaDeltas: {} },
  { name: 'brzeg-praca-podloga', aiTreasury: {}, aiPraca: { 2: 3 }, treasuryDeltas: {}, pracaDeltas: { 2: -7 } },
];
for (const e of edge) cases.unshift({ ...e, ...runPin(e) });

rmSync(work, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, 'owner_pools.json'),
  JSON.stringify(
    {
      pin: '07d2fbd72f758705f8e1d59cc4968027ffbafe75',
      snippetSha256: { ownerTreasury: got.A, buildDiploTreasury: got.B, ownerPracaPool: got.C },
      cases,
    },
    null,
    2,
  ) + '\n',
);
console.log('OK', cases.length);
