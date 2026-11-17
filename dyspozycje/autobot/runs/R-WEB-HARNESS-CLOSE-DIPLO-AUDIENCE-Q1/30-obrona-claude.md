# R-WEB-HARNESS-CLOSE-DIPLO-AUDIENCE-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME/PROCESS (tylko narzędzie pomiarowe `gra/tools`; kod gry `gra/src` i dane `gra/data` NIETKNIĘTE)
TEMAT: R-WEB-HARNESS-CLOSE-DIPLO-AUDIENCE-Q1
GOAL: runner zamyka blokady modalne końca tury przed „Zakończ turę”, liczy zamknięcia osobno i jawnie, stan zapisuje po każdej turze; test haka pokrywa zamykanie audiencji. Obrona: domknięcie zarzutów Evaluatora (zawyżony licznik, izolacja asercji 0e, dokumentacja).
BAZA: f80f90a9935dd9a66e009c85bf40e5b0eb19714c (origin/main)
KANDYDAT (Operator): 88c0f3045502362f8316494dcdc8cdc7092b060e
ZMIANY-COMMIT: patrz sekcja „Commit obrony” na końcu (SHA w polu `sha` raportu)

## Odpowiedź na zarzuty Evaluatora

1. Brak dowodu przyczynowego dla t51 (niska-średnia) — ODRZUCAM jako warunek zakończenia; nie zmieniam kodu.
   Dowód: dispatch wymaga, by przebieg seed 4242 „PRZECHODZIŁ przez t51 i t57” (cel ≥ t60), a nie przyczynowości. Live: `evidence/live-seed4242-turns-compact.jsonl` (t51 przeszło, sec=12.6). Że zamknięcie samo w sobie nie jest dowodem przyczyny, README już mówi wprost (`gra/tools/ai-economy-measure-README.md`, sekcja o przebiegu: „przyczynowo nie potwierdzono, że to zamknięcie je usuwa”). Bazowego runu NIE powtarzam (NIE ZMIERZONO, koszt ok. 10 min, poza zakresem dispatchu).

2. Licznik `*Closed` liczy kliknięcia, nie zweryfikowane zamknięcia (średnia) — PRZYJMUJĘ, poprawka w commicie.
   Zmiana w `gra/tools/ai-economy-measure-run.cjs`:
   - `closeEndTurnModals` liczy zamknięcie w `ctx` dopiero po 300 ms, gdy `openModalKeysInPage()` nie widzi już blokady; klik bez skutku nie podbija licznika,
   - blokady, które nie znikają, trafiają do zwracanej listy (`stuck`), a po 3 kliknięciach bez skutku pętla przerywa się i zapisuje zrzut DOM na stderr (`[econ] blokada nie znika po kliknieciu`), zamiast nabijać licznik do 300 s,
   - nowy hook test `0f` (klik bez skutku): licznik = 0, blokada zgłoszona jako niezamknięta.
   Dowód (surowe wyniki, `node tools/ai-economy-measure-hook-test.cjs --modal-only 1`):
   - poprawny runner: `PODSUMOWANIE 6/6 zielone`, EXIT 0,
   - mutacja A (usunięty `b.click()` przy audiencji, na kopii): `CZERWONE` audiencja (licznik=0, ukryta=false) + `CZERWONE` 0e (kaskada z pozostawionej audiencji), `PODSUMOWANIE 4/6`, EXIT 1; po dodaniu usunięcia atrapy po 0b kaskada znika i zostaje `PODSUMOWANIE 5/6` z jedną czerwoną asercją (audiencja), EXIT 1,
   - mutacja B (licznik podbijany przy każdym kliknięciu, bez weryfikacji, na kopii): `CZERWONE` 3 z 4 asercji liczących (licznik=2, 2, 2) i `CZERWONE` 0f (licznik=3), `PODSUMOWANIE 2/6`, EXIT 1. Mutacja B jest tą, którą Evaluator opisał jako zawyżanie; test ją teraz łapie.
   NIE ZMIERZONO: powtórka live (przebieg 60 tur) z nowym licznikiem. Wyniki live w `evidence/` pochodzą jeszcze ze starej wersji liczenia (klik = zamknięcie) i README to odnotowuje.

3. Brak testu ścieżek stanu: writeState po turze, slotCounters, pętla leczenia kolejki (niska) — ODRZUCAM w zakresie tego tematu.
   Dowód: dispatch każe dodać „przypadek na zamykanie audiencji” do `ai-economy-measure-hook-test.cjs`; test ścieżek `runSeries`/`stateOf` nie był wymagany. Funkcje `runSeries`/`writeState` nie są eksportowane przez runner (`module.exports` zawiera tylko `closeEndTurnModals`, `closeModalsInPage`, `blockerDumpInPage`, `newCtx`, `countersOf`, `COUNTER_KEYS`, `MODAL_KEYS`), więc test wymagałby przebudowy runnera. Znalezisko zostaje jako uwaga dla orkiestratora (UWAGI-DLA-ORKIESTRATORA).

4. Panel armii i karta technologii tylko na atrapach DOM, bez dowodu live (niska) — ODRZUCAM.
   Dowód: dispatch wymaga dowodu live dla przebiegu; dla audiencji (`armyMergeClosed`/`techNoticeClosed` obsłużone „tak samo” — selektory z kodu gry: `armyMergePanel.ts:231/235`, `techDiscoveryNotice.ts:97/949/956`). Atrapy DOM mają te same id/klasy i są sprawdzane w hook teście (0c, 0d, 0f). Zerowe liczniki w live to brak zdarzenia w tym przebiegu, nie brak zamykania. NIE ZMIERZONO live dla tych dwóch blokad.

5. Asercja 0e współdzieli ctx i kaskaduje (informacyjna) — PRZYJMUJĘ.
   Zmiany w `gra/tools/ai-economy-measure-hook-test.cjs`: 0e używa osobnego `ctxE`, sprawdza, że suma liczników = 0 i element zostaje w DOM oraz że `stuck` jest puste (blokada bez przycisku nie jest kliknięta, więc nie jest też „niezamknięta”). Po 0b usuwana jest atrapa audiencji, więc niezamknięta audiencja nie kaskaduje na 0c–0e. Hook test: 0b z mutacji A nadal pokazuje czerwone, a 0e nie.
   Uwaga o poprawce 5: nazwa asercji 0e zmieniona na „(zostaje w DOM)”. Ścieżka gry w `fullChecks` nie zmieniła się (kliknięcie „Wróć” w audiencji nadal pomija propozycję AI), więc hash stanu z przebiegów pomiarowych pozostaje nieporównywalny, jak napisał Evaluator — nie jest to wynik tej rundy.

## Dodatkowe zmiany
- `gra/tools/ai-economy-measure-README.md`: opis liczników zaktualizowany (liczenie po weryfikacji, zgłaszanie blokad nieznikających, uwaga, że liczniki z przebiegów przed zmianą liczą kliknięcia).

## Bramki (surowe wyniki z tej rundy, na commicie obrony)
- `node_modules/.bin/tsc --noEmit -p .` (gra/): EXIT 0.
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`, EXIT 0.
- `node tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`, EXIT 0.
- `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, EXIT 0.
- `node tools/unit-replace-test.cjs`: `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`, EXIT 0.
- `node tools/combat-test.cjs`: `COMBAT TEST: 6/6 pass`, EXIT 0.
- `node tools/ai-economy-measure-hook-test.cjs --modal-only 1`: `PODSUMOWANIE 6/6 zielone`, EXIT 0.
- `node tools/ai-economy-measure-hook-test.cjs --dist <bundle poza repo>` (pełny, build vite poza repo, `--pw` na playwright z katalogu poza repo): `PODSUMOWANIE 16/16 zielone`, EXIT 0 (dwa kolejne przebiegi; ostatni po wszystkich zmianach).
- `git diff --check`: czysto (EXIT 0).
- Mutacje: patrz pkt 2 (A: 4/6 i 5/6, EXIT 1; B: 2/6, EXIT 1).

Środowisko: `gra/node_modules` zainstalowane `npm ci` tylko na czas bramek i usunięte po pracy; bundle w katalogu scratchpad, poza repo. Playwright w katalogu scratchpad (`playwright@latest`, bez pobierania przeglądarki; używany systemowy `/usr/bin/chromium`).

## Zarzuty bez zmian w kodzie — podsumowanie
- Pkt 1 (dowód przyczynowy): ODRZUCONE — poza zakresem dispatchu; README już nie twierdzi przyczynowości.
- Pkt 3 (testy ścieżek stanu): ODRZUCONE w zakresie tematu — uwaga dla orkiestratora.
- Pkt 4 (panel/karta live): ODRZUCONE — dispatch wymaga live tylko dla audiencji; NIE ZMIERZONO live dla pozostałych.

## Commit obrony
Zmienione pliki (allowlista): `gra/tools/ai-economy-measure-run.cjs`, `gra/tools/ai-economy-measure-hook-test.cjs`, `gra/tools/ai-economy-measure-README.md`, `dyspozycje/autobot/runs/R-WEB-HARNESS-CLOSE-DIPLO-AUDIENCE-Q1/30-obrona-claude.md`. Dodawane przez `git add <ścieżka>`, bez `-A`. Nic nie zpushowano ani nie zdeployowano.

## UWAGI-DLA-ORKIESTRATORA
- Rzeczywiste liczniki z przebiegów live (`evidence/`) są z wersji „klik = zamknięcie”; przed użyciem ich jako dowodu zamykania trzeba powtórzyć przebieg seed 4242 na nowym runnerze (koszt ok. 6–10 min + dłuższe dla t57).
- Test ścieżek stanu (`writeState` po turze, `slotCounters`, pętla leczenia kolejki) nie istnieje; pokrycie tylko przez jeden live przebieg z `stuckQueueHeals=0`. Warto osobnego tematu, jeśli runner będzie eksportował `runSeries`.
- W `gra/tools/` nadal brak wzmianki o tym, że bazowe `t51` nie zostało odtworzone bez zamknięcia; to pozostaje otwartą kwestią przyczynową (opisaną w README).

RUNDY: 2/5 (runda 1: Operator; runda 2: obrona)
NASTĘPNY KROK: Evaluator — weryfikacja poprawek 2 i 5 (testy modalne i mutacje w tym raporcie); po PASS orkiestrator decyduje o powtórce live i integracji.
DEPLOY/PUSH: NIE WYKONANO
