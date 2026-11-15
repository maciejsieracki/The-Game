# R-WEB-UI-FORTIFICATIONS-HIDE-SUPERSEDED-WALL-BUILD-OPTIONS-Q1 — Obrona Operatora (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-FORTIFICATIONS-HIDE-SUPERSEDED-WALL-BUILD-OPTIONS-Q1
GOAL: Nowa budowa etapu łańcucha fortyfikacji (upgradeSkip) znika z listy „Dostępne do budowy" i z wyborów AI/administratora, gdy odblokowany jest tech wyższego etapu (Palisada po Murarstwie, Mury kamienne po Budownictwie). Ulepszenie już zbudowanego niższego etapu ZOSTAJE (awans). Cytadela i baszta bez zmian.
Baza kodu: 33c888c1a (origin/main). Startowy kandydat obrony: 840d56f4f. SHA obrony: pole `sha` wyniku orkiestratora.

## ZMIANY-COMMIT (obrona)
Zmienione względem 840d56f4f:
- gra/src/game/production.ts — KLUCZOWA POPRAWKA: blokada „przestarzałej" budowy nie dotyczy już awansu. Warunek: `skipChainUpgradeSource(buildingId, builtIds, buildings) === null && isFortificationSupersededForBuild(...)`. Palisada stojąca + Budownictwo nadal daje awans na Mury kamienne i Mury ceglane (dispatch d; zgłoszenie właściciela: „każdy z tych wcześniejszych murów może być zmieniony przez ulepszenie").
- gra/src/game/ai.ts — przywrócony do wersji bazowej (33c888c1a): usunięto trzy redundantne bramki `opts.isProductionAllowed?.(...)`. Kandydatów muru filtruje już `available.filter(c => opts.isProductionAllowed!(cityId, c.id))` (ai.ts:2437-2438).
- gra/tools/fortifications-stack-repro-test.cjs — przywrócone oryginalne asercje S1/S1b (awans); zmienione tylko S0 (od zera = tylko Mury ceglane, nowa budowa) i regex U1 (nowa sygnatura `isWallTierBlockedByStrongerWall(..., techs)`).
- gra/tools/fortifications-upgrade-chain-ai-test.cjs — przywrócona oryginalna A1b; DODANO A5a/A5b (behawioralny test AI: od zera i przy stojących Murach kamiennych AI nie wybiera palisady ani Murów kamiennych).
- gra/tools/fortifications-upgrade-chain-ui-test.cjs — przywrócone oryginalne U1, U4, U5, U6, U8; zmieniono tylko U11 (od zera w „Buduj" = tylko Mury ceglane); DODANO F1/F2 (stany pośrednie) + zrzuty 05/06.
- gra/tools/fortifications-superseded-build-test.cjs — oczekiwanie macierzy `+Budownictwo|z palisada` = [mury_kamienne, mury] (awans zostaje; nowa budowa znika).
- gra/src/data/wikiBundle.json — regeneracja `node tools/bundle-wiki-for-game.cjs` (22 rozdz. + 181 haseł).
- docs/encyklopedia/budynki/mury-kamienne.md, docs/encyklopedia/budynki/mury.md — akapit „Nowa budowa" (zasada widoczna dla gracza).
- dyspozycje/.../evidence/05-stan-tylko-obrobka-palisada.png, 06-stan-murarstwo-kamienne.png (+ 01–04 z poprzedniej rundy).
- gra/src/game/building-upgrades.ts — bez zmian względem 840d56f4f (funkcja czysta `isFortificationSupersededForBuild` zostaje).

## ODPOWIEDZI NA ZARZUTY EVALUATORA
Zarzut 1 (zmienione oczekiwania istniejących testów upgrade-chain): PRZYJMUJĘ. Błąd implementacji: gate obejmował też awans, więc testy U1/A1b/U6/U8 i stack-repro S1 musiały być zmieniane. Poprawiono kod (warunek `skipChainUpgradeSource === null`) i PRZYWRÓCONO oryginalne asercje upgrade-chain. Zmienione asercje, które zostają, dotyczą wyłącznie nowej budowy od zera (S0, U11) — to jest żądanie właściciela. Uwaga ABC (interpretacja, nie blokuje): zgłoszenie „znika opcja na mur kamienny" można czytać jako ukrycie także awansu Palisada→Mury kamienne przy odblokowanym Budownictwie. Przyjęto literalnie dispatch (d): awans zostaje. Do decyzji właściciela.

Zarzut 2 (trzy bramki ai.ts redundantne i nieprzetestowane): PRZYJMUJĘ. Bramki usunięte (ai.ts = baza). Redundancja potwierdzona kodem: ai.ts:2437-2438. Dodano test behawioralny A5 (fortifications-upgrade-chain-ai-test.cjs) na realnym chooseCityProduction + availableProduction. Mutacja (bramka `isProductionAllowed` muru w production.ts zastąpiona przez `if (false) return true;`) → `A5a FAIL` (13 OK / 1 FAIL, exit 1). Mutacja `isFortificationSupersededForBuild` → `return false && ...` → fortifications-superseded-build-test exit 1.

Zarzut 3 (brak osobnego testu administratora miasta/państwa): ODRZUCAM jako wymóg osobnego testu, z dowodem: auto-manage.ts:260 `const allCandidates = buildableProduction(city, data, unlockedTechs, ctx);` — ta sama ścieżka co lista gracza, testowana przez macierz b2 (buildableProduction, showResourceGatedBuildings) = 12/12. NIE_ZMIERZONO w sensie wywołania ścieżki administratora w grze.

Zarzut 4 (kryterium e bez testu): ODRZUCAM. Dispatch (e) brzmi „opisz w raporcie, co się dzieje z palisadą w kolejce" — wymóg opisowy, nie testowy. Opis: funkcja nie usuwa pozycji kolejki; `collapseFortificationQueue` / `applyCompletedBuildingIds` (FALA 664) bez zmian; palisada już w kolejce dokończy się jako budowa; blokada „niższy w kolejce blokuje wyższy" (isWallTierBlockedByStrongerWall) nie oferuje Murów kamiennych dopóki palisada czeka. Dostępność sprawdzana przy dodawaniu do kolejki (main.ts:44421) — zgodnie z obserwacją Evaluatora. Test queue-cleanup: 10 OK / 0 FAIL. Czy palisada w kolejce po odblokowaniu Murarstwa ma być usunięta ze zwrotem — DECYZJA WŁAŚCICIELA (pytanie ABC), nie zmieniano.

Zarzut 5 (brak zrzutów trzech stanów w Chromium): PRZYJMUJĘ. Dodano F1 (tylko Obróbka drewna → „Palisada drewniana" w Buduj) i F2 (+Murarstwo → tylko „Mury kamienne"); trzeci stan (+Budownictwo → tylko „Mury ceglane") = U11 + zrzut 04. Chromium: `node tools/fortifications-upgrade-chain-ui-test.cjs` → `17 passed, 0 failed` (surowe wyjście). Zrzuty: evidence/04, 05, 06.

Zarzut 6 (brak wpisów encyklopedii i regeneracji wikiBundle): PRZYJMUJĘ. Dopisano akapity „Nowa budowa" w mury-kamienne.md i mury.md; `node tools/bundle-wiki-for-game.cjs` → `wikiBundle.json: 22 rozdz. + 181 haseł`. Uwaga poza zakresem (nie naprawiano): w mury-kamienne.md Wiki-S nadal podaje koszt „80× cegła" — rozbieżność z danymi po c9c161ec3 („Mury kamienne bez kosztu cegły"); do osobnego tematu dokumentacyjnego.

Zarzut 7 (czerwone-na-bazie nie zmierzone): ODRZUCAM jako blokadę. Wszystkie bramki zielone na kandydacie (wyniki poniżej); pomiar na bazie nie jest potrzebny do stwierdzenia regresji, gdy nic nie jest czerwone. Czerwone-na-bazie: NIE_ZMIERZONO (nie uruchamiano na 33c888c1a).

Zarzut 8 (dług Rust, rust-port): NIE_ZMIERZONO. `git grep -i palisad` / `superseded` na origin rust-port nie zwróciło dopasowań, ale nie potwierdzono, że gałąź ma pełny kod — do weryfikacji przy REPIN.

## TESTY (surowe wyjście, ta runda, worktree wf_c0247ff7-497-3)
- `node_modules/.bin/tsc --noEmit` → exit 0.
- `git diff --check` (worktree) → czysto (brak wyjścia).
- fortifications-superseded-build-test.cjs → `=== wynik: 38 pass, 0 fail ===` exit 0.
- fortifications-stack-repro-test.cjs → `WYNIK: 49 OK, 0 FAIL` exit 0.
- fortifications-upgrade-chain-ai-test.cjs → `WYNIK: 13 OK, 0 FAIL` exit 0 (A5a/A5b nowe).
- fortifications-queue-cleanup-test.cjs → `WYNIK: 10 OK, 0 FAIL` exit 0.
- fortifications-upgrade-chain-ui-test.cjs (Chromium) → `17 passed, 0 failed` exit 0.
- logic-test.cjs → `LOGIC OK (213/213)` exit 0.
- tech-tree-test.cjs → `tech-tree-test: 20 pass, 0 fail` exit 0.
- research-test.cjs → `PASSED: 33 / FAILED: 0 / TOTAL: 33` exit 0.
- unit-replace-test.cjs → `WSZYSTKIE TESTY ZIELONE (21/21)` exit 0.
- combat-test.cjs → `COMBAT TEST: 6/6 pass` exit 0.
- MUTACJE (przywrócone, zweryfikowane `cmp`): (1) `isFortificationSupersededForBuild` → `return false && ...` → superseded-build exit 1; (2) bramka superseded w production.ts → `if (false) return true;` → upgrade-chain-ai `A5a FAIL` exit 1.
- Czerwone-na-bazie: NIE_ZMIERZONO.

## KRYTERIA (a)–(g) po obronie
(a) ZMIERZONO — funkcja + macierz 4 techy × 3 miasta: 38/0.
(b) ZMIERZONO — buildableProduction (lista gracza) zgodna z macierzą (b2) i render listy w Chromium (F1/F2/U11).
(c) ZMIERZONO dla AI przez test A5 (behawioralny) i bramkę silnika; administrator: auto-manage.ts:260 = buildableProduction (zarzut 3).
(d) ZMIERZONO — awans zostaje (d1–d3; oryginalne U1/U2/U4–U8 i S1/S1b zielone bez zmiany asercji).
(e) OPISOWO — patrz zarzut 4; decyzja właściciela o palisadzie w kolejce.
(f) ZMIERZONO — trzy stany: F1, F2, U11 + zrzuty evidence/04–06.
(g) ZMIERZONO — tsc 0; 5 bramek referencyjnych zielone (logic, tech-tree, research, unit-replace, combat); diff --check czysty.

## BLOKADY
Brak blokad technicznych. Pytania ABC do właściciela (nie blokują): (1) awans Palisada→Mury kamienne przy odblokowanym Budownictwie — zostaje (przyjęto dispatch d) czy znika; (2) palisada w kolejce po odblokowaniu Murarstwa — zostaje (dokończy się jako budowa) czy ma być usunięta ze zwrotem.

## RUNDY
Runda obrony 1 (odpowiedź na zarzuty Evaluatora). Ostatni werdykt Evaluatora: PASS-WITH-NOTES.

## NASTĘPNY KROK
Evaluator: sprawdzić diff (production.ts, ai.ts przywrócone do bazy, testy, docs, wikiBundle, evidence). Final Control po zielonym Evaluatorze. Decyzja ABC z pkt. wyżej przed deployem, jeśli właściciel wybierze inaczej.

## UWAGI-DLA-ORKIESTRATORA
- Commit obrony zawiera zmiany kodu i dokumentacji; ai.ts w tym commicie wraca do bazy 33c888c1a (różnica względem 840d56f4f = usunięte bramki).
- Dług dokumentacyjny poza zakresem: mury-kamienne.md Wiki-S podaje koszt z cegłą (rozbieżność z danymi).
- Dług Rust: reguła muru do REPIN; NIE_ZMIERZONO stan rust-port.
- node_modules w gra/ zainstalowany przez `npm ci` w worktree (ignorowane przez git) — do sprzątnięcia po tematu.

DEPLOY/PUSH: NIE WYKONANO
