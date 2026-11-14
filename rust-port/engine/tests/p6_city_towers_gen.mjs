// R-RUSTPORT-P6-WIEZE-CITYTOWERS-Q1 (etap 2A): generator wektorow z TEKSTU pinu 07d2fbd72
// (`gra/src/game/city-towers.ts`). Wykonuje (transpilacja TypeScript przez `typescript` z Node) dokladny
// plik pinu; nie uzywa zadnej reimplementacji. Wiersze jednostek sa SYNTETYCZNE (nie czyta units.json).
//
// Przygotowanie wejscia:
//   git show 07d2fbd72:gra/src/game/city-towers.ts > <katalog-tymczasowy>/city-towers.ts
// Uzycie:
//   node p6_city_towers_gen.mjs <sciezka-do-city-towers.ts> <katalog-wyjsciowy> [sciezka-do-typescript.js]
//   (albo zmienna TYPESCRIPT_JS zamiast trzeciego argumentu)
// STRAZNIK: SHA-256 pliku pinu musi byc rowny WANT_SHA256, inaczej generator konczy sie bledem (exit 3).
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , pinFile, outDir, tsArg] = process.argv;
const tsPath = tsArg ?? process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
if (!pinFile || !outDir) {
  console.error('uzycie: node p6_city_towers_gen.mjs <city-towers.ts> <outDir> [typescript.js]');
  process.exit(2);
}

const WANT_SHA256 = 'cc715ed61f65cb0b11fe38efe80e6c6a1742feefec2c0bb5e6ce142a4da8cbd4';
const PIN_COMMIT = '07d2fbd72';
const srcBuf = readFileSync(pinFile);
const gotSha = createHash('sha256').update(srcBuf).digest('hex');
if (gotSha !== WANT_SHA256) {
  console.error(`STRAZNIK SHA-256: city-towers.ts: ${gotSha} != ${WANT_SHA256}`);
  process.exit(3);
}

const require = createRequire(import.meta.url);
const ts = require(tsPath);
const js = ts.transpileModule(srcBuf.toString('utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
// Atrapy-eksporty wylacznie dla funkcji/tablicy niewyeksportowanych w pinie (availableIn, nationOk, CIV_TO_NACJA).
const shim = `${js}\nexports.__availableIn = availableIn;\nexports.__nationOk = nationOk;\nexports.__CIV = CIV_TO_NACJA;\n`;
const mod = { exports: {} };
new Function('exports', 'require', 'module', shim)(mod.exports, require, mod);
const P = mod.exports;

// Deterministyczny PRNG (mulberry32) -- wektory musza byc powtarzalne.
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
const rnd = mulberry32(0x5eed2a);
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1)); // calkowite z [lo, hi]
const pick = arr => arr[Math.floor(rnd() * arr.length)];

const ERAS = ['Kamień', 'Brąz', 'Żelazo'];
const NAT = ['', '—', 'Egipt', 'Sumer', 'Inkowie', 'Zulu', 'Asyria', 'Rzym'];
const CIVS = [null, 'egipt', 'sumer', 'inka', 'zulu', 'asyria', 'rzym', 'brak'];
const ROLES = ['Dystans', 'Dystans', 'Dystans', 'Machina', 'Piechota', 'Jazda'];

function randEpochs() {
  const r = rnd();
  if (r < 0.1) return '';
  const set = ERAS.filter(() => rnd() < 0.6);
  const chosen = set.length ? set : [pick(ERAS)];
  return chosen.join(rnd() < 0.5 ? '; ' : ';');
}

// Wiersz jednostki: kolumny pod nazwami z pinu. Pola opcjonalne (brak / null) celowo, zeby testowac fallbacki.
function randUnit(i) {
  const u = { 'Nazwa': `Jednostka-${i}`, 'Rola (linia)': pick(ROLES) };
  const mr = rnd();
  const power = ri(0, 6);
  if (mr < 0.6) u['missileAttack'] = power;
  else if (mr < 0.75) u['missileAttack'] = null;
  // mr >= 0.75: brak kolumny missileAttack (fallback na Atak dystansowy)
  if (rnd() < 0.8) u['Atak dystansowy'] = ri(0, 6);
  const rr = rnd();
  if (rr < 0.7) u['Zasięg ataku (hex)'] = ri(0, 4);
  else if (rr < 0.8) u['Zasieg ataku (hex)'] = pick([1, 2, 3]);
  else if (rr < 0.85) u['Zasięg ataku (hex)'] = 2.5;
  const ep = rnd();
  if (ep < 0.7) u['Dostępna w epokach'] = randEpochs();
  else if (ep < 0.85) u['Epoka'] = randEpochs();
  else u['Dostępna w epokach'] = '';
  if (rnd() < 0.2) u['Epoka'] = randEpochs();
  if (rnd() < 0.6) u['Nacja'] = pick(NAT);
  return u;
}

const nacjaOf = civ => (civ ? (P.__CIV[civ] ?? null) : null);
const clampEra = era => Math.max(1, Math.min(3, Math.round(era)));

// ---- Kategorie pokrycia (wyliczane z wejsc i wyniku pinu, nie z kodu Rust) ----
function tagsStrongest(units, era, civ, res) {
  const tags = [];
  const eName = P.eraName(clampEra(era));
  if (res === null) tags.push('none');
  else tags.push(P.__availableIn(res, eName) ? 'era_direct' : 'era_fallback');
  if (res && typeof res['Nacja'] === 'string' && res['Nacja'].trim() !== '' && res['Nacja'].trim() !== '—') tags.push('national_hit');
  const nac = nacjaOf(civ);
  const nationalOther = units.some(u =>
    P.missilePower(u) > 0 && u['Rola (linia)'] === 'Dystans' &&
    typeof u['Nacja'] === 'string' && u['Nacja'].trim() !== '' && u['Nacja'].trim() !== '—' && !P.__nationOk(u, nac));
  if (nationalOther) tags.push('national_excluded');
  const inEra = units.filter(u => u['Rola (linia)'] === 'Dystans' && P.missilePower(u) > 0 &&
    P.__nationOk(u, nac) && P.__availableIn(u, eName));
  if (inEra.length >= 2) {
    const top = Math.max(...inEra.map(P.missilePower));
    if (inEra.filter(u => P.missilePower(u) === top).length >= 2) tags.push('tie_power');
  }
  if (units.some(u => u['missileAttack'] == null && u['Atak dystansowy'] != null)) tags.push('atak_fallback');
  if (units.some(u => (u['Dostępna w epokach'] ?? '') === '' && u['Epoka'] !== undefined)) tags.push('epoka_fallback');
  if (!Number.isInteger(era)) tags.push('era_round');
  if (era < 1 || era > 3) tags.push('era_clamp');
  return tags;
}

const cases = { towerRows: [], strongestRangedUnitForEra: [], towerRangeFor: [], missilePower: [], unitReach: [], eraName: [], towerMaterialFor: [] };

// 1. towerRows (w tym brama, spacing, krotki mur, rowLo > rowHi).
for (let i = 0; i < 260; i++) {
  const rowLo = ri(0, 6);
  const rowHi = rnd() < 0.05 ? rowLo - ri(1, 3) : rowLo + ri(0, 30);
  const gateRowLo = ri(rowLo - 2, rowHi + 2);
  const gateRowHi = gateRowLo + ri(0, 4);
  const sp = rnd();
  const input = { rowLo, rowHi, gateRowLo, gateRowHi };
  if (sp < 0.5) { /* domyslny odstep */ } else input.spacing = pick([0, -1, 1, 2, 3, 4, 5, 7]);
  const expected = P.towerRows(input);
  const tags = [];
  if (expected.length > 0) tags.push('nonempty');
  else tags.push('empty');
  const plain = { ...input, gateRowLo: 1e9, gateRowHi: 1e9 + 1 };
  if (P.towerRows(plain).length !== expected.length) tags.push('gate_skip');
  if (rowHi - rowLo < 2) tags.push('short_wall');
  if (input.spacing === undefined) tags.push('spacing_default');
  else if (input.spacing <= 0) tags.push('spacing_clamped');
  else tags.push('spacing_custom');
  cases.towerRows.push({ id: `TR-${i}`, input, expected, tags });
}
// Przypadki graniczne jawnie (brama obejmuje pierwsza wiezyczke; pusty zakres).
cases.towerRows.push({ id: 'TR-edge-gate-first', input: { rowLo: 0, rowHi: 10, gateRowLo: 2, gateRowHi: 2 }, expected: P.towerRows({ rowLo: 0, rowHi: 10, gateRowLo: 2, gateRowHi: 2 }), tags: ['nonempty', 'gate_skip', 'spacing_default'] });
cases.towerRows.push({ id: 'TR-edge-zero-width', input: { rowLo: 3, rowHi: 3, gateRowLo: 0, gateRowHi: 0 }, expected: P.towerRows({ rowLo: 3, rowHi: 3, gateRowLo: 0, gateRowHi: 0 }), tags: ['nonempty', 'short_wall', 'spacing_default'] });

// 2. strongestRangedUnitForEra (era, civ, remis, fallback epok, narodowe).
for (let i = 0; i < 480; i++) {
  const n = ri(0, 14);
  const units = Array.from({ length: n }, (_, k) => randUnit(k));
  const era = rnd() < 0.08 ? pick([0, 0.4, 3.6, 4, -1, 1e9]) : pick([1, 2, 3, 1.5, 2.5, 2.4]);
  const civ = pick(CIVS);
  const res = P.strongestRangedUnitForEra(units, era, civ);
  const expectIndex = res === null ? null : units.indexOf(res);
  cases.strongestRangedUnitForEra.push({ id: `SR-${i}`, units, era, civ, expectIndex, tags: tagsStrongest(units, era, civ, res) });
}
// Przypadki jawne: remis mocy -> zasieg; pelny remis -> kolejnosc w danych; cofanie sie z Zelaza na Brąz.
const fixed = [
  { id: 'SR-fix-remis-zasieg', era: 1, civ: null, units: [
    { 'Nazwa': 'a', 'Rola (linia)': 'Dystans', missileAttack: 3, 'Zasięg ataku (hex)': 2, 'Epoka': 'Kamień' },
    { 'Nazwa': 'b', 'Rola (linia)': 'Dystans', missileAttack: 3, 'Zasięg ataku (hex)': 4, 'Epoka': 'Kamień' }] },
  { id: 'SR-fix-remis-kolejnosc', era: 1, civ: null, units: [
    { 'Nazwa': 'a', 'Rola (linia)': 'Dystans', missileAttack: 3, 'Zasięg ataku (hex)': 2, 'Epoka': 'Kamień' },
    { 'Nazwa': 'b', 'Rola (linia)': 'Dystans', missileAttack: 3, 'Zasięg ataku (hex)': 2, 'Epoka': 'Kamień' }] },
  { id: 'SR-fix-cofanie-zelazo', era: 3, civ: 'egipt', units: [
    { 'Nazwa': 'luk-brąz', 'Rola (linia)': 'Dystans', missileAttack: 2, 'Zasięg ataku (hex)': 3, 'Dostępna w epokach': 'Brąz; Żelazo' },
    { 'Nazwa': 'proca-kamień', 'Rola (linia)': 'Dystans', missileAttack: 1, 'Zasięg ataku (hex)': 2, 'Dostępna w epokach': 'Kamień' },
    { 'Nazwa': 'narodowy-egipt-brąz', 'Rola (linia)': 'Dystans', missileAttack: 5, 'Zasięg ataku (hex)': 4, 'Dostępna w epokach': 'Brąz', 'Nacja': 'Egipt' }] },
  { id: 'SR-fix-narodowy-obcy', era: 2, civ: 'sumer', units: [
    { 'Nazwa': 'narodowy-egipt', 'Rola (linia)': 'Dystans', missileAttack: 9, 'Zasięg ataku (hex)': 4, 'Dostępna w epokach': 'Brąz', 'Nacja': 'Egipt' },
    { 'Nazwa': 'ogolny', 'Rola (linia)': 'Dystans', missileAttack: 2, 'Zasięg ataku (hex)': 1, 'Dostępna w epokach': 'Brąz', 'Nacja': '—' }] },
  { id: 'SR-fix-atak-fallback', era: 1, civ: null, units: [
    { 'Nazwa': 'atak', 'Rola (linia)': 'Dystans', 'Atak dystansowy': 4, 'Zasięg ataku (hex)': 2, 'Epoka': 'Kamień' },
    { 'Nazwa': 'zero-mattack', 'Rola (linia)': 'Dystans', missileAttack: 0, 'Atak dystansowy': 7, 'Zasięg ataku (hex)': 2, 'Epoka': 'Kamień' }] },
  { id: 'SR-fix-brak', era: 2, civ: null, units: [
    { 'Nazwa': 'machina', 'Rola (linia)': 'Machina', missileAttack: 9, 'Zasięg ataku (hex)': 2, 'Epoka': 'Brąz' }] },
];
for (const f of fixed) {
  const res = P.strongestRangedUnitForEra(f.units, f.era, f.civ);
  const expectIndex = res === null ? null : f.units.indexOf(res);
  cases.strongestRangedUnitForEra.push({ id: f.id, units: f.units, era: f.era, civ: f.civ, expectIndex, tags: tagsStrongest(f.units, f.era, f.civ, res) });
}

// 3. towerRangeFor (jednostka / brak, minRange domyslny i jawny, zaokraglenie).
for (let i = 0; i < 120; i++) {
  const unit = rnd() < 0.2 ? null : { 'Zasięg ataku (hex)': pick([0, 1, 2, 3, 4, 5, 2.5, 1.5]) };
  const minRange = rnd() < 0.5 ? null : pick([0, 1, 2, 3]);
  const expected = minRange === null ? P.towerRangeFor(unit) : P.towerRangeFor(unit, minRange);
  const tags = [];
  if (unit === null) tags.push('no_unit');
  else {
    const reach = Math.round(unit['Zasięg ataku (hex)']);
    const m = minRange === null ? 2 : minRange;
    if (reach < m) tags.push('below_min'); else tags.push('above_min');
    if (!Number.isInteger(unit['Zasięg ataku (hex)'])) tags.push('fractional');
  }
  cases.towerRangeFor.push({ id: `TF-${i}`, unit, minRange, expected, tags });
}

// 4. missilePower / unitReach (fallbacki kolumn).
for (let i = 0; i < 80; i++) {
  const u = randUnit(i);
  cases.missilePower.push({ id: `MP-${i}`, unit: u, expected: P.missilePower(u) });
  cases.unitReach.push({ id: `UR-${i}`, unit: u, expected: P.unitReach(u) });
}

// 5. eraName (zaokraglenie i obciecie).
for (const e of [0, 0.4, 0.5, 1, 1.4, 1.5, 2, 2.5, 3, 3.5, 4, -1, 1e9]) {
  cases.eraName.push({ id: `EN-${e}`, era: e, expected: P.eraName(e) });
}

// 6. towerMaterialFor (wejscie: rodzaj obwarowania jako tekst z pinu).
for (const k of ['palisada', 'mur', 'brama', 'inne']) {
  cases.towerMaterialFor.push({ id: `TM-${k}`, kind: k, expected: P.towerMaterialFor(k) });
}

// Liczniki kategorii (z wektorow).
const counts = {};
for (const list of [cases.towerRows, cases.strongestRangedUnitForEra, cases.towerRangeFor]) {
  for (const c of list) for (const t of c.tags) counts[t] = (counts[t] ?? 0) + 1;
}

const meta = {
  pin: { commit: PIN_COMMIT, file: 'gra/src/game/city-towers.ts', sha256: WANT_SHA256 },
  generator: 'p6_city_towers_gen.mjs',
  seed: '0x5eed2a',
  counts,
  total: Object.values(cases).reduce((a, l) => a + l.length, 0),
  note: 'Wiersze jednostek syntetyczne; wektory z wykonania tekstu pinu w node (transpilacja TS).',
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify({ meta, cases }, null, 1) + '\n', 'utf8');
console.log(JSON.stringify({ total: meta.total, counts }));
