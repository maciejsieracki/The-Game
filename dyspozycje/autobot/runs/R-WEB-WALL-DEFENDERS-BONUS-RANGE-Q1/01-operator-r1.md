STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WALL-DEFENDERS-BONUS-RANGE-Q1
GOAL: Bonus obwarowania (mur +200%, palisada +100%, Cytadela/Baszta +100%) dla WSZYSTKICH obroncow na murze lub wewnatrz muru (taktyka, Pomin, Auto; gracz i AI); strzelcy-obroncy NA koronie muru/palisady maja zasieg x2 (w gore); bez zmian: wartosci %, R1-R4, Milicja, machiny, wiezyczki.
ZMIANY/COMMIT: baza 1117c6515 (origin/main, zawiera R-WEB-CITY-MILITIA-NO-DEFENDERS-Q1). SHA commitu: patrz `git log` galezi worktree (commit "fix(web): bonus obwarowania ... (R-WEB-WALL-DEFENDERS-BONUS-RANGE-Q1)" + ten raport). Pliki: gra/src/game/city-defense.ts, gra/src/battle/battleScene.ts, gra/tools/wall-defenders-bonus-range-test.cjs (NOWY), gra/tools/city-siege-wall-rules-test.cjs (pinezka starej reguly), runs/R-WEB-WALL-DEFENDERS-BONUS-RANGE-Q1/**. Zero zmian: gra-robocza, WERSJE.md, rust-port, main.ts, combat.ts, siegeWall.ts.

## 1. Stan zastany (HEAD 1117c6515)
- Taktyka: battleScene.ts:8465 `(defender.onWallWalkway ? this.wallDefenseTotalProc : 0)` -- bonus TYLKO korona. Zmierzone (gate-test-PRZED.txt, zywa scena Chromium, ?playtest=oblezenie-duze, wallCol=40): korona 200, za murem (q=43) 0, tuz za murem (q=41) 0, jednostka startujaca za murem (q=42, jazda/machina) 0 -- mur i palisada (100/0/0).
- Rozbieznosc (z kodu, NIE_ZMIERZONO runtime): ta sama linia nadaje bonus KAZDEJ jednostce z flaga onWallWalkway, takze ATAKUJACEMU, ktory wspial sie na korone wieza (battleScene.ts:6057) -- sprzeczne z "bonus nie dotyczy atakujacych".
- Pomin: computeInstantResult 19813/19842 `defOnWall ? total : 0` -- ta sama luka (brak pola do pomiaru PRZED: NIE_ZMIERZONO runtime, odczyt kodu).
- Auto (main.ts:29956 structureDefenseBonusFor + effectiveDefenderM:30757+): bonus liczony dla heksu miasta i mnozony przez CALA Obrone rostera -- juz zgodne z nowa regula (bez zmian; pinezki C1/C2).
- Zasieg: strzelec na koronie mial tymczasowe +1 (dawne battleScene.ts:5987, tylko w _activateUnit); zmierzone ru.range = rangeBase (3 -> 3) w starcie i po aktywacji; katapulta obroncy: range=max(base,6) (battleScene.ts:4592, "6 = 5 + 1 elewacji") -- ma juz wlasny bonus, NIE podwajana.
- Po wylomie: obroncy schodza na q=wallCol+1 z onWallWalkway=false (battleScene.ts:~7618) -- dawniej tracili bonus; teraz zostaje (za murem).

## 2. Poprawka
- city-defense.ts: `defenderInsideFortification` / `fortificationDefenseBonusForUnit` (obronca side='def' i (korona LUB q > siegeWallCol)), `wallCrownShooterRange` (ceil(x*2)), stala WALL_CROWN_RANGE_MULT=2.
- battleScene.ts: `_wallBonusProcFor` uzyte w _singleBlow; computeInstantResult dostaje siegeWallCol i uzywa tej samej funkcji (+ zwraca defBonus, skip() zapisuje lastInstantDefBonus -- odczyt do testu); `_applyTerrainRange` mnozy zasieg x2 dla strzelca-obroncy na koronie (po delcie terenu), wolane tez przy rozstawieniu (podswietlenie UI od startu) i po zejsciu z korony; usuniete dawne +1 (zeby nie dublowac).
- ZALOZENIA do akceptacji: (a) x2 ZASTEPUJE dawne +1 i liczone po delcie terenu: ceil((rangeBase+delta)*2); (b) "wewnatrz" = kolumna sceny za kolumna muru; kafel muru bez korony (wyburzony/brama) = bez bonusu; po wylomie piechota na q=wallCol+1 bonus zachowuje; (c) bonus nie dotyczy atakujacych na koronie (zmiana wzgledem stanu zastanego); (d) civWallDefenseMultiplier (bonusy cywilizacji "w murze") i defenderOnWallWalkway w resolveCombat zostaja tylko dla korony; (e) wiezyczki/katapulty bez zmian; sceny bez opts.siege (cityDefense bez obwarowania) maja bonus 0 jak dotad.

## 3. Testy
- NOWY gra/tools/wall-defenders-bonus-range-test.cjs: PRZED (src HEAD) 22 ok / 13 FAIL (gate-test-PRZED.txt: za murem 0, zasieg 3->3, brak API Pomin); PO 58 ok / 0 fail (gate-test-PO.txt): czesc A prawdziwe funkcje, B prawdziwa scena Chromium (mur i ?fort=palisada: 200/200/0 i 100/100/0, atakujacy 0, strzelec 3->6, wrecz/katapulta bez zmian, parytet taktyka==Pomin), C pinezki Auto; 7 mutacji (4 funkcje + 3 zrodlo sceny) => czerwono.
- tsc --noEmit EXIT=0 (gate-tsc.txt). Regresje: gate-regresje.txt -- 37 testow non-browser + bitwa-obroncy-mur-kolumny (Chromium) zielone PO; city-siege-wall-rules: pinezka starej reguly zaktualizowana (48/2 -> 50/0, uzasadnienie w pliku); mur-paradoks, auto-battle-simultaneous, battle-loot, pr141-owner-route czerwone IDENTYCZNIE PRZED i PO.
- Zrzut PRZED/PO: zrzut-PRZED.jpg / zrzut-PO.jpg (66 KB; scena wyglada tak samo -- zmiana nie jest wizualna, dowodem log zasiegu/bonusu).

## 4. Blokady / NIE_ZMIERZONO
- ~12 testow Chromium wymaga /usr/bin/chromium (brak w sandboxie) lub zewnetrznego distDir -- nie uruchomione (lista w gate-regresje.txt).
- Katapulta na koronie nie wystepuje w presecie playtestu (B11 nieobecne); brak podwojenia wynika z kodu (_isWallCrownShooter wyklucza _isCatapult).
- Zywy przebieg tury z ostrzalem x2 (wybor celu w aktywacji) nie zmierzony end-to-end -- zmierzone ru.range uzywane przez wybor celu/UI.

RUNDY: 1/5
NASTEPNY KROK: Evaluator (niezalezny pomiar, ocena zalozen a-e)
DEPLOY/PUSH: NIE WYKONANO
