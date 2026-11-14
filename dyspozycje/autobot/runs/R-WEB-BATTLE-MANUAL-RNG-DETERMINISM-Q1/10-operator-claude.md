STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-MANUAL-RNG-DETERMINISM-Q1
GOAL: Walka ręczna i scenicza ma używać tego samego deterministycznego generatora co walki AUTO (strumień z ziarna gry, gameStreamRng), tak aby dwa przebiegi tego samego ziarna z tymi samymi decyzjami gracza dawały ten sam wynik. Bez zmian reguł walki i balansu.

ZMIANY/COMMIT: baza fab9a9b75 (origin/main). Allowlista zachowana: gra/src/battle/battleScene.ts, gra/src/battle/manualBattle.ts, gra/src/main.ts (podpięcie + licznik w meta zapisu), nowy gra/tools/manual-battle-rng-determinism-test.cjs, dyspozycje/autobot/runs/R-WEB-BATTLE-MANUAL-RNG-DETERMINISM-Q1/**. Commit: patrz pole sha w odpowiedzi operatora (commit tej rundy zawiera kod, test i ten raport).

Lista źródeł losowości w ścieżkach walki PRZED zmianą (baza fab9a9b75):
- gra/src/battle/battleScene.ts:9130 (_singleBlow, rzut trafienia): `const roll = certainHit ? 0 : Math.random() * 100;` - wpływa na wynik walki scenicznej.
- gra/src/battle/battleScene.ts:20838 (_skipInstantFallback -> computeInstantResult, "Pomin"): resolveCombat bez opts.rng -> domyślne Math.random (combat.ts:890).
- gra/src/battle/manualBattle.ts:1062 (_doAttack): resolveCombat bez opts.rng -> domyślne Math.random (combat.ts:890). Nie znaleziono w manualBattle.ts bezpośredniego Math.random.
- Pominięte jako niewpływające na wynik (audio/efekty): battleScene.ts ~11334-11546 (Math.random w dźwięku), ~4853-5040 (kolor/dżitter terenu już deterministyczny lub wizualny).

Zmiana (jedna wspólna fabryka, bez nowego mechanizmu):
- main.ts: `battleCombatRng()` = gameStreamRng(_gameSeed, turn, 'battle-combat:' + licznik), licznik resetowany co turę (wzór jak autoBattleRng). Podpięte jako `combatRng` przy 4 miejscach tworzenia BattleScene (35027, 35759, 38492, 38615).
- battleScene.ts: BattleOpts.combatRng (opcjonalne; brak = Math.random dla starych wywołań); pole _combatRng używane w _singleBlow (linia ~9140) i przekazywane do computeInstantResult (parametr combatRng, wywołanie ~3772) i do resolveCombat (`rng: combatRng`, ~20852).
- manualBattle.ts: ManualBattleOpts.rng -> this.combatRng -> resolveCombat (`rng: this.combatRng`, ~1068).
- Zapis: meta zapisu dostaje battleCombatSeqTurn i battleCombatSeq; przy wczytaniu brak pola = -1 / 0 (stare zapisy działają, jak przy autoBattleSeq). Walka nie zapisuje się w trakcie (W27), więc licznik ma znaczenie tylko dla kolejnych walk w turze po wznowieniu.

Test: gra/tools/manual-battle-rng-determinism-test.cjs (test statyczny źródeł; bez DOM/Three, bo BattleScene i ManualBattle wymagają przeglądarki). Sprawdza: brak wywołań Math.random w manualBattle.ts (dozwolona tylko domyślna wartość pola); rzut _singleBlow bez Math.random; resolveCombat w manualBattle i w skip-path dostaje rng; podpięcie opts.combatRng/opts.rng; fabryka battleCombatRng z ziarna gry; combatRng przy tworzeniu BattleScene; licznik w meta zapisu.

TESTY:
- tsc --noEmit (gra/): exit 0, bez błędów (po wszystkich zmianach src).
- Nowy test, poprawka: `node tools/manual-battle-rng-determinism-test.cjs` -> 11 PASS, OK, exit 0.
- Dowód czerwony na bazie: MANUAL_RNG_ROOT=<kopia gra/src z fab9a9b75> -> FAILED 10 (manualBattle rng, battleScene rzut/_combatRng/Pomin/computeInstantResult/opts.combatRng, main fabryka, main combatRng 0 z 4, main meta). Exit 1.
- Dowód mutacyjny: w kopii poprawki usunięto jedną linię `rng: this.combatRng,` z manualBattle.ts -> FAILED 1 (`manualBattle: resolveCombat dostaje rng`), exit 1.
- Bramki referencyjne (wszystkie zielone, dane z surowego wyjścia):
  - logic-test.cjs: LOGIC OK (213/213), exit 0
  - tech-tree-test.cjs: tech-tree-test: 20 pass, 0 fail, exit 0
  - research-test.cjs: PASSED: 33 / FAILED: 0 / TOTAL: 33, exit 0
  - unit-replace-test.cjs: WSZYSTKIE TESTY ZIELONE (21/21), exit 0
  - combat-test.cjs: COMBAT TEST: 6/6 pass, exit 0
- git diff --check: czysty (exit 0).
- NIE_ZMIERZONO: weryfikacja live (dwie identyczne walki ręczne w przeglądarce z tym samym ziarnem, przez ?civTest=1 / __detHarness) - nie uruchamiano przeglądarki ani builda (dispatch: build tylko przez vite --outDir w /tmp; nie wykonano). Nie sprawdzono też, czy __detHarness obejmuje walkę ręczną.
- NIE_ZMIERZONO: zachowanie determinizmu całej tury z walką (test wznowienia z zapisu po walce).

BLOKADY: brak krytycznych. Uwagi poniżej.

RUNDY: 1/5 (Operator HAIKU, runda 1).

NASTĘPNY KROK: Evaluator (SONNET) -> Final Control (SONNET). Do weryfikacji na żywo: dwa przebiegi walki ręcznej z tym samym ziarnem (?civTest=1) i porównanie wyniku oraz log; oraz dopisanie walki do harnessu __detHarness, jeśli ma to sens.

DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. gra/src/battle/manualBattle.ts: klasa ManualBattle NIE jest instancjonowana nigdzie w gra/src (występuje tylko w README-manualBattle.md). Zmiana w niej jest poprawna i zgodna z dispatchem, ale nie wpływa na działającą grę. Realna walka ręczna/scenicza to BattleScene (battleScene.ts), i tam jest główna poprawka.
2. gra/src/oblezenie/main.ts:46 tworzy osobny BattleScene bez combatRng (oblężenie w osobnym entry point) -> nadal Math.random. Poza allowlistą tego tematu; do osobnego tematu jeśli oblężenie w tym entry ma być deterministyczne.
3. Ścieżka AUTO walki animowanej (_singleBlow) też korzysta z combatRng, gdy wywołanie przekazuje strumień (main.ts podpina go do wszystkich BattleScene z gry). Efekt: rzuty trafień w walkach tworzonych przez main.ts są teraz z ziarna gry - to zgodne z celem, ale zmienia przebieg wyników walk ścieżką scenicznej (zgodnie z decyzją ABC nr 11 = A).
4. Dispatch wskazywał battleScene.ts ~20838 i manualBattle.ts ~1062 w ścieżce src/ui/ - w rzeczywistości plik to gra/src/battle/battleScene.ts (brak gra/src/ui/battleScene.ts). Zmiany wykonano w poprawnym pliku.
5. Nie znaleziono w repo pliku dispatchu na origin/main pod tą ścieżką (fetch: brak w origin/main); dispatch odczytano z DODATKU na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0.
6. Zapis: stare zapisy bez nowych pól działają (domyślne -1 / 0). Nie dodano testu migracji zapisu.
7. Środowisko: w worktree wykonano `npm ci` w gra/ (tylko node_modules, ignorowane przez git); żadnych artefaktów w repo poza zmianami wymienionymi wyżej.
