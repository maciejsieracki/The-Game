# R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1 — obrona Operatora, runda 2 (odpowiedź na zarzuty Evaluatora r2)

STATUS: PASS-WITH-NOTES (obrona r2: zarzuty 1, 2, 4, 5, 6 PRZYJĘTE z poprawką i dowodem; zarzut 3 ODRZUCONY z cytatem (wariant A, DO POTWIERDZENIA przez właściciela); zarzut 7 częściowo: etykieta PRZYJĘTA, tooltip ODRZUCONY z dowodem; tick AI<->AI — NIE ZMIERZONO, zgłoszone jako DECISION_REQUIRED)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1
GOAL: zmęczenie wojną jako pozycja PW przy pokoju (krzywa kwadratowa, rabat 60% usunięty); tabela = decyzja AI; bezwarunkowy koniec zmęczenia z tej samej funkcji; kierunek AI→gracz z wierszem Z po stronie gracza.
ZMIANY-COMMIT: baza kandydata a4d48e2757b6622ec8f0604399585bc96ba948fa (Evaluator oceniał ten SHA). Commit obrony r2: SHA w polu `sha` raportu StructuredOutput (commit kodu + commit raportu, ścieżki jawne, bez `add -A`). `node_modules` w `gra/` zainstalowane przez `npm ci` (gitignored), nie commitowane.
Allowlista rundy 2 (poza dispatchem): `gra/data/war-weariness-params.json` (tylko `_wzor`/`_progi`/`_pozycjaPW` — opisy), `gra/src/game/{ai,diplomacy-proposals,war-weariness}.ts`, `gra/src/main.ts` (typ + przekazanie `wearinessSide`), `gra/src/ui/{diplomacyAcceptanceBalance,diplomacyAudience}.ts`, `gra/tools/diplo-weariness-{as-pw-peace-item,pw-behavior,pw-row-ui,unconditional-end}-test.cjs`, `dyspozycje/autobot/runs/R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1/{30-obrona-claude.md,evidence/live-*}`.

## Odpowiedzi na zarzuty (każdy: PRZYJMUJĘ z poprawką+dowodem albo ODRZUCAM z dowodem)

### Zarzut 1 (BLOKUJĄCY, DODATEK pkt 3) — kierunek AI→gracz — PRZYJMUJĘ
- Poprawka (`gra/src/game/diplomacy-proposals.ts`, gałąź przed `if (ctx.warState && r5PlayerAuthors && r5RespondentIsAi ...)`): gdy autor pokoju to AI, respondent to gracz i `warState` istnieje, liczone są `wearinessPw = wearinessPeaceItemPw(basePnCfg, L)`, `wearinessInfo` i `wearinessSide = 'player'`. Wiersz Z trafia do kolumny „My oddajemy” (gracz). `accepted`, `basePn`, `pwBalance` nie są zmieniane w tej gałęzi (informacyjnie).
- ZAŁOŻENIE (do potwierdzenia): C = `basePnCfg` bez mnożnika cywilizacji, bo bramka R5 działa tylko dla autora gracza.
- Dowód: `tools/diplo-weariness-pw-behavior-test.cjs` (f), prawdziwe `evaluateProposal` dla tur 10/15/20: `wearinessSide === 'player'`, Z=0 w turze 10 (L=0,5, x=0), Z>0 w 15 i 20. `tools/diplo-weariness-pw-row-ui-test.cjs` (u5): wiersz „Zmęczenie wojną (gracz) +80 PW” w kolumnie My (przed „Oni oddają”), brak (AI) w kolumnie Oni. Wynik: behavior 87/0, row-ui 10/0.

### Zarzut 2 (BLOKUJĄCY, DODATEK pkt 1 / kryterium e) — zrzuty z GRY — PRZYJMUJĘ CZĘŚCIOWO (stan wczesny i późny z gry; stan silniejszej AI z gry NIE osiągnięty)
- Build poza repo (`vite build --outDir <scratchpad>/civ-live-build`, 21 s), `index.html?playtest=mapa&civTest=1`, realne hooki: `__peaceRulesTestDebug.setPlayerWarWithAi`, `sendPeaceProposalForTest` (REALNA ścieżka `handleNegotiatedProposal` → `previewNegotiationEntry` → `evaluateProposal`), `__audienceRelTestDebug.openAudience`. Skrypt: `scratchpad/live-shots.cjs`, log `scratchpad/live2.log`, wyniki `evidence/live-results.json`. Konsola: 0 błędów.
- Wczesna wojna (tura 11, L=0,55): panel „Punkty wymiany” w grze, wiersz **„Zmęczenie wojną (AI) +13 PW”** w kolumnie „Oni oddają” — `evidence/live-wczesna-pn-panel.png`, `evidence/live-wczesna-audience.png`.
- Późna wojna (tura 15, L=0,75): **„Zmęczenie wojną (AI) +330 PW”** — `evidence/live-pozna-pn-panel.png`, `evidence/live-pozna-audience.png`. Tooltip w DOM: „tury wojny 15 · utracone miasta 0 · zmęczenie 75%”.
- Uwaga metodyczna: pole `rowHtml` w `live-results.json` dla tury 11 jest `null`, bo odczyt DOM był wykonany PRZED otwarciem audiencji (panel renderuje się po `openAudience`). Miarodajne są zrzuty PNG; kolejność odczytu poprawiona w rozumowaniu, nie w pliku.
- NIE ZMIERZONO w grze: stan silniejszej AI (zarzut 3). Próba `setAiPowerBonusForTest(aiId, 1e6)` NIE wywołała ścieżki „Silniejsza AI” — w grze AI miała relację 0 i „Twoja strona słabsza (−90% PW)”, a odrzucenie brzmiało „Brakuje 131 PW do uczciwej oferty pokoju @ Relacji (baza 145 PW)”. Zrzut `evidence/live-silna-pn-panel.png` pokazuje ten przypadek (wiersz Z +330 widoczny), NIE przypadek silnej AI. Stan silnej AI jest pokryty wyłącznie harnessem komponentowym `tools/pw-weary-table-browser-test.cjs` (`evaluateProposal` z `responderPozycjaMilitarna: 'silniejsza'`), zrzuty `evidence/stol-silna.png` (artefakty harnessu, bez CSS gry).
- Dodatkowa obserwacja (NIE ZMIERZONO, do FC): w zrzucie późnej wojny panel pokazuje „MY ODDAJEMY 250 PW (baza 500, Relacja −50% siła)”, „Brakuje 72 PW … (baza 145 PW)” i „BILANS −72”. Składowe nie dają jednoznacznie −72 (250 − 145 = +105). Liczba pochodzi z istniejącego `pwBalance`/`balancePanelDataFromRows`, którego ta runda nie zmieniała. Wymaga sprawdzenia przez FC.

### Zarzut 3 (blokujący wg DODATKU, wariant A) — silniejsza AI: rozjazd tabela↔decyzja — ODRZUCAM (z cytatem), status DO POTWIERDZENIA
- Dowód z kodu (`gra/src/game/diplomacy-proposals.ts`, gałąź `stronger`): `cityGivePn >= cenaPokojuPn` — wymagane pełne C, a komunikat brzmi „Silniejsza AI wymaga miasta o wartości ≥ C PW (zmęczenie nie obniża tej ceny)”. Zwrot odrzucenia dla silnej AI NIE ustawia `wearinessPw` (brak pola w wyniku), więc tabela NIE pokazuje wiersza Z i NIE podaje bilansu 0 dla tego przypadku — nie ma fałszywej obietnicy „R = 0”.
- DODATEK r2 pkt 3 wprost przewiduje ten wariant: „dla silniejszej AI wiersz stołu ma jawnie mówić „Silniejsza AI wymaga miasta o wartości ≥ C PW (zmęczenie nie obniża tej ceny)” zamiast bilansu 0”.
- Test (b3) `diplo-weariness-pw-behavior-test.cjs` utrwala to zachowanie świadomie (nie jest dowodem spójności; deklaracja zgodna z Evaluatorem).
- DECISION_REQUIRED: właściciel nie potwierdził wariantu A (DODATEK: „właściciel jeszcze nie odpowiedział”). Jeśli wybierze B (zmęczenie obniża cenę także dla silnej AI), zmiana jest jednowierszowa w gałęzi `stronger`, ale wymaga nowej tabeli i testów.

### Zarzut 4 (jedna prawda tylko częściowo) — PRZYJMUJĘ
- Poprawka: `wearinessUnconditionalEndDue(level) = wearinessPeaceX(level) >= 1` (`gra/src/game/war-weariness.ts`, ok. l.254–260). Tick AI<->AI (`runWarWearinessTick`) i gałąź bezwarunkowa `ai.ts` (~l.7054) wołają TĘ SAMĄ funkcję, co tabela (`wearinessPeaceItemPw` → `wearinessPeaceX`). Osobny literał `progKoncaZmeczenia` nie jest już w ścieżce decyzji.
- Import w `ai.ts` wrócił do `wearinessUnconditionalEndDue` (zmiana minimalna względem bazy).
- Dowód: `diplo-weariness-unconditional-end-test` — 22/0; wiązanie statyczne sprawdza `wearinessUnconditionalEndDue(wearyLevel)` w ai.ts (1 wystąpienie). Mutacje: U1 (usunięcie gałęzi końca) — czerwone; U2 (`return wearinessPeaceX(level,P) >= 1` → `return level >= 2`) — czerwone (f, c1-c3, a3); mutant AI-U6 (`wearinessUnconditionalEndDue(wearyLevel)` → `false` w ai.ts) — czerwone (wykrywa test statyczny). Test behawioralny (b) dla tur 10–20 utrzymuje 84/0 → 87/0 po dopisaniu (f).
- Uwaga: przy wspólnej funkcji mutacja progu w `ai.ts` nie jest już osobnym miejscem; zgodność tabeli i decyzji jest z konstrukcji, nie z liczbowej równości 0,8.

### Zarzut 5 (tabela cen tur 10–20 nie była kompletna) — PRZYJMUJĘ (tabela poniżej, z prawdziwych funkcji `gra/src/game/war-weariness.ts`)
- Generator: `scratchpad/table.js` (esbuild z `gra/src`), wynik `scratchpad/table.json`. Założenia: L = tury/20 (0 utraconych miast), C ∈ {500, 615}, „przed” = stara formuła `C·(1 − 0,6·x_stary)`, `x_stary = clamp((L−0,5)/0,5)` (wzór z bazy c9c161ec3, `wearinessPeacePriceFactor`).
- Korekta do dispatchu: dispatch/Evaluator podają „wcześniej 40% ceny od tury 16”. Z bazowej formuły wynika: przy L=0,8 (tura 16) cena przed = 64% C (320 PW dla C=500); 40% (200 PW) dopiero przy L=1 (tura 20). Krzywa przed była liniowa w L; nowa jest kwadratowa i zeruje R od L=0,8.

| C | tura | L | x (nowe) | cena PRZED (rabat 60%) | Z = round(C·x²) (PW) | R = C−Z (miasto) | bezwarunkowy |
|---|---|---|---|---|---|---|---|
| 500 | 10 | 0,5 | 0 | 500 | 0 | 500 | nie |
| 500 | 11 | 0,55 | 0,167 | 470 | 14 | 486 | nie |
| 500 | 12 | 0,6 | 0,333 | 440 | 56 | 444 | nie |
| 500 | 13 | 0,65 | 0,5 | 410 | 125 | 375 | nie |
| 500 | 14 | 0,7 | 0,667 | 380 | 222 | 278 | nie |
| 500 | 15 | 0,75 | 0,833 | 350 | 347 | 153 | nie |
| 500 | 16 | 0,8 | 1 | 320 | 500 | 0 | tak |
| 500 | 17 | 0,85 | 1 | 290 | 500 | 0 | tak |
| 500 | 18 | 0,9 | 1 | 260 | 500 | 0 | tak |
| 500 | 19 | 0,95 | 1 | 230 | 500 | 0 | tak |
| 500 | 20 | 1 | 1 | 200 | 500 | 0 | tak |
| 615 | 10 | 0,5 | 0 | 615 | 0 | 615 | nie |
| 615 | 11 | 0,55 | 0,167 | 578 | 17 | 598 | nie |
| 615 | 12 | 0,6 | 0,333 | 541 | 68 | 547 | nie |
| 615 | 13 | 0,65 | 0,5 | 504 | 154 | 461 | nie |
| 615 | 14 | 0,7 | 0,667 | 467 | 273 | 342 | nie |
| 615 | 15 | 0,75 | 0,833 | 431 | 427 | 188 | nie |
| 615 | 16 | 0,8 | 1 | 394 | 615 | 0 | tak |
| 615 | 17 | 0,85 | 1 | 357 | 615 | 0 | tak |
| 615 | 18 | 0,9 | 1 | 320 | 615 | 0 | tak |
| 615 | 19 | 0,95 | 1 | 283 | 615 | 0 | tak |
| 615 | 20 | 1 | 1 | 246 | 615 | 0 | tak |

- Wartość C = 615 vs 500 (zależność od tury) — NIE ZMIENIANA, wymaga potwierdzenia właściciela (jak w r1).

### Zarzut 6 (nieaktualne opisy w JSON) — PRZYJMUJĘ
- `gra/data/war-weariness-params.json`: `_wzor` (poprzednio: „cena pokoju … maleje (wearinessPeacePriceFactor)”) przepisany na pozycję PW; `_progi` (poprzednio: „progKoncaZmeczenia czyta WYLACZNIE wearinessUnconditionalEndDue (war-weariness.ts:234)”) przepisany na `wearinessPeaceX` → `wearinessUnconditionalEndDue`; `_pozycjaPW` nie zawiera już literału `rabatCenyPokojuMax` (było: „Stary rabat 60% (rabatCenyPokojuMax) USUNIET”, jest: „Stary rabat ceny 60% USUNIET”).
- Dowód: `grep` klucza i funkcji w JSON = 0; test (d) — PASS.

### Zarzut 7 (drobne) — CZĘŚCIOWO
- (a) Etykieta — PRZYJMUJĘ: wiersz w kolumnie AI brzmi „Zmęczenie wojną (AI) +N PW” (kierunek gracz→AI), w kolumnie gracza „Zmęczenie wojną (gracz) +N PW” (kierunek AI→gracz). Testy `diplo-weariness-pw-row-ui-test` (u2, u4, u5) zaktualizowane; zrzuty z gry pokazują „(AI)”.
- (b) Tooltip `lostCities` — ODRZUCAM (rozjazd nie występuje w tabeli): `wearinessInfo.lostCities` i `level` oraz `lostCitiesTotal` w `warWearinessLevel` pochodzą z tego samego wejścia `ctx.warState.lostCitiesResponder` (`diplomacy-proposals.ts` l.1385, 1391, 1419, 1425). Tooltip pokazuje dokładnie wejście, z którego policzono Z. Dowód: wiersz z gry „tury wojny 15 · utracone miasta 0 · zmęczenie 75%” zgadza się z Z=330 (C=475: round(475·0,833²)=330).
- (c) NIE ZMIERZONO / DECISION_REQUIRED (poza zakresem r2, nie zmieniane): licznik ticka `runWarWearinessTick` (war-weariness.ts l.272) używa `lostA + lostB` (obie strony), a tabela PW i `ai.ts` (l.6982/7035) używają `lostCitiesResponder`/`lostCitiesInWar + zdobyteMiastaPartnera`. Stara formuła ceny (przed tą rundą) też używała `lostCitiesResponder`, więc Z jest spójne z dotychczasową ceną. Zmiana wejścia zmieniłaby liczby Z — wymaga decyzji właściciela.

## Zakres dodatkowy (uczciwie)
- Dodany test (f) w `diplo-weariness-pw-behavior-test.cjs` (kierunek AI→gracz) oraz wersja (u5) w `diplo-weariness-pw-row-ui-test.cjs`.
- Zmieniony kontrakt typu: `ProposalEvalResult.wearinessSide?: 'ai' | 'player'` (diplomacy-proposals.ts), przeniesiony przez `main.ts::previewNegotiationEntry`, `balancePanelDataFromRows` i typy UI.
- `wearinessPwRowHtml(z, info, side='ai')` — nowy parametr z domyślną wartością (kompatybilność).

## TESTY (wyniki z surowego wyjścia, Node 22, `gra/node_modules` z `npm ci`)
- `tsc --noEmit -p gra` (po wszystkich zmianach): EXIT=0.
- 5 bramek referencyjnych: logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `PASSED: 33 / FAILED: 0 / TOTAL: 33`; unit-replace-test: linie `[OK]` (ostatnia: „ctx z pustym empireResourceStock NIE odblokowuje Evocati”), EXIT=0; combat-test `All sanity checks passed.`, EXIT=0. Czerwone-na-bazie: brak.
- Testy tematu: `diplo-weariness-as-pw-peace-item-test` PASS=76 FAIL=0; `diplo-weariness-pw-behavior-test` 87 pass / 0 fail; `diplo-weariness-pw-row-ui-test` 10 pass / 0 fail; `diplo-weariness-unconditional-end-test` PASS=22 FAIL=0 (mutanty U1–U5 i AI-U6, MAIN-U7: czerwone); `ai-war-weariness-peace-test` PASS=101 FAIL=0.
- Sąsiednie diplomacy: diplo-peace-balance-accept-test 32/0; diplo-war-peace-sim-test 25/0; diplo-peace-weaker-seeks-city-only-test 35/0; diplomacy-proposal-test 200/200; diplo-war-peace-gate-test 24/0; diplo-war-peace-main-guard-test 35/0; diplomacy-ai-balance-test 36/36; diplo-weariness-city-only-test PASS=30 FAIL=0; diplo-weariness-20-turns-test PASS=30 FAIL=0; diplo-weariness-display-test ALL PASSED.
- Live (Chromium, build poza repo, ?civTest=1): boot OK, konsola 0 błędów, zrzuty: wczesna +13 PW, późna +330 PW (patrz zarzut 2).
- `git diff --check` — do uruchomienia przed commitem (wynik w sekcji ZAPIS).

## BLOKADY
- DECISION_REQUIRED (właściciel): (1) wariant silnej AI (zarzut 3, wariant A); (2) C dla kierunku AI→gracz bez mnożnika cywilizacji (zarzut 1, założenie); (3) wartość C w turze (615 przed/500 po `turyBezOgraniczenAi`); (4) wejście `lostCities` (tick vs tabela, zarzut 7c).
- NIE ZMIERZONO: stan silnej AI w grze z hookami (zrzut z gry); bilans −72 w zrzucie późnej wojny (zarzut 2, obserwacja).
- Dług Rust: REPIN po wdrożeniu (usunięty rabat 60%, pozycja PW Z, nowy wiersz AI→gracz).

## RUNDY
Operator r2/5 (obrona). Poprzedni werdykt FC r1: FAIL; Evaluator r2: FAIL-ZARZUTY (7 zarzutów).

## NASTĘPNY KROK
Evaluator/FC r3 — zweryfikować commit obrony (SHA w polu sha), zrzuty z gry w `evidence/live-*.png`, tabelę z sekcji zarzutu 5, decyzje DECISION_REQUIRED (1–4). Zarzut 2 zamyka się tylko częściowo (silna AI z gry — NIE ZMIERZONO).

## DEPLOY/PUSH
NIE WYKONANO (zgodnie z dispatchem: bez integracji, bez deployu, bez push na main).

## UWAGI-DLA-ORKIESTRATORA
- Zmieniono środowisko worktree: usunięto dowiązanie `gra/node_modules` (wskazywało na nieistniejący `/home/user/integ/gra/node_modules`) i wykonano `npm ci` w `gra/` (gitignored). Pozostaje w worktree po zakończeniu.
- Wszystkie wywołania hooków w skrypcie live są REALNYMI ścieżkami gry (bez prawdziwej logiki nadpisanej w teście). Skrypt `live-shots.cjs` nie jest w repo (w scratchpadzie).
- Nie utworzono żadnych sesji, zadań ani wyzwalaczy (zakaz z dispatchu).
