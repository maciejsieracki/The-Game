STATUS: BLOCK (techniczny, bramka czasu tury; reszta bramek zielona)
DOMAIN: GAME
TEMAT: R-WEB-WAR-RULES-RELEASE-ROBOCZA-Q1
GOAL: Wydanie ROBOCZE nr 3 = origin/main 00fe8dc4 (ROBOCZA a289d2c4) + reguly wojen R-WEB-WAR-RULES-MULTIWAR-Q1 (cherry-pick 0244e7d7 8415e5e4 b4828f4c 32515b91 6b9a2545, bez plikow dyspozycje/). Lokalnie, bez push, bez deployu, bez zmiany WERSJE.md.
RUNDA: 1/5

## Stan wejsciowy
- `git fetch origin main` -> origin/main = 00fe8dc4 (= HEAD worktree przed zmianami). Worktree: `git checkout --detach origin/main`.
- `git cherry-pick -n 0244e7d7 8415e5e4 b4828f4c 32515b91 6b9a2545` -> EXIT=0, bez konfliktow. Pliki `dyspozycje/autobot/runs/R-WEB-WAR-RULES-MULTIWAR-Q1/**` usuniete z indeksu i katalogu (zgodnie z dispatchem). Zmiany produktu: gra/data/war-rules-params.json, gra/src/game/{ai.ts,war-rules-multiwar.ts,warAllInCapital.ts}, gra/src/main.ts, gra/tools/{forced-war-iron-player-target-live-test.cjs,forced-war-player-no-contact-live-test.cjs,forced-war-player-target-live-test.cjs,forced-war-trojstronna-domino-live-test.cjs,war-rules-multiwar-live-test.cjs,war-rules-multiwar-main-guard-test.cjs,war-rules-multiwar-test.cjs}.
- `git diff --cached origin/main --name-only` poza gra/: brak.

## Build i weryfikacja bundla
- `cd gra && npm ci --ignore-scripts` -> EXIT=0 (log poza repo, nieistotny).
- `npx tsc --noEmit` -> EXIT=0 (`evidence/r1-tsc.log.txt`).
- Vite direct build do scratch: `node node_modules/vite/bin/vite.js build --outDir <scratchpad>/dist-r1 --emptyOutDir` -> EXIT=0 (`evidence/r1-vite-build.log.txt`).
- Kopia do `gra-robocza/Gra-ROBOCZA.html`, `node gra/tools/inject-build-stamp.cjs gra-robocza/Gra-ROBOCZA.html ROBOCZA` -> OK, stamp 763320d7.
- Kandydat: md5 `763320d70c0ab4d665908d3d7f13522c`, sha256 `8f4b67a5e0a0e7ed63c03300549923a1378d6dbfc95927e6813ad8caadac037b`, 69973674 B (md5sum/sha256sum/stat na pliku).
- Stamp w tytule: md5 ffa0c769... != md5 pliku (znane ograniczenie konstrukcyjne; wiazacy jest bundleMd5).
- `node gra/tools/verify-robocza-bundle.cjs` po aktualizacji manifestu -> manifest match OK, VERIFY OK, EXIT=0 (`evidence/r1-verify.log.txt`). Przed aktualizacja manifestu MISMATCH jak oczekiwano (`evidence/r1-verify-pre-manifest.log.txt`).
- Manifest `gra-robocza/ROBOCZA-MANIFEST.json`: nowe pola top-level (bundleMd5/sha256/bytes = kandydat), `previousRelease` i `rollbackPlan` = ROBOCZA a289d2c4 (md5 a289d2c4796333c97d1b46e3bdc69f33, sha256 09f4a591f0790d10b8f6e4531295b2fc9c954ccff58b5f13462e2bfc1dd50751, 69969032 B; zgodne z WERSJE.md), `previousReleaseManifest` = poprzedni manifest w calosci (historia lancucha).
- `gra-robocza/START.html`: wersja w naglowku/karcie -> 763320d7, md5 w kartach -> 763320d70c0a, data 2026-10-25 08:27 (czas systemowy; strefa niezweryfikowana).

## TESTY (surowe logi: `evidence/t-*.log.txt`, kazdy z linia `EXIT=`)
Wynik zgodny z dispatchem, chyba ze zaznaczono inaczej:
- war-rules-multiwar 55 OK/0 FAIL (EXIT=0); war-rules-multiwar-main-guard 21 PASS/0 FAIL (EXIT=0).
- war-allin-capital (domyslna baza fcd86933) 95 passed/0 (EXIT=0).
- ai-move-range 46/0; ai-move-range-collision 12/0 (EXIT=0).
- endturn-battle-deadlock 38/0; endturn-battle-deadlock-exec 46/0 (EXIT=0).
- load-game-regression 34/0; load-game-blockers-exec 15/0; fsa-autosave 55/0 (EXIT=0).
- logic-test LOGIC OK 213/213 (EXIT=0).
- ai-test 276 passed / 18 failed (EXIT=1) = baza 276/18 (znane).
- barbarzyncy-krazenie 249/0; barb-city-behavior 178/0 (EXIT=0).
- forced-war-stone 38/0; forced-war-stone-main-guard 19/0 (EXIT=0).
- forced-war-bronze 56/0; forced-war-bronze-main-guard 27 PASS/1 FAIL (EXIT=1 = znane 27/1); forced-war-bronze-new-game-reset ReferenceError `forcedWarWavesByPairKey is not defined` (EXIT=1 = znane).
- forced-war-iron 55/0; forced-war-iron-main-guard 37/0 (EXIT=0).
- forced-war-waves 17/0; forced-war-trojstronna 23/0; forced-war-trojstronna-main-guard 14/0 (EXIT=0).
- diplomacy-war-gates 19/0; alliance-war-obligation 14/0; ai-war-gate 24/0; web-memory-leaks 30/0 (EXIT=0).
- Znane czerwone na bazie, bez pogorszenia (uruchomione osobno, EXIT=1): recruitment-no-upkeep-gate 22 passed/14 failed; deposit-building-gate 46/1; koniec-tury-f1-f4-runda3 37/2; koniec-tury-g1-g2-runda4 36/2 (dokladnie jak w dispatchu).
- Nie uruchomiono (poza dispatchem): Rust (dispatch nie wymaga dla tej paczki), war-rules-multiwar-live-test (Chromium).

## SMOKE Chromium (`scratchpad/r1/smoke.cjs` = `evidence/r1-smoke-script.cjs.txt`, ?memdebug=1, seed 778899, 46 zakonczen tury, file://)
Baza = origin/main bundle a289d2c4 (md5 a289d2c4796333c97d1b46e3bdc69f33, `git show origin/main:gra-robocza/Gra-ROBOCZA.html`).

| przebieg | finalTurn | medianMs | meanMs | maxMs | stalls | BAD_RESPONSES |
|---|---|---|---|---|---|---|
| kandydat peace (r1) | 47 | 8369 | 8183 | 10046 | 0 | [] |
| baza peace (r1) | 47 | 6105 | 6113 | 8533 | 0 | [] |
| kandydat war (r1) | 47 | 7564 | 7456 | 9412 | 0 | [] |
| baza war (r1) | 47 | 6862 | 6779 | 8869 | 0 | [] |

- Stosunek mediany endTurn kandydat/baza: **peace 1,37 (> limit 1,15: NIE SPELNIONY)**; war 1,10 (spelniony).
- Porownanie tej samej trajektorii (liczba miast przy kolejnych turach identyczna w obu przebiegach peace: 10,10,10,10,11,14,15,17), wiec roznica czasu nie wynika z innej gry w tym pomiarze.
- Powtorka peace (`evidence/r2-*`): baza peace 5754 ms mediany (46 tur, stalls 0). Kandydat peace przerwany po ~15 turach (EXIT=1, celowo, `pkill`), bo host byl przeciazony: load average ~16 od innych sesji na tej maszynie (`uptime`, procesy chromium/node z innego worktree). Pomiar powtorki NIE jest porownywalny -> NIE_ZMIERZONO.
- Errors/bledy: `pageerror` 0, `TypeError` 0, `ReferenceError` 0 w obu logach kandydata. Wpisy ERRORS: 8 wpisow `[Wojna wymuszona] DECISION_REQUIRED: brak niezablokowanej sojuszem pary...` (ten sam komunikat hooka testowego co w bazie). Poprzednie wydanie raportowalo 27 wpisow tego komunikatu w tym samym harnessie; przyczyna roznicy liczby NIE_ZMIERZONO (nie badano).
- Logi: `evidence/r1-smoke-{new,base}-{peace,war}.log.txt`, `evidence/r2-smoke-base-peace-rerun.log.txt`, `evidence/r2-smoke-new-peace-rerun-KILLED-host-load.log.txt`.

## NIE_ZMIERZONO (wg dispatchu, nadal otwarte)
- symulacja >=60 tur x 5 seedow x 4-6 AI; liczniki minietych/zdobytych miast; hash flagi OFF vs baza i determinizm; diagnoza "dlaczego nikt nie wypowiada wojny graczowi" (tylko z kodu).
- czas tury: czysty pomiar kandydat/baza w peace na cichym hoscie (patrz wyzej).

## Hygiene / allowlista
- `git diff --check origin/main` EXIT=0 (staged+worktree).
- Allowlista: gra/src/**, gra/data/**, gra/tools/** (z cherry-pick), gra-robocza/Gra-ROBOCZA.html, gra-robocza/ROBOCZA-MANIFEST.json, gra-robocza/START.html, dyspozycje/autobot/runs/R-WEB-WAR-RULES-RELEASE-ROBOCZA-Q1/**. Brak zmian w WERSJE.md, rust-port/**, src-tauri/**.
- Brak `git add -A`; commit z jawnymi sciezkami.
- Scratch (dist-r1, base html) do usuniecia po zapisie raportu.

## BLOKADY
1. BLOCK: czas tury peace kandydat/baza = 1,37 > 1,15 (jeden sparowany pomiar; war 1,10 OK). Powtorka nieczysta (obciazenie hosta, load ~16). Wymagany czysty pomiar na cichym hoscie przed publikacja albo decyzja FC/orkiestratora, czy akceptowac roznice. Przyczyna roznicy NIE_ZMIERZONO (nie badano).
2. NIE_ZMIERZONO: rzeczy z listy powyzej.

## Plan publishu i rollbacku (wykonuje orkiestrator po Final Control)
- Integracja na `integration/robocza-warrules-20261025` od `origin/main` 00fe8dc4; commit produktu/bundla/manifestu/START + ten run.
- Rollback: poprzedni bundle ROBOCZA a289d2c4 (md5 a289d2c4796333c97d1b46e3bdc69f33, sha256 09f4a591f0790d10b8f6e4531295b2fc9c954ccff58b5f13462e2bfc1dd50751, 69969032 B) z `origin/main` `gra-robocza/Gra-ROBOCZA.html`, albo revert commitu wydania.

NASTEPNY KROK: Evaluator (niezalezna weryfikacja hashy, EXIT w logach, allowlisty, bramka czasu tury) -> Final Control. Przed Final Control wskazane: czysty pomiar czasu tury peace (kandydat vs baza, na cichym hoscie, 46 tur, ta sama procedura `evidence/r1-smoke-script.cjs.txt`).
DEPLOY/PUSH: NIE WYKONANO
