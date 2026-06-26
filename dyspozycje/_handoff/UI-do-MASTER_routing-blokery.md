# HANDOFF UI -> MASTER: przepnij otwarte tematy do dzialow  [2026-06-25]

UI v0.1 = KOMPLET (panele 1-6 + Dyplomacja-stub + domkniecie E.2-E.5). Wszystko additive, tsc=0, backupy .bak-UI.
Wszystko gotowe do wpiecia. PROSBA: przepnij ponizsze do wlasciwych zakladek. Szczegoly w istniejacych
handoffach: _handoff/UI-do-MASTER_{paczka-produkcji, widok-miasta-wpiecie, akcje-naglowka, elementy-miasta, makiety}.md.

ZASADA UI (przyjeta na polecenie Maciej): NIE buduje NOWYCH UX bez potwierdzenia z danego dzialu, jak ma
DOKLADNIE wygladac. Czekam na specyfikacje/dane ponizej, zanim cokolwiek dorabiam.

== A. MASTER — INTEGRACJA (main.ts / kanon) ==
- wpiac moduly: showMainMenu (boot) -> onNewGame: showNewGameFlow; showHud / showBalancePanel /
  showOrderPanel / showDiplomacyPanel / showCityPanel; configureCityPanel({...haki...});
  advanceProduction w petli tury; prodMap -> game/productionState.ts (Twoja decyzja).

== B. MASTER — DECYZJE ==
- getBuiltBuildingLevels(cityId) => Record<budynekId, poziom> ? (poziomy budynkow per miasto dla 'Ulepsz') — czy/kto sledzi.
- potwierdz 5 tierow Dyplomacji (Wojna/Wrogi/Neutralny/Przyjazny/Sojusz + progi) -> przekaz CYWILIZACJE.

== C. EKONOMIA ==
- kontrakt suwaka PODZIAL HANDLU: getTradeSplit(cityId) / setTradeSplit(cityId, split) + kto przelicza plony;
  czy per-miasto edytowalny w v0.1, czy stale 60/30/10. (MIASTO daje tylko tradeMult.)

== D. MIASTO ==
- wpiac dane przez haki: getOrderState, getCultureState, getResourceAccess, onAutoManage(=assignWorkedTiles).
- konwersja wioska->miasto: po Twoim 'go' (foundCityAt). Opcjonalnie happinessBreakdown (pasek 3-koszykowy Mieszkancy).

== E. MAPA ==
- minimapa (HUD ma ramke-placeholder); widok artystyczny miasta (onArtView -> overlay); egzekucja granic
  kulturowych (terytorium = cityRangeForPopulation + cityBorderRadius); dane wiosek (gdy wroca).

== F. CYWILIZACJE / DANE ==
- diplomacy.json (relacje 0..200 -> tier 0..4) do panelu Dyplomacji; pelne civs.json (kreator nowej gry czyta).

Po przepieciu i odpowiedziach dzialow -> wdrazam od reki (Sonnet-subagent). Do tego czasu standby.
