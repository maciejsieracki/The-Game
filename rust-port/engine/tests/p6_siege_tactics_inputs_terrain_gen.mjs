// P6 SIEGE-TAKTYKA K5i-2a1 (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A1-Q1): generator wektorow funkcji terenowych
// WYKONUJACY tekst pinu (pin 07d2fbd72). Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_inputs_terrain_gen.mjs (Node 22)
// Wynik -> p6_siege_tactics_inputs_terrain_vectors/vectors.json oraz tabela NFD (stdout z flaga --table, patrz nizej)
// oraz tabela rang ccc (stdout z flaga --ccc; wyprowadzona z normalize('NFD'), bez zaleznosci od danych Unicode).
// Ziarno PRNG 2211 (mulberry32).
//
// Wykonywane zakresy linii pinu (1-based, wlacznie), po zdjeciu typow TS (module.stripTypeScriptTypes):
//   * gra/src/game/combat.ts:620-624 normTerrain, 632-637 parseDefenseBonusPct, 639-671 terrainDefenseMultiplier,
//     677-687 terrainRiverAttackMultiplier (UWAGA: w pinie plik jest w gra/src/game/, nie gra/src/battle/);
//   * gra/src/game/city-defense.ts:180-190 cityGatedTerrainMultiplier.
// `combatParamsRaw.river_attack_mult` (import JSON w pinie) jest stubem sterowanym wejsciem wektora.
// Straznik: SHA-256 fragmentow (zmiana pinu -> blad). Dane terenu realne: gra/data/terrain-combat.json z pinu.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const FILES = {
  combat: 'gra/src/game/combat.ts',
  cityDef: 'gra/src/game/city-defense.ts',
  terrain: 'gra/data/terrain-combat.json',
  params: 'gra/data/combat-params.json',
};
const RANGES = {
  normTerrain: ['combat', 620, 624],
  parseDefenseBonusPct: ['combat', 632, 637],
  terrainDefenseMultiplier: ['combat', 639, 671],
  terrainRiverAttackMultiplier: ['combat', 677, 687],
  cityGatedTerrainMultiplier: ['cityDef', 180, 190],
};
const FRAGMENT_SHA256 = '2ac3548a5b1b9a0fbe25ab368f6bb6063ca06761756c7f57288c934039b6e4f6';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitShow = (path) => execFileSync('git', ['show', `${PIN}:${path}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lines = { combat: gitShow(FILES.combat).split('\n'), cityDef: gitShow(FILES.cityDef).split('\n') };
const range = (k) => { const [f, a, b] = RANGES[k]; return lines[f].slice(a - 1, b).join('\n'); };

const starts = {
  normTerrain: 'export function normTerrain(s: string): string {',
  parseDefenseBonusPct: 'function parseDefenseBonusPct(',
  terrainDefenseMultiplier: 'export function terrainDefenseMultiplier(',
  terrainRiverAttackMultiplier: 'export function terrainRiverAttackMultiplier(',
  cityGatedTerrainMultiplier: 'export function cityGatedTerrainMultiplier(',
};
for (const k of Object.keys(RANGES)) {
  const t = range(k);
  if (!t.startsWith(starts[k])) throw new Error(`pin: poczatek ${k} nie w oczekiwanej linii`);
  if (!t.endsWith('\n}')) throw new Error(`pin: koniec ${k} nie jest zamknieciem funkcji`);
}
const digest = createHash('sha256')
  .update(Object.keys(RANGES).map((k) => `${k}\n${range(k)}`).join('\n---\n'))
  .digest('hex');
if (FRAGMENT_SHA256 !== 'PLACEHOLDER' && digest !== FRAGMENT_SHA256) throw new Error(`SHA-256 fragmentow pinu zmieniony: ${digest}`);
console.error(`fragment sha256 = ${digest}`);

const terrainRows = JSON.parse(gitShow(FILES.terrain));
const riverMultPin = JSON.parse(gitShow(FILES.params)).river_attack_mult;

const code = stripTypeScriptTypes(
  Object.keys(RANGES).map((k) => range(k).replace(/^export /gm, '')).join('\n\n'),
);
const stub = { combatParamsRaw: { river_attack_mult: riverMultPin } };
const fns = new Function('combatParamsRaw', `${code}\nreturn { normTerrain, parseDefenseBonusPct, terrainDefenseMultiplier, terrainRiverAttackMultiplier, cityGatedTerrainMultiplier };`)(stub.combatParamsRaw);
const setRiver = (v) => { stub.combatParamsRaw.river_attack_mult = v; };

// ---- tabela NFD (do wklejenia w module Rust): --table ----
if (process.argv.includes('--table')) {
  const out = [];
  for (let cp = 0; cp <= 0x10ffff; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    if (cp >= 0xac00 && cp <= 0xd7a3) continue; // Hangul: dekompozycja algorytmiczna w Rust
    const s = String.fromCodePoint(cp);
    const t = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (t !== s) out.push([cp, t]);
  }
  const esc = (t) => [...t].map((c) => `\\u{${c.codePointAt(0).toString(16)}}`).join('');
  const items = out.map(([cp, t]) => `(0x${cp.toString(16)}, "${esc(t)}")`);
  const rows = [];
  for (let i = 0; i < items.length; i += 6) rows.push('    ' + items.slice(i, i + 6).join(', ') + ',');
  process.stdout.write(rows.join('\n') + '\n');
  process.exit(0);
}

// ---- ranga klasy ccc (do wklejenia w module Rust): --ccc ----
// Node nie eksponuje ccc wprost. Wyprowadzamy porzadek ccc z zachowania normalize('NFD'):
//  * x jest znakiem niestartowym (ccc>0) <=> przestawia sie z sentinelem U+0345 (ccc 240) albo z U+0334 (ccc 1);
//  * dla niestartowych x,y: "a"+x+y -> "a"+y+x <=> ccc(x) > ccc(y) > 0.
// Ranga = numer klasy ccc w rosnacym porzadku (ta sama ccc => ta sama ranga). Tylko kolejnosc jest potrzebna.
// Dotyczy wylacznie punktow nierozkladalnych (NFD(x) === x); rozkladalne daja wyniki tabeli NFD.
const nfdOf = (s) => s.normalize('NFD');
const CCC_S240 = 'ͅ';
const CCC_S1 = '̴';
const cccSwapped = (x, y) => x !== y && nfdOf('a' + x + y) === 'a' + y + x;
const cccCmp = (x, y) => (cccSwapped(x, y) ? 1 : cccSwapped(y, x) ? -1 : 0);
// Niestartowe (ccc>0) punkty nierozkladalne, posortowane wg ccc; rank = numer klasy ccc.
function cccRanking() {
  const nonStarters = [];
  for (let cp = 0; cp <= 0x10ffff; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    const s = String.fromCodePoint(cp);
    if (nfdOf(s) !== s) continue;
    if (nfdOf('a' + CCC_S240 + s) === 'a' + s + CCC_S240 || nfdOf('a' + s + CCC_S1) === 'a' + CCC_S1 + s) nonStarters.push(s);
  }
  nonStarters.sort(cccCmp);
  const rank = new Map();
  let r = 0;
  let prev = null;
  for (const s of nonStarters) {
    if (prev === null || cccCmp(prev, s) !== 0) r++;
    rank.set(s, r);
    prev = s;
  }
  return { rank, classes: r };
}

if (process.argv.includes('--ccc')) {
  const { rank, classes: r } = cccRanking();
  if (r > 255) throw new Error(`ranga ccc > 255: ${r}`);
  const items = [...rank.entries()]
    .map(([s, k]) => [s.codePointAt(0), k])
    .sort((a, b) => a[0] - b[0])
    .map(([cp, k]) => `(0x${cp.toString(16)}, ${k})`);
  const rows = [];
  for (let i = 0; i < items.length; i += 8) rows.push('    ' + items.slice(i, i + 8).join(', ') + ',');
  process.stdout.write(rows.join('\n') + '\n');
  console.error(`ccc: punktow=${items.length} klas=${r}`);
  process.exit(0);
}

// ---- PRNG ----
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
const rnd = mulberry32(2211);
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const numS = (x) => (Object.is(x, -0) ? '-0' : String(x));
const opt = (v) => (v === undefined ? null : v);

// ---- fragmenty tekstu do losowania ----
const TERRAIN_WORDS = [
  'Las', 'las', 'LAS', 'Lasy', 'Wzgórza', 'Wzgorza', 'WZGÓRZA', 'Wzgórze', 'wzg', 'Góry', 'Gory', 'góry', 'gor', 'Rzeka', 'rzeka', 'RZEKA',
  'Rzeki', 'rzek', 'river', 'River', 'Płaskie', 'Plaskie', 'płaskie', 'Pustynia', 'Wybrzeże', 'Morze', 'Brod', 'brod', 'Bagno',
  'Łąki', 'łąka', 'Źródło', 'Żółć', 'Ćma', 'Ęą', 'Ñandú', 'Çedilla', 'Ångström', 'İstanbul', 'ΣΊΣΥΦΟΣ', 'Οδυσσεύς', 'Москва', 'Ёлка',
  '(równina/łąka)', '/', '-', '---', '', ' ', '  ', '1', '0', '+50%', 'Wybrzeże / Morze', 'Płaskie (równina/łąka)',
  'á', 'ệ', '̀', 'xͅ', 'ǅ', 'ﬁ', 'Ⅻ', '한글', '가', '각', '漢字', '😀', 'ẞ', 'ß', 'ı', 'K', 'Å', 'ẛ̣',
];
const BONUSES = [
  undefined, '', '+0%', '---', '+50%', '+75%', '-25%', '+25%', '50', '-10', '+10', '0', '+5%', '1000%', '+-5', '++5', '--5', '5%', '12abc34',
  'abc', 'x-7y', '+', '-', ' +10%', '٥', '５０', '+５', '1e3', '3.9', '-.5', '+0', '-0', '+00%', '+007', '٣', 'bonus +33% obrony',
  '9'.repeat(400), '-' + '9'.repeat(400), '+a5', '-+5', '5-', '+0%x', '+ 0%', '\n+5',
];
const ROLES = ['Dystans', 'dystans', 'Dystansowy', 'Flanka', 'FLANKA', 'flanka', 'Piechota', 'Kawaleria', 'Tarcza', '', 'DYSTANS', 'Dystanśowy', 'Flanką', 'Żołnierz', 'Obrońca'];

const randomString = () => {
  const n = int(0, 3);
  let s = '';
  for (let i = 0; i < n; i++) s += pick(TERRAIN_WORDS) + (rnd() < 0.3 ? ' ' : '');
  return s;
};
const randBonus = () => (rnd() < 0.7 ? pick(BONUSES) : pick(['+', '-', ''])) ;

// ---- wektory normTerrain ----
const normCases = [];
const normSeen = new Set();
const addNorm = (s) => {
  if (normSeen.has(s)) return;
  normSeen.add(s);
  normCases.push({ s, out: fns.normTerrain(s) });
};
TERRAIN_WORDS.forEach(addNorm);
terrainRows.forEach((r) => addNorm(r.Teren));
for (let i = 0; i < 300; i++) addNorm(randomString());
// Rozne znaki Unicode (BMP i poza): losowe kody bez surogatow.
for (let i = 0; i < 400; i++) {
  let cp = int(0xa0, rnd() < 0.8 ? 0x2fff : 0x1ffff);
  if (cp >= 0xd800 && cp <= 0xdfff) cp = 0x41;
  addNorm(String.fromCodePoint(cp) + (rnd() < 0.5 ? String.fromCodePoint(int(0x300, 0x36f)) : ''));
}
// Skrot FNV-1a 64 wyniku normTerrain po WSZYSTKICH punktach kodowych (bez surogatow): dowodzi tabeli NFD + lowercase.
function fnv64(strs) {
  let h = 0xcbf29ce484222325n;
  const enc = new TextEncoder();
  for (const s of strs) {
    for (const b of enc.encode(s)) { h ^= BigInt(b); h = (h * 0x100000001b3n) & 0xffffffffffffffffn; }
    h ^= 0x0an; h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, '0');
}
const allOut = [];
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  allOut.push(fns.normTerrain(String.fromCodePoint(cp)));
}
const normAllFnv = fnv64(allOut);

// ---- wektory parseDefenseBonusPct ----
const bonusCases = [];
const bonusSeen = new Set();
const addBonus = (b) => {
  const key = b === undefined ? '\u0000undef' : `s:${b}`;
  if (bonusSeen.has(key)) return;
  bonusSeen.add(key);
  const r = fns.parseDefenseBonusPct(b);
  bonusCases.push({ b: opt(b), out: r === null ? null : numS(r) });
};
BONUSES.forEach(addBonus);
terrainRows.forEach((r) => addBonus(r['Bonus Obrona']));
for (let i = 0; i < 300; i++) {
  const sign = pick(['', '+', '-', '', '+']);
  const prefix = pick(['', '', 'x', ' ', 'bonus ', '+-', 'a-']);
  addBonus(`${prefix}${sign}${int(0, 300)}${pick(['', '%', '%x', 'a', ' %'])}`);
}

// ---- dane terenu ----
const rowOf = (teren, bonus) => ({ Teren: teren, 'Bonus Obrona': bonus });
const realData = terrainRows.map((r) => rowOf(r.Teren, r['Bonus Obrona']));
function randTerrainData() {
  const k = rnd();
  if (k < 0.12) return [];
  if (k < 0.4) return realData;
  if (k < 0.55) return realData.slice(0, int(1, realData.length));
  const n = int(1, 5);
  const d = [];
  for (let i = 0; i < n; i++) d.push(rowOf(rnd() < 0.5 ? pick(TERRAIN_WORDS) : randomString(), randBonus()));
  return d;
}
const dataVec = (d) => d.map((r) => ({ t: r.Teren, b: opt(r['Bonus Obrona']) }));

// Etykiety galezi (niezalezne od wykonania pinu; liczone z wejsc, uzywane do liczenia pokrycia).
function defBranch(terr, role, data) {
  if (!terr || data.length === 0) return 'def_early';
  const tn = fns.normTerrain(terr);
  const entry = data.find((t) => { const n = fns.normTerrain(t.Teren); return n.includes(tn) || tn.includes(n.split(' ')[0] ?? ''); });
  if (!entry) return 'def_no_entry';
  const e = fns.normTerrain(entry.Teren);
  if (e.includes('las')) {
    const a = fns.normTerrain(role);
    return a.includes('dystans') || a.includes('flanka') ? 'def_las_bonus' : 'def_las_plain';
  }
  return fns.parseDefenseBonusPct(entry['Bonus Obrona']) !== null ? 'def_pct' : 'def_pct_null';
}
function riverBranch(terr, data) {
  if (!terr || data.length === 0) return 'river_early';
  const tn = fns.normTerrain(terr);
  if (!(tn.includes('rzek') || tn.includes('river'))) return 'river_not';
  return data.find((t) => fns.normTerrain(t.Teren).includes('rzek')) ? 'river_hit' : 'river_no_row';
}
function cityBranch(hasMur, terr) {
  if (!hasMur) return 'city_no_wall';
  const tn = fns.normTerrain(terr);
  return tn.includes('wzg') || tn.includes('gor') ? 'city_elev' : 'city_flat';
}

const defCases = [];
const riverCases = [];
const cityCases = [];
const counts = {};
const bump = (k) => { counts[k] = (counts[k] ?? 0) + 1; };

const SPECIAL = [NaN, Infinity, -Infinity, 0, -0, 1, 0.75, 0.5, 2, -1, 1e308];
for (let i = 0; i < 700; i++) {
  const data = randTerrainData();
  let terr = rnd() < 0.55 ? pick(TERRAIN_WORDS) : randomString();
  if (rnd() < 0.25 && data.length > 0) terr = pick(data).Teren; // trafienie wprost
  if (rnd() < 0.1 && data.length > 0) terr = pick(data).Teren.toUpperCase();
  if (rnd() < 0.08) terr = pick(realData).Teren.normalize('NFD');
  const role = pick(ROLES);
  const dv = dataVec(data);
  const r1 = fns.terrainDefenseMultiplier(terr, role, data);
  const b1 = defBranch(terr, role, data);
  bump(b1);
  defCases.push({ terr, role, data: dv, out: numS(r1), br: b1 });

  const riv = rnd() < 0.15 ? pick(SPECIAL) : riverMultPin;
  setRiver(riv);
  const rt = rnd() < 0.5 ? pick(['Rzeka', 'rzeka', 'RZEKA', 'Rzeki', 'river', 'River', 'Wybrzeże rzeczne', 'Brod rzeczny']) : terr;
  const rd = rnd() < 0.5 ? data : realData;
  const r2 = fns.terrainRiverAttackMultiplier(rt, rd);
  const b2 = riverBranch(rt, rd);
  bump(b2);
  riverCases.push({ terr: rt, data: dataVec(rd), riverMult: numS(riv), out: numS(r2), br: b2 });
  setRiver(riverMultPin);

  const hasMur = rnd() < 0.7;
  const ct = rnd() < 0.5 ? pick(['Wzgórza', 'Wzgorza', 'Góry', 'Gory', 'wzg', 'gor', 'Las', 'Rzeka', 'Płaskie', 'Pustynia', 'WZGÓRZA', 'GÓRY', 'Ogórek', 'Wzgórze', '', 'Wybrzeże / Morze']) : terr;
  const cd = rnd() < 0.5 ? realData : data;
  const r3 = fns.cityGatedTerrainMultiplier(hasMur, ct, cd);
  const b3 = cityBranch(hasMur, ct);
  bump(b3);
  cityCases.push({ hasMur, terr: ct, data: dataVec(cd), out: numS(r3), br: b3 });
}

for (const k of ['def_early', 'def_no_entry', 'def_las_bonus', 'def_las_plain', 'def_pct', 'def_pct_null', 'river_early', 'river_not', 'river_hit', 'river_no_row', 'city_no_wall', 'city_elev', 'city_flat']) {
  if (!counts[k]) throw new Error(`brak pokrycia galezi ${k}`);
}
console.error('pokrycie galezi:', JSON.stringify(counts));

// ---- kolejnosc ccc (K-NFD-CCC): wszystkie pary niestartowych + sekwencje mieszane ----
// Pary: "a"+x+y dla KAZDEJ pary (x,y) z listy niestartowych (ccc>0) — hash wyjsc normTerrain (kolejnosc x,y jak nizej).
// Sekwencje: losowe ciagi znakow bazowych i znakow laczacych w roznej kolejnosci (PRNG dopisany NA KONCU, bez zmiany wczesniejszych wektorow).
const cccRanked = cccRanking();
const cccCps = [...cccRanked.rank.keys()].map((s) => s.codePointAt(0)).sort((a, b) => a - b);
const cccStr = cccCps.map((cp) => String.fromCodePoint(cp));
const pairOuts = [];
for (const x of cccStr) for (const y of cccStr) pairOuts.push(fns.normTerrain('a' + x + y));
const cccPairFnv = fnv64(pairOuts);
const BASES = ['a', 'ą', 'ó', 'ł', 'L', 'e', 'o', 'གཱི', 'ཀ', 'ཱ', 'כ', 'ب', '가', 'ß', 'Ж', 'x'];
const seq = [];
const seqSeen = new Set();
while (seq.length < 2200) {
  const base = pick(BASES);
  const n = int(1, 6);
  let s = base;
  for (let i = 0; i < n; i++) {
    const cp = rnd() < 0.2 ? pick(BASES) : pick(cccStr);
    s += cp;
  }
  if (rnd() < 0.3) s += pick(BASES) + pick(cccStr) + pick(cccStr);
  if (seqSeen.has(s)) continue;
  seqSeen.add(s);
  seq.push({ s, out: fns.normTerrain(s) });
}
console.error(`ccc: punktow=${cccStr.length} pary=${pairOuts.length} seq=${seq.length}`);

const out = {
  pin: PIN,
  fragmentSha256: digest,
  ranges: RANGES,
  note: 'Wektory generowane wykonaniem tekstu pinu (combat.ts, city-defense.ts); combatParamsRaw.river_attack_mult = wejscie wektora.',
  normAllFnv,
  normAllCount: allOut.length,
  cccCps,
  cccPairCount: pairOuts.length,
  cccPairFnv,
  seq,
  counts,
  norm: normCases,
  bonus: bonusCases,
  def: defCases,
  river: riverCases,
  city: cityCases,
};
const dir = join(here, 'p6_siege_tactics_inputs_terrain_vectors');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'vectors.json'), JSON.stringify(out, null, 1) + '\n');
console.error(`normCases=${normCases.length} bonus=${bonusCases.length} def=${defCases.length} river=${riverCases.length} city=${cityCases.length}`);
