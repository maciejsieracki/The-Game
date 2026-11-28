# DLUG-TESTOWY-Q16C — stan na 2026-11-28 (temat R-WEB-TEST-DEBT-Q16C, runda 2 Operatora)

## Stan wiążący

- Baza kodu: `8b98d9f414c27b729ed26289e64c020cece8d4f4` (origin/main dbcc12f71 + commity Q16C r1). Zero zmian w `gra/src/**` i `gra/data/**` (potwierdzone: zmieniono tylko pliki `gra/tools/*-test.cjs`).
- Bramki: `tsc --noEmit` RC 0; `logic-test.cjs` LOGIC OK (213/213); `ai-test.cjs` 297 passed, 0 failed.

| Test | Wynik r2 | Klasa | Dowód |
|---|---|---|---|
| `ai-wojny-zwykle-cap-dwa-miasta-test.cjs` | ZIELONY: 22 PASS / 0 FAIL | A (artefakt testu, naprawiony) | runs/…/50-ai-wojny-baza-22-0.txt; mutacje: runs/…/51 (A1) i wynik regex poniżej (A2) |
| `hotseat-drugi-fotel-tura-test.cjs` | ZIELONY: PASS (5/5 scenariuszy) w dwóch kolejnych pełnych przebiegach | A (ekran „Odkryłeś nową cywilizację” zasłaniał mapę) | runs/…/43, 44 (PASS); 40 (próba przed poprawką, FAIL scen. 5); 41, 42 (diagnostyka kliku) |
| `hotseat-etap4-noop-test.cjs` | NIEZAMKNIĘTE: BLOCK w każdej próbie (zapis tury 23) | NIEROZSTRZYGNIĘTE (podejrzenie: A, brak obsługi okna bitwy/podsumowania) | runs/…/45–49 |

### 1. ai-wojny-zwykle-cap-dwa-miasta-test.cjs — ZIELONY, klasa A

- Przebieg bazowy po poprawkach r1: 22 PASS / 0 FAIL (runs/…/50).
- Mutacja A1 (harness, kopia testu bez wywołania `prepareEndTurnGate` w `runEndTurnAndSettle`, ustawienie `gate = {canEnd:true}`): 2 PASS / 2 FAIL; fast-forward nie osiąga stanu settled w turze 17 (`DIAG {"inProg":false,"turn":17}`) — runs/…/51. Czerwone, zgodnie z oczekiwaniem.
- Mutacja A2 (regex asercji F, kopia `src/main.ts` w katalogu tymczasowym, linia 47967: `peaceLocked: isPeaceLockedBetween(ownerId, targetId)` → `peaceLocked: false`): wzorzec F zwraca `match: true` na bazie i `match: false` na mutancie. Test czerwony na mutancie. Kopia nie została wstawiona do `gra/src`.
- Przywrócenie oryginalnego testu: 22/0 (runs/…/50).

### 2. hotseat-drugi-fotel-tura-test.cjs — ZIELONY, klasa A

- Pierwszy pełny przebieg r2 (bez poprawki): scenariusze główny, regresja, evaluator #1, evaluator #2 — PASS; scenariusz R-HOTSEAT-RECZNY-RUCH-GRACZ2-Q1 — FAIL (`planned=false, moved=false`). Chromium nie padł (brak SIGSEGV i „Target closed”), więc nie jest to klasa C (runs/…/40).
- Diagnostyka (`tdq16c-diag-seat2-click.cjs`, usunięta po pomiarze; wyniki w runs/…/41, 42): w scenariuszu klik w sąsiedni heks trafia w element DOM `DIV.cww-body`/`LI`/`H3` zamiast w `CANVAS`. Przyczyną jest modalny ekran „Odkryłeś nową cywilizację Rzymianie” (`#civ-welcome-screen-root`, z-index 9650), który pojawia się po założeniu miasta przez fotel 2 i nie jest zamykany przez scenariusz.
- Po zamknięciu ekranu helperem `closeCivWelcome` (z `_live-ready.cjs`, ta sama procedura co w 12 innych testach live) klik trafia w `CANVAS`, `planned=1`, a jednostka wykonuje marsz (runs/…/42).
- Zmiana w teście (4 linie): import `closeCivWelcome` i wywołanie `await closeCivWelcome(page)` tuż przed zbieraniem stanu `beforeClick`. Asercje bez zmian.
- Pełne przebiegi po poprawce: runs/…/43 (PASS, 5/5) i runs/…/44 (PASS, 5/5). Selektory kreatora zmienione w r1 (`.civ-newgame .nav .next`) zweryfikowane przez te przebiegi: wszystkie pięć scenariuszy przechodzi kreator i dochodzi do swoich asercji.
- Mutacja czerwona→zielona: bez wywołania `closeCivWelcome` scenariusz 5 pada (runs/…/40); z wywołaniem przechodzi (runs/…/43, 44).

### 3. hotseat-etap4-noop-test.cjs — NIEZAMKNIĘTE

- Każda próba (3 wewnętrzne przebiegi w `runOnceWithRetry`) kończy się błędem `saveAndReadSnapshot: timeout czekania na zapis tury 23` (runs/…/45, 47, 48). Tury 1–22 zapisują się poprawnie (w logu konsoli `[Save] autosave tura=N` dla N=2…22; runs/…/49).
- Pierwsza diagnoza: przy timeoutcie na ekranie widoczny był `#civ-welcome-screen-root` (runs/…/46). Dodano `closeCivWelcome` przed każdym zapisem; po poprawce ekran znika, ale blokada zapisu w turze 23 zostaje (runs/…/47, 48).
- Co wiadomo z logu konsoli (runs/…/49):
  - W turze 23 `Autosave rotacyjny slot=autosave-2 tura=23` się wykonuje — stan gry zapisuje się, więc rotacyjny autozapis nie jest zablokowany.
  - Brak wpisu `[Save] autosave tura=23` — ręczny szybki zapis (Ctrl+S → `doQuickSave`) nie zapisał slotu.
  - `doQuickSave` (src/main.ts ok. 43091) wychodzi wcześnie tylko w dwóch przypadkach: `isSaveBlockedByBattle()` (scena bitwy lub podsumowanie bitwy otwarte) albo `isPlayerDefeatedNow()`. Drugi przypadek zapisałby `[Save] pomijam szybki zapis -- stan porazki` — tego wpisu nie ma. Zostaje więc bitwa/podsumowanie bitwy, które test nie rozstrzyga. Hipoteza nie jest potwierdzona: nie ustalono selektora DOM nakładki bitwy w tej rundzie.
- Chromium w jednej z prób zakończył się „Target page … closed” (runs/…/45, próba 2). To nie jest powtarzalny wzorzec; główna blokada ma inną przyczynę.
- Status: NIE ZAMKNIĘTE. Nie klasyfikuję jako C (brak dowodu infrastruktury), nie klasyfikuję jako B (brak dowodu błędu gry). Następny krok: w teście, przed `Control+s`, rozstrzygnąć otwartą nakładkę bitwy/podsumowania (realny klik „Dalej/Kontynuuj” w jej DOM), z dowodem w logu, że `isSaveBlockedByBattle()` przestało być prawdą; potem 3 próby.

## Pytanie B (skok Spichlerza −11 → −108 w diagnozie r1) — NIE ROZSTRZYGNIĘTE w r2

- Nie zmierzono. Narzędzie diagnostyczne z r1 (`tools/tdq16c-diag-ai-wojny.cjs`) nie zostało zacommitowane do repo, więc nie odtworzono scenariusza.
- Analiza z kodu (bez zmian w grze):
  - Prognoza Spichlerza po ticku to `spichlerzPo = spichlerzStolicy − kosztArmii` (`src/game/no-negative-stocks.ts`, `projectEmpireFoodAfterTick`, ok. linii 300–320). Wartości pochodzą z realnego `advanceEmpireFood` na kopii stanu (`src/game/empire-food.ts`, ok. linii 196–330).
  - `spichlerzStolicy` = zapasy + suma dodatnich bilansów miast − pokrycie deficytów (`empire-food.ts`, pętla `econ.perCity`). `kosztArmii` = `militaryFoodConsumptionWithSpichlerz(…, kosztJednostekPace)`.
  - Koszt racji miasta = `pop × rationFoodCostPerPop(poziom) × mnożnik epoki` (`src/game/population-growth-v85.ts`, `computeCityRationCost`, ok. linii 229–240). Przy racji 0 człon racji spodziewany jest mały lub zerowy, więc sam spadek racji nie tłumaczy spadku prognozy o 97 jednostek. **Nie sprawdzono** wartości `rationFoodCostPerPop` dla poziomu 0 ani wpływu racji 0 na produkcję `zywnoscBrutto` (`economy.ts`, ok. linii 1053–1073).
  - Hipotezy do sprawdzenia w r3 (nie potwierdzone): (a) produkcja brutto miasta spada do 0 przy racji 0; (b) koszt jednostek wzrasta z powodu `kosztJednostekPace` i rozgałęzienia `UPKEEPMULT` (żywność jednostek 4/16/64 × kurs 0,2) przy zamrożonej produkcji; (c) wcześniejsze deficyty miast pasywnego gracza przechodzą w `deficits` bez pokrycia.
- Czy to defekt czy zamierzone: NIE ROZSTRZYGNIĘTE. Brak dowodu defektu; brak poprawki. Do r3 potrzebny pomiar per miasto w turach 17–18 po `setRationAll(0)` (pola `produkcja`, `kosztRacji`, `bilans` z `perCityRows` oraz `kosztArmii`, `spichlerzStolicy`).

## Nie ZMIERZONO (jawnie)

- Pytanie B (skok −11 → −108): nie odtworzono; tylko analiza kodu (powyżej).
- hotseat-etap4-noop: pełny przebieg 30 tur nie został ukończony w żadnej próbie.
- Mutacja A2 wykonana na kopii `main.ts` w katalogu tymczasowym tylko dla wzorca regex (bez uruchamiania całego testu).
- Scenariusze hotseat na kolejnych ziarnach. NIE SPRAWDZONO, czy `hotseat-drugi-fotel-tura-test.cjs`, `hotseat-etap4-noop-test.cjs` i `ai-wojny-zwykle-cap-dwa-miasta-test.cjs` ustawiają suwaki kosztów/trudności na poziom maksymalny (reguła testowania na maksimum). W tej rundzie nie zmieniano ustawień żadnego z trzech testów; uruchomiono je w ustawieniach, jakie mają w kodzie.

## Uwagi dla orkiestratora

- Zakazy przestrzegane: brak spawn_task/create_session/create_trigger/send_later, brak run_in_background (tool automatycznie przeniósł kilka przebiegów w tło; czekano na nie przez polling pliku wyjściowego), brak nohup/&, brak --no-gpg-sign, brak zmian konfiguracji podpisu.
- Zmiany w `gra/src` i `gra/data`: 0.
- Tymczasowe katalogi `/tmp/civ-hotseat-*` są usuwane przez test przy wyjściu; `gra/node_modules` jest ignorowany przez git.
