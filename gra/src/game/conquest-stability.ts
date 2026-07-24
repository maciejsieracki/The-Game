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

interface RawParamRow {
  easy: number;
  normal: number;
  hard: number;
}

function pick(
  row: RawParamRow | undefined,
  difficulty: Difficulty,
  fallback: number,
): number {
  if (!row) return fallback;
  const v = row[difficulty];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

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

/** Po podboju: zachowaj mix presji (KULT-PRESJA-05) — nie zeruj. */
export function onCityCapturedCulture(
  city: { ownCultureShare?: number; kulturaOwnShare?: number },
  newOwnerId?: number,
  previousOwnerId?: number,
): void {
  if (newOwnerId === undefined || previousOwnerId === undefined || newOwnerId === previousOwnerId) {
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

/** Dodatkowa kara Sz gdy obie obce (kultura + religia) — podwójne tarcie po podboju. */
export function conquestUnstableHappinessPenalty(
  ownCultureShare: number,
  foreignReligionDominant: boolean,
  society: SocietyParamsLike | null | undefined,
  difficulty: Difficulty = 'normal',
): number {
  if (!isConquestUnstable(ownCultureShare, foreignReligionDominant)) return 0;
  const sz = (society?.szczescie ?? {}) as Record<string, RawParamRow>;
  return pick(sz.szczescie_kara_podboj_podwojna_obca, difficulty, -2);
}

/** Kara Prawa gdy podbój niestabilny i brak garnizonu. */
export function conquestNoGarrisonLawPenalty(
  ownCultureShare: number,
  foreignReligionDominant: boolean,
  garnizonCount: number,
  society: SocietyParamsLike | null | undefined,
  difficulty: Difficulty = 'normal',
): number {
  if (garnizonCount > 0) return 0;
  if (!isConquestUnstable(ownCultureShare, foreignReligionDominant)) return 0;
  const pr = (society?.prawo ?? {}) as Record<string, RawParamRow>;
  return pick(pr.prawo_kara_podboj_bez_garnizonu, difficulty, -3);
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
