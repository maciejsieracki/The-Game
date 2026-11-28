# DLUG-TESTOWY-Q16C — stan na 2026-11-28 (temat R-WEB-TEST-DEBT-Q16C, runda 2 Operatora)

## Stan wiążący

- Baza kodu: `8b98d9f414c27b729ed26289e64c020cece8d4f4` (origin/main dbcc12f71 + commity Q16C r1). Zero zmian w `gra/src/**` i `gra/data/**` (potwierdzone: zmieniono tylko pliki `gra/tools/*-test.cjs`).
- Bramki: `tsc --noEmit` RC 0; `logic-test.cjs` LOGIC OK (213/213); `ai-test.cjs` 297 passed, 0 failed.

| Test | Wynik r2 | Klasa | Dowód |
|---|---|---|---|
| `ai-wojny-zwykle-cap-dwa-miasta-test.cjs` | ZIELONY: 22 PASS / 0 FAIL | A (artefakt testu, naprawiony) | runs/…/50 (r2) i runs/…/55 (r3, 22/0); mutacje na całym teście: runs/…/56 (A1, RC 1) i runs/…/57 (A2, 21 PASS / 1 FAIL) |
| `hotseat-drugi-fotel-tura-test.cjs` | ZIELONY: PASS (5/5 scenariuszy) w dwóch kolejnych pełnych przebiegach | A (ekran „Odkryłeś nową cywilizację” zasłaniał mapę) | runs/…/43, 44 (PASS); 40 (próba przed poprawką, FAIL scen. 5); 41, 42 (diagnostyka kliku) |
| `hotseat-etap4-noop-test.cjs` | NIE ZAMKNIĘTE: BLOCK w każdej z 6 prób (r2 + r3), zawsze zapis tury 23 | NIE ROZSTRZYGNIĘTE (nie A, nie C, nie B; hipoteza bitwy nieudowodniona) | runs/…/45–49, 58 |

### 1. ai-wojny-zwykle-cap-dwa-miasta-test.cjs — ZIELONY, klasa A

- Przebieg bazowy po poprawkach r1: 22 PASS / 0 FAIL (runs/…/50).
- Mutacja A1 (harness, kopia testu bez wywołania `prepareEndTurnGate` w `runEndTurnAndSettle`, ustawienie `gate = {canEnd:true}`): 2 PASS / 2 FAIL; fast-forward nie osiąga stanu settled w turze 17 (`DIAG {"inProg":false,"turn":17}`) — runs/…/51. Czerwone, zgodnie z oczekiwaniem.
- Mutacja A1 na CAŁYM teście r3 (kopia `tools/tdq16c-mutA-ai-wojny.cjs`, linia 147: wywołanie `prepareEndTurnGate` usunięte, zastąpione odczytem `gateInfo().canEnd`): RC 1 po 148 s, `błąd fatalny: bramka Zakończ turę zamknięta po prepareEndTurnGate: {"canEnd":false}` (runs/…/56). Czerwony. Kopia usunięta z repo.
- Mutacja A2 na CAŁYM teście r3 (kopia `main.ts` w scratchpadzie, linia 47967: `peaceLocked: isPeaceLockedBetween(ownerId, targetId)` → `peaceLocked: false`, test z `MAIN_TS` wskazującym na kopię): `21 PASS, 1 FAIL`, jedyny FAIL to asercja F (`main.ts: isWarTreatyBlocked(peaceLocked=isPeaceLockedBetween) gate…`) (runs/…/57, RC 1, 205 s). UWAGA: asercja F jest pinem tekstowym źródła (regex). Mutacja czerwona dowodzi, że pin reaguje na zmianę warunku; NIE dowodzi zachowania gry. Zachowanie tej bramki nie jest testowane przez F.
- Przywrócenie oryginalnego testu: 22/0 w 203 s (runs/…/55).

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
- Runda 3 (obrona), kolejne przebiegi (runs/…/58; kopia z sondą DOM usunięta z repo):
  - Tura 23 pada w każdej próbie (łącznie 6 prób: 3 + 3); tury 2–22 zapisują się. Wynik: timeout IDB albo „Target page … closed” (ten sam wzorzec co w r2).
  - Sonda DOM po timeoutcie: brak `#civ-welcome-screen-root`, brak widocznego `[role=dialog]`, brak widocznego elementu o klasie/id z „battle”/„bitw”. `civ-wiki-hub` jest w DOM bez klasy `open` (ukryty), więc nie blokuje. Obecność węzła DOM nie dowodzi więc nakładki bitwy.
  - Sonda tekstu „Zapis niedostępny w trakcie bitwy” po `Control+s` nie rozstrzyga: komunikat nie pojawia się w `innerText` także przy udanych zapisach (t2–t22), więc brak wyniku nie dowodzi braku komunikatu.
  - Kod: `doQuickSave` wychodzi bez logu tylko przy `isSaveBlockedByBattle()` (bramka przed `persistSaveToSlot`); przy udanym zapisie loguje `[Save] autosave tura=N`. W t23 brak tego logu, w t22 jest.
  - Ustawienia testu: nowa gra z `kosztJednostekPace = niski`, `buildingCostPace = niski`, `wzrostLudnosciPace = wysoki` (runs/…/49, wiersz NewGame). To nie jest poziom maksymalny. NIE ZMIERZONO na maksimum: zmiana ustawień zmienia hashe snapshotów, więc nie wykonano jej bez osobnego dispatchu.
- Status: NIE ZAMKNIĘTE. Klasa nie jest A (test nie ma wadliwego pinu ani selektora, na który by się opierał), nie jest C (ten sam krok pada deterministycznie w t23, a nie losowo), nie jest B (brak dowodu błędu gry). Następny krok: zmierzyć przez hak testowy (nie DOM) `isBattleSceneOpen()` i `isPostBattleSummaryOpen()` w t23, potem decyzja A/B.

## Pytanie B (skok Spichlerza −11 → −108 w diagnozie r1) — NIE ROZSTRZYGNIĘTE w r2

- Nie zmierzono. Narzędzie diagnostyczne z r1 (`tools/tdq16c-diag-ai-wojny.cjs`) nie zostało zacommitowane do repo, więc nie odtworzono scenariusza.
- Analiza z kodu (bez zmian w grze):
  - Prognoza Spichlerza po ticku to `spichlerzPo = spichlerzStolicy − kosztArmii` (`src/game/no-negative-stocks.ts`, `projectEmpireFoodAfterTick`, ok. linii 300–320). Wartości pochodzą z realnego `advanceEmpireFood` na kopii stanu (`src/game/empire-food.ts`, ok. linii 196–330).
  - `spichlerzStolicy` = zapasy + suma dodatnich bilansów miast − pokrycie deficytów (`empire-food.ts`, pętla `econ.perCity`). `kosztArmii` = `militaryFoodConsumptionWithSpichlerz(…, kosztJednostekPace)`.
  - Koszt racji miasta = `pop × rationFoodCostPerPop(poziom) × mnożnik epoki` (`src/game/population-growth-v85.ts`, `computeCityRationCost`, ok. linii 229–240). Przy racji 0 człon racji spodziewany jest mały lub zerowy, więc sam spadek racji nie tłumaczy spadku prognozy o 97 jednostek. **Nie sprawdzono** wartości `rationFoodCostPerPop` dla poziomu 0 ani wpływu racji 0 na produkcję `zywnoscBrutto` (`economy.ts`, ok. linii 1053–1073).
  - Hipotezy do sprawdzenia w r3 (nie potwierdzone): (a) produkcja brutto miasta spada do 0 przy racji 0; (b) koszt jednostek wzrasta z powodu `kosztJednostekPace` i rozgałęzienia `UPKEEPMULT` (żywność jednostek 4/16/64 × kurs 0,2) przy zamrożonej produkcji; (c) wcześniejsze deficyty miast pasywnego gracza przechodzą w `deficits` bez pokrycia.
- Runda 3 — wynik analizy z kodu (bez live):
  - `empire-food.ts` (ok. 245–283): dla miasta z `bilans >= 0` `central += bilans`; deficyty pokrywane z `central`. Przy racji 0 `kosztRacji = 0`, więc `bilans = produkcja ≥ 0` i żadne miasto nie jest w deficycie. Zatem `spichlerzStolicy` przy racji 0 jest co najmniej tak duże jak przy racji 12. Sama zmiana racji nie może obniżyć prognozy.
  - `spichlerzPo = spichlerzStolicy − kosztArmii` (`no-negative-stocks.ts`, `projectEmpireFoodAfterTick`). Spadek o 97 między t17 a t18 wymaga więc wzrostu `kosztArmii` o co najmniej ok. 97 (albo spadku `spichlerzStolicy` z innej przyczyny, np. zmiany zapasów), czyli zmiany zestawu jednostek lub ich `paceUtrzymaniaWlasciciela` między tymi turami.
  - `paceUtrzymaniaWlasciciela` (`ai-free-unit-upkeep.ts`) zwraca 0 dla gracza tylko w turach 1–15 (`playerUnitUpkeepGraceActive`). Zakres t17–18 leży poza oknem łaski, więc łaska nie tłumaczy skoku.
  - Wniosek: jeśli skok jest realny, przyczyną jest zmiana jednostek (produkcja, utrata, wejście do garnizonu), a nie sama racja. To jest hipoteza do pomiaru, nie ustalenie. Hipoteza (a) z r2 (`produkcja → 0` przy racji 0) jest sprzeczna z kodem: produkcja brutto nie zależy od racji w `advanceEmpireFood`.
  - Nie odtworzono live. Do rozstrzygnięcia potrzebny zrzut `units` (typ, właściciel, garnizon, `onOwnTerritory`) i `kosztArmii` w t17 i t18 oraz `perCityRows`.
- Czy to defekt czy zamierzone: NIE ROZSTRZYGNIĘTE. Brak dowodu defektu; brak poprawki. Klasa: nie ustalona (nie B, bo nie odtworzono; nie zamierzone, bo nie zweryfikowano). Stan do wyjaśnienia w kolejnej rundzie: pomiar `kosztArmii` i listy jednostek per tura w t16–18.

## Nie ZMIERZONO (jawnie)

- Pytanie B (skok −11 → −108): nie odtworzono live; tylko analiza kodu (powyżej).
- hotseat-etap4-noop: pełny przebieg 30 tur nie został ukończony w żadnej próbie (r2 i r3, łącznie 6 prób; zawsze tura 23).
- Przyczyna zablokowania zapisu w t23 (hotseat-etap4): nie ustalona. Nie zmierzono `isBattleSceneOpen()` ani `isPostBattleSummaryOpen()` w t23 (sonda DOM nie daje tego dowodu).
- Maksimum ustawień dla testu etap4: nie zmierzono i nie zmieniano (patrz sekcja etap4).
- Scenariusze hotseat na kolejnych ziarnach. NIE SPRAWDZONO, czy `hotseat-drugi-fotel-tura-test.cjs`, `hotseat-etap4-noop-test.cjs` i `ai-wojny-zwykle-cap-dwa-miasta-test.cjs` ustawiają suwaki kosztów/trudności na poziom maksymalny (reguła testowania na maksimum). W tej rundzie nie zmieniano ustawień żadnego z trzech testów; uruchomiono je w ustawieniach, jakie mają w kodzie.

## Uwagi dla orkiestratora

- Zakazy przestrzegane: brak spawn_task/create_session/create_trigger/send_later, brak run_in_background (tool automatycznie przeniósł kilka przebiegów w tło; czekano na nie przez polling pliku wyjściowego), brak nohup/&, brak --no-gpg-sign, brak zmian konfiguracji podpisu.
- Zmiany w `gra/src` i `gra/data`: 0.
- Tymczasowe katalogi `/tmp/civ-hotseat-*` są usuwane przez test przy wyjściu; `gra/node_modules` jest ignorowany przez git.
