# R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1 — obrona Operatora (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES (zarzuty 1, 2, 7 przyjęte i poprawione w kodzie/testach; 3, 4, 5, 6, 8, 9, 10, 11, 12 przyjęte jako otwarte — NIE ZROBIONE w tej rundzie)
DOMAIN: GAME (bitwa / rozstawienie)
TEMAT: R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1
GOAL: rozstawienie w bitwie z zasadzki (zastawiający także na polu wroga, zaskoczeni w długiej linii max 3 w szeregu) — zgodnie z dispatchem; wynik wyłącznie geometryczny, bez premii liczbowych.
BAZA: 98a26bce6a6191d42fab06ecf409bb69e7919e6c (kandydat Operatora; gałąź wf_6a0898a2-d64-3 odłączona na tym SHA)
COMMIT: SHA końcowy = patrz pole `sha` w StructuredOutput (commit zawiera kod + nowy test + ten raport).

## Odpowiedzi na zarzuty

### Zarzut 1 (regresja testów istniejących) — PRZYJMUJĘ, poprawione
- Przyczyna: `_ambushSurprisedSide` sprawdzane przez `=== null` / `!== null`; testy budują scenę przez `Object.create`, więc pole ma `undefined`, a zwykła bitwa wchodziła w ścieżkę zasadzki.
- Poprawka: `gra/src/battle/battleScene.ts` — trzy miejsca zmienione na `!= null` / `== null` (ok. linii 3570, 13153, 13173).
- Dowód po poprawce (surowe wyjście):
  - `battle-deploy-cavalry-flanks-test.cjs`: `PASS: default start placement keeps cavalry/chariots on the wings, level with the body (536 checks, max distance to own unit 3)`
  - `battle-initial-placement-runtime-test.cjs`: `PASS: forced mounted fallback in production initial placement/reset stays close; old wide fallback mutation caught 4/4`
  - Nowy test (poniżej) sprawdza regresję: pole `undefined` ⇒ `_isAmbushAmbusherPlayer() === false` i `_applyAmbushDeployIdeal` nie nadpisuje pozycji.

### Zarzut 2 (brak testu realnej sceny) — PRZYJMUJĘ częściowo, dodany test
- Nowy plik: `gra/tools/ambush-deploy-scene-test.cjs` (nie na bazie geometrii — wywołuje prawdziwe metody `BattleScene` przez `Object.create(prototype)`).
- Wynik: `WYNIK: 20 OK / 0 FAIL`.
- Co sprawdza: strefa zastawiającego-gracza obejmuje całe pole (włącznie z prawą, wrogą połową; kontrast: zwykły atk nie ma tej strefy); clamp kolumny do pełnego pola; zaskoczony-gracz ma strefę identyczną jak zwykła bitwa; AI-zastawiający: 12 unikalnych pozycji, kolumny w granicach pola, wiersze ≥0; zaskoczeni AI: najwyżej 3 jednostki w kolumnie przy n=12; strona kontrolowana przez gracza nietknięta.
- Mutacja (wykonana i cofnięta): `ambushLineIdeal(..., PLAY_MID_ROW, 12)` w `_applyAmbushDeployIdeal` ⇒ `FAIL zaskoczeni: w jednym szeregu najwyzej 3 jednostki (n=12)`. Po przywróceniu: 20/0.
- NIE ZROBIONE: mutacja „strefa tylko własna” nie była uruchamiana; brak testu na nakładanie dla gracza-zastawiającego (test nakładania tylko dla AI).

### Zarzut 3 (brak porównania przed/po na ziarnie dla zwykłej bitwy) — PRZYJMUJĘ, NIE ZROBIONE
- Nie zbudowano porównania rozstawienia przed/po na tym samym ziarnie. Zamiast tego: istniejące testy rozstawienia zwykłej bitwy są zielone (zarzut 1), a nowy test sprawdza regresję pola `undefined`. To nie jest dowód równoważności pełnej bitwy.

### Zarzut 4 (szerokość ≤3 nie gwarantowana dla konnicy/rydwanów zaskoczonych) — PRZYJMUJĘ jako otwarte, NIE ZMIERZONO
- Nie sprawdzono, czy gałąź `mountedWing` (wingRowLo/Hi liczone z bodyMin/bodyMax) nie wychodzi poza szerokość 3. Nowy test nie używa jednostek konnych. Zostaje do następnej rundy.

### Zarzut 5 (brak aktualizacji wiki `zasadzka.md` i wikiBundle) — PRZYJMUJĘ, NIE ZROBIONE
- Nie zaktualizowano `docs/encyklopedia/pojecia/zasadzka.md` ani nie regenerowano wikiBundle.

### Zarzut 6 (brak listy długu Rust) — PRZYJMUJĘ, NIE ZROBIONE
- Wstępna lista (do uzupełnienia w REPIN): nowe funkcje `ambushLineIdeal`, `ambushFlankCells`, `ambushResolveCells` w `gra/src/battle/ambushDeploy.ts`; hak `_applyAmbushDeployIdeal` / `_isAmbushAmbusherPlayer` / `_inDeployPlayerZone` / `_clampDeployPlayerCol` w `battleScene.ts`; parametr `openBattle`/`launchIncomingMapFieldBattle` (`ambushSurprisedSide`) w `main.ts`; fixtury: `ambush-deploy-geometry-test.cjs`, `ambush-deploy-scene-test.cjs`.

### Zarzut 7 (gracz jako zastawiający niedostępny w grze) — PRZYJMUJĘ, poprawione w kodzie
- Sprawdzenie kodu: Evaluator miał częściowo rację. Ruch AI w zasadzkę gracza NIE idzie przez `fireAmbushOnHex` (tam jest tylko komunikat), tylko przez komendę `attack` z `ambush: true` (`main.ts` ~45763 i ~45915). Bitwa się otwiera, ale ze STANDARDOWYM rozstawieniem i bez flagi zasadzki, więc strefa zastawiającego nie działała.
- Poprawka: `launchIncomingMapFieldBattle` (`main.ts` ~36795) dostał 11. parametr `ambushSurprisedSide?: 'atk' | 'def'`, przekazywany do `BattleScene` jako `deploy: ... || ambushSurprisedSide !== undefined` oraz `ambush: { surprisedSide }`. Wywołanie AI-atak (`main.ts` ~45934) przekazuje `(cmd as {ambush?:boolean}).ambush === true ? 'atk' : undefined`.
- Dowód: `tsc --noEmit` exit 0 po zmianie; logika strefy zastawiającego-gracza pokryta testem sceny (pkt 2). NIE ZMIERZONO w przeglądarce (brak Chromium w tej sesji): nie potwierdzono, że bitwa AI→gracz rzeczywiście otwiera się z `deploy` i strefą całego pola.
- Uwaga do Evaluatora: ścieżka ruchu gracza w zasadzkę AI (`fireAmbushOnHex`, `isMe(mover.ownerId)`) otwiera bitwę z `ambushSurprised = true` (gracz = zaskoczony), zgodnie z dispatchem.

### Zarzut 8 (ręczne przeciąganie zaskoczonego gracza nie ograniczone do linii) — PRZYJMUJĘ, NIE ZROBIONE
- Nie zmieniano obsługi przeciągania. Ograniczenie działa tylko w rozstawieniu startowym (`_applyAmbushDeployIdeal`).

### Zarzut 9 (wizualizacja strefy `_buildDeployZone` pokazuje połowy) — PRZYJMUJĘ, NIE ZROBIONE
- `_buildDeployZone` nie zmieniano. Komunikat po polsku (`_showDeployFeedback`) jest dodany, strefa graficzna nie odpowiada logice dla zastawiającego-gracza.

### Zarzut 10 (AUTO i „pomiń do wyniku” bez obsługi zasadzki) — PRZYJMUJĘ, NIE ZROBIONE
- `doMapAutoResolve` i ścieżki skip nie zostały zmienione ani przetestowane.

### Zarzut 11 (zapis/wczytanie w trakcie rozstawiania) — PRZYJMUJĘ, NIE ZMIERZONO
- Flaga `ambush` w `BattleOpts` nie jest zapisywana w `save.ts`; brak testu. Tryb zasadzki może zniknąć po wczytaniu.

### Zarzut 12 (`manualControlAllowed` zależy od generała) — PRZYJMUJĘ jako otwarte, decyzja do FC
- `manualControlAllowed` nadal wynika tylko z obecności generała; przy `deploy=true` bez generała `_manualCommanderGate` (battleScene.ts ~2791) jest włączony, więc ręczne rozstawienie może być zablokowane. Nie zmieniano — dispatch nakazuje nie psuć gwiazdki generała, a zasada zachowania jest decyzją FC/ABC.

### Zarzut 13 (bramki nieuruchomione) — PRZYJMUJĘ, uruchomiono (wyniki niżej)

## TESTY (surowe wyjście, uruchomione w worktree na SHA kodu)

Bramki referencyjne (§6 R-PROC-AUTOBOT):
- `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`
- `node tools/unit-power-test.cjs` → `=== unit-power-test: 6 pass, 0 fail ===`
- `node tools/mgla-sciezka-inwariant-test.cjs` → `42 pass, 0 fail`
- `node tools/load-game-regression-test.cjs` → `load-game-regression: 34 PASS / 0 FAIL`
- `node tools/determinism-same-seed-test.cjs` → `WYNIK: PASS`

Bitwa / zasadzka / geometria:
- `ambush-core-test`, `ambush-deploy-geometry-test` (20 OK / 0 FAIL), `ambush-realstep-test`, `ambush-save-roundtrip-test`, `ambush-split-barb-test`, `ambush-ui-reason-test`, `ambush-wiring-test` → exit 0
- `ambush-deploy-scene-test` (NOWY) → `WYNIK: 20 OK / 0 FAIL`
- `ambush-live-test` → timeout 120 s (exit 124); test live/przeglądarkowy — NIE ZMIERZONO (brak Chromium), nie porównano z bazą
- `battle-commander-star-test`, `battle-commander-star-reset-test` → exit 0
- `battle-deploy-cavalry-flanks-test` → PASS (536 checks)
- `battle-initial-placement-runtime-test` → PASS (mutacja 4/4 złapana)

Pozostałe `battle-*` (NIE ZMIERZONO w całości):
- Uruchomiono część; wyniki niezerowe: `battle-attack-move-pointer-test` (124), `battle-collision-arbitration-test` (124), `battle-dead-unit-disappearance-browser-test` (1), `battle-dead-unit-e2e-browser-test` (124), `battle-defeat-survivor-retreat-browser-test` (1), `battle-doctrine-live-r3-test` (124), `battle-doctrine-live-r4-test` (124), `battle-flee-move-half-test` (124), `battle-full-move-gaps-measure` (124), `battle-full-move-strike-test` (zakończony sygnałem 143 po ok. 120 s, bez wyniku).
- Nie porównano z bazą `1c452ec35` — nie wiadomo, czy są to regresje, czy wcześniejsze timeouty (większość to testy przeglądarkowe/live bez Chromium w tej sesji).
- Pozostałe pliki `battle-*` nie zostały uruchomione (pętla zatrzymana, bo testy przeglądarkowe zapisują do `dyspozycje/.../evidence/` i zawisały). Te zapisy cofnięto `git checkout` — worktree czysty poza commitem.

## BLOKADY
- Brak Chromium / pomiaru wizualnego: zrzutów 1280×720 ani ścieżki AI→gracz w przeglądarce nie zmierzono.
- Zarzuty 3, 4, 5, 6, 8, 9, 10, 11, 12 otwarte (patrz wyżej).
- Pełna lista `battle-*` do porównania z bazą — NIE ZMIERZONO.

## RUNDY
1/5 (Operator, obrona). Kolejna runda: Evaluator/FC decyduje.

## NASTĘPNY KROK
Evaluator: ponowna weryfikacja zarzutów 1, 2, 7 (kod + nowy test). Otwarte do decyzji FC: 3, 4, 5, 6, 8, 9, 10, 11, 12.

## UWAGI-DLA-ORKIESTRATORA
- Dispatch 00-dispatch.md nie istnieje w `origin/main`; odczytany z gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`.
- `gra/node_modules` zainstalowane przez `npm ci` (do sprzątania przez orkiestratora; nie usuwano).
- Testy przeglądarkowe zapisują pliki dowodowe w `dyspozycje/autobot/runs/R-BITWA-*/evidence/` — po uruchomieniu trzeba je cofnąć (zrobiono dla R-BITWA-DEAD-UNIT-DISAPPEARS-Q2 i R-BITWA-BTF-MIXED-ARMY-DOCTRINES-Q1).

DEPLOY/PUSH: NIE WYKONANO
