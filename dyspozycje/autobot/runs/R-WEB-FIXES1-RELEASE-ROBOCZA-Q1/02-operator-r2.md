STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-FIXES1-RELEASE-ROBOCZA-Q1
GOAL: Kandydat ROBOCZY = origin/main fcd86933 + produkt rekrutacji + produkt blokady konca tury + bundle/manifest/START. Lokalnie, bez push i bez deployu. Runda 2 (obrona przed zarzutami Evaluatora r1) plus test dlugiego przebiegu: czy gra przechodzi dalej niz tura 43.

RUNDY: 2/5 (Operator, odpowiedz na zarzuty r1)

## Stan wejsciowy (odtworzony)

- Kandydat: `49e878d7` (bundle) na `219456ba` (produkt), rodzic `fcd86933` = origin/main (`git rev-parse origin/main`).
- Bundle: md5 `46401a9932fd92f47eed1848e772122b`, sha256 `5734348713663669fe6407fae9befc4d59fe233b58386105160c7ea093db2de2`, 69966015 B (`sha256sum`, `md5sum`, `stat -c %s`). Zgodne z `ROBOCZA-MANIFEST.json`.
- Allowlista (`git diff --name-only origin/main 49e878d7`): 4 pliki `gra/src` (`game/production.ts`, `main.ts`, `ui/cityPanel.ts`, `ui/unitReplacePicker.ts`), `gra/tools/**` (7 testow + stub), `gra-robocza/{Gra-ROBOCZA.html,ROBOCZA-MANIFEST.json,START.html}`, katalog runu. Brak zmian w `WERSJE.md`, `rust-port/**`, `src-tauri/**`.
- Rollback: bundle origin/main `23893f19cc904b61065b20e712fb6b35`, sha256 `0cf2f66f69d67711caa0c39c67ed6e2510e04b9d7e8bf46dfe99157e304b578b`, 69964335 B (`previousReleaseManifest` i `git show origin/main:gra-robocza/ROBOCZA-MANIFEST.json`).

## Odpowiedzi na zarzuty Evaluatora r1

1. **git diff --check (PRZYJMUJĘ, poprawka).** Trailing whitespace w `evidence/r1-test-summary.txt` (linie 1-30) i `evidence/r1-vite-build.log.txt:9`. Usunieto koncowe spacje (`sed -i 's/[[:space:]]*$//'`). Hashe PRZED: r1-test-summary.txt `0eed233eef2803637ee14ffb7cc15aece17c31df06d6124732a8763d4ded5579`, r1-vite-build.log.txt `b4dbcf66942b9988a9f1ba4f85e8fb991eb813f3601a87469527ee403b2146f8`. Zmiana wylacznie biala spacja na koncu linii. Nowe logi r2 tez oczyszczone (`r2-test-summary.txt`, `r2-vite-build.log.txt`). Dowod: `git diff --check` EXIT=0 po commicie r2 (patrz nizej).

2. **Zrzut panelu rekrutacji przy drewnie 0 (PRZYJMUJĘ, dowod).** Pliki: `evidence/r2-shots/po-rekrutacja-340px.png`, `po-rekrutacja-307px.png`, `po-rekrutacja-280px.png`, `po-rekrutacja-280px-brak-rekrutow.png`. Zrodlo: `evidence/r2-shot-drewno0.cjs` (kopia `recruitment-panel-compact-row-test.cjs` z `city.surowce.drewno = 0` i `stock.drewno = 0`; sciezka `GRA` wskazuje worktree). Wynik skryptu: `SUMMARY: 39 pass, 0 fail`. Na zrzucie wiersz `Procarz` (koszt `50 Drewno (brak)`) jest wyszarzony z zablokowanym `Rekrutuj`; wiersze bramkowane brazem/zelazem nie sa wyszarzone (brak zapasu brazu w fixturze = 1 000 000). Ograniczenie jawnie: to fixture z PRAWDZIWYM kodem `cityPanel`/`unitRecruitCard` i prawdziwymi danymi `units.json`, a nie pelna sesja gry (pelna sesja nie otwiera panelu w smoke).

3. **Smoke sięga tury 13, cel to ponad 43 (PRZYJMUJĘ, dowod dluzszego przebiegu).** `evidence/r2-smoke50/peace50.log.txt`, `war50.log.txt` (skrypt `evidence/smoke-war-endturn.cjs`, seed 778899, `?memdebug=1`, 50 zakonczen tury):
   - PEACE: `SUMMARY {"mode":"peace","turns":50,"finalTurn":51,"medianMs":9520,"meanMs":9721,"maxMs":12720,"stalls":0}`.
   - WAR: `SUMMARY {"mode":"war","turns":50,"finalTurn":51,"medianMs":9714,"meanMs":9840,"maxMs":12266,"stalls":0}`.
   - Oba: `BAD_RESPONSES []`, zero `pageerror`, `stalls 0`, `retries 0` w kazdej turze (w tym tury 43-50).
   - `ERRORS`: 27 wpisow w kazdym przebiegu, wszystkie to ten sam komunikat konsoli gry `[Wojna wymuszona] DECISION_REQUIRED: brak niezablokowanej sojuszem pary... Przydział pominięty tej tury` (hak testowy wojny, brak pary do wymuszenia). To nie wyjatek i nie blokuje tury.
   - Zrzuty: `evidence/r2-smoke50/peace-final-t51.png`, `war-final-t51.png`.
   - Odpowiedz na pytanie wlasciciela: w zautomatyzowanym smoke Chromium (headless, 10 miast, seed 778899) tura przechodzi do 51 w trybie pokoju i wojny bez zawieszenia. Ręcznej rozgrywki ta weryfikacja nie zastępuje.

4. **Tabela symboli (PRZYJMUJĘ, dowod).** Komenda: `git grep -n` po symbolach w `gra/src` oraz `grep -rl` w `rust-port` (0 trafien dla wszystkich symboli i `AvailabilityContext`).
   | Symbol | Miejsce | Rola | Port Rust |
   |---|---|---|---|
   | `unitStockShortfallLabel` | `gra/src/game/production.ts:660` | czytelnik przyczyny braku surowca; nie zmienia reguly | NIE (0 trafien) |
   | `recruitPanelPurchasableUnits` | `gra/src/ui/cityPanel.ts:8211` | jedyne wejscie panelu z `showStockGatedUnits: true` | NIE |
   | `renderBuildList` | `gra/src/ui/cityPanel.ts:8834` | lista budowy; `showResourceGatedBuildings: true` w `:8875` | NIE |
   | `AvailabilityContext.showStockGatedUnits` | `gra/src/game/production.ts:473` | flaga widoku panelu | NIE |
   | `AvailabilityContext.showResourceGatedBuildings` | `gra/src/game/production.ts:481` | flaga widoku listy budowy | NIE |
   | `healStuckDeferredPreBattleQueueOnEndTurnAttempt` | `gra/src/main.ts:31797` | sprzatanie kolejki bitew (blokada konca tury) | NIE |
   Wniosek: zadna z tych funkcji nie jest portowana do Rust; wektory z kodu weba nie dotycza `rust-port/`.

5. **Literaly w nowym kodzie (PRZYJMUJĘ, klasyfikacja).** Pelna lista dodanych liczb w `git diff fcd86933 HEAD -- gra/src` (komentarze pominiete) daje 3 literaly kodu: `showHintMessage('Zastąp: ...', 3000)` (czas komunikatu, ms), `}, 50);` w watchdogu `main.ts:31558-31573` (timer jednorazowy, ms), oraz prog wieku `ageMs <= 8000` w `healStuck…` (`main.ts:31822`, ms; wartosc sprzed produktu). Klasa: czas UI i timery, NIE mnozniki balansowe.
   - `UNIT_STOCK_GATE_LABEL` (`production.ts:649-653`): klucze `braz`/`zelazo`/`drewno` to te same trzy galezie co `production.ts:1044-1160` (wzorzec istnial wczesniej). Zgodnosc z danymi: `units.json` ma `Surowiec` = Brąz (35 wierszy), Żelazo (25), Drewno (14); `stripDiacritics` daje te same klucze. Ryzyko: nowy surowiec w danych bez wpisu w tabeli etykiet (funkcja zwroci `null`, a galezie bramki nie obejma go tak samo). Do osobnego tematu, nie blokuje kandydata.

## Notatki (nie zarzuty)

- Czerwone testy bazowe: `koniec-tury-f1-f4` (F1-A3, F2-A11) i `koniec-tury-g1-g2` (A8, A9) daja w kandydacie 2 fail na test. Test F2-A11 wymaga, by `healStuck…` byl pierwsza instrukcja `triggerPlayerEndTurn` (`evidence/r2-test-koniec-tury-f1-f4-runda3-test.log.txt`), a kod swiadomie przenosi to wywolanie za bramki (r6 zarzut 5). Test NIE zostal oslabiony. Liczby bazowe (2 fail) pochodza z logow r1 Operatora; NIE_ZMIERZONO ponownie na `fcd86933` w tej rundzie.
- `recruitment-no-upkeep-gate-test` 22/14 i `deposit-building-gate-test` 46/1 — identycznie jak w r1 (`evidence/r2-test-recruitment-no-upkeep-gate-test.log.txt`, `r2-test-deposit-building-gate-test.log.txt`).
- Dispatch podawal 1 fail w obu `koniec-tury`; mierzone 2 w kandydacie i (wg r1) 2 na bazie. Rozbieznosc zostaje NIE_ZMIERZONO co do przyczyny.

## Bramki (runda 2, na commicie `49e878d7`, surowe logi w `evidence/`)

- `npm ci --ignore-scripts` (w `gra/`) — EXIT=0 (log w scratchpad, nie w repo).
- `tsc --noEmit` — `evidence/r2-tsc.log.txt` — EXIT=0.
- Vite build bezposredni (`node node_modules/vite/bin/vite.js build --outDir <scratchpad>/dist-r2`) — `evidence/r2-vite-build.log.txt` — EXIT=0.
- `verify-robocza-bundle.cjs` — `evidence/r2-verify.log.txt` — VERIFY OK (stamp WARN, znana self-referencja).
- Testy (`evidence/r2-test-summary.txt`, pelne logi `r2-test-*.log.txt`): logic 213/213 (EXIT=0); endturn 38/0; endturn-exec 46/0; recruit-list 9/0; recruit-list-ui 15/0; building-resource 15/0; building-resource-ui 8/0; building-stock 7/0; unit-replace 13/13; compact-row 39/0; height-real-render 13/0; recruit-card manpower 20/0, quantity 25/0, stock-chip 15/0; barbarzyncy 249/0; barb-city 177/0; war-allin-capital 91/0 (z `WAR_ALLIN_BASE_REF=75f53d58`); ai-test 276/18 (= baza); web-memory-leaks 30/0; autosave 20/0; ai-prod-fallback 17/0; ai-city-recovery 7/0; city-badge growth 38/0, zoom-lod 67/0; city-map-badge 62/0; territory-border 9/0. Czerwone jak w bazie: recruitment-no-upkeep 22/14, deposit 46/1, koniec-tury-f1-f4 2 fail, koniec-tury-g1-g2 2 fail.
- Rust (engine, tylko odczyt, bez zmian w repo; `CARGO_INCREMENTAL=0`, katalog target w scratchpad, usuniety po biegu): `cargo fmt --check` EXIT=0 (`r2-rust-fmt.log.txt`), `cargo clippy --all-targets -- -D warnings` EXIT=0 (`r2-rust-clippy.log.txt`), `cargo build --all-targets` EXIT=0 (`r2-rust-build.log.txt`), `cargo test --no-run` EXIT=0 (`r2-rust-test-build.log.txt`). `Cargo.lock` wygenerowany przez cargo usuniety, nie commitowany.

## Plan publishu i rollbacku (wykonuje orkiestrator po Final Control)

1. Galaz integracyjna `integration/robocza-turnslow-20261023` od `origin/main` fcd86933. Commity: (a) produkt `219456ba`, (b) bundle+manifest+START+run docs `49e878d7`, (c) poprawki evidence r2 (ten commit).
2. Fast-forward/merge do `origin/main`, push `main` i galezi integracyjnej (wzorzec poprzednich wydan). Nie wykonano.
3. Readback z GitHub: md5 `46401a99...`, sha256 `57343487...`, 69966015 B. Wpis w `dyspozycje/WERSJE.md` dopiero po publishu (NIE w kandydacie).
4. Rollback: revert commitow bundla i produktu. Bundle origin/main: md5 `23893f19cc904b61065b20e712fb6b35`, sha256 `0cf2f66f69d67711caa0c39c67ed6e2510e04b9d7e8bf46dfe99157e304b578b`, 69964335 B. Poprzednie wydanie z manifestu: `99c6b33b…` (`previousReleaseManifest`).

## Zakres commita r2

Tylko katalog runu: poprawki evidence r1 (2 pliki, biale spacje), nowe `evidence/r2-*`, `02-operator-r2.md`. Nie zmieniono `gra/`, `gra-robocza/`, `WERSJE.md`, `rust-port/`, `src-tauri/`. Push: NIE WYKONANO.

NASTĘPNY KROK: Evaluator r2 (niezalezna weryfikacja hashow, `git diff --check` na HEAD, zrzutow i tabeli symboli), potem Final Control, potem integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
