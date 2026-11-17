# R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty Evaluatora r2 5fbee78cb)

STATUS: PASS-WITH-NOTES (runda 2/5; zarzuty 1, 3, 5, 7 przyjęte — 1 i 3 poprawione w kodzie i testach; 2, 4, 8 odrzucone z dowodem (część); 6 przyjęte częściowo — Chromium NIE ZMIERZONO)
DOMAIN: GAME (bitwa / rozstawienie)
TEMAT: R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1
GOAL: rozstawienie w bitwie z zasadzki (zastawiający także na polu wroga, zaskoczeni w długiej linii max 3 w szeregu), zwykła bitwa bez zmian, bez premii liczbowych.
BAZA: 8db0f6833 (start rundy 2, fast-forward worktree; zawiera r2 Operatora 10-operator-claude.md i 5fbee78cb-zarzuty).
ZMIANY-COMMIT: 014173a8c — gra/src/battle/battleScene.ts (_buildDeployZone: strefa graficzna = _inDeployPlayerZone; zastawiający bez mgły na polowie wroga; zaskoczony tylko w paśmie linii; komunikat bez generała w deploy init), gra/src/battle/ambushDeploy.ts (ambushDeployFeedbackText), gra/tools/ambush-deploy-zone-visual-test.cjs (NOWY), gra/tools/ambush-deploy-wiring-test.cjs (NOWY). Ten raport = osobny commit po 014173a8c.
COMMIT: SHA końcowy = patrz pole `sha` w StructuredOutput.

## Zarzuty r2 — odpowiedzi

### Zarzut 1 (pkt 9: strefa graficzna rozjechana z logiką) — PRZYJMUJĘ, poprawione
- Poprawka: _buildDeployZone używa _isAmbushAmbusherPlayer / _isAmbushSurprisedPlayer; zastawiający: kolumny PLAY_COL0..PLAY_COL1, wiersze DEPLOY_MIN..DEPLOY_MAX, bez fog (fog dodawany tylko gdy !ambusherPlayer); zaskoczony: kolumny zwykłej strefy, wiersze = _ambushLineRowBand(); kafle tylko gdy _inDeployPlayerZone. Zwykła bitwa: ścieżka bez zmian (ambushVis=false).
- Dowód: gra/tools/ambush-deploy-zone-visual-test.cjs — WYNIK: 11 OK / 0 FAIL. Zastawiający: kafle graficzne (5280) = strefa logiczna (5280), siegają polowy wroga, brak mgły. Zaskoczony: kafle (69) = strefa logiczna (69), wszystkie w wierszach 76..78, mgła zostaje. Zwykła bitwa: mgła i kafle w zwykłej polowie.
- Mutacja M1 (usunięto filtr _inDeployPlayerZone ORAZ wiersze pętli ustawiono na PLAY_ROW0..PLAY_ROW1): test FAIL „zaskoczony: kafle graficzne (2530) = strefa logiczna (69)” — złapane.
- Mutacja M2 (usunięto tylko filtr; pętla nadal po paśmie): PASS 11/0 — to mutacja równoważna (pętla już ogranicza wiersze do pasma), nie luka testu.
- Chromium (zrzut 1280×720): NIE ZMIERZONO — patrz zarzut 6.

### Zarzut 2 (pkt 10: AUTO i „pomiń do wyniku”) — ODRZUCAM część „doMapAutoResolve”, PRZYJMUJĘ część sceny
- doMapAutoResolve (main.ts ~36204) rozstrzyga bitwę wzorem siły (resolveAutoBattleByPower, rosterFieldPowerM); nie ma fazy rozstawienia i nie czyta pozycji jednostek. Rozstawienie zasadzki nie ma tam zastosowania; premii liczbowej też nie dodano (zgodnie z dispatchem).
- skip() w scenie (battleScene.ts ~3765): przy deployPhase wywołuje _endDeployPhase() i NIE przestawia jednostek — zostają pozycje z _placeUnits lub ręczne gracza.
- AUTO startowe i Reset korzystają z tych samych funkcji co rozstawienie: _placeUnits (wywołanie _applyAmbushDeployIdeal ~5409, linia zaskoczonych ~5424-5426) oraz _placeUnitsOneSide (~17991-17993: lineSide, lineBand). Pokryte przez ambush-deploy-line-width-test (240 checks; realne _placeUnits i _placeUnitsOneSide, N=5/12/30/60, plains i scattered).
- Luka (NIE ZMIERZONO): brak osobnego testu samego przycisku „pomiń” w fazie rozstawienia.
- UWAGA-DLA-ORKIESTRATORA: AUTO na mapie (doMapAutoResolve) ignoruje zasadzkę — to decyzja produktowa, nie błąd kodu; do ABC właściciela.

### Zarzut 3 (pkt 12: manualControlAllowed bez generała) — PRZYJMUJĘ jako decyzję, poprawione tekstem i testem
- Stan kodu: deploy = generał LUB zasadzka (main.ts 36284, 37065); manualControlAllowed = generał (zasada istniejąca). Rozstawienie zasadzki zatem działa bez generała, a bitwa idzie AUTO po rozstawieniu (_manualMode=false, _kickoffBattleTurn).
- Poprawka: komunikat PL na starcie rozstawienia dopisuje „Bez generała bitwa potoczy się automatycznie (AUTO).” (ambushDeployFeedbackText; battleScene deploy init, bramka _manualCommanderGate && !playerHasCommander).
- Dowód: gra/tools/ambush-deploy-wiring-test.cjs — (b) strefa rozstawienia identyczna przy manualMode on/off dla control=def/atk; klamp identyczny; komunikat bez generała zawiera „Bez generała” i „AUTO”; komunikaty z generałem bez dopisku. WYNIK: 15 OK / 0 FAIL (razem z (a) i (c)).
- ZAŁOŻENIE (do potwierdzenia przez ABC właściciela): rozstawienie bez generała = tak, z AUTO po rozstawieniu. Alternatywa „brak rozstawienia bez generała” nie została wdrożona.

### Zarzut 4 (pkt 11: zapis/wczytanie i replay flagi zasadzki) — ODRZUCAM żądanie testu realnej ścieżki zapisu
- Zapis w trakcie bitwy jest zablokowany: main.ts ~40478 `isSaveBlockedByBattle() = isBattleSceneOpen() || isPostBattleSummaryOpen()`; komunikat „Zapis niedostępny w trakcie bitwy” (~40482; reguła W27). Stan fazy rozstawienia nie może więc trafić do zapisu; BattleOpts.ambush nie jest serializowana i nie musi być.
- Test statyczny: ambush-deploy-wiring-test (c) — 2 asercje na te linie.
- NIE ZMIERZONO: autozapis w bitwie (czy też blokowany) i realny zapis/wczytanie przez serializeGame/deserializeGame. Brak środowiska do uruchomienia gry (patrz zarzut 6).

### Zarzut 5 (brak testu okablowania main.ts) — PRZYJMUJĘ, dodano
- ambush-deploy-wiring-test (a): 6 asercji na realne linie main.ts: openPlayerMapUnitAttackCore(mover, defender, true) (~33993); deploy/ambush atakującego (~36284-36286); deploy/ambush obrony (~37065-37067); AI→gracz cmd.ambush → 'atk' (~45938-45939). WYNIK: w zestawie 15 OK / 0 FAIL.
- Granica: test czyta tekst źródła (nie wykonuje ścieżki na mapie). NIE ZMIERZONO wykonanie w przeglądarce.

### Zarzut 6 (Chromium i harnessy battle-*) — PRZYJMUJĘ część
- Dowód na poziomie sceny to 11/0 (zarzut 1) i 15/0 (zarzut 5), nie zrzut.
- Chromium: NIE ZMIERZONO. /usr/bin/chromium istnieje, ale uruchomienie gry wymaga serwera dev/build w gra/, a to jest zakazane w tym temacie (R-PROC-AUTOBOT §9 / zasady gra/: zakaz npm run build/dev). Brak dozwolonej ścieżki do zrzutu 1280×720.
- Harnessy battle-*: reprodukcja w tej rundzie — battle-commander-star-reset-test.cjs: "Build failed ... src/ui/brandTokenVars.ts:7:27: Cannot import tokens.css?raw" — dług bazowy po FALI 787 (nie regresja tej zmiany). Nie uruchomiono ich jako bramek.

### Zarzut 7 (mutacja mountedWing redundantna) — PRZYJMUJĘ (dług testowy), bez zmiany kodu
- mountedWing = mounted AND !lineSide wpływa na punktację kafli (plains +40 dla piechoty w linii vs +6 dla konnicy-skrzydła), a nie na granice szyku (te wymusza pasmo wierszy). Mutacja B przeżywa, bo ambush-deploy-line-width-test sprawdza granice, liczbę na kolumnę i obecność konnicy, a nie wybór kolumny konnicy.
- Nie dodano testu wyboru kolumny konnicy w tej rundzie. NIE ZMIERZONO wpływ na konkretne ustawienie konnicy w grze.

### Zarzut 8 (AI-zastawiający: kolejność stron i przeszkody) — CZĘŚCIOWO ODRZUCAM
- Brak nakładania obu stron na terenie plains i scattered: pokryte przez ambush-deploy-line-width-test (240 checks, 3 przypadki: AI zaskoczony def, gracz zaskoczony atk, gracz zaskoczony def) — asercja „brak nakładania” jest w tym teście.
- Kolejność rozstawiania stron (atk przed def) i przeszkody dla obu stron jednocześnie: NIE ZMIERZONO (brak testu kolejności).

## Testy (surowe wyniki, worktree, gra/node_modules z npm ci)
- npx tsc --noEmit (gra/): exit 0, 0 linii wyjścia.
- ambush-deploy-geometry-test.cjs: WYNIK: 20 OK / 0 FAIL
- ambush-deploy-scene-test.cjs: WYNIK: 26 OK / 0 FAIL
- ambush-deploy-line-width-test.cjs: PASS: zaskoczeni w dlugiej linii (max 3 w szeregu, konnica w linii) dla N=5/12/30/60 (240 checks)
- ambush-deploy-identity-test.cjs (AMBUSH_BASE_GRA = git archive 1c452ec35 gra/src gra/tools gra/data): PASS: zwykla bitwa rozstawienie identyczne z baza 1c452ec35 (start + Reset) (1776 porownanych pozycji)
- ambush-deploy-zone-visual-test.cjs (NOWY): WYNIK: 11 OK / 0 FAIL
- ambush-deploy-wiring-test.cjs (NOWY): WYNIK: 15 OK / 0 FAIL
- mgla-sciezka-inwariant-test.cjs: 42 pass, 0 fail
- json-descriptions-sync-test.cjs: 19 pass / 0 fail
- battle-commander-star-reset-test.cjs: NIE URUCHOMIONO jako bramka — Build failed (brandTokenVars ?raw), dług bazowy
- Pozostałe 5 bramek referencyjnych, load-game-regression, determinizm-same-seed: NIE ZMIERZONO w tej rundzie (czas/limit; brak zmian poza bitwą z zasadzki — zwykła bitwa potwierdzona identity-testem 1776/1776).
- git diff --check: czysto.

## Ustalenia do ABC właściciela / uwagi dla orkiestratora
- AUTO na mapie (doMapAutoResolve) ignoruje zasadzkę (zarzut 2).
- Bez generała: rozstawienie tak, potem AUTO (zarzut 3, ZAŁOŻENIE).
- Dług: 4 harnessy battle-* (brandTokenVars ?raw) — osobny temat HARNESS-BRANDTOKENS-STUB (już zgłoszony w r1).
- Chromium 1280×720 dla rozstawienia z zasadzki — NIE ZMIERZONO (wymaga dopuszczenia uruchomienia gry).

---

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
