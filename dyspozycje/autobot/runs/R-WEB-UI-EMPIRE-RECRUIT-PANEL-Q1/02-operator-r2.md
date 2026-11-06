STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — UI + logika
TEMAT: R-WEB-UI-EMPIRE-RECRUIT-PANEL-Q1
GOAL: liczniki "Rekrutuj" niezależne i niezerowane + zbiorczy panel rekrutacji całej cywilizacji (rozkład równomierny po miastach)
RUNDY: 2/5 (obrona po FAIL Evaluatora)

ODPOWIEDZI NA ZARZUTY
1. PRZYJMUJĘ. Hak `window.__empireRecruitTestDebug` (main.ts, tylko `?civTest=1`) woła REALNE `orderEmpireRecruitment` -> `executeEmpireRecruitment` -> `purchaseRecruitmentUnit`. Nowy `gra/tools/empire-recruit-live-test.cjs` (vite build -> Chromium, realna gra, 3 miasta gracza): 23/23. 5 x Wojownik = 2/2/1 w `cityProd.rekrutacja`, 4 x Taran = 2/1/1, złoto pobrane dokładnie 5 x koszt i 4 x koszt, miasto oblężone pomijane, brak złota -> komunikat bez zmian, klik w realnym panelu HUD nie zeruje liczników. Test od razu wykrył realną rzecz: bez surowca (drewno) zamówienie jest odrzucane z komunikatem (poprawne zachowanie, hak ustawia surowce).
2. PRZYJMUJĘ (uzasadnienie). `unitRecruitCard.ts` zmieniony świadomie: przyczyna resetu części A leży w nim (`setQuantity(1)` po "Rekrutuj"), a `cityPanel.ts` samo nie mogło tego naprawić. Rozszerzenie allowlisty o `gra/src/ui/unitRecruitCard.ts` wnioskuję do Evaluatora; zmiana minimalna (+17/-3), zmieniona jedna asercja w `recruit-card-quantity-real-render-test.cjs` (kontrakt "reset do 1" -> "licznik zostaje").
3. PRZYJMUJĘ. Meta zawija się (`white-space:normal`), "w kolejkach: N" w osobnej linii `.erp-queued`; nazwa też zawijana. Test: typ o długiej nazwie i koszcie 123456, asercja `scrollWidth <= clientWidth` i położenie w panelu dla wszystkich 10 pól oraz widoczność `.erp-queued`.
4. PRZYJMUJĘ. `refreshEmpireRecruitPanel()` w `updateHud()` (pokrywa turę, ręczną rekrutację, anulowanie, zakupy; render pomija przebudowę gdy HTML bez zmian, zachowuje scroll listy i edytowane pole). Nowe `resetEmpireRecruitPanelSession()` (zamyka panel, czyści liczniki, `panelCfg`, komunikat) wołane w `prepareSessionForLoad` i `doStartGame`. Dowody: panel-test (refresh po zmianie spoza panelu, brak przebudowy DOM, reset sesji) oraz live L19 (ręczna rekrutacja w mieście -> panel pokazuje aktualne liczby).
5. PRZYJMUJĘ. `empireRecruitRows` pomija `Typ='Civilian'` oraz `isCivilianUnit`; live L4: brak Zwiadowca/Osadnik/Robotnik w wierszach.
6. PRZYJMUJĘ. `executeEmpireRecruitment` robi jedną rundę ponownego planowania: sztuki odrzuconych miast przechodzą na pozostałe zdolne (kolejka przyjętych uwzględnia już przyjęte). 3 nowe testy planera (17/17): c2 odmawia -> 3/3 w c1/c3; wszystkie odmawiają -> 0, bez pętli; jedno miasto przejmuje całość. ZAŁOŻENIE (udokumentowane w kodzie): `enqueueRecruitment` w production.ts nie ma limitu długości kolejki ani garnizonu, więc `maxNewSlots` nie jest przekazywane z main.ts (planer je wspiera).
7. PRZYJMUJĘ. Uruchomione (wszystkie 0 FAIL): recruit-list-order-by-era 18, recruitment-panel-height-real-render, hud-recruits-abbrev, army-merge-panel-production-mount 9, army-panel-recruit-rally-general (5 assertions), army-recruitment-concentration 30, production-overflow 213, shared-city-name-queue 10, building-queue-refund 5, building-queue-detail-card 8, city-panel-growth-percent-separator 29, ai-rekrutacja-parytet 7, ai-production-priority 9, general-capital-recruitment-order, recruit-rally-default-ui/save, recruitment-cost-50-wood 190, march-attack-queue-persist 57, recruit-list-visibility(-ui) 9/15, plus poprzednie. `ai-test`: 274 passed, 20 failed = stan odniesienia z dispatchu (274/20). Układ 640 px: przycisk "Rekrutacja" i panel mieszczą się w oknie (live L20/L21), panel position:fixed top:84px right:16px nie koliduje z HUD w tym widoku (zrzut panel-zbiorczy-live.png).

TESTY (dodatkowo)
- tsc --noEmit: EXIT=0.
- empire-recruit-plan-test 17/17; empire-recruit-panel-real-render-test 26/26; mutanty reset-panel (6 FAIL) i reset-card (1 FAIL) łamią test.
- empire-recruit-live-test 23/23 (realna gra).
- Błędy ISTNIEJĄCE NA BAZIE 34f24ef0e, niezwiązane z tematem: `rekrutacja-skarbiec-only-test` (1 FAIL, asercja szuka tekstu `ownerTreasury(ownerId) < koszt`, a kod ma `totalGoldCost`), `era-recruit-panel-refresh-test` (ReferenceError trimWarEventLog w ekstrakcji z main.ts).
- NIE_ZMIERZONO: mutant live dla wiringu main.ts (poza mutantami komponentowymi); siege-blockade część live (nie uruchamiana ponownie).

ZMIANY/COMMIT: main.ts (hak testowy, filtr cywili, refresh/reset), empireRecruitPanel.ts, empire-recruit-plan.ts, testy w gra/tools/ (+ empire-recruit-live-test.cjs), zrzut panel-zbiorczy(-live).png. Bez zmian: production.ts, WERSJE.md, gra-robocza, rust-port.
BLOKADY: brak
NASTĘPNY KROK: Evaluator, potem Final Control
DEPLOY/PUSH: NIE WYKONANO
