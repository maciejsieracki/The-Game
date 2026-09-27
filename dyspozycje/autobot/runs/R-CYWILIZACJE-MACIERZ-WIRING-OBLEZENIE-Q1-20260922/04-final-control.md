STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
ROLE: Final Control (independent, third reviewer, post narrow-correction round 2)
GOAL: Niezależny audyt wiring-u parametrów Oblężenia (obl_mur_proc, obl_obrona_miasta_proc, obl_machines_proc) po round-1 (PASS/PASS) i round-2 narrow correction (Operator PASS, Evaluator PASS) dla AI siege path.

ZMIANY/COMMIT:
- Produktu nie zmieniano. Zapisano wyłącznie ten raport i transition receipt tej bramki.
- HEAD: f52f3b76b4761136a43dc0ab32dde50552a176fe; BASE origin/main: 0caa4dfa31d37337cd74fdbab95ee77da4806d98.
- Diff pozostaje ograniczony do: gra/data/civ-matrix.json, gra/src/battle/battleScene.ts, gra/src/game/city-defense.ts, gra/src/game/siege.ts, gra/src/game/siegeAi.ts, gra/src/game/siegeMachines.ts, gra/src/main.ts, gra/tools/civ-matrix-oblezenie-wiring-test.cjs. Brak commit/push/merge/deploy.

NIE UFAŁEM poprzednim raportom — poniżej własna, niezależna weryfikacja dla każdego z 5 pytań wyższego poziomu z dispatch 03.

1. KALIBRACJA ±0.20 — WERDYKT: W RZĘDZIE WIELKOŚCI, REALNIE ODCZUWALNA
Powtórzyłem samodzielnie obliczenie na produkcyjnej formule `effectiveDefenderM` (main.ts) i na cityWallDefenseBonusPercent (city-defense.ts:81-104):
- Neutralne mury (structural 200%): total = 200 * (1+0)*(1+0) = 200%.
- Grecy (obl_mur_proc=+0.2, obl_obrona_miasta_proc=+0.2): 200 * 1.2 * 1.2 = 288%.
- Zulusi (obl_mur_proc=-0.2, obl_obrona_miasta_proc=0): 200 * 0.8 * 1.0 = 160%.
Rozstaw Grecy vs Zulusi na samym procencie struktury to 288% vs 160% = +80 punktów procentowych, ~1.8x różnicy w mnożniku obrony muru — nie kosmetyczne. Porównanie do precedensu Manpower (mp_max_proc ±0.20 dający 12000 vs 8000 = 50% różnicy względnej na puli) pokazuje mniejszy, ale wciąż ten sam rząd wielkości efekt na finalnym wyniku bitwy (w poprzednim FC-recovery: Grecy vs Zulusi na defenderM = +34.27%). Zgadzam się z poprzednią oceną: materialnie znaczące, nie kosmetyczne, w rzędzie wielkości precedensów REAL_GAMEPLAY.

2. ARCHITEKTURA PODŁĄCZENIA (city-defense.ts) I TRZECIA ŚCIEŻKA — ZWERYFIKOWANE, LUKA ZAMKNIĘTA W ROUND 2
Niezależnie potwierdziłem, że round 1 podłączył WYŁĄCZNIE main.ts (structureDefenseBonusFor, linie 26788-26800+) i battleScene.ts (onWallWalkway) przez wspólną cityWallDefenseBonusPercent — to rzeczywiście jedyne miejsce współdzielone między obydwoma trybami bitwy dla realnej rozgrywki gracza.
Zidentyfikowana przez poprzedni Final Control trzecia ścieżka (AI decyzyjność: main.ts:14930/14966 → buildSiegeCityFromRuntime → decideAISiegeStance → siegeAi.ts:estimateDefenderStrength → siege.ts:cityDefenseBonus) jest realną, produkcyjną ścieżką (nie testową) — potwierdziłem to sam: `decideAISiegeStance` jest wołane z dwóch miejsc w main.ts (14930-14962 initial, 14966-14987 ongoing), oba budują SiegeCity przez wspólny builder.
Round 2 naprawił dokładnie tę lukę: siege.ts:cityDefenseBonus (linie 442-472 diff) teraz liczy structurePct przez tę samą cityWallDefenseBonusPercent z civ-matrix mnożnikami (civKey z SiegeCity.civKey), a applyCityBonus (linie 503-524 diff) przyjmuje nowy opcjonalny `includeStructure` flag. Jedyny wywołujący z `includeStructure=true` to siegeAi.ts:111 (estimateDefenderStrength) — potwierdzone grepem `applyCityBonus(` w całym gra/src: dokładnie dwa wywołania, siege.ts:723 (resolveSiegeAttack, domyślne false) i siegeAi.ts:111 (true).
Sam sprawdziłem `resolveSiegeAttack` przez grep całego gra/src/main.ts i battleScene.ts — funkcja NIE jest wołana z żadnego z tych dwóch produkcyjnych plików (tylko z tools/logic-test.cjs i tools/militia-garrison-router-siege-test.cjs). Oznacza to, że siege.ts:resolveSiegeAttack to odrębny, wyłącznie testowany rezolwer, nie faktyczna ścieżka realnej bitwy gracza (którą liczy main.ts:effectiveDefenderM/battleScene.ts niezależnie) — więc nie ma ryzyka podwójnego naliczenia bonusu muru w realnej bitwie: AI-heurystyka (siegeAi z includeStructure=true) i realna bitwa (main.ts/battleScene.ts) to dwa niezależne obliczenia, każde stosujące mnożnik dokładnie raz, dla różnych celów (decyzja AI vs rozstrzygnięcie starcia).
Civ-matrix builtBuildingIds i civKey w buildSiegeCityFromRuntime (main.ts:15044-15066) czytane są POPRAWNIE z tych samych źródeł co main.ts:civMurObronaProcFor (cityBuilt, _menuCivIdByOwner/player.civType/aiOwnerCivMap) — spójne z resztą kodu, brak fallbacku na 'grecy' (w przeciwieństwie do civKeyForOwnerId), co jest bezpieczniejsze dla neutralnego traktowania nieznanych/brakujących danych w ocenie AI.
Test `civ-matrix-oblezenie-wiring-test.cjs` (83 pass) zawiera sekcję "AI siege consumer" faktycznie wykonującą decideAISiegeStance/estimateDefenderStrength z różnymi cywilizacjami (nie tylko civMatrixParam w izolacji) — potwierdziłem to czytając test i uruchamiając go: 83 pass, 0 fail.
Uznaję tę lukę za ZAMKNIĘTĄ przez round 2 — nie jest już zarzutem blokującym.

3. WYBÓR STRONY — WERDYKT: POPRAWNY, BRAK NIEOBSŁUŻONEGO SCENARIUSZA
Sam sprawdziłem grep "wypad|sortie|kontratak" w main.ts, siege.ts, siegeAi.ts, battleScene.ts. Istniejące trafienia "kontratak" dotyczą wyłącznie mechanizmu kontrataku obrońcy W BITWIE (battleScene.ts:2586-2588, 8323-8376 — "budżet kontratakow", jeden kontratak na turę), NIE mechanizmu wypadu garnizonu z maszynami oblężniczymi przeciw oblegającym. Sprawdziłem też isSiegeUnit w battleScene.ts: jedyna gałąź wallAttack (obl_machines_proc, linia 7166-7175) jest gated na `isSiegeUnit(ru.bu) && ru.side === 'atk'` (linia 5886) — machiny obronne (side='def') nie wchodzą w _attackGate/_attackWallTile w ogóle, tylko w oddzielną gałąź "hold" (walka na dystans/melee, nie niszczenie murów/bram). W silniku dzisiaj nie istnieje mechanika, w której broniąca się machina oblężnicza mogłaby zaatakować mur/bramę — scenariusz "obrońca z własnymi machinami" nie występuje w obecnym kodzie bojowym. Potwierdzam ocenę poprzedniego Final Control: wybór strony (obrońca dla mur/obrona miasta, atakujący dla machin) jest kompletny i poprawny dla obecnego silnika; brak luki.

4. MERGEABILITY Z WIRING-MANPOWER — WERDYKT: STRUKTURALNIE BEZKONFLIKTOWY
Powtórzyłem samodzielnie porównanie zamiast ufać poprzedniemu raportowi:
- `git diff origin/main -- civ-matrix.json` (bieżący worktree) zmienia WYŁĄCZNIE klucze obl_machines_proc/obl_mur_proc/obl_obrona_miasta_proc (30+30+30 wystąpień w diff, 40 linii +/- łącznie).
- `git diff origin/main hermes/R-CYWILIZACJE-MACIERZ-WIRING-MANPOWER-Q1-20260922 -- civ-matrix.json` (branch Manpower, commit 87ce2daf, NIE jest jeszcze w origin/main — potwierdzone `git merge-base --is-ancestor` zwraca false) zmienia WYŁĄCZNIE mp_regen_proc/mp_max_proc/mp_koszt_jednostki_proc.
- Przecięcie zbiorów zmienianych kluczy: puste. paramDefs=113, defaults=113 w obu przypadkach (bieżący worktree sprawdzony bezpośrednio przez python3/json.load) — brak dryfu schematu.
Ponieważ oba branche edytują różne pola w tych samych obiektach civ (`{"Grecy": {"obl_mur_proc": ..., "mp_max_proc": ...}}`), git merge na JSON-line-based diff może dać konflikt na SĄSIEDNICH liniach tego samego obiektu cywilizacji jeśli kolejność kluczy w pliku nakłada się blisko — ale to trywialny konflikt do ręcznego scalenia (dwie niezachodzące linie klucz:wartość w tym samym bloku obiektu), nie konflikt semantyczny. Potwierdzam ocenę: bezpieczne do zmergowania, ewentualny konflikt JSON byłby kosmetyczny/trywialny.

5. PASS-WITH-NOTES ZAMIAST CZYSTEGO PASS — UZASADNIENIE
Uznaję PASS-WITH-NOTES (nie FAIL) z następującymi notatkami dla integratora:
a) Ten temat przeszedł DWIE rundy Operatora (round 1 PASS→PASS→FAIL w recovery Final Control, round 2 narrow correction PASS→PASS) — integrator powinien wiedzieć, że luka AI-siege-path była realna i wymagała osobnej korekty, nie tylko kosmetycznego zarzutu.
b) `obl_obrona_miasta_proc` i `obl_mur_proc` w AI-ścieżce (siegeAi/siege.ts) stosowane są RAZEM na obronę I pancerz garnizonu (applyCityBonus linia 522-524: `Pancerz = (Pancerz + pancerzBonus) * structureMult`) — to szerszy zakres zastosowania mnożnika niż w realnej bitwie (main.ts:effectiveDefenderM stosuje combinedDefPct WYŁĄCZNIE na składową Obrony, nigdy Atak/Pancerz — potwierdzone przez mur-paradoks-test.cjs). Jest to świadoma decyzja Operatora (AI-heurystyka nie musi replikować dokładnie tej samej mechaniki co realna bitwa, to inny model), ale jest to rozbieżność architektoniczna między dwoma konsumentami tego samego civ-matrix mnożnika, którą integrator powinien mieć świadomie odnotowaną — nie jest to błąd, lecz uproszczenie z lekko innym zakresem efektu.
c) Dwie preexisting, niezwiązane awarie testów pozostają: `empire-panel-miasto-obywatele-content-test.cjs` (115 pass, 1 fail) i `koszty-surowcowe-test.cjs` (126 pass, 3 fail) — sam je uruchomiłem i potwierdzam identyczne liczby jak w poprzednich raportach; nie są przypisane do tego tematu.

TESTY (samodzielnie uruchomione, nie tylko odczytane z raportów):
- cd gra && ./node_modules/.bin/tsc --noEmit — exit 0.
- node tools/civ-matrix-oblezenie-wiring-test.cjs — exit 0; 83 pass, 0 fail.
- node tools/siege-ai-test.cjs — exit 0; 17 pass, 0 fail.
- node tools/logic-test.cjs — exit 0; 213/213 pass.
- node tools/city-defense-terrain-gate-test.cjs — exit 0; 34 pass, 0 fail.
- node tools/mur-paradoks-test.cjs — exit 0; 29 pass, 0 fail.
- node tools/defense-breakdown-test.cjs — exit 0; 44 pass, 0 fail.
- node tools/fortify-pole-test.cjs — exit 0; 41 pass, 0 fail.
- node tools/militia-garrison-router-siege-test.cjs — exit 0; 8 pass, 0 fail.
- node tools/empire-panel-miasto-obywatele-content-test.cjs — exit 1; 115 pass, 1 fail (preexisting, niezwiązane).
- node tools/koszty-surowcowe-test.cjs — exit 1; 126 pass, 3 fail (preexisting, niezwiązane).
- git diff --check — exit 0.
- python3 json.load(civ-matrix.json): paramDefs=113, defaults=113.
- Programmatic diff origin/main vs worktree civ-matrix.json: wyłącznie obl_* klucze zmienione (30+30+30 wystąpień w diff liniach).
- Programmatic diff origin/main vs hermes/R-CYWILIZACJE-MACIERZ-WIRING-MANPOWER-Q1-20260922 civ-matrix.json: wyłącznie mp_* klucze zmienione; potwierdzone git merge-base --is-ancestor 87ce2daf origin/main = false (branch osobny, nie zintegrowany).

FINAL VERDICT: PASS-WITH-NOTES
Zarzuty blokujące: brak.
Notatki dla integratora: patrz punkt 5 (dwie rundy korekty, szerszy zakres mnożnika w AI-ścieżce niż w realnej bitwie — świadome uproszczenie, nie błąd; dwie niezwiązane preexisting awarie testów).

PRODUCT_ACCEPTANCE: true
NEXT PHASE: workerless integration gate — NIE mergować bez jawnej zgody właściciela. Push/merge/deploy pozostają poza zakresem tej bramki.
PUSH/DEPLOY: NIE WYKONANO
