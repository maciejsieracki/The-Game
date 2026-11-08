STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-FIXES2-RELEASE-ROBOCZA-Q1
GOAL: Kandydat ROBOCZY nr 2 = origin/main 7e0e7c71 + (A) zasieg ruchu AI/panstw-miast/barbarzyncow (R-WEB-AI-MOVE-RANGE-Q1) + (B) Wczytaj gre widzi autozapis FSA po przeladowaniu (R-WEB-LOAD-GAME-REGRESSION-Q1). Lokalnie, bez push, bez deployu, bez zmiany WERSJE.md.
RUNDA: 1/5

## Stan wejsciowy
- Baza: `git fetch origin main` -> `origin/main` = 7e0e7c71 (wpis WERSJE 7e0e7c71, wydanie fixes1 71794751). Worktree: `git checkout --detach origin/main`.
- Cherry-picki produktowe z lokalnego repo, `--no-commit`, po SHA w kolejnosci dispatchu: bc291361, 96d1c4b0, fe50dd23, 04d6a88f (AI-MOVE-RANGE); 1d7ddb3b, 51ddaea5, 0a848702, ee8e7034, 3574308a, a6d0fc67 (LOAD-GAME). Pominiete: bba8a7cf, 8ea05ace, 8b7b4d9a (dokumenty runow) oraz wszystkie `dyspozycje/autobot/runs/R-WEB-AI-MOVE-RANGE-Q1/**` i `R-WEB-LOAD-GAME-REGRESSION-Q1/**` (usuniete z indeksu i z worktree przed commitem).
- Konflikty: zadnego konfliktu zgloszonego przez git. `gra/src/main.ts` scalony automatycznie przy cherry-pickach bc291361, 04d6a88f, 1d7ddb3b, 51ddaea5, 3574308a, a6d0fc67. `grep -rnE '^(<<<<<<<|=======|>>>>>>>)' gra/src gra/tools` = brak markerow. Zachowanie obu tematow potwierdzone testami (sekcja TESTY). Nie wykonano recznej wizualnej kontroli kazdego hunka main.ts (NIE_ZMIERZONO poza testami).

## Commity (lokalne, bez push)
- Produkt: `8b522e8f` (19 plikow, +2470/-53): `gra/src/game/{ai-city-capture-executor,ai-move-range,ai,barbarians,fsa-autosave,save-presence,warAllInCapital}.ts`, `gra/src/main.ts`, `gra/tools/**` (testy obu tematow).
- Bundle + manifest + START: `0d126d4a` (`gra-robocza/Gra-ROBOCZA.html`, `ROBOCZA-MANIFEST.json`, `START.html`).
- Dokumenty runu: commit po tym pliku (katalog `R-WEB-FIXES2-RELEASE-ROBOCZA-Q1/`).
- Allowlista: `git diff --name-only origin/main HEAD` -> wylacznie `gra/src/**`, `gra/tools/**`, 3 pliki `gra-robocza/`, katalog runu. Zero w `WERSJE.md`, `rust-port/**`, `src-tauri/**`. `git diff --check` EXIT=0.

## Bundle (kandydat)
- Build: `cd gra && node node_modules/vite/bin/vite.js build --outDir <scratchpad>/dist-r1` (EXIT=0, `evidence/r1-vite-build.log.txt`), kopia do `gra-robocza/Gra-ROBOCZA.html`, `node gra/tools/inject-build-stamp.cjs gra-robocza/Gra-ROBOCZA.html ROBOCZA`.
- Kandydat: md5 `a289d2c4796333c97d1b46e3bdc69f33`, sha256 `09f4a591f0790d10b8f6e4531295b2fc9c954ccff58b5f13462e2bfc1dd50751`, 69969032 B (`md5sum`, `sha256sum`, `stat -c %s`).
- Stamp w tytule: md5 `6e1c9dc1b167916904151a919a40e6eb` != md5 pliku (znane ograniczenie konstrukcyjne, wiazacy jest bundleMd5).
- `node gra/tools/verify-robocza-bundle.cjs` -> manifest match OK, stamp WARN (znane), VERIFY OK, EXIT=0 (`evidence/r1-verify.log.txt`).
- Rollback (wydanie nr 1, origin/main 7e0e7c71): md5 `46401a9932fd92f47eed1848e772122b`, sha256 `5734348713663669fe6407fae9befc4d59fe233b58386105160c7ea093db2de2`, 69966015 B (zmierzone na pliku bazowym `git show origin/main:gra-robocza/Gra-ROBOCZA.html`).
- Manifest: `previousReleaseManifest` = poprzedni manifest (46401a99) z jego wlasnym lancuchem.

## TESTY (surowe logi: `evidence/r1-test-*.log.txt`, kazdy z linia `EXIT=`)
- `tsc --noEmit` EXIT=0 (`r1-tsc.log.txt`).
- logic-test 213/213; ai-move-range-test 46/0; ai-move-range-collision-test 12/0.
- war-allin-capital-test: domyslna baza fcd86933 -> 95/0; z `WAR_ALLIN_BASE_REF=75f53d58` -> 90/5. Niezgodnosc dotyczy wylacznie sekcji 6 (6a: baza 75f53d58 nie zawiera modulu wojny; 6b0 x4: referencje hashy bazy sa dla fcd86933). Dispatch oczekiwal 95/0 lub opisu: opisane.
- endturn-battle-deadlock-test 38/0; endturn-battle-deadlock-exec-test 46/0.
- load-game-regression-test 34/0; load-game-blockers-exec-test 15/0; fsa-autosave-test 55/0; autosave-quota-fail-test 22/0.
- recruit-list-visibility-test 9/0; recruit-list-visibility-ui-test 15/0; building-resource-visibility-test 15/0; building-resource-visibility-ui-test 8/0; building-stock-visibility-test 7/0; unit-replace-test 13/13.
- barbarzyncy-krazenie-test 249/0; barb-city-behavior-test 178/0; barbarians-test 213/0.
- ai-test 276/18 (= baza); web-memory-leaks-test 30/0; ai-prod-fallback-test 17/0; ai-city-recovery-test 7/0; city-badge-growth-percent-test 38/0; city-badge-zoom-lod-test 67/0.
- Znane czerwone na bazie (bez pogorszenia): recruitment-no-upkeep-gate-test 22/14; deposit-building-gate-test 46/1; koniec-tury-f1-f4-runda3-test 37/2; koniec-tury-g1-g2-runda4-test 36/2.
- Rust (`rust-port/engine`, tylko odczyt, CARGO_INCREMENTAL=0, katalog target w scratchpad usuniety, `Cargo.lock` wygenerowany usuniety, nie commitowany): `cargo fmt --check` EXIT=0; `cargo clippy --all-targets -- -D warnings` EXIT=0; `cargo build --all-targets` EXIT=0; `cargo test --no-run` EXIT=0.

## SMOKE Chromium (`?memdebug=1`, seed 778899, 50 zakonczen tury; skrypt `evidence/smoke-war-endturn.cjs`)
Baza = origin/main 7e0e7c71 bundle 46401a99 (ta sama wersja co wydanie nr 1 71794751). Ten sam seed i ten sam skrypt:

| przebieg | finalTurn | medianMs | meanMs | maxMs | stalls | BAD_RESPONSES |
|---|---|---|---|---|---|---|
| kandydat peace | 51 | 4887 | 4995 | 5981 | 0 | [] |
| baza peace | 51 | 4922 | 5036 | 5905 | 0 | [] |
| kandydat war | 51 | 4534 | 4590 | 5530 | 0 | [] |
| baza war | 51 | 4831 | 4862 | 5442 | 0 | [] |

- Stosunek mediany endTurn kandydat/baza: peace 0,99; war 0,94 (limit x1,15: spelniony).
- ERRORS: 27 wpisow w kazdym z 4 przebiegow, wszystkie to ten sam komunikat hooka testowego `[Wojna wymuszona] DECISION_REQUIRED: brak niezablokowanej sojuszem pary...` (identyczne w bazie i kandydacie). Brak `TypeError`/`ReferenceError`/`pageerror`.
- Logi: `evidence/r1-smoke-{new,base}-{peace,war}.log.txt`, katalogi `evidence/smoke-*/`.

## E2E ladowania zapisu (`gra/tools/load-game-regression-e2e-r5.cjs`) - NIE ZMIERZONO
- Uruchomione na zbudowanym dist (`python3 -m http.server 8765` na `scratchpad/dist-r1`). Dwa biegi (pelny, `--only A-FSA`): FAIL wyjatek `page.evaluate: Target page, context or browser has been closed` w `stateOf`/`playNewGame`, zanim scenariusz doszedl do wczytania. Logi: `evidence/r1-e2e-load-game-r5.log.txt`, `evidence/r1-e2e-load-game-r5-afsa.log.txt`.
- Przyczyna nieustalona w tej rundzie. Smoke Chromium (ten sam Playwright) dzialal, wiec sam przegladarka nie jest zablokowana.
- Zrodlo 404 w konsoli (scenariusz A-FSA) NIE ZOSTALO ustalone: E2E nie doszedl do tego etapu. Smoke logi nie zawieraja 404 (`grep -c 404` = 0).
- Pomiar >= 40 tur z wczytaniem: NIE_ZMIERZONO. Stary zapis: NIE_ZMIERZONO.

## Plan publishu i rollbacku (wykonuje orkiestrator po Final Control; Operator nie pushuje)
1. Galaz integracyjna `integration/robocza-turnslow-20261023` od `origin/main` 7e0e7c71. Kolejne commity: produkt `8b522e8f`, bundle `0d126d4a`, dokumenty runu (commit po tym pliku).
2. Fast-forward/merge do `origin/main`, push `main` i galezi integracyjnej (wzorzec poprzednich wydan), po osobnej autoryzacji deploy/push. Nie wykonano.
3. Readback z GitHub: md5 `a289d2c4...`, sha256 `09f4a591...`, 69969032 B. Wpis w `dyspozycje/WERSJE.md` dopiero po publishu (nie w kandydacie).
4. Rollback: revert commitow `0d126d4a` i `8b522e8f` albo przywrocenie `gra-robocza/Gra-ROBOCZA.html` z `origin/main` 7e0e7c71 (md5 `46401a99...`, sha256 `57343487...`, 69966015 B).

## Ograniczenia
- Wydanie ROBOCZE. Smoke 50 tur w headless Chromium, nie reka rozgrywka.
- Brak zamknietego E2E ladowania (sekcja wyzej) i brak pomiaru >= 40 tur z wczytaniem.
- Niezgodnosc war-allin przy bazie 75f53d58 (opisana w TESTY).

NASTĘPNY KROK: Evaluator r1 (niezalezna weryfikacja hashy, `git diff --check`, allowlisty, zrzutow surowych logow, decyzja o E2E i 404), potem Final Control, potem integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
