// P6.8H partia A (R-RUSTPORT-P6-8H-DOSTEP-ZASOBOW-Q1): wektory z URUCHOMIONEGO weba 91dc998a.
// Prawdziwy kod TS z `git archive 91dc998a gra/src gra/data` (bez builda `gra/`), ladowany
// loaderem repin-b-loader-register.mjs (dopisuje .ts / index.ts, JSON jako modul).
// Funkcje: zloto-access.ts, cyna-access.ts, zelazo-access.ts, society-inputs.ts (eksportowane).
// Kodowanie: skonczona liczba -> number; NaN/Infinity/-Infinity -> napis; undefined -> null;
//   Map placedImprovements -> tablica par [klucz, wartosc] (kolejnosc wstawiania, jak JS).
//   Wejscie empireStock typu boolean (legacy) -> {"bool": true}.
// Uruchomienie (katalog z loaderem jako CWD, Node 22):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-p6-8h-access-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIA>
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
mkdirSync(outDir, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;
const PIN = '91dc998a5f1b51ad29e0f4785edfd45655445c53';

const Z = await import(src('game/zloto-access.ts'));
const C = await import(src('game/cyna-access.ts'));
const L = await import(src('game/zelazo-access.ts'));
const S = await import(src('game/society-inputs.ts'));

const enc = (x) => {
  if (x === undefined) return null;
  if (typeof x === 'number' && !Number.isFinite(x)) return String(x);
  if (Array.isArray(x)) return x.map(enc);
  if (x && typeof x === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(x)) o[k] = enc(v);
    return o;
  }
  return x;
};

// wejscie: JSON -> JS (placed jako tablica par -> Map; null -> null)
const toMap = (pairs) => (pairs === null ? null : new Map(pairs.map(([k, v]) => [k, v])));
const toHexes = (h) => (h === null ? null : h);
// stock: null -> null; {bool:x} -> boolean (legacy); obiekt -> Record
const toStock = (s) => {
  if (s === null) return null;
  if (typeof s === 'object' && 'bool' in s) return s.bool;
  return s;
};
const decNum = (v) => (v === 'NaN' ? NaN : v === 'Infinity' ? Infinity : v === '-Infinity' ? -Infinity : v);

// ---- przypadki placedImprovements --------------------------------------------------------
const PLACED = {
  pusty: [],
  zlotoJeden: [['1,0', 'kopalnia_zlota']],
  zlotoTablica: [['1,0', ['kopalnia_zlota', 'tartak']], ['2,0', ['kopalnia_zlota']]],
  zlotoDwa: [['0,0', 'kopalnia_zlota'], ['0,1', 'kopalnia_zlota']],
  cynaNaZlozu: [['0,0', 'kopalnia_cyny']],
  cynaTablica: [['0,0', ['tartak', 'kopalnia_cyny']]],
  cynaNieZlozu: [['0,0', 'kopalnia_cyny'], ['1,0', 'tartak']],
  cynaSpacja: [['0,0', ' kopalnia_cyny ']],
  cynaWielkie: [['0,0', 'Kopalnia_Cyny']],
  zelazoNaZlozu: [['0,0', 'kopalnia_zelaza']],
  zelazoLegacyStr: [['0,0', 'kopalnia']],
  zelazoLegacyTab: [['0,0', ['kopalnia', 'tartak']]],
  legacyNaMiedzi: [['0,0', 'kopalnia']],
  kopalniaZelazaNaCynie: [['0,0', 'kopalnia_zelaza']],
  brak: [['0,0', 'brak'], ['1,0', '']],
  nieznane: [['0,0', 'foo'], ['1,0', ['bar', 'constructor']]],
  pastwisko: [['0,0', 'pastwisko'], ['1,0', 'bydlo']],
  zlotoNaBrak: [['5,5', 'kopalnia_zlota']],
  zlotoWTablicyDuzaLista: [['0,0', ['kopalnia_zlota', 'kopalnia_zlota', 'kopalnia_zlota']]],
  // R2 (zarzut Evaluatora 1): znaki biale, w ktorych JS trim i Rust trim sie roznia
  // (U+FEFF: JS usuwa, Rust nie; U+0085: Rust usuwa, JS nie).
  trimPlaced: [['0,0', 'kopalnia_cyny'], ['1,0', 'kopalnia_zelaza'], ['2,0', 'kopalnia_cyny'], ['3,0', 'kopalnia_zelaza'], ['4,0', 'kopalnia_cyny']],
};

const HEXES = {
  zloczaCyna: { '0,0': { zloze: 'cyna' }, '1,0': { zloze: 'cyna' }, '2,0': { zloze: 'miedz' }, '5,5': { zloze: 'cyna' } },
  zloczaZelazo: { '0,0': { zloze: 'zelazo' }, '1,0': { zloze: 'zelazo' } },
  spacjeICase: { '0,0': { zloze: ' CYNA ' }, '1,0': { zloze: 'Zelazo\t' }, '2,0': { zloze: '' } },
  bezZlozy: { '0,0': {}, '1,0': { zloze: undefined } },
  pusteHexy: {},
  // R2: U+FEFF (JS trim tak, Rust nie), U+0085 (Rust trim tak, JS nie), NBSP/LS (oba tak).
  trimZlozy: {
    '0,0': { zloze: '﻿cyna' },
    '1,0': { zloze: '\u0085cyna' },
    '2,0': { zloze: 'cyna\u0085' },
    '3,0': { zloze: '\u0085zelazo' },
    '4,0': { zloze: '﻿ cyna ' },
  },
};

// ---- wyniki: zloto ----------------------------------------------------------------------
const STOCKS = {
  brak: null,
  pusty: {},
  zloto1: { zloto: 1 },
  zloto05: { zloto: 0.5 },
  zloto0: { zloto: 0 },
  zloto2: { zloto: 2 },
  zlotoMinus: { zloto: -3 },
  zlotoNaN: { zloto: 'NaN' },
  zlotoInf: { zloto: 'Infinity' },
  zlotoMinusInf: { zloto: '-Infinity' },
  zlotoBrakKlucza: { zelazo: 5, ruda_cyny: 4 },
  zloto1000: { zloto: 1000, zelazo: 7 },
  cynaZero: { ruda_cyny: 0 },
  cynaUlamek: { ruda_cyny: 0.5 },
  cynaJeden: { ruda_cyny: 1 },
  cynaNaN: { ruda_cyny: 'NaN' },
  cynaInf: { ruda_cyny: 'Infinity' },
  cynaMinus: { ruda_cyny: -1 },
  zelazoZero: { zelazo: 0 },
  zelazoUlamek: { zelazo: 0.5 },
  zelazoJeden: { zelazo: 1 },
  zelazoNaN: { zelazo: 'NaN' },
};
const stockJs = (s) => {
  if (s === null) return null;
  const o = {};
  for (const [k, v] of Object.entries(s)) o[k] = decNum(v);
  return o;
};

const zlotoOut = {
  countKopalnieZlota: [],
  empireHasKopalniaZlota: [],
  empireZlotoStock: [],
  ownerHasZlotoStock: [],
  ownerCanFeedMennica: [],
  resolveOwnerZlotoFromStock: [],
  deductMennicaZlotoDrain: [],
  placedImprovementsWithZlotoTradeGrant: [],
};
for (const [pname, placed] of Object.entries(PLACED)) {
  zlotoOut.countKopalnieZlota.push({ placed: placed, out: Z.countKopalnieZlota(toMap(placed)) });
  zlotoOut.empireHasKopalniaZlota.push({ placed: placed, out: Z.empireHasKopalniaZlota(toMap(placed)) });
  zlotoOut.placedImprovementsWithZlotoTradeGrant.push({
    placed,
    grant: true,
    out: enc([...Z.placedImprovementsWithZlotoTradeGrant(toMap(placed), true)]),
  });
}
zlotoOut.countKopalnieZlota.push({ placed: null, out: Z.countKopalnieZlota(null) });
zlotoOut.empireHasKopalniaZlota.push({ placed: null, out: Z.empireHasKopalniaZlota(null) });
for (const [sname, st] of Object.entries(STOCKS)) {
  const j = stockJs(st);
  zlotoOut.empireZlotoStock.push({ stock: st, out: enc(Z.empireZlotoStock(j)) });
  zlotoOut.ownerHasZlotoStock.push({ stock: st, out: Z.ownerHasZlotoStock(j) });
  for (const grace of [false, true]) {
    zlotoOut.ownerCanFeedMennica.push({ stock: st, grace, out: Z.ownerCanFeedMennica(j, grace) });
  }
  // resolveOwnerZlotoFromStock: resolver absent / zwraca true / false
  for (const mode of ['absent', 'true', 'false']) {
    const resolver = mode === 'absent' ? undefined : () => mode === 'true';
    zlotoOut.resolveOwnerZlotoFromStock.push({
      ownerId: 0,
      stock: st,
      resolver: mode,
      out: Z.resolveOwnerZlotoFromStock(0, j, resolver),
    });
  }
  // deductMennicaZlotoDrain: wejscie niepuste (kopia obiektu)
  if (j !== null) {
    zlotoOut.deductMennicaZlotoDrain.push({ stock: st, out: enc(Z.deductMennicaZlotoDrain(j)) });
  }
}
// deduct na null: pomijamy (TS typuje jako Record, nie null).

// ---- wyniki: cyna / zelazo --------------------------------------------------------------
const BUILT = {
  brak: null,
  pusta: [],
  odlewniaBrazu: ['odlewnia_brazu'],
  odlewniaZelaza: ['odlewnia_zelaza'],
  wielka: ['wielka_odlewnia'],
  inne: ['tartak', 'odlewnia_brazu_stara'],
  wszystkie: ['odlewnia_brazu', 'odlewnia_zelaza', 'wielka_odlewnia'],
};
const wrapMap = (h) => (h === null ? null : { hexes: h });

const cynaOut = { empireHasKopalniaNaZlozuCyny: [], cityHasOdlewniaForCyna: [], hasCynaAccess: [] };
const zelazoOut = { empireHasKopalniaNaZlozuZelaza: [], cityHasOdlewniaZelaza: [], hasZelazoAccess: [] };
const HEXMAPS = { ...HEXES, nullMap: null };
for (const [pname, placed] of Object.entries(PLACED)) {
  for (const [hname, h] of Object.entries(HEXMAPS)) {
    cynaOut.empireHasKopalniaNaZlozuCyny.push({
      placed, hexes: h, out: C.empireHasKopalniaNaZlozuCyny(toMap(placed), wrapMap(h)),
    });
    zelazoOut.empireHasKopalniaNaZlozuZelaza.push({
      placed, hexes: h, out: L.empireHasKopalniaNaZlozuZelaza(toMap(placed), wrapMap(h)),
    });
  }
}
// placed null / undefined (absent) -> tylko na zaleznosc od mapy
for (const h of ['zloczaCyna', 'zloczaZelazo', 'nullMap']) {
  cynaOut.empireHasKopalniaNaZlozuCyny.push({ placed: null, hexes: HEXMAPS[h], out: C.empireHasKopalniaNaZlozuCyny(null, wrapMap(HEXMAPS[h])) });
  zelazoOut.empireHasKopalniaNaZlozuZelaza.push({ placed: null, hexes: HEXMAPS[h], out: L.empireHasKopalniaNaZlozuZelaza(null, wrapMap(HEXMAPS[h])) });
}
for (const [bname, built] of Object.entries(BUILT)) {
  // cityHasOdlewnia* wymaga tablicy (TS: readonly string[]) — przypadek null pominiety
  if (built === null) continue;
  cynaOut.cityHasOdlewniaForCyna.push({ built, out: C.cityHasOdlewniaForCyna(built) });
  zelazoOut.cityHasOdlewniaZelaza.push({ built, out: L.cityHasOdlewniaZelaza(built) });
}
for (const [sname, st] of Object.entries(STOCKS)) {
  const variants = [st];
  if (sname === 'brak') variants.push({ bool: true }, { bool: false });
  for (const sv of variants) {
    const stockArg = sv !== null && typeof sv === 'object' && 'bool' in sv ? sv.bool : stockJs(sv);
    for (const [bname, built] of Object.entries(BUILT)) {
      // builtIds: null (undefined w TS) -> sprawdz wariant "tylko stock"
      const bArg = built === null ? undefined : built;
      cynaOut.hasCynaAccess.push({
        stock: sv, built: built, out: C.hasCynaAccess(stockArg, bArg),
      });
      zelazoOut.hasZelazoAccess.push({
        stock: sv, built: built, out: L.hasZelazoAccess(stockArg, bArg),
      });
    }
  }
}

// ---- wyniki: society-inputs (kultura miasta) -------------------------------------------
const CITIES = [
  {},
  { ownCultureShare: 0.5 },
  { kulturaOwnShare: 0.25 },
  { ownCultureShare: 0.7, kulturaOwnShare: 0.1 },
  { ownCultureShare: 'NaN' },
  { ownCultureShare: 'Infinity' },
  { ownCultureShare: '-Infinity' },
  { ownCultureShare: 1.5 },
  { ownCultureShare: -0.2 },
  { ownCultureShare: 0 },
  { ownCultureShare: 1 },
  { ownCultureShare: 'NaN', kulturaOwnShare: 0.3 },
  { ownCultureShare: null, kulturaOwnShare: 0.4 },
  { ownCultureShare: 0.125 },
  { ownCultureShare: 0.375 },
  { ownCultureShare: 0.9999 },
];
const cityJs = (c) => {
  const o = {};
  for (const [k, v] of Object.entries(c)) o[k] = v === null ? null : decNum(v);
  return o;
};
const societyOut = { resolveOwnCultureShare: [], cityCultureMixActive: [], clearCityCultureMix: [], cultureMixBreakdown: [] };
for (const c of CITIES) {
  const j = cityJs(c);
  societyOut.resolveOwnCultureShare.push({ city: c, out: enc(S.resolveOwnCultureShare(j)) });
  societyOut.cityCultureMixActive.push({ city: c, out: S.cityCultureMixActive(j) });
  const copy = cityJs(c);
  S.clearCityCultureMix(copy);
  societyOut.clearCityCultureMix.push({
    city: c,
    out: {
      ownCultureShare: copy.ownCultureShare === undefined ? null : enc(copy.ownCultureShare),
      kulturaOwnShare: copy.kulturaOwnShare === undefined ? null : enc(copy.kulturaOwnShare),
    },
  });
}
const SHARES = [0, 0.125, 0.25, 0.5, 0.6, 0.75, 0.999, 1, 1.5, -0.5, 'NaN', 'Infinity', '-Infinity', 0.0049, 0.9951];
for (const sh of SHARES) {
  for (const active of [false, true]) {
    const v = decNum(sh);
    societyOut.cultureMixBreakdown.push({
      label: 'Kultura właściciela',
      share: sh,
      active,
      out: enc(S.cultureMixBreakdown('Kultura właściciela', v, active)),
    });
  }
}

const doc = (name, obj) => {
  const file = join(outDir, name);
  writeFileSync(file, JSON.stringify({ pin: PIN, ...obj }, null, 1) + '\n');
  return file;
};
const written = [
  doc('zloto.json', { zloto: zlotoOut }),
  doc('cyna.json', { cyna: cynaOut }),
  doc('zelazo.json', { zelazo: zelazoOut }),
  doc('society.json', { society: societyOut }),
];
console.log(written.join('\n'));
console.log('EXIT=0');
