# AutoBot runs — kanoniczny ślad obiegu

Każdy temat ma własny katalog `runs/<pełne-ID>/`. Run używa pięciu **podstawowych
artefaktów**; to są pliki zbiorcze, nie pięć etapów:

`00-dispatch.md` → `10-operator.md` → `20-evaluator.md` → `50-final-control.md` → `70-integration.md`.

Raporty rund i korekt mogą mieć sufiksy (`-r2`, `-r3`) lub dodatkowe numerowane nazwy.
Wszystkie używają tego samego pełnego ID. Przy `FAIL`, technicznym `BLOCK`, `TIMEOUT`,
`INFRA`, `ZWIS` lub braku gotowości dopisz rundę/korektę w tym samym katalogu; nie twórz
nowego ID. Raporty z `logs/` są historią legacy, nie zastępują runu.

## Skala postępu 1–11

Numer oznacza ostatnią potwierdzoną bramkę, a status obok niego rozróżnia `PASS`, `FAIL`
i `WSTRZYMANY/BLOCKED`. Samo wysłanie dispatchu albo plan nie potwierdza ukończenia
etapu. Każdy etap wskazuje artefakt lub zdarzenie, w którym zapisuje się dowód:

| Etap | Bramka | Artefakt / dowód |
|---:|---|---|
| 1 | Temat zarejestrowany; GOAL, kryteria, allowlista i zależności ustalone | `00-dispatch.md` |
| 2 | Operator uruchomiony na sprawdzonej bazie/worktree | `10-operator.md` albo raport dispatchu Operatora |
| 3 | Objaw i przyczyna odtworzone lub ograniczenie reprodukcji jawnie udowodnione | sekcja diagnozy w `10-operator.md` |
| 4 | Poprawka Operatora i testy w zakresie zakończone | sekcja zmiany/testów w `10-operator.md` |
| 5 | Niezależny Evaluator wydał werdykt | `20-evaluator.md` |
| 6 | Operator odpowiedział na konkretne uwagi Evaluatora i przedstawił dowody | `21-operator-response.md` lub odpowiednia sekcja raportu Operatora |
| 7 | Niezależna Obrona sprawdziła odpowiedź Operatora | `30-defense.md` |
| 8 | Niezależny Final Control zamknął weryfikację | `50-final-control.md` |
| 9 | Zatwierdzony zakres zintegrowano do `main`, wymagane testy integracyjne przechodzą | `70-integration.md` i commit `main` |
| 10 | Deploy do Roboczej i odczyt wersji wykonane; dla zmian wyłącznie procesowych/dokumentacyjnych wpisz `N/A` z powodem, bo nie trafiają do builda gry | `80-robocza-deploy.md` albo receipt wydania z jawnie odnotowanym `N/A` |
| 11 | `git push` potwierdzony odczytem remote; rejestr/run zaktualizowane | `90-push-readback.md` albo receipt wydania |

**Przejścia warunkowe:** po etapie 5, jeśli Evaluator nie podał konkretnych zarzutów,
raport `20-evaluator.md` musi wpisać `OBRONA: POMINIĘTA — BRAK ZARZUTÓW`; etapy 6 i 7
są oznaczone jako pominięte, a następna bramka to etap 8. Jeśli są zarzuty, przejście
jest 5 → 6 → 7 → 8: odpowiedź Operatora trafia do `21-operator-response.md`, a obrona do
`30-defense.md`. Nie podnoś numeru za etap pominięty. Jeśli etap nie ma wymaganego
artefaktu albo aktywnego procesu, raportuj `WSTRZYMANY/BLOCKED` z przyczyną.

`04-integration.md` może oznaczyć `READY_FOR_DEPLOY` dopiero po faktycznej integracji;
może pozostać nazwą legacy dla raportu etapu 9. Deploy i push zapisuje się oddzielnie. Wymagane jest jawne upoważnienie właściciela. Zmiany wyłącznie procesowe nie wymagają deployu gry, ale muszą mieć dowód `N/A` dla etapu 10 przed końcowym etapem 11.

Bieżący wspólny tracker otwartych tematów: [`GOAL-LEVEL-11-ALL-OPEN-ISSUES.md`](GOAL-LEVEL-11-ALL-OPEN-ISSUES.md).

Wzorzec zakończonej paczki dokumentacyjnej:
[`R-PROC-AUTOBOT-PAKIETY-1-3-Q1/`](R-PROC-AUTOBOT-PAKIETY-1-3-Q1/).
