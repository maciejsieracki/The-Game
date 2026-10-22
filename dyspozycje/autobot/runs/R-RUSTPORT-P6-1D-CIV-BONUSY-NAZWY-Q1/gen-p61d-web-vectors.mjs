// Generator wektorow P6.1D z URUCHOMIONEGO kodu weba (pin edb8fb56):
//   gra/src/game/civ-bonuses.ts (+ civ-matrix.ts), gra/src/game/city-names-pool.ts.
// Kod TS jest importowany BEZ ZMIAN (loader p61d-loader-hooks.mjs); zadnych stubow.
//
// Uruchomienie:
//   node --experimental-strip-types --import ./p61d-loader-register.mjs ./gen-p61d-web-vectors.mjs <WEB_ROOT> <OUT_JSON>
//
// Liczby zmiennoprzecinkowe sa zapisywane jako TEKST (String(x) z JS) - serde_json bez
// feature float_roundtrip parsuje liczby z bledem 1 ulp (zob. P6.1 r2); testy czytaja tekst.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [webRoot, outPath] = process.argv.slice(2);
if (!webRoot || !outPath) throw new Error('uzycie: gen-p61d-web-vectors.mjs <WEB_ROOT> <OUT_JSON>');

const game = (f) => pathToFileURL(join(webRoot, 'gra/src/game', f)).href;
const B = await import(game('civ-bonuses.ts'));
const C = await import(game('city-names-pool.ts'));
const M = await import(game('civ-matrix.ts'));

const dataPath = (f) => join(webRoot, 'gra/data', f);
const readData = (f) => readFileSync(dataPath(f));
const civsFile = JSON.parse(readData('civs.json').toString('utf8'));
const poolsFile = JSON.parse(readData('city-names-pools.json').toString('utf8'));
const unitsFile = JSON.parse(readData('units.json').toString('utf8'));
const matrixFile = M.loadCivMatrix();

function fnv1a64(buf) {
  let h = 0xcbf29ce484222325n;
  for (const b of buf) {
    h ^= BigInt(b);
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, '0');
}

const s = (x) => String(x);
// Pakowanie ciagu bitow ('0'/'1') do hex (dopelnienie zerami na koncu do pelnego nibble).
function packBits(bits) {
  let out = '';
  for (let i = 0; i < bits.length; i += 4) out += parseInt(bits.slice(i, i + 4).padEnd(4, '0'), 2).toString(16);
  return out;
}
// Paleta krotek mnoznikow (6 tekstow); wynik per kontekst = indeks palety jako 2 znaki hex.
const palette = [];
const paletteIdx = new Map();
function palIdx(arr) {
  const k = arr.join(',');
  if (!paletteIdx.has(k)) {
    paletteIdx.set(k, palette.length);
    palette.push(arr);
  }
  const i = paletteIdx.get(k);
  if (i > 255) throw new Error('paleta > 256');
  return i.toString(16).padStart(2, '0');
}
const nz = (x) => (x === undefined ? null : x);

// ---------- serializacja wpisow ----------
function encEntry(b) {
  const v = b.wartosc;
  return {
    typ: b.typ,
    cel: b.cel,
    v: typeof v === 'number' ? { n: s(v) } : Array.isArray(v) ? { l: v } : { t: v },
    opis: nz(b.opis),
    realizuje: nz(b.realizuje),
    matrixId: nz(b.matrixParamId),
  };
}
const encUnit = (u) => ({
  typNazwa: u.typNazwa,
  rola: u.rola,
  missile: u.missileAttack === undefined ? null : s(u.missileAttack),
  counter: nz(u.counterTyp),
});
const decUnit = (u) => {
  const o = { typNazwa: u.typNazwa, rola: u.rola };
  if (u.missile !== null) o.missileAttack = Number(u.missile);
  if (u.counter !== null) o.counterTyp = u.counter;
  return o;
};

// ---------- jednostki ----------
const unitsAll = [];
for (const d of unitsFile) {
  unitsAll.push({
    typNazwa: String(d['Jednostka'] ?? ''),
    rola: String(d['Rola (linia)'] ?? 'Wrecz'),
    missileAttack: typeof d['missileAttack'] === 'number' ? d['missileAttack'] : 0,
    counterTyp: String(d['Typ'] ?? d['Jednostka'] ?? ''),
  });
}
// wariant bez counterTyp i bez missileAttack (jak civBonusUnitShapeFromDef)
for (const d of unitsFile) {
  unitsAll.push({
    typNazwa: String(d['Jednostka'] ?? ''),
    rola: String(d['Rola (linia)'] ?? 'Wrecz'),
  });
}
const synthUnits = [
  { typNazwa: 'Łucznik', rola: 'Wręcz' },
  { typNazwa: 'Kusznik', rola: 'Wręcz' },
  { typNazwa: 'Procarz', rola: 'Wręcz' },
  { typNazwa: 'Okręt', rola: 'Morska' },
  { typNazwa: 'Statek', rola: 'Wręcz', counterTyp: 'Naval' },
  { typNazwa: 'Katapulta', rola: 'Oblężnicza' },
  { typNazwa: 'Taran', rola: 'oblez-nicza' },
  { typNazwa: 'Balista', rola: 'Wręcz', counterTyp: 'Siege' },
  { typNazwa: 'Rydwan łuczniczy', rola: 'Dystans' },
  { typNazwa: 'Rydwan bojowy', rola: 'Wręcz' },
  { typNazwa: 'Jazda konna', rola: 'Flanka' },
  { typNazwa: 'Wojownik na koniu', rola: 'Flanka' },
  { typNazwa: 'Jeździec', rola: 'Flanka' },
  { typNazwa: 'Jeździec', rola: 'Wręcz' },
  { typNazwa: 'Husarz', rola: 'Wręcz' },
  { typNazwa: 'Konnica stepowa', rola: 'Wręcz' },
  { typNazwa: 'Wojownik', rola: 'Wręcz', missileAttack: 3 },
  { typNazwa: 'Wojownik', rola: 'Wręcz', missileAttack: 0 },
  { typNazwa: 'Wojownik', rola: 'Wręcz', missileAttack: -1 },
  { typNazwa: 'Piechur', rola: '' },
  { typNazwa: '', rola: 'DYSTANS' },
  { typNazwa: 'LUK', rola: 'Wręcz' },
  { typNazwa: 'Łuk długi', rola: 'Wręcz' },
  { typNazwa: 'Okręt', rola: 'Wręcz', counterTyp: 'NAVAL' },
  { typNazwa: 'Gladiator', rola: 'Wręcz', counterTyp: 'Swordsman' },
];
unitsAll.push(...synthUnits);
const unitCat = unitsAll.map((u) => B.unitCombatCategory(u));

const unitKey = (u) => JSON.stringify(encUnit(u));
const seen = new Set();
const unitsIdx = [];
for (const u of unitsAll) {
  const k = unitKey(u);
  if (!seen.has(k)) {
    seen.add(k);
    unitsIdx.push(u);
  }
}
const unitsOut = unitsIdx.map(encUnit);
const catOut = unitsIdx.map((u) => B.unitCombatCategory(u));

// jednostki reprezentatywne: po jednej na kategorie z danych + po jednej syntetycznej
const repKeys = new Set();
const repUnits = [];
const pushRep = (u) => {
  const k = unitKey(u);
  if (repKeys.has(k)) return;
  repKeys.add(k);
  repUnits.push(unitsIdx.findIndex((x) => unitKey(x) === k));
};
const perCatReal = new Map();
for (let i = 0; i < unitsFile.length; i++) {
  const cat = B.unitCombatCategory(unitsAll[i]);
  if (!perCatReal.has(cat)) perCatReal.set(cat, unitsAll[i]);
}
for (const u of perCatReal.values()) pushRep(u);
for (const idx of [0, 3, 4, 5, 8, 9, 10, 11, 12, 16, 22]) pushRep(synthUnits[idx]);
pushRep({ typNazwa: 'Wojownik', rola: 'Wręcz' });

// podzbior (piechota, lukownicy, kawaleria) dla list syntetycznych - ogranicza rozmiar wektorow
const repSmall = ['piechota', 'lukownicy', 'kawaleria'].map((cat) => repUnits.find((ui) => catOut[ui] === cat));
if (repSmall.some((x) => x === undefined)) throw new Error('brak jednostki reprezentatywnej kategorii');
const repFor = (listName) => (listName.startsWith('syn:') ? repSmall : repUnits);

// ---------- konteksty ----------
const sides = ['attacker', 'defender'];
const terrains = ['', 'Las', 'Równina', 'Dżungla', 'Góry'];
const contexts = [];
for (const side of sides)
  for (const terrain of terrains)
    for (const charge of [false, true])
      for (const own of [false, true])
        for (const wall of [false, true])
          for (const shallow of [false, true])
            contexts.push({ side, terrain, charge, own, wall, shallow });
const decCtx = (c) => {
  const o = { side: c.side };
  if (c.terrain !== '') o.terrain = c.terrain;
  if (c.charge) o.isChargeRound = true;
  if (c.own) o.ownTerritory = true;
  if (c.wall) o.onWallWalkway = true;
  if (c.shallow) o.shallowSea = true;
  return o;
};

// ---------- cele ----------
const cels = [
  'piechota', 'Piechota', 'lukownicy', 'Łucznicy', 'lukowNicy', 'dystans', 'kawaleria', 'Kawaleria',
  'rydwany', 'morska', 'obleczenie', 'obleznicza', 'Oblężnicza', 'wszystko', 'WSZYSTKO', 'jednostki',
  'budynki', 'nieznany', '',
];
const matchesCel = unitsIdx.map((u) => cels.map((c) => (B.unitMatchesCel(u, c) ? '1' : '0')).join(''));

// ---------- listy bonusow ----------
const lists = [];
const listKeys = new Map();
function addList(name, entries) {
  const enc = entries.map(encEntry);
  const k = JSON.stringify(enc);
  if (listKeys.has(k)) return listKeys.get(k);
  lists.push({ name, entries: enc, raw: entries });
  listKeys.set(k, lists.length - 1);
  return lists.length - 1;
}
addList('pusta', []);
for (const civ of civsFile.cywilizacje) {
  const real = civ.bonusy;
  const matrix = B.civMatrixBonusyForCivKey(civ.ikonaId);
  addList(`${civ.ikonaId}:real`, real);
  addList(`${civ.ikonaId}:matrix`, matrix);
  addList(`${civ.ikonaId}:real+matrix`, [...real, ...matrix]);
}
// syntetyczne wpisy z roznymi opisami i identyfikatorami macierzy (kazdy jako osobna lista)
const opisCases = [
  '', 'Falanga: +20% obrony piechoty przy ataku frontalnym', 'Teren górski: +20% walki w lesie i dżungli',
  'Zasadzka leśna: +25% ataku przy walce w lesie lub przy pierwszym ciosie z zasadzki',
  'Brawura szarży: +25% ataku piechoty przy pierwszym uderzeniu', 'Gaesatae: +15% Uderzenia',
  'Furia bojowa: +15% ataku na starciu', 'Konnica stepowa: +15% uderzenia kawalerii przy szarży',
  'Łucznicy: +20% ataku i zasięgu jednostek dystansowych', 'Łucznicy na rydwanach: +20% ataku dystansowego',
  'Ciężka piechota: +20% obrony i HP ciężkiej piechoty (pancerz brązowy + tarcza)',
  'Ciężkie rydwany bojowe: +15% HP i obrony rydwanów', 'Legion: +15% ataku i pancerza piechoty szturmowej',
  'pancerz tylko', 'pancerz i atak', 'obrona i hp', 'szarża kawalerii', 'szarza w lesie', 'w starciu',
  'las lub pierwszy', 'dzungla lub zasadzka', 'lub pierwszy', 'Obrona murów: +15% obrony piechoty w terytorium własnym',
  'Horda leśna: +15% ataku piechoty w lesie', 'Forteca Anatolii: +15% obrony w murach/górach',
  'health bonus', 'ciezka piechota', 'ataku i pancerz i obrona', ' atak bez uderzenia', ' atak uderzenie',
  'dystans', 'lucz rydwan', 'hp', 'Machiny oblężnicze: +15% oblężenia', 'Ruch i morale: +20% prędkości',
];
for (const typ of ['bonus_walka', 'bonus_obrona']) {
  for (const cel of ['piechota', 'wszystko']) {
    for (const opis of opisCases) {
      addList(`syn:${typ}:${cel}:${opis}`, [{ typ, cel, wartosc: 0.1, opis, realizuje: 'walka' }]);
    }
  }
}
const matrixIdCases = [
  'walka_atak_piechota', 'walka_atak_wszystkie', 'walka_obrona_piechota', 'walka_obrona_piechota_w_murze',
  'walka_pancerz_piechota', 'walka_uderzenie_piechota', 'walka_dystans_lukownicy', 'walka_hp_piechota',
  'walka_ruch_bitwa_proc', 'walka_ruch_rydwany', 'walka_zasieg_proc', 'walka_oblezenie_proc',
  'walka_atak_piechota_terytorium_wlasne', 'walka_obrona_piechota_terytorium_wlasne',
  'walka_atak_piechota_w_murze', 'walka_atak_piechota_teren_las', 'walka_obrona_piechota_teren_las',
  'walka_atak_piechota_runda_szarzy', 'walka_obrona_piechota_runda_szarzy',
  'walka_atak_piechota_teren_plytkie_morze', 'walka_obrona_piechota_teren_plytkie_morze',
  'walka_ruch_piechota_teren_plytkie_morze', 'walka_dystans_rydwany', 'inny_parametr', 'walka_koszt_rekrutacji_proc',
];
for (const typ of ['bonus_walka', 'bonus_obrona']) {
  for (const id of matrixIdCases) {
    addList(`syn:matrix:${typ}:${id}`, [{ typ, cel: 'piechota', wartosc: 0.07, opis: `Matrix:${id}`, realizuje: 'walka', matrixParamId: id }]);
    addList(`syn:matrix-noopis:${typ}:${id}`, [{ typ, cel: 'wszystko', wartosc: 0.05, realizuje: 'walka', matrixParamId: id }]);
  }
}
// roznorodne dyskryminatory
addList('syn:jednostka_specjalna', [{ typ: 'jednostka_specjalna', cel: 'piechota', wartosc: ['x'], opis: 'x', realizuje: 'walka' }]);
addList('syn:wartosc-tekst', [{ typ: 'bonus_walka', cel: 'piechota', wartosc: 'x', opis: 'x', realizuje: 'walka' }]);
addList('syn:wygaszone', [{ typ: 'bonus_walka', cel: 'piechota', wartosc: 0.2, opis: 'x', realizuje: 'walka_wygaszone' }]);
addList('syn:ekonomia', [{ typ: 'bonus_zloto', cel: 'zloto', wartosc: 0.2, opis: 'x', realizuje: 'ekonomia' }]);
addList('syn:bez-realizuje', [{ typ: 'bonus_walka', cel: 'piechota', wartosc: 0.2 }]);
addList('syn:wiele', [
  { typ: 'bonus_walka', cel: 'piechota', wartosc: 0.1, opis: 'atak', realizuje: 'walka' },
  { typ: 'bonus_walka', cel: 'piechota', wartosc: 0.2, opis: 'pancerz', realizuje: 'walka' },
  { typ: 'bonus_obrona', cel: 'piechota', wartosc: 0.3, opis: 'obrona hp', realizuje: 'walka' },
  { typ: 'bonus_walka', cel: 'kawaleria', wartosc: 0.4, opis: 'uderzenie', realizuje: 'walka' },
  { typ: 'bonus_walka', cel: 'lukownicy', wartosc: 0.15, opis: 'dystans', realizuje: 'walka' },
  { typ: 'bonus_walka', cel: 'piechota', wartosc: 0.05, opis: 'x', realizuje: 'walka', matrixParamId: 'walka_atak_piechota' },
  { typ: 'bonus_walka', cel: 'piechota', wartosc: 0.07, opis: 'x', realizuje: 'walka', matrixParamId: 'walka_hp_piechota' },
]);

// ---------- bonusApplies + civCombatStatMultipliers ----------
const apply = [];
for (let li = 0; li < lists.length; li++) {
  const raw = lists[li].raw;
  for (const ui of repFor(lists[li].name)) {
    const unit = decUnit(unitsOut[ui]);
    let bits = '';
    let mult = '';
    for (let ci = 0; ci < contexts.length; ci++) {
      const ctx = decCtx(contexts[ci]);
      if (raw.length === 1) bits += B.bonusApplies(raw[0], unit, ctx) ? '1' : '0';
      const m = B.civCombatStatMultipliers(raw, unit, ctx);
      mult += palIdx([m.atk, m.obrona, m.pancerz, m.uderzenie, m.rangedAtk, m.health].map(s));
    }
    apply.push({ list: li, unit: ui, bits: packBits(bits), mult });
  }
}
// bonusApplies per wpis (dla list wieloelementowych)
const applyEntries = [];
for (let li = 0; li < lists.length; li++) {
  const raw = lists[li].raw;
  if (raw.length < 2) continue;
  for (const ui of repFor(lists[li].name)) {
    const unit = decUnit(unitsOut[ui]);
    const rows = raw.map((b) => packBits(contexts.map((c) => (B.bonusApplies(b, unit, decCtx(c)) ? '1' : '0')).join('')));
    applyEntries.push({ list: li, unit: ui, rows });
  }
}
// civCombatStatMultipliers(undefined, ...)
const undefinedMult = (() => {
  const u = decUnit(unitsOut[repUnits[0]]);
  const m = B.civCombatStatMultipliers(undefined, u, { side: 'attacker' });
  return [m.atk, m.obrona, m.pancerz, m.uderzenie, m.rangedAtk, m.health].map(s);
})();

// ---------- civMatrixBonusyForCivKey ----------
const civKeys = [];
for (const c of matrixFile.cywilizacje) {
  civKeys.push(c.ikonaId, c.typCywilizacji, c.Cywilizacja, c.ikonaId.toUpperCase(), c.Cywilizacja.toUpperCase());
}
civKeys.push('egipt', 'EGIPT', 'Egipt', 'xyz', '', ' grecy');
const uniqKeys = [...new Set(civKeys)];
const matrixBonusy = uniqKeys.map((k) => ({ civKey: k, entries: B.civMatrixBonusyForCivKey(k).map(encEntry) }));

// ---------- mnozniki ruch/zasieg/oblezenie/mur ----------
const mults = [];
for (let li = 0; li < lists.length; li++) {
  const raw = lists[li].raw;
  for (const ui of repFor(lists[li].name)) {
    const unit = decUnit(unitsOut[ui]);
    const rec = { list: li, unit: ui, movement: {}, range: s(B.civAttackRangeMultiplier(raw, unit)), siege: s(B.civSiegeAttackMultiplier(raw, unit)), wall: s(B.civWallDefenseMultiplier(raw, unit)) };
    for (const terrain of ['', 'Las', 'Równina', 'Góry']) {
      for (const shallow of [false, true]) {
        rec.movement[`${terrain}|${shallow ? 1 : 0}`] = s(B.civMovementMultiplier(raw, unit, terrain, shallow));
      }
    }
    // wywolanie z domyslnymi argumentami (terrain='', shallowSea=false)
    rec.movementDefault = s(B.civMovementMultiplier(raw, unit));
    mults.push(rec);
  }
}

// ---------- znizka kosztu budynkow ----------
const discLists = [];
const dl = (name, entries) => discLists.push({ name, entries });
dl('pusta', []);
dl('rzym', [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.2, opis: 'x', realizuje: 'miasto' }]);
dl('dwa', [
  { typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.5, realizuje: 'miasto' },
  { typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.5, realizuje: 'miasto' },
]);
dl('trzy', [
  { typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.3, realizuje: 'miasto' },
  { typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.1, realizuje: 'miasto' },
  { typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.2, realizuje: 'miasto' },
]);
dl('zero', [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0, realizuje: 'miasto' }]);
dl('ujemna', [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: -0.2, realizuje: 'miasto' }]);
dl('zly-realizuje', [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.2, realizuje: 'ekonomia' }]);
dl('zly-cel', [{ typ: 'koszt_redukcja', cel: 'jednostki', wartosc: 0.2, realizuje: 'miasto' }]);
dl('zly-typ', [{ typ: 'bonus_zloto', cel: 'budynki', wartosc: 0.2, realizuje: 'miasto' }]);
dl('tekst', [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: 'x', realizuje: 'miasto' }]);
dl('bez-realizuje', [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.2 }]);
dl('999', [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.9, realizuje: 'miasto' }]);
dl('0.74999', [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.74999, realizuje: 'miasto' }]);
dl('0.1+0.2', [
  { typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.1, realizuje: 'miasto' },
  { typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.2, realizuje: 'miasto' },
]);
for (const civ of civsFile.cywilizacje) dl(`${civ.ikonaId}:real`, civ.bonusy);
const costs = [-5, 0, 0.5, 1, 2, 3, 4, 7, 10, 17, 25, 99, 100, 333.7, 1000, 12345.9];
const discount = discLists.map((l) => ({
  name: l.name,
  entries: l.entries.map(encEntry),
  disc: s(B.civBuildingCostDiscount(l.entries)),
  costs: costs.map((c) => [s(c), s(B.buildingCostAfterCivDiscount(c, l.entries))]),
}));
const discountUndefined = { disc: s(B.civBuildingCostDiscount(undefined)), cost: s(B.buildingCostAfterCivDiscount(10, undefined)) };

// ---------- isCombatModifierBonus ----------
const combatMod = lists.map((l, i) => ({ list: i, bits: l.raw.map((b) => (B.isCombatModifierBonus(b) ? '1' : '0')).join('') }));

// ---------- applyMultiplier ----------
const mulPairs = [[100, 0.2], [0, 0.5], [7.5, -0.3], [3, 0], [1e3, 0.15], [0.1, 0.2], [123.456, 0.075]];
const applyMul = mulPairs.map(([b, f]) => [s(b), s(f), s(B.applyMultiplier(b, f))]);

// ---------- stripDiacritics (przez zachowanie publiczne; probki trafiaja do unitMatchesCel/unitCombatCategory) ----------
// stripDiacritics nie jest eksportowane: wektor strip = zachowanie unitCombatCategory dla probek typNazwa.
const stripProbes = [
  'Łódź', 'ŁÓDŹ', 'Żółć', 'ĄĆĘŃÓŚŹŻ', 'ąćęńóśźż', 'łŁ', 'Äö Üß éñç Å', 'Ǎ', 'Ạ', 'ǆ', 'ǅ', 'á', 'ę́', 'x̀',
  'Ǻ', 'ẞ', 'İ', 'ı', 'ﬁ', '日本語', 'Σ', 'ΑΣ', 'ά', 'Ω', 'Å', 'Å', 'Rydwan', 'RYDWAN', 'Rydwań', 'Łucznik', 'Kuszą',
  'Procarz', 'Jeździec', 'Husarz', 'Stepowy', 'Konny', 'Kawaleria', 'kawaler', '', 'abc', 'LAS', 'Las', 'Dżungla', 'Góry',
  'Pierwszym uderzeniu', 'ciężka piechota', 'oblężnicza', 'obleznicza', 'oblez-nicza',
];
// stripDiacritics weryfikujemy przez unitCombatCategory({typNazwa: probka, rola: ''}) oraz przez
// terrain: bonusApplies(las) - patrz niżej; bezposredni wektor: kategoria jednostki o danej nazwie
const stripCat = stripProbes.map((p) => [p, B.unitCombatCategory({ typNazwa: p, rola: '' })]);
// teren: wektor via civCombatStatMultipliers z wpisem matrixId '_teren_las' (przejscie przez terrainIsForestOrJungle)
const terrainProbes = stripProbes;
const terrainOut = terrainProbes.map((p) => {
  const b = { typ: 'bonus_walka', cel: 'piechota', wartosc: 0.1, opis: 'Matrix:x', realizuje: 'walka', matrixParamId: 'walka_atak_piechota_teren_las' };
  const u = { typNazwa: 'Wojownik', rola: 'Wręcz' };
  return [p, B.bonusApplies(b, u, { side: 'attacker', terrain: p }) ? 1 : 0];
});

// ---------- stripDiacritics (funkcja nieeksportowana: wycieta WERBATIM z civ-bonuses.ts) ----------
const bonusesSrc = readFileSync(join(webRoot, 'gra/src/game/civ-bonuses.ts'), 'utf8');
const stripMatch = bonusesSrc.match(/function stripDiacritics\(s: string\): string \{\n([\s\S]*?)\n\}/);
if (!stripMatch) throw new Error('brak stripDiacritics w civ-bonuses.ts');
const stripBody = stripMatch[1];
if (!stripBody.includes("normalize('NFD')")) throw new Error('nieoczekiwane cialo stripDiacritics');
const stripDiacritics = new Function('s', stripBody);
const stripProbeOut = stripProbes.map((p) => [p, stripDiacritics(p)]);
// hash dla calej BMP (od U+0000, bez surogatow): FNV-1a64 po "cp:wynik\n"
let bmpBuf = '';
for (let cp = 0; cp <= 0xffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  if (cp >= 0xac00 && cp <= 0xd7a3) continue; // sylaby Hangul: dekompozycja algorytmiczna, poza domena (NIE_ZMIERZONO)
  // U+A7CE, U+A7D2, U+A7D4: litery dodane w nowszej wersji Unicode niz zna ICU Node (toLowerCase tej
  // litery rozni sie miedzy Node a Rust 1.97) - dryf wersji Unicode, poza domena danych gry.
  if (cp === 0xa7ce || cp === 0xa7d2 || cp === 0xa7d4) continue;
  bmpBuf += `${cp}:${stripDiacritics(String.fromCodePoint(cp))}\n`;
}
const bmpHash = fnv1a64(Buffer.from(bmpBuf, 'utf8'));
// wszystkie stringi-wartosci z civs.json i units.json (XOR FNV po "wejscie\u0000wyjscie", niezalezne od kolejnosci)
function collectStrings(x, acc) {
  if (typeof x === 'string') acc.push(x);
  else if (Array.isArray(x)) x.forEach((y) => collectStrings(y, acc));
  else if (x && typeof x === 'object') Object.values(x).forEach((y) => collectStrings(y, acc));
}
const dataStrings = [];
collectStrings(civsFile, dataStrings);
collectStrings(unitsFile, dataStrings);
let dataXor = 0n;
for (const str of dataStrings) dataXor ^= BigInt('0x' + fnv1a64(Buffer.from(`${str}\u0000${stripDiacritics(str)}`, 'utf8')));
const stripVectors = {
  source: 'civ-bonuses.ts:stripDiacritics (ciało wycięte werbatim: ' + stripBody.trim() + ')',
  probes: stripProbeOut,
  bmpHash,
  dataStringCount: dataStrings.length,
  dataStringXor: dataXor.toString(16).padStart(16, '0'),
};

// =============== NAZWY MIAST ===============
const poolsObj = poolsFile;
const poolIds = Object.keys(poolsObj);
const civsForNames = civsFile.cywilizacje.map((c) => ({ ikonaId: c.ikonaId, nazwyMiast: c.nazwyMiast }));

const consts = {
  regular: C.CITY_NAMES_POOL_REGULAR_LEN,
  state: C.CITY_NAMES_POOL_STATE_LEN,
  common: C.CITY_NAMES_POOL_COMMON_LEN,
  klastra: C.NAZWY_KLASTRA_LEN,
};

const suffixOrdinals = [-3, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 20, 100];
const suffixBases = ['Ateny', '', 'Rzym Wielki'];
const suffixOut = [];
for (const b of suffixBases) for (const o of suffixOrdinals) suffixOut.push([b, o, C.cityNameWithSuffix(b, o)]);

const klastraAtCases = [];
for (const names of [[], ['a'], ['a', '', 'c'], ['a', 'b', 'c']]) {
  for (const idx of [-1, 0, 1, 2, 3, 10]) {
    klastraAtCases.push({ names, index: idx, fallback: 'FB', out: C.nazwaKlastraAt(names, idx, 'FB') });
  }
}

const rivalIdx = [];
for (const rv of [-2, 0, 1, 2, 3, 5, 10, 11, 12, 100]) for (const pl of [-1, 0, 1, 2, 3, 5, 11, 110]) rivalIdx.push([rv, pl, C.rivalPoolIndex(rv, pl)]);

// pickNextCityNameFromNames - przypadki syntetyczne
const roman = ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const allSuffixedA = ['A', 'B', ...roman.map((r) => `A ${r}`)];
const pickCases = [];
const addPick = (names, used, fb) => pickCases.push({ names, used, fallback: fb === undefined ? null : fb, out: fb === undefined ? C.pickNextCityNameFromNames(names, new Set(used)) : C.pickNextCityNameFromNames(names, new Set(used), fb) });
for (const fb of [undefined, 'F']) {
  addPick([], [], fb);
  addPick([], ['Miasto'], fb);
  addPick([], ['Miasto', 'Miasto II'], fb);
  addPick([], ['F'], fb);
  addPick([], ['F', 'F II', 'F III'], fb);
  addPick(['A', 'B'], [], fb);
  addPick(['A', 'B'], ['A'], fb);
  addPick(['A', 'B'], ['B'], fb);
  addPick(['A', 'B'], ['A', 'B'], fb);
  addPick(['A', 'B'], ['A', 'B', 'A II'], fb);
  addPick(['A', 'B'], ['A', 'B', 'A II', 'A III'], fb);
  addPick(['A', 'B'], allSuffixedA, fb);
  addPick(['A', 'B'], [...allSuffixedA, 'A 11'], fb);
  addPick(['A', 'B'], ['A', 'B', 'A II', 'A IV'], fb);
  addPick(['', 'A', ''], ['A'], fb);
  addPick(['', 'A', ''], [], fb);
  addPick(['', '', ''], [], fb);
  addPick(['', '', ''], ['Miasto'], fb);
  addPick(['', '', ''], ['F'], fb);
  addPick(['A', 'A II'], ['A'], fb);
  addPick(['A', 'A II'], ['A', 'A II'], fb);
  addPick(['A', 'A II', 'A III'], ['A', 'A II', 'A III'], fb);
  addPick(['A', 'A'], ['A'], fb);
  addPick(['Ateny', 'Sparta'], ['Sparta'], fb);
  addPick(['', 'B'], ['B'], fb);
}

// pule rzeczywiste
const usedSpecs = [];
const fullNames = (id) => poolsObj[id].miasta_cywilizacji.slice(0, C.CITY_NAMES_POOL_COMMON_LEN);
for (const k of [0, 1, 2, 50, 109, 110]) usedSpecs.push({ prefix: k, extra: [] });
usedSpecs.push({ prefix: 110, extra: ['@1 II'] });
usedSpecs.push({ prefix: 110, extra: ['@1 II', '@1 III', '@1 IV'] });
usedSpecs.push({ prefix: 3, extra: ['@2 II', 'Obce'] });
function expandUsed(spec, id) {
  const names = fullNames(id);
  const first = names[0] ?? '';
  const second = names[1] ?? '';
  const sub = (x) => x.replace('@1', first).replace('@2', second);
  return new Set([...names.slice(0, spec.prefix), ...spec.extra.map(sub)]);
}
const realPick = [];
for (const id of [...poolIds, 'nieznana']) {
  for (let si = 0; si < usedSpecs.length; si++) {
    const used = expandUsed(usedSpecs[si], poolsObj[id] ? id : poolIds[0]);
    const row = {
      civ: id,
      spec: si,
      nextFb: C.pickNextCityName(poolsObj, id, used, 'FB'),
      nextDefault: C.pickNextCityName(poolsObj, id, used),
      regular: C.pickNextRegularCityName(poolsObj, id, used),
      capital: C.playerCapitalFromPool(poolsObj, id, used),
      foreign: C.foreignCapitalFromPool(poolsObj, id, used),
    };
    realPick.push(row);
  }
  realPick.push({
    civ: id, spec: -1,
    nextFb: C.pickNextCityName(poolsObj, id, new Set(), 'FB'),
    nextDefault: C.pickNextCityName(poolsObj, id, new Set()),
    regular: C.pickNextRegularCityName(poolsObj, id, new Set()),
    capital: C.playerCapitalFromPool(poolsObj, id),
    foreign: C.foreignCapitalFromPool(poolsObj, id),
  });
}
const stateAt = [];
const idxs = [-1, 0, 1, 5, 109, 110, 111, 200];
for (const id of [...poolIds, 'nieznana']) {
  for (const idx of idxs) {
    stateAt.push({
      civ: id, index: idx,
      none: C.stateCityNameAt(poolsObj, id, idx, 'FB'),
      empty: C.stateCityNameAt(poolsObj, id, idx, 'FB', new Set()),
      p3: C.stateCityNameAt(poolsObj, id, idx, 'FB', new Set(fullNames(poolsObj[id] ? id : poolIds[0]).slice(0, 3))),
    });
  }
}
const rivals = [];
for (const id of [...poolIds, 'nieznana']) {
  for (const rv of [-1, 0, 1, 2, 10, 110, 111, 150]) {
    const base = poolsObj[id] ? id : poolIds[0];
    rivals.push({
      civ: id, rival: rv,
      none: C.clusterRivalFromPool(poolsObj, id, rv),
      empty: C.clusterRivalFromPool(poolsObj, id, rv, new Set()),
      p4: C.clusterRivalFromPool(poolsObj, id, rv, new Set(fullNames(base).slice(0, 4))),
    });
  }
}
// resolveStateCityName
const poolsNoGreeks = Object.fromEntries(Object.entries(poolsObj).filter(([k]) => k !== 'grecy'));
const civsOnlyNames = [
  { ikonaId: 'x1', nazwyMiast: ['A', 'B', 'C'] },
  { ikonaId: 'x2', nazwyMiast: [] },
  { ikonaId: 'x3' },
  { ikonaId: 'x4', nazwyMiast: ['', 'B'] },
  ...civsForNames,
];
const resolveCases = [];
for (const poolsKind of ['full', 'nogreek', 'none']) {
  const p = poolsKind === 'full' ? poolsObj : poolsKind === 'nogreek' ? poolsNoGreeks : undefined;
  for (const id of ['grecy', 'rzymianie', 'x1', 'x2', 'x3', 'x4', 'nieznana']) {
    for (const idx of [-1, 0, 1, 2, 3, 5, 109, 200]) {
      resolveCases.push({
        pools: poolsKind, civ: id, index: idx,
        none: C.resolveStateCityName(p, { cywilizacje: civsOnlyNames }, id, idx, 'FB'),
        empty: C.resolveStateCityName(p, { cywilizacje: civsOnlyNames }, id, idx, 'FB', new Set()),
        used1: C.resolveStateCityName(p, { cywilizacje: civsOnlyNames }, id, idx, 'FB', new Set(['A', 'Ateny'])),
      });
    }
  }
}
// kolektory
const collectCases = [];
const civOf = { 0: 'grecy', 1: 'rzymianie', 2: 'grecy', 3: 'egipt', [-5]: 'barb' };
const civFn = (o) => civOf[o] ?? 'inna';
const cityList = [
  { ownerId: 0, name: 'Ateny' }, { ownerId: 1, name: 'Rzym' }, { ownerId: 2, name: 'Sparta' },
  { ownerId: 3, name: 'Teby' }, { ownerId: 0, name: '' }, { ownerId: 7, name: 'Kos' }, { ownerId: -5, name: 'Obóz' },
  { ownerId: 2, name: 'Ateny' },
];
for (const target of ['grecy', 'rzymianie', 'egipt', 'barb', 'inna', 'zadna']) {
  collectCases.push({
    target,
    byCities: [...C.collectUsedCityNamesFromCities(cityList, civFn, target)].sort(),
    byArrays: [...C.collectUsedCityNames(cityList.map((c) => c.name), cityList.map((c) => c.ownerId), civFn, target)].sort(),
    byArraysShortOwners: [...C.collectUsedCityNames(cityList.map((c) => c.name), cityList.slice(0, 3).map((c) => c.ownerId), civFn, target)].sort(),
  });
}
const suggestCases = [];
const suggestCityLists = [
  [],
  cityList,
  [{ ownerId: 0, name: 'Ateny' }, { ownerId: 2, name: 'Sparta' }],
  fullNames('grecy').map((n, i) => ({ ownerId: i % 2 === 0 ? 0 : 2, name: n })),
  [...fullNames('grecy').map((n) => ({ ownerId: 0, name: n })), { ownerId: 0, name: 'Ateny II' }],
];
suggestCityLists.forEach((cities, li) => {
  for (const civ of ['grecy', 'rzymianie', 'inna']) {
    suggestCases.push({
      cities: li, civ,
      suggest: C.suggestPlayerFoundCityName(poolsObj, civ, cities, civFn, 0),
      suggestOther: C.suggestPlayerFoundCityName(poolsObj, civ, cities, civFn, 99),
      ai: [0, 1, 2, 3, 7, -5].map((o) => C.pickAiFoundCityName(poolsObj, civ, cities, civFn, o)),
    });
  }
});
// walidacja
const longDup = [...fullNames('grecy').slice(0, 109), 'Ateny'];
const validateCases = [];
const addValidate = (name, pools, civs) => validateCases.push({ name, pools, civs, out: C.validateCityNamesPools(pools, { cywilizacje: civs }) });
addValidate('real', poolsObj, civsForNames);
addValidate('pusto', {}, []);
addValidate('brak-wpisu', {}, [{ ikonaId: 'a', nazwyMiast: [] }]);
addValidate('krotka', { a: { nazwa_pl: 'A', miasta_cywilizacji: ['x', 'y'] } }, [{ ikonaId: 'a', nazwyMiast: ['x', 'y'] }]);
addValidate('krotka-rozne', { a: { nazwa_pl: 'A', miasta_cywilizacji: ['x', 'y'] } }, [{ ikonaId: 'a', nazwyMiast: ['x'] }]);
addValidate('dup-110', { grecy: { nazwa_pl: 'G', miasta_cywilizacji: longDup } }, [{ ikonaId: 'grecy', nazwyMiast: longDup }]);
addValidate('110-ok', { grecy: poolsObj.grecy }, [{ ikonaId: 'grecy', nazwyMiast: poolsObj.grecy.miasta_cywilizacji }]);
addValidate('110-brak-nazw', { grecy: poolsObj.grecy }, [{ ikonaId: 'grecy' }]);
addValidate('110-inna-kolejnosc', { grecy: poolsObj.grecy }, [{ ikonaId: 'grecy', nazwyMiast: [...poolsObj.grecy.miasta_cywilizacji].reverse() }]);
addValidate('bez-ikona', { a: { nazwa_pl: 'A', miasta_cywilizacji: [] } }, [{ nazwyMiast: [] }, { ikonaId: '', nazwyMiast: [] }, { ikonaId: 'a', nazwyMiast: [] }]);
addValidate('dwa-wpisy-ta-sama-civ', { a: { nazwa_pl: 'A', miasta_cywilizacji: ['x'] } }, [{ ikonaId: 'a', nazwyMiast: ['x'] }, { ikonaId: 'a', nazwyMiast: ['y'] }]);
// Pominiety przypadek webowy `miasta_cywilizacji` == undefined (`?? []`): w Rust pole jest wymagane
// przez typ danych CityPool (data/civilizations.rs), wiec taki wpis nie moze zaistniec (NIE-DOTYCZY, jawnie).

const out = {
  pin: 'edb8fb56',
  generator: 'gen-p61d-web-vectors.mjs (r1)',
  node: process.version,
  sourceFiles: ['gra/src/game/civ-bonuses.ts', 'gra/src/game/civ-matrix.ts', 'gra/src/game/city-names-pool.ts'],
  dataFnv: {
    civs: fnv1a64(readData('civs.json')),
    civMatrix: fnv1a64(readData('civ-matrix.json')),
    cityNamesPools: fnv1a64(readData('city-names-pools.json')),
    units: fnv1a64(readData('units.json')),
  },
  constants: consts,
  units: unitsOut,
  unitCategory: catOut,
  repUnits,
  cels,
  matchesCel,
  contexts,
  palette,
  lists: lists.map(({ name, entries }) => ({ name, entries })),
  apply,
  applyEntries,
  undefinedMult,
  matrixBonusy,
  mults,
  discount,
  discountUndefined,
  combatMod,
  applyMul,
  stripCat,
  strip: stripVectors,
  terrainOut,
  cityNames: {
    pools: poolsObj,
    civs: civsForNames,
    suffix: suffixOut,
    klastraAt: klastraAtCases,
    rivalIdx,
    pick: pickCases,
    usedSpecs,
    realPick,
    stateAt,
    rivals,
    resolve: resolveCases,
    civsOnlyNames,
    collect: collectCases,
    collectCityList: cityList,
    collectCivOf: civOf,
    suggestCityLists,
    suggest: suggestCases,
    validate: validateCases,
  },
};
writeFileSync(outPath, JSON.stringify(out));
console.log(
  `OK units=${unitsOut.length} reps=${repUnits.length} ctx=${contexts.length} lists=${lists.length} apply=${apply.length} ` +
    `mults=${mults.length} discount=${discount.length} matrixBonusy=${matrixBonusy.length} pick=${pickCases.length} ` +
    `realPick=${realPick.length} stateAt=${stateAt.length} rivals=${rivals.length} resolve=${resolveCases.length} validate=${validateCases.length}`,
);
