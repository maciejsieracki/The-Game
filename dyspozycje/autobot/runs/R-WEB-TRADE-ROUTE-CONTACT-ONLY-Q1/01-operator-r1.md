STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-TRADE-ROUTE-CONTACT-ONLY-Q1
GOAL: Szlak handlowy między cywilizacjami wymaga tylko znajomości (kontaktu), nie fizycznego połączenia (BFS / Port / wspólna granica). Dochód: bez zmian (krzywa dystansowa). Trasy wewnętrzne bez zmian.
ZMIANY/COMMIT: SHA w sekcji końcowej (commit na detached HEAD z origin/main 95a4b25ab; PUSH NIE).
RUNDY: 1/5

## Pomiar PRZED (plik:linia, baza 95a4b25ab) i tabela warunków

| Warunek | Obecnie | Po zmianie |
|---|---|---|
| Łączność lądowa BFS (`findCityConnection`, trade-routes.ts:655, `computeCityConnection`:695) | wymagana dla tras zewn. i wewn. | zewn.: NIE; wewn.: bez zmian |
| Port dla morza (`cityHasPort`:211) | wymagany w obu miastach | zewn.: NIE; wewn.: wymagany |
| Wspólna granica lądowa (`landBorderShared`:312, `ownersHaveSharedLandBorder`:264) | wymagana dla lądu zewn. | zewn.: NIE |
| Cache `__tradeConnectionCache`:344, `__landComponentsCache`/`__seaComponentsCache`:445 | używane dla wszystkich par | tylko trasy wewn.; komponent lądowy użyty tylko do wyboru medium zewn. (`contactTradeConnection`) |
| `refreshTradeRoutes` (kontynuacje + nowi kandydaci zewn.) | `findCityConnection`/`detectBestConnection` | `hasContact` + `contactTradeConnection` |
| `citiesHaveTradeConnection` (main.ts: panel miasta ~17122, AI-AI `formAiAiTradeAgreementsIfEligible` ~21550, kontekst audiencji ~23076, tick AI ~38199) | geometria BFS/Port/granica | `externalTradeContactOk` + `tradeContactBetween` |
| `diagnoseMissingTradeRouteForPartner` (main.ts ~18216, panel imperium) | komunikaty o granicy/Porcie/kontynentach | wojna / brak miast / "brak kontaktu z X" |
| `reportTradeRouteEvents` powód zerwania (main.ts ~17078) | "brak połączenia" | zewn.: "utrata kontaktu"; wewn.: bez zmian |
| ai.ts:5600 `hasTradeConnection` | komentarz o geometrii | komentarz zaktualizowany (pole zostaje) |
| UI cityPanel/empireDetailPanel | brak własnej logiki łączności (tylko wyświetlają `blockReason` i listę partnerów) | bez zmian w UI |

## Implementacja (jedna funkcja warunku w silniku, UI i AI)
- `gra/src/game/trade-routes.ts`: nowe `externalTradeContactOk(citiesA, citiesB, hasContact)` (zastępuje `citiesHaveTradeConnection`, usunięte); nowe `contactTradeConnection(a, b, map)` -> {medium, distance}: medium 'lad' gdy miasta w jednym komponencie lądowym (cache flood-fill + memo pary), inaczej 'morze'; dystans = hexDistance. `refreshTradeRoutes` dostał 11. parametr `hasContact` (domyślnie `() => true`); trasy zewnętrzne (kontynuacje i nowe) wymagają tylko kontaktu, brak BFS/Portu/granicy. `diagnoseMissingTradeRouteForPartner` ma nową sygnaturę (playerId, partnerId, cities, isAtWar, hasContact, label).
- `gra/src/main.ts`: `tradeContactBetween(a,b)` = `diplomaticContactEstablishedSet` (ten sam kontakt co stół negocjacji; per-fotel, hotseat: któraś strona); AI<->AI zawsze true (precedent main.ts `contactEstablished: ... : true`); barbarzyńcy false. Wpięte w refresh, panel miasta, diagnozę, AI-AI, kontekst audiencji i tick AI.
- `gra/src/game/ai.ts`: tylko komentarz.
- Zapisy: istniejące trasy zachowane (id stabilne gdy medium bez zmian), nowe powstają przy kolejnym refresh (test 9), brak wyjątków (test 8, stara trasa z innym medium nie dubluje pary), zerwany kontakt/wojna usuwa trasę.

## Symulacja PRZED/PO (prawdziwe `refreshTradeRoutes`, 3 ziarna 11/22/33, 5 cywilizacji x 3 miasta, wyspy, wszystkie pary z Umową i kontaktem, brak wojny; skrypt sim-before-after.cjs, wyniki sim-before.txt / sim-after.txt)

| ziarno | tras PRZED (zewn.) | tras PO (zewn.) | dochód łączny PRZED | PO |
|---|---|---|---|---|
| 11 | 14 (13) | 13 (13) | 156 | 416 |
| 22 | 14 (13) | 16 (16) | 124 | 488 |
| 33 | 14 (13) | 16 (15) | 172 | 484 |

(Liczba tras ograniczona slotami: 1/miasto; wzrost dochodu to trasy morskie dalekie, dochód dystansowy bez zmian parametrów.) Czas `refreshTradeRoutes` (ms, zimny/ciepły), zmienność pomiaru duża w kontenerze (kilka powtórzeń): PRZED zimny 8-89 / ciepły 0,9-4,2; PO zimny 14-72 / ciepły 0,7-3,3. Czyli porównywalnie (brak BFS w trasach zewn.; więcej kandydatów, bo żadna para nie odpada). Liczba wywołań BFS dla par zewn.: strukturalnie 0 (nie mierzono licznikiem: NIE_ZMIERZONO).

## Testy
- Nowy: `gra/tools/trade-routes-contact-only-test.cjs`: GREEN 36/36, EXIT=0 (gate-new-test-green.txt). RED na starym kodzie: T1 (ocean bez Portu), T5, T5b czerwone + crash (gate-new-test-red.txt). Pokrycie: ocean bez Portu i ścieżki z kontaktem+Umową -> trasa; brak kontaktu -> brak; wojna -> brak; brak Umowy -> brak; limit slotów (1 i 2); dochód = krzywa morska/lądowa; trasa wewnętrzna bez zmian (ocean bez Portu brak, z Portami jest); zapis/odczyt/stara trasa; kontakt po refresh; predykaty i diagnoza; 3 MUTACJE zrodla (kontynuacja ignoruje kontakt, generacja ignoruje kontakt, medium zawsze lad) wykryte.
- tsc `--noEmit`: EXIT=0 (gate-tsc.txt).
- Regresje 40 testów PRZED vs PO (gate-regression-before/after.txt): te same 8 czerwonych na bazie (empire-panel-miasto-obywatele, hotseat-etap6d-b, hotseat-etap6d-d, hud-skarbiec, naval-water-access-gate, pr141-combat-defense-owner-route, pr141-f04-yields, trade-ilosc) - zero nowych regresji. Pominięte testy `*live*` (wymagają przeglądarki) i generator.

## Testy zaktualizowane (pinowały wymóg łączności)
- `trade-routes-test.cjs`: m1/m4/m5 (komunikaty Góry/Port/kontynenty), n5 (komunikat granicy), n6 (trasa zewn. bez granicy/Portu "NIE dostaje trasy") - przepisane na kontakt; 103 -> 96 asercji (usunięte pinujące wymóg).
- `trade-routes-income-test.cjs`: J2, J4 (trasa zewn. wymagała Portu) - zewn. teraz powstaje; dodane J2i/J4i pinujące, że wewnętrzna nadal wymaga Portu.
- `trade-routes-hud-filter-test.cjs`, `hotseat-etap6d-podetap-b/d-exec-test.cjs`: tylko dopisane/zmienione mocki (`tradeContactBetween`, `externalTradeContactOk`).

## Uwagi / założenia (luki rozstrzygnięte założeniem)
1. Medium trasy zewn. to tylko wybór krzywej dochodu ('lad' w jednym komponencie lądowym, inaczej 'morze'); trasa 'morze' bez Portu daje obu miastom także bonus morski +1 za trasę ponad pierwszą (`computeSeaTradeBonusIncomeByCity` nie sprawdza Portu) - skutek uboczny; do decyzji orkiestratora czy bramkować Portem.
2. AI<->AI uznane za zawsze znające się (jak w kontekście ticku dyplomacji); państwa-miasta u gracza przez ten sam `diplomaticContactEstablishedSet`.
3. Bez kontaktu zapisanego w meta, stara Umowa Szlaków przestanie dawać trasę (kontakt wczytywany z zapisu, main.ts ~43489).
4. Brak nowych kar relacyjnych (zgodnie z ustaleniem 3). Mapa: komponent lądowy i memo medium zakładają stały teren (jak dotychczasowe cache).
5. Zrzut Chromium: NIE_ZMIERZONO - brak zmian renderu UI (zmienił się tylko tekst `blockReason`/lista partnerów).
6. REPIN Rust (trade routes) do notatki orkiestratora.

NASTĘPNY KROK: Evaluator (runda 1)
DEPLOY/PUSH: NIE WYKONANO
