STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WAR-ALLIN-RELEASE-ROBOCZA-Q1
GOAL: Kandydat wydania ROBOCZEJ = origin/main (75f53d58) + produkt R-WEB-WAR-ALLIN-CAPITAL-Q1 (cfa95f8f + 41e66aff), bundle gra-robocza/Gra-ROBOCZA.html, manifest, START.html.
RUNDY: 1/5

## Baza i commity (lokalne, bez push)
- Worktree detached na `origin/main` = `75f53d58`. `git cherry-pick cfa95f8f 41e66aff` przeszedl bez konfliktu; potem `git reset --soft origin/main` + `git reset` i jawny `git add` TYLKO 11 plikow produktowych (ai.ts, barbarians.ts, warAllInCapital.ts, main.ts, 7x gra/tools/war-allin-capital-*.cjs: evidence, harness, perf, quick, regress, scenarios, test). Docs `dyspozycje/autobot/runs/R-WEB-WAR-ALLIN-CAPITAL-Q1/**` (poza allowlista) NIE sa w commitach; pozostaly jako untracked w worktree (usuniecie rm -rf odrzucone przez klasyfikator) - NIE dodane do indeksu, do pominiecia/usuniecia przez orkiestratora.
- Commit 1 (produkt): `230fd53b`. Commit 2 (bundle+manifest+START+run docs): patrz `git log` (hash po commicie).
- Uwaga: dispatch mowil "4 pliki"; faktycznie 4 pliki src + 7 narzedzi `war-allin-capital-*.cjs` (allowlista `war-allin-capital-*.cjs`).

## Bundle (z faktycznego pliku: md5sum/sha256sum/stat)
- md5 `4340812b7fc22163e5ca690c93527265`
- sha256 `f60333f276bf5927e7fc1702e9956eb9937a1ec882d4c1402fe81fb0f177ec6d`
- bajty 69964169
- Sciezka: `gra/` `npm ci --ignore-scripts` -> `node node_modules/vite/bin/vite.js build --outDir <scratchpad>/dist-war` (bezposredni Vite, bez prebuild) -> `evidence/stamp-bundle.cjs` -> `gra-robocza/Gra-ROBOCZA.html`; manifest zbudowany skryptem (nowe pola gorne, caly poprzedni manifest 99c6b33b pod `previousReleaseManifest`), `gra-robocza/tools/generate-start-hub.cjs` odswiezyl START.html. WERSJE.md, rust-port/**, src-tauri/** NIE ruszone.

## Bramki (surowe, PELNE logi w evidence/, kazdy z `EXIT=`; Rust fmt/clippy/cargo N/A - zero zmian w rust-port/**)
- npm ci EXIT=0; tsc --noEmit EXIT=0; Vite build EXIT=0 (69,869.38 kB przed stemplem); verify-robocza-bundle.cjs: manifest match OK, stamp match WARN (znana self-referencja), VERIFY OK, EXIT=0.
- Testy EXIT=0: logic-test 213/213; war-allin-capital-test 79/0; barbarzyncy-krazenie 249/0; barb-city-behavior 177/0; territory-border 9/0; recruitment-panel-compact-row 39/0; recruitment-panel-height-real-render 13/0; recruit-card-manpower-real-render 20/0; web-memory-leaks 30/0; ai-prod-fallback 17/0; ai-city-recovery 7/0; autosave-quota-fail 20/0; city-badge-growth-percent 38/0; city-badge-zoom-lod 67/0; city-map-badge 62/0.
- ai-test: 276 passed, 18 failed, EXIT=1 - tyle samo jak deklarowana baza (dispatch); NIE uruchamiano ai-test na bazie osobno (NIE_ZMIERZONO na bazie, zgodnosc wg dispatchu).
- OBOWIAZKOWO baza vs kandydat (baza = `git archive origin/main gra` w scratchpad + symlink node_modules; kandydat = worktree):
  - `ai-buduje-budynki-test`: kandydat PASS=40 FAIL=2 EXIT=1; baza PASS=40 FAIL=2 EXIT=1; te same 2 faile (H1 komunikaty "[Wojna wymuszona] DECISION_REQUIRED", M6 MUT-A pokrycie 4/4 vs 4/4). Wynik IDENTYCZNY (faile istnieja na bazie). Licznik "duzeAI na koncu" w linii wczytania zapisu rozni sie (kandydat 35, baza 40) - to wynik rozgrywki headless, nie asercja; NIE_ZMIERZONO czy to efekt reguly wojny.
  - `mgla-sciezka-inwariant-test`: kandydat 41 pass / 1 fail EXIT=1; baza 41 pass / 1 fail EXIT=1; ten sam fail ([1] `src/battle/battleScene.ts:8009-8010 ru.q/ru.r`, plik poza zmianami). IDENTYCZNE.
  - Logi: `r1-cand-*.log.txt`, `r1-base-*.log.txt`. Pierwsza proba bazy ai-buduje miala brak symlinku node_modules (ENOENT) - nadpisana poprawnym uruchomieniem.

## Smoke Chromium (`/opt/pw-browsers/chromium-1194`, `?memdebug=1`, bundle `gra-robocza/Gra-ROBOCZA.html`, seed 778899, `evidence/smoke-war-endturn.cjs`, realne `endTurn()`)
- Pokoj (`r1-smoke-peace.log.txt`, EXIT=0): TURA 1 -> 13 (12 tur), 0 stall, endTurn mediana 6066 ms / srednia 6113 / max 6703; memdebug tura 2: geometries=305 textures=14 programs=23 cityModels=10; tura 13: 323/15/23/10; BAD_RESPONSES [], ERRORS [].
- Wojna wymuszona AI<->AI (hak `__aiWojnyZwykleCapTestDebug.declareRegularWarBetween` dla kazdej pary ownerow [1,2,3,4,5,6,8,10,11]; `r1-smoke-war.log.txt`, EXIT=0): TURA 1 -> 13, 0 stall, endTurn mediana 5759 ms / srednia 5819 / max 6683; memdebug tura 13: 315/15/23/10; ERRORS [], BAD_RESPONSES []. Czas tury wojny NIE jest dluzszy niz pokoju (rozrzut run-do-runu ok. 10%, jedna probka na tryb).
- Ograniczenia: liczba miast stala (10) przez 12 tur - NIE_ZMIERZONO czy armie faktycznie dotarly do stolic i czy zachodzily bitwy (brak instrumentacji ruchu jednostek w smoke); 12 tur to nie pelna rozgrywka; jsHeapMB w memdebug niezmienne w trybie (zgrubne), trendu wycieku nie da sie z tego wyciagnac poza geometries/textures. Zrzuty: `evidence/smoke-shots/{peace,war}-final.png`.

## Diff do origin/main
Zob. `git diff --name-only origin/main HEAD` w raporcie orkiestratora; tylko pliki z allowlisty (patrz commit 1 + commit 2).

## Plan Gitflow / publish (wykonuje orkiestrator po Final Control PASS)
1. Galaz `integration/robocza-turnslow-20261023` od `origin/main` 75f53d58; commity: (a) produktowy `230fd53b`, (b) bundle+manifest+START+run docs.
2. Merge/fast-forward do `origin/main`, push main + galezi integracyjnej (wzorzec poprzednich wydan).
3. Po publishu: readback raw GitHub (md5 `4340812b...`, sha256, 69964169 B), wpis `dyspozycje/WERSJE.md` z md5 opublikowanego bundla (w kandydacie NIE aktualizowano), smoke na pobranym bundlu.
4. Rollback: `git revert` commitu bundla + produktowego => bundle `99c6b33b2587673b3c377d40d22f6396`, sha256 `6f969412d7e9b8a651b92259b135e299ca04d9b238d6722714522d75c4a51b07`, 69956805 B (wydanie panelu rekrutacji, 75f53d58); weryfikacja md5. Dalsze punkty: `517406ca871523b7c72ea8e3cd61d9b1` (caa05fca), `0c7f13d9dbb869ea648bd65dfd3bea1c` (c11f5087).

NOTY: regula jest TYMCZASOWA; brak pelnej akceptacji rozgrywki; 2 bramki przegladarkowe czerwone identycznie jak na bazie (nie regresja); ai-test 276/18 jak na bazie wg dispatchu.
NASTEPNY KROK: Evaluator (niezalezne verify md5/diff vs allowlista).
DEPLOY/PUSH: NIE WYKONANO
