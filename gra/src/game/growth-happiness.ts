/**
 * Wspólny, jawnie ograniczony kontrakt kanałów Szczęścia używany przez
 * `previewCityEconomy` i `advanceCityEconomy`.
 *
 * To nie jest pełny `evaluateOrderFromBreakdown`: ta warstwa nie ma wejść do
 * wszystkich źródeł Szczęścia z main.ts (kultura, religia, wojna itd.).
 * Wealth pochodzi wyłącznie z wyniku `advanceWealth`; `wealthPoziom` nie jest
 * tu ponownie czytany. Ceramika i działający Spichlerz są binarne i dają po +1;
 * do tego kontraktu trafiają wyłącznie flagi, więc liczba sztuk/budynków nie
 * może zwiększyć żadnego z tych dwóch bonusów.
 * / EN: Explicitly bounded shared Happiness contract for preview and runtime.
 */
export function computeGrowthHappinessNetto(
  wealthZadowolenie: number,
  maDostepDoCeramiki: boolean,
  maDzialajacySpichlerz: boolean,
): number {
  return (Number.isFinite(wealthZadowolenie) ? wealthZadowolenie : 0)
    + (maDostepDoCeramiki ? 1 : 0)
    + (maDzialajacySpichlerz ? 1 : 0);
}
