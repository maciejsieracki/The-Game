// P6.7A: generator tabel data/derived/wzrost-ludnosci-params.json i data/derived/era-diakrytyki.json
// ze stalych URUCHOMIONEGO weba (pin edb8fb56). Literaly, ktore w webie NIE sa eksportami
// (np. `6 - population`, `/ 10`, `Math.min(14, ...)`), sa wpisane recznie z numerem linii zrodla
// i sprawdzane przez wektory (gen-p67a-vectors.mjs) oraz weryfikator Python.
//
// Uruchomienie (Node 22):
//   node --experimental-transform-types --no-warnings --import ./p67a-loader-register.mjs \
//        ./gen-p67a-params.mjs <WEB_ROOT = katalog z gra/src> <KATALOG_WYJSCIA = rust-port/engine/data/derived>
import { writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;

await import(src('game/cities.ts')); // kolejnosc ladowania: cities.ts najpierw (cykl importow weba)
const PG = await import(src('game/population-growth-v85.ts'));
const EF = await import(src('game/empire-food.ts'));
const PT = await import(src('game/population-growth-tempo.ts'));
const RS = await import(src('game/r-stawki-strojenie.ts'));
const BG = await import(src('game/building-resource-gate.ts'));

const wzrost = Object.entries(PG.WYZYWIENIE_GROWTH_PCT)
  .map(([k, v]) => ({ poziom: Number(k), proc: v }))
  .sort((a, b) => a.poziom - b.poziom);

const rp = PG.buildRationParams({}, 'normal');
const ef = EF.buildEmpireFoodParams({}, 'normal');

const stateI = { ceramikaActive: true, solActive: false, maSpichlerzPop: true, maSpichlerzIIPop: false };
const stateII = { ceramikaActive: true, solActive: true, maSpichlerzPop: false, maSpichlerzIIPop: true };
const stateNone = { ceramikaActive: false, solActive: false, maSpichlerzPop: false, maSpichlerzIIPop: false };

const params = {
  meta: {
    zrodlo_web: [
      'gra/src/game/population-growth-v85.ts',
      'gra/src/game/empire-food.ts',
      'gra/src/game/population-growth-tempo.ts',
      'gra/src/game/r-stawki-strojenie.ts',
      'gra/src/game/building-resource-gate.ts (wejscia: Spichlerz)',
      'gra/src/game/economy.ts (wejscia: cityPopulationCap, resolvePopulationCapMatrixDelta)',
      'gra/src/game/economy-upkeep.ts (wejscie: magazynEraMultiplier)',
    ],
    pin_web: 'edb8fb56',
    wygenerowano: 'R-RUSTPORT-P6-7A-MIASTA-WZROST-A-Q1 runda 1, generator: gen-p67a-params.mjs',
    uwaga:
      'Edytowalna tabela balansu wzrostu ludnosci i zywnosci imperium (P6.7A). Jedyne zrodlo stalych z population-growth-v85.ts / empire-food.ts / population-growth-tempo.ts / r-stawki-strojenie.ts. DEFAULT_POZIOM_RACJI i WYZYWIENIE_MAX NIE sa tu kopiowane: zyja w cities-params.json (sekcja wejscia_z_innych_modulow_weba, P6.6B) i modul czyta je stamtad (jedno zrodlo). Tabela NIE jest porownywana ze wzorem przy buildzie; zgodnosc z webem sprawdzaja wektory tests/p6_7a_vectors.',
  },
  wyzywienie: {
    zrodlo: 'population-growth-v85.ts:27 (WYZYWIENIE_MIN), :44 (WYZYWIENIE_STEP), :53-67 (WYZYWIENIE_GROWTH_PCT)',
    min: PG.WYZYWIENIE_MIN,
    krok: PG.WYZYWIENIE_STEP,
    wzrost_proc: wzrost,
  },
  skladniki_wzrostu: {
    zrodlo: 'population-growth-v85.ts:254-271 (computeGrowthPercentV85)',
    male_miasto_prog: 6, // :256 Math.max(0, 6 - input.population)
    zdrowie_na_punkt: 10, // :259 Math.floor(Math.max(0, input.zdrowie) / 10)
    szczescie_na_punkt: 10, // :263 Math.floor(Math.max(0, input.szczescieNetto) / 10)
    cywilizacja_skala: 100, // :266 Math.round(civRaw * civDifficultyMult * 100) (ulamek -> punkty procentowe)
  },
  trudnosc_mnoznik_macierzy: {
    zrodlo: 'population-growth-v85.ts:92-96 (CIV_MATRIX_GROWTH_DIFFICULTY_MULT)',
    easy: PG.CIV_MATRIX_GROWTH_DIFFICULTY_MULT.easy,
    normal: PG.CIV_MATRIX_GROWTH_DIFFICULTY_MULT.normal,
    hard: PG.CIV_MATRIX_GROWTH_DIFFICULTY_MULT.hard,
  },
  limit_populacji: {
    zrodlo: 'economy.ts:1156-1166 (cityPopulationCap / resolvePopulationCapMatrixDelta) - wejscie z innej grupy',
    twardy_max: 14, // economy.ts:1159 Math.min(14, buildingCap + safeDelta)
    dozwolone_delta: [-1, 0, 1, 2], // economy.ts:1156,1165
  },
  spichlerz: {
    zrodlo: 'building-resource-gate.ts:362-364,434-446,502-503 - wejscie z innej grupy',
    id_i: 'spichlerz',
    id_ii: 'spichlerz_ii',
    id_akwedukt: 'akwedukt', // population-growth-v85.ts:493
    id_magazyn: 'magazyn', // empire-food.ts:150
    wzrost_proc_tier_i: BG.spichlerzGrowthBonusPercent(stateI),
    wzrost_proc_tier_ii: BG.spichlerzGrowthBonusPercent(stateII),
    wzrost_proc_brak: BG.spichlerzGrowthBonusPercent(stateNone),
    mnoznik_kosztu_racji_tier_i: BG.spichlerzRationFoodCostMultiplier(stateI),
    mnoznik_kosztu_racji_tier_ii: BG.spichlerzRationFoodCostMultiplier(stateII),
    mnoznik_kosztu_racji_brak: BG.spichlerzRationFoodCostMultiplier(stateNone),
    cap_imperium_tier_i: BG.SPICHLERZ_EMPIRE_CAP_I,
    cap_imperium_tier_ii: BG.SPICHLERZ_EMPIRE_CAP_II_FULL,
  },
  magazyn_era: {
    zrodlo: 'economy-upkeep.ts:392-395 (magazynEraMultiplier) - wejscie z innej grupy',
    podstawa: 2, // Math.pow(2, e - 1)
    epoka_min: 1, // e > 1 ? e : 1
  },
  racje_domyslne_deprecated: {
    zrodlo: 'population-growth-v85.ts:141-158 (buildRationParams, @deprecated)',
    zywnosc: [rp.racjeZywnosc1, rp.racjeZywnosc2, rp.racjeZywnosc3],
    wzrost_proc: [rp.racjeWzrostProc1, rp.racjeWzrostProc2, rp.racjeWzrostProc3],
  },
  empire_food_domyslne: {
    zrodlo: 'empire-food.ts:106-134 (buildEmpireFoodParams - wartosci zapasowe pick())',
    centralny_cap_baza: ef.centralCapBaza,
    centralny_cap_bonus_magazyn: ef.centralCapBonusMagazyn,
    glod_hp_frac: ef.glodWojskaHpFrac,
    glod_karencja_tur: ef.glodWojskaKarencjaTur,
    glod_stat_mult: ef.glodWojskaStatMult,
  },
  migracja_racji_legacy: {
    zrodlo: 'population-growth-v85.ts:171-176 (migrateLegacyRationLevel)',
    wiersze: [1, 2, 3].map((s) => ({ stary: s, nowy: PG.migrateLegacyRationLevel(s) })),
  },
  tempo_wzrostu: {
    zrodlo: 'population-growth-tempo.ts:21-41 (WZROST_LUDNOSCI_PACE, applyGrowthThresholdPace)',
    wysoki: PT.WZROST_LUDNOSCI_PACE.wysoki,
    normalny: PT.WZROST_LUDNOSCI_PACE.normalny,
    wolny: PT.WZROST_LUDNOSCI_PACE.wolny,
    prog_min: 1, // population-growth-tempo.ts:40 Math.max(1, Math.round(...))
  },
  r_stawki: {
    zrodlo: 'r-stawki-strojenie.ts:6-12,37-64',
    koszt_mult: RS.R_STAWKI_KOSZT_MULT,
    fala2_mult: RS.R_STAWKI_FALA2_MULT,
    min_wartosc: 1, // r-stawki-strojenie.ts:43,52,58 Math.max(1, Math.round(v * R_STAWKI_FALA2_MULT))
  },
  epoki_badan: {
    zrodlo: 'r-stawki-strojenie.ts:15-33 (stripDiacriticsLower, normalizeResearchEra, isResearchEraFala2Extra)',
    domyslna: 'kamien',
    aliasy: [
      { kanon: 'braz', warianty: ['braz', 'brąz'] },
      { kanon: 'zelazo', warianty: ['zelazo', 'żelazo'] },
      { kanon: 'kamien', warianty: ['kamien', 'kamień'] },
    ],
    fala2_extra: ['braz', 'zelazo'],
  },
};

// sanity: wartosci zapisane recznie musza zgadzac sie z webem tam, gdzie web je eksportuje
if (RS.R_STAWKI_FALA1_FALA2_MULT !== params.r_stawki.koszt_mult * params.r_stawki.fala2_mult) {
  throw new Error('R_STAWKI_FALA1_FALA2_MULT != koszt_mult * fala2_mult');
}
if (EF.WYZYWIENIE_POZIOM_NA_LIMICIE !== wzrost.find((w) => w.proc >= 0).poziom) {
  throw new Error('WYZYWIENIE_POZIOM_NA_LIMICIE nie wynika z tabeli');
}

writeFileSync(join(outDir, 'wzrost-ludnosci-params.json'), JSON.stringify(params, null, 2) + '\n');

// --- era-diakrytyki.json: rozklad NFD (poza sylabami Hangul) potrzebny dla normalizeResearchEra ---
const rows = [];
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  if (cp >= 0xac00 && cp <= 0xd7a3) continue; // Hangul: algorytm w kodzie (stale Unicode ch. 3.12)
  const ch = String.fromCodePoint(cp);
  const out = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (out !== ch) rows.push([cp, out]);
}
const diac = {
  meta: {
    zrodlo_web: 'gra/src/game/r-stawki-strojenie.ts:15-17 (stripDiacriticsLower)',
    pin_web: 'edb8fb56',
    wygenerowano: 'R-RUSTPORT-P6-7A-MIASTA-WZROST-A-Q1 runda 1, generator: gen-p67a-params.mjs (Node ' + process.version + ', Unicode ICU ' + process.versions.unicode + ')',
    uwaga:
      'Tabela: punkt kodowy -> tekst po s.normalize("NFD").replace(/[\\u0300-\\u036f]/g, ""). Pomijane sylaby Hangul U+AC00..U+D7A3 (algorytmiczny rozklad w kodzie) i znaki bez zmiany. Nie modeluje kanonicznej zmiany kolejnosci znakow laczacych POZA zakresem 0300-036F (NIE_ZMIERZONO dla takich wejsc).',
  },
  wiersze: rows,
};
writeFileSync(join(outDir, 'era-diakrytyki.json'), JSON.stringify(diac) + '\n');
console.log('OK', rows.length, 'rozkladow');
