# Obrona Operatora — runda 3 (HAIKU) — R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1
GOAL: panel dyplomacji pokazuje zmęczenie wojną (strona wygrywająca) i desperację (strona przegrywająca) w wojnach gracz↔AI i AI↔AI; obrona r3 domyka zarzuty Evaluatora w fixturach testu wyprowadzonych ze skali 20 tur.
ZMIANY/COMMIT: baza 9f5befa49 (kandydat r3); commit obrony 804ca6735 (tylko gra/tools/diplo-weariness-display-test.cjs, 10 insertions / 10 deletions); ten raport w osobnym commicie (tylko ten plik). Brak zmian w gra/src, war-weariness*.ts ani JSON. Brak git add -A.
TESTY (surowe wyjścia; gra/ po `npm ci --ignore-scripts`; worktree na 804ca6735):
- tsc --noEmit: exit 0
- logic-test: `LOGIC OK (213/213)`
- tech-tree-test: `tech-tree-test: 20 pass, 0 fail`
- research-test: `ALL GREEN`
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`
- combat-test: `All sanity checks passed.` (bez liczby; exit 0)
- diplo-weariness-display-test: `PASSED: 52 / FAILED: 0 / TOTAL: 52`, `ALL PASSED`
- diplo-weariness-20-turns-test: `PASS=30 FAIL=0`
- diplo-weariness-city-only-test: `PASS=30 FAIL=0`
- diplo-weariness-unconditional-end-test: `PASS=22 FAIL=0`
- Nie wykonano: npm run build/dev (zakaz dispatchu); zrzutów Chromium nie powtórzono (zarzut 3).

## Odpowiedzi na zarzuty Evaluatora (977c80999)

### Zarzut 1 — PRZYJMUJĘ
Fixtury A1, A3, A4, E1, E3 nie były wyprowadzone z WAR_WEARINESS_PARAMS (120/150/10/300 tur). Zmiany:
- A1, A3, E1 (oba widoki): `turnsAtWar` = `T(0.5)` (= round(0,5 · pelneTur) = 10). Poziom = 0,5 + 0,1·2 = 0,7, bez nasycenia do 1,0.
- A4: `turnsAtWar` = `T(0.5)` (spójność; A4 nie sprawdza poziomu).
- E3 (wejście pary): `turnsAtWar` = `T(1.5)` = 30, zgodnie z poziomem `lvl` liczonym z `T(1.5)`.
- Komentarz A1 poprawiony: „0,5·pelneTur tur wojny (T(0.5)=10 → poziom 0,5+0,2=0,7)”.
Dowód: `grep -nE 'turnsAtWar: [0-9]'` po zmianie nie zwraca literałów tur w wywołaniach fixtur; pozostałe liczby to siły, armiaPkt albo zero (E4, bez wpływu na poziom). Asercje bez zmian. Wynik 52/0.

### Zarzut 2 — ODRZUCAM (zmiana asercji nie osłabia testu)
Tolerancja `< 1e-9` zastępuje `===` tylko w asercjach porównujących desperację z selektora z wartością z `loserDespair` (A1, A5, E2e/E2f, E3a). Dowód floatowy (node, to środowisko):
- `1 - 0.8` = `0.19999999999999996`, `200/1000` = `0.2`, `1-0.8 === 0.2` → `false`, różnica `5.55e-17`.
- Selektor liczy udział przegrywającego jako `1 - shareA` (war-weariness-view.ts:108), oczekiwanie w teście jako `200/1000`: ta sama wielkość, inny zapis w float.
Tolerancja 1e-9 jest o ~7 rzędów większa od tego szumu, więc nie przepuści realnej rozbieżności (błąd `peak`, zamiana stron). Nie przywracam `===`.

### Zarzut 3 — NIE_ZMIERZONO (poprawki nie wprowadzam w tym temacie)
Zrzuty w `evidence/` pochodzą z r2 (przed scaleniem FALI 689). Runda 3 zmienia wyłącznie plik testu (dispatch r3: „ŻADNYCH zmian w gra/src”). Ponowna weryfikacja w Chromium wymaga builda gry (zakaz `npm run build/dev` w dispatchu) i nie była częścią zakresu r3. Stan: NIE_ZMIERZONO po merge FALI 689. Decyzja o pomiarze należy do orkiestratora / Final Control.

## Mutacje
Mutantów D3/D5 nie uruchamiałem ponownie: zmiana dotyczy wyłącznie wejść liczbowych fixtur, a asercje porównujące z `loserDespair`/`warWearinessLevel` i wiązanie D1–D8 są bez zmian (test 52/52 po zmianie). Wynik mutacji z r3 (na 9f5befa49, wg zarzutów Evaluatora): mutacja 1 → 49/52, mutacja 2 → 51/52 — NIE_ZMIERZONO ponownie na 804ca6735.

## BLOKADY
brak (zarzut 3 pozostaje NIE_ZMIERZONO, bez wpływu na bramki testowe)

## RUNDY
3/5 (obrona w rundzie 3; Operator HAIKU)

## NASTĘPNY KROK
Evaluator r4 (weryfikacja commita 804ca6735 i tego raportu); Final Control po PASS; orkiestrator decyduje o pomiarze wizualnym po FALI 689 (zarzut 3).

## UWAGI-DLA-ORKIESTRATORA
- Worktree startował na ec00fc0e3 (ROBOCZA); przełączono na 9f5befa49 (detached) zgodnie z dispatchem, commit fixtur 804ca6735 ponad nim.
- Katalog runu nie istniał w 9f5befa49; plik utworzony w nowym katalogu. Historia r1–r3 jest w 977c80999 (Evaluator r3) i 10-operator-claude.md.
- Brak push i integracji. Nie wywołano żadnego narzędzia tworzącego sesje.

DEPLOY/PUSH: NIE WYKONANO
# R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1 — obrona, runda 2 (odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES (kod i testy gotowe; dowód live ograniczony do tury 1 — patrz zarzut 1)
DOMAIN: GAME
TEMAT: R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1
GOAL: panel dyplomacji pokazuje zmęczenie wojną strony wygrywającej i desperację strony przegrywającej (wojna gracz↔AI oraz AI↔AI), wartości z tych samych funkcji i tych samych wejść co tick.
BAZA: kandydat 575c1ec31 (gałąź robocza `r2-obrona-diplo-weariness`, od 575c1ec31).
ZMIANY-COMMIT: SHA końcowy w polu `sha` odpowiedzi (commit obrony r2 na gałęzi `r2-obrona-diplo-weariness`). Allowlista: `gra/src/game/war-weariness-view.ts`, `gra/src/main.ts` (wiązanie: helpery i wywołania, ok. 42 linie zmian), `gra/tools/diplo-weariness-display-test.cjs`, katalog `evidence/` w tym runie. `war-weariness.ts`, `war-weariness-params.json` i `diplomacy-military-strength.ts` NIE zmienione.

## Odpowiedzi na zarzuty

### Zarzut 1 — brak zrzutu z żywego Chromium — PRZYJMUJĘ (zrobiony, z ograniczeniem)
- Dowód: `evidence/01-panel-dyplomacji-ai1-wojna-gracz-i-ai.png` (element `.da-card.them`), `evidence/01b-pelny-ekran.png`, `evidence/01-dom-odczyt.json`, `evidence/02-konsola-bledy.json`.
- Co pokazuje zrzut (odczyt z DOM, tura 1, scenariusz `?playtest=mapa`): wojna gracz↔Grecy — wiersze „Ty — Zmęczenie wojną 0%” i „Grecy — Zmęczenie wojną 0%”; wojna AI↔AI 1↔2 — w „W stanie wojny z” przy „Chińczycy” procent „Zmęczenie wojną 0%”. `errors: 0` (pageerror i console.error).
- Metoda: bundle zbudowany `vite build` w KOPII `gra/` poza repo (`scratchpad/gracopy`), bo dispatch zabrania `npm run build` w `gra/`; Chromium z `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (domyślny headless-shell nie istnieje), skrypt `scratchpad/shot.cjs`.
- OGRANICZENIE (NIE_ZMIERZONO): wartości są zerowe, bo wojny mają 0 tur. Próba postarzenia wojny przez `__eraTestDebug.endTurn()` kończyła grę ekranem „ZWYCIĘSTWO” już w turze 2 (scenariusz playtest). Desperacja >0 i procenty niezerowe NIE są zobrazowane live — pokrywają je testy E (funkcje czyste). Wygląd procentów przy wartościach >0 i tooltip: NIE_ZMIERZONO.

### Zarzut 2 — test wiązania tylko statyczny, mutanty M3/M4 przeżywają — PRZYJMUJĘ (naprawione)
- Logika przeniesiona do czystych helperów, które test wykonuje behawioralnie (część E w `diplo-weariness-display-test.cjs`): `warWearinessSideView` (strona po id, nie po kolejności a/b), `peakForCurrentWar` (szczyt tylko dla bieżącej wojny), tryby `reference: 'tick' | 'ai'`.
- Mutacje, każda na kopii i przywrócona (`scratchpad/mut.sh`, po przywróceniu `RESTORED_OK`, końcowo 52/52):
  - M3 zamiana own/rival w `warWearinessSideView` → 49/51, FAIL 2 (E1a, E1b…);
  - M4a szczyt zawsze undefined w helperze → FAIL 1 (E2a/E2e);
  - M4b w main.ts brak odczytu szczytu → FAIL 1 (D3);
  - M5 wojny AI↔AI bez wiązania → FAIL 1 (D4);
  - M6 helper znowu używa `diploWarStateFor` (zapis) → FAIL 1 (D6);
  - M7 zamiana gracz/rozmówca w main.ts → FAIL 1 (D5).
- Test wiązania w main.ts pozostaje statyczny dla samego wywołania (D1–D8), ale zachowanie orientacji i szczytu jest sprawdzane na helperach wywoływanych przez te wywołania.

### Zarzut 3 — wejścia pary gracz↔AI różnią się od ai.ts — PRZYJMUJĘ (dla pary gracz↔AI), tick AI↔AI bez zmian
- Dla pary gracz↔AI (`reference: 'ai'`) helper robi dokładnie to, co `ai.ts` (l. ~7027–7037): poziom = bieżący `warWearinessLevel` (bez szczytu), udział siły NIEprzycięty, desperacja tylko gdy `isWarWeary(level)`, inaczej 0.
- Dla pary AI↔AI (`reference: 'tick'`) zostaje zgodność z `runWarWearinessTick` (szczyt pary, udział przycięty do `udzialWyraznie`, bez bramki) — Evaluator potwierdził tę część jako poprawną.
- Odstępstwo od dosłownego dispatchu (świadome): dispatch prosił o szczyt również dla pary gracz↔AI „jeśli stan jest”. Kod `ai.ts` dla gracza liczy z bieżącego poziomu, a `runWarWearinessTick` obsługuje pary AI↔AI — więc dla pary z graczem szczyt nie jest używany. NIE_ZMIERZONO: czy `warWearinessByPairKey` zawiera kiedykolwiek wpisy z graczem (nie sprawdzałem tego pliku/ścieżki poza tickiem).
- Dowód testowy: E3 — znaleziona para z przegrywającym o udziale w (0,45; 0,5): tick → desperacja = `loserDespair(share = 0,45)` > 0 (E3a); ai → desperacja = 0 (E3b). E4 — ai poniżej `progChetnosci` → 0 (E4a), tick bez bramki > 0 (E4b).

### Zarzut 4 — helper może zapisać stan gry na ścieżce odczytu — PRZYJMUJĘ (czesciowo), szczyt ODRZUCAM
- Naprawione zapisy na ścieżce odczytu:
  - nowa `diploWarStateForRead` (main.ts) zastępuje `diploWarStateFor` w helperze: nie wywołuje `diploEnsureWarStart` (nie ustawia `wojnaStartTura`), nie zdejmuje stempla przy pokoju, nie wywołuje `setDiploPairMeta`. Wartości identyczne: brak stempla → początek = bieżąca tura, tak jak zwróciłby `diploEnsureWarStart`; pokój → zera. Test D6/D7.
  - `diploMilitarySideOf(a, b, readOnly = true)` na ścieżce odczytu: `diplomacyPairMeta.get(...) ?? freshDiploPairMeta()` zamiast `getDiploPairMeta`, które tworzy domyślny wpis w `diplomacyPairMeta`. Tick nadal woła funkcję bez `readOnly` (zachowanie bez zmian). Test D8.
  - Sprawdzone: w `objectivePowerByOwner` zapis jest tylko w pętli l. ~2910, nie wewnątrz `buildObjectivePowerForOwner` (l. 2780), którą woła ścieżka odczytu. Wnętrza `buildObjectivePowerForOwner` nie audytowałem w całości — NIE_ZMIERZONO, czy nie zapisuje do innych struktur.
- ODRZUCAM `max(peak, current)`: tick AI↔AI (`runWarWearinessTick`) używa `st.peak` po `stepPairState` w danym momencie, a decyzje AI biorą ten sam szczyt. Panel z `max` pokazywałby wartość, której AI nie widzi przy decyzji. Różnica to najwyżej jedna tura opóźnienia szczytu, identyczna jak u AI. Dispatch wymaga „identycznych wejść z tickiem”.
- NIE_ZMIERZONO: wpływ na determinizm (#349/#362) — nie uruchamiałem testu determinizmu ani pomiaru hash save po otwarciu panelu.

## Testy i bramki (surowe wyniki)
- `npx tsc --noEmit` (w `gra/`): TSC_EXIT=0, 0 linii w logu.
- `node tools/diplo-weariness-display-test.cjs`: PASSED: 52 / FAILED: 0 / TOTAL: 52 (A 13, B 5, C 8, D 8, E 18).
- Mutanty M3, M4a, M4b, M5, M6, M7: patrz zarzut 2; każdy czerwony, oryginały przywrócone (`RESTORED_OK`).
- Przeglądarka: `scratchpad/shot.cjs` (TURNS=0), `worldTurn: 1`, `errors: 0`.
- Nie uruchamiano innych testów gry (dispatch: bramki tematu). Dług testowy z innych tematów nie był przedmiotem tej rundy.

## BLOKADY
- Brak wartości >0 w zrzucie live (ograniczenie scenariusza playtest: zwycięstwo po turze 2). Opisane jako NIE_ZMIERZONO w zarzucie 1.
- Wpływ na determinizm i zawartość save — NIE_ZMIERZONO (zarzut 4).

## RUNDY
2/5 (runda 2 obrony, ta sama para ID).

## NASTĘPNY KROK
Final Control r2: sprawdzić commit obrony na `r2-obrona-diplo-weariness`, ponowić `tsc` i test, a zarzut 4 (determinizm) potraktować jako otwarty do pomiaru przez orkiestratora.

## UWAGI-DLA-ORKIESTRATORA
- W relayowanej prośbie użytkownika (okno „Umowa wymiany surowców”, dodawanie własnej i cudzej oferty w jednym oknie bez przeładowania) — to osobny temat (rejestr #366, R-WEB-UI-TRADE-DIALOG-NO-RERENDER-BOTH-SIDES-Q1). Nie wykonywałem go w tym kroku; decyzja o zakolejkowaniu należy do orkiestratora.
- Nie tworzyłem sesji ani zadań (zakaz spawn_task/create_session respektowany).
- Dopisałem `diploMilitarySideOf(..., readOnly = false)` — parametr domyślny zachowuje dotychczasowe zachowanie wszystkich istniejących wywołań.

DEPLOY/PUSH: NIE WYKONANO
