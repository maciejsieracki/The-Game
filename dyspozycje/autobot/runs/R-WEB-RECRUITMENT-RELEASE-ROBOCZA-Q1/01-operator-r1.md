STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-RECRUITMENT-RELEASE-ROBOCZA-Q1
GOAL: Kandydat wydania ROBOCZEJ = origin/main (caa05fca) + produkt R-WEB-REKRUTACJA-PANEL-UX-IMPL-Q1 (72e876d6 + 54b47e3e), bundle gra-robocza/Gra-ROBOCZA.html, manifest, START.html.
RUNDY: 1/5

## Baza i commity (lokalne, bez push)
- Worktree detached na `origin/main` = `caa05fca`. `git cherry-pick -n 72e876d6 54b47e3e`; z indeksu i dysku usunieto docs `dyspozycje/autobot/runs/R-WEB-REKRUTACJA-PANEL-UX-IMPL-Q1/*` (poza allowlista).
- Commit 1 (produkt, 5 plikow: cityPanel.ts, unitRecruitCard.ts, recruit-card-manpower-real-render-test.cjs, recruitment-panel-compact-row-test.cjs, recruitment-panel-height-real-render-test.cjs): `1be48b7d`.
- Commit 2 (bundle + manifest + START + run docs): hash w raporcie orkiestratora (`git log`).
- Dodatkowo w run docs: `evidence/stamp-bundle.cjs` i `evidence/smoke-chromium-r2.cjs` skopiowane z poprzedniego wydania (ta sama sciezka), `00-dispatch.md` z galezi claude/sprawdzenie-funkcjonalnosci-ek4ra0.

## Bundle (z faktycznego pliku)
- md5 `99c6b33b2587673b3c377d40d22f6396`
- sha256 `6f969412d7e9b8a651b92259b135e299ca04d9b238d6722714522d75c4a51b07`
- bajty 69956805
- Sciezka: `gra/` `npm ci --ignore-scripts` -> `node node_modules/vite/bin/vite.js build --outDir <scratchpad>/dist-recruit` (bezposredni Vite) -> `evidence/stamp-bundle.cjs` -> `gra-robocza/Gra-ROBOCZA.html`; `gra-robocza/tools/generate-start-hub.cjs` odswiezyl START.html i md5 w manifescie. Manifest: nowe pola gorne, caly poprzedni manifest (517406ca, z wlasnym `previousReleaseManifest`) pod `previousReleaseManifest`. WERSJE.md, rust-port/**, src-tauri/** NIE ruszone.
- Pliki bundla/startu zmienione tak jak w poprzednim wydaniu (0e6aa590): Gra-ROBOCZA.html, ROBOCZA-MANIFEST.json, START.html.

## Bramki (surowe logi w evidence/, kazdy z `EXIT=`)
- npm ci EXIT=0; tsc --noEmit EXIT=0; Vite build EXIT=0 (69,862.02 kB przed stemplem).
- verify-robocza-bundle.cjs (bez argumentu): manifest match OK, stamp match WARN (znana self-referencja stempla), `VERIFY OK`, EXIT=0 (`r1-verify.log.txt`). Pierwsze wywolanie z bledna sciezka jako argumentem (argument to marker) dalo EXIT=1 - nadpisane poprawnym.
- Testy (EXIT=0): logic-test 213/213; territory-border 9/0; recruitment-panel-compact-row 39/0; recruit-card-manpower-real-render 20/0; recruitment-panel-height-real-render 13/0; web-memory-leaks 30/0; ai-prod-fallback 17/0; ai-city-recovery 7/0; autosave-quota-fail 20/0; city-badge-growth-percent 38/0; city-badge-zoom-lod 67/0; city-map-badge 62/0.
- Rust fmt/clippy/cargo: N/A (zero zmian w rust-port/**, src-tauri/**).

## Smoke Chromium (`?memdebug=1`, bundle z gra-robocza/, `r1-smoke-chromium.log.txt`, EXIT=0)
Swiat wygenerowany (272.8 s), miasto zalozone, 8 zakonczen tury, TURA 1 -> 9, zero stall. Trend (tura: geometries/textures/programs/cityModels/cityBadgeTextures/jsHeapMB): 2: 297/18/18/49/5/293.6; 5: 297/18/18/49/5/290.0; 6: 297/18/18/49/5/293.3; 7: 297/21/18/49/5/304.9; 8: 297/22/18/49/5/317.4; 9: 297/22/18/49/5/306.7. Heap bez monotonicznego wzrostu (290-317 MB); textures 18->22 od tury 7 jak w poprzednim wydaniu (zrodlo NIE_ZMIERZONO). `BAD_RESPONSES []`, jedyny blad = 404 `/favicon.ico` lokalnego serwera. Zrzuty: `evidence/smoke-shots/`. Smoke nie klika panelu rekrutacji (to pokrywaja testy real-render). Nie jest to pelna akceptacja rozgrywki.

## Plan Gitflow / publish (wykonuje orkiestrator po Final Control PASS)
1. Galaz `integration/robocza-turnslow-20261023` (nazwa wg dispatchu) od `origin/main` caa05fca; commity: (a) produktowy `1be48b7d`, (b) bundle+manifest+START+run docs.
2. Fast-forward/merge do `origin/main`, push main + galezi integracyjnej (wzorzec poprzednich wydan).
3. Po publishu: readback raw GitHub (md5/sha256/bajty jak wyzej), wpis `dyspozycje/WERSJE.md` z md5 z opublikowanego bundla (w kandydacie NIE aktualizowano), smoke na pobranym bundlu.
4. Rollback: `git revert` commitu bundla + commitu produktowego => bundle `517406ca871523b7c72ea8e3cd61d9b1`, sha256 `a059d4f4cbfb161902dea9e76d81e6a1585d7e81c6585b4be896cf688418100a`, 69953071 B (wydanie spowolnienia, caa05fca wg WERSJE.md); weryfikacja md5. Starszy punkt: `0c7f13d9dbb869ea648bd65dfd3bea1c` (c11f5087).

NOTY: dispatch mowil o 4 plikach produktowych; faktycznie 5 (cityPanel.ts, unitRecruitCard.ts + 3 testy .cjs). Wszystkie w allowliscie.
NASTEPNY KROK: Evaluator (niezalezne verify + diff do origin/main vs allowlista).
DEPLOY/PUSH: NIE WYKONANO
