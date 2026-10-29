/**
 * K04 batch 3 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04B-Q1, runda 1): podział Pracy miasta.
 *
 * Pin `gra/src/ui/cityPanel.ts` (edb8fb56): `readPodzialPracy` (:1022-1033), `cityPracaSplit` (:1361-1377).
 * Pin reguły: `gra/src/game/cities.ts:545-552` (clamp), `:557-559` (`procentPuliImperiumZBudynkow`),
 * `gra/src/game/production.ts:2068-2073` (`splitPraca`).
 *
 * Reguła P5.13: UI nie liczy podziału. Pin czytał hook / zapis miasta / parametr silnika
 * (`buildEconParams(data).suwaakPracaBudynki`); tutaj są to wejścia przekazane przez kontroler z DTO
 * (`sliders.pracaBudynkiPct`, ZAŁOŻENIE K04B-Z1). Podział Pracy (`doBudynkow`/`doPuli`) przychodzi z DTO
 * `CityPanelInputsDto.podzialPracaSplit` (ZAŁOŻENIE K04B-Z1); tu tylko zaokrąglenie % i dopełnienie puli.
 * Granice procentu z DTO `StaticCatalogConstantsDto.min/maxPodzialPracyBudynkiPercent` (pin: stałe 50/100).
 */
import { DEFAULT_PODZIAL_PRACY } from './k01a-fundament';
import type { PodzialPracySplit } from './k01a-fundament';

/** Granice suwaka (DTO `constants`; pin: `MIN/MAX_PODZIAL_PRACY_BUDYNKI_PERCENT`). */
export interface PodzialPracyBounds {
  readonly min: number;
  readonly max: number;
}

/** Źródła odczytu podziału (pin: hook, zapis miasta, parametr silnika); kolejność jak w pinie. */
export interface PodzialPracySources {
  /** Pin :1023 `cfg.getPodzialPracy?.(city.id)` — wartość z DTO (gdy wypełniona). */
  readonly hook?: { readonly procentBudynki: number } | null;
  /** Pin :1025-1026 `city.podzialPracy ?? city.podziałPracy` — zapis miasta. */
  readonly stored?: { readonly procentBudynki: number } | null;
  /** Pin :1028-1030 `buildEconParams(data).suwaakPracaBudynki` — parametr silnika. */
  readonly engineParam?: number | null;
}

/** Pin :545-552 `clampPodzialPracyBudynkiPercent` z granicami z DTO. */
export function clampPodzialPracyBudynkiPercentK04b(n: number | undefined | null, bounds: PodzialPracyBounds): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return DEFAULT_PODZIAL_PRACY.procentBudynki;
  return Math.max(bounds.min, Math.min(bounds.max, Math.round(n)));
}

/** Pin :1022-1033 `readPodzialPracy`: hook -> zapis -> parametr silnika -> domyślny (wszystko clampowane). */
export function readPodzialPracyK04b(src: PodzialPracySources, bounds: PodzialPracyBounds): PodzialPracySplit {
  if (src.hook) return { procentBudynki: clampPodzialPracyBudynkiPercentK04b(src.hook.procentBudynki, bounds) };
  if (src.stored) return { procentBudynki: clampPodzialPracyBudynkiPercentK04b(src.stored.procentBudynki, bounds) };
  return { procentBudynki: clampPodzialPracyBudynkiPercentK04b(src.engineParam, bounds) };
}

/** Pin :557-559 `procentPuliImperiumZBudynkow`: zawsze dopełnienie do 100 (po clampie). */
export function procentPuliImperiumZBudynkowK04b(procentBudynki: number | undefined | null, bounds: PodzialPracyBounds): number {
  return 100 - clampPodzialPracyBudynkiPercentK04b(procentBudynki, bounds);
}

/** Podział Pracy z DTO (`podzialPracaSplit`) — pole liczone przez silnik dla bieżącego suwaka. */
export interface PodzialPracaSplitDto {
  readonly total: number;
  readonly doBudynkow: number;
  readonly doPuli: number;
}

/** Wynik pinowego `cityPracaSplit` (:1361-1377). */
export interface CityPracaSplitK04b {
  total: number;
  doBudynkow: number;
  doPuli: number;
  pctBudynki: number;
  pctPuli: number;
}

/**
 * Pin :1361-1377 `cityPracaSplit`. Pin: `splitPraca(view.praca, pctB/100)` + `procentPuliImperiumZBudynkow(pctB)`.
 * Port: podział z DTO (`split`, policzony przez silnik dla tego samego pctB); UI robi tylko clamp % i dopełnienie.
 */
export function cityPracaSplitK04b(
  split: PodzialPracaSplitDto,
  src: PodzialPracySources,
  bounds: PodzialPracyBounds,
): CityPracaSplitK04b {
  const pctB = clampPodzialPracyBudynkiPercentK04b(readPodzialPracyK04b(src, bounds).procentBudynki, bounds);
  return {
    total: split.total,
    doBudynkow: split.doBudynkow,
    doPuli: split.doPuli,
    pctBudynki: pctB,
    pctPuli: procentPuliImperiumZBudynkowK04b(pctB, bounds),
  };
}
