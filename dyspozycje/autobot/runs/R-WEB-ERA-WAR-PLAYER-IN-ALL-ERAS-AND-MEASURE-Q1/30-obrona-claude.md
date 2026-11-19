# R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1 — obrona Operatora (runda 2, odpowiedź na raport Evaluatora e26b472c4)

STATUS: BLOCK (częściowa obrona: zarzuty 1, 7, 8 naprawione; 2 częściowo; 6 odrzucony z założeniem; 3, 4, 5 NIE ZROBIONE)
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1
GOAL: gracz (ownerId 0) jako cel wymuszonych wojen epoki Kamienia/Brązu/Żelaza na równi z AI, bez zmian progów, liczników i kosztów; narzędzie pomiarowe; bieg dymny; testy.
BAZA: 7b941ba4b7fd5d1336061f0974374f91059da519 (kandydat); poprawki w commicie opisanym niżej.

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ, naprawione. Regex w `gra/tools/forced-war-iron-main-guard-test.cjs` (grupa `freeTargetCandidates`) akceptuje teraz wielowierszowy hunk `[ ... ].filter(...)`. Wynik `node tools/forced-war-iron-main-guard-test.cjs`: 35 PASS / 1 FAIL. Jedyny FAIL to `finalizePeaceTreatyBetween uzbraja odpoczynek Żelaza (cleanupIronForcedWarOnPeace)`, który wg raportu Evaluatora był czerwony także na bazie 49f8e1ea8 (34/1). Nie zmierzyłem bazy osobno (brak kopii bazy w tym worktree).

2. PRZYJMUJĘ częściowo. Dodano asercję źródłową (pin) w `forced-war-iron-main-guard-test.cjs`: gracz w `freeTargetCandidates` wyłącznie przy `playerEraPoolEligible` i opcji K2. Jest to test regex na źródle, nie test silnikowy. Test silnikowy toru main NIE ZROBIONY (patrz pkt 3).

3. PRZYJMUJĘ, NIE ZROBIONE. Scenariusz silnikowy Kamień trwa → Brąz pending → pokój → start w pierwszej turze po pokoju wymaga esbuild i uruchomienia toru main. W tym worktree brak `node_modules` (esbuild nie znaleziony: `era-war-player-included-test.cjs` kończy się komunikatem "esbuild not found").

4. PRZYJMUJĘ, NIE ZROBIONE. Hook `__eraWarMeasure` w main.ts i runner `era-war-measure-run.cjs` nie zostały napisane w tej rundzie.

5. PRZYJMUJĘ, NIE ZROBIONE. Bieg dymny (seed 4242 i 7, 120 tur, Chromium) nie został wykonany: brak node_modules/bundla i czasu na pełny bieg w tej rundzie.

6. ODRZUCAM Z DOWODEM I ZAŁOŻENIEM dla fallbacku Kamienia. Kamień nie ma fallbacku wolnego celu dla żadnego aktora, także dla gracza:
   - `gra/src/game/forced-war-common.ts` l.518: `if (leftoverId !== 0 && pair.era === 'stone' && actor?.era !== 'stone') continue;`
   - `gra/src/game/forced-war-common.ts` l.545: `actor.era !== 'stone'` w warunku fallbacku wolnego celu.
   - `gra/tools/era-war-player-included-test.cjs` T4 (l.122-129) utrwala to zachowanie.
   Gracz pozostaje celem Kamienia przez pulę triggeredSubjects (`main.ts` ~45557-45569, bramka `isPlayerEligibleForEraWarPool`), czyli wszedł do wojny Kamienia jak inne cywilizacje w puli. ZAŁOŻENIE (do potwierdzenia przez orkiestratora): fallback Kamienia pozostaje wyłączony dla wszystkich, zgodnie z decyzją z rundy 3 R-WEB-ERA-WAR-DEFER-NOT-CANCEL-Q1. Dispatch pkt 2 mówi „dla każdej epoki", co nie rozstrzyga tej luki jednoznacznie.

7. PRZYJMUJĘ, naprawione. Gracz jako kandydat fallbacku podlega teraz tej samej bramce co pula gracza. W `gra/src/main.ts` (~45557) wyliczono `const playerEraPoolEligible = !!playerCity && isPlayerEligibleForEraWarPool({...}, WAR_RULES_PARAMS);`. Ta wartość steruje dodaniem do `triggeredSubjects` (bez zmiany warunków) i dodaniem do `freeTargetCandidates` (~45687: `...(playerCity && playerEraPoolEligible && (!isWarEpochPlayerFirstEnabled() || playerEpochWarEnabled) ? [...] : [])`). Progów (40 tur) nie zmieniano. Brak testu silnikowego tej ścieżki (pkt 3).

8. PRZYJMUJĘ, naprawione. `gra/data/ui-params.json` l.185, opis opcji „Wyłączona”: zmieniono na „Gracz nie uczestniczy w wojnach epoki (Kamień, Brąz, Żelazo): AI nie wypowiadają mu wojny epoki i nie wybierają go celem”. Opis opcji „Włączona” bez zmian. Typecheck: `tsc -v` = 6.0.2; bez flagi `--ignoreDeprecations 6.0` zwraca TS5101 (baseUrl). Z flagą: 177 błędów, wszystkie z braku node_modules (np. `Cannot find module 'three'`, `filePlayer.ts`). Brak błędów w `src/main.ts` w zakresie 4550x-4699x (edytowany blok). To NIE jest czysty tsc; czystego tsc NIE ZMIERZONO.

## Pliki zmienione w tej rundzie
- gra/src/main.ts (gate `playerEraPoolEligible`, pkt 7)
- gra/data/ui-params.json (opis opcji, pkt 8)
- gra/tools/forced-war-iron-main-guard-test.cjs (regex pkt 1; pin pkt 2)

## TESTY (surowe wyniki w tym worktree)
- forced-war-iron-main-guard-test.cjs: WYNIK 35 PASS, 1 FAIL (FAIL: finalizePeaceTreatyBetween uzbraja odpoczynek Żelaza; wg Evaluatora czerwony także na bazie)
- era-war-player-included-test.cjs, era-war-defer-not-cancel-test.cjs, era-war-bronze-player-target-test.cjs, forced-war-bronze/iron/stone/multi-turn: NIE ZMIERZONO (wymagają esbuild z node_modules, brak w worktree)
- tsc: patrz pkt 8, NIE ZMIERZONO czysto

## BLOKADY
- Brak node_modules w worktree: esbuild (testy silnikowe) i typy (tsc) niedostępne.
- Pkt 3, 4, 5 nie wykonane w tej rundzie (test silnikowy, hook pomiarowy, bieg dymny).
- Wymagane potwierdzenie założenia z pkt 6 (fallback Kamienia wyłączony dla gracza).

## RUNDY
2/5 (runda 1: kandydat 7b941ba4b; runda 2: ta obrona). Ostatni werdykt: FAIL (Evaluator e26b472c4).

## NASTĘPNY KROK
Orkiestrator: (a) potwierdzić założenie pkt 6; (b) zlecić następną rundę Operatora zadania 3, 4 i 5 z uruchomionym node_modules (lub w środowisku z esbuild i Chromium); (c) po zmianach przeprowadzić ponowną ocenę Evaluatorem.

DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: brak node_modules w worktree; pętla testów silnikowych wymaga instalacji zależności w worktree (nie w gra/ build/dev). Zalecam wykonać npm ci poza bramkami tej rundy, jeśli dozwolone.
