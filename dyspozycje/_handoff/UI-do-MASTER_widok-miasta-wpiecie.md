# HANDOFF UI -> MASTER: wpiecie widoku miasta po odpowiedzi MIASTO  [2026-06-25]

cityPanel.ts rozbudowany ADDYTYWNIE wg paczki MIASTO (MIASTO-do-UI_widok-miasta-elementy.md). tsc=0, backup .bak-UI.
Wszystkie haki OPCJONALNE (bez nich = placeholder). Do wpiecia przez configureCityPanel():

REALNE PO WPIECIU (MIASTO/dzialy maja dane):
- getOrderState(cityId)                 -> Zadowolenie/Porzadek (orderPanel; pkt 1). [MIASTO order.ts]
- getCultureState(cityId) => {kulturaSuma, przyrost, borderRadius, thresholds[], zrodla?}
                                        -> panel Kultura (pkt 6 + granica kulturowa pkt 7). [MIASTO culture-religion]
- getResourceAccess(cityId) => string[] -> Surowce jako DOSTEP, nie ilosc (pkt 5). [MIASTO/DANE]
- onAutoManage(cityId)                  -> Zarzadca = podlacz okolica.assignWorkedTiles (auto-przydzial pol; pkt 9). [MIASTO/silnik]
- onRename(cityId, newName)             -> city.nazwa + save (UI robi prompt). [silnik]
- onArtView(cityId)                     -> widok artystyczny = overlay MAPA/UI. [MAPA/UI]

PLACEHOLDER / NIE v0.1 (wg MIASTO): Specjalisci (2), Zdrowie (3), auto-kolejka produkcji (9), Religia (etap 2).

CROSS-LANE — prosze rozdysponuj:
- PKT 4 Podzial Handlu (suwak Nauka/Pieniadz/Luksus): kontrakt = EKONOMIA (MIASTO daje tylko tradeMult).
  UI potrzebuje: getTradeSplit(cityId)=>{nauka,pieniadz,luksus} + setTradeSplit(cityId,split) + kto przelicza plony.
  -> ZAPYTANIE do EKONOMIA (czy suwak per-miasto edytowalny w v0.1, czy stale 60/30/10).
- Wioski (8): uspione v0.1 (8B). W widoku brak. Gdy wroca: dane = MAPA, akcja "Przeksztalc w miasto" = MIASTO.foundCityAt.

OPCJONALNIE od MIASTO: happinessBreakdown(pop, szczescie) jesli chcemy pasek 3-koszykowy w Mieszkancy (na zyczenie).
