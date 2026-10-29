# R-AI-FOOD-IMPROVEMENT-PRIORITY-Q1 — dispatch

TEMAT: `R-AI-FOOD-IMPROVEMENT-PRIORITY-Q1`
RUNDA: 1/5 · DATA: 2026-10-29 · DOMAIN: GAME · ŚCIEŻKA: A (Workflow)
STATUS: Operator active after owner instruction. Native Kanban card unavailable in this session; recorded as tooling limitation, not a product blocker.
ROLE ROUTING: Operator `/root/food_priority_operator`; Evaluator independent agent after operator commit; Defense returns to Operator only for evaluator objections; Final Control independent after review; orchestrator integrates, releases, deploys, and pushes.

## WYZWALACZ

Właściciel polecił 2026-10-29 zastosować kolejność budowy żywności dla AI cywilizacji i auto-budowania gracza: najpierw przygotować pola przy rzekach przez wycinkę lasu, potem farmy na obywatelskich pustych polach, następnie trzoda, a dopiero na końcu irygacja lub cywilizacyjne tarasy. To jest nowy, rozszerzony zakres względem częściowo wdrożonego i historycznie zablokowanego `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1` (limit rund wykorzystany); wykorzystaj jego decyzje i istniejące bramki, nie nadpisuj historii ani nie duplikuj starego ID.

## GOAL

Gdy wybrano automatyczne budowanie żywności, AI cywilizacji i automatyzacja gracza realizują tę samą kolejność na polach obsługiwanych przez obywateli: (0) wycinka lasu z pól przy rzekach kwalifikujących się do farmy, (1) farma na każdym kwalifikującym się pustym polu obywatelskim, (2) trzoda/hodowla na kwalifikujących się polach obywatelskich dopiero po farmach, (3) irygacja lub dostępne cywilizacji tarasy dopiero po ukończeniu etapów farm i hodowli.

## KRYTERIA KOŃCA — binarne

1. NOWE: test zachowania potwierdza kolejność etapów 0→1→2→3 dla AI cywilizacji i auto-budowania gracza, w tym brak przeskoku do późniejszego etapu, gdy istnieje kwalifikująca się akcja wcześniejsza.
2. NOWE: farmy i hodowla obejmują wszystkie kwalifikujące się pola z pracującymi obywatelami; pola bez obywateli nie wyprzedzają obywatelskich (zachowaj wyjątki surowcowe istniejące w kanonie).
3. NOWE: las blokujący farmę nad rzeką jest usuwany przed farmą; po wycince farma staje się kandydatem w odpowiednim etapie.
4. NOWE: irygacja i tarasy nie są proponowane przed ukończeniem farm i hodowli na wszystkich odpowiednich polach; wybór tarasów respektuje cywilizację i wzgórza.
5. NOWE: testy edge/negative obejmują brak kwalifikujących się pól, brak surowców/działań, mieszane cywilizacje oraz brak możliwości wykonania bieżącego etapu; brak pętli lub głodzenia postępu.
6. Istniejące bramki AI/auto-improvements, obywateli, wycinki i kwalifikacji pól uruchomione przed/po; `tsc --noEmit` i produkcyjny Vite build PASS; raport zawiera parytet AI/gracz i odnotowuje zastane czerwone testy jako baseline.
7. Niezależny Evaluator PASS; przy uwagach Operator/Defense odpowiada punkt po punkcie, a Evaluator ponawia ocenę. Final Control PASS po sprawdzeniu commitu, testów i ograniczeń.

## ALLOWLISTA

- `gra/src/game/ai.ts`, `gra/src/main.ts` (tylko routing automatycznego budowania ulepszeń), oraz minimalne moduły źródłowe odkryte przez rekonesans i uzgodnione w raporcie.
- `gra/tools/**` — testy zachowania i diagnostyki.
- `dyspozycje/autobot/runs/R-AI-FOOD-IMPROVEMENT-PRIORITY-Q1/**`.

Zakazane: sekrety, `.git/**`, `gra-robocza/**`, `dyspozycje/WERSJE.md`, deploy/push/integracja przez Operatora. Nie zmieniaj starych runów poza cytowaniem ich wyników.

## IZOLACJA

Worktree `/workspace/food-priority-operator`, branch `autobot/R-AI-FOOD-IMPROVEMENT-PRIORITY-Q1`, baza jawna: dispatch commit z `origin/main` po rejestracji. Nie używaj dirty `/workspace/The-Game`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

Nie uznawaj wyniku za PASS na podstawie samych wag/scoringu ani testu źródłowego. Asercje muszą obserwować rzeczywistą kolejność wyboru/wykonania ulepszeń dla obu automatyzacji, z negacją i przypadkiem blokady etapu. Test „AI działa” bez dowodu kolejności jest FAIL.

## PROCEDURA NAPRAWCZA

Evaluator zgłasza każdy defekt z reprodukcją i minimalną zmianą; wraca wyłącznie zakwestionowany zakres do Operatora/Defense. Maksymalnie 5 rund na tym ID. Decyzję produktową eskaluj, nie zgaduj.

## GRAF 1–11

1. Rejestracja, zakres i dispatch — DONE (Kanban API unavailable; ograniczenie jawnie zapisane).
2. Rekonesans kodu, poprzednich runów i baseline — Operator.
3. Implementacja logiki etapów — Operator.
4. Testy zachowania AI + auto-gracza, edge cases, mutacje — Operator.
5. Typecheck, build i regresje — Operator.
6. Niezależny Evaluator — oczekuje na etap 5.
7. Obrona/poprawki Operatora — warunkowa.
8. Final Control — oczekuje na PASS ewaluatora.
9. Integracja do `main` i rebase — orkiestrator po akceptacji.
10. Build/publikacja do ROBOCZEJ oraz smoke/readback — orkiestrator; wcześniejsze upoważnienie właściciela do deployu i push obowiązuje.
11. `git push`, receipt, rejestr/WERSJE i zamknięcie — orkiestrator.

## OBIEG / GRANICE

Operator → niezależny Evaluator → (Defense przy zarzutach) → Final Control → integracja → ROBOCZA → push. Operator nie ocenia własnej pracy, nie integruje, nie deployuje, nie pushuje. Stosuj `dyspozycje/PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`; istniejące, jawne upoważnienie właściciela do merge/deploy/push utrzymuje się.
