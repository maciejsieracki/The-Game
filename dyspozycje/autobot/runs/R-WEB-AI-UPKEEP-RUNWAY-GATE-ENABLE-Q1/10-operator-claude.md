# R-WEB-AI-UPKEEP-RUNWAY-GATE-ENABLE-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (AI: rekrutacja a zapas złota/żywności)
TEMAT: R-WEB-AI-UPKEEP-RUNWAY-GATE-ENABLE-Q1
GOAL: włączyć bramkę rekrutacji AI opartą na zapasie (`AI_UPKEEP_RUNWAY_GATE.wlaczone = true`, decyzja właściciela 2026-11-16, „B: włączyć teraz”), z parametrami `runwayTurns` 15 i `margin` 0,1 bez zmian.
BAZA: `origin/main` = `8265bbec0e8d040562fc73bbafaf57ae3aef50ed` (sprawdzone: `git merge-base --is-ancestor` = OK).
KOD ŹRÓDŁOWY: kandydat `11362dad4` (`refs/keep/R-WEB-AI-UPKEEP-Q2-r2-obrona`), baza `807ecebdd`. Patch zastosowany na HEAD bazy przez `git apply -3`, bez konfliktów. `gra/src/main.ts` scalony czysto: FALE 760–769 w main zachowane.

## ZMIANY (commit: patrz sekcja SHA poniżej)

- `gra/data/ai-upkeep-params.json`: `wlaczone` false -> true; `opis` zaktualizowany (WŁĄCZONA decyzją właściciela 2026-11-16). `runwayTurns` 15, `margin` 0,1 bez zmian.
- `gra/src/game/ai-upkeep-runway.ts` (nowy, z kandydata, bez zmian).
- `gra/src/main.ts`: z kandydata: import konfiguracji i `aiUpkeepRunwayAllowsRecruit`, mapa `aiFoodTickNetByOwner` (zapis w ticku ekonomii, czyszczenie w 3 miejscach jak `aiGoldIncomeByOwner`), funkcja `aiUpkeepRunwayAllows`, wywołanie w `wantsPurchase` (rekrutacja AI) przed `shouldAIPurchaseUnit`.
- `gra/src/main.ts` — DODANE przez Operatora (poza kandydatem, odstępstwo opisane niżej): liczniki bramki `aiUpkeepGateStats` (calls / flagOff / noTickData / allowed / blocked), zapis tylko w `aiUpkeepRunwayAllows`, eksport `window.__aiUpkeepGateStats` wyłącznie przy `?civTest=1`.
- `gra/tools/ai-upkeep-runway-test.cjs` (nowy, bez zmian).
- `gra/tools/ai-upkeep-wiring-test.cjs`: asercja W1 zmieniona z `=== false` na `=== true` (to jedyna asercja, która zakładała `false`).
- `dyspozycje/autobot/runs/R-WEB-AI-UPKEEP-RUNWAY-GATE-ENABLE-Q1/10-operator-claude.md` (ten raport).

Miejsca wpięcia w `main.ts` (wszystkie w obrębie bramki): deklaracja mapy i liczników (~l. 10841–10850), czyszczenie mapy w 3 miejscach (nowa gra / wczytanie zapisu), zapis w ticku (`aiFoodTickNetByOwner.set`), funkcja `aiUpkeepRunwayAllows` (~l. 37374), wywołanie w `wantsPurchase` (~l. 45764). Żadne inne miejsce nie wywołuje bramki.

Wpływ na gracza: BRAK. Bramka jest wpięta wyłącznie w `wantsPurchase` pętli AI (`runAiPhase`). Gracz nie przechodzi tą ścieżką. Mapa `aiFoodTickNetByOwner` nie jest zapisywana w save (zgodnie z komentarzem), więc nie zmienia formatu zapisu.

## TESTY

Wszystkie w worktree `wf_d8a04676-846-1`, po `npm ci` w `gra/` (71 pakietów), `node` v22.22.0.

- `npx tsc --noEmit` (gra/): exit 0, bez błędów.
- `node tools/ai-upkeep-runway-test.cjs`: 17 passed, 0 failed.
- `node tools/ai-upkeep-wiring-test.cjs`: 4 passed, 0 failed (W1 `wlaczone === true`, W2 call site przed `shouldAIPurchaseUnit`, W3 zapis mapy w ticku, W4 czyszczenie 3/3).
- Referencyjne: `logic-test.cjs` LOGIC OK (213/213); `tech-tree-test.cjs` 20 pass / 0 fail; `research-test.cjs` PASSED 33 / FAILED 0; `unit-replace-test.cjs` WSZYSTKIE TESTY ZIELONE (21/21); `combat-test.cjs` COMBAT TEST 6/6 pass; `load-game-regression-test.cjs` 34 PASS / 0 FAIL.
- Mutacja 1 (na kopii, przywrócona): usunięte wywołanie bramki w `wantsPurchase` -> `ai-upkeep-wiring-test.cjs` exit 1, `FAIL W2`. Wykryte.
- Mutacja 2 (na kopii, przywrócona): `wlaczone` = false -> `ai-upkeep-wiring-test.cjs` exit 1, `FAIL W1`. Wykryte.
- Po mutacjach pliki przywrócone z kopii; `git status` pokazuje tylko zamierzone zmiany.

### Smoke w żywej grze (Chromium, bundle vite POZA repo)

Runner: `ai-economy-measure-run.cjs` z refs `refs/keep/UPKEEP-ONOFF-r3-fc` (wskazany w dispatchu) pobrany do pliku tymczasowego, skopiowany do `gra/tools/` na czas przebiegu i usunięty. Nie jest w commicie. Uwaga: wersja w `main` (`8265bbec0`) różni się od wersji r3-fc (cmp: różnica od linii 62), więc smoke używa wersji wskazanej w dispatchu.

- Build: `--build 1 --dist /tmp/upk-dist2` (vite, poza repo), wynik OK.
- Przebieg: ziarno 4242, tury 1–45, `--every 10`, jeden segment, `--stop-at 45`; czas ścianowy przebiegu 142 s (poniżej 590 s). Profil świeży (`resumed: false`).
- `cannot-end`: 0 (grep w jsonl i logu). `endturn-timeout`: 0.
- Deficyt złota AI (`deficytZlota: true`): 0 wystąpień w 44 rekordach (tury 2–45).
- Liczniki bramki (`upkeepGate`, licznik z kodu wprowadzony przez tę rundę): w turze 45 kumulacyjnie `calls` 1072, `blocked` 821 (ok. 77% sprawdzeń zablokowanych). Blokady > 0 — warunek spełniony.
- Historia (WAŻNE): pierwszy przebieg tej rundy (bez licznika w bundlu) dał `upkeepGate: null` we wszystkich 44 rekordach, bo `window.__aiUpkeepGateStats` nie istniało. Dlatego dodano licznik (sekcja ZMIANY). Drugi przebieg (z licznikiem) jest wynikiem wiarygodnym.
- Porównanie z pomiarem kandydata (ok. 35% blokad) NIE ZROBIONE: inny horyzont (45 tur, nie 100), inny bundle. Nie porównuję liczb, nie stroję parametrów (decyzja właściciela: parametry bez zmian).
- Nie robiono pełnego przebiegu 100 tur (dispatch wymaga do tury >= 45).
- Zrzutów i weryfikacji wizualnej nie było (temat nie jest wizualny).

### Wartości z surowego wyjścia

- `ai-upkeep-runway-test`: `17 passed, 0 failed`
- `ai-upkeep-wiring-test`: `4 passed, 0 failed`
- `logic-test`: `LOGIC OK (213/213)`
- `tech-tree-test`: `tech-tree-test: 20 pass, 0 fail`
- `research-test`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `unit-replace-test`: `(21/21)`
- `combat-test`: `COMBAT TEST: 6/6 pass`
- `load-game-regression-test`: `34 PASS / 0 FAIL`

## KRYTERIA

- (a) testy gate i wiring zielone przy `true`: SPEŁNIONE (17/17, 4/4). Mutacje wykryte: SPEŁNIONE (2 z 2).
- (b) tsc 0 i 5 bramek referencyjnych zielone, `load-game-regression` bez regresji: SPEŁNIONE (tsc 0; logic, tech-tree, research, unit-replace, combat zielone; load-game 34/0).
- (c) smoke ziarno 4242 do tury >= 45, flaga true: SPEŁNIONE (brak cannot-end / endturn-timeout; blokady > 0; deficyt złota AI = 0; segment < 590 s). Wznowienia ze slotów nie testowano (jeden segment).
- (d) `wlaczone=false` daje hash jak baza: NIE ZMIERZONO (nie wykonano przebiegu z hashem dla flagi false). Rozumowanie z kodu: przy `false` funkcja zwraca `true` przed odczytem stanu gry, a `wantsPurchase` zostaje `!aiNnsHoldOwners.has && shouldAIPurchaseUnit(...)`. Jedyna różnica to inkrementacja liczników (nie wpływa na stan gry ani na zapis).
- Nic poza bramką rekrutacji AI nie zmienia zachowania gry: SPEŁNIONE w sensie kodu (jedyne wywołanie w `wantsPurchase` AI; gracz nie przechodzi).

## BLOKADY

- Brak blokad technicznych.
- NIE ZMIERZONO: hash stanu dla `wlaczone=false` (kryterium d, patrz wyżej).
- NIE ZMIERZONO: wiki/Civpedia — generator nie był uruchamiany, więc rozbieżności nie sprawdzono. Zgodnie z allowlistą wiki nie zmieniano.
- Przebieg 100 tur i wznowienie z slotu nie wykonane (dispatch wymaga tury >= 45).

## RUNDY

1/5. Brak FAIL/BLOCK. Ostatni werdykt: brak (Operator).

## UWAGI-DLA-ORKIESTRATORA

1. Odstępstwo od allowlisty (świadome): liczniki bramki w `main.ts` (zapis w `aiUpkeepRunwayAllows`, eksport `window.__aiUpkeepGateStats` tylko przy `?civTest=1`). Bez nich kryterium „licznik pokazuje blokady > 0” nie da się sprawdzić, a runner je wymaga. Zero wpływu na logikę. Proszę o akceptację w Evaluatorze/FC.
2. Dług Rust (dispatch): REPIN bramki rekrutacji AI (nowy plik `ai-upkeep-runway` + dane `ai-upkeep-params.json`) — nie wykonywany tutaj, zgodnie z dispatchem.
3. Runner `ai-economy-measure-run.cjs` w `main` różni się od wersji `refs/keep/UPKEEP-ONOFF-r3-fc` (dispatch wskazuje r3-fc do smoke). Do decyzji orkiestratora, czy wersja z `main` ma być uaktualniona w osobnym temacie (nie w tym commicie).
4. Bundle smoke w `/tmp/upk-dist2`, profil `/tmp/upk-prof2`, wyniki `/tmp/upk-out2`. Do sprzątnięcia po FC (poza repo).

## NASTĘPNY KROK

Evaluator (SONNET) + Obrona (jeśli BLOCK/FAIL) → Final Control (SONNET) → integracja orkiestratora. Weryfikacja przez właściciela w grze po FALI (bramka włączona: AI rekrutuje wolniej przy słabym zapasie — do obserwacji w realnej rozgrywce).

## DEPLOY/PUSH

DEPLOY/PUSH: NIE WYKONANO
