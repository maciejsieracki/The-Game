# R-WEB-UI-FORTIFICATIONS-HIDE-SUPERSEDED-WALL-BUILD-OPTIONS-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-FORTIFICATIONS-HIDE-SUPERSEDED-WALL-BUILD-OPTIONS-Q1
GOAL: Nowa budowa etapu łańcucha fortyfikacji (upgradeSkip) znika z listy „Dostępne do budowy" i z wyborów automatów (AI / administrator), gdy odblokowany jest tech wyższego etapu: Palisada znika po Murarstwie (Mury kamienne), Mury kamienne znikają po Budownictwie (Mury ceglane). Ulepszenie już zbudowanego niższego etapu zostaje (awans). Cytadela i baszta bez zmian. Baza: 33c888c1a (origin/main).

## ZMIANY / COMMIT
Baza: 33c888c1a770cceea9c78e156dda9c9af44045d4 (detached HEAD w worktree). Commit z kodem i raportem: czubek brancha detached (SHA w polu `sha` wyniku).

Allowlista (zmienione pliki):
- gra/src/game/building-upgrades.ts — nowa funkcja czysta `isFortificationSupersededForBuild(buildingId, unlockedTechIds: ReadonlySet<string>, buildings)`: true, gdy któryś wyższy etap łańcucha (skipChainHigherIds) ma odblokowany tech; pusty / '-' / '—' techUnlock = od startu.
- gra/src/game/production.ts — `isWallTierBlockedByStrongerWall` dostaje parametr `unlockedTechs` i na początku blokuje nową budowę przestarzałego etapu; dwa wywołania (availableProduction, eraBuildingCatalog) przekazują `techs`. Jedna ścieżka dla listy gracza (buildableProduction), katalogu i bramki silnika.
- gra/src/game/ai.ts — trzy bezpośrednie wstawienia kandydatów muru (palisada / mury_kamienne / awans wallId) przechodzą przez `opts.isProductionAllowed?.(cityId, id) !== false` (bramka silnika = availableProduction).
- gra/tools/fortifications-superseded-build-test.cjs — NOWY test (38 asercji).
- gra/tools/fortifications-stack-repro-test.cjs, gra/tools/fortifications-upgrade-chain-ai-test.cjs, gra/tools/fortifications-upgrade-chain-ui-test.cjs — ZAKTUALIZOWANE oczekiwania starych asercji (komentarz R-WEB-UI-FORTIFICATIONS-HIDE-SUPERSEDED-WALL-BUILD-OPTIONS-Q1). Stare asercje „od zera wszystkie trzy w Buduj" / „AI proponuje Mury kamienne przy odblokowanym Budownictwie" opisywały dokładnie zachowanie, które zgłoszenie właściciela zmienia.
- dyspozycje/autobot/runs/R-WEB-UI-FORTIFICATIONS-HIDE-SUPERSEDED-WALL-BUILD-OPTIONS-Q1/evidence/*.png — 4 zrzuty z przebiegu Chromium, plus ten raport.

Nie zmieniano: main.ts, WERSJE.md, manifest, rust-port, gra/data/buildings.json, wikiBundle.json, docs/encyklopedia.

## TESTY
Środowisko: worktree wf_c0247ff7-497-1; `npm ci` w gra/ (71 pakietów, node_modules ignorowany przez git). Liczby z surowego wyjścia.
- tsc: `node_modules/.bin/tsc --noEmit` → exit 0, brak wyjścia (po przywróceniu mutacji).
- `git diff --check` → exit 0.
- NOWY fortifications-superseded-build-test.cjs → 38 pass, 0 fail (a: 9/9 funkcja czysta; b: 12/12 availableProduction, 4 techy × 3 stany miasta; b2: 12/12 buildableProduction z showResourceGatedBuildings; d: 3/3 ulepszenia zostają; c: 2/2 bramka AI).
- MUTACJA: `isFortificationSupersededForBuild` zmienione na `return false && ...` → `27 pass, 11 fail`, exit 1. Mutacja cofnięta; ponowny przebieg 38/0.
- fortifications-stack-repro-test.cjs → 49 OK, 0 FAIL (przed aktualizacją 46 OK / 3 FAIL: S0, S1, S1b — wyłącznie asercje starego zachowania).
- fortifications-queue-cleanup-test.cjs → 10 OK, 0 FAIL.
- fortifications-upgrade-chain-ai-test.cjs → 11 OK, 0 FAIL (przed aktualizacją 10/1: A1b).
- fortifications-upgrade-chain-ui-test.cjs (Chromium, realny build) → 15 passed, 0 failed (przed aktualizacją 13/2: U6, U8; wcześniej U1, U4, U5, U11 — wszystkie stare oczekiwania; po aktualizacji zielono).
- Bramki referencyjne z R-PROC-AUTOBOT §6:
  - logic-test → LOGIC OK (213/213), exit 0
  - tech-tree-test → 20 pass, 0 fail, exit 0
  - research-test → PASSED 33 / FAILED 0 / TOTAL 33, exit 0
  - unit-replace-test → WSZYSTKIE TESTY ZIELONE (21/21), exit 0
  - combat-test → COMBAT TEST: 6/6 pass, exit 0
- Czerwone-na-bazie: NIE ZMIERZONO (testów na bazie 33c888c1a nie uruchamiano poza czterema fortyfikacyjnymi, a te zmieniono świadomie).

## KRYTERIA (a)–(g)
(a) ZMIERZONO — funkcja `isFortificationSupersededForBuild` + macierz 4 techy (nic / Obróbka drewna / +Murarstwo / +Budownictwo) × 3 miasta (bez muru / z palisadą / z murami kamiennymi): 38/0; mutacja → 27/11.
(b) ZMIERZONO — lista budowy gracza (buildableProduction, z zasobami) zgodna z macierzą w teście b2 (12/12). Render DOM listy pokrywa punkt (f).
(c) ZMIERZONO — wybory AI przez bramkę silnika (availableProduction = isProductionAllowed z main.ts) i bezpośrednie kandydaty ai.ts (test c1/c2 + fortifications-upgrade-chain-ai-test 11/0). Administrator miasta / auto-manage używa buildableProduction (auto-manage.ts:260), więc ta sama reguła. NIE ZMIERZONO osobnym testem administratora państwa (ścieżka nie była wywołana w testach).
(d) ZMIERZONO — ulepszenie zbudowanej palisady na Mury kamienne (przy Murarstwie) i zbudowanych murów kamiennych na Mury ceglane (przy Budownictwie) nadal oferowane (d1–d3; stack-repro S1–S4 zielone; upgrade-chain 11/0).
(e) ZMIERZONO LOGICZNIE, bez osobnego testu. Funkcja nie usuwa pozycji kolejki. Palisada już w kolejce zostaje i dokończy się jako budowa; kod FALA 664 (collapseFortificationQueue / applyCompletedBuildingIds) bez zmian: po ukończeniu zostaje najwyższy etap. Dodatkowo obowiązuje istniejąca blokada „niższy w kolejce blokuje wyższy" (isWallTierBlockedByStrongerWall), więc przy palisadzie w kolejce Mury kamienne nie są oferowane. Czy palisada w kolejce po odblokowaniu Murarstwa ma być usunięta bez zwrotu — DECYZJA WŁAŚCICIELA, NIE zmieniano.
(f) CZĘŚCIOWO — Chromium (fortifications-upgrade-chain-ui-test.cjs, realny build) zrobił zrzuty: 01 palisada stoi (sekcja Ulepsz), 02 karta awansu, 03 kamienne stoją, 04 od zera (wszystkie techy → w „Buduj" tylko Mury ceglane). NIE ZMIERZONO: trzech zrzutów w stanach z dispatchu (tylko Obróbka drewna → palisada; +Murarstwo → tylko mury kamienne; +Budownictwo → tylko mury ceglane). Stanu „tylko Obróbka drewna" i „+Murarstwo" nie uruchomiono w przeglądarce.
(g) ZMIERZONO — tsc 0; 5 bramek referencyjnych zielone; git diff --check czysty. Czerwone-na-bazie: NIE ZMIERZONO.

## BLOKADY
Brak blokad technicznych. Niedokończone: (f) w części stanów; (e) wymaga decyzji właściciela.

## RUNDY
1/5. Ostatni werdykt: brak (pierwsza runda Operatora).

## NASTĘPNY KROK
Obrona / Evaluator: sprawdzić allowlistę i diff (6 zmienionych plików + 1 nowy test + evidence), zwłaszcza zakres zmian w testach (aktualizacja oczekiwań starego zachowania). Otwarte: (f) trzy stany w przeglądarce; (e) decyzja właściciela o palisadzie w kolejce.

## UWAGI-DLA-ORKIESTRATORA
- Dług Rust: reguła muru (isFortificationSupersededForBuild + blokada w isWallTierBlockedByStrongerWall) powinna trafić do REPIN reguł budowy w Rust. NIE ZMIERZONO, czy rust-port ma odpowiednik (nie sprawdzano).
- gra/node_modules zainstalowane w worktree przez `npm ci` (ignorowane przez git); do sprzątnięcia po tematu.
- Zrzuty Chromium przeniesione do dyspozycje/.../evidence/ (poza gra/tools/, żeby nie trafiły do commita).

DEPLOY/PUSH: NIE WYKONANO
