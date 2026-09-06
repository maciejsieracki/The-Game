/**
 * conquest-stability.ts
 * Utrzymanie podbitego miasta: obca kultura + obca religia → kary, garnizon, konwersja.
 * PURE — bez main.ts; silnik wywołuje tick + onCapture z pętli tury / post-battle-map.
 */
import {
  convertCulture,
  convertViaTemple,
  type CultureBuildings,
  type CultureCity,
  type CultureParams,
  type ReligionBuildings,
  type ReligionParams,
  type ReligionState,
  type SocietyParamsLike,
} from './culture-religion';
import type { Difficulty } from './order';
import { sameCultureCircle } from './diplomacy-display';
import { clearCityCultureMix } from './society-inputs';

/** Udział własnej kultury < 50% — obca kultura dominuje. */
export function isForeignCultureDominant(ownCultureShare: number): boolean {
  return ownCultureShare < 0.5;
}

/** Obca kultura + obca dominująca religia — miasto trudne do utrzymania. */
export function isConquestUnstable(
  ownCultureShare: number,
  foreignReligionDominant: boolean,
): boolean {
  return isForeignCultureDominant(ownCultureShare) && foreignReligionDominant;
}

export interface CityCaptureCultureOpts {
  /** Np. civKeyForOwnerId z silnika — do sprawdzenia tego samego okręgu kulturowego. */
  civKeyForOwner?: (ownerId: number) => string;
}

/** Po podboju: mix kultury (KULT-PRESJA-05) — ten sam okręg = pełna zgodność (100%). */
export function onCityCapturedCulture(
  city: { ownCultureShare?: number; kulturaOwnShare?: number },
  newOwnerId?: number,
  previousOwnerId?: number,
  opts?: CityCaptureCultureOpts,
): void {
  if (newOwnerId === undefined || previousOwnerId === undefined || newOwnerId === previousOwnerId) {
    return;
  }
  const civKey = opts?.civKeyForOwner;
  if (civKey && sameCultureCircle(civKey(newOwnerId), civKey(previousOwnerId))) {
    clearCityCultureMix(city);
    return;
  }
  const prev = Math.max(0, Math.min(1, city.ownCultureShare ?? city.kulturaOwnShare ?? 1));
  city.ownCultureShare = Math.max(0, Math.min(1, 1 - prev));
  city.kulturaOwnShare = city.ownCultureShare;
}

/**
 * Budynki KULTURALNE → bonus konwersji kultury (%/turę).
 * Świątynia / Kamienne kręgi NIE wchodzą (B-KULT-REL split).
 */
export function cultureBuildingsFromIds(builtIds: readonly string[]): CultureBuildings {
  return {
    hasAmfiteatr: builtIds.includes('teatr') || builtIds.includes('akademia'),
    hasBiblioteka: builtIds.includes('biblioteka'),
    hasPalac: builtIds.includes('palac')
      || builtIds.includes('palac_ii')
      || builtIds.includes('palac_iii'),
    hasStela: builtIds.includes('stela'),
    hasSad: builtIds.includes('sad'),
    hasLaznia: builtIds.includes('laznia_publiczna'),
  };
}

/** Budynki RELIGIJNE → bonus konwersji religii (%/turę). */
export function religionBuildingsFromIds(builtIds: readonly string[]): ReligionBuildings {
  return {
    hasSwiatynia: builtIds.includes('swiatynia'),
    hasKamienneKregi: builtIds.includes('kamienne_kregi'),
  };
}

export interface CultureReligionTickResult {
  ownCultureShare: number;
  religionState: ReligionState;
  cultureRateApplied: number;
  religionConverted: number;
}

/**
 * Jedna tura konwersji kultury i religii w podbitym / mieszanym mieście.
 * Wywołać PRZED cultureHappiness / religionHappiness w pętli tury.
 */
export function tickCityCultureReligion(
  ownCultureShare: number,
  religionState: ReligionState,
  builtIds: readonly string[],
  ownerReligion: string | null,
  foreignReligionDominant: boolean,
  cultureParams: CultureParams,
  religionParams: ReligionParams,
): CultureReligionTickResult {
  let share = ownCultureShare;
  let rel = religionState;

  if (share < 1) {
    const cc: CultureCity = { kulturaSkumulowana: 0, ownCultureShare: share };
    const conv = convertCulture(cc, cultureBuildingsFromIds(builtIds), cultureParams);
    share = conv.ownCultureShare;
  }

  if (foreignReligionDominant && ownerReligion) {
    const relConv = convertViaTemple(
      rel,
      ownerReligion,
      religionBuildingsFromIds(builtIds),
      religionParams,
    );
    rel = relConv.state;
    return {
      ownCultureShare: share,
      religionState: rel,
      cultureRateApplied: share - ownCultureShare,
      religionConverted: relConv.converted,
    };
  }

  return {
    ownCultureShare: share,
    religionState: rel,
    cultureRateApplied: share - ownCultureShare,
    religionConverted: 0,
  };
}

/**
 * USUNIĘTA KARA SZCZĘŚCIA (G5, R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1, właściciel 2026-09-05).
 *
 * Dawniej: dodatkowe −2 Sz, gdy po podboju jednocześnie obca kultura (<50%) i obca
 * dominująca religia. Znika, bo proporcjonalna skala ±x z G4 **już to liczy**: linia
 * Kultury daje −x przy obcej kulturze i linia Religii daje −x przy obcej religii, więc
 * miasto podwójnie obce dostawało tę samą rzecz trzeci raz. Parametr
 * `szczescie_kara_podboj_podwojna_obca` usunięty z `data/society-params.json`.
 *
 * Funkcja ZOSTAJE (zwraca stałe 0) wyłącznie dlatego, że importuje ją i woła `main.ts`,
 * który jest poza allowlistą tego tematu (trzyma go `R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1`,
 * §2b). `computeHappinessBreakdown` i tak IGNORUJE `conquestUnstablePenalty` — kara jest
 * usunięta na obu torach, nie tylko tutaj.
 *
 * NIE MYLIĆ z `conquestNoGarrisonLawPenalty` niżej — to kara PRAWA, inny mechanizm,
 * nietknięta przez ten temat.
 *
 * @deprecated Zawsze 0. Do usunięcia razem z wywołaniem w `main.ts`, gdy ten plik będzie wolny.
 */
export function conquestUnstableHappinessPenalty(
  _ownCultureShare: number,
  _foreignReligionDominant: boolean,
  _society: SocietyParamsLike | null | undefined,
  _difficulty: Difficulty = 'normal',
): number {
  return 0;
}

/**
 * @deprecated R-PRAWO-PRZEBUDOWA-SKALI-Q1 D5 (właściciel 2026-09-05): kara
 * `prawo_kara_podboj_bez_garnizonu` USUNIĘTA NA STAŁE — zawsze 0, ten sam wzorzec co
 * `conquestUnstableHappinessPenalty` wyżej. Do usunięcia razem z wywołaniem w `main.ts`,
 * gdy ten plik będzie wolny (main.ts poza allowlistą tego tematu, zakaz bezwzględny —
 * patrz dyspozycje/autobot/runs/R-PRAWO-PRZEBUDOWA-SKALI-Q1/decision-abc.md).
 */
export function conquestNoGarrisonLawPenalty(
  _ownCultureShare: number,
  _foreignReligionDominant: boolean,
  _garnizonCount: number,
  _society: SocietyParamsLike | null | undefined,
  _difficulty: Difficulty = 'normal',
): number {
  return 0;
}

/** Mnożnik ryzyka buntu gdy niestabilny podbój bez garnizonu (1 = brak zmiany). */
export function conquestRevoltRiskMultiplier(
  ownCultureShare: number,
  foreignReligionDominant: boolean,
  garnizonCount: number,
): number {
  if (garnizonCount > 0) return 1;
  if (!isConquestUnstable(ownCultureShare, foreignReligionDominant)) return 1;
  return 1.5;
}
