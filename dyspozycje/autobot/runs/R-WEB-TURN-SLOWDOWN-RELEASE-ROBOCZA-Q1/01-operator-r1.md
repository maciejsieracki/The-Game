STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TURN-SLOWDOWN-RELEASE-ROBOCZA-Q1
GOAL: Kandydat wydania ROBOCZEJ = origin/main (c11f5087) + produkt R-WEB-TURN-SLOWDOWN-Q2 (0f041ad6 + e77a53d4: gra/src/main.ts + gra/tools/web-turn-slowdown-*.cjs), bundle gra-robocza/Gra-ROBOCZA.html, manifest, START.html.
RUNDY: 1/5

## Baza i commity (lokalne, bez push)
- Worktree detached na `origin/main` = `c11f5087`. `git cherry-pick -n 0f041ad6 e77a53d4`, z indeksu i dysku usunieto docs `dyspozycje/autobot/runs/R-WEB-TURN-SLOWDOWN-Q2/*` (poza allowlista). `git diff 38c4a2c4 -- gra` = pusty (gra/ identyczne ze stanem Final Control).
- Commit 1 (produkt, 9 plikow: main.ts + 8x web-turn-slowdown-*.cjs): `eccb5b7b`.
- Commit 2 (bundle + manifest + START + run docs): patrz `git log` (hash w raporcie orkiestratora).
- Uwaga: dispatch mowil o "4 plikach" produktowych; faktycznie `web-turn-slowdown-*.cjs` to 8 plikow (chart, compare, growth, jstime, measure, profile-summary, test, texsmoke) + main.ts = 9. Wszystkie pasuja do wzorca allowlisty.

## Bundle (z faktycznego pliku `gra-robocza/Gra-ROBOCZA.html`)
- md5 `517406ca871523b7c72ea8e3cd61d9b1`
- sha256 `a059d4f4cbfb161902dea9e76d81e6a1585d7e81c6585b4be896cf688418100a`
- bajty 69953071
- Sciezka: `gra/` `npm ci --ignore-scripts` -> `node node_modules/vite/bin/vite.js build --outDir <scratchpad>/dist-turnslow` (bezposredni Vite, bez prebuild wiki) -> `evidence/stamp-bundle.cjs` (port Node inject-build-stamp.ps1, jak w poprzednim wydaniu) -> `gra-robocza/Gra-ROBOCZA.html`; `gra-robocza/tools/generate-start-hub.cjs` odswiezyl START.html i md5 w manifescie. Manifest: nowe pola gorne, caly poprzedni manifest (0c7f13d9, wraz z jego wlasnym `previousReleaseManifest`) pod `previousReleaseManifest`. WERSJE.md, rust-port/**, src-tauri/** NIE ruszone.

## Bramki (surowe logi w evidence/, kazdy z `EXIT=`)
- npm ci EXIT=0 (`r1-npm-ci.log.txt`); tsc --noEmit EXIT=0 (`r1-tsc.log.txt`); Vite build EXIT=0, 69,858.29 kB przed stemplem (`r1-vite-build.log.txt`).
- verify-robocza-bundle.cjs: `VERIFY OK`, manifest match OK, stamp match WARN (znana self-referencja stempla, patrz manifest poprzedniego wydania), EXIT=0 (`r1-verify.log.txt`).
- Testy (`r1-test-*.log.txt`, EXIT=0): logic-test 213/213; territory-border-test 9/0; ai-prod-fallback 17/0; ai-city-recovery 7/0; autosave-quota-fail 20/0; city-badge-growth-percent 38/0; city-badge-zoom-lod 67/0; city-map-badge 62/0; web-memory-leaks-test 30/0.
- Rust fmt/clippy/cargo: N/A (zero zmian w rust-port/**, src-tauri/**).

## web-turn-slowdown-test.cjs (40 tur, domyslnie) — NIE zielony w 1 przebiegu, uwaga
Trzy pelne proby (swiftshader, pelny przebieg ok. 45-50 min):
1. `r1-test-web-turn-slowdown-test-attempt1-CRASH.log.txt`: `PAGE CRASH` renderera Chromium w T30 przebiegu FIX (INFRA; przyczyna NIE_ZMIERZONO).
2. `...-attempt2-CLOSE-at-fix2-T31.log.txt`: D1 OK (identyczny skrot FIX vs PRE w 39 turach, T15 oba `18efe513`), potem strona zamknieta w T31 przebiegu fix2 (INFRA, jw.).
3. `r1-test-web-turn-slowdown-test.log.txt` (finalny): 11 OK / 2 FAIL (EXIT=1). OK: 5x sanity kotwic, S, M, K1 (isProductionAllowed t39: FIX 8.3 ms vs PRE 1169.0 ms), K2 (10.8 vs 242.8 ms), K3 (0.6 vs 399.3 ms), K4 (20x territory rates min: FIX 69.6 vs PRE 89.8 ms). FAIL: D1 (pierwsza roznica T15: FIX `18efe513`, PRE `aa709b8b`) oraz D2 (final T40 FIX `0c5f438e` vs fix2 `2bf2abe9`).
- Interpretacja (z dowodu, nie pewnik): w proby 3 przebieg `fix2` — ten sam kod co `fix` — poszedl inna trajektoria (T15 `aa709b8b`, final `2bf2abe9`) niz `fix` (T15 `18efe513`, final `0c5f438e`), a `pre` poszedl ta sama trajektoria co `fix2`. W probie 2 wszystkie przebiegi mialy trajektorie `18efe513`. Ten sam kod daje dwie trajektorie => niedeterminizm harnessu (ziarnowany Math.random, ale kolejnosc wywolan zalezna od timingu klatek/renderu pod swiftshader), nie regresja logiki poprawki. Zrodlo niedeterminizmu NIE_ZMIERZONO. Reguly zakaz osłabiania testow zachowany: test niezmieniony; wynik 13/13 NIE zostal osiagniety w jednym przebiegu. Decyzja czy to wystarcza: Evaluator/Final Control.
- `errors=16` w DONE kazdego przebiegu (rowniez PRE) — tresc bledow NIE_ZMIERZONO.

## Smoke Chromium (`?memdebug=1`, `evidence/smoke-chromium-r2.cjs`, bundle z `gra-robocza/`, `r1-smoke-chromium.log.txt`, EXIT=0)
Seed/Standard/Kontynenty jak w poprzednim runie, 9 zakonczen tury, TURA 1 -> 10, zero stall. Trend (tura: geometries/textures/programs/cityModels/cityBadgeTextures/jsHeapMB): 2: 274/18/18/49/5/299.5; 5: 274/18/18/49/5/320.2; 6: 274/18/18/49/5/299.9; 7: 274/21/18/49/5/292.2; 8: 274/22/18/49/5/301.0; 9: 274/22/18/49/5/303.0; 10: 294/22/18/49/5/306.8. Brak monotonicznego wzrostu heapu (292-320 MB); textures 18->22 od tury 7 jak w poprzednim wydaniu (zrodlo NIE_ZMIERZONO). `BAD_RESPONSES []`, jedyny blad konsoli = 404 `/favicon.ico` lokalnego serwera; zero pageerror. Zrzuty: `evidence/smoke-shots/*.png`. To nie jest pelna akceptacja rozgrywki.

## Plan Gitflow / publish (wykonuje orkiestrator po Final Control PASS)
1. Galaz integracyjna `integration/robocza-turnslow-20261023` od `origin/main` c11f5087; commity: (a) produktowy `eccb5b7b`, (b) bundle+manifest+START+run docs.
2. Fast-forward/merge do `origin/main`, push main + galezi integracyjnej (wzorzec poprzednich wydan).
3. Po publishu: readback raw GitHub (md5/sha256/bajty jak wyzej), wpis `dyspozycje/WERSJE.md` z md5 przeliczonym z opublikowanego bundla (w kandydacie NIE aktualizowano), smoke na pobranym bundlu.
4. Rollback: `git revert` commitu bundla + commitu produktowego => bundle `0c7f13d9dbb869ea648bd65dfd3bea1c`, sha256 `0ab5f654d19f1be30c8139ca3de77781b75e327d5d4c0e8e262bbcd3be839a22`, 69945591 B (wydanie R-WEB-MEMORY-LEAKS, c11f5087 wg WERSJE.md); weryfikacja md5. Starszy punkt: `3b6610b74fd6586c5507908fe7665369` (b4d37d9f).

NASTEPNY KROK: Evaluator (niezalezne verify + diff do origin/main vs allowlista; ocena niedeterminizmu D1/D2).
DEPLOY/PUSH: NIE WYKONANO
