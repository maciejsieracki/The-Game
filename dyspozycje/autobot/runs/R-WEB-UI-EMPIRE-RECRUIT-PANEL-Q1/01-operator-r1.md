STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — UI + logika
TEMAT: R-WEB-UI-EMPIRE-RECRUIT-PANEL-Q1
GOAL: (1) liczniki „Rekrutuj” w mieście niezależne i niezerowane; (2) zbiorczy panel „Rekrutacja — cała cywilizacja” z równomiernym rozkładem zamówienia po miastach gracza; bez zastępowania mechanizmu per miasto.

## ZMIERZONO PRZED
- Przyczyna błędu (część A): `unitRecruitCard.ts` po udanym `onRecruit` wołał `setQuantity(1)`, a `recruitUnit()` w `cityPanel.ts` kończy się `rerender()`, który buduje WSZYSTKIE wiersze od nowa z `quantity = 1` (stąd „zerują się wszystkie liczby do 1”). Stan licznika żył tylko w domknięciu wiersza.
- Ścieżka kolejki: ręczne „Rekrutuj” = `cfg.onPurchaseUnit` → `purchaseRecruitmentUnit` (main.ts) — koszt (złoto, rekruci, surowce) pobierany od razu przy dodaniu do kolejki `rekrutacja`; blokada oblężenia, woda dla Naval, bramki puli. Moment poboru zachowany (reużyta ta sama funkcja).
- Dostępność per miasto: `recruitPanelPurchasableUnits` → `purchasableUnits` (+ `isCityUnderSiege`). Limitu długości kolejki rekrutacji brak w kodzie.

## ZMIANY (allowlista)
- `gra/src/ui/unitRecruitCard.ts` — opcje `initialQuantity`/`onQuantityChange`; brak resetu po „Rekrutuj”.
- `gra/src/ui/cityPanel.ts` — mapa liczników per miasto+typ (stan UI, poza save), przekazanie do karty.
- NOWY `gra/src/game/empire-recruit-plan.ts` — czysty planer `planEmpireRecruitment` + `maxAffordableEmpireRecruits` + `executeEmpireRecruitment` (callback `purchase`).
- NOWY `gra/src/ui/empireRecruitPanel.ts` — panel (liczniki −/+/pole per typ, „Rekrutuj” per typ, „w kolejkach: N”, komunikat).
- `gra/src/ui/hud.ts` — tylko przycisk „Rekrutacja” w prawym klastrze górnego paska + `onOpenEmpireRecruit`.
- `gra/src/main.ts` — wiring (`empireRecruitRows`, `orderEmpireRecruitment`, import, hak HUD); wołana istniejąca `purchaseRecruitmentUnit`, jedna ścieżka kolejki. Bez zmian `production.ts`.
- Testy: NOWE `tools/empire-recruit-plan-test.cjs`, `tools/empire-recruit-panel-real-render-test.cjs`; zaktualizowany `tools/recruit-card-quantity-real-render-test.cjs` (jedna asercja „po batchu licznik resetuje się do 1” zastąpiona „zostaje 3” — celowa zmiana kontraktu z prośby właściciela).
- Dowód wizualny: `panel-zbiorczy.png` (w tym katalogu).

## Algorytm
Każda sztuka → miasto zdolne z najmniejszą liczbą tego typu w kolejce (+już przydzielone), remis: krótsza kolejka łączna, remis: id. Jedno miasto → N wpisów; 3 miasta/5 szt. → 2/2/1. Przed rozdziałem sufit „stać nas” (złoto, rekruci, surowce); wykonanie jednym wywołaniem `purchaseRecruitmentUnit(city, id, koszt, ownerId, n)` na miasto. Brak zdolnego miasta → „Brak miasta zdolnego do rekrutacji X (powód)”, zero zmian; częściowo → „Przyjęto 3 z 5 × X (powód)”.

## TESTY
- `tsc --noEmit` (gra): EXIT=0 (log: scratchpad `gate-tsc.txt`, linia `EXIT=0`).
- `empire-recruit-plan-test`: 14/14; mutanty `uneven` → 7 FAIL, `all` (ignorowanie blokad) → 2 FAIL.
- `empire-recruit-panel-real-render-test` (Chromium, realne moduły, fixture 3 miast): 20/20 — liczniki Wojownik 5 / Taran 4 niezależne, brak resetu po „Rekrutuj”, rozkład 2/2/1, 1 zdolne miasto → 3 wieże w jednym, koszt jak ręczny (5×10), część A (przebudowa wierszy zachowuje liczniki). Mutanty `reset-panel` i `reset-card` → FAIL (wykryte).
- Regresje 0 FAIL: `recruit-card-quantity-real-render` 25/25, `recruitment-batch-contract` 17/17, `recruitment-panel-compact-row` 39/39, `recruit-card-manpower-real-render` 20/20, `recruit-card-stock-chip-real-render` 15/15, `recruit-list-visibility-ui` 15/15, `empire-mass-recruitment` 30/30, `army-panel-recruit-remove` 21/21.
- NIE_ZMIERZONO: test w pełnej grze (vite build + 3 realne miasta + `ai-test` 274/20) — nie uruchomiono (koszt/dysk); wiring main.ts/hud.ts pokryty tylko kompilacją `tsc` i testem komponentowym z realnym planerem. `siege-blockade-no-recruit-reinforce-test`, `recruit-list-order-by-era`, `recruitment-panel-height` — nie ukończone/nie uruchomione w tej rundzie.

## BLOKADY
Brak twardych. Uwagi dla Evaluatora: (1) test live w grze do wykonania (zamówienie 5 wojowników + 4 taranów na 3 miastach, kolejki, koszty); (2) `hud.ts`: przycisk używa klasy `b-wiki` — sprawdzić wygląd i układ pod 640 px; (3) panel nie odświeża się sam po zmianach spoza panelu (tylko po zamówieniu i otwarciu) — ewentualny hak w `updateHud`; (4) propozycja miejsca: górny pasek obok Civpedia/Menu (zrealizowana).

## RUNDY
1/5 — commit e1b1b6279

## NASTĘPNY KROK
Evaluator: test live w realnej grze + brakujące regresje (`*queue*`, `*production*`, `city-panel*`, `ai-test`).

DEPLOY/PUSH: NIE WYKONANO
