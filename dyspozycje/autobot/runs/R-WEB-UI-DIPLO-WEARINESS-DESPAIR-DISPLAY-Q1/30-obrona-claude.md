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
