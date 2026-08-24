STATUS: PASS
DOMAIN: GAME
TEMAT: R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T6

GOAL: Rozszerzyć tabelę tras handlowych w panelu imperium (`empireDetailPanel.ts`, zasilaną przez `main.ts::buildEmpireTradeSnap()`) o pełny rozkład dochodu per trasa — składnik dystansowy osobno od składnika 5% — oraz jawne wskazanie, gdy 5% czeka na wybudowanie budynku handlowego (`budynekOdblokowany === false`).

## PRZYCZYNA/PROJEKT

**Recon (przed kodem) zmienił dwa założenia dispatchu — oba na korzyść, oba udokumentowane:**

1. **Funkcji per-trasowej NIE było.** T4 zostawił wyłącznie agregat `computeTradeRouteBuildingBonusByCity()` (`gra/src/game/trade-routes.ts:971`) z literałem `0.05 * baseIncome` w ciele pętli. Zgodnie z §Kontekst techniczny pkt 1 dispatchu („czy trzeba dodać nowy, mały eksport") dołożyłem **czystą ekstrakcję** `tradeRouteBuildingBonusForRoute(route, params)` + stałą `TRADE_ROUTE_BUILDING_BONUS_RATE`, a agregat T4 **woła teraz tę funkcję** — obie ścieżki są bit-identyczne z definicji, nie „przez podobieństwo". Alternatywa (własny `0.05 *` w `main.ts`) tworzyłaby czwarte miejsce liczące tę samą premię — dokładnie `P-HANDEL-SZLAKI-WZOR-DUPLIKAT-Q1`.
   ⚠️ **`trade-routes.ts` figuruje w dispatchu jako „poza zakresem".** Zmiana jest wyłącznie addytywno-ekstrakcyjna, zero zmiany logiki liczenia, dwa `continue` zostały w agregacie celowo (inaczej mapa dostałaby wpisy-zera i zmienił się `map.size`/`has()` — obserwowalny kontrakt T4). Zgłaszam wprost do oceny Evaluatora.

2. **„Handel — szlaki per miasto" to NIE jest tabela per-trasa** — to agregat per miasto w zakładce **Miasto** (`empireDetailPanel.ts:1987`). Tabela per-trasa („TWOJE MIASTO / PARTNER / MEDIUM · DYSTANS / DOCHÓD/TURĘ") żyje w `renderHandelSection()`, zakładka **Handel**. Rozszerzyłem **obie** — per trasa tam, gdzie są trasy, i zagregowany rozkład tam, gdzie jest agregat.

**Kluczowe rozstrzygnięcie spójności (kryterium 2 dispatchu):** dwóch składników **nie wolno pokazać jako jednej liczby „do skarbca"**. `income` (dystans) wchodzi do skarbca **czysto** (`pieniadzZTras`, `turn-economy.ts:2072`), a premia 5% jest **addytywnym składnikiem `handelBrutto`** (`economy.ts:961`, Step 4) i przechodzi jeszcze przez korupcję, mnożnik Waluty/Mennicy i suwaki Nauka/Skarb/Zamożność. Zsumowanie ich byłoby czwartym, nieprawdziwym opisem tego dochodu. UI pokazuje je więc jako dwa nazwane składniki, a podpis mówi wprost, dlaczego nie są sumowane.

**Znalezione przy okazji i naprawione (ten sam plik, ta sama mechanika, inaczej powstałby czwarty niespójny opis):** podpis tabeli tras opisywał wzór **sprzed T1** („max(podłoga, bazowy − dystans×współczynnik)") i **stare** „+5% Podatku z pól" zastąpione w T4; pusty stan żądał „Wymagany: budynek handlowy (Targowisko/Port)", co po T3 wysyła gracza budować coś, co nie odblokuje żadnej trasy.

## ZMIANY/COMMIT

Branch `autobot/HANDEL-T6-Q1`, commit `8d72e54f`, wypchnięty do `origin/autobot/HANDEL-T6-Q1` (odgałęziony od `origin/main` `601508dd`). 7 plików, +946/−21.

- `gra/src/game/trade-routes.ts` (+41/−4) — `TRADE_ROUTE_BUILDING_BONUS_RATE`, `tradeRouteBuildingBonusForRoute()`; agregat T4 woła ekstrakcję.
- `gra/src/ui/empireDetailTypes.ts` (+33/−2) — `EmpireTradeRouteRow.budynekOdblokowany: boolean` + `premiaBudynku: number` (dwa nośniki celowo: flaga mówi DLACZEGO, liczba ILE).
- `gra/src/main.ts` (+17) — oba pola w snapie; premia liczona od `base` (bez bonusu cudów), dokładnie jak silnik.
- `gra/src/ui/empireDetailPanel.ts` (+189/−15) — CSS `.civ-emp-route-split{.on/.off}` (typografia 1:1 z istniejącym `.civ-emp-res-flag-note`, te same dwa kolory stanu #78c95a/#d9a441); helpery `routeBonusSplitHtml()`, `cityBonusSplitHtml()`, `tipAttr()`, `splitAmountTxt()`; druga linia komórki DOCHÓD w obu tabelach; wiersz SUMA/CAŁA CYWILIZACJA z osobno zsumowanym 5% i liczbą tras bez budynku; przeważone kolumny; naprawione dwa nieaktualne opisy.
- `gra/tools/trade-routes-income-test.cjs` (+67) — sekcja K.
- `gra/tools/empire-panel-miasto-obywatele-content-test.cjs` (+62/−9).
- `gra/tools/empire-trade-route-split-real-render-test.cjs` (**nowy**, 483 linie) — bramka real-render.

**UX (moja decyzja implementacyjna, uzasadnienie):** trasa bez budynku dostaje **słowo, nie zero** — „5% — brak budynku" w kolorze oczekiwania + `title` mówiący, że dochód dystansowy leci już teraz i co odblokuje premię. Kolor nigdy nie niesie stanu sam (zasada z `.civ-emp-res-flag-pill`). Miasto, w którym żadna trasa nie ma budynku, dostaje **to samo brzmienie** zamiast „0 · 5%".

## TESTY

**Real-render (BEZWARUNKOWY wymóg, §9 poz. 6a) — `empire-trade-route-split-real-render-test.cjs`: 58 pass / 0 fail.** Żywy Chromium (Playwright, fallback `/opt/pw-browsers/chromium-1194`), panel na realnych 404px:
- (A) trasa **Z budynkiem**: „+40" ORAZ „+2 · 5% budynek", wariant `on`, `display:block`, wysokość > 0, kolor `rgb(120,201,90)` z kaskady.
- (B) trasa **BEZ budynku**: „+80" (dochód dystansowy leci dalej — stan po T3) ORAZ „5% — brak budynku", wariant `off`, kolor `rgb(217,164,65)`, tooltip wymienia Targowisko/Port i mówi „już teraz".
- (C/C3) wiersz SUMA („+133" / „+2 · 5% (2 bez budynku)") oraz **druga tabela** (zakładka Miasto) wyrenderowana i zmierzona osobno.
- (D) layout: zero przepełnienia w poziomie w każdej komórce, panel bez przewijania poziomego, wiersz realnie wyższy od nagłówka; **kolumny mierzone, nie dobrane na oko** — pierwsza wersja przeważenia dała 16px przepełnienia w PARTNER, test to złapał, poprawione (PARTNER wychodzi **szerszy** niż przed T6 i kasuje pre-istniejące 4px).
- (F) **mutacja**: drugi bundel z komórką sprzed T6 — asercje (A)/(B)/(C) **czerwienieją**; ten sam przebieg daje zrzut PRZED.
- (E) **artefakt `vite build`** (C-001: `node ./node_modules/vite/bin/vite.js build --outDir /tmp/... --emptyOutDir`, nigdy `npm run build`) niesie `.civ-emp-route-split`, „brak budynku", „5% budynek" i NIE niesie podpisu sprzed T1.

Zrzuty PRZED/PO: `/home/user/wt-HANDEL-T6-shots/trasy-rozklad-{przed,po}.png` i `…-{przed,po}-miasto.png`.

- `tsc --noEmit`: 0 błędów. `vite build`: czysty, 846 modułów.
- `trade-routes-income-test.cjs`: **107/0** (baseline 94/0; sekcja K: (a) kwota, (b) 0 dla braku budynku i trasy nieaktywnej, (c) agregat T4 == suma per-trasowa co do klucza i wartości, (c-bis) ta sama liczba w `cityYieldPerTurn`).
- `empire-panel-miasto-obywatele-content-test.cjs`: **115/0** (baseline 99/0).
- `empire-panel-drobiazgi-runda2-test` 33/0, `trade-routes-test` 65/0, `trade-grant-test` 62/0, `zloto-szlak-test` 54/0, `cuda-handel-test` 25/0, `mennica-uspienie-test` 49/0, `owner-economy-test` 9/0, `ai-major-economy-test` 33/0, `empire-miasta-table-test` 96/0, `empire-skarbiec-bilans-test` 11/0, `empire-skarbiec-panel-coverage-test` 0 fail, `diplomacy-locks-test` 78/0, `diplomacy-audience-actions-test` 20/0, `city-panel-growth-percent-separator-test` 29/0, `praca-global-default-live-test` 7/0.
- `trade-ilosc-test.cjs`: **35 pass / 5 fail — plik NIETKNIĘTY** (brak w diffie), te same 5 pre-istniejących FAIL co w raporcie T4: `capacityPerRoutePerTurn`/limit tury ×3, `kon` w `TRADE_ROUTE_STOCK_FLOW_KEYS` ×2.
- **5 bramek referencyjnych zielone:** `logic-test` 213/213, `tech-tree-test` 19/19, `research-test` 33/33, `unit-replace-test` 13/13, `combat-test` 6/6.
- `git diff --check` czysty; `git add` per plik, nigdy `-A`; zero zmian w danych gry (`gra/data/`).

## BLOKADY

Brak. Jedna rzecz do świadomej oceny Evaluatora: dotknięcie `trade-routes.ts` (opisane w PRZYCZYNA/PROJEKT pkt 1) — plik wymieniony w dispatchu jako „poza zakresem", ale §Kontekst techniczny pkt 1 tego samego dispatchu jawnie przewiduje dołożenie tam małego eksportu. Zmiana jest ekstrakcją bez zmiany logiki, pilnowaną testem równoważności.

RUNDY: 1/5

NASTĘPNY KROK: Evaluator, runda 1.

DEPLOY/PUSH: **NIE WYKONANO** — commit i push wyłącznie na gałęzi roboczej `autobot/HANDEL-T6-Q1` (wymagane dispatchem). Brak integracji do `main`, brak deployu.
