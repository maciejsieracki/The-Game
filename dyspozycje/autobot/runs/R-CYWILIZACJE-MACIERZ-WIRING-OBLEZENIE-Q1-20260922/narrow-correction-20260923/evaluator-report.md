STATUS: PASS
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
ROLE: niezależny Evaluator — narrow AI siege correction
GOAL: AI siege defender-strength/tier/stance path consumes defending-city obl_mur_proc and obl_obrona_miasta_proc without changing the later real battle path.

ZMIANY/COMMIT:
- Produktu nie zmieniano. Zapisano wyłącznie artefakty tego Evaluatora.
- HEAD: f52f3b76b4761136a43dc0ab32dde50552a176fe; BASE origin/main: 0caa4dfa31d37337cd74fdbab95ee77da4806d98; branch zgodny z dispatch.
- Union bieżącej allowlisty produktu: gra/data/civ-matrix.json, gra/src/battle/battleScene.ts, gra/src/game/city-defense.ts, gra/src/game/siege.ts, gra/src/game/siegeAi.ts, gra/src/game/siegeMachines.ts, gra/src/main.ts, gra/tools/civ-matrix-oblezenie-wiring-test.cjs. Brak dodatkowych ścieżek produktu; brak commit/push/merge/deploy.

NIEZALEŻNA WERYFIKACJA:
1. Odczytano poprzedni Final Control recovery FAIL, dispatch korekty, raport/evidence Operatora oraz pełny bieżący diff. Raport Operatora nie był traktowany jako dowód.
2. Oba produkcyjne call pathy są kompletne: main.ts:14930-14942 (initial scanAutoSiegesAfterAiTurn) oraz main.ts:14966-14982 (ongoing maybeAiAssaultAfterMachines) budują SiegeCity przez wspólny buildSiegeCityFromRuntime (main.ts:15044-15065), następnie wywołują decideAISiegeStance. Builder przekazuje city.ownerId, builtBuildingIds miasta i civKey właściciela obrony: _menuCivIdByOwner, player.civType dla ownera 0 albo aiOwnerCivMap; brak danych daje null. Nie używa tu civKeyForOwnerId z fallbackiem 'grecy'.
3. siegeAi.ts:103-124 wywołuje cityDefenseBonus i dokładnie raz applyCityBonus(raw, bonus, true). siege.ts:445-475 pobiera oba parametry przez civMatrixParam, a cityWallDefenseBonusPercent jest wspólną funkcją strukturalną. Brak civKey oraz nieznany civKey są neutralne, bo civMatrixParam zwraca defaults 0.
4. Granica podwójnego zastosowania jest zachowana: jedyny caller z includeStructure=true to siegeAi.ts:111; resolveSiegeAttack w siege.ts:723 używa domyślnego false. Przeszukanie całego gra/src znalazło resolveSiegeAttack wyłącznie jako definicję — produkcyjna realna bitwa korzysta z własnej ścieżki main.ts:27562-27636/battleScene.ts, a AI-ocena nie mutuje ani nie przenosi bonusu do późniejszej bitwy.
5. Test korekty rzeczywiście wykonuje siegeAi/estimateDefenderStrength, nie tylko civMatrixParam: test bundluje siegeAi i siege.ts oraz asercje strength/ratio, neutral fallback i one-application formula.

RĘCZNE ASERCJE BEHAWIORALNE:
- Dla muru 200%: neutral = 200%; Grecy = 200×1.2×1.2 = 288%; Zulusi = 200×0.8×1.0 = 160%.
- Z fixture testu (Atak 4, Obrona 4, Pancerz 2, weaponDamage 4, Uderzenie 2, HP 30), estimateUnitCombatStrength po AI-owym mnożniku daje: Grecy 25.9, neutral 21.5, Zulusi 19.5 — więc Grecy > neutral > Zulusi. Bez struktury wynik bazowy to 11.5. Nieznany/nieobecny civ daje 0/0 z civ-matrix i wynik neutralny 21.5.
- Jedno zastosowanie: dla Greków estimateUnitCombatStrength(applyCityBonus(unit, bonus, true)) = 25.9 = estimateDefenderStrength; późniejszy resolveSiegeAttack nie stosuje struktureMult.

TESTY:
- cd gra && ./node_modules/.bin/tsc --noEmit — exit 0.
- node tools/civ-matrix-oblezenie-wiring-test.cjs — exit 0; 83 pass, 0 fail; dokładnie 45 komórek INPUT sprawdzonych.
- node tools/siege-ai-test.cjs — exit 0; 17 pass, 0 fail.
- node tools/logic-test.cjs — exit 0; 213 pass, 0 fail.
- node tools/city-defense-terrain-gate-test.cjs — exit 0; 34 pass, 0 fail.
- node tools/mur-paradoks-test.cjs — exit 0; 29 pass, 0 fail.
- Dodatkowe regresje: defense-breakdown 44/0; fortify-pole 41/0.
- git diff --check — exit 0.
- Znane niezwiązane baseline failures zachowane: empire-panel-miasto-obywatele-content-test 115/1 oraz koszty-surowcowe-test 126/3; wcześniejszy Evaluator/Final Control potwierdził identyczne wyniki na czystym origin/main.

ZARZUTY: []
PRODUCT_ACCEPTANCE: true
WERDYKT: PASS — brak blokującego zarzutu.

NASTĘPNY KROK: nowy niezależny Final Control dla poprawionego tematu; później workerless integration gate. Push/merge/deploy pozostają poza zakresem i wymagają osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
