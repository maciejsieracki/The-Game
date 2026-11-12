// P6 SIEGE-TAKTYKA K5i-2a3: generator wektorow wejsc muru WYKONUJACY tekst pinu (pin 07d2fbd72).
// Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_inputs_wall_gen.mjs (Node 22)
// Wynik -> p6_siege_tactics_inputs_wall_vectors/vectors.json. Ziarno PRNG 5123 (mulberry32).
//
// Kazdy fragment to dokladny zakres linii pinu (1-based, wlacznie), wykonany przez `new Function(...)`.
// Jedyna mechaniczna transformacja tekstu: usuniecie skladni TS ` as any` (new Function parsuje czysty JS).
// Poza wykonaniem zostaja wylacznie stuby wartosci liczonych poza zakresem (cityGatedTerrainMultiplier,
// terrainDefenseMultiplier - K5i-2a1), podawane z wektora.
// Straznik: SHA-256 zlaczonych fragmentow pinu (po zdjeciu ` as any`).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const FILES = { scene: 'gra/src/battle/battleScene.ts', cd: 'gra/src/game/city-defense.ts' };
const FRAGMENTS = {
  // cityWallDefenseBonusPercent body :61-83
  cityWall: { file: 'cd', ranges: [[61, 83]], params: ['builtBuildingIds', 'params'] },
  // konstruktor: blok wallDefenseMult :2750-2759 (this = scena)
  ctorWall: {
    file: 'scene',
    ranges: [[2750, 2759]],
    params: ['miastoParamsData', 'opts', 'cityWallDefenseBonusPercent'],
  },
  // defenderInsideFortification body :114-116
  inside: { file: 'cd', ranges: [[114, 116]], params: ['ctx'] },
  // fortificationDefenseBonusForUnit body :128
  fortBonus: { file: 'cd', ranges: [[128, 128]], params: ['ctx', 'wallTotalProc', 'defenderInsideFortification'] },
  // _wallBonusProcFor body :7460-7463 (this = scena)
  wallBonusProcFor: { file: 'scene', ranges: [[7460, 7463]], params: ['u', 'fortificationDefenseBonusForUnit'] },
  // hasMur :8848
  hasMur: { file: 'scene', ranges: [[8848, 8848]], params: [], ret: 'return hasMur;' },
  // cityTerrMult :8850-8852
  cityTerrMult: {
    file: 'scene',
    ranges: [[8850, 8852]],
    params: ['hasMur', 'cityElevationTerrain', 'cityGatedTerrainMultiplier'],
    ret: 'return cityTerrMult;',
  },
  // terrDefMult :8855-8857
  terrDefMult: {
    file: 'scene',
    ranges: [[8855, 8857]],
    params: ['defender', 'defTerrain', 'cuA', 'cityTerrMult', 'terrainDefenseMultiplier'],
    ret: 'return terrDefMult;',
  },
  // fieldFortifyDefenseBonus body :242-244
  fortify: { file: 'cd', ranges: [[242, 244]], params: ['baseObrona', 'isFortifiedInField', 'fortifyObronaProc'] },
};
const FRAGMENT_SHA256 = 'a5cd530724ff436e2b672ca3d33a63d51562ef58f3b14240263f52f53901512e';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const sources = Object.fromEntries(
  Object.entries(FILES).map(([key, path]) => [
    key,
    execFileSync('git', ['show', `${PIN}:${path}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n'),
  ]),
);
const pinRange = (file, a, b) => sources[file].slice(a - 1, b).join('\n');
const fragmentTexts = Object.fromEntries(
  Object.entries(FRAGMENTS).map(([name, f]) => [
    name,
    [...f.ranges.map(([a, b]) => pinRange(f.file, a, b)), f.ret ?? ''].join('\n').replaceAll(' as any', ''),
  ]),
);
const fragmentDigest = createHash('sha256')
  .update(Object.keys(FRAGMENTS).map((name) => `${name}\n${fragmentTexts[name]}`).join('\n---\n'))
  .digest('hex');
if (FRAGMENT_SHA256 !== '__SET_AFTER_FIRST_RUN__' && fragmentDigest !== FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu nie zgadzaja sie z hashem: ${fragmentDigest}`);
}
const F = Object.fromEntries(
  Object.entries(FRAGMENTS).map(([name, f]) => [name, new Function(...f.params, fragmentTexts[name])]),
);
// Fragmenty bez wlasnego `return` (ctorWall ustawia pola `this`; reszta ma return w tekscie pinu lub w `ret`).

// ---- PRNG i kodowanie ----
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(5123);
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
// JSON nie ma NaN/Infinity: kodowanie tekstowe.
// Liczby niecalkowite i duze zapisane tekstem (JS shortest repr): serde_json bez `float_roundtrip` moze
// wczytac float z bledem 1 ulp, wiec test Rust parsuje je przez f64::from_str.
const enc = (x) => {
  if (typeof x !== 'number') return x;
  if (Number.isNaN(x)) return 'NaN';
  if (!Number.isFinite(x)) return x > 0 ? 'Infinity' : '-Infinity';
  return Number.isSafeInteger(x) ? x : String(x);
};
const NUMS = [0, 1, 100, 200, 150, 50, 300, 75.5, -100, -0, 1e6, NaN, Infinity, -Infinity];
const cnt = {};
const hit = (k) => {
  cnt[k] = (cnt[k] ?? 0) + 1;
};

const IDS = ['mury', 'mury_kamienne', 'fort', 'baszta', 'palisada', 'inne'];

// 1. cityWallDefenseBonusPercent: wszystkie 64 podzbiory x warianty parametrow + null/undefined
const vCity = [];
const paramVariants = [
  { mur: 200, cytadela: 100, baszta: 100, palisada: undefined, murKamienny: undefined },
  { mur: 200, cytadela: 100, baszta: 100, palisada: 100, murKamienny: 150 },
  { mur: 120, cytadela: 80, baszta: 60, palisada: 40, murKamienny: 90 },
  { mur: 0, cytadela: 0, baszta: 0, palisada: 0, murKamienny: 0 },
  { mur: NaN, cytadela: 100, baszta: 100, palisada: NaN, murKamienny: NaN },
  { mur: Infinity, cytadela: -Infinity, baszta: Infinity, palisada: Infinity, murKamienny: -50 },
  { mur: -30, cytadela: 25.5, baszta: 1e300, palisada: undefined, murKamienny: 1e300 },
  { mur: 200, cytadela: 100, baszta: 100, palisada: null, murKamienny: null },
];
function cityCase(built, params) {
  const got = F.cityWall(built, params);
  const b = built ?? [];
  const tag = [
    built == null ? 'built-null' : 'built-list',
    b.includes('mury') ? (b.includes('fort') ? 'mury+fort' : 'mury') : b.includes('mury_kamienne') ? (b.includes('fort') ? 'kamienne+fort' : 'kamienne') : b.includes('fort') ? 'fort-solo' : b.includes('palisada') ? 'palisada' : 'brak-muru',
    b.includes('baszta') ? 'baszta' : 'bez-baszty',
    params.palisada == null ? 'palisada-domyslna' : 'palisada-jawna',
    params.murKamienny == null ? 'kamienny-domyslny' : 'kamienny-jawny',
  ];
  tag.forEach(hit);
  vCity.push({
    built: built === undefined ? null : built,
    params: { mur: enc(params.mur), cytadela: enc(params.cytadela), baszta: enc(params.baszta), palisada: params.palisada == null ? null : enc(params.palisada), murKamienny: params.murKamienny == null ? null : enc(params.murKamienny) },
    expect: enc(got),
  });
}
for (let mask = 0; mask < 64; mask++) {
  const built = IDS.filter((_, i) => mask & (1 << i));
  for (const p of paramVariants) cityCase(built, p);
}
for (const p of paramVariants) {
  cityCase(null, p);
  cityCase(undefined, p);
}
for (let i = 0; i < 60; i++) {
  const built = IDS.filter(() => rnd() < 0.5);
  cityCase(built, { mur: pick(NUMS), cytadela: pick(NUMS), baszta: pick(NUMS), palisada: rnd() < 0.3 ? undefined : pick(NUMS), murKamienny: rnd() < 0.3 ? undefined : pick(NUMS) });
}

// 2. blok konstruktora wallDefenseMult / wallDefenseTotalProc
const vCtor = [];
const wartosc = () => (rnd() < 0.35 ? undefined : pick(NUMS));
const mpVal = (key, v) => (v === undefined ? {} : { [key]: { wartosc: v } });
for (let i = 0; i < 400; i++) {
  const vals = { mur: wartosc(), murKamienny: wartosc(), cytadela: wartosc(), baszta: wartosc(), palisada: wartosc() };
  const miasto =
    i % 17 === 0
      ? undefined
      : { ...mpVal('bonus_obrona_mur_proc', vals.mur), ...mpVal('bonus_obrona_mur_kamienny_proc', vals.murKamienny), ...mpVal('bonus_obrona_cytadela_proc', vals.cytadela), ...mpVal('bonus_obrona_baszta_proc', vals.baszta), ...mpVal('bonus_obrona_palisada_proc', vals.palisada) };
  const built = i % 13 === 0 ? undefined : IDS.filter(() => rnd() < 0.5);
  const scene = { wallDefenseMult: 1, wallDefenseTotalProc: 0 };
  F.ctorWall.call(scene, miasto, { siege: built === undefined ? undefined : { builtBuildingIds: built } }, (b, p) => F.cityWall(b, p));
  hit(miasto === undefined ? 'ctor-brak-miasto-params' : 'ctor-miasto-params');
  // przy brakujacym miasto-params wszystkie wartosci sa domyslne
  const eff = miasto === undefined ? {} : vals;
  vCtor.push({
    built: built ?? null,
    vals: Object.fromEntries(Object.entries(eff).map(([k, v]) => [k, v === undefined ? null : enc(v)])),
    expect: { mult: enc(scene.wallDefenseMult), total: enc(scene.wallDefenseTotalProc) },
  });
}

// 3. defenderInsideFortification, fortificationDefenseBonusForUnit, _wallBonusProcFor
const COLS = [-1, 0, 1, 5, 6, 7, 8, 12, -0.5, NaN, Infinity, -Infinity];
const vInside = [];
const vFortBonus = [];
const vWallBonus = [];
for (let i = 0; i < 700; i++) {
  const side = pick(['atk', 'def', 'def', 'def']);
  const walk = pick([true, false, undefined]);
  const q = pick(COLS);
  const col = pick(COLS);
  const total = pick(NUMS);
  const ctx = { side, onWallWalkway: walk === true, q, siegeWallCol: col };
  const inside = F.inside(ctx);
  hit(side !== 'def' ? 'inside-atk' : walk === true ? 'inside-korona' : col >= 0 && q > col ? 'inside-za-murem' : 'inside-poza');
  vInside.push({ side, walk: walk === true, q: enc(q), col: enc(col), expect: inside });
  const bonus = F.fortBonus(ctx, total, F.inside);
  hit(inside ? (Number.isNaN(bonus) ? 'bonus-nan' : 'bonus-wewnatrz') : 'bonus-zero');
  vFortBonus.push({ side, walk: walk === true, q: enc(q), col: enc(col), total: enc(total), expect: enc(bonus) });
  const scene = { siegeWallCol: col, wallDefenseTotalProc: total };
  const u = { side, onWallWalkway: walk, q, r: 0 };
  const wb = F.wallBonusProcFor.call(scene, u, (c, t) => F.fortBonus(c, t, F.inside));
  vWallBonus.push({ side, walk: walk === undefined ? null : walk, q: enc(q), col: enc(col), total: enc(total), expect: enc(wb) });
}

// 4. hasMur, cityTerrMult, terrDefMult
const vHasMur = [];
const vCityTerr = [];
const vTerrDef = [];
for (const total of [...NUMS, 0.0001, 1, -1]) {
  const scene = { wallDefenseTotalProc: total };
  vHasMur.push({ total: enc(total), expect: F.hasMur.call(scene) });
  hit(total > 0 ? 'hasMur-true' : 'hasMur-false');
}
const MULT = [1, 1.5, 2, 0.5, 0, -1, 3, NaN, Infinity, -Infinity, 1.25];
for (let i = 0; i < 300; i++) {
  const isCity = rnd() < 0.6;
  const gated = pick(MULT);
  const scene = { isCityDefenseBattle: isCity };
  const ctm = F.cityTerrMult.call(scene, true, 'T', () => gated);
  hit(isCity ? 'cityTerr-miasto' : 'cityTerr-pole');
  vCityTerr.push({ isCity, gated: enc(gated), expect: enc(ctm) });
  const wallBonus = pick(NUMS);
  const field = pick(MULT);
  const sc2 = { isCityDefenseBattle: isCity, _wallBonusProcFor: () => wallBonus };
  const tdm = F.terrDefMult.call(sc2, { side: 'def' }, 'T', { rola: 'R' }, ctm, () => field);
  hit(isCity ? 'terrDef-miasto' : 'terrDef-pole');
  vTerrDef.push({ isCity, wallBonus: enc(wallBonus), cityTerr: enc(ctm), field: enc(field), expect: enc(tdm) });
}

// 5. fieldFortifyDefenseBonus
const vFortify = [];
for (let i = 0; i < 300; i++) {
  const base = pick(NUMS);
  const fort = rnd() < 0.5;
  const proc = pick(NUMS);
  const got = F.fortify(base, fort, proc);
  hit(fort ? 'fortify-tak' : 'fortify-nie');
  vFortify.push({ base: enc(base), fort, proc: enc(proc), expect: enc(got) });
}

const vectors = {
  source: `gra/src/battle/battleScene.ts + gra/src/game/city-defense.ts @ ${PIN}`,
  generator: 'rust-port/engine/tests/p6_siege_tactics_inputs_wall_gen.mjs (seed 5123, mulberry32; wykonanie fragmentow pinu)',
  fragments: Object.fromEntries(
    Object.entries(FRAGMENTS).map(([name, f]) => [name, f.ranges.map(([a, b]) => `${FILES[f.file]}:${a}-${b}`)]),
  ),
  fragmentSha256: fragmentDigest,
  branchCounts: cnt,
  cityWall: vCity,
  ctorWall: vCtor,
  inside: vInside,
  fortBonus: vFortBonus,
  wallBonusProcFor: vWallBonus,
  hasMur: vHasMur,
  cityTerrMult: vCityTerr,
  terrDefMult: vTerrDef,
  fortify: vFortify,
};
const outDir = join(here, 'p6_siege_tactics_inputs_wall_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(vectors, null, 1) + '\n');
const total = vCity.length + vCtor.length + vInside.length + vFortBonus.length + vWallBonus.length + vHasMur.length + vCityTerr.length + vTerrDef.length + vFortify.length;
console.log(`fragmentSha256=${fragmentDigest}`);
console.log(`przypadki=${total}`, JSON.stringify(cnt));
