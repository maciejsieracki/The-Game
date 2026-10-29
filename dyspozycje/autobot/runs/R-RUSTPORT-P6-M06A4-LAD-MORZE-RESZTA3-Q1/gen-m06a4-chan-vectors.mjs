// Generator wektorow P6.M06A4 runda 3 (obrona, zarzut PM04): przypadki, w ktorych DRUGI
// removeInlandWaterPools w purgeInlandWaterForMultiLandTyp (web :4215, ostatni krok) ZMIENIA mape.
// Kryterium (liczone na prawdziwym kodzie weba, pin edb8fb56): po krokach
//   fill(5) -> removeInland -> trimEnclosedOcean -> fill(4)
// liczba heksow inlandowych wykrytych przez removeInlandWaterPools > 0 (= drugi removeInland cos zamienia).
// Mutant "usuniety ostatni removeInland" daje wtedy inna mape niz web -> test go zabija.
// Wejscie: losowe mapy 9x9 (wagi z duza iloscia morza); deterministyczny seed.
// Uzycie (loader jak w gen-m06a4-trim-vectors.mjs):
//   node --experimental-transform-types --no-warnings --import ./m06a-loader-register.mjs \
//        ./gen-m06a4-chan-vectors.mjs <WEB_ROOT> <WYJSCIE.json>
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-m06a4-chan-vectors.mjs <WEB_ROOT> <WYJSCIE.json>');
  process.exit(2);
}
const mapDir = `${root}/gra/src/map`;
const originalSrc = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const G = await import(pathToFileURL(`${mapDir}/gen-helpers.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy, Nakladka } = H;

const TB_TO_RUST = {
  [TerenBazowy.Laka]: 'Laka',
  [TerenBazowy.Rownina]: 'Rownina',
  [TerenBazowy.Wzgorza]: 'Wzgorza',
  [TerenBazowy.Gory]: 'Gory',
  [TerenBazowy.PlytkieMorze]: 'PlytkieMorze',
  [TerenBazowy.Morze]: 'Morze',
  [TerenBazowy.Pustynia]: 'Pustynia',
  [TerenBazowy.Polarny]: 'Polarny',
};
const RUST_TB = Object.keys(TB_TO_RUST);

function mkHex(tb, nak = Nakladka.Brak, zloze = 0, rzeka = 0) {
  const hex = { terenBazowy: tb, nakladka: nak, rzeka: { obecna: !!rzeka, krawedzie: rzeka ? [0] : [] } };
  if (zloze) hex.zloze = { typ: 'zloze_rudy' };
  return hex;
}
function dumpMap(hexes) {
  return Object.entries(hexes).map(([k, h]) => [
    k,
    TB_TO_RUST[h.terenBazowy] ?? `??${h.terenBazowy}`,
    h.nakladka,
    h.zloze !== undefined ? 1 : 0,
    h.rzeka?.obecna ? 1 : 0,
    h.rzeka?.krawedzie?.length ?? 0,
  ]);
}

const rng = G.mulberry32(20261034);
const rnd = () => rng();
function weightedPick(weights) {
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let x = rnd() * total;
  for (const [tb, w] of weights) {
    if (x < w) return tb;
    x -= w;
  }
  return weights[weights.length - 1][0];
}
const W_CHAN = [[TerenBazowy.Laka, 5], [TerenBazowy.Morze, 3], [TerenBazowy.PlytkieMorze, 1], [TerenBazowy.Gory, 1], [TerenBazowy.Rownina, 1]];

function gridMap(W, H, weights, holeP = 0) {
  const hexes = {};
  for (let r = 0; r < H; r++) {
    for (let q = 0; q < W; q++) {
      if (holeP > 0 && rnd() < holeP) continue;
      hexes[`${q},${r}`] = mkHex(weightedPick(weights), Nakladka.Brak, 0, 0);
    }
  }
  return hexes;
}

const W = 9;
const Hh = 9;
const WANT = 12;
const MAX_TRIES = 6000;
const killers = [];
let tried = 0;
let fill4Changed = 0;
for (; tried < MAX_TRIES && killers.length < WANT; tried++) {
  const hexes = gridMap(W, Hh, W_CHAN, tried % 3 === 0 ? 0.08 : 0);
  // Krok po kroku jak web purgeInlandWaterForMultiLandTyp, bez ostatniego removeInland.
  const a = structuredClone(hexes);
  G.fillEnclosedWaterByLandNeighbors(a, 5);
  G.removeInlandWaterPools(a, W, Hh);
  G.trimEnclosedOceanOnly(a, W, Hh);
  const n4 = G.fillEnclosedWaterByLandNeighbors(a, 4);
  if (n4 > 0) fill4Changed++;
  const b = structuredClone(a);
  const n2 = G.removeInlandWaterPools(b, W, Hh);
  if (n2 === 0) continue;
  // Pelny przebieg weba (wynik calej funkcji = stan po ostatnim removeInland).
  const full = structuredClone(hexes);
  const nFull = G.purgeInlandWaterForMultiLandTyp(full, W, Hh);
  killers.push({
    name: `chan_cut_${killers.length}`,
    w: W,
    h: Hh,
    input: dumpMap(hexes),
    out: nFull,
    output: dumpMap(full),
    inland_after_fill4: n2,
  });
}

const doc = {
  meta: {
    generator: 'gen-m06a4-chan-vectors.mjs',
    pin: 'edb8fb56',
    seed: 20261034,
    gen_helpers_sha256: sha(originalSrc),
    symbols: ['purgeInlandWaterForMultiLandTyp'],
    terrain_map: TB_TO_RUST,
    rust_terrains: RUST_TB,
    purpose: 'Zabija mutant PM04: usuniety OSTATNI removeInlandWaterPools (kryterium: inland_after_fill4 > 0).',
  },
  stats: { tried, killers: killers.length, fill4_changed_maps: fill4Changed, want: WANT },
  cases: { purge_channel_cut: killers },
};
writeFileSync(out, JSON.stringify(doc));
console.log(JSON.stringify({ stats: doc.stats, sha: doc.meta.gen_helpers_sha256 }));
