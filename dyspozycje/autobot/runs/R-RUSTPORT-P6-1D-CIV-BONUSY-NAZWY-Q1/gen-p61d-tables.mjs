// Generator tabel data/derived/civ-bonus-*.json (P6.1D).
// Tabele z TS (MATRIX_COMBAT_SPECS, excludedG1) sa WYCINANE z kodu weba (pin edb8fb56) i
// ewaluowane - nie przepisywane recznie. Reszta (reguly, stale) jest przepisana z kodu weba
// z odnosnikami plik:linia w polu "zrodlo_web"; poprawnosc pilnuja wektory z uruchomionego weba.
//
// Uzycie: node gen-p61d-tables.mjs <WEB_ROOT> <OUT_DIR>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [webRoot, outDir] = process.argv.slice(2);
if (!webRoot || !outDir) throw new Error('uzycie: node gen-p61d-tables.mjs <WEB_ROOT> <OUT_DIR>');

const bonusesSrc = readFileSync(join(webRoot, 'gra/src/game/civ-bonuses.ts'), 'utf8');
const lines = bonusesSrc.split('\n');
const lineOf = (needle) => lines.findIndex((l) => l.includes(needle)) + 1;

function cutArray(startNeedle, closeNeedle) {
  const start = bonusesSrc.indexOf(startNeedle);
  if (start < 0) throw new Error(`brak kotwicy: ${startNeedle}`);
  const open = bonusesSrc.indexOf('[', bonusesSrc.indexOf('=', start));
  const close = bonusesSrc.indexOf(closeNeedle, open);
  if (close < 0) throw new Error(`brak zamkniecia: ${closeNeedle}`);
  return bonusesSrc.slice(open, close + 1);
}

// 1. MATRIX_COMBAT_SPECS (werbatim z weba -> ewaluacja literalu tablicy)
const specsText = cutArray('const MATRIX_COMBAT_SPECS', '];');
const specs = new Function(`return ${specsText};`)();
// 2. excludedG1
const exclText = cutArray('const excludedG1 = new Set(', ']);');
const excluded = new Function(`return ${exclText};`)();

if (specs.length !== 36) throw new Error(`oczekiwano 36 specyfikacji, jest ${specs.length}`);
if (excluded.length !== 7) throw new Error(`oczekiwano 7 wykluczen G1, jest ${excluded.length}`);

const specsDoc = {
  meta: {
    zrodlo_web: {
      plik: 'gra/src/game/civ-bonuses.ts',
      pin: 'edb8fb56',
      matrix_combat_specs: `linie ${lineOf('const MATRIX_COMBAT_SPECS')}-${lineOf("['walka_ruch_piechota_teren_plytkie_morze'")}`,
      excluded_g1: `linia ${lineOf('const excludedG1')}`,
      petla_ruchu: `od linii ${lineOf("for (const id of ['walka_ruch_bitwa_proc'")}`,
      koszt_rekrutacji: `linie ${lineOf("const recruitment = civMatrixParam")}-${lineOf("const recruitment = civMatrixParam") + 1}`,
    },
    opis:
      'Edytowalna tabela generowania wpisow bonusow walki z macierzy cywilizacji (civMatrixBonusyForCivKey). Kolejnosc wierszy = kolejnosc wyniku. Zmiana wiersza nie wymaga zmiany kodu ani testu ksztaltu.',
  },
  etykiety: {
    opis_prefiks: 'Matrix:',
    realizuje_walka: 'walka',
    realizuje_ekonomia: 'ekonomia',
    typ_walka: 'bonus_walka',
  },
  spec_walka: specs.map(([id, typ, cel]) => ({ id, typ, cel })),
  wykluczone_g1: excluded,
  parametry_dodatkowe: [
    { id: 'walka_ruch_bitwa_proc', cel_domyslne: 'piechota', wyjatki_civ: [{ civ_key: 'egipt', cel: 'rydwany' }] },
    { id: 'walka_ruch_rydwany', cel_domyslne: 'rydwany', wyjatki_civ: [] },
    { id: 'walka_zasieg_proc', cel_domyslne: 'wszystko', wyjatki_civ: [] },
    { id: 'walka_oblezenie_proc', cel_domyslne: 'wszystko', wyjatki_civ: [] },
  ],
  koszt_rekrutacji: {
    id: 'walka_koszt_rekrutacji_proc',
    typ: 'koszt_redukcja',
    cel: 'jednostki',
  },
};

const rulesDoc = {
  meta: {
    zrodlo_web: {
      plik: 'gra/src/game/civ-bonuses.ts',
      pin: 'edb8fb56',
      applyWalkBonus: `od linii ${lineOf('function applyWalkBonus')}`,
      bonusApplies: `od linii ${lineOf('export function bonusApplies')}`,
      matchingMatrixSum: `linia ${lineOf('function matchingMatrixSum')}`,
      civBuildingCostDiscount: `od linii ${lineOf('export function civBuildingCostDiscount')}`,
    },
    opis:
      'Edytowalne reguly routingu parametrow macierzy do statystyk, warunki kontekstu oraz stale znizki kosztu budynkow. Kolejnosc wierszy "statystyki" jest znaczaca tylko dla czytelnosci (reguly sa addytywne, nie wykluczajace sie).',
  },
  pomijane: {
    prefiksy: ['walka_ruch_'],
    id: ['walka_zasieg_proc', 'walka_oblezenie_proc'],
  },
  statystyki: [
    { prefiks: 'walka_atak_', stat: 'atk', wyklucz_fragment: null },
    { prefiks: 'walka_obrona_', stat: 'obrona', wyklucz_fragment: '_w_murze' },
    { prefiks: 'walka_pancerz_', stat: 'pancerz', wyklucz_fragment: null },
    { prefiks: 'walka_uderzenie_', stat: 'uderzenie', wyklucz_fragment: null },
    { prefiks: 'walka_dystans_', stat: 'rangedAtk', wyklucz_fragment: null },
    { prefiks: 'walka_hp_', stat: 'health', wyklucz_fragment: null },
  ],
  warunki_kontekstu: {
    terytorium_wlasne_id: ['walka_atak_piechota_terytorium_wlasne', 'walka_obrona_piechota_terytorium_wlasne'],
    fragment_mur: '_w_murze',
    fragment_las: '_teren_las',
    fragment_plytkie_morze: '_teren_plytkie_morze',
    fragment_runda_szarzy: '_runda_szarzy',
  },
  grupy_mnoznikow: {
    ruch: ['walka_ruch_bitwa_proc', 'walka_ruch_rydwany', 'walka_ruch_piechota_teren_plytkie_morze'],
    zasieg: ['walka_zasieg_proc', 'walka_dystans_rydwany'],
    oblezenie: ['walka_oblezenie_proc'],
    mur: ['walka_obrona_piechota_w_murze'],
  },
  koszt_budynkow: {
    typ: 'koszt_redukcja',
    cel: 'budynki',
    realizuje: 'miasto',
    max_znizka: 0.75,
    min_koszt: 1,
  },
};

writeFileSync(join(outDir, 'civ-bonus-matrix-specs.json'), JSON.stringify(specsDoc, null, 2) + '\n');
writeFileSync(join(outDir, 'civ-bonus-rules.json'), JSON.stringify(rulesDoc, null, 2) + '\n');

// 3. City names: stale z city-names-pool.ts
const poolSrc = readFileSync(join(webRoot, 'gra/src/game/city-names-pool.ts'), 'utf8');
const poolLines = poolSrc.split('\n');
const pl = (needle) => poolLines.findIndex((l) => l.includes(needle)) + 1;
const num = (name) => {
  const m = poolSrc.match(new RegExp(`export const ${name} = (\\d+);`));
  if (!m) throw new Error(`brak stalej ${name}`);
  return Number(m[1]);
};
const romanMatch = poolSrc.match(/const roman = (\[[^\]]*\]);/);
if (!romanMatch) throw new Error('brak tablicy roman');
const roman = new Function(`return ${romanMatch[1]};`)();

const namesDoc = {
  meta: {
    zrodlo_web: {
      plik: 'gra/src/game/city-names-pool.ts',
      pin: 'edb8fb56',
      dlugosc_regularna: `linia ${pl('export const CITY_NAMES_POOL_REGULAR_LEN')}`,
      dlugosc_panstwa: `linia ${pl('export const CITY_NAMES_POOL_STATE_LEN')}`,
      rzymskie: `linia ${pl('const roman = ')}`,
      fallbacki: `linie ${pl("pickNextCityName(pools, ikonaId, usedNames, 'Stolica')")}, ${pl('const fallback = `Rywal')}, ${pl("fallback = 'Miasto'")}`,
    },
    opis:
      'Edytowalne stale pul nazw miast: dlugosci puli, sufiksy rzymskie przy wyczerpaniu puli oraz teksty zastepcze. COMMON_LEN = regularna + panstwa; NAZWY_KLASTRA_LEN = panstwa.',
  },
  dlugosc_regularna: num('CITY_NAMES_POOL_REGULAR_LEN'),
  dlugosc_panstwa: num('CITY_NAMES_POOL_STATE_LEN'),
  rzymskie: roman,
  fallback_stolica: 'Stolica',
  fallback_miasto: 'Miasto',
  fallback_rywal_prefiks: 'Rywal ',
};
writeFileSync(join(outDir, 'civ-bonus-city-names.json'), JSON.stringify(namesDoc, null, 2) + '\n');

// 4. Tabela dekompozycji NFD (odpowiednik stripDiacritics: NFD + usuniecie U+0300-U+036F).
// Zakres: cala BMP od U+00C0 (bez surogatow i sylab Hangul).
const diac = {};
// Cala BMP od U+00C0 z pominieciem surogatow i sylab Hangul (dekompozycja algorytmiczna).
for (let cp = 0x00c0; cp <= 0xffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  if (cp >= 0xac00 && cp <= 0xd7a3) continue;
  const ch = String.fromCodePoint(cp);
  const stripped = ch.normalize('NFD').replace(/[\u0300-\u036F]/g, '');
  if (stripped !== ch) diac[ch] = stripped;
}
const diacDoc = {
  meta: {
    zrodlo_web: {
      plik: 'gra/src/game/civ-bonuses.ts',
      pin: 'edb8fb56',
      stripDiacritics: `od linii ${lineOf('function stripDiacritics')}`,
    },
    opis:
      'Tabela znak -> znak bazowy po NFD z usunieciem znakow laczacych U+0300-U+036F (stripDiacritics weba). Wygenerowana z Node (String.prototype.normalize) dla calej BMP od U+00C0 z pominieciem surogatow i sylab Hangul (U+AC00-U+D7A3, dekompozycja algorytmiczna - poza domena, NIE_ZMIERZONO) oraz plaszczyzn astralnych (poza domena). UWAGA: "ł" NIE dekomponuje sie w NFD i zostaje "ł" - to zachowanie weba, wiec "łucznik" NIE zawiera "lucz".',
    zakresy: ['U+00C0-U+FFFF bez U+D800-U+DFFF i U+AC00-U+D7A3'],
  },
  mapa: diac,
};
const diacMeta = JSON.stringify(diacDoc.meta, null, 2).replace(/\n/g, '\n  ');
const diacLines = Object.entries(diac).map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`);
writeFileSync(join(outDir, 'civ-bonus-diacritics.json'), `{\n  "meta": ${diacMeta},\n  "mapa": {\n${diacLines.join(',\n')}\n  }\n}\n`);
console.log(`OK specs=${specs.length} excluded=${excluded.length} roman=${roman.length} diacritics=${Object.keys(diac).length}`);
