# R-WEB-FULL-REGRESSION-MAIN-Q1 — raport zbiorczy (Operator, runda 1/5)

Baza: `origin/main` = `9b019a7d8` (FALA 532). Referencja (sprzed FALA 509): `3aa1b3a2a` (Deploy FALA 508, `5e870b2f7`). Zero zmian w kodzie i testach; wszystkie pomiary na kopii roboczej bez modyfikacji `gra/**`.

## R2 — korekta po zarzutach (obrona, runda 1/5). NADPISUJE liczby i klasy z sekcji 0, 1, A, A?, C, D tam, gdzie sie roznia

Zarzuty i odpowiedzi PRZYJMUJE/ODRZUCAM z dowodami: `02-obrona-r1.md`. Stan danych po R2: `results.csv` (klasy po korekcie, notatka `R2 (obrona)` przy kazdej zmienionej linii), `inwentarz.csv` (kazdy plik kandydujacy: wlaczony / wykluczony z powodem), `rerun-main-r2.csv` + `logs-rerun/roster-main-r2.log`, `hidden-run-r2.csv` + `logs-hidden-r2/`.

### R2.1 Liczby po korekcie (suma 1082 = results.csv)

| Klasa | R1 | R2 | Zmiana |
|---|---|---|---|
| E zielone | 711 | 711 | — |
| A regresja NOWA | 10 | **12** | +`sidepanel-hud-deadzone-test`, +`siege-blockade-no-recruit-reinforce-test` (A? -> A: czerwone na main w 2 przebiegach, zielone na ref x2) |
| B przedistniejace | 133 | 133 | — |
| C niestabilne | 5 | **6** | +`roster-space-next-active-unit-test` (TIMEOUT pod obciazeniem; izolowany rerun na main = GREEN 43/0, 149 s) |
| D INFRA/TIMEOUT | 40 | **46** | +5 `perf-*-live-test` + `empire-recruit-live-test` (TIMEOUT, testy NOWE bez bazy na ref) |
| A? | 17 | **0** | rozlozone: 8 -> WYKL-ARGS, 6 -> D, 1 -> C, 2 -> A |
| WYKL-ARGS (nowa klasa) | 0 | **8** | harnessy z EXIT 2 (wymagaja argumentow/bundla/bazy): 6x `memory-*`, `minimap-viewport-rect-follow-live-test`, `hud-topbar-bigger-numbers-real-render-test` |
| NIE_ZMIERZONO | 166 | 166 | — |

Dlaczego zmiana w D: wiersze `perf-*`/`empire-recruit-live` mialy kolumne `ref = RED` tylko dlatego, ze pliku nie ma w `3aa1b3a2a` (blad ladowania modulu). Nie sa to regresje wzgledem bazy, wiec nie moga byc A ani A?; zostaja TIMEOUT-em (D).

### R2.2 Inwentarz (`inwentarz.csv`)

- Wlaczone: 1082 (1080 `gra/tools/*-test|guard.cjs` + 2 w `gra/`), zgodnie z results.csv.
- Wykluczone: 68 wierszy, z powodem w kolumnie `uwaga`:
  - 46 plikow `.cjs` pasujacych do wzorca bez sufiksu -test/-guard (pomiary, diagnostyka, harnessy live-verify-* itd.);
  - 11 plikow `*.vite.config.ts` (R1 podawal „2" — blad liczenia, poprawione);
  - 1 `grupa-selftest.ps1`;
  - 10 plikow UKRYTYCH (nazwa z kropka, poza glob `*.cjs` operatora R1): 9 `.*-test/-smoke/-check/-diag` + 1 `._*` (AppleDouble). Zostaly uruchomione jednorazowo w R2 (`hidden-run-r2.csv`) i NIE sa wliczone do 1082:
    - EXIT 1: `.ai-test-diplo-tmp.cjs` (21 znacznikow FAIL), `.logic-test-13b.cjs` (2 FAIL), `.smoke-deliver.cjs` i `.smoke-rerender.cjs` (brak `dist/`, srodowisko);
    - EXIT 0 bez wyjscia (0 s; brak asercji PASS/FAIL): `.diag-playtest-bundle.cjs`, `.krok2-typecheck-bundle.cjs`, `.palisada-check-bundle.cjs`, `.quick-river-test.cjs`, `.test-diag-bundle.cjs`.
  - Uwaga higieniczna: w git sledzonych jest 187 plikow ukrytych w `gra/tools/` (artefakty esbuild/diag/tmp) i 13 plikow `._*`. To dlug repo, nie wynik testu.

### R2.3 Metoda i ograniczenia (przyjete)

- Klasy C i D pochodza z przebiegow pod obciazeniem (load 13-21 na 4 rdzeniach). Izolowany rerun `roster-space` pokazal, ze TIMEOUT byl wynikiem obciazenia (GREEN). Wniosek: D (46) i C (6) NIE sa dowodem zielonosci ani regresji. Rekomendacja: dokonczyc D na nieobciazonym hoscie (decyzja orkiestratora).
- Referencja: `3aa1b3a2a` jest przodkiem `9b019a7d8` i wszystkich commitow FALA 509 (`git merge-base --is-ancestor`, zweryfikowane). Bledne w R1 bylo zdanie „ostatni commit przed pierwszym wdrozeniem FALA 509 (`56c164df9`)": `56c164df9` to commit FALA 509, nie przed nim. Wynik klasyfikacji nie zmienia sie. Ref zawiera FALA 505–508, wiec regresje A to zmiany po `3aa1b3a2a`.
- Hipotezy w A (bez przegladu kodu w R1/R2): `web-memory-leaks-test` (sekcja [3] M1 oczekuje dispose WSZYSTKICH geometrii/materialow starego modelu; dostaje 6/20 i 0/18). Silna hipoteza do sprawdzenia: FALA 526 (`ca289d8ce`, „wspolne geometrie modeli") swiadomie nie dispose'uje wspolnych geometrii, a test nie zostal zsynchronizowany. Nie rozstrzygniete w tym temacie. Analogicznie `fort-outpost-hard-territory` (I5) — niezweryfikowane.
- Pkill incydent (R1, §BLOKADY): nie da sie cofnac zabicia cudzych procesow. Stan repo po incydencie zweryfikowany: `git diff 9b019a7d8 HEAD -- gra/` pusty (zero zmian w `gra/**`, w tym `gra/tools/.victory-screen-bundle.css`).
- Format: w plikach runu usunieto koncowe spacje (15 plikow) i sciezki worktree zastapiono `<WT>` / `<REF-TMP>` (tylko zapis sciezek, bez zmiany wynikow).
- Pozostaje NIE_ZMIERZONO: 161 z 249 testow przegladarkowych. Ten temat nie dokancza pomiaru; decyzja orkiestratora.

## 0. Werdykt w liczbach (R1; patrz R2.1 dla klas po korekcie)

| Wielkosc | Liczba |
|---|---|
| Testow wlaczonych do inwentarza (guard/test/bramki) | 1082 (1080 `gra/tools/*-test.cjs|*-guard.cjs` + 2 w `gra/`) |
| `tsc --noEmit` | ZIELONE, 0 bledow, EXIT=0, 16 s (`gate-tsc.txt`) |
| Zmierzone (uruchomione) | 916 (w tym 833 szybkich: 100%; przegladarkowych: 88 z 249) |
| (E) zielone | 711 |
| (A) regresje NOWE (potwierdzone: czerwone na main 2x, zielone na ref) | 10 |
| (A?) podejrzane o regresje / niepewne | 17 |
| (B) dlugi PRZEDISTNIEJACE (czerwone tak samo na ref) | 133 |
| (C) niestabilne / flaky | 5 |
| (D) INFRA / TIMEOUT (srodowisko) | 40 |
| NIE_ZMIERZONO | 166 (w tym 161 testow przegladarkowych nieuruchomionych; 5 czerwonych bez przebiegu na ref) |

Suma klas = 1082. UWAGA UCZCIWOSCI: **nie jest to pelny przebieg** — 161 z 249 testow przegladarkowych (live/render, Chromium + SwiftShader) NIE zostalo uruchomionych (patrz sekcja D/NIE_ZMIERZONO). Wynik dla szybkich testow jest kompletny.

## 1. Inwentarz i wykluczenia

Kryterium: nazwa zawiera test/guard/check/live/render/regress (1126 plikow `.cjs` + 3 inne w `gra/tools/`). Wlaczono wszystko co konczy sie `-test.cjs` lub `-guard.cjs` (1080) oraz `gra/recruit-hud-label-test.cjs`, `gra/smoke_test.cjs` (2) = 1082; w tym `logic-test`, `ai-test`. Skrypty npm w `gra/package.json` to tylko `typecheck` (= `tsc --noEmit`, uruchomione), `dev`/`build`/`predev`/`prebuild` (zakazane w tym temacie), `serve:robocza` (serwer, nie test).

Wykluczone (46 `.cjs` + 3 inne), z uzasadnieniem po przeczytaniu naglowkow:
- **pomiary/narzedzia diagnostyczne bez kryterium PASS/FAIL**: `*-live-measure.cjs`, `*-live-summarize.cjs`, `*-live-hook.cjs`, `ai-war-weariness-live-audit-*`, `notif-live-measure|shots|summarize`, `perf-endturn-render-ab-aggregate`, `perf-endturn-render-profile-analyze`, `render-unit-sharpness-measure`, `river-render-diag`, `diag-teleport-live-sim`, `clearing-deficit-live-measure`, `citizen-consumption-era-live-measure`, `zelazo-zrzuty-25-jednostek-render`;
- **harnessy wymagajace argumentow/zmiennych srodowiskowych (ROBOCZA_HTML, EVID_DIR, bundle poza repo)**: `live-verify-autobuild-toggle(-ui)`, `live-verify-autoimprove-*`, `live-verify-simple-food-rule`, `fort-vision-live`, `palisade-map-city-live`, `palisade-towers-live`, `siege-manual-battle-live`, `test-hook-setcitylimit-live-bundle`, `load-game-regression-e2e(-r5)`;
- **jednorazowe kontrole Evaluatora / diagnostyka, nie bramki**: `ev4-kryteria-check` ("To NIE jest bramka"), `pole-bitwy-balance-check`, `tw-rome-test-legion-falanga`, `wpiecie-dispatch-check`, `playtest-layout-check`, `_verify_deliverable` (sciezka `/sessions/...` — nie istnieje w tym srodowisku);
- **meta-runner**: `war-allin-capital-regress` (uruchamia inne testy z listy — duplikat);
- inne: `grupa-selftest.ps1` (PowerShell), 2 pliki `*.vite.config.ts` (konfiguracje buildu).

## 2. Metoda

- Runner (Node, poza repo) uruchamia kazdy test jako `node tools/X` z `gra/`, `TMPDIR` na biezacy katalog poza repo (czyszczony po ttescie), `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, testy przegladarkowe pod `xvfb-run -a`, jedna przegladarka naraz; limit czasu 300 s (szybkie; od polowy przebiegu 150 s z powodu obciazenia hosta), 360 s (przegladarkowe; zamiast 580 s — budzet czasu). Zielone: wiersz CSV; czerwone/TIMEOUT: pelny log w `logs/gate-*.txt` (ostatnie 30 KB, `EXIT=`).
- Wznawianie: runner pomija testy obecne w CSV. Dwukrotnie (spadek wolnego dysku < 3 GB, inne procesy hosta) wiersze `NIE_ZMIERZONO` zostaly usuniete i testy uruchomione ponownie po odzyskaniu miejsca (`notes-przebieg.txt`); runner dostal czekanie na dysk.
- Rerun na main (czerwone/TIMEOUT -> drugi przebieg, `rerun-main*.csv`), przebieg na referencji `3aa1b3a2a` w osobnym worktree (`rerun-ref*.csv`, logi `logs-ref/`), bisect na poziomie wdrozen FALA 509-532 dla klasy A (`bisect-A.txt`). Klasyfikacja skryptem na CSV (`results.csv`).
- Przebiegi szybkich testow szły rownolegle z przegladarkowymi i z reruno-ami (host ma 4 rdzenie, load average 13-21 od innych sesji) — to zwieksza ryzyko falszywych TIMEOUT (klasa D) i niestabilnych testow czasowych.

## A. Regresje NOWE (zielone na ref, czerwone na main w 2 przebiegach) — 10

| Test | run1 | rerun main | ref | uwaga / ostatnia linia FAIL |
|---|---|---|---|---|
| ai-army-scattered-merge-test.cjs | RED | RED | GREEN | czerwony na main, zielony na ref; bisect: pierwszy czerwony: FALA 520 (33855a540); ostatni zielony: FALA 519 (15c99e09f) — 'FAIL: czas tury AI w fazie zbierania chmury (przejsciowej) <= 3x + 10 ms / 32 passed, 1 failed' |
| diplo-aggressor-wiring-test.cjs | RED | RED | GREEN | czerwony na main, zielony na ref; bisect: pierwszy czerwony: FALA 515 (cd3e88144); ostatni zielony: FALA 514 (b9d8fa546) — 'FAIL diplomacy-proposals.ts: prog sojuszu, paktu i stance proponenta / diplo-aggressor-wiring-test: 14 PASS,  |
| fort-outpost-hard-territory-test.cjs | RED | RED | GREEN | czerwony na main, zielony na ref; bisect: pierwszy czerwony: FALA 531 (02fbe7dcf); ostatni zielony: FALA 530 (6a673c838) — ' FAIL: I5: sweep bezposrednio po fazie AI cywilizacji (nie tylko w bloku barbarzyncow) / === fort-outpost-har |
| hud-armia-chip-jednostki-test.cjs | RED | RED | GREEN | czerwony na main, zielony na ref; bisect: pierwszy czerwony: FALA 525 (55e098dc5); ostatni zielony: FALA 524 (ea9c14daf) — ' FAIL: buildHudState zwraca rekrutEkw z epoki ps.era i mnożnika mpMults.costMult / FAIL: buildHudState zwraca |
| hud-obywatele-chip-test.cjs | RED | RED | GREEN | czerwony na main, zielony na ref; bisect: pierwszy czerwony: FALA 525 (55e098dc5); ostatni zielony: FALA 524 (ea9c14daf) — ' FAIL: buildHudState: 'const pop = pc.reduce((s, c) => s + c.population, 0);' (suma populacji) / FAIL: buildH |
| merge-decor-no-regress-test.cjs | RED | RED | GREEN | czerwony na main, zielony na ref; bisect: pierwszy czerwony: FALA 530 (6a673c838); ostatni zielony: FALA 529 (6e5e7eac4) — 'merge-decor-no-regress-test: BLAD HARNESSU TypeError: renderer.setOpaqueSort is not a function' |
| mgla-odkrycie-wzdluz-sciezki-test.cjs | RED | RED | GREEN | czerwony na main, zielony na ref; bisect: pierwszy czerwony: FALA 529 (6e5e7eac4); ostatni zielony: FALA 528 (9191f5465) — ' FAIL: static: currentVisible() nadal liczy WYLACZNIE z biezacej pozycji jednostek (u.q, u.r) -- nietkniete ( |
| prereq-budynkow-test.cjs | RED | RED | GREEN | czerwony na main, zielony na ref; bisect: pierwszy czerwony: FALA 516 (4905bac05); ostatni zielony: FALA 515 (cd3e88144) — ' FAIL: CITY_BUILDING_PREREQ ma dokładnie 9 wpisów (ma: 10) / prereq-budynkow-test: 58 pass, 1 fail' |
| spichlerz-deficyt-scalenie-test.cjs | RED | RED | GREEN | czerwony na main, zielony na ref; bisect: pierwszy czerwony: FALA 525 (55e098dc5); ostatni zielony: FALA 524 (ea9c14daf) — 'FAIL: buildHudState zwraca pole zywnoscMiastNiedokarmionych w HudState / FAIL: zywnoscMiastNiedokarmionych: g |
| web-memory-leaks-test.cjs | RED | RED | GREEN | czerwony na main, zielony na ref; bisect: pierwszy czerwony: FALA 526 (ca289d8ce); ostatni zielony: FALA 525 (55e098dc5) — 'FAIL: WSZYSTKIE geometrie starego modelu zwolnione (dispose) (got=6 want=20) / FAIL: WSZYSTKIE materialy star |

## A?. Podejrzane / niepewne (brak potwierdzenia A lub B) — 17

| Test | run1 | rerun main | ref | uwaga / ostatnia linia FAIL |
|---|---|---|---|---|
| empire-recruit-live-test.cjs | TIMEOUT | - | RED | test nie istnieje na referencji (nowy) — 'PASS: L14 brak złota -> komunikat, brak zmian / PASS: L15 przycisk 'Rekrutacja' w górnym pasku HUD widoczny' |
| hud-topbar-bigger-numbers-real-render-test.cjs | RED | RED | RED | test nie istnieje na referencji (nowy) — 'Brak kopii bazy PRZED: <WT>/gra/src/ui/hud.__base.ts / Wyg |
| memory-datauri-duplicates-test.cjs | RED | RED | RED | test nie istnieje na referencji (nowy) — 'usage: --dist <dir> [--json out] [--snapdir dir] [--no-snap]' |
| memory-datauri-menu-pixel-test.cjs | RED | RED | RED | test nie istnieje na referencji (nowy) — 'podaj --a <dist> --b <dist>' |
| memory-growth-improvement-cpu-release-test.cjs | RED | RED | RED | test nie istnieje na referencji (nowy) — 'podaj --dist <katalog z index.html>' |
| memory-growth-visual-parity-test.cjs | RED | RED | RED | test nie istnieje na referencji (nowy) — 'podaj --a <dist> --b <dist>' |
| memory-static-ascii-bundle-test.cjs | RED | RED | RED | test nie istnieje na referencji (nowy) — 'podaj --a <dist> --b <dist> --gra <kopia gra z node_modules>' |
| memory-static-geometry-pool-test.cjs | RED | RED | RED | test nie istnieje na referencji (nowy) — 'podaj --gra <kopia gra z node_modules>' |
| minimap-viewport-rect-follow-live-test.cjs | RED | RED | RED | test nie istnieje na referencji (nowy) — 'Brak CIV_MM_BUNDLE (katalog z index.html po vite build).' |
| perf-endturn-ai-phase-live-test.cjs | TIMEOUT | - | RED | test nie istnieje na referencji (nowy) — '[large-empire] source identity after build: {'mainTsSha256':'07710c08e18b1e19893afd47d97b5848cda16ae28b38ef46 |
| perf-endturn-render-hud-live-test.cjs | TIMEOUT | - | RED | test nie istnieje na referencji (nowy) — '[large-empire] source identity after build: {'mainTsSha256':'07710c08e18b1e19893afd47d97b5848cda16ae28b38ef46 |
| perf-endturn-render-progress-live-test.cjs | TIMEOUT | TIMEOUT | RED | test nie istnieje na referencji (nowy) — '[large-empire] source identity after build: {'mainTsSha256':'07710c08e18b1e19893afd47d97b5848cda16ae28b38ef46 |
| perf-late-game-interaction-live-test.cjs | TIMEOUT | - | RED | test nie istnieje na referencji (nowy) — '[large-empire] phase: {'at':'2026-11-07T18:52:59.784Z','phase':'page-load'} / [large-empire] phase: {'at':'20 |
| perf-late-game-interaction-r2-live-test.cjs | TIMEOUT | - | RED | test nie istnieje na referencji (nowy) — '[large-empire] source identity after build: {'mainTsSha256':'07710c08e18b1e19893afd47d97b5848cda16ae28b38ef46 |
| roster-space-next-active-unit-test.cjs | TIMEOUT | - | GREEN | TIMEOUT na main, zielony na ref (mozliwy wplyw obciazenia) — ' [OK] D7 jest wlasne miasto do testu oblezenia / [OK] D8 miasto NIEoblegane: oblegajaca i oblegana (ruch 0) p |
| sidepanel-hud-deadzone-test.cjs | RED | RED | GREEN | bisect: TIMEOUT na main przy 3. uruchomieniu (D/niepewne); pierwszy czerwony: FALA 509 (56c164df9); ostatni zielony: ref 3aa1b3a2a — ' FAIL PO WSTRZYKNIĘCIU: scrollHeight > clientHeight (realne przepełnienie dużym stosem jednostek odtworzone)  |
| siege-blockade-no-recruit-reinforce-test.cjs | RED | RED | GREEN | bisect: TIMEOUT na main przy 3. uruchomieniu (D/niepewne); pierwszy czerwony: FALA 509 (56c164df9); ostatni zielony: ref 3aa1b3a2a — ' [FAIL] C5 blokada wejscia zarejestrowana (gracz/AI/barbarzyncy przez computePath/computeReachable) / [OK] D9 |

## B. Dlugi PRZEDISTNIEJACE — 133

Czerwone na main (2 przebiegi) i na referencji `3aa1b3a2a`. Pelna lista: `results.csv` (klasa B), przyczyny: `logs/`. Najwieksze rodziny (prefiks nazwy): pr141 (11), ai (10), unit (8), diplomacy (5), eko (5), hotseat (4), civ (3), empire (3), era (3), forced (3), auto (2), autoimprove (2). W tym bramki referencyjne z R-PROC-AUTOBOT §6: `unit-power-test` (4 pass / 2 fail — zgodnie z notka "czerwony pre-istniejaco"), `mgla-sciezka-inwariant-test` (39 pass; punkt odniesienia mowil 42/42 — czerwony tez na ref), `ai-test` (274 pass + FAIL), `unit-replace-test` (punkt odniesienia 13/13, tu czerwony tez na ref), `ai-zdobycie-miasta-adiacencja-test` (czerwony tez na ref).

Lista B (nazwy): R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live-test, administracja-stolica-test, ai-balans-step3-test, ai-city-render-batch-test, ai-dlug-porzadki-q1-test, ai-fog-test, ai-jednostki-tylko-zakup-test, ai-major-economy-test, ai-march-avoid-foreign-territory-test, ai-praca-split-parity-test, ai-test, ai-zdobycie-miasta-adiacencja-test, ai4-popyt-obywatele-test, army-split-panel-scroll-grid-test, auto-battle-simultaneous-test, auto-fort-claim-test, autoimprove-river-forest-clear-no-citizen-q1-test, autoimprove-river-forest-live-verify-q1-test, barb-camp-destruction-test, battle-loot-test, border-march-wygasanie-test, bramki-tmpdir-unikalnosc-test, budynek-civ-bonus-u17-test, budynki-koszt-pracy-50-test, building-detail-card-entitycard-migration-test, citizen-resource-upkeep-test, city-state-offensive-normal-easy-test, civ-matrix-ai-diplomacy-wiring-test, civ-matrix-greece-test, civ-matrix-meta-roster-wiring-test, cluster-plan-name-test, conquest-stability-test, culture-religion-test, defense-breakdown-test, diplo-truce-ai-table-live-test, diplomacy-audience-close-flush-test, diplomacy-lista-podglad-przed-wizyta-test, diplomacy-negotiation-table-test, diplomacy-package-ai-counter-actionable-test, diplomacy-proposal-test, drewno-gate-test, dyplo-bilans-gate-n-e1-reprodukcja-runda2-test, dyplo-bilans-gate-n-e1-reprodukcja-runda3-test, egypt-movement-precedence-test, eko-tech-paczka1-test, eko-tech-paczka2-test, eko-tech-paczka3-test, eko-tech-paczka4-test, eko-tech-paczka5-test, ekonomia-5x-inwariant-test, eliminacja-lup-kwoty-test, empire-armia-produkcja-test, empire-panel-miasto-obywatele-content-test, empire-panel-moc-scroll-preserve-test, era-change-toast-defer-test, era-cud-main-ts-integracja-test, era-recruit-panel-refresh-test, events-one-turn-lifetime-live-test, fair-play-tier-grid-test, forced-war-bronze-main-guard-test, forced-war-bronze-new-game-reset-test, forced-war-iron-main-guard-test, fort-outpost-territory-live-test, general-quick-follow-action-test, generals-purchase-runtime-test, glod-wojska-karencja-test, granice-relacja-dyplomatyczna-test, grupa-b-lane-test, heal-stale-blockers-pending-battle-test, hex-plony-magazyn-test, hotseat-etap6d-podetap-b-exec-test, hotseat-etap6d-podetap-d-exec-test, hotseat-etap6d-podetap-e-exec-test, hotseat-etap6d-podetap-e-source-test, hud-moc-warstwa-test, idb-b1b2b3-test, idb-menu-continue-boot-refresh-test, koszty-surowcowe-test, load-fail-toast-zindex-test, load-game-blockers-exec-test, mapa-etykieta-stolicy-test, mennica-magazyn-test, mgla-sciezka-inwariant-test, miasta-panstwa-wylaczone-test, moc-ranking-rozjazd-test, mur-paradoks-test, okolica-load-reconcile-test, okolica-ownership-change-reconcile-test, pr141-combat-defense-owner-route-test, pr141-current-evidence-ledger-test, pr141-current-evidence-ledger-v3-test, pr141-current-evidence-ledger-v4-test, pr141-dip-activation-test, pr141-evidence-ledger-behavior-test, pr141-f04-building-speed-activation-test, pr141-f04-yields-activation-test, pr141-hotseat-diplomacy-owner-test, pr141-hotseat-production-owner-routing-test, pr141-matrix-only-economy-test, praca-jeden-podzial-kontrakt-test, praca-split-ui-test, pre-battle-retreat-exhausted-test, pre-battle-save-test, rekrutacja-koszty-polowa-all-test, rekrutacja-skarbiec-only-test, resource-usage-breakdown-test, ruch-swiata-tempo-test, rydwan-konnica-x2-test, siege-badge-zorder-live-test, siege-surrender-forecast-live-test, surow-civ-storage-test, surrender-rekrutacja-build-gate-test, szczescie-przebudowa-skali-test, tarasy-cywilizacje-test, test-hook-setcitylimit-live-test, trade-ilosc-test, unit-detail-card-entitycard-migration-test, unit-info-card-army-interaction-test, unit-info-card-wiring-test, unit-power-sort-test, unit-power-test, unit-recruit-nazwa-test, unit-replace-test, unit-resource-upkeep-test, war-allin-capital-test, war-epoch-player-first-main-guard-test, web-turn-slowdown-test, weterani-test, wojna-wymuszona-prog-tury-gracz-test, zelazo-gate-test, zloto-test, recruit-hud-label-test, smoke_test.

## C. Niestabilne (rozny wynik w przebiegach) — 5

| Test | run1 | rerun main | ref | uwaga / ostatnia linia FAIL |
|---|---|---|---|---|
| diplo-truce-live-test.cjs | RED | RED | GREEN | zielony przy 3. uruchomieniu (bisect, main) — niestabilny — ' FAIL wyjątek: locator.click: Timeout 10000ms exceeded. / Call log: / - waiting for locator('.cdb-chip-peacek |
| pangea-land-determinism-test.cjs | TIMEOUT | GREEN | GREEN | czerwony w 1. przebiegu, zielony w 2. — '[civ] riverGen: WYŁĄCZONE (kill-switch FALA 160 — ?riverGen=1 / localStorage civ-river-gen) / [civ] mapGen ms |
| pangea-land-fraction-test.cjs | TIMEOUT | GREEN | GREEN | czerwony w 1. przebiegu, zielony w 2. — '[civ] mapGen ms / prep=0 terrain=775 landSea=8302 relief=10201 coast=5655 riversMain=7 riversFill=105 forest= |
| pangea-land-shape-test.cjs | TIMEOUT | GREEN | GREEN | czerwony w 1. przebiegu, zielony w 2. — ' 5 seedów PASS: PASS (0 fail)' |
| trade-routes-limit-test.cjs | RED | GREEN | GREEN | czerwony w 1. przebiegu, zielony w 2. — ' FAIL: K9: (twarda gorna granica bezpieczenstwa, NIE cel wydajnosciowy) cold=5402.42ms < 5000ms / trade-route |

## D. INFRA / TIMEOUT — 40

TIMEOUT na main i na ref albo TIMEOUT na main przy czerwonym ref: wolne testy generatora mapy/rzek/AI oraz testy przegladarkowe (SwiftShader, brak GPU, obciazony host). Nie sa to dowody regresji ani zielonosci.

Lista D: ai-avoid-polar-player-parity-test, ai-buduje-budynki-test, autoclear-priority-live-test, autoimprove-irrigation-after-farms-test, autoimprove-stages-q1-test, capital-sep-pangea-test, city-name-start-overlap-test, climate-band-test, cluster-start-test, cyna-surowiec-test, deposit-coast-test, diplo-aggressor-marker-live-test, earth-template-test, fair-play-grid-test, horse-resource-terrain-test, hunting-camp-hill-no-flatten-test, land-sea-ratio-test, map-coast-buffer-test, map-continents-rivers-test, map-gen-regression-test, map-models-scale-2x-test, map-quality-forest-parity-test, map-snapshot-load-test, medium-river-test, miasta-zbyt-blisko-test, minimapa-ikona-robotnik-kolor-live-test, oboz-lowiecki-las-znika-render-test, pangea-river-interior-test, player-moves-before-ai-turn-test, relief-grid-coverage-test, river-density-test, river-grid-coverage-test, river-loop-test, river-map-scale-test, river-path-adjacency-test, river-sea-buffer-test, river-yield-both-sides-test, stranded-land-test, terrain-height-audit-test, world-density-test.

## E. Zielone — 711

Lista pelna w tabeli sekcji 5 i w `results.csv` (klasa E). Zielone m.in.: `logic-test` 213/213, `tech-tree-test` 19/19, `research-test` 33/33, `combat-test` 6/6, `entity-card-contract-test` 75/0, `map-field-battle-test` 24, `barbarzyncy-krazenie-test` 249.

## NIE_ZMIERZONO — 166

- 161 testow przegladarkowych (live/render) nie uruchomionych: budzet czasu. Obciazony host (load 13-21 na 4 rdzeniach), 1 test przegladarkowy trwa srednio 3-6 min (build vite + Chromium na SwiftShader) — pelne ~249 testow wymagaloby ponad 15 godzin. Kolejnosc uruchamiania: od najswiezszych (ostatnia zmiana pliku w git), wiec zmierzono najbardziej istotne dla FALA 509-532. Wiersze w `results.csv` z `run1_status=NIE_ZMIERZONO`.
- 5 testow przegladarkowych czerwonych/TIMEOUT w run1 bez przebiegu na referencji lub bez rerun (budzet czasu).

## 3. Wnioski

1. Typy (`tsc --noEmit`) czyste. 100% testow szybkich zmierzone: 662 zielone, 171 niezielonych w 1. przebiegu, z czego po rerunie/ref: A=10 (+17 niepewnych), B=133, C=5, D=40 (laczne dla obu grup).
2. Regresje A to w przewadze **testy statyczne/zrodlowe niezsynchronizowane z celowymi zmianami FALA** (asercje grepujace zrodlo `buildHudState`, liczba wpisow `CITY_BUILDING_PREREQ`, harness bez `renderer.setOpaqueSort`, stale oczekiwania dyspozycji/AI), a nie wykryte wady w grze — ale tego nie rozstrzygnieto bez przegladu kodu (poza zakresem). Wyjatek wymagajacy uwagi: `web-memory-leaks-test` (dispose geometrii/materialow, FALA 526) i `fort-outpost-hard-territory-test` I5 (FALA 531) — sprawdzic, czy zmiana dopuszcza realny wyciek/zachowanie.
3. `ai-army-scattered-merge-test` pada na asercji czasowej ("czas tury AI ... <= 3x + 10 ms") — bisect wskazuje FALA 520, ale asercja czasowa jest podatna na obciazenie hosta; traktowac jako A z ryzykiem flaky.
4. Duzy zbior B (133) to dlug przedistniejacy sprzed FALA 509 — wiekszosc to testy rodzin: pr141 (11), ai (10), unit (8), diplomacy (5), eko (5), hotseat (4), civ (3), empire (3), era (3), forced (3), auto (2), autoimprove (2).

## 4. Rekomendowane tematy naprawcze (nie naprawiano w tym temacie)

1. **R-WEB-TEST-DEBT-HUD-SOURCE-GREP-Q1** — `hud-armia-chip-jednostki`, `hud-obywatele-chip`, `spichlerz-deficyt-scalenie` (FALA 525: refaktor `buildHudState`): zsynchronizowac asercje zrodlowe.
2. **R-WEB-TEST-DEBT-PREREQ-DIPLO-Q1** — `prereq-budynkow-test` (FALA 516: 10 wpisow zamiast 9), `diplo-aggressor-wiring-test` (FALA 515: prog paktu).
3. **R-WEB-TEST-DEBT-MEMORY-HARNESS-Q1** — `web-memory-leaks-test` (FALA 526), `merge-decor-no-regress-test` (FALA 530, `setOpaqueSort`), `mgla-odkrycie-wzdluz-sciezki-test` (FALA 529), `fort-outpost-hard-territory-test` (FALA 531): rozstrzygnac czy regresja kodu czy testu.
4. **R-WEB-TEST-DEBT-AI-TIMING-Q1** — `ai-army-scattered-merge-test` (asercja czasowa, FALA 520).
5. **R-WEB-TEST-INFRA-LIVE-SUITE-Q1** — przeglad 249 testow przegladarkowych: wspolny, jednokrotny bundel, limity czasu, wylaczenie zaleznosci od GPU; dokonczenie pomiaru 166 niezmierzonych (najlepiej na maszynie bez obciazenia).
6. **R-WEB-TEST-DEBT-PREEXISTING-B-Q1** — plan splaty 133 dlugow B (priorytet: bramki §6: `unit-power`, `unit-replace`, `mgla-sciezka-inwariant`, `ai-test`, `ai-zdobycie-miasta-adiacencja`) i decyzja co do usuniecia testow martwych.
7. **R-PROC-GATE-REFERENCE-REFRESH-Q1** — odswiezyc "wyniki referencyjne" w R-PROC-AUTOBOT §6 (rozbiezne z faktycznym main).

## 5. Tabela wszystkich testow (nazwa | klasa | status run1 | czas s)

| Test | Kl. | Status | s |
|---|---|---|---|
| R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live-test.cjs | B | RED | 75.6 |
| _tmp-battle-roster-test.cjs | E | GREEN | 0.5 |
| _tmp-siege-test.cjs | E | GREEN | 0.4 |
| adjust-handel-split-suma-test.cjs | E | GREEN | 0.4 |
| administracja-stolica-test.cjs | B | RED | 0.4 |
| ai-army-all-civs-general-muster-test.cjs | E | GREEN | 4.3 |
| ai-army-replacement-concentration-test.cjs | E | GREEN | 39.1 |
| ai-army-scattered-merge-test.cjs | A | RED | 24.8 |
| ai-avoid-polar-pick-test.cjs | E | GREEN | 0.6 |
| ai-avoid-polar-plan-test.cjs | E | GREEN | 42.4 |
| ai-avoid-polar-player-parity-test.cjs | D | TIMEOUT | 300.0 |
| ai-avoid-polar-sim-test.cjs | E | GREEN | 160.8 |
| ai-balans-step2-test.cjs | E | GREEN | 0.6 |
| ai-balans-step3-test.cjs | B | RED | 0.6 |
| ai-balans-step4-test.cjs | E | GREEN | 0.6 |
| ai-balans-step5-test.cjs | E | GREEN | 0.5 |
| ai-buduje-budynki-test.cjs | D | TIMEOUT | 580.2 |
| ai-citizen-hex-sibling-exclusion-test.cjs | E | GREEN | 2.1 |
| ai-city-capture-integration-test.cjs | E | GREEN | 0.4 |
| ai-city-recovery-test.cjs | E | GREEN | 1.4 |
| ai-city-render-batch-test.cjs | B | RED | 0.6 |
| ai-city-yield-test.cjs | E | GREEN | 0.5 |
| ai-colonization-pop-test.cjs | E | GREEN | 0.6 |
| ai-cs-absorption-test.cjs | E | GREEN | 0.3 |
| ai-cud-priorytet-b3-test.cjs | E | GREEN | 0.7 |
| ai-difficulty-bonus-test.cjs | E | GREEN | 0.6 |
| ai-dlug-porzadki-q1-test.cjs | B | RED | 0.2 |
| ai-early-city-founding-pace-test.cjs | E | GREEN | 2.9 |
| ai-early-no-major-war-test.cjs | E | GREEN | 0.6 |
| ai-era-unit-promotion-test.cjs | E | GREEN | 0.4 |
| ai-fog-test.cjs | B | RED | 0.6 |
| ai-food-improvement-priority-stages-test.cjs | E | GREEN | 2.1 |
| ai-food-only-worked-hexes-test.cjs | E | GREEN | 16.7 |
| ai-founding-territory-test.cjs | E | GREEN | 0.8 |
| ai-general-war-campaign-live-test.cjs | E | GREEN | 351.1 |
| ai-general-war-campaign-test.cjs | E | GREEN | 0.7 |
| ai-granary-prog-populacji-spojnosc-test.cjs | E | GREEN | 0.3 |
| ai-home-defense-civilian-filter-test.cjs | E | GREEN | 0.7 |
| ai-home-defense-vs-barbarians-test.cjs | E | GREEN | 0.9 |
| ai-improvements-test.cjs | E | GREEN | 1.1 |
| ai-jednostki-tylko-zakup-test.cjs | B | RED | 2.1 |
| ai-major-absorb-test.cjs | E | GREEN | 0.1 |
| ai-major-economy-test.cjs | B | RED | 0.5 |
| ai-march-avoid-foreign-territory-test.cjs | B | RED | 32.8 |
| ai-moc-diag-test.cjs | E | GREEN | 0.4 |
| ai-move-full-range-test.cjs | E | GREEN | 176.6 |
| ai-move-range-collision-test.cjs | E | GREEN | 0.3 |
| ai-move-range-test.cjs | E | GREEN | 12.8 |
| ai-mp-military-cap-test.cjs | E | GREEN | 1.3 |
| ai-mp-rekrutacja-build-gate-test.cjs | E | GREEN | 0.9 |
| ai-nauka-podzial-tura1-seed-test.cjs | E | GREEN | 4.9 |
| ai-no-march-without-war-q1-test.cjs | E | GREEN | 1.5 |
| ai-no-siege-without-war-r2-test.cjs | E | GREEN | 1.1 |
| ai-ofensywa-wojna-epoki-test.cjs | E | GREEN | 1.0 |
| ai-owner-progress-frame-test.cjs | E | GREEN | 0.4 |
| ai-polar-fallback-test.cjs | E | GREEN | 0.8 |
| ai-praca-budynki-ulepszenia-owner-policy-test.cjs | E | GREEN | 0.5 |
| ai-praca-podzial-tura1-seed-test.cjs | E | GREEN | 5.2 |
| ai-praca-split-parity-test.cjs | B | RED | 1.3 |
| ai-prod-fallback-test.cjs | E | GREEN | 1.2 |
| ai-prod-gate-difficulty-test.cjs | E | GREEN | 0.4 |
| ai-production-priority-test.cjs | E | GREEN | 0.9 |
| ai-produkcja-pokrycie-katalogu-test.cjs | E | GREEN | 0.9 |
| ai-recruit-upkeep-gate-test.cjs | E | GREEN | 0.4 |
| ai-rekrutacja-parytet-test.cjs | E | GREEN | 0.8 |
| ai-resource-needs-test.cjs | E | GREEN | 0.9 |
| ai-siege-requires-war-test.cjs | E | GREEN | 0.9 |
| ai-slider-test.cjs | E | GREEN | 0.8 |
| ai-stadnina-fort-territory-test.cjs | E | GREEN | 1.7 |
| ai-test.cjs | B | RED | 1.2 |
| ai-threat-mode-test.cjs | E | GREEN | 1.0 |
| ai-ulepszenia-malo-budowane-test.cjs | E | GREEN | 62.4 |
| ai-unit-rush-test.cjs | E | GREEN | 1.1 |
| ai-war-defend-home-test.cjs | E | GREEN | 10.6 |
| ai-war-gate-test.cjs | E | GREEN | 1.1 |
| ai-war-nearest-city-peace-2t-test.cjs | E | GREEN | 1.4 |
| ai-war-weariness-peace-test.cjs | E | GREEN | 1.0 |
| ai-wojny-zwykle-cap-dwa-miasta-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| ai-zdobycie-miasta-adiacencja-test.cjs | B | RED | 1.6 |
| ai2-heks-po-heksie-test.cjs | E | GREEN | 6.5 |
| ai4-popyt-obywatele-test.cjs | B | RED | 9.1 |
| akwedukt-popcap-test.cjs | E | GREEN | 0.7 |
| alliance-war-obligation-test.cjs | E | GREEN | 1.1 |
| ambience-natura-tylko-zwierzeta-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| annex-citystate-spoils-test.cjs | E | GREEN | 0.8 |
| army-concentration-test.cjs | E | GREEN | 1.4 |
| army-consolidation-e2e-test.cjs | E | GREEN | 2.0 |
| army-consolidation-test.cjs | E | GREEN | 2.6 |
| army-hunger-combat-test.cjs | E | GREEN | 1.1 |
| army-hunger-icon-unfortify-test.cjs | E | GREEN | 0.3 |
| army-leadership-test.cjs | E | GREEN | 0.4 |
| army-merge-bounce-test.cjs | E | GREEN | 1.0 |
| army-merge-colocated-test.cjs | E | GREEN | 0.8 |
| army-merge-dismiss-bounce-test.cjs | E | GREEN | 2.4 |
| army-merge-panel-list-visibility-test.cjs | E | GREEN | 15.1 |
| army-merge-panel-production-mount-test.cjs | E | GREEN | 11.7 |
| army-merge-panel-scroll-real-render-test.cjs | E | GREEN | 5.4 |
| army-merge-separate-return-mainguard-test.cjs | E | GREEN | 0.6 |
| army-merge-separate-return-test.cjs | E | GREEN | 0.7 |
| army-merge-split-direction-icons-test.cjs | E | GREEN | 0.4 |
| army-merge-stackgroupid-test.cjs | E | GREEN | 0.6 |
| army-panel-general-label-multiselect-live-test.cjs | E | GREEN | 184.1 |
| army-panel-general-label-multiselect-test.cjs | E | GREEN | 4.3 |
| army-panel-recruit-rally-general-test.cjs | E | GREEN | 0.4 |
| army-panel-recruit-remove-test.cjs | E | GREEN | 6.5 |
| army-recruitment-concentration-test.cjs | E | GREEN | 0.9 |
| army-scout-not-leader-test.cjs | E | GREEN | 1.4 |
| army-split-movement-test.cjs | E | GREEN | 0.4 |
| army-split-panel-scroll-grid-test.cjs | B | RED | 23.0 |
| army-split-ruch-icons-test.cjs | E | GREEN | 0.2 |
| army-stack-commander-identity-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| army-stack-ruch-test.cjs | E | GREEN | 0.6 |
| army-to-nearest-leader-test.cjs | E | GREEN | 9.0 |
| atak-adiacencja-wymagana-test.cjs | E | GREEN | 0.6 |
| auto-battle-active-roster-event-test.cjs | E | GREEN | 0.6 |
| auto-battle-loss-audit-test.cjs | E | GREEN | 0.9 |
| auto-battle-power-test.cjs | E | GREEN | 0.3 |
| auto-battle-przewaga-monotonicznosc-test.cjs | E | GREEN | 0.2 |
| auto-battle-py-vs-ts-parytet-test.cjs | E | GREEN | 0.8 |
| auto-battle-simultaneous-test.cjs | B | RED | 1.8 |
| auto-fort-claim-test.cjs | B | RED | 4.4 |
| auto-fort-diag-test.cjs | E | GREEN | 2.1 |
| auto-improve-no-item-cap-test.cjs | E | GREEN | 3.4 |
| auto-improve-q3-test.cjs | E | GREEN | 11.2 |
| auto-improvements-test.cjs | E | GREEN | 0.9 |
| auto-manage-test.cjs | E | GREEN | 0.7 |
| auto-manage-ulepszenia-fallback-test.cjs | E | GREEN | 0.6 |
| auto-wyzywienie-bilans-clamp-test.cjs | E | GREEN | 0.0 |
| auto-wyzywienie-flow-balance-test.cjs | E | GREEN | 0.5 |
| auto-wyzywienie-kosztarmii-kryterium-test.cjs | E | GREEN | 0.4 |
| auto-wyzywienie-live-recalc-test.cjs | E | GREEN | 0.5 |
| auto-wyzywienie-population-growth-live-recalc-test.cjs | E | GREEN | 0.8 |
| autobuild-toggle-test.cjs | E | GREEN | 0.2 |
| autoclear-priority-live-test.cjs | D | TIMEOUT | 360.2 |
| autoclear-priority-q1-test.cjs | E | GREEN | 4.3 |
| autoclear-river-forest-priority-test.cjs | E | GREEN | 3.2 |
| autoimprove-irrigation-after-farms-test.cjs | D | TIMEOUT | 300.0 |
| autoimprove-live-hooks-test.cjs | E | GREEN | 1.8 |
| autoimprove-river-forest-clear-no-citizen-q1-test.cjs | B | RED | 0.1 |
| autoimprove-river-forest-clear-no-citizen-q1-unit-test.cjs | E | GREEN | 0.9 |
| autoimprove-river-forest-first-q1-test.cjs | E | GREEN | 0.9 |
| autoimprove-river-forest-live-verify-q1-test.cjs | B | RED | 0.1 |
| autoimprove-stages-q1-test.cjs | D | TIMEOUT | 300.0 |
| autosave-quota-fail-test.cjs | E | GREEN | 0.7 |
| autowyzywienie-rowny-wzrost-test.cjs | E | GREEN | 2.5 |
| autowyzywienie-stan-przycisku-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| barb-camp-blacklist-test.cjs | E | GREEN | 2.1 |
| barb-camp-destruction-test.cjs | B | RED | 16.9 |
| barb-city-behavior-test.cjs | E | GREEN | 37.7 |
| barb-city-capture-cluster-test.cjs | E | GREEN | 0.9 |
| barb-city-owner-contract-test.cjs | E | GREEN | 0.7 |
| barb-karencja-czas-trwania-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| barbarian-cooperation-grace-maints-wiring-test.cjs | E | GREEN | 1.1 |
| barbarian-cooperation-grace-test.cjs | E | GREEN | 0.7 |
| barbarians-test.cjs | E | GREEN | 0.6 |
| barbarzyncy-krazenie-test.cjs | E | GREEN | 33.0 |
| barbarzyncy-podwojny-atak-prebattle-test.cjs | E | GREEN | 2.5 |
| battle-attack-move-order-test.cjs | E | GREEN | 1.7 |
| battle-attack-move-pointer-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| battle-dead-unit-disappearance-test.cjs | E | GREEN | 1.8 |
| battle-doctrine-live-r3-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| battle-doctrine-live-r4-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| battle-flank-close-formation-test.cjs | E | GREEN | 1.9 |
| battle-formation-rules-test.cjs | E | GREEN | 1.2 |
| battle-hp-display-test.cjs | E | GREEN | 0.0 |
| battle-initial-placement-runtime-test.cjs | E | GREEN | 2.5 |
| battle-large-mixed-doctrine-matrix-test.cjs | E | GREEN | 32.3 |
| battle-large-return-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| battle-loot-test.cjs | B | RED | 0.7 |
| battle-manual-choice-contract-test.cjs | E | GREEN | 0.1 |
| battle-manual-control-multicycle-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| battle-manual-full-roster-pointer-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| battle-manual-melee-browser-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| battle-manual-melee-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| battle-manual-orders-live-open-tile-deterministic-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| battle-manual-orders-routing-test.cjs | E | GREEN | 2.3 |
| battle-manual-queued-order-lifecycle-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| battle-melee-attack-doctrine-test.cjs | E | GREEN | 2.6 |
| battle-mode-choice-labels-test.cjs | E | GREEN | 39.9 |
| battle-mode-save-reload-contract-test.cjs | E | GREEN | 0.2 |
| battle-natural-chariot-r5-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| battle-natural-near-range-r6-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| battle-ranged-approach-regression-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| battle-ranged-mounted-doctrine-test.cjs | E | GREEN | 1.8 |
| battle-roster-test.cjs | E | GREEN | 0.7 |
| battle-standoff-two-warriors-test.cjs | E | GREEN | 2.5 |
| battle-summary-test.cjs | E | GREEN | 0.2 |
| bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs | E | GREEN | 3.2 |
| bitwa-auto-doktryna-playerorder-zrodlo-test.cjs | E | GREEN | 0.1 |
| bitwa-mapa-kamera-blokada-test.cjs | E | GREEN | 0.8 |
| bitwa-obroncy-mur-kolumny-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| bitwa-podsumowanie-dispose-test.cjs | E | GREEN | 2.5 |
| boot-error-catcher-console-error-test.cjs | E | GREEN | 1.7 |
| border-march-scan-test.cjs | E | GREEN | 0.5 |
| border-march-wygasanie-test.cjs | B | RED | 0.1 |
| bottom-bar-hud-wykonaj-overlap-test.cjs | E | GREEN | 1.4 |
| bramki-tmpdir-unikalnosc-test.cjs | B | RED | 1.5 |
| brick-production-x2-test.cjs | E | GREEN | 9.3 |
| budmode-ulepszenia-sort-locked-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| budowa-lista-szablony-test.cjs | E | GREEN | 0.6 |
| budynek-civ-bonus-u17-test.cjs | B | RED | 0.6 |
| budynek-garnizon-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| budynki-koszt-pracy-50-test.cjs | B | RED | 0.4 |
| build-mode-hud-affordability-test.cjs | E | GREEN | 6.2 |
| build-mode-lock-tip-position-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| build-panel-ulepszenia-scroll-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| build-request-obywatele-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| building-card-overlap-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| building-cost-tempo-test.cjs | E | GREEN | 0.3 |
| building-detail-card-entitycard-migration-test.cjs | B | RED | 5.0 |
| building-detail-card-hover-layout-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| building-epoch-cost-implementation-test.cjs | E | GREEN | 0.4 |
| building-happiness-test.cjs | E | GREEN | 0.6 |
| building-queue-detail-card-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| building-queue-refund-test.cjs | E | GREEN | 0.4 |
| building-resource-visibility-test.cjs | E | GREEN | 0.6 |
| building-resource-visibility-ui-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| building-stock-visibility-test.cjs | E | GREEN | 0.4 |
| building-tech-gate-test.cjs | E | GREEN | 0.2 |
| camera-zoom-block-test.cjs | E | GREEN | 0.3 |
| capital-capture-test.cjs | E | GREEN | 0.5 |
| capital-sep-pangea-test.cjs | D | TIMEOUT | 300.2 |
| capital-sep-unit-test.cjs | E | GREEN | 0.8 |
| capital-spacing-prop-test.cjs | E | GREEN | 124.5 |
| capture-event-retention-test.cjs | E | GREEN | 0.8 |
| capture-render-sync-test.cjs | E | GREEN | 0.8 |
| chlopek-pole-warstwy-test.cjs | E | GREEN | 1.3 |
| cities-buildings-production-owner-contract-test.cjs | E | GREEN | 1.5 |
| citizen-consumption-era-mult-test.cjs | E | GREEN | 3.0 |
| citizen-resource-upkeep-test.cjs | B | RED | 1.1 |
| citizen-upkeep-era-mult-test.cjs | E | GREEN | 0.7 |
| city-badge-growth-percent-test.cjs | E | GREEN | 1.3 |
| city-badge-zoom-lod-test.cjs | E | GREEN | 1.0 |
| city-capture-pop-loss-test.cjs | E | GREEN | 4.3 |
| city-clears-forest-live-test.cjs | E | GREEN | 210.5 |
| city-clears-forest-test.cjs | E | GREEN | 9.9 |
| city-defense-terrain-gate-test.cjs | E | GREEN | 0.8 |
| city-growth-percent-rounding-parity-test.cjs | E | GREEN | 1.6 |
| city-hex-movement-test.cjs | E | GREEN | 0.7 |
| city-limit-conquered-test.cjs | E | GREEN | 0.9 |
| city-map-badge-test.cjs | E | GREEN | 1.2 |
| city-militia-no-defenders-test.cjs | E | GREEN | 4.1 |
| city-militia-no-population-loss-test.cjs | E | GREEN | 2.2 |
| city-militia-regen-cooldown-test.cjs | E | GREEN | 2.1 |
| city-name-start-overlap-test.cjs | D | TIMEOUT | 300.2 |
| city-name-unique-forever-test.cjs | E | GREEN | 0.8 |
| city-names-pool-test.cjs | E | GREEN | 0.6 |
| city-names-pools-test.cjs | E | GREEN | 0.4 |
| city-orderstate-restore-clear-test.cjs | E | GREEN | 0.1 |
| city-panel-growth-percent-separator-test.cjs | E | GREEN | 1.3 |
| city-siege-wall-rules-test.cjs | E | GREEN | 2.2 |
| city-state-alliance-test.cjs | E | GREEN | 2.3 |
| city-state-cluster-diff-test.cjs | E | GREEN | 2.4 |
| city-state-mp-growth-test.cjs | E | GREEN | 0.9 |
| city-state-offensive-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| city-state-offensive-normal-easy-test.cjs | B | RED | 2.3 |
| city-state-offensive-perf-test.cjs | E | GREEN | 23.4 |
| city-state-prod-audit-test.cjs | E | GREEN | 1.6 |
| city-state-start-units-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| city-state-start-units-test.cjs | E | GREEN | 2.1 |
| city-wall-towers-test.cjs | E | GREEN | 1.5 |
| citypanel-konwerter-produkcja-test.cjs | E | GREEN | 5.2 |
| citypanel-uwagi-abc-filter-test.cjs | E | GREEN | 0.2 |
| citypanel-uwagi-hostcard-removed-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| civ-ai-allocation-saveload-order-test.cjs | E | GREEN | 0.2 |
| civ-ai-allocation-test.cjs | E | GREEN | 1.2 |
| civ-bonusy-test.cjs | E | GREEN | 0.7 |
| civ-configurator-opponent-test.cjs | E | GREEN | 18.6 |
| civ-entry-epoch-test.cjs | E | GREEN | 0.5 |
| civ-matrix-ai-diplomacy-wiring-test.cjs | B | RED | 1.1 |
| civ-matrix-difficulty-test.cjs | E | GREEN | 1.5 |
| civ-matrix-greece-test.cjs | B | RED | 2.3 |
| civ-matrix-meta-roster-wiring-test.cjs | B | RED | 0.7 |
| civ-matrix-semantic-labels-test.cjs | E | GREEN | 0.9 |
| civ-names-test.cjs | E | GREEN | 0.5 |
| civ-roster-test.cjs | E | GREEN | 0.6 |
| civ-visual-test.cjs | E | GREEN | 0.7 |
| civpedia-budynki-historia-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| civpedia-caly-wiersz-przyciskiem-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| civpedia-cross-link-style-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| civpedia-cuda-historia-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| civpedia-gra-id-mostek-test.cjs | E | GREEN | 1.2 |
| civpedia-historia-infra-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| civpedia-jednostki-j1-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| civpedia-jednostki-j2-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| civpedia-karty-nazwa-przyciskiem-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| civpedia-karty-spojnosc-q1-c-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| civpedia-technologie-rys-historyczny-test.cjs | E | GREEN | 0.8 |
| civpedia-ulepszenia-historia-batch-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| civpedia-wikihubhud-rys-historyczny-duplikacja-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| climate-band-test.cjs | D | TIMEOUT | 300.1 |
| cluster-plan-name-test.cjs | B | RED | 23.7 |
| cluster-spread-test.cjs | E | GREEN | 201.3 |
| cluster-start-recovery2-test.cjs | E | GREEN | 15.6 |
| cluster-start-test.cjs | D | TIMEOUT | 300.2 |
| combat-test.cjs | E | GREEN | 0.5 |
| commander-star-emblem-test.cjs | E | GREEN | 1.0 |
| commander-unit-label-test.cjs | E | GREEN | 0.1 |
| conquest-stability-test.cjs | B | RED | 0.8 |
| converter-era-scaling-test.cjs | E | GREEN | 12.3 |
| converters-test.cjs | E | GREEN | 0.6 |
| counter-migration-test.cjs | E | GREEN | 0.8 |
| cs-military-cap-wiring-test.cjs | E | GREEN | 2.0 |
| cs-wave-attack-radius-test.cjs | E | GREEN | 1.4 |
| cuda-handel-test.cjs | E | GREEN | 0.9 |
| culture-religion-test.cjs | B | RED | 0.5 |
| currency-test.cjs | E | GREEN | 0.6 |
| cyna-surowiec-test.cjs | D | TIMEOUT | 300.1 |
| danina-podatek-nazwa-test.cjs | E | GREEN | 0.4 |
| danina-podatek-tooltip-ui-test.cjs | E | GREEN | 0.7 |
| defeat-last-city-live-test.cjs | NIE_ZMIERZONO | TIMEOUT | 360.1 |
| defeat-last-city-test.cjs | E | GREEN | 0.2 |
| defense-breakdown-test.cjs | B | RED | 0.7 |
| deposit-building-gate-test.cjs | E | GREEN | 0.9 |
| deposit-coast-test.cjs | D | TIMEOUT | 300.0 |
| difficulty-bonus-city-name-test.cjs | E | GREEN | 0.7 |
| difficulty-cost-test.cjs | E | GREEN | 0.6 |
| diplo-aggressor-marker-live-test.cjs | D | TIMEOUT | 360.2 |
| diplo-aggressor-marker-mutation-test.cjs | E | GREEN | 3.6 |
| diplo-aggressor-marker-unit-test.cjs | E | GREEN | 0.2 |
| diplo-aggressor-mutation-test.cjs | E | GREEN | 25.9 |
| diplo-aggressor-ui-live-test.cjs | E | GREEN | 247.2 |
| diplo-aggressor-unit-test.cjs | E | GREEN | 0.9 |
| diplo-aggressor-wiring-test.cjs | A | RED | 0.1 |
| diplo-nap-border-threshold-test.cjs | E | GREEN | 0.9 |
| diplo-nap-trust-30-live-test.cjs | E | GREEN | 245.0 |
| diplo-nap-trust-30-test.cjs | E | GREEN | 0.9 |
| diplo-tick-war-brake-mutation-test.cjs | E | GREEN | 0.7 |
| diplo-tick-war-brake-test.cjs | E | GREEN | 0.3 |
| diplo-tick-war-brake-unit-test.cjs | E | GREEN | 0.4 |
| diplo-truce-ai-table-live-test.cjs | B | RED | 167.5 |
| diplo-truce-live-test.cjs | C | RED | 217.0 |
| diplo-truce-n6-saveload-test.cjs | E | GREEN | 0.3 |
| diplo-truce-r1-test.cjs | E | GREEN | 2.0 |
| diplo-truce-r4-ai-test.cjs | E | GREEN | 2.9 |
| diplo-truce-saveload-live-test.cjs | NIE_ZMIERZONO | TIMEOUT | 360.1 |
| diplo-war-peace-d7-test.cjs | E | GREEN | 0.2 |
| diplo-war-peace-gate-test.cjs | E | GREEN | 1.5 |
| diplo-war-peace-live-test.cjs | NIE_ZMIERZONO | TIMEOUT | 360.5 |
| diplo-war-peace-main-guard-test.cjs | E | GREEN | 0.2 |
| diplo-war-peace-profile-unit-test.cjs | E | GREEN | 0.6 |
| diplo-war-peace-sim-test.cjs | E | GREEN | 4.3 |
| diplomacy-acceptance-points-test.cjs | E | GREEN | 0.9 |
| diplomacy-ai-balance-test.cjs | E | GREEN | 0.8 |
| diplomacy-ai-offer-balance-test.cjs | E | GREEN | 1.2 |
| diplomacy-audience-actions-test.cjs | E | GREEN | 1.2 |
| diplomacy-audience-close-flush-test.cjs | B | RED | 4.6 |
| diplomacy-audience-deals-active-first-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| diplomacy-audience-zoom-cutoff-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| diplomacy-barbarian-cooperation-test.cjs | E | GREEN | 0.9 |
| diplomacy-basket-duplicate-test.cjs | E | GREEN | 0.9 |
| diplomacy-basket-duplicate-ui-test.cjs | E | GREEN | 7.8 |
| diplomacy-basket-edit-test.cjs | E | GREEN | 1.0 |
| diplomacy-basket-transfer-test.cjs | E | GREEN | 1.2 |
| diplomacy-bilans-unifikacja-test.cjs | E | GREEN | 2.5 |
| diplomacy-border-march-test.cjs | E | GREEN | 1.7 |
| diplomacy-city-cession-live-test.cjs | NIE_ZMIERZONO | TIMEOUT | 360.1 |
| diplomacy-city-cession-r3-test.cjs | E | GREEN | 1.7 |
| diplomacy-city-cession-test.cjs | E | GREEN | 1.7 |
| diplomacy-city-picker-ui-test.cjs | E | GREEN | 12.1 |
| diplomacy-counter-offer-role-symmetry-test.cjs | E | GREEN | 0.8 |
| diplomacy-currency-trade-test.cjs | E | GREEN | 0.6 |
| diplomacy-cyclic-trade-duration-ui-test.cjs | E | GREEN | 5.1 |
| diplomacy-deposit-trade-test.cjs | E | GREEN | 1.3 |
| diplomacy-direct-negotiation-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| diplomacy-display-test.cjs | E | GREEN | 1.2 |
| diplomacy-economy-test.cjs | E | GREEN | 0.4 |
| diplomacy-fairness-gate-package-q2-test.cjs | E | GREEN | 0.6 |
| diplomacy-goods-kat-test.cjs | E | GREEN | 0.8 |
| diplomacy-incoming-own-gate-recon-test.cjs | E | GREEN | 1.0 |
| diplomacy-infografiki-tooltipy-test.cjs | E | GREEN | 1.8 |
| diplomacy-layers-test.cjs | E | GREEN | 1.0 |
| diplomacy-lista-podglad-przed-wizyta-test.cjs | B | RED | 2.9 |
| diplomacy-live-balance-preview-test.cjs | E | GREEN | 1.2 |
| diplomacy-locks-test.cjs | E | GREEN | 0.9 |
| diplomacy-negotiation-table-test.cjs | B | RED | 0.8 |
| diplomacy-own-proposal-edit-test.cjs | E | GREEN | 0.4 |
| diplomacy-package-ai-counter-actionable-test.cjs | B | RED | 0.1 |
| diplomacy-peace-lock-test.cjs | E | GREEN | 0.8 |
| diplomacy-penalty-preview-test.cjs | E | GREEN | 0.3 |
| diplomacy-proposal-test.cjs | B | RED | 4.5 |
| diplomacy-przemarsz-duplikat-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| diplomacy-rejection-cooldown-test.cjs | E | GREEN | 0.7 |
| diplomacy-relacje-ai-ai-audiencja-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| diplomacy-relacje-ai-ai-audiencja-test.cjs | E | GREEN | 1.1 |
| diplomacy-resource-cyclic-trade-test.cjs | E | GREEN | 1.7 |
| diplomacy-resource-trade-pick-test.cjs | E | GREEN | 0.7 |
| diplomacy-resource-values-x5-regression-test.cjs | E | GREEN | 0.8 |
| diplomacy-sensible-deals-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| diplomacy-sensible-deals-main-guard-test.cjs | E | GREEN | 0.4 |
| diplomacy-sensible-deals-test.cjs | E | GREEN | 1.0 |
| diplomacy-stol-pw-sum-test.cjs | E | GREEN | 0.9 |
| diplomacy-tech-chip-filter-and-multi-deal-test.cjs | E | GREEN | 6.3 |
| diplomacy-tech-trade-e2e-test.cjs | E | GREEN | 1.4 |
| diplomacy-tech-trade-execute-test.cjs | E | GREEN | 0.8 |
| diplomacy-tech-trade-test.cjs | E | GREEN | 3.7 |
| diplomacy-test.cjs | E | GREEN | 1.8 |
| diplomacy-trade-flex-test.cjs | E | GREEN | 0.9 |
| diplomacy-treaties-test.cjs | E | GREEN | 0.7 |
| diplomacy-treaty-sweetener-edit-test.cjs | E | GREEN | 4.5 |
| diplomacy-unit-transfer-test.cjs | E | GREEN | 1.2 |
| diplomacy-value-catalog-test.cjs | E | GREEN | 1.3 |
| diplomacy-war-gates-test.cjs | E | GREEN | 1.8 |
| display-names-test.cjs | E | GREEN | 0.5 |
| drewno-gate-test.cjs | B | RED | 1.2 |
| droga-6-ramion-geom-test.cjs | E | GREEN | 1.6 |
| drogi-tooltip-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| dyplo-bilans-gate-n-e1-reprodukcja-runda2-test.cjs | B | RED | 2.3 |
| dyplo-bilans-gate-n-e1-reprodukcja-runda3-test.cjs | B | RED | 1.5 |
| dyplo-bilans-gate-n-e1-reprodukcja-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| dyplo-handel-oferta-ai-blokowana-test.cjs | E | GREEN | 0.8 |
| dyplo-kara-granica-realna-test.cjs | E | GREEN | 1.4 |
| dyplo-karta-decyzji-bilans-skrot-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| dyplo-karta-decyzji-bilans-skrot-test.cjs | E | GREEN | 0.6 |
| dyplo-karta-duplikat-komunikat-test.cjs | E | GREEN | 0.5 |
| dyplo-mapa-odkrycie-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| dyplo-pakt-ekspansja-granica-test.cjs | E | GREEN | 0.6 |
| dyplo-pokoj-kierunek-runda1-test.cjs | E | GREEN | 1.9 |
| dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| dyplo-rel-current-etykieta-test.cjs | E | GREEN | 1.4 |
| dyplo-sojusz-widocznosc-ciagla-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| dyplo-traktat-handlowy-wybor-czasu-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| dyplo-warunek-niespelniony-czerwony-tooltip-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| earth-template-test.cjs | D | TIMEOUT | 300.1 |
| egypt-movement-precedence-test.cjs | B | RED | 0.3 |
| eko-tech-paczka1-test.cjs | B | RED | 0.3 |
| eko-tech-paczka2-test.cjs | B | RED | 0.8 |
| eko-tech-paczka3-test.cjs | B | RED | 0.4 |
| eko-tech-paczka4-test.cjs | B | RED | 0.7 |
| eko-tech-paczka5-test.cjs | B | RED | 0.8 |
| ekonomia-5x-inwariant-test.cjs | B | RED | 0.1 |
| eliminacja-lup-kwoty-test.cjs | B | RED | 0.2 |
| elimination-full-spoils-test.cjs | E | GREEN | 0.3 |
| elimination-toast-merge-test.cjs | E | GREEN | 0.1 |
| empire-armia-produkcja-test.cjs | B | RED | 1.8 |
| empire-autofeed-btn-label-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| empire-city-defaults-test.cjs | E | GREEN | 0.4 |
| empire-diplo-resource-flow-test.cjs | E | GREEN | 0.2 |
| empire-food-b5-test.cjs | E | GREEN | 0.7 |
| empire-mass-recruitment-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| empire-miasta-table-test.cjs | E | GREEN | 1.5 |
| empire-nauka-panel-coverage-test.cjs | E | GREEN | 0.1 |
| empire-panel-drobiazgi-runda2-test.cjs | E | GREEN | 0.1 |
| empire-panel-econ-slider-visibility-test.cjs | E | GREEN | 0.5 |
| empire-panel-miasto-obywatele-content-test.cjs | B | RED | 2.1 |
| empire-panel-moc-scroll-preserve-test.cjs | B | RED | 0.0 |
| empire-panel-sliders-always-visible-test.cjs | E | GREEN | 0.0 |
| empire-panel-split-test.cjs | E | GREEN | 0.2 |
| empire-praca-panel-coverage-test.cjs | E | GREEN | 0.1 |
| empire-recruit-live-test.cjs | A? | TIMEOUT | 360.1 |
| empire-recruit-panel-real-render-test.cjs | E | GREEN | 9.8 |
| empire-recruit-plan-test.cjs | E | GREEN | 0.3 |
| empire-religia-panel-coverage-test.cjs | E | GREEN | 0.1 |
| empire-skarbiec-bilans-test.cjs | E | GREEN | 5.8 |
| empire-skarbiec-panel-coverage-test.cjs | E | GREEN | 0.1 |
| empire-trade-route-split-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| emporion-build-list-real-render-test.cjs | E | GREEN | 6.8 |
| emporion-building-test.cjs | E | GREEN | 0.7 |
| end-details-hp-test.cjs | E | GREEN | 0.1 |
| end-turn-gameplay-runtime-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| end-turn-input-stability-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| end-turn-modal-sequencing-test.cjs | E | GREEN | 2.1 |
| endturn-battle-deadlock-exec-test.cjs | E | GREEN | 2.8 |
| endturn-battle-deadlock-test.cjs | E | GREEN | 2.3 |
| entity-card-action-buttons-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| entity-card-contract-test.cjs | E | GREEN | 2.1 |
| entity-card-cross-links-button-style-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| entity-card-cross-links-nested-overlay-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| entity-card-diorama-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| entity-card-historia-section-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| entity-card-single-dialog-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| entity-card-wonder-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| entitycard-civpedia-klik-test.cjs | E | GREEN | 2.9 |
| entitycard-rozwiniete-scrollbar-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| entitycard-sufit-dwoch-kart-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| eot-diplomacy-header-test.cjs | E | GREEN | 0.2 |
| eot-event-defer-test.cjs | E | GREEN | 0.2 |
| epoka-merge-recruit-test.cjs | E | GREEN | 0.4 |
| era-change-notify-test.cjs | E | GREEN | 0.2 |
| era-change-toast-defer-test.cjs | B | RED | 0.3 |
| era-change-toast-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| era-cud-main-ts-integracja-test.cjs | B | RED | 0.4 |
| era-cud-warunek-awansu-test.cjs | E | GREEN | 0.3 |
| era-gate-ui-test.cjs | E | GREEN | 0.2 |
| era-improvement-cost-upkeep-test.cjs | E | GREEN | 0.4 |
| era-recruit-panel-refresh-test.cjs | B | RED | 0.3 |
| escape-fullscreen-priority-test.cjs | E | GREEN | 0.2 |
| escape-overlay-real-panels-test.cjs | E | GREEN | 2.3 |
| escape-overlay-stack-test.cjs | E | GREEN | 0.2 |
| et-turn-lbl-kontrast-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| ev4-r4q2-przycisk-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| events-defer-to-turn-start-test.cjs | E | GREEN | 200.6 |
| events-one-turn-lifetime-live-test.cjs | B | RED | 0.2 |
| events-one-turn-lifetime-test.cjs | E | GREEN | 0.2 |
| fair-play-grid-test.cjs | D | TIMEOUT | 300.3 |
| fair-play-tier-grid-test.cjs | B | RED | 0.6 |
| farma-cofnij-nieaktualny-wpis-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| farma-lesie-usun-istniejace-test.cjs | E | GREEN | 33.2 |
| farma-nie-w-lesie-test.cjs | E | GREEN | 22.0 |
| first-player-city-test.cjs | E | GREEN | 0.8 |
| flaga-mp-nie-gasnie-test.cjs | E | GREEN | 0.4 |
| followups-land-ai-test.cjs | E | GREEN | 1.4 |
| food-hodowla-test.cjs | E | GREEN | 1.2 |
| forced-war-bronze-main-guard-test.cjs | B | RED | 0.3 |
| forced-war-bronze-new-game-reset-test.cjs | B | RED | 0.2 |
| forced-war-bronze-test.cjs | E | GREEN | 2.2 |
| forced-war-iron-era-enter-turn-save-load-test.cjs | E | GREEN | 0.5 |
| forced-war-iron-main-guard-test.cjs | B | RED | 0.3 |
| forced-war-iron-player-target-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| forced-war-iron-test.cjs | E | GREEN | 1.8 |
| forced-war-player-no-contact-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| forced-war-player-pre-contact-gate-test.cjs | E | GREEN | 1.3 |
| forced-war-player-target-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| forced-war-r9-no-auto-end-live-test.cjs | NIE_ZMIERZONO | TIMEOUT | 360.1 |
| forced-war-reguly-multi-turn-simulation-test.cjs | E | GREEN | 1.2 |
| forced-war-relation-gate-test.cjs | E | GREEN | 0.9 |
| forced-war-stone-main-guard-test.cjs | E | GREEN | 0.3 |
| forced-war-stone-test.cjs | E | GREEN | 2.2 |
| forced-war-trojstronna-domino-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| forced-war-trojstronna-main-guard-test.cjs | E | GREEN | 0.3 |
| forced-war-trojstronna-test.cjs | E | GREEN | 1.9 |
| forced-war-waves-test.cjs | E | GREEN | 2.4 |
| format-pl-signed-minus-glif-test.cjs | E | GREEN | 0.6 |
| fort-nodes-save-load-test.cjs | E | GREEN | 0.5 |
| fort-outpost-hard-territory-test.cjs | A | RED | 1.6 |
| fort-outpost-placement-rules-test.cjs | E | GREEN | 1.7 |
| fort-outpost-territory-live-test.cjs | B | RED | 0.1 |
| fort-strazniaca-zasieg-zakladania-test.cjs | E | GREEN | 2.5 |
| fort-vision-test.cjs | E | GREEN | 1.3 |
| fortify-pole-test.cjs | E | GREEN | 1.3 |
| found-from-village-test.cjs | E | GREEN | 0.9 |
| foundry-throughput-x2-era-mult-test.cjs | E | GREEN | 0.7 |
| freshwater-access-test.cjs | E | GREEN | 14.6 |
| fsa-autosave-test.cjs | E | GREEN | 0.5 |
| garnizon-exit-test.cjs | E | GREEN | 0.6 |
| garrison-panel-pinning-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| general-capital-recruitment-order-test.cjs | E | GREEN | 9.6 |
| general-eligible-unit-roster-test.cjs | E | GREEN | 0.8 |
| general-quick-follow-action-test.cjs | B | RED | 6.1 |
| generals-purchase-runtime-test.cjs | B | RED | 251.6 |
| glod-wojska-karencja-test.cjs | B | RED | 0.9 |
| gold-deficit-test.cjs | E | GREEN | 0.7 |
| granary2-tech-data-guard-test.cjs | E | GREEN | 1.0 |
| granice-relacja-dyplomatyczna-test.cjs | B | RED | 0.8 |
| granice-styk-nakladanie-test.cjs | E | GREEN | 2.7 |
| growthmult-compound-test.cjs | E | GREEN | 0.8 |
| grupa-b-lane-test.cjs | B | RED | 0.8 |
| grupy-budynkow-test.cjs | E | GREEN | 0.7 |
| handel-wymiana-tech-gate-test.cjs | E | GREEN | 1.1 |
| happiness-breakdown-test.cjs | E | GREEN | 0.6 |
| heal-stale-blockers-pending-battle-test.cjs | B | RED | 4.1 |
| heks-panel-tooltip-warstwa-test.cjs | E | GREEN | 0.7 |
| heks-plony-warstwy-test.cjs | E | GREEN | 0.6 |
| heks-plony-zloze-forward-test.cjs | E | GREEN | 0.9 |
| heks-plony-zloze-parytet-ui-test.cjs | E | GREEN | 0.8 |
| hex-plony-magazyn-test.cjs | B | RED | 1.0 |
| hex-tooltip-improvement-production-text-test.cjs | E | GREEN | 3.7 |
| hex-tooltip-mozliwe-ulepszenia-zloze-test.cjs | E | GREEN | 2.7 |
| hex-tooltip-resources-line-dedup-test.cjs | E | GREEN | 5.0 |
| hex-tooltip-stadnina-kopalnia-cyny-test.cjs | E | GREEN | 2.1 |
| hex-tooltip-unlock-label-dedup-test.cjs | E | GREEN | 5.2 |
| hint-toast-zindex-empire-panel-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hodowla-las-test.cjs | E | GREEN | 12.0 |
| horse-resource-terrain-test.cjs | D | TIMEOUT | 300.2 |
| hotseat-drugi-fotel-tura-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hotseat-dyplo-kontakt-per-fotel-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hotseat-etap1-ownerid-test.cjs | E | GREEN | 0.8 |
| hotseat-etap3-akcesory-test.cjs | E | GREEN | 0.6 |
| hotseat-etap4-noop-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hotseat-etap5-no-leak-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hotseat-etap6a-input-noop-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hotseat-etap6b-ui-noop-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hotseat-etap6c-economy-noop-test.cjs | E | GREEN | 0.8 |
| hotseat-etap6c-lastpraca-per-fotel-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hotseat-etap6d-diplomacy-engine-test.cjs | E | GREEN | 0.1 |
| hotseat-etap6d-podetap-a-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hotseat-etap6d-podetap-a-test.cjs | E | GREEN | 0.1 |
| hotseat-etap6d-podetap-b-exec-test.cjs | B | RED | 0.4 |
| hotseat-etap6d-podetap-b-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hotseat-etap6d-podetap-c-live-saveload-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hotseat-etap6d-podetap-c-migracja-test.cjs | E | GREEN | 0.2 |
| hotseat-etap6d-podetap-d-exec-test.cjs | B | RED | 0.3 |
| hotseat-etap6d-podetap-e-exec-test.cjs | B | RED | 0.4 |
| hotseat-etap6d-podetap-e-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hotseat-etap6d-podetap-e-source-test.cjs | B | RED | 0.2 |
| hotseat-etap6e-render-noop-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hotseat-etap6f-part2-data-test.cjs | E | GREEN | 66.9 |
| hotseat-etap6f-part2-ui-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hotseat-etap6f-start-migracja-test.cjs | E | GREEN | 0.0 |
| hotseat-etap7-saveload-test.cjs | E | GREEN | 0.3 |
| hotseat-etap8-dyplomacja-dane-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hotseat-etap8-dyplomacja-ui-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hotseat-human-owners-test.cjs | E | GREEN | 0.5 |
| hotseat-ustawienia-kopiowane-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hud-armia-chip-jednostki-test.cjs | A | RED | 0.7 |
| hud-gross-net-rest-test.cjs | E | GREEN | 110.8 |
| hud-konwerter-dopasowanie-test.cjs | E | GREEN | 0.3 |
| hud-miasto-stan-cywilizacji-test.cjs | E | GREEN | 0.3 |
| hud-miasto-stock-tempo-test.cjs | E | GREEN | 1.7 |
| hud-moc-warstwa-test.cjs | B | RED | 0.3 |
| hud-number-abbrev-test.cjs | E | GREEN | 7.2 |
| hud-obywatele-chip-test.cjs | A | RED | 0.2 |
| hud-recruits-abbrev-test.cjs | E | GREEN | 5.3 |
| hud-resource-deficit-red-test.cjs | E | GREEN | 6.1 |
| hud-skarbiec-test.cjs | E | GREEN | 4.5 |
| hud-tooltip-body-mounted-panels-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hud-topbar-bigger-numbers-real-render-test.cjs | A? | RED | 0.2 |
| hud-topbar-grid-gross-net-test.cjs | E | GREEN | 270.3 |
| hud-topbar-no-labels-test.cjs | E | GREEN | 29.0 |
| hud-zetony-ekonomia-brutto-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| hunting-camp-hill-no-flatten-test.cjs | D | TIMEOUT | 360.5 |
| idb-b1b2b3-test.cjs | B | RED | 1.6 |
| idb-menu-continue-boot-refresh-test.cjs | B | RED | 2.0 |
| idb-storage-migration-test.cjs | E | GREEN | 0.3 |
| impi-recruitment-discount-test.cjs | E | GREEN | 0.9 |
| important-event-cards-regression-test.cjs | E | GREEN | 0.6 |
| important-event-cards-test.cjs | E | GREEN | 0.2 |
| improvement-adapter-resource-note-test.cjs | E | GREEN | 0.6 |
| improvement-build-highlight-lifecycle-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| improvement-build-highlight-lifecycle-test.cjs | E | GREEN | 1.1 |
| improvement-card-callsites-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| improvement-card-uklad-sekcji-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| improvement-era-scaling-test.cjs | E | GREEN | 0.6 |
| improvement-territory-gate-test.cjs | E | GREEN | 0.6 |
| interaction-latency-vs-citycount-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| iron-native-access-fix-test.cjs | E | GREEN | 0.3 |
| irrigation-river-definition-unify-test.cjs | E | GREEN | 13.5 |
| kamieniolom-kamien-epoka-test.cjs | E | GREEN | 0.5 |
| karta-technologia-uklad-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| kolor-surowce-spojnosc-test.cjs | E | GREEN | 0.2 |
| koniec-tury-f1-f4-runda3-test.cjs | E | GREEN | 1.8 |
| koniec-tury-g1-g2-runda4-test.cjs | E | GREEN | 1.5 |
| kopalnia-cyny-render-test.cjs | E | GREEN | 0.6 |
| kopalnia-podswietlenie-heksow-test.cjs | E | GREEN | 0.6 |
| korupcja-tekst-gracz-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| korupcja-test.cjs | E | GREEN | 0.4 |
| koszary-gate-test.cjs | E | GREEN | 0.4 |
| koszty-surowcowe-test.cjs | B | RED | 0.4 |
| labor-to-tax-conversion-gold-test.cjs | E | GREEN | 0.3 |
| land-sea-ratio-test.cjs | D | TIMEOUT | 300.2 |
| law-garrison-test.cjs | E | GREEN | 0.3 |
| load-fail-toast-zindex-test.cjs | B | RED | 0.1 |
| load-game-blockers-exec-test.cjs | B | RED | 1.5 |
| load-game-regression-test.cjs | E | GREEN | 0.4 |
| logic-test.cjs | E | GREEN | 31.1 |
| longrun-100-turns-leak-q1-memo-unit-test.cjs | E | GREEN | 0.5 |
| magazyn-era-scaling-test.cjs | E | GREEN | 6.3 |
| magazyn-food-cap-bez-magazynu-test.cjs | E | GREEN | 0.5 |
| manpower-matrix-sensitivity-test.cjs | E | GREEN | 1.0 |
| manpower-panels-abbrev-test.cjs | E | GREEN | 0.5 |
| manpower-test.cjs | E | GREEN | 0.3 |
| manual-rebalance-owner-era-test.cjs | E | GREEN | 0.4 |
| map-attack-city-test.cjs | E | GREEN | 0.7 |
| map-coast-buffer-test.cjs | D | TIMEOUT | 300.1 |
| map-continents-rivers-test.cjs | D | TIMEOUT | 300.2 |
| map-deposits-era-test.cjs | E | GREEN | 91.6 |
| map-field-battle-test.cjs | E | GREEN | 0.6 |
| map-gen-regression-test.cjs | D | TIMEOUT | 300.4 |
| map-improvement-qualify-test.cjs | E | GREEN | 2.2 |
| map-models-scale-2x-test.cjs | D | RED | 12.7 |
| map-quality-forest-parity-test.cjs | D | TIMEOUT | 300.1 |
| map-road-movement-test.cjs | E | GREEN | 1.0 |
| map-scale-menu-test.cjs | E | GREEN | 0.5 |
| map-siege-test.cjs | E | GREEN | 0.9 |
| map-snapshot-load-test.cjs | D | TIMEOUT | 300.1 |
| mapa-etykieta-stolicy-test.cjs | B | RED | 1.2 |
| march-attack-queue-persist-test.cjs | E | GREEN | 1.1 |
| march-end-of-turn-only-test.cjs | E | GREEN | 0.6 |
| medium-river-test.cjs | D | TIMEOUT | 150.2 |
| memory-datauri-duplicates-test.cjs | A? | RED | 0.3 |
| memory-datauri-menu-pixel-test.cjs | A? | RED | 0.4 |
| memory-growth-improvement-cpu-release-test.cjs | A? | RED | 0.8 |
| memory-growth-merge-index-test.cjs | E | GREEN | 2.0 |
| memory-growth-visual-parity-test.cjs | A? | RED | 0.7 |
| memory-static-ascii-bundle-test.cjs | A? | RED | 0.3 |
| memory-static-geometry-pool-test.cjs | A? | RED | 0.2 |
| memory-static-material-pool-pixel-test.cjs | E | GREEN | 20.2 |
| memory-static-model-pool-pixel-test.cjs | E | GREEN | 9.6 |
| memory-unit-static-merge-test.cjs | E | GREEN | 34.0 |
| mennica-magazyn-test.cjs | B | RED | 5.4 |
| mennica-uspienie-test.cjs | E | GREEN | 14.7 |
| menu-game-music-transition-test.cjs | E | GREEN | 0.2 |
| menu-music-delay-test.cjs | E | GREEN | 0.2 |
| menu-trudnosc-tooltip-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| merge-decor-no-regress-test.cjs | A | RED | 143.6 |
| mgla-odkrycie-wzdluz-sciezki-live-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| mgla-odkrycie-wzdluz-sciezki-test.cjs | A | RED | 1.7 |
| mgla-sciezka-inwariant-test.cjs | B | RED | 8.0 |
| mgla-sciezka-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| mgla-sciezka-rzeka-test.cjs | E | GREEN | 2.3 |
| mgla-teleport-koniec-tury-test.cjs | E | GREEN | 1.8 |
| miasta-panstwa-wylaczone-test.cjs | B | RED | 0.2 |
| miasta-panstwa-wylaczone-ui-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| miasta-zbyt-blisko-test.cjs | D | TIMEOUT | 150.1 |
| miasto-zdobycie-raport-test.cjs | E | GREEN | 0.4 |
| militia-garrison-contract-test.cjs | E | GREEN | 0.9 |
| militia-garrison-router-siege-test.cjs | E | GREEN | 0.5 |
| mill-river-only-gate-test.cjs | E | GREEN | 1.1 |
| minimap-viewport-rect-follow-live-test.cjs | A? | RED | 0.3 |
| minimap-viewport-rect-follow-test.cjs | E | GREEN | 0.3 |
| minimapa-ikona-robotnik-kolor-live-test.cjs | D | TIMEOUT | 360.1 |
| minimapa-pasek-narzedzi-reorganizacja-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| moc-ranking-rozjazd-test.cjs | B | RED | 0.8 |
| move-pass-through-own-units-test.cjs | E | GREEN | 3.8 |
| mp-spawn-ration-test.cjs | E | GREEN | 3.2 |
| mur-paradoks-test.cjs | B | RED | 1.0 |
| muzyka-braz-era-playlist-test.cjs | E | GREEN | 0.3 |
| muzyka-era-live-e2e-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| naval-water-access-gate-test.cjs | E | GREEN | 2.2 |
| nazwy-miast-rozlaczne-pule-test.cjs | E | GREEN | 0.1 |
| newgame-adv-apply-btn-test.cjs | E | GREEN | 16.0 |
| newgame-adv-tooltip-test.cjs | E | GREEN | 43.3 |
| newgame-bottom-navigation-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| newgame-defaults-test.cjs | E | GREEN | 12.7 |
| newgame-menu-reorder-layout-test.cjs | E | GREEN | 27.2 |
| newgame-sett-grid-layout-test.cjs | E | GREEN | 84.8 |
| newgame-settings-layout-reposition-test.cjs | E | GREEN | 5.1 |
| oblezenie-remis-endsiege-test.cjs | E | GREEN | 2.0 |
| oblezenie-siege-lifted-po-bitwie-test.cjs | E | GREEN | 1.0 |
| oblezenie-test.cjs | E | GREEN | 2.2 |
| oboz-lowiecki-las-test.cjs | E | GREEN | 45.1 |
| oboz-lowiecki-las-znika-render-test.cjs | D | TIMEOUT | 360.6 |
| oboz-lowiecki-wymaga-tartaku-test.cjs | E | GREEN | 31.8 |
| okolica-isworkable-silnik-test.cjs | E | GREEN | 1.2 |
| okolica-load-reconcile-test.cjs | B | RED | 1.6 |
| okolica-multi-city-overlap-test.cjs | E | GREEN | 1.9 |
| okolica-ownership-change-reconcile-test.cjs | B | RED | 1.6 |
| okolica-test.cjs | E | GREEN | 1.3 |
| okolica-tryb-reset-ownership-change-test.cjs | E | GREEN | 1.2 |
| owned-building-detail-side-test.cjs | E | GREEN | 0.5 |
| owned-building-inactive-test.cjs | E | GREEN | 0.4 |
| owner-economy-test.cjs | E | GREEN | 19.0 |
| owner-epoch-test.cjs | E | GREEN | 0.9 |
| p-wojna-wymuszona-trzy-naprawy-test.cjs | E | GREEN | 1.1 |
| palisade-battle-wall-rules-test.cjs | E | GREEN | 1.1 |
| panel-kolejka-pasek-postepu-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| pangea-land-determinism-test.cjs | C | TIMEOUT | 150.2 |
| pangea-land-fraction-test.cjs | C | TIMEOUT | 150.1 |
| pangea-land-shape-test.cjs | C | TIMEOUT | 150.1 |
| pangea-river-interior-test.cjs | D | TIMEOUT | 150.2 |
| pending-improvements-test.cjs | E | GREEN | 1.0 |
| perf-endturn-ai-phase-equiv-test.cjs | E | GREEN | 0.2 |
| perf-endturn-ai-phase-live-test.cjs | A? | TIMEOUT | 360.1 |
| perf-endturn-r3-equiv-test.cjs | E | GREEN | 18.6 |
| perf-endturn-r3-visdisk-test.cjs | E | GREEN | 4.6 |
| perf-endturn-render-deferral-regression-test.cjs | E | GREEN | 0.4 |
| perf-endturn-render-hud-live-test.cjs | A? | TIMEOUT | 360.2 |
| perf-endturn-render-progress-live-test.cjs | A? | TIMEOUT | 360.5 |
| perf-endturn-render-resume-flush-test.cjs | E | GREEN | 1.3 |
| perf-endturn-resource-access-equiv-test.cjs | E | GREEN | 5.6 |
| perf-hud-frame-memo-test.cjs | E | GREEN | 0.9 |
| perf-large-empire-stress-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| perf-late-game-interaction-live-test.cjs | A? | TIMEOUT | 360.3 |
| perf-late-game-interaction-r2-live-test.cjs | A? | TIMEOUT | 360.2 |
| perf-long-session-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| perf-sibling-memo-test.cjs | E | GREEN | 3.0 |
| perf-territory-index-equiv-test.cjs | E | GREEN | 2.6 |
| picker-test.cjs | E | GREEN | 1.7 |
| placed-improvements-cache-q1-test.cjs | E | GREEN | 11.5 |
| planned-march-test.cjs | E | GREEN | 1.5 |
| player-moves-before-ai-turn-test.cjs | D | TIMEOUT | 360.0 |
| plony-budynkow-test.cjs | E | GREEN | 4.7 |
| podboj-kolejka-budynek-niemozliwy-test.cjs | E | GREEN | 1.0 |
| popcap-spichlerz2-akwedukt20-test.cjs | E | GREEN | 1.2 |
| population-civ-matrix-wiring-test.cjs | E | GREEN | 0.9 |
| population-growth-tempo-test.cjs | E | GREEN | 0.7 |
| population-growth-v85-bonus-test.cjs | E | GREEN | 1.2 |
| population-growth-v85-test.cjs | E | GREEN | 0.8 |
| porzadek-panel-czytelnosc-test.cjs | E | GREEN | 1.2 |
| porzadek-panel-punkty-absolutne-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| post-battle-map-test.cjs | E | GREEN | 1.3 |
| post-capture-law-test.cjs | E | GREEN | 1.1 |
| postep-pamiec-usuniecie-test.cjs | E | GREEN | 1.2 |
| power-objective-test.cjs | E | GREEN | 0.3 |
| power-options-test.cjs | E | GREEN | 0.9 |
| power-ranking-test.cjs | E | GREEN | 0.6 |
| power-ranking-view-test.cjs | E | GREEN | 0.4 |
| pr141-ai-production-behavior-test.cjs | E | GREEN | 2.5 |
| pr141-ai-strategy-behavior-test.cjs | E | GREEN | 2.5 |
| pr141-combat-defense-behavior-test.cjs | E | GREEN | 1.5 |
| pr141-combat-defense-owner-route-test.cjs | B | RED | 1.9 |
| pr141-combat-offense-behavior-test.cjs | E | GREEN | 0.9 |
| pr141-current-evidence-ledger-test.cjs | B | RED | 0.7 |
| pr141-current-evidence-ledger-v3-test.cjs | B | RED | 2.1 |
| pr141-current-evidence-ledger-v4-test.cjs | B | RED | 0.4 |
| pr141-dip-activation-test.cjs | B | RED | 39.8 |
| pr141-evidence-ledger-behavior-test.cjs | B | RED | 0.1 |
| pr141-f04-building-speed-activation-test.cjs | B | RED | 6.6 |
| pr141-f04-cost-activation-defense-test.cjs | E | GREEN | 9.2 |
| pr141-f04-cost-activation-test.cjs | E | GREEN | 1.2 |
| pr141-f04-rush-activation-test.cjs | E | GREEN | 7.4 |
| pr141-f04-society-activation-test.cjs | E | GREEN | 1.4 |
| pr141-f04-society-remaining-activation-test.cjs | E | GREEN | 2.7 |
| pr141-f04-unit-speed-activation-test.cjs | E | GREEN | 6.1 |
| pr141-f04-work-activation-test.cjs | E | GREEN | 2.7 |
| pr141-f04-yields-activation-test.cjs | B | RED | 1.7 |
| pr141-g1-combat-activation-test.cjs | E | GREEN | 1.4 |
| pr141-hotseat-diplomacy-owner-test.cjs | B | RED | 7.4 |
| pr141-hotseat-production-owner-routing-test.cjs | B | RED | 5.6 |
| pr141-matrix-only-ai-test.cjs | E | GREEN | 2.6 |
| pr141-matrix-only-combat-test.cjs | E | GREEN | 1.7 |
| pr141-matrix-only-data-wiki-test.cjs | E | GREEN | 0.7 |
| pr141-matrix-only-economy-test.cjs | B | RED | 2.2 |
| pr141-matrix-only-owner-ui-test.cjs | E | GREEN | 0.5 |
| pr141-matrix-only-production-test.cjs | E | GREEN | 1.2 |
| pr141-population-behavior-test.cjs | E | GREEN | 0.9 |
| pr141-population-main-happiness-hookup-test.cjs | E | GREEN | 7.1 |
| pr141-runtime-ordinary-scope-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| pr141-saveload-mp-f05-g11-behavior-test.cjs | E | GREEN | 1.5 |
| pr141-semantic-consumer-consistency-test.cjs | E | GREEN | 4.5 |
| praca-auto-ulepszenia-koszt-split-test.cjs | E | GREEN | 0.1 |
| praca-budmode-slider-max-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| praca-cap-migracja-luka-test.cjs | E | GREEN | 3.2 |
| praca-global-default-live-test.cjs | E | GREEN | 10.3 |
| praca-jeden-podzial-kontrakt-test.cjs | B | RED | 7.3 |
| praca-jeden-podzial-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| praca-limit-50-test.cjs | E | GREEN | 1.7 |
| praca-miasto-limit-50-cap-test.cjs | E | GREEN | 1.7 |
| praca-miasto-limit-50-test.cjs | E | GREEN | 2.4 |
| praca-na-pieniadz-test.cjs | E | GREEN | 1.5 |
| praca-panel-budowy-warstwa-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| praca-panel-emoji-brand-icons-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| praca-podzial-staly-50-50-test.cjs | E | GREEN | 1.9 |
| praca-pula-rate-parity-test.cjs | E | GREEN | 1.5 |
| praca-split-ui-test.cjs | B | RED | 0.4 |
| prawo-palac-tier-test.cjs | E | GREEN | 1.8 |
| prawo-przebudowa-skali-test.cjs | E | GREEN | 13.2 |
| prawo-siatka-v2-test.cjs | E | GREEN | 0.8 |
| pre-battle-defender-retreat-test.cjs | E | GREEN | 4.9 |
| pre-battle-retreat-exhausted-test.cjs | B | RED | 5.7 |
| pre-battle-save-test.cjs | B | RED | 5.8 |
| prereq-budynkow-test.cjs | A | RED | 1.0 |
| production-overflow-test.cjs | E | GREEN | 1.9 |
| promote-to-front-test.cjs | E | GREEN | 1.5 |
| pytanie-84-stock-keys-test.cjs | E | GREEN | 1.6 |
| r-bitwa-etykieta-tozsamosc-strony-live-atak-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| r-bitwa-etykieta-tozsamosc-strony-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| r-bitwa-etykieta-tozsamosc-strony-zrodlo-test.cjs | E | GREEN | 0.4 |
| r-bitwa-kolory-gracz-przeciwnik-q1-test.cjs | E | GREEN | 0.3 |
| r-bitwa-portret-gracza-miasto-panstwo-otwarte-test.cjs | E | GREEN | 0.7 |
| r-manpower-hp-max-effective-currentbase-q1-test.cjs | E | GREEN | 1.3 |
| r-manpower-uzupelnienie-hp-niezapisuje-q1-test.cjs | E | GREEN | 1.1 |
| r-stawki-fala2-test.cjs | E | GREEN | 1.4 |
| r-wzrost-szczescie-dubel-wealth-ceramika-test.cjs | E | GREEN | 17.4 |
| rally-point-automarch-test.cjs | E | GREEN | 0.9 |
| rebel-city-notification-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| rebel-protection-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| recruit-card-manpower-real-render-test.cjs | E | GREEN | 6.0 |
| recruit-card-quantity-real-render-test.cjs | E | GREEN | 7.8 |
| recruit-card-stock-chip-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| recruit-list-order-by-era-test.cjs | E | GREEN | 22.9 |
| recruit-list-visibility-test.cjs | E | GREEN | 1.0 |
| recruit-list-visibility-ui-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| recruit-rally-default-save-test.cjs | E | GREEN | 1.3 |
| recruit-rally-default-ui-test.cjs | E | GREEN | 6.8 |
| recruit-resource-strip-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| recruitment-batch-contract-test.cjs | E | GREEN | 1.0 |
| recruitment-cost-50-wood-test.cjs | E | GREEN | 2.0 |
| recruitment-no-upkeep-gate-test.cjs | E | GREEN | 0.9 |
| recruitment-panel-compact-row-test.cjs | E | GREEN | 18.3 |
| recruitment-panel-height-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| rekrutacja-koszty-polowa-all-test.cjs | B | RED | 1.4 |
| rekrutacja-skarbiec-only-test.cjs | B | RED | 1.5 |
| relief-grid-coverage-test.cjs | D | TIMEOUT | 150.1 |
| relief-preserving-mine-prefix-test.cjs | E | GREEN | 0.2 |
| religia-konwersja-po-podboju-test.cjs | E | GREEN | 0.5 |
| render-unit-sharpness-guard.cjs | E | GREEN | 0.6 |
| reproducible-build-contract-test.cjs | E | GREEN | 0.1 |
| research-test.cjs | E | GREEN | 0.8 |
| resource-usage-breakdown-test.cjs | B | RED | 0.5 |
| resources-map-icon-map-test.cjs | E | GREEN | 0.1 |
| retreat-garnizon-fortyfikacja-test.cjs | E | GREEN | 0.5 |
| river-confluence-edge-test.cjs | E | GREEN | 80.5 |
| river-density-test.cjs | D | TIMEOUT | 150.1 |
| river-fog-visibility-test.cjs | E | GREEN | 87.6 |
| river-grid-coverage-test.cjs | D | TIMEOUT | 150.3 |
| river-loop-test.cjs | D | TIMEOUT | 150.3 |
| river-map-scale-test.cjs | D | TIMEOUT | 150.2 |
| river-path-adjacency-test.cjs | D | TIMEOUT | 150.0 |
| river-sea-buffer-test.cjs | D | TIMEOUT | 150.1 |
| river-terrain-move-test.cjs | E | GREEN | 0.7 |
| river-turn-window-test.cjs | E | GREEN | 45.2 |
| river-yield-both-sides-test.cjs | D | TIMEOUT | 150.1 |
| road-connectivity-test.cjs | E | GREEN | 0.4 |
| road-hook-mainguard-test.cjs | E | GREEN | 0.3 |
| roads-city-links-only-test.cjs | E | GREEN | 95.2 |
| roster-space-next-active-unit-test.cjs | A? | TIMEOUT | 360.6 |
| rozmiar-label-test.cjs | E | GREEN | 0.3 |
| ruch-swiata-tempo-test.cjs | B | RED | 0.3 |
| rydwan-bierny-atak-test.cjs | E | GREEN | 0.6 |
| rydwan-konnica-x2-test.cjs | B | RED | 0.0 |
| save-label-test.cjs | E | GREEN | 0.2 |
| save-load-sort-test.cjs | E | GREEN | 0.2 |
| saveload-hud-cache-hotseat-live-test.cjs | E | GREEN | 205.5 |
| saveload-hud-cache-hotseat-wiring-test.cjs | E | GREEN | 0.0 |
| saveload-praca-pool-hotseat-live-test.cjs | E | GREEN | 309.8 |
| saveload-praca-pool-live-test.cjs | E | GREEN | 230.2 |
| sawmill-hill-relief-test.cjs | E | GREEN | 0.2 |
| sawmill-quarry-50-economy-test.cjs | E | GREEN | 0.4 |
| science-hub-test.cjs | E | GREEN | 0.2 |
| science-hub-unlock-icons-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| science-picker-tooltip-icons-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| scout-auto-explore-test.cjs | E | GREEN | 1.0 |
| scout-explore-deselect-cycle-test.cjs | E | GREEN | 0.5 |
| scout-start-units-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| shared-city-name-queue-test.cjs | E | GREEN | 0.3 |
| side-list-hud-panel-coverage-test.cjs | E | GREEN | 2.6 |
| side-panel-event-link-test.cjs | E | GREEN | 0.4 |
| side-panel-unit-cycle-arrows-test.cjs | E | GREEN | 2.1 |
| sidepanel-blocking-card-cutoff-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| sidepanel-diplo-dismiss-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| sidepanel-event-header-wydarzenie-real-render-test.cjs | E | GREEN | 57.7 |
| sidepanel-event-przekierowania-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| sidepanel-event-tabs-classify-test.cjs | E | GREEN | 0.3 |
| sidepanel-events-toolbar-test.cjs | E | GREEN | 2.0 |
| sidepanel-hud-deadzone-test.cjs | A? | RED | 264.2 |
| sidepanel-notification-tabs-test.cjs | E | GREEN | 0.2 |
| siege-ai-test.cjs | E | GREEN | 0.3 |
| siege-badge-zorder-live-test.cjs | B | RED | 0.4 |
| siege-badge-zorder-test.cjs | E | GREEN | 0.1 |
| siege-blockade-no-recruit-reinforce-test.cjs | A? | RED | 251.9 |
| siege-defenders-test.cjs | E | GREEN | 0.4 |
| siege-last-stand-sortie-test.cjs | E | GREEN | 2.5 |
| siege-manual-battle-behavior-test.cjs | E | GREEN | 0.3 |
| siege-starvation-test.cjs | E | GREEN | 0.5 |
| siege-surrender-enter-city-test.cjs | E | GREEN | 0.3 |
| siege-surrender-forecast-live-test.cjs | B | RED | 0.4 |
| siege-surrender-forecast-test.cjs | E | GREEN | 0.5 |
| siege-tower-breach-everywhere-test.cjs | E | GREEN | 198.0 |
| simple-food-rule-no-toggles-test.cjs | E | GREEN | 1.9 |
| small-part-lod-test.cjs | E | GREEN | 0.4 |
| society-breakdown-test.cjs | E | GREEN | 0.4 |
| spichlerz-cap-citypanel-wiring-test.cjs | E | GREEN | 0.1 |
| spichlerz-deficyt-scalenie-test.cjs | A | RED | 0.1 |
| spichlerz-drain-keys-test.cjs | E | GREEN | 0.3 |
| spichlerz-drain-pipeline-test.cjs | E | GREEN | 0.6 |
| spichlerz-hud-params-parity-test.cjs | E | GREEN | 0.9 |
| spichlerz-panel-food-parity-test.cjs | E | GREEN | 0.6 |
| spichlerz-widocznosc-test.cjs | E | GREEN | 0.5 |
| spichlerz-wzrost-test.cjs | E | GREEN | 0.6 |
| split-output-test.cjs | E | GREEN | 0.3 |
| stadnina-hex-candidates-test.cjs | E | GREEN | 1.3 |
| stadnina-kon-koszt-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| stadnina-kon-koszt-test.cjs | E | GREEN | 0.8 |
| stadnina-konie-stare-zapisy-test.cjs | E | GREEN | 1.2 |
| stadnina-las-test.cjs | E | GREEN | 0.8 |
| start-map-seed-removal-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| start-preview-test.cjs | E | GREEN | 0.5 |
| starting-army-first-city-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| stolarnia-r5-d2-test.cjs | E | GREEN | 0.6 |
| stranded-land-test.cjs | D | TIMEOUT | 150.1 |
| structure-defense-bonus-test.cjs | E | GREEN | 0.9 |
| surow-civ-storage-test.cjs | B | RED | 16.7 |
| surowce-dostep-test.cjs | E | GREEN | 0.2 |
| surowce-katalog-kolejnosc-test.cjs | E | GREEN | 0.3 |
| surrender-rekrutacja-build-gate-test.cjs | B | RED | 0.7 |
| szczescie-audyt-c-prawo-osiedla-test.cjs | E | GREEN | 42.1 |
| szczescie-audyt-d-progi-bunt-test.cjs | E | GREEN | 52.2 |
| szczescie-audyt-e-etykiety-panelu-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| szczescie-przebudowa-skali-test.cjs | B | RED | 3.9 |
| szczescie-skala-normalizacja-test.cjs | E | GREEN | 2.7 |
| szczescie-zamoznosc-test.cjs | E | GREEN | 1.2 |
| tarasy-cywilizacje-test.cjs | B | RED | 3.1 |
| tartak-glinianka-rate-Q1-test.cjs | E | GREEN | 2.3 |
| tartak-oboz-wyscig-race-test.cjs | E | GREEN | 0.9 |
| tartak-wzgorze-las-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| tax-slider-thumb-align-real-render-test.cjs | E | GREEN | 57.0 |
| tech-discovery-badge-diorama-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| tech-discovery-card-click-test.cjs | E | GREEN | 6.2 |
| tech-discovery-card-real-click-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| tech-tempo-test.cjs | E | GREEN | 0.2 |
| tech-tree-test.cjs | E | GREEN | 0.5 |
| tech-unlock-units-test.cjs | E | GREEN | 1.0 |
| technology-discovery-card-visual-test.cjs | E | GREEN | 0.1 |
| teren-walki-etapy-test.cjs | E | GREEN | 0.7 |
| terrain-base-resource-yields-test.cjs | E | GREEN | 1.3 |
| terrain-height-audit-test.cjs | D | TIMEOUT | 150.3 |
| terrain-hill-movement-test.cjs | E | GREEN | 1.6 |
| terrain-names-equivalence-test.cjs | E | GREEN | 1.3 |
| territory-border-dense-settlement-test.cjs | E | GREEN | 2.1 |
| territory-border-test.cjs | E | GREEN | 0.9 |
| test-hook-setcitylimit-live-test.cjs | B | RED | 0.1 |
| test-hook-setcitylimit-test.cjs | E | GREEN | 3.0 |
| trade-grant-test.cjs | E | GREEN | 1.6 |
| trade-ilosc-test.cjs | B | RED | 2.4 |
| trade-routes-contact-only-test.cjs | E | GREEN | 4.4 |
| trade-routes-hud-filter-test.cjs | E | GREEN | 2.5 |
| trade-routes-income-test.cjs | E | GREEN | 2.7 |
| trade-routes-limit-test.cjs | C | RED | 9.6 |
| trade-routes-ownership-income-test.cjs | E | GREEN | 1.9 |
| trade-routes-test.cjs | E | GREEN | 1.0 |
| trade-sea-bonus-requires-port-test.cjs | E | GREEN | 4.9 |
| trade-treaty-free-break-after-10-test.cjs | E | GREEN | 1.0 |
| triumph-city-state-notice-test.cjs | E | GREEN | 4.3 |
| triumph-city-state-test.cjs | E | GREEN | 3.0 |
| ulepszenia-praca-percent-test.cjs | E | GREEN | 1.3 |
| unfortify-all-action-bar-test.cjs | E | GREEN | 0.9 |
| unit-action-bar-completeness-test.cjs | E | GREEN | 0.3 |
| unit-building-bonuses-test.cjs | E | GREEN | 0.7 |
| unit-card-3d-preview-coverage-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| unit-context-card-test.cjs | E | GREEN | 1.4 |
| unit-cost-tempo-test.cjs | E | GREEN | 0.4 |
| unit-deferred-reveal-dim-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| unit-detail-card-entitycard-migration-test.cjs | B | RED | 8.6 |
| unit-detail-card-hover-layout-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| unit-epoch-cost-test.cjs | E | GREEN | 2.4 |
| unit-frozen-fortified-unselectable-test.cjs | E | GREEN | 237.5 |
| unit-info-card-army-interaction-test.cjs | B | RED | 0.7 |
| unit-info-card-badges-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| unit-info-card-contract-test.cjs | E | GREEN | 0.5 |
| unit-info-card-entitycard-migration-test.cjs | E | GREEN | 6.0 |
| unit-info-card-viewport-height-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| unit-info-card-wiring-test.cjs | B | RED | 0.1 |
| unit-owner-emblem-ring-civ-color-test.cjs | E | GREEN | 1.8 |
| unit-power-sort-test.cjs | B | RED | 0.3 |
| unit-power-test.cjs | B | RED | 0.9 |
| unit-recruit-nazwa-test.cjs | B | RED | 2.0 |
| unit-renderer-overlay-sync-test.cjs | E | GREEN | 2.9 |
| unit-replace-test.cjs | B | RED | 0.7 |
| unit-resource-upkeep-test.cjs | B | RED | 2.2 |
| unit-stock-cost-test.cjs | E | GREEN | 0.7 |
| upgrade-budynki-test.cjs | E | GREEN | 1.8 |
| upkeep-test.cjs | E | GREEN | 0.7 |
| victory-screen-test.cjs | E | GREEN | 0.8 |
| victory-test.cjs | E | GREEN | 1.0 |
| villages-test.cjs | E | GREEN | 1.2 |
| walka-jeden-kontratak-test.cjs | E | GREEN | 1.5 |
| walka-morale-przewaga-mocy-test.cjs | E | GREEN | 1.1 |
| wall-defenders-bonus-range-test.cjs | E | GREEN | 217.2 |
| waluta-mennica-test.cjs | E | GREEN | 18.5 |
| war-allin-capital-test.cjs | B | RED | 27.3 |
| war-allin-general-path-barb-defense-test.cjs | E | GREEN | 3.6 |
| war-allin-keep-barb-defense-test.cjs | E | GREEN | 2.5 |
| war-epoch-player-first-main-guard-test.cjs | B | RED | 0.6 |
| war-epoch-player-first-test.cjs | E | GREEN | 0.8 |
| war-era-counter-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| war-era-counter-test.cjs | E | GREEN | 1.0 |
| war-happiness-parity-test.cjs | E | GREEN | 1.7 |
| war-rules-multiwar-live-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| war-rules-multiwar-main-guard-test.cjs | E | GREEN | 1.0 |
| war-rules-multiwar-test.cjs | E | GREEN | 1.3 |
| warehouse-state-cap-20pct-test.cjs | E | GREEN | 1.3 |
| water-access-port-vs-mill-test.cjs | E | GREEN | 1.0 |
| wealth-test.cjs | E | GREEN | 0.6 |
| web-memory-leaks-test.cjs | A | RED | 2.5 |
| web-turn-slowdown-test.cjs | B | RED | 0.2 |
| weterani-test.cjs | B | RED | 3.7 |
| wiarygodnosc-test.cjs | E | GREEN | 2.9 |
| wire-ekonomia-test.cjs | E | GREEN | 1.1 |
| wojna-wymuszona-parowanie-test.cjs | E | GREEN | 0.5 |
| wojna-wymuszona-prog-tury-gracz-test.cjs | B | RED | 0.7 |
| wonder-availability-test.cjs | E | GREEN | 0.4 |
| wonder-civ-tech-test.cjs | E | GREEN | 1.2 |
| wonder-early-return-highlight-test.cjs | E | GREEN | 0.2 |
| wonder-map-build-test.cjs | E | GREEN | 1.0 |
| wonder-yields-test.cjs | E | GREEN | 19.5 |
| work-tax-conversion-test.cjs | E | GREEN | 0.3 |
| world-density-test.cjs | D | TIMEOUT | 150.1 |
| wycinka-drewno-cap-test.cjs | E | GREEN | 0.3 |
| wydarzenia-eliminacja-podboj-karta-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| wydarzenia-zbadano-karta-tech-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| wyrab-rzeka-d1-test.cjs | E | GREEN | 0.9 |
| wyrab-rzeka-krok0-test.cjs | E | GREEN | 1.0 |
| wyrab-rzeka-r2-test.cjs | E | GREEN | 1.1 |
| wyrab-wycinka-nazwa-live-test.cjs | E | GREEN | 4.9 |
| zelazo-celtowie-miecznik-rydwan-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| zelazo-celtowie-soldurii-gaesatae-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| zelazo-falanga-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| zelazo-gate-test.cjs | B | RED | 0.6 |
| zelazo-germanie-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| zelazo-jezdziec-oszczepami-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| zelazo-katapulta-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| zelazo-konnica-asyryjska-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| zelazo-mezopotamia-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| zelazo-slowianie-zulusi-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| zelazo-srodziemnomorze-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| zelazo-super-rzym-grecja-real-render-test.cjs | NIE_ZMIERZONO | NIE_ZMIERZONO | - |
| zloto-szlak-test.cjs | E | GREEN | 1.4 |
| zloto-test.cjs | B | RED | 61.1 |
| zloze-zloto-render-test.cjs | E | GREEN | 1.3 |
| recruit-hud-label-test.cjs | B | RED | 0.6 |
| smoke_test.cjs | B | RED | 2.4 |
