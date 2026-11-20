// R-WEB-DIPLO-WAR-LEVEL-SETTING-IMPL-Q1 — ustawienie nowej gry „Dyplomacja i wojna”.
// Poziomy (decyzja właściciela 2026-11-19): ŁATWA (= dziś: kary ×1, bonusy ×1, domyślny) /
// NORMALNA (kary ×2, bonusy ÷2) / TRUDNA (kary ×3, bonusy ÷3).
// Zasada: mnożniki działają na OBECNYCH współczynnikach gry (wartości bazowe w JSON bez zmian).
// Progi, klamry-progowe (poza granicą napięcia), wartości startowe, ceny w PN, czasy i wagi
// zmęczenia wojną NIE są skalowane (zob. dyspozycje/analizy/NASTAWIENIE-SWIATA-PARAMETRY-UJEMNE.md §4).
//
// Moduł jest CZYSTY (bez importów z gry poza typami) — może być importowany z diplomacy.ts bez cyklu.
// Stan poziomu ustawiany przy starcie/wczytaniu gry (main.ts, applyMenuParams / load); domyślnie 'latwa'.

export type DiplomacyWarLevel = 'latwa' | 'normalna' | 'trudna';

export const DIPLOMACY_WAR_LEVELS: readonly DiplomacyWarLevel[] = ['latwa', 'normalna', 'trudna'];

export const DIPLOMACY_WAR_LEVEL_DEFAULT: DiplomacyWarLevel = 'latwa';

/** Mnożnik poziomu: kary ×k, bonusy ÷k. ŁATWA = 1 (bit-w-bit jak dziś). */
export const DIPLOMACY_WAR_LEVEL_MULT: Record<DiplomacyWarLevel, number> = {
  latwa: 1,
  normalna: 2,
  trudna: 3,
};

/** Normalizacja pola z kreatora/zapisu: brak, null, zła wartość = 'latwa' (stare zapisy). */
export function normalizeDiplomacyWarLevel(raw: unknown): DiplomacyWarLevel {
  return raw === 'normalna' || raw === 'trudna' ? raw : DIPLOMACY_WAR_LEVEL_DEFAULT;
}

let activeLevel: DiplomacyWarLevel = DIPLOMACY_WAR_LEVEL_DEFAULT;

export function setDiplomacyWarLevel(raw: unknown): void {
  activeLevel = normalizeDiplomacyWarLevel(raw);
}

export function getDiplomacyWarLevel(): DiplomacyWarLevel {
  return activeLevel;
}

/** Mnożnik kar dla poziomu (1 / 2 / 3). */
export function diplomacyPenaltyMult(level: DiplomacyWarLevel = activeLevel): number {
  return DIPLOMACY_WAR_LEVEL_MULT[level];
}

/** Dzielnik bonusów dla poziomu (1 / 2 / 3). */
export function diplomacyBonusDivisor(level: DiplomacyWarLevel = activeLevel): number {
  return DIPLOMACY_WAR_LEVEL_MULT[level];
}

/** Kara (wartość ujemna lub wielkość kary) × mnożnik poziomu. Znak zostaje. */
export function scalePenaltyForWarLevel(value: number, level: DiplomacyWarLevel = activeLevel): number {
  const k = diplomacyPenaltyMult(level);
  return k === 1 ? value : value * k;
}

/** Bonus × 1/dzielnik poziomu. */
export function scaleBonusForWarLevel(value: number, level: DiplomacyWarLevel = activeLevel): number {
  const k = diplomacyBonusDivisor(level);
  return k === 1 ? value : value / k;
}

/**
 * Klucze DiplomacyParams (data/diplomacy.json, params) traktowane jako KARY — mnożone ×k.
 * Zgodne z analizą §2.1–2.5 (sąsiedztwo, zaufanie, respekt, wiarygodność N1–N7, klamry oceny
 * sojuszu, przemarsz). Startowe zaufanie (roznicaKulturowa, rywalizacjaTenSamTyp) — NIE (ABC 4).
 */
export const DIPLO_WAR_PENALTY_KEYS: readonly string[] = [
  'ekspansjaGranica_zaufanie_perTura',
  'ekspansjaGranicaBraz_zaufanie_perTura',
  'ekspansjaGranicaZelazo_zaufanie_perTura',
  'zlamanaPaktGracz_zaufanie',
  'zlamanaPaktAI_zaufanie',
  'zdrada_zaufanie',
  'szpiegWykryty_zaufanie',
  'slabszyMilitarnie_respekt',
  'urazyHistoryczne_zaufanie_perTura',
  'karaPrzemarszNieautoryzowany_zaufanie_perTura',
  'wiarygodnoscN1BezOstrzezenia',
  'wiarygodnoscN2ZlamaniePaktuNap',
  'wiarygodnoscN2ZlamaniePaktuSojusz',
  'wiarygodnoscN3AtakWOknieKarencji',
  'wiarygodnoscN4OdmowaObowiazkuSojuszu',
  'wiarygodnoscN5ZerwanieTraktatCzasowy',
  'wiarygodnoscN5ZerwanieHandelCzasowy',
  'wiarygodnoscN6NiedotrzymanieHandluCyklicznego',
  'wiarygodnoscN7NieautoryzowanyPrzemarsz',
  // klamry ocen sojuszu (mnożone razem z karą, ABC/§5.2)
  'progSojuszKaraSilniejszyMax',
  'progSojuszKaraMilSkok',
  'progSojuszKaraAllySkok',
];

/**
 * Klucze DiplomacyParams traktowane jako BONUSY — dzielone ÷k (§3.1–3.3).
 * Progi, czas (karencja, zapominanie), ceny PN i sufit wartości NIE są tu.
 * `pn_na_zaufanie` (dzielnik PN) jest mnożony ×k w diplomacy-tick-war-brake (osobna ścieżka).
 */
export const DIPLO_WAR_BONUS_KEYS: readonly string[] = [
  'handelZawarcie_zaufanie',
  'pomocSojusznikowi_zaufanie',
  'wspolnyWrogNawiazanie_zaufanie',
  'dar_zaufanie',
  'handel_zaufanie_perTura',
  'sojusz_zaufanie_perTura',
  'nap_zaufanie_perTura',
  'pokoj_zaufanie_perTura',
  'aktywnyPakt_zaufanie_perTura',
  'dobraWola_zaufanie_perTura',
  'wspolnyWrog_zaufanie_perTura',
  'rozejm_zaufanie_ustawienie',
  'pokoj_zaufanie_ustawienie',
  'przewagaMilitarna_respekt',
  'wygraBitwa_respekt',
  'trybut_respekt',
  'wspolnyWrogAkceptacja_respekt',
  'wiarygodnoscS1SojuszPerTure',
  'wiarygodnoscS2NapPerTure',
  'wiarygodnoscS3HandelPerTureLatwy',
  'wiarygodnoscS3HandelPerTureNormalny',
  'wiarygodnoscS3HandelPerTureTrudny',
  'wiarygodnoscS4PrzemarszPerTureLatwy',
  'wiarygodnoscS4PrzemarszPerTureNormalny',
  'wiarygodnoscS4PrzemarszPerTureTrudny',
  'wiarygodnoscP1FiniszSojusz',
  'wiarygodnoscP2FiniszNap',
  'wiarygodnoscP2FiniszHandel',
  'wiarygodnoscP3FiniszHandelCykliczny',
  'wiarygodnoscP5PomocSojusznikowi',
  'progSojuszPremiaSilniejszyMax',
  'progSojuszPremiaMilSkok',
  'progSojuszPremiaRespektSkok',
  'progSojuszPremiaSilniejszyInny',
  'progSojuszPremiaGracz2xBonus',
  'progSojuszPremiaGracz3xBonus',
];

/**
 * Skaluje słownik parametrów poziomem: klucze z DIPLO_WAR_PENALTY_KEYS ×k, z DIPLO_WAR_BONUS_KEYS ÷k.
 * Dla ŁATWEJ zwraca kopię bez zmian (k = 1). Nie mutuje wejścia.
 */
export function scaleDiplomacyParamsForWarLevel<T extends object>(
  base: T,
  level: DiplomacyWarLevel = activeLevel,
): T {
  const out = { ...base } as Record<string, unknown>;
  if (level === 'latwa') return out as T;
  const src = base as unknown as Record<string, unknown>;
  for (const k of DIPLO_WAR_PENALTY_KEYS) {
    const v = src[k];
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = scalePenaltyForWarLevel(v, level);
  }
  for (const k of DIPLO_WAR_BONUS_KEYS) {
    const v = src[k];
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = scaleBonusForWarLevel(v, level);
  }
  return out as T;
}

/**
 * Parametry 'twardszej dyplomacji' (data/diplomacy-harder-params.json): przyrost i klamra napięcia
 * granicznego oraz zazdrość — KARY ×k. Mnożnik działa PRZED klamrą i PO niej (klamra też ×k,
 * ABC 5a: −6 → −12 / −18). Progi (`zazdroscProgPrzewagi`, `handelSufitZaufania`) — bez zmian.
 */
export const DIPLO_WAR_HARDER_PENALTY_KEYS: readonly string[] = [
  'granicaPrzyrost',
  'granicaMax',
  'zazdroscNaTure',
  'zazdroscNaTureDuza',
];

export function scaleHarderParamsForWarLevel<T extends object>(
  base: T,
  level: DiplomacyWarLevel = activeLevel,
): T {
  const out = { ...base } as Record<string, unknown>;
  if (level === 'latwa') return out as T;
  const src = base as unknown as Record<string, unknown>;
  for (const k of DIPLO_WAR_HARDER_PENALTY_KEYS) {
    const v = src[k];
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = scalePenaltyForWarLevel(v, level);
  }
  return out as T;
}

/**
 * Wpływ na nastawienie wobec agresora (data/diplomacy-aggressor-params.json, wplywNaAI):
 * relacjaDeltaSojusz (dodatni = próg wyżej) — kara ×k; willingnessAllyMnoznik (<1 = kara) —
 * przeliczenie 1 − (1 − x)·k (ABC 5b; zwykłe ×k dałoby bonus przy x<1).
 */
export function scaleAggressorDeltaForWarLevel(delta: number, level: DiplomacyWarLevel = activeLevel): number {
  return scalePenaltyForWarLevel(delta, level);
}

export function scaleWillingnessAllyForWarLevel(x: number, level: DiplomacyWarLevel = activeLevel): number {
  const k = diplomacyPenaltyMult(level);
  if (k === 1) return x;
  return Math.max(0, Math.min(1, 1 - (1 - x) * k));
}
