/**
 * Wspólny, jawnie ograniczony kontrakt kanałów Szczęścia używany przez
 * `previewCityEconomy` i `advanceCityEconomy`.
 *
 * To nie jest pełny `evaluateOrderFromBreakdown`: ta warstwa nie ma wejść do
 * wszystkich źródeł Szczęścia z main.ts (kultura, religia, wojna itd.).
 * Wealth pochodzi wyłącznie z wyniku `advanceWealth`; `wealthPoziom` nie jest
 * tu ponownie czytany.
 *
 * R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 G3 (właściciel 2026-09-05), domknięte na tym
 * torze ratyfikacją R3-D: Ceramika i działający Spichlerz NIE dokładają już tutaj
 * po +1. To były wiersze dublujące — ceramika liczy się jako zwykły surowiec
 * zaopatrzenia (linia `zaopatrzenie_obywateli`, ±2 na surowiec), a Spichlerz jako
 * budynek szczęściodajny (+5 łącznie, G2). Rozpiska Szczęścia
 * (`computeHappinessBreakdown`) przestała je liczyć w rundzie 1; podgląd wzrostu
 * został wtedy przeoczony i rozjeżdżał się z silnikiem o 2 punkty.
 *
 * Oba parametry ZOSTAJĄ w sygnaturze i są świadomie ignorowane: wołający
 * (`turn-economy.ts`) jest poza allowlistą tej rundy, a bramka
 * `r-wzrost-szczescie-dubel-wealth-ceramika-test.cjs` sprawdza asercją negatywną,
 * że żadne wejście na tych polach nie zmienia wyniku — czyli że dubel nie wróci.
 * / EN: Explicitly bounded shared Happiness contract for preview and runtime.
 */
export function computeGrowthHappinessNetto(
  wealthZadowolenie: number,
  _maDostepDoCeramiki: boolean,
  _maDzialajacySpichlerz: boolean,
): number {
  return Number.isFinite(wealthZadowolenie) ? wealthZadowolenie : 0;
}
