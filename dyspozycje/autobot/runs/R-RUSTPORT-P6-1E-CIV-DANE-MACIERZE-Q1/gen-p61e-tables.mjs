// Generator tabel P6.1E (data/derived/civ-matrix-semantic.json, civ-matrix-params.json) z
// URUCHOMIONEGO kodu weba (pin edb8fb56). Teksty i zbiory sa WYCIAGANE z dzialajacego modulu:
//  - stale niewyeksportowane (PROVEN_CONSUMERS, REAL_GAMEPLAY, ...) przez KOPIE pliku
//    civ-matrix-semantic.ts z JEDNYM dopisanym eksportem (oryginal w WEB_ROOT nietkniety);
//  - teksty statusow/powodow/trudnosci przez sondowanie classifyCivMatrixCell z nadpisanym
//    consumerStatus (zadnego przepisywania recznego);
//  - slownik etykiet z literalu `replacements` (regex na zrodle TS, eval literalu).
//
// Uruchomienie:
//   node --experimental-transform-types --import ./p61e-loader-register.mjs ./gen-p61e-tables.mjs <WEB_ROOT> <OUT_DERIVED_DIR>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [webRoot, outDir] = process.argv.slice(2);
if (!webRoot || !outDir) throw new Error('uzycie: gen-p61e-tables.mjs <WEB_ROOT> <OUT_DERIVED_DIR>');

const gameDir = join(webRoot, 'gra/src/game');
const srcPath = join(gameDir, 'civ-matrix-semantic.ts');
const src = readFileSync(srcPath, 'utf8');

// Kopia z jednym dopisanym eksportem (stale modulu sa lokalne, nie-eksportowane).
const tablesCopy = join(gameDir, 'civ-matrix-semantic.tables-p61e.ts');
writeFileSync(
  tablesCopy,
  src +
    '\nexport const __P61E_TABLES = { PROVEN_CONSUMERS, REAL_GAMEPLAY, UI_ONLY, DECISION_REQUIRED, HARMFUL, ' +
    'BLOCKED_COMBAT_MULTIPLIER, DEAD_UNWIRED_COMBAT, NEUTRAL_DOMAINS };\n',
);
const T = await import(pathToFileURL(tablesCopy).href);
const M = await import(pathToFileURL(srcPath).href);
const tables = T.__P61E_TABLES;

const arr = (s) => [...s];
const STATUSES = [
  'REAL_GAMEPLAY', 'UI_ONLY', 'REFERENCE_NEEDS_REVIEW', 'UNWIRED',
  'DEAD_UNWIRED', 'PROPOSAL', 'BLOCKED', 'DECISION_REQUIRED',
];

const probe = (parameterId, consumerStatus, extra = {}) =>
  M.classifyCivMatrixCell({
    parameterId,
    civilizationId: 'civ_probe',
    rawValue: 1,
    baselineValue: 0,
    minValue: 0,
    maxValue: 1,
    consumerStatus,
    ...extra,
  });
const templ = (text, id) => text.split(id).join('{parametr}');

// --- etykiety statusow (niezalezne od parametru)
const etykietyStatusow = {};
for (const s of STATUSES) etykietyStatusow[s] = probe('ai_agresywnosc', s).statusLabelPl;

// --- powody
const NEUTRAL = 'ai_agresywnosc'; // polaryzacja neutral/not-applicable
const BENEF = 'walka_atak_morska'; // beneficial
const powody = {
  REAL_GAMEPLAY: {
    neutralny: probe(NEUTRAL, 'REAL_GAMEPLAY').statusReasonPl,
    pozostale: probe(BENEF, 'REAL_GAMEPLAY').statusReasonPl,
  },
  UI_ONLY: probe(NEUTRAL, 'UI_ONLY').statusReasonPl,
  DEAD_UNWIRED: probe(NEUTRAL, 'DEAD_UNWIRED').statusReasonPl,
  PROPOSAL: probe(NEUTRAL, 'PROPOSAL').statusReasonPl,
  REFERENCE_NEEDS_REVIEW: probe(NEUTRAL, 'REFERENCE_NEEDS_REVIEW').statusReasonPl,
  UNWIRED: {
    domyslny: templ(probe(NEUTRAL, 'UNWIRED').statusReasonPl, NEUTRAL),
    wyjatki: { dip_nastawienie_bazowe: probe('dip_nastawienie_bazowe', 'UNWIRED').statusReasonPl },
  },
  BLOCKED: {
    domyslny: templ(probe(NEUTRAL, 'BLOCKED').statusReasonPl, NEUTRAL),
    grupa_walka_zablokowana: templ(probe('walka_atak_piechota', 'BLOCKED').statusReasonPl, 'walka_atak_piechota'),
  },
  DECISION_REQUIRED: {
    domyslny: templ(probe(NEUTRAL, 'DECISION_REQUIRED').statusReasonPl, NEUTRAL),
    wyjatki: {
      dip_nastawienie_bazowe: probe('dip_nastawienie_bazowe', 'DECISION_REQUIRED').statusReasonPl,
      dip_agresja_archetyp: probe('dip_agresja_archetyp', 'DECISION_REQUIRED').statusReasonPl,
    },
  },
};
// UNWIRED/DEFAULT zawiera tez nazwe parametru -> sprawdz, ze szablon ma {parametr}.
for (const t of [powody.UNWIRED.domyslny, powody.BLOCKED.grupa_walka_zablokowana]) {
  if (!t.includes('{parametr}')) throw new Error('szablon bez {parametr}');
}

// --- blokady danych (wejscie niepoprawne)
const nieznany = M.classifyCivMatrixCell({
  parameterId: 'zzz_probe_param', civilizationId: 'civ_probe', rawValue: 1, baselineValue: 0, minValue: 0, maxValue: 1,
}).statusReasonPl;
const brakWartosci = M.classifyCivMatrixCell({
  parameterId: 'ai_agresywnosc', civilizationId: 'civ_probe', rawValue: null, baselineValue: 0, minValue: 0, maxValue: 1,
}).statusReasonPl;
const blokadaWejscia = {
  nieznany_parametr: templ(nieznany, 'zzz_probe_param'),
  brak_wartosci: brakWartosci.split('civ_probe').join('{cywilizacja}').split('ai_agresywnosc').join('{parametr}'),
};
if (!blokadaWejscia.brak_wartosci.includes('{cywilizacja}/{parametr}')) throw new Error('szablon brak_wartosci');
blokadaWejscia.nieznana_cywilizacja = templ(
  M.buildCivMatrixSemanticProfile('zzz_probe_civ').blockedReasonPl,
  'zzz_probe_civ',
).split('{parametr}').join('{cywilizacja}');
if (!blokadaWejscia.nieznana_cywilizacja.includes('{cywilizacja}')) throw new Error('szablon nieznana_cywilizacja');

// --- zachowanie trudnosci
const diffBehav = {
  bez_roznic_statusy: ['UI_ONLY', 'UNWIRED', 'PROPOSAL', 'BLOCKED', 'DECISION_REQUIRED'],
  bez_roznic_tekst: probe(NEUTRAL, 'UNWIRED').difficultyBehaviorPl,
  wyjatki: { lud_wzrost_proc: probe('lud_wzrost_proc', 'REAL_GAMEPLAY').difficultyBehaviorPl },
  grupa_bez_wzmocnien: {
    parametry: ['lud_spadek_proc', 'lud_zdrowie_proc', 'lud_zadowolenie_bazowe'],
    tekst: probe('lud_spadek_proc', 'REAL_GAMEPLAY').difficultyBehaviorPl,
  },
  prefiks_ai: { prefiks: 'ai_', tekst: probe('ai_agresywnosc', 'REAL_GAMEPLAY').difficultyBehaviorPl },
  domyslny: probe(BENEF, 'REAL_GAMEPLAY').difficultyBehaviorPl,
};
for (const p of diffBehav.grupa_bez_wzmocnien.parametry) {
  if (probe(p, 'REAL_GAMEPLAY').difficultyBehaviorPl !== diffBehav.grupa_bez_wzmocnien.tekst) throw new Error('grupa trudnosci ' + p);
}

// --- slownik etykiet parametrow (literal `replacements` z funkcji civMatrixParameterLabelPl)
const lit = /const replacements: Readonly<Record<string, string>> = (\{[\s\S]*?\n {2}\});/.exec(src);
if (!lit) throw new Error('brak literalu replacements');
const replacements = new Function(`return (${lit[1]});`)();

// --- formatowanie wartosci (teksty stale)
const fmt = {
  brak: M.civMatrixFormattedValue(null, 'x'),
  flag_tak: M.civMatrixFormattedValue(1, 'flag_0_1'),
  flag_nie: M.civMatrixFormattedValue(0, 'flag_0_1'),
};

const semantic = {
  meta: {
    temat: 'R-RUSTPORT-P6-1E-CIV-DANE-MACIERZE-Q1',
    pin_web: 'edb8fb56',
    status:
      'BOOTSTRAP P6.1E: tabele wygenerowane z URUCHOMIONEGO weba (gen-p61e-tables.mjs). Zrodlem prawdy jest TA tabela; test ksztaltu nie pinuje wartosci.',
    zrodlo_web: {
      plik: 'gra/src/game/civ-matrix-semantic.ts',
      wersja: 'linia 11 (CIV_MATRIX_SEMANTIC_VERSION)',
      konsumenci: 'linie 90-129 (PROVEN_CONSUMERS)',
      zbiory: 'linie 131-256 (REAL_GAMEPLAY, UI_ONLY, DECISION_REQUIRED, HARMFUL, BLOCKED_COMBAT_MULTIPLIER, DEAD_UNWIRED_COMBAT)',
      pasma: 'linie 305-323 (civMatrixNeutralBand)',
      teksty: 'linie 338-415 (statusLabel, statusReason, difficultyBehavior, consumerExplanation)',
      slownik_etykiet: 'linie 593-618 (civMatrixParameterLabelPl)',
    },
    uwaga:
      'Statusy REAL_GAMEPLAY/UI_ONLY/... to ADNOTACJE weba o tym, kto konsumuje parametr; NIE opisuja stanu silnika Rust. Edycja zbiorow nie zmienia mechaniki gry.',
  },
  wersja: M.CIV_MATRIX_SEMANTIC_VERSION,
  trudnosc: M.CIV_MATRIX_SEMANTIC_DIFFICULTY,
  baza_porownania: 'normal-median-all-15',
  zrodlo_wartosci: { macierz: 'gra/data/civ-matrix.json', brak: 'missing' },
  nieznane: { wersja_macierzy: 'unknown', domena: 'unknown', jednostka: 'unknown', formula: 'unknown' },
  skala_intensywnosci: { min: -10, max: 10, mnoznik: 10, zaokraglenie: 100 },
  polaryzacja: { korzystna: 'beneficial', szkodliwa: 'harmful', neutralna: 'neutral/not-applicable' },
  etykiety_kierunku: { pozytywny: 'POZYTYWNY', negatywny: 'NEGATYWNY', neutralny: 'NEUTRALNY' },
  polityka_pasm: 'unit-aware-v1',
  pasma_neutralne: {
    reguly: [
      { klucz: 'exact_flag', tolerancja: 0, gdy_formula: ['flag'], gdy_jednostka: ['flag_0_1'] },
      { klucz: 'fraction_0_005', tolerancja: 0.005, gdy_formula: [], gdy_jednostka: ['ulamek', 'ulamek_0_1'] },
      { klucz: 'scale_0_5', tolerancja: 0.5, gdy_formula: [], gdy_jednostka: ['skala_1_10'] },
      { klucz: 'integer_0_5', tolerancja: 0.5, gdy_formula: [], gdy_jednostka: ['integer'] },
      { klucz: 'integer_0_5', tolerancja: 0.5, gdy_formula: ['add', 'stat_abs'], gdy_jednostka: [] },
    ],
    domyslne: { klucz: 'decimal_0_05', tolerancja: 0.05 },
    nieznany_parametr: { klucz: 'exact_flag', tolerancja: 0 },
  },
  zbiory: {
    real_gameplay: arr(tables.REAL_GAMEPLAY),
    ui_only: arr(tables.UI_ONLY),
    decision_required: arr(tables.DECISION_REQUIRED),
    szkodliwe: arr(tables.HARMFUL),
    walka_zablokowana: arr(tables.BLOCKED_COMBAT_MULTIPLIER),
    walka_martwa: arr(tables.DEAD_UNWIRED_COMBAT),
    domeny_neutralne: arr(tables.NEUTRAL_DOMAINS),
    prefiksy_neutralne: ['ai_', 'dip_'],
  },
  etykiety_statusow: etykietyStatusow,
  powody,
  blokada_wejscia: blokadaWejscia,
  zachowanie_trudnosci: diffBehav,
  dowody_konsumentow: tables.PROVEN_CONSUMERS,
  etykieta_parametru: {
    separator_czesci: ' · ',
    sufiks_proc: { koncowka: 'proc', zamiennik: '%' },
    slownik: replacements,
  },
  formatowanie: {
    ...fmt,
    jednostki_ulamek: ['ulamek', 'ulamek_0_1'],
    jednostka_flaga: 'flag_0_1',
    mnoznik_procent: 100,
    cyfry_procent: 1,
    cyfry_wartosc: 3,
  },
};

const params = {
  meta: {
    temat: 'R-RUSTPORT-P6-1E-CIV-DANE-MACIERZE-Q1',
    pin_web: 'edb8fb56',
    status:
      'BOOTSTRAP P6.1E: stale balansowe/strukturalne civ-matrix.ts, civ-ai-data.ts, civ-roster.ts, civ-names.ts przepisane z weba (wartosci zweryfikowane regexem w verify-p61e-web-vectors.py). Zrodlem prawdy jest TA tabela.',
    zrodlo_web: {
      trudnosc: 'gra/src/game/civ-matrix.ts:77-79',
      formula_domyslna: 'gra/src/game/civ-matrix.ts:112,118',
      ai_dane: 'gra/src/game/civ-ai-data.ts:49,53,66-68,91-100,138,169,176,192,196,207,213,217',
      roster: 'gra/src/game/civ-roster.ts:72,160,171',
      nazwy: 'gra/src/game/civ-names.ts:32',
    },
  },
  trudnosc: { formula_skalowana: 'skala', delta_latwy: -1, delta_trudny: 1, min: 1, max: 10 },
  formula_domyslna: 'mul_proc',
  nazwy: { miasta_cywilizacji_len: 100 },
  roster: { przesuniecie_ziarna_tasowania_ai: 7919, awaryjny_typ: 'grecy', min_typow: 1 },
  ai: {
    parametry: {
      agresywnosc: 'ai_agresywnosc',
      ekspansywnosc: 'ai_ekspansywnosc',
      priorytet_militarny: 'ai_priorytet_militarny',
      priorytet_ekonomia: 'ai_priorytet_ekonomia',
      priorytet_nauka: 'ai_priorytet_nauka',
      tolerancja_ryzyka: 'ai_tolerancja_ryzyka',
      sklonnosc_podboju: 'ai_sklonnosc_podboju',
      profil_obronna: 'ai_profil_obronna',
    },
    domyslna_wartosc_skali: 5,
    dzielnik_skali: 10,
    zakres: { min: 0, max: 1 },
    profil_obronna_wartosc: 1,
    profil_mapy_obronna: 'kopia_typu_obronna',
    profil_mapy_standardowa: 'standardowa',
  },
  dyplomacja: {
    parametr_handel: 'dip_handlowosc_archetyp',
    dzielnik_otwartosc_handel: 10,
    parametr_nastawienie: 'dip_nastawienie_bazowe',
    nastawienie_baza_domyslna: 50,
    nastawienie_podzial: 2,
  },
  typ_bez_nazwy_excel: 'drobna_cywilizacja',
};

writeFileSync(join(outDir, 'civ-matrix-semantic.json'), JSON.stringify(semantic, null, 2) + '\n');
writeFileSync(join(outDir, 'civ-matrix-params.json'), JSON.stringify(params, null, 2) + '\n');
console.log(
  `OK real=${semantic.zbiory.real_gameplay.length} ui=${semantic.zbiory.ui_only.length} dec=${semantic.zbiory.decision_required.length} ` +
    `harm=${semantic.zbiory.szkodliwe.length} blk=${semantic.zbiory.walka_zablokowana.length} dead=${semantic.zbiory.walka_martwa.length} ` +
    `dowody=${Object.keys(semantic.dowody_konsumentow).length} slownik=${Object.keys(replacements).length}`,
);
