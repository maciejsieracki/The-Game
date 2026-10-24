STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-FIXES1-RELEASE-ROBOCZA-Q1
GOAL: Kandydat wydania ROBOCZEJ = origin/main (fcd86933) + produkt rekrutacji (R-WEB-RECRUIT-LIST-REGRESSION-Q1) + produkt blokady konca tury (R-WEB-ENDTURN-BATTLE-DEADLOCK-Q1), bundle gra-robocza/Gra-ROBOCZA.html, manifest, START.html. Nie publikowano, nie pushowano.
RUNDY: 1/5

## Baza i commity (lokalne, bez push)
- Worktree detached na `origin/main` = `fcd86933`.
- `git cherry-pick -n 7e1904de 3219ec2a c95bef36 4eb67321 25bffd17 349c8481 01e8badf 0191d17e 29e6d878` - bez konfliktow (auto-merge `gra/src/main.ts` x4, zachowane obie zmiany). Pliki `dyspozycje/autobot/runs/R-WEB-RECRUIT-LIST-REGRESSION-Q1/**` i `R-WEB-ENDTURN-BATTLE-DEADLOCK-Q1/**` wyjete z indeksu i usuniete z worktree (poza allowlista; orkiestrator dolozy).
- Commit 1 (produkt, 12 plikow, +2232/-41): `219456ba`.
- Commit 2 (bundle+manifest+START+run docs): patrz `git log` po commicie.
- Lista plikow vs origin/main (`git diff --name-only origin/main HEAD`, komenda wykonana w worktree): `gra/src/game/production.ts`, `gra/src/main.ts`, `gra/src/ui/cityPanel.ts`, `gra/src/ui/unitReplacePicker.ts`, `gra/tools/.stubs/recruit-list-visibility-ui-brandAssets-stub.ts`, `gra/tools/building-resource-visibility-test.cjs`, `gra/tools/building-resource-visibility-ui-test.cjs`, `gra/tools/building-stock-visibility-test.cjs`, `gra/tools/endturn-battle-deadlock-exec-test.cjs`, `gra/tools/endturn-battle-deadlock-test.cjs`, `gra/tools/recruit-list-visibility-test.cjs`, `gra/tools/recruit-list-visibility-ui-test.cjs`. Wszystko w allowliscie. `unitRecruitCard.ts` i `preBattle.ts` byly zmieniane przez commity, ale netto zero zmian wzgledem origin/main.
- `git diff --check origin/main` EXIT=0.
- Rust (`rust-port/**`, `src-tauri/**`) i `WERSJE.md`: zero zmian. Rust fmt/clippy/cargo: N/A (brak zmian w Rust; CARGO_TARGET_DIR nie uzywany).

## Bundle (z faktycznego pliku)
- Build: `cd gra && node node_modules/vite/bin/vite.js build --outDir <scratchpad>/dist-r1` (bezposredni Vite, bez prebuild) -> `gra-robocza/Gra-ROBOCZA.html` -> `node gra/tools/inject-build-stamp.cjs gra-robocza/Gra-ROBOCZA.html ROBOCZA` (log: `evidence/r1-vite-build.log.txt`).
- md5 `46401a9932fd92f47eed1848e772122b`
- sha256 `5734348713663669fe6407fae9befc4d59fe233b58386105160c7ea093db2de2`
- bajty 69966015 (`stat -c %s`)
- Manifest: `gra-robocza/ROBOCZA-MANIFEST.json` (nowe pola gorne; poprzedni manifest origin/main pod `previousReleaseManifest`). START.html: `node gra-robocza/tools/generate-start-hub.cjs` -> OK.

## Bramki (surowe logi w evidence/, kazdy z EXIT)
- tsc --noEmit: EXIT=0 (`r1-tsc.log.txt`).
- npm ci --ignore-scripts: EXIT=0.
- Vite build: EXIT=0 (`r1-vite-build.log.txt`).
- verify-robocza-bundle.cjs: manifest match OK, stamp match WARN (znana self-referencja stampa), VERIFY OK, EXIT=0 (`r1-verify.log.txt`).
- Testy (`evidence/r1-test-<nazwa>.log.txt`, zbiorczo `r1-test-summary.txt`):
  - logic-test: LOGIC OK (213/213) EXIT=0
  - endturn-battle-deadlock-test: 38/0 EXIT=0
  - endturn-battle-deadlock-exec-test: 46/0 EXIT=0
  - recruit-list-visibility-test: 9/0; recruit-list-visibility-ui-test: 15/0
  - building-resource-visibility-test: 15/0; building-resource-visibility-ui-test: 8/0; building-stock-visibility-test: 7/0
  - unit-replace-test: 13/13 EXIT=0
  - recruitment-panel-compact-row-test: 39/0; recruitment-panel-height-real-render-test: 13/0
  - recruit-card-manpower-real-render-test: 20/0; recruit-card-quantity-real-render-test: 25/0; recruit-card-stock-chip-real-render-test: 15/0
  - barbarzyncy-krazenie-test: 249/0; barb-city-behavior-test: 177/0
  - war-allin-capital-test (WAR_ALLIN_BASE_REF=75f53d58): 91/0
  - ai-test: 276 passed / 18 failed, EXIT=1 (zgodnie z baza 276/18 wg dispatchu)
  - web-memory-leaks-test: 30/0; autosave-quota-fail-test: 20/0; ai-prod-fallback-test: 17/0; ai-city-recovery-test: 7/0
  - city-badge-growth-percent-test: 38/0; city-badge-zoom-lod-test: 67/0; city-map-badge-test: 62/0; territory-border-test: 9/0
- Czerwone bazowe (kandydat vs baza origin/main, uruchomione na obu; logi `r1-test-*` i `evidence/../base-*` poza repo):
  - recruitment-no-upkeep-gate-test: kandydat 22/14, baza 22/14 - IDENTYCZNIE.
  - deposit-building-gate-test: kandydat 46/1, baza 46/1 - IDENTYCZNIE.
  - koniec-tury-f1-f4-runda3-test: kandydat 37 pass / 2 fail (F1-A3, F2-A11), baza 2 fail (te same nazwy). IDENTYCZNIE. Uwaga: dispatch podawal 1 fail; zmierzono 2 na obu wersjach - NIE_ZMIERZONO skad rozbieznosc z dispatchem, wynik nie gorszy niz baza.
  - koniec-tury-g1-g2-runda4-test: kandydat 36 pass / 2 fail (A8, A9), baza 2 fail (te same). IDENTYCZNIE. Te same uwaga co wyzej.
  - Nie zmieniano ani nie oslabiano testow.

## Smoke Chromium (`/opt/pw-browsers/chromium-1194`, `?memdebug=1`, bundle `gra-robocza/Gra-ROBOCZA.html`, seed 778899, `evidence/smoke-war-endturn.cjs`, realne endTurn)
- Pokoj (`r1-smoke-peace.log.txt`, EXIT=0): koniec tury=13 osiagniete, ERRORS [], BAD_RESPONSES []; geometries 323, textures 15, programs 23, cityModels 10 w turze 13. Zrzut: `evidence/smoke-peace/peace-final.png`.
- Wojna wymuszona AI<->AI (`r1-smoke-war.log.txt`, EXIT=0): koniec tury=13 osiagniete, ERRORS [], BAD_RESPONSES []; geometries 315, textures 15 w turze 13. Zrzut: `evidence/smoke-war/war-final.png`.
- NIE_ZMIERZONO: zrzut panelu rekrutacji przy drewnie 0 (wymagany dispatchem) - nie wykonano osobnego kroku; smoke zapisuje tylko zrzut koncowy.

## Plan Gitflow / publish (wykonuje orkiestrator po Final Control PASS)
1. Galaz integracyjna `integration/robocza-turnslow-20261023` od `origin/main` fcd86933; commity: (a) produktowy `219456ba`, (b) bundle+manifest+START+run docs.
2. Merge/fast-forward do `origin/main`, push main + galezi integracyjnej (wzorzec poprzednich wydan).
3. Po publishu: readback raw GitHub (md5 `46401a99...`, sha256 `57343487...`, 69966015 B), wpis w `dyspozycje/WERSJE.md` (w kandydacie NIE aktualizowano), smoke na pobranym bundlu.
4. Rollback: `git revert` commitu bundla i produktowego => bundle origin/main: md5 `23893f19cc904b61065b20e712fb6b35`, sha256 `0cf2f66f69d67711caa0c39c67ed6e2510e04b9d7e8bf46dfe99157e304b578b`, 69964335 B. Poprzednie wydanie w historii manifestu: `99c6b33b2587673b3c377d40d22f6396` (75f53d58).

## NOTY
- Wydanie ROBOCZE; brak pelnej akceptacji rozgrywki (smoke tylko 12 tur, bounded).
- Czerwone bramki przegladarkowe identyczne jak na bazie (nie regresja).
- Stamp self-MD5 != md5 pliku: ograniczenie konstrukcyjne (wiazacy: bundleMd5).
NASTEPNY KROK: Evaluator (niezalezna weryfikacja md5/sha256, diff vs allowlista, powtorka wybranych testow).
DEPLOY/PUSH: NIE WYKONANO
