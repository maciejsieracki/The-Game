STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MEMORY-LEAKS-RELEASE-ROBOCZA-Q1
GOAL: Kandydat wydania ROBOCZEJ = origin/main (cfc26c17) + 4 pliki produktowe z 5f5eea8f (R-WEB-MEMORY-LEAKS-FIX-Q1), bundle gra-robocza/Gra-ROBOCZA.html, manifest.
RUNDY: 1/5

## Baza i zmiany
- Worktree detached na `origin/main` = `cfc26c17`. `git cherry-pick -n 5f5eea8f`, po czym usunieto z indeksu i dysku pliki docs `dyspozycje/autobot/runs/R-WEB-MEMORY-LEAKS-FIX-Q1/*` (poza allowlista). Produkt: gra/src/render/cities.ts, gra/src/battle/battleScene.ts, gra/src/main.ts, gra/src/render/memDebug.ts (160+/4-).
- Bundle: `gra/` `npm ci --ignore-scripts` -> `node node_modules/vite/bin/vite.js build --outDir <scratchpad>/dist-memleaks` (894 modul) -> stempel ROBOCZA wstrzykniety `evidence/stamp-bundle.cjs` (port Node `gra/tools/inject-build-stamp.ps1`; brak pwsh na Linux) -> `gra-robocza/Gra-ROBOCZA.html`. `gra-robocza/tools/generate-start-hub.cjs` odswiezyl START.html + md5 w manifescie (tak jak b4d37d9f zmienil START.html). Manifest dopisany: releaseState=candidate, bundleMd5/Sha256/Bytes, scope, previousRelease, finalControl=PENDING.
- Allowlista: poza wymienionymi plikami zmieniono tylko `gra-robocza/START.html` (uzasadnienie: hub zawiera md5 bundla; poprzednie wydanie b4d37d9f tez go zmienilo). WERSJE.md NIE ruszony. rust-port/**, src-tauri/** nie ruszone.

## Bundle (z faktycznego pliku)
- md5 `0c7f13d9dbb869ea648bd65dfd3bea1c`
- sha256 `0ab5f654d19f1be30c8139ca3de77781b75e327d5d4c0e8e262bbcd3be839a22`
- bajty 69945591
- Poprzedni (rollback) wg WERSJE.md: md5 `3b6610b74fd6586c5507908fe7665369`, sha256 `234dff75036b22e423b33f9d6134428c559b612922b866399346f0e94ebfca4a`, 69943587 B, commit `b4d37d9f`.

## Bramki (surowe logi w evidence/)
- npm ci: EXIT=0 (`npm-ci.log`). tsc --noEmit: EXIT=0 (`tsc.log`). Vite build: EXIT=0, 894 modulow (`vite-build.log`).
- verify-robocza-bundle.cjs: `VERIFY OK`, manifest match OK; stamp match WARN (znane ograniczenie Linux, jak w poprzednim wydaniu) (`verify.log`).
- Testy: city-badge-growth-percent 38/0, city-badge-zoom-lod 67/0, autosave-quota-fail 20/0, ai-city-recovery 7/0 (`test-*.log`, kazdy EXIT=0). Brak osobnych testow jednostkowych dla dispose modeli miast/listenerow bitwy.
- Smoke Chromium (`smoke-chromium.cjs/.out`, bundle serwowany lokalnie HTTP, `?memdebug=1`, chromium-1194 swiftshader): menu -> kreator -> Standard/Kontynenty seed 7 -> worldgen 192 s -> canvas + HUD, zalozenie pierwszego miasta (klik w hex), TURA 1->4 przez ZAKONCZ TURE. Zero pageerror; jedyny console.error: "Failed to load resource 404" (nieustalony zasob, prawdopodobnie favicon, NIE_ZMIERZONO). Zrzuty: smoke-ingame-t1.png, smoke-after-found.png, smoke-ingame-after-turns.png.
- memDebug (2 linie przechwycone, obie tura=4): `geometries=274 textures=18 programs=18 cityModels=49 cityBadgeTextures=5 cityBadgeTexturesFreed=0 jsHeapMB=304.3` i `...jsHeapMB=319.1`. Trendu tura-do-tury NIE ZMIERZONO (log nie zlapany po tury 1-3; pozniejsze klikniecia ZAKONCZ TURE zablokowane przez nieobsluzony stan UI skryptu, licznik zatrzymal sie na TURA 4).

## Uwagi / ograniczenia
- Smoke to nie pelna akceptacja rozgrywki; brak porownania przed/po poprawce (nie mierzono bundla bazowego).
- Testow bitwy (battleScene M3) nie uruchomiono w przegladarce.

## Plan Gitflow / publish (wykonuje orkiestrator po Final Control PASS)
1. Gałąź integracyjna `integration/robocza-memleaks-20261022` od `origin/main` cfc26c17; commity: (a) produktowy (4 pliki), (b) bundle+manifest+START+run docs (ten kandydat).
2. Fast-forward/merge do `origin/main`, push main + branch integracyjnej (wzorzec: 47981902 / b4d37d9f).
3. Po publishu: readback raw GitHub (md5/sha256/bajty = powyzsze), wpis `dyspozycje/WERSJE.md` z md5 przeliczonym z opublikowanego bundla, smoke na pobranym bundlu.
4. Rollback: `git revert` commitu bundla (przywraca bundle `3b6610b7…`, 69943587 B) + revert commitu produktowego; weryfikacja md5 wg WERSJE.md.

NASTĘPNY KROK: Evaluator (niezalezne powtorzenie verify + smoke, sprawdzenie diffu do origin/main vs allowlista).
DEPLOY/PUSH: NIE WYKONANO
