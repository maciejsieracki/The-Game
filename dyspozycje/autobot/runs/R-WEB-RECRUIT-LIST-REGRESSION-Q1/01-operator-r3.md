# Operator r3 (zapis orkiestratora)

Raport Operatora r3 zapisany przez orkiestratora (agent nie zapisał pliku). Treść niezmieniona.

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-RECRUIT-LIST-REGRESSION-Q1 (runda 3/5, N1)
GOAL: Brak surowca ma wyszarzać element, nie go ukrywać. Zakres N1: budowa, Zastąp, katalog i lista rekrutacji. Reguły ery, technologii, lokalizacji i wody bez zmian. AI nadal nie buduje ani nie rekrutuje bez środków.

ZMIANY/COMMIT: `c95bef36` na detached `3219ec2a`, bez push.
- `gra/src/game/production.ts`: nowa flaga widoku `showResourceGatedBuildings` (domyślnie false). Przy `true` budynek z bramką surowca etykietowego (`buildingResourceGateMet`) zostaje na liście. `availableReplacementsFor` honoruje `showStockGatedUnits` dla bramki Brąz/Żelazo/Drewno. Nowy eksport `unitStockShortfallLabel`.
- `gra/src/ui/cityPanel.ts`: `renderBuildList` pyta o budynki z flagą widoku i eksportowana jest do testu. Pozycje „Jeszcze zablokowane” nie duplikują wierszy już widocznych w liście. Brakujący surowiec pojawia się w tekście („Brakuje: …”).
- `gra/src/ui/unitReplacePicker.ts`: opcja z `blockedReason` jest wyszarzona, nie do wyboru, z przyczyną w tekście.
- `gra/src/main.ts`: Zastąp pokazuje listę widoku. Wybór jest blokowany tą samą regułą zapasu.
- Testy: `gra/tools/building-resource-visibility-test.cjs` (nowy, 15/15), `gra/tools/building-resource-visibility-ui-test.cjs` (nowy, Chromium, 8/8), `gra/tools/building-stock-visibility-test.cjs` (7/7, kontrola zmieniona na widok).

Przegląd miejsc ukrywania:
- Lista rekrutacji: flaga z r1 działa, bez zmian.
- Zastąp: naprawione.
- Lista budowy (`buildableProduction`): naprawione dla bramki surowca etykietowego. Budynki z `koszt_surowce` już były wyszarzone.
- Katalog (`eraBuildingCatalog`, `resourceOk`): wskazówka nazywa brakujący surowiec. Bez zmian w logice statusu.
- Lista dropdown „Budowa lista”: celowo bez zmian. Pokazuje „(zabl.)” wyszarzone, nie ukrywa.
- AI (`main.ts` 15361/15439, `auto-manage.ts`): domyślna flaga false, zachowanie bez zmian.

ZAŁOŻENIA i allowlista:
- `main.ts` i `unitReplacePicker.ts` są spoza pierwotnej allowlisty. Uzasadnienie: UI Zastąp jest częścią N1 i nie da się go naprawić bez nich.
- `cityPanel.ts` (eksport `renderBuildList`) to szew testowy. Mieści się w allowliście.
- Dla testu UI przyjąłem epokę Stolarni +1. Dzięki temu budynek trafia do listy budowy, a nie do katalogu.

TESTY:
- `tsc --noEmit`: czysto.
- `vite build` (bezpośredni, do scratchpad): OK.
- `logic-test.cjs`: 213/213.
- Recruit: `recruit-list-visibility-test` 9/9, `recruit-list-visibility-ui-test` 15/15, `recruit-card-*` 20/25/15 pass, `recruitment-panel-compact-row` 39 PASS i exit 0, `recruitment-panel-height` exit 0.
- `unit-replace-test` 13/13. `building-gate-audit` uruchomiony bez błędu.
- Mutacje, każda czerwieni swój test: flaga w `production.ts` (węzeł node 3 FAIL), wiring w `cityPanel.ts` (B1/B2 FAIL), blokada w `unitReplacePicker.ts` (P1/P3/P4 FAIL). Po każdej mutacji przywrócono kod i test wrócił do zielonego.
- `deposit-building-gate-test`: 46 pass, 1 fail. Fail „stolarnia eraBuildingCatalog ready z drewnem w magazynie”: zapas 10 < `koszt_surowce` 25 z `buildings.json`. Ścieżka kodu nie została zmieniona. Oznaczam jako pre-existing na podstawie kodu, bez uruchomienia na bazie.

BLOKADY: brak. Wygląd w przeglądarce sprawdzony przez DOM (klasy, `disabled`, tekst) w headless Chromium, bez zrzutów ekranu.

RUNDY: 3/5. Poprzednia runda FAIL dotyczyła wyłącznie N1, więc zakres jest zamknięty.

NASTĘPNY KROK: Evaluator (Sonnet 5.5 medium) i Final Control na `c95bef36`. Do sprawdzenia: allowlista i pre-existing fail w deposit-building-gate.

Uwaga procesowa: nie zapisałem pliku raportu `.md` w `dyspozycje/autobot/runs/R-WEB-RECRUIT-LIST-REGRESSION-Q1/`. Zgodnie z instrukcją agenta raport jest w tej odpowiedzi.

DEPLOY/PUSH: NIE WYKONANO
